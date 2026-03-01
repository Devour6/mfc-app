# Monte Carlo Simulation Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the 1400-line `scripts/monte-carlo-v13.ts` monolith into separate files so agents spend ~200 lines of context per session instead of ~1400+, with targeted sim runs and JSON output.

**Architecture:** Split into 4 files: `config.ts` (tuneable constants — the only file agents edit), `engine.ts` (combat simulation — agents never read this), `sims.ts` (sim definitions with dependency tags), `runner.ts` (CLI harness with `--sim`, `--fast`/`--full`, JSON output). The original monolith stays intact as a reference.

**Tech Stack:** TypeScript, tsx (runtime), Node process.argv (CLI args), fs (JSON output)

---

## File Structure

```
scripts/mc/
├── config.ts        # ~120 lines. Tuneable constants + archetype stats. ONLY file agents edit.
├── engine.ts        # ~600 lines. Types, combat sim, runSim harness. Agents never read this.
├── sims.ts          # ~350 lines. Sim definitions with dependency tags + analysis logic.
├── runner.ts        # ~100 lines. CLI entry point. Parses args, runs sims, writes JSON.
└── results/         # JSON output directory (gitignored)
    └── .gitkeep
```

The existing `scripts/monte-carlo-v13.ts` stays intact. Do not delete it.

---

## Dependency Map

Each sim depends on specific config groups. When an agent changes a constant, they only re-run affected sims.

| Sim | Name | Config Dependencies | Priority | runSim calls |
|-----|------|-------------------|----------|--------------|
| 1 | Triangle | combat, abilities, archetypes, tempo, stamina | critical | 3 (pvt, tvc, cvp) |
| 2 | Round-by-Round | *reuses Sim 1 data* | critical | 0 |
| 3 | Specialist vs Hybrid | combat, abilities, archetypes, tempo, stamina | critical | 3 |
| 4 | Gear Tiers | combat, gear, tempo, stamina | high | 4 |
| 6 | Gear Cross-Tier | combat, gear, abilities, archetypes, tempo, stamina | high | 1 |
| 7 | Training > Gear | combat, gear, abilities, archetypes, tempo, stamina | high | 1 |
| 8 | Condition | combat, condition, archetypes, tempo, stamina | high | 3 (fix: 8c reuses Sim 1 pvt) |
| 9 | Tempo Divergence | *reuses Sim 1 data* | medium | 0 |
| 10 | Desperation | *reuses Sim 1 data* | medium | 0 |
| 12 | Signatures | combat, signatures, tempo, stamina | medium | 3 |

**Total unique runSim calls:** 18 (was 19 — dedup Sim 8c)

---

## Task 1: Create `scripts/mc/config.ts`

**Files:**
- Create: `scripts/mc/config.ts`

**Step 1: Create directory**

```bash
mkdir -p scripts/mc/results
touch scripts/mc/results/.gitkeep
```

**Step 2: Write config.ts**

Extract every tuneable constant from `scripts/monte-carlo-v13.ts` lines 18-68 plus archetype definitions from lines 1043-1050 and gear tier bonuses from lines 1028-1033. Group by concern. Export everything.

```typescript
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
```

**Step 3: Verify it compiles**

```bash
npx tsx --eval "import './scripts/mc/config'; console.log('config OK')"
```

Expected: `config OK`

**Step 4: Commit**

```bash
git add scripts/mc/config.ts scripts/mc/results/.gitkeep
git commit -m "mc restructure: extract config.ts — tuneable constants"
```

---

## Task 2: Create `scripts/mc/engine.ts`

**Files:**
- Create: `scripts/mc/engine.ts`

**Step 1: Write engine.ts**

Move ALL types, interfaces, core math, fighter creation, action selection, attack resolution, fight simulation, and the runSim harness from `scripts/monte-carlo-v13.ts`. The engine imports constants from `config.ts` instead of defining them inline.

Extract these sections from the monolith:
- Lines 70-99: Types (AttackType, Condition, FighterStats, GearEffect, GearLoadout, FighterConfig)
- Lines 112-177: RoundData, TechStats, emptyRoundData, emptyTechStats
- Lines 179-218: FighterState
- Lines 220-265: Core math (rollDie, rollD20, statToModifier, effectiveCombatStat, computeMaxStamina, computeStaminaRegen, getCurrentTempo, tempoToActionRate)
- Lines 275-406: createFighter, selectAction
- Lines 408-433: Ability functions (getRelentlessBypass, getIronGuardCPCatchRate, getCPProcRate, getCPDamageMultiplier)
- Lines 435-665: resolveAttack
- Lines 667-855: FightResult, simulateFight
- Lines 857-956: SimResult, runSim

**Key changes when extracting:**
1. Replace all inline constants (e.g., `FIGHTER_MAX_HP`) with imports from config: `import { COMBAT, ABILITIES, ... } from './config'`
2. Replace `FIGHTER_MAX_HP` → `COMBAT.FIGHTER_MAX_HP`
3. Replace `STAMINA_COSTS` → import from config
4. Replace `BLOCK_CAP_PER_ROUND` → `ABILITIES.BLOCK_CAP_PER_ROUND`
5. Replace `ABILITY_RAMP` → `COMBAT.ABILITY_RAMP`
6. Replace `TEMPO_FLOOR_BY_ROUND` → `TEMPO.FLOOR_BY_ROUND`
7. Replace `0.00075 * tempo` → `TEMPO.ACTION_RATE_COEFF * tempo`
8. Replace hardcoded `0.30` (BASE_CP_CATCH) → `ABILITIES.BASE_CP_CATCH`
9. Replace hardcoded `0.42` (Relentless bypass) → `ABILITIES.RELENTLESS_BYPASS_BASE`
10. Replace hardcoded `0.55` and `0.70` (Iron Guard CP catch) → `ABILITIES.IRON_GUARD_CP_CATCH_BASE` and `ABILITIES.IRON_GUARD_CP_CATCH_CAP`
11. Replace hardcoded `0.215` (CP proc rate) → `ABILITIES.CP_PROC_RATE_BASE`
12. Replace condition multiplier literals with `CONDITION_MULTS[condition]`
13. Replace tier threshold literals (65, 80, 95) with `TIER_THRESHOLDS`
14. Replace exhaustion tables with `EXHAUSTION.IRON_MAN` / `EXHAUSTION.BASELINE`
15. Replace `DAMAGE_DICE` and `POWER_ATTACKS` with config imports

Export: `FighterConfig`, `FighterStats`, `SimResult`, `TechStats`, `GearLoadout`, `GearEffect`, `Condition`, `runSim`, `simulateFight`

Also export two utility functions:

```typescript
export function makeStats(o: Partial<FighterStats> = {}): FighterStats {
  return { pow: 50, end: 50, tec: 50, ...o }
}

export function makeGear(tier: string, primaryStat: 'pow' | 'end' | 'tec' = 'pow'): GearLoadout {
  const total = GEAR_TIER_BONUSES[tier] ?? 0
  return {
    pieces: [{
      slot: 'gloves' as const, tier: tier as any, name: `${tier} gloves`,
      primaryBonus: total, secondaryBonus: 0, primaryStat,
    }],
  }
}

// Confidence interval for a proportion (95% CI)
export function confidenceInterval(p: number, n: number): { low: number; high: number; se: number } {
  const se = Math.sqrt(p * (1 - p) / n)
  return { low: p - 1.96 * se, high: p + 1.96 * se, se }
}
```

**Step 2: Verify it compiles**

```bash
npx tsx --eval "import { runSim, makeStats } from './scripts/mc/engine'; const r = runSim({ stats: makeStats({ pow: 80, end: 57, tec: 58 }) }, { stats: makeStats({ pow: 57, end: 80, tec: 58 }) }, 100); console.log('P vs T (100 fights):', (r.f1WinRate * 100).toFixed(1) + '%')"
```

Expected: `P vs T (100 fights): XX.X%` (should be around 60-70% — directionally correct)

**Step 3: Commit**

```bash
git add scripts/mc/engine.ts
git commit -m "mc restructure: extract engine.ts — combat simulation"
```

---

## Task 3: Create `scripts/mc/sims.ts`

**Files:**
- Create: `scripts/mc/sims.ts`

**Step 1: Write sims.ts**

Each sim is a function that runs its matchups and returns structured output. Tagged with dependency groups so the runner knows which sims to re-run when a config group changes.

```typescript
// scripts/mc/sims.ts
import { ConfigGroup, ARCHETYPES } from './config'
import {
  FighterConfig, SimResult, runSim, makeStats, makeGear, confidenceInterval,
} from './engine'

// Structured output per matchup
export interface MatchupResult {
  label: string
  f1WinRate: number
  ci: { low: number; high: number; se: number }
  target: { min: number; max?: number }
  pass: boolean
  fights: number
  detail?: Record<string, any>
}

// Structured output per sim
export interface SimOutput {
  id: number
  name: string
  pass: boolean
  priority: 'critical' | 'high' | 'medium'
  matchups: MatchupResult[]
  notes?: string[]
}

// Sim definition
export interface SimDef {
  id: number
  name: string
  deps: ConfigGroup[]
  priority: 'critical' | 'high' | 'medium'
  reuses?: number[]  // sim IDs whose results this sim reads (no new runSim calls)
  run: (n: number, cache: Map<string, SimResult>) => SimOutput
}

// Helper: run a matchup and build the result
function matchup(
  label: string,
  f1: FighterConfig, f2: FighterConfig,
  target: { min: number; max?: number },
  n: number,
  cache: Map<string, SimResult>,
): { result: SimResult; output: MatchupResult } {
  const key = `${label}@${n}`
  let result = cache.get(key)
  if (!result) {
    result = runSim(f1, f2, n)
    cache.set(key, result)
  }
  const ci = confidenceInterval(result.f1WinRate, n)
  const pass = result.f1WinRate >= target.min && (target.max === undefined || result.f1WinRate <= target.max)
  return {
    result,
    output: { label, f1WinRate: result.f1WinRate, ci, target, pass, fights: n },
  }
}

// Archetype configs (built from config.ts ARCHETYPES)
const P80: FighterConfig = { stats: makeStats(ARCHETYPES.pressure80) }
const T80: FighterConfig = { stats: makeStats(ARCHETYPES.turtle80) }
const C80: FighterConfig = { stats: makeStats(ARCHETYPES.counter80) }
const H65: FighterConfig = { stats: makeStats(ARCHETYPES.hybrid65) }
const B50: FighterConfig = { stats: makeStats(ARCHETYPES.base50) }

// All sim definitions
export const SIMS: SimDef[] = [
  {
    id: 1, name: 'Triangle', priority: 'critical',
    deps: ['combat', 'abilities', 'archetypes', 'tempo', 'stamina'],
    run(n, cache) {
      const pvt = matchup('P vs T', P80, T80, { min: 0.62, max: 0.68 }, n, cache)
      const tvc = matchup('T vs C', T80, C80, { min: 0.62, max: 0.68 }, n, cache)
      const cvp = matchup('C vs P', C80, P80, { min: 0.62, max: 0.68 }, n, cache)
      return {
        id: 1, name: 'Triangle', priority: 'critical',
        pass: pvt.output.pass && tvc.output.pass && cvp.output.pass,
        matchups: [pvt.output, tvc.output, cvp.output],
      }
    },
  },
  {
    id: 2, name: 'Round-by-Round', priority: 'critical',
    deps: ['combat', 'abilities', 'archetypes', 'tempo', 'stamina'],
    reuses: [1],
    run(n, cache) {
      // Reuses Sim 1 cached results
      const pvt = cache.get(`P vs T@${n}`)
      const tvc = cache.get(`T vs C@${n}`)
      const cvp = cache.get(`C vs P@${n}`)
      if (!pvt || !tvc || !cvp) {
        return { id: 2, name: 'Round-by-Round', priority: 'critical', pass: false, matchups: [], notes: ['ERROR: Sim 1 must run first'] }
      }
      const targets = [[0.53, 0.56], [0.58, 0.63], [0.65, 0.72]]
      const results: MatchupResult[] = []
      let allPass = true
      for (const [label, sim, side] of [['P vs T', pvt, 1], ['T vs C', tvc, 1], ['C vs P', cvp, 1]] as const) {
        for (let r = 0; r < 3; r++) {
          const wr = side === 1 ? sim.f1RoundDmgWinRate[r] : 1 - sim.f1RoundDmgWinRate[r]
          const pass = wr >= targets[r][0] && wr <= targets[r][1]
          if (!pass) allPass = false
          results.push({
            label: `${label} R${r+1}`, f1WinRate: wr,
            ci: confidenceInterval(wr, n), target: { min: targets[r][0], max: targets[r][1] },
            pass, fights: n,
          })
        }
      }
      return { id: 2, name: 'Round-by-Round', priority: 'critical', pass: allPass, matchups: results }
    },
  },
  {
    id: 3, name: 'Specialist vs Hybrid', priority: 'critical',
    deps: ['combat', 'abilities', 'archetypes', 'tempo', 'stamina'],
    run(n, cache) {
      const ph = matchup('P80 vs H65', P80, H65, { min: 0.58, max: 0.65 }, n, cache)
      const th = matchup('T80 vs H65', T80, H65, { min: 0.58, max: 0.65 }, n, cache)
      const ch = matchup('C80 vs H65', C80, H65, { min: 0.58, max: 0.65 }, n, cache)
      return {
        id: 3, name: 'Specialist vs Hybrid', priority: 'critical',
        pass: ph.output.pass && th.output.pass && ch.output.pass,
        matchups: [ph.output, th.output, ch.output],
      }
    },
  },
  {
    id: 4, name: 'Gear Tiers', priority: 'high',
    deps: ['combat', 'gear', 'tempo', 'stamina'],
    run(n, cache) {
      const std = matchup('Standard vs Ungeared', { stats: makeStats(), gear: makeGear('standard') }, B50, { min: 0.51, max: 0.52 }, n, cache)
      const enh = matchup('Enhanced vs Ungeared', { stats: makeStats(), gear: makeGear('enhanced') }, B50, { min: 0.53, max: 0.55 }, n, cache)
      const sup = matchup('Superior vs Ungeared', { stats: makeStats(), gear: makeGear('superior') }, B50, { min: 0.55, max: 0.58 }, n, cache)
      const leg = matchup('Legendary vs Ungeared', { stats: makeStats(), gear: makeGear('legendary') }, B50, { min: 0.58, max: 0.63 }, n, cache)
      return {
        id: 4, name: 'Gear Tiers', priority: 'high',
        pass: std.output.pass && enh.output.pass && sup.output.pass && leg.output.pass,
        matchups: [std.output, enh.output, sup.output, leg.output],
      }
    },
  },
  {
    id: 6, name: 'Gear Cross-Tier', priority: 'high',
    deps: ['combat', 'gear', 'abilities', 'archetypes', 'tempo', 'stamina'],
    run(n, cache) {
      const leg80: FighterConfig = { stats: makeStats(ARCHETYPES.pressure80), gear: makeGear('legendary') }
      const sup80: FighterConfig = { stats: makeStats(ARCHETYPES.pressure80), gear: makeGear('superior') }
      const m = matchup('Leg@80 vs Sup@80', leg80, sup80, { min: 0.52, max: 0.56 }, n, cache)
      return {
        id: 6, name: 'Gear Cross-Tier', priority: 'high',
        pass: m.output.pass, matchups: [m.output],
      }
    },
  },
  {
    id: 7, name: 'Training > Gear', priority: 'high',
    deps: ['combat', 'gear', 'abilities', 'archetypes', 'tempo', 'stamina'],
    run(n, cache) {
      const trained80: FighterConfig = { stats: makeStats(ARCHETYPES.pressure80) }
      const geared65: FighterConfig = { stats: makeStats(ARCHETYPES.hybrid65), gear: makeGear('legendary') }
      const m = matchup('Trained80 vs Geared65+Leg', trained80, geared65, { min: 0.65 }, n, cache)
      return {
        id: 7, name: 'Training > Gear', priority: 'high',
        pass: m.output.pass, matchups: [m.output],
      }
    },
  },
  {
    id: 8, name: 'Condition', priority: 'high',
    deps: ['combat', 'condition', 'abilities', 'archetypes', 'tempo', 'stamina'],
    run(n, cache) {
      // 8a: Mirror fresh vs tired
      const m8a = matchup('Fresh vs Tired (mirror)', { stats: makeStats(), condition: 'fresh' }, { stats: makeStats(), condition: 'tired' }, { min: 0.53, max: 0.57 }, n, cache)
      // 8b: Tired favorite still wins
      const m8b = matchup('P80-Tired vs T80-Normal', { stats: makeStats(ARCHETYPES.pressure80), condition: 'tired' }, { stats: makeStats(ARCHETYPES.turtle80), condition: 'normal' }, { min: 0.58, max: 0.65 }, n, cache)
      // 8c: Condition shift — reuse Sim 1's P vs T if available, otherwise run fresh
      let pvtRate = cache.get(`P vs T@${n}`)?.f1WinRate
      if (pvtRate === undefined) {
        const pvt = runSim(P80, T80, n)
        pvtRate = pvt.f1WinRate
        cache.set(`P vs T@${n}`, pvt)
      }
      const tiredPvt = runSim({ stats: makeStats(ARCHETYPES.pressure80), condition: 'tired' }, T80, n)
      const shift = pvtRate - tiredPvt.f1WinRate
      const shiftPass = shift > 0.02
      return {
        id: 8, name: 'Condition', priority: 'high',
        pass: m8a.output.pass && m8b.output.pass && shiftPass,
        matchups: [m8a.output, m8b.output, {
          label: 'Condition shift (P vs T)', f1WinRate: shift,
          ci: confidenceInterval(shift, n), target: { min: 0.02 }, pass: shiftPass, fights: n,
        }],
      }
    },
  },
  {
    id: 9, name: 'Tempo Divergence', priority: 'medium',
    deps: ['combat', 'tempo', 'stamina', 'abilities', 'archetypes'],
    reuses: [1],
    run(n, cache) {
      const results: MatchupResult[] = []
      let allPass = true
      for (const [label, key] of [['P vs T', `P vs T@${n}`], ['T vs C', `T vs C@${n}`], ['C vs P', `C vs P@${n}`]]) {
        const sim = cache.get(key)
        if (!sim) { return { id: 9, name: 'Tempo Divergence', priority: 'medium', pass: false, matchups: [], notes: ['ERROR: Sim 1 must run first'] } }
        const r1Gap = Math.abs(sim.avgTempoEndF1[0] - sim.avgTempoEndF2[0])
        const r3Gap = Math.abs(sim.avgTempoEndF1[2] - sim.avgTempoEndF2[2])
        const r1Ok = r1Gap < 0.05
        const r3Ok = r3Gap >= 0.15 && r3Gap <= 0.25
        if (!r1Ok || !r3Ok) allPass = false
        results.push({ label: `${label} R1 gap`, f1WinRate: r1Gap, ci: confidenceInterval(r1Gap, n), target: { min: 0, max: 0.05 }, pass: r1Ok, fights: n })
        results.push({ label: `${label} R3 gap`, f1WinRate: r3Gap, ci: confidenceInterval(r3Gap, n), target: { min: 0.15, max: 0.25 }, pass: r3Ok, fights: n })
      }
      return { id: 9, name: 'Tempo Divergence', priority: 'medium', pass: allPass, matchups: results }
    },
  },
  {
    id: 10, name: 'Desperation', priority: 'medium',
    deps: ['combat', 'desperation', 'archetypes'],
    reuses: [1],
    run(n, cache) {
      const pvt = cache.get(`P vs T@${n}`)
      const tvc = cache.get(`T vs C@${n}`)
      const cvp = cache.get(`C vs P@${n}`)
      if (!pvt || !tvc || !cvp) {
        return { id: 10, name: 'Desperation', priority: 'medium', pass: false, matchups: [], notes: ['ERROR: Sim 1 must run first'] }
      }
      const avgRate = (pvt.desperationKORate + tvc.desperationKORate + cvp.desperationKORate) / 3
      const pass = avgRate >= 0.15 && avgRate <= 0.25
      return {
        id: 10, name: 'Desperation', priority: 'medium', pass,
        matchups: [{
          label: 'Avg Desperation KO rate', f1WinRate: avgRate,
          ci: confidenceInterval(avgRate, n), target: { min: 0.15, max: 0.25 }, pass, fights: n,
          detail: { pvt: pvt.desperationKORate, tvc: tvc.desperationKORate, cvp: cvp.desperationKORate },
        }],
      }
    },
  },
  {
    id: 12, name: 'Signatures', priority: 'medium',
    deps: ['combat', 'signatures', 'tempo', 'stamina'],
    run(n, cache) {
      const p95: FighterConfig = { stats: makeStats(ARCHETYPES.pow95) }
      const p80: FighterConfig = { stats: makeStats(ARCHETYPES.pow80) }
      const e95: FighterConfig = { stats: makeStats(ARCHETYPES.end95) }
      const e80: FighterConfig = { stats: makeStats(ARCHETYPES.end80) }
      const t95: FighterConfig = { stats: makeStats(ARCHETYPES.tec95) }
      const t80: FighterConfig = { stats: makeStats(ARCHETYPES.tec80) }
      const dev = matchup('POW95 vs POW80 (Devastator)', p95, p80, { min: 0.58, max: 0.65 }, n, cache)
      const im  = matchup('END95 vs END80 (Iron Man)', e95, e80, { min: 0.58, max: 0.65 }, n, cache)
      const mr  = matchup('TEC95 vs TEC80 (Mind Reader)', t95, t80, { min: 0.58, max: 0.65 }, n, cache)
      return {
        id: 12, name: 'Signatures', priority: 'medium',
        pass: dev.output.pass && im.output.pass && mr.output.pass,
        matchups: [dev.output, im.output, mr.output],
      }
    },
  },
]

// Get sims affected by a set of config groups
export function getAffectedSims(changed: ConfigGroup[]): SimDef[] {
  return SIMS.filter(s => s.deps.some(d => changed.includes(d)))
}

// Get a sim by ID
export function getSimById(id: number): SimDef | undefined {
  return SIMS.find(s => s.id === id)
}
```

**Step 2: Verify it compiles**

```bash
npx tsx --eval "import { SIMS } from './scripts/mc/sims'; console.log(SIMS.length + ' sims defined'); SIMS.forEach(s => console.log('  Sim ' + s.id + ': ' + s.name + ' [' + s.deps.join(',') + ']'))"
```

Expected: 11 sims listed with their dependency tags.

**Step 3: Commit**

```bash
git add scripts/mc/sims.ts
git commit -m "mc restructure: add sims.ts — sim definitions with dependency tags"
```

---

## Task 4: Create `scripts/mc/runner.ts`

**Files:**
- Create: `scripts/mc/runner.ts`

**Step 1: Write runner.ts**

CLI entry point. Parses args, runs selected sims, writes JSON, implements fast-fail.

```typescript
// scripts/mc/runner.ts
// CLI: npx tsx scripts/mc/runner.ts [options]
//   --sim 1,4,7       Run only these sims (comma-separated IDs)
//   --deps abilities   Run sims affected by these config groups (comma-separated)
//   --fast             Screening mode: 2,000 fights per matchup
//   --full             Validation mode: 10,000 fights per matchup (default)
//   --n 5000           Custom fight count
//   --no-fail-fast     Don't abort on critical sim failure
//   --out <dir>        Output directory (default: scripts/mc/results)

import * as fs from 'fs'
import * as path from 'path'
import { SIMS, getAffectedSims, SimOutput } from './sims'
import { ConfigGroup } from './config'

// Parse CLI args
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return undefined
  return args[idx + 1]
}
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

const simIds = getArg('sim')?.split(',').map(Number)
const depGroups = getArg('deps')?.split(',') as ConfigGroup[] | undefined
const isFast = hasFlag('fast')
const customN = getArg('n')
const failFast = !hasFlag('no-fail-fast')
const outDir = getArg('out') || path.join(__dirname, 'results')

const NUM_FIGHTS = customN ? parseInt(customN, 10) : (isFast ? 2_000 : 10_000)

// Select sims to run
let selectedSims = SIMS
if (simIds) {
  selectedSims = SIMS.filter(s => simIds.includes(s.id))
} else if (depGroups) {
  selectedSims = getAffectedSims(depGroups)
}

// Ensure sims that reuse others are preceded by their dependencies
const simIdsToRun = new Set(selectedSims.map(s => s.id))
for (const sim of selectedSims) {
  if (sim.reuses) {
    for (const depId of sim.reuses) {
      if (!simIdsToRun.has(depId)) {
        const depSim = SIMS.find(s => s.id === depId)
        if (depSim) {
          selectedSims.unshift(depSim)
          simIdsToRun.add(depId)
        }
      }
    }
  }
}

// Dedupe and sort by ID
selectedSims = [...new Map(selectedSims.map(s => [s.id, s])).values()].sort((a, b) => a.id - b.id)

console.log(`V13 Monte Carlo — ${isFast ? 'SCREENING' : 'VALIDATION'} mode`)
console.log(`  Fights per matchup: ${NUM_FIGHTS.toLocaleString()}`)
console.log(`  Sims: ${selectedSims.map(s => s.id).join(', ')} (${selectedSims.length} of ${SIMS.length})`)
console.log()

// Run sims
const cache = new Map()
const outputs: SimOutput[] = []
let aborted = false

for (const sim of selectedSims) {
  const start = Date.now()
  console.log(`Running Sim ${sim.id}: ${sim.name}...`)
  const output = sim.run(NUM_FIGHTS, cache)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  outputs.push(output)

  const status = output.pass ? 'PASS' : 'FAIL'
  console.log(`  Sim ${sim.id}: ${status} (${elapsed}s)`)
  for (const m of output.matchups) {
    const ciStr = `±${(m.ci.se * 196).toFixed(1)}%`
    const targetStr = m.target.max !== undefined
      ? `${(m.target.min * 100).toFixed(0)}-${(m.target.max * 100).toFixed(0)}%`
      : `${(m.target.min * 100).toFixed(0)}%+`
    console.log(`    ${m.label}: ${(m.f1WinRate * 100).toFixed(1)}% ${ciStr} (target ${targetStr}) ${m.pass ? 'PASS' : 'FAIL'}`)
  }
  console.log()

  // Fast-fail: abort if a critical sim fails
  if (failFast && !output.pass && sim.priority === 'critical') {
    console.log(`FAST-FAIL: Critical sim ${sim.id} (${sim.name}) failed. Aborting remaining sims.`)
    console.log(`  Fix the issue before running other sims.`)
    aborted = true
    break
  }
}

// Summary
console.log('=== SUMMARY ===')
const passed = outputs.filter(o => o.pass).length
const failed = outputs.filter(o => !o.pass).length
console.log(`  ${passed} passed, ${failed} failed${aborted ? `, ${selectedSims.length - outputs.length} skipped (fast-fail)` : ''}`)
for (const o of outputs) {
  console.log(`  Sim ${o.id} (${o.name}): ${o.pass ? 'PASS' : 'FAIL'}`)
}

// Write JSON output
fs.mkdirSync(outDir, { recursive: true })

const summary = {
  timestamp: new Date().toISOString(),
  mode: isFast ? 'screening' : 'validation',
  fightsPerMatchup: NUM_FIGHTS,
  simsRequested: selectedSims.map(s => s.id),
  simsRun: outputs.map(s => s.id),
  aborted,
  passed,
  failed,
  results: outputs,
}

const outPath = path.join(outDir, 'latest.json')
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
console.log(`\nResults written to ${outPath}`)

process.exit(failed > 0 ? 1 : 0)
```

**Step 2: Add `scripts/mc/results/` to .gitignore**

Append to `.gitignore`:
```
scripts/mc/results/*.json
```

**Step 3: Verify CLI works**

```bash
npx tsx scripts/mc/runner.ts --sim 1 --fast
```

Expected: Runs Sim 1 (Triangle) at 2,000 fights. Shows P vs T, T vs C, C vs P win rates with ±CI. Writes `scripts/mc/results/latest.json`. Completes in ~5 seconds.

**Step 4: Verify targeting works**

```bash
npx tsx scripts/mc/runner.ts --deps gear --fast
```

Expected: Runs only Sims 4, 6, 7 (gear-dependent). Other sims skipped.

**Step 5: Verify fast-fail works**

If Sim 1 is failing, runner should abort before running Sim 3. Verify by checking output shows "FAST-FAIL" message when a critical sim fails.

**Step 6: Verify JSON output**

```bash
npx tsx scripts/mc/runner.ts --sim 1 --fast && cat scripts/mc/results/latest.json | head -30
```

Expected: Well-formed JSON with `timestamp`, `mode`, `fightsPerMatchup`, `results` array.

**Step 7: Commit**

```bash
git add scripts/mc/runner.ts .gitignore
git commit -m "mc restructure: add runner.ts — CLI with targeting, screening, fast-fail, JSON output"
```

---

## Task 5: Validate Against Monolith

**Files:**
- No new files. Comparison run.

The new system must produce statistically equivalent results to the monolith. Same combat engine, same constants — just reorganized.

**Step 1: Run the monolith**

```bash
npx tsx scripts/monte-carlo-v13.ts 2>&1 | tee /tmp/mc-monolith.txt
```

Note the key numbers: Sim 1 (P vs T, T vs C, C vs P), Sim 3 (P80/T80/C80 vs Hybrid), Sim 12 (signatures).

**Step 2: Run the new system at full precision**

```bash
npx tsx scripts/mc/runner.ts --full
```

**Step 3: Compare**

Win rates should be within ±2% of each other (statistical variance at 10k fights). If any sim differs by more than 3%, there's a bug in the extraction — a hardcoded constant was missed or a config import is wrong.

Key comparisons:
- Sim 1 Triangle: all three edges within ±2% of monolith
- Sim 4 Gear Tiers: all four tiers within ±2%
- Sim 12 Signatures: all three within ±2%

**Step 4: If discrepancies found**

Diff the engine.ts against the monolith section-by-section. Most likely cause: a hardcoded constant in the monolith that wasn't replaced with a config import. Check the replacement list in Task 2.

**Step 5: Commit verification note**

```bash
git add -A && git commit -m "mc restructure: validated — new system matches monolith within statistical variance"
```

---

## Task 6: Write Agent Process Doc

**Files:**
- Create: `scripts/mc/README.md`

**Step 1: Write the process doc**

```markdown
# Monte Carlo V13 — Agent Workflow

## Quick Reference

### Change a constant
1. Read `config.ts` (~120 lines) — find the constant
2. Edit it
3. Screen: `npx tsx scripts/mc/runner.ts --deps <group> --fast`
4. If screening passes: `npx tsx scripts/mc/runner.ts --deps <group> --full`
5. Read `results/latest.json` — check pass/fail and CI

### Run specific sims
```
npx tsx scripts/mc/runner.ts --sim 1,4,7 --fast    # screening
npx tsx scripts/mc/runner.ts --sim 1,4,7 --full    # validation
npx tsx scripts/mc/runner.ts --sim 1,4,7 --n 5000  # custom count
```

### Run sims affected by a config group
```
npx tsx scripts/mc/runner.ts --deps abilities --fast
npx tsx scripts/mc/runner.ts --deps gear,combat --full
```

### Config groups
| Group | Constants | Sims Affected |
|-------|-----------|---------------|
| combat | COMBAT, TKO, DAMAGE_DICE | 1,2,3,4,6,7,8,9,10,12 (all) |
| abilities | ABILITIES (Relentless, Iron Guard, CP rates) | 1,2,3,6,7,8,9 |
| desperation | DESPERATION | 1,2,9,10 |
| recovery | RECOVERY | (none currently — future sims) |
| stamina | STAMINA_COSTS | 1,2,3,4,6,7,8,9,12 |
| tempo | TEMPO | 1,2,3,4,6,7,8,9,12 |
| gear | GEAR_TIER_BONUSES | 4,6,7 |
| condition | CONDITION_MULTS | 8 |
| signatures | EXHAUSTION, TIER_THRESHOLDS | 12 |
| archetypes | ARCHETYPES | 1,2,3,6,7,8,9,10 |

### Workflow rules
1. **One variable at a time.** Change one constant, screen, check direction, commit or revert.
2. **Predict before sim.** Write: "I expect Sim X to move by Y% because Z." If wrong, stop.
3. **Screen first (2k), validate second (10k).** Don't burn 10k fights on a directional check.
4. **Read results/latest.json, not stdout.** The JSON has everything structured.
5. **CI tells you if a result is noise.** ±1% at 10k fights. ±2% at 2k fights. Don't chase noise.

### Confidence intervals
| Fights | 95% CI (at p=0.65) | Use for |
|--------|--------------------|---------|
| 2,000 | ±2.1% | Screening: detect changes > 3% |
| 5,000 | ±1.3% | Medium precision |
| 10,000 | ±0.9% | Validation: detect changes > 1.5% |
| 50,000 | ±0.4% | High precision (rarely needed) |
```

**Step 2: Commit**

```bash
git add scripts/mc/README.md
git commit -m "mc restructure: add agent process doc"
```

---

## Summary of Context Budget Savings

| Metric | Before (monolith) | After (restructured) |
|--------|-------------------|---------------------|
| Lines agent reads to edit a constant | ~1,400 (full script) | ~120 (config.ts) |
| Lines of sim output to parse | ~500+ (unstructured stdout) | ~50 (JSON summary) |
| Sims run per parameter change | 19 (all) | 3-5 (targeted) |
| Fights per screening check | 10,000 | 2,000 |
| Fast-fail on critical regression | No | Yes |
| Context windows per run | 2-3 (overflow + restart) | 1 |
