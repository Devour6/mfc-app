import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, serverError } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/fighters/:id/skins — Get equipped skins for a fighter (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verify fighter exists
    const fighter = await prisma.fighter.findUnique({
      where: { id },
      select: { id: true, name: true },
    })
    if (!fighter) return notFound('Fighter')

    const skins = await prisma.skinPurchase.findMany({
      where: { fighterId: id, equipped: true },
      include: {
        skin: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse(skins)
  } catch (error) {
    return serverError(error)
  }
}
