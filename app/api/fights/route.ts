import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, validationError, serverError } from '@/lib/api-utils'
import { createFightSchema, fightQuerySchema } from '@/lib/validations'
import { requireAgent } from '@/lib/role-guard'

// GET /api/fights?status=...&limit=... — List fights
export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = fightQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { status, limit } = parsed.data
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const fights = await prisma.fight.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        fighter1: { select: { id: true, name: true, emoji: true, elo: true, class: true } },
        fighter2: { select: { id: true, name: true, emoji: true, elo: true, class: true } },
        result: { select: { method: true, round: true, winnerId: true } },
      },
    })

    return jsonResponse(fights)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/fights — Create a new fight (agent only)
export async function POST(request: NextRequest) {
  try {
    const dbUser = await requireAgent()
    const body = await request.json()
    const parsed = createFightSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { fighter1Id, fighter2Id, scheduledAt, maxRounds, venue, title } = parsed.data

    // Verify both fighters exist and are active
    const [f1, f2] = await Promise.all([
      prisma.fighter.findUnique({ where: { id: fighter1Id } }),
      prisma.fighter.findUnique({ where: { id: fighter2Id } }),
    ])

    if (!f1 || !f2) return errorResponse('One or both fighters not found')
    if (!f1.isActive || !f2.isActive) return errorResponse('Both fighters must be active')

    const fight = await prisma.fight.create({
      data: {
        fighter1Id,
        fighter2Id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        maxRounds,
        venue,
        title,
      },
      include: {
        fighter1: { select: { id: true, name: true, emoji: true, elo: true } },
        fighter2: { select: { id: true, name: true, emoji: true, elo: true } },
      },
    })

    return jsonResponse(fight, 201)
  } catch (error) {
    return serverError(error)
  }
}
