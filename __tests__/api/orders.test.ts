/**
 * @jest-environment node
 */
import {
  mockPrisma,
  mockRequireAnyRole,
  createRequest,
  params,
} from './helpers'

// Mock matching engine
const mockMatchOrder = jest.fn()
jest.mock('@/lib/matching-engine', () => ({
  matchOrder: (...args: unknown[]) => mockMatchOrder(...args),
  MatchingError: class MatchingError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'MatchingError'
    }
  },
}))

// Mock position manager — checkPositionLimit is called directly in the route
const mockCheckPositionLimit = jest.fn()
jest.mock('@/lib/position-manager', () => ({
  checkPositionLimit: (...args: unknown[]) => mockCheckPositionLimit(...args),
  PositionLimitError: class PositionLimitError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'PositionLimitError'
    }
  },
  DMM_SYSTEM_ID: 'DMM_SYSTEM',
}))

import { POST, GET } from '@/app/api/orders/route'
import { GET as GET_BY_ID, DELETE as DELETE_BY_ID } from '@/app/api/orders/[id]/route'

// Re-import PositionLimitError and MatchingError from the mocked modules
// so we can throw instances that match instanceof checks
const { PositionLimitError } = jest.requireMock('@/lib/position-manager') as {
  PositionLimitError: new (msg: string) => Error
}
const { MatchingError } = jest.requireMock('@/lib/matching-engine') as {
  MatchingError: new (msg: string) => Error
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const HUMAN_USER = { id: 'u1', auth0Id: 'auth0|test', credits: 100_000, isAgent: false }
const AGENT_USER = { id: 'u-agent-1', auth0Id: 'agent_abc', credits: 50_000, isAgent: true }

const HUMAN_FIGHT = {
  id: 'fight-1',
  league: 'HUMAN',
  tier: 'LOCAL',
  tradingState: 'PREFIGHT',
  status: 'SCHEDULED',
}

const AGENT_FIGHT = {
  id: 'fight-2',
  league: 'AGENT',
  tier: 'LOCAL',
  tradingState: 'OPEN',
  status: 'LIVE',
}

const MATCH_RESULT = {
  fills: [{ id: 't1', price: 60, quantity: 5 }],
  restingOrder: { id: 'o1', status: 'OPEN', remainingQty: 5 },
  position: { id: 'p1', side: 'YES', quantity: 5, avgCostBasis: 60 },
}

function orderBody(overrides: Record<string, unknown> = {}) {
  return {
    fightId: 'fight-1',
    side: 'YES',
    type: 'LIMIT',
    price: 60,
    quantity: 10,
    ...overrides,
  }
}

function postRequest(body: Record<string, unknown>) {
  return createRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue(HUMAN_USER)
  mockPrisma.fight.findUnique.mockResolvedValue(HUMAN_FIGHT)
  mockPrisma.position.findUnique.mockResolvedValue(null)
  mockCheckPositionLimit.mockReturnValue(undefined)
  mockMatchOrder.mockResolvedValue(MATCH_RESULT)
  mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
})

// ── POST /api/orders ─────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  // --- Happy paths ---

  it('places a LIMIT order and returns 201 with match result', async () => {
    const res = await POST(postRequest(orderBody()))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.fills).toHaveLength(1)
    expect(data.position.side).toBe('YES')
    expect(mockMatchOrder).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        userId: 'u1',
        fightId: 'fight-1',
        league: 'HUMAN',
        side: 'YES',
        type: 'LIMIT',
        price: 60,
        quantity: 10,
        feeRate: 200,
      })
    )
  })

  it('places a MARKET order (no price required)', async () => {
    const res = await POST(postRequest(orderBody({ type: 'MARKET', price: undefined })))

    expect(res.status).toBe(201)
    expect(mockMatchOrder).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({ type: 'MARKET', price: 0 })
    )
  })

  it('accepts orders in OPEN trading state', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ ...HUMAN_FIGHT, tradingState: 'OPEN' })
    const res = await POST(postRequest(orderBody()))

    expect(res.status).toBe(201)
  })

  it('allows agent user to trade on AGENT fights', async () => {
    mockRequireAnyRole.mockResolvedValue(AGENT_USER)
    mockPrisma.fight.findUnique.mockResolvedValue(AGENT_FIGHT)

    const res = await POST(postRequest(orderBody({ fightId: 'fight-2' })))
    const data = await res.json()

    expect(res.status).toBe(201)
    // Agent fee rate: 50 basis points (0.5%)
    expect(mockMatchOrder).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({ feeRate: 50, league: 'AGENT' })
    )
  })

  it('uses 0 fee rate for upper tier fights (settlement-only fees)', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ ...HUMAN_FIGHT, tier: 'REGIONAL' })
    const res = await POST(postRequest(orderBody()))

    expect(res.status).toBe(201)
    expect(mockMatchOrder).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({ feeRate: 0 })
    )
  })

  // --- Auth errors ---

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue({
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(401)
  })

  // --- Validation errors ---

  it('returns 400 for missing fightId', async () => {
    const res = await POST(postRequest({ side: 'YES', type: 'LIMIT', price: 60, quantity: 10 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })

  it('returns 400 for LIMIT order without price', async () => {
    const res = await POST(postRequest(orderBody({ type: 'LIMIT', price: undefined })))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })

  it('returns 400 for price out of range (0 or 100+)', async () => {
    const res0 = await POST(postRequest(orderBody({ price: 0 })))
    expect(res0.status).toBe(400)

    const res100 = await POST(postRequest(orderBody({ price: 100 })))
    expect(res100.status).toBe(400)
  })

  it('returns 400 for quantity <= 0', async () => {
    const res = await POST(postRequest(orderBody({ quantity: 0 })))
    expect(res.status).toBe(400)
  })

  // --- Fight not found ---

  it('returns 404 when fight does not exist', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(null)

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(404)
  })

  // --- Trading state restrictions ---

  it('returns 400 when fight tradingState is ROUND_ACTIVE', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ ...HUMAN_FIGHT, tradingState: 'ROUND_ACTIVE' })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Trading is not active')
  })

  it('returns 400 when fight tradingState is SETTLEMENT', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ ...HUMAN_FIGHT, tradingState: 'SETTLEMENT' })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fight tradingState is CLOSED', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ ...HUMAN_FIGHT, tradingState: 'CLOSED' })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(400)
  })

  // --- League mismatch ---

  it('returns 403 when human user tries to trade on AGENT fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(AGENT_FIGHT)

    const res = await POST(postRequest(orderBody({ fightId: 'fight-2' })))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('League mismatch')
  })

  it('returns 403 when agent user tries to trade on HUMAN fight', async () => {
    mockRequireAnyRole.mockResolvedValue(AGENT_USER)

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('League mismatch')
  })

  // --- Credit check ---

  it('returns 409 when user has insufficient credits', async () => {
    mockRequireAnyRole.mockResolvedValue({ ...HUMAN_USER, credits: 10 })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toContain('Insufficient credits')
  })

  // --- Position limit ---

  it('returns 409 when position limit is exceeded', async () => {
    mockCheckPositionLimit.mockImplementation(() => {
      throw new PositionLimitError('Position limit exceeded: 20000¢ > 10000¢ (LOCAL)')
    })

    const res = await POST(postRequest(orderBody()))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toContain('Position limit exceeded')
  })

  it('passes existing position to checkPositionLimit', async () => {
    const existingPos = { id: 'p1', userId: 'u1', fightId: 'fight-1', side: 'YES', quantity: 5, avgCostBasis: 50 }
    mockPrisma.position.findUnique.mockResolvedValue(existingPos)

    await POST(postRequest(orderBody()))

    expect(mockCheckPositionLimit).toHaveBeenCalledWith(
      expect.objectContaining({ existingPosition: existingPos })
    )
  })

  // --- Matching engine errors ---

  it('returns 400 when matching engine rejects (no liquidity)', async () => {
    mockMatchOrder.mockRejectedValue(new MatchingError('No liquidity available for market order'))

    const res = await POST(postRequest(orderBody({ type: 'MARKET' })))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No liquidity')
  })

  // --- Transaction isolation ---

  it('calls $transaction with Serializable isolation', async () => {
    await POST(postRequest(orderBody()))

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' }
    )
  })

  // --- Fee rate computation ---

  it('passes agent bankroll to checkPositionLimit for agent users', async () => {
    mockRequireAnyRole.mockResolvedValue(AGENT_USER)
    mockPrisma.fight.findUnique.mockResolvedValue(AGENT_FIGHT)

    await POST(postRequest(orderBody({ fightId: 'fight-2' })))

    expect(mockCheckPositionLimit).toHaveBeenCalledWith(
      expect.objectContaining({ agentBankroll: 50_000, league: 'AGENT' })
    )
  })
})

// ── Fixtures for GET/DELETE ──────────────────────────────────────────────────

const ORDER_1 = {
  id: 'o1',
  userId: 'u1',
  fightId: 'fight-1',
  league: 'HUMAN',
  side: 'YES',
  type: 'LIMIT',
  price: 60,
  quantity: 10,
  filledQty: 0,
  remainingQty: 10,
  status: 'OPEN',
  feeRate: 200,
  totalFees: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  cancelledAt: null,
  expiresAt: null,
}

const PARTIALLY_FILLED_ORDER = {
  ...ORDER_1,
  id: 'o2',
  filledQty: 4,
  remainingQty: 6,
  status: 'PARTIALLY_FILLED',
}

const FILLED_ORDER = {
  ...ORDER_1,
  id: 'o3',
  filledQty: 10,
  remainingQty: 0,
  status: 'FILLED',
}

function getRequest(queryString = '') {
  return createRequest(`/api/orders${queryString}`, { method: 'GET' })
}

// ── GET /api/orders ─────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
  it('returns user orders with default limit', async () => {
    mockPrisma.order.findMany.mockResolvedValue([ORDER_1])

    const res = await GET(getRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('o1')
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    )
  })

  it('filters by fightId query param', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])

    await GET(getRequest('?fightId=fight-1'))

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', fightId: 'fight-1' },
      })
    )
  })

  it('filters by status query param', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])

    await GET(getRequest('?status=OPEN'))

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', status: 'OPEN' },
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue({
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const res = await GET(getRequest())
    expect(res.status).toBe(401)
  })
})

// ── GET /api/orders/:id ─────────────────────────────────────────────────────

describe('GET /api/orders/:id', () => {
  it('returns order with fills', async () => {
    const orderWithFills = { ...ORDER_1, makerFills: [], takerFills: [{ id: 't1', price: 60, quantity: 5 }] }
    mockPrisma.order.findUnique.mockResolvedValue(orderWithFills)

    const res = await GET_BY_ID(
      createRequest('/api/orders/o1', { method: 'GET' }),
      params('o1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('o1')
    expect(data.takerFills).toHaveLength(1)
  })

  it('returns 404 when order does not exist', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)

    const res = await GET_BY_ID(
      createRequest('/api/orders/nonexistent', { method: 'GET' }),
      params('nonexistent')
    )
    expect(res.status).toBe(404)
  })

  it('returns 404 when order belongs to another user', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...ORDER_1, userId: 'other-user' })

    const res = await GET_BY_ID(
      createRequest('/api/orders/o1', { method: 'GET' }),
      params('o1')
    )
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/orders/:id ──────────────────────────────────────────────────

describe('DELETE /api/orders/:id', () => {
  it('cancels an OPEN order and refunds credits', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(ORDER_1)
    const cancelledOrder = { ...ORDER_1, status: 'CANCELLED', remainingQty: 0, cancelledAt: new Date() }
    mockPrisma.order.update.mockResolvedValue(cancelledOrder)
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 100_600 })
    mockPrisma.creditTransaction.create.mockResolvedValue({})

    const res = await DELETE_BY_ID(
      createRequest('/api/orders/o1', { method: 'DELETE' }),
      params('o1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('CANCELLED')
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('cancels a PARTIALLY_FILLED order and refunds remaining', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(PARTIALLY_FILLED_ORDER)
    const cancelledOrder = { ...PARTIALLY_FILLED_ORDER, status: 'CANCELLED', remainingQty: 0 }
    mockPrisma.order.update.mockResolvedValue(cancelledOrder)
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 100_360 })
    mockPrisma.creditTransaction.create.mockResolvedValue({})

    const res = await DELETE_BY_ID(
      createRequest('/api/orders/o2', { method: 'DELETE' }),
      params('o2')
    )

    expect(res.status).toBe(200)
  })

  it('returns 400 when cancelling a FILLED order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(FILLED_ORDER)

    const res = await DELETE_BY_ID(
      createRequest('/api/orders/o3', { method: 'DELETE' }),
      params('o3')
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('Cannot cancel order with status FILLED')
  })

  it('returns 404 when order does not exist', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)

    const res = await DELETE_BY_ID(
      createRequest('/api/orders/nonexistent', { method: 'DELETE' }),
      params('nonexistent')
    )
    expect(res.status).toBe(404)
  })

  it('returns 404 when order belongs to another user', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...ORDER_1, userId: 'other-user' })

    const res = await DELETE_BY_ID(
      createRequest('/api/orders/o1', { method: 'DELETE' }),
      params('o1')
    )
    expect(res.status).toBe(404)
  })

  it('creates CreditTransaction for refunded amount', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(ORDER_1)
    mockPrisma.order.update.mockResolvedValue({ ...ORDER_1, status: 'CANCELLED' })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 100_600 })
    mockPrisma.creditTransaction.create.mockResolvedValue({})

    await DELETE_BY_ID(
      createRequest('/api/orders/o1', { method: 'DELETE' }),
      params('o1')
    )

    expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        type: 'ORDER_CANCEL',
        amount: 600, // 10 remaining × 60¢
        fee: 0,
        balanceAfter: 100_600,
        relatedId: 'o1',
        relatedType: 'order',
      }),
    })
  })
})
