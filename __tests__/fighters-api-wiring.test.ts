/**
 * @jest-environment jsdom
 *
 * Fighter API wiring tests — verifies:
 * 1. addFighter calls createFighter API when apiData provided
 * 2. No API call without apiData
 * 3. Rollback on API failure (removes fighter)
 * 4. fetchLeaderboard uses getFighters from api-client
 */

const mockCreateFighter = jest.fn()
const mockGetFighters = jest.fn()

jest.mock('@/lib/api-client', () => ({
  createFighter: (...args: unknown[]) => mockCreateFighter(...args),
  getFighters: (...args: unknown[]) => mockGetFighters(...args),
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

const sampleFighter = {
  id: 'new-fighter-1',
  name: 'Test Fighter',
  emoji: '🥊',
  class: 'Heavyweight' as const,
  record: { wins: 0, losses: 0, draws: 0 },
  elo: 1000,
  stats: { strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50 },
  owner: 'user',
  isActive: true,
  trainingCost: 100,
}

function resetStore() {
  useGameStore.setState(state => ({
    user: { ...state.user, fighters: [] },
    leaderboardFighters: [],
  }))
}

describe('addFighter — API wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStore()
  })

  it('does not call API when apiData is not provided', () => {
    useGameStore.getState().addFighter(sampleFighter)
    expect(mockCreateFighter).not.toHaveBeenCalled()
    expect(useGameStore.getState().user.fighters).toHaveLength(1)
  })

  it('calls createFighter with correct params when apiData provided', () => {
    mockCreateFighter.mockResolvedValueOnce({ id: 'db-1' })
    const apiData = { name: 'Test Fighter', emoji: '🥊', fighterClass: 'HEAVYWEIGHT' as const }
    useGameStore.getState().addFighter(sampleFighter, apiData)
    expect(mockCreateFighter).toHaveBeenCalledWith(apiData)
  })

  it('rolls back fighter on API failure', async () => {
    mockCreateFighter.mockRejectedValueOnce(new Error('Server error'))
    const apiData = { name: 'Test Fighter', emoji: '🥊', fighterClass: 'HEAVYWEIGHT' as const }

    useGameStore.getState().addFighter(sampleFighter, apiData)
    expect(useGameStore.getState().user.fighters).toHaveLength(1)

    await new Promise(resolve => setTimeout(resolve, 10))

    expect(useGameStore.getState().user.fighters).toHaveLength(0)
  })

  it('refreshes leaderboard on API success', async () => {
    mockCreateFighter.mockResolvedValueOnce({ id: 'db-1' })
    mockGetFighters.mockResolvedValueOnce([])
    const apiData = { name: 'Test Fighter', emoji: '🥊', fighterClass: 'HEAVYWEIGHT' as const }

    useGameStore.getState().addFighter(sampleFighter, apiData)

    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockGetFighters).toHaveBeenCalledWith({ active: true })
  })
})

describe('fetchLeaderboard — uses getFighters from api-client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStore()
  })

  it('calls getFighters with active filter', async () => {
    mockGetFighters.mockResolvedValueOnce([])
    await useGameStore.getState().fetchLeaderboard()
    expect(mockGetFighters).toHaveBeenCalledWith({ active: true })
  })

  it('maps API response to Fighter type', async () => {
    mockGetFighters.mockResolvedValueOnce([
      {
        id: 'f1',
        name: 'API Fighter',
        emoji: '⚡',
        class: 'HEAVYWEIGHT',
        elo: 1500,
        wins: 5,
        losses: 2,
        draws: 0,
        strength: 80,
        speed: 70,
        defense: 75,
        stamina: 85,
        fightIQ: 60,
        aggression: 90,
        isActive: true,
        trainingCost: 200,
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'Champ', username: null },
      },
    ])

    await useGameStore.getState().fetchLeaderboard()

    const fighters = useGameStore.getState().leaderboardFighters
    expect(fighters).toHaveLength(1)
    expect(fighters[0].name).toBe('API Fighter')
    expect(fighters[0].record).toEqual({ wins: 5, losses: 2, draws: 0 })
    expect(fighters[0].owner).toBe('Champ')
    expect(fighters[0].class).toBe('Heavyweight')
  })

  it('keeps existing data on API failure', async () => {
    mockGetFighters.mockRejectedValueOnce(new Error('Network error'))

    useGameStore.setState({ leaderboardFighters: [{ id: 'existing' } as any] })
    await useGameStore.getState().fetchLeaderboard()

    expect(useGameStore.getState().leaderboardFighters).toHaveLength(1)
    expect(useGameStore.getState().leaderboardFighters[0].id).toBe('existing')
  })
})
