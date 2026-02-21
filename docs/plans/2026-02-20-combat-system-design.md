# MFC Combat System Design

<<<<<<< HEAD
DnD 5e mechanics under the hood. 2D fighting game presentation on screen. Dice rolls determine everything — stats and gear shift the odds, but never guarantee outcomes. Progressive specialization (inspired by FFXI/FFXIV job systems) creates escalating fight complexity that maps to a natural betting difficulty gradient.

> **V6 (2026-02-22):** Major redesign. Added 3-tier progressive specialization (style traits / fighting techniques / signature moves). Gear changed from modifier bonuses to raw stat bonuses. Condition changed from ±1 all modifiers to stamina-only. Gear special traits redesigned to enhance tier abilities, not duplicate them. Previous: V5d validated core d20 combat constants (HP, modifiers, action rate, exhaustion). V6 builds on V5d — base combat math is unchanged.
=======
DnD 5e mechanics under the hood. 2D fighting game presentation on screen. Dice rolls determine everything — stats and gear shift the odds, but never guarantee outcomes.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

## 1. Core Combat Resolution

Every attack resolves as a d20 roll.

```
<<<<<<< HEAD
d20 + attacker_SPD_modifier >= defender_AC
=======
d20 + attacker_STR_modifier >= defender_AC
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
```

- **Hit:** Roll succeeds. Roll damage dice for the attack type + STR modifier.
- **Miss:** Roll fails. No damage. Defender might counter (driven by Fight IQ).
- **Natural 20:** Auto-hit regardless of AC. Critical hit — double damage dice (not modifiers). The swing moment.
- **Natural 1:** Auto-miss regardless of modifiers. Even the best fighter whiffs sometimes.

<<<<<<< HEAD
**STR/SPD role split (V3+):** SPD determines accuracy (added to attack rolls). STR determines damage (added to damage rolls only). This decouples "can you hit?" from "how hard?" and creates real build tradeoffs — a fast fighter lands more but hits lighter; a strong fighter misses more but devastates when connecting.

### Fighter HP

**HP: 600.** All fighters start each fight at 600 HP regardless of stats. This produces multi-round fights (avg 2.86 rounds in mirror matchups) with 86% of even fights reaching Round 3.

=======
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
### Damage Dice by Attack Type

Each attack type maps to a DnD damage die. Heavier attacks = bigger die = more risk/reward.

| Attack | Damage Die | Avg Damage | Fighting Game Feel |
|--------|-----------|------------|-------------------|
| Jab | 1d4 | 2.5 | Light punch. Fast, safe, low reward. |
| Cross | 1d6 | 3.5 | Medium straight. Bread and butter. |
| Hook | 1d8 | 4.5 | Power punch. Slower, hits hard. |
| Uppercut | 1d10 | 5.5 | Launcher. High commitment, high payoff. |
| Kick | 1d8 | 4.5 | Mid-range. Good reach, solid damage. |
| Roundhouse | 1d12 | 6.5 | Heavy kick. Huge wind-up, devastating if it lands. |
| Combo | 2d6 | 7.0 | Multi-hit. Costs stamina. Best average but expensive. |

Damage formula: `damage_dice + STR_modifier`. Crits: `(damage_dice * 2) + STR_modifier`.

### Defense Reactions

Defenders don't just have AC. Fight IQ drives active reactions:

<<<<<<< HEAD
- **Dodge:** Attacker rolls with disadvantage (2d20, take lower). Costs 8 stamina (5 with Stabilizers gear trait).
- **Block:** Reduce damage by `DEF_modifier + 1d6` (doubled to `DEF_modifier + 2d6` with Iron Guard technique). Costs 5 stamina. Still takes residual damage.
- **Reaction chance:** `max(0%, 15% + (FIQ - 50) / 100 * 50%)` per incoming attack. Range: 0% (FIQ ~20) to 40% (FIQ 100). Floor at 0% — fighters below ~FIQ 20 never react.
=======
- **Dodge:** Attacker rolls with disadvantage (2d20, take lower). Costs 8 stamina.
- **Block:** Reduce damage by `DEF_modifier + 1d6`. Costs 5 stamina. Still takes residual damage.
- **Reaction chance:** `15% + (FIQ - 50) / 100 * 25%` per incoming attack. Range: 2.5% to 40%.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
- Fighter AI chooses dodge vs block based on Fight IQ and situation (dodge vs power shots, block vs jabs).

### Expandable Crit Range

- **Base:** Natural 20 only (5% chance).
<<<<<<< HEAD
- **Fight IQ >= 80 (tier 2):** Crit range expands to 19-20 (10%). Smart fighters find openings. This is part of the Counter Puncher technique unlock — see Section 3.
- **Expanded Crit gear trait (Legendary):** Crit range expands by 1 more. Stacks with Fight IQ.
- **Maximum base crit range:** 18-20 (15%). Requires both high FIQ and Legendary gear.
- **Desperation bonus:** Crit range expands by 2 more when HP < 40%. Stacks with the above. A desperate fighter with max crit range reaches **16-20 (25%)**. This is the designed upset ceiling — a dying fighter swings wild and connects more often.
- **Absolute maximum:** 15-20 (30%) with FIQ 80 + Expanded Crit + Desperation. Extremely rare build + situation.
=======
- **Fight IQ >= 80:** Crit range expands to 19-20 (10%). Smart fighters find openings.
- **Legendary gear (Expanded Crit trait):** Crit range expands by 1 more. Stacks with Fight IQ.
- **Maximum possible crit range:** 18-20 (15%). Requires both high FIQ and Legendary gear.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

## 2. Stat-to-Modifier Mapping

All 6 fighter stats range 0-100, default 50. Each maps to combat parameters via the compressed modifier formula.

### Modifier Formula

```
<<<<<<< HEAD
modifier = round((effective_stat - 50) / 15)
```

Where `effective_stat = trained_stat + gear_stat_bonus`.

Range: -3 (stat ~5) to +3 (stat ~95). A stat of 50 = +0 modifier (average). Compressed from the original /10 (±5) to /15 (±3) after Monte Carlo showed ±5 created insurmountable DPS gaps at 30-point stat differences.

**Breakpoints:** Modifiers only change at effective stat values ~5, ~20, ~35, 50, 65, 80, 95. Training between breakpoints has no mechanical effect on the modifier — the last few points before a breakpoint are the most valuable. Gear can push effective stats past breakpoints (e.g., trained 73 + Legendary +10 = effective 83, modifier +2).
=======
modifier = (stat - 50) / 10
```

Range: -5 (stat 0) to +5 (stat 100). A stat of 50 = +0 modifier (average).
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Stat Roles

| Stat | Modifier Range | Combat Role |
|------|---------------|-------------|
<<<<<<< HEAD
| **Strength (STR)** | -3 to +3 | Added to damage rolls only. Raw hitting power. |
| **Speed (SPD)** | -3 to +3 | Added to attack rolls (accuracy) + action rate. Fast fighters hit more often and act faster. |
| **Defense (DEF)** | AC 7-13 | Sets Armor Class: `10 + DEF_modifier`. Higher = harder to hit. |
| **Stamina (STA)** | Pool 20-100 | Stamina pool: `50 + (STA - 50)`, floor 20. Governs dodges, blocks, combos before exhaustion. |
=======
| **Strength (STR)** | -5 to +5 | Added to attack rolls AND damage rolls. Hitting power + accuracy. |
| **Speed (SPD)** | -5 to +5 | Initiative order + action rate. Fast fighters get more turns. Added to dodge checks. |
| **Defense (DEF)** | AC 5-15 | Sets Armor Class: `10 + (DEF - 50) / 10`. Higher = harder to hit. |
| **Stamina (STA)** | Pool 0-100 | Stamina pool: `50 + (STA - 50)`. Governs dodges, blocks, combos before exhaustion. |
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
| **Fight IQ (FIQ)** | Multi-purpose | Reaction chance, crit range expansion, decision quality (see below). |
| **Aggression (AGG)** | Behavioral | Action selection weights, forward pressure, risk/reward tradeoff. |

### Fight IQ Breakdown

Fight IQ is the "intelligence" stat. It controls three things:

<<<<<<< HEAD
1. **Reaction chance:** `max(0%, 15% + (FIQ - 50) / 100 * 50%)`. Range 0%-40%. How often the fighter triggers dodge/block. Floor at 0% below ~FIQ 20. (V5d: formula fixed to actually reach 40% max — V1 formula capped at 27.5%.)
=======
1. **Reaction chance:** `15% + (FIQ - 50) / 100 * 25%`. Range 2.5%-40%. How often the fighter triggers dodge/block.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
2. **Crit range expansion:** FIQ >= 80 expands crit range to 19-20. Smart fighters exploit openings.
3. **Decision quality:** Higher FIQ = smarter action selection. Prioritizes combos when opponent is stunned, blocks when low HP, dodges power shots. Modeled as a bonus to AI decision scoring.

### Aggression Breakdown

Aggression controls fighting style, not raw power:

- **Action weights:** High AGG = more hooks, uppercuts, roundhouses, combos. Low AGG = more jabs, blocks, movement.
- **Pressure:** `AGG / 100` controls forward movement bias and clinch initiation.
- **Risk/reward tradeoff:** Aggressive fighters deal more damage but take more too (fewer defensive reactions).

### Design Principle

<<<<<<< HEAD
No stat is a dump stat. Every point matters somewhere. Specialization creates distinct fighting styles. The 3-tier progressive specialization system (Section 3) creates qualitative differences between builds that the d20 modifier system alone cannot produce.

Three archetype landmarks (vocabulary for bettors, not hardcoded types):
- High STR / High AGG / High STA = **Pressure** (relentless power, wears you down)
- High FIQ / High SPD / High DEF = **Counter** (reads you, punishes mistakes)
- High DEF / High STA / High FIQ = **Turtle** (hard to hit, outlasts you, wins on decision)

The archetype triangle (**Pressure > Turtle > Counter > Pressure**) emerges from tier 2 fighting techniques, not from raw stat interactions alone. See Section 3.

## 3. Progressive Specialization

Inspired by FFXIV's job system (Soul Crystal → Job Gauge → Burst Window → Capstone) and FFXI's merit points (hidden build diversity at endgame). Fighters evolve through three tiers as stats cross training thresholds, each tier adding new combat mechanics.

### Design Philosophy

**Higher level ≠ more power. It means more mechanics.**

In FFXIV, a level 30 Warrior has basic combos. A level 70 Warrior has Inner Release (a defined burst window that restructures the entire rotation). The fight isn't just bigger numbers — it's a fundamentally different experience to watch, play, and predict.

MFC applies this to prediction markets:

| Fighter Stage | Mechanics Active | Betting Complexity | Target Bettor |
|---------------|-----------------|-------------------|---------------|
| **Rookie** (all 50s) | Pure d20. Stats vs stats. | "Who has better numbers?" | Casual / tourist |
| **Trained** (1-2 stats at 65) | d20 + style traits | "This one hits harder, that one is faster" | Engaged user |
| **Specialist** (1-2 stats at 80) | d20 + traits + fighting techniques | "Counter Puncher vs Relentless — which matchup wins?" | Committed bettor |
| **Elite** (1 stat at 95) | d20 + traits + techniques + signature move | "Will the Devastator fire? When? What if it does in R3?" | Expert / agent |

The journey IS the product. Each tier crossing adds a new betting dimension. No "end game" — just deeper layers.

### Tier Unlock Rules

1. **Tier unlocks are based on TRAINED stat only.** Gear bonuses do not count toward tier thresholds. Gear makes you stronger within your tier; training advances you to the next tier.
2. **Multiple tiers per fighter allowed.** A fighter with STR 80 + FIQ 80 has two tier 2 techniques. This takes ~78 days and represents a genuine hybrid build with clear tradeoffs (no STA/DEF investment).
3. **Tier unlocks are permanent.** Stats don't decay (see training system design). Once earned, abilities persist.
4. **Tier unlocks are PUBLIC.** Visible on character sheets as badges. Bettors see "Counter Puncher" and "Devastating Blow" before the fight starts.

### Tier 1: Style Traits (stat reaches 65, +1 modifier)

Passive bonuses. Mild effects that signal the fighter's direction without dominating outcomes. The "class" phase — readable but not decisive.

| Stat | Trait | Effect | Bettor Signal |
|------|-------|--------|---------------|
| STR 65 | **Heavy Hands** | +1 flat damage on power attacks (hook, uppercut, roundhouse, combo) | "Power hitter developing" |
| SPD 65 | **Quick Feet** | +5% action rate bonus (multiplicative with base rate) | "Getting faster" |
| DEF 65 | **Thick Skin** | +1 AC (additive, on top of DEF modifier) | "Getting harder to hit" |
| STA 65 | **Deep Lungs** | +15 stamina pool | "Building endurance" |
| FIQ 65 | **Ring Sense** | +5% reaction chance (additive) | "Reading opponents better" |
| AGG 65 | **Forward Pressure** | +10% chance to select power attacks over jabs in action weighting | "Pushing the pace" |

**Market impact:** Mild. Casual bettors read the trait badges. "Heavy Hands + Forward Pressure = probably a brawler." Information is simple, spreads are tight on Trained-tier fights.

### Tier 2: Fighting Techniques (stat reaches 80, +2 modifier)

Active combat behaviors that change HOW the fighter fights. This is the Soul Crystal moment — the fighter's archetype identity crystallizes. These mechanics create the archetype triangle.

| Stat | Technique | Effect | Why It Creates Matchup Asymmetry |
|------|-----------|--------|--------------------------------|
| STR 80 | **Devastating Blow** | Damage dice explode: max roll on any damage die → reroll and add. Stacks on crits (each die in a crit can explode independently). | Burst damage ceiling rises. Every power shot COULD spike. Creates "will this one land big?" moments. |
| SPD 80 | **First Strike** | At the start of each round, this fighter gets a guaranteed action on tick 1, processed before the opponent's tick 1 action. After tick 1, normal action rate resumes. See Section 3.7 for tick-engine spec. | Tempo control. Gets the first hit, can set up defense, or land before the opponent reacts. |
| DEF 80 | **Iron Guard** | Block damage reduction doubled: `DEF_modifier + 2d6` instead of `DEF_modifier + 1d6`. | Massively reduces chip damage. Low-STR fighters literally cannot damage an Iron Guard through blocks. Forces opponents to use expensive power attacks or win on unblocked hits. |
| STA 80 | **Iron Chin** | TKO threshold drops from 75 HP to 40 HP. Additionally, +10% chance to recover from Gassed state per tick (on top of normal stamina regen). | Won't get stopped early. Survives what would KO others. Ref can't save the opponent. |
| FIQ 80 | **Counter Puncher** | Successful dodge triggers a free counter-attack: auto-hit (no d20 roll needed), 1d4 + SPD_modifier damage. Does not cost stamina or consume an action. | Turns every dodged attack into chip damage. Defense becomes offense. Pressure fighters who swing big and miss get punished. |
| AGG 80 | **Relentless** | When opponent enters Gassed state (stamina < 20), gain +2 to all attack rolls for the remainder of that Gassed period. | Smells blood. Finishes tired opponents. Creates a snowball when the opponent runs out of gas. |

**Technique stacking:** All bonuses from Devastating Blow, Desperation, and Crowd Energy can stack on a single hit. This is intentional — a desperate fighter with Devastating Blow who crits with Crowd Energy active is the highlight-reel upset moment. The probability of maximum stacking is extremely low (~0.5% per action), but when it happens, it creates the 33x longshot payoff.

### The Archetype Triangle

Tier 2 techniques create qualitative matchup asymmetries that produce the designed triangle: **Pressure > Turtle > Counter > Pressure**.

**Pressure (STR 80 + AGG 80) beats Turtle (DEF 80 + STA 80):**
- Devastating Blow's exploding dice create burst damage that exceeds Iron Guard's mitigation ceiling. Iron Guard absorbs avg ~9-10 per block; Devastating Blow spikes above that on power attacks.
- Relentless activates when Turtle eventually gases. Even with Iron Chin's recovery bonus, 3 rounds of blocking drains stamina. Once Gassed, Turtle faces +2 attack rolls against them.
- Turtle's plan (survive to Decision) is countered by Pressure's escalating late-round damage.

**Turtle (DEF 80 + STA 80) beats Counter (FIQ 80 + SPD 80):**
- Iron Guard completely absorbs Counter Puncher chip damage. Counter Puncher deals 1d4 + SPD_mod (avg ~4.5). Iron Guard reduces by DEF_mod + 2d6 (avg ~9-10). Net damage: 0.
- Counter relies on dodging (8 stamina each). Against Turtle's infrequent attacks (low AGG), Counter spends stamina on dodges that generate no value because Counter Puncher is nullified.
- Iron Chin prevents TKO. Counter can't get a ref stoppage. Must win by KO (unlikely against high DEF/STA) or Decision (Turtle is built for this).

**Counter (FIQ 80 + SPD 80) beats Pressure (STR 80 + AGG 80):**
- First Strike guarantees Counter acts first each round — can set up a dodge or land an opening hit before Pressure's big swings.
- Pressure's power attacks (hooks, uppercuts, roundhouses) cost 5-8 stamina each. When dodged (Counter's ~30-40% reaction rate), zero damage dealt AND Counter Puncher fires back.
- Counter Puncher works against Pressure because Pressure has low DEF (not invested) — they won't block effectively, so chip damage accumulates.
- Relentless doesn't fire because Counter doesn't gas easily — SPD-based fighting style has moderate stamina costs and high efficiency.

**Target win rates (to be Monte Carlo validated):**
- Pressure vs Turtle: 60-70% Pressure
- Turtle vs Counter: 60-70% Turtle
- Counter vs Pressure: 60-70% Counter
- Mirror (same archetype): ~50/50 (decided by slight stat advantages and randomness)

### Tier 3: Signature Moves (stat reaches 95, +3 modifier)

High-impact abilities for star fighters. Reaching 95 takes ~245 days of primary training — these are rare and create the "will it happen?" moments that keep elite-level markets volatile.

Two categories:

**Passive signatures** (always active):

| Stat | Signature | Effect |
|------|-----------|--------|
| DEF 95 | **Fortress** | All incoming damage reduced by flat 2 after all other calculations (min 1 damage). |
| STA 95 | **Iron Man** | Immune to TKO. Can only lose by KO (0 HP) or Decision. |
| FIQ 95 | **Mind Reader** | Reaction chance becomes 60% (overrides normal formula). Dodge/block selection is always optimal for the situation. |

**Trigger signatures** (once per fight, conditional):

| Stat | Signature | Trigger | Effect |
|------|-----------|---------|--------|
| STR 95 | **Devastator** | When landing a critical hit | That critical hit deals triple damage dice instead of double. Once per fight. |
| SPD 95 | **Ghost Step** | When dodging | That dodge costs zero stamina. Once per round (not once per fight). |
| AGG 95 | **Berserker** | When HP drops below 50% | Next 8 actions deal +1d8 bonus damage. Once per fight. |

**Market impact at elite tier:** Passive signatures are priceable — bettors know Fortress is always active and adjust. Trigger signatures create conditional uncertainty: "Fighter X has Devastator. It fires on a crit. Crit rate is 10%. Over 3 rounds with ~30 actions... ~26% chance it fires at least once. But WHEN it fires matters — R1 at full HP is different from R3 when desperate." This resists pure EV modeling because the CONTEXT of the trigger changes its value.

### First Strike: Tick-Engine Specification

The fight engine runs on 80ms ticks (12.5 ticks/second). Normal combat: each tick, each fighter has an `action_rate` probability of attempting an action (0.025-0.060 depending on SPD). Actions are processed in the order they're attempted.

**First Strike changes this at round boundaries:**

1. At tick 0 of each round (round start), the First Strike fighter gets a **guaranteed action** — action_rate is treated as 1.0 for that tick only.
2. This guaranteed action is **processed before** the opponent's tick 0 action, even if the opponent would also act on tick 0.
3. After tick 0, both fighters return to their normal action_rate probabilities.
4. **Mirror case:** If both fighters have First Strike (both SPD 80+), the fighter with higher SPD stat acts first. If tied, coin flip (50/50 per round).
5. First Strike does not grant additional actions — it guarantees the FIRST action and gives priority. Total actions per round remain governed by action_rate.

**Implementation note:** In the tick loop, add a `roundStartPriority` flag. At round start, check for First Strike. If active, queue one guaranteed action for the First Strike fighter before processing normal tick logic. Clear the flag after tick 0.

## 4. Gear System

Cyberpunk fighter rigs. 4 rarity tiers. Account-bound. **Gear adds to raw stat, not to modifier directly.** Gear can push effective stats past modifier breakpoints but cannot unlock tier abilities (traits, techniques, signatures require TRAINED stat thresholds).
=======
No stat is a dump stat. Every point matters somewhere. Specialization creates distinct fighting styles:
- High STR / Low SPD = brawler (hits like a truck, slow)
- High FIQ / High SPD = counter-fighter (reads you, punishes mistakes)
- High AGG / High STA = pressure fighter (relentless, wears you down)
- High DEF / High FIQ = turtle (hard to hit, waits for the perfect counter)

## 3. Gear System

Cyberpunk fighter rigs. 4 rarity tiers. Account-bound.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### 5 Stat Slots

| Slot | Stat Affinity | Flavor |
|------|--------------|--------|
| **Core Module** | STR, STA | The power plant. Reactor core, crystal heart, void engine. |
| **Neural Link** | FIQ, DEF | The brain. Processing speed, pattern recognition. Glows on crits. |
| **Arm Augments** | STR, AGG | What you hit with. Piston fists, blade arms, plasma knuckles. Most visible during attacks. |
| **Leg Rigs** | SPD, DEF | Movement system. Hydraulic legs, hover jets, magnetic boots. |
| **Exo-Frame** | DEF, STA | The shell. Visible as outline/aura around the fighter. Light mesh vs heavy plating. |

### 2 Cosmetic Slots

| Slot | Type | Flavor |
|------|------|--------|
| **Walkout Track** | Audio | Their anthem. Suno-generated, remixable. Plays during entrance and post-KO. Sonic identity. |
| **War Paint** | Visual | Glowing patterns, circuit traces, holographic tags. Overlays on the pixel sprite. |

### 4 Rarity Tiers

<<<<<<< HEAD
| Rarity | Color | Raw Stat Bonus | Special Trait | Drop Rate |
|--------|-------|---------------|--------------|-----------|
| **Standard** | White | +2 to one stat | No | 65% |
| **Enhanced** | Blue | +4 to one stat, +2 to another | No | 25% |
| **Superior** | Purple | +6 to one stat, +4 to another | Yes, 1 trait | 8% |
| **Legendary** | Orange | +10 to one stat, +6 to another | Yes, 1 powerful trait | 2% |

**Raw stat bonuses** are added to the trained stat to produce the effective stat. The effective stat is used in the modifier formula: `round((effective_stat - 50) / 15)`. This means gear CAN push you past a modifier breakpoint (e.g., trained 73 + Legendary +10 = effective 83, modifier +2 instead of +1). Gear is meaningful for combat math but does NOT unlock tier abilities.

**Full Legendary loadout impact:** 5 slots, each giving +10 to primary stat and +6 to secondary. Each stat appears in 2 slots (primary + secondary), so max gear bonus per stat = +10 + +6 = +16. A trained-50 fighter with full Legendary in one stat: effective 66, modifier +1. A trained-80 fighter: effective 96, modifier +3. Gear shifts modifiers by ~1 step — meaningful but secondary to training.

### Special Traits (Superior + Legendary only)

V6 redesign: traits ENHANCE tier abilities and playstyles, they don't duplicate them. No flat modifier bonuses.

**Superior Traits:**

| Trait | Effect | Build Synergy |
|-------|--------|---------------|
| **Thick Plating** | Block damage reduction +2 (flat, stacks with base block formula). | Tank / Turtle — makes Iron Guard even more impenetrable. |
| **Stabilizers** | Dodge stamina cost reduced from 8 to 5. | Counter / evasion builds — more dodges before gassing. |
| **Endurance Rig** | Between-round stamina recovery: regain 15 stamina at round break (in addition to HP recovery). | Late-round fighter — enter R2/R3 with more gas. |

**Legendary Traits:**

| Trait | Effect | Build Synergy |
|-------|--------|---------------|
| **Expanded Crit** | Crit range expands by 1. Stacks with FIQ 80 and Desperation. | Universal — any build benefits from more crits. |
| **Adrenaline Surge** | When Desperation activates (HP < 40%), stamina immediately refills to 75% of max. Once per fight. | Comeback amplifier — the desperate fighter gets a second wind of gas to spend on their best attacks. |
| **Chain Lightning** | When Devastating Blow (STR 80) triggers exploding dice, the reroll can also explode. Max 3 chain explosions per die. | STR specialist — turns Devastating Blow into a potentially massive spike. Dead weight without STR 80. |

**Trait design principle:** Some traits are universal (Expanded Crit works for anyone). Some are build-specific (Chain Lightning requires STR 80 Devastating Blow). Build-specific traits create natural gear chase paths: "I'm building Pressure, so I need Chain Lightning Arm Augments." This is the Diablo loot loop — specific gear for specific builds.
=======
| Rarity | Color | Stat Bonus | Special Trait | Drop Rate |
|--------|-------|-----------|--------------|-----------|
| **Standard** | White | +1 to one stat modifier | No | 65% |
| **Enhanced** | Blue | +1 to two stat modifiers | No | 25% |
| **Superior** | Purple | +2 to one, +1 to another | Yes, 1 trait | 8% |
| **Legendary** | Orange | +3 to one, +2 to another | Yes, 1 powerful trait | 2% |

**Stat bonuses apply to the modifier, not the raw stat.** A +2 STR Arm Augment adds +2 on top of the `(STR-50)/10` modifier. This is equivalent to 20 raw stat points of training. Gear is powerful.

### Special Traits (Superior + Legendary only)

| Trait | Min Rarity | Effect |
|-------|-----------|--------|
| Iron Chin | Superior | Reduce KO chance by 50% when HP < 35 |
| Glass Cannon | Superior | +1 damage modifier, -1 AC |
| Counter Puncher | Superior | Successful dodge grants +3 to next attack roll |
| Expanded Crit | Legendary | Crit range expands by 1 (stacks with Fight IQ) |
| Second Wind | Legendary | Once per fight, recover 30 stamina when dropping below 15 |
| Knockout Artist | Legendary | Crits deal triple damage dice instead of double |
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Gear Rules

- **Account-bound.** Gear belongs to your account, not a fighter.
- **Freely transferable** between your own fighters. Equip/unequip at will.
- **Not tradeable** between players. Everyone earns their own gear.
<<<<<<< HEAD
- **Does NOT unlock tiers.** Tier abilities (traits at 65, techniques at 80, signatures at 95) require TRAINED stat, excluding gear bonuses. Gear makes you stronger within your tier.
=======
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
- **Mythic tier (v2).** Crafted-only from salvaged Legendaries. Not a random drop. Deferred to v2 with salvage system.

### Pity Counters

Per-account, not per-fighter. Training any fighter advances the counter.

<<<<<<< HEAD
- **Superior+ pity:** Guaranteed Superior or better every 20 sessions.
- **Legendary pity:** Guaranteed Legendary every 100 sessions (~17 days at 6 sessions/day).

## 5. Condition System

Three states that affect stamina only. Simple enough for bettors to read at a glance. Shifts outcomes ~5-10%, not 30-50%.

| Condition | Effect | Visual | Betting Signal |
|-----------|--------|--------|---------------|
| **Fresh** | +15 stamina pool, +0.15 regen/tick | Green glow | "Coming off rest — full gas tank" |
| **Normal** | No change | No indicator | Baseline |
| **Tired** | -15 stamina pool, -0.15 regen/tick | Yellow tint | "Heavy schedule — might gas early" |

### How Condition Moves

- **Each fight** (Agent or Human League): condition drops one level
- **Training sessions:** no condition change (training doesn't cause fight fatigue)
- **Rest** (no fights for 8 hours): condition improves one level
- Max: Fresh. Min: Tired. Cannot go further in either direction.

### Why Stamina-Only

V5d Monte Carlo showed ±1 to ALL modifiers (the previous design) turned a 30-point stat advantage into a coin flip. That's catastrophic — condition would be the ONLY thing bettors care about.

Stamina-only creates asymmetric relevance:
- **Matters most for:** Turtles (stamina IS their game plan), Pressure fighters (high stamina costs for power attacks)
- **Matters least for:** Counters (dodge-focused, moderate stamina use)
- This asymmetry creates disagreement: "Fighter A is Tired but they're a Counter — does it matter?" Some bettors say yes, others say no. Disagreement = volume.

### The Agent's Scheduling Dilemma

More Agent League fights = more data = better form guide. But too many fights = Tired going into a Human League bout. The agent must manage fight scheduling to peak condition for the main event.

## 6. Training Loop & Loot Economy

> **Full training system spec: `docs/plans/2026-02-22-training-system-design.md`**

### Training Sessions

The core idle loop. Agent queues a session, it runs for 4 hours, fighter collects stat XP + one loot roll.

- **6 session types** each targeting 2 stats (70/30 XP split): Heavy Bag (STR/AGG), Sparring (FIQ/DEF), Roadwork (STA/SPD), Film Study (FIQ/AGG), Strength & Conditioning (STR/STA), Speed Drills (SPD/DEF).
- **Exponential XP curve:** `xp_required(level) = 100 × 1.12^(level - 50)`. +1 modifier in ~4 days, +2 in ~39 days, +3 in ~245 days.
- **Two outputs per session:** Stat XP (incremental gains to raw stats) + one loot roll (gear drop chance).
- **Sessions cost credits:** `100 × (1 + (avg_target_stats - 50) / 50)`. Range 100-190 credits/session. Primary credit sink.
- **Style over power:** No hard stat cap. Exponential costs create natural specialization. Build diversity comes from opportunity cost, not arbitrary limits.

### Training-to-Tier Timeline

| Milestone | Primary Training Time | What Unlocks | Market Event |
|-----------|----------------------|-------------|--------------|
| Stat 65 (Tier 1) | ~4 days | Style Trait | Minor reprice. "Fighter is developing a direction." |
| Stat 80 (Tier 2) | ~39 days | Fighting Technique | **Major reprice.** "Counter Puncher just unlocked. All matchup odds shift." |
| Stat 95 (Tier 3) | ~245 days | Signature Move | **Star event.** "First Devastator in the league. What's it worth?" |
| Second stat to 80 | ~78 days | Second Technique | Build identity solidifies. Hybrid-specialist with two techniques. |

Tier milestones are PUBLIC. When a fighter crosses a threshold, it's announced. Agent League fights immediately after unlock are the highest-information events — first data on how the new technique performs. Pre-unlock speculation ("Fighter X is 3 sessions from FIQ 80") creates betting alpha.
=======
- **Superior+ pity:** Guaranteed Superior or better every 10 sessions.
- **Legendary pity:** Guaranteed Legendary every 50 sessions (~10 days at 5 sessions/day).

## 4. Training Loop & Loot Economy

### Training Sessions

The core idle loop. Queue a session, it runs, collect stat XP + one loot roll.

- **Model:** Baseball 9-style idle training (targeted stat training with resource costs, quick sessions, visible progress). Deep-dive on exact mechanics pending — will spec the session types, durations, and XP curves against the Baseball 9 model before implementation.
- **Session types** target different stats (e.g., "Sparring" for STR/AGG, "Circuit Training" for SPD/STA, "Film Study" for FIQ/DEF).
- **Two outputs per session:** Stat XP (incremental gains to raw stats) + one loot roll (gear drop chance).
- **Sessions cost credits.** This is the primary credit sink.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Credit Flow by Player Stage

| Stage | Earns From | Spends On | Net |
|-------|-----------|----------|-----|
| **Day 1 (Tourist)** | Starting credits + first-bet bonus | Watching fights, first trades | Positive. Exploring freely. |
| **Week 1 (Engaged)** | Winning bets, daily rewards | Training sessions, more trades | Roughly neutral. |
| **Month 1 (Invested)** | Market trading, daily rewards, streak bonuses | Training, multi-fighter management | Slightly negative. Funds ambition. |

<<<<<<< HEAD
Slightly-negative at Month 1 is intentional. Credits retain value because there's always something worth spending on — another stat to push toward the next tier.
=======
Slightly-negative at Month 1 is intentional. Credits retain value because there's always something worth spending on. Exact numbers to be validated by Monte Carlo simulation.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Agent Economy

Agents run the same loop autonomously: queue training, roll loot, equip gear, enter fights. Agent League runs 24/7 with lower stakes per fight but higher volume. Agent fight records become the public form guide for Human League bettors.

<<<<<<< HEAD
## 7. Stamina & Comeback Mechanics

### Action Rate

Controls fight pacing. How often a fighter attempts an action per tick.

```
action_rate = 0.025 + (SPD / 100) × 0.035
```

Range: 0.025 (SPD 0) to 0.060 (SPD 100). At 12 ticks/sec, that's ~0.3-0.7 actions/sec per fighter.

**Quick Feet bonus (SPD 65 trait):** Multiplied by 1.05 after base calculation.

**Progressive exhaustion:** Action rate degrades each round.
- Round 1: ×1.00
- Round 2: ×0.88
- Round 3: ×0.76

This makes Round 3 fights slower and grindier — stamina-built fighters shine late while aggressive fighters fade. Creates the natural fight arc that prediction markets need (early action, late drama).

### Between-Round Recovery

**85 HP recovered between rounds** (100 HP with Reinforced Core gear trait). Simulates corner recovery. This is what pushes fights into Round 2 and 3 — without it, damage accumulates too fast and every fight ends in R1.

**Stamina partial recovery:** Stamina regenerates normally during the round break (~3 seconds of ticks with no actions). With Endurance Rig gear trait, an additional +15 stamina is granted at round break.
=======
## 5. Stamina & Comeback Mechanics
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Stamina System

Stamina is the fight's pacing engine. It prevents spam and creates tactical depth.

<<<<<<< HEAD
- **Pool size:** `50 + (STA - 50)`, floor 20. Range 20-100. (Deep Lungs trait at STA 65: +15. Condition: ±15.)
- **Regen rate:** `0.5 + (STA - 50) / 100` per tick when not attacking. (Condition: ±0.15.)
- **Gassed state:** Below 20 stamina. Action rate halved, -2 to attack rolls, can't combo. (Iron Chin at STA 80: +10% chance per tick to recover from Gassed.)

**Stamina costs by action:**

| Action | Cost | With Stabilizers |
|--------|------|-----------------|
| Jab | 2 | 2 |
| Cross | 4 | 4 |
| Hook | 5 | 5 |
| Kick | 5 | 5 |
| Uppercut | 6 | 6 |
| Roundhouse | 8 | 8 |
| Combo | 10 | 10 |
| Dodge | 8 | **5** |
| Block | 5 | 5 |

Stabilizers gear trait only affects dodge cost. This specifically enhances Counter/evasion builds without making stamina universally cheaper.
=======
- **Pool size:** `50 + (STA - 50)`. Range 0-100.
- **Regen rate:** `0.5 + (STA - 50) / 100` per tick when not attacking.
- **Gassed state:** Below 20 stamina. Action rate halved, -2 to attack rolls, can't combo.

**Stamina costs by action:**

| Action | Cost |
|--------|------|
| Jab | 2 |
| Cross | 4 |
| Hook | 5 |
| Kick | 5 |
| Uppercut | 6 |
| Roundhouse | 8 |
| Combo | 10 |
| Dodge | 8 |
| Block | 5 |

Aggressive fighters burn bright but fade. Stamina-built fighters grind you down. This creates natural fight arcs — early pressure vs late-round endurance.
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)

### Comeback Mechanics

The losing fighter gets tools. This creates late-fight volatility that keeps the prediction market interesting.

| Mechanic | Trigger | Effect | Reference |
|----------|---------|--------|-----------|
<<<<<<< HEAD
| **Desperation** | HP below 40% (240 HP) | +5 to all attack rolls, +1d10 bonus damage, crit range expands by 2 | Street Fighter Ultra meter |
| **Second Wind** | Round break while behind on score | Recover stamina to 50% of max | Boxing corner recovery |
| **Crowd Energy** | 2+ unanswered hits taken | Next landed hit deals +2d6 bonus damage | Tekken Rage system |

V5d tuning notes: Desperation trigger raised from 25%→40% HP and bonuses significantly buffed. These bonuses stack with tier abilities and gear traits — a desperate fighter with Devastating Blow, Adrenaline Surge, and Crowd Energy is the maximum volatility scenario.

**TKO threshold:** 75 HP (40 HP with Iron Chin technique). Below threshold, 15% chance per hit of referee stoppage.

### Target Upset Rates

Upset rates for base combat (no tier abilities). Validated at V5d, 10,000 fights per matchup:

| Matchup | Upset Rate | Market Impact |
|---------|-----------|---------------|
| Slight advantage (10-15 pts) | **25-30%** | Real disagreement. Enough variance for active trading. |
| Clear advantage (30 pts) | **3-5%** | Rare upsets. Underdog contracts trade at ~$0.03 — a 33x longshot. |
| Massive advantage (50+ pts) | **<1%** | Stats dominate. Training investment pays off decisively. |

**With tier abilities:** Upset rates shift based on matchup type. A Counter (FIQ 80 + SPD 80) vs Pressure (STR 80 + AGG 80) where Counter is the "stat underdog" (lower total stat points) may upset at higher rates because the triangle favors them. This is the deepest betting signal — archetype matchup overrides raw stat advantage in some cases. Monte Carlo validation pending.

## 8. Monte Carlo Summary

### V5d Base Combat (validated)

10,000 fights per matchup. 7 iterations from V1→V5d. Core combat constants are UNCHANGED in V6.

| Metric | V5d | Target | Status |
|--------|-----|--------|--------|
| Mirror avg rounds | **2.86** | 2-3 | HIT |
| Mirror R3 rate | **86%** | Regular | HIT |
| Mirror decisions | **14.2%** | 10-15% | HIT |
| Slight upset (60v50) | **26.4%** | 25-30% | HIT |
| Clear upset (80v50) | **2.9%** | 3-5% | HIT (revised) |
| Loot rates | **Within 1%** | Match spec | HIT |

### V6 Tier System (pending validation)

Kakashi's training system Monte Carlo (V5d, pre-tier system) found 4 critical issues. V6 redesigns are intended to fix all 4:

| Problem (V5d) | V6 Fix | Validation Status |
|---------------|--------|-------------------|
| Condition ±1 all mods flips outcomes | Condition → stamina only | **Pending Monte Carlo** |
| Gear modifier bonuses dominate training | Gear → raw stat bonuses | **Pending Monte Carlo** |
| No archetype triangle (Counter dominant) | Tier 2 techniques create triangle | **Pending Monte Carlo** |
| Hybrids dominate specialists | Tier 2 techniques are qualitatively stronger than tier 1 traits | **Pending Monte Carlo** |

## 9. Open Items

| Item | Status | Notes |
|------|--------|-------|
| Training system design | **Done** | See `docs/plans/2026-02-22-training-system-design.md` |
| Monte Carlo: V5d base combat | **Done** | Core constants validated. Unchanged in V6. |
| Monte Carlo: V6 tier system | **Pending** | Full sim plan posted to team discussion. 6 simulations needed. |
| Monte Carlo: V6 condition (stamina-only) | **Pending** | Verify 5-10% outcome shift, not 30-50%. |
| Monte Carlo: V6 gear (raw stat bonuses) | **Pending** | Verify gear is meaningful but secondary to training. |
| Monte Carlo: V6 archetype triangle | **Pending** | Pressure > Turtle > Counter > Pressure, each edge 60-70%. |
| Monte Carlo: V6 hybrid vs specialist | **Pending** | Verify specialist (2 techniques) beats hybrid (6 traits). |
| Monte Carlo: V6 tier 3 signatures | **Pending** | Verify trigger rates and impact on fight outcomes. |
| Monte Carlo: V6 cross-tier matchups | **Pending** | Trained (65) vs Specialist (80). What's the upset rate? |
| Gear special trait full list | **Done (v1)** | 6 traits defined (3 Superior, 3 Legendary). More in v2. |
| Implementation plan update | **Pending** | Blocked on Monte Carlo validation of V6. |
| Mythic tier + salvage system | v2 | Crafted-only from salvaged Legendaries. Deferred. |
| Fight-tier labeling for market | **Pending** | "Rookie Card" / "Main Card" / "Championship" fight categories. |
| Starting credits, daily rewards, streak bonuses | **Pending** | Economy numbers needed for credit flow validation. |
=======
| **Desperation** | HP below 25% | +2 to all attack rolls, crit range expands by 1 | Street Fighter Ultra meter |
| **Second Wind** | Round break while behind on score | Recover stamina to 50% of max | Boxing corner recovery |
| **Crowd Energy** | 3+ unanswered hits taken | Next landed hit deals +1d6 bonus damage | Tekken Rage system |

These are cumulative but situational. A fighter at 20% HP with Desperation active who lands a crit with Crowd Energy bonus can flip a fight. That's the moment bettors live for.

### Target Upset Rate

**25-30% across all matchups.** Too low and favorites are boring locks. Too high and stats don't matter. To be validated by Monte Carlo simulation (game-design-review skill, Pass 3).

### Why This Matters for the Exchange

Comeback mechanics create late-fight volatility. A fighter dominating rounds 1-2 is the favorite, but the market should never feel settled. Desperation + a lucky crit = upset. Confident positions can get blown up by the mechanics. This is what makes MFC a prediction market, not a slot machine.

## Open Items

| Item | Status | Notes |
|------|--------|-------|
| Baseball 9 training deep-dive | Pending | Need to spec exact session types, durations, XP curves against the Baseball 9 model |
| Monte Carlo validation | Pending | Run game-design-review skill after implementation plan. Validate upset rates, crit impact, fight length distribution, loot drop distributions. |
| Mythic tier + salvage system | v2 | Crafted-only from salvaged Legendaries. Deferred. |
| Special trait full list | Pending | 6 examples defined. Full list to be designed during implementation. |
| Exact credit costs for training | Pending | Depends on overall economy model. Will tune after Monte Carlo. |
>>>>>>> 96a39fd (Add combat system design doc — DnD d20 mechanics for MFC fight engine)
