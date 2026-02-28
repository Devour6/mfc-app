import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, errorResponse, notFound, serverError } from '@/lib/api-utils'
import { createOrderSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'
import { matchOrder, MatchingError } from '@/lib/matching-engine'
import { checkPositionLimit, PositionLimitError, DMM_SYSTEM_ID } from '@/lib/position-manager'

/** Trading states that accept new orders. */
const TRADEABLE_STATES = new Set(['PREFIGHT', 'OPEN'])

/** Upper tiers charge 0 per-trade (settlement-only fees). */
const UPPER_TIERS = new Set(['REGIONAL', 'GRAND', 'INVITATIONAL'])

/** Compute fee rate in basis points for a new order. */
function computeFeeRate(fightTier: string, league: string, userId: string): number {
  if (userId === DMM_SYSTEM_ID) return 0
  if (league === 'AGENT') return 50     // 0.5% flat
  if (UPPER_TIERS.has(fightTier)) return 0  // 5% profit at settlement, 0 per-trade
  return 200                             // Local: 2% flat
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

    // Credit check: user.credits >= price * quantity + estimated fee
    const feeRate = computeFeeRate(fight.tier, fight.league, dbUser.id)
    const estimatedCost = orderType === 'MARKET' ? quantity * 99 : price * quantity
    const estimatedFee = Math.floor(estimatedCost * feeRate / 10000)
    const totalEstimated = estimatedCost + estimatedFee

    if (dbUser.credits < totalEstimated) {
      return errorResponse(
        `Insufficient credits: need ${totalEstimated}¢, have ${dbUser.credits}¢`,
        409
      )
    }

    // Position limit check
    const existingPosition = await prisma.position.findUnique({
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
      agentBankroll: dbUser.isAgent ? dbUser.credits : undefined,
    })

    // Execute matching inside a serializable transaction
    const result = await prisma.$transaction(
      async (tx: any) => {
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
    if (error instanceof PositionLimitError) {
      return errorResponse(error.message, 409)
    }
    if (error instanceof MatchingError) {
      return errorResponse(error.message, 400)
    }
    return serverError(error)
  }
}
