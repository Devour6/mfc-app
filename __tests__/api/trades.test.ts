/**
 * @jest-environment node
 */
import {
  mockPrisma,
  mockRequireAnyRole,
  createRequest,
} from './helpers'

import { GET } from '@/app/api/trades/route'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const HUMAN_USER = { id: 'u1', auth0Id: 'auth0|test', credits: 100_000, isAgent: false }

const TRADE_1 = {
  id: 't1',
  fightId: 'fight-1',
  league: 'HUMAN',
  price: 60,
  quantity: 5,
  makerOrderId: 'o1',
  takerOrderId: 'o2',
  makerUserId: 'u1',
  takerUserId: 'u2',
  makerFee: 6,
  takerFee: 6,
  createdAt: new Date('2026-02-28T10:00:00Z'),
}

const TRADE_2 = {
  ...TRADE_1,
  id: 't2',
  fightId: 'fight-2',
  price: 45,
  quantity: 10,
  makerUserId: 'u3',
  takerUserId: 'u1',
  createdAt: new Date('2026-02-28T11:00:00Z'),
}

function getRequest(queryString = '') {
  return createRequest(`/api/trades${queryString}`, { method: 'GET' })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue(HUMAN_USER)
  mockPrisma.trade.findMany.mockResolvedValue([TRADE_1, TRADE_2])
})

// ── GET /api/trades ─────────────────────────────────────────────────────────

describe('GET /api/trades', () => {
  it('returns user trades with default limit', async () => {
    const res = await GET(getRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].id).toBe('t1')
    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { makerUserId: 'u1' },
            { takerUserId: 'u1' },
          ],
        }),
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    )
  })

  it('filters by fightId query param', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([TRADE_1])

    const res = await GET(getRequest('?fightId=fight-1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fightId: 'fight-1',
        }),
      })
    )
  })

  it('respects custom limit param', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([TRADE_1])

    await GET(getRequest('?limit=5'))

    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })

  it('returns empty array when user has no trades', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([])

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

  it('returns 400 for limit exceeding max', async () => {
    const res = await GET(getRequest('?limit=200'))
    expect(res.status).toBe(400)
  })

  it('returns trades where user is taker', async () => {
    const takerTrade = { ...TRADE_1, makerUserId: 'other-user', takerUserId: 'u1' }
    mockPrisma.trade.findMany.mockResolvedValue([takerTrade])

    const res = await GET(getRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].takerUserId).toBe('u1')
  })

  it('combines fightId filter with user OR condition', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([])

    await GET(getRequest('?fightId=fight-1'))

    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { makerUserId: 'u1' },
            { takerUserId: 'u1' },
          ],
          fightId: 'fight-1',
        }),
      })
    )
  })
})
