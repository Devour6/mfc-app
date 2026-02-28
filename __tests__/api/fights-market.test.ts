/**
 * @jest-environment node
 */
import { mockPrisma, createRequest, params } from './helpers'

import { GET as getOrderbook } from '@/app/api/fights/[id]/orderbook/route'
import { GET as getTrades } from '@/app/api/fights/[id]/trades/route'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FIGHT = { id: 'fight-1' }

const OPEN_ORDERS = [
  { side: 'YES', price: 60, remainingQty: 10 },
  { side: 'YES', price: 60, remainingQty: 5 },
  { side: 'YES', price: 55, remainingQty: 20 },
  { side: 'NO', price: 40, remainingQty: 15 },
  { side: 'NO', price: 35, remainingQty: 8 },
]

const TAPE_TRADES = [
  { id: 't1', price: 62, quantity: 3, createdAt: new Date('2026-02-28T12:00:00Z') },
  { id: 't2', price: 60, quantity: 5, createdAt: new Date('2026-02-28T11:00:00Z') },
  { id: 't3', price: 55, quantity: 10, createdAt: new Date('2026-02-28T10:00:00Z') },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.fight.findUnique.mockResolvedValue(FIGHT)
  mockPrisma.order.findMany.mockResolvedValue(OPEN_ORDERS)
  mockPrisma.trade.findMany.mockResolvedValue(TAPE_TRADES)
})

// ── GET /api/fights/[id]/orderbook ──────────────────────────────────────────

describe('GET /api/fights/[id]/orderbook', () => {
  it('returns aggregated order book depth sorted by price desc', async () => {
    const res = await getOrderbook(
      createRequest('/api/fights/fight-1/orderbook'),
      params('fight-1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    // YES: 60 = 10+5 = 15, 55 = 20 — sorted desc
    expect(data.yes).toEqual([
      { price: 60, quantity: 15 },
      { price: 55, quantity: 20 },
    ])
    // NO: 40 = 15, 35 = 8 — sorted desc
    expect(data.no).toEqual([
      { price: 40, quantity: 15 },
      { price: 35, quantity: 8 },
    ])
  })

  it('returns empty arrays when no open orders exist', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])

    const res = await getOrderbook(
      createRequest('/api/fights/fight-1/orderbook'),
      params('fight-1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ yes: [], no: [] })
  })

  it('returns 404 for non-existent fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(null)

    const res = await getOrderbook(
      createRequest('/api/fights/nope/orderbook'),
      params('nope')
    )

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('not found')
  })

  it('only queries OPEN and PARTIALLY_FILLED orders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])

    await getOrderbook(
      createRequest('/api/fights/fight-1/orderbook'),
      params('fight-1')
    )

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fightId: 'fight-1',
          status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        },
      })
    )
  })
})

// ── GET /api/fights/[id]/trades ─────────────────────────────────────────────

describe('GET /api/fights/[id]/trades', () => {
  it('returns recent trades newest first with default limit', async () => {
    const res = await getTrades(
      createRequest('/api/fights/fight-1/trades'),
      params('fight-1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(3)
    expect(data[0].id).toBe('t1')
    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fightId: 'fight-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    )
  })

  it('respects custom limit param', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([TAPE_TRADES[0]])

    const res = await getTrades(
      createRequest('/api/fights/fight-1/trades?limit=1'),
      params('fight-1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    )
  })

  it('returns 404 for non-existent fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(null)

    const res = await getTrades(
      createRequest('/api/fights/nope/trades'),
      params('nope')
    )

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('not found')
  })

  it('returns 400 for invalid limit', async () => {
    const res = await getTrades(
      createRequest('/api/fights/fight-1/trades?limit=0'),
      params('fight-1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })

  it('does not expose user IDs in public trade tape', async () => {
    const res = await getTrades(
      createRequest('/api/fights/fight-1/trades'),
      params('fight-1')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    // Select only includes id, price, quantity, createdAt — no user fields
    expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          price: true,
          quantity: true,
          createdAt: true,
        },
      })
    )
  })
})
