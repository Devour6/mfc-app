/**
 * @jest-environment node
 */
import {
  computeFee,
  computeFeeRate,
  computeFightTier,
  getMaxFighterStat,
  LOCAL_FEE_RATE_BPS,
  AGENT_FEE_RATE_BPS,
  UPPER_FEE_RATE_BPS,
} from '@/lib/fee-engine'

// ── computeFeeRate ───────────────────────────────────────────────────────────

describe('computeFeeRate', () => {
  it('returns 0 for DMM regardless of tier or league', () => {
    expect(computeFeeRate('LOCAL', 'HUMAN', true)).toBe(0)
    expect(computeFeeRate('REGIONAL', 'HUMAN', true)).toBe(0)
    expect(computeFeeRate('GRAND', 'AGENT', true)).toBe(0)
  })

  it('returns 50bp (0.5%) for Agent league', () => {
    expect(computeFeeRate('LOCAL', 'AGENT', false)).toBe(AGENT_FEE_RATE_BPS)
    expect(computeFeeRate('REGIONAL', 'AGENT', false)).toBe(AGENT_FEE_RATE_BPS)
  })

  it('returns 0bp for Upper tiers (Regional/Grand/Invitational)', () => {
    expect(computeFeeRate('REGIONAL', 'HUMAN', false)).toBe(UPPER_FEE_RATE_BPS)
    expect(computeFeeRate('GRAND', 'HUMAN', false)).toBe(UPPER_FEE_RATE_BPS)
    expect(computeFeeRate('INVITATIONAL', 'HUMAN', false)).toBe(UPPER_FEE_RATE_BPS)
  })

  it('returns 200bp (2%) for Local tier', () => {
    expect(computeFeeRate('LOCAL', 'HUMAN', false)).toBe(LOCAL_FEE_RATE_BPS)
  })
})

// ── computeFee ───────────────────────────────────────────────────────────────

describe('computeFee', () => {
  it('computes Local 2% flat fee', () => {
    // 60¢ × 10 contracts × 2% = 1200¢ × 0.02 = 12¢
    expect(computeFee(60, 10, 'LOCAL', 'HUMAN', false)).toBe(12)
  })

  it('computes Agent 0.5% flat fee', () => {
    // 60¢ × 10 contracts × 0.5% = 600 × 50 / 10000 = 3¢
    expect(computeFee(60, 10, 'LOCAL', 'AGENT', false)).toBe(3)
  })

  it('returns 0 for Upper tiers (settlement-only fees)', () => {
    expect(computeFee(60, 10, 'REGIONAL', 'HUMAN', false)).toBe(0)
    expect(computeFee(60, 10, 'GRAND', 'HUMAN', false)).toBe(0)
    expect(computeFee(60, 10, 'INVITATIONAL', 'HUMAN', false)).toBe(0)
  })

  it('returns 0 for DMM', () => {
    expect(computeFee(60, 10, 'LOCAL', 'HUMAN', true)).toBe(0)
    expect(computeFee(60, 10, 'REGIONAL', 'AGENT', true)).toBe(0)
  })

  it('floors fractional fees', () => {
    // 33¢ × 7 contracts × 2% = 231 × 200 / 10000 = 4.62 → floor = 4
    expect(computeFee(33, 7, 'LOCAL', 'HUMAN', false)).toBe(4)
  })
})

// ── computeFightTier ─────────────────────────────────────────────────────────

describe('computeFightTier', () => {
  it('returns LOCAL for stats below 80', () => {
    expect(computeFightTier(50, 60)).toBe('LOCAL')
    expect(computeFightTier(79, 79)).toBe('LOCAL')
  })

  it('returns REGIONAL for stats 80-94', () => {
    expect(computeFightTier(80, 50)).toBe('REGIONAL')
    expect(computeFightTier(50, 94)).toBe('REGIONAL')
  })

  it('returns GRAND for stats 95+', () => {
    expect(computeFightTier(95, 50)).toBe('GRAND')
    expect(computeFightTier(50, 100)).toBe('GRAND')
  })

  it('uses the higher-tier fighter', () => {
    // Fighter 1 has max stat 60 (LOCAL), fighter 2 has max stat 85 (REGIONAL)
    expect(computeFightTier(60, 85)).toBe('REGIONAL')
    // Fighter 1 has max stat 96 (GRAND), fighter 2 has max stat 40 (LOCAL)
    expect(computeFightTier(96, 40)).toBe('GRAND')
  })

  it('handles boundary values exactly', () => {
    expect(computeFightTier(79, 79)).toBe('LOCAL')
    expect(computeFightTier(80, 80)).toBe('REGIONAL')
    expect(computeFightTier(94, 94)).toBe('REGIONAL')
    expect(computeFightTier(95, 95)).toBe('GRAND')
  })
})

// ── getMaxFighterStat ────────────────────────────────────────────────────────

describe('getMaxFighterStat', () => {
  it('returns the highest stat value', () => {
    const fighter = {
      strength: 70, speed: 85, defense: 60,
      stamina: 75, fightIQ: 90, aggression: 55,
    }
    expect(getMaxFighterStat(fighter)).toBe(90)
  })

  it('returns 0 when no stat fields present', () => {
    expect(getMaxFighterStat({ id: 'f1', name: 'Test' })).toBe(0)
  })

  it('ignores non-numeric stat values', () => {
    const fighter = {
      strength: 'high' as unknown, speed: 85, defense: null as unknown,
      stamina: undefined as unknown, fightIQ: 70, aggression: 50,
    }
    expect(getMaxFighterStat(fighter as Record<string, unknown>)).toBe(85)
  })
})
