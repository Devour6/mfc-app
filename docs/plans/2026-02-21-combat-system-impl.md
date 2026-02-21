# Combat System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded fight engine with a DnD 5e d20 combat resolution system where fighter stats and gear drive every outcome.

**Architecture:** Bottom-up build. Pure dice functions → stat calculators → combat resolver → fight engine integration. Each layer depends only on the one below it. Gear system (schema + engine + API) builds in parallel after the core combat chain is done.

**Tech Stack:** TypeScript, Jest (node environment for engine tests), Prisma (PostgreSQL), Next.js API routes

**Design Doc:** `docs/plans/2026-02-20-combat-system-design.md`

---

## Task 1: Core Dice System

Pure dice rolling functions. No dependencies. Foundation for everything.

**Files:**
- Create: `lib/dice.ts`
- Test: `__tests__/dice.test.ts`

**Step 1: Write the failing tests**

```typescript
// __tests__/dice.test.ts
import { rollD20, rollDie, rollDamage, rollWithAdvantage, rollWithDisadvantage, DAMAGE_DICE } from '@/lib/dice'

describe('rollDie', () => {
  it('returns a number between 1 and sides inclusive', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(6)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    }
  })

  it('returns integers only', () => {
    for (let i = 0; i < 50; i++) {
      expect(Number.isInteger(rollDie(20))).toBe(true)
    }
  })
})

describe('rollD20', () => {
  it('returns 1-20', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD20()
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })
})

describe('rollDamage', () => {
  it('rolls correct die for jab (1d4)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('jab')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(4)
    }
  })

  it('rolls correct die for cross (1d6)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('cross')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    }
  })

  it('rolls correct die for hook (1d8)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('hook')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(8)
    }
  })

  it('rolls correct die for uppercut (1d10)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('uppercut')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
    }
  })

  it('rolls correct die for kick (1d8)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('kick')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(8)
    }
  })

  it('rolls correct die for roundhouse (1d12)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('roundhouse')
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(12)
    }
  })

  it('rolls 2d6 for combo (range 2-12)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDamage('combo')
      expect(result).toBeGreaterThanOrEqual(2)
      expect(result).toBeLessThanOrEqual(12)
    }
  })
})

describe('rollWithAdvantage', () => {
  it('returns a value between 1 and 20', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollWithAdvantage()
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })

  it('statistically averages higher than a flat d20 (~13.8 vs 10.5)', () => {
    let sum = 0
    const trials = 10000
    for (let i = 0; i < trials; i++) sum += rollWithAdvantage()
    const avg = sum / trials
    expect(avg).toBeGreaterThan(12.5) // well above 10.5
  })
})

describe('rollWithDisadvantage', () => {
  it('returns a value between 1 and 20', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollWithDisadvantage()
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })

  it('statistically averages lower than a flat d20 (~7.2 vs 10.5)', () => {
    let sum = 0
    const trials = 10000
    for (let i = 0; i < trials; i++) sum += rollWithDisadvantage()
    const avg = sum / trials
    expect(avg).toBeLessThan(8.5) // well below 10.5
  })
})

describe('DAMAGE_DICE', () => {
  it('maps all 7 attack types', () => {
    expect(Object.keys(DAMAGE_DICE)).toEqual(
      expect.arrayContaining(['jab', 'cross', 'hook', 'uppercut', 'kick', 'roundhouse', 'combo'])
    )
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/dice.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '@/lib/dice'`

**Step 3: Write minimal implementation**

```typescript
// lib/dice.ts

export type AttackType = 'jab' | 'cross' | 'hook' | 'uppercut' | 'kick' | 'roundhouse' | 'combo'

/** Damage die mapping: attack type → { sides, count } */
export const DAMAGE_DICE: Record<AttackType, { sides: number; count: number }> = {
  jab:        { sides: 4,  count: 1 },  // 1d4, avg 2.5
  cross:      { sides: 6,  count: 1 },  // 1d6, avg 3.5
  hook:       { sides: 8,  count: 1 },  // 1d8, avg 4.5
  uppercut:   { sides: 10, count: 1 },  // 1d10, avg 5.5
  kick:       { sides: 8,  count: 1 },  // 1d8, avg 4.5
  roundhouse: { sides: 12, count: 1 },  // 1d12, avg 6.5
  combo:      { sides: 6,  count: 2 },  // 2d6, avg 7.0
}

/** Roll a single die with N sides. Returns 1-N. */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/** Roll a d20. */
export function rollD20(): number {
  return rollDie(20)
}

/** Roll damage for an attack type. Returns total damage dice result. */
export function rollDamage(attackType: AttackType): number {
  const { sides, count } = DAMAGE_DICE[attackType]
  let total = 0
  for (let i = 0; i < count; i++) total += rollDie(sides)
  return total
}

/** Roll 2d20, take the higher (advantage). */
export function rollWithAdvantage(): number {
  return Math.max(rollD20(), rollD20())
}

/** Roll 2d20, take the lower (disadvantage). */
export function rollWithDisadvantage(): number {
  return Math.min(rollD20(), rollD20())
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/dice.test.ts --no-coverage`
Expected: PASS (all 9 tests)

**Step 5: Commit**

```bash
git add lib/dice.ts __tests__/dice.test.ts
git commit -m "feat: add core dice system (d20, damage dice, advantage/disadvantage)"
```

---

## Task 2: Combat Stats Calculator

Pure functions that convert fighter stats (0-100) into DnD modifiers and combat parameters.

**Files:**
- Create: `lib/combat-stats.ts`
- Test: `__tests__/combat-stats.test.ts`

**Step 1: Write the failing tests**

```typescript
// __tests__/combat-stats.test.ts
import {
  statToModifier,
  calculateAC,
  calculateStaminaPool,
  calculateStaminaRegen,
  calculateReactionChance,
  calculateCritRange,
  calculateActionRate,
} from '@/lib/combat-stats'

describe('statToModifier', () => {
  it('returns 0 for stat 50 (average)', () => {
    expect(statToModifier(50)).toBe(0)
  })

  it('returns +5 for stat 100', () => {
    expect(statToModifier(100)).toBe(5)
  })

  it('returns -5 for stat 0', () => {
    expect(statToModifier(0)).toBe(-5)
  })

  it('returns +3 for stat 80', () => {
    expect(statToModifier(80)).toBe(3)
  })

  it('floors fractional results', () => {
    // stat 65 → (65-50)/10 = 1.5 → floor to 1
    expect(statToModifier(65)).toBe(1)
  })

  it('clamps stat below 0 to -5', () => {
    expect(statToModifier(-10)).toBe(-5)
  })

  it('clamps stat above 100 to +5', () => {
    expect(statToModifier(120)).toBe(5)
  })
})

describe('calculateAC', () => {
  it('returns 10 for defense 50 (average)', () => {
    expect(calculateAC(50)).toBe(10)
  })

  it('returns 15 for defense 100', () => {
    expect(calculateAC(100)).toBe(15)
  })

  it('returns 5 for defense 0', () => {
    expect(calculateAC(0)).toBe(5)
  })
})

describe('calculateStaminaPool', () => {
  it('returns 50 for stamina 50', () => {
    expect(calculateStaminaPool(50)).toBe(50)
  })

  it('returns 100 for stamina 100', () => {
    expect(calculateStaminaPool(100)).toBe(100)
  })

  it('returns 0 for stamina 0', () => {
    expect(calculateStaminaPool(0)).toBe(0)
  })
})

describe('calculateStaminaRegen', () => {
  it('returns 0.5 for stamina 50', () => {
    expect(calculateStaminaRegen(50)).toBeCloseTo(0.5)
  })

  it('returns higher regen for higher stamina', () => {
    expect(calculateStaminaRegen(80)).toBeGreaterThan(calculateStaminaRegen(50))
  })
})

describe('calculateReactionChance', () => {
  it('returns 0.15 for fightIQ 50 (base 15%)', () => {
    expect(calculateReactionChance(50)).toBeCloseTo(0.15)
  })

  it('returns ~0.40 for fightIQ 100 (max 40%)', () => {
    expect(calculateReactionChance(100)).toBeCloseTo(0.40)
  })

  it('returns ~0.025 for fightIQ 0 (min 2.5%)', () => {
    expect(calculateReactionChance(0)).toBeCloseTo(0.025)
  })
})

describe('calculateCritRange', () => {
  it('returns 20 for fightIQ below 80 (nat 20 only)', () => {
    expect(calculateCritRange(50, false)).toBe(20)
  })

  it('returns 19 for fightIQ >= 80 (19-20)', () => {
    expect(calculateCritRange(80, false)).toBe(19)
  })

  it('returns 18 for fightIQ >= 80 with expanded crit gear (18-20)', () => {
    expect(calculateCritRange(80, true)).toBe(18)
  })

  it('returns 19 for fightIQ < 80 with expanded crit gear', () => {
    expect(calculateCritRange(50, true)).toBe(19)
  })

  it('never goes below 18', () => {
    expect(calculateCritRange(100, true)).toBe(18)
  })
})

describe('calculateActionRate', () => {
  it('returns higher rate for higher speed', () => {
    expect(calculateActionRate(80)).toBeGreaterThan(calculateActionRate(50))
  })

  it('halves rate when gassed', () => {
    const normal = calculateActionRate(50, false)
    const gassed = calculateActionRate(50, true)
    expect(gassed).toBeCloseTo(normal / 2)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/combat-stats.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '@/lib/combat-stats'`

**Step 3: Write minimal implementation**

```typescript
// lib/combat-stats.ts

/** Convert a 0-100 stat to a DnD modifier (-5 to +5). */
export function statToModifier(stat: number): number {
  const clamped = Math.max(0, Math.min(100, stat))
  return Math.floor((clamped - 50) / 10)
}

/** Calculate Armor Class from defense stat. AC = 10 + DEF modifier. Range: 5-15. */
export function calculateAC(defense: number): number {
  return 10 + statToModifier(defense)
}

/** Calculate stamina pool from stamina stat. Range: 0-100. */
export function calculateStaminaPool(stamina: number): number {
  return Math.max(0, Math.min(100, 50 + (stamina - 50)))
}

/** Calculate stamina regen per tick. */
export function calculateStaminaRegen(stamina: number): number {
  return 0.5 + (stamina - 50) / 100
}

/**
 * Calculate reaction chance (dodge/block trigger) from Fight IQ.
 * Formula: 15% + (FIQ - 50) / 100 * 25%. Range: 2.5% - 40%.
 */
export function calculateReactionChance(fightIQ: number): number {
  return 0.15 + ((fightIQ - 50) / 100) * 0.25
}

/**
 * Calculate the minimum d20 roll needed for a critical hit.
 * Base: 20 (nat 20 only = 5%). FIQ >= 80: 19 (10%). Expanded Crit gear: -1 more.
 * Minimum possible: 18 (15%).
 */
export function calculateCritRange(fightIQ: number, hasExpandedCrit: boolean): number {
  let critMin = 20
  if (fightIQ >= 80) critMin = 19
  if (hasExpandedCrit) critMin -= 1
  return Math.max(18, critMin)
}

/**
 * Calculate action attempt rate per tick from speed stat.
 * Base ~0.12 at speed 50, scales with speed. Halved when gassed.
 */
export function calculateActionRate(speed: number, isGassed: boolean = false): number {
  const base = 0.08 + (speed / 100) * 0.10
  return isGassed ? base / 2 : base
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/combat-stats.test.ts --no-coverage`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add lib/combat-stats.ts __tests__/combat-stats.test.ts
git commit -m "feat: add combat stats calculator (modifiers, AC, stamina, crit range)"
```

---

## Task 3: Stamina Cost Constants

Small utility — defines stamina costs per action. Used by combat resolver and fight engine.

**Files:**
- Modify: `lib/combat-stats.ts` (add stamina costs)
- Modify: `__tests__/combat-stats.test.ts` (add test)

**Step 1: Write the failing test**

Add to `__tests__/combat-stats.test.ts`:

```typescript
import { STAMINA_COSTS } from '@/lib/combat-stats'

describe('STAMINA_COSTS', () => {
  it('defines costs for all action types', () => {
    expect(STAMINA_COSTS.jab).toBe(2)
    expect(STAMINA_COSTS.cross).toBe(4)
    expect(STAMINA_COSTS.hook).toBe(5)
    expect(STAMINA_COSTS.kick).toBe(5)
    expect(STAMINA_COSTS.uppercut).toBe(6)
    expect(STAMINA_COSTS.roundhouse).toBe(8)
    expect(STAMINA_COSTS.combo).toBe(10)
    expect(STAMINA_COSTS.dodge).toBe(8)
    expect(STAMINA_COSTS.block).toBe(5)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/combat-stats.test.ts --no-coverage`
Expected: FAIL — `STAMINA_COSTS is not exported`

**Step 3: Add to `lib/combat-stats.ts`**

```typescript
/** Stamina cost per action, from the design doc. */
export const STAMINA_COSTS: Record<string, number> = {
  jab: 2,
  cross: 4,
  hook: 5,
  kick: 5,
  uppercut: 6,
  roundhouse: 8,
  combo: 10,
  dodge: 8,
  block: 5,
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/combat-stats.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/combat-stats.ts __tests__/combat-stats.test.ts
git commit -m "feat: add stamina cost constants per action type"
```

---

## Task 4: Combat Resolver

The core d20 attack resolution. Takes attacker/defender stats + attack type, returns a structured result. This is the brain of the new fight engine.

**Files:**
- Create: `lib/combat-resolver.ts`
- Test: `__tests__/combat-resolver.test.ts`

**Step 1: Write the failing tests**

```typescript
// __tests__/combat-resolver.test.ts
import { resolveAttack, CombatResult } from '@/lib/combat-resolver'
import * as dice from '@/lib/dice'

// Mock dice for deterministic tests
jest.mock('@/lib/dice', () => ({
  ...jest.requireActual('@/lib/dice'),
  rollD20: jest.fn(),
  rollDie: jest.fn(),
  rollDamage: jest.fn(),
  rollWithDisadvantage: jest.fn(),
  DAMAGE_DICE: jest.requireActual('@/lib/dice').DAMAGE_DICE,
}))

const mockedDice = dice as jest.Mocked<typeof dice>

const defaultStats = { strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50 }

beforeEach(() => jest.clearAllMocks())

describe('resolveAttack', () => {
  it('returns a hit when d20 + STR mod >= AC', () => {
    mockedDice.rollD20.mockReturnValue(12) // 12 + 0 mod = 12 >= AC 10
    mockedDice.rollDamage.mockReturnValue(4)
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false })
    expect(result.hit).toBe(true)
    expect(result.damage).toBeGreaterThan(0)
  })

  it('returns a miss when d20 + STR mod < AC', () => {
    mockedDice.rollD20.mockReturnValue(5) // 5 + 0 mod = 5 < AC 10
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false })
    expect(result.hit).toBe(false)
    expect(result.damage).toBe(0)
  })

  it('natural 20 always hits and crits', () => {
    mockedDice.rollD20.mockReturnValue(20)
    mockedDice.rollDamage.mockReturnValue(4)
    const highDefender = { ...defaultStats, defense: 100 } // AC 15
    const result = resolveAttack(defaultStats, highDefender, 'jab', { defenderReacts: false })
    expect(result.hit).toBe(true)
    expect(result.isCrit).toBe(true)
  })

  it('natural 1 always misses', () => {
    mockedDice.rollD20.mockReturnValue(1)
    const lowDefender = { ...defaultStats, defense: 0 } // AC 5
    const result = resolveAttack({ ...defaultStats, strength: 100 }, lowDefender, 'hook', { defenderReacts: false })
    expect(result.hit).toBe(false)
  })

  it('crit doubles damage dice but not modifier', () => {
    mockedDice.rollD20.mockReturnValue(20) // crit
    mockedDice.rollDamage.mockReturnValue(6) // base damage
    const attacker = { ...defaultStats, strength: 70 } // +2 STR mod
    const result = resolveAttack(attacker, defaultStats, 'cross', { defenderReacts: false })
    // Crit damage = (6 * 2) + 2 = 14
    expect(result.damage).toBe(14)
  })

  it('normal hit adds STR modifier to damage', () => {
    mockedDice.rollD20.mockReturnValue(15) // hit (15 >= AC 10)
    mockedDice.rollDamage.mockReturnValue(6) // base damage
    const attacker = { ...defaultStats, strength: 70 } // +2 STR mod
    const result = resolveAttack(attacker, defaultStats, 'cross', { defenderReacts: false })
    // Normal damage = 6 + 2 = 8
    expect(result.damage).toBe(8)
  })

  it('minimum damage is 1 on a hit (even with negative STR mod)', () => {
    mockedDice.rollD20.mockReturnValue(15)
    mockedDice.rollDamage.mockReturnValue(1) // min roll
    const weakAttacker = { ...defaultStats, strength: 0 } // -5 STR mod
    const result = resolveAttack(weakAttacker, { ...defaultStats, defense: 0 }, 'jab', { defenderReacts: false })
    expect(result.hit).toBe(true)
    expect(result.damage).toBeGreaterThanOrEqual(1)
  })

  it('dodge causes disadvantage', () => {
    mockedDice.rollWithDisadvantage.mockReturnValue(4) // 4 + 0 = 4 < AC 10
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: true, reactionType: 'dodge' })
    expect(result.hit).toBe(false)
    expect(result.defenseReaction).toBe('dodge')
  })

  it('block reduces damage', () => {
    mockedDice.rollD20.mockReturnValue(15) // hit
    mockedDice.rollDamage.mockReturnValue(6) // attack damage
    mockedDice.rollDie.mockReturnValue(3) // block roll (1d6)
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: true, reactionType: 'block' })
    expect(result.hit).toBe(true)
    // Block reduces by DEF mod (0) + 1d6 (3) = 3. Damage = max(1, 6 + 0 - 3) = 3
    expect(result.damage).toBe(3)
    expect(result.defenseReaction).toBe('block')
  })

  it('STR modifier affects attack roll', () => {
    // With STR 80 (+3 mod), roll of 7 becomes 10, which hits AC 10
    mockedDice.rollD20.mockReturnValue(7)
    mockedDice.rollDamage.mockReturnValue(4)
    const strongAttacker = { ...defaultStats, strength: 80 }
    const result = resolveAttack(strongAttacker, defaultStats, 'cross', { defenderReacts: false })
    expect(result.hit).toBe(true) // 7 + 3 = 10 >= AC 10
  })

  it('gassed penalty applies -2 to attack roll', () => {
    // Roll of 11 + 0 mod - 2 gassed = 9 < AC 10
    mockedDice.rollD20.mockReturnValue(11)
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false, isGassed: true })
    expect(result.hit).toBe(false)
  })

  it('desperation adds +2 to attack roll', () => {
    // Roll of 8 + 0 mod + 2 desperation = 10 >= AC 10
    mockedDice.rollD20.mockReturnValue(8)
    mockedDice.rollDamage.mockReturnValue(4)
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false, desperationBonus: 2 })
    expect(result.hit).toBe(true)
  })

  it('crowd energy adds bonus damage', () => {
    mockedDice.rollD20.mockReturnValue(15) // hit
    mockedDice.rollDamage.mockReturnValue(6)
    mockedDice.rollDie.mockReturnValue(4) // crowd energy 1d6
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false, crowdEnergyBonus: true })
    // Damage = 6 + 0 + 4 (crowd energy 1d6) = 10
    expect(result.damage).toBe(10)
  })

  it('returns attackRoll in result for fight engine to use', () => {
    mockedDice.rollD20.mockReturnValue(17)
    mockedDice.rollDamage.mockReturnValue(5)
    const result = resolveAttack(defaultStats, defaultStats, 'cross', { defenderReacts: false })
    expect(result.attackRoll).toBe(17)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/combat-resolver.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '@/lib/combat-resolver'`

**Step 3: Write minimal implementation**

```typescript
// lib/combat-resolver.ts
import { rollD20, rollDamage, rollWithDisadvantage, rollDie, type AttackType } from './dice'
import { statToModifier, calculateAC, calculateCritRange } from './combat-stats'

export interface FighterCombatStats {
  strength: number
  speed: number
  defense: number
  stamina: number
  fightIQ: number
  aggression: number
}

export interface AttackOptions {
  /** Did the defender trigger a reaction? */
  defenderReacts: boolean
  /** Which reaction type (if any) */
  reactionType?: 'dodge' | 'block'
  /** Is the attacker gassed (below 20 stamina)? */
  isGassed?: boolean
  /** Desperation bonus to attack roll (+2 when HP < 25%) */
  desperationBonus?: number
  /** Crowd Energy: next landed hit gets +1d6 bonus damage */
  crowdEnergyBonus?: boolean
  /** Does the attacker have Expanded Crit gear trait? */
  hasExpandedCrit?: boolean
  /** Gear modifier bonus to STR (added to attack + damage rolls) */
  gearStrMod?: number
  /** Gear modifier bonus to DEF (added to AC) */
  gearDefMod?: number
}

export interface CombatResult {
  hit: boolean
  isCrit: boolean
  damage: number
  attackRoll: number
  defenseReaction: 'dodge' | 'block' | null
  attackType: AttackType
}

/**
 * Resolve a single attack using DnD 5e d20 mechanics.
 *
 * d20 + STR_modifier + gear_bonus + bonuses - penalties >= defender_AC + gear_def
 *
 * Nat 20 = auto-hit + crit (double damage dice, not modifiers).
 * Nat 1 = auto-miss regardless of modifiers.
 */
export function resolveAttack(
  attacker: FighterCombatStats,
  defender: FighterCombatStats,
  attackType: AttackType,
  options: AttackOptions,
): CombatResult {
  const strMod = statToModifier(attacker.strength) + (options.gearStrMod ?? 0)
  const ac = calculateAC(defender.defense) + (options.gearDefMod ?? 0)
  const critMin = calculateCritRange(attacker.fightIQ, options.hasExpandedCrit ?? false)

  // Roll the d20 (with disadvantage if defender dodges)
  let attackRoll: number
  if (options.defenderReacts && options.reactionType === 'dodge') {
    attackRoll = rollWithDisadvantage()
  } else {
    attackRoll = rollD20()
  }

  // Natural 1 = auto-miss
  if (attackRoll === 1) {
    return { hit: false, isCrit: false, damage: 0, attackRoll, defenseReaction: options.defenderReacts ? (options.reactionType ?? null) : null, attackType }
  }

  // Natural 20+ = auto-hit + crit
  const isCrit = attackRoll >= critMin

  // Calculate total attack value
  let totalAttack = attackRoll + strMod
  if (options.isGassed) totalAttack -= 2
  if (options.desperationBonus) totalAttack += options.desperationBonus

  // Check hit (nat 20 auto-hits)
  const hit = isCrit || totalAttack >= ac

  if (!hit) {
    return { hit: false, isCrit: false, damage: 0, attackRoll, defenseReaction: options.defenderReacts ? (options.reactionType ?? null) : null, attackType }
  }

  // Roll damage
  let baseDamage = rollDamage(attackType)

  // Crit: double the dice, not the modifier
  if (isCrit) {
    baseDamage *= 2
  }

  // Add STR modifier to damage
  let totalDamage = baseDamage + strMod

  // Block: reduce damage by DEF mod + 1d6
  if (options.defenderReacts && options.reactionType === 'block') {
    const defMod = statToModifier(defender.defense) + (options.gearDefMod ?? 0)
    const blockRoll = rollDie(6)
    totalDamage = Math.max(1, totalDamage - (defMod + blockRoll))
  }

  // Crowd Energy: +1d6 bonus damage
  if (options.crowdEnergyBonus) {
    totalDamage += rollDie(6)
  }

  // Minimum 1 damage on hit
  totalDamage = Math.max(1, totalDamage)

  return {
    hit: true,
    isCrit,
    damage: totalDamage,
    attackRoll,
    defenseReaction: options.defenderReacts ? (options.reactionType ?? null) : null,
    attackType,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/combat-resolver.test.ts --no-coverage`
Expected: PASS (all 13 tests)

**Step 5: Commit**

```bash
git add lib/combat-resolver.ts __tests__/combat-resolver.test.ts
git commit -m "feat: add d20 combat resolver (attack rolls, crits, defense reactions, comeback bonuses)"
```

---

## Task 5: Types Update

Add gear types and update FighterState for the new combat system. No tests — type-only changes verified by `npm run type-check`.

**Files:**
- Modify: `types/index.ts`

**Step 1: Add gear and combat types to `types/index.ts`**

Add after the `Fighter` interface:

```typescript
// ─── Gear System Types ─────────────────────────────────────────────────────

export type GearSlot = 'core_module' | 'neural_link' | 'arm_augments' | 'leg_rigs' | 'exo_frame'
export type CosmeticSlot = 'walkout_track' | 'war_paint'
export type GearRarity = 'standard' | 'enhanced' | 'superior' | 'legendary'

export interface SpecialTrait {
  id: string
  name: string
  description: string
  minRarity: 'superior' | 'legendary'
  effect: Record<string, number | boolean | string>
}

export interface GearItem {
  id: string
  name: string
  slot: GearSlot
  rarity: GearRarity
  statBonuses: Partial<Record<keyof Fighter['stats'], number>>
  specialTrait?: SpecialTrait
  equippedFighterId?: string
  ownerId: string
}

export interface GearLoadout {
  core_module?: GearItem
  neural_link?: GearItem
  arm_augments?: GearItem
  leg_rigs?: GearItem
  exo_frame?: GearItem
}

/** Computed modifier bonuses from all equipped gear */
export interface GearModifiers {
  strength: number
  speed: number
  defense: number
  stamina: number
  fightIQ: number
  aggression: number
  hasExpandedCrit: boolean
  hasIronChin: boolean
  hasGlassCannon: boolean
  hasCounterPuncher: boolean
  hasSecondWind: boolean
  hasKnockoutArtist: boolean
}

// ─── Combat State Types ────────────────────────────────────────────────────

export interface ComebackState {
  /** HP below 25%: +2 attack rolls, crit range +1 */
  desperationActive: boolean
  /** 3+ unanswered hits: next landed hit gets +1d6 */
  crowdEnergyActive: boolean
  crowdEnergyCounter: number
  /** Second Wind already used this fight */
  secondWindUsed: boolean
}
```

Update the `FighterState.modifiers` to include comeback state:

```typescript
// In FighterState interface, add to modifiers:
  modifiers: {
    stunned: number
    blocking: number
    dodging: number
    charging: number
    hitStopFrames: number
    // Comeback state
    desperationActive?: boolean
    crowdEnergyActive?: boolean
    crowdEnergyCounter?: number
    secondWindUsed?: boolean
  }
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (no type errors from additions — existing code doesn't reference new fields)

**Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add gear system and combat state types"
```

---

## Task 6: Gear Schema (Prisma)

Add the Gear model to the database. Replace the cosmetic Skin model references with functional gear.

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Gear model and enums to `prisma/schema.prisma`**

Add after the existing `SkinRarity` enum:

```prisma
enum GearSlot {
  CORE_MODULE
  NEURAL_LINK
  ARM_AUGMENTS
  LEG_RIGS
  EXO_FRAME
}

enum GearRarity {
  STANDARD
  ENHANCED
  SUPERIOR
  LEGENDARY
}

model Gear {
  id            String    @id @default(cuid())
  name          String
  slot          GearSlot
  rarity        GearRarity
  statBonuses   Json      // { strength?: number, speed?: number, ... } — modifier bonuses
  specialTrait  String?   // Trait ID (e.g., "iron_chin", "expanded_crit")
  createdAt     DateTime  @default(now())

  // Relationships
  owner         User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId       String
  fighter       Fighter?  @relation(fields: [fighterId], references: [id])
  fighterId     String?   // Null = in inventory, set = equipped

  @@index([ownerId])
  @@index([fighterId])
  @@index([slot])
  @@index([rarity])
  @@map("gear")
}
```

Add to User model relations:

```prisma
  gear        Gear[]
```

Add to Fighter model relations:

```prisma
  gear        Gear[]
```

Add pity counter fields to User model:

```prisma
  superiorPityCounter  Int @default(0) // Resets on Superior+ drop
  legendaryPityCounter Int @default(0) // Resets on Legendary drop
```

**Step 2: Generate migration**

Run: `npx prisma migrate dev --name add-gear-system`
Expected: Migration creates `gear` table with all columns and indexes

**Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: Client regenerated with Gear model

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Gear model with slot, rarity, stat bonuses, and pity counters"
```

---

## Task 7: Gear Engine

Gear generation from loot table, pity counter logic, and modifier calculation.

**Files:**
- Create: `lib/gear-engine.ts`
- Test: `__tests__/gear-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// __tests__/gear-engine.test.ts
import { rollGearRarity, generateGearName, calculateGearModifiers, SLOT_STAT_AFFINITY } from '@/lib/gear-engine'
import type { GearItem, GearModifiers } from '@/types'

describe('rollGearRarity', () => {
  it('returns a valid rarity', () => {
    for (let i = 0; i < 100; i++) {
      const rarity = rollGearRarity(0, 0)
      expect(['standard', 'enhanced', 'superior', 'legendary']).toContain(rarity)
    }
  })

  it('forces superior+ at pity counter 10', () => {
    for (let i = 0; i < 50; i++) {
      const rarity = rollGearRarity(10, 0)
      expect(['superior', 'legendary']).toContain(rarity)
    }
  })

  it('forces legendary at pity counter 50', () => {
    const rarity = rollGearRarity(0, 50)
    expect(rarity).toBe('legendary')
  })
})

describe('calculateGearModifiers', () => {
  it('returns all zeros for empty loadout', () => {
    const mods = calculateGearModifiers([])
    expect(mods.strength).toBe(0)
    expect(mods.defense).toBe(0)
    expect(mods.hasExpandedCrit).toBe(false)
  })

  it('sums stat bonuses from multiple items', () => {
    const gear: GearItem[] = [
      { id: '1', name: 'Test Arms', slot: 'arm_augments', rarity: 'enhanced', statBonuses: { strength: 1, aggression: 1 }, ownerId: 'u1' },
      { id: '2', name: 'Test Core', slot: 'core_module', rarity: 'standard', statBonuses: { strength: 1 }, ownerId: 'u1' },
    ]
    const mods = calculateGearModifiers(gear)
    expect(mods.strength).toBe(2)
    expect(mods.aggression).toBe(1)
  })

  it('detects expanded crit trait', () => {
    const gear: GearItem[] = [
      { id: '1', name: 'Crit Link', slot: 'neural_link', rarity: 'legendary', statBonuses: { fightIQ: 3, defense: 2 }, specialTrait: { id: 'expanded_crit', name: 'Expanded Crit', description: '', minRarity: 'legendary', effect: { critRangeBonus: 1 } }, ownerId: 'u1' },
    ]
    const mods = calculateGearModifiers(gear)
    expect(mods.hasExpandedCrit).toBe(true)
  })
})

describe('SLOT_STAT_AFFINITY', () => {
  it('maps all 5 gear slots', () => {
    expect(Object.keys(SLOT_STAT_AFFINITY)).toHaveLength(5)
    expect(SLOT_STAT_AFFINITY.core_module).toEqual(['strength', 'stamina'])
    expect(SLOT_STAT_AFFINITY.neural_link).toEqual(['fightIQ', 'defense'])
    expect(SLOT_STAT_AFFINITY.arm_augments).toEqual(['strength', 'aggression'])
    expect(SLOT_STAT_AFFINITY.leg_rigs).toEqual(['speed', 'defense'])
    expect(SLOT_STAT_AFFINITY.exo_frame).toEqual(['defense', 'stamina'])
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/gear-engine.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '@/lib/gear-engine'`

**Step 3: Write minimal implementation**

```typescript
// lib/gear-engine.ts
import type { GearItem, GearSlot, GearRarity, GearModifiers, SpecialTrait } from '@/types'

/** Stat affinities per slot — primary and secondary stat. */
export const SLOT_STAT_AFFINITY: Record<GearSlot, [string, string]> = {
  core_module:  ['strength', 'stamina'],
  neural_link:  ['fightIQ', 'defense'],
  arm_augments: ['strength', 'aggression'],
  leg_rigs:     ['speed', 'defense'],
  exo_frame:    ['defense', 'stamina'],
}

/** Drop rates: standard 65%, enhanced 25%, superior 8%, legendary 2% */
const DROP_RATES: Array<{ rarity: GearRarity; cumulative: number }> = [
  { rarity: 'legendary',  cumulative: 0.02 },
  { rarity: 'superior',   cumulative: 0.10 },
  { rarity: 'enhanced',   cumulative: 0.35 },
  { rarity: 'standard',   cumulative: 1.00 },
]

/** Roll a gear rarity from the loot table. Pity counters override when thresholds are hit. */
export function rollGearRarity(superiorPity: number, legendaryPity: number): GearRarity {
  // Legendary pity at 50 sessions
  if (legendaryPity >= 50) return 'legendary'

  // Superior+ pity at 10 sessions
  if (superiorPity >= 10) {
    // Re-roll until superior or better
    const roll = Math.random()
    return roll < 0.02 / 0.10 ? 'legendary' : 'superior'
  }

  // Normal roll
  const roll = Math.random()
  for (const { rarity, cumulative } of DROP_RATES) {
    if (roll < cumulative) return rarity
  }
  return 'standard'
}

/** Generate a name for a gear piece based on slot and rarity. */
export function generateGearName(slot: GearSlot, rarity: GearRarity): string {
  const slotNames: Record<GearSlot, string[]> = {
    core_module:  ['Reactor Core', 'Crystal Heart', 'Void Engine', 'Fusion Cell', 'Plasma Core'],
    neural_link:  ['Neural Mesh', 'Synapse Wire', 'Cortex Chip', 'Mind Link', 'Brain Frame'],
    arm_augments: ['Piston Fists', 'Plasma Knuckles', 'Chain Whips', 'Blade Arms', 'Power Grips'],
    leg_rigs:     ['Hydraulic Legs', 'Hover Jets', 'Magnetic Boots', 'Spring Stilts', 'Turbo Legs'],
    exo_frame:    ['Light Mesh', 'Heavy Plating', 'Nano Shell', 'Titan Frame', 'Ghost Armor'],
  }
  const names = slotNames[slot]
  const name = names[Math.floor(Math.random() * names.length)]
  const prefix: Record<GearRarity, string> = {
    standard: '',
    enhanced: 'Tuned ',
    superior: 'Overclocked ',
    legendary: 'Mythic ',
  }
  return `${prefix[rarity]}${name}`.trim()
}

/** Sum all modifier bonuses from equipped gear. */
export function calculateGearModifiers(gear: GearItem[]): GearModifiers {
  const mods: GearModifiers = {
    strength: 0, speed: 0, defense: 0, stamina: 0, fightIQ: 0, aggression: 0,
    hasExpandedCrit: false, hasIronChin: false, hasGlassCannon: false,
    hasCounterPuncher: false, hasSecondWind: false, hasKnockoutArtist: false,
  }

  for (const item of gear) {
    // Sum stat bonuses
    for (const [stat, bonus] of Object.entries(item.statBonuses)) {
      if (stat in mods && typeof bonus === 'number') {
        (mods as Record<string, number | boolean>)[stat] = (mods[stat as keyof GearModifiers] as number) + bonus
      }
    }

    // Check special traits
    if (item.specialTrait) {
      switch (item.specialTrait.id) {
        case 'expanded_crit':    mods.hasExpandedCrit = true; break
        case 'iron_chin':        mods.hasIronChin = true; break
        case 'glass_cannon':     mods.hasGlassCannon = true; break
        case 'counter_puncher':  mods.hasCounterPuncher = true; break
        case 'second_wind':      mods.hasSecondWind = true; break
        case 'knockout_artist':  mods.hasKnockoutArtist = true; break
      }
    }
  }

  // Glass Cannon trait: +1 damage mod, -1 AC
  if (mods.hasGlassCannon) {
    mods.strength += 1
    mods.defense -= 1
  }

  return mods
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/gear-engine.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/gear-engine.ts __tests__/gear-engine.test.ts
git commit -m "feat: add gear engine (loot table, pity counters, modifier calculation)"
```

---

## Task 8: Fight Engine Refactor

The big integration. Replace hardcoded combat in `lib/fight-engine.ts` with the d20 combat resolver. This is the largest task — break it into sub-steps.

**Files:**
- Modify: `lib/fight-engine.ts`
- Modify: `types/index.ts` (if needed for constructor changes)
- Test: `__tests__/fight-engine-d20.test.ts` (new integration tests)

**Step 1: Write integration tests for the refactored engine**

```typescript
// __tests__/fight-engine-d20.test.ts
import { FightEngine, FIGHTER_MAX_HP } from '@/lib/fight-engine'
import type { Fighter } from '@/types'

function makeFighter(overrides: Partial<Fighter['stats']> = {}, id = 'f1'): Fighter {
  return {
    id,
    name: `Fighter ${id}`,
    emoji: '🤖',
    class: 'Middleweight',
    record: { wins: 0, losses: 0, draws: 0 },
    elo: 1000,
    stats: { strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50, ...overrides },
    owner: 'u1',
    isActive: true,
    trainingCost: 100,
    evolution: {
      traits: { aggressive: 30, defensive: 30, showboat: 30, technical: 30 },
      signatureMoves: [], age: 25, peakAgeStart: 25, peakAgeEnd: 30,
      fightHistory: [], evolutionLevel: 1, totalFights: 0, winStreak: 0, careerHighlights: [],
    },
  }
}

describe('FightEngine d20 integration', () => {
  it('creates fighters with stat-driven stamina pools', () => {
    const highSta = makeFighter({ stamina: 80 }, 'high')
    const lowSta = makeFighter({ stamina: 20 }, 'low')
    const engine = new FightEngine(highSta, lowSta)
    const state = engine.getState()
    // High stamina fighter should have a larger stamina pool
    expect(state.fighter1.stamina).toBeGreaterThan(state.fighter2.stamina)
  })

  it('strong fighters deal more damage over many ticks', () => {
    // Run two fights: one with STR 80 vs 50, one with STR 20 vs 50
    // The STR 80 fighter should deal more total damage
    const strong = makeFighter({ strength: 80 }, 'strong')
    const weak = makeFighter({ strength: 20 }, 'weak')
    const avg = makeFighter({ strength: 50 }, 'avg')

    let strongDamage = 0
    let weakDamage = 0

    // Simulate 100 fights worth of damage comparison
    for (let trial = 0; trial < 50; trial++) {
      const e1 = new FightEngine(strong, makeFighter({}, 'def1'))
      e1.start()
      // Run 100 ticks
      for (let i = 0; i < 100; i++) (e1 as any).tick()
      e1.stop()
      strongDamage += FIGHTER_MAX_HP - e1.getState().fighter2.hp

      const e2 = new FightEngine(weak, makeFighter({}, 'def2'))
      e2.start()
      for (let i = 0; i < 100; i++) (e2 as any).tick()
      e2.stop()
      weakDamage += FIGHTER_MAX_HP - e2.getState().fighter2.hp
    }

    expect(strongDamage).toBeGreaterThan(weakDamage)
  })

  it('high defense fighters take less damage', () => {
    let tankDamage = 0
    let glassDamage = 0

    for (let trial = 0; trial < 50; trial++) {
      const tank = makeFighter({ defense: 80 }, 'tank')
      const glass = makeFighter({ defense: 20 }, 'glass')

      const e1 = new FightEngine(makeFighter({}, 'atk1'), tank)
      e1.start()
      for (let i = 0; i < 100; i++) (e1 as any).tick()
      e1.stop()
      tankDamage += FIGHTER_MAX_HP - e1.getState().fighter2.hp

      const e2 = new FightEngine(makeFighter({}, 'atk2'), glass)
      e2.start()
      for (let i = 0; i < 100; i++) (e2 as any).tick()
      e2.stop()
      glassDamage += FIGHTER_MAX_HP - e2.getState().fighter2.hp
    }

    expect(tankDamage).toBeLessThan(glassDamage)
  })

  it('engine still produces a winner (KO, TKO, or Decision)', () => {
    const f1 = makeFighter({}, 'a')
    const f2 = makeFighter({}, 'b')
    const engine = new FightEngine(f1, f2)
    engine.start()

    // Run enough ticks for a full fight (3 rounds * 180s * 12 ticks/s = ~6480 ticks)
    for (let i = 0; i < 7000; i++) (engine as any).tick()
    engine.stop()

    const state = engine.getState()
    expect(['ko', 'decision', 'ended']).toContain(state.phase)
    expect(state.result).toBeDefined()
    expect(state.result?.winner).toBeDefined()
  })
})
```

**Step 2: Run tests to verify they fail (current engine doesn't use stats)**

Run: `npx jest __tests__/fight-engine-d20.test.ts --no-coverage`
Expected: First test FAILS (stamina pool not stat-driven yet)

**Step 3: Refactor `lib/fight-engine.ts`**

This is the largest code change. Key modifications:

1. **Constructor:** Store both Fighter objects. Compute effective stats using `FighterEvolutionEngine.getModifiedStats()`. Compute gear modifiers. Set stamina from `calculateStaminaPool()`.

2. **`shouldAttemptAction()`:** Replace hardcoded `0.12` with `calculateActionRate(speed, isGassed)`. Remove `FightBiasConfig` references.

3. **`selectAction()`:** Use aggression stat to weight action selection. High AGG = more heavy attacks. Low AGG = more jabs/blocks.

4. **`executeStrike()` / `executeKick()`:** Replace hardcoded hit chance and damage with `resolveAttack()` call. Pass comeback state (desperation, crowd energy).

5. **`executeCombo()`:** Replace hardcoded damage with multiple `resolveAttack()` calls.

6. **`regenerateStamina()`:** Use `calculateStaminaRegen(staStat)` instead of hardcoded 0.4.

7. **`createFighterState()`:** Set `stamina` from `calculateStaminaPool()` instead of 100.

8. **Add comeback tracking:** Check HP thresholds for Desperation. Track unanswered hits for Crowd Energy. Trigger Second Wind at round breaks.

9. **`nextRound()`:** Apply Second Wind if fighter is behind and has the gear trait (or just base mechanic). Recover stamina to 50% of max if behind on score.

10. **Remove `FightBiasConfig`** from constructor and all methods. The d20 system + stats replaces it entirely.

**Important:** The fight engine's visual output (animations, hit-stop, commentary) stays the same. Only the combat math changes. The canvas doesn't care whether damage came from `Math.random() * 8` or a d20 roll.

**Detailed implementation notes for the engineer:**

- `lib/fight-engine.ts:28-53` — Constructor: add `fighter1Data: Fighter` and `fighter2Data: Fighter` fields. Remove `biasConfig`. Call `calculateStaminaPool(fighter.stats.stamina)` for initial stamina.
- `lib/fight-engine.ts:206-229` — `shouldAttemptAction`: replace `probability = 0.12` with `calculateActionRate(speed, stamina < 20)`. Remove all bias references.
- `lib/fight-engine.ts:231-289` — `selectAction`: multiply heavy attack weights by `aggression / 50`. Multiply defensive weights by `(100 - aggression) / 50`.
- `lib/fight-engine.ts:321-347` — `executeStrike`: call `resolveAttack()` instead of manual hit chance + damage calc. Map the `CombatResult` back to animation/commentary.
- `lib/fight-engine.ts:349-373` — `executeKick`: same pattern as executeStrike.
- `lib/fight-engine.ts:471-503` — `executeCombo`: call `resolveAttack()` for each hit in the sequence.
- `lib/fight-engine.ts:580-586` — `regenerateStamina`: use `calculateStaminaRegen(staStat)`.
- `lib/fight-engine.ts:604-617` — `nextRound`: add Second Wind check.

**Step 4: Run all tests**

Run: `npx jest __tests__/fight-engine-d20.test.ts --no-coverage`
Expected: PASS

Also run existing fight probability tests to check for regressions:
Run: `npx jest __tests__/fight-probability.test.ts --no-coverage`
Expected: PASS (fight-probability is independent of fight-engine internals)

**Step 5: Commit**

```bash
git add lib/fight-engine.ts __tests__/fight-engine-d20.test.ts
git commit -m "feat: refactor fight engine to use d20 combat resolver — stats now drive all outcomes"
```

---

## Task 9: Update Fight Probability

The existing `lib/fight-probability.ts` uses record/training to pre-determine winners and create bias. With the d20 system, stats drive outcomes directly — no pre-determination needed. But `fight-probability.ts` is still used by `LiveFightSection` to set initial market prices.

**Decision:** Keep `fight-probability.ts` for **market pricing only** (it calculates who the market thinks will win). Remove its connection to `FightBiasConfig`. The fight engine no longer accepts a bias config — stats alone determine the fight.

**Files:**
- Modify: `lib/fight-probability.ts` — remove `FightBiasConfig` import and `determineFightOutcome()`, keep `calculateWinProbability()` for market use
- Modify: `__tests__/fight-probability.test.ts` — remove `determineFightOutcome` tests, keep probability tests
- Modify: `lib/fight-engine.ts` — remove `FightBiasConfig` export if not done in Task 8

**Step 1: Update fight-probability.ts**

Remove `determineFightOutcome()` and `probabilityToBias()`. Keep `calculateWinProbability()`, `recordStrength()`, `trainingStrength()`. Remove the `FightBiasConfig` import.

**Step 2: Update tests**

Remove the `determineFightOutcome` and `probabilityToBias` describe blocks from `__tests__/fight-probability.test.ts`. Keep the `calculateWinProbability`, `recordStrength`, and `trainingStrength` tests.

**Step 3: Update any callers**

Search for `determineFightOutcome` usage in components. Replace with direct `calculateWinProbability()` calls for market pricing. The fight engine no longer needs a bias — just pass two Fighter objects.

Run: `grep -r "determineFightOutcome\|FightBiasConfig\|biasConfig" --include="*.ts" --include="*.tsx" lib/ components/ app/`

Fix all references.

**Step 4: Run full test suite**

Run: `npm test -- --selectProjects=api --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/fight-probability.ts __tests__/fight-probability.test.ts
git commit -m "refactor: remove FightBiasConfig — d20 stats replace pre-determined outcomes"
```

---

## Task 10: Gear API Routes

REST endpoints for gear inventory management.

**Files:**
- Create: `app/api/gear/route.ts` — GET (list user's gear)
- Create: `app/api/gear/equip/route.ts` — POST (equip gear to fighter)
- Create: `app/api/gear/unequip/route.ts` — POST (unequip gear from fighter)
- Create: `__tests__/api/gear.test.ts`

**Step 1: Write the failing tests**

Follow the pattern in `__tests__/api/helpers.ts` for mocking Prisma + auth. Add `gear` model to `mockPrisma`. Test:
- GET /api/gear returns user's gear inventory (200)
- GET /api/gear returns 401 without auth
- POST /api/gear/equip equips gear to owned fighter (200)
- POST /api/gear/equip returns 403 if gear not owned by user
- POST /api/gear/equip returns 400 if slot already occupied
- POST /api/gear/unequip removes gear from fighter (200)

**Step 2: Implement routes**

Use `requireAnyRole()` guard (both humans and agents can manage gear). Use `lib/validations.ts` for zod schemas. Follow existing route patterns in `app/api/fighters/route.ts`.

**Step 3: Run tests**

Run: `npx jest __tests__/api/gear.test.ts --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add app/api/gear/ __tests__/api/gear.test.ts lib/validations.ts __tests__/api/helpers.ts
git commit -m "feat: add gear API routes (inventory, equip, unequip)"
```

---

## Task 11: Training Loot Drops

Update the training completion flow to roll for gear drops.

**Files:**
- Modify: `app/api/training/[id]/route.ts` — add loot roll on COMPLETED status
- Modify: `__tests__/api/training.test.ts` — add loot drop tests
- Modify: `lib/gear-engine.ts` — add `generateGear()` function that creates a full GearItem

**Step 1: Add `generateGear()` to `lib/gear-engine.ts`**

Function that takes `slot`, `rarity`, and `ownerId`, generates stat bonuses based on rarity tier and slot affinity, optionally assigns a special trait (Superior/Legendary only), returns a GearItem ready for Prisma create.

**Step 2: Update training route**

When a training session transitions to COMPLETED:
1. Roll rarity via `rollGearRarity(user.superiorPityCounter, user.legendaryPityCounter)`
2. Roll slot (random, or biased by training type)
3. Call `generateGear(slot, rarity, userId)`
4. Create Gear record in DB
5. Update pity counters (reset on Superior+/Legendary, increment otherwise)
6. Return gear drop in response

**Step 3: Test**

Add tests to `__tests__/api/training.test.ts`:
- Completing a training session creates a gear drop
- Pity counter increments on Standard/Enhanced drop
- Pity counter resets on Superior+ drop

**Step 4: Commit**

```bash
git add app/api/training/ lib/gear-engine.ts __tests__/api/training.test.ts
git commit -m "feat: training sessions drop gear on completion with pity counter"
```

---

## Task 12: Update CLAUDE.md

Document the new combat system in the project's CLAUDE.md so all agents are aware.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add combat system section**

Under "Core Engines", update the Fight Engine description to mention d20 resolution. Add a new "Gear System" subsection. Update the "Database Schema" section to mention the Gear model.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with d20 combat system and gear model"
```

---

## Dependency Graph

```
Task 1 (Dice) ──→ Task 4 (Combat Resolver) ──→ Task 8 (Fight Engine Refactor)
Task 2 (Stats) ─┘                               │
Task 3 (Stamina) ┘                               ├──→ Task 9 (Update Fight Probability)
                                                  │
Task 5 (Types) ──→ Task 7 (Gear Engine) ────────→ Task 11 (Training Loot Drops)
Task 6 (Schema) ┘    │
                      └──→ Task 10 (Gear API Routes)

Task 12 (CLAUDE.md) — can run anytime after Task 8
```

**Parallelizable:** Tasks 1-3 can run in parallel. Tasks 5-6 can run in parallel with 1-4. Task 7 and Task 8 can run in parallel (gear engine vs fight engine refactor). Tasks 10-11 depend on both 7 and 8.

---

## Post-Implementation

After all tasks are complete:
1. Run `game-design-review` skill on the implementation
2. Run Monte Carlo simulation to validate upset rates (25-30% target)
3. Baseball 9 training deep-dive to refine training session mechanics
