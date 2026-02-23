# V13 Combat System — Betting-First Design

**Author:** Itachi (Head of Product)
**Date:** 2026-02-23
**Status:** DESIGN — Monte Carlo Run 9 complete, design decisions applied, awaiting re-sim
**Builds on:** Kakashi's repricing-first proposal + V6-V12 iteration history + betting experience framework

---

## Design Principle

Every mechanic exists to create a betting signal. The combat system serves the exchange, not the other way around. Work backward from what the bettor needs to see.

---

## Locked Design Principles

These are non-negotiable. Every V13 decision must satisfy all of them.

1. **Every mechanic must make the human betting experience more fun.** The prediction market is the product.
2. **Replace reliable compounding with exciting variance.** Triggered passives over flat bonuses.
3. **Ownership edge is agency, not information asymmetry.** All fighter data is public. The owner's advantage is strategic control.
4. **Gear balance = situational power, not equal power.** Effects at the same tier average similar win rate across all matchups (±1%), but vary significantly per matchup (+1% to +5%). Best effect depends on context.

---

## The Three-Act Fight

Every fight follows this structure. The combat system exists to produce it.

| Phase | Duration | What Happens | Price Movement |
|-------|----------|-------------|----------------|
| **Pre-fight** | 5-15s (tier-dependent) | Matchup revealed. Bettors evaluate. | Opening price set from matchup data |
| **R1 (1.0x)** | ~60s | Information gathering. Abilities at base. | ±5-10%. Confirms or denies pre-fight analysis. |
| **Repricing 1** | 10s | Round scorecard, stamina bars, ability activations revealed. | Informed/Expert bettors adjust positions. |
| **R2 (1.3x)** | ~60s | Story takes shape. Abilities elevated. Stamina diverges. | ±10-15%. Matchup dynamics become clear. |
| **Repricing 2** | 10s | Cumulative scorecard. Abilities about to hit 1.8x. | Critical adjustment window. R3 projections drive trades. |
| **R3 (1.8x)** | ~60s | Resolution. Abilities at full power. KO/TKO most likely. | Converges toward settlement. |
| **Settlement** | instant | Winner = 100, Loser = 0. | Final. |

**Total fight time:** ~3.5 minutes including repricing windows.

---

## Stats

Three stats. Clean 1:1 mapping to archetypes.

| Stat | What It Does | Primary For |
|------|-------------|-------------|
| **POW (Power)** | Damage per hit. Modifier added to damage rolls. Power attack effectiveness. | Pressure |
| **END (Endurance)** | Max stamina. Damage mitigation. Between-round recovery rate. | Turtle |
| **TEC (Technique)** | Accuracy. Crit range expansion. Ability proc effectiveness. | Counter |

**Modifier formula:** `round((effective_stat - 50) / 15)`, range ±3.

**Diminishing returns above stat 80:** For combat calculations only (damage, mitigation, stamina, accuracy), each stat point above 80 counts as 0.5 points. Stat 95 → effective 87.5. This compresses the raw stat advantage of signature-tier fighters while keeping their tier 3 ability as the exciting differentiator. Ability tier thresholds use NATURAL stat values (not effective).

| Stat Value | Effective Value | Modifier | Tier Unlocked |
|-----------|----------------|----------|---------------|
| 50 | 50 | +0 | Base |
| 65 | 65 | +1 | Tier 1 (style trait) |
| 80 | 80 | +2 | Tier 2 (fighting technique) |
| 90 | 85 | +2 | Tier 3 (signature move) |
| 95 | 87.5 | +3 | Tier 3 (signature move) |

**Target:** Stat 95 vs stat 80 (same archetype) = 60-65%. If diminishing returns alone don't achieve this, next step is adding costs to tier 3 abilities (telegraphing, resource drain).

**Archetype stat profiles:**

| Archetype | POW | END | TEC | Identity |
|-----------|-----|-----|-----|----------|
| Pressure | 80 | 57 | 58 | High damage, burns stamina fast, needs to win before gassing |
| Turtle | 57 | 80 | 58 | Low damage, enormous stamina budget, wins by attrition |
| Counter | 57 | 58 | 80 | Low base damage, high accuracy + crits, reactive offense via CP |

---

## Tempo

Replaces SPD. Dynamic, not static.

```
Current Tempo = base_tempo × (current_stamina / max_stamina)
```

- **Base Tempo** = 100 for all fighters. Everyone starts equal.
- **Max stamina** scales with END. Higher END = larger budget before Tempo drops.
- **Power attacks cost more stamina** than jabs/crosses. Aggressive fighters burn faster.
- **Tempo determines action rate** — ticks between offensive actions.
- **Reactions (dodge, block) are NOT limited by Tempo.** They use the reaction chance formula based on TEC/END. This is critical: Counter's dodge rate doesn't degrade with stamina.

**Why this isn't END-as-new-SPD:** SPD was static — Counter had 38% more actions from tick 1 forever. END-driven Tempo is dynamic — starts equal, diverges based on stamina spend. The divergence is visible (stamina bars), predictable (burn rate calculable from R1 data), and creates a round-over-round arc instead of a tick-1 advantage.

**Tempo warm-up (floor per round):**

| Round | Tempo Floor | Max Divergence | Purpose |
|-------|-----------|---------------|---------|
| R1 | 90% | 10% | Feeling-out round. Bettors gather information. |
| R2 | 75% | 25% | Story takes shape. Tempo begins to separate. |
| R3 | None | Uncapped | Resolution. Full chaos. |

Implementation: clamp Tempo to the floor after each tick's stamina calculation. Simple, no new mechanics. Mirrors real boxing where R1 is cautious and pace picks up in later rounds.

**Expected Tempo by round (P vs T matchup, with warm-up):**

| Round | Pressure Tempo | Turtle Tempo | Gap |
|-------|---------------|-------------|-----|
| R1 start | ~100% | ~100% | ~0% |
| R1 end | ~90% (clamped) | ~92% | ~2% |
| R2 end | ~75% (clamped) | ~82% | ~7% |
| R3 end | ~48% | ~72% | ~24% |

These are targets for Monte Carlo validation. The gap should be minimal in R1, emerging in R2, and significant by R3.

---

## The Triangle

Triangle comes from **ability interactions**, not stat advantages. Each technique is strong against one archetype and weak against the other.

### Techniques (Tier 2, stat 80)

**Relentless (Pressure, POW 80)**
- A percentage of Pressure's damage bypasses END damage mitigation.
- R1: 20% bypass. R2: 26% (×1.3). R3: 36% (×1.8).
- **+1 flat damage on ALL hits.** Against Turtle, bypass is the star. Against Hybrid/Counter (low END), the flat bonus is the value. Ensures Pressure beats Hybrid consistently.
- **Beats Turtle:** Iron Guard blocks, but damage leaks through. Accumulated bypass damage kills Turtle.
- **Loses to Counter:** Counter dodges, not blocks. Bypass is irrelevant against someone who isn't there.

**Iron Guard (Turtle, END 80)**
- Doubled block damage reduction.
- **Grinding Guard:** Blocks drain attacker stamina (2 per block at base, scaling with ability multiplier).
- **CP catch:** 50% chance to nullify a Counter Punch proc that triggers against Turtle. R1: 50%. R2: 57% (×1.3, capped). R3: 65% (×1.8, capped at 65%).
- **Beats Counter:** CP procs get caught. Counter starved of offense. Grinding Guard drains Counter's stamina.
- **Loses to Pressure:** Relentless bypasses block reduction. Raw damage leaks through.
- **Block cap:** Maximum 5 blocks per round. After cap, Turtle must dodge or take the hit. Prevents infinite stalling, creates "shield breaks" moment bettors can watch for.

**Counter Punch (Counter, TEC 80)**
- Proc on successful dodge. Auto-hit (bypasses accuracy). TEC-scaled damage.
- R1: 20% proc rate, base damage. R2: 26% proc, ×1.3 damage. R3: 36% proc, ×1.8 damage.
- Miss drain: 4 stamina per failed proc (dodge happened but CP didn't fire).
- **Base CP catch rate: 15-20% for ALL fighters.** Every fighter has a baseline chance to block a counter-punch. Iron Guard overrides this to 55-65%. Prevents Counter from dominating non-specialist matchups (73% vs Hybrid without this).
- **Beats Pressure:** Pressure attacks frequently = many dodge opportunities = many CP procs. Pressure's aggression fuels Counter's offense. (Pressure has base 15-20% catch, but throws enough attacks that CP still fires plenty.)
- **Loses to Turtle:** Turtle attacks less (conservative Iron Guard strategy = fewer incoming attacks = fewer dodge opportunities). Iron Guard catches 55-65% of CP procs that do trigger.

### Why the triangle is structural

Each technique rewards a different action type:
- Turtle WANTS to block → Iron Guard rewards blocking
- Pressure WANTS to attack → Relentless rewards attacking
- Counter WANTS to dodge → CP rewards dodging

The action patterns create asymmetric opportunities:
- Against Pressure (lots of attacks): Counter thrives (many dodge opportunities), Turtle endures (blocks but leaks damage)
- Against Turtle (few attacks, lots of blocks): Counter starves (few dodge opportunities), Pressure leaks damage through
- Against Counter (lots of dodges): Pressure gets punished (attacks fuel CP), Turtle grinds (conservative approach denies CP fuel)

### Matchup narratives

**Pressure vs Turtle (Pressure favored, 62-68%):**
Race between Turtle's HP and Pressure's stamina. Pressure deals bypass damage in R1-R2 while Tempo is high. Turtle's Grinding Guard drains Pressure's stamina. If Pressure dealt enough bypass damage before gassing, they win. If Turtle survives with enough HP, R3's Tempo advantage grinds Pressure down.

**Turtle vs Counter (Turtle favored, 62-68%):**
Attrition. Turtle blocks and grinds. Iron Guard catches CP procs. Grinding Guard drains Counter's stamina. Counter can't generate enough offense from Turtle's conservative attack rate. Turtle wins by decision.

**Counter vs Pressure (Counter favored, 62-68%):**
Punishment. Every Pressure power attack is a CP opportunity. Counter dodges and counter-punches. CP damage ramps with ability multiplier. The harder Pressure swings, the more Counter procs. Counter wins on burst damage.

### Target win rates by round

**P vs T and C vs P (standard escalation):**

| Round | Favored Side Win % | Purpose |
|-------|-------------------|---------|
| R1 (1.0x) | 53-56% | Information gathering. Triangle barely visible. |
| R2 (1.3x) | 58-63% | Story takes shape. Triangle emerging. |
| R3 (1.8x) | 65-72% | Resolution. Triangle decisive. |
| **Overall** | **62-68%** | Target range. |

**T vs C (inverted pattern — accepted):**

| Round | Turtle Win % | Purpose |
|-------|-------------|---------|
| R1 (1.0x) | 60-65% | Turtle dominates early. Iron Guard + Grinding Guard control while CP is at 1.0x. |
| R2 (1.3x) | 55-60% | Counter's CP ramp starts catching up. Story shifts. |
| R3 (1.8x) | 48-53% | CP at 1.8x makes R3 competitive. Counter surges. |
| **Overall** | **62-68%** | Turtle wins on accumulated R1-R2 advantage via weighted decision scoring. |

The inverted pattern creates a comeback narrative for T vs C. Turtle bettors sweat R3, Counter bettors have hope. Repricing 2 becomes "can Counter's R3 ramp overcome the deficit?" — a compelling Expert-level trade. Different matchups having different round dynamics is a feature.

---

## Ability Ramp

| Round | Multiplier | What Changes |
|-------|-----------|-------------|
| R1 | 1.0x | Abilities at base values. Fight is close to 50/50 with slight triangle edge. |
| R2 | 1.3x | Proc rates ×1.3. Damage ×1.3. Bypass % ×1.3. Catch rate ×1.3 (capped). Grinding Guard drain ×1.3. |
| R3 | 1.8x | All of the above at ×1.8. Desperation activates at 30% HP. KO/TKO most likely. |

**Why 1.0/1.3/1.8 instead of 1.0/1.5/2.0:**
- 1.3 in R2 lets the story develop without resolving. At 1.5, R2 is too decisive.
- 1.8 in R3 keeps R1 meaningful for decision scoring (weighted 25% of decision). At 2.0, R1 damage is irrelevant because R3 overwhelms everything.
- Monte Carlo should sim BOTH (1.3/1.8 and 1.5/2.0) and compare round-by-round target splits.

**R1 is not dead time.** R1's value is the DATA it generates:
- Stamina burn rate → predicts R2-R3 Tempo divergence
- Ability activation count → confirms technique effectiveness
- Damage distribution → reveals fighter's action pattern
- HP differential → establishes the baseline that R2-R3 builds on

A bettor who watches R1 carefully has a real edge over one who looks away.

---

## Specialist vs Hybrid

### Tier 1 — Style Traits (stat 65)

Minor nice-to-haves. Not game-defining.

| Trait | Stat | Effect |
|-------|------|--------|
| Heavy Hands | POW 65 | +1 damage on power attacks |
| Thick Skin | END 65 | Reduce first 1 damage from each incoming hit |
| Ring Sense | TEC 65 | +5% reaction chance |

### Tier 2 — Fighting Techniques (stat 80)

Archetype-defining. Missing a Tier 2 technique means missing your combat identity.

Relentless (POW 80), Iron Guard (END 80), Counter Punch (TEC 80) — as defined in the Triangle section above.

### The gap

A Hybrid at 65/65/65 gets three Tier 1 traits: +1 damage, -1 damage taken, +5% reaction. Total value: marginal.

A Specialist at 80/57/58 gets ONE Tier 2 technique that defines the archetype's entire combat loop.

The Tier 2 technique should be worth ~15% win rate alone. A Specialist without gear should beat an identically geared Hybrid 58-65% of the time.

**Monte Carlo target:** Specialist 80 beats Hybrid 65 at 58-65% in every matchup.

### Tier 3 — Signature Moves (stat 95)

Rare mastery. Alters fight dynamics. Design unchanged from V12:
- **Devastator (POW 95):** Exploding dice on power attacks (reroll max, add). ~42% trigger rate target.
- **Iron Man (END 95):** Diminishing damage reduction [1.0, 0.91, 0.82] per round. 55-62% target. 7 straight passes.
- **Mind Reader (TEC 95):** Enhanced CP proc rate (+15% base) + enhanced reaction rate. <68% target.

---

## Gear — Triggered Passives with Situational Power

### Design principles
1. **Triggered passives, not random procs.** Effects fire on predictable conditions. Bounded per-round or per-fight.
2. **Situational power.** Each effect averages similar win rate across all matchups (±1%), but varies significantly per matchup (+1% to +5%). Best effect depends on opponent.
3. **Effect pools per slot per tier.** Each slot has 3 possible effects at Enhanced, Superior, and Legendary. Which one drops is random. Loot chase is both tier AND effect.
4. **All equipped gear is public.** Bettors see exact loadout pre-fight.
5. **Effects are archetype-neutral in availability, archetype-synergistic in effectiveness.** Any fighter can equip Overcharge, but it fires more reliably on Pressure (more power attacks).

### Tier structure

| Tier | Stat Bonus | Effects | Target Win % vs Ungeared |
|------|-----------|---------|-------------------------|
| **Standard** | +1 primary | None | 51-52% |
| **Enhanced** | +1 primary | 1 minor triggered passive (1×/round cap) | 53-55% |
| **Superior** | +2 primary | 1 medium triggered passive (1×/fight or always-on with small value) | 55-58% |
| **Legendary** | +3 primary | 1 major triggered passive (1×/fight, dramatic moment) | 58-63% |

**Effect quality drives tier progression, not stat budget.** Standard → Enhanced is exciting because you get your first effect. Superior → Legendary is exciting because the effect is dramatic (Overcharge, Phoenix, Flash Step). The stat bonuses are small enough to never override training.

**Key rule: gear stat bonuses do NOT qualify for ability tier thresholds.** You need natural stat 80 for tier 2. Gear +3 on stat-77 doesn't unlock Relentless. This prevents gear from changing a fighter's archetype identity.

### Effect pools

**Gloves (offense-oriented):**

| Tier | Effect A | Effect B | Effect C |
|------|----------|----------|----------|
| Enhanced | **Impact:** power attack dealing >5 dmg → +3 bonus, visual glow (1×/round) | **Precision:** +1 crit range for the round after landing 3+ hits (1×/round) | **Flurry:** next combo after a successful dodge deals +4 (1×/round) |
| Superior | **Haymaker:** first power attack each round: +5 dmg if stamina >60% (1×/round) | **Opportunist:** +3 damage vs Desperate opponents (always on) | **Surgeon:** crits apply -1 to opponent defense for 10 ticks (1×/round) |
| Legendary | **Overcharge:** next crit on power attack → ×2.5 damage (1×/fight) | **Devastator:** power attack KO threshold raised to 20% HP (always on) | **Executioner:** +4 damage when opponent below 30% HP (always on) |

**Headgear (awareness-oriented):**

| Tier | Effect A | Effect B | Effect C |
|------|----------|----------|----------|
| Enhanced | **Alert:** auto-reaction to first attack of the fight (1×/fight) | **Focus:** +2 accuracy on first attack after each repricing window (1×/round, R2+R3 only) | **Clarity:** -50% stun duration (always on) |
| Superior | **Anticipation:** after dodging 2 consecutive attacks, next attack auto-hits (1×/round) | **Composure:** +2 defense when behind on round scorecard (always on) | **Awareness:** subtle visual tell before opponent's power attacks (always on) |
| Legendary | **Sixth Sense:** auto-dodge one attack dealing >15 damage (1×/fight) | **Mind's Eye:** R3 only: +10% reaction rate (always on in R3) | **Premonition:** between-round repricing reveals opponent's exact stamina % to YOUR bettor audience (always on) |

**Body (resilience-oriented):**

| Tier | Effect A | Effect B | Effect C |
|------|----------|----------|----------|
| Enhanced | **Brace:** halve damage from first hit each round (1×/round) | **Conditioning:** +3 stamina recovery per round-end | **Resilience:** Desperation threshold lowered to 25% HP instead of 30% |
| Superior | **Second Wind:** below 50% HP first time: recover 5% stamina (1×/fight) | **Iron Skin:** power attacks against you deal -2 damage (always on) | **Endure:** between-round recovery +5% (always on) |
| Legendary | **Fortress:** below 25% HP → +3 AC rest of fight (1×/fight) | **Phoenix:** below 15% HP: burst recover 8% HP + 10% stamina (1×/fight) | **Colossus:** +50 max HP (always on, ~8% increase from 600 base) |

**Boots (movement-oriented):**

| Tier | Effect A | Effect B | Effect C |
|------|----------|----------|----------|
| Enhanced | **Quick Recovery:** -2 ticks recovery after knockdown/stagger | **Footwork:** +5% dodge for 10 ticks after landing a hit (1×/round) | **Stability:** can't be staggered by jabs (always on) |
| Superior | **Momentum:** 3 consecutive landed hits → next attack +3 damage (1×/round) | **Evasion:** auto-dodge first attack each round if stamina >70% (1×/round) | **Pressure Step:** after moving forward, next attack +2 accuracy (1×/round) |
| Legendary | **Flash Step:** one guaranteed dodge, AI chooses timing (1×/fight) | **Blitz:** R1 only: +20% Tempo (always on in R1) | **Relentless Pursuit:** opponent cannot gain Tempo advantage from dodging (always on) |

### Situational power example (Legendary Gloves)

| Effect | vs Pressure | vs Turtle | vs Counter | Avg |
|--------|-----------|----------|-----------|-----|
| Overcharge | +2% | +5% | +3% | ~3.3% |
| Devastator | +4% | +1% | +4% | ~3% |
| Executioner | +2% | +5% | +1% | ~2.7% |

No effect is universally best. Overcharge is S-tier against Turtle, Devastator is S-tier against Pressure and Counter. The optimal gear depends on your expected matchup distribution.

### Monte Carlo gear targets

| Test | Target | Notes |
|------|--------|-------|
| Each tier vs ungeared (mirror) | Standard 51-52%, Enhanced 53-55%, Superior 55-58%, Legendary 58-63% | Effects drive progression, not stats |
| Effects within same tier (mirror) | All within ±1% of each other on average across matchups | |
| Effects per matchup variance | +1% to +5% range per individual matchup | The variance IS the product |
| Legendary vs Superior at stat 80 | 52-56% | Gear doesn't override training |
| Trained (stat 80, no gear) vs Geared (stat 65, Legendary) | 60%+ for trained | Training > gear. +3 stat bonus (was +10) means tier 2 ability overcomes small stat gap. |
| Two-effect synergy check | No two equipped effects combine for >+7% in any matchup | Prevents degenerate stacking |

---

## Condition

| State | Tempo | Max Stamina | Between-Round Recovery | How It Happens |
|-------|-------|-------------|----------------------|---------------|
| **Fresh** | +5% | +10% | +5% | 8+ hours rest since last fight |
| **Normal** | baseline | baseline | baseline | Default |
| **Tired** | -5% | -10% | -5% | Fought within last 4 hours |

**Betting signal:** 3-5% overall win rate swing. Small enough to not override the triangle. Large enough for Expert bettors to calculate and trade on.

**Monte Carlo targets:**
- Fresh vs Tired (mirror): 53-57%
- Condition shift on triangle matchup: >2% swing
- Tired favorite (triangle advantage + tired) still wins: 58-65%

---

## Between-Round Repricing

10-second windows after R1 and R2. Three information layers, opt-in depth.

### Repricing 1 (after R1)

| Layer | What's Shown | Who Reads It |
|-------|-------------|-------------|
| **Gut** | Round winner, HP bars (animated recovery), fighter condition | Everyone |
| **Informed** | Stamina % bars, round scorecard (damage dealt, hits landed), ability activation count, condition indicator | Returning users |
| **Expert** | Tempo projection for R2-R3, ability ramp preview ("R2: CP proc rate → 26%"), burn rate calculation, triggered passive status ("Overcharge: PRIMED") | Dedicated bettors, agents |

### Repricing 2 (after R2)

| Layer | What's Shown | Who Reads It |
|-------|-------------|-------------|
| **Gut** | Cumulative round scores, HP bars (animated recovery), "FINAL ROUND" indicator | Everyone |
| **Informed** | Same as Repricing 1 + R3 ability ramp values shown explicitly, decision scoring projection ("Fighter A leads by 12% weighted damage") | Returning users |
| **Expert** | Full R3 scenario projections, Tempo for R3, triggered passive inventory ("Overcharge: SPENT, Sixth Sense: PRIMED"), KO/TKO probability estimate | Dedicated bettors, agents |

**Design rules:**
- Recovery animation plays FIRST (seconds 1-3) so bettors see HP change before analyzing data
- Data populates progressively — Gut data appears immediately, Informed data on tap/expand, Expert data on second tap
- Repricing window has a visible countdown timer
- Trading panel remains active during repricing — this is where position adjustments happen

---

## Fight Termination

| Method | Condition | When |
|--------|----------|------|
| **KO** | HP reaches 0 | Any round |
| **TKO** | HP below 15%, d20 check (threshold varies by round: R1=2, R2=4, R3=6 on d20) | Any round, more likely in R3 |
| **Decision** | No KO/TKO after 3 rounds | End of fight |

### Decision scoring

**Weighted cumulative damage: R1 25%, R2 35%, R3 40%.**

Fighter with higher weighted damage total wins.

Tiebreaker: higher remaining HP. Then higher remaining stamina. (Effectively never needed.)

Why weighted:
- R3 matters most, matching ability ramp narrative
- Creates comeback potential: fighter down after R2 can win with dominant R3
- Expert bettors calculate "how much R3 damage to overcome the deficit?" — concrete edge

---

## Desperation

Triggers when HP drops below 30%. Visible state change (fighter glows, stance shifts, commentary calls it).

| Effect | Value |
|--------|-------|
| Damage | +15% |
| Accuracy | -10% |
| Crit chance | +5% |
| Tempo floor | Can't drop below 70% of base (adrenaline) |

**Betting impact:** Increases variance. Desperate fighter might land a massive crit KO or whiff everything. Market should widen.

**Monte Carlo target:** Desperation KO rate 15-25% (dramatic but not reliable).

---

## Between-Round Recovery

| After | Base Recovery | Trailing Bonus | END Modifier |
|-------|-------------|----------------|-------------|
| R1 | 15% HP | +5% if behind on round score | END mod × 2% additional |
| R2 | 10% HP | +5% if behind on round score | END mod × 2% additional |

Diminishing recovery creates urgency: R2 damage is harder to recover from. Trailing bonus is small but visible — gives bettors a "they're recovering more" signal during repricing.

---

## Training System Impact

V13 reduces from 6 stats to 3. Training session types update:

| Session | Primary (70% XP) | Secondary (30% XP) |
|---------|------------------|-------------------|
| **Power Training** | POW | END |
| **Endurance Training** | END | TEC |
| **Technique Training** | TEC | POW |

XP curve, session costs, 4-hour duration, condition system, and agent/owner roles unchanged from training system design. The training design is modular — stat count change, core loop stays.

---

## Monte Carlo Simulation Plan

### Required simulations

| Sim | What | Fights | Success Criteria |
|-----|------|--------|-----------------|
| **1. Triangle (critical)** | P vs T, T vs C, C vs P | 10,000 each | Each matchup 62-68% for favored side. All three within ±3% of each other. |
| **2. Round-by-round** | Same matchups, track per-round | 10,000 each | P vs T, C vs P: R1 53-56%, R2 58-63%, R3 65-72%. T vs C inverted: R1 Turtle 60-65%, R2 55-60%, R3 48-53%. |
| **3. Specialist vs Hybrid** | Specialist 80 vs Hybrid 65, all matchups | 10,000 each | Specialist 58-65% in every matchup. |
| **4. Gear tiers** | Each tier vs ungeared, mirror | 10,000 each | Standard 51-52%, Enhanced 53-55%, Superior 55-58%, Legendary 58-63%. Effects drive progression. |
| **5. Gear within-tier balance** | Each effect at same tier vs each other, per matchup | 5,000 each | Average across matchups within ±1%. Per-matchup range +1% to +5%. |
| **6. Gear cross-tier** | Legendary vs Superior at stat 80 | 10,000 | 52-56%. |
| **7. Training > Gear** | Stat 80 no gear vs Stat 65 Legendary | 10,000 | Trained wins 60%+. Gear stat bonus now +3 (was +10). |
| **8. Condition** | Fresh vs Tired mirror + asymmetric | 10,000 each | Mirror: 53-57%. Condition shifts outcome by 3-5%. |
| **9. Tempo divergence** | Track Tempo % by round across all matchups | Included in Sim 1 | R1: all within 10% (Tempo floor 90%). R2: within 25% (floor 75%). R3: 15-25% gap, uncapped. |
| **10. Desperation** | Fights where Desperation triggers vs doesn't | Included in Sim 1 | Desperation KO rate: 15-25%. |
| **11. Ability ramp comparison** | 1.0/1.3/1.8 vs 1.0/1.5/2.0 | 10,000 each | Which produces tighter per-round targets. |
| **12. Signatures** | Devastator, Iron Man, Mind Reader (with diminishing returns above 80) | 10,000 each | Stat 95 vs stat 80 same archetype: 60-65%. Devastator trigger ~42%. Iron Man 55-62%. Mind Reader <68%. |
| **13. Two-effect synergy** | Best-case effect pairs across all matchups | 5,000 each | No pair exceeds +7% in any single matchup. |

### Priority order
Sim 1 first. If the triangle doesn't hit 62-68%, nothing else matters. Then Sim 2 (round-by-round). Then Sim 3 (specialist vs hybrid). Gear sims (4-7) can run in parallel after triangle validates.

---

## Answers to Kakashi's 6 Questions

| Question | Answer |
|----------|--------|
| **1. Ability ramp (1.0x/1.5x/2.0x)?** | Right direction. Sim both 1.0/1.3/1.8 and 1.0/1.5/2.0 (Sim 11). I expect 1.3/1.8 keeps R1 more meaningful for decision scoring. |
| **2. CP miss drain (flat 4 or escalating)?** | Flat 4 stam. CP's balance comes from Iron Guard catch (50-65%) + Turtle's low attack rate, not stamina drain. Keep it simple. |
| **3. Desperation threshold?** | 30% HP. Low enough to be dramatic, high enough to trigger in most fights that go to R3. |
| **4. Decision scoring?** | Weighted cumulative damage: R1 25%, R2 35%, R3 40%. Creates comeback narrative, Expert bettors calculate damage thresholds. |
| **5. Between-round recovery?** | 15% after R1, 10% after R2. +5% trailing bonus. END modifier × 2% additional. Diminishing recovery creates urgency. |
| **6. Stat naming?** | POW/END/TEC. Clean, maps to archetypes, signals new system. |

---

## What Changed From V6-V12

| V6-V12 | V13 | Why |
|--------|-----|-----|
| 6 stats (STR/SPD/DEF/STA/FIQ/AGG) | 3 stats (POW/END/TEC) | Simpler, cleaner, maps to archetypes. SPD eliminated. |
| SPD determines action rate (static) | Tempo from stamina (dynamic) | Kills the god stat. Equal start, visible divergence. |
| Triangle from stat advantages | Triangle from ability interactions | Structural, not numerical. Doesn't depend on tuning. |
| Flat abilities, no ramp | 1.0x / 1.3x / 1.8x ramp | Creates three-act betting arc. |
| No between-round repricing | 10-second repricing windows | Core betting mechanic. |
| Random procs (compound, V12: 4.9 procs/fight) | Triggered passives (bounded, 1×/fight or 1×/round) | Predictable triggers = betting signals. Bounded = no compounding. |
| Fixed effect per gear slot | Effect pools (3 per slot per tier) | Loot chase. Build diversity. Situational power. |
| Stat-only gear balance | Situational power (±1% avg, +1-5% per matchup) | Per-matchup variance IS the betting signal. |
| No decision scoring spec | Weighted 25/35/40 by round | R3 stakes. Comeback narrative. Calculable thresholds. |

---

## Monte Carlo Run 9 Results & Design Decisions (2026-02-23)

### What passed
- **Triangle: PASS.** P:64.4% / T:66.3% / C:67.0%. First time in 8 versions (V6-V13).
- **Cross-tier gear (Sim 6): PASS.** Legendary vs Superior at 80: 52.6%.
- **Condition (Sim 8): NEAR PASS.** Fresh/Tired: 57.1% (target ≤57%). Tunable.

### Structural issues identified + decisions applied

| Issue | Decision | Change |
|-------|----------|--------|
| T vs C round pattern inverts (R1: 63.9% Turtle, R3: 49.8%) | **Accept.** Comeback narrative is better for betting. | Updated round-by-round targets for T vs C. |
| Counter 73% vs Hybrid, Pressure 45.5% vs Hybrid | **Fix.** All specialists must beat hybrid (learnable signal). | Relentless +1 flat on all hits. Base CP catch 15-20% for all fighters. |
| Gear > Training (trained 80 loses to geared 65 at 40.2%) | **Fix.** Gear stat bonuses too generous. | Reduced to +1/+1/+2/+3 (was +2/+4/+7/+10). Gear stats don't qualify for ability tiers. |
| R1 Tempo gap 23% (target <5%) | **Fix.** R1 should be feeling-out round. | Tempo warm-up: R1 floor 90%, R2 floor 75%, R3 uncapped. |
| Stat 95 vs 80 = 86-87% | **Fix.** 86% kills betting markets. | Diminishing returns above 80: each point counts as 0.5 for combat calc. Target 60-65%. |

### Tuning issues (address after structural re-sim)
- Sim 4: Gear tier progression targets updated for effects-driven model.
- Sim 8a: Fresh vs Tired 57.1%, reduce condition multiplier from 1.04/0.96 to 1.03/0.97.
- Sim 10: KO rate 3.3% at HP 225. May need HP reduction, but cascade-check first.

---

## Open Items (Post-Monte Carlo)

- **Credit economy:** Starting credits, daily rewards, bet sizing, fee structure. Separate design after V13 validates.
- **Social moments:** Assigned to Mina. Clip-worthy moment taxonomy and sharing format.
- **Recovery visualization:** Assigned to Levi. UI spec for making recovery visible during repricing.
- **Agent League cadence:** 3-5 second repricing (data overlay, no pause) vs Human League 10 second full repricing. UX decision.
- **Premonition gear effect:** Creates asymmetric information (your bettors see opponent's exact stamina). Needs careful thought — may violate "all data is public" principle, or may be the one exception that creates interesting markets. Flag for review after Monte Carlo.
