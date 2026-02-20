import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { cancelTrainingSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'
import { distributeStatGains } from '../route'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/training/:id — Get training session details, auto-complete if time elapsed
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAnyRole()
    const { id } = await params

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        fighter: { select: { id: true, name: true, emoji: true, class: true, strength: true, speed: true, defense: true, stamina: true, fightIQ: true, aggression: true } },
        user: { select: { id: true, name: true, username: true } },
      },
    })

    if (!training) return notFound('Training session')

    // Auto-complete: if ACTIVE and time has elapsed, apply gains
    if (training.status === 'ACTIVE') {
      const elapsed = (Date.now() - new Date(training.startedAt).getTime()) / 1000
      const totalSeconds = training.durationMinutes * 60

      if (elapsed >= totalSeconds) {
        const gainPool = Math.floor(training.durationMinutes / 15)
        const gains = distributeStatGains(gainPool)

        const completed = await prisma.$transaction(async (tx) => {
          const updated = await tx.training.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              ...gains,
            },
            include: {
              fighter: { select: { id: true, name: true, emoji: true, class: true, strength: true, speed: true, defense: true, stamina: true, fightIQ: true, aggression: true } },
              user: { select: { id: true, name: true, username: true } },
            },
          })

          // Apply stat gains to fighter
          const fighter = training.fighter!
          await tx.fighter.update({
            where: { id: training.fighterId },
            data: {
              strength: Math.min(100, fighter.strength + gains.strengthGain),
              speed: Math.min(100, fighter.speed + gains.speedGain),
              defense: Math.min(100, fighter.defense + gains.defenseGain),
              stamina: Math.min(100, fighter.stamina + gains.staminaGain),
              fightIQ: Math.min(100, fighter.fightIQ + gains.fightIQGain),
              aggression: Math.min(100, fighter.aggression + gains.aggressionGain),
              totalTrainingHours: { increment: training.durationMinutes / 60 },
              totalTrainingSessions: { increment: 1 },
            },
          })

          return updated
        })

        return jsonResponse({ ...completed, progress: 1, timeRemainingSeconds: 0, isComplete: true })
      }

      // Still in progress
      const progress = Math.min(1, elapsed / totalSeconds)
      const timeRemainingSeconds = Math.max(0, Math.round(totalSeconds - elapsed))
      return jsonResponse({ ...training, progress, timeRemainingSeconds, isComplete: false })
    }

    return jsonResponse({ ...training, progress: 1, timeRemainingSeconds: 0, isComplete: training.status === 'COMPLETED' })
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/training/:id — Cancel an active training session
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAnyRole()
    const { id } = await params

    const body = await request.json()
    const parsed = cancelTrainingSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const training = await prisma.training.findUnique({ where: { id } })
    if (!training) return notFound('Training session')
    if (training.userId !== dbUser.id) {
      return errorResponse('You can only cancel your own training sessions')
    }
    if (training.status !== 'ACTIVE') {
      return errorResponse(`Cannot cancel a ${training.status.toLowerCase()} training session`)
    }

    const cancelled = await prisma.training.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    })

    return jsonResponse(cancelled)
  } catch (error) {
    return serverError(error)
  }
}
