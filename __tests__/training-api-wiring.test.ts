/**
 * @jest-environment jsdom
 *
 * Training session store tests — verifies:
 * 1. startTrainingSession calls API and sets activeTrainingSession
 * 2. cancelTrainingSession calls API and clears session
 * 3. completeTrainingSession polls and clears on completion
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
    processReward: jest.fn().mockReturnValue({
      newBalance: { available: 0, locked: 0, total: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      newTransactions: [],
    }),
  },
}))

const mockStartTraining = jest.fn()
const mockCancelTraining = jest.fn()
const mockGetTrainingSession = jest.fn()

jest.mock('@/lib/api-client', () => ({
  placeBet: jest.fn(),
  createFighter: jest.fn(),
  getFighters: jest.fn().mockResolvedValue([]),
  startTraining: (...args: unknown[]) => mockStartTraining(...args),
  cancelTraining: (...args: unknown[]) => mockCancelTraining(...args),
  getTrainingSession: (...args: unknown[]) => mockGetTrainingSession(...args),
}))

import { useGameStore } from '@/lib/store'

describe('Training session store actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useGameStore.setState({ activeTrainingSession: null })
  })

  describe('startTrainingSession', () => {
    it('calls API and sets activeTrainingSession on success', async () => {
      const mockSession = {
        id: 't1',
        fighterId: 'f1',
        durationMinutes: 15,
        status: 'ACTIVE' as const,
        startedAt: new Date().toISOString(),
        completedAt: null,
        hours: null,
        cost: null,
        strengthGain: 0,
        speedGain: 0,
        defenseGain: 0,
        staminaGain: 0,
        fightIQGain: 0,
        aggressionGain: 0,
        createdAt: new Date().toISOString(),
        userId: 'u1',
      }
      mockStartTraining.mockResolvedValueOnce(mockSession)

      const result = await useGameStore.getState().startTrainingSession('f1', 15)

      expect(result).toBe(true)
      expect(mockStartTraining).toHaveBeenCalledWith({ fighterId: 'f1', durationMinutes: 15 })
      expect(useGameStore.getState().activeTrainingSession).toEqual(mockSession)
    })

    it('returns false on API failure', async () => {
      mockStartTraining.mockRejectedValueOnce(new Error('Fighter already has an active training session'))

      const result = await useGameStore.getState().startTrainingSession('f1', 15)

      expect(result).toBe(false)
      expect(useGameStore.getState().activeTrainingSession).toBeNull()
    })
  })

  describe('cancelTrainingSession', () => {
    it('calls API and clears activeTrainingSession', async () => {
      useGameStore.setState({
        activeTrainingSession: { id: 't1', status: 'ACTIVE' } as any,
      })
      mockCancelTraining.mockResolvedValueOnce({ id: 't1', status: 'CANCELLED' })

      await useGameStore.getState().cancelTrainingSession('t1')

      expect(mockCancelTraining).toHaveBeenCalledWith('t1')
      expect(useGameStore.getState().activeTrainingSession).toBeNull()
    })
  })

  describe('completeTrainingSession', () => {
    it('clears activeTrainingSession when session is COMPLETED', async () => {
      useGameStore.setState({
        activeTrainingSession: { id: 't1', status: 'ACTIVE' } as any,
      })
      mockGetTrainingSession.mockResolvedValueOnce({
        id: 't1',
        status: 'COMPLETED',
        strengthGain: 1,
        speedGain: 0,
        defenseGain: 0,
        staminaGain: 0,
        fightIQGain: 0,
        aggressionGain: 0,
      })

      const session = await useGameStore.getState().completeTrainingSession('t1')

      expect(session).toBeTruthy()
      expect(session!.status).toBe('COMPLETED')
      expect(useGameStore.getState().activeTrainingSession).toBeNull()
    })

    it('keeps activeTrainingSession when session is still ACTIVE', async () => {
      const activeSession = { id: 't1', status: 'ACTIVE', progress: 0.5 }
      mockGetTrainingSession.mockResolvedValueOnce(activeSession)

      const session = await useGameStore.getState().completeTrainingSession('t1')

      expect(session).toBeTruthy()
      expect(useGameStore.getState().activeTrainingSession).toEqual(activeSession)
    })
  })
})
