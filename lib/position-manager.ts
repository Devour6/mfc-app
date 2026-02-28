import type { PrismaClient, Position } from '@prisma/client'

// ── Shared Constants ──────────────────────────────────────────────────────────

/** Binary contract payout ceiling in cents: YES price + NO price always equals this. */
export const CONTRACT_PAYOUT_CENTS = 100

/** Well-known user ID for the Designated Market Maker system account. */
export const DMM_SYSTEM_ID = 'DMM_SYSTEM'

// ── Position Limit Constants ──────────────────────────────────────────────────

/** Position limit in cents per fight tier (Human League). */
export const POSITION_LIMIT_CENTS: Record<string, number> = {
  LOCAL: 10_000,         // $100
  REGIONAL: 25_000,      // $250
  GRAND: 50_000,         // $500
  INVITATIONAL: 100_000, // $1,000
}

/** Hard cap for Agent League position limits in cents ($100). */
export const AGENT_POSITION_CAP_CENTS = 10_000

/** Fraction of agent bankroll used for position limit calculation. */
export const AGENT_BANKROLL_FRACTION = 0.05

// ── Types ─────────────────────────────────────────────────────────────────────

/** Minimal Prisma transaction client needed for position operations. */
export interface PositionTxClient {
  position: PrismaClient['position']
}

export interface PositionUpdateParams {
  userId: string
  fightId: string
  league: 'HUMAN' | 'AGENT'
  side: 'YES' | 'NO'
  fillQty: number
  /** Cost per contract on the fill's side. */
  fillPrice: number
}

// ── Errors ────────────────────────────────────────────────────────────────────

/** Thrown when an order would exceed the fight tier's position limit. */
export class PositionLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PositionLimitError'
  }
}

// ── Position Limit Functions ──────────────────────────────────────────────────

/**
 * Get the position limit in cents for a given fight tier and league.
 * - Human: per-tier fixed limits from POSITION_LIMIT_CENTS.
 * - Agent: min(bankroll x 5%, $100 cap).
 */
export function getPositionLimit(
  fightTier: string,
  league: 'HUMAN' | 'AGENT',
  agentBankroll?: number
): number {
  if (league === 'AGENT') {
    const bankroll = agentBankroll ?? 0
    return Math.min(Math.floor(bankroll * AGENT_BANKROLL_FRACTION), AGENT_POSITION_CAP_CENTS)
  }
  return POSITION_LIMIT_CENTS[fightTier] ?? POSITION_LIMIT_CENTS.LOCAL
}

/**
 * Validate that a proposed order won't exceed position limits.
 * Call BEFORE matching. Uses the order's limit price as worst-case cost.
 *
 * DMM orders are exempt (unlimited positions).
 * Opposite-side orders that only reduce the position are always allowed.
 */
export function checkPositionLimit(params: {
  existingPosition: Position | null
  orderSide: 'YES' | 'NO'
  orderQuantity: number
  orderPrice: number
  fightTier: string
  league: 'HUMAN' | 'AGENT'
  userId: string
  agentBankroll?: number
}): void {
  if (params.userId === DMM_SYSTEM_ID) return

  const limit = getPositionLimit(params.fightTier, params.league, params.agentBankroll)
  const existing = params.existingPosition

  let projectedCost: number

  if (!existing || existing.quantity === 0) {
    // New position: total cost = price x quantity
    projectedCost = params.orderPrice * params.orderQuantity
  } else if (existing.side === params.orderSide) {
    // Same side: combined cost of existing + new
    projectedCost = existing.avgCostBasis * existing.quantity + params.orderPrice * params.orderQuantity
  } else {
    // Opposite side: netting reduces the existing position
    const flipQty = params.orderQuantity - existing.quantity
    if (flipQty <= 0) {
      // Purely reducing — always allowed
      return
    }
    // Side flip: only the flipped portion counts toward the limit
    projectedCost = params.orderPrice * flipQty
  }

  if (projectedCost > limit) {
    throw new PositionLimitError(
      `Position limit exceeded: ${projectedCost}¢ > ${limit}¢ (${params.fightTier})`
    )
  }
}

// ── Position P&L ──────────────────────────────────────────────────────────────

/**
 * Realized P&L when exiting a position by buying the opposite side.
 *
 * If you hold side A at avgCost and buy side B at fillPrice to close:
 *   PnL = exitQty x ((100 - avgCost) - fillPrice)
 *
 * Positive when the closing trade is cheaper than the implied complement.
 */
export function computeExitPnl(exitQty: number, fillPrice: number, existingAvgCost: number): number {
  return exitQty * ((CONTRACT_PAYOUT_CENTS - existingAvgCost) - fillPrice)
}

// ── Position Upsert ───────────────────────────────────────────────────────────

/**
 * Upsert a position after a fill:
 * - New position: create with fill price as avgCostBasis.
 * - Same side: weighted average cost, increased quantity.
 * - Opposite side, qty <= existing: reduce existing, realize PnL.
 * - Opposite side, qty > existing: side flip, realize PnL on closed portion.
 */
export async function upsertPosition(
  tx: PositionTxClient,
  p: PositionUpdateParams
): Promise<Position> {
  const existing = await tx.position.findUnique({
    where: { userId_fightId: { userId: p.userId, fightId: p.fightId } },
  })

  if (!existing) {
    return tx.position.create({
      data: {
        userId: p.userId,
        fightId: p.fightId,
        league: p.league,
        side: p.side,
        quantity: p.fillQty,
        avgCostBasis: p.fillPrice,
        realizedPnl: 0,
      },
    })
  }

  if (existing.side === p.side) {
    // Same side: increase quantity, recalculate weighted average cost
    const newQty = existing.quantity + p.fillQty
    const newAvgCost = Math.round(
      (existing.quantity * existing.avgCostBasis + p.fillQty * p.fillPrice) / newQty
    )
    return tx.position.update({
      where: { id: existing.id },
      data: { quantity: newQty, avgCostBasis: newAvgCost },
    })
  }

  // Opposite side: auto-netting
  if (p.fillQty <= existing.quantity) {
    // Partial or full close — reduce existing position
    const exitPnl = computeExitPnl(p.fillQty, p.fillPrice, existing.avgCostBasis)
    const newQty = existing.quantity - p.fillQty
    return tx.position.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        realizedPnl: existing.realizedPnl + exitPnl,
      },
    })
  }

  // Side flip: close entire existing position, open new position on opposite side
  const closedQty = existing.quantity
  const exitPnl = computeExitPnl(closedQty, p.fillPrice, existing.avgCostBasis)
  const flipQty = p.fillQty - closedQty
  return tx.position.update({
    where: { id: existing.id },
    data: {
      side: p.side,
      quantity: flipQty,
      avgCostBasis: p.fillPrice,
      realizedPnl: existing.realizedPnl + exitPnl,
    },
  })
}

/** Get existing position or create an empty one (for unfilled orders). */
export async function getOrCreatePosition(
  tx: PositionTxClient,
  userId: string,
  fightId: string,
  league: 'HUMAN' | 'AGENT',
  side: 'YES' | 'NO'
): Promise<Position> {
  const existing = await tx.position.findUnique({
    where: { userId_fightId: { userId, fightId } },
  })
  if (existing) return existing
  return tx.position.create({
    data: { userId, fightId, league, side, quantity: 0, avgCostBasis: 0, realizedPnl: 0 },
  })
}
