// scripts/mc/config.ts
// Tuneable constants for V13 combat simulation.
// This is the ONLY file agents edit for parameter changes.
// ~120 lines. Read this, change a value, run affected sims.

export const COMBAT = {
  FIGHTER_MAX_HP: 225,
  BASE_TEMPO: 100,
  TICKS_PER_SECOND: 12,
  ROUND_SECONDS: 60,
  MAX_ROUNDS: 3,
  ABILITY_RAMP: [1.0, 1.3, 1.8],
  DECISION_WEIGHTS: [0.25, 0.35, 0.40],
}

export const TKO = {
  HP_THRESHOLD: 0.15,
  D20_THRESHOLDS: [2, 4, 6],
}

export const DESPERATION = {
  HP_PCT: 0.35,
  DAMAGE_BONUS: 0.20,
  ACCURACY_PENALTY: -0.10,
  VULNERABILITY: 0,
  CRIT_BONUS: 0.05,
  TEMPO_FLOOR: 0.70,
}

export const RECOVERY = {
  RATES: [0.15, 0.10],
  TRAILING_BONUS: 0.05,
}

export const STAMINA_COSTS: Record<string, number> = {
  jab: 3, cross: 5, hook: 8, uppercut: 10, roundhouse: 13, combo: 16,
  powerAttack: 10,
  dodge: 3, block: 3,
}

export const ABILITIES = {
  BLOCK_CAP_PER_ROUND: 5,
  GRINDING_GUARD_DRAIN: 4,
  CP_MISS_DRAIN: 6,
  CP_PROC_CAP_PER_ROUND: 3,
  BASE_CP_CATCH: 0.30,
  RELENTLESS_BYPASS_BASE: 0.42,
  IRON_GUARD_CP_CATCH_BASE: 0.55,
  IRON_GUARD_CP_CATCH_CAP: 0.70,
  CP_PROC_RATE_BASE: 0.215,
}

export const TEMPO = {
  FLOOR_BY_ROUND: [0.90, 0.75, 0.0],
  ACTION_RATE_COEFF: 0.00075,
}

export const CONDITION_MULTS = {
  fresh:  { tempo: 1.02, stamina: 1.04, recovery: 1.02 },
  normal: { tempo: 1.00, stamina: 1.00, recovery: 1.00 },
  tired:  { tempo: 0.98, stamina: 0.96, recovery: 0.98 },
}

export const TIER_THRESHOLDS = {
  tier1: 65,
  tier2: 80,
  tier3: 95,
}

export const EXHAUSTION = {
  IRON_MAN: [1.0, 0.82, 0.65],
  BASELINE: [1.0, 0.88, 0.76],
}

export const DAMAGE_DICE: Record<string, { sides: number; count: number }> = {
  jab: { sides: 4, count: 1 }, cross: { sides: 6, count: 1 },
  hook: { sides: 8, count: 1 }, uppercut: { sides: 10, count: 1 },
  roundhouse: { sides: 12, count: 1 }, combo: { sides: 6, count: 2 },
}

export const POWER_ATTACKS = ['hook', 'uppercut', 'roundhouse', 'combo']

export const GEAR_TIER_BONUSES: Record<string, number> = {
  standard: 1, enhanced: 1, superior: 2, legendary: 3,
}

// Archetype stat spreads
export const ARCHETYPES = {
  pressure80: { pow: 80, end: 57, tec: 58 },
  turtle80:   { pow: 57, end: 80, tec: 58 },
  counter80:  { pow: 57, end: 58, tec: 80 },
  hybrid65:   { pow: 65, end: 65, tec: 65 },
  base50:     { pow: 50, end: 50, tec: 50 },
  pow95:      { pow: 95, end: 50, tec: 50 },
  pow80:      { pow: 80, end: 50, tec: 50 },
  end95:      { pow: 50, end: 95, tec: 50 },
  end80:      { pow: 50, end: 80, tec: 50 },
  tec95:      { pow: 50, end: 50, tec: 95 },
  tec80:      { pow: 50, end: 50, tec: 80 },
}

// Dependency tags for sim targeting.
// When you change a constant, check which group it belongs to,
// then run only sims that depend on that group.
export type ConfigGroup =
  | 'combat'       // COMBAT, TKO, DAMAGE_DICE
  | 'abilities'    // ABILITIES (Relentless, Iron Guard, Counter Punch rates)
  | 'desperation'  // DESPERATION
  | 'recovery'     // RECOVERY
  | 'stamina'      // STAMINA_COSTS
  | 'tempo'        // TEMPO
  | 'gear'         // GEAR_TIER_BONUSES
  | 'condition'    // CONDITION_MULTS
  | 'signatures'   // EXHAUSTION, TIER_THRESHOLDS (tier 3 mechanics)
  | 'archetypes'   // ARCHETYPES
