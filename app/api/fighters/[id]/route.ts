import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { updateFighterSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/fighters/:id — Get single fighter with stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const fighter = await prisma.fighter.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, username: true } },
        trainings: { orderBy: { createdAt: 'desc' }, take: 10 },
        fightResults: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!fighter) return notFound('Fighter')
    return jsonResponse(fighter)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/fighters/:id — Update fighter stats (auth required, must own fighter)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAnyRole()

    const { id } = await params
    const body = await request.json()

    const parsed = updateFighterSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const existing = await prisma.fighter.findUnique({ where: { id } })
    if (!existing) return notFound('Fighter')
    if (existing.ownerId !== dbUser.id) {
      return errorResponse('You can only update your own fighters', 403)
    }

    const fighter = await prisma.fighter.update({
      where: { id },
      data: parsed.data,
    })

    return jsonResponse(fighter)
  } catch (error) {
    return serverError(error)
  }
}
