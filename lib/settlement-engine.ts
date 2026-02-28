import type { PrismaClient } from '@prisma/client'
import { CONTRACT_PAYOUT_CENTS, DMM_SYSTEM_ID } from './position-manager'

// Re-export for convenience (consumers may need these)
export { CONTRACT_PAYOUT_CENTS, DMM_SYSTEM_ID } from './position-manager'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Prisma interactive transaction client for settlement operations. */
export interface SettlementTxClient {
  fight: PrismaClient['fight']
  order: PrismaClient['order']
  position: PrismaClient['position']
  user: PrismaClient['user']
  creditTransaction: PrismaClient['creditTransaction']
}

/** Settlement outcome determines how positions are resolved. */
export type SettlementOutcome =
  | { type: 'winner'; side: 'YES' | 'NO' }
  | { type: 'draw' }
  | { type: 'cancelled' }

/** Input parameters for settling a fight. */
export interface SettlementInput {
  fightId: string
  outcome: SettlementOutcome
  fightTier: string
  league: 'HUMAN' | 'AGENT'
}

/** Result summary from settlement. */
export interface SettlementResult {
  settledPositions: number
  cancelledOrders: number
  totalPayouts: number
  totalFees: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Fight tiers that charge 5% settlement fee on profit (Upper tiers). */
const UPPER_TIERS: ReadonlySet<string> = new Set(['REGIONAL', 'GRAND', 'INVITATIONAL'])

/** Upper tier settlement fee rate: 5% on profit. */
export const UPPER_TIER_FEE_RATE = 0.05

// ── Settlement Engine ─────────────────────────────────────────────────────────

/**
 * Settle all positions for a completed fight.
 *
 * Must be called within a Prisma $transaction with Serializable isolation.
 *
 * Steps:
 * 1. Set fight.tradingState → SETTLEMENT
 * 2. Cancel all open/partially-filled orders
 * 3. Settle each position (pay winners, record losses, refund draws/cancellations)
 * 4. Set fight.tradingState → CLOSED
 */
export async function settleFight(
  tx: SettlementTxClient,
  input: SettlementInput
): Promise<SettlementResult> {
  const { fightId, outcome, fightTier, league } = input
  const now = new Date()
  const chargesSettlementFee = league === 'HUMAN' && UPPER_TIERS.has(fightTier)

  // Step 1: Transition to SETTLEMENT
  await tx.fight.update({
    where: { id: fightId },
    data: { tradingState: 'SETTLEMENT' },
  })

  // Step 2: Cancel all open orders for this fight
  const cancelResult = await tx.order.updateMany({
    where: {
      fightId,
      status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
    },
  })

  // Step 3: Settle all unsettled positions
  const positions = await tx.position.findMany({
    where: { fightId, settled: false },
  })

  let totalPayouts = 0
  let totalFees = 0

  for (const position of positions) {
    const { payout, settlementPnl, fee } = computePositionSettlement(
      position.side as 'YES' | 'NO',
      position.quantity,
      position.avgCostBasis,
      outcome,
      chargesSettlementFee
    )

    // Mark position as settled
    await tx.position.update({
      where: { id: position.id },
      data: { settled: true, settledAt: now, settlementPnl },
    })

    // Credit user (skip DMM — unlimited credits, no audit needed)
    if (payout > 0 && position.userId !== DMM_SYSTEM_ID) {
      const updatedUser = await tx.user.update({
        where: { id: position.userId },
        data: { credits: { increment: payout } },
      })

      const description = outcome.type === 'winner'
        ? `Settlement: ${position.quantity} ${position.side} won`
        : `Refund: ${position.quantity} ${position.side} @ ${position.avgCostBasis}¢`

      await tx.creditTransaction.create({
        data: {
          userId: position.userId,
          type: 'SETTLEMENT',
          amount: payout + fee, // Gross payout before fee deduction
          fee,
          balanceAfter: updatedUser.credits,
          description,
          relatedId: fightId,
          relatedType: 'fight',
        },
      })

      totalPayouts += payout
      totalFees += fee
    }
  }

  // Step 4: Transition to CLOSED
  await tx.fight.update({
    where: { id: fightId },
    data: { tradingState: 'CLOSED' },
  })

  return {
    settledPositions: positions.length,
    cancelledOrders: cancelResult.count,
    totalPayouts,
    totalFees,
  }
}

/**
 * Compute settlement values for a single position.
 *
 * - Winner: grossPayout = qty × 100, fee = 5% on profit (Upper tier only), net = gross - fee
 * - Loser: payout = 0, PnL = -avgCostBasis × qty
 * - Draw/Cancelled: refund = avgCostBasis × qty, PnL = 0
 */
function computePositionSettlement(
  side: 'YES' | 'NO',
  quantity: number,
  avgCostBasis: number,
  outcome: SettlementOutcome,
  chargesSettlementFee: boolean
): { payout: number; settlementPnl: number; fee: number } {
  if (quantity === 0) {
    return { payout: 0, settlementPnl: 0, fee: 0 }
  }

  if (outcome.type === 'draw' || outcome.type === 'cancelled') {
    return {
      payout: avgCostBasis * quantity,
      settlementPnl: 0,
      fee: 0,
    }
  }

  if (side === outcome.side) {
    // Winner: payout = qty * 100 - fee
    const grossPayout = quantity * CONTRACT_PAYOUT_CENTS
    const profit = (CONTRACT_PAYOUT_CENTS - avgCostBasis) * quantity
    const fee = chargesSettlementFee && profit > 0
      ? Math.floor(profit * UPPER_TIER_FEE_RATE)
      : 0
    return {
      payout: grossPayout - fee,
      settlementPnl: profit,
      fee,
    }
  }

  // Loser: payout = 0, negative PnL
  return {
    payout: 0,
    settlementPnl: -avgCostBasis * quantity,
    fee: 0,
  }
}
