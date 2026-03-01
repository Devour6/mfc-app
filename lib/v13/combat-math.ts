// lib/v13/combat-math.ts
// Sprint 1, Task 1J.1: Pure combat math functions for the V13 engine.
// No state, no side effects. Port of algorithms from MC reference (scripts/mc/engine.ts)
// with GDD-locked constants from lib/v13/constants.ts.

import {
  FIGHTER_MAX_HP,
  BASE_TEMPO,
  DAMAGE_DICE,
  STAMINA_COSTS,
  POWER_ATTACKS,
  ABILITY_RAMP,
  DECISION_WEIGHTS,
  RECOVERY_RATES,
  RECOVERY_TRAILING_BONUS,
  RECOVERY_END_MOD_MULT,
  TKO_HP_THRESHOLD,
  TKO_D20_THRESHOLDS,
  DESPERATION,
  TEMPO_FLOORS,
  TEMPO_ACTION_RATE_COEFF,
  CONDITION_MULTS,
  TIER_THRESHOLDS,
  RELENTLESS_BYPASS_BASE,
  IRON_GUARD_CP_CATCH_BASE,
  IRON_GUARD_CP_CATCH_CAP,
  CP_PROC_RATE_BASE,
  BLOCK_CAP_PER_ROUND,
  GRINDING_GUARD_DRAIN,
  CP_MISS_DRAIN,
  CP_PROC_CAP_PER_ROUND,
  RELENTLESS_FLAT_BONUS,
  BASE_CP_CATCH,
  statToMod,
} from './constants'
import type { Condition, RoundScore } from './types'

// ─── Power Attack Set ───────────────────────────────────────────────────────

const POWER_ATTACKS_SET = new Set<string>(POWER_ATTACKS)

/** Check if an attack type is a power attack. */
export function isPowerAttack(attackType: string): boolean {
  return POWER_ATTACKS_SET.has(attackType)
}

// ─── Dice ───────────────────────────────────────────────────────────────────

/** Roll a single die with the given number of sides. Returns 1..sides. */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/** Roll a d20. Returns 1..20. */
export function rollD20(): number {
  return rollDie(20)
}

// ─── Damage ─────────────────────────────────────────────────────────────────

/**
 * Roll damage dice for an attack type and add POW modifier.
 * Returns at least 1.
 */
export function rollDamage(attackType: string, powMod: number): number {
  const dice = DAMAGE_DICE[attackType]
  if (!dice) return 1
  let total = 0
  for (let i = 0; i < dice.count; i++) {
    total += rollDie(dice.sides)
  }
  return Math.max(1, total + powMod)
}

/**
 * Apply END mitigation to raw damage.
 * Returns at least 1.
 */
export function applyMitigation(rawDamage: number, endMod: number): number {
  const mitigation = Math.max(0, endMod)
  return Math.max(1, rawDamage - mitigation)
}

/**
 * Apply Relentless bypass to mitigation.
 * Returns the effective mitigation after bypass (can be 0).
 * Relentless bypasses a fraction of END mitigation, with a floor of +1.
 */
export function relentlessMitigation(
  endMod: number,
  round: number
): { bypass: number; effectiveMitigation: number } {
  const mitigation = Math.max(0, endMod)
  const bypassFraction = relentlessBypass(round)
  const rawBypass = mitigation * bypassFraction
  const bypass = Math.max(RELENTLESS_FLAT_BONUS, rawBypass)
  const effectiveMitigation = Math.max(0, mitigation - bypass)
  return { bypass, effectiveMitigation }
}

/**
 * Apply block reduction to damage.
 * Iron Guard doubles block reduction and adds grinding guard stamina drain.
 */
export function blockReduction(
  endMod: number,
  hasIronGuard: boolean,
  round: number
): { reduction: number; grindingDrain: number } {
  let reduction: number
  let grindingDrain = 0

  if (hasIronGuard) {
    reduction = (rollDie(6) + rollDie(6)) + endMod * 2
    grindingDrain = Math.floor(GRINDING_GUARD_DRAIN * ABILITY_RAMP[round])
  } else {
    reduction = rollDie(6) + endMod
  }

  return { reduction: Math.max(0, reduction), grindingDrain }
}

// ─── Hit Chance ─────────────────────────────────────────────────────────────

/**
 * Base hit chance from TEC modifier.
 * 55% base + tecMod * 5%.
 */
export function baseAccuracy(tecMod: number): number {
  return 0.55 + tecMod * 0.05
}

/**
 * Effective hit chance including desperation penalty.
 */
export function hitChance(tecMod: number, isDesperate: boolean): number {
  let accuracy = baseAccuracy(tecMod)
  if (isDesperate) accuracy += DESPERATION.ACCURACY_PENALTY
  return accuracy
}

// ─── Crit ───────────────────────────────────────────────────────────────────

/**
 * Base crit chance from TEC modifier.
 * 5% base + tecMod * 2.5%. Min 2%.
 */
export function baseCritChance(tecMod: number): number {
  return Math.max(0.02, 0.05 + tecMod * 0.025)
}

/**
 * Effective crit chance including desperation bonus.
 */
export function effectiveCritChance(tecMod: number, isDesperate: boolean): number {
  let crit = baseCritChance(tecMod)
  if (isDesperate) crit += DESPERATION.CRIT_BONUS
  return crit
}

// ─── Reaction ───────────────────────────────────────────────────────────────

/**
 * Base reaction (dodge/block) chance from TEC modifier.
 * 15% base + tecMod * 5%. Clamped [5%, 45%].
 */
export function baseReactionChance(tecMod: number): number {
  return Math.max(0.05, Math.min(0.45, 0.15 + tecMod * 0.05))
}

/**
 * Effective reaction chance with tier ability adjustments.
 * Ring Sense (T1, TEC 65): +3%
 * Iron Guard (T2, END 80): +8%
 * Mind Reader (T3, TEC 95): +10%
 * Iron Man (T3, END 95): -10%
 * Capped at 50% for Mind Reader, 40% otherwise.
 */
export function effectiveReactionChance(
  tecMod: number,
  hasRingSense: boolean,
  hasIronGuard: boolean,
  hasMindReader: boolean,
  hasIronMan: boolean
): number {
  let chance = baseReactionChance(tecMod)
  if (hasRingSense) chance = Math.min(0.40, chance + 0.03)
  if (hasIronGuard) chance = Math.min(0.40, chance + 0.08)
  if (hasMindReader) chance = Math.min(0.50, chance + 0.10)
  if (hasIronMan) chance = Math.max(0.05, chance - 0.10)
  return chance
}

// ─── Stamina ────────────────────────────────────────────────────────────────

/**
 * Get the stamina cost of an action.
 * Returns 0 for unrecognized actions (move, etc.).
 */
export function staminaCost(action: string): number {
  return STAMINA_COSTS[action] ?? 0
}

/**
 * Compute max stamina from END stat.
 * 100 + (end-50)*0.8 + endMod*5.
 */
export function computeMaxStamina(end: number): number {
  return 100 + (end - 50) * 0.8 + statToMod(end) * 5
}

/**
 * Compute per-tick stamina regen from END stat.
 * 0.3 + (end-50)/200.
 */
export function computeStaminaRegen(end: number): number {
  return 0.3 + (end - 50) / 200
}

// ─── Ability Tiers ──────────────────────────────────────────────────────────

/**
 * Determine ability tier from a NATURAL stat value (no gear).
 * 0 = none, 1 = tier 1 (65+), 2 = tier 2 (80+), 3 = tier 3 (95+).
 */
export function abilityTier(naturalStat: number): 0 | 1 | 2 | 3 {
  if (naturalStat >= TIER_THRESHOLDS.tier3) return 3
  if (naturalStat >= TIER_THRESHOLDS.tier2) return 2
  if (naturalStat >= TIER_THRESHOLDS.tier1) return 1
  return 0
}

/** Tier ability flags for a fighter based on natural stats. */
export interface TierAbilities {
  tier1: { heavyHands: boolean; thickSkin: boolean; ringSense: boolean }
  tier2: { relentless: boolean; ironGuard: boolean; counterPunch: boolean }
  tier3: { devastator: boolean; ironMan: boolean; mindReader: boolean }
}

/**
 * Resolve all tier abilities from natural stats (no gear).
 * POW → Heavy Hands / Relentless / Devastator
 * END → Thick Skin / Iron Guard / Iron Man
 * TEC → Ring Sense / Counter Punch / Mind Reader
 */
export function resolveTierAbilities(pow: number, end: number, tec: number): TierAbilities {
  return {
    tier1: {
      heavyHands: pow >= TIER_THRESHOLDS.tier1,
      thickSkin: end >= TIER_THRESHOLDS.tier1,
      ringSense: tec >= TIER_THRESHOLDS.tier1,
    },
    tier2: {
      relentless: pow >= TIER_THRESHOLDS.tier2,
      ironGuard: end >= TIER_THRESHOLDS.tier2,
      counterPunch: tec >= TIER_THRESHOLDS.tier2,
    },
    tier3: {
      devastator: pow >= TIER_THRESHOLDS.tier3,
      ironMan: end >= TIER_THRESHOLDS.tier3,
      mindReader: tec >= TIER_THRESHOLDS.tier3,
    },
  }
}

// ─── Ability Scaling ────────────────────────────────────────────────────────

/**
 * Relentless bypass rate for a given round.
 * Fraction of END mitigation bypassed. Scales with ability ramp.
 * R1: 38%, R2: 49.4%, R3: 68.4%. Capped at 100%.
 */
export function relentlessBypass(round: number): number {
  return Math.min(1.0, RELENTLESS_BYPASS_BASE * ABILITY_RAMP[round])
}

/**
 * Iron Guard counter-punch catch rate for a given round.
 * R1: 42%, R2: 54.6%, R3: 70% (capped).
 */
export function ironGuardCatch(round: number): number {
  return Math.min(IRON_GUARD_CP_CATCH_CAP, IRON_GUARD_CP_CATCH_BASE * ABILITY_RAMP[round])
}

/**
 * Counter Punch proc rate for a given round.
 * R1: 21.5%, R2: 27.95%, R3: 38.7%.
 */
export function counterPunchRate(round: number): number {
  return CP_PROC_RATE_BASE * ABILITY_RAMP[round]
}

/**
 * Counter Punch damage multiplier for a given round.
 * Scales directly with ability ramp.
 */
export function counterPunchDamageMult(round: number): number {
  return ABILITY_RAMP[round]
}

/**
 * Get the CP catch rate for a non-specialist fighter.
 * Relentless fighters can't cover up (0%). Iron Guard overrides with ironGuardCatch().
 * Everyone else gets BASE_CP_CATCH (30%).
 */
export function cpCatchRate(
  hasIronGuard: boolean,
  hasRelentless: boolean,
  round: number
): number {
  if (hasIronGuard) return ironGuardCatch(round)
  if (hasRelentless) return 0
  return BASE_CP_CATCH
}

// ─── Tempo ──────────────────────────────────────────────────────────────────

/**
 * Calculate current tempo from stamina ratio and round.
 * Clamped by per-round floor and desperation floor.
 */
export function getCurrentTempo(
  stamina: number,
  maxStamina: number,
  round: number,
  isDesperate: boolean
): number {
  const staminaRatio = Math.max(0.1, stamina / maxStamina)
  let tempo = BASE_TEMPO * staminaRatio

  const tempoFloor = TEMPO_FLOORS[round] * BASE_TEMPO
  tempo = Math.max(tempoFloor, tempo)

  if (isDesperate) {
    tempo = Math.max(DESPERATION.TEMPO_FLOOR * BASE_TEMPO, tempo)
  }

  return tempo
}

/**
 * Convert tempo (0-100) to per-tick action probability.
 * At tempo 100: ~7.5% per tick. At tempo 50: ~3.75%.
 */
export function actionRate(tempo: number): number {
  return TEMPO_ACTION_RATE_COEFF * tempo
}

// ─── Recovery ───────────────────────────────────────────────────────────────

/**
 * Calculate HP recovery between rounds.
 * @param round - 0-indexed round that just ended (0 = after R1, 1 = after R2)
 * @param isTrailing - whether this fighter dealt less damage than opponent this round
 * @param endMod - fighter's END modifier (from statToMod)
 * @param condition - fighter's condition
 * @returns HP to recover (not clamped to max)
 */
export function recoveryHp(
  round: number,
  isTrailing: boolean,
  endMod: number,
  condition: Condition
): number {
  if (round >= RECOVERY_RATES.length) return 0

  let recovery = RECOVERY_RATES[round] * FIGHTER_MAX_HP

  if (isTrailing) {
    recovery += RECOVERY_TRAILING_BONUS * FIGHTER_MAX_HP
  }

  recovery += endMod * RECOVERY_END_MOD_MULT * FIGHTER_MAX_HP

  recovery *= CONDITION_MULTS[condition].recovery

  return recovery
}

// ─── Round Scoring ──────────────────────────────────────────────────────────

/**
 * Score a decision from round damage arrays.
 * Uses weighted cumulative damage: R1:25%, R2:35%, R3:40%.
 * Tiebreaker: remaining HP.
 * @returns 1 if fighter1 wins, 2 if fighter2 wins
 */
export function scoreDecision(
  f1RoundDamage: [number, number, number],
  f2RoundDamage: [number, number, number],
  f1Hp: number,
  f2Hp: number
): 1 | 2 {
  const f1Weighted =
    f1RoundDamage[0] * DECISION_WEIGHTS[0] +
    f1RoundDamage[1] * DECISION_WEIGHTS[1] +
    f1RoundDamage[2] * DECISION_WEIGHTS[2]
  const f2Weighted =
    f2RoundDamage[0] * DECISION_WEIGHTS[0] +
    f2RoundDamage[1] * DECISION_WEIGHTS[1] +
    f2RoundDamage[2] * DECISION_WEIGHTS[2]

  if (f1Weighted > f2Weighted) return 1
  if (f2Weighted > f1Weighted) return 2
  // Tiebreaker: remaining HP
  return f1Hp >= f2Hp ? 1 : 2
}

/**
 * Determine per-round winner by damage dealt.
 * @returns 1 if fighter1, 2 if fighter2, 0 if tied
 */
export function roundWinner(f1Damage: number, f2Damage: number): 1 | 2 | 0 {
  if (f1Damage > f2Damage) return 1
  if (f2Damage > f1Damage) return 2
  return 0
}

// ─── TKO & Desperation ──────────────────────────────────────────────────────

/**
 * Check if TKO should trigger.
 * Fighter must be below HP threshold (15%), then roll d20 against round threshold.
 * @param hp - current HP
 * @param round - 0-indexed
 * @returns true if TKO triggers
 */
export function checkTKO(hp: number, round: number): boolean {
  if (hp >= FIGHTER_MAX_HP * TKO_HP_THRESHOLD) return false
  if (hp <= 0) return false // KO, not TKO
  const roll = rollD20()
  return roll <= TKO_D20_THRESHOLDS[round]
}

/**
 * Check if desperation should activate.
 * Triggers at 35% HP.
 */
export function isDesperate(hp: number): boolean {
  return hp < FIGHTER_MAX_HP * DESPERATION.HP_PCT
}

/**
 * Apply desperation damage bonus.
 * +20% damage.
 */
export function desperationDamage(baseDamage: number): number {
  return Math.floor(baseDamage * (1 + DESPERATION.DAMAGE_BONUS))
}

// ─── Condition ──────────────────────────────────────────────────────────────

/**
 * Apply condition multiplier to a base value.
 */
export function applyCondition(
  base: number,
  stat: 'tempo' | 'stamina' | 'recovery',
  condition: Condition
): number {
  return base * CONDITION_MULTS[condition][stat]
}

// ─── Exported Constants (for engine use) ────────────────────────────────────

export {
  POWER_ATTACKS_SET,
  BLOCK_CAP_PER_ROUND,
  CP_PROC_CAP_PER_ROUND,
  CP_MISS_DRAIN,
  FIGHTER_MAX_HP,
}
