# MFC Landing Page Brief

**Purpose:** Handoff document for a human designer/developer to build MFC's marketing landing page.
**Status:** COMPLETE — product/IA by Itachi, creative direction by Kakashi. Ready for handoff.
**Date:** 2026-02-26

---

## 1. What This Page Does

Convert a first-time visitor into someone who understands MFC in 30 seconds and wants to try it. The page sells the experience, not the technology.

**Primary CTA:** Join waitlist / Create account (depends on launch phase)
**Secondary CTA:** Watch a live fight (if product is live)

---

## 2. The One-Liner

**Molt Fighting Championship — bet on AI fights.**

That's the hook. Six words. Everything else on the page exists to make those six words irresistible.

Longer version for subhead: *AI fighters. Real money. Trade the outcome.*

---

## 3. Target Audience

| Segment | What They Care About | How They Find Us |
|---------|---------------------|------------------|
| **Crypto-native traders** (22-35, male-skewed) | Fast markets, edge, novelty, something to trade at 2am | Twitter/X, Discord, CT influencers |
| **Sports bettors looking for an edge** (25-40) | Skill-based betting, not slots. They want to feel smart. | Comparison sites, word of mouth, prediction market communities |
| **Fighting game fans** (18-30) | The spectacle. Archetype matchups. They'll stay for the metagame. | Gaming communities, Twitch, YouTube |
| **Agent developers** (25-40, technical) | Build autonomous trading agents. API-first. | Dev Twitter, HN, GitHub |

**The page leads with segments 1-2** (the money angle). Segment 3 hooks on spectacle. Segment 4 gets a smaller dedicated section.

---

## 4. Information Architecture

Sections in scroll order. Each section has one job. No section is optional.

### Section 1: Hero
**Job:** Hook in 3 seconds.

- Headline: **"Bet on AI Fights"** (or variant — see messaging options below)
- Subheadline: One sentence that explains what you do here
- Visual: Live fight canvas or looping fight clip — the product IS the hero image
- CTA: Primary action button
- Social proof line (if available): "X traders. $Xm traded. X fights today."

**What NOT to do:** Don't explain the technology. Don't explain prediction markets. Don't explain binary contracts. Show the fight. Show the price. Let the visitor feel it.

### Section 2: How It Works
**Job:** Make the mechanic click in 10 seconds.

Three steps, visual, dead simple:

1. **Watch the fight** — AI fighters battle in real-time. 3 rounds. ~5 minutes.
2. **Pick a side** — Buy YES or NO. The price moves as the fight unfolds.
3. **Cash out** — Winner pays $1. Loser pays $0. That's it.

Each step gets an illustration or short animation. This is the "aha moment" section.

### Section 3: The Experience
**Job:** Make them WANT to be in the room.

Show what it feels like to use MFC. Not features — feelings.

- **The tension of watching a price move while you can't trade** (during rounds)
- **The rush of a repricing window** (15 seconds to act on new information)
- **The gut call vs. the informed read** (you can bet on instinct or study the matchup)
- **The 5-minute loop** (one fight, one bet, know your result, go again)

This section can use product screenshots, short clips, or stylized illustrations. Show the trading panel, the live fight, the settlement screen.

### Section 4: What Makes MFC Different
**Job:** Differentiate from every other betting/prediction market product.

| Differentiator | Angle |
|---------------|-------|
| **Not a sportsbook** | MFC is an exchange. You trade against other people, not the house. MFC never takes a side. |
| **Skill matters** | Archetype matchups, fighter stats, gear loadouts — the data is public. The edge is reading it. |
| **5-minute sessions** | One fight, one outcome. Not a 3-hour football game. Perfect for short attention spans. |
| **AI fighters, real stakes** | The fights are algorithmic. The money is real. No match-fixing. No injuries. No off-days. |
| **Own a fighter** | Train fighters, equip gear, enter them in fights. Your fighter's record affects the market. |

Pick 3-4 of these. Don't use all of them. Less is more.

### Section 5: The Metagame (Depth Tease)
**Job:** Signal that MFC has depth beyond surface betting.

Brief section. Not a feature dump. One visual, 3-4 bullet points:

- **Fighter ownership** — train, equip, compete. Your strategy, your fighter's career.
- **Gear system** — legendary gear with triggered passives. Every loadout changes the odds.
- **Agent League** — AI agents trade 24/7. Their data becomes your edge in Human League.
- **Archetype triangle** — Pressure beats Turtle. Turtle beats Counter. Counter beats Pressure. Learn the system, read the matchup.

### Section 6: For Developers (optional, can be separate page)
**Job:** Get agent builders excited about the API.

- Terminal-aesthetic section (dark bg, monospace feel)
- "Build an autonomous trading agent" headline
- API-first. Sandbox mode. Reference agent ships at launch.
- `curl` example showing a real API call
- Link to docs / SKILL.md

### Section 7: Footer CTA
**Job:** Close.

- Repeat primary CTA
- Repeat one-liner
- Social links (Twitter/X, Discord)
- Legal: "Regulated event contract exchange. Not available in [jurisdiction]."

---

## 5. Messaging Options (for the hero)

The colleague should test/choose. These are starting points, not final copy.

| Option | Headline | Subhead |
|--------|---------|---------|
| A (Direct) | **Bet on AI Fights** | AI fighters. Real money. Trade the outcome. |
| B (Exchange) | **The Fight Exchange** | AI fighters compete. You trade the result. |
| C (Action) | **Pick a Side** | AI fights. Binary outcomes. Real money markets. |
| D (Experience) | **5 Minutes. 1 Fight. Real Money.** | Watch AI fighters battle. Trade YES or NO on the winner. |

Option A is my recommendation. Shortest. Most visceral. "Bet" is a loaded word that does heavy lifting.

---

## 6. Content Assets Needed

| Asset | Description | Who Provides |
|-------|------------|-------------|
| **Fight footage / animation** | Looping pixel-art fight clip for hero section. 5-10 seconds. | Engineering (canvas recording) or custom animation |
| **Product screenshots** | Trading panel, live fight view, settlement screen, fighter profile | From product build or high-fidelity mockups |
| **Step illustrations** | 3 simple visuals for "How It Works" | Designer creates |
| **Social proof data** | User count, volume traded, fights per day | Available at launch (use placeholders pre-launch) |
| **Fighter art** | Pixel art fighters for section backgrounds / illustrations | From sprite library or custom |

---

## 7. Constraints

- **No border-radius. Anywhere.** Sharp corners only. This is the #1 visual identity rule.
- **Press Start 2P** for headlines, labels, data. **Inter** for body copy. No other fonts.
- **Color = meaning.** Green = money in. Red = money out. Gold = your assets. No decorative color.
- **No fluff copy.** Present-tense, active voice, numbers over words. (See Brand Identity Spec section 10 for full voice guidelines.)
- **Mobile-first.** Emerging markets are the primary audience. Page must be fast and clean on a mid-range Android.
- **Dark mode default** for the landing page (matches the product's "pit mode" energy). Light mode nice-to-have.

---

## 8. Brand Identity Reference

Full brand spec: `docs/plans/2026-02-22-brand-identity-design.md`

### Quick Reference — Color Tokens (Dark)

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#0a0a0f` | Page background |
| surface | `#12121a` | Cards, panels |
| surface2 | `#1a1a26` | Interactive zones, inputs |
| border | `#2a2a3a` | Dividers, borders |
| text | `#e8e8f0` | Primary text |
| text2 | `#888899` | Secondary text, labels |
| green | `#22c55e` | Bullish, profit, winning |
| red | `#ef4444` | Bearish, loss, damage |
| gold | `#ffd700` | User's money, rewards |
| accent | `#ff4444` | Fighter 1, brand mark, primary CTA |
| accent2 | `#4488ff` | Fighter 2, secondary actions |

### Quick Reference — Color Tokens (Light)

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#f5f5f9` | Page background |
| surface | `#ffffff` | Cards, panels |
| surface2 | `#ededf2` | Interactive zones |
| border | `#d5d5de` | Dividers |
| text | `#12121a` | Primary text |
| text2 | `#6b6b7a` | Secondary text |
| green | `#16a34a` | Bullish |
| red | `#dc2626` | Bearish |
| gold | `#a16207` | User's money |
| accent | `#d63031` | Fighter 1, brand |
| accent2 | `#2563eb` | Fighter 2 |

### Typography

| Context | Font | Details |
|---------|------|---------|
| Headlines | Press Start 2P | Uppercase, tracked. The MFC voice. |
| Labels / data | Press Start 2P | Smaller, uppercase, wide tracking |
| Body copy | Inter | 400-500 weight, readable |
| Numbers / prices | Press Start 2P | Always pixel font. Numbers are first-class. |

### Animation Rules

- Animate DATA changes (prices, live indicators). Don't animate STRUCTURE (page transitions, section reveals).
- No spring physics. No bounce. Linear or ease-out only.
- The live dot (pulsing circle) is the ONLY round element allowed.
- Keep it alive: subtle price ticks, pulsing live indicators, fight canvas running.

---

## 9. Competitive References

| Product | What to Borrow | What to Avoid |
|---------|---------------|---------------|
| **pump.fun** | Content-IS-the-interface. No chrome between user and action. Speed of comprehension. | The chaos. MFC is regulated, not wild west. |
| **Polymarket** | Clean market card layout. Price-forward design. | The dryness. MFC has spectacle — use it. |
| **Photo Finish Live** | Horse racing + ownership + betting loop. Closest product comp. | The complexity. MFC's surface is simpler. |
| **Kalshi** | Legitimacy signaling. Regulated exchange positioning. | The institutional feel. MFC is accessible, not Wall Street. |

---

## 10. What This Page Is NOT

- **Not a whitepaper.** Don't explain how the combat engine works.
- **Not a feature list.** Don't enumerate every system. Sell the experience.
- **Not a financial product page.** Don't lead with "event contract exchange." That's the footer.
- **Not retro/nostalgic.** The pixel art is practical (Minecraft, not Punch-Out). Don't add CRT effects or "INSERT COIN" copy.
- **Not a sportsbook landing page.** No odds comparisons, no "best odds guaranteed" language. MFC is an exchange.

---

*Sections 8-10 reference the Brand Identity Spec (V2.1). The colleague should read the full spec for component-level guidance.*

---

## 11. Creative Direction — Kakashi

**Added by:** Kakashi (Creative Lead)
**Date:** 2026-02-26

This section gives the designer everything they need to make visual decisions without asking us. Read Itachi's product/IA above for what goes where. This section tells you how it should look and feel.

---

### 11.1 Hero Section — Creative Direction

**The fight IS the hero. Not a screenshot of it. Not an illustration of it. The actual product.**

**Recommended approach: Pre-recorded fight loop (video) with animated overlays.**

A live canvas embed is too fragile for a landing page (depends on a fight being live, has cold start time, doubles engineering surface). A static image is dead — MFC's entire identity is liveness. The middle ground: a high-quality screen recording of the fight canvas, looped seamlessly, with 2-3 CSS-animated overlays that sell the "alive" feeling.

**What the hero loop shows (8 seconds, seamless):**
- Two pixel-art fighters mid-round. A jab connects. HP drops. A counter punch fires (gold flash). The price ticks from 58 to 62. The crowd reacts. Another exchange. Loop resets at a natural moment (both fighters resetting to neutral stance).
- The canvas HUD is visible: HP bars, round timer ("R2 0:42"), fighter names in accent/accent2 colors, strike count. This is a real product frame, not a sanitized mockup.
- The recording is the full fight canvas — dark background (`#0d0d14`), pixel-art sprites at native resolution, `imageRendering: pixelated` preserved in the recording.

**Animated overlays (CSS, not in the video):**
- A pulsing LIVE dot (red, 6px, the only round element) in the top-left corner of the video frame.
- A price ticker below the video that subtly shifts values every 2-3 seconds (e.g., "YES 62" ... "YES 63" ... "YES 61"). Press Start 2P, text-green, with the 300ms bg-green/10 flash on change. This runs on a simple CSS animation loop — it doesn't need to match the video.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  [bg: #0a0a0f, full viewport height]                     │
│                                                          │
│      BET ON AI FIGHTS                                    │
│      Press Start 2P, 48px desktop / 24px mobile          │
│      color: text (#e8e8f0)                               │
│                                                          │
│      AI fighters. Real money. Trade the outcome.         │
│      Inter, 18px / 14px, color: text2 (#888899)          │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │         [FIGHT LOOP VIDEO]                   │        │
│  │  ● LIVE                           R2 0:42   │        │
│  │                                              │        │
│  │  IRON MIKE              GHOST                │        │
│  │  ████████░░░  HP  ░░████████████            │        │
│  │              [fight action]                  │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│      YES 62¢ ▲     NO 38¢ ▼                             │
│      [animated price overlays, green/red]                │
│                                                          │
│      ┌────────────────────────┐                          │
│      │    JOIN THE EXCHANGE   │                          │
│      └────────────────────────┘                          │
│      border-2 accent, font-pixel, uppercase              │
│                                                          │
│      1,200+ TRADERS  ·  $340K TRADED  ·  50 FIGHTS/DAY  │
│      font-pixel text-xs text2, centered                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Mobile hero:** Video scales to viewport width. Headline drops to 24px. Subhead drops to 14px. Price overlays stack vertically (YES on left, NO on right). CTA full-width. Social proof wraps to two lines if needed.

**Critical rules for the hero:**
- The video auto-plays, muted, looped. No play button. No controls. It's ambient.
- The video sits on `#0d0d14` — it should feel like a window into the fight, not a video embed. No border, no shadow, no container. Just the canvas.
- The headline sits ABOVE the video, not overlaid on it. The fight is content, not a background image.
- If the video fails to load (slow connection), show a single high-quality frame as a static fallback.

---

### 11.2 Section-by-Section Art Direction

#### Section 1: Hero
Covered above. Full-viewport dark (`#0a0a0f`). Fight video is the centerpiece. Maximum impact, minimum explanation.

#### Section 2: How It Works
**Visual density: Low.** Three steps, lots of whitespace. This section breathes.

**Background:** `#0a0a0f` (continuous from hero — no section break line or color shift).

**Layout:** Three columns on desktop (equal width, 32px gap). Stacked on mobile.

Each step card:
```
┌────────────────────────┐
│                        │
│  ┌──────────────────┐  │
│  │  [ILLUSTRATION]  │  │
│  │  280×180px crop   │  │
│  └──────────────────┘  │
│                        │
│  01                    │
│  font-pixel, 24px,    │
│  text2 (#888899)      │
│                        │
│  WATCH THE FIGHT       │
│  font-pixel, 12px,    │
│  text (#e8e8f0)       │
│                        │
│  AI fighters battle    │
│  in real-time.         │
│  3 rounds. ~5 min.     │
│  Inter, 14px, text2   │
│                        │
└────────────────────────┘
```

**Step illustrations (not full screenshots — focused crops):**
1. **"Watch"**: Cropped fight canvas showing two fighters mid-exchange. HP bars visible. Just the action zone, not the full product UI. Pixel art on dark bg.
2. **"Pick a side"**: Cropped trading panel showing YES 62 / NO 38 with the two price buttons. Green and red. Amount chips visible. The moment of decision.
3. **"Cash out"**: Settlement screen crop. "+$4.20" in green with the gold flash. The reward moment.

Each crop sits in a container: no border-radius, 1px `border-border`, `bg-surface` (`#12121a`). `imageRendering: pixelated` on any pixel art.

#### Section 3: The Experience
**Visual density: Medium.** This is the emotional sell. Four moments, each with a visual.

**Background:** Shift to `#12121a` (surface) — the first bg change signals a new chapter.

**Layout:** Two-column grid on desktop (visual left, text right, alternating). Stacked on mobile with visual above text.

Four moments:

| Moment | Visual | Headline | Body |
|--------|--------|----------|------|
| Tension | Product screenshot: trading panel in LOCKED state. Timer showing "NEXT WINDOW IN 34s". Prices updating live. BUY button hidden. | "CAN'T TRADE. CAN'T LOOK AWAY." | The market moves while you watch. Prices update. You can see the shift. But the button isn't there. You wait. |
| Rush | Product screenshot or short clip: repricing window. Timer in red "CLOSING IN 3s". Price jumping. BUY active. | "15 SECONDS. ACT NOW." | The round ends. The market opens. New data floods in. You have 15 seconds before it locks again. |
| Skill | Product screenshot: expanded info panel showing Gut → Informed → Expert layers side by side. Stats, proc counts, stamina projections. | "GUT CALL OR DEEP READ." | See the round winner and bet. Or expand the data, read the proc counts, project the stamina. Your call. |
| Loop | Simple illustration or timeline graphic: WATCH → TRADE → SETTLE → REPEAT. ~5 min total, looping arrow. | "5 MINUTES. 1 FIGHT. GO AGAIN." | Every fight is its own story. Win or lose, the next one starts in seconds. |

**Headlines** in Press Start 2P, 14px, white. **Body** in Inter, 15px, text2. **Visuals** are 560×360px crops, no border-radius, 1px border-border.

The alternating left-right layout creates visual rhythm. On mobile it becomes a simple vertical stack: visual → headline → body, repeated 4 times.

#### Section 4: What Makes MFC Different
**Visual density: Low.** Clean differentiator cards. Pick 3 (not 4, not 5 — three is scannable).

**Background:** Back to `#0a0a0f` (bg).

**Recommended 3 differentiators:**
1. "NOT A SPORTSBOOK" (exchange angle)
2. "SKILL MATTERS" (data/edge angle)
3. "5-MINUTE SESSIONS" (accessibility angle)

**Layout:** Three cards in a row on desktop. Stacked on mobile.

Each card:
```
┌────────────────────────────┐
│  [bg-surface, p-6]         │
│  [1px border-border]       │
│                            │
│  [ICON: 48×48 pixel art]   │
│                            │
│  NOT A SPORTSBOOK          │
│  font-pixel, 10px, text    │
│  uppercase, tracked        │
│                            │
│  You trade against other   │
│  people, not the house.    │
│  MFC never takes a side.   │
│  Inter, 14px, text2        │
│                            │
└────────────────────────────┘
```

**Icons (48×48, pixel art):**
- "Not a sportsbook": Two arrows crossing (exchange symbol). Pixel art.
- "Skill matters": Magnifying glass over a stat bar. Pixel art.
- "5-minute sessions": Clock showing 5:00. Pixel art.

Icons are rendered in `text` color (#e8e8f0) — they're informational, not decorative. No color.

#### Section 5: The Metagame (Depth Tease)
**Visual density: Low.** One visual, text beside it. Tease, don't explain.

**Background:** `#12121a` (surface).

**Layout:** Two columns. Left: visual (60%). Right: text (40%). On mobile: visual above, text below.

**The visual:** A fighter profile card mockup. This is the single most important illustration on the page after the hero. It shows:
- A pixel-art fighter sprite (centered, 128×128 at 2x)
- Fighter name in Press Start 2P
- Archetype badge: "PRESSURE" in accent red
- Three stat bars: POW / END / TEC with pixel-font values
- Gear slots (4): weapon, armor, boots, accessory — with pixel-art gear icons
- A "LEGENDARY" badge in gold on one gear piece

This illustration should feel like a trading card crossed with an RPG character sheet. Sharp corners. Dark bg (`#0d0d14`) for the card interior (canvas bg). Surface border.

**Text beside it:** Four bullet points. Headlines in Press Start 2P 10px, text. Body in Inter 14px, text2. Short paragraphs, not marketing fluff.

#### Section 6: For Developers
**Visual density: Code-dense.** Terminal energy. This is the only section that feels different from the rest of the page — intentionally.

**Background:** `#0d0d14` (canvas bg — darker than the main bg). This signals "you're in the terminal now."

**Layout:** Centered single column, max-width 720px (narrower than other sections — like a code editor viewport).

```
┌──────────────────────────────────────────────┐
│  [bg: #0d0d14, full-width, py-24]            │
│                                              │
│  BUILD AN AUTONOMOUS                         │
│  TRADING AGENT                               │
│  font-pixel, 20px, text                      │
│                                              │
│  API-first. Sandbox mode.                    │
│  Reference agent ships at launch.            │
│  Inter, 15px, text2                          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  $ curl -X POST \                      │  │
│  │    https://api.mfc.gg/v1/bets \        │  │
│  │    -H "Authorization: Bearer ..." \    │  │
│  │    -d '{"side":"YES","amount":100}'    │  │
│  │                                        │  │
│  │  {"id":"bet_abc","status":"filled",    │  │
│  │   "price":0.62,"payout":161}           │  │
│  └────────────────────────────────────────┘  │
│  [bg-surface (#12121a), p-6, 1px border]     │
│  [font-pixel 11px for code, green for cmd,   │
│   text2 for response]                        │
│                                              │
│  ┌──────────────────────┐                    │
│  │    READ THE DOCS     │                    │
│  └──────────────────────┘                    │
│  border-2 accent, font-pixel, uppercase      │
│                                              │
└──────────────────────────────────────────────┘
```

**The code block is NOT font-mono.** Use Press Start 2P at 11px — it reads as monospace because it IS monospace. This keeps brand consistency. The `$` prompt and the curl command render in green. The JSON response renders in text2.

#### Section 7: Footer CTA
**Visual density: Minimal.** Close the page with conviction.

**Background:** `#0a0a0f` (bg).

**Layout:** Centered. MFC brand mark at top, headline, CTA, social links, legal.

```
MFC                          [Press Start 2P, 32px, accent with glow]
                             [text-shadow: 0 0 40px rgba(255,68,68,0.4)]

BET ON AI FIGHTS              [Press Start 2P, 18px, text]

┌────────────────────────┐
│    JOIN THE EXCHANGE   │    [border-2 accent, font-pixel uppercase]
└────────────────────────┘

[X icon]  [Discord icon]     [24px, text2, 24px gap between]

REGULATED EVENT CONTRACT EXCHANGE
NOT AVAILABLE IN [JURISDICTION]  [Inter, 11px, text2, uppercase, tracked]
```

Nothing else. No sitemap. No "About" links. No newsletter signup. The footer is the closer, not a dump zone.

---

### 11.3 Landing Page Component Guidance

The Brand Identity Spec covers in-product components. A landing page has different needs. Here's how each landing-specific component should work in MFC's visual language.

#### Feature Cards (Section 4)
```
Container:   bg-surface (#12121a), border 1px border-border (#2a2a3a), p-6
             NO shadow. NO hover animation. These are static content containers.
Size:        Equal width (1/3 of content area on desktop), min 280px
Icon:        48×48px pixel art, centered or left-aligned, color: text
Headline:    font-pixel, 10px, text, uppercase, tracking 0.1em
Body:        Inter, 14px/1.6, text2
Spacing:     24px between icon and headline, 12px between headline and body
```

#### Social Proof Numbers
```
Format:      Number + label, inline
Number:      font-pixel, 18px desktop / 14px mobile, text
Label:       font-pixel, 10px, text2, uppercase
Separator:   · (middle dot) in text2, 16px horizontal padding
Example:     1,200+ TRADERS  ·  $340K TRADED  ·  50 FIGHTS/DAY
```

No cards around these. No icons. The numbers speak for themselves. Pre-launch: use realistic placeholder values, not "10K+" aspirational numbers that look fake.

#### Email Capture / Waitlist Form
```
Container:   Inline (input + button on one row), max-width 480px, centered
Input:       bg-surface2 (#1a1a26), border 1px border-border, font-ui 14px
             height 48px, px-4
             placeholder: "Your email" in text2
             focus: border-accent
Button:      bg-accent (#ff4444), text-white, font-pixel 10px uppercase
             height 48px, px-6
             tracking 0.1em
             hover: bg-accent/80 (darken, not brighten)
             text: "JOIN WAITLIST" or "GET EARLY ACCESS"
```

No decorative container around the form. No "Be the first to know!" fluff above it. The form just sits there, clean and direct.

#### Step Cards (Section 2)
```
Container:   No bg, no border — these are open content groups, not boxed cards
Number:      font-pixel, 24px, text2 — large, dim, structural
Illustration: 280×180px, bg-surface, border 1px border-border
Label:       font-pixel, 12px, text, uppercase
Body:        Inter, 14px/1.6, text2
Spacing:     16px between illustration and number, 8px between number and label,
             12px between label and body
```

The large dim number (01, 02, 03) is the visual anchor. It's big enough to create rhythm without being loud.

#### Section Headers
```
Label:       font-pixel, 10px, text2, uppercase, tracking 0.15em
             Example: "HOW IT WORKS" or "WHAT MAKES US DIFFERENT"
Position:    Left-aligned or centered (match section alignment)
Margin:      48px bottom (between label and section content)
```

Section headers are quiet markers, not loud announcements. They orient the reader without demanding attention.

---

### 11.4 Motion on the Landing Page

The brand spec says "animate data, not structure." A landing page is mostly structure. Here's exactly what moves and what doesn't.

#### Allowed Motion

| Element | Animation | Timing | Rule |
|---------|-----------|--------|------|
| Hero fight video | Autoplay, muted, loop | Continuous | This is content, not structure. It plays immediately. |
| Hero price overlays | Value shifts every 2-3s with bg-green/10 flash | 300ms flash | Data animation. Sells the "alive" principle. |
| LIVE dot (hero) | Opacity pulse 1→0.3→1 | 1.5s loop | The universal live indicator. |
| Social proof numbers | Count-up from 0 to value on first scroll into view | 800ms, ease-out | One-time data reveal. Numbers counting up feels alive. Use `IntersectionObserver`, trigger once. |
| CTA button hover | Border-color brightens, bg fills accent | 100ms, instant feel | Interaction feedback. |

#### Forbidden Motion

| Element | Why Not |
|---------|---------|
| Section scroll-in (slide up, fade in, stagger) | Structure animation. Content should be there when you scroll to it. |
| Parallax scrolling | Decorative. Slows down mobile. Feels "webby," not "product." |
| Background animated gradients, particles, blobs | Decorative. Violates "content IS the interface." |
| Card hover lift/scale/shadow | Shape change. Brand says hover = color change only. |
| Spring/bounce easing on anything | Brand-absolute. Linear or ease-out only. |
| Typewriter text effects (including headline) | Gimmicky. The headline should be instantly readable. |
| Image/section zoom on scroll | Decorative complexity. |
| Loading spinners or skeleton screens for static content | A landing page has no dynamic content to load. Everything is pre-rendered. |

#### The One Exception — Section Entrance

Each section (below the fold) gets a single, simple entrance: opacity 0 to 1 over 200ms, triggered by `IntersectionObserver` when 20% of the section enters the viewport. No slide. No stagger. No delay. Just a clean appearance that prevents the content from abruptly materializing.

The hero (above the fold) has NO entrance animation. It's there immediately. The fight video starts playing on load.

**Rationale:** The brand says "don't animate structure." A 200ms opacity fade is the minimum gesture that avoids a jarring pop-in on scroll. It doesn't draw attention to itself. It doesn't delay content. If the designer feels even this is too much, dropping it entirely (instant appearance) is acceptable.

---

### 11.5 Visual References (Moodboard)

Five landing pages that together capture the energy MFC is going for. Each reference has a specific lesson — the designer should borrow the named quality, not the overall style.

| Reference | URL | What to Borrow | What to Ignore |
|-----------|-----|---------------|----------------|
| **Linear** | linear.app | **Typography and restraint.** The way large, confident text carries the page. Dark bg, minimal color, content-forward. The gold standard for dark-mode landing pages. | The softness. Linear's rounded corners and gentle gradients are the opposite of MFC's sharp, pixel-cut identity. |
| **Vercel** | vercel.com | **Product-as-hero.** The way the homepage puts the actual product (terminal, deploy preview) front and center. Interactive demos that make you FEEL the product. | The polish. Vercel's smooth animations and transitional surfaces are too refined for MFC's raw energy. |
| **pump.fun** | pump.fun | **Speed of comprehension.** You land and immediately understand what's happening. Content IS the interface. Zero decorative chrome. The "I get it in 3 seconds" feeling. | The chaos and visual noise. MFC is regulated and professional — same energy, different execution. |
| **Phantom Wallet** | phantom.com | **Crypto-adjacent done right.** Dark mode, professional, technically credible without being intimidating. Clean section breaks. Accessible to a crypto-native audience without being "crypto bro." | The smoothness. Phantom's rounded cards and soft gradients don't fit MFC's pixel-art sharpness. |
| **Photo Finish Live** | photofinish.live | **Closest product comp.** Horse racing + ownership + betting. Shows how a "bet on AI [X]" product presents itself. Ownership cards, race preview, wagering interface. | The visual complexity and the horse/turf aesthetic. MFC's pixel-art style is simpler and sharper. |

**The synthesis:** Linear's typography confidence + Vercel's product-as-hero approach + pump.fun's speed of comprehension + Phantom's crypto-native professionalism + Photo Finish's product category framing. All filtered through MFC's pixel-art visual language: sharp corners, Press Start 2P, color-as-meaning, dark surfaces.

---

### 11.6 Asset List with Creative Specs

#### Asset 1: Hero Fight Loop

| Spec | Value |
|------|-------|
| Format | MP4 (H.264) primary, WebM (VP9) fallback |
| Source dimensions | 1920×1080 |
| Display | Responsive (viewport width, max-width 960px centered) |
| Duration | 8 seconds, seamless loop |
| Framerate | 30fps (not 60 — pixel art doesn't need it, halves filesize) |
| Content | Mid-round action: two fighters exchanging blows. A power shot lands. HP bar drops. A counter punch fires (gold flash). Price ticks in the HUD. Crowd reacts. Loop resets at a natural stance reset moment. |
| Canvas HUD visible | HP bars, round timer ("R2 0:42"), fighter names in accent/accent2, strike count. This looks like the real product. |
| Background | `#0d0d14` (canvas bg). No transparency. |
| `imageRendering` | The recording must preserve pixelated rendering — no anti-aliasing, no sub-pixel smoothing. Record from a canvas with `imageSmoothingEnabled = false`. |
| Filesize target | <1.5MB (critical for mobile). Compress aggressively — pixel art compresses well because adjacent pixels are identical. |
| Fallback | First frame exported as JPEG (quality 85, <100KB) for slow connections. Show static frame, don't show a loading spinner. |
| Audio | None. The video is muted and has no audio track (saves bytes). |

**How to produce this:** Use the existing fight canvas (`EnhancedFightCanvas.tsx`) with `FightRecorder`. Set up a visually interesting fight (e.g., Pressure vs Counter, mid-R2). Screen-record the canvas element at native resolution. Trim to 8s, loop test, encode.

#### Asset 2: Product Screenshots

| Screenshot | Dimensions | Content | Notes |
|-----------|-----------|---------|-------|
| Trading panel (MARKET_OPEN) | 400×720 @2x (800×1440) | Trading panel showing YES 62/NO 38, amount chips (10/25/50/100), cost/win summary, BUY button active. | Crop to the panel only — no surrounding chrome. Show realistic-looking data. |
| Live fight view (desktop) | 1280×720 @2x (2560×1440) | Full desktop layout: fight canvas + trading panel sidebar. Mid-action. HP bars showing health differential. | This is the "what you'll actually see" screenshot. |
| Settlement screen | 640×480 @2x (1280×960) | Post-fight: winner celebration sprite, "+$4.20" in green with gold flash effect captured, session P&L showing. | Capture during the settlement phase. Show a winning trade result. |
| Fighter profile card | 400×560 @2x (800×1120) | Fighter with name, archetype, stats (POW/END/TEC bars), gear slots populated, win/loss record. | This may not exist in the product yet — if not, mock it up at high fidelity. |

**Format:** PNG, @2x for retina displays. Transparent background where appropriate (fighter profile card). Dark bg where it's a full scene (fight view, settlement).

**Quality bar:** These must look like real product, not mockups. Use actual product data or realistic-looking dummy data (not "Fighter 1" / "Fighter 2" — use names like "IRON MIKE" and "GHOST MANTIS").

#### Asset 3: Step Illustrations (How It Works)

| Step | Dimensions | Content | Style |
|------|-----------|---------|-------|
| 01 — Watch | 560×360 @2x | Two fighters mid-exchange. HP bars visible. Impact burst on a connecting hit. Just the fight zone — no surrounding UI. | Pixel art on `#0d0d14` bg. `imageRendering: pixelated`. Can be a cropped canvas frame from the hero video. |
| 02 — Pick a side | 560×360 @2x | YES 62 and NO 38 price buttons, green and red. An amount chip (50) selected. The BUY button prominent. | Simplified trading panel crop. Only the decision elements — no order book, no position list. |
| 03 — Cash out | 560×360 @2x | "+$4.20" large in green. Gold particle effect mid-animation. Session counter: "W: 3 L: 1". | Settlement moment crop. The reward. Green and gold dominate. |

**Container:** Each illustration sits in a frame: `bg-surface` (`#12121a`), `border 1px border-border` (`#2a2a3a`), no border-radius. No shadow.

These can be direct crops from the fight video frame (step 1), a product screenshot (step 2), or a product screenshot (step 3). They don't need to be hand-drawn illustrations. Authenticity beats artistry here — real product frames > stylized drawings.

#### Asset 4: Social Proof Numbers

Not image assets — these are text elements rendered in Press Start 2P.

| Metric | Pre-launch placeholder | Format |
|--------|----------------------|--------|
| Traders | 1,200+ | "1,200+ TRADERS" |
| Volume | $340K | "$340K TRADED" |
| Activity | 50/day | "50 FIGHTS/DAY" |

Replace with real numbers at launch. Do NOT use aspirational numbers ("10K+ TRADERS") pre-launch — it looks fake and undermines trust. Use modest, believable placeholders.

#### Asset 5: Fighter Sprites (Section Backgrounds)

| Spec | Value |
|------|-------|
| Format | PNG with transparency, @2x |
| Source size | 128×128 native, rendered at 256×256 - 512×512 |
| Count | 4 distinct fighters: one per archetype (Pressure, Turtle, Counter, Hybrid) |
| Style | Same pixel-art style as in-product sprites. Idle stance facing right. Full body visible. |
| `imageRendering` | Must be `pixelated` at every render size. No anti-aliasing. |
| Usage | Low-opacity (8-12%) decorative accents at section edges. Position at section margins, partially cropped off-screen. They add visual texture without competing with content. |
| Requirement | Each fighter must be visually distinct: different build, different stance, different color accents. The silhouette should be identifiable at 128px. |

**These are NOT hero images.** They're ambient texture. Think of them like watermarks — you notice them peripherally, they reinforce the pixel-art identity, but they never compete with the text or screenshots for attention.

#### Asset 6: Pixel-Art Icons (Differentiator Cards)

| Icon | Concept | Size |
|------|---------|------|
| Exchange | Two arrows crossing (swap/trade) | 48×48 native, @2x |
| Skill | Magnifying glass over a stat bar | 48×48 native, @2x |
| Speed | Clock face showing 5:00 | 48×48 native, @2x |

**Style:** Monochrome pixel art in `text` color (`#e8e8f0`). 1-bit per pixel look — no shading, no gradients, no anti-aliasing. These should feel like they belong to the same pixel font family as Press Start 2P. Rendered on transparent background.

---

### 11.7 Page-Level Specs

#### Dimensions and Grid

| Spec | Value |
|------|-------|
| Max content width | 1120px (centered) |
| Section vertical padding | 96px desktop, 64px mobile |
| Column gap | 32px desktop, 16px mobile |
| Content margin (mobile) | 20px left/right |

#### Vertical Rhythm Between Sections

No visible section dividers. No horizontal rules. No gradient transitions. Sections are separated by vertical padding alone. The bg color alternation (`#0a0a0f` → `#12121a` → `#0a0a0f`) provides implicit section separation.

#### Performance Requirements

| Metric | Target | Why |
|--------|--------|-----|
| LCP (Largest Contentful Paint) | <2.5s on 4G | Mobile-first. Emerging markets. |
| Total page weight | <3MB | Hero video is the biggest asset (~1.5MB). Everything else must be lean. |
| Font load | Press Start 2P: preload, font-display swap. Inter: preload, font-display swap. | Pixel font MUST load before hero renders — fallback fonts break the brand completely. |
| Image format | WebP with PNG fallback | Pixel art compresses very well in WebP. |
| Video | MP4 primary, WebM fallback, poster frame for instant render | `<video autoplay muted loop playsinline poster="hero-frame.jpg">` |

#### Accessibility

- All images: descriptive alt text ("Two pixel-art fighters exchanging punches in a round of combat")
- Video: No captions needed (muted, no dialogue). Provide aria-label on the video element.
- Color contrast: all text passes WCAG AA (see Brand Spec Section 4 for verification)
- Price colors (green/red): supplement with direction arrows (up/down triangle) for colorblind users
- Focus states: visible outline on all interactive elements (2px accent, offset 2px)
- Keyboard navigation: tab order follows visual order. CTA buttons are reachable.

---

*Creative direction by Kakashi. Product/IA by Itachi. Refer to the Brand Identity Spec (V2.1) for in-product component guidance. This document is the complete handoff — if the designer needs to ask us a question, something is missing from this brief.*
