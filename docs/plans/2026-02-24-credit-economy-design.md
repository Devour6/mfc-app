# MFC Credit Economy Design

**Author:** Itachi (Head of Product)
**Date:** 2026-02-24
**Status:** LOCKED — Human economy. Agent trading economy is V2 (separate doc).
**Dependencies:** V13 combat system (LOCKED), betting experience framework (endorsed), training system design (needs V13 stat update)

**All numbers in this document are configuration variables and will be tuned based on real user data post-launch.**

---

## Design Principle

Credits are a value driver, not friction. Every credit spent either creates a bet (exchange) or creates content that others bet on (metagame). The economy exists to fund the flywheel: betting → ownership → training → fights → betting.

**Revenue philosophy:** MFC makes money when users are having fun. Every dollar MFC earns, the user got something they wanted. Losers don't pay fees. Metagame spending is gameplay, not a tax. MFC is visibly not betting against you.

**Recirculation target: 40-45%.** For every dollar users spend in the ecosystem, $0.40-0.45 comes back through purses, soft currency, milestones, and bonuses. MFC retains 55-60%. This is comparable to poker rooms (40-60%) and Betfair (45-55%), and appropriate for a platform where users ARE the content.

---

## Strategic Context

- **Real money.** Credits are backed by real currency (fiat or crypto). Users deposit, trade, and withdraw.
- **Non-US launch.** Geo-block US users. Licensed exchange under Malta MGA Type 3 or Isle of Man Betting Exchange license. Jurisdiction TBD pending gaming lawyer consultation.
- **Tiered trading fees.** Flat 2% fee on Local fights (buy/sell only). Profit-based 5% fee on upper-tier fights. Fee structure is a progression reward.
- **No play money.** The emotional arc of the betting experience requires real stakes. Play money kills tension, satisfaction, and retention.
- **Minimum deposit:** $10 (credit card), $5 (crypto).
- **No withdrawal fee.** Free withdrawals. The hold incentive is "there's another fight in 2 minutes," not a fee.

---

## How Money Flows

Two economic loops connected by a single hard currency, plus a soft currency subsidy.

**Loop 1: The Exchange (betting)**
- Users buy/sell binary outcome contracts on fight results
- Contracts trade $0.01-$0.99, settle at $1.00 (winner) or $0.00 (loser)
- Trading fee varies by fight tier (see Tiered Trading Fees below)
- Settlement is zero-sum between users. MFC takes no directional risk.

**Loop 2: The Metagame (ownership)**
- Users train fighters (hard currency), acquire gear (loot drops), enter fights (hard or soft currency)
- Training costs go to MFC as revenue (always hard currency)
- Agent League income provides soft currency redeemable for fight entry fees only
- Metagame spending creates content (trained fighters) that drives Loop 1 volume
- Winning fights in Human League earns purse credits (hard currency)

**The flywheel:**
```
Deposit → Bet on fights → Win → Spend on training/fighters
    → Fighter creates fights → Others bet on those fights
    → Trading fees + metagame costs = MFC revenue
    → Withdraw winnings (free)
```

---

## Contract Structure

| Parameter | Value |
|-----------|-------|
| Contract type | Binary outcome (YES/NO on fight winner) |
| Price range | $0.01 - $0.99 |
| Settlement | $1.00 (winner) or $0.00 (loser) |
| YES + NO | Always = $1.00 |
| Minimum trade | 1 contract ($0.01 - $0.99) |
| Maximum position | Per-side, per fight, varies by tier. No simultaneous YES+NO on same fight. |

---

## Tiered Trading Fees

Fee structure varies by fight tier. This is a progression reward: higher tiers offer better fee economics for skilled traders.

### Local Fights — 2% Flat Fee

Charged on every buy and sell order. **No fee on settlement.** Simple, predictable.

| User Type | Trades/Fight | Effective Rake on Profit |
|-----------|-------------|------------------------|
| Gut (buy, hold, settle) | 1 (buy only, settle free) | ~2% |
| Informed (buy, sell pre-settle) | 2 | ~6-8% |
| Expert (active trading) | 4-8 | ~10-13% |

Active traders at Local are incentivized to move up to upper tiers where profit-based fees reward their volume.

### Upper-Tier Fights (Regional/Grand/Invitational) — 5% on Profit

Charged only on net profit per fight. Losers pay $0 in fees.

| User Type | Effective Rake |
|-----------|---------------|
| All (regardless of activity) | 5% on net winnings |
| Losing bets | $0 |

### Comparable Benchmarks

| Platform | Fee Model | Effective Rake |
|----------|-----------|---------------|
| Betfair | 2-5% of net winnings | 2-5% |
| Polymarket | 2% on profit | ~2% |
| Kalshi | $0.01-$0.07 per contract | ~2-7% |
| **MFC Local** | **2% flat on buy/sell** | **~2-13% depending on activity** |
| **MFC Upper** | **5% on profit** | **5% (losers pay $0)** |

---

## Fight Tiers

Fighter stat tier determines fight tier. Tier advancement is a "level up" moment — a milestone worth celebrating.

**Design note for team:** The tier unlock moment is a key UX opportunity. When a fighter crosses from Local to Regional, the user should feel the achievement. Visual, audio, and social signals should mark this transition.

| Tier | Fighter Stats | Entry Fee | Pool (2 fighters) | Rake | Winner Gets | MFC Take | Position Limit |
|------|--------------|-----------|-------------------|------|-------------|----------|---------------|
| **Local** | +0/+1 (stat 50-79) | $5 | $10 | 10% | $9.00 | $1.00 | $100 |
| **Regional** | +2 (stat 80-94) | $25 | $50 | 7.5% | $46.25 | $3.75 | $250 |
| **Grand** | +3 (stat 95+) | $100 | $200 | 5% | $190.00 | $10.00 | $500 |
| **Invitational** | Top 16 by record | $500 | $1,000 | 3% | $970.00 | $30.00 | $1,000 |

**Position limits are per-side.** A user can hold up to $100 in YES contracts OR up to $100 in NO contracts on a Local fight. Users cannot hold both YES and NO on the same fight (prevents wash trading).

### Break-Even Win Rates (purse economics only)

| Tier | Break-Even WR | Notes |
|------|--------------|-------|
| Local | 55.6% | Poker tournament standard |
| Regional | 54.1% | Slightly more generous |
| Grand | 52.6% | Elite tier, fair split |
| Invitational | 51.5% | Whale-friendly. Near coin-flip break-even. |

Descending rake: 10 → 7.5 → 5 → 3. Every tier up, the house takes less.

### Agent League (not a Human League tier)

| Parameter | Value |
|-----------|-------|
| Entry fee | Free |
| Purse | None (soft currency income instead) |
| Betting | V2 (agent trading economy — separate design) |
| Purpose | Content engine, training ground, soft currency generation |
| Fights per fighter per day | Up to 24 (one per hour) |

---

## Agent League Income (Soft Currency)

Fighters competing in Agent League earn soft currency for their owner. Soft currency can ONLY be spent on fight entry fees — not training, not fighter creation, not withdrawal. Training always costs hard currency.

### Income by Fighter Tier

| Fighter Tier | Win Income | Loss Income | Avg at 55% WR (24 fights/day) |
|---|---|---|---|
| +0 (untrained) | $0.00 | $0.00 | $0.00 — must train to earn |
| +1 (stat 65) | $0.15 | $0.08 | $2.30/day |
| +2 (stat 80) | $0.30 | $0.15 | $4.56/day |
| +3 (stat 95) | $0.50 | $0.25 | $7.50/day |

### Caps

- **24 fights per fighter per day** (one per hour, natural pacing)
- **$15 per owner per day** (multi-fighter stables are rewarded but bounded)

### What This Buys

| Fighter Tier | Daily Soft Income | Local Entries/Day | Regional Entries/Week |
|---|---|---|---|
| +1 (single fighter) | $2.30 | ~0.5 | ~0.6 |
| +2 (single fighter) | $4.56 | ~0.9 | ~1.3 |
| +3 (single fighter) | $7.50 | 1.5 | ~2.1 |
| Dolphin (3 fighters, mix) | ~$10 (hits cap) | 2 | ~2.8 |
| Whale (8 fighters, mix) | ~$15 (hits cap) | 3 | ~4.2 |

Soft currency subsidizes a significant portion of entry fees, enabling the fight frequency needed for healthy user economics. The more you train, the more your fighter earns, the more fights you can enter.

### Return on Subsidy

Each dollar of soft currency spent on a Human League entry generates ~$2-3 in MFC trading fee revenue from bets placed on that fight. The subsidy is a content creation investment, not a cost.

---

## Training Milestone Rewards (Hard Currency)

Hard currency bonuses at tier breakpoints. The "level up" moment should feel like a payday.

| Milestone | Reward | Rationale |
|-----------|--------|-----------|
| First training session completed | $1 | Immediate reinforcement. "Train and earn." |
| +1 (stat 65) | $10 | Covers next few training sessions. Momentum into the loop. |
| +2 (stat 80) | $50 | Regional unlock + one week of training funded. Major achievement. |
| +3 (stat 95) | $200 | Grand entry funded. Establishes whale runway. Celebrates 8+ months of investment. |

Milestones are one-time per fighter. A dolphin with 3 fighters collects 3× each milestone as fighters level up.

---

## Win Streak Bonuses (Hard Currency)

Hard currency bonuses for consecutive Human League wins. Creates emotional peaks and social signals.

| Streak | Bonus | Condition |
|--------|-------|-----------|
| 3 consecutive wins | $2 | Per fighter, resets on loss, max 1/fighter/day |
| 5 consecutive wins | $10 | Per fighter, max 1/fighter/week |
| 10 consecutive wins | $50 | Rare, celebrated event |

Win streaks create stories ("My fighter is on a 7-win streak") and are visible betting signals for spectators.

---

## Fight Frequency

**Fight frequency is the master lever.** More fights per day = more purse opportunities for owners AND more betting volume for MFC. Both sides benefit.

### Recommended Fight Frequency (by tier)

| Tier | Target Fights/Day/Fighter | Rationale |
|------|--------------------------|-----------|
| Local (+0/+1) | 2 | High volume, accessible. Builds the habit. |
| Regional (+2) | 1 | Daily fight at meaningful stakes. |
| Grand (+3) | 0.7 (~5/week) | Premium events. Each fight matters. |

### Human League Cap

**3 fights per fighter per day.** Prevents one fighter from dominating the card. Ensures variety for spectators.

### Daily Fight Volume (at 1K DAU)

- ~68 Local fights/day (300 +0/+1 fighters, ~30% entering, avg 1.5 fights)
- ~20 Regional fights/day (80 +2 fighters, ~50% entering, avg 1 fight)
- ~4 Grand fights/day (20 +3 fighters, ~50% entering, avg 0.7 fights)
- **~92 Human League fights/day** generating ~$40K in betting volume

---

## Profitability by Tier (The Core Model)

This is the map that defines user experience. **50% WR = net loss (MFC revenue). 55% = inflection. 60% = meaningful profit.**

Based on recommended fight frequencies, including purses, betting edge on own fights, betting on other fights, soft currency offset, training costs, entry fees, and streak bonuses.

### Target Monthly Profit at 60% WR

| Tier | Investment to Reach | Monthly Profit (60% WR) | Feels Like |
|------|-------------------|------------------------|------------|
| +1 | $33, 4 days | **~$57/month** | "Covers a subscription" |
| +2 | $350, 39 days | **~$206/month** | "Serious side income" |
| +3 | $2,400, 245 days | **~$472/month** | "My fighter is a business" |

### Full Profitability Map

| Win Rate | +1 (2 fights/day) | +2 (1 fight/day) | +3 (5 fights/week) |
|----------|-------------------|-------------------|-------------------|
| **50%** | **-$58/mo** | **-$91/mo** | **-$228/mo** |
| 53% | -$20/mo | -$15/mo | -$50/mo |
| **55%** | **+$5/mo** | **+$58/mo** | **+$135/mo** |
| 57% | +$25/mo | +$120/mo | +$280/mo |
| **60%** | **+$57/mo** | **+$206/mo** | **+$472/mo** |

### Key Insights

- **55% WR is the break-even inflection.** Skill starts being rewarded here. About 20-30% of active owners will be at or above this level.
- **60% WR is the "worth it" line.** Every tier is meaningfully profitable. The progression from +1 → +2 → +3 is a clear economic upgrade.
- **50% WR is entertainment spending.** $58-228/month depending on tier. Users at 50% are paying for the experience (comparable to a gym + streaming budget).
- **Training is +EV when including betting edge.** The direct purse ROI is slim at +1, but the compounding value — better matchup knowledge, access to higher tiers, betting edge on own fights — makes training a positive investment for skilled players.
- **Fight frequency is the master lever.** The economics ONLY work at 1-2 fights/day per fighter. Lower fight frequency collapses user returns.

---

## Metagame Costs (Launch Values)

All prices are configuration variables. Scale-up triggers defined below.

### Training

| Stat Level | Cost/Session | Rationale |
|-----------|-------------|-----------|
| 50 (starting) | $1.00 | Accessible entry |
| 65 (+1) | $1.30 | Slight increase at first breakpoint |
| 80 (+2) | $1.60 | Meaningful but not prohibitive |
| 95 (+3) | $1.90 | Premium but the real gate is time, not money |

Formula: `cost = $1.00 × (1 + (target_stat - 50) / 50)`

Where `target_stat` is the stat being trained in that session (not the average of all stats). No specialist subsidies.

Training is always paid in **hard currency**. This is MFC's most consistent revenue stream.

**Cost to reach each tier (cumulative, single stat):**

| Tier | Sessions | Total Cost (launch) | Time |
|------|----------|-------------------|------|
| +1 (stat 65) | ~29 | **~$33** | 4 days |
| +2 (stat 80) | ~278 | **~$350** | 39 days |
| +3 (stat 95) | ~1,767 | **~$2,400** | 245 days |

### Fighter Creation

| Action | Launch Cost | Notes |
|--------|-----------|-------|
| First fighter | **Free** | Everyone starts with one |
| Additional fighters | **$10** | Low barrier to multi-fighter stables |

### Gear

| Action | Cost | Notes |
|--------|------|-------|
| Gear acquisition | **Free** (loot drop from training) | One roll per completed 4-hour session |
| Gear salvage | $0.02 / $0.10 / $0.50 / $5.00 (Std/Enh/Sup/Leg) | Recycling. Legendary still feels rewarding. |
| Gear re-roll (future) | TBD | Re-roll effect within same tier/slot. Post-launch feature. |

Salvage values are intentionally low to prevent inflation. Expected salvage per session: ~$0.07. Negligible.

---

## Scale-Up Triggers

Prices start low to build the flywheel. Raise when demand metrics justify it.

| Cost | Launch | Scale-Up Trigger | Scale-Up Value |
|------|--------|-----------------|---------------|
| Training/session | $1.00 base | Daily active fighters > 500 | $2.00 base |
| Fighter creation | $10 | Avg fighters per owner > 2 | $25 |
| Local entry | $5 | Consistent 50+ viewers per fight | $10 |
| Regional entry | $25 | Consistent 100+ viewers per fight | $50 |
| Grand entry | $100 | Consistent 200+ viewers per fight | $200 |
| Invitational entry | $500 | Consistent 500+ viewers per fight | $1,000 |
| Gear salvage | $0.02-$5.00 | Proportional to training cost increases | 2x |

**Principle:** Every price increase is a product decision based on user data, not a predetermined schedule.

---

## Faucets (Money Entering User Wallets)

### Hard Currency

| Source | Amount | Frequency | Purpose |
|--------|--------|-----------|---------|
| Deposits | Variable (min $10 CC / $5 crypto) | On demand | Primary faucet |
| Winning bets | Variable | Per fight | Zero-sum transfer |
| Welcome bonus | $5 (1x wagering req) | Once | CAC |
| Fight purses | $9-$970 by tier | Per fight win | Owner revenue |
| Daily first-bet bonus | Fee-free first trade | Daily | Engagement |
| Referral bonus | $5 per referred depositor (1x wagering req) | Once per referral | Growth |
| Deposit bonus | 10% on first deposit (1x wagering req) | Once | CAC |
| Streak bonus | 5% on deposits within 24h of last session (1x wagering req, uncapped) | Ongoing | Loyalty reward, whale incentive |
| Training milestones | $1/$10/$50/$200 | Once per fighter per milestone | Progression reward |
| Win streak bonuses | $2/$10/$50 | Per fighter streak | Emotional peaks |
| Gear salvage | $0.02-$5.00 | Per unwanted drop | Recycling |

### Soft Currency (Agent League Income)

| Source | Amount | Frequency | Redeemable For |
|--------|--------|-----------|---------------|
| Agent League win | $0.15-$0.50 (by fighter tier) | Per fight won | Entry fees only |
| Agent League loss | $0.08-$0.25 (by fighter tier) | Per fight lost | Entry fees only |

**Bonus stacking cap:** When multiple bonuses apply to a single deposit, total bonus is capped at 25% of deposit amount.

All bonuses require 1x wagering before withdrawal.

## Sinks (Money Leaving User Wallets)

| Sink | Amount | Frequency | Destination |
|------|--------|-----------|------------|
| Trading fees (Local) | 2% per buy/sell | Every trade (Local) | MFC revenue |
| Trading fees (Upper) | 5% on profit | Per winning fight (Upper) | MFC revenue |
| Losing bets | Variable | Per fight | To winners |
| Training sessions | $1.00-$1.90 | Up to 3x/day/fighter | MFC revenue (hard only) |
| Fighter creation | $10 | One-time per fighter | MFC revenue |
| Fight entry (all tiers) | $5-$500 | Per fight entry | Winner + MFC rake |
| Withdrawals | Free | On demand | Exits system |

---

## Player Lifecycle

### Day 1 — The Tourist

- Signs up. Gets $5 welcome bonus.
- Watches a fight. Places first bet ($1, Gut-level). First trade is fee-free (daily bonus).
- Fight resolves in 3.5 minutes. Experiences the full emotional arc.
- **5-8 bets before welcome bonus runs out.** By then, the loop is familiar.
- **First deposit trigger:** "I'm out of credits and the next fight starts in 2 minutes."
- **Expected first deposit:** $10-$20.

### Week 1 — The Engaged User

- Deposited $20-$50 total. Betting $2-$10 per fight on Local.
- Moving from Gut to Informed. Recognizing fighter archetypes.
- **Ownership hook fires:** Sees a fighter they follow. Creates their own for $10. Starts training at $1/session.
- Agent enters first Agent League fight. Owner sees $0.15 soft income appear. "My fighter earned something while I was away."
- Completes first training milestone: $1 bonus. Positive reinforcement.
- **Session pattern:** 15-30 min, 3-5 fights, 2-3 bets per session.
- **Weekly spend:** $15-$40 (betting losses + training).

### Month 1 — The Minnow

- Fighter hits +1. **Milestone bonus: $10.** Tier unlock moment.
- Entering Local Human League fights (2/day), Agent League generating ~$2.30/day soft.
- Soft income covers ~50% of Local entry fees. The rest from hard currency.
- Starting to bet on own fights with edge from matchup knowledge.
- May own 2 fighters.
- At 55% WR: roughly break-even. At 60% WR: **+$57/month**.
- At 50% WR: **-$58/month** (affordable entertainment, $2/day).

### Month 3 — The Dolphin

- 2-3 fighters. Lead fighter hits +2. **Milestone bonus: $50.** Regional unlocked.
- **Tier unlock moment:** New competition, profit-based fees (5% on wins only), bigger purses ($46.25 vs $9.00).
- Active Informed bettor. Knows matchups across both Local and Regional.
- Agent League soft income: ~$10/day (hits cap with 3 fighters). Covers significant portion of entries.
- Fighting 1x/day at Regional, sometimes Local on other fighters.
- At 55% WR: **+$58/month**. At 60% WR: **+$206/month**.
- At 50% WR: **-$91/month** (training + entries exceed purses).

### Month 6+ — The Whale

- 5-8 fighters across tiers. One approaching +3. **Milestone bonus: $200 at +3.**
- Active Expert trader. Profit-based fees at Regional+ reward trading volume.
- **Grand unlock.** First +3 fighter. 5% rake. $190 purses. $500 position limits.
- Agent League soft income: $15/day (hits cap). Covers most entry fees.
- Fighting across multiple tiers. Betting with deep matchup knowledge across a large stable.
- At 55% WR: **+$135/month**. At 60% WR: **+$472/month**.
- At 50% WR: **-$228/month**, but fighter assets worth $2,000-$10,000+.
- **The whale's real ROI:** Betting edge from deep knowledge + fighter asset appreciation (marketplace, V2).

---

## Purchase, Hold, Spend, Top-Up Hooks

### Purchase (why deposit)

1. **The 2-minute clock.** Next fight in 2 minutes, zero balance. Deposit flow must be < 30 seconds.
2. **First fighter.** $10 to own a fighter after 3 days of betting. The upgrade from spectator to owner.
3. **Deposit bonus.** First deposit: 10% bonus (1x wagering). Funded from marketing budget.
4. **Tier unlock.** Your fighter just hit +2. Regional fights available. Entry is $25 but purse is $46.25. You need capital.

### Hold (why keep credits in system)

1. **Next fight in 3 minutes.** Always another bet. Why withdraw now?
2. **Training queue.** Credits committed to queued sessions. Can't withdraw committed credits.
3. **Free withdrawals, but...** the pull is content, not friction.
4. **Bankroll framing.** Display as "bankroll" not "balance." Serious traders maintain a float.

### Spend (why invest in metagame)

1. **Your fighter = your edge.** You trained it. You know its matchups. You bet with conviction.
2. **Fighter identity = social capital.** A named +2 with a win streak is a public figure others bet on.
3. **Loot chase.** Every training session = gear roll. The Legendary drop that reshapes matchups.
4. **Tier progression.** Training unlocks higher tiers with better economics (bigger purses, fairer fees, higher position limits).
5. **Milestone paydays.** $10 at +1, $50 at +2, $200 at +3. The investment pays back at each breakpoint.

### Top-Up (why deposit more when low)

1. **"Just one more fight."** 3.5-minute loop creates urgency. You just lost. You know the matchup.
2. **Training paused.** Fighter stopped training — progress bar frozen. Every hour wasted.
3. **Big fight tomorrow.** Grand card announced. Need entry + betting capital.
4. **Streak bonus.** Deposit within 24h of last session → 5% bonus (1x wagering). Rewards consistency.

---

## Key Ratios and Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Welcome bonus bets | 5-8 before first deposit | Hook before paywall |
| Time to first deposit | Day 1-3 | Maintain momentum |
| Day 1 session length | 15-20 min (4-5 fights) | Learn then leave, come back tomorrow |
| Weekly active sessions | 5-7 (daily habit) | 5-min micro-sessions compound |
| Monthly depositor retention | 60%+ at Month 2 | Above industry avg (40-50%) |
| Recirculation rate | 40-45% | Value returned to users / user spend |
| Revenue split (trading:metagame) | 50:50 at launch → 70:30 at scale | Trading dominant as volume grows |
| Credit velocity | Full cycle every 2-3 days | Credits moving = engaged users |
| Break-even WR (Local) | 55.6% | Achievable. ~20-30% of owners. |
| 60% WR profitability | $57/$206/$472 by tier | The "worth it" line |
| Human League fights/day (1K DAU) | ~90 | Sufficient fight volume for healthy economics |

---

## Revenue Model

### At 1,000 DAU (launch phase)

User mix: 600 spectators, 300 minnows, 80 dolphins, 20 whales. ~92 Human League fights/day.

| Source | Calculation | Daily Revenue |
|--------|------------|--------------|
| Trading fees (Local, 2% flat) | ~68 fights × ~$300 volume/fight × 2% | **$408** |
| Trading fees (Upper, 5% profit) | ~24 fights × ~$600 volume, 5% on ~$150 profit/fight | **$180** |
| Training | 200 owners × 2 sessions/day × $1.40 avg | **$560** |
| Fighter creation | 5 new fighters/day × $10 | **$50** |
| Fight entry rake (Local) | 68 fights × $10 pool × 10% | **$68** |
| Fight entry rake (Regional) | 20 fights × $50 pool × 7.5% | **$75** |
| Fight entry rake (Grand) | 4 fights × $200 pool × 5% | **$40** |
| **Gross** | | **~$1,381/day** |
| Soft currency subsidy | ~$300/day | **-$300** |
| Bonuses + milestones | ~$150/day | **-$150** |
| Gear salvage (faucet, not revenue) | ~$28/day | **-$28** |
| **Net revenue** | | **~$903/day (~$27K/month)** |

**Revenue per DAU: ~$27/month.** Comparable to sports betting apps ($15-30/month).

### Scale Projections

| DAU | Monthly Net | Notes |
|-----|-----------|-------|
| 1K | ~$27K | Launch. Metagame-heavy (~50% of gross). |
| 10K | ~$270-330K | Trading fees become dominant. Liquidity flywheel. |
| 50K | ~$1.5-2.5M | Grand + Invitational active. Whale density increases. |
| 100K | ~$4-7M | Superlinear trading. Agent economy (V2) adds 30-50%. |

---

## V2 Roadmap (Post-Launch)

These features are designed into the architecture but not built at launch:

| Feature | Revenue Impact | Design Status |
|---------|---------------|--------------|
| **Agent trading economy** | Potentially largest single revenue stream. 24/7 automated trading volume. | Separate design doc — after human economy locks. |
| **Fighter marketplace** | 5-10% transaction fee. Asset liquidity + speculative market. | Needs market dynamics design. |
| **Tournaments (brackets)** | Higher combined entry + more fights = more betting volume. | Tournament engine exists in codebase. |
| **Concurrent fights** | 3-4 simultaneous fights. 3x+ content throughput. | UX design needed. |
| **Seasonal circuit** | 8-12 week seasons with playoffs. Urgency + narrative. | Needs championship + reputation system. |
| **Content licensing (B2B)** | License fight data to third-party sportsbooks. | Long-term. |
| **Volume discount tiers** | Reduced fees for high-volume traders. | Post-launch when data warrants. |
| **Gear re-roll** | New sink. Re-roll effect within same tier/slot. | Needs gear balance from Shikamaru. |
| **Stable reputation system** | Public records + win rates. Whale social currency. | Complements marketplace. |

---

## Responsible Gambling

Required for Malta MGA Type 3 or Isle of Man Betting Exchange license. Not optional.

Design deferred to licensing phase (gated on gaming lawyer consultation), but the following must be built:

- Deposit limits (daily/weekly/monthly, user-configurable)
- Loss limits (per session, per day)
- Session timers (optional alerts at configurable intervals)
- Self-exclusion (temporary 24h/7d/30d and permanent)
- Cool-off periods (mandatory delay on limit increases)
- Reality checks (periodic pop-ups showing session duration + net P&L)

Budget for ~5-10% revenue reduction from responsible gambling controls.

---

## Open Items (Gated on External Inputs)

| Item | Gated On | Notes |
|------|----------|-------|
| Credit denomination (USD/USDC/SOL/custom token) | Gaming lawyer | Affects deposit/withdrawal UX |
| Exact withdrawal mechanism | Gaming lawyer + jurisdiction | Crypto wallet vs bank transfer vs both |
| KYC/AML requirements | Licensing jurisdiction | Affects onboarding friction |
| Deposit/withdrawal limits | Licensing jurisdiction | Regulatory caps |
| Agent League betting mechanics | V2 agent economy design | Separate doc |
| Gear re-roll pricing | Shikamaru's gear sim | Needs final gear balance |
| Fighter marketplace fees | V2 marketplace design | Transaction fee %, listing mechanics |

---

## What Changed From Previous Assumptions

| Before | After | Why |
|--------|-------|-----|
| Play money (no cash out) | Real money with withdrawal | Play money kills the experience |
| US launch | Non-US first, US later | Regulatory risk |
| 2% flat fee on all trades | Tiered: 2% flat (Local), 5% profit (Upper) | Progression reward |
| Fee on settlement | No settlement fee | Double-dipping |
| 70/30 purse split all tiers | Descending rake: 10/7.5/5/3% | Higher tiers = fairer split |
| $2 Human League entry | $5/$25/$100/$500 by tier | Tiered championships |
| $5/session training | $1/session (launch) | Lower barrier |
| $50 fighter creation | $10 (launch) | Encourage stables |
| avg(stats) training formula | target_stat formula | No specialist subsidies |
| Gear salvage $0.20-$20 | $0.02-$5.00 | Prevent inflation |
| Withdrawal fee 1% | Free | Not extractive |
| "Training pays for itself at +2" | Profitability map: 55% WR = inflection, 60% = meaningful profit | Honest math |
| No soft currency | Agent League soft (entry fees only, $15/owner/day cap) | Fight frequency enabler |
| 10 Agent League fights/day | 24/day (one per hour) | More soft = more entries = more content |
| No milestone rewards | $1/$10/$50/$200 at training breakpoints | Level-up moments |
| No win streak bonuses | $2/$10/$50 for 3/5/10 streaks | Emotional peaks |
| $5/day soft cap | $15/day soft cap | Enables healthy fight frequency |
| No bonus stacking cap | 25% cap when multiple bonuses apply | Prevents over-subsidized first deposits |
| No fight frequency model | 2/day Local, 1/day Regional, 5/week Grand | Master lever for user economics |
| $100 position limit all tiers | $100/$250/$500/$1,000 by tier | Whales bet bigger at higher tiers |
| No recirculation target | 40-45% target | Comparable to poker/Betfair |
| $10 CC / $5 crypto min deposit | Confirmed | Payment processing floor |
| No position limit rules | Per-side, no simultaneous YES+NO | Prevents wash trading |
