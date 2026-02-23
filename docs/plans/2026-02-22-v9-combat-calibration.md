# V9 Combat Calibration

Response to Kakashi's V8 Monte Carlo. V8 solved Counter Puncher (now ~8% of Counter's damage). The remaining triangle failure is a **tempo problem** — SPD 80 gives Counter 58% more actions than Turtle's SPD 50. This pass addresses tempo, gear compounding, and condition fine-tuning.

> **V9 (2026-02-22):** 3 changes. Iron Guard counter-strike (Turtle offensive via defense), gear non-damage slot reduction, condition fine-tune. Iron Man and Counter Puncher cooldown are locked from V8.

## Locked From V8 (no changes)

These passed or are close enough to lock:

| System | V8 Value | V8 Result | Status |
|--------|----------|-----------|--------|
| Counter Puncher cooldown | 2-tick | 16/fight (was 30), 8% of damage | **LOCKED** |
| Iron Guard vs CP reaction | 35% | 5.6 blocks/fight | **LOCKED** |
| Counter Puncher stamina cost | 3/trigger | Working with cooldown | **LOCKED** |
| Iron Man exhaustion | [1.0, 0.91, 0.82] | 60.3% | **PASS — LOCKED** |
| Devastator | Natural crits only | 49.4% (target 42%) | **Close — LOCKED** (7% over, acceptable) |
| Relentless | 2 stam/hit + finisher <40 | P→T 58.1% | **LOCKED** (triangle fix will adjust) |
| Grinding Guard | 2 drain/block | Working | **LOCKED** |
| Inexhaustible | Gassed@10, partial 10-20 | Working | **LOCKED** |

---

## Fix 3 (revised): Iron Guard Counter-Strike

### Problem

T→C is 8.0%. Counter Puncher is no longer the cause — it's only 8% of Counter's damage after V8 cooldown + Iron Guard reaction nerfs. The root cause is **raw tempo**: SPD 80 (0.053 actions/tick) vs SPD 50 (0.0425) = 58% more actions for Counter. Counter throws 124.7 strikes/fight vs Turtle's 79.0. Turtle has no way to create offense from its defensive position.

### V9 Design

**Iron Guard (DEF 80) — three components:**

1. **Block reduction doubled:** `DEF_modifier + 2d6` (unchanged)
2. **Grinding Guard:** Each block drains 2 attacker stamina (unchanged)
3. **NEW — Counter-Strike:** Each successful Iron Guard block triggers a guaranteed counter-strike dealing `1d4` damage to the attacker. This damage is automatic (no attack roll, no reaction chance). It fires every time Iron Guard blocks.

### Why This Fixes T→C

Counter has SPD 80 and attacks 124.7 times/fight. Turtle's reaction chance at FIQ 65 + Ring Sense = ~25%. Iron Guard upgrades that to a full block. Of 124.7 incoming attacks:

- Turtle reacts to ~25% = ~31 blocks/fight
- Each block: Iron Guard absorbs damage + Grinding Guard drains 2 stamina + **Counter-Strike deals 1d4 (avg 2.5)**
- Counter-Strike total damage: 31 × 2.5 = **~77.5 damage/fight**

For comparison, Turtle's OFFENSIVE output (its own attacks landing) at STR 50 deals roughly 2.0 avg damage per hit × ~30 landed hits = ~60 damage. Counter-Strike **more than doubles Turtle's total damage output** against high-tempo attackers.

**The judo mechanic:** Counter's greatest strength (action rate) becomes Turtle's weapon. The faster Counter attacks, the more blocks Turtle gets, the more Counter-Strike damage Turtle deals. Counter's tempo advantage feeds Turtle's offense.

**Counter vs Turtle (target: Turtle 60-70%):**
- Counter throws 124.7 attacks. Turtle blocks ~31. Each block: absorb + drain 2 stam + 1d4 damage.
- Counter-Strike: ~77.5 damage. Turtle's own attacks: ~60 damage. Total Turtle offense: ~137.5.
- Counter's offense after Iron Guard absorption: significantly reduced. Counter's stamina drains from Grinding Guard (31 × 2 = 62 stamina drained).
- Counter Puncher fires ~16 times, ~5.6 blocked by Iron Guard (35% reaction). 10 land for ~45 damage. But Counter's base attacks are being absorbed and punished.
- Turtle wins through accumulated Counter-Strike damage + Grinding Guard stamina drain + Iron Guard mitigation. Estimated: Turtle 60-68%.

**Pressure vs Turtle (target: Pressure 60-70%):**
- Pressure throws fewer attacks than Counter (AGG 80 selects expensive power attacks, lower base tempo at SPD 50).
- Pressure attacks ~68 times/fight (V6 data). Turtle blocks ~25% = ~17 blocks.
- Counter-Strike: 17 × 2.5 = ~42.5 damage. Less than half of what Counter faces.
- But Pressure's attacks deal MORE per hit (power attacks, Devastating Blow bursts). Iron Guard mitigates but Devastating Blow's exploding dice spike past the ceiling.
- Relentless recovers 2 stamina/hit, partially offsetting Grinding Guard drain.
- Net: Pressure's burst damage > Turtle's Counter-Strike + mitigation. Estimated: Pressure 60-68%.

**Why Counter-Strike scales correctly across matchups:**
- vs Counter (124.7 attacks, ~31 blocks): ~77.5 CS damage. Massive. Turtle wins.
- vs Pressure (68 attacks, ~17 blocks): ~42.5 CS damage. Moderate. Pressure's burst still wins.
- vs Hybrid (moderate attacks, ~20 blocks): ~50 CS damage. Enough for Turtle to compete.
- Counter-Strike damage is proportional to opponent's attack frequency. It self-balances — aggressive opponents take more punishment.

### What a bettor sees

"This Turtle has Iron Guard. Every blocked attack deals damage back. The Counter opponent attacks 25% faster than average — that's actually BAD for Counter here. More attacks = more blocks = more counter-strike damage. Turtle wins the attrition war."

This is a visible, readable mechanic. Bettors who understand attack frequency can predict Counter-Strike's total impact. High-tempo opponents (Counter, aggressive Hybrids) suffer more. Low-tempo opponents (Pressure, defensive builds) are less affected.

### Counter-Strike vs Counter Puncher: Symmetry

| | Counter Puncher (FIQ 80) | Counter-Strike (DEF 80) |
|---|---|---|
| Trigger | Dodge → auto-hit | Block → auto-hit |
| Damage | 1d4 + SPD_mod (+2) | 1d4 |
| Cost | 3 stamina | 0 stamina (Iron Guard is already blocking) |
| Cooldown | 2 ticks | None (fires every block) |
| Counterplay | Block reaction (35% with Iron Guard) | None (automatic on block) |

Counter Puncher is stronger per-trigger (+2 modifier, dodges also avoid damage). Counter-Strike is weaker per-trigger (no modifier, block still takes residual damage) but has no cooldown and no stamina cost. The balance comes from frequency × defense tradeoff: Counter Puncher requires dodging (evasive), Counter-Strike requires blocking (absorptive). Different defensive identities, symmetrical offensive output.

---

## Fix 5 (revised): Gear — Non-Damage Slot Reduction

### Problem

V8 fractional damage (Core Module +0.3/+1.0) helped significantly. But 6 slots still compound: +1% action rate + +2% reaction + +4 stamina each add up. Standard at 57.4% (target 52-55%). Legendary at 86.0% (target 58-65%).

### V9 Design

**Halve non-damage gear slot bonuses. Keep 6 slots for gear chase variety.**

| Slot | Combat Effect | Standard | Enhanced | Superior | Legendary |
|------|-------------|----------|----------|----------|-----------|
| **Core Module** | Bonus damage | +0.3 | +0.5 | +0.7 | +1.0 |
| **Neural Link** | Bonus reaction % | **+1%** | **+1.5%** | **+2%** | **+3%** |
| **Arm Augments** | Bonus attack roll | +0 | +0 | +1 | +1 |
| **Leg Rigs** | Bonus action rate % | **+0.5%** | **+1%** | **+1%** | **+1.5%** |
| **Exo-Frame** | Bonus AC | +0 | +0 | +1 | +1 |
| **Reflex Core** | Bonus stamina pool | **+2** | **+3** | **+4** | **+6** |

Changes from V8 (bolded): Neural Link, Leg Rigs, Reflex Core all halved. Core Module, Arm Augments, Exo-Frame unchanged.

**Why these three slots:**
- **Neural Link (reaction):** Reaction compounds — more dodges/blocks = less damage taken AND more Counter Puncher/Counter-Strike triggers. Halving reduces the compounding chain.
- **Leg Rigs (action rate):** Action rate is the most powerful stat in the system (Kakashi's V7 analysis confirmed this). Even +1% compounds into more hits, more technique triggers, more stamina drain. Halving keeps it visible at Legendary (+1.5%) without dominating at Standard (+0.5%).
- **Reflex Core (stamina):** Stamina pool determines when fighters gas. +12 at Legendary was a full 24% increase on a base-50 fighter (pool 50 → 62). Halved to +6 (pool 50 → 56). Still meaningful, not distortive.

**Why NOT halve Arm Augments and Exo-Frame:**
- Both are already +0 at Standard/Enhanced. They only contribute at Superior/Legendary (+1 each). That's a minor contribution. Halving to +0.5 would require fractional AC/attack tracking for minimal benefit.

**Expected impact:**

Full Standard: +0.3 damage, +1% reaction, +0 attack, +0.5% action rate, +0 AC, +2 stamina.
- Each bonus is individually negligible. Total compound effect: estimated ~52-54% (in range).

Full Legendary: +1.0 damage, +3% reaction, +1 attack, +1.5% action rate, +1 AC, +6 stamina.
- Visible edge in every dimension. Total compound effect: estimated ~62-68% (close to range, may need further tuning).

**Why halve slots instead of cutting slot count:**
- 6 slots = 6 distinct gear chase paths. "I need more damage" → Core Module. "I need reaction" → Neural Link. Cutting to 4 removes two paths and reduces gear depth.
- The problem was compounding magnitude, not slot count. Halving the three most compounding slots (reaction, action rate, stamina) addresses the root cause without losing gear variety.
- Bettors who study gear loadouts need DIFFERENT loadout configurations to evaluate. 6 slots with varied bonuses creates more unique builds than 4 slots.

---

## Fix 6 (revised): Condition — Fine-Tune

### Problem

V8 condition (±2% action rate, ±10 stamina, ±0.10 regen) gave 56.4% Fresh win rate. Top of the 53-57% target range. Condition for Tired favorite was 72.0% (target 60-68%). Turtle drop from condition was still only 0.7% (target >2%).

### V9 Design

| Condition | Stamina Pool | Stamina Regen | Action Rate |
|-----------|-------------|---------------|-------------|
| **Fresh** | **+8** | **+0.08/tick** | **+1.5%** |
| **Normal** | — | — | — |
| **Tired** | **-8** | **-0.08/tick** | **-1.5%** |

Changes from V8: action rate ±2% → **±1.5%**. Stamina pool ±10 → **±8**. Regen ±0.10 → **±0.08**.

**Why reduce all three components (not just action rate):**
- V8 Fresh vs Tired was 56.4%. Only 2.4% above range would mean action rate alone (at ±1.5%) might land it. But the Tired favorite result (72.0% vs 60-68% target) suggests all three components are contributing to the overshoot.
- Reducing all three by ~20-25% brings the total condition impact down proportionally. This is cleaner than zeroing one component and leaving others untouched.
- Turtle condition drop (0.7%) needs the stamina component to matter more relative to action rate. Turtle's gameplan depends on stamina (blocking costs stamina, Inexhaustible threshold is stamina-based). Reducing stamina magnitude slightly but keeping it proportional to action rate maintains the asymmetric archetype impact.

---

## Mind Reader (FIQ 95) — Flagged for Validation

V8: 73.0% win rate. Still high. But the Counter Puncher cooldown + Iron Guard counter-strike changes will shift this:

- Mind Reader has SPD 80 + FIQ 95 (60% reaction). High tempo + high dodge rate.
- Against Iron Guard: Mind Reader's attacks get blocked → Counter-Strike fires. Mind Reader takes 1d4 per blocked attack.
- Mind Reader's 60% reaction rate means it dodges a lot, but Iron Guard's 35% reaction means Turtle also blocks a lot of Mind Reader's Counter Puncher triggers.
- The Counter-Strike mechanic punishes Mind Reader's tempo the same way it punishes base Counter.

Expected: Mind Reader drops from 73.0% to somewhere in the 60-68% range against Turtle-archetype opponents. Need Monte Carlo to confirm.

If Mind Reader is still above 68% after V9 sims: add a stamina cost to Mind Reader's enhanced reaction (2 stam per dodge at 60% reaction burns stamina fast).

---

## Unchanged From V8

Everything not listed above carries forward:

- **Core d20 math, HP 600, modifier formula, AC, exhaustion**
- **3-Tier Progressive Specialization** (65/80/95)
- **All tier 1 traits**
- **Counter Puncher** (3 stam, 2-tick cooldown, block reaction with Iron Guard 35%) — LOCKED
- **Relentless** (2 stam/hit + finisher <40) — LOCKED
- **Grinding Guard** (2 drain/block) — LOCKED
- **Inexhaustible** (Gassed@10, partial 10-20) — LOCKED
- **Devastating Blow** (exploding dice) — LOCKED
- **First Strike** (guaranteed tick 0) — LOCKED
- **Iron Man** [1.0, 0.91, 0.82] — LOCKED
- **Devastator** (natural crits only, d6) — LOCKED
- **Ghost Step, Fortress, Berserker** — unchanged
- **Gear special traits** (Thick Plating, Stabilizers, Endurance Rig, Expanded Crit, Adrenaline Surge, Chain Lightning) — unchanged
- **Information layer framework** and per-layer outcome targets

---

## V9 Technique Summary

| Stat | Technique | V8 | V9 Change |
|------|-----------|-----|-----------|
| DEF 80 | Iron Guard + Grinding Guard | Double block + 2 drain | **+Counter-Strike: 1d4 auto-damage on block** |
| FIQ 80 | Counter Puncher | 3 stam, 2-tick CD, blockable | *LOCKED* |
| AGG 80 | Relentless | 2 stam/hit + finisher <40 | *LOCKED* |
| STA 80 | Inexhaustible | Gassed@10, partial 10-20 | *LOCKED* |
| STR 80 | Devastating Blow | Exploding dice | *LOCKED* |
| SPD 80 | First Strike | Guaranteed tick 0 | *LOCKED* |

| Stat | Signature | V8 | V9 Change |
|------|-----------|-----|-----------|
| STR 95 | Devastator | Natural crits, d6 | *LOCKED* |
| STA 95 | Iron Man | [1.0, 0.91, 0.82] | *LOCKED* |
| FIQ 95 | Mind Reader | 60% reaction, pending | *Validate with Counter-Strike* |
| Others | — | — | *Unchanged* |

---

## Monte Carlo Validation Plan

**SIM 1: ARCHETYPE TRIANGLE (CRITICAL)**
- Apply: Iron Guard Counter-Strike (1d4 on block). All V8 technique values locked.
- Pass: each edge 60-70%
- Key test: T→C. Counter-Strike should generate ~77 damage/fight against Counter's tempo.
- Tuning: If T→C < 60%: increase Counter-Strike to 1d6. If T→C > 70%: decrease to 1d3. If P→T drops below 58%: Counter-Strike damage against Pressure is too high (reduce to 1d3 against non-SPD-80 fighters, or add Relentless recovery offset).

**SIM 2: HYBRID VS SPECIALIST (CRITICAL)**
- Hybrid lacks Iron Guard → no Counter-Strike. Turtle now has offensive output against Hybrid.
- Counter-Strike against Hybrid: Hybrid attacks at moderate tempo (~90 strikes). Turtle blocks ~22. CS damage: ~55. Enough for Turtle to compete.
- Pass: each specialist 55-65%

**SIM 3: GEAR (HIGH)**
- New non-damage slot values (halved Neural Link, Leg Rigs, Reflex Core).
- Pass: Standard 52-55%. Legendary 58-65%.

**SIM 4: CONDITION (HIGH)**
- ±1.5% action rate, ±8 stamina, ±0.08 regen.
- Pass: Mirror Fresh 53-57%. Tired fav 60-68%.

**SIM 5: CROSS-TIER (MEDIUM)** — Re-run. Expect stable.

**SIM 6: SIGNATURES (MEDIUM)** — Re-validate Mind Reader with Counter-Strike. Target: <68%.

**V9 Tuning Knobs:**

| Fix | Knob | Turn up | Turn down |
|-----|------|---------|-----------|
| Counter-Strike damage | Die | 1d4→1d6 | 1d4→1d3 |
| Counter-Strike scope | Target restriction | All attackers | Only SPD 80+ attackers |
| Gear Neural Link | Legendary | 3%→4% | 3%→2% |
| Gear Leg Rigs | Legendary | 1.5%→2% | 1.5%→1% |
| Gear Reflex Core | Legendary | 6→8 | 6→4 |
| Condition action rate | Magnitude | ±1.5%→±2% | ±1.5%→±1% |
| Condition stamina | Pool | ±8→±10 | ±8→±6 |
| Mind Reader | Stamina cost per dodge | None | 2/dodge (if still >68%) |
