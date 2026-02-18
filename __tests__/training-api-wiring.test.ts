/**
 * @jest-environment jsdom
 *
 * Training credit deduction tests — verifies:
 * 1. spendCreditsTraining deducts credits via CreditEngine
 * 2. Returns false when CreditEngine rejects (insufficient balance)
 * 3. Updates store state correctly
 *
 * Note: API wiring (POST /api/training) will be tested once the
 * store's spendCreditsTraining is wired to the training API endpoint.
 */

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
      available: 1000,
      locked: 0,
      total: 1000,
      lifetimeEarned: 1000,
      lifetimeSpent: 0,
    }),
    createInitialWallet: () => ({
      connected: false,
      address: null,
      balance: null,
    }),
    processTraining: jest.fn().mockReturnValue({
      newBalance: { available: 800, locked: 0, total: 800, lifetimeEarned: 1000, lifetimeSpent: 200 },
      newTransactions: [{ type: 'training', amount: -200 }],
    }),
    processReward: jest.fn().mockReturnValue({
      newBalance: { available: 0, locked: 0, total: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      newTransactions: [],
    }),
  },
}))

import { useGameStore } from '@/lib/store'
import { CreditEngine } from '@/lib/credit-engine'

function resetStore() {
  useGameStore.setState(state => ({
    user: {
      ...state.user,
      credits: 1000,
      creditBalance: { available: 1000, locked: 0, total: 1000, lifetimeEarned: 1000, lifetimeSpent: 0 },
      transactions: [],
    },
  }))
}

describe('spendCreditsTraining — credit deduction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStore()
  })

  it('returns true and updates balance on successful training', () => {
    const result = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)

    expect(result).toBe(true)
    expect(CreditEngine.processTraining).toHaveBeenCalledWith(
      expect.objectContaining({ available: 1000 }),
      expect.any(Array),
      'f1',
      'Fighter',
      200
    )
    expect(useGameStore.getState().user.creditBalance.available).toBe(800)
  })

  it('returns false when CreditEngine rejects (insufficient balance)', () => {
    ;(CreditEngine.processTraining as jest.Mock).mockReturnValueOnce({ error: 'Insufficient credits' })

    const result = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 9999)

    expect(result).toBe(false)
    // Balance should remain unchanged
    expect(useGameStore.getState().user.creditBalance.available).toBe(1000)
  })

  it('updates transactions in the store', () => {
    useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)

    const transactions = useGameStore.getState().user.transactions
    expect(transactions).toEqual([{ type: 'training', amount: -200 }])
  })

  it('calls CreditEngine.processTraining with correct params', () => {
    useGameStore.getState().spendCreditsTraining('fighter-abc', 'TITAN-9', 150)

    expect(CreditEngine.processTraining).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      'fighter-abc',
      'TITAN-9',
      150
    )
  })

  it('handles multiple sequential training calls', () => {
    // First training
    const result1 = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)
    expect(result1).toBe(true)

    // Second training (mock returns another deduction)
    ;(CreditEngine.processTraining as jest.Mock).mockReturnValueOnce({
      newBalance: { available: 600, locked: 0, total: 600, lifetimeEarned: 1000, lifetimeSpent: 400 },
      newTransactions: [{ type: 'training', amount: -200 }, { type: 'training', amount: -200 }],
    })

    const result2 = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)
    expect(result2).toBe(true)
    expect(useGameStore.getState().user.creditBalance.available).toBe(600)
  })

  it('still returns true synchronously', () => {
    const result = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)
    expect(result).toBe(true)
  })
})
