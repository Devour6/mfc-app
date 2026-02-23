# V12 Combat Calibration — Counter Puncher Redesign + Gear Tier Rework

Response to 6 iterations (V6-V11) of incremental fixes that failed to close the archetype triangle. V12 is a structural redesign of the two remaining broken systems: Counter Puncher and gear scaling. Both follow the same principle: **MFC is a betting product, not a stat-check simulator. Replace reliable compounding with exciting variance.**

> **V12 (2026-02-23):** 2 structural changes + 2 reverts. Counter Puncher becomes a proc-based high-risk/high-reward technique. Gear gets a 4-tier alternating power/excitement progression with proc effects at Enhanced and Legendary. Turtle stats revert to V10 (SPD 50, FIQ 65). Counter-strike removed.

## Design Principle

Every version from V6-V11 tried to fix broken mechanics by tuning flat bonuses: stamina costs, cooldowns, reaction percentages, fractional damage, stat swaps. Every flat bonus either compounded into dominance or was absorbed into noise. The lesson: **flat bonuses that apply every tick/hit/block are inherently hard to balance in a system with 80+ interactions per fight.**

Proc-based mechanics don't compound. A 20% proc fires ~6 times in 30 opportunities regardless of fight length, tempo, or stat allocation. The expected value is stable. The variance is the feature — it creates the betting moments that ARE the product.

**Design rule for V12+:** Any mechanic that applies per-hit, per-tick, or per-block should be scrutinized for compounding. Prefer proc-based triggers with defined frequency and high per-trigger impact over flat bonuses with low per-trigger impact and unlimited frequency.

---

## What 6 Iterations Proved

| Version | Change | T→C | P→T | Key Learning |
|---------|--------|------|------|-------------|
| V6 | Baseline techniques | 10% | — | CP is free unblockable offense |
| V7 | CP stamina cost + block reaction | 8% | — | Stamina costs are noise at 3% of budget |
| V8 | CP cooldown + IG 35% vs CP | 8% | — | CP is 8% of damage now — but tempo is the real problem |
| V9 | Counter-strike (1d4 on block) | 14.3% | 56.0% | Archetype-blind — hurt P→T |
| V10 | Diminishing AR + conditional CS | 16.7% | 58.9% | Even slope=0 leaves 16.5% raw gap |
| V11 | Turtle SPD 65 (stat swap) | 23.8% | 49.9% | Fixed T→C partially, broke P→T |

**The pattern:** Every fix that helped T→C either hurt P→T or wasn't enough. The root cause is Counter Puncher itself — reliable auto-fire offense that scales with fight length. No amount of Turtle defense can overcome guaranteed, compounding damage.

**V12 approach:** Don't nerf CP's output. Change its NATURE. Make it unreliable, explosive, and risky. Counter's identity becomes "the volatile fighter" — high ceiling, low floor. The triangle emerges because Turtle neutralizes CP variance while Pressure gets punished by it.

---

## Change 1: Counter Puncher Redesign — "The Gambler's Technique"

### V6-V11 Counter Puncher (retired)
- Fires on every successful dodge
- Auto-hit, 1d4 + SPD_mod damage
- 3 stamina cost, 2-tick cooldown, subject to block reaction
- Result: ~15 triggers/fight, ~48 damage. Reliable. Dominant. Boring for bettors.

### V12 Counter Puncher
- **Trigger:** On successful dodge, roll d20
- **Proc (17-20, 20% chance):** Counter Punch fires — **2d8 + SPD_mod** damage, auto-hit, bypasses block reaction
  - Average damage per proc: 11 (SPD_mod +2)
  - This is a BIG hit. Regular strikes average ~7. A CP proc is a 57% damage spike.
- **Miss (1-16, 80% chance):** Dodge succeeds normally. Counter pays **2 stamina** (overextension — the commitment to counter-punch costs energy even when it doesn't connect)
- **No cooldown.** The proc chance IS the rate limit.
- **No block reaction on proc.** When CP fires, it hits. This is the reward for the gamble.

### Per-Fight Math

With ~30 dodge attempts per fight (FIQ 80 reaction on ~100 incoming attacks at ~30% reaction rate):

| Outcome | Count | Damage Dealt | Stamina Cost |
|---------|-------|-------------|-------------|
| CP Proc (20%) | ~6 | 6 × 11 = **66 dmg** | 0 |
| CP Miss (80%) | ~24 | 0 | 24 × 2 = **48 stam** |
| **Total** | 30 | **66 dmg** | **48 stam** |

Counter's STA 50 gives a pool of ~50 (with Deep Lungs: 65 if STA 65, but Counter has STA 50 so base 50). Base regen ~0.5/tick × ~5400 ticks (3 rounds) = ~2700 regen over the fight. The 48 stam drain from CP misses is ~1.8% of total budget. That's small.

**Wait — that's the same "noise" problem from V7.** Let me recalibrate.

The 48 stam is per-fight total, but it's CONCENTRATED — it drains during dodge sequences when Counter is being attacked. If Counter faces a flurry of 8 attacks in 20 ticks, that's ~2.4 dodges → ~1.9 misses → 3.8 stam in 20 ticks. Regen in 20 ticks: ~10. So the miss penalty is absorbed by regen during normal play.

**For the miss penalty to matter, it needs to be higher.** Revised:

- **Miss penalty: 4 stamina** (not 2)
- 24 misses × 4 = **96 stam drain** per fight
- That's 96 vs ~2700 regen = 3.6% of total budget. Still not fight-ending.

The miss penalty alone won't gas Counter out. But combined with Grinding Guard (Turtle drains 2 stam/block) and regular stamina costs from attacking, it creates CUMULATIVE pressure. The miss penalty is one of three stamina drains Counter faces against Turtle:

1. CP miss: 4 stam × 24 = 96
2. Grinding Guard: 2 stam × ~25 blocks = 50
3. Regular action costs: varies

Against Pressure (no Grinding Guard), CP miss penalty is the ONLY extra drain. Counter's stamina is healthier → Counter stays in the fight longer → CP procs accumulate.

Against Turtle (Grinding Guard + CP miss), Counter faces double drain → gasses faster → fewer total actions → fewer dodge opportunities → fewer CP procs.

**This is the triangle mechanism:** Turtle punishes CP variance from BOTH sides (Iron Guard blocks procs, Grinding Guard + miss penalty drain stamina). Pressure only faces CP's upside.

### Revised V12 Counter Puncher

| | Value |
|---|---|
| **Proc chance** | 20% per dodge (d20: 17+) |
| **Proc damage** | 2d8 + SPD_mod (avg 11). Auto-hit. Unblockable. |
| **Miss penalty** | 4 stamina drain |
| **Cooldown** | None |
| **Block reaction** | None (proc bypasses blocks) |
| **Stamina cost on proc** | 0 (the reward is free) |

### How This Fixes the Triangle

**Turtle > Counter (target: 60-70%):**
- CP procs ~6 times for ~66 damage. Significant but not overwhelming (11% of 600 HP).
- CP misses drain 96 stamina. Combined with Grinding Guard (50 stam), Counter faces 146 stam in extra drains.
- Turtle's Iron Guard still reduces regular attack damage. Counter's tempo advantage (SPD 80 vs Turtle SPD 50) generates more total strikes, but each strike is mitigated by high DEF + Iron Guard.
- **Key mechanic:** Counter's high action rate now HURTS it against Turtle. More attacks into Iron Guard = more Grinding Guard drain. More dodges = more CP miss penalties. Turtle's passive defense converts Counter's aggression into Counter's resource drain.
- **The betting story:** "Will Counter's CP procs hit hard enough before Counter runs out of gas? Watch the stamina bar." Some fights Counter gets 10 procs and wins. Others get 3 and gas out in R2. Variance = drama.

**Counter > Pressure (target: 60-70%):**
- CP procs ~6 times for ~66 damage against Pressure's low DEF (50). Pressure has ~15% block reaction — maybe 1 proc gets reduced. ~60 effective CP damage.
- CP misses drain 96 stamina, but Pressure has no Grinding Guard. Counter's only extra drain is CP misses.
- Relentless (Pressure's AGG 80 technique) recovers 2 stam/hit — but that's Pressure's own stamina recovery, doesn't help Counter.
- **Key mechanic:** Counter's CP procs create burst damage that Pressure can't mitigate (low DEF, low reaction). When CP runs hot, Counter blows Pressure away. When CP runs cold, Counter's STR 50 base damage isn't enough to outpace Pressure's STR 80 + Devastating Blow.
- **The betting story:** "Classic volatile matchup. If CP fires 8+ times, Counter takes it. Under 4, Pressure grinds Counter down."

**Pressure > Turtle (target: 60-70%):**
- CP is irrelevant (Pressure doesn't have it).
- Pressure wins through raw damage: STR 80 + Devastating Blow + Relentless sustain.
- Turtle's Iron Guard reduces damage per hit, Grinding Guard drains Pressure's stamina. But Relentless recovery (2 stam/hit) partially cancels Grinding Guard drain (2 stam/block). Pressure stays stamina-neutral against Turtle.
- Pressure's per-hit damage is ~40% higher than Turtle's (STR 80 vs STR 50). Over a full fight with ~70 Pressure strikes, that's ~200+ more damage dealt.
- **Key mechanic:** This is the "power vs defense" matchup. Pure stat check with known edge. Pressure's quality beats Turtle's quantity. Predictable for bettors — the triangle edge they can trust.

### What This Removes

**Retired from V8-V11:**
- ~~Counter Puncher 3 stamina cost~~ → replaced by miss penalty (4 stam on the 80% miss)
- ~~Counter Puncher 2-tick cooldown~~ → replaced by proc chance (20% natural rate limit)
- ~~Iron Guard 35% reaction vs CP~~ → CP procs bypass blocks entirely. Iron Guard's value is on REGULAR attacks and Grinding Guard drain, not blocking CP.
- ~~Counter-strike (Iron Guard 1d4 on block)~~ → removed. Turtle's win condition is attrition (resource drain), not counter-damage. Counter-strike was a band-aid for reliable CP; proc-based CP doesn't need it.

**Retained:**
- Iron Guard block reduction doubled: unchanged
- Grinding Guard (2 stam drain/block): unchanged — critical for Turtle's attrition win condition
- All other techniques: unchanged

---

## Change 2: Turtle Stat Revert

### V12 Turtle (reverted to V10)

| Stat | V11 | V12 | Why |
|------|-----|-----|-----|
| DEF | 80 | 80 | — |
| STA | 80 | 80 | — |
| FIQ | 50 | **65** | Restores Ring Sense (+5% reaction) |
| SPD | 65 | **50** | Removes Quick Feet. Fixes P→T (Turtle no longer out-tempos Pressure). |

V11 gave Turtle SPD 65 to fix tempo parity with Counter. But proc-based CP eliminates the need for tempo parity — Turtle now beats Counter through resource drain, not tempo matching. Reverting SPD to 50 restores the P→T edge (Pressure and Turtle have identical SPD, Pressure wins on damage quality).

**Turtle's FIQ 65 restores Ring Sense (+5% reaction).** This gives Turtle ~25% base reaction instead of ~20%. Against Counter's regular attacks (not CP procs, which bypass blocks), Turtle reacts more often → blocks more → Grinding Guard drains more stamina → faster attrition.

### Updated Archetype Stat Table

| Archetype | Primary | Secondary | Tertiary | STR | SPD | DEF | STA | FIQ | AGG |
|-----------|---------|-----------|----------|-----|-----|-----|-----|-----|-----|
| **Pressure** | STR 80 | AGG 80 | STA 65 | 80 | 50 | 50 | 65 | 50 | 80 |
| **Turtle** | DEF 80 | STA 80 | **FIQ 65** | 50 | **50** | 80 | 80 | **65** | 50 |
| **Counter** | FIQ 80 | SPD 80 | DEF 65 | 50 | 80 | 65 | 50 | 80 | 50 |

**Tier 1 traits:**

| Archetype | Tertiary Stat | Tier 1 Trait |
|-----------|--------------|-------------|
| Pressure | STA 65 | Deep Lungs (+15 stamina pool) |
| Turtle | FIQ 65 | Ring Sense (+5% reaction) |
| Counter | DEF 65 | Thick Skin (+1 AC) |

### Removed: Counter-Strike

Iron Guard counter-strike (1d4 on block, conditional on faster attacker) is removed. It was introduced in V9 as a band-aid to give Turtle offensive output against Counter's tempo advantage. With proc-based CP:

- Turtle doesn't need counter-strike damage. Turtle wins by making Counter exhaust itself.
- Counter-strike was archetype-blind in V9 (hurt P→T). The conditional fix in V10 helped but added complexity.
- Removing it simplifies Iron Guard to its core identity: block reduction doubled + Grinding Guard (stamina drain).

**Iron Guard (DEF 80) in V12:**
1. Block reduction doubled: `DEF_mod + 2d6` (unchanged)
2. Grinding Guard: drain 2 attacker stamina per Iron Guard block (unchanged)
3. ~~Counter-strike~~ — removed

---

## Change 3: Gear Tier Rework — Alternating Power/Excitement

### Problem

6 iterations of gear tuning (V7 through V11) couldn't bring Legendary below 75% win rate. The root cause: flat per-hit bonuses compound with fight length. +0.5 damage/hit × 85 hits = +42 bonus damage = 7% of HP bar from a single gear slot. This is a stat-check, not a betting signal.

### Design: Alternating Tiers

Inspired by Diablo/WoW legendary design: power comes from unique EFFECTS, not bigger numbers. Applied to MFC's 4-tier system with an alternating pattern that keeps every tier upgrade exciting:

| Tier | Base Damage Bonus | Proc Effect | What the user feels |
|------|------------------|-------------|-------------------|
| **Standard** | +0.15/hit | None | "Small edge. Learning the system." |
| **Enhanced** | +0.15/hit (same as Standard) | **Minor proc** | "My gear DOES something!" — the retention hook |
| **Superior** | +0.35/hit (power bump) | None | "Real power spike. Worth the grind." |
| **Legendary** | +0.35/hit (same as Superior) | **Major proc** | "My fighter has a signature." |

**The pattern:** Odd tiers (Standard → Superior) increase raw power. Even tiers (Enhanced → Legendary) add proc effects without increasing base stats. Every upgrade gives something NEW — either bigger numbers or a new capability. No tier feels like "just more of the same."

**Why this fixes gear scaling:**
- Legendary base damage is +0.35/hit (same as Superior), not +0.50. At 85 hits: +29.8 damage (5.0% HP) instead of +42.5 (7.1%).
- The power gap between Superior and Legendary comes from proc effects, not flat bonuses. Procs fire 1-3 times per fight — dramatic but bounded. Expected value: +15-25 damage equivalent per fight.
- Total Legendary advantage: base (+29.8) + procs (~20) ≈ +50 damage (8.3% HP). Target: 56-62% win rate.

### 4 Gear Slots (unchanged from V11)

| Slot | Combat Effect | Std | Enh | Sup | Leg |
|------|-------------|-----|-----|-----|-----|
| **Core Module** | Bonus damage | +0.15 | +0.15 | +0.35 | +0.35 |
| **Neural Link** | Bonus reaction % | +1% | +1% | +2% | +2% |
| **Arm Augments** | Bonus attack roll | +0 | +0 | +1 | +1 |
| **Exo-Frame** | Bonus AC | +0 | +0 | +1 | +1 |

Note: Enhanced has the SAME base values as Standard. Superior has the SAME base values as Legendary. The flat bonuses only increase at Superior.

### Enhanced Proc Effects (Minor — frequent, small impact)

| Slot | Enhanced Effect | Proc Rate | Expected per Fight | Betting Signal |
|------|----------------|-----------|-------------------|---------------|
| Core Module | **"Impact"** — bonus +3 damage on this hit | 10% per hit | ~8-9 fires, +24-27 dmg | Small moments throughout |
| Neural Link | **"Alert"** — auto-react to one attack that would have hit | 1× per fight (guaranteed) | 1 extra dodge/block | "When does Alert fire?" |
| Arm Augments | **"Focus"** — first attack each round gets +2 to hit | Passive (rounds 1-3) | 3 boosted attacks | Round-start drama |
| Exo-Frame | **"Brace"** — halve damage from one hit | 1× per fight (triggers on first hit above 15 damage) | Absorbs 1 big hit | "Did Brace save them?" |

Enhanced effects are designed for lower-tier fights (Rookie, Trained). They add texture without overwhelming the base combat. A Rookie fight with Enhanced gear has something to talk about — that's content for the exchange.

### Legendary Proc Effects (Major — rare, fight-changing)

| Slot | Legendary Effect | Proc Rate | Expected per Fight | Betting Signal |
|------|-----------------|-----------|-------------------|---------------|
| Core Module | **"Overcharge"** — this power attack deals triple damage | 15% per power attack | ~1-2 fires | "OVERCHARGE! 24 DAMAGE!" |
| Neural Link | **"Sixth Sense"** — auto-dodge one hit per round that would have landed | 1× per round (3× per fight max) | 1-3 dodged hits | "Which round does Sixth Sense fire?" |
| Arm Augments | **"Precision"** — crits deal triple damage instead of double | Passive (amplifies crit%) | At 5% crit: ~4 crits → ~4 triples | "More crits = bigger swings" |
| Exo-Frame | **"Fortress"** — when HP drops below 30%, gain +3 AC for rest of fight | 0-1× per fight | Activates in ~40% of fights | Comeback mechanic — "Will the fight go late?" |

Legendary effects create broadcast-worthy moments. The commentary engine should call them out: "OVERCHARGE FROM THE RED CORNER! TRIPLE DAMAGE!" These are the clips that get shared.

### Gear Special Traits (unchanged from V11, relocated)

| Rarity | Trait | Slot | Effect |
|--------|-------|------|--------|
| Superior | Thick Plating | Exo-Frame | Block reduction +2 |
| Superior | Stabilizers | Neural Link | Dodge stamina 8→5 |
| Superior | Endurance Rig | Core Module | +15 stamina at round break |
| Legendary | Expanded Crit | Arm Augments | Crit range +1 (20→19-20) |
| Legendary | Adrenaline Surge | Core Module | HP <40%: refill stamina to 75% (1×/fight) |
| Legendary | Chain Lightning | Arm Augments | Devastating Blow rerolls re-explode (max 3) |

Note: Special traits are ADDITIONAL to slot proc effects. A Legendary Core Module has the +0.35 base damage, the "Overcharge" proc, AND potentially the "Adrenaline Surge" or "Chain Lightning" trait. Traits are a separate gear property from the slot's inherent proc. Not all legendary items have a special trait — traits are a bonus roll on gear acquisition.

### Interaction: Gear Procs + Counter Puncher Procs

Both CP and gear use proc-based mechanics. In the same fight, a Counter fighter might proc CP (20% per dodge) AND Overcharge (15% per power attack) AND Precision (passive crit amplifier). These are independent rolls — they don't interact or multiply. But they create layered betting questions:

- "Will CP fire enough to matter?"
- "What if Overcharge triggers on a CP proc?" (CP procs are auto-hit, not power attacks — Overcharge doesn't apply to CP. They're separate systems.)
- "Fortress at 30% HP could save Turtle in R3 — but does the fight go that long?"

Each proc is an independent information layer. Bettors who study gear loadouts have an edge. That's the product.

---

## What's Locked (no changes from previous versions)

| System | Value | Since | Status |
|--------|-------|-------|--------|
| Relentless (AGG 80) | 2 stam/hit recovery + finisher <40 | V7 | LOCKED |
| Grinding Guard (DEF 80) | 2 stam drain per Iron Guard block | V7 | LOCKED |
| Inexhaustible (STA 80) | Gassed@10, partial penalty 10-20 | V7 | LOCKED |
| Devastating Blow (STR 65) | Exploding dice | V6 | LOCKED |
| First Strike (SPD 65) | Guaranteed tick 0 | V6 | LOCKED |
| Diminishing AR above SPD 70 | Slope 0.010 | V10 | LOCKED |
| Iron Man (STA 95) | [1.0, 0.91, 0.82] | V8/V11 | PASSED (60.0-60.3%) |
| Devastator (STR 95) | Natural crits only, d6 | V8 | Close (49.4%) |
| Condition | ±1.5% AR, ±8 stam, ±0.08 regen | V9 | PASSED (54.2-54.7%) |
| Mind Reader (FIQ 95) | 60% reaction | V6 | See note below |

**Mind Reader note:** Previously broken at 73%+. With proc-based CP, Mind Reader's 60% reaction generates ~60 dodge attempts per fight. CP procs 20% = ~12 procs × 11 = 132 damage. BUT: 48 misses × 4 stam = 192 stam drain from CP misses alone. Mind Reader's Counter (STA 50, pool ~50) would be Gassed almost immediately. The mechanic that makes you dodge more also makes you burn stamina faster through CP miss penalties.

Expected: Mind Reader drops from 73%+ toward 58-65% as the stamina drain self-limits the proc generation. Needs Monte Carlo validation.

---

## Removed in V12

| Mechanic | Introduced | Why Removed |
|----------|-----------|-------------|
| Counter Puncher stamina cost (3/trigger) | V7 | Replaced by miss penalty (4/miss). Cost-on-success was noise. Cost-on-failure creates risk. |
| Counter Puncher 2-tick cooldown | V8 | Replaced by proc chance (20%). Proc rate is the natural rate limit. |
| Iron Guard 35% reaction vs CP | V8 | CP procs bypass blocks entirely. Iron Guard's value is Grinding Guard drain + regular attack mitigation. |
| Iron Guard counter-strike (1d4) | V9 | Band-aid for reliable CP. Turtle wins by attrition now, not counter-damage. |
| Conditional counter-strike (faster attacker only) | V10 | Removed with counter-strike. |
| Turtle SPD 65 / FIQ 50 (stat swap) | V11 | Reverted. Proc-based CP eliminates need for tempo parity. |

---

## Monte Carlo Validation Plan

### Script Changes for Kakashi

1. **Counter Puncher (complete rewrite):**
   - On successful dodge: roll d20
   - 17-20 (20%): deal `2d8 + floor((SPD-50)/15)` damage to attacker. Auto-hit. No block reaction.
   - 1-16 (80%): dodge succeeds, drain 4 stamina from Counter
   - Remove: cooldown tracking, stamina-cost-on-proc, block reaction check
   - Track per-fight: CP attempts, procs, misses, total CP damage, total stam drained

2. **Turtle build:** DEF 80, STA 80, FIQ 65, SPD 50, STR 50, AGG 50. (Reverted from V11.)
   - Tier 1: Ring Sense (FIQ 65). NOT Quick Feet.
   - Remove counter-strike from Iron Guard. Keep: doubled block reduction + Grinding Guard.

3. **Gear base values:** Standard/Enhanced = +0.15 dmg, +1% reaction, +0 attack, +0 AC. Superior/Legendary = +0.35 dmg, +2% reaction, +1 attack, +1 AC.

4. **Gear proc effects (for Sims 3a-3d):**

   **Enhanced procs:**
   - Core Module "Impact": 10% per hit, +3 bonus damage
   - Neural Link "Alert": auto-react to first hit that would have landed (1×/fight)
   - Arm Augments "Focus": first attack each round gets +2 to hit
   - Exo-Frame "Brace": halve damage from first hit above 15 damage (1×/fight)

   **Legendary procs:**
   - Core Module "Overcharge": 15% per power attack (hook/uppercut/roundhouse), triple damage
   - Neural Link "Sixth Sense": auto-dodge one landed hit per round (max 3/fight)
   - Arm Augments "Precision": crits deal triple instead of double
   - Exo-Frame "Fortress": HP < 30% → +3 AC for rest of fight

5. **Remove:** Iron Guard 35% vs CP, counter-strike, conditional CS, CP cooldown, CP stamina-on-proc

### Sims

**SIM 1: ARCHETYPE TRIANGLE (CRITICAL)**

Builds unchanged from V10 except Turtle reverted. Apply proc-based CP.

| Edge | Target | What to watch |
|------|--------|--------------|
| P→T | 60-70% | Should be similar to V10 (58.9%) since both reverted. No counter-strike to hurt P→T. |
| T→C | 60-70% | THE test. Does CP miss penalty (4 stam) + Grinding Guard drain + CP unreliability swing T→C? |
| C→P | 60-70% | CP procs should dominate vs Pressure's low DEF. Miss penalty matters less (no Grinding Guard). |

Track per matchup: CP proc count, CP miss count, CP total damage, stamina drain from CP misses, Grinding Guard total drain, fight end method (KO/TKO/Decision), rounds.

Tuning knobs:

| Knob | Up | Down |
|------|-----|------|
| CP proc rate | 20%→25%→30% | 20%→15%→10% |
| CP proc damage | 2d8→2d10→3d6 | 2d8→2d6→1d10 |
| CP miss penalty | 4→5→6 stam | 4→3→2 stam |
| Grinding Guard drain | 2→3→4/block | 2→1/block |

Priority tuning logic:
- If T→C < 50%: raise CP miss penalty to 5-6 OR raise Grinding Guard to 3/block. Counter needs to gas out faster.
- If T→C > 75%: lower CP miss penalty to 3 OR lower Grinding Guard to 1. Counter is gassing too fast.
- If C→P < 55%: raise CP proc rate to 25% OR proc damage to 2d10. CP needs to hit harder vs Pressure.
- If C→P > 75%: lower CP proc rate to 15% OR proc damage to 2d6. CP is too explosive vs Pressure.
- If P→T outside 58-72%: should be stable since no mechanics changed between P and T. If off, it's a secondary effect from Turtle revert — tune condition or Relentless.

**SIM 2: HYBRID VS SPECIALIST (CRITICAL)**

Hybrid 65 (all stats 65, all tier 1 traits). Against each specialist.

- Hybrid has Ring Sense (FIQ 65) and Quick Feet (SPD 65). Hybrid dodges trigger NO Counter Puncher (Hybrid doesn't have FIQ 80).
- vs Counter: Counter has CP procs. Hybrid has no Iron Guard → no Grinding Guard → Counter's stamina drain is only CP misses. But Hybrid also has no way to amplify Counter's CP misses. Counter should win through CP burst + tempo.
- vs Pressure: Pressure has Devastating Blow + Relentless. Hybrid has breadth but no burst. Pressure should win through damage quality.
- vs Turtle: Turtle has Iron Guard + Grinding Guard. Hybrid attacks at ~90 strikes (SPD 65 + Quick Feet). Grinding Guard drains 2/block from Hybrid. Hybrid has no stamina recovery technique. Turtle should grind Hybrid down.
- Pass: each specialist 55-65%.

**SIM 3: GEAR (HIGH)**

Run 4 sub-sims to validate the tier progression:

| Test | Setup | Target |
|------|-------|--------|
| 3a: Standard | 50 all + full Standard vs 50 all naked | 51-53% |
| 3b: Enhanced | 50 all + full Enhanced vs 50 all naked | 53-56% |
| 3c: Superior | 50 all + full Superior vs 50 all naked | 55-58% |
| 3d: Legendary | 50 all + full Legendary vs 50 all naked | 58-63% |
| 3e: Training > Legendary | Trained 80 naked vs 50 all + full Legendary | 70%+ (training > gear) |
| 3f: Legendary vs Superior | 80 all + Legendary vs 80 all + Superior | 52-56% |

Key validation: 3b should be BARELY above 3a (Enhanced adds excitement, not power). 3c should be a noticeable jump (the power tier). 3d should be close to 3c in base but with higher variance (proc effects add expected value).

Gear proc tuning knobs:

| Knob | Up | Down |
|------|-----|------|
| Impact (Enhanced CM) | 10%→15% or +3→+4 dmg | 10%→7% or +3→+2 dmg |
| Overcharge (Legendary CM) | 15%→20% or triple→quadruple | 15%→10% or triple→double |
| Sixth Sense (Legendary NL) | 1/round→2/round | 1/round→1/fight |
| Fortress (Legendary EF) | 30% HP threshold→40% | 30%→20% or +3→+2 AC |

**SIM 4: CONDITION** — Re-validate. Should be stable (no condition changes). Pass: 53-57% Fresh.

**SIM 5: CROSS-TIER** — Re-run with V12 techniques and Turtle revert. Informational.

**SIM 6: SIGNATURES (MEDIUM)**

| Signature | What to validate | Target |
|-----------|-----------------|--------|
| Mind Reader (FIQ 95) | Self-limiting via CP miss stam drain? 60 dodges × 80% miss × 4 stam = 192 drain | <68% |
| Devastator (STR 95) | Unchanged. Re-validate. | ~42-50% trigger, <65% win rate |
| Iron Man (STA 95) | Unchanged. Re-validate. | 55-62% |

Mind Reader is the key test. If it's still >68%, add explicit stamina cost per dodge for Mind Reader (2 stam/dodge at FIQ 95, representing the mental effort of 60% reaction processing). But try without first — the CP miss penalty may be enough.

---

## Summary of All V12 Changes

| System | V11 | V12 | Change Type |
|--------|-----|-----|------------|
| Counter Puncher | 3 stam, 2-tick CD, blockable, reliable fire | **20% proc, 2d8+SPD_mod, 4 stam miss penalty** | REDESIGN |
| Iron Guard vs CP | 35% reaction specifically vs CP procs | **Removed — CP procs bypass blocks** | REMOVED |
| Counter-strike | 1d4 on block, conditional on faster attacker | **Removed** | REMOVED |
| Turtle stats | DEF 80, STA 80, SPD 65, FIQ 50 | **DEF 80, STA 80, FIQ 65, SPD 50** (reverted to V10) | REVERT |
| Gear base values | Standard +0.15, Legendary +0.50 | **Standard/Enhanced +0.15, Superior/Legendary +0.35** | REWORK |
| Gear Enhanced tier | No effect | **Minor proc effects (Impact, Alert, Focus, Brace)** | NEW |
| Gear Legendary tier | Flat +0.50 damage | **Same base as Superior + major proc (Overcharge, Sixth Sense, Precision, Fortress)** | REWORK |

Everything else: unchanged from V8-V11 locked values (see Locked table above).
