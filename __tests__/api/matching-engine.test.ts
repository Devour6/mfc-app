import {
  matchOrder,
  MatchingError,
  DMM_SYSTEM_ID,
  type OrderInput,
  type TxClient,
} from '@/lib/matching-engine'

/** Find a mock call whose data.userId matches the given id. */
function findCallByDataUserId(calls: unknown[][], userId: string) {
  return calls.find(
    (call) => (call[0] as { data: { userId: string } }).data.userId === userId
  )
}

/** Find a mock call whose where.id matches the given id. */
function findCallByWhereId(calls: unknown[][], id: string) {
  return calls.find(
    (call) => (call[0] as { where: { id: string } }).where.id === id
  )
}

const NOW = new Date('2026-01-01T00:00:00Z')
const EARLIER = new Date('2025-12-31T00:00:00Z')

let orderIdCounter = 0
let tradeIdCounter = 0
let positionIdCounter = 0

function resetCounters() {
  orderIdCounter = 0
  tradeIdCounter = 0
  positionIdCounter = 0
}

/** Create a mock resting order (opposite-side, already on the book). */
function makeRestingOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: `resting-${++orderIdCounter}`,
    userId: 'maker-1',
    fightId: 'f1',
    league: 'HUMAN',
    side: 'NO',
    type: 'LIMIT',
    price: 40,
    quantity: 10,
    filledQty: 0,
    remainingQty: 10,
    status: 'OPEN',
    feeRate: 200,
    totalFees: 0,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    cancelledAt: null,
    expiresAt: null,
    ...overrides,
  }
}

/** Create a mock transaction client with all required methods. */
function createMockTx() {
  const tx = {
    order: {
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `order-${++orderIdCounter}`,
        ...data,
        createdAt: NOW,
        updatedAt: NOW,
        cancelledAt: null,
        expiresAt: null,
      })),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `order-${orderIdCounter}`,
        ...data,
        createdAt: NOW,
        updatedAt: NOW,
        cancelledAt: data.cancelledAt ?? null,
        expiresAt: null,
      })),
    },
    trade: {
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `trade-${++tradeIdCounter}`,
        ...data,
        createdAt: NOW,
      })),
    },
    position: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `pos-${++positionIdCounter}`,
        ...data,
        settled: false,
        settlementPnl: null,
        settledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      })),
      update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `pos-${positionIdCounter}`,
        ...data,
        settled: false,
        settlementPnl: null,
        settledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      })),
    },
    user: {
      update: jest.fn().mockResolvedValue({ id: 'u1', credits: 5000 }),
    },
    creditTransaction: {
      create: jest.fn().mockResolvedValue({}),
    },
  }
  return tx as unknown as TxClient
}

/** Standard YES LIMIT input. */
function yesLimitInput(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    userId: 'u1',
    fightId: 'f1',
    league: 'HUMAN',
    side: 'YES',
    type: 'LIMIT',
    price: 60,
    quantity: 10,
    feeRate: 200,
    ...overrides,
  }
}

beforeEach(() => {
  resetCounters()
})

describe('matchOrder', () => {
  // ── LIMIT orders ──────────────────────────────────────────────────────────

  it('LIMIT YES: full fill against single resting NO order', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ side: 'NO', price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    // Should have 1 fill
    expect(result.fills).toHaveLength(1)
    expect(result.fills[0]).toMatchObject({
      quantity: 10,
      price: 58, // YES-side price: 100 - 42 = 58
      makerUserId: 'maker-1',
      takerUserId: 'u1',
    })
    // Order fully filled — no resting order
    expect(result.restingOrder).toBeUndefined()
    // Position created
    expect(result.position).toBeDefined()
  })

  it('LIMIT NO: full fill against single resting YES order', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ side: 'YES', price: 65, quantity: 5, remainingQty: 5 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({
      side: 'NO',
      price: 40,
      quantity: 5,
    }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0]).toMatchObject({
      quantity: 5,
      // Taker is NO: trade price = YES-side = makerCost = 65
      price: 65,
    })
    expect(result.restingOrder).toBeUndefined()
  })

  it('LIMIT partial fill: rests remainder when not fully matched', async () => {
    const tx = createMockTx()
    // Resting only has 4 contracts
    const resting = makeRestingOrder({ price: 42, quantity: 4, remainingQty: 4 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].quantity).toBe(4)
    // 6 remaining → resting order returned
    expect(result.restingOrder).toBeDefined()
    // Verify the taker order update was called with PARTIALLY_FILLED
    const orderUpdateCalls = (tx.order.update as jest.Mock).mock.calls
    const takerUpdate = orderUpdateCalls[orderUpdateCalls.length - 1]
    expect(takerUpdate[0].data.status).toBe('PARTIALLY_FILLED')
    expect(takerUpdate[0].data.remainingQty).toBe(6)
  })

  it('LIMIT no match: order fully rests when no crossable orders exist', async () => {
    const tx = createMockTx()
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([]) // No resting orders

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    expect(result.fills).toHaveLength(0)
    expect(result.restingOrder).toBeDefined()
    // Verify OPEN status
    const orderUpdateCalls = (tx.order.update as jest.Mock).mock.calls
    const takerUpdate = orderUpdateCalls[orderUpdateCalls.length - 1]
    expect(takerUpdate[0].data.status).toBe('OPEN')
    expect(takerUpdate[0].data.remainingQty).toBe(10)
  })

  it('LIMIT matches against multiple resting orders', async () => {
    const tx = createMockTx()
    const resting1 = makeRestingOrder({
      id: 'r1', price: 45, quantity: 3, remainingQty: 3, createdAt: EARLIER,
    })
    const resting2 = makeRestingOrder({
      id: 'r2', price: 42, quantity: 5, remainingQty: 5, createdAt: NOW,
    })
    // Price desc → resting1 (45) first, then resting2 (42)
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting1, resting2])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 7 }))

    expect(result.fills).toHaveLength(2)
    expect(result.fills[0].quantity).toBe(3) // matched r1 first
    expect(result.fills[1].quantity).toBe(4) // 4 of 5 from r2
    expect(result.restingOrder).toBeUndefined() // fully filled (3+4=7)
  })

  // ── MARKET orders ─────────────────────────────────────────────────────────

  it('MARKET: full fill against best available', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 45, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({
      type: 'MARKET',
      price: 0, // MARKET ignores price
      quantity: 10,
    }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].quantity).toBe(10)
    expect(result.restingOrder).toBeUndefined()
  })

  it('MARKET: throws MatchingError when no liquidity', async () => {
    const tx = createMockTx()
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([])

    await expect(matchOrder(tx, yesLimitInput({
      type: 'MARKET',
      price: 0,
      quantity: 10,
    }))).rejects.toThrow(MatchingError)

    await expect(matchOrder(tx, yesLimitInput({
      type: 'MARKET',
      price: 0,
      quantity: 10,
    }))).rejects.toThrow('No liquidity available for market order')
  })

  it('MARKET partial fill: unfilled portion cancelled (IOC)', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 3, remainingQty: 3 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({
      type: 'MARKET',
      price: 0,
      quantity: 10,
    }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].quantity).toBe(3) // Only 3 available
    expect(result.restingOrder).toBeUndefined() // MARKET never rests
    // Verify CANCELLED status for unfilled
    const orderUpdateCalls = (tx.order.update as jest.Mock).mock.calls
    const takerUpdate = orderUpdateCalls[orderUpdateCalls.length - 1]
    expect(takerUpdate[0].data.status).toBe('CANCELLED')
    expect(takerUpdate[0].data.filledQty).toBe(3)
    expect(takerUpdate[0].data.remainingQty).toBe(7)
  })

  // ── Price-time priority ───────────────────────────────────────────────────

  it('price priority: most aggressive resting price matched first', async () => {
    const tx = createMockTx()
    // resting1 at 45 is more aggressive than resting2 at 42
    const resting1 = makeRestingOrder({
      id: 'r-45', price: 45, quantity: 5, remainingQty: 5, createdAt: NOW,
    })
    const resting2 = makeRestingOrder({
      id: 'r-42', price: 42, quantity: 5, remainingQty: 5, createdAt: EARLIER,
    })
    // findMany returns in price desc order (Prisma sorts)
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting1, resting2])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    // Should match r-45 first (better price for taker: 100-45=55 < 100-42=58)
    expect(result.fills).toHaveLength(1)
    expect(result.fills[0]).toMatchObject({
      makerOrderId: 'r-45',
      price: 55, // YES price: 100 - 45
      quantity: 5,
    })
  })

  it('FIFO: equal prices matched by earliest createdAt', async () => {
    const tx = createMockTx()
    const earlier = new Date('2026-01-01T00:00:00Z')
    const later = new Date('2026-01-01T01:00:00Z')
    const resting1 = makeRestingOrder({
      id: 'r-early', price: 42, quantity: 5, remainingQty: 5, createdAt: earlier,
    })
    const resting2 = makeRestingOrder({
      id: 'r-late', price: 42, quantity: 5, remainingQty: 5, createdAt: later,
    })
    // Prisma sorts: price desc (same), createdAt asc → earlier first
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting1, resting2])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].makerOrderId).toBe('r-early')
  })

  // ── Complement matching ───────────────────────────────────────────────────

  it('complement matching: YES 60 + NO 42 = 102 >= 100 crosses', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ side: 'NO', price: 42, quantity: 5, remainingQty: 5 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    expect(result.fills).toHaveLength(1)
    // YES execution price = 100 - 42 = 58 (price improvement for buyer)
    expect(result.fills[0].price).toBe(58)
  })

  it('complement matching: exact boundary YES 60 + NO 40 = 100 crosses', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ side: 'NO', price: 40, quantity: 5, remainingQty: 5 })
    // minCrossPrice for YES@60 = 100 - 60 = 40. Resting at 40 >= 40 → crosses
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].price).toBe(60) // 100 - 40 = 60 (no price improvement)
  })

  // ── DMM handling ──────────────────────────────────────────────────────────

  it('DMM as taker: zero fees, no credit deduction', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({
      userId: DMM_SYSTEM_ID,
      price: 60,
      quantity: 10,
    }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].takerFee).toBe(0) // DMM pays zero fees

    // user.update should NOT be called for DMM taker credit deduction
    // (it IS called for the non-DMM maker)
    const userUpdateCalls = (tx.user.update as jest.Mock).mock.calls
    expect(findCallByWhereId(userUpdateCalls, DMM_SYSTEM_ID)).toBeUndefined()
  })

  it('DMM as maker: zero maker fees', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({
      userId: DMM_SYSTEM_ID,
      price: 42,
      quantity: 10,
      remainingQty: 10,
    })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].makerFee).toBe(0) // DMM pays zero maker fees

    // user.update should NOT be called for DMM maker
    const userUpdateCalls = (tx.user.update as jest.Mock).mock.calls
    expect(findCallByWhereId(userUpdateCalls, DMM_SYSTEM_ID)).toBeUndefined()
  })

  // ── Fee calculation ───────────────────────────────────────────────────────

  it('fees calculated correctly: floor(cost × qty × rate / 10000)', async () => {
    const tx = createMockTx()
    // Resting NO at 42, taker YES at 60
    // takerCost = 58, makerCost = 42
    // takerFee = floor(58 * 10 * 200 / 10000) = floor(11.6) = 11
    // makerFee = floor(42 * 10 * 200 / 10000) = floor(8.4) = 8
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    const result = await matchOrder(tx, yesLimitInput({
      price: 60,
      quantity: 10,
      feeRate: 200,
    }))

    expect(result.fills[0].takerFee).toBe(11)
    expect(result.fills[0].makerFee).toBe(8)
  })

  // ── CreditTransaction records ─────────────────────────────────────────────

  it('creates CreditTransaction for taker on each fill', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    const ctCalls = (tx.creditTransaction.create as jest.Mock).mock.calls
    // At least one for taker, one for maker
    expect(ctCalls.length).toBeGreaterThanOrEqual(2)
    // Find the taker transaction
    const takerCt = findCallByDataUserId(ctCalls, 'u1')
    expect(takerCt).toBeDefined()
    expect(takerCt![0].data.type).toBe('ORDER_FILL')
    expect(takerCt![0].data.amount).toBe(-(58 * 10)) // -580
    expect(takerCt![0].data.relatedType).toBe('trade')
  })

  it('creates CreditTransaction for maker on each fill', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({
      userId: 'maker-u2',
      price: 42,
      quantity: 10,
      remainingQty: 10,
    })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    const ctCalls = (tx.creditTransaction.create as jest.Mock).mock.calls
    const makerCt = findCallByDataUserId(ctCalls, 'maker-u2')
    expect(makerCt).toBeDefined()
    expect(makerCt![0].data.type).toBe('ORDER_FILL')
    expect(makerCt![0].data.amount).toBe(-(42 * 10)) // -420
  })

  // ── Position management ───────────────────────────────────────────────────

  it('creates new position from fill', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(null) // No existing position

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    expect(result.position).toBeDefined()
    // Position create should have been called for the taker
    const posCreateCalls = (tx.position.create as jest.Mock).mock.calls
    expect(posCreateCalls.length).toBeGreaterThanOrEqual(1)
    // Find taker position creation
    const takerPosCreate = findCallByDataUserId(posCreateCalls, 'u1')
    expect(takerPosCreate).toBeDefined()
    expect(takerPosCreate![0].data.side).toBe('YES')
    expect(takerPosCreate![0].data.quantity).toBe(10)
    expect(takerPosCreate![0].data.avgCostBasis).toBe(58) // 100 - 42
  })

  it('updates existing same-side position with weighted avg cost', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 45, quantity: 5, remainingQty: 5 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    // Taker already has a YES position: 10 contracts at avg cost 60
    const existingPosition = {
      id: 'existing-pos',
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
    }
    // findUnique returns existing for taker, null for maker
    ;(tx.position.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)          // maker position lookup (first call in loop)
      .mockResolvedValueOnce(existingPosition) // taker position lookup (after fills)

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    expect(result.position).toBeDefined()
    // Position update should be called with weighted avg
    const posUpdateCalls = (tx.position.update as jest.Mock).mock.calls
    // New avg: (10 * 60 + 5 * 55) / 15 = (600 + 275) / 15 = 58.33 → 58
    const takerUpdate = findCallByWhereId(posUpdateCalls, 'existing-pos')
    expect(takerUpdate).toBeDefined()
    expect(takerUpdate![0].data.quantity).toBe(15)
    expect(takerUpdate![0].data.avgCostBasis).toBe(58) // Math.round(875/15)
  })

  it('returns empty position when LIMIT has no fills', async () => {
    const tx = createMockTx()
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([])

    const result = await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    expect(result.fills).toHaveLength(0)
    expect(result.position).toBeDefined()
    expect(result.position.quantity).toBe(0)
  })

  // ── Self-match guard ─────────────────────────────────────────────────────

  it('skips resting orders from the same user (self-match prevention)', async () => {
    const tx = createMockTx()
    // Resting order belongs to same userId as the incoming order
    const selfOrder = makeRestingOrder({ userId: 'u1', price: 42, quantity: 10, remainingQty: 10 })
    const otherOrder = makeRestingOrder({ userId: 'maker-1', price: 40, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([selfOrder, otherOrder])

    const result = await matchOrder(tx, yesLimitInput({ userId: 'u1', price: 60, quantity: 5 }))

    // Should skip selfOrder and fill against otherOrder
    expect(result.fills).toHaveLength(1)
    expect(result.fills[0].makerUserId).toBe('maker-1')
  })

  it('rests order when only self-match orders are on the book', async () => {
    const tx = createMockTx()
    const selfOrder = makeRestingOrder({ userId: 'u1', price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([selfOrder])

    const result = await matchOrder(tx, yesLimitInput({ userId: 'u1', price: 60, quantity: 10 }))

    // No fills — order should rest
    expect(result.fills).toHaveLength(0)
    expect(result.restingOrder).toBeDefined()
  })

  // ── Trade.price convention ────────────────────────────────────────────────

  it('Trade.price is YES-side price when taker is NO', async () => {
    const tx = createMockTx()
    // Resting YES order at 70
    const resting = makeRestingOrder({ side: 'YES', price: 70, quantity: 5, remainingQty: 5 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    // Taker is NO at 35 (crosses: 70 + 35 = 105 >= 100)
    const result = await matchOrder(tx, yesLimitInput({
      side: 'NO',
      price: 35,
      quantity: 5,
    }))

    expect(result.fills).toHaveLength(1)
    // Trade.price = YES-side = makerCost = resting.price = 70
    expect(result.fills[0].price).toBe(70)
  })

  // ── Order status transitions ──────────────────────────────────────────────

  it('resting maker order transitions to FILLED when fully consumed', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    await matchOrder(tx, yesLimitInput({ price: 60, quantity: 10 }))

    // First order.update call is for the resting order
    const firstUpdate = (tx.order.update as jest.Mock).mock.calls[0]
    expect(firstUpdate[0].data.status).toBe('FILLED')
    expect(firstUpdate[0].data.filledQty).toBe(10)
    expect(firstUpdate[0].data.remainingQty).toBe(0)
  })

  it('resting maker order transitions to PARTIALLY_FILLED when partially consumed', async () => {
    const tx = createMockTx()
    const resting = makeRestingOrder({ price: 42, quantity: 10, remainingQty: 10 })
    ;(tx.order.findMany as jest.Mock).mockResolvedValue([resting])

    await matchOrder(tx, yesLimitInput({ price: 60, quantity: 5 }))

    const firstUpdate = (tx.order.update as jest.Mock).mock.calls[0]
    expect(firstUpdate[0].data.status).toBe('PARTIALLY_FILLED')
    expect(firstUpdate[0].data.filledQty).toBe(5)
    expect(firstUpdate[0].data.remainingQty).toBe(5)
  })
})
