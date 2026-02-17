import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { createBetSchema, betQuerySchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-guard'
import { ensureUser } from '@/lib/user-sync'

// GET /api/bets?fightId=...&status=...&limit=... — List authenticated user's bets
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const dbUser = await ensureUser(session)

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = betQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, status, limit } = parsed.data
    const where: Record<string, unknown> = { userId: dbUser.id }
    if (fightId) where.fightId = fightId
    if (status) where.status = status

    const bets = await prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        fight: {
          select: {
            id: true,
            status: true,
            fighter1: { select: { id: true, name: true, emoji: true } },
            fighter2: { select: { id: true, name: true, emoji: true } },
          },
        },
        fighter: { select: { id: true, name: true, emoji: true } },
      },
    })

    return jsonResponse(bets)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/bets — Place a bet (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const dbUser = await ensureUser(session)

    const body = await request.json()
    const parsed = createBetSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, fighterId, side, amount, odds } = parsed.data
    const userId = dbUser.id

    // Verify fight exists and is in a bettable state
    const fight = await prisma.fight.findUnique({ where: { id: fightId } })
    if (!fight) return notFound('Fight')
    if (fight.status !== 'SCHEDULED' && fight.status !== 'LIVE') {
      return errorResponse('Bets can only be placed on scheduled or live fights')
    }

    // Verify fighter belongs to this fight (if specified)
    if (fighterId && fighterId !== fight.fighter1Id && fighterId !== fight.fighter2Id) {
      return errorResponse('Fighter is not in this fight')
    }

    // Deduct credits via transaction
    const bet = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      })
      if (!user) throw new Error('User not found')
      if (user.credits < amount) throw new Error('Insufficient credits')

      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
      })

      return tx.bet.create({
        data: { userId, fightId, fighterId, side, amount, odds },
      })
    })

    return jsonResponse(bet, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return notFound('User')
    }
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return errorResponse('Insufficient credits')
    }
    return serverError(error)
  }
}
