import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { createTrainingSchema, trainingQuerySchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// GET /api/training?fighterId=...&status=...&limit=... — List training sessions
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = trainingQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fighterId, status, limit } = parsed.data
    const where: Record<string, unknown> = { userId: dbUser.id }
    if (fighterId) where.fighterId = fighterId
    if (status) where.status = status

    const trainings = await prisma.training.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        fighter: { select: { id: true, name: true, emoji: true, class: true } },
      },
    })

    // Compute progress for ACTIVE sessions
    const now = Date.now()
    const enriched = trainings.map((t) => {
      if (t.status === 'ACTIVE') {
        const elapsed = (now - new Date(t.startedAt).getTime()) / 1000
        const totalSeconds = t.durationMinutes * 60
        return {
          ...t,
          progress: Math.min(1, elapsed / totalSeconds),
          timeRemainingSeconds: Math.max(0, Math.round(totalSeconds - elapsed)),
          isComplete: elapsed >= totalSeconds,
        }
      }
      return { ...t, progress: 1, timeRemainingSeconds: 0, isComplete: t.status === 'COMPLETED' }
    })

    return jsonResponse(enriched)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/training — Start a time-gated training session (no credits)
export async function POST(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const body = await request.json()
    const parsed = createTrainingSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { fighterId, durationMinutes } = parsed.data
    const userId = dbUser.id

    // Verify fighter exists and belongs to user
    const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } })
    if (!fighter) return notFound('Fighter')
    if (fighter.ownerId !== userId) {
      return errorResponse('You can only train your own fighters')
    }
    if (!fighter.isActive) {
      return errorResponse('Cannot train an inactive fighter')
    }

    // Check fighter doesn't already have an ACTIVE session
    const activeSession = await prisma.training.findFirst({
      where: { fighterId, status: 'ACTIVE' },
    })
    if (activeSession) {
      return errorResponse('Fighter already has an active training session')
    }

    // Check daily session limit (2 per user per day)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todaySessions = await prisma.training.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    })
    if (todaySessions >= 2) {
      return errorResponse('Daily training limit reached (2 sessions per day)')
    }

    // Create the session — no credit deduction, gains applied on completion
    const training = await prisma.training.create({
      data: {
        fighterId,
        userId,
        durationMinutes,
        status: 'ACTIVE',
      },
    })

    return jsonResponse(training, 201)
  } catch (error) {
    return serverError(error)
  }
}

// Distribute stat gains randomly across the 6 stats
export function distributeStatGains(pool: number) {
  const stats = ['strengthGain', 'speedGain', 'defenseGain', 'staminaGain', 'fightIQGain', 'aggressionGain'] as const
  const gains: Record<string, number> = {}
  for (const stat of stats) gains[stat] = 0

  for (let i = 0; i < pool; i++) {
    const stat = stats[Math.floor(Math.random() * stats.length)]
    gains[stat]++
  }

  return gains as Record<typeof stats[number], number>
}
