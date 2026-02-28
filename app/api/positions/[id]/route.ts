import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, serverError } from '@/lib/api-utils'
import { requireAnyRole } from '@/lib/role-guard'
import { CONTRACT_PAYOUT_CENTS } from '@/lib/matching-engine'

type RouteParams = { params: Promise<{ id: string }> }

/** Compute unrealized P&L for an unsettled position using current best price. */
function computeUnrealizedPnl(
  side: string,
  quantity: number,
  avgCostBasis: number,
  currentPrice: number
): number {
  if (side === 'YES') {
    return (currentPrice - avgCostBasis) * quantity
  }
  // NO side: profit when price drops (complement pricing)
  return ((CONTRACT_PAYOUT_CENTS - currentPrice) - avgCostBasis) * quantity
}

// GET /api/positions/:id — Get position details with P&L
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAnyRole()
    const { id } = await params

    const position = await prisma.position.findUnique({
      where: { id },
    })

    if (!position) return notFound('Position')
    if (position.userId !== dbUser.id) return notFound('Position')

    // For settled positions, P&L is already stored
    if (position.settled) {
      return jsonResponse({
        ...position,
        unrealizedPnl: 0,
      })
    }

    // For unsettled positions, estimate unrealized P&L from most recent trade
    const latestTrade = await prisma.trade.findFirst({
      where: { fightId: position.fightId },
      orderBy: { createdAt: 'desc' },
    })

    const currentPrice = latestTrade?.price ?? position.avgCostBasis
    const unrealizedPnl = computeUnrealizedPnl(
      position.side,
      position.quantity,
      position.avgCostBasis,
      currentPrice
    )

    return jsonResponse({
      ...position,
      unrealizedPnl,
    })
  } catch (error) {
    return serverError(error)
  }
}
