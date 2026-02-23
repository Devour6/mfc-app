# V7 Combat System Fixes

Response to Kakashi's V6 Monte Carlo (4/4 critical sims failed). This document proposes fixes to all broken systems and introduces a new design framework for evaluating balance.

> **V7 (2026-02-22):** 7 fixes across all 3 archetypes, gear, condition, and signatures. Core d20 math and tier structure unchanged from V6. This is a tuning pass on the tier 2 techniques + supporting systems, not a structural redesign.

## Design Framework: Information Layers

Every mechanic in MFC exists to create a betting signal. V6 failed because the mechanics were either too dominant (Counter Puncher) or invisible (condition, Standard gear). V7 uses **per-layer outcome targets** to ensure each mechanic creates a meaningful, non-trivial signal without drowning out the others.

| Information Layer | What the bettor studies | Target outcome shift | Betting behavior |
|-------------------|------------------------|---------------------|-----------------|
| **Archetype triangle** | Counter > Pressure > Turtle > Counter | ±15% (65% center) | "Who wins this matchup type?" — the first question every bettor asks |
| **Stat gaps within archetype** | STR 85 Pressure vs STR 75 Pressure | ±5-10% | "This Pressure is stronger than most" — rewards studying character sheets |
| **Gear** | Full Legendary vs no gear at same stats | ±5-10% total, ±1-3% per piece | "Geared fighter has an edge" — rewards tracking equipment changes |
| **Condition** | Fresh vs Tired | ±3-5% | "Tired fighter might underperform" — rewards tracking fight schedules |
| **Signatures** | Devastator might fire in R1 | ±5% when relevant, triggers 35-50% of fights | "Will it happen?" — creates live-trading moments mid-fight |

**The stacking principle:** A fully informed bettor who reads ALL layers can estimate a specific fight's true probability within ±5% of actual. The layers are additive — a Counter (triangle +15%) who is Tired (condition -4%) with Legendary gear (+8%) against a Pressure with stat advantage (-7%) nets out to roughly +12%. The math is tractable but requires work. That work IS the skill.

**Validation rule:** Every fix below gets evaluated against its layer target. If a Monte Carlo shows a mechanic shifting outcomes by more or less than its target range, the mechanic is mis-tuned.

---

## Fix 1: Counter Puncher (FIQ 80)

### Problem

Counter Puncher fires 12-16 times per fight, dealing 55-70 bonus damage. It's free (zero stamina), unblockable (Iron Guard doesn't interact with it), and requires no action slot. Counter dominates every matchup (81-90% win rate) because it gets offense for free on top of its defensive identity.

Kakashi identified this correctly. What the raw data adds: Counter also dominates on TEMPO — SPD 80 gives 25% more actions per tick than SPD 50 fighters. Counter throws 103-123 strikes vs Pressure's 49 and Turtle's 79-97. Even without Counter Puncher, Counter outstrikes everyone.

### V7 Design

**Counter Puncher (FIQ 80) — two changes:**

1. **Costs 3 stamina per trigger.** Counter Puncher is powerful — but now it drains resources. Each dodge-counterpunch cycle costs 11 stamina (8 dodge + 3 counter punch), or 8 with Stabilizers gear (5 + 3). With Counter's STA 50 (pool 50), this creates a natural ceiling of ~5-7 counter punches before stamina pressure builds.

2. **Subject to defender's block reaction.** When Counter Puncher fires, the target gets their normal reaction chance to block (not dodge — counter-attacks are too fast to dodge). If the target has Iron Guard, they reduce Counter Puncher damage by `DEF_mod + 2d6`.

### Why this fixes the triangle

**Counter vs Pressure (target: Counter 65%):**
- Pressure has FIQ 50 (~15% reaction chance) and no Iron Guard. Most counter punches land unblocked. Counter Puncher is effective here.
- But it now costs 3 stamina per trigger. Against Pressure (who attacks a lot → many dodges → many counter punches), Counter burns through stamina. Counter's SPD 80 tempo advantage still carries, but there's a time limit — Counter needs to finish before gassing.
- Net: Counter still wins through tempo + counter punches, but not at 81%. Estimated 62-68%.

**Counter vs Turtle (target: Turtle 65%):**
- Turtle has FIQ 65 + Ring Sense (+5%) = ~30% reaction chance AND Iron Guard. When Counter Puncher fires, Turtle blocks ~30% of them. Iron Guard reduces Counter Puncher damage by `DEF_mod(+2) + 2d6` (avg 9). Counter Puncher deals `1d4 + SPD_mod(+2)` = avg 4.5. After Iron Guard: effectively 0 (min 1 damage).
- Counter Puncher is neutralized against Turtle. AND it still costs 3 stamina per trigger — Counter is spending resources for nothing.
- Net: Turtle wins by outlasting Counter. Counter's offense is absorbed, Counter's stamina drains, Turtle wins Decision. Estimated Turtle 60-68%.

### What a bettor sees

"Counter Puncher is powerful but expensive. Against low-DEF fighters, it's devastating. Against Iron Guard, it's wasted stamina. Check the opponent's DEF and FIQ before betting on a Counter."

This is a real information layer — Counter Puncher's effectiveness depends on the SPECIFIC opponent, not just the archetype.

---

## Fix 2: Relentless (AGG 80)

### Problem

V6 Relentless: "+2 to all attack rolls when opponent enters Gassed state (stamina < 20)." Fires 1.1 times per fight. The opponent rarely gasses because PRESSURE is the one burning stamina on power attacks (hooks 5, uppercuts 6, roundhouses 8, combos 10). AGG 80 selects expensive attacks, Pressure gases itself, action rate halves, and Pressure loses the damage race.

The raw data proves it: Pressure throws only 49-68 strikes per fight vs Counter's 103-123 and even Turtle's 79-97. Pressure is crippled by its own aggression.

### V7 Design

**Relentless (AGG 80) — complete redesign. Two components:**

1. **Passive — Stamina Recovery:** Recover 2 stamina per landed hit (any hit that deals damage, including hits reduced by blocking). This creates positive feedback: Pressure lands hits → recovers stamina → sustains power attack tempo.

2. **Active — Finisher:** When opponent's stamina drops below 40, gain +2 to all attack rolls. Threshold raised from 20 → 40 so it actually fires.

### Why this fixes the triangle

**Pressure vs Turtle (target: Pressure 65%):**
- Pressure attacks, Turtle blocks with Iron Guard. Hit still "lands" (deals residual damage). Relentless recovers 2 stamina.
- Net stamina per blocked power attack: spend 5-8 (attack cost), recover 2 (Relentless) = net -3 to -6. Compare to V6 where it was -5 to -8 with no recovery. Pressure sustains ~40% longer.
- Pressure's Devastating Blow burst damage occasionally spikes past Iron Guard's ceiling. Over 3 rounds, Pressure accumulates damage through unblocked hits and burst spikes.
- Relentless active: Turtle's stamina is high (STA 80, pool 95), so the <40 trigger is late. But it still fires if Pressure pushes the fight long enough.
- Net: Pressure wins through sustained damage + burst spikes. Estimated 60-68%.

**Pressure vs Counter (target: Counter 65%):**
- Pressure attacks, Counter dodges. Misses don't recover stamina. Counter Puncher fires. Pressure takes damage AND gets no stamina back.
- The Relentless passive helps less here — Counter's high dodge rate means fewer hits land, fewer stamina recoveries.
- Net: Relentless passive partially mitigates self-gassing but Counter's tempo + counter punches still win. Estimated Counter 62-68%.

### What a bettor sees

"Pressure recovers stamina per hit. Against fighters who TAKE hits (low dodge rate), Pressure sustains forever. Against fighters who dodge everything, Pressure runs dry. Check the opponent's FIQ and reaction chance."

---

## Fix 3: Iron Guard + Grinding Guard (DEF 80)

### Problem

V6 Iron Guard doubled block reduction (`DEF_mod + 2d6` instead of `DEF_mod + 1d6`). Kept Turtle alive but gave it no path to victory. Turtle vs Pressure was 48.4% (coin flip). Turtle vs Counter was 10.1% (slaughter). Turtle has zero offensive tools with STR 50 / SPD 50 / AGG 50.

### V7 Design

**Iron Guard (DEF 80) — add Grinding Guard:**

- Block reduction doubled: `DEF_modifier + 2d6` (unchanged from V6)
- **NEW: Grinding Guard** — Each Iron Guard block drains 2 attacker stamina. The attacker loses 2 stamina as an additional cost of their attack being blocked.

### Why this fixes the triangle

**Turtle vs Counter (target: Turtle 65%):**
- Counter attacks Turtle → Turtle blocks with Iron Guard → Counter loses 2 stamina from Grinding Guard.
- Counter dodges Turtle's attacks → Counter Puncher fires → Turtle gets reaction chance to block → If blocked, Iron Guard absorbs damage AND Grinding Guard drains Counter 2 stamina.
- Counter is hemorrhaging stamina from THREE sources: dodge costs (8), Counter Puncher costs (3, Fix 1), and Grinding Guard drain (2 per blocked attack).
- Counter with STA 50 (pool 50) gasses FAST against Turtle. Counter needs to win early or not at all.
- Turtle outlasts Counter. Wins Decision. Estimated Turtle 62-68%.

**Turtle vs Pressure (target: Pressure 65%):**
- Pressure attacks Turtle, Turtle blocks → Grinding Guard drains Pressure 2 stamina per block.
- But Pressure has Relentless recovery (Fix 2): +2 stamina per landed hit. Net on blocked attacks: -2 (Grinding Guard) +2 (Relentless) = 0 net stamina change. Pressure is roughly stamina-neutral on blocked hits.
- On unblocked hits (AC miss by Turtle's reaction, or Turtle fails to react): Pressure deals full damage AND recovers 2 stamina. Net positive.
- Devastating Blow burst damage accumulates over time, spiking past Iron Guard's ceiling.
- Net: Pressure wins through sustained damage. Grinding Guard slows Pressure but Relentless compensates. Estimated Pressure 60-68%.

### What a bettor sees

"Turtle drains stamina from attackers who hit its blocks. High-AGG fighters who throw expensive attacks and get blocked a lot are in trouble. But Pressure fighters with Relentless can sustain through it. Counter fighters can't."

This is where the triangle becomes VISIBLE to bettors. The Iron Guard + Grinding Guard interaction with Counter Puncher (absorbed + drains stamina) vs Relentless (recovers stamina) is the mechanical story of the triangle.

---

## Fix 4: Inexhaustible (STA 80) — replacing Iron Chin

### Problem

Iron Chin (TKO threshold 75 → 40 HP) saved only 0.4-0.7 times per fight. Nearly non-functional. TKO at 75 HP with 15% per-hit chance is already low-probability. Most fighters that reach 75 HP quickly reach 0 HP — the threshold drop barely matters. STA 80's technique slot is wasted.

### V7 Design

**Iron Chin → Inexhaustible (STA 80):**

- **Gassed threshold reduced from 20 to 10 stamina.** Turtle doesn't enter full Gassed state until stamina hits 10 instead of 20. This means 10 more stamina of effective operation before the ×0.5 action rate penalty kicks in.
- **Partial exhaustion zone (10-20 stamina): action rate penalty halved.** Normal Gassed is ×0.5 action rate, -2 to attack, can't combo. Inexhaustible at 10-20 stamina: ×0.75 action rate, -1 to attack, CAN still combo.
- **TKO threshold: remains at 75 HP.** No change from base. Iron Man (STA 95) still provides TKO immunity.

### Why this matters

Turtle's identity is outlasting the opponent. With Inexhaustible, Turtle has an extra 10 stamina of full effectiveness, and a "partially exhausted" zone where it's still competitive. Against Pressure (who tries to exhaust Turtle through sustained damage), Inexhaustible means Turtle can block and react for longer before degrading.

Against Counter (who drains Turtle through dodge/counter punch cycles — wait, Counter attacks Turtle, and Turtle blocks): Counter's attacks hit Turtle's blocks, Grinding Guard drains Counter. Counter's stamina runs out. Inexhaustible means Turtle can sustain blocks for longer even if its own stamina gets low.

**Interaction with Relentless active (opponent stamina < 40):** Pressure's Relentless finisher triggers when Turtle drops below 40 stamina. But with Inexhaustible, Turtle is still fighting effectively at 10-20 stamina (×0.75 instead of ×0.5). The Relentless window (+2 attack while Turtle is below 40) is less devastating because Turtle doesn't collapse the way other fighters do.

### What a bettor sees

"This Turtle has Inexhaustible — they keep fighting even when their gas tank reads empty. Late-round finishers are less reliable against them. Expect this fight to go the distance."

---

## Fix 5: Gear Redesign — Direct Combat Bonuses

### Problem

Three failures from V6 Monte Carlo:
1. **Standard gear (+2 raw stat) is invisible.** `round((52-50)/15) = 0`. Doesn't cross any modifier breakpoint. Mechanically zero impact.
2. **Full Legendary is P2W.** Creates +1 modifier in 5/6 stats. Win rate: 91-95% at same training.
3. **DEF stacks in 3 slots** (+22 total). Design doc claimed max +16. Slot math is wrong.

**Root cause:** The /15 modifier compression makes gear binary — either you cross a breakpoint (huge jump) or you don't (zero impact). There is no middle ground. Small gear bonuses are invisible. Large ones are dominant. Raw stat bonuses through the modifier formula cannot be balanced.

### V7 Design

**Gear provides direct combat bonuses instead of raw stat bonuses.** Each slot has a specific combat effect that bypasses the modifier formula entirely. Effects scale by rarity. This eliminates the breakpoint problem — every piece of gear has a predictable, linear impact.

**6 gear slots** (added Reflex Core to fix the FIQ/SPD representation gap):

| Slot | Combat Effect | Standard | Enhanced | Superior | Legendary |
|------|-------------|----------|----------|----------|-----------|
| **Core Module** | Bonus damage on all hits | +1 | +1 | +2 | +3 |
| **Neural Link** | Bonus reaction chance (additive) | +2% | +3% | +4% | +6% |
| **Arm Augments** | Bonus to attack rolls | +0 | +0 | +1 | +1 |
| **Leg Rigs** | Bonus action rate (additive) | +1% | +2% | +2% | +3% |
| **Exo-Frame** | Bonus AC | +0 | +0 | +1 | +1 |
| **Reflex Core** | Bonus stamina pool | +4 | +6 | +8 | +12 |

**Full Standard loadout:** +1 damage, +2% reaction, +0 attack, +1% action rate, +0 AC, +4 stamina.
Expected win rate shift: ~2-3% at same stats. Barely noticeable. Standard gear is common and unremarkable — as it should be.

**Full Legendary loadout:** +3 damage, +6% reaction, +1 attack, +3% action rate, +1 AC, +12 stamina.
Expected win rate shift: ~8-12% at same stats. Significant but not dominant. A well-trained fighter without gear still beats a poorly-trained fighter with full Legendary (the 80 vs 50+Legendary sim passed in V6 at 93.1% — this should remain true).

**Why direct bonuses work better:**
- **Linear scaling.** Every rarity upgrade is a visible improvement. No breakpoint dead zones.
- **Predictable impact.** +1 damage means +1 damage. No "sometimes crosses a breakpoint, sometimes doesn't."
- **Slot identity.** Each piece does something different. "I need more damage" → Core Module. "I need to dodge more" → Neural Link. Clear gear chase paths.
- **No multiplicative stacking.** +3 damage and +1 attack don't compound through the same formula. They're independent bonuses that add up linearly.

**Special traits unchanged from V6:** Superior/Legendary gear still has special traits (Thick Plating, Stabilizers, Endurance Rig, Expanded Crit, Adrenaline Surge, Chain Lightning). These interact with tier abilities as designed. The change is ONLY to base stat bonuses → direct combat bonuses.

### What a bettor sees

"This fighter has Legendary Core Module (+3 damage per hit) and Legendary Arm Augments (+1 attack roll). That's a damage-focused loadout — they'll hit harder and more accurately but they're not tankier. The opponent has Legendary Exo-Frame (+1 AC) and Legendary Neural Link (+6% reaction). That's a defensive loadout."

Gear creates readable combat differences. Bettors who study loadouts can identify offensive vs defensive gear configurations and predict how they interact with fighting styles.

---

## Fix 6: Condition Redesign — Action Rate + Stamina

### Problem

V6 condition (±15 stamina pool, ±0.15 regen/tick) had near-zero impact. Mirror Fresh vs Tired: 54% (barely above coin flip). Pressure mirror: exactly 50%. 60v50 with favorite Tired: 71.1% (condition irrelevant vs stat advantage).

**Root cause from the raw data:** Fights end before stamina matters. Pressure mirrors end in 1.82 rounds. The stamina difference never becomes relevant because someone is KO'd first. Increasing stamina magnitude (Kakashi's suggestion) won't help — fights will still end in R2.

### V7 Design

**Condition affects action rate AND stamina.** The action rate component ensures condition matters in EVERY fight, not just R3 grinds.

| Condition | Stamina Pool | Stamina Regen | Action Rate |
|-----------|-------------|---------------|-------------|
| **Fresh** | +10 | +0.10/tick | +4% (additive) |
| **Normal** | — | — | — |
| **Tired** | -10 | -0.10/tick | -4% (additive) |

**Why action rate:** Action rate affects damage output, defensive pressure, technique trigger frequency, and fight tempo. An 8% swing in action rate (Fresh vs Tired) creates ~6-10 extra actions over a 3-round fight. At average damage per action of ~3-4, that's ~20-30 extra damage = 3-5% of total HP. This is within the ±3-5% target for condition.

**Asymmetric archetype impact:**
- **Pressure:** Action rate directly controls how many power attacks Pressure can throw. Tired Pressure throws fewer attacks, triggers fewer Devastating Blows, recovers less stamina from Relentless passive. Condition matters MOST for Pressure.
- **Counter:** Action rate boost is additive on top of SPD 80's already-high base. +4% on 0.053 = 7.5% relative increase. Moderate impact. Tired Counter also triggers fewer Counter Punches (fewer dodges per fight).
- **Turtle:** Action rate matters LEAST — Turtle wins by defense and outlasting, not by tempo. A Tired Turtle is marginally worse but its game plan is intact.

This asymmetry creates disagreement: "Fighter A is Tired but they're a Turtle — does it even matter?" Some bettors say yes (slightly fewer blocks, lower stamina ceiling), others say no (Turtle's game plan doesn't depend on tempo). Disagreement is volume.

### The Agent's Scheduling Dilemma (unchanged)

More Agent League fights = more public data = better form guide. But too many fights = Tired going into a Human League bout. Now that condition actually affects outcomes (especially for Pressure fighters), scheduling becomes a real strategic decision, not a cosmetic one.

### What a bettor sees

"This Pressure fighter is Tired. They'll throw 4% fewer attacks, trigger Devastating Blow less often, and recover less stamina from Relentless. That matters — maybe 3-4% win rate drop. But their opponent is a Turtle, so the tempo reduction might not matter as much..."

---

## Fix 7: Signature Tuning

### Problem

Two of three signature categories have issues:

1. **Devastator (STR 95):** Triggers in 99.8% of fights. Not a "will it happen?" moment — it ALWAYS happens. Removes the conditional uncertainty that makes elite-tier markets interesting. The trigger (any critical hit) is too easy to satisfy across ~60 actions with 5% crit rate.

2. **Iron Man (STA 95):** 51.7% win rate. 100% Decision. 100% R3. 0 KOs. 0 TKOs prevented. Two tanks who can't hurt each other. Boring spectacle, coin-flip outcome, zero information for bettors.

3. **Mind Reader (FIQ 95):** 70.6% win rate. Reasonable AFTER Counter Puncher nerfs — with stamina costs on counter punches, Mind Reader's 60% reaction rate becomes self-limiting (too many dodges/counters drains stamina faster). Leaving unchanged pending Monte Carlo validation.

### Fix 7a: Devastator (STR 95) — Conditional Trigger

**Devastator: On any critical hit, roll a separate d6. On a 6, the crit becomes a Devastator (triple damage dice instead of double). Once per fight.**

At 5% base crit rate and ~60 actions per fight: ~3 crits per fight average.
- P(at least one d6 roll of 6 across 3 crits) = 1 - (5/6)^3 = **42%**

At 10% crit rate (FIQ 80 crit range expansion): ~6 crits per fight.
- P(Devastator fires) = 1 - (5/6)^6 = **66%**

**Design implications:**
- A pure STR 95 fighter (no FIQ investment): Devastator fires in ~42% of fights. Genuine uncertainty.
- A STR 95 + FIQ 80 hybrid (massive training investment, ~320 days): Devastator fires in ~66% of fights. More reliable but still not guaranteed. The extra FIQ investment has a concrete payoff that bettors can evaluate.
- Creates a live-trading moment: Every crit makes bettors watch for the Devastator roll. "That was a crit — did Devastator fire? No? Still waiting..." Three crits, three chances. Tension builds through the fight.

**The d6 is PUBLIC.** The broadcast shows the Devastator roll. Bettors see it in real time and can adjust positions mid-fight.

### Fix 7b: Iron Man (STA 95) — Endurance Engine

**Iron Man: Two components:**

1. **TKO immune** (unchanged from V6).
2. **NEW — Reduced exhaustion decay.** Round 2 action rate multiplier: ×0.94 (instead of ×0.88). Round 3: ×0.88 (instead of ×0.76).

Normal exhaustion decay: R1 ×1.00, R2 ×0.88, R3 ×0.76.
Iron Man decay: R1 ×1.00, R2 ×0.94, R3 ×0.88.

**What this creates:**
- In R3, an Iron Man fighter acts at 88% speed while an opponent acts at 76%. That's a **16% relative action rate advantage** emerging in the late fight. Over ~150 ticks of R3, this translates to 8-12 extra actions.
- The Iron Man fighter effectively "speeds up" relative to the opponent as the fight progresses. R1 is even, R2 is a slight edge, R3 is a clear advantage.
- Win rate vs non-Iron Man at same stats: estimated 57-62%. Meaningful but not dominant.

**The betting signal:** "If this fight goes to R3, the Iron Man fighter takes over. But does it reach R3? Against Pressure, probably not. Against Counter, maybe." This creates a conditional prediction — bettors evaluate the PROBABILITY of a long fight AND the payoff if it happens. Two-variable bets are more interesting than one-variable bets.

**Spectacle improvement:** Instead of two tanks in a stalemate (V6), Iron Man creates a comeback arc. The Iron Man fighter might lose R1-R2 slightly, then take over in R3 with superior action rate. That's a visible momentum shift that makes the fight watchable.

---

## How The Triangle Works (All Fixes Combined)

### Pressure (STR 80, AGG 80, STA 65) vs Turtle (DEF 80, STA 80, FIQ 65)

**Target: Pressure 60-70%**

Pressure attacks aggressively (AGG 80 selects power attacks). When attacks hit:
- If Turtle blocks: Iron Guard reduces damage. Grinding Guard drains Pressure 2 stamina. But Relentless recovers 2 stamina. Net: roughly neutral.
- If Turtle doesn't block: Full damage. Relentless recovers 2 stamina. Net: stamina-positive.

Devastating Blow's exploding dice occasionally spike past Iron Guard's ceiling (max reduction ~16). These bursts accumulate. Turtle has Inexhaustible (Gassed at 10 instead of 20, partial penalty at 10-20), keeping it defensive longer. But over 3 rounds, Pressure's sustained damage + burst spikes win.

**Key dynamic:** Pressure wins through damage output that exceeds Turtle's mitigation ceiling. Relentless stamina recovery prevents Pressure from self-destructing. Grinding Guard slows Pressure but doesn't stop it because Relentless compensates.

### Turtle (DEF 80, STA 80, FIQ 65) vs Counter (FIQ 80, SPD 80, DEF 65)

**Target: Turtle 60-70%**

Counter attacks frequently (SPD 80 tempo). Turtle blocks with Iron Guard → damage reduced + Grinding Guard drains Counter 2 stamina per block. Counter dodges Turtle's attacks → Counter Puncher fires (costs 3 stamina) → Turtle can block Counter Puncher (30% reaction at FIQ 65 + Ring Sense) → If blocked, Iron Guard absorbs + Grinding Guard drains 2 more stamina.

Counter's stamina economy is catastrophic against Turtle:
- Dodge: -8 stamina (or -5 with Stabilizers)
- Counter Puncher: -3 stamina
- Grinding Guard on Counter's attacks: -2 per blocked attack
- Grinding Guard on Counter Puncher blocks: -2 when Turtle blocks the counter punch

Counter with STA 50 (pool 50) gasses in roughly 6-10 exchanges. Once Gassed: action rate halves, -2 to attacks, can't combo. Turtle is still standing with Iron Guard + Inexhaustible.

**Key dynamic:** Turtle's Grinding Guard is a stamina tax on every interaction. Counter Puncher is neutralized by Iron Guard (absorbed) and costs Counter even more stamina. Turtle wins by exhausting Counter's resources, then winning Decision or low-HP TKO.

### Counter (FIQ 80, SPD 80, DEF 65) vs Pressure (STR 80, AGG 80, STA 65)

**Target: Counter 60-70%**

Pressure throws power attacks. Counter dodges (~30-35% reaction at FIQ 80). When Counter dodges:
- Counter Puncher fires: auto-hit, 1d4 + SPD_mod(+2), costs 3 stamina.
- Pressure has FIQ 50 (~15% reaction), DEF 50 (AC 10). Most counter punches land unblocked.

When Pressure's attacks land:
- Relentless recovers 2 stamina. But Counter dodges 30-35% of them — those misses give no recovery.
- Net: Pressure's stamina recovery is reduced by Counter's dodge rate.

First Strike gives Counter the first action each round — can open with a hit or set up defense. SPD 80 action rate (0.053 vs 0.0425) means Counter acts 25% more often.

Counter's stamina economy is tighter than V6 (Counter Puncher now costs 3 per trigger), so Counter needs to finish before gassing. Against Pressure (who has STA 65, pool 80 with Deep Lungs), the race is: can Counter accumulate enough damage through tempo + counter punches before running out of stamina?

**Key dynamic:** Counter wins through tempo dominance + unpunished Counter Puncher damage against Pressure's weak defense. Counter Puncher's stamina cost creates a clock — Counter must be ahead when its stamina runs low. Relentless recovery partially offsets Pressure's self-gassing but Counter's dodge rate reduces recovery frequency.

### Why Specialists Beat Hybrids

Hybrid 65 (all stats 65) has 6 tier 1 traits: +1 damage, +5% action rate, +1 AC, +15 stamina, +5% reaction, +10% power attack selection. No tier 2 techniques.

Against Specialist Pressure: Hybrid blocks some attacks, but no Grinding Guard (no DEF 80). Pressure's Devastating Blow bursts through Hybrid's base block formula. Relentless recovery keeps Pressure sustained. Hybrid has no technique to punish Pressure's aggression. **Estimated: Pressure 60-65%.**

Against Specialist Counter: Counter Puncher fires against Hybrid's dodges. Hybrid has FIQ 65 (+Ring Sense = ~25% reaction), so some counter punches land. But Counter's tempo advantage (SPD 80 vs SPD 65) is smaller than vs Pressure. Counter Puncher costs stamina but Counter's efficiency still wins. **Estimated: Counter 60-65%.**

Against Specialist Turtle: Hybrid has STR 65 (Heavy Hands: +1 power attack damage) and +5% action rate. But Iron Guard + Grinding Guard drain Hybrid's stamina on blocked attacks. Hybrid lacks Relentless to recover stamina. Hybrid lacks Devastating Blow to burst past Iron Guard. Turtle outlasts. **Estimated: Turtle 58-63%.**

All three specialists are favored against Hybrid. Tier 2 techniques create qualitative advantages that 6 mild tier 1 traits can't match.

---

## Gear Slot Flavor (updated)

| Slot | Flavor | Combat Effect |
|------|--------|--------------|
| **Core Module** | The power plant. Reactor core, crystal heart, void engine. | Bonus damage |
| **Neural Link** | The brain. Processing speed, pattern recognition. Glows on crits. | Bonus reaction chance |
| **Arm Augments** | What you hit with. Piston fists, blade arms, plasma knuckles. | Bonus attack accuracy |
| **Leg Rigs** | Movement system. Hydraulic legs, hover jets, magnetic boots. | Bonus action rate |
| **Exo-Frame** | The shell. Visible as outline/aura around the fighter. | Bonus AC |
| **Reflex Core** | Neural-muscular integration. Twitchfire servos, synaptic accelerator. | Bonus stamina pool |

2 cosmetic slots unchanged: Walkout Track (audio) and War Paint (visual).

---

## Changes to Existing Gear Traits

Special traits are updated to reference the new gear system:

**Superior Traits:**
- **Thick Plating** — Block damage reduction +2. *Unchanged.*
- **Stabilizers** — Dodge stamina cost reduced from 8 to 5. *Unchanged.*
- **Endurance Rig** — Between-round stamina recovery: regain 15 stamina at round break. *Unchanged.*

**Legendary Traits:**
- **Expanded Crit** — Crit range +1. *Unchanged.*
- **Adrenaline Surge** — Desperation (HP < 40%) refills stamina to 75%. *Unchanged.*
- **Chain Lightning** — Devastating Blow rerolls can re-explode, max 3 chains. *Unchanged.*

No trait changes needed — they interact with tier abilities, not with base stat bonuses.

---

## Summary of ALL Technique Changes (V6 → V7)

| Stat | V6 Technique | V7 Technique | What Changed |
|------|-------------|-------------|-------------|
| STR 80 | **Devastating Blow** — Dice explode on max roll | **Devastating Blow** — *Unchanged* | — |
| SPD 80 | **First Strike** — Guaranteed action tick 0 | **First Strike** — *Unchanged* | — |
| DEF 80 | **Iron Guard** — Double block reduction | **Iron Guard + Grinding Guard** — Double block + drain 2 attacker stamina per block | Added stamina drain |
| STA 80 | **Iron Chin** — TKO threshold 75→40 | **Inexhaustible** — Gassed at 10 instead of 20, partial penalty at 10-20 | Complete redesign |
| FIQ 80 | **Counter Puncher** — Free auto-hit on dodge | **Counter Puncher** — Costs 3 stamina, subject to block reaction | Added cost + counterplay |
| AGG 80 | **Relentless** — +2 attack when opp Gassed (<20) | **Relentless** — Recover 2 stam/hit + finisher at opp <40 stam | Complete redesign |

| Stat | V6 Signature | V7 Signature | What Changed |
|------|-------------|-------------|-------------|
| STR 95 | **Devastator** — Crit → triple damage | **Devastator** — Crit → d6 roll, 6 = triple damage | Added trigger roll (42% rate) |
| SPD 95 | **Ghost Step** — Zero-cost dodge, 1/round | **Ghost Step** — *Unchanged* | — |
| DEF 95 | **Fortress** — Flat -2 all incoming damage | **Fortress** — *Unchanged* | — |
| STA 95 | **Iron Man** — TKO immune | **Iron Man** — TKO immune + halved exhaustion decay | Added R2/R3 action rate advantage |
| FIQ 95 | **Mind Reader** — 60% reaction, optimal selection | **Mind Reader** — *Unchanged, pending validation* | Validate after Counter Puncher nerf |
| AGG 95 | **Berserker** — HP <50% → +1d8 next 8 actions | **Berserker** — *Unchanged* | — |

---

## Monte Carlo Validation Plan

Kakashi should re-run all 6 sims with V7 changes. Priority order unchanged from V6:

**SIM 1: ARCHETYPE TRIANGLE (CRITICAL)**
Same builds as V6. Apply all tier 2 technique changes (Fixes 1-4).
- Targets: each edge 60-70%, centered at 65%.
- If Counter vs Pressure > 70%: increase Counter Puncher stamina cost to 4.
- If Pressure vs Turtle < 60%: increase Relentless recovery to 3 per hit.
- If Turtle vs Counter < 60%: increase Grinding Guard drain to 3 per block.

**SIM 2: HYBRID VS SPECIALIST (CRITICAL)**
Same builds as V6. Apply tier 2 changes.
- Target: each specialist beats Hybrid 58-68%.
- If any specialist < 58%: the technique needs to be stronger.

**SIM 3: GEAR VALIDATION (HIGH)**
New gear system (direct combat bonuses). Test:
- Full Standard vs no gear at same stats. Target: 52-55%.
- Full Legendary vs no gear at same stats. Target: 58-65%.
- Trained 80 (no gear) vs 50 (full Legendary). Target: Trained 80 wins 70%+.
- Trained 80 + full Legendary vs Trained 80 (no gear). Target: 58-65%.

**SIM 4: CONDITION VALIDATION (HIGH)**
New condition system (action rate + stamina). Test same matchups as V6.
- Mirror Fresh vs Tired. Target: 53-57%.
- Pressure Fresh vs Tired. Target: condition shifts >3% (Pressure is most affected).
- 60v50, favorite Tired. Target: favorite wins 60-68% (condition dents the edge but doesn't erase it).
- Turtle Tired vs Counter. Target: measurable drop (>2%).

**SIM 5: CROSS-TIER (MEDIUM)** — Re-run with V7 techniques. Expect similar results to V6 (these were reasonable).

**SIM 6: SIGNATURES (MEDIUM)** — Re-run Devastator with d6 trigger. Validate ~42% trigger rate. Re-run Iron Man with halved exhaustion decay. Re-run Mind Reader to validate stamina-limited Counter Puncher doesn't break it.

**Tuning knobs (if sims miss targets):**

| Fix | Knob | Turn up | Turn down |
|-----|------|---------|-----------|
| Counter Puncher | Stamina cost | 3 → 4 → 5 | 3 → 2 |
| Grinding Guard | Drain per block | 2 → 3 | 2 → 1 |
| Relentless passive | Recovery per hit | 2 → 3 | 2 → 1 |
| Relentless active | Threshold | <40 → <50 | <40 → <30 |
| Inexhaustible | Gassed threshold | 10 → 5 | 10 → 15 |
| Devastator | Trigger die | d6 (17%) → d4 (25%) | d6 → d8 (12.5%) |
| Iron Man exhaustion | R3 multiplier | ×0.88 → ×0.94 | ×0.88 → ×0.82 |
| Condition action rate | Magnitude | ±4% → ±6% | ±4% → ±2% |
| Gear damage bonus | Legendary | +3 → +4 | +3 → +2 |

Each knob can be turned independently without affecting other systems. This is the advantage of per-layer design — tuning one layer doesn't cascade into others.

---

## Open Items (from V6, updated)

| Item | V6 Status | V7 Status | Notes |
|------|-----------|-----------|-------|
| Monte Carlo: V7 tier system | — | **Pending** | 6 sims with V7 technique changes |
| Monte Carlo: V7 gear (direct bonuses) | — | **Pending** | Verify ±5-10% target |
| Monte Carlo: V7 condition (action rate) | — | **Pending** | Verify ±3-5% target |
| Gear slot rebalance | V6: DEF 3-slot bias | **Fixed** | 6 slots, direct combat bonuses, no stat overlap |
| Iron Chin replacement | V6: 0.4 saves/fight | **Fixed** | Inexhaustible: delayed Gassed + partial penalty zone |
| Relentless redesign | V6: fires 1.1x/fight | **Fixed** | Sustain (2 stam/hit) + finisher (<40) |
| Counter Puncher nerf | V6: 81-90% Counter dominance | **Fixed** | Costs 3 stam + blockable |
| Iron Guard offense | V6: no Turtle win condition | **Fixed** | Grinding Guard: 2 stam drain per block |
| Devastator trigger rate | V6: 99.8% | **Fixed** | d6 trigger roll → ~42% |
| Iron Man usefulness | V6: 51.7% coin flip, boring | **Fixed** | Halved exhaustion decay → R3 advantage |
| Mind Reader validation | V6: 70.6% (strong) | **Pending** | Validate with stamina-costed Counter Puncher |
| Implementation plan update | Pending | **Blocked** | Blocked on V7 Monte Carlo validation |
| Starting credits + daily rewards | Pending | Pending | Economy numbers still needed |
| Fight-tier labeling | Pending | Pending | Rookie Card / Main Card / Championship |
