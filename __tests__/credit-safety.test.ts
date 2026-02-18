/**
 * @jest-environment jsdom
 *
 * Credit safety tests — verifies:
 * 1. placeBetAndDeduct deducts correct amount
 * 2. Insufficient balance rejects bet/trade
 * 3. Atomic balance check prevents TOCTOU double-spend
 * 4. API wiring: calls placeBet on success with betDetails, rollback on failure
 */

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockPlaceBet = jest.fn()
jest.mock('@/lib/api-client', () => ({
  placeBet: (...args: unknown[]) => mockPlaceBet(...args),
}))

jest.mock('@/lib/evolution-engine', () => ({
  FighterEvolutionEngine: {
    createNewEvolution: () => ({
      age: 25,
      peakAge: 30,
      traits: { aggressive: 50, defensive: 50, showboat: 50, technical: 50 },
      signatureMoves: [],
      fightHistory: [],
    }),
  },
}))

jest.mock('@/lib/tournament-engine', () => ({
  TournamentEngine: { createTournament: jest.fn(), advanceTournament: jest.fn() },
}))

jest.mock('@/lib/achievement-engine', () => ({
  AchievementEngine: {
    initializeAchievements: () => [],
    checkFightAchievements: () => ({ updatedAchievements: [], newUnlocks: [] }),
    checkTournamentAchievements: () => ({ updatedAchievements: [], newUnlocks: [] }),
    checkCollectionAchievements: () => ({ updatedAchievements: [], newUnlocks: [] }),
    createNotification: jest.fn(),
  },
}))

jest.mock('@/lib/daily-rewards-engine', () => ({
  DailyRewardsEngine: {
    createNewLoginStreak: () => ({
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: null,
      totalLogins: 0,
    }),
    processLogin: jest.fn(),
  },
}))

jest.mock('@/lib/credit-engine', () => ({
  CreditEngine: {
    createInitialBalance: () => ({
      available: 0,
      locked: 0,
      total: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
    }),
    createInitialWallet: () => ({
      connected: false,
      address: null,
      balance: null,
    }),
    processReward: jest.fn().mockReturnValue({
      newBalance: { available: 0, locked: 0, total: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      newTransactions: [],
    }),
  },
}))

import { useGameStore } from '@/lib/store'

// ─── Helpers ────────────────────────────────────────────────────────────────

function resetStore(credits: number) {
  useGameStore.setState(state => ({
    user: { ...state.user, credits },
  }))
}

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

const testBetDetails = {
  fightId: 'fight-1',
  side: 'YES' as const,
  odds: 1.8,
  fighterId: 'fighter-1',
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('placeBetAndDeduct — credit safety', () => {
  beforeEach(() => {
    mockPlaceBet.mockReset()
  })

  it('deducts the correct amount on success', () => {
    resetStore(1000)
    const result = useGameStore.getState().placeBetAndDeduct(250, 'test bet')
    expect(result).toBe(true)
    expect(useGameStore.getState().user.credits).toBe(750)
  })

  it('returns false and does not deduct when balance is insufficient', () => {
    resetStore(100)
    const result = useGameStore.getState().placeBetAndDeduct(200, 'too expensive')
    expect(result).toBe(false)
    expect(useGameStore.getState().user.credits).toBe(100)
  })

  it('returns false when balance is exactly zero', () => {
    resetStore(0)
    const result = useGameStore.getState().placeBetAndDeduct(1, 'broke')
    expect(result).toBe(false)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('succeeds when bet amount equals exact balance', () => {
    resetStore(500)
    const result = useGameStore.getState().placeBetAndDeduct(500, 'all in')
    expect(result).toBe(true)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('prevents double-spend on rapid sequential calls (TOCTOU fix)', () => {
    resetStore(100)
    const r1 = useGameStore.getState().placeBetAndDeduct(100, 'bet 1')
    const r2 = useGameStore.getState().placeBetAndDeduct(100, 'bet 2')

    expect(r1).toBe(true)
    expect(r2).toBe(false)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('handles many rapid calls without over-deducting', () => {
    resetStore(500)
    const results: boolean[] = []
    for (let i = 0; i < 10; i++) {
      results.push(useGameStore.getState().placeBetAndDeduct(100, `bet ${i}`))
    }
    expect(results.filter(Boolean).length).toBe(5)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('handles fractional amounts correctly', () => {
    resetStore(100)
    const result = useGameStore.getState().placeBetAndDeduct(33.33, 'fractional')
    expect(result).toBe(true)
    expect(useGameStore.getState().user.credits).toBeCloseTo(66.67, 2)
  })
})

describe('placeBetAndDeduct — API wiring', () => {
  beforeEach(() => {
    mockPlaceBet.mockReset()
    // Mock global fetch for fetchCredits
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ credits: 750 }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does NOT call API when no betDetails provided', () => {
    resetStore(1000)
    useGameStore.getState().placeBetAndDeduct(100, 'local only')
    expect(mockPlaceBet).not.toHaveBeenCalled()
  })

  it('calls placeBet API with correct params when betDetails provided', () => {
    mockPlaceBet.mockResolvedValue({ id: 'bet-1', status: 'PENDING' })
    resetStore(1000)
    useGameStore.getState().placeBetAndDeduct(100, 'api bet', testBetDetails)
    expect(mockPlaceBet).toHaveBeenCalledWith({
      fightId: 'fight-1',
      side: 'YES',
      amount: 100,
      odds: 1.8,
      fighterId: 'fighter-1',
    })
  })

  it('syncs credits from server after successful API call', async () => {
    mockPlaceBet.mockResolvedValue({ id: 'bet-1', status: 'PENDING' })
    resetStore(1000)
    useGameStore.getState().placeBetAndDeduct(100, 'api bet', testBetDetails)
    await flushPromises()
    // fetchCredits calls global.fetch('/api/user/credits')
    expect(global.fetch).toHaveBeenCalledWith('/api/user/credits')
  })

  it('fetches authoritative balance on API failure (no blind rollback)', async () => {
    mockPlaceBet.mockRejectedValue(new Error('Network error'))
    // Server still has 1000 (API call failed, no server-side deduction)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ credits: 1000 }),
    })
    resetStore(1000)
    useGameStore.getState().placeBetAndDeduct(250, 'failing bet', testBetDetails)
    // Immediately after, credits are optimistically deducted
    expect(useGameStore.getState().user.credits).toBe(750)
    // After promise settles, fetchCredits restores from server
    await flushPromises()
    expect(useGameStore.getState().user.credits).toBe(1000)
  })

  it('does NOT call API when balance is insufficient', () => {
    mockPlaceBet.mockResolvedValue({ id: 'bet-1' })
    resetStore(50)
    useGameStore.getState().placeBetAndDeduct(100, 'too expensive', testBetDetails)
    expect(mockPlaceBet).not.toHaveBeenCalled()
  })
})
