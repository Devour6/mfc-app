import {
  settleFight,
  UPPER_TIER_FEE_RATE,
  type SettlementTxClient,
  type SettlementInput,
} from '@/lib/settlement-engine'
import { CONTRACT_PAYOUT_CENTS, DMM_SYSTEM_ID } from '@/lib/position-manager'
import type { Position } from '@prisma/client'

const NOW = new Date('2026-01-01T00:00:00Z')
const EARLIER = new Date('2025-12-31T00:00:00Z')

/** Create a mock Position object. */
function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'pos-1',
    userId: 'u1',
    fightId: 'f1',
    league: 'HUMAN',
    side: 'YES',
    quantity: 10,
    avgCostBasis: 60,
    realizedPnl: 0,
    settlementPnl: null,
    settled: false,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    settledAt: null,
    ...overrides,
  } as Position
}

/** Create a mock transaction client for settlement operations. */
function createMockTx(initialCredits?: Record<string, number>) {
  const credits: Record<string, number> = initialCredits ?? { u1: 10000 }

  const tx = {
    fight: {
      update: jest.fn().mockResolvedValue({ id: 'f1' }),
    },
    order: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    position: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      update: jest.fn().mockImplementation(
        async ({ where, data }: { where: { id: string }; data: { credits?: { increment?: number } } }) => {
          const inc = data?.credits?.increment ?? 0
          const current = credits[where.id] ?? 0
          const newVal = current + inc
          credits[where.id] = newVal
          return { id: where.id, credits: newVal }
        }
      ),
    },
    creditTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'ct-1' }),
    },
  }

  return tx as unknown as SettlementTxClient
}

/** Shared default input for most tests. */
function makeInput(overrides: Partial<SettlementInput> = {}): SettlementInput {
  return {
    fightId: 'f1',
    outcome: { type: 'winner', side: 'YES' },
    fightTier: 'LOCAL',
    league: 'HUMAN',
    ...overrides,
  }
}

describe('settleFight', () => {
  // ── Winner / Loser Settlement ──────────────────────────────────────────────

  it('pays winner YES positions at 100¢/contract with correct PnL', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput())

    // Payout = 10 * 100 = 1000 (Local tier: no fee)
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { credits: { increment: 1000 } },
      })
    )

    // settlementPnl = (100 - 60) * 10 = 400
    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pos-1' },
        data: expect.objectContaining({
          settled: true,
          settlementPnl: 400,
          settledAt: expect.any(Date),
        }),
      })
    )

    expect(result.settledPositions).toBe(1)
    expect(result.totalPayouts).toBe(1000)
    expect(result.totalFees).toBe(0)
  })

  it('gives losers zero payout with negative PnL', async () => {
    const tx = createMockTx()
    // NO position loses when YES wins
    const position = makePosition({ side: 'NO', quantity: 10, avgCostBasis: 40 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    await settleFight(tx, makeInput())

    // No credit operations for losers
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.creditTransaction.create).not.toHaveBeenCalled()

    // settlementPnl = -40 * 10 = -400
    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settled: true,
          settlementPnl: -400,
        }),
      })
    )
  })

  it('pays winner NO positions when NO side wins', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'NO', quantity: 10, avgCostBasis: 40 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({
      outcome: { type: 'winner', side: 'NO' },
    }))

    // Payout = 10 * 100 = 1000
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 1000 } },
      })
    )

    // settlementPnl = (100 - 40) * 10 = 600
    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ settlementPnl: 600 }),
      })
    )

    expect(result.totalPayouts).toBe(1000)
  })

  // ── Fee Handling ───────────────────────────────────────────────────────────

  it('deducts 5% fee on profit for Regional tier', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'REGIONAL' }))

    // Profit = (100-60)*10 = 400. Fee = floor(400*0.05) = 20. Payout = 1000 - 20 = 980
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 980 } },
      })
    )

    // CreditTransaction: gross amount = 1000, fee = 20
    expect(tx.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 1000,
          fee: 20,
          type: 'SETTLEMENT',
        }),
      })
    )

    expect(result.totalFees).toBe(20)
    expect(result.totalPayouts).toBe(980)
  })

  it('charges 5% fee on Grand tier fights', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 100, avgCostBasis: 50 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'GRAND' }))

    // Profit = (100-50)*100 = 5000. Fee = floor(5000*0.05) = 250. Payout = 10000 - 250 = 9750
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 9750 } },
      })
    )

    expect(result.totalFees).toBe(250)
    expect(result.totalPayouts).toBe(9750)
  })

  it('charges 5% fee on Invitational tier fights', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'INVITATIONAL' }))

    // Fee = floor(400 * 0.05) = 20
    expect(result.totalFees).toBe(20)
    expect(result.totalPayouts).toBe(980)
  })

  it('charges no fee when winner has zero profit', async () => {
    const tx = createMockTx()
    // avgCostBasis = 100 means they paid 100¢/contract — no profit
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 100 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'GRAND' }))

    // Profit = 0, fee = 0, payout = 1000
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 1000 } },
      })
    )

    expect(tx.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fee: 0 }),
      })
    )

    expect(result.totalFees).toBe(0)
  })

  it('charges no settlement fee for Local tier even with profit', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 20 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'LOCAL' }))

    // Big profit (800) but Local = no settlement fee. Full payout = 1000
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 1000 } },
      })
    )

    expect(result.totalFees).toBe(0)
  })

  it('charges no settlement fee for Agent league fights', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 30, league: 'AGENT' })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({
      fightTier: 'REGIONAL',
      league: 'AGENT',
    }))

    // Agent league: no settlement fee even on Upper tiers
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 1000 } },
      })
    )

    expect(result.totalFees).toBe(0)
  })

  // ── Draw / Cancelled ───────────────────────────────────────────────────────

  it('refunds all positions at avgCostBasis on draw', async () => {
    const tx = createMockTx({ u1: 10000, u2: 10000 })
    const yesPos = makePosition({ id: 'pos-y', userId: 'u1', side: 'YES', quantity: 10, avgCostBasis: 60 })
    const noPos = makePosition({ id: 'pos-n', userId: 'u2', side: 'NO', quantity: 5, avgCostBasis: 40 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([yesPos, noPos])

    const result = await settleFight(tx, makeInput({ outcome: { type: 'draw' } }))

    // YES holder: refund = 60 * 10 = 600
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { credits: { increment: 600 } },
      })
    )

    // NO holder: refund = 40 * 5 = 200
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: { credits: { increment: 200 } },
      })
    )

    // Both positions: settlementPnl = 0
    expect(tx.position.update).toHaveBeenCalledTimes(2)
    const posUpdates = (tx.position.update as jest.Mock).mock.calls
    for (const [arg] of posUpdates) {
      expect(arg.data.settlementPnl).toBe(0)
      expect(arg.data.settled).toBe(true)
    }

    expect(result.settledPositions).toBe(2)
    expect(result.totalPayouts).toBe(800)
  })

  it('refunds positions and cancels orders on fight cancellation', async () => {
    const tx = createMockTx()
    const position = makePosition({ quantity: 5, avgCostBasis: 70 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])
    ;(tx.order.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

    const result = await settleFight(tx, makeInput({ outcome: { type: 'cancelled' } }))

    // Refund: 70 * 5 = 350
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { credits: { increment: 350 } },
      })
    )

    // Refund description
    expect(tx.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: expect.stringContaining('Refund'),
        }),
      })
    )

    expect(result.cancelledOrders).toBe(3)
    expect(result.totalPayouts).toBe(350)
  })

  // ── Order Cancellation ─────────────────────────────────────────────────────

  it('cancels all open and partially-filled orders', async () => {
    const tx = createMockTx()
    ;(tx.order.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

    const result = await settleFight(tx, makeInput())

    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: {
        fightId: 'f1',
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: expect.any(Date),
      },
    })

    expect(result.cancelledOrders).toBe(5)
  })

  // ── DMM Handling ───────────────────────────────────────────────────────────

  it('settles DMM losing positions without credit operations', async () => {
    const tx = createMockTx()
    const dmmPos = makePosition({
      userId: DMM_SYSTEM_ID,
      side: 'NO',
      quantity: 100,
      avgCostBasis: 40,
    })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([dmmPos])

    const result = await settleFight(tx, makeInput())

    // Position marked settled with negative PnL
    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settled: true,
          settlementPnl: -4000, // -40 * 100
        }),
      })
    )

    // No credit operations for DMM
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.creditTransaction.create).not.toHaveBeenCalled()
    expect(result.totalPayouts).toBe(0)
  })

  it('settles DMM winning positions without credit operations', async () => {
    const tx = createMockTx()
    const dmmPos = makePosition({
      userId: DMM_SYSTEM_ID,
      side: 'YES',
      quantity: 50,
      avgCostBasis: 60,
    })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([dmmPos])

    const result = await settleFight(tx, makeInput())

    // Position marked settled with positive PnL
    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settled: true,
          settlementPnl: 2000, // (100-60)*50
        }),
      })
    )

    // DMM: no credits, no audit
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.creditTransaction.create).not.toHaveBeenCalled()
    expect(result.totalPayouts).toBe(0)
  })

  // ── Edge Cases ─────────────────────────────────────────────────────────────

  it('settles zero-quantity positions with zero PnL and no payout', async () => {
    const tx = createMockTx()
    const position = makePosition({ quantity: 0, avgCostBasis: 0 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput())

    expect(tx.position.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ settled: true, settlementPnl: 0 }),
      })
    )

    expect(tx.user.update).not.toHaveBeenCalled()
    expect(result.settledPositions).toBe(1)
    expect(result.totalPayouts).toBe(0)
  })

  it('transitions tradingState through SETTLEMENT → CLOSED', async () => {
    const tx = createMockTx()

    await settleFight(tx, makeInput())

    const fightUpdates = (tx.fight.update as jest.Mock).mock.calls
    expect(fightUpdates).toHaveLength(2)
    expect(fightUpdates[0][0].data.tradingState).toBe('SETTLEMENT')
    expect(fightUpdates[1][0].data.tradingState).toBe('CLOSED')
  })

  it('settles multiple positions (winners, losers, DMM) in batch', async () => {
    const tx = createMockTx({ u1: 10000, u2: 10000 })
    const winner = makePosition({ id: 'pos-w', userId: 'u1', side: 'YES', quantity: 10, avgCostBasis: 60 })
    const loser = makePosition({ id: 'pos-l', userId: 'u2', side: 'NO', quantity: 5, avgCostBasis: 40 })
    const dmmPos = makePosition({ id: 'pos-d', userId: DMM_SYSTEM_ID, side: 'NO', quantity: 5, avgCostBasis: 40 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([winner, loser, dmmPos])

    const result = await settleFight(tx, makeInput())

    expect(result.settledPositions).toBe(3)
    expect(tx.position.update).toHaveBeenCalledTimes(3)

    // Only winner gets credit + audit
    expect(tx.user.update).toHaveBeenCalledTimes(1)
    expect(tx.creditTransaction.create).toHaveBeenCalledTimes(1)
    expect(result.totalPayouts).toBe(1000)
  })

  it('creates CreditTransaction with all required fields', async () => {
    const tx = createMockTx()
    const position = makePosition({ side: 'YES', quantity: 5, avgCostBasis: 60 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    await settleFight(tx, makeInput())

    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        type: 'SETTLEMENT',
        amount: 500,  // 5 * 100 (gross payout, no fee for Local)
        fee: 0,
        balanceAfter: expect.any(Number),
        description: 'Settlement: 5 YES won',
        relatedId: 'f1',
        relatedType: 'fight',
      },
    })
  })

  // ── Fee edge: floor rounding ───────────────────────────────────────────────

  it('floors the settlement fee (rounds in favor of the user)', async () => {
    const tx = createMockTx()
    // avgCostBasis 33, qty 7 → profit = (100-33)*7 = 469, fee = floor(469*0.05) = floor(23.45) = 23
    const position = makePosition({ side: 'YES', quantity: 7, avgCostBasis: 33 })
    ;(tx.position.findMany as jest.Mock).mockResolvedValue([position])

    const result = await settleFight(tx, makeInput({ fightTier: 'REGIONAL' }))

    expect(result.totalFees).toBe(23)
    expect(result.totalPayouts).toBe(700 - 23)  // 677
  })
})
