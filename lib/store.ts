import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  Fighter, 
  ExtendedUser, 
  TournamentBracket, 
  Achievement, 
  AchievementNotification,
  LoginStreak,
  DailyReward,
  FightHistoryEntry,
  CreditTransaction,
  CreditPurchaseOption,
  WalletConnection 
} from '@/types'
import { FighterEvolutionEngine } from './evolution-engine'
import { TournamentEngine } from './tournament-engine'
import { AchievementEngine } from './achievement-engine'
import { DailyRewardsEngine } from './daily-rewards-engine'
import { CreditEngine } from './credit-engine'
import { createFighter as apiCreateFighter, getFighters, startTraining as apiStartTraining } from './api-client'

interface GameState {
  // User data
  user: ExtendedUser
  
  // Game state
  currentTournament: TournamentBracket | null
  
  // Actions
  initializeUser: (name: string) => void
  updateAfterFight: (fighterId: string, fightData: any) => void
  startTournament: (fighterIds: string[]) => void
  advanceTournament: (matchId: string, result: any) => void
  claimDailyReward: (reward: DailyReward) => void
  dismissNotification: (notificationId: string) => void
  addFighter: (fighter: Omit<Fighter, 'evolution'>, apiData?: { name: string; emoji: string; fighterClass: 'LIGHTWEIGHT' | 'MIDDLEWEIGHT' | 'HEAVYWEIGHT' }) => void
  
  // Credit system actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  purchaseCredits: (option: CreditPurchaseOption) => Promise<void>
  withdrawCredits: (amount: number, walletAddress: string) => Promise<void>
  spendCreditsTraining: (fighterId: string, fighterName: string, baseCost: number, hours?: number) => boolean
  addRewardCredits: (amount: number, description: string, relatedId?: string) => void
  fetchCredits: () => Promise<void>
  placeBetAndDeduct: (amount: number, description: string) => boolean

  // Leaderboard
  leaderboardFighters: Fighter[]
  fetchLeaderboard: () => Promise<void>
}

// Sample fighters with evolution data
const createSampleFighters = (): Fighter[] => [
  {
    id: 'fighter-1',
    name: 'Thunder Mike',
    emoji: '⚡',
    class: 'Heavyweight',
    record: { wins: 8, losses: 2, draws: 0 },
    elo: 1650,
    stats: { strength: 85, speed: 70, defense: 75, stamina: 80, fightIQ: 72, aggression: 88 },
    owner: 'user',
    isActive: true,
    trainingCost: 200,
    evolution: FighterEvolutionEngine.createNewEvolution(28)
  },
  {
    id: 'fighter-2', 
    name: 'Steel Guardian',
    emoji: '🛡️',
    class: 'Middleweight',
    record: { wins: 12, losses: 3, draws: 1 },
    elo: 1720,
    stats: { strength: 75, speed: 68, defense: 92, stamina: 85, fightIQ: 85, aggression: 45 },
    owner: 'user',
    isActive: true,
    trainingCost: 250,
    evolution: FighterEvolutionEngine.createNewEvolution(31)
  },
  {
    id: 'fighter-3',
    name: 'Lightning Lee',
    emoji: '💨',
    class: 'Lightweight', 
    record: { wins: 15, losses: 1, draws: 0 },
    elo: 1850,
    stats: { strength: 70, speed: 95, defense: 68, stamina: 88, fightIQ: 90, aggression: 75 },
    owner: 'user',
    isActive: true,
    trainingCost: 300,
    evolution: FighterEvolutionEngine.createNewEvolution(26)
  }
]

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      user: {
        id: 'user-1',
        name: 'Champion',
        credits: 2500,
        fighters: [],
        trades: [],
        settings: {
          soundEnabled: true,
          commentaryEnabled: true,
          autoTrade: false,
          notifications: true
        },
        tournaments: [],
        achievements: AchievementEngine.initializeAchievements(),
        achievementNotifications: [],
        loginStreak: DailyRewardsEngine.createNewLoginStreak(),
        totalPlayTime: 0,
        joinDate: Date.now(),
        creditBalance: CreditEngine.createInitialBalance(),
        transactions: [],
        walletConnection: CreditEngine.createInitialWallet()
      },
      
      currentTournament: null,

      initializeUser: (name: string) => {
        set(state => ({
          user: {
            ...state.user,
            name,
            fighters: createSampleFighters(),
            joinDate: Date.now()
          }
        }))
        
        // Process initial login
        const { user } = get()
        const loginResult = DailyRewardsEngine.processLogin(user.loginStreak)
        if (loginResult.rewardClaimed) {
          set(state => ({
            user: {
              ...state.user,
              loginStreak: loginResult.updatedStreak,
              credits: state.user.credits + loginResult.rewardClaimed!.credits
            }
          }))
        }
      },

      updateAfterFight: (fighterId: string, fightData: {
        opponent: string
        result: 'win' | 'loss' | 'draw'  
        method: 'KO' | 'TKO' | 'Decision' | 'Submission'
        round: number
        actions: FightHistoryEntry['actions']
        isFirstRoundKO?: boolean
        isPerfectRound?: boolean
        isComeback?: boolean
      }) => {
        set(state => {
          const fighterIndex = state.user.fighters.findIndex(f => f.id === fighterId)
          if (fighterIndex === -1) return state

          const updatedFighter = FighterEvolutionEngine.updateAfterFight(
            state.user.fighters[fighterIndex],
            fightData.result,
            fightData
          )

          // Update fighter record
          if (fightData.result === 'win') {
            updatedFighter.record.wins++
          } else if (fightData.result === 'loss') {
            updatedFighter.record.losses++
          } else {
            updatedFighter.record.draws++
          }

          // Check achievements
          const achievementResult = AchievementEngine.checkFightAchievements(
            state.user.achievements,
            updatedFighter,
            updatedFighter.evolution.fightHistory[updatedFighter.evolution.fightHistory.length - 1],
            fightData.isFirstRoundKO,
            fightData.isPerfectRound,
            fightData.isComeback
          )

          // Create notifications for new achievements
          const newNotifications = achievementResult.newUnlocks.map(achievement => 
            AchievementEngine.createNotification(achievement)
          )

          // Update fighters array
          const newFighters = [...state.user.fighters]
          newFighters[fighterIndex] = updatedFighter

          const newState = {
            user: {
              ...state.user,
              fighters: newFighters,
              achievements: achievementResult.updatedAchievements,
              achievementNotifications: [...state.user.achievementNotifications, ...newNotifications]
            }
          }

          // Add achievement reward transactions
          achievementResult.newUnlocks.forEach(achievement => {
            const { addRewardCredits } = get()
            addRewardCredits(achievement.rewardCredits, `Achievement unlocked: ${achievement.name}`, achievement.id)
          })

          return newState
        })
      },

      startTournament: (fighterIds: string[]) => {
        const { user } = get()
        const selectedFighters = user.fighters.filter(f => fighterIds.includes(f.id))
        
        if (selectedFighters.length !== 8) {
          // Add AI fighters to fill bracket
          const aiFighters: Fighter[] = []
          for (let i = selectedFighters.length; i < 8; i++) {
            aiFighters.push({
              id: `ai-fighter-${i}`,
              name: `Fighter ${i + 1}`,
              emoji: ['🤖', '👤', '🥊', '⚔️', '🔥', '💀', '🦾', '⭐'][i],
              class: ['Heavyweight', 'Middleweight', 'Lightweight'][Math.floor(Math.random() * 3)] as any,
              record: { wins: Math.floor(Math.random() * 10), losses: Math.floor(Math.random() * 5), draws: 0 },
              elo: 1400 + Math.floor(Math.random() * 400),
              stats: {
                strength: 60 + Math.floor(Math.random() * 30),
                speed: 60 + Math.floor(Math.random() * 30),
                defense: 60 + Math.floor(Math.random() * 30),
                stamina: 60 + Math.floor(Math.random() * 30),
                fightIQ: 60 + Math.floor(Math.random() * 30),
                aggression: 60 + Math.floor(Math.random() * 30)
              },
              owner: 'ai',
              isActive: true,
              trainingCost: 100,
              evolution: FighterEvolutionEngine.createNewEvolution()
            })
          }
          selectedFighters.push(...aiFighters)
        }

        const tournament = TournamentEngine.createTournament(selectedFighters)
        
        set(state => ({
          currentTournament: tournament,
          user: {
            ...state.user,
            tournaments: [tournament, ...state.user.tournaments]
          }
        }))
      },

      advanceTournament: (matchId: string, result: any) => {
        const { currentTournament } = get()
        if (!currentTournament) return

        const match = currentTournament.matches.find(m => m.id === matchId)
        if (!match) return

        const updatedTournament = TournamentEngine.advanceTournament(currentTournament, match, result)
        
        set(state => {
          let newState = {
            ...state,
            currentTournament: updatedTournament
          }

          // Check for tournament achievements
          const userFighterWon = updatedTournament.winner && state.user.fighters.some(f => f.id === updatedTournament.winner!.id)
          const achievementResult = AchievementEngine.checkTournamentAchievements(
            state.user.achievements,
            updatedTournament,
            userFighterWon
          )

          if (achievementResult.newUnlocks.length > 0) {
            const newNotifications = achievementResult.newUnlocks.map(achievement => 
              AchievementEngine.createNotification(achievement)
            )

            newState.user = {
              ...newState.user,
              achievements: achievementResult.updatedAchievements,
              achievementNotifications: [...state.user.achievementNotifications, ...newNotifications]
            }

            // Add achievement reward transactions
            achievementResult.newUnlocks.forEach(achievement => {
              const { addRewardCredits } = get()
              addRewardCredits(achievement.rewardCredits, `Achievement unlocked: ${achievement.name}`, achievement.id)
            })
          }

          return newState
        })
      },

      claimDailyReward: (reward: DailyReward) => {
        const { addRewardCredits } = get()
        
        set(state => {
          const loginResult = DailyRewardsEngine.processLogin(state.user.loginStreak)
          
          return {
            user: {
              ...state.user,
              loginStreak: loginResult.updatedStreak
            }
          }
        })

        // Add reward transaction
        addRewardCredits(reward.credits, `Daily login reward: Day ${reward.day}`)
      },

      dismissNotification: (notificationId: string) => {
        set(state => ({
          user: {
            ...state.user,
            achievementNotifications: state.user.achievementNotifications.map(n => 
              n.id === notificationId ? { ...n, seen: true } : n
            )
          }
        }))
      },

      addFighter: (fighterData: Omit<Fighter, 'evolution'>, apiData?: { name: string; emoji: string; fighterClass: 'LIGHTWEIGHT' | 'MIDDLEWEIGHT' | 'HEAVYWEIGHT' }) => {
        set(state => {
          const newFighter: Fighter = {
            ...fighterData,
            evolution: FighterEvolutionEngine.createNewEvolution()
          }

          const updatedFighters = [...state.user.fighters, newFighter]

          // Check collection achievements
          const achievementResult = AchievementEngine.checkCollectionAchievements(
            state.user.achievements,
            updatedFighters
          )

          const newNotifications = achievementResult.newUnlocks.map(achievement =>
            AchievementEngine.createNotification(achievement)
          )

          const newState = {
            user: {
              ...state.user,
              fighters: updatedFighters,
              achievements: achievementResult.updatedAchievements,
              achievementNotifications: [...state.user.achievementNotifications, ...newNotifications]
            }
          }

          // Add achievement reward transactions
          achievementResult.newUnlocks.forEach(achievement => {
            const { addRewardCredits } = get()
            addRewardCredits(achievement.rewardCredits, `Achievement unlocked: ${achievement.name}`, achievement.id)
          })

          return newState
        })

        if (apiData) {
          apiCreateFighter(apiData)
            .then(() => { get().fetchLeaderboard() })
            .catch(() => {
              // Rollback: remove the optimistically added fighter
              set(state => ({
                user: {
                  ...state.user,
                  fighters: state.user.fighters.filter(f => f.id !== fighterData.id),
                }
              }))
            })
        }
      },

      // Credit system actions
      connectWallet: async () => {
        const walletConnection = await CreditEngine.connectWallet()
        set(state => ({
          user: {
            ...state.user,
            walletConnection
          }
        }))
      },

      disconnectWallet: () => {
        const walletConnection = CreditEngine.disconnectWallet()
        set(state => ({
          user: {
            ...state.user,
            walletConnection
          }
        }))
      },

      purchaseCredits: async (option: CreditPurchaseOption) => {
        const { user } = get()
        
        if (!user.walletConnection.connected || !user.walletConnection.address) {
          throw new Error('Wallet not connected')
        }

        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        const result = CreditEngine.processDeposit(
          user.creditBalance,
          user.transactions,
          option,
          user.walletConnection.address
        )

        // Add transaction hash simulation
        result.transaction.transactionHash = `${Date.now()}abc123def456`
        result.transaction.status = 'completed'

        set(state => ({
          user: {
            ...state.user,
            creditBalance: result.newBalance,
            transactions: result.newTransactions
          }
        }))
      },

      withdrawCredits: async (amount: number, walletAddress: string) => {
        const { user } = get()
        
        const result = CreditEngine.processWithdrawal(
          user.creditBalance,
          user.transactions,
          amount,
          walletAddress
        )

        if (result.error) {
          throw new Error(result.error)
        }

        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Add transaction hash simulation
        result.transaction.transactionHash = `${Date.now()}def456ghi789`
        result.transaction.status = 'completed'

        set(state => ({
          user: {
            ...state.user,
            creditBalance: result.newBalance,
            transactions: result.newTransactions
          }
        }))
      },

      spendCreditsTraining: (fighterId: string, fighterName: string, baseCost: number, hours?: number) => {
        const { user } = get()

        const result = CreditEngine.processTraining(
          user.creditBalance,
          user.transactions,
          fighterId,
          fighterName,
          baseCost
        )

        if (result.error) {
          return false
        }

        const prevBalance = user.creditBalance
        const prevTransactions = user.transactions

        set(state => ({
          user: {
            ...state.user,
            creditBalance: result.newBalance,
            transactions: result.newTransactions
          }
        }))

        if (hours) {
          apiStartTraining({ fighterId, hours })
            .then(() => { get().fetchCredits() })
            .catch(() => {
              set(state => ({
                user: {
                  ...state.user,
                  creditBalance: prevBalance,
                  transactions: prevTransactions,
                }
              }))
            })
        }

        return true
      },

      addRewardCredits: (amount: number, description: string, relatedId?: string) => {
        const { user } = get()
        
        const result = CreditEngine.processReward(
          user.creditBalance,
          user.transactions,
          amount,
          description,
          relatedId
        )

        set(state => ({
          user: {
            ...state.user,
            creditBalance: result.newBalance,
            transactions: result.newTransactions
          }
        }))
      },

      fetchCredits: async () => {
        try {
          const res = await fetch('/api/user/credits')
          if (res.ok) {
            const data = await res.json()
            set(state => ({
              user: { ...state.user, credits: data.credits ?? state.user.credits }
            }))
          }
        } catch {
          // API not available — keep local data
        }
      },

      placeBetAndDeduct: (amount: number, _description: string) => {
        let success = false
        set(state => {
          if (state.user.credits < amount) return state
          success = true
          return { user: { ...state.user, credits: state.user.credits - amount } }
        })
        return success
      },

      // Leaderboard
      leaderboardFighters: [],

      fetchLeaderboard: async () => {
        try {
          const data = await getFighters({ active: true })
          const fighters: Fighter[] = data.map(f => ({
            id: f.id,
            name: f.name,
            emoji: f.emoji ?? '🥊',
            class: f.class.charAt(0).toUpperCase() + f.class.slice(1).toLowerCase() as Fighter['class'],
            record: { wins: f.wins ?? 0, losses: f.losses ?? 0, draws: f.draws ?? 0 },
            elo: f.elo ?? 1000,
            stats: {
              strength: f.strength ?? 50,
              speed: f.speed ?? 50,
              defense: f.defense ?? 50,
              stamina: f.stamina ?? 50,
              fightIQ: f.fightIQ ?? 50,
              aggression: f.aggression ?? 50,
            },
            owner: f.owner?.name ?? f.ownerId ?? 'unknown',
            isActive: f.isActive ?? true,
            trainingCost: f.trainingCost ?? 100,
            evolution: FighterEvolutionEngine.createNewEvolution(),
          }))
          set({ leaderboardFighters: fighters })
        } catch {
          // API not available — keep existing data
        }
      }
    }),
    {
      name: 'mfc-game-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)