# MFC Betting Experience Spec

**Author:** Itachi (Head of Product)
**Date:** 2026-02-24
**Status:** LOCKED
**Dependencies:** V13 combat (LOCKED), credit economy (LOCKED), betting framework (endorsed), Jeff's open question answers (decided)

---

## V1 Scope

**In:** Windowed trading (market orders only), 3-layer information architecture, fight-scoped chat, session P&L framing, losing streak handling, owner betting mode, onboarding progression.

**Out (V2):** Limit orders, visible order book positions, concurrent fights, agent trading on Agent League, tournament brackets, social features beyond chat.

---

## The One-Sentence Version

Watch a fight, form an opinion, trade during windows between rounds, settle in under 5 minutes.

---

## Fight Lifecycle (Bettor's View)

A single fight has 7 phases. Total duration target: **~4.5 minutes** (tunable via round duration).

```
Matchup Reveal → Pre-Fight Window → Round 1 → Repricing Window 1 → Round 2 → Repricing Window 2 → Round 3 → Settlement
     30s              30s            ~60s            15s              ~60s            15s             ~60s        instant
```

Early KO/TKO shortens the fight. If a fighter gets knocked out in Round 1, there are no repricing windows — settlement is immediate. This means pre-fight positions carry more risk in high-KO-rate matchups.

### Phase 1: Matchup Reveal (~30s)

The "NEXT FIGHT" moment. Two fighters appear. The market is NOT yet open.

**What the user sees:**
- Fighter names, sprites, archetype icons
- Stat comparison (POW/END/TEC)
- Gear tier badges
- Recent form (last 5 fights W/L)
- Archetype matchup indicator (e.g., "Pressure > Turtle")

**What the user does:** Studies the matchup. Forms an initial opinion. Chat opens — early discussion begins.

**Design note:** This is a hype window. Audio cue, visual flourish, fighter entrance. The goal is anticipation. The user should feel like they're about to witness something.

### Phase 2: Pre-Fight Trading Window (~30s)

"MARKET OPEN" indicator. The order book is live. Users can trade.

**What the user can do:**
- Buy YES (bet on Fighter A)
- Buy NO (bet on Fighter B)
- Adjust position size
- Do nothing (watch and wait for more data)

**Opening price:** Set by the MFC Designated Market Maker (a system-operated bot that participates like any other trader — see Market Model below). Based on matchup fundamentals. Not 50/50 — the market opens with an opinion.

**Why this window matters:** This is the "conviction trade." The user knows less than they will after Round 1, but the potential reward is larger because prices haven't moved yet. Gut bettors trade here. Experts might wait.

### Phase 3: Round (×3, ~60s each)

The fight is live. Price updates in real-time based on fight state. **NO TRADING.**

**What the user sees:**
- The fight (canvas, sprites, hit effects, HP bars)
- Live price updating every tick (big, visible, unavoidable)
- Unrealized P&L on their position (changing with price)
- Chat reactions in real-time

**What the user feels:** This is the tension core. The price drops 15 cents after a big hit and you can't sell. Your P&L swings and your hands are tied. You're forced to WATCH the fight instead of staring at the trade button.

**Design note:** The price display during rounds must be prominent enough to create tension but not so dominant that it distracts from the fight itself. The fight is the content. The price is the emotional amplifier.

### Phase 4: Repricing Window (×2, ~15s each)

"MARKET OPEN" flash. Between-round break. Trading reopens.

**What the user can do:**
- Add to position (double down)
- Sell position (take profit or cut loss)
- Reverse position (sell YES, buy NO — requires closing first position)
- Do nothing

**What the user sees:** New data from the round just played. Layered by skill level (see Information Architecture below).

**Why these windows matter:** This is where skill expression happens. The user has new information that wasn't available pre-fight. Each repricing window contains MORE data but represents LESS remaining fight time. Early windows reward reading momentum. The final window rewards reading who's going to win.

**Window 1 (after Round 1):** 2 rounds remain. Biggest potential price movement still ahead. Users who read Round 1 correctly and trade here have the most leverage.

**Window 2 (after Round 2):** 1 round remains. Price is closer to final value. Less variance, more predictable. This is the precision window — the user who knows the fight mechanics can estimate the final price more accurately.

### Phase 5: Settlement (instant)

Fight ends (KO, TKO, or Decision). Price snaps to $1.00 (winner) or $0.00 (loser).

**What happens:**
- All positions settle automatically
- P&L calculated: `(settlement_price - entry_price) × contracts`
- Credits credited/debited instantly
- Trading fees applied (2% flat on Local, 5% on profit for Upper)
- Session P&L updates

**What the user sees:**
- Settlement animation (price snaps, winner declared)
- Position P&L: "+$4.20" or "-$6.70" (per position)
- Session P&L: "Session: +$12.30 across 3 fights"
- Next fight teaser: matchup card for the upcoming fight with countdown

**The hook:** The session P&L and next fight teaser work together. "I'm up $12. One more fight." or "I'm down $8. I can make it back." Both create a reason to stay.

---

## Trading Mechanics (V1)

### Order Types

**V1: Market orders only.**

| Action | What it does | Cost |
|--------|-------------|------|
| Buy YES | Bet on Fighter A winning | YES price × quantity (e.g., $0.67 × 10 = $6.70) |
| Buy NO | Bet on Fighter B winning | NO price × quantity (e.g., $0.33 × 10 = $3.30) |
| Sell | Exit position at current price | Receives current price × quantity, minus fee |

- YES price + NO price = $1.00 always
- Minimum trade: 1 contract
- No limit orders from users in V1. Users trade against the MFC Designated Market Maker's resting orders (see Market Model below).

**V2: User limit orders.** Users post their own resting orders. Organic liquidity replaces the DMM. Full peer-to-peer CLOB.

### Position Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Position limit (per side) | $100 / $250 / $500 / $1,000 by fight tier | Prevents whale domination at lower tiers |
| Simultaneous YES + NO | **Prohibited** on same fight | Wash trading prevention |
| Partial exit | Allowed | Sell any portion of your position |
| Position reversal | Must close first, then open opposite | No instant flip — forces deliberate action |

### Market Model

**MFC is an event contract exchange. It matches counterparties, takes no directional risk, and never sets odds.**

For every YES contract sold, there is a NO contract on the other side. YES buyer + NO buyer = one contract created. Winners collect $1.00 per contract. Losers collect $0.00. MFC takes a fee. Zero-sum between participants.

#### V1 Liquidity: MFC Designated Market Maker (DMM)

With no user limit orders in V1, the exchange needs a liquidity provider. MFC operates a **Designated Market Maker** — a system bot that participates in the market like any other trader.

The DMM:
- Posts resting bid/ask orders on both sides of every fight, based on fight state (archetype, stats, gear, condition, HP, stamina, proc events)
- Has its own bankroll and takes its own risk (it is a market PARTICIPANT, not the exchange itself)
- Adjusts prices based on fight state AND order flow imbalance (more YES buying → YES price rises → NO becomes cheaper)
- Provides liquidity so user market orders always fill
- Earns or loses money on its positions like any other trader

**The DMM is not the house.** It's a bootstrapping mechanism. If users buy more YES than NO, the DMM holds the excess NO position and bears that risk. The DMM's pricing algorithm must be good enough to be approximately break-even over time. Its bankroll is a finite risk budget.

**Why this is not a sportsbook:** A sportsbook sets odds and takes the opposite side of every bet for profit. The DMM sets prices to ATTRACT counterparties, not to profit from directional bets. Its goal is to stay flat (equal YES and NO exposure) and earn the spread.

#### V2 Transition

As user volume grows, users post their own limit orders, providing organic liquidity. The DMM scales down its participation. At sufficient depth, the DMM withdraws entirely and the market is fully peer-to-peer.

#### Price Behavior

- **Pre-fight:** DMM posts opening prices from matchup fundamentals. Users trade against DMM orders.
- **During rounds:** DMM updates its resting orders based on fight state. Price moves in real-time. No user trading (market closed).
- **Repricing windows:** DMM posts updated prices. Users trade. If one side is oversubscribed, the DMM absorbs the imbalance — but the price has already adjusted to make the minority side more attractive. Contrarian bettors get better deals.

### Fee Application

| Tier | When fee is charged | How much | On what |
|------|-------------------|----------|---------|
| Local | Every buy and sell order | 2% flat | Trade amount |
| Upper (Regional/Grand/Invitational) | Settlement only | 5% | Net profit (losers pay $0) |

Example — Local fight:
- Buy 10 YES at $0.60 = $6.00 + $0.12 fee = $6.12 total cost
- Sell 10 YES at $0.75 = $7.50 - $0.15 fee = $7.35 received
- Net profit: $7.35 - $6.12 = $1.23

Example — Regional fight:
- Buy 10 YES at $0.60 = $6.00 (no fee on trade)
- Fight settles YES at $1.00 = $10.00 received
- Profit: $4.00. Fee: $4.00 × 5% = $0.20
- Net: $3.80

---

## Information Architecture (Skill Gradient)

The same fight displays different data at different depths. Each layer is opt-in. The UI doesn't force depth — it rewards curiosity.

### Pre-Fight (Matchup Card)

| Layer | What they see | Design surface |
|-------|-------------|---------------|
| **Gut** | Fighter names, sprites, archetype icons, current price, "Fighter A is favored" label | Main view — visible by default |
| **Informed** | + Stat bars (POW/END/TEC side by side), recent form (last 5 W/L), condition indicator, gear tier badges, archetype advantage arrow | Expandable panel below matchup card |
| **Expert** | + Exact stat numbers, gear passive names/descriptions, ability names, head-to-head history, archetype matchup win % from historical data | Deep-dive tab or modal |

### During Rounds (Live Fight)

| Layer | What they see | Design surface |
|-------|-------------|---------------|
| **Gut** | HP bars, live price (big number), green/red P&L on their position | Overlay on fight canvas |
| **Informed** | + Round score (hits landed / power shots), stamina bars, significant event callouts ("COUNTER PUNCH!") | Stats sidebar |
| **Expert** | + Proc activation indicators, stamina numbers, hit/dodge/block rates updating live, modifier states | Detailed stats panel |

### Repricing Windows (Between Rounds)

This is where information creates trading edge. The window is SHORT (15 seconds). The UI must surface the most relevant signal fast.

| Layer | What they see | Time to process | Trading implication |
|-------|-------------|----------------|-------------------|
| **Gut** | Updated price + direction arrow, round winner label, "Fighter A won that round" | 2 seconds | "Price went up, I should buy" or "Price dropped, I should sell" |
| **Informed** | + Round scorecard (hits/power/damage), stamina comparison, key event summary ("CP proc'd twice — rare"), price change from pre-round | 5-8 seconds | "Fighter B landed more power shots but spent stamina. R3 could swing." |
| **Expert** | + Proc activation log with damage impact, projected stamina for remaining rounds, cumulative hit/dodge/block rates, statistical model: "Fighters at this HP/stamina at Round N win X% historically" | 10-15 seconds | "Overcharge already fired (once-per-fight). The 12-cent price spike is overreaction. Buying." |

**Key design principle:** Each layer takes progressively more time to absorb. A 15-second window means:
- Gut bettors have plenty of time to react to the price
- Informed bettors can read the scorecard and act
- Expert bettors barely have time to process everything — they're speed-reading the proc log and making fast calls

This is intentional. The time pressure at Expert level creates its own skill expression. Knowing what to look for is as important as knowing how to read it.

### Information Layering UI Pattern

The layers are NOT tabs or modes the user selects. They're progressive disclosure:

1. **Default view** = Gut layer. Always visible. No action required.
2. **Expanded view** = Informed layer. One tap/click to expand. Stays expanded once opened (persists across windows within a fight).
3. **Deep view** = Expert layer. Second expansion or dedicated panel. Persists across sessions once discovered.

The user naturally migrates up layers as they return. First session: Gut. Third session: "What's this expand arrow?" → Informed. Tenth session: finds the proc log → Expert.

No tutorials. No "unlock Expert mode." The UI whispers "there's more here" through affordances: subtle expand indicators, slightly truncated data that implies depth, a "..." that invites a tap.

---

## Session Design

### The 5-Minute Micro-Session

Jeff's decision: design for one fight, one bet, done. Longer sessions happen by chaining.

**The loop:**
```
Open app → See matchup (already in progress or upcoming)
  → Watch + trade (one fight, ~4.5 min)
  → See P&L + next fight teaser
  → Decision: leave or stay for one more
```

**Session entry:** The app should ALWAYS show either a live fight or an imminent matchup. No "nothing happening" state. If no Human League fight is live, show Agent League as background content with "Next Human League fight in X:XX."

**Session exit:** After settlement, the next fight teaser is the retention hook. It should be compelling but not aggressive. The user who closes the app should feel satisfied, not guilted. The user who stays should feel pulled, not pushed.

### Session P&L

All P&L is framed at the **session** level, not the trade level.

- During a fight: show per-position P&L (unrealized during rounds, realized at settlement)
- After settlement: show session totals prominently
- Session = from app open to app close (or 30-minute inactivity timeout)

**Why session framing matters:** A user who loses $3 on one fight but is up $8 on the session feels fine. A user who sees "-$3" in isolation feels bad. Session framing smooths the emotional volatility of individual fight outcomes.

**Session P&L display:**
```
Session: +$12.30 (3 fights)
  Fight 1: +$4.20  ✓
  Fight 2: -$1.50  ✗
  Fight 3: +$9.60  ✓   ← current
```

### Session Cadence Targets

| User type | Session length | Fights watched | Bets placed |
|-----------|---------------|---------------|-------------|
| Casual (1/day) | 5 min | 1 | 1 |
| Regular (daily) | 15-20 min | 3-4 | 2-3 bets across 2-3 fights |
| Grinder (multi-session) | 30-60 min | 6-10 | 5-8 bets |

The app is designed for the 5-minute session. Everything else is emergent.

---

## Losing Streak Handling

Jeff's decisions applied. No free credits. No hidden bias. Respect the user's intelligence.

### Triggers

| Condition | Response |
|-----------|----------|
| 3 consecutive losing bets (session) | Session P&L highlight + "rough session" acknowledgment |
| 5 consecutive losing bets (session) | Free training session offer ("Your fighter could use some work") |
| Session P&L below -$20 | League suggestion ("Try a Local fight to rebuild") |
| 3+ consecutive losing sessions | Gentle metagame nudge ("Your fighter's matchup history might help") |

### Response Hierarchy

1. **Acknowledge** — "Tough round." Don't pretend it didn't happen.
2. **Contextualize** — Show session P&L, not just last loss. Show what went right even in a losing session ("You read the CP proc correctly — variance went the other way").
3. **Redirect to metagame** — Losses funnel into ownership: "Your fighter needs training" turns a loss into a goal. Free training session offer = immediate action the user can take.
4. **Suggest lower stakes** — If the user is at Regional+ and losing, suggest Local. Lower stakes = lower pain = more room to learn.

### What We Never Do

- Give free credits to losing users (cheapens the experience)
- Adjust fight outcomes or pricing based on user's streak (integrity violation)
- Show "you're due for a win" or any gambler's fallacy messaging
- Hide the loss or minimize it ("it's just $3!" — no, $3 is real money)

---

## Fight-Scoped Live Chat

Jeff's V1 decision: ephemeral, fight-scoped, like Twitch chat.

### Spec

| Parameter | Value |
|-----------|-------|
| Scope | Per fight. Created on matchup reveal, destroyed on settlement. |
| Persistence | None. Messages do not survive the fight. |
| Display | Username + message + timestamp. No avatars, no profiles. |
| Font | Inter (UI font). Chat is information, not spectacle. |
| Character limit | 140 characters |
| Rate limit | 1 message per 3 seconds per user |
| Moderation | None V1 (small user base). V2: basic word filter. |
| System messages | Injected on key events: "ROUND 2", "OVERCHARGE!", "KO!", "TKO!", "DECISION" |

### System Event Messages

Events from the fight engine trigger system messages in chat. These are fight-aware — they fire on significant game events, not every tick.

| Event | System message | When |
|-------|---------------|------|
| Round start | "ROUND {N}" | Each round begins |
| Proc activation | "{PROC_NAME}!" (e.g., "OVERCHARGE!") | Any proc fires |
| Knockdown | "KNOCKDOWN!" | HP drops below KO/TKO threshold check |
| KO | "KO! {WINNER} WINS!" | Fight ends by KO |
| TKO | "TKO! {WINNER} WINS!" | Fight ends by TKO |
| Decision | "DECISION — {WINNER} WINS!" | Fight goes to decision |
| Market open | "MARKET OPEN — 15s" | Repricing window opens |
| Market close | "MARKET CLOSED" | Trading window closes |

System messages use a distinct visual style (different color, no username) so they're instantly recognizable.

### Why Chat Matters for Betting

- **Social proof:** "Others are watching and trading" makes the experience feel alive
- **Information signal:** Experienced users share reads in chat. Gut bettors can learn. "Turtle's stamina is tanking, R3 is Counter's round" — that's a free Informed-level insight.
- **Emotional amplifier:** Crowd reaction to a KO makes it feel bigger than watching alone
- **Moment creation:** "I called the Overcharge KO in chat before it happened" is a story

---

## Owner Betting

Two betting modes running on the same exchange. Different emotional profiles, same trading mechanics.

### Spectator Mode (default)

The user watches a fight they have no stake in beyond their bet.

**Emotional arc:** Curiosity → opinion → bet → tension → resolution
**Edge source:** Matchup analysis, fight reading, statistical knowledge

### Owner Mode

The user's fighter is in the ring. They can bet on (or against) their own fighter.

**Emotional arc:** Pride → anxiety → conviction → tension → vindication/determination
**Edge source:** Everything in Spectator mode PLUS intimate knowledge of their fighter's training, gear, matchup history, and strategic choices

**What owners know that spectators don't:**
- What they just trained (a +1 TEC improvement that hasn't been tested in a fight yet)
- Gear choices they made and why (they equipped Impact gloves specifically for this Turtle matchup)
- Fighter condition from recent Agent League performance
- Strategic intent: they entered this fight because they believe the matchup favors them

All of this data is PUBLIC. Spectators can see stats, gear, and form. But the owner has CONTEXT — they know WHY the numbers look the way they do. That context is the ownership edge.

**Design implications:**
- Owner fights should be visually distinguished (subtle "YOUR FIGHTER" indicator)
- Pre-fight window for owner fights could include a "confidence" prompt ("How do you feel about this matchup?") that frames the betting decision as an extension of metagame choices
- Settlement for owner fights connects to the metagame loop: "Train to improve for next time" or "Your fighter's record: 7-3"

### Hedging

Owners can bet AGAINST their own fighter (buy NO on their fighter winning). This is rational when:
- They entered a fight for the purse/soft currency but think the matchup is unfavorable
- They want to guarantee some return regardless of outcome

**No restrictions on owner hedging.** This is an exchange. Hedging is a legitimate trading strategy.

---

## Onboarding Progression (Gut → Informed → Expert)

The skill gradient is not a tutorial. It's a natural migration driven by curiosity and repeated exposure.

### How Users Move Up

| Transition | Trigger | Mechanism |
|-----------|---------|-----------|
| New → Gut | First fight watched | Default view. Price + HP bars + buy button. No education needed. |
| Gut → Informed | ~3-5 fights | User taps expand arrow on matchup card. Sees stat comparison. "Oh, Pressure beats Turtle." Stays expanded. |
| Informed → Expert | ~15-20 fights | User notices proc events affecting price. Opens deep stats panel. Starts reading proc log during repricing windows. |

### Design Nudges (Not Tutorials)

- **After first win:** "You bought at $0.45 and it settled at $1.00. Fighter matchups can help you find value." (Links to expand arrow on matchup card)
- **After a proc event causes a big price swing:** "OVERCHARGE just fired. Tap here to see what that means." (One-time tooltip pointing to event log)
- **After 5 fights:** Informed layer auto-expands for one fight. If user collapses it, respect that choice. If they leave it open, it stays.

No forced tutorials. No "complete this course to unlock Expert." The user pulls information when they're ready. The UI creates small moments of curiosity.

### First-Time User Experience (FTUE)

Already partially spec'd in `SimplifiedMarketPanel` and `ContractConceptCard` components. The betting spec adds:

1. **First fight:** Simplified view. Two fighters, one price, one button. "Who wins? Pick a side." Amount pre-set to $1 (from welcome bonus).
2. **Fight plays out.** User watches with position visible.
3. **Settlement:** Clear win/loss display. "+$0.50! Nice call." or "-$1.00. Tough break."
4. **Second fight:** Full trading panel appears (still Gut layer). User sees YES/NO prices, amount chips, cost summary.
5. **Third fight onward:** Standard experience. Expand arrow visible on matchup card. User discovers Informed layer at their own pace.

---

## Position Sizing UI

### Bet Placement Flow

```
1. Pick side: YES / NO buttons (showing current price each)
2. Set amount: Quick chips (10 / 25 / 50 / 100) + custom input
3. Review: Cost summary (amount × price + fee = total)
4. Confirm: BUY button
```

The flow must complete in under 5 seconds for a returning user. Pre-fight window is 30 seconds. Repricing window is 15 seconds. Every second of friction is lost trading time.

### Amount Chips

Chip values are in **contracts**, not dollars. "10" means 10 contracts. The cost depends on the current price.

| Chip | At $0.60 YES (Local) | At $0.40 YES (Local) |
|------|---------------------|---------------------|
| 10 | $6.00 + $0.12 fee | $4.00 + $0.08 fee |
| 25 | $15.00 + $0.30 fee | $10.00 + $0.20 fee |
| 50 | $30.00 + $0.60 fee | $20.00 + $0.40 fee |
| 100 | $60.00 + $1.20 fee | $40.00 + $0.80 fee |

**Custom input:** For amounts not covered by chips. Must respect position limit for the tier.

### Cost Summary

Always visible before confirmation:

```
10 YES contracts @ $0.67
Cost:     $6.70
Fee:      $0.13 (2%)
Total:    $6.83
Win pays: $10.00 (profit: $3.17)
```

The "Win pays" line is critical. It shows the user exactly what they get if they're right. This is the dopamine line — the number they're betting on.

---

## Price Display

Jeff's decision: **price, not probability.** "67 cents" not "67% chance."

### How Price Is Shown

| Context | Display | Example |
|---------|---------|---------|
| YES/NO buttons | Cent price + direction arrow | `YES 67¢ ↑` / `NO 33¢ ↓` |
| Position P&L | Entry price vs current price | `Bought at 45¢ → Now 67¢ (+22¢/contract)` |
| Settlement | Settlement price | `Settled at $1.00` or `Settled at $0.00` |
| Order book (V2) | Bid/ask prices | `Best bid: 65¢ / Best ask: 67¢` |

### Price Movement Indicators

During rounds (when you can't trade), price movement should be VISIBLE but not actionable:

- Big, centered price display updating in real-time
- Green pulse on price increase, red pulse on price decrease
- Unrealized P&L updating alongside: "+$2.30" flickering as price moves
- Trend arrow showing direction over last 10 seconds

The price display during rounds is emotional content, not trading information. It exists to make the user feel something.

---

## Responsible Gambling Touchpoints

Integrated into the betting flow, not a separate section. These are V1 requirements for licensing.

| Touchpoint | When | What |
|-----------|------|------|
| Session timer | Every 30 minutes of continuous use | Gentle notification: "You've been playing for 30 minutes. Session P&L: +/-$X" |
| Deposit confirmation | Every deposit | "You're depositing $X. Daily limit remaining: $Y" |
| Loss limit warning | Session loss exceeds user-set limit | Trading paused. "You've reached your session loss limit. Resume tomorrow or adjust in settings." |
| Cool-off delay | User increases deposit/loss limits | 24-hour delay before new limits take effect |
| Self-exclusion | User-initiated | Immediate. Account locked for selected duration (24h/7d/30d/permanent). |

These controls are not optional and not hidden. Visible in settings. Mandatory for Malta MGA Type 3 / Isle of Man licensing.

---

## V2 Roadmap (Betting-Specific)

| Feature | What it adds | Priority |
|---------|-------------|----------|
| Limit orders | Users provide liquidity. True CLOB. Depth creates tighter spreads. | High |
| Visible order book | Show aggregate volume at each price level. Power feature for Expert bettors. | High |
| Concurrent fights | 2-3 fights simultaneously. Users split attention and capital across fights. | Medium |
| Agent League betting | Agents trade against agents on Agent League fights. 24/7 volume. Separate exchange. | High |
| Live props (micro-markets) | In-fight side bets: "Will Overcharge fire?" "KO in Round 2?" | Medium |
| Social positions | See aggregate positioning: "68% of bettors on Fighter A." Contrarian signal. | Medium |
| Trade history sharing | Shareable trade receipts: "I bought at 30¢ and it settled at $1.00." | Low |

---

## Technical Notes for Jinwoo

### Market Engine Changes

The existing market engine (`lib/market-engine.ts`) needs to be rearchitected from a price-discovery engine to an **order matching engine + DMM bot**.

**Exchange engine (matches counterparties):**
1. **Trading state:** Add `marketOpen: boolean`. `true` during pre-fight and repricing windows. `false` during rounds.
2. **Order book:** Maintain a bid/ask book. V1: only DMM posts resting orders. Users submit market orders that execute against DMM's resting orders.
3. **Window timing:** Triggered by fight engine events (round start, round end).
4. **Order execution:** When `marketOpen` is false, reject all orders ("Market closed — reopens after this round").

**DMM bot (separate from exchange):**
1. Posts resting bid/ask orders based on fight state (archetype, stats, HP, stamina, procs, momentum).
2. Updates prices during rounds (even though market is closed to users — DMM refreshes its resting orders for the next window).
3. Adjusts spread based on order flow imbalance (more YES buying → widen YES ask, tighten NO ask).
4. Has its own bankroll. Tracked separately. Operates as a market participant, not part of the exchange itself.

### Settlement Flow

1. Fight ends (KO/TKO/Decision event from fight engine)
2. Market engine sets final price ($1.00 winner / $0.00 loser)
3. All open positions settle at final price
4. Fee calculation runs (2% on trade amounts for Local, 5% on profit for Upper)
5. Credits credited/debited via credit engine (atomic transaction)
6. Bet records updated in database (status: settled, payout amount)
7. Session P&L recalculated and pushed to client

### New API Surface

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fights/[id]/market` | GET | Current market state (price, marketOpen, volume, positions) |
| `/api/fights/[id]/trade` | POST | Place market order (buy/sell YES/NO, quantity). Validates: market open, sufficient balance, within position limit. |
| `/api/fights/[id]/positions` | GET | User's positions for this fight |
| `/api/fights/[id]/chat` | GET, POST | Chat messages for this fight (scoped, ephemeral) |

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Time from matchup reveal to first bet | <30s for returning users | Friction = lost revenue |
| Bets per fight (avg across all viewers) | 1.5+ | 1 = pre-fight only. >1 = repricing windows working |
| Repricing window utilization | 40%+ of positioned users trade in at least one window | Windows are being used, not ignored |
| Session length | 5-8 min median | Micro-session design working |
| Session return rate (same day) | 30%+ | Users come back for "one more fight" |
| Gut → Informed migration | 50% of users by session 5 | Curiosity layer working |
| Informed → Expert migration | 20% of users by session 20 | Depth is rewarding |
| Session P&L visibility | 100% (all users see it) | Framing working |

---

## Open Items

| Item | Owner | Status |
|------|-------|--------|
| Round duration (target ~60s for ~4.5 min total fight) | Combat team (Shikamaru) | Needs V13 tuning pass |
| Repricing window duration (target ~15s) | Itachi + Mina | Needs UX testing. Too short = panic. Too long = boring. |
| Chat positioning in layout | Levi | Where does chat live? Sidebar? Overlay? Below fight? |
| DMM pricing algorithm | Jinwoo + Shikamaru | DMM bot needs to price fights accurately from fight state and adjust for order flow |
| Sound design for market events | Kakashi | "Market open" chime, trade confirmation sound, settlement fanfare |

---

## What Changed From Framework

| Framework assumption | Spec decision | Why |
|---------------------|--------------|-----|
| "Live trading — price moves every second" | Windowed trading. Price moves live, trading only between rounds. | Forces watching the fight. Creates tension. Prevents order-book-staring. |
| "Settlement UX" left open | Instant settlement + session P&L + next fight teaser | Speed is our advantage. Don't slow down the loop. |
| "Min bet size" left open | 1 contract at market price | Contract structure already defines minimum ($0.01-$0.99). No artificial floor needed. |
| Repricing data spec was separate deliverable | Folded into this spec (Information Architecture section) | Repricing windows are the core of the betting experience. Can't spec them separately. |
