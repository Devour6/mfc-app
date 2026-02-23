# V8 Combat Calibration

Response to Kakashi's V7 Monte Carlo (all 4 critical sims failed). V8 is a calibration pass — same framework, same 7 fixes, adjusted values. No structural changes to V7.

> **V8 (2026-02-22):** 5 value adjustments across Counter Puncher, gear, condition, and signatures. The information layer framework and all tier/technique structures are unchanged from V7.

## What Changed From V7

| System | V7 Value | V7 Result | V8 Value | Expected Result |
|--------|----------|-----------|----------|-----------------|
| Counter Puncher cooldown | None | 30 counters/fight, T→C 8% | **2-tick cooldown** | ~15 counters/fight |
| Iron Guard vs Counter Puncher | 15% base reaction | ~4-5 blocks of 30 | **35% reaction** (Iron Guard specific) | ~5 blocks of 15 |
| Gear damage (per hit) | +1 Std / +3 Leg | Std 71.2%, Leg 96.0% | **+0.3 Std / +1.0 Leg** | Std ~53%, Leg ~60% |
| Condition action rate | ±4% | Fresh 61.9% | **±2%** | Fresh ~54% |
| Devastator trigger | d6 on any crit | 62.4% (Desperation inflates) | **d6 on natural crits only** | ~42% |
| Iron Man exhaustion | [1.0, 0.94, 0.88] | 67.8% | **[1.0, 0.91, 0.82]** | ~58-62% |

---

## Fix 1 (revised): Counter Puncher — Cooldown + Iron Guard Interaction

### V7 Problem

Counter Puncher stamina cost (3/trigger) was noise — 3% of the stamina budget. Turtle's 15% base reaction blocked ~4-5 of 30 counter punches. T→C stayed at 8%.

### V8 Design

**Counter Puncher (FIQ 80) — three properties:**

1. **Costs 3 stamina per trigger** (unchanged from V7).
2. **2-tick cooldown after firing.** Counter Puncher cannot trigger again for 2 ticks (~160ms) after each activation. This rate-limits from ~30 counters/fight to ~15.
3. **Subject to defender's block reaction** (unchanged from V7). BUT: **Iron Guard (DEF 80) grants 35% reaction chance against Counter Puncher specifically** (instead of the base ~15% for non-Iron Guard fighters).

### Why This Works

The V7 approach tried to make Counter Puncher expensive. That failed because the stamina budget is too large — even high costs are noise against 3000+ regen/fight. V8 instead **reduces frequency** (cooldown) and **increases counterplay** (Iron Guard reaction).

**Counter vs Turtle (target: Turtle 60-70%):**
- Counter Puncher fires ~15 times (cooldown halves frequency)
- Iron Guard blocks 35% → ~5 blocked, ~10 land
- Each block: Iron Guard absorbs damage + Grinding Guard drains 2 stamina
- Each trigger: costs Counter 3 stamina (cooldown means fewer total triggers = lower total cost, but still meaningful per-trigger)
- 10 unblocked counter punches at avg 4.5 damage = ~45 total (vs V7's 25+ × 4.5 = 112+)
- Counter Puncher goes from fight-defining (~19% of Counter's damage) to supplementary (~8%)
- Turtle outlasts through Grinding Guard stamina drain + Iron Guard mitigation

**Counter vs Pressure (target: Counter 60-70%):**
- Counter Puncher fires ~15 times against Pressure
- Pressure has no Iron Guard → base ~15% reaction → ~2 blocked, ~13 land
- 13 unblocked at 4.5 = ~58 damage. Still meaningful against Pressure's low DEF
- Cooldown reduces Counter's tempo advantage but SPD 80 still gives ~25% more base actions
- Counter wins through tempo + counter punches, but with less margin than V7

**Why cooldown instead of higher stamina cost:**
- Stamina cost of 8-10 (Kakashi's suggestion) makes Counter Puncher feel like a self-destruct button. You don't want the player's signature technique to feel punishing to use.
- Cooldown is invisible to the experience — Counter Puncher just fires less often. The FEEL of the move is preserved. The frequency is what's tuned.
- Cooldown interacts cleanly with fight tempo: faster fights = fewer ticks = fewer triggers. Slower fights (Turtle) = more ticks but still rate-limited.

**Why Iron Guard gets elevated reaction vs Counter Puncher:**
- This is the direct triangle mechanic. Turtle's tier-2 technique specifically counters Counter's tier-2 technique. That's clean game design — each technique has a counter-technique.
- 35% is high enough to be meaningful (blocks 1/3) but low enough that Counter Puncher still lands 2/3 of the time. It's a tax, not a shutdown.
- Non-Iron Guard fighters (Pressure, Hybrid) still have base ~15% reaction. Counter Puncher remains effective against them.

---

## Fix 5 (revised): Gear — Fractional Damage Values

### V7 Problem

Per-hit flat damage (+1 Standard, +3 Legendary) compounds over ~87 hits/fight. Standard added +87 total damage (14% HP). Legendary added +261 (44% HP). Same compounding problem as V3 STR scaling, just through gear instead of stats.

### V8 Design

**Fractional per-hit bonuses:**

| Slot | Combat Effect | Standard | Enhanced | Superior | Legendary |
|------|-------------|----------|----------|----------|-----------|
| **Core Module** | Bonus damage on all hits | +0.3 | +0.5 | +0.7 | +1.0 |
| **Neural Link** | Bonus reaction chance (additive) | +2% | +3% | +4% | +6% |
| **Arm Augments** | Bonus to attack rolls | +0 | +0 | +1 | +1 |
| **Leg Rigs** | Bonus action rate (additive) | +1% | +2% | +2% | +3% |
| **Exo-Frame** | Bonus AC | +0 | +0 | +1 | +1 |
| **Reflex Core** | Bonus stamina pool | +4 | +6 | +8 | +12 |

Only Core Module changed. All other slots unchanged from V7.

**Expected impact over 87 hits:**
- Full Standard: +0.3 × 87 = +26 total damage (4.3% HP). Win rate: ~52-55%.
- Full Legendary: +1.0 × 87 = +87 total damage (14.5% HP). Win rate: ~58-65%.

**Implementation note:** Fractional damage accumulates. Track a `bonusDamageAccumulator` float. Each hit adds the gear bonus. When accumulator >= 1, add floor(accumulator) to the hit's damage and subtract that from the accumulator. This avoids rounding away small bonuses while keeping damage integers in the combat log.

**Why fractional instead of a per-round cap:**
- Per-round caps create cliff edges — gear is full value until the cap, then zero. Bettors can't predict where the cap kicks in.
- Fractional values are transparent and predictable. +0.3 per hit is +0.3 per hit, always. The bettor calculates total expected impact from fight length × hit rate. Clean math.

---

## Fix 6 (revised): Condition — ±2% Action Rate

### V7 Problem

±4% action rate produced 61.9% Fresh win rate (target: 53-57%). Action rate is the most powerful stat — it compounds into more hits, more stamina drain, more technique triggers.

### V8 Design

| Condition | Stamina Pool | Stamina Regen | Action Rate |
|-----------|-------------|---------------|-------------|
| **Fresh** | +10 | +0.10/tick | **+2%** (was +4%) |
| **Normal** | — | — | — |
| **Tired** | -10 | -0.10/tick | **-2%** (was -4%) |

4% total swing (Fresh vs Tired) instead of 8%. At 2% per condition level, this creates ~3-5 extra actions over a 3-round fight instead of 6-10. Expected outcome shift: ~3-5% (within the ±3-5% condition layer target).

**Asymmetric archetype impact preserved:**
- Pressure still most affected (action rate drives power attack frequency + Relentless recovery)
- Counter moderately affected (action rate drives tempo + Counter Puncher opportunities)
- Turtle least affected (defense-first gameplan doesn't depend on tempo)

---

## Fix 7a (revised): Devastator — Natural Crits Only

### V7 Problem

Devastator d6 trigger was designed for ~42% activation. Actual: 62.4%. Desperation (HP <40%) expands crit range from 20 to 18-20, generating extra crits in the late fight. More crits = more d6 rolls = higher trigger probability.

### V8 Design

**Devastator: On any NATURAL critical hit (d20 roll of 20), roll a separate d6. On 6, the crit becomes a Devastator. Once per fight.**

- Natural crit = roll of 20 on the d20 (5% chance). Desperation's expanded crit range (18-20) does NOT count for Devastator trigger rolls.
- At 5% natural crit rate and ~60 actions: ~3 natural crits per fight.
- P(at least one d6 of 6 across 3 rolls) = 1 - (5/6)^3 = **42%**

**Why exclude Desperation crits:**
- Devastator is a STR 95 signature. Its trigger rate should depend on the fighter's actions, not on their HP state. Desperation is a separate mechanic — let it boost crit damage independently without also boosting Devastator probability.
- This also prevents a perverse interaction: a losing fighter becomes MORE likely to trigger Devastator as they take damage. That creates a comeback mechanic that feels random rather than earned.
- Desperation crits still deal double damage (normal crit). Devastator (triple) only triggers on natural 20s. The distinction is clear for bettors: "Is the STR 95 fighter rolling natural 20s?" not "Are they low HP and getting lucky?"

**FIQ 80 interaction (Expanded Crit gear trait):**
- Expanded Crit widens the natural crit range (20 → 19-20). This DOES count for Devastator triggers because it's gear investment, not a conditional state.
- With Expanded Crit: ~6 natural crits per fight. P(Devastator) = 1 - (5/6)^6 = **66%**
- This rewards deliberate build investment (STR 95 + Expanded Crit gear) rather than random HP state.

---

## Fix 7b (revised): Iron Man — Reduced Exhaustion (Tuned Down)

### V7 Problem

[1.0, 0.94, 0.88] produced 67.8% win rate. Above the ±5% signature target.

### V8 Design

**Iron Man exhaustion decay: [1.0, 0.91, 0.82]**

Normal: [1.0, 0.88, 0.76]. Iron Man: [1.0, 0.91, 0.82].

| Round | Normal | V7 Iron Man | V8 Iron Man |
|-------|--------|-------------|-------------|
| R1 | 1.00 | 1.00 | 1.00 |
| R2 | 0.88 | 0.94 | **0.91** |
| R3 | 0.76 | 0.88 | **0.82** |

R3 relative advantage: 0.82/0.76 = **7.9%** (vs V7's 16%). This is within the ±5-10% range for a signature that only matters when fights go long. Expected win rate: ~58-62%.

The comeback arc narrative is preserved — Iron Man still "speeds up" relative to the opponent in R3. The magnitude is just smaller.

---

## Unchanged From V7

Everything not listed above carries forward exactly as designed in V7:

- **Core d20 math** (HP 600, modifier formula, AC, action rate)
- **3-Tier Progressive Specialization** (65/80/95 thresholds, all tier 1 traits)
- **Counter Puncher stamina cost** (3 per trigger — unchanged, cooldown is the new lever)
- **Relentless** (recover 2 stam/hit passive + finisher at opponent <40 stamina)
- **Iron Guard + Grinding Guard** (double block reduction + drain 2 attacker stamina per block)
- **Inexhaustible** (Gassed at 10, partial penalty 10-20)
- **Gear slots and non-damage bonuses** (Neural Link, Arm Augments, Leg Rigs, Exo-Frame, Reflex Core — all unchanged)
- **Gear special traits** (Thick Plating, Stabilizers, Endurance Rig, Expanded Crit, Adrenaline Surge, Chain Lightning)
- **Information layer framework** and per-layer outcome targets
- **Mind Reader** (pending validation — should be better now with Counter Puncher cooldown)
- **Ghost Step, Fortress, Berserker** (unchanged)

---

## V8 Technique Summary (changes from V7 highlighted)

| Stat | Technique | V7 | V8 Change |
|------|-----------|-----|-----------|
| FIQ 80 | Counter Puncher | 3 stam + block reaction | **+2-tick cooldown, Iron Guard 35% reaction** |
| AGG 80 | Relentless | 2 stam/hit + finisher <40 | *Unchanged* |
| DEF 80 | Iron Guard + Grinding Guard | Double block + 2 drain | **+35% reaction vs Counter Puncher** |
| STA 80 | Inexhaustible | Gassed@10, partial 10-20 | *Unchanged* |
| STR 80 | Devastating Blow | Exploding dice | *Unchanged* |
| SPD 80 | First Strike | Guaranteed tick 0 | *Unchanged* |

| Stat | Signature | V7 | V8 Change |
|------|-----------|-----|-----------|
| STR 95 | Devastator | d6 on any crit | **Natural crits only (d20=20)** |
| STA 95 | Iron Man | [1.0, 0.94, 0.88] | **[1.0, 0.91, 0.82]** |
| FIQ 95 | Mind Reader | Unchanged, pending | *Still pending — validate with cooldown* |
| SPD 95 | Ghost Step | Zero-cost dodge, 1/round | *Unchanged* |
| DEF 95 | Fortress | Flat -2 all incoming | *Unchanged* |
| AGG 95 | Berserker | HP<50% → +1d8 next 8 | *Unchanged* |

---

## Monte Carlo Validation Plan

Same 6 sims as V7. Updated targets where relevant.

**SIM 1: ARCHETYPE TRIANGLE (CRITICAL)**
- Apply: Counter Puncher cooldown (2-tick) + Iron Guard 35% reaction vs CP + all V7 technique changes
- Pass: each edge 60-70%
- Tuning: If T→C < 60%: raise Iron Guard reaction to 40%. If C→P > 70%: raise cooldown to 3-tick. If P→T < 60%: raise Relentless recovery to 3/hit.

**SIM 2: HYBRID VS SPECIALIST (CRITICAL)**
- Hybrid no longer has effective Counter Puncher (base 15% reaction, no Iron Guard). Cooldown + Iron Guard interaction should remove hybrid's Counter advantage.
- Pass: each specialist beats Hybrid 55-65%

**SIM 3: GEAR (HIGH)**
- New fractional damage values (+0.3/+1.0).
- Pass: Full Standard 52-55%. Full Legendary 58-65%. Trained 80 no gear > 50 full Legendary at 70%+.

**SIM 4: CONDITION (HIGH)**
- ±2% action rate.
- Pass: Mirror Fresh vs Tired 53-57%. Pressure shift >2%.

**SIM 5: CROSS-TIER (MEDIUM)** — Re-run. Expect similar to V7 (these were fine).

**SIM 6: SIGNATURES (MEDIUM)**
- Devastator with natural-crit-only trigger: target ~42%.
- Iron Man with [1.0, 0.91, 0.82]: target 55-62%.
- Mind Reader with Counter Puncher cooldown: validate it's not broken.

**V8 Tuning Knobs:**

| Fix | Knob | Turn up | Turn down |
|-----|------|---------|-----------|
| Counter Puncher cooldown | Tick duration | 2→3→4 | 2→1 |
| Iron Guard vs CP reaction | Percentage | 35%→40%→45% | 35%→25% |
| Counter Puncher stamina | Cost per trigger | 3→5 | 3→2 |
| Gear Core Module damage | Legendary value | 1.0→1.5 | 1.0→0.7 |
| Condition action rate | Magnitude | ±2%→±3% | ±2%→±1% |
| Devastator | Natural crit range | 20 only → 19-20 (with EC gear) | Already restricted |
| Iron Man R3 | Multiplier | 0.82→0.85 | 0.82→0.79 |
