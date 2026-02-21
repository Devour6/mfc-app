# MFC — Molt Fighting Championship

## What This Is

A regulated event contract exchange for AI fighter outcomes. AI agents fight in algorithmically simulated matches. Spectators trade binary outcome contracts (YES/NO) via a continuous order book (CLOB). MFC is an exchange, not a sportsbook — it matches counterparties, takes no directional risk, and never sets odds.

## Game Design Document

**Read `docs/GDD_v0.md` before making product decisions.** It defines the product vision:
- **Ownership chain**: Human (owner) → Agent (manager/trainer) → Fighter (asset)
- **Two leagues**: Human League (high stakes, curated) and Agent League (24/7, farm system) with separate order books
- **Gear/loot system**: Rarity tiers (Common → Legendary), pity counter, gear degradation from combat
- **Stats must matter**: Fighter attributes and gear must visibly influence fight outcomes and fighter appearance
- **Ring entry costs**: Entry fee, fatigue, gear degradation, loss penalty
- **Exchange**: Binary outcome contracts (YES/NO, $0.01-$0.99), CLOB, no house risk

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18, Tailwind CSS 3.4, Framer Motion 11 |
| State | Zustand 4.5 with localStorage persistence |
| Rendering | HTML5 Canvas (16-bit pixel-block sprites, frame-based keyframe animation) |
| Audio | Web Audio API via custom SoundManager |
| Database | PostgreSQL 16 via Prisma 7.4 + `@prisma/adapter-pg` (connected, migrated, seeded) |
| Auth | Auth0 v4 (@auth0/nextjs-auth0 v4.15.0) — proxy.ts + lib/auth-guard.ts |
| Fonts | Press Start 2P (pixel), Inter (UI) |
| Build | Turbopack |

## Project Structure

```
app/                  → Next.js App Router (layout, page, globals.css)
components/           → React components — see UI Architecture below
lib/                  → Core engines + infrastructure
  ├── fight-engine.ts       → Tick-based combat simulation
  ├── market-engine.ts      → Price discovery + order book
  ├── evolution-engine.ts   → Fighter traits + signature moves
  ├── tournament-engine.ts  → Single-elimination brackets
  ├── achievement-engine.ts → 20+ achievements with rarity tiers
  ├── daily-rewards-engine.ts → Login streak rewards
  ├── credit-engine.ts      → Currency + transaction management
  ├── sound-manager.ts      → Fight-aware audio
  ├── fight-recorder.ts     → FightRecorder class (samples every 3rd tick for replay)
  ├── store.ts              → Zustand state management
  ├── prisma.ts             → Prisma client singleton (uses pg adapter)
  ├── api-utils.ts          → API response helpers (jsonResponse, errorResponse, notFound, unauthorized, serverError, validationError)
  ├── validations.ts        → Zod schemas for all API inputs
  ├── api-client.ts         → Typed fetch wrappers for all API routes (session-based — no auth0Id in requests)
  ├── auth0.ts              → Auth0Client instance (v4, server-side)
  ├── auth-guard.ts         → requireAuth() — Auth0 session OR API key auth (dual-mode)
  ├── role-guard.ts         → requireHuman(), requireAgent(), requireAnyRole() — RBAC composable guards
  ├── reverse-captcha.ts    → Obfuscated math challenges for AI agent verification (30s TTL, one-time use)
  ├── user-sync.ts          → ensureUser() — upsert User record on first login
  ├── rate-limit.ts         → In-memory sliding window rate limiter (RateLimiter class + helpers)
  ├── stripe.ts             → Stripe client singleton + credit packages
  └── solana/               → Solana wallet integration
      ├── wallet-provider.tsx  → React context (ConnectionProvider + WalletProvider + WalletModalProvider)
      ├── use-wallet.ts        → Custom hook: connect/disconnect/balance/signAndSend
      └── credit-bridge.ts     → SOL↔credits deposit/withdrawal (fetches treasury from /api/solana/config)
types/index.ts        → Comprehensive type definitions (~370 lines)
prisma/schema.prisma  → DB models: User, Fighter, Training, Fight, FightResult, Bet, ApiKey, AgentProfile
public/SKILL.md       → Agent discovery document (how AI agents interact with MFC)
public/.well-known/agent-card.json → A2A protocol agent card
prisma.config.ts      → Prisma 7 config (holds DATABASE_URL for migrations)
scripts/seed.ts       → DB seed script (creates sample users, fighters, fights, bets)
.env.example          → Environment variable template
app/api/              → API routes (see API Routes section below)
```

## Core Engines

### Fight Engine (`lib/fight-engine.ts`)
- Tick-based simulation at 80ms intervals, 3 rounds × 180 seconds
- Real-time clock: tick counter decrements `fightState.clock` every 12 ticks (~1 real second)
- Actions: jab, cross, hook, uppercut, kick, roundhouse, combo, dodge, block, clinch, move
- Kick mechanics: separate executeKick/landKick with higher base damage, longer stun, boot glow VFX
- Fight recording: optional FightRecorder (samples every 3rd tick ~1.1MB/fight) for replay
- `FIGHTER_MAX_HP = 200` — exported constant used by canvas for HP bar rendering
- Base 55% hit chance with modifiers (dodging -75%, blocking -65%, stunned +80%)
- Multi-dimensional fight bias: damage (±40%), action rate (±25%), hit chance (±20%), decision scoring (±50%)
- KO at 0 HP, TKO at <35 HP (15% chance), Decision by scored hits (landed*3 + power*8 + hp*0.15)
- Hit-stop: `hitStopFrames` in modifiers — both fighters freeze 3 frames (5 for power shots) on impact
- Stamina system (0-100), stun/modifier decay, commentary generation

### Market Engine (`lib/market-engine.ts`)
- Price discovery from real-time fight state (HP diff, accuracy, power shots, combos, stamina, stun)
- Target price smoothing with 0.1× lerp
- Order book: 6 bids / 6 asks, auto-regenerates
- Settlement: winner = 100%, loser = 0%

### Evolution Engine (`lib/evolution-engine.ts`)
- 4 trait axes: aggressive, defensive, showboat, technical (0-100)
- Signature moves with unlock conditions
- Age-based peak performance (25-35)

## UI Architecture

### Navigation — ArenaTopBar (`components/ArenaTopBar.tsx`)
- Slim single-row bar: MFC logo (→ landing), LIVE pill, "More" dropdown, credits, sound toggle
- "More" dropdown contains secondary sections: Rankings, Fighters, Tournaments, Rewards, Achievements
- Clicking a dropdown item opens that section in a **slide-over drawer** (overlays the fight, doesn't replace it)
- Fight canvas + trading sidebar are **always visible** — they never get unmounted

### Trading — TradingPanel (`components/TradingPanel.tsx`)
- Unified Polymarket/Kalshi-style trading panel
- Structure: Market question → YES/NO buttons (cent prices, trend arrows) → Amount chips (10/25/50/100 + custom) → Cost/win summary → BUY button
- Collapsible accordion sections: Live Props (in-fight micro-markets), Order Book (bids/asks depth), Your Positions (active bets + recent trades)
- Props: `marketState`, `fightState`, `fighters`, `credits`, `onPlaceBet`, `onPlaceTrade`, `activeBets`

### Arena Layout (`app/page.tsx`)
- Landing view → Arena view (state-driven, no routing)
- Arena: `ArenaTopBar` (fixed top) + `LiveFightSection` (fills remaining height)
- Secondary sections rendered inside a slide-over drawer (animated, spring physics, backdrop click/Escape to close, ARIA dialog attributes)
- Drawer overlays on top of the fight area — fight engine continues running behind it

### Fight Section (`components/LiveFightSection.tsx`)
- Orchestrates: FightEngine + MarketEngine + recording + settlement
- Layout: Fight header (round/clock/LIVE) → EnhancedFightCanvas → CommentaryBar | right sidebar: LiveStatsOverlay + TradingPanel
- Responsive: sidebar on desktop (380px), stacked on mobile
- Supports `simplified` prop for onboarding first-time users
- FTUE flow: OnboardingPrompt → fighter picker → ContractConceptCard → SimplifiedMarketPanel → demo trade → settlement → ConvertPrompt
- `ContractConceptCard` — explains YES contracts after fighter pick
- `SimplifiedMarketPanel` — stripped-down trading panel (desktop sidebar + mobile bottom sheet)
- `ConvertPrompt` — account creation CTA overlay with re-show logic (max 2 dismissals)

## State Management

Zustand store (`lib/store.ts`) manages:
- User data (id, name, credits, fighters, trades, settings)
- Game state (tournament, achievements, login streak, credit balance, transactions)
- Onboarding state (hasCompletedOnboarding, hasSeenFirstFight, etc.)
- `fetchCredits()` — reads from `/api/user/credits`, falls back to local data if API unavailable
- `syncUserProfile()` — one-time fetch of user profile (isAgent flag) from `/api/user`
- `placeBetAndDeduct(amount, desc, betDetails?)` — atomic credit deduction with optional API backend. When `betDetails` (fightId, side, odds) provided, fires `POST /api/bets` with optimistic local deduction + rollback on failure. Syncs credits from server on success.
- `fetchLeaderboard()` — reads from `/api/fighters?active=true`, falls back to local data
- Currently uses mock data (2 sample fighters on startup) with API hybrid fallback
- Persists to localStorage

## Database Schema (Prisma)

Models: `User`, `Fighter`, `Training`, `Fight`, `FightResult`, `Bet`, `ApiKey`, `AgentProfile`, `Skin`, `SkinPurchase`, `BillingRequest`
Enums: `FighterClass`, `FightStatus`, `FightMethod`, `BetSide`, `BetStatus`, `SkinType`, `SkinRarity`, `BillingStatus`

**Prisma 7 setup:**
- `prisma/schema.prisma` — models only, no `url` in datasource (Prisma 7 requirement)
- `prisma.config.ts` — provides DATABASE_URL for migrations
- `lib/prisma.ts` — uses `@prisma/adapter-pg` with a `pg` Pool for runtime connections
- `scripts/seed.ts` — seeds sample data (run `npm run db:seed` or `npm run db:reset`)

**Status:** Database connected, migrated, and seeded. PostgreSQL 16 via Homebrew. Start with: `pg_ctl -D ~/.homebrew/var/postgresql@16 start`

**Note:** Both `prisma.config.ts` and `scripts/seed.ts` load `.env.local` first (Next.js convention), then `.env` as fallback.

## API Routes

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/fighters` | GET | Public | List fighters (with filters) |
| `/api/fighters` | POST | Human | Create fighter (owner set from session) |
| `/api/fighters/[id]` | GET | Public | Get fighter details |
| `/api/fighters/[id]` | PATCH | Human | Update fighter stats (must own fighter) |
| `/api/fights` | GET | Public | List fights (with status filter) |
| `/api/fights` | POST | Human | Create fight |
| `/api/fights/[id]` | GET | Public | Get fight details |
| `/api/fights/[id]` | POST | Human | Submit fight result |
| `/api/fights/[id]` | PATCH | Human | Update fight status |
| `/api/user` | GET, POST, PATCH | Required | Get/sync/update user profile (auto-creates on first login) |
| `/api/user/credits` | GET, POST | Required | Get credit balance, add/deduct credits (transaction-safe) |
| `/api/bets` | GET, POST | Human | List user's bets, place bet (deducts credits) |
| `/api/bets/[id]` | GET, PATCH | Human | Get bet details, settle/cancel bet |
| `/api/training` | GET, POST | Human | List training sessions, create session |
| `/api/training/[id]` | GET | Human | Get training session details |
| `/api/stripe/checkout-session` | POST | Human | Create Stripe Checkout Session for credit purchase |
| `/api/stripe/webhook` | POST | Public* | Handle Stripe webhook events (signature-verified) |
| `/api/agents/challenge` | GET | Public | Get a reverse CAPTCHA challenge for agent registration |
| `/api/agents/register` | POST | Public | Register an AI agent (requires solved challenge), returns API key |
| `/api/skins` | GET | Public | List skins (with type/rarity filters) |
| `/api/skins/purchase` | POST | Human | Purchase skin for a fighter (transactional credit deduction) |
| `/api/fighters/[id]/skins` | GET | Public | Get equipped skins for a fighter |
| `/api/billing/requests` | GET | Required | List billing requests (agents see own, owners see their agents') |
| `/api/billing/requests` | POST | Agent | Create billing request (agent requests credits from owner) |
| `/api/billing/requests/[id]` | PATCH | Human | Approve/reject billing request (transfers credits on approve) |
| `/api/solana/config` | GET | Public | Returns treasury wallet address and credits-per-SOL rate |
| `/api/health` | GET | Public | Health check — returns `{ status, timestamp, db }` |

**Authentication:** `requireAuth()` from `lib/auth-guard.ts` supports **dual-mode auth**: Auth0 browser sessions OR API key (`Authorization: Bearer mfc_sk_...`). Unauthenticated requests get 401. User records auto-created on first request via `ensureUser()`. **All routes derive userId from the session** — never pass auth0Id or userId in request bodies.

**Role Guards:** `lib/role-guard.ts` provides composable RBAC guards built on top of `requireAuth()`:
- `requireHuman()` — blocks agent API keys (humans only)
- `requireAgent()` — blocks browser sessions (agents only)
- `requireAnyRole()` — allows both humans and agents

Auth column in the table above: "Human" = `requireHuman()`, "Required" = `requireAnyRole()`, "Public" = no auth.

**Agent Integration:** Agents register via `POST /api/agents/register` with a solved reverse CAPTCHA challenge. Discovery via `public/SKILL.md` and `public/.well-known/agent-card.json` (A2A protocol).

**Validation:** All routes use zod schemas from `lib/validations.ts`. Invalid requests return `{ error: "Validation failed", issues: [...] }` with 400.

**Fight status transitions:** SCHEDULED→LIVE, SCHEDULED→CANCELLED, LIVE→COMPLETED, LIVE→CANCELLED. All other transitions rejected.

## Current Status

**Not yet built:** Multiplayer (mock data only), deployment/environment setup.

## Scripts

```
npm run dev          → Start dev server
npm run build        → Production build
npm run lint         → ESLint (runs `eslint .` — `next lint` removed in Next.js 16)
npm run type-check   → TypeScript checking
npm run db:migrate   → Prisma migrations
npm run db:generate  → Prisma client generation
npm run db:seed      → Seed database with sample data
npm run db:reset     → Clean + re-seed database
```

## Design System

See `DESIGN_SYSTEM.md` for full visual specification. Key rule: **no border-radius anywhere** — sharp corners, pixel aesthetic.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in values. Required for backend:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH0_*` — Auth0 tenant credentials (when auth is enabled)

---

## Team Coordination

**This file (CLAUDE.md) is the master coordination document.** Read this file AND `LEARNINGS.md` before making any code changes. Update both after changes.

Two teams work on this repo:
- **Backend team** — database, API routes, auth, Solana integration
- **Frontend/design team** — components, UI, fight rendering, UX

### Frontend team: build-breaking rules

These rules are **error mode** in CI — violations will fail your build:

1. **No `rounded` or `border-radius`** — The ESLint rule `mfc/no-rounded-corners` catches all Tailwind `rounded*` classes and `borderRadius` styles in `.tsx`/`.jsx` files. If you have a legitimate exception (e.g., a drag handle affordance), use:
   ```tsx
   {/* eslint-disable-next-line mfc/no-rounded-corners -- reason */}
   <div className="rounded-full" />
   ```

2. **No raw `fetch()` in `components/`** — Use `lib/api-client.ts` instead. The ESLint rule `mfc/no-raw-fetch-in-components` enforces this. `fetch()` in `lib/` or `app/api/` is fine.

3. **Every new API route needs a test** — If you add a route file under `app/api/`, it must have a corresponding test in `__tests__/api/`. The CI route linter (`scripts/lint-mfc-routes.sh`) will fail the build otherwise.

4. **API auth changed to role-based** — Routes now use `requireHuman()`, `requireAgent()`, or `requireAnyRole()` instead of plain `requireAuth()`. See the API Routes table for which guard each route uses. Frontend calls are unaffected (Auth0 sessions pass `requireHuman()` automatically).

## Task Workflow

Every feature goes through this pipeline:

### 1. PRD (for non-trivial features)
Copy `.github/PRD-TEMPLATE.md` and fill it in before breaking work into tasks.

### 2. Task Breakdown
Each task MUST have machine-verifiable acceptance criteria. Format:

```
Task: Add bet placement API tests
Acceptance:
  - jest __tests__/api/bets.test.ts passes with 8+ new tests
  - POST /api/bets returns 201 with valid payload
  - POST /api/bets returns 401 without auth
  - POST /api/bets returns 400 with invalid fightId
```

Self-verify acceptance criteria locally before opening a PR.

### 3. Branch → PR → Review → Merge
1. Pull newest main
2. Read CLAUDE.md + LEARNINGS.md
3. Create a feature branch
4. Make changes, verify acceptance criteria pass locally
5. Create PR via `gh pr create`
6. Update CLAUDE.md with what changed
7. AI PR Review runs automatically (see CI/CD section)
8. Cross-review by an agent who didn't write the code
9. Lead engineer merges after review approval + CI passes

## CI/CD Pipeline

### CI (`.github/workflows/ci.yml`)
Runs on every PR to `main` and on push to `main`:
1. Checkout + install deps (`npm ci`)
2. Generate Prisma client (`npx prisma generate`)
3. Lint (`npm run lint`)
4. Type check (`npm run type-check`)
5. Test (`npm test -- --selectProjects=api --no-coverage`)
6. Build (`npm run build`)

All steps must pass for a PR to be mergeable.

### AI PR Review (`.github/workflows/ai-pr-review.yml`)
Runs on every PR. Uses OpenAI (gpt-4o) for first-pass code review checking correctness, security, and MFC conventions. Posts inline review comments. Does NOT auto-approve — lead engineer still merges.

**Setup:** `OPENAI_API_KEY` repository secret required.

### Custom Linters

**ESLint rules** (via `eslint-plugin-mfc` in `eslint-rules/`):
- `mfc/no-rounded-corners` (**error**) — flags `rounded`, `rounded-*` Tailwind classes and `borderRadius` styles. Will fail the build.
- `mfc/no-raw-fetch-in-components` (**error**) — flags raw `fetch()` in `components/`. Use `lib/api-client.ts` instead.

**CI route checks** (`scripts/lint-mfc-routes.sh`):
- `requireAuth → ensureUser` — auth-required routes must call both.
- `route test coverage` — every route file needs a corresponding test in `__tests__/api/`.

Route checks are **error mode** — violations will fail CI.

### PR Template
`.github/pull_request_template.md` includes a checklist requiring CLAUDE.md compliance, passing checks, and no secrets.

## Testing

Jest 30 with three projects:
- **api** (`node`) — API route tests in `__tests__/api/` (166 tests, 17 suites)
- **frontend** (`jsdom`) — component tests in `__tests__/` (52 tests, 8 suites)
- **solana** — Solana module tests in `__tests__/solana/` (27 tests, 2 suites). Per-file `@jest-environment` directives.

API tests mock Prisma, Auth0 session, and user sync in `__tests__/api/helpers.ts`. CI runs API tests only (`--selectProjects=api`).

```
npm test                              → Run all tests
npm test -- --selectProjects=api      → Run only API tests
npm test -- --selectProjects=solana   → Run only Solana tests
npm run test:watch                    → Watch mode
npm run test:coverage                 → With coverage
```
