# MFC Combat System Design

DnD 5e mechanics under the hood. 2D fighting game presentation on screen. Dice rolls determine everything — stats and gear shift the odds, but never guarantee outcomes.

## 1. Core Combat Resolution

Every attack resolves as a d20 roll.

```
d20 + attacker_STR_modifier >= defender_AC
```

- **Hit:** Roll succeeds. Roll damage dice for the attack type + STR modifier.
- **Miss:** Roll fails. No damage. Defender might counter (driven by Fight IQ).
- **Natural 20:** Auto-hit regardless of AC. Critical hit — double damage dice (not modifiers). The swing moment.
- **Natural 1:** Auto-miss regardless of modifiers. Even the best fighter whiffs sometimes.

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
modifier = (stat - 50) / 10
```

Range: -5 (stat 0) to +5 (stat 100). A stat of 50 = +0 modifier (average).

### Stat Roles

| Stat | Modifier Range | Combat Role |
|------|---------------|-------------|
| **Strength (STR)** | -5 to +5 | Added to attack rolls AND damage rolls. Hitting power + accuracy. |
| **Speed (SPD)** | -5 to +5 | Initiative order + action rate. Fast fighters get more turns. Added to dodge checks. |
| **Defense (DEF)** | AC 5-15 | Sets Armor Class: `10 + (DEF - 50) / 10`. Higher = harder to hit. |
| **Stamina (STA)** | Pool 0-100 | Stamina pool: `50 + (STA - 50)`. Governs dodges, blocks, combos before exhaustion. |
| **Fight IQ (FIQ)** | Multi-purpose | Reaction chance, crit range expansion, decision quality (see below). |
| **Aggression (AGG)** | Behavioral | Action selection weights, forward pressure, risk/reward tradeoff. |

### Fight IQ Breakdown

Fight IQ is the "intelligence" stat. It controls three things:

1. **Reaction chance:** `15% + (FIQ - 50) / 100 * 25%`. Range 2.5%-40%. How often the fighter triggers dodge/block.
2. **Crit range expansion:** FIQ >= 80 expands crit range to 19-20. Smart fighters exploit openings.
3. **Decision quality:** Higher FIQ = smarter action selection. Prioritizes combos when opponent is stunned, blocks when low HP, dodges power shots. Modeled as a bonus to AI decision scoring.

### Aggression Breakdown

Aggression controls fighting style, not raw power:

- **Action weights:** High AGG = more hooks, uppercuts, roundhouses, combos. Low AGG = more jabs, blocks, movement.
- **Pressure:** `AGG / 100` controls forward movement bias and clinch initiation.
- **Risk/reward tradeoff:** Aggressive fighters deal more damage but take more too (fewer defensive reactions).

### Design Principle

No stat is a dump stat. Every point matters somewhere. Specialization creates distinct fighting styles:
- High STR / Low SPD = brawler (hits like a truck, slow)
- High FIQ / High SPD = counter-fighter (reads you, punishes mistakes)
- High AGG / High STA = pressure fighter (relentless, wears you down)
- High DEF / High FIQ = turtle (hard to hit, waits for the perfect counter)

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

### Gear Rules

- **Account-bound.** Gear belongs to your account, not a fighter.
- **Freely transferable** between your own fighters. Equip/unequip at will.
- **Not tradeable** between players. Everyone earns their own gear.
- **Mythic tier (v2).** Crafted-only from salvaged Legendaries. Not a random drop. Deferred to v2 with salvage system.

### Pity Counters

Per-account, not per-fighter. Training any fighter advances the counter.

- **Superior+ pity:** Guaranteed Superior or better every 10 sessions.
- **Legendary pity:** Guaranteed Legendary every 50 sessions (~10 days at 5 sessions/day).

## 4. Training Loop & Loot Economy

### Training Sessions

The core idle loop. Queue a session, it runs, collect stat XP + one loot roll.

- **Model:** Baseball 9-style idle training (targeted stat training with resource costs, quick sessions, visible progress). Deep-dive on exact mechanics pending — will spec the session types, durations, and XP curves against the Baseball 9 model before implementation.
- **Session types** target different stats (e.g., "Sparring" for STR/AGG, "Circuit Training" for SPD/STA, "Film Study" for FIQ/DEF).
- **Two outputs per session:** Stat XP (incremental gains to raw stats) + one loot roll (gear drop chance).
- **Sessions cost credits.** This is the primary credit sink.

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

### Stamina System

Stamina is the fight's pacing engine. It prevents spam and creates tactical depth.

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

### Comeback Mechanics

The losing fighter gets tools. This creates late-fight volatility that keeps the prediction market interesting.

| Mechanic | Trigger | Effect | Reference |
|----------|---------|--------|-----------|
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
