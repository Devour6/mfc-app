/**
 * @jest-environment jsdom
 *
 * Credit safety tests — verifies:
 * 1. placeBetAndDeduct deducts correct amount
 * 2. Insufficient balance rejects bet/trade
 * 3. Atomic balance check prevents TOCTOU double-spend
 */

// Mock all the heavy dependencies the store imports
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

// Helper to reset store between tests
function resetStore(credits: number) {
  useGameStore.setState(state => ({
    user: { ...state.user, credits },
  }))
}

describe('placeBetAndDeduct — credit safety', () => {
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
    // Two rapid calls that each try to spend 100
    const r1 = useGameStore.getState().placeBetAndDeduct(100, 'bet 1')
    const r2 = useGameStore.getState().placeBetAndDeduct(100, 'bet 2')

    // Exactly one should succeed, one should fail
    expect(r1).toBe(true)
    expect(r2).toBe(false)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('handles many rapid calls without over-deducting', () => {
    resetStore(500)
    const results: boolean[] = []
    // Fire 10 bets of 100 each — only 5 should succeed
    for (let i = 0; i < 10; i++) {
      results.push(useGameStore.getState().placeBetAndDeduct(100, `bet ${i}`))
    }
    const successes = results.filter(Boolean).length
    expect(successes).toBe(5)
    expect(useGameStore.getState().user.credits).toBe(0)
  })

  it('handles fractional amounts correctly', () => {
    resetStore(100)
    const result = useGameStore.getState().placeBetAndDeduct(33.33, 'fractional')
    expect(result).toBe(true)
    expect(useGameStore.getState().user.credits).toBeCloseTo(66.67, 2)
  })
})
