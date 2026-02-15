// Core MFC Types

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
    state: 'idle' | 'walking' | 'punching' | 'dodging' | 'blocking' | 'hit' | 'down'
    frameCount: number
    duration: number
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