// Core MFC Types

export interface SignatureMove {
  id: string
  name: string
  description: string
  type: 'offensive' | 'defensive' | 'combo'
  damageMultiplier: number
  staminaCost: number
  unlockCondition: string
  requiredTrait?: 'aggressive' | 'defensive' | 'showboat' | 'technical'
  requiredLevel?: number
}

export interface FightHistoryEntry {
  fightId: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  method: 'KO' | 'TKO' | 'Decision' | 'Submission'
  round: number
  actions: {
    offensiveActions: number
    defensiveActions: number
    comboActions: number
    precisionStrikes: number
    knockdowns: number
    blocksLanded: number
    dodgesSuccessful: number
  }
  date: number
}

export interface FighterEvolution {
  traits: {
    aggressive: number  // 0-100
    defensive: number   // 0-100
    showboat: number    // 0-100
    technical: number   // 0-100
  }
  signatureMoves: SignatureMove[]
  age: number
  peakAgeStart: number
  peakAgeEnd: number
  fightHistory: FightHistoryEntry[]
  evolutionLevel: number
  totalFights: number
  winStreak: number
  careerHighlights: string[]
}

export interface Fighter {
  id: string
  name: string
  emoji: string
  class: 'Heavyweight' | 'Middleweight' | 'Lightweight'
  record: {
    wins: number
    losses: number
    draws: number
  }
  elo: number
  stats: {
    strength: number
    speed: number
    defense: number
    stamina: number
    fightIQ: number
    aggression: number
  }
  owner: string
  isActive: boolean
  trainingCost: number
  evolution: FighterEvolution
  totalTrainingHours?: number
  totalTrainingSessions?: number
}

export interface FightState {
  round: number
  maxRounds: number
  clock: number
  phase: 'intro' | 'fighting' | 'ko' | 'decision' | 'ended'
  fighter1: FighterState
  fighter2: FighterState
  result?: {
    winner: string
    method: 'KO' | 'TKO' | 'Decision' | 'Submission'
    round: number
    time: string
  }
}

export interface FighterState {
  id: string
  hp: number
  stamina: number
  position: {
    x: number
    y: number
    facing: 1 | -1 // 1 for right, -1 for left
  }
  animation: {
    state: 'idle' | 'walking' | 'punching' | 'kicking' | 'dodging' | 'blocking' | 'hit' | 'down'
    frameCount: number
    duration: number
    attackType?: string
  }
  stats: {
    strikes: number
    landed: number
    powerShots: number
    dodges: number
    blocks: number
  }
  modifiers: {
    stunned: number
    blocking: number
    dodging: number
    charging: number
    hitStopFrames: number
  }
  combo: {
    count: number
    lastHit: number
  }
}

export interface MarketState {
  contractQuestion: string
  yesPrice: number
  noPrice: number
  volume: number
  lastTrade: number
  houseRevenue: number
  priceHistory: Array<{
    timestamp: number
    price: number
    volume: number
  }>
  orderBook: {
    bids: OrderBookEntry[]
    asks: OrderBookEntry[]
  }
}

export interface OrderBookEntry {
  price: number
  quantity: number
  total?: number
  percentage?: number
}

export interface Trade {
  id: string
  side: 'yes' | 'no'
  price: number
  quantity: number
  cost: number
  fee: number
  netCost: number
  timestamp: number
  status: 'pending' | 'filled' | 'cancelled'
}

export interface Commentary {
  id: string
  text: string
  timestamp: number
  type: 'action' | 'analysis' | 'general'
  priority: 'low' | 'medium' | 'high'
}

export interface GameSettings {
  soundEnabled: boolean
  commentaryEnabled: boolean
  autoTrade: boolean
  notifications: boolean
}

export interface User {
  id: string
  name: string
  credits: number
  isAgent: boolean
  fighters: Fighter[]
  trades: Trade[]
  settings: GameSettings
}

export interface UpcomingFight {
  id: string
  fighter1: Pick<Fighter, 'id' | 'name' | 'emoji' | 'record' | 'elo'>
  fighter2: Pick<Fighter, 'id' | 'name' | 'emoji' | 'record' | 'elo'>
  scheduledTime: Date
  status: 'scheduled' | 'live' | 'completed'
  venue: string
  expectedVolume?: number
}

export interface FightCard {
  id: string
  title: string
  date: Date
  mainEvent: UpcomingFight
  undercard: UpcomingFight[]
  venue: string
}

// Action types for the fight simulation
export type FightAction =
  | { type: 'jab'; fighter: 1 | 2; power: number }
  | { type: 'cross'; fighter: 1 | 2; power: number }
  | { type: 'hook'; fighter: 1 | 2; power: number }
  | { type: 'uppercut'; fighter: 1 | 2; power: number }
  | { type: 'kick'; fighter: 1 | 2; power: number }
  | { type: 'roundhouse'; fighter: 1 | 2; power: number }
  | { type: 'combo'; fighter: 1 | 2; sequence: string[] }
  | { type: 'dodge'; fighter: 1 | 2; direction: 'left' | 'right' | 'back' }
  | { type: 'block'; fighter: 1 | 2; success: boolean }
  | { type: 'clinch'; fighter: 1 | 2 }
  | { type: 'move'; fighter: 1 | 2; direction: 'forward' | 'back' | 'circle' }

// Sound types
export type SoundEffect = 
  | 'punch-light'
  | 'punch-heavy' 
  | 'dodge'
  | 'block'
  | 'ko'
  | 'bell'
  | 'crowd-cheer'
  | 'trade-success'
  | 'trade-fail'
  | 'notification'

export interface SoundManager {
  play: (sound: SoundEffect, volume?: number) => void
  setMasterVolume: (volume: number) => void
  mute: () => void
  unmute: () => void
}

// Tournament System Types
export interface TournamentBracket {
  id: string
  name: string
  status: 'upcoming' | 'in-progress' | 'completed'
  fighters: Fighter[]
  matches: TournamentMatch[]
  winner?: Fighter
  prize: number
  startDate: number
  endDate?: number
}

export interface TournamentMatch {
  id: string
  round: number
  fighter1: Fighter
  fighter2: Fighter
  winner?: Fighter
  result?: FightState['result']
  status: 'pending' | 'in-progress' | 'completed'
  scheduledTime: number
}

// Achievement System Types
export interface Achievement {
  id: string
  name: string
  description: string
  type: 'fight' | 'betting' | 'collection' | 'social' | 'streak'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardCredits: number
  unlocked: boolean
  unlockedAt?: number
  progress: number
  maxProgress: number
  hidden: boolean
}

export interface AchievementNotification {
  id: string
  achievement: Achievement
  timestamp: number
  seen: boolean
}

// Daily Rewards System Types
export interface DailyReward {
  day: number
  credits: number
  bonus?: string
  claimed: boolean
}

export interface LoginStreak {
  currentStreak: number
  longestStreak: number
  lastLoginDate: number
  rewards: DailyReward[]
  nextRewardCredits: number
}

// Credit & Transaction System Types
export interface CreditTransaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'training' | 'prediction' | 'tournament' | 'reward' | 'achievement'
  amount: number
  fee: number
  netAmount: number
  description: string
  timestamp: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  relatedId?: string // fighter ID, tournament ID, etc.
  walletAddress?: string // for deposits/withdrawals
  transactionHash?: string // blockchain tx hash
}

export interface CreditBalance {
  available: number
  pending: number
  lifetime: {
    deposited: number
    withdrawn: number
    earned: number
    spent: number
  }
}

export interface CreditPurchaseOption {
  id: string
  usdcAmount: number
  creditAmount: number
  bonusCredits: number
  popular?: boolean
  bestValue?: boolean
}

export interface WithdrawalRequest {
  id: string
  amount: number
  fee: number
  netAmount: number
  walletAddress: string
  timestamp: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimatedTime: string
}

export interface PlatformFees {
  training: number // 10%
  predictionMaker: number // 2%
  predictionTaker: number // 1%
  tournament: number // 10%
  withdrawal: number // flat fee or %
}

export interface WalletConnection {
  connected: boolean
  address?: string
  balance?: number // USDC balance
  network: 'solana-mainnet' | 'solana-devnet'
}

// FTUE Onboarding Types
export type OnboardingStep =
  | 'watching'
  | 'picked-side'
  | 'saw-contract'
  | 'market-open'
  | 'demo-traded'
  | 'converted'
  | 'completed'

export interface OnboardingState {
  step: OnboardingStep
  pickedFighter: string | null // fighter ID the user picked to win
  demoCredits: number
  demoTrades: DemoTrade[]
  hasCompleted: boolean
}

export interface DemoTrade {
  id: string
  side: 'yes' | 'no'
  price: number
  quantity: number
  pnl: number
  settled: boolean
}

// Extended User interface with new features
export interface ExtendedUser extends User {
  tournaments: TournamentBracket[]
  achievements: Achievement[]
  achievementNotifications: AchievementNotification[]
  loginStreak: LoginStreak
  totalPlayTime: number
  joinDate: number
  creditBalance: CreditBalance
  transactions: CreditTransaction[]
  walletConnection: WalletConnection
}