/**
 * @jest-environment node
 */
import { mockPrisma, createRequest, params } from './helpers'

import { GET, POST } from '@/app/api/bets/route'
import { GET as GET_BY_ID, PATCH } from '@/app/api/bets/[id]/route'

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/bets ──────────────────────────────────────────────────────────

describe('GET /api/bets', () => {
  it('returns bets with filters', async () => {
    const bets = [{ id: 'b1', amount: 100, status: 'PENDING' }]
    mockPrisma.bet.findMany.mockResolvedValue(bets)

    const res = await GET(createRequest('/api/bets?userId=u1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(bets)
    expect(mockPrisma.bet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) })
    )
  })
})

// ─── POST /api/bets — Place bet ────────────────────────────────────────────

describe('POST /api/bets', () => {
  it('places a bet and deducts credits', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'SCHEDULED', fighter1Id: 'f1', fighter2Id: 'f2',
    })
    const createdBet = { id: 'b1', userId: 'u1', fightId: 'fight1', amount: 50, side: 'YES', odds: 2.0, status: 'PENDING' }
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 1000 })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 950 })
    mockPrisma.bet.create.mockResolvedValue(createdBet)

    const res = await POST(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', fightId: 'fight1', side: 'YES', amount: 50, odds: 2.0 }),
      })
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.amount).toBe(50)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { credits: { decrement: 50 } } })
    )
  })

  it('rejects bet on completed fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'COMPLETED' })

    const res = await POST(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', fightId: 'fight1', side: 'YES', amount: 50, odds: 2.0 }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/scheduled or live/i)
  })

  it('rejects if fighter not in fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'SCHEDULED', fighter1Id: 'f1', fighter2Id: 'f2',
    })

    const res = await POST(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'u1', fightId: 'fight1', fighterId: 'f3', side: 'YES', amount: 50, odds: 2.0,
        }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/not in this fight/i)
  })

  it('rejects if insufficient credits', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'SCHEDULED', fighter1Id: 'f1', fighter2Id: 'f2',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 10 })

    const res = await POST(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', fightId: 'fight1', side: 'YES', amount: 500, odds: 2.0 }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/insufficient credits/i)
  })
})

// ─── PATCH /api/bets/:id — Settle bet ──────────────────────────────────────

describe('PATCH /api/bets/:id (settle)', () => {
  it('settles a WON bet and credits payout', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'b1', userId: 'u1', amount: 50, status: 'PENDING',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.bet.update.mockResolvedValue({
      id: 'b1', status: 'WON', payout: 100, settledAt: new Date(),
    })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 1100 })

    const res = await PATCH(
      createRequest('/api/bets/b1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WON', payout: 100 }),
      }),
      params('b1')
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('WON')
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { credits: { increment: 100 } } })
    )
  })

  it('settles a LOST bet without payout', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'b1', userId: 'u1', amount: 50, status: 'PENDING',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.bet.update.mockResolvedValue({ id: 'b1', status: 'LOST', payout: null })

    const res = await PATCH(
      createRequest('/api/bets/b1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LOST' }),
      }),
      params('b1')
    )

    expect(res.status).toBe(200)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('refunds original amount on CANCELLED', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'b1', userId: 'u1', amount: 50, status: 'PENDING',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.bet.update.mockResolvedValue({ id: 'b1', status: 'CANCELLED' })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 1050 })

    const res = await PATCH(
      createRequest('/api/bets/b1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      params('b1')
    )

    expect(res.status).toBe(200)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { credits: { increment: 50 } } })
    )
  })

  it('rejects settling an already-settled bet', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'b1', userId: 'u1', amount: 50, status: 'WON',
    })

    const res = await PATCH(
      createRequest('/api/bets/b1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LOST' }),
      }),
      params('b1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/already settled/i)
  })
})
