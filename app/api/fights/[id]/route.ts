import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { submitFightResultSchema, updateFightStatusSchema, isLegalStatusTransition } from '@/lib/validations'
import { requireAgent, requireAnyRole } from '@/lib/role-guard'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/fights/:id — Get fight details with result
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const fight = await prisma.fight.findUnique({
      where: { id },
      include: {
        fighter1: { select: { id: true, name: true, emoji: true, elo: true, class: true, wins: true, losses: true, draws: true } },
        fighter2: { select: { id: true, name: true, emoji: true, elo: true, class: true, wins: true, losses: true, draws: true } },
        result: { select: { id: true, method: true, round: true, time: true, winnerId: true, fighter1EloChange: true, fighter2EloChange: true } },
        bets: { select: { id: true, side: true, amount: true, status: true } },
      },
    })

    if (!fight) return notFound('Fight')
    return jsonResponse(fight)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/fights/:id — Submit fight result (agent only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAgent()
    const { id } = await params
    const body = await request.json()

    const parsed = submitFightResultSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { method, round, time, winnerId, fighter1Stats, fighter2Stats, fighter1EloChange, fighter2EloChange } = parsed.data

    const fight = await prisma.fight.findUnique({ where: { id } })
    if (!fight) return notFound('Fight')
    if (fight.status === 'COMPLETED') return errorResponse('Fight already completed')

    // Validate round is within maxRounds
    if (round !== undefined && round > fight.maxRounds) {
      return errorResponse(`Round must be between 1 and ${fight.maxRounds}`)
    }

    // Validate winnerId is one of the fighters in this fight
    if (winnerId && winnerId !== fight.fighter1Id && winnerId !== fight.fighter2Id) {
      return errorResponse('Winner must be one of the fighters in this fight')
    }

    // Use transaction: create result + update fight status + update fighter records
    const result = await prisma.$transaction(async (tx: any) => {
      const fightResult = await tx.fightResult.create({
        data: {
          fightId: id,
          method,
          round,
          time,
          winnerId,
          fighter1Stats: (fighter1Stats ?? {}) as any,
          fighter2Stats: (fighter2Stats ?? {}) as any,
          fighter1EloChange: fighter1EloChange ?? 0,
          fighter2EloChange: fighter2EloChange ?? 0,
          userId: dbUser.id,
        },
      })

      await tx.fight.update({
        where: { id },
        data: { status: 'COMPLETED', endedAt: new Date() },
      })

      // Update fighter ELO and records
      if (winnerId) {
        const loserId = winnerId === fight.fighter1Id ? fight.fighter2Id : fight.fighter1Id
        await tx.fighter.update({
          where: { id: winnerId },
          data: {
            wins: { increment: 1 },
            elo: { increment: Math.abs(fighter1EloChange ?? 16) },
            winStreak: { increment: 1 },
            lossStreak: 0,
            lastFightAt: new Date(),
          },
        })
        await tx.fighter.update({
          where: { id: loserId },
          data: {
            losses: { increment: 1 },
            elo: { increment: -(Math.abs(fighter2EloChange ?? 16)) },
            lossStreak: { increment: 1 },
            winStreak: 0,
            lastFightAt: new Date(),
          },
        })
      }

      return fightResult
    })

    return jsonResponse(result, 201)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/fights/:id — Update fight status (both roles)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAnyRole()
    const { id } = await params
    const body = await request.json()

    const parsed = updateFightStatusSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { status, fightData } = parsed.data

    const existing = await prisma.fight.findUnique({ where: { id } })
    if (!existing) return notFound('Fight')

    // Enforce legal status transitions
    if (!isLegalStatusTransition(existing.status, status)) {
      return errorResponse(`Cannot transition from ${existing.status} to ${status}`)
    }

    const fight = await prisma.fight.update({
      where: { id },
      data: {
        status,
        ...(status === 'LIVE' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { endedAt: new Date() }),
        ...(fightData !== undefined && { fightData: (fightData ?? null) as any }),
      },
    })

    return jsonResponse(fight)
  } catch (error) {
    return serverError(error)
  }
}
