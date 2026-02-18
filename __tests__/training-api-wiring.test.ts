/**
 * @jest-environment jsdom
 *
 * Training API wiring tests — verifies:
 * 1. spendCreditsTraining calls startTraining API when hours provided
 * 2. No API call without hours param
 * 3. Rollback on API failure
 * 4. fetchCredits sync on API success
 */

const mockStartTraining = jest.fn()

jest.mock('@/lib/api-client', () => ({
  startTraining: (...args: unknown[]) => mockStartTraining(...args),
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

describe('spendCreditsTraining — API wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStore()
  })

  it('does not call API when hours is not provided', () => {
    useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200)
    expect(mockStartTraining).not.toHaveBeenCalled()
  })

  it('calls startTraining with correct params when hours provided', () => {
    mockStartTraining.mockResolvedValueOnce({ id: 't1' })
    useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200, 2)
    expect(mockStartTraining).toHaveBeenCalledWith({ fighterId: 'f1', hours: 2 })
  })

  it('syncs credits on successful API call', async () => {
    mockStartTraining.mockResolvedValueOnce({ id: 't1' })
    const fetchSpy = jest.spyOn(useGameStore.getState(), 'fetchCredits').mockResolvedValueOnce()

    useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200, 1)

    // Wait for the async chain to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(fetchSpy).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('rolls back creditBalance on API failure', async () => {
    mockStartTraining.mockRejectedValueOnce(new Error('Server error'))

    const priorBalance = useGameStore.getState().user.creditBalance

    useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200, 1)

    // After sync call, local state should have been updated
    expect(useGameStore.getState().user.creditBalance).not.toEqual(priorBalance)

    // Wait for the async chain to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    // After rollback, creditBalance should be restored
    expect(useGameStore.getState().user.creditBalance).toEqual(priorBalance)
  })

  it('returns false when CreditEngine rejects (insufficient balance)', () => {
    ;(CreditEngine.processTraining as jest.Mock).mockReturnValueOnce({ error: 'Insufficient credits' })

    const result = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 9999, 5)

    expect(result).toBe(false)
    expect(mockStartTraining).not.toHaveBeenCalled()
  })

  it('still returns true synchronously even when API call is pending', () => {
    mockStartTraining.mockReturnValue(new Promise(() => {})) // never resolves
    const result = useGameStore.getState().spendCreditsTraining('f1', 'Fighter', 200, 1)
    expect(result).toBe(true)
  })
})
