import type { PrismaClient, Order, Trade, Position } from '@prisma/client'
import {
  CONTRACT_PAYOUT_CENTS,
  DMM_SYSTEM_ID,
  upsertPosition,
  getOrCreatePosition,
} from './position-manager'

// Re-export shared constants for backward compatibility with existing imports
export { CONTRACT_PAYOUT_CENTS, DMM_SYSTEM_ID } from './position-manager'

/** Prisma interactive transaction client — subset of PrismaClient used by the matching engine. */
export interface TxClient {
  order: PrismaClient['order']
  trade: PrismaClient['trade']
  position: PrismaClient['position']
  user: PrismaClient['user']
  creditTransaction: PrismaClient['creditTransaction']
}

/** Input parameters for a new order to be matched against the book. */
export interface OrderInput {
  userId: string
  fightId: string
  league: 'HUMAN' | 'AGENT'
  side: 'YES' | 'NO'
  type: 'LIMIT' | 'MARKET'
  /** Limit price in cents (1-99) for LIMIT orders. Ignored for MARKET. */
  price: number
  /** Number of contracts. */
  quantity: number
  /** Fee rate in basis points (200 = 2%). */
  feeRate: number
}

/** Result of matching an order against the book. */
export interface MatchResult {
  fills: Trade[]
  restingOrder?: Order
  position: Position
}

/** Error thrown when matching fails (e.g., no liquidity for MARKET order). */
export class MatchingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MatchingError'
  }
}

/**
 * Core CLOB matching engine.
 *
 * Matches an incoming order against resting opposite-side orders using
 * price-time priority and complement pricing (YES.price + NO.price >= 100).
 *
 * All DB mutations happen inside the provided Prisma transaction client.
 */
export async function matchOrder(
  tx: TxClient,
  input: OrderInput
): Promise<MatchResult> {
  const { userId, fightId, league, side, type: orderType, price, quantity, feeRate } = input
  const isDMM = userId === DMM_SYSTEM_ID
  const oppositeSide: 'YES' | 'NO' = side === 'YES' ? 'NO' : 'YES'

  // Create the incoming order
  const incomingOrder = await tx.order.create({
    data: {
      userId,
      fightId,
      league,
      side,
      type: orderType,
      price: orderType === 'MARKET' ? 0 : price,
      quantity,
      filledQty: 0,
      remainingQty: quantity,
      status: 'OPEN',
      feeRate,
      totalFees: 0,
    },
  })

  // Find crossable opposite-side resting orders.
  // Cross condition: incoming.price + resting.price >= 100.
  // MARKET orders match any resting order (minCrossPrice = 1).
  const minCrossPrice = orderType === 'MARKET' ? 1 : CONTRACT_PAYOUT_CENTS - price

  const restingOrders = await tx.order.findMany({
    where: {
      fightId,
      league,
      side: oppositeSide,
      status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
      price: { gte: minCrossPrice },
    },
    orderBy: [
      { price: 'desc' },      // Best price first (most aggressive bid)
      { createdAt: 'asc' },   // FIFO for equal prices
    ],
  })

  // MARKET with zero liquidity → reject
  if (orderType === 'MARKET' && restingOrders.length === 0) {
    await tx.order.update({
      where: { id: incomingOrder.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    throw new MatchingError('No liquidity available for market order')
  }

  // Match iteratively against resting orders
  const fills: Trade[] = []
  let remaining = quantity

  for (const resting of restingOrders) {
    if (remaining <= 0) break

    const fillQty = Math.min(remaining, resting.remainingQty)

    // V1 execution: resting order's stated price is honored.
    // takerCost (per contract) = CONTRACT_PAYOUT_CENTS - resting.price
    // makerCost (per contract) = resting.price
    const takerCost = CONTRACT_PAYOUT_CENTS - resting.price
    const makerCost = resting.price

    // Trade.price = YES-side execution price (binary contract convention)
    const tradePrice = side === 'YES' ? takerCost : makerCost

    // Fees (DMM pays zero)
    const makerIsDMM = resting.userId === DMM_SYSTEM_ID
    const makerFee = makerIsDMM ? 0 : computeFillFee(makerCost, fillQty, resting.feeRate)
    const takerFee = isDMM ? 0 : computeFillFee(takerCost, fillQty, feeRate)

    // Create trade record
    const trade = await tx.trade.create({
      data: {
        fightId,
        league,
        price: tradePrice,
        quantity: fillQty,
        makerOrderId: resting.id,
        takerOrderId: incomingOrder.id,
        makerUserId: resting.userId,
        takerUserId: userId,
        makerFee,
        takerFee,
      },
    })
    fills.push(trade)

    // Update resting (maker) order
    const newMakerFilled = resting.filledQty + fillQty
    const newMakerRemaining = resting.quantity - newMakerFilled
    await tx.order.update({
      where: { id: resting.id },
      data: {
        filledQty: newMakerFilled,
        remainingQty: newMakerRemaining,
        status: newMakerRemaining === 0 ? 'FILLED' : 'PARTIALLY_FILLED',
        totalFees: resting.totalFees + makerFee,
      },
    })

    // Deduct credits + audit trail for both parties (skip for DMM)
    if (!isDMM) {
      await deductCreditsAndAudit(tx, {
        userId, costPerContract: takerCost, fillQty, fee: takerFee,
        side, tradeId: trade.id,
      })
    }
    if (!makerIsDMM) {
      await deductCreditsAndAudit(tx, {
        userId: resting.userId, costPerContract: makerCost, fillQty, fee: makerFee,
        side: oppositeSide, tradeId: trade.id,
      })
    }

    // Update maker position
    await upsertPosition(tx, {
      userId: resting.userId,
      fightId,
      league,
      side: oppositeSide,
      fillQty,
      fillPrice: makerCost,
    })

    remaining -= fillQty
  }

  // Finalize incoming (taker) order status
  const filledQty = quantity - remaining
  let finalStatus: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED'

  if (remaining === 0) {
    finalStatus = 'FILLED'
  } else if (orderType === 'MARKET') {
    finalStatus = 'CANCELLED' // IOC: cancel unfilled portion
  } else if (filledQty > 0) {
    finalStatus = 'PARTIALLY_FILLED'
  } else {
    finalStatus = 'OPEN' // LIMIT with no fills → fully resting
  }

  const totalTakerFees = fills.reduce((sum, f) => sum + f.takerFee, 0)
  const updatedOrder = await tx.order.update({
    where: { id: incomingOrder.id },
    data: {
      filledQty,
      remainingQty: remaining,
      status: finalStatus,
      totalFees: totalTakerFees,
      ...(finalStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    },
  })

  // Update taker position (only if fills occurred)
  const position = filledQty > 0
    ? await upsertPosition(tx, {
        userId,
        fightId,
        league,
        side,
        fillQty: filledQty,
        fillPrice: computeWeightedAvgPrice(fills, side),
      })
    : await getOrCreatePosition(tx, userId, fightId, league, side)

  const isResting = finalStatus === 'OPEN' || finalStatus === 'PARTIALLY_FILLED'
  return {
    fills,
    ...(isResting ? { restingOrder: updatedOrder } : {}),
    position,
  }
}

/** Fee for a single fill: floor(costPerContract x quantity x feeRate / 10000). */
function computeFillFee(costPerContract: number, quantity: number, feeRate: number): number {
  return Math.floor(costPerContract * quantity * feeRate / 10000)
}

interface DeductCreditsParams {
  userId: string
  costPerContract: number
  fillQty: number
  fee: number
  side: 'YES' | 'NO'
  tradeId: string
}

/** Deduct credits from a user and create a CreditTransaction audit record. */
async function deductCreditsAndAudit(tx: TxClient, p: DeductCreditsParams): Promise<void> {
  const total = p.costPerContract * p.fillQty + p.fee
  const updatedUser = await tx.user.update({
    where: { id: p.userId },
    data: { credits: { decrement: total } },
  })
  await tx.creditTransaction.create({
    data: {
      userId: p.userId,
      type: 'ORDER_FILL',
      amount: -(p.costPerContract * p.fillQty),
      fee: p.fee,
      balanceAfter: updatedUser.credits,
      description: `Bought ${p.fillQty} ${p.side} @ ${p.costPerContract}¢`,
      relatedId: p.tradeId,
      relatedType: 'trade',
    },
  })
}

/** Weighted average execution price across fills for a given side. */
function computeWeightedAvgPrice(fills: Trade[], takerSide: 'YES' | 'NO'): number {
  if (fills.length === 0) return 0
  let totalCost = 0
  let totalQty = 0
  for (const fill of fills) {
    // fill.price is always the YES-side execution price
    const sidePrice = takerSide === 'YES' ? fill.price : CONTRACT_PAYOUT_CENTS - fill.price
    totalCost += sidePrice * fill.quantity
    totalQty += fill.quantity
  }
  return Math.round(totalCost / totalQty)
}
