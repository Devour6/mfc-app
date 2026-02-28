/**
 * @jest-environment node
 */
import {
  mockPrisma,
  mockRequireAnyRole,
  createRequest,
  params,
} from './helpers'

// Mock matching engine for CONTRACT_PAYOUT_CENTS import
jest.mock('@/lib/matching-engine', () => ({
  CONTRACT_PAYOUT_CENTS: 100,
}))

import { GET } from '@/app/api/positions/route'
import { GET as GET_BY_ID } from '@/app/api/positions/[id]/route'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const HUMAN_USER = { id: 'u1', auth0Id: 'auth0|test', credits: 100_000, isAgent: false }

const POSITION_1 = {
  id: 'p1',
  userId: 'u1',
  fightId: 'fight-1',
  league: 'HUMAN',
  side: 'YES',
  quantity: 10,
  avgCostBasis: 60,
  realizedPnl: 0,
  settlementPnl: null,
  settled: false,
  createdAt: new Date('2026-02-28T10:00:00Z'),
  updatedAt: new Date('2026-02-28T10:00:00Z'),
  settledAt: null,
}

const SETTLED_POSITION = {
  ...POSITION_1,
  id: 'p2',
  fightId: 'fight-2',
  settled: true,
  settlementPnl: 400,
  settledAt: new Date('2026-02-28T12:00:00Z'),
}

function getRequest(queryString = '') {
  return createRequest(`/api/positions${queryString}`, { method: 'GET' })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue(HUMAN_USER)
  mockPrisma.position.findMany.mockResolvedValue([POSITION_1])
  mockPrisma.position.findUnique.mockResolvedValue(POSITION_1)
  mockPrisma.trade.findFirst.mockResolvedValue(null)
})

// ── GET /api/positions ──────────────────────────────────────────────────────

describe('GET /api/positions', () => {
  it('returns user positions with default limit', async () => {
    const res = await GET(getRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('p1')
    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })
    )
  })

  it('filters by fightId query param', async () => {
    mockPrisma.position.findMany.mockResolvedValue([POSITION_1])

    await GET(getRequest('?fightId=fight-1'))

    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', fightId: 'fight-1' },
      })
    )
  })

  it('filters by settled=true', async () => {
    mockPrisma.position.findMany.mockResolvedValue([SETTLED_POSITION])

    await GET(getRequest('?settled=true'))

    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', settled: true },
      })
    )
  })

  it('filters by settled=false', async () => {
    mockPrisma.position.findMany.mockResolvedValue([POSITION_1])

    await GET(getRequest('?settled=false'))

    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', settled: false },
      })
    )
  })

  it('returns empty array when user has no positions', async () => {
    mockPrisma.position.findMany.mockResolvedValue([])

    const res = await GET(getRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue({
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const res = await GET(getRequest())
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid limit param', async () => {
    const res = await GET(getRequest('?limit=0'))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })

  it('combines fightId and settled filters', async () => {
    mockPrisma.position.findMany.mockResolvedValue([])

    await GET(getRequest('?fightId=fight-1&settled=false'))

    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', fightId: 'fight-1', settled: false },
      })
    )
  })
})

// ── GET /api/positions/:id ──────────────────────────────────────────────────

describe('GET /api/positions/:id', () => {
  it('returns unsettled position with unrealizedPnl from latest trade', async () => {
    mockPrisma.trade.findFirst.mockResolvedValue({ price: 75 })

    const res = await GET_BY_ID(
      createRequest('/api/positions/p1', { method: 'GET' }),
      params('p1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('p1')
    // YES position: unrealizedPnl = (75 - 60) * 10 = 150
    expect(data.unrealizedPnl).toBe(150)
  })

  it('uses avgCostBasis as fallback when no trades exist', async () => {
    mockPrisma.trade.findFirst.mockResolvedValue(null)

    const res = await GET_BY_ID(
      createRequest('/api/positions/p1', { method: 'GET' }),
      params('p1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    // No latest trade → currentPrice = avgCostBasis → unrealizedPnl = 0
    expect(data.unrealizedPnl).toBe(0)
  })

  it('returns settled position with unrealizedPnl = 0', async () => {
    mockPrisma.position.findUnique.mockResolvedValue(SETTLED_POSITION)

    const res = await GET_BY_ID(
      createRequest('/api/positions/p2', { method: 'GET' }),
      params('p2')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.settled).toBe(true)
    expect(data.unrealizedPnl).toBe(0)
    expect(data.settlementPnl).toBe(400)
    // Should NOT query trades for settled positions
    expect(mockPrisma.trade.findFirst).not.toHaveBeenCalled()
  })

  it('computes unrealizedPnl for NO position correctly', async () => {
    const noPosition = {
      ...POSITION_1,
      id: 'p-no',
      side: 'NO',
      avgCostBasis: 40,
    }
    mockPrisma.position.findUnique.mockResolvedValue(noPosition)
    mockPrisma.trade.findFirst.mockResolvedValue({ price: 70 })

    const res = await GET_BY_ID(
      createRequest('/api/positions/p-no', { method: 'GET' }),
      params('p-no')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    // NO side: unrealizedPnl = ((100 - 70) - 40) * 10 = (30 - 40) * 10 = -100
    expect(data.unrealizedPnl).toBe(-100)
  })

  it('returns 404 when position does not exist', async () => {
    mockPrisma.position.findUnique.mockResolvedValue(null)

    const res = await GET_BY_ID(
      createRequest('/api/positions/nonexistent', { method: 'GET' }),
      params('nonexistent')
    )
    expect(res.status).toBe(404)
  })

  it('returns 404 when position belongs to another user', async () => {
    mockPrisma.position.findUnique.mockResolvedValue({ ...POSITION_1, userId: 'other-user' })

    const res = await GET_BY_ID(
      createRequest('/api/positions/p1', { method: 'GET' }),
      params('p1')
    )
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue({
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const res = await GET_BY_ID(
      createRequest('/api/positions/p1', { method: 'GET' }),
      params('p1')
    )
    expect(res.status).toBe(401)
  })
})
