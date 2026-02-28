import { DMM_SYSTEM_ID } from './position-manager'

// Re-export for convenience
export { DMM_SYSTEM_ID }

// ── Fee Rate Constants (basis points) ────────────────────────────────────────

/** Local tier: 2% flat per trade. */
export const LOCAL_FEE_RATE_BPS = 200

/** Agent league: 0.5% flat per trade. */
export const AGENT_FEE_RATE_BPS = 50

/** Upper tiers (Regional/Grand/Invitational): 0 per-trade, 5% on profit at settlement. */
export const UPPER_FEE_RATE_BPS = 0

/** Fight tiers that use settlement-only fees (5% on profit). */
const UPPER_TIERS: ReadonlySet<string> = new Set(['REGIONAL', 'GRAND', 'INVITATIONAL'])

// ── Fighter Stat Fields ──────────────────────────────────────────────────────

const STAT_FIELDS = ['strength', 'speed', 'defense', 'stamina', 'fightIQ', 'aggression'] as const

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Compute fee rate in basis points for a new order.
 *
 * - DMM: 0 (always zero fees)
 * - Agent league: 50bp (0.5% flat)
 * - Upper tiers (Regional/Grand/Invitational): 0bp per-trade (5% on profit at settlement)
 * - Local: 200bp (2% flat)
 */
export function computeFeeRate(fightTier: string, league: string, isDMM: boolean): number {
  if (isDMM) return 0
  if (league === 'AGENT') return AGENT_FEE_RATE_BPS
  if (UPPER_TIERS.has(fightTier)) return UPPER_FEE_RATE_BPS
  return LOCAL_FEE_RATE_BPS
}

/**
 * Compute fee in cents for a trade.
 *
 * fee = floor(price × quantity × rate / 10000)
 */
export function computeFee(
  price: number,
  quantity: number,
  fightTier: string,
  league: string,
  isDMM: boolean
): number {
  const rate = computeFeeRate(fightTier, league, isDMM)
  return Math.floor(price * quantity * rate / 10000)
}

/**
 * Compute fight tier from the two fighters' max stats.
 *
 * Uses the higher-tier fighter to determine the fight tier:
 * - 95+ → GRAND
 * - 80-94 → REGIONAL
 * - <80 → LOCAL
 *
 * INVITATIONAL is not stat-derived (set via top-16 ranking process).
 */
export function computeFightTier(
  fighter1MaxStat: number,
  fighter2MaxStat: number
): 'LOCAL' | 'REGIONAL' | 'GRAND' {
  const maxStat = Math.max(fighter1MaxStat, fighter2MaxStat)
  if (maxStat >= 95) return 'GRAND'
  if (maxStat >= 80) return 'REGIONAL'
  return 'LOCAL'
}

/**
 * Get the highest individual stat value from a fighter record.
 *
 * Reads strength, speed, defense, stamina, fightIQ, aggression.
 * Returns 0 if no stat fields are present.
 */
export function getMaxFighterStat(fighter: Record<string, unknown>): number {
  let max = 0
  for (const field of STAT_FIELDS) {
    const val = fighter[field]
    if (typeof val === 'number' && val > max) max = val
  }
  return max
}
