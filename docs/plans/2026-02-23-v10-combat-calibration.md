# V10 Combat Calibration

Response to Kakashi's V9 Monte Carlo. Counter-strike moved T→C from 8% to 14.3% but was archetype-blind (hurt P→T, dropped to 56%). Core Module gear still P2W (+91 dmg over 91 hits). The structural problem is confirmed: SPD 80 gives Counter a raw 25% action rate advantage that compounds to 58% more observed strikes through stun/recovery dynamics. No per-block mechanic at reasonable damage values can overcome this.

V10 fixes the root cause.

> **V10 (2026-02-23):** 3 changes. Diminishing action rate returns above SPD 70 (structural tempo fix), conditional counter-strike (fires only vs faster attackers), Core Module damage halved. Everything else locked from V8/V9.

## The Three Changes

### Change 1: Diminishing Action Rate Returns Above SPD 70

**The root cause of every triangle failure since V6.** SPD 80 gives Counter 0.053 actions/tick vs Turtle's 0.0425. That 25% raw gap compounds through stun/recovery dynamics into 58% more observed strikes (124.7 vs 79.0). No per-block modifier can compensate.

**V10 formula:**

```
if SPD <= 70:
    action_rate = 0.025 + (SPD / 100) × 0.035          // unchanged
else:
    action_rate = 0.0495 + ((SPD - 70) / 100) × 0.010   // flattened slope
```

The slope above SPD 70 drops from 0.035 to 0.010 per 100 SPD points — a 71% reduction in marginal gain.

**Action rate table (V9 → V10):**

| SPD | V9 Action Rate | V10 Action Rate | Change |
|-----|---------------|----------------|--------|
| 50 | 0.0425 | 0.0425 | — |
| 55 | 0.0443 | 0.0443 | — |
| 60 | 0.0460 | 0.0460 | — |
| 65 | 0.0478 | 0.0478 | — |
| 70 | 0.0495 | 0.0495 | — |
| **75** | 0.0513 | **0.0500** | -2.5% |
| **80** | 0.0530 | **0.0505** | -4.7% |
| **85** | 0.0548 | **0.0510** | -6.9% |
| **90** | 0.0565 | **0.0515** | -8.8% |
| **95** | 0.0583 | **0.0520** | -10.8% |

**Key ratios:**

| Comparison | V9 | V10 |
|------------|-----|-----|
| SPD 80 vs SPD 50 (raw) | 1.25× (25%) | **1.19× (19%)** |
| SPD 80 vs SPD 65 (raw) | 1.11× (11%) | **1.06× (6%)** |
| SPD 80 vs SPD 65+Quick Feet | 1.06× (6%) | **1.01× (1%)** |

The raw action rate gap between Counter (SPD 80) and Turtle (SPD 50) drops from 25% to 19%. With compounding through stun/recovery dynamics, the observed strike gap should drop from ~58% to an estimated ~35-40%. That's the difference between "Counter outstrikes Turtle 2:1" and "Counter outstrikes Turtle 4:3."

**What this fixes simultaneously:**
- **Counter vs Turtle tempo:** Counter still acts faster, but not overwhelmingly. Combined with counter-strike and Grinding Guard, Turtle can compete.
- **Mind Reader (FIQ 95 + SPD 80):** Mind Reader's SPD 80 advantage shrinks by the same proportion. 73% win rate should drop toward 65-68%.
- **Hybrid vs Specialist:** Hybrid's SPD 65 + Quick Feet (×1.05) gives 0.0501, nearly matching Counter's 0.0505. The tempo advantage that made Counter beat Hybrid disappears — Counter needs its techniques (Counter Puncher, First Strike) to win, not raw speed.

**What this does NOT affect:**
- Fighters at SPD 70 or below: unchanged. Pressure (SPD 50), Turtle (SPD 50), and most builds are identical.
- Quick Feet (SPD 65 tier 1): still grants +5% multiplicative. Below the knee point, no change.
- First Strike (SPD 80 tier 2): unchanged — still grants guaranteed tick-0 action. First Strike's value is priority, not rate.

**Why a knee at SPD 70:**
- SPD 70 is between tier 1 (65) and tier 2 (80). The diminishing returns kick in for fighters who push SPD past the style-trait threshold toward the technique threshold.
- This means the DECISION to invest in SPD 80 (to unlock First Strike + Counter Puncher via FIQ 80) has a real cost: diminishing tempo returns. The technique is powerful, but the raw speed bonus is capped.
- SPD 65 + Quick Feet gives 0.0501, nearly identical to SPD 80's 0.0505. A fighter who stops at SPD 65 and invests elsewhere gets almost the same tempo as a SPD 80 specialist. The specialist's advantage is the TECHNIQUE (First Strike, Counter Puncher), not the raw speed. This is correct — tier 2 should reward technique access, not stat dominance.

### Change 2: Conditional Counter-Strike

**V9 problem:** Counter-strike fired on ALL Iron Guard blocks, hurting P→T (dropped from 64% to 56%). Turtle got free offense against everyone.

**V10 design:** Counter-strike only fires when the **attacker's base action rate > defender's base action rate**. "Base" means the action rate formula output for their SPD stat, before Quick Feet or gear bonuses.

**How this plays out:**

| Matchup | Attacker SPD | Turtle SPD | Fires? | Why |
|---------|-------------|-----------|--------|-----|
| Counter → Turtle | 80 (0.0505) | 50 (0.0425) | **Yes** | Counter is faster |
| Pressure → Turtle | 50 (0.0425) | 50 (0.0425) | **No** | Same speed |
| Hybrid → Turtle | 65 (0.0478) | 50 (0.0425) | **Yes** | Hybrid is faster |
| Turtle mirror | 50 (0.0425) | 50 (0.0425) | **No** | Same speed |

Counter-strike damage: **1d4** (unchanged from V9). The diminishing action rate curve does the heavy lifting — counter-strike is supplementary offense, not the primary fix.

**Why base rate, not effective rate:** Gear (Leg Rigs) and Quick Feet can modify action rate. Using base rate keeps counter-strike tied to the fighter's archetype (SPD investment), not their gear loadout. A slow fighter with Legendary Leg Rigs (+1.5% action rate) shouldn't trigger counter-strike. An SPD 80 fighter without gear should.

**Why this solves P→T:** Pressure has SPD 50 (same as Turtle). Counter-strike doesn't fire. P→T returns to roughly its V8 value (~58-64%). Relentless recovery, Devastating Blow burst damage, and base offense determine the matchup — no free counter-strike damage muddying it.

**Why this preserves T→C:** Counter has SPD 80 (base rate 0.0505 > Turtle's 0.0425). Counter-strike fires. Turtle blocks ~25 attacks, dealing ~62.5 damage via counter-strike. Combined with the reduced tempo gap (19% raw instead of 25%), Turtle can compete.

### Change 3: Core Module Damage Halved

**V9 problem:** Legendary Core Module +1.0 per hit × 91 hits = +91 bonus damage. Standard was also over target (56.0% vs 52-55%). Halving non-damage slots in V9 wasn't enough — Core Module is the primary offender.

**V10 values:**

| Slot | Combat Effect | Standard | Enhanced | Superior | Legendary |
|------|-------------|----------|----------|----------|-----------|
| **Core Module** | Bonus damage | **+0.15** | **+0.25** | **+0.35** | **+0.5** |
| Neural Link | Bonus reaction % | +1% | +1.5% | +2% | +3% |
| Arm Augments | Bonus attack roll | +0 | +0 | +1 | +1 |
| Leg Rigs | Bonus action rate % | +0.5% | +1% | +1% | +1.5% |
| Exo-Frame | Bonus AC | +0 | +0 | +1 | +1 |
| Reflex Core | Bonus stamina pool | +2 | +3 | +4 | +6 |

Only Core Module changed from V9. All other slots remain at V9 values.

**Expected impact over ~90 hits:**
- Standard: +0.15 × 90 = +13.5 total damage (2.3% HP). Win rate: ~52-53%.
- Legendary: +0.5 × 90 = +45 total damage (7.5% HP). Win rate: ~58-63%.

**Implementation note:** Fractional damage accumulator still applies (from V8). +0.15 per hit accumulates: after 7 hits, accumulator reaches 1.05, adds 1 damage, resets to 0.05. Standard gear deals +1 damage roughly every 7 hits. Visible but not dominant.

---

## Locked Systems (no changes)

| System | Value | Status |
|--------|-------|--------|
| Counter Puncher | 3 stam, 2-tick CD, blockable, 35% Iron Guard reaction | LOCKED (V8) |
| Relentless | 2 stam/hit + finisher <40 | LOCKED (V7) |
| Grinding Guard | 2 drain/block | LOCKED (V7) |
| Inexhaustible | Gassed@10, partial 10-20 | LOCKED (V7) |
| Devastating Blow | Exploding dice | LOCKED (V6) |
| First Strike | Guaranteed tick 0 | LOCKED (V6) |
| Iron Man | [1.0, 0.91, 0.82] | LOCKED (V8) |
| Devastator | Natural crits only, d6 | LOCKED (V8) |
| Condition | ±1.5% action rate, ±8 stam, ±0.08 regen | LOCKED (V9) |
| Ghost Step, Fortress, Berserker | Unchanged | LOCKED |
| Gear traits | Thick Plating, Stabilizers, etc. | LOCKED |
| All tier 1 traits | Heavy Hands, Quick Feet, etc. | LOCKED |

**Note on Quick Feet (SPD 65):** Still grants +5% multiplicative action rate. This applies AFTER the diminishing returns curve. SPD 65 + Quick Feet = 0.0478 × 1.05 = 0.0502. Nearly identical to SPD 80's 0.0505. This is intentional — see rationale in Change 1.

---

## Expected Triangle With All V10 Changes

**Pressure vs Turtle (target: Pressure 60-70%):**
- No change to action rates (both SPD 50). Counter-strike doesn't fire (same speed).
- Identical to V8 dynamics: Relentless recovery offsets Grinding Guard, Devastating Blow burst accumulates, Inexhaustible extends Turtle's window.
- Expected: P→T 58-64% (back to V8 range).

**Turtle vs Counter (target: Turtle 60-70%):**
- Counter's action rate reduced: 0.0505 (V10) vs 0.053 (V9). Raw gap: 19% (was 25%).
- Observed strike gap estimated: ~35-40% (was 58%). Counter throws ~100 strikes (was 121).
- Turtle blocks ~25 of 100. Counter-strike fires (Counter is faster): 25 × 2.5 = ~62.5 damage.
- Grinding Guard: 25 × 2 = 50 stamina drain on Counter.
- Counter Puncher fires ~13 times (fewer actions = fewer dodges). Iron Guard blocks 35% = ~4.5. 8.5 land for ~38 damage.
- Combined: Counter's total damage down ~18% from tempo reduction. Turtle's offense up ~62 damage from counter-strike. Grinding Guard still drains Counter's stamina.
- Expected: T→C 55-65%. If under 60%: raise counter-strike to 1d6.

**Counter vs Pressure (target: Counter 60-70%):**
- Counter's action rate reduced: 0.0505 (was 0.053). ~5% fewer actions.
- Counter Puncher still fires against Pressure (low DEF/FIQ). Fewer total triggers (~13 vs ~16) but still effective.
- First Strike unchanged. SPD 80 still grants priority.
- Expected: C→P 68-74%. Might need slight pull-back from V9's 76%. If still >70%: the curve is doing its job by reducing Counter's absolute dominance.

---

## V10 Technique Summary

| Stat | Technique | V9 | V10 Change |
|------|-----------|-----|-----------|
| — | **Action Rate Formula** | Linear 0.025 + SPD/100 × 0.035 | **Diminishing above SPD 70: slope drops from 0.035 to 0.010** |
| DEF 80 | Iron Guard Counter-Strike | 1d4 on every block | **Conditional: only vs faster attacker (base action rate comparison)** |
| — | Gear Core Module | +0.3/+0.5/+0.7/+1.0 | **Halved: +0.15/+0.25/+0.35/+0.5** |
| All others | — | — | *LOCKED* |

---

## Monte Carlo Validation Plan

**Script changes:**

1. **Action rate curve:** Replace `actionRate = 0.025 + (spd/100) * 0.035` with:
```
if (spd <= 70) actionRate = 0.025 + (spd/100) * 0.035
else actionRate = 0.0495 + ((spd-70)/100) * 0.010
```

2. **Conditional counter-strike:** Iron Guard counter-strike triggers only when `attackerBaseActionRate > defenderBaseActionRate`. Use formula output for raw SPD stats (no gear, no Quick Feet).

3. **Core Module:** `bonusDamage = [0.15, 0.25, 0.35, 0.5]` by rarity (was [0.3, 0.5, 0.7, 1.0]).

**Targets:**

| Sim | Test | Pass |
|-----|------|------|
| 1a | P→T | 60-70% |
| 1b | T→C | 60-70% |
| 1c | C→P | 60-70% |
| 2a | Specialist vs Hybrid (each) | 55-65% |
| 3a | Full Standard vs none | 52-55% |
| 3b | Full Legendary vs none | 58-65% |
| 3c | Trained 80 vs 50+Legendary | 70%+ |
| 3d | Legendary@80 vs plain@80 | 58-65% |
| 4a | Fresh vs Tired mirror | 53-57% |
| 6a | Mind Reader | <68% |

**Tuning knobs:**

| Knob | Turn up | Turn down |
|------|---------|-----------|
| Action rate slope above 70 | 0.010→0.015 | 0.010→0.005 |
| Action rate knee point | 70→65 | 70→75 |
| Counter-strike die | 1d4→1d6 | 1d4→1d3 |
| Core Module Legendary | 0.5→0.7 | 0.5→0.3 |
| Core Module Standard | 0.15→0.2 | 0.15→0.1 |

Priority: Sim 1 first (triangle). The diminishing action rate curve is the structural fix — if T→C doesn't move significantly with a 19% raw gap (vs 25%), the problem is deeper than tempo.
