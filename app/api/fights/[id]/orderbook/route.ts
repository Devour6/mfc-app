import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, serverError } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

/** Aggregated price levels for one side of the book */
interface PriceLevel {
  price: number
  quantity: number
}

/** GET /api/fights/:id/orderbook — Public aggregated order book depth */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const fight = await prisma.fight.findUnique({ where: { id }, select: { id: true } })
    if (!fight) return notFound('Fight')

    const orders = await prisma.order.findMany({
      where: {
        fightId: id,
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
      },
      select: {
        side: true,
        price: true,
        remainingQty: true,
      },
    })

    const yesDepth = new Map<number, number>()
    const noDepth = new Map<number, number>()

    for (const order of orders) {
      const map = order.side === 'YES' ? yesDepth : noDepth
      map.set(order.price, (map.get(order.price) ?? 0) + order.remainingQty)
    }

    const toSortedLevels = (map: Map<number, number>): PriceLevel[] =>
      Array.from(map.entries())
        .map(([price, quantity]) => ({ price, quantity }))
        .sort((a, b) => b.price - a.price)

    return jsonResponse({
      yes: toSortedLevels(yesDepth),
      no: toSortedLevels(noDepth),
    })
  } catch (error) {
    return serverError(error)
  }
}
