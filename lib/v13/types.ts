// lib/v13/types.ts
// Sprint 0, Tasks S0-1 + S0-3: Shared types for the V13 game loop.
// Both engineers (Jinwoo + Sawamura) must agree on every interface
// before writing product code. Sawamura adds S0-4 (API contracts) separately.

// Fight Phase Model
// 9 phases (Kakashi's 8-phase model + intermission from matchmaking spec).
// KO/TKO/Decision are finish METHODS, not phases.
// 'queue' and 'intermission' managed at orchestration level.

export type FightPhase =
  | 'queue'
  | 'matchup_reveal'
  | 'pre_fight'
  | 'fighting'
  | 'repricing'
  | 'finish'
  | 'settlement'
  | 'intermission'

export type FinishMethod = 'KO' | 'TKO' | 'Decision'

// Fighter Types

export interface V13FighterStats {
  pow: number  // Power: damage, bypass
  end: number  // Endurance: stamina, mitigation, recovery
  tec: number  // Technique: accuracy, crits, ability proc effectiveness
}

export type Condition = 'fresh' | 'normal' | 'tired'
export type Archetype = 'pressure' | 'turtle' | 'counter' | 'hybrid'

export type GearSlot = 'gloves' | 'headgear' | 'body' | 'boots'
export type GearTier = 'standard' | 'enhanced' | 'superior' | 'legendary'

export interface V13GearPiece {
  slot: GearSlot
  tier: GearTier
  name: string
  primaryStat: keyof V13FighterStats
  primaryBonus: number
  secondaryStat?: keyof V13FighterStats
  secondaryBonus?: number
  passiveId?: string
}

export interface V13GearLoadout {
  pieces: V13GearPiece[]
}

/** Static fighter configuration — set before the fight starts. */
export interface V13Fighter {
  id: string
  name: string
  emoji: string
  archetype: Archetype
  stats: V13FighterStats
  condition: Condition
  gear: V13GearLoadout
  record: { wins: number; losses: number; draws: number }
  elo: number
}

// Fight State Types

/** Per-fighter combat statistics tracked during a fight. */
export interface V13CombatStats {
  strikesThrown: number
  strikesLanded: number
  powerShots: number
  dodges: number
  blocks: number
  damageDealt: number
  damageTaken: number
  abilityProcs: number
}

/** Mutable per-fighter state during combat. */
export interface V13FighterState {
  id: string
  hp: number
  stamina: number
  maxStamina: number
  tempo: number
  isDesperate: boolean
  blocksThisRound: number
  stats: V13CombatStats
}

/** Per-round scoring data. */
export interface RoundScore {
  round: number
  fighter1Damage: number
  fighter2Damage: number
  fighter1Strikes: number
  fighter2Strikes: number
  winner: 1 | 2 | 0
}

/** Per-fighter recovery data shown during repricing. */
export interface V13FighterRecovery {
  base: number
  trailing: number
  endBonus: number
  total: number
  hpBefore: number
  hpAfter: number
}

/** Recovery data for both fighters after a round. */
export interface V13RecoveryData {
  fighter1: V13FighterRecovery
  fighter2: V13FighterRecovery
  roundWinner: 1 | 2 | 0
}

/** The complete fight state. Updated every tick. */
export interface V13FightState {
  phase: FightPhase
  round: number
  clock: number                    // seconds remaining in current round (60 → 0)
  tick: number                     // global tick counter
  fighter1: V13FighterState
  fighter2: V13FighterState
  repricingTimer: number           // repricing countdown (15 → 0)
  preFightTimer: number            // pre-fight countdown (30 → 0)
  finishMethod?: FinishMethod      // set when phase = 'finish'
  roundScores: RoundScore[]
  lastRecovery?: V13RecoveryData
  result?: V13FightResult
}

/** Final fight result. */
export interface V13FightResult {
  winnerId: string
  loserId: string
  method: FinishMethod
  round: number
  time: number                     // seconds into the round when fight ended
  fighter1Stats: V13CombatStats
  fighter2Stats: V13CombatStats
  roundScores: RoundScore[]
}

// Market Types

export type MarketPhase = 'inactive' | 'pre-fight' | 'live' | 'repricing' | 'settled'

/** A binary outcome contract (YES/NO) on a fight. */
export interface V13Contract {
  id: string
  fightId: string
  userId: string
  side: 'YES' | 'NO'
  price: number                    // 0.01-0.99
  quantity: number                 // integer, >= 1
  cost: number                     // price * quantity (in credits, integer cents)
  status: 'open' | 'settled'
  settledAt?: number
  payout?: number
}

/** Settlement outcome after a fight completes. */
export interface SettlementResult {
  fightId: string
  winningSide: 'YES' | 'NO'
  totalSettled: number
  totalPayout: number
}

/** Market state derived from fight state. */
export interface V13MarketState {
  phase: MarketPhase
  fightId: string
  fairPrice: number                // 0.01-0.99, derived from fight state
  yesPrice: number
  noPrice: number
  volume: number
  lastTradeAt?: number
}

// Engine Callbacks (S0-3)
// 8 callbacks covering the full fight lifecycle.

export interface V13EngineCallbacks {
  onStateUpdate: (state: V13FightState) => void
  onRoundEnd: (round: number, score: RoundScore) => void
  onRepricingStart: (round: number) => void
  onRepricingEnd: (round: number) => void
  onFightEnd: (result: V13FightResult) => void
  onCommentary: (text: string, type: 'action' | 'analysis' | 'system') => void
  onPhaseChange: (phase: FightPhase) => void
  onMatchupReveal: (fighter1: V13Fighter, fighter2: V13Fighter) => void
}

// API Request/Response Shapes (S0-4)
// Contract between Jinwoo's frontend and Sawamura's backend.
// Simplified for demo — no CLOB, no complement matching, no DMM.

/** GET /api/fights/next — returns the next fight (creates via matchmaker if none). */
export interface NextFightResponse {
  fight: {
    id: string
    fighter1: V13Fighter
    fighter2: V13Fighter
    status: 'SCHEDULED' | 'LIVE'
  }
}

/** POST /api/bets — place a YES/NO contract bet. */
export interface PlaceBetRequest {
  fightId: string
  side: 'YES' | 'NO'
  price: number       // 0.01-0.99, cost per contract
  quantity: number     // integer, >= 1
}

export interface PlaceBetResponse {
  bet: V13Contract
}

/** PATCH /api/fights/[id] — complete a fight and trigger settlement. */
export interface CompleteFightRequest {
  status: 'COMPLETED'
  result: {
    winnerId: string
    method: FinishMethod
    round: number
    time: number
    fighter1Stats: V13CombatStats
    fighter2Stats: V13CombatStats
    roundScores: RoundScore[]
  }
}

export interface CompleteFightResponse {
  fight: {
    id: string
    status: 'COMPLETED'
    fighter1Id: string
    fighter2Id: string
  }
  settlement: SettlementResult
}

/** GET /api/user/credits — existing endpoint, reused. */
export interface CreditsResponse {
  credits: number
}
