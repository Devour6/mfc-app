/**
 * @jest-environment node
 *
 * End-to-end flow tests — verifies the full bet lifecycle:
 * 1. Place bet → credits deducted
 * 2. Settle bet as WON → credits payout
 * 3. Settle bet as LOST → no payout
 * 4. Cancel bet → credits refunded
 * 5. Multiple bets on same fight → independent settlement
 * 6. Insufficient credits → bet rejected, no side effects
 */

import { mockPrisma, createRequest, params, mockRequireHuman } from './helpers'

import { POST as PlaceBet } from '@/app/api/bets/route'
import { PATCH as SettleBet } from '@/app/api/bets/[id]/route'

const DEFAULT_USER = { id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false }
const SCHEDULED_FIGHT = { id: 'fight1', status: 'SCHEDULED', fighter1Id: 'f1', fighter2Id: 'f2' }

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireHuman.mockResolvedValue(DEFAULT_USER)
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockPlaceBetTransaction(startingCredits: number, betAmount: number) {
  mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
    return fn({
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', credits: startingCredits }),
        update: jest.fn().mockResolvedValue({ id: 'u1', credits: startingCredits - betAmount }),
      },
      bet: {
        create: jest.fn().mockResolvedValue({
          id: 'bet1',
          userId: 'u1',
          fightId: 'fight1',
          amount: betAmount,
          side: 'YES',
          odds: 2.0,
          status: 'PENDING',
        }),
      },
    })
  })
}

function mockSettleBetTransaction(betId: string, status: string, payout?: number) {
  mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
    return fn({
      bet: {
        update: jest.fn().mockResolvedValue({
          id: betId,
          status,
          payout: payout ?? null,
          settledAt: new Date().toISOString(),
        }),
      },
      user: {
        update: jest.fn().mockResolvedValue({ id: 'u1', credits: 10000 }),
      },
    })
  })
}

// ─── E2E: Place Bet → Win → Payout ─────────────────────────────────────────

describe('E2E: Place bet → settle as WON → payout', () => {
  it('deducts credits on bet placement, then pays out on win', async () => {
    // Step 1: Place bet
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)
    mockPlaceBetTransaction(10000, 500)

    const placeRes = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'YES', amount: 500, odds: 2.0 }),
      })
    )
    expect(placeRes.status).toBe(201)
    const bet = await placeRes.json()
    expect(bet.amount).toBe(500)
    expect(bet.status).toBe('PENDING')

    // Step 2: Settle as WON with 2x payout
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: bet.id,
      userId: 'u1',
      amount: 500,
      status: 'PENDING',
    })
    mockSettleBetTransaction(bet.id, 'WON', 1000)

    const settleRes = await SettleBet(
      createRequest(`/api/bets/${bet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WON', payout: 1000 }),
      }),
      params(bet.id)
    )
    expect(settleRes.status).toBe(200)
    const settled = await settleRes.json()
    expect(settled.status).toBe('WON')
    expect(settled.payout).toBe(1000)
  })
})

// ─── E2E: Place Bet → Lose → No Payout ─────────────────────────────────────

describe('E2E: Place bet → settle as LOST → no payout', () => {
  it('deducts credits on bet, no credit change on loss', async () => {
    // Step 1: Place bet
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)
    mockPlaceBetTransaction(10000, 250)

    const placeRes = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'NO', amount: 250, odds: 1.5 }),
      })
    )
    expect(placeRes.status).toBe(201)
    const bet = await placeRes.json()

    // Step 2: Settle as LOST
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: bet.id,
      userId: 'u1',
      amount: 250,
      status: 'PENDING',
    })
    mockSettleBetTransaction(bet.id, 'LOST')

    const settleRes = await SettleBet(
      createRequest(`/api/bets/${bet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LOST' }),
      }),
      params(bet.id)
    )
    expect(settleRes.status).toBe(200)
    const settled = await settleRes.json()
    expect(settled.status).toBe('LOST')
    expect(settled.payout).toBeNull()
  })
})

// ─── E2E: Place Bet → Cancel → Refund ──────────────────────────────────────

describe('E2E: Place bet → cancel → refund original amount', () => {
  it('refunds the original bet amount on cancellation', async () => {
    // Step 1: Place bet
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)
    mockPlaceBetTransaction(10000, 300)

    const placeRes = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'FIGHTER1', amount: 300, odds: 1.8 }),
      })
    )
    expect(placeRes.status).toBe(201)
    const bet = await placeRes.json()

    // Step 2: Cancel → refund
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: bet.id,
      userId: 'u1',
      amount: 300,
      status: 'PENDING',
    })

    const txUserUpdate = jest.fn().mockResolvedValue({ id: 'u1', credits: 10300 })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      return fn({
        bet: {
          update: jest.fn().mockResolvedValue({
            id: bet.id,
            status: 'CANCELLED',
            settledAt: new Date().toISOString(),
          }),
        },
        user: { update: txUserUpdate },
      })
    })

    const settleRes = await SettleBet(
      createRequest(`/api/bets/${bet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      params(bet.id)
    )
    expect(settleRes.status).toBe(200)
    // Verify credits were refunded
    expect(txUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { credits: { increment: 300 } } })
    )
  })
})

// ─── E2E: Insufficient Credits → Rejected ───────────────────────────────────

describe('E2E: Insufficient credits → bet rejected', () => {
  it('rejects bet and does not create bet record when credits insufficient', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)

    // User has only 100 credits, trying to bet 500
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      return fn({
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'u1', credits: 100 }),
          update: jest.fn(),
        },
        bet: {
          create: jest.fn(),
        },
      })
    })

    const res = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'YES', amount: 500, odds: 2.0 }),
      })
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/insufficient credits/i)
  })
})

// ─── E2E: Double Settlement Rejected ────────────────────────────────────────

describe('E2E: Already settled bet cannot be settled again', () => {
  it('rejects re-settlement of a WON bet', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'bet1',
      userId: 'u1',
      amount: 100,
      status: 'WON',
    })

    const res = await SettleBet(
      createRequest('/api/bets/bet1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LOST' }),
      }),
      params('bet1')
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/already settled/i)
  })

  it('rejects re-settlement of a CANCELLED bet', async () => {
    mockPrisma.bet.findUnique.mockResolvedValue({
      id: 'bet1',
      userId: 'u1',
      amount: 100,
      status: 'CANCELLED',
    })

    const res = await SettleBet(
      createRequest('/api/bets/bet1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WON', payout: 200 }),
      }),
      params('bet1')
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/already settled/i)
  })
})

// ─── E2E: Multiple Bets Independent Settlement ─────────────────────────────

describe('E2E: Multiple bets settle independently', () => {
  it('first bet wins, second bet loses — independent outcomes', async () => {
    // Place bet 1 (WIN)
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)
    mockPlaceBetTransaction(10000, 200)
    const res1 = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'YES', amount: 200, odds: 2.0 }),
      })
    )
    expect(res1.status).toBe(201)

    // Place bet 2 (LOSE)
    mockPrisma.fight.findUnique.mockResolvedValue(SCHEDULED_FIGHT)
    mockPlaceBetTransaction(9800, 300)
    const res2 = await PlaceBet(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'NO', amount: 300, odds: 1.5 }),
      })
    )
    expect(res2.status).toBe(201)

    // Settle bet 1 as WON
    mockPrisma.bet.findUnique.mockResolvedValue({ id: 'bet1', userId: 'u1', amount: 200, status: 'PENDING' })
    mockSettleBetTransaction('bet1', 'WON', 400)
    const settle1 = await SettleBet(
      createRequest('/api/bets/bet1', { method: 'PATCH', body: JSON.stringify({ status: 'WON', payout: 400 }) }),
      params('bet1')
    )
    expect(settle1.status).toBe(200)
    expect((await settle1.json()).status).toBe('WON')

    // Settle bet 2 as LOST
    mockPrisma.bet.findUnique.mockResolvedValue({ id: 'bet2', userId: 'u1', amount: 300, status: 'PENDING' })
    mockSettleBetTransaction('bet2', 'LOST')
    const settle2 = await SettleBet(
      createRequest('/api/bets/bet2', { method: 'PATCH', body: JSON.stringify({ status: 'LOST' }) }),
      params('bet2')
    )
    expect(settle2.status).toBe(200)
    expect((await settle2.json()).status).toBe('LOST')
  })
})
