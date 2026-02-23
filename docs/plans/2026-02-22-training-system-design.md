# MFC Training System Design

Every mechanic in this system exists to create a better human betting experience. Training builds fighter identity. Fighter identity creates matchup narratives. Matchup narratives create informed disagreement. Disagreement creates market volume. That's the chain — if any link breaks, go back and fix it.

## 1. Core Principle: Style Over Power

Training creates build diversity, not raw power advantage. Fighters specialize into archetypes along a continuous spectrum. The d20 combat system produces asymmetric matchup advantages from stat interactions — no hardcoded type system.

**Three archetype landmarks** (vocabulary for bettors, not coded mechanics):

| Archetype | Primary Stats | d20 Combat Identity |
|-----------|--------------|-------------------|
| **Pressure** | STR, AGG, STA | High attack modifier, aggressive action selection (hooks, uppercuts, combos), stamina to sustain output. Volume + power. |
| **Counter** | FIQ, SPD, DEF | High reaction chance (35-40%), expanded crit range (19-20), high AC, fast initiative. Waits, reads, punishes. |
| **Turtle** | DEF, STA, FIQ | Highest AC, massive stamina pool, frequent blocks. Takes little damage, outlasts you, wins on decision. |

**Monte Carlo validated matchup dynamics (V5d, 10,000 fights per matchup):**
- Counter beats Brawler: 90/10 (hard counter)
- Turtle edges Pressure: 58/42 (soft counter)
- Slight advantage (60v50): 74/26 upset rate
- Clear advantage (80v50): 97/3 upset rate (3% = 33x longshot bet)

Hybrids are viable — balanced builds have no terrible matchups but no dominant ones. Specialization creates bigger swings, which is what the prediction market needs.

**No pay-to-win.** Credits buy speed-to-cap and optionality (more fighters with different builds). They don't buy unbounded stat advantage. The economic ceiling from exponential costs makes +3 modifiers practically rare, not purchasable.

## 2. Stat Budget & Breakpoints

V5d modifier formula: `round((stat - 50) / 15)`, range ±3.

| Stat Value | Modifier | Breakpoint Label |
|-----------|---------|-----------------|
| 5-20 | -3 to -2 | Dump stat |
| 35 | -1 | Below average |
| 50 | 0 | Starting (all fighters begin here) |
| 65 | +1 | Trained |
| 80 | +2 | Specialized |
| 95 | +3 | Maxed |

Modifier only changes at breakpoints (50, 65, 80, 95). Training from 65→79 produces no mechanical change — you need 80 for the +2 modifier. This makes the last few points before a breakpoint the most valuable, creating natural decision points for agents.

**No hard stat cap.** Build diversity comes from exponential training costs. Pushing one stat to +3 takes so long that you're sacrificing months of progress in other stats. The opportunity cost IS the cap.

## 3. Training Sessions

### Session Types

Each session targets 2 stats. Primary stat receives 70% of XP, secondary receives 30%.

| Session | Primary Stat | Secondary Stat | Bettor Signal |
|---------|-------------|---------------|---------------|
| **Heavy Bag** | STR | AGG | "Building power — Pressure direction" |
| **Sparring** | FIQ | DEF | "Sharpening reads — Counter direction" |
| **Roadwork** | STA | SPD | "Building endurance — Turtle / late-round play" |
| **Film Study** | FIQ | AGG | "Studying opponents — tactical aggression" |
| **Strength & Conditioning** | STR | STA | "Power endurance — Pressure that doesn't fade" |
| **Speed Drills** | SPD | DEF | "Evasion training — Counter that doesn't get caught" |

Six types. Each stat appears in 2 sessions as primary and 2 as secondary. No stat is orphaned. The 2-stat pairing forces agents to think in archetypes — pure single-stat training isn't available, so builds have natural secondary characteristics.

### Session Duration

**4 hours per session.**

- Creates 3x/day agent check-in cadence (queue → collect → re-queue)
- Long enough that training is a visible commitment (bettors see "5 Heavy Bag sessions this week")
- Short enough that agents can adapt to meta shifts within a day

### XP Per Session

- Primary stat: 150 XP per session
- Secondary stat: 65 XP per session

### XP Curve (Exponential)

Formula: `xp_required(level) = 100 × 1.12^(level - 50)`

| From → To | XP Required | Cumulative from 50 | Sessions (primary) | Real Time |
|-----------|------------|--------------------|--------------------|-----------|
| 50 → 51 | 100 | 100 | 1 | 4 hours |
| 60 → 61 | 305 | 2,140 | ~14 total | ~2.5 days |
| **64 → 65 (+1)** | 465 | 4,380 | **~29 total** | **~4 days** |
| 70 → 71 | 815 | 10,850 | ~72 total | ~12 days |
| 75 → 76 | 1,425 | 23,200 | ~155 total | ~26 days |
| **79 → 80 (+2)** | 2,165 | 41,700 | **~278 total** | **~39 days** |
| 85 → 86 | 3,790 | 84,600 | ~564 total | ~78 days |
| 90 → 91 | 6,630 | 162,500 | ~1,083 total | ~150 days |
| **94 → 95 (+3)** | 10,100 | 265,000 | **~1,767 total** | **~245 days** |

**What this means:**
- **+1 modifier (~4 days):** Fast, satisfying. New fighters have a readable build within a week. Bettors can identify direction early.
- **+2 modifier (~39 days):** Serious commitment. This IS the fighter's identity. Pivoting away means the time spent is opportunity cost. Crossing +2 is a milestone event — bettors reprice the fighter.
- **+3 modifier (~245 days):** Rare. A +3 stat is a statement. Everyone in the market knows this fighter is maxed. Creates star fighters with identities bettors recognize and follow across months.

### Credit Cost Per Session

Formula: `cost = 100 × (1 + (avg_target_stats - 50) / 50)`

| Stat Level | Cost Per Session |
|-----------|-----------------|
| 50 (starting) | 100 credits |
| 65 (+1) | 130 credits |
| 80 (+2) | 160 credits |
| 95 (+3) | 190 credits |

Credits buy the right to train. The real bottleneck is time, not money. This means credits buy speed (more fighters training in parallel) and optionality (multiple builds), not a bypass on progression.

### Gear Loot Roll

One roll per completed 4-hour session. Drop rates per existing spec:

| Rarity | Drop Rate | Pity Counter |
|--------|----------|-------------|
| Standard (White) | 65% | — |
| Enhanced (Blue) | 25% | — |
| Superior (Purple) | 8% | Guaranteed every 20 sessions |
| Legendary (Orange) | 2% | Guaranteed every 100 sessions |

Gear loot is the "bonus" that keeps sessions satisfying even when stat gains are small at high levels. At stat 90+, the XP per session barely moves the needle — but the gear roll still feels good.

## 4. Agent League as Form Guide

Training feeds Agent League fights. Agent League data feeds Human League bets. This is the information cascade that makes the prediction market work.

```
Training sessions → Fighter builds develop
         ↓
Agent League fights (24/7, high volume, low stakes)
         ↓
Fight results become PUBLIC DATA
         ↓
Human bettors study Agent League records as form guide
         ↓
Human League fights (fewer, higher stakes, event-style)
         ↓
Humans bet against humans using Agent League intelligence
```

### Agent League Fight Cadence

Between training sessions, agents enter fighters in Agent League bouts:
- 4-hour training session completes
- Agent enters fighter in 1-2 Agent League fights
- Agent queues next training session
- ~6-12 Agent League fights per fighter per day

This produces enough data for bettors to analyze trends within a week.

### What Human Bettors See

| Data Point | What It Tells the Bettor |
|-----------|------------------------|
| Win/loss record | General fighter quality |
| Record by matchup type | Build effectiveness against specific archetypes |
| Recent training log | Build trajectory and potential style shifts |
| Finish method distribution | Finisher vs points fighter |
| Round distribution | Early-round power vs late-round endurance |
| Stat breakpoint milestones | Power level shifts worth repricing |

**Informed bettors** study Agent League data, spot trends, build models. **Casual bettors** go on vibes and streaks. Both think they're right. That disagreement is market volume.

### Separation of Leagues

- **Agent League:** research layer. High volume, always running, agents fight agents. Data is public. Not directly bet on in v1.
- **Human League:** betting layer. Fewer fights, higher stakes, event-style. Humans bet against humans, informed by Agent League data.
- **Agent-to-agent betting:** deferred to v2.

## 5. Owner vs Agent Decision Space

Owner decides WHAT (strategy). Agent decides HOW (operations).

| Decision | Who | Why |
|----------|-----|-----|
| Fighter build direction ("I want a Pressure fighter") | Owner | Strategic bet on the meta. Owner's money, owner's vision. |
| Which sessions to queue (Heavy Bag vs S&C) | Agent | Operational. Agent knows XP math and breakpoints. |
| When to fight in Agent League | Agent | Agent reads matchmaking pool and picks favorable timing. |
| When to enter Human League | Owner | High stakes. Owner decides when the fighter is ready. |
| Credit allocation (training budget vs betting budget) | Owner | Portfolio decision. Training is investment, betting is trading. |
| How to split training across stats | Agent | Agent optimizes toward owner's build direction. |
| Whether to pivot builds | Owner | Major strategic shift. |
| Gear equip decisions | Agent | Agent knows stat math. Owner can override. |
| Which fighter to train (if multi-fighter) | Agent | Agent rotates based on upcoming fights and diminishing returns. |

### Owner Interface

1. Set build direction (preset: Pressure / Counter / Turtle / Balanced / Custom sliders)
2. Set weekly credit budget for training
3. Approve Human League fight entries
4. Review agent's training report

### Agent Interface (API)

1. Read fighter stats and current build direction
2. Query session types and costs
3. Queue training sessions
4. Enter/withdraw from Agent League fights
5. Equip/swap gear
6. Report progress to owner

### The Idle Experience

Owner checks in once a day and sees: "Your agent ran 6 training sessions, entered 4 Agent League fights (3-1), STR went from 72→74, on track to hit +2 breakpoint in ~8 days." Set direction, let the agent work, check results, adjust.

## 6. Condition System

Three states. Simple enough for bettors to read at a glance.

| Condition | Modifier | Visual | Betting Signal |
|-----------|---------|--------|---------------|
| **Fresh** | +1 to all modifiers | Green glow | "Coming off rest — expect peak performance" |
| **Normal** | 0 | No indicator | Baseline |
| **Tired** | -1 to all modifiers | Yellow tint | "Heavy schedule — might underperform" |

### How Condition Moves

- **Each fight** (Agent or Human League): condition drops one level
- **Training sessions:** no condition change (training doesn't cause fight fatigue)
- **Rest** (no fights for 8 hours): condition improves one level
- Max: Fresh. Min: Tired. Cannot go further in either direction.

### The Agent's Scheduling Dilemma

More Agent League fights = more data = better form guide. But too many fights = Tired going into a Human League bout. The agent must manage fight scheduling to peak condition for the main event.

### Why This Creates Better Bets

Condition is public. Before a Human League fight:
- Fighter A: Fresh (rested, +1 all modifiers)
- Fighter B: Tired (3 recent fights, -1 all modifiers)

Some bettors think condition is decisive. Others think the stat gap overrides it. Disagreement. Volume.

## 7. Build Pivots (No Stat Resets)

Owners can change build direction. Trained stats are never lost — you just start training new ones. The opportunity cost of abandoned training IS the switching cost.

**What a pivot looks like:**
1. Owner sets new direction (Pressure → Counter)
2. Agent stops Heavy Bag / S&C, starts Sparring / Speed Drills
3. STR 80 (+2) stays forever. Doesn't decay.
4. FIQ and DEF start climbing from current levels
5. Over 2-4 weeks, the fighter transitions through an ambiguous hybrid phase
6. Eventually the new stats catch up and the build identity shifts

**Why no stat reset:** Instant respec would let agents pivot overnight, killing fighter identity. Bettors couldn't track builds because they'd change between fights. The "known Pressure fighter" narrative — the thing bettors use to form opinions — would die.

**The transition period is the most interesting betting window.** A fighter mid-pivot is hard to read. Agent League results will be inconsistent. Bettors who detect the pivot early have alpha. Bettors who miss it misprice the fighter.

## 8. v2 Deferred Items

| Item | Why Deferred |
|------|-------------|
| Agent-to-agent betting | Complex market mechanics, need v1 Human League working first |
| 3v3 team battles | Requires team composition mechanics, build synergies |
| Fighter aging / retirement | Adds long-term meta dynamics but not needed for core loop |
| Stat decay over time | May add forced rebuilding — evaluate after v1 data |
| Training facility upgrades | Idle game mechanic (Idleon-style) — evaluate if core loop needs more depth |
| Matchmaking algorithm | Needed but separate design doc |

## Open Items

| Item | Status | Dependency |
|------|--------|-----------|
| Combat system design doc update with V5d constants | Needs doing | Kakashi's V5d Monte Carlo results |
| Implementation plan update (add exhaustion, between-round recovery, compressed modifiers) | Needs doing | V5d constants |
| Monte Carlo validation of full archetype triangle (all 3 corners) | Needs doing | Only Counter>Brawler and Turtle>Pressure validated |
| Credit economy model (training spend vs betting spend vs earning rate) | Needs doing | Informs credit pricing |
| Agent League matchmaking design | Separate doc | Affects fight frequency and data quality |
