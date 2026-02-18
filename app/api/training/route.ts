import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { createTrainingSchema, trainingQuerySchema } from '@/lib/validations'
import { requireAgent, requireAnyRole } from '@/lib/role-guard'

// GET /api/training?fighterId=...&limit=... — List training sessions (both roles)
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = trainingQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fighterId, limit } = parsed.data
    const where: Record<string, unknown> = { userId: dbUser.id }
    if (fighterId) where.fighterId = fighterId

    const trainings = await prisma.training.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        fighter: { select: { id: true, name: true, emoji: true, class: true } },
      },
    })

    return jsonResponse(trainings)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/training — Create a training session (agent only)
export async function POST(request: NextRequest) {
  try {
    const dbUser = await requireAgent()

    const body = await request.json()
    const parsed = createTrainingSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { fighterId, hours } = parsed.data
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

    const cost = fighter.trainingCost * hours

    // Calculate random stat gains based on hours trained
    const gainPool = Math.floor(hours * 2) // 2 stat points per hour
    const gains = distributeStatGains(gainPool)

    // Transaction: deduct credits, create training, update fighter stats
    const training = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      })
      if (!user) throw new Error('User not found')
      if (user.credits < cost) throw new Error('Insufficient credits')

      // Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      })

      // Create training record
      const session = await tx.training.create({
        data: {
          fighterId,
          userId,
          hours,
          cost,
          ...gains,
        },
      })

      // Apply stat gains to fighter (cap at 100)
      await tx.fighter.update({
        where: { id: fighterId },
        data: {
          strength: Math.min(100, fighter.strength + gains.strengthGain),
          speed: Math.min(100, fighter.speed + gains.speedGain),
          defense: Math.min(100, fighter.defense + gains.defenseGain),
          stamina: Math.min(100, fighter.stamina + gains.staminaGain),
          fightIQ: Math.min(100, fighter.fightIQ + gains.fightIQGain),
          aggression: Math.min(100, fighter.aggression + gains.aggressionGain),
          totalTrainingHours: { increment: hours },
          totalTrainingSessions: { increment: 1 },
        },
      })

      return session
    })

    return jsonResponse(training, 201)
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

// Distribute stat gains randomly across the 6 stats
function distributeStatGains(pool: number) {
  const stats = ['strengthGain', 'speedGain', 'defenseGain', 'staminaGain', 'fightIQGain', 'aggressionGain'] as const
  const gains: Record<string, number> = {}
  for (const stat of stats) gains[stat] = 0

  for (let i = 0; i < pool; i++) {
    const stat = stats[Math.floor(Math.random() * stats.length)]
    gains[stat]++
  }

  return gains as Record<typeof stats[number], number>
}
