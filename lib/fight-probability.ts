import { FightBiasConfig } from './fight-engine'

// ─── Configuration ──────────────────────────────────────────────────────────

/** Weight of win/loss record in the probability calculation */
const RECORD_WEIGHT = 0.55
/** Weight of training hours in the probability calculation */
const TRAINING_WEIGHT = 0.45
/** Bayesian shrinkage constant — fighters need ~k fights before record dominates */
const BAYESIAN_K = 8
/** Minimum win probability (puncher's chance) */
const LUCK_FLOOR = 0.10
/** Maximum win probability */
const LUCK_CEILING = 0.90
/** Maximum damage bias applied to the fight engine */
const MAX_BIAS = 0.40

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FighterProbabilityData {
  wins: number
  losses: number
  draws: number
  totalTrainingHours: number
}

export interface FightProbabilityResult {
  fighter1WinProbability: number
  fighter2WinProbability: number
  favoredFighterId: string | null
}

export interface FightOutcome {
  winnerId: string
  biasConfig: FightBiasConfig
  probability: FightProbabilityResult
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Bayesian-adjusted win ratio. Shrinks toward 0.5 for fighters with few fights,
 * so a 1-0 record doesn't outweigh a 22-3 record.
 */
export function recordStrength(wins: number, losses: number, draws: number): number {
  const w = Math.max(0, wins)
  const l = Math.max(0, losses)
  const d = Math.max(0, draws)
  const totalFights = w + l + d
  const effectiveWins = w + d * 0.5
  return (effectiveWins + BAYESIAN_K * 0.5) / (totalFights + BAYESIAN_K)
}

/**
 * Training strength on a log scale — diminishing returns so early training
 * matters most, but high training still edges out.
 */
export function trainingStrength(totalTrainingHours: number): number {
  return Math.log1p(Math.max(0, totalTrainingHours))
}

/**
 * Calculate win probability for fighter1 vs fighter2.
 * Based on record (55%) and training (45%), clamped by luck floor/ceiling.
 */
export function calculateWinProbability(
  fighter1Id: string,
  fighter2Id: string,
  fighter1: FighterProbabilityData,
  fighter2: FighterProbabilityData,
): FightProbabilityResult {
  // Same fighter edge case — true 50/50
  if (fighter1Id === fighter2Id) {
    return { fighter1WinProbability: 0.5, fighter2WinProbability: 0.5, favoredFighterId: null }
  }

  // Record factor
  const f1Record = recordStrength(fighter1.wins, fighter1.losses, fighter1.draws)
  const f2Record = recordStrength(fighter2.wins, fighter2.losses, fighter2.draws)

  // Training factor — normalized as ratio between the two fighters
  const f1Training = trainingStrength(fighter1.totalTrainingHours)
  const f2Training = trainingStrength(fighter2.totalTrainingHours)
  const trainingSum = f1Training + f2Training
  const f1TrainingNorm = trainingSum > 0 ? f1Training / trainingSum : 0.5
  const f2TrainingNorm = trainingSum > 0 ? f2Training / trainingSum : 0.5

  // Weighted composite
  const f1Composite = RECORD_WEIGHT * f1Record + TRAINING_WEIGHT * f1TrainingNorm
  const f2Composite = RECORD_WEIGHT * f2Record + TRAINING_WEIGHT * f2TrainingNorm

  // Convert to probability via ratio, clamped by luck floor/ceiling
  const rawP1 = f1Composite / (f1Composite + f2Composite)
  const p1 = Math.max(LUCK_FLOOR, Math.min(LUCK_CEILING, rawP1))

  return {
    fighter1WinProbability: p1,
    fighter2WinProbability: 1 - p1,
    favoredFighterId: p1 > 0.5 ? fighter1Id : p1 < 0.5 ? fighter2Id : null,
  }
}

/**
 * Map a win probability (0.50–0.90) to a fight engine damageModifier (0.00–0.40).
 * Linear scaling: 50/50 = no bias, 90/10 = max bias.
 */
export function probabilityToBias(winProbability: number): number {
  const edge = Math.max(0, winProbability - 0.50)
  const maxEdge = LUCK_CEILING - 0.50 // 0.40
  return Math.min(MAX_BIAS, (edge / maxEdge) * MAX_BIAS)
}

/**
 * Determine the fight outcome: roll the dice based on probability,
 * then return the bias config to feed the fight engine.
 */
export function determineFightOutcome(
  fighter1Id: string,
  fighter2Id: string,
  fighter1: FighterProbabilityData,
  fighter2: FighterProbabilityData,
): FightOutcome {
  const probability = calculateWinProbability(fighter1Id, fighter2Id, fighter1, fighter2)

  // Roll the dice
  const roll = Math.random()
  const winnerId = roll < probability.fighter1WinProbability ? fighter1Id : fighter2Id

  // Bias always favors the predetermined winner
  const winnerProb = winnerId === fighter1Id
    ? probability.fighter1WinProbability
    : probability.fighter2WinProbability
  const damageModifier = probabilityToBias(winnerProb)

  return {
    winnerId,
    biasConfig: { favoredFighterId: winnerId, damageModifier },
    probability,
  }
}
