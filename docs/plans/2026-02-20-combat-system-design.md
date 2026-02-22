# MFC Combat System Design

DnD 5e mechanics under the hood. 2D fighting game presentation on screen. Dice rolls determine everything — stats and gear shift the odds, but never guarantee outcomes.

> **V5d (2026-02-22):** Updated with Monte Carlo validated constants. 7 iterations (V1→V5d), 10,000 fights per matchup. See `scripts/monte-carlo-combat.ts` for simulation code.

## 1. Core Combat Resolution

Every attack resolves as a d20 roll.

```
d20 + attacker_SPD_modifier >= defender_AC
```

- **Hit:** Roll succeeds. Roll damage dice for the attack type + STR modifier.
- **Miss:** Roll fails. No damage. Defender might counter (driven by Fight IQ).
- **Natural 20:** Auto-hit regardless of AC. Critical hit — double damage dice (not modifiers). The swing moment.
- **Natural 1:** Auto-miss regardless of modifiers. Even the best fighter whiffs sometimes.

**STR/SPD role split (V3+):** SPD determines accuracy (added to attack rolls). STR determines damage (added to damage rolls only). This decouples "can you hit?" from "how hard?" and creates real build tradeoffs — a fast fighter lands more but hits lighter; a strong fighter misses more but devastates when connecting.

### Fighter HP

**HP: 600.** All fighters start each fight at 600 HP regardless of stats. This produces multi-round fights (avg 2.86 rounds in mirror matchups) with 86% of even fights reaching Round 3.

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

- **Dodge:** Attacker rolls with disadvantage (2d20, take lower). Costs 8 stamina.
- **Block:** Reduce damage by `DEF_modifier + 1d6`. Costs 5 stamina. Still takes residual damage.
- **Reaction chance:** `15% + (FIQ - 50) / 100 * 25%` per incoming attack. Range: 2.5% to 40%.
- Fighter AI chooses dodge vs block based on Fight IQ and situation (dodge vs power shots, block vs jabs).

### Expandable Crit Range

- **Base:** Natural 20 only (5% chance).
- **Fight IQ >= 80:** Crit range expands to 19-20 (10%). Smart fighters find openings.
- **Legendary gear (Expanded Crit trait):** Crit range expands by 1 more. Stacks with Fight IQ.
- **Maximum possible crit range:** 18-20 (15%). Requires both high FIQ and Legendary gear.

## 2. Stat-to-Modifier Mapping

All 6 fighter stats range 0-100, default 50. Each maps to combat parameters via the compressed modifier formula.

### Modifier Formula

```
modifier = round((stat - 50) / 15)
```

Range: -3 (stat ~5) to +3 (stat ~95). A stat of 50 = +0 modifier (average). Compressed from the original /10 (±5) to /15 (±3) after Monte Carlo showed ±5 created insurmountable DPS gaps at 30-point stat differences.

**Breakpoints:** Modifiers only change at stat values 5, 20, 35, 50, 65, 80, 95. Training between breakpoints has no mechanical effect — the last few points before a breakpoint are the most valuable.

### Stat Roles

| Stat | Modifier Range | Combat Role |
|------|---------------|-------------|
| **Strength (STR)** | -3 to +3 | Added to damage rolls only. Raw hitting power. |
| **Speed (SPD)** | -3 to +3 | Added to attack rolls (accuracy) + action rate. Fast fighters hit more often and act faster. |
| **Defense (DEF)** | AC 7-13 | Sets Armor Class: `10 + DEF_modifier`. Higher = harder to hit. |
| **Stamina (STA)** | Pool 20-100 | Stamina pool: `50 + (STA - 50)`, floor 20. Governs dodges, blocks, combos before exhaustion. |
| **Fight IQ (FIQ)** | Multi-purpose | Reaction chance, crit range expansion, decision quality (see below). |
| **Aggression (AGG)** | Behavioral | Action selection weights, forward pressure, risk/reward tradeoff. |

### Fight IQ Breakdown

Fight IQ is the "intelligence" stat. It controls three things:

1. **Reaction chance:** `15% + (FIQ - 50) / 100 * 50%`. Range 2.5%-40%. How often the fighter triggers dodge/block. (V5d: formula fixed to actually reach 40% max — V1 formula capped at 27.5%.)
2. **Crit range expansion:** FIQ >= 80 expands crit range to 19-20. Smart fighters exploit openings.
3. **Decision quality:** Higher FIQ = smarter action selection. Prioritizes combos when opponent is stunned, blocks when low HP, dodges power shots. Modeled as a bonus to AI decision scoring.

### Aggression Breakdown

Aggression controls fighting style, not raw power:

- **Action weights:** High AGG = more hooks, uppercuts, roundhouses, combos. Low AGG = more jabs, blocks, movement.
- **Pressure:** `AGG / 100` controls forward movement bias and clinch initiation.
- **Risk/reward tradeoff:** Aggressive fighters deal more damage but take more too (fewer defensive reactions).

### Design Principle

No stat is a dump stat. Every point matters somewhere. Specialization creates distinct fighting styles:
- High STR / High AGG / High STA = **pressure** (relentless power, wears you down)
- High FIQ / High SPD / High DEF = **counter-fighter** (reads you, punishes mistakes)
- High DEF / High STA / High FIQ = **turtle** (hard to hit, outlasts you, wins on decision)

Monte Carlo validated archetype matchups (V5d):
- Counter beats Brawler: 90/10 (hard counter — speed/accuracy dominates slow power)
- Turtle edges Pressure: 58/42 (soft counter — endurance outlasts aggression)
- Hybrid builds viable but with no dominant matchup edge

## 3. Gear System

Cyberpunk fighter rigs. 4 rarity tiers. Account-bound.

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

| Rarity | Color | Stat Bonus | Special Trait | Drop Rate |
|--------|-------|-----------|--------------|-----------|
| **Standard** | White | +1 to one stat modifier | No | 65% |
| **Enhanced** | Blue | +1 to two stat modifiers | No | 25% |
| **Superior** | Purple | +2 to one, +1 to another | Yes, 1 trait | 8% |
| **Legendary** | Orange | +3 to one, +2 to another | Yes, 1 powerful trait | 2% |

**Stat bonuses apply to the modifier, not the raw stat.** A +2 STR Arm Augment adds +2 on top of the `round((STR-50)/15)` modifier. Gear stacking with high stats needs Monte Carlo validation — see Open Items.

### Special Traits (Superior + Legendary only)

| Trait | Min Rarity | Effect |
|-------|-----------|--------|
| Iron Chin | Superior | Reduce KO chance by 50% when HP < 75 |
| Glass Cannon | Superior | +1 damage modifier, -1 AC |
| Counter Puncher | Superior | Successful dodge grants +3 to next attack roll |
| Expanded Crit | Legendary | Crit range expands by 1 (stacks with Fight IQ) |
| Second Wind | Legendary | Once per fight, recover 30 stamina when dropping below 15 |
| Knockout Artist | Legendary | Crits deal triple damage dice instead of double |

### Gear Rules

- **Account-bound.** Gear belongs to your account, not a fighter.
- **Freely transferable** between your own fighters. Equip/unequip at will.
- **Not tradeable** between players. Everyone earns their own gear.
- **Mythic tier (v2).** Crafted-only from salvaged Legendaries. Not a random drop. Deferred to v2 with salvage system.

### Pity Counters

Per-account, not per-fighter. Training any fighter advances the counter.

- **Superior+ pity:** Guaranteed Superior or better every 20 sessions.
- **Legendary pity:** Guaranteed Legendary every 100 sessions (~17 days at 6 sessions/day).

## 4. Training Loop & Loot Economy

### Training Sessions

> **Full training system spec: `docs/plans/2026-02-22-training-system-design.md`**

The core idle loop. Agent queues a session, it runs for 4 hours, fighter collects stat XP + one loot roll.

- **6 session types** each targeting 2 stats (70/30 XP split): Heavy Bag (STR/AGG), Sparring (FIQ/DEF), Roadwork (STA/SPD), Film Study (FIQ/AGG), Strength & Conditioning (STR/STA), Speed Drills (SPD/DEF).
- **Exponential XP curve:** `xp_required(level) = 100 × 1.12^(level - 50)`. +1 modifier in ~4 days, +2 in ~39 days, +3 in ~245 days.
- **Two outputs per session:** Stat XP (incremental gains to raw stats) + one loot roll (gear drop chance).
- **Sessions cost credits:** `100 × (1 + (avg_target_stats - 50) / 50)`. Range 100-190 credits/session. Primary credit sink.
- **Style over power:** No hard stat cap. Exponential costs create natural specialization. Build diversity comes from opportunity cost, not arbitrary limits.

### Credit Flow by Player Stage

| Stage | Earns From | Spends On | Net |
|-------|-----------|----------|-----|
| **Day 1 (Tourist)** | Starting credits + first-bet bonus | Watching fights, first trades | Positive. Exploring freely. |
| **Week 1 (Engaged)** | Winning bets, daily rewards | Training sessions, more trades | Roughly neutral. |
| **Month 1 (Invested)** | Market trading, daily rewards, streak bonuses | Training, multi-fighter management | Slightly negative. Funds ambition. |

Slightly-negative at Month 1 is intentional. Credits retain value because there's always something worth spending on. Exact numbers to be validated by Monte Carlo simulation.

### Agent Economy

Agents run the same loop autonomously: queue training, roll loot, equip gear, enter fights. Agent League runs 24/7 with lower stakes per fight but higher volume. Agent fight records become the public form guide for Human League bettors.

## 5. Stamina & Comeback Mechanics

### Action Rate

Controls fight pacing. How often a fighter attempts an action per tick.

```
action_rate = 0.025 + (SPD / 100) × 0.035
```

Range: 0.025 (SPD 0) to 0.060 (SPD 100). At 12 ticks/sec, that's ~0.3-0.7 actions/sec per fighter.

**Progressive exhaustion:** Action rate degrades each round.
- Round 1: ×1.00
- Round 2: ×0.88
- Round 3: ×0.76

This makes Round 3 fights slower and grindier — stamina-built fighters shine late while aggressive fighters fade. Creates the natural fight arc that prediction markets need (early action, late drama).

### Between-Round Recovery

**85 HP recovered between rounds.** Simulates corner recovery. This is what pushes fights into Round 2 and 3 — without it, damage accumulates too fast and every fight ends in R1.

### Stamina System

Stamina is the fight's pacing engine. It prevents spam and creates tactical depth.

- **Pool size:** `50 + (STA - 50)`, floor 20. Range 20-100.
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

### Comeback Mechanics

The losing fighter gets tools. This creates late-fight volatility that keeps the prediction market interesting.

| Mechanic | Trigger | Effect | Reference |
|----------|---------|--------|-----------|
| **Desperation** | HP below 40% (240 HP) | +5 to all attack rolls, +1d10 bonus damage, crit range expands by 2 | Street Fighter Ultra meter |
| **Second Wind** | Round break while behind on score | Recover stamina to 50% of max | Boxing corner recovery |
| **Crowd Energy** | 2+ unanswered hits taken | Next landed hit deals +2d6 bonus damage | Tekken Rage system |

V5d tuning notes: Desperation trigger raised from 25%→40% HP and bonuses significantly buffed (+2→+5 atk, added +1d10 dmg, crit range -1→-2). Crowd Energy trigger reduced from 3→2 hits and damage doubled. These changes were necessary because at V5d's compressed modifier range (±3), smaller comeback bonuses had no meaningful impact on DPS ratios.

**TKO threshold:** 75 HP (up from 50). Below 75 HP, 15% chance per hit of referee stoppage.

These are cumulative but situational. A fighter at 200 HP with Desperation active who lands a crit with Crowd Energy bonus can flip a fight. That's the moment bettors live for.

### Target Upset Rates (Monte Carlo Validated)

Upset rates vary by stat gap. Validated across 10,000 fights per matchup (V5d):

| Matchup | Upset Rate | Market Impact |
|---------|-----------|---------------|
| Slight advantage (10-15 pts) | **25-30%** | Real disagreement. Enough variance for active trading. |
| Clear advantage (30 pts) | **3-5%** | Rare upsets. Underdog contracts trade at ~$0.03 — a 33x longshot. |
| Massive advantage (50+ pts) | **<1%** | Stats dominate. Training investment pays off decisively. |

The 25-30% target applies to slight advantages only. Clear advantages were originally targeted at 25-30% but Monte Carlo proved this is unrealistic without breaking stat progression — the d20 system naturally produces ~3% upsets at 30-point gaps. Jeff approved the revised targets.

### Why This Matters for the Exchange

Comeback mechanics create late-fight volatility. A fighter dominating rounds 1-2 is the favorite, but the market should never feel settled. Desperation + a lucky crit = upset. Confident positions can get blown up by the mechanics. This is what makes MFC a prediction market, not a slot machine.

## Monte Carlo Summary (V5d)

10,000 fights per matchup. 7 iterations from V1→V5d.

| Metric | V1 | V5d | Target | Status |
|--------|----|----|--------|--------|
| Mirror avg rounds | 1.0 | **2.86** | 2-3 | HIT |
| Mirror R3 rate | 0% | **86%** | Regular | HIT |
| Mirror decisions | 0% | **14.2%** | 10-15% | HIT |
| Slight upset (60v50) | 20.6% | **26.4%** | 25-30% | HIT |
| Clear upset (80v50) | 0% | **2.9%** | 3-5% | HIT (revised) |
| Counter vs Brawler | — | **90/10** | Asymmetric | HIT |
| Turtle vs Pressure | — | **58/42** | Asymmetric | HIT |
| Loot rates | Inflated | **Within 1%** | Match spec | HIT |

Script: `scripts/monte-carlo-combat.ts` — run with `npx tsx scripts/monte-carlo-combat.ts`

## Open Items

| Item | Status | Notes |
|------|--------|-------|
| Training system design | **Done** | See `docs/plans/2026-02-22-training-system-design.md` |
| Monte Carlo: core combat | **Done** | V5d validated. All targets hit or revised with approval. |
| Monte Carlo: condition system | Pending | Fresh (+1 all) vs Tired (-1 all) impact on win rates. Is the 2-modifier swing too powerful? |
| Monte Carlo: gear stacking | Pending | +3 stat modifier + Legendary gear modifier. Does this break ±3 compression? |
| Monte Carlo: realistic archetype builds | Pending | Test actual stat distributions (STR 80/AGG 78/STA 65/others 50) instead of uniform gaps |
| Monte Carlo: hybrid viability | Pending | Does balanced +1-across-the-board compete against specialists? |
| Full archetype triangle | Pending | Only Counter>Brawler and Turtle>Pressure validated. Need third edge. |
| Implementation plan update | Pending | Add exhaustion, between-round recovery, compressed modifiers to 12 TDD tasks |
| Mythic tier + salvage system | v2 | Crafted-only from salvaged Legendaries. Deferred. |
| Special trait full list | Pending | 6 examples defined. Full list to be designed during implementation. |
