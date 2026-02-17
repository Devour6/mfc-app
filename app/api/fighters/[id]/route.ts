import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { updateFighterSchema } from '@/lib/validations'

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

// PATCH /api/fighters/:id — Update fighter stats (after fight or training)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const parsed = updateFighterSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const existing = await prisma.fighter.findUnique({ where: { id } })
    if (!existing) return notFound('Fighter')

    const fighter = await prisma.fighter.update({
      where: { id },
      data: parsed.data,
    })

    return jsonResponse(fighter)
  } catch (error) {
    return serverError(error)
  }
}
