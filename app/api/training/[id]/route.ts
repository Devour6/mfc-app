import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, serverError } from '@/lib/api-utils'
import { requireAnyRole } from '@/lib/role-guard'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/training/:id — Get training session details (both roles)
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
    return jsonResponse(training)
  } catch (error) {
    return serverError(error)
  }
}
