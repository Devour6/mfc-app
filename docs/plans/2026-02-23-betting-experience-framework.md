# Betting Experience Framework — How We Think About This System

This is not a spec. It's the mental model the team uses to evaluate every betting-related decision. Read this before designing, building, or reviewing anything that touches the exchange.

---

## What "Betting Experience" Means in MFC

The betting experience is not the trading panel. It's not the order book. It's not the FTUE onboarding flow. It's the entire emotional arc from "what is this?" to "I check MFC every day."

**The betting experience is everything the user feels between seeing a fight and seeing their P&L.**

That includes: discovering MFC, watching a fight, forming an opinion, placing a trade, sweating the outcome, winning or losing, deciding to go again. Every screen, every animation, every notification, every number on the screen is part of the betting experience.

If a feature doesn't affect how a user FEELS about betting on MFC, it doesn't belong in this framework.

---

## Why MFC Is Not Polymarket, Kalshi, or DraftKings

Before designing anything, the team needs to internalize what makes MFC structurally different from existing prediction markets and sportsbooks. These differences are not cosmetic — they change the fundamental design of the betting experience.

| | Polymarket / Kalshi | DraftKings / FanDuel | **MFC** |
|---|---|---|---|
| **Event duration** | Days to months | 2-3 hours | **3-5 minutes** |
| **Events per day** | Dozens | Dozens (seasonal) | **Hundreds (Agent League runs 24/7)** |
| **Live trading** | Rare (most markets are slow-moving) | Limited (in-play betting) | **Core mechanic — price moves every second during a fight** |
| **Information source** | News, polls, analysis | Player stats, injuries, weather | **Game mechanics you can learn. Proc rates you can calculate.** |
| **Skill expression** | Political/financial knowledge | Sports knowledge | **System mastery — the game IS the edge** |
| **Ownership** | None | Fantasy rosters (no real stakes) | **You own a fighter. You control when it fights, who it fights, and how it trains.** |
| **Content generation** | External (elections, earnings) | External (real sports) | **Internal — MFC generates its own content 24/7** |

**The three structural advantages:**

1. **Speed.** A Polymarket position takes days to resolve. An MFC bet resolves in 3 minutes. Faster cycles = more dopamine loops per session. More sessions per day. More chances to feel smart (or get revenge).

2. **Learnability.** Polymarket edges come from knowing politics. DraftKings edges come from knowing sports. MFC edges come from knowing the GAME SYSTEM — and the game system is documented, deterministic, and masterable. A new user who studies archetype matchups for 30 minutes has a real edge over someone who didn't. That's not true of politics or sports.

3. **Ownership feedback loop.** No prediction market lets you own the thing you're betting on. In MFC, you control when your fighter enters the ring, who they fight, what to train, and how to gear up. Stats, gear, and condition are public — every bettor can study them. But you're the one who made the decisions that shaped those numbers. The ownership edge isn't secret information — it's conviction born from agency. You know your fighter better than anyone because you built it.

---

## The Two Betting Modes

MFC has two distinct betting experiences running in parallel. They serve different psychological needs and should be designed differently.

### Spectator Betting (the exchange)

The user watches a fight and trades contracts on the outcome. This is the primary revenue driver.

**Psychological profile:** "I see something happening. I think I know what comes next. I want to act on that belief."

**Key emotions:** Anticipation (pre-fight analysis), excitement (live price movement), tension (sweating the outcome), satisfaction/frustration (settlement).

**Design goal:** Minimize the time between "I have an opinion" and "I have a position." Every second of friction between forming a belief and acting on it is lost revenue.

### Owner Betting (the metagame)

The user's fighter enters a fight. The user bets on their own fighter (or hedges against it). This is the retention driver.

**Psychological profile:** "I built this. I know what it can do. I'm betting on my own work."

**Key emotions:** Pride (my fighter is fighting), anxiety (what if they lose?), vindication (my training strategy paid off), investment (I need to train harder for next time).

**Design goal:** Make the user feel like their metagame decisions (training, gear, matchup selection) directly caused the fight outcome. The line between "I bet well" and "I built well" should blur.

---

## The Betting Skill Gradient

This is the core design challenge. MFC must simultaneously serve three skill levels without boring the advanced user or overwhelming the beginner.

| Level | What they know | How they bet | What they feel |
|-------|---------------|-------------|---------------|
| **Gut** | "Red fighter looks strong" | Picks a side, buys at market price | Fun, simple, social |
| **Informed** | Archetype matchup, recent form, condition | Reads odds, waits for value, sizes positions | Engaged, analytical, competitive |
| **Expert** | Proc rates, stamina curves, gear interactions, modifier math | Calculates true probability, trades inefficiencies, hedges positions | Mastery, flow, edge-seeking |

**The critical design question:** How do we make Gut bettors feel like they're having fun while Informed bettors feel like they have an edge while Expert bettors feel like they're playing a deep game? All watching the same fight. All trading on the same order book.

**The answer is information layering.** The same fight displays different information at different depths:
- Gut bettor sees: two fighters, health bars, a price, green/red.
- Informed bettor sees: archetype badges, stat comparison, condition indicator, recent form.
- Expert bettor sees: proc probability estimates, stamina curves, modifier breakdowns, historical matchup data.

Each layer is opt-in. The UI doesn't force depth — it rewards curiosity. The user who taps into the stat comparison feels smarter. The user who studies the proc rates IS smarter. That competence progression is addictive.

---

## The Five Tensions

Every betting experience decision involves trade-offs. These are the five tensions the team should explicitly navigate. When in doubt, refer back to these.

### 1. Speed vs. Deliberation

Fast betting cycles (3-minute fights, instant settlement) create dopamine loops. But speed can also create mindlessness — "I'm just clicking buttons." The experience should feel fast but not thoughtless.

**Guideline:** Pre-fight should encourage analysis (show the matchup data, give time to study). In-fight should encourage instinct (price is moving NOW, act fast). Post-fight should encourage reflection (show what happened, what you got right/wrong). Different tempos for different phases.

### 2. Accessibility vs. Depth

pump.fun simplicity on the surface, deep game mechanics underneath. But too simple = boring for returning users. Too deep = intimidating for new users.

**Guideline:** Layer 0 should be achievable in 30 seconds with zero prior knowledge. Layer 3 should take weeks to master. Never force a user up a layer — let them pull. The UI should whisper "there's more here" without shouting "you need to learn this."

### 3. Winning vs. Losing

Users need to win enough to feel competent. But the house edge (exchange fees) means the average user loses over time. If losing feels bad, users churn. If losing doesn't sting, winning doesn't matter.

**Guideline:** Celebrate wins loudly. Contextualize losses gently. "You lost 50 credits on this fight, but you're up 200 this session." Frame P&L at the session level, not the trade level. Give the user a reason to believe their next bet will be smarter — "Counter's CP only fired twice. Rare. You read the matchup right, the variance didn't go your way."

### 4. Scarcity vs. Generosity

Credits need to feel valuable (scarcity drives purchase behavior). But if credits are too scarce, users can't bet enough to get hooked (generosity drives activation).

**Guideline:** Be generous at the top of the funnel (starting credits, daily rewards, first-win bonus). Be scarce at the bottom (large positions, high-tier fights, multi-fighter ownership). The first 10 bets should be essentially free. The 100th bet should cost real money.

### 5. Individual vs. Social

Betting alone is functional. Betting with friends is viral. But forced social features feel desperate.

**Guideline:** Make betting outcomes shareable without making sharing required. "I called the Overcharge KO" is a clip someone WANTS to share. Leaderboards, trade history, win streaks — these are social objects that create FOMO and competition without requiring a friends list.

---

## What Needs to Be True

Before we spec any feature, it should pass these filters:

1. **Does it make the user want to place another bet?** Not "does it help them place a bet" — does it make them WANT to? The difference is emotional, not functional.

2. **Does it work at all three skill levels?** A feature that only serves Expert bettors is a niche tool. A feature that only serves Gut bettors is shallow. The best features have depth but don't require it.

3. **Does it use MFC's structural advantages?** Speed, learnability, ownership. If a feature could exist unchanged on Polymarket, we're not leveraging what makes MFC different.

4. **Does it create a story the user tells themselves?** "I saw the CP proc and bought before the price moved." "I knew Turtle would grind Counter out because I studied Grinding Guard." "My fighter won because I invested in Legendary gear." Stories are retention.

5. **Can an agent make it better?** Not "can an agent do this instead of a human" — but "does agent participation make the human experience better?" Agents providing real-time analysis, managing fighter prep, surfacing non-obvious matchup data. The agent is the expert bettor's co-pilot.

---

## Open Questions (Pre-Spec)

These need answers before we write the full betting experience spec. Some are product decisions (mine), some need Jeff, some need data.

| Question | Owner | Why It Matters |
|----------|-------|---------------|
| What's the minimum bet size? | Itachi + Jeff | Determines how many bets a new user can place with starting credits. Too high = 3 bets and done. Too low = no stakes feeling. |
| What's the fee structure? (spread, commission, or both?) | Jeff | Exchange economics. Affects house edge, user P&L perception, and whether we make money. |
| Do we show estimated probability or just price? | Itachi | "67 cents" vs "67% chance." One feels like trading, the other feels like betting. Different audiences respond differently. |
| How do we handle settlement UX for live trades? | Itachi + Mina | A user who bought at 60 cents and the price is now 45 — do they see unrealized P&L during the fight? Can they sell before settlement? This is the difference between binary options and a real exchange. |
| What's the session cadence we're designing for? | Itachi | 5-minute micro-sessions (bet on one fight)? 30-minute lean-back sessions (watch and trade multiple fights)? 2-hour grind sessions (Agent League marathon)? The answer shapes everything. |
| Do bettors see each other? | Jeff | Anonymous order book? Visible positions? Chat? The social layer affects whether MFC feels like a trading floor or a sportsbook lobby. |
| How do we handle losing streaks? | Itachi | The user who loses 5 in a row needs a reason to come back. Free credits? "Insurance" mechanic? Or just let them feel the loss? This is the most important retention question. |

---

## Next Steps

1. **Jeff answers the open questions** that need his input (fee structure, social visibility, session cadence).
2. **I answer my open questions** and draft initial positions on bet sizing, settlement UX, and losing streak handling.
3. **Credit economy numbers get defined** — these are inputs to the betting experience, not outputs of it. How many credits the user has determines how the experience FEELS.
4. **Full betting experience spec** gets written with the framework above as the evaluation rubric. Every feature gets scored against the five tensions and the five filters.

This framework is a living doc. As we learn from the Monte Carlo results (V12 proc mechanics change what bettors can predict), from the FTUE implementation (Mina's flow changes what users experience first), and from Jeff's business decisions (fee structure, social layer), the framework evolves.

But the core question never changes: **does this make the user want to place another bet?**
