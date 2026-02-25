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
