# V11 Combat Calibration

Response to 5 iterations (V6-V10) of technique-level fixes that moved T→C from 10% to 16.7%. Root cause confirmed: the 30-point SPD gap between Counter (80) and Turtle (50) is an archetype stat allocation problem, not a mechanics problem. V11 fixes the allocation.

> **V11 (2026-02-23):** 3 changes. Turtle stat swap (SPD 65, drop FIQ to 50), gear slot reduction to 4, Legendary gear values reduced. All technique mechanics locked from V8-V10.

## What 5 Iterations Proved

| Version | Change | T→C | Lesson |
|---------|--------|------|--------|
| V6 | Baseline techniques | 10% | Counter Puncher is broken |
| V7 | CP stamina cost + block reaction | 8% | Stamina costs are noise |
| V8 | CP cooldown + Iron Guard 35% | 8% | CP is now 8% of damage — fixed |
| V9 | Counter-strike (1d4 on block) | 14.3% | Offense helps but is archetype-blind |
| V10 | Diminishing AR + conditional CS | 16.7% | Even slope=0 gives 16.5% raw gap |

**Conclusion:** Every technique-level fix combined moved T→C by 6.7 points. We need +50 points. The techniques are fine. The stat allocation is wrong. Turtle has no tempo because it has no SPD investment.

---

## Change 1: Turtle Archetype Stat Swap

### V10 Turtle
| Stat | Value | Tier Unlock |
|------|-------|-------------|
| DEF | 80 | Iron Guard + Grinding Guard + Counter-Strike |
| STA | 80 | Inexhaustible |
| FIQ | 65 | Ring Sense (+5% reaction) |
| STR | 50 | — |
| SPD | 50 | — |
| AGG | 50 | — |

### V11 Turtle
| Stat | Value | Tier Unlock |
|------|-------|-------------|
| DEF | 80 | Iron Guard + Grinding Guard + Counter-Strike |
| STA | 80 | Inexhaustible |
| **SPD** | **65** | **Quick Feet (+5% action rate)** |
| STR | 50 | — |
| **FIQ** | **50** | — |
| AGG | 50 | — |

**What Turtle gains:**
- Quick Feet (+5% multiplicative action rate). SPD 65 base rate: 0.0478. With Quick Feet: 0.0478 × 1.05 = **0.0502**.
- Counter's SPD 80 with V10 curve: **0.0505**.
- Raw gap: **0.6%** (was 19% in V10, was 25% pre-curve).
- Observed strike gap: estimated **~3-5%** (was ~58%). Near tempo parity.

**What Turtle loses:**
- Ring Sense (+5% reaction chance). Turtle drops from ~25% reaction to ~20% base.
- FIQ 50 means lower decision quality (less optimal action selection).

**Why this is the right trade:**
- Turtle's identity is BLOCKING, not dodging/reacting. Ring Sense helped, but Iron Guard (tier 2) does the heavy lifting. Iron Guard's 35% reaction vs Counter Puncher specifically is unchanged — that interaction doesn't depend on FIQ.
- Quick Feet gives Turtle ~15 more actions per fight. At ~2.5 avg damage per action, that's ~37.5 more offensive damage. Combined with counter-strike (~62 damage) and Grinding Guard (stamina drain), Turtle now has real offense.
- FIQ 50 means Turtle's base reaction drops to ~15%. Against normal attacks (not Counter Puncher), Turtle reacts less. But Turtle BLOCKS, not dodges. The reaction roll determines IF Turtle tries to block/dodge, and Iron Guard makes blocks devastating. Fewer reactions is a real cost, but Turtle's whole gameplan is absorbing hits through high DEF + Iron Guard.

### How This Reshapes the Triangle

**Turtle vs Counter (target: Turtle 60-70%):**
- Tempo: near parity (0.0502 vs 0.0505). Turtle throws ~95 strikes (was ~79). Counter throws ~100 (was ~121 pre-curve).
- Counter-strike: conditional (Counter is faster). Fires on ~25 blocks × 2.5 = ~62 damage.
- Grinding Guard: ~25 blocks × 2 stamina = 50 drain on Counter.
- Counter Puncher: fires ~13 times. Iron Guard blocks 35% = ~4.5 blocked. ~8.5 land for ~38 damage. Each trigger costs Counter 3 stamina + 2-tick cooldown.
- Turtle's FIQ dropped to 50 (reaction ~15%). Against Counter's normal attacks, Turtle blocks less. But Iron Guard still doubles block reduction when Turtle does block. The tradeoff: fewer blocks but each block is punishing.
- Net: tempo parity + counter-strike + Grinding Guard vs Counter's reduced tempo advantage + nerfed CP. Estimated: Turtle 58-66%.

**Pressure vs Turtle (target: Pressure 60-70%):**
- Counter-strike: does NOT fire (Pressure SPD 50 = Turtle SPD 65 effective rate... wait.)

Actually — important detail. Turtle's base SPD is 65 (rate 0.0478). Pressure's base SPD is 50 (rate 0.0425). Turtle IS faster than Pressure now. Counter-strike condition: fires when attacker's base rate > defender's base rate. Pressure (0.0425) < Turtle (0.0478). **Counter-strike does NOT fire.** Good — Pressure doesn't get punished.

But Turtle being faster than Pressure changes the dynamic. Turtle now outstrikes Pressure (~95 vs ~68 strikes). Turtle's STR 50 means low damage per hit, but 27 more actions is significant.

- Relentless: Pressure recovers 2 stam/hit. Against Turtle's increased offense, Pressure takes more hits → recovers more stamina. Partially self-correcting.
- Devastating Blow: still bursts past Iron Guard ceiling. Pressure's per-hit damage is much higher than Turtle's.
- Net: Pressure wins through damage quality over Turtle's quantity. Turtle's extra actions deal ~50-67 damage at STR 50, while Pressure's fewer but harder hits accumulate ~600+ through burst and base power. Estimated: Pressure 58-66%.

**Counter vs Pressure (target: Counter 60-70%):**
- Unchanged from V10. Both archetypes keep their stats. Counter still has SPD 80 (0.0505) vs Pressure SPD 50 (0.0425). AR curve reduces Counter's advantage from 25% to 19%.
- Counter Puncher still effective against Pressure's low DEF/FIQ.
- Estimated: C→P 65-72%. May need the AR curve to bring this into 60-70%.

### Updated Archetype Stat Table

| Archetype | Primary | Secondary | Tertiary | STR | SPD | DEF | STA | FIQ | AGG |
|-----------|---------|-----------|----------|-----|-----|-----|-----|-----|-----|
| **Pressure** | STR 80 | AGG 80 | STA 65 | 80 | 50 | 50 | 65 | 50 | 80 |
| **Turtle** | DEF 80 | STA 80 | **SPD 65** | 50 | **65** | 80 | 80 | **50** | 50 |
| **Counter** | FIQ 80 | SPD 80 | DEF 65 | 50 | 80 | 65 | 50 | 80 | 50 |

**Tier 1 traits per archetype:**

| Archetype | Tier 1 Traits (stat 65) |
|-----------|------------------------|
| Pressure | Deep Lungs (STA 65): +15 stamina pool |
| Turtle | Quick Feet (SPD 65): +5% action rate |
| Counter | Thick Skin (DEF 65): +1 AC |

Each archetype has exactly one tier 1 trait from its tertiary stat. Clean design.

### Training Investment

| Archetype | Days to full build (0→80 primary, 0→80 secondary, 0→65 tertiary) |
|-----------|---|
| Pressure | 80 + 80 + 65 = 225 points → ~281 days (at 0.8/day base) |
| Turtle | 80 + 80 + 65 = 225 points → ~281 days |
| Counter | 80 + 80 + 65 = 225 points → ~281 days |

Identical investment across archetypes. No archetype is cheaper to build.

---

## Change 2: Gear Reduction to 4 Slots

### Problem

5 iterations of gear tuning (V7: raw stats → V8: fractional damage → V9: halved non-damage → V10: halved Core Module) and Legendary still hits 76.8%. The compounding comes from SLOT COUNT — 6 independent bonuses all pulling in the same direction.

### V11 Design

**4 gear slots.** Cut Leg Rigs (action rate) and Reflex Core (stamina pool).

| Slot | Combat Effect | Standard | Enhanced | Superior | Legendary |
|------|-------------|----------|----------|----------|-----------|
| **Core Module** | Bonus damage | +0.15 | +0.25 | +0.35 | +0.5 |
| **Neural Link** | Bonus reaction % | +1% | +1.5% | +2% | +3% |
| **Arm Augments** | Bonus attack roll | +0 | +0 | +1 | +1 |
| **Exo-Frame** | Bonus AC | +0 | +0 | +1 | +1 |

**Why cut Leg Rigs and Reflex Core:**
- **Leg Rigs (action rate):** Action rate is the most powerful stat in the system. Even +0.5% compounds through every mechanic. Removing it eliminates the most distortive gear bonus.
- **Reflex Core (stamina pool):** Stamina interacts with Inexhaustible thresholds, Relentless triggers, and Grinding Guard drain rates. Removing it keeps stamina economy purely stat-driven.
- **Neural Link (reaction) stays:** Reaction is meaningful but bounded. +3% Legendary on a 15-30% base is a modest improvement. Doesn't compound as aggressively as action rate or stamina.
- **Arm Augments and Exo-Frame stay:** Both are +0 at Standard/Enhanced and +1 at Superior/Legendary. Small, clean bonuses that don't compound.

**Expected impact:**

Full Standard: +0.15 damage, +1% reaction, +0 attack, +0 AC.
- Total effect: ~51-53%. Barely perceptible. Standard gear is filler — acquired easily, creates almost no edge.

Full Legendary: +0.5 damage, +3% reaction, +1 attack, +1 AC.
- +0.5 × 90 hits = +45 damage (7.5% HP)
- +3% reaction = ~2-3 more dodges/blocks per fight
- +1 attack = ~4-5% more hits land
- +1 AC = ~4-5% fewer hits taken
- Total effect: estimated ~56-62%. In the 58-65% target range.

**2 cosmetic slots unchanged:** Walkout Track (audio) and War Paint (visual).

**Gear special traits updated:**

| Rarity | Trait | Slot |
|--------|-------|------|
| Superior | **Thick Plating** — Block reduction +2 | Exo-Frame |
| Superior | **Stabilizers** — Dodge stamina 8→5 | Neural Link |
| Superior | **Endurance Rig** — +15 stamina at round break | Core Module |
| Legendary | **Expanded Crit** — Crit range +1 | Arm Augments |
| Legendary | **Adrenaline Surge** — HP <40% refills stamina to 75% | Core Module |
| Legendary | **Chain Lightning** — Devastating Blow rerolls re-explode (max 3) | Arm Augments |

Stabilizers moved from the removed Reflex Core slot to Neural Link (both relate to defensive reactions). Endurance Rig moved from the removed Leg Rigs to Core Module (stamina recovery is a core function).

---

## Change 3: Legendary Gear Value Reduction

Even with 4 slots, Legendary values may still compound. Reduce Neural Link and keep others at V10 values.

| Slot | V10 Legendary | V11 Legendary | Change |
|------|--------------|--------------|--------|
| Core Module | +0.5 | +0.5 | — |
| Neural Link | +3% | **+2%** | Reduced |
| Arm Augments | +1 | +1 | — |
| Exo-Frame | +1 | +1 | — |

Neural Link at +3% was the strongest non-damage slot because reaction compounds (more dodges → less damage taken → survive longer → deal more total damage). Reducing to +2% keeps it meaningful without excessive compounding.

---

## Unchanged From V10

All technique mechanics are locked:

- **Diminishing action rate above SPD 70** (slope 0.010) — LOCKED
- **Counter Puncher** (3 stam, 2-tick CD, blockable, Iron Guard 35%) — LOCKED
- **Counter-Strike** (1d4, conditional on faster attacker) — LOCKED
- **Relentless** (2 stam/hit + finisher <40) — LOCKED
- **Grinding Guard** (2 drain/block) — LOCKED
- **Inexhaustible** (Gassed@10, partial 10-20) — LOCKED
- **Devastating Blow** (exploding dice) — LOCKED
- **First Strike** (guaranteed tick 0) — LOCKED
- **Iron Man** [1.0, 0.91, 0.82] — LOCKED
- **Devastator** (natural crits, d6) — LOCKED
- **Condition** (±1.5% action rate, ±8 stam, ±0.08 regen) — LOCKED
- **All other signatures** — unchanged

---

## Monte Carlo Validation Plan

**SIM 1: ARCHETYPE TRIANGLE (CRITICAL)**
- Turtle build: DEF 80, STA 80, SPD 65 (was FIQ 65). All other builds unchanged.
- Apply all locked techniques (V8-V10).
- Pass: each edge 60-70%.
- Tuning: If T→C < 60%: raise counter-strike to 1d6 OR add scaled CS (Option B from Kakashi). If T→C > 70%: reduce counter-strike to 1d3 or remove conditional (fire on all blocks). If P→T < 60%: Turtle's increased tempo may be pushing back too hard — reduce Quick Feet to +3% or remove counter-strike vs Pressure entirely (conditional already handles this). If C→P > 70%: lower AR curve knee to 65 or steepen slope.

**SIM 2: HYBRID VS SPECIALIST (CRITICAL)**
- Hybrid 65 has Ring Sense (FIQ 65) but NOT Quick Feet (SPD 65 unless SPD is 65). Wait — Hybrid has ALL stats at 65. So Hybrid gets ALL tier 1 traits: Heavy Hands, Quick Feet, Thick Skin, Deep Lungs, Ring Sense, Forward Pressure.
- Turtle now also has Quick Feet. Turtle vs Hybrid: both have Quick Feet tempo. Turtle has Iron Guard + Grinding Guard + Counter-Strike. Hybrid has breadth.
- Pass: each specialist 55-65%.

**SIM 3: GEAR (HIGH)**
- 4 slots only. New values.
- Pass: Standard 51-54%. Legendary 56-62%.

**SIM 4: CONDITION** — Already passed in V9/V10. Re-validate.

**SIM 5: CROSS-TIER** — Re-run with new Turtle build.

**SIM 6: SIGNATURES**
- Mind Reader: FIQ 95 + SPD 80 (0.0505). With AR curve, Mind Reader has near-parity with Turtle (SPD 65 + QF = 0.0502). But Mind Reader's 60% reaction is the real dominance factor. Validate whether tempo parity is enough, or if Mind Reader needs a separate nerf (stamina cost per dodge).
- All others: re-validate.

**Tuning knobs:**

| Knob | Up | Down |
|------|-----|------|
| Turtle SPD | 65→70 | 65→60 |
| Turtle FIQ | 50→55 | 50 (floor) |
| Counter-strike die | 1d4→1d6 | 1d4→1d3 |
| Quick Feet bonus | +5%→+7% | +5%→+3% |
| AR curve slope above 70 | 0.010→0.015 | 0.010→0.005 |
| Gear Neural Link (Leg) | 2%→3% | 2%→1% |
