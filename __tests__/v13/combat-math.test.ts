// __tests__/v13/combat-math.test.ts
// Unit tests for V13 combat math pure functions.

import {
  rollDie,
  rollD20,
  rollDamage,
  applyMitigation,
  relentlessMitigation,
  blockReduction,
  baseAccuracy,
  hitChance,
  baseCritChance,
  effectiveCritChance,
  baseReactionChance,
  effectiveReactionChance,
  staminaCost,
  computeMaxStamina,
  computeStaminaRegen,
  abilityTier,
  resolveTierAbilities,
  relentlessBypass,
  ironGuardCatch,
  counterPunchRate,
  counterPunchDamageMult,
  cpCatchRate,
  getCurrentTempo,
  actionRate,
  recoveryHp,
  scoreDecision,
  roundWinner,
  checkTKO,
  isDesperate,
  desperationDamage,
  applyCondition,
  isPowerAttack,
} from '../../lib/v13/combat-math'

// ─── Dice ───────────────────────────────────────────────────────────────────

describe('rollDie', () => {
  it('returns values in [1, sides]', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(6)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    }
  })

  it('d4 returns 1-4', () => {
    const results = new Set<number>()
    for (let i = 0; i < 200; i++) results.add(rollDie(4))
    expect(results.has(1)).toBe(true)
    expect(results.has(4)).toBe(true)
    expect(results.has(0)).toBe(false)
    expect(results.has(5)).toBe(false)
  })
})

describe('rollD20', () => {
  it('returns values in [1, 20]', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD20()
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })
})

// ─── Damage ─────────────────────────────────────────────────────────────────

describe('rollDamage', () => {
  it('jab rolls d4 + powMod, min 1', () => {
    for (let i = 0; i < 100; i++) {
      const dmg = rollDamage('jab', 0)
      expect(dmg).toBeGreaterThanOrEqual(1)
      expect(dmg).toBeLessThanOrEqual(4)
    }
  })

  it('combo rolls 2d6 + powMod', () => {
    for (let i = 0; i < 100; i++) {
      const dmg = rollDamage('combo', 0)
      expect(dmg).toBeGreaterThanOrEqual(2)
      expect(dmg).toBeLessThanOrEqual(12)
    }
  })

  it('adds POW modifier', () => {
    for (let i = 0; i < 100; i++) {
      const dmg = rollDamage('jab', 2)
      expect(dmg).toBeGreaterThanOrEqual(3) // 1 + 2
      expect(dmg).toBeLessThanOrEqual(6)    // 4 + 2
    }
  })

  it('negative powMod floors at 1', () => {
    for (let i = 0; i < 100; i++) {
      const dmg = rollDamage('jab', -10)
      expect(dmg).toBe(1) // d4 - 10, floored at 1
    }
  })

  it('unknown attack returns 1', () => {
    expect(rollDamage('unknown_attack', 0)).toBe(1)
  })
})

describe('applyMitigation', () => {
  it('reduces damage by endMod', () => {
    expect(applyMitigation(10, 2)).toBe(8)
  })

  it('floors at 1', () => {
    expect(applyMitigation(1, 5)).toBe(1)
  })

  it('negative endMod has no effect (treated as 0)', () => {
    expect(applyMitigation(5, -2)).toBe(5)
  })
})

describe('relentlessMitigation', () => {
  it('bypasses fraction of mitigation at R1', () => {
    const result = relentlessMitigation(2, 0)
    // bypass = max(1, 2 * 0.38) = max(1, 0.76) = 1
    expect(result.bypass).toBe(1)
    expect(result.effectiveMitigation).toBe(1) // 2 - 1
  })

  it('bypass scales with ability ramp at R3', () => {
    const result = relentlessMitigation(2, 2)
    // bypass = max(1, 2 * min(1, 0.42 * 1.8)) = max(1, 2 * 0.756) = max(1, 1.512) = 1.512
    expect(result.bypass).toBeCloseTo(1.512, 2)
    expect(result.effectiveMitigation).toBeCloseTo(0.488, 2)
  })

  it('floor of +1 applies when mitigation is 0', () => {
    const result = relentlessMitigation(0, 0)
    expect(result.bypass).toBe(1) // flat bonus floor
    expect(result.effectiveMitigation).toBe(0)
  })
})

// ─── Hit Chance ─────────────────────────────────────────────────────────────

describe('baseAccuracy', () => {
  it('50-stat fighter has 55% accuracy', () => {
    // statToMod(50) = 0
    expect(baseAccuracy(0)).toBeCloseTo(0.55)
  })

  it('80-stat fighter has higher accuracy', () => {
    // statToMod(80) = 2.0
    expect(baseAccuracy(2.0)).toBeCloseTo(0.65)
  })
})

describe('hitChance', () => {
  it('applies desperation penalty', () => {
    const normal = hitChance(0, false)
    const desperate = hitChance(0, true)
    expect(desperate).toBeCloseTo(normal - 0.10)
  })
})

// ─── Crit ───────────────────────────────────────────────────────────────────

describe('baseCritChance', () => {
  it('50-stat fighter has 5% crit', () => {
    expect(baseCritChance(0)).toBeCloseTo(0.05)
  })

  it('floors at 2%', () => {
    expect(baseCritChance(-3)).toBeCloseTo(0.02)
  })
})

describe('effectiveCritChance', () => {
  it('desperation adds 5% crit', () => {
    const normal = effectiveCritChance(0, false)
    const desperate = effectiveCritChance(0, true)
    expect(desperate - normal).toBeCloseTo(0.05)
  })
})

// ─── Reaction ───────────────────────────────────────────────────────────────

describe('baseReactionChance', () => {
  it('50-stat fighter has 15% reaction', () => {
    expect(baseReactionChance(0)).toBeCloseTo(0.15)
  })

  it('clamped at 5% minimum', () => {
    expect(baseReactionChance(-3)).toBe(0.05)
  })

  it('clamped at 45% maximum', () => {
    expect(baseReactionChance(10)).toBe(0.45)
  })
})

describe('effectiveReactionChance', () => {
  it('Iron Guard adds +8%', () => {
    const base = baseReactionChance(0)
    const withIG = effectiveReactionChance(0, false, true, false, false)
    expect(withIG).toBeCloseTo(base + 0.08)
  })

  it('Iron Man reduces by -10%', () => {
    const base = baseReactionChance(0)
    const withIM = effectiveReactionChance(0, false, false, false, true)
    expect(withIM).toBeCloseTo(Math.max(0.05, base - 0.10))
  })

  it('Mind Reader caps at 50%', () => {
    // High tecMod + Mind Reader
    const result = effectiveReactionChance(3, true, true, true, false)
    expect(result).toBeLessThanOrEqual(0.50)
  })
})

// ─── Stamina ────────────────────────────────────────────────────────────────

describe('staminaCost', () => {
  it('jab costs 3', () => {
    expect(staminaCost('jab')).toBe(3)
  })

  it('combo costs 16', () => {
    expect(staminaCost('combo')).toBe(16)
  })

  it('unknown action costs 0', () => {
    expect(staminaCost('move')).toBe(0)
  })
})

describe('computeMaxStamina', () => {
  it('END 50 fighter has ~100 stamina', () => {
    // 100 + (50-50)*0.8 + statToMod(50)*5 = 100 + 0 + 0 = 100
    expect(computeMaxStamina(50)).toBeCloseTo(100, 0)
  })

  it('END 80 fighter has higher stamina', () => {
    // 100 + (80-50)*0.8 + statToMod(80)*5 = 100 + 24 + 10 = 134
    expect(computeMaxStamina(80)).toBeCloseTo(134, 0)
  })
})

describe('computeStaminaRegen', () => {
  it('END 50 fighter has base regen', () => {
    // 0.3 + (50-50)/200 = 0.3
    expect(computeStaminaRegen(50)).toBeCloseTo(0.3)
  })

  it('END 80 fighter regens faster', () => {
    // 0.3 + (80-50)/200 = 0.3 + 0.15 = 0.45
    expect(computeStaminaRegen(80)).toBeCloseTo(0.45)
  })
})

// ─── Ability Tiers ──────────────────────────────────────────────────────────

describe('abilityTier', () => {
  it('returns 0 for stat 64', () => {
    expect(abilityTier(64)).toBe(0)
  })

  it('returns 1 for stat 65', () => {
    expect(abilityTier(65)).toBe(1)
  })

  it('returns 2 for stat 80', () => {
    expect(abilityTier(80)).toBe(2)
  })

  it('returns 3 for stat 95', () => {
    expect(abilityTier(95)).toBe(3)
  })

  it('returns 3 for stat 100', () => {
    expect(abilityTier(100)).toBe(3)
  })
})

describe('resolveTierAbilities', () => {
  it('pressure fighter (pow 80) has relentless', () => {
    const tiers = resolveTierAbilities(80, 57, 58)
    expect(tiers.tier2.relentless).toBe(true)
    expect(tiers.tier2.ironGuard).toBe(false)
    expect(tiers.tier2.counterPunch).toBe(false)
    expect(tiers.tier1.heavyHands).toBe(true)
  })

  it('turtle fighter (end 80) has iron guard', () => {
    const tiers = resolveTierAbilities(57, 80, 58)
    expect(tiers.tier2.ironGuard).toBe(true)
    expect(tiers.tier2.relentless).toBe(false)
  })

  it('counter fighter (tec 80) has counter punch', () => {
    const tiers = resolveTierAbilities(57, 58, 80)
    expect(tiers.tier2.counterPunch).toBe(true)
    expect(tiers.tier1.ringSense).toBe(true)
  })

  it('hybrid (65/65/65) has tier 1 in all', () => {
    const tiers = resolveTierAbilities(65, 65, 65)
    expect(tiers.tier1.heavyHands).toBe(true)
    expect(tiers.tier1.thickSkin).toBe(true)
    expect(tiers.tier1.ringSense).toBe(true)
    expect(tiers.tier2.relentless).toBe(false)
    expect(tiers.tier2.ironGuard).toBe(false)
    expect(tiers.tier2.counterPunch).toBe(false)
  })
})

// ─── Ability Scaling ────────────────────────────────────────────────────────

describe('relentlessBypass', () => {
  it('R1 = 42% base', () => {
    expect(relentlessBypass(0)).toBeCloseTo(0.42)
  })

  it('R2 = 0.42 * 1.3 = 0.546', () => {
    expect(relentlessBypass(1)).toBeCloseTo(0.546)
  })

  it('R3 = 0.42 * 1.8 = 0.756', () => {
    expect(relentlessBypass(2)).toBeCloseTo(0.756)
  })

  it('capped at 1.0', () => {
    // Even with extreme ramp, never > 1
    expect(relentlessBypass(0)).toBeLessThanOrEqual(1.0)
    expect(relentlessBypass(2)).toBeLessThanOrEqual(1.0)
  })
})

describe('ironGuardCatch', () => {
  it('R1 = 55% base', () => {
    expect(ironGuardCatch(0)).toBeCloseTo(0.55)
  })

  it('R2 = 0.55 * 1.3 = 0.70 (capped)', () => {
    // 0.55 * 1.3 = 0.715, capped at 0.70
    expect(ironGuardCatch(1)).toBeCloseTo(0.70)
  })

  it('R3 capped at 70%', () => {
    // 0.55 * 1.8 = 0.99, capped at 0.70
    expect(ironGuardCatch(2)).toBeCloseTo(0.70)
  })
})

describe('counterPunchRate', () => {
  it('R1 = 21.5%', () => {
    expect(counterPunchRate(0)).toBeCloseTo(0.215)
  })

  it('R2 = 0.215 * 1.3 = 0.2795', () => {
    expect(counterPunchRate(1)).toBeCloseTo(0.2795)
  })

  it('R3 = 0.215 * 1.8 = 0.387', () => {
    expect(counterPunchRate(2)).toBeCloseTo(0.387)
  })
})

describe('cpCatchRate', () => {
  it('Iron Guard gets ironGuardCatch rate', () => {
    expect(cpCatchRate(true, false, 0)).toBeCloseTo(ironGuardCatch(0))
  })

  it('Relentless gets 0% (cant cover up)', () => {
    expect(cpCatchRate(false, true, 0)).toBe(0)
  })

  it('normal fighter gets 30%', () => {
    expect(cpCatchRate(false, false, 0)).toBeCloseTo(0.30)
  })
})

// ─── Tempo ──────────────────────────────────────────────────────────────────

describe('getCurrentTempo', () => {
  it('full stamina = base tempo (100)', () => {
    expect(getCurrentTempo(100, 100, 0, false)).toBeCloseTo(100)
  })

  it('half stamina = 90 in R1 (clamped by floor)', () => {
    // Raw: 100 * 0.5 = 50. Floor R1 = 90. So clamped to 90.
    expect(getCurrentTempo(50, 100, 0, false)).toBeCloseTo(90)
  })

  it('R3 has no floor (0%)', () => {
    // Raw: 100 * 0.3 = 30. Floor R3 = 0. So 30.
    expect(getCurrentTempo(30, 100, 2, false)).toBeCloseTo(30)
  })

  it('desperation floor applies', () => {
    // Raw: 100 * 0.1 = 10. Desperation floor = 70. So 70.
    expect(getCurrentTempo(10, 100, 2, true)).toBeCloseTo(70)
  })
})

describe('actionRate', () => {
  it('tempo 100 = ~7.5% per tick', () => {
    expect(actionRate(100)).toBeCloseTo(0.075)
  })

  it('tempo 50 = ~3.75% per tick', () => {
    expect(actionRate(50)).toBeCloseTo(0.0375)
  })
})

// ─── Recovery ───────────────────────────────────────────────────────────────

describe('recoveryHp', () => {
  it('after R1 (round 0), base 15% of 225 = 33.75', () => {
    const hp = recoveryHp(0, false, 0, 'normal')
    expect(hp).toBeCloseTo(33.75)
  })

  it('after R2 (round 1), base 10% of 225 = 22.5', () => {
    const hp = recoveryHp(1, false, 0, 'normal')
    expect(hp).toBeCloseTo(22.5)
  })

  it('trailing bonus adds 5% of 225 = 11.25', () => {
    const noTrail = recoveryHp(0, false, 0, 'normal')
    const trailing = recoveryHp(0, true, 0, 'normal')
    expect(trailing - noTrail).toBeCloseTo(11.25)
  })

  it('END modifier adds recovery', () => {
    // endMod=2: 2 * 0.02 * 225 = 9
    const base = recoveryHp(0, false, 0, 'normal')
    const withEnd = recoveryHp(0, false, 2, 'normal')
    expect(withEnd - base).toBeCloseTo(9)
  })

  it('fresh condition adds 2% recovery', () => {
    const normal = recoveryHp(0, false, 0, 'normal')
    const fresh = recoveryHp(0, false, 0, 'fresh')
    expect(fresh).toBeCloseTo(normal * 1.02)
  })

  it('no recovery after R3 (round 2)', () => {
    expect(recoveryHp(2, false, 0, 'normal')).toBe(0)
  })
})

// ─── Decision Scoring ───────────────────────────────────────────────────────

describe('scoreDecision', () => {
  it('fighter with more R3 damage wins (R3 has 40% weight)', () => {
    // F1: 10, 10, 100. F2: 50, 50, 10.
    // F1 weighted: 10*0.25 + 10*0.35 + 100*0.40 = 2.5 + 3.5 + 40 = 46
    // F2 weighted: 50*0.25 + 50*0.35 + 10*0.40 = 12.5 + 17.5 + 4 = 34
    expect(scoreDecision([10, 10, 100], [50, 50, 10], 100, 100)).toBe(1)
  })

  it('equal weighted damage goes to HP tiebreaker', () => {
    expect(scoreDecision([10, 10, 10], [10, 10, 10], 100, 50)).toBe(1)
    expect(scoreDecision([10, 10, 10], [10, 10, 10], 50, 100)).toBe(2)
  })

  it('exact tie in HP favors fighter 1', () => {
    expect(scoreDecision([10, 10, 10], [10, 10, 10], 100, 100)).toBe(1)
  })
})

describe('roundWinner', () => {
  it('fighter1 wins with more damage', () => {
    expect(roundWinner(50, 30)).toBe(1)
  })

  it('fighter2 wins with more damage', () => {
    expect(roundWinner(30, 50)).toBe(2)
  })

  it('tie returns 0', () => {
    expect(roundWinner(50, 50)).toBe(0)
  })
})

// ─── TKO & Desperation ──────────────────────────────────────────────────────

describe('checkTKO', () => {
  it('returns false when HP >= 15% of 225', () => {
    // 15% of 225 = 33.75
    expect(checkTKO(34, 0)).toBe(false)
  })

  it('returns false at 0 HP (that is KO, not TKO)', () => {
    expect(checkTKO(0, 0)).toBe(false)
  })

  // Statistical test: TKO at R1 should trigger ~10% of the time (d20 <= 2)
  it('R1 TKO triggers at roughly 10% rate', () => {
    let triggers = 0
    const trials = 10000
    for (let i = 0; i < trials; i++) {
      if (checkTKO(10, 0)) triggers++
    }
    const rate = triggers / trials
    expect(rate).toBeGreaterThan(0.05)
    expect(rate).toBeLessThan(0.20)
  })
})

describe('isDesperate', () => {
  it('false above 35% HP', () => {
    // 35% of 225 = 78.75
    expect(isDesperate(79)).toBe(false)
  })

  it('true below 35% HP', () => {
    expect(isDesperate(78)).toBe(true)
  })
})

describe('desperationDamage', () => {
  it('adds 20% damage', () => {
    expect(desperationDamage(10)).toBe(12) // floor(10 * 1.2) = 12
  })

  it('floors to integer', () => {
    expect(desperationDamage(7)).toBe(8) // floor(7 * 1.2) = floor(8.4) = 8
  })
})

// ─── Condition ──────────────────────────────────────────────────────────────

describe('applyCondition', () => {
  it('normal has no effect', () => {
    expect(applyCondition(100, 'tempo', 'normal')).toBe(100)
  })

  it('fresh adds 2% tempo', () => {
    expect(applyCondition(100, 'tempo', 'fresh')).toBeCloseTo(102)
  })

  it('tired reduces stamina by 4%', () => {
    expect(applyCondition(100, 'stamina', 'tired')).toBeCloseTo(96)
  })
})

// ─── Power Attack ───────────────────────────────────────────────────────────

describe('isPowerAttack', () => {
  it('hook is a power attack', () => {
    expect(isPowerAttack('hook')).toBe(true)
  })

  it('jab is not a power attack', () => {
    expect(isPowerAttack('jab')).toBe(false)
  })

  it('combo is a power attack', () => {
    expect(isPowerAttack('combo')).toBe(true)
  })
})
