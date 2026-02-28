import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { publicTradeQuerySchema } from '@/lib/validations'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/fights/:id/trades — Public recent trade tape */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = publicTradeQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { limit } = parsed.data

    const fight = await prisma.fight.findUnique({ where: { id }, select: { id: true } })
    if (!fight) return notFound('Fight')

    const trades = await prisma.trade.findMany({
      where: { fightId: id },
      select: {
        id: true,
        price: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return jsonResponse(trades)
  } catch (error) {
    return serverError(error)
  }
}
