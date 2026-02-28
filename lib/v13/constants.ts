// lib/v13/constants.ts
// Sprint 0, Task S0-2: Locked combat constants for V13.
// All values verified against MC reference (scripts/mc/config.ts).
// Do not change without re-running affected Monte Carlo sims.

// Phase Timing

export const QUEUE_SECONDS = 15
export const MATCHUP_REVEAL_SECONDS = 30
export const PRE_FIGHT_SECONDS = 30
export const REPRICING_SECONDS = 15
export const SETTLEMENT_SECONDS = 10
export const INTERMISSION_SECONDS = 60

// Core Combat

export const FIGHTER_MAX_HP = 225
export const BASE_TEMPO = 100
export const TICKS_PER_SECOND = 12
export const TICK_INTERVAL_MS = 83       // ~1000/12
export const ROUND_SECONDS = 60
export const MAX_ROUNDS = 3
export const TICKS_PER_ROUND = TICKS_PER_SECOND * ROUND_SECONDS

/** Ability effectiveness multiplier per round: R1 base, R2 elevated, R3 full power. */
export const ABILITY_RAMP = [1.0, 1.3, 1.8] as const

/** Decision scoring weights per round: R1 least, R3 most. */
export const DECISION_WEIGHTS = [0.25, 0.35, 0.40] as const

// Diminishing Returns

/** Each stat point above 80 counts as this fraction for combat calculations. */
export const DR_COEFFICIENT = 0.9

/** Stat threshold above which DR applies. */
export const DR_THRESHOLD = 80

// TKO

/** HP percentage below which TKO check triggers. */
export const TKO_HP_THRESHOLD = 0.15

/** d20 thresholds per round — must roll at or below to TKO. */
export const TKO_D20_THRESHOLDS = [2, 4, 6] as const

// Desperation

export const DESPERATION = {
  HP_PCT: 0.35,
  DAMAGE_BONUS: 0.20,
  ACCURACY_PENALTY: -0.10,
  VULNERABILITY: 0,
  CRIT_BONUS: 0.05,
  TEMPO_FLOOR: 0.70,
} as const

// Between-Round Recovery

/** Base HP recovery percentage after each round: [after R1, after R2]. */
export const RECOVERY_RATES = [0.15, 0.10] as const

/** Bonus HP recovery percentage if trailing on round score. */
export const RECOVERY_TRAILING_BONUS = 0.05

/** Per-point END modifier multiplied by this for additional recovery. */
export const RECOVERY_END_MOD_MULT = 0.02

// Stamina

export const STAMINA_COSTS: Record<string, number> = {
  jab: 3,
  cross: 5,
  hook: 8,
  uppercut: 10,
  roundhouse: 13,
  combo: 16,
  powerAttack: 10,
  dodge: 3,
  block: 3,
}

// Damage

export const DAMAGE_DICE: Record<string, { sides: number; count: number }> = {
  jab:        { sides: 4,  count: 1 },
  cross:      { sides: 6,  count: 1 },
  hook:       { sides: 8,  count: 1 },
  uppercut:   { sides: 10, count: 1 },
  roundhouse: { sides: 12, count: 1 },
  combo:      { sides: 6,  count: 2 },
}

export const POWER_ATTACKS = ['hook', 'uppercut', 'roundhouse', 'combo'] as const

// Abilities

/** Relentless (Pressure, POW 80): percentage of damage that bypasses END mitigation. */
export const RELENTLESS_BYPASS_BASE = 0.42

/** +1 flat damage on ALL hits for Relentless fighters. */
export const RELENTLESS_FLAT_BONUS = 1

/** Iron Guard (Turtle, END 80): block damage reduction is doubled. */
export const BLOCK_CAP_PER_ROUND = 5

/** Grinding Guard: stamina drained from attacker per block. */
export const GRINDING_GUARD_DRAIN = 4

/** Iron Guard CP catch: base chance to nullify a Counter Punch proc. */
export const IRON_GUARD_CP_CATCH_BASE = 0.55

/** Iron Guard CP catch: max chance (cap). */
export const IRON_GUARD_CP_CATCH_CAP = 0.70

/** Counter Punch (Counter, TEC 80): base proc rate on successful dodge. */
export const CP_PROC_RATE_BASE = 0.215

/** Counter Punch: max procs per round. */
export const CP_PROC_CAP_PER_ROUND = 3

/** CP miss drain: stamina cost per failed proc (dodge but no CP). */
export const CP_MISS_DRAIN = 6

/** Base CP catch rate for ALL fighters (non-Iron Guard). */
export const BASE_CP_CATCH = 0.30

// Tempo

/** Minimum tempo percentage per round: R1 clamped, R2 clamped, R3 uncapped. */
export const TEMPO_FLOORS = [0.90, 0.75, 0.0] as const

/** Coefficient for converting tempo to ticks between actions. */
export const TEMPO_ACTION_RATE_COEFF = 0.00075

// Condition

export const CONDITION_MULTS = {
  fresh:  { tempo: 1.02, stamina: 1.04, recovery: 1.02 },
  normal: { tempo: 1.00, stamina: 1.00, recovery: 1.00 },
  tired:  { tempo: 0.98, stamina: 0.96, recovery: 0.98 },
} as const

// Tier Thresholds
// Natural stat values required for ability tiers. Gear bonuses do NOT count.

export const TIER_THRESHOLDS = {
  tier1: 65,
  tier2: 80,
  tier3: 95,
} as const

// Exhaustion (Signature: Iron Man)

export const EXHAUSTION = {
  IRON_MAN: [1.0, 0.82, 0.65] as const,
  BASELINE: [1.0, 0.88, 0.76] as const,
}

// Gear

export const GEAR_TIER_BONUSES: Record<string, number> = {
  standard: 1,
  enhanced: 1,
  superior: 2,
  legendary: 3,
}

// Archetype Matchup
// Expected win rate for row archetype vs column archetype (target: 62-68%).
// Used by market engine for initial fair price calculation.

export const ARCHETYPE_MATCHUP: Record<string, Record<string, number>> = {
  pressure: { pressure: 0.50, turtle: 0.65, counter: 0.35, hybrid: 0.57 },
  turtle:   { pressure: 0.35, turtle: 0.50, counter: 0.65, hybrid: 0.57 },
  counter:  { pressure: 0.65, turtle: 0.35, counter: 0.50, hybrid: 0.62 },
  hybrid:   { pressure: 0.43, turtle: 0.43, counter: 0.38, hybrid: 0.50 },
}

// Helper Functions

/**
 * Apply diminishing returns: each stat point above DR_THRESHOLD counts
 * as DR_COEFFICIENT of a point for combat calculations.
 * Stat 95 → effective 80 + (95-80)*0.9 = 93.5
 */
function effectiveCombatStat(stat: number): number {
  if (stat <= DR_THRESHOLD) return stat
  return DR_THRESHOLD + (stat - DR_THRESHOLD) * DR_COEFFICIENT
}

/**
 * Stat-to-modifier with diminishing returns applied.
 * Continuous mode (no rounding): (effective - 50) / 15, capped ±3.
 * Use for all combat calculations (damage, mitigation, stamina, accuracy).
 *
 * statToMod(57)  → (57-50)/15          = 0.467
 * statToMod(80)  → (80-50)/15          = 2.0
 * statToMod(95)  → (93.5-50)/15        = 2.9
 */
export function statToMod(stat: number): number {
  const effective = effectiveCombatStat(Math.max(0, Math.min(100, stat)))
  const raw = (effective - 50) / 15
  return Math.max(-3, Math.min(3, raw))
}

/**
 * Stat-to-modifier from NATURAL stat (no diminishing returns).
 * Use for ability tier checks and display purposes.
 *
 * statToModNatural(95) → (95-50)/15 = 3.0
 */
export function statToModNatural(stat: number): number {
  const clamped = Math.max(0, Math.min(100, stat))
  const raw = (clamped - 50) / 15
  return Math.max(-3, Math.min(3, raw))
}

/**
 * Maximum stamina for a fighter given their END stat.
 * maxStamina(80) → 100 + (80-50)*0.8 + statToMod(80)*5 = 134
 */
export function maxStamina(end: number): number {
  return 100 + (end - 50) * 0.8 + statToMod(end) * 5
}
