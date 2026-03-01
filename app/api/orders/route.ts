import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, errorResponse, notFound, serverError } from '@/lib/api-utils'
import { createOrderSchema, orderQuerySchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'
import { matchOrder, MatchingError } from '@/lib/matching-engine'
import { checkPositionLimit, PositionLimitError } from '@/lib/position-manager'
import { computeFeeRate, DMM_SYSTEM_ID } from '@/lib/fee-engine'

/**
 * Trading states that accept new orders via continuous matching.
 * AUCTION is intentionally excluded — it uses a separate call auction flow
 * (clearing price batch execution) that will be implemented in Sprint 2.
 */
const TRADEABLE_STATES = new Set(['PREFIGHT', 'OPEN'])

/** Thrown inside the transaction when the user can't cover the order. */
class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InsufficientCreditsError'
  }
}

// GET /api/orders — List user's orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = orderQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, status, limit } = parsed.data
    const where: Record<string, unknown> = { userId: dbUser.id }
    if (fightId) where.fightId = fightId
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return jsonResponse(orders)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/orders — Place an order
export async function POST(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, side, type: orderType, quantity } = parsed.data
    const price = orderType === 'MARKET' ? 0 : parsed.data.price!

    // Validate fight exists and is tradeable
    const fight = await prisma.fight.findUnique({ where: { id: fightId } })
    if (!fight) return notFound('Fight')

    if (!TRADEABLE_STATES.has(fight.tradingState)) {
      return errorResponse(
        `Trading is not active (current state: ${fight.tradingState})`,
        400
      )
    }

    // Validate league match: human user → HUMAN fight, agent → AGENT fight
    const expectedLeague = dbUser.isAgent ? 'AGENT' : 'HUMAN'
    if (fight.league !== expectedLeague) {
      return errorResponse(
        `League mismatch: ${expectedLeague} users cannot trade on ${fight.league} fights`,
        403
      )
    }

    // Fee rate is stable — derived from fight tier (set at creation), not user state
    const feeRate = computeFeeRate(fight.tier, fight.league, dbUser.id === DMM_SYSTEM_ID)

    // Credit check + position limit check + matching all inside one serializable
    // transaction to prevent TOCTOU races from concurrent orders.
    const result = await prisma.$transaction(
      async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        // Re-read credit balance inside transaction (serializable snapshot)
        const freshUser = await tx.user.findUnique({
          where: { id: dbUser.id },
          select: { credits: true },
        })
        if (!freshUser) throw new MatchingError('User not found')

        const estimatedCost = orderType === 'MARKET' ? quantity * 99 : price * quantity
        const estimatedFee = Math.floor(estimatedCost * feeRate / 10000)
        const totalEstimated = estimatedCost + estimatedFee

        if (freshUser.credits < totalEstimated) {
          throw new InsufficientCreditsError(
            `Insufficient credits: need ${totalEstimated}¢, have ${freshUser.credits}¢`
          )
        }

        // Re-read position inside transaction (serializable snapshot)
        const existingPosition = await tx.position.findUnique({
          where: { userId_fightId: { userId: dbUser.id, fightId } },
        })

        checkPositionLimit({
          existingPosition,
          orderSide: side,
          orderQuantity: quantity,
          orderPrice: orderType === 'MARKET' ? 99 : price,
          fightTier: fight.tier,
          league: fight.league,
          userId: dbUser.id,
          agentBankroll: dbUser.isAgent ? freshUser.credits : undefined,
        })

        return matchOrder(tx, {
          userId: dbUser.id,
          fightId,
          league: fight.league,
          side,
          type: orderType,
          price,
          quantity,
          feeRate,
        })
      },
      { isolationLevel: 'Serializable' }
    )

    return jsonResponse(result, 201)
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return errorResponse(error.message, 409)
    }
    if (error instanceof PositionLimitError) {
      return errorResponse(error.message, 409)
    }
    if (error instanceof MatchingError) {
      return errorResponse(error.message, 400)
    }
    return serverError(error)
  }
}
