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
import { fileURLToPath } from 'url'
import { SIMS, getAffectedSims, SimOutput } from './sims'
import { ConfigGroup } from './config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
let selectedSims = [...SIMS]
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
    const ciStr = `\u00B1${(m.ci.se * 196).toFixed(1)}%`
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
