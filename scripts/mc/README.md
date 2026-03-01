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
npx tsx scripts/mc/runner.ts --sim 1,4,7 --fast    # screening (2k fights)
npx tsx scripts/mc/runner.ts --sim 1,4,7 --full    # validation (10k fights)
npx tsx scripts/mc/runner.ts --sim 1,4,7 --n 5000  # custom count
```

### Run sims affected by a config group
```
npx tsx scripts/mc/runner.ts --deps abilities --fast
npx tsx scripts/mc/runner.ts --deps gear,combat --full
```

### Run all sims
```
npx tsx scripts/mc/runner.ts --full
```

## Config Groups

| Group | Constants | Sims Affected |
|-------|-----------|---------------|
| combat | COMBAT, TKO, DAMAGE_DICE | 1,2,3,4,6,7,8,9,10,12 (all) |
| abilities | ABILITIES (Relentless, Iron Guard, CP rates) | 1,2,3,6,7,8,9 |
| desperation | DESPERATION | 1,2,9,10 |
| recovery | RECOVERY | (none currently) |
| stamina | STAMINA_COSTS | 1,2,3,4,6,7,8,9,12 |
| tempo | TEMPO | 1,2,3,4,6,7,8,9,12 |
| gear | GEAR_TIER_BONUSES | 4,6,7 |
| condition | CONDITION_MULTS | 8 |
| signatures | EXHAUSTION, TIER_THRESHOLDS | 12 |
| archetypes | ARCHETYPES | 1,2,3,6,7,8,9,10 |

## File Structure

```
scripts/mc/
  config.ts    # ~120 lines. Tuneable constants. ONLY file you edit.
  engine.ts    # ~920 lines. Combat sim. Never read this unless debugging.
  sims.ts      # ~270 lines. Sim definitions with dependency tags.
  runner.ts    # ~110 lines. CLI entry point.
  results/     # JSON output (gitignored)
    latest.json
```

## Workflow Rules

1. **One variable at a time.** Change one constant, screen, check direction, commit or revert. Never batch 5 changes — you won't know which one helped.
2. **Predict before sim.** Write: "I expect Sim X to move by Y% because Z." If the result doesn't match your prediction, stop and think — your mental model is wrong.
3. **Screen first (2k), validate second (10k).** Don't burn 10k fights on a directional check.
4. **Read results/latest.json, not stdout.** The JSON has everything structured. Stdout is for human progress monitoring.
5. **CI tells you if a result is noise.** Don't chase results within the confidence interval.
6. **Fast-fail is on by default.** If a critical sim (1, 2, 3) regresses, the runner aborts. Fix the regression before running other sims.

## Confidence Intervals

| Fights | 95% CI (at p=0.65) | Use for |
|--------|--------------------|---------|
| 2,000 | +-2.1% | Screening: detect changes > 3% |
| 5,000 | +-1.3% | Medium precision |
| 10,000 | +-0.9% | Validation: detect changes > 1.5% |
| 50,000 | +-0.4% | High precision (rarely needed) |

## CLI Reference

| Flag | Description | Default |
|------|-------------|---------|
| `--sim 1,4,7` | Run specific sim IDs | All sims |
| `--deps abilities,gear` | Run sims affected by config groups | All sims |
| `--fast` | Screening mode (2,000 fights) | |
| `--full` | Validation mode (10,000 fights) | Default |
| `--n 5000` | Custom fight count | 10,000 |
| `--no-fail-fast` | Don't abort on critical failure | Fast-fail on |
| `--out <dir>` | Output directory | scripts/mc/results |
