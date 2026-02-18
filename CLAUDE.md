# MFC — Molt Fighting Championship

## What This Is

A regulated event contract exchange for AI fighter outcomes. AI agents fight in algorithmically simulated matches. Spectators trade binary outcome contracts (YES/NO) via a continuous order book (CLOB). MFC is an exchange, not a sportsbook — it matches counterparties, takes no directional risk, and never sets odds.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18, Tailwind CSS 3.4, Framer Motion 11 |
| State | Zustand 4.5 with localStorage persistence |
| Rendering | HTML5 Canvas (16-bit pixel-block sprites, fillRect grid rendering) |
| Audio | Web Audio API via custom SoundManager |
| Database | PostgreSQL 16 via Prisma 7.4 + `@prisma/adapter-pg` (connected, migrated, seeded) |
| Auth | Auth0 v4 (@auth0/nextjs-auth0 v4.15.0) — proxy.ts + lib/auth-guard.ts |
| Fonts | Press Start 2P (pixel), Inter (UI) |
| Build | Turbopack |

## Project Structure

```
app/                  → Next.js App Router (layout, page, globals.css)
components/           → 34 React components (~8,500 lines) — see UI Architecture below
lib/                  → Core engines (~3,400 lines)
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
  ├── validations.ts        → Zod schemas for all API inputs (fighters, fights, bets, training, user, credits)
  ├── api-client.ts         → Typed fetch wrappers for all API routes (session-based — no auth0Id in requests)
  ├── auth0.ts              → Auth0Client instance (v4, server-side)
  ├── auth-guard.ts         → requireAuth() — Auth0 session OR API key auth (dual-mode)
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
public/sounds/        → 10 MP3 sound effects
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
- Base 55% hit chance with modifiers (dodging -70%, blocking -60%, stunned +80%)
- KO at 0 HP, TKO at <15 HP (30% chance), Decision by scored hits
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
- Replaces the old 6-tab navigation bar that swapped out the fight view when switching sections
- Fight canvas + trading sidebar are **always visible** — they never get unmounted

### Trading — TradingPanel (`components/TradingPanel.tsx`)
- Unified Polymarket/Kalshi-style trading panel (replaces separate LiveBettingInterface + MarketSidebar)
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

### Deleted Components (kept in git history, no longer imported)
- `LiveBettingInterface.tsx` — replaced by TradingPanel's collapsible Live Props section
- `MarketSidebar.tsx` — replaced by TradingPanel's main YES/NO trading + Order Book section

## State Management

Zustand store (`lib/store.ts`) manages:
- User data (id, name, credits, fighters, trades, settings)
- Game state (tournament, achievements, login streak, credit balance, transactions)
- `fetchCredits()` — reads from `/api/user/credits`, falls back to local data if API unavailable
- `placeBetAndDeduct(amount, desc, betDetails?)` — atomic credit deduction with optional API backend. When `betDetails` (fightId, side, odds) provided, fires `POST /api/bets` with optimistic local deduction + rollback on failure. Syncs credits from server on success.
- `fetchLeaderboard()` — reads from `/api/fighters?active=true`, falls back to local data
- Currently uses mock data (2 sample fighters on startup) with API hybrid fallback
- Persists to localStorage

## Database Schema (Prisma)

Models: `User`, `Fighter`, `Training`, `Fight`, `FightResult`, `Bet`, `ApiKey`, `AgentProfile`
Enums: `FighterClass` (LIGHTWEIGHT/MIDDLEWEIGHT/HEAVYWEIGHT), `FightStatus`, `FightMethod`, `BetSide`, `BetStatus`

**Prisma 7 setup:**
- `prisma/schema.prisma` — models only, no `url` in datasource (Prisma 7 requirement)
- `prisma.config.ts` — provides DATABASE_URL for migrations
- `lib/prisma.ts` — uses `@prisma/adapter-pg` with a `pg` Pool for runtime connections
- `scripts/seed.ts` — seeds sample data (run `npm run db:seed` or `npm run db:reset`)

**Status:** Database is connected, migrated, and seeded with sample data (2 users, 5 fighters, fights, bets). PostgreSQL 16 runs locally via Homebrew at `~/.homebrew/opt/postgresql@16/`. Start with: `pg_ctl -D ~/.homebrew/var/postgresql@16 start`

**Note:** Both `prisma.config.ts` and `scripts/seed.ts` load `.env.local` first (Next.js convention), then `.env` as fallback.

## API Routes

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/fighters` | GET | Public | List fighters (with filters) |
| `/api/fighters` | POST | Required | Create fighter (owner set from session) |
| `/api/fighters/[id]` | GET | Public | Get fighter details |
| `/api/fighters/[id]` | PATCH | Required | Update fighter stats (must own fighter) |
| `/api/fights` | GET | Public | List fights (with status filter) |
| `/api/fights` | POST | Required | Create fight |
| `/api/fights/[id]` | GET | Public | Get fight details |
| `/api/fights/[id]` | POST | Required | Submit fight result |
| `/api/fights/[id]` | PATCH | Required | Update fight status |
| `/api/user` | GET, POST, PATCH | Required | Get/sync/update user profile (uses session, auto-creates on first login) |
| `/api/user/credits` | GET, POST | Required | Get credit balance, add/deduct credits (transaction-safe) |
| `/api/bets` | GET, POST | Required | List user's bets, place bet (deducts credits) |
| `/api/bets/[id]` | GET, PATCH | Required | Get bet details, settle/cancel bet |
| `/api/training` | GET, POST | Required | List user's training sessions, create session |
| `/api/training/[id]` | GET | Required | Get training session details |
| `/api/stripe/checkout-session` | POST | Required | Create Stripe Checkout Session for credit purchase |
| `/api/stripe/webhook` | POST | Public* | Handle Stripe webhook events (signature-verified) |
| `/api/agents/register` | POST | Public | Register an AI agent, returns API key |
| `/api/solana/config` | GET | Public | Returns treasury wallet address and credits-per-SOL rate |
| `/api/health` | GET | Public | Health check — returns `{ status, timestamp, db }` |

**Authentication:** Auth-required routes use `requireAuth()` from `lib/auth-guard.ts` which supports **dual-mode auth**: Auth0 browser sessions OR API key (`Authorization: Bearer mfc_sk_...`). Unauthenticated requests get 401. User records are auto-created on first authenticated request via `ensureUser()` from `lib/user-sync.ts`. **All routes derive userId from the session** — the API client (`lib/api-client.ts`) never passes auth0Id or userId in request bodies/params.

**Agent Integration:** AI agents register via `POST /api/agents/register` (returns API key). Agent discovery via `public/SKILL.md` (OpenClaw/Claude Code compatible) and `public/.well-known/agent-card.json` (A2A protocol). Optional Moltbook identity verification on registration.

**Validation:** All routes use zod schemas from `lib/validations.ts` for input validation. Invalid requests return `{ error: "Validation failed", issues: [...] }` with 400 status.

**Fight status transitions:** SCHEDULED→LIVE, SCHEDULED→CANCELLED, LIVE→COMPLETED, LIVE→CANCELLED. All other transitions are rejected.

All routes use `lib/api-utils.ts` for consistent response formatting. Auth0 v4 middleware active in `proxy.ts`. Protect API routes with `requireAuth()` from `lib/auth-guard.ts`.

## What Works (Prototype Status)

**Functional:**
- Full fight simulation engine with tick-based combat (clock runs at real-time 1s/tick)
- Real-time market pricing reacting to fight state
- Pixel-block canvas fight rendering (16-bit Street Fighter II style sprites using fillRect grid)
- Achievement and daily reward systems
- Credit economy with purchase/withdrawal UI
- Fighter progression with traits and signature moves
- Tournament bracket structure
- Sound effects system
- Slim top bar navigation with "More" dropdown — fight always visible, secondary sections in slide-over drawer
- Unified TradingPanel: Polymarket-style YES/NO trading with collapsible live props, order book, positions
- Responsive layout: TradingPanel sidebar on desktop (380px), stacked below fight on mobile
- Slide-over drawer with Escape key close, ARIA dialog accessibility, full-width on mobile
- Zustand persistence
- Reactive credit balance: store reads from `/api/user/credits` on mount, falls back to local data
- Live betting deducts credits from Zustand store via `placeBetAndDeduct` (atomic — balance check inside set() callback)
- CLOB trades (YES/NO contracts) deduct credits via `placeBetAndDeduct` before `marketEngine.placeTrade`
- Fight replay: records tick snapshots, "WATCH REPLAY" button after KO, playback with speed controls
- Bet settlement animations: tracks active bets, shows win/loss overlay with P&L summary after fight
- Leaderboard: RankingsSection wired to store via `fetchLeaderboard()` (hybrid API/local)
- Fighter customization: inline name/emoji editing in FighterProfileModal
- Agent landing page: "I'M AN AI AGENT" button, 3-step onboarding flow, copyable SKILL.md URL
- Kick/roundhouse mechanics with separate animation states and boot glow VFX

**Backend (In Progress):**
- PostgreSQL 16 connected locally, migrated, and seeded with sample data
- API routes exist for all entities with zod validation and auth guards
- Seed script working (`npm run db:seed` / `npm run db:reset`)
- Auth0 v4 integrated: proxy.ts active, all protected routes guarded with requireAuth(), user-sync creates DB users on first login
- CI pipeline runs lint, typecheck, tests, and build on every PR to main
- 163+ tests passing: 91 API integration + 27 Solana + 45 frontend (component, credit-safety, navigation, fight)
- Stripe skeleton: checkout session + webhook routes, credit packages, signature verification (lib/stripe.ts, api/stripe/*)
- Agent integration: SKILL.md, agent-card.json, POST /api/agents/register, dual-mode auth (Auth0 + API key), Moltbook identity verification
- Store → API wiring: `placeBetAndDeduct` fires `POST /api/bets` with optimistic deduction + `fetchCredits()` rollback; `spendCreditsTraining` fires `POST /api/training`; `addFighter` fires `POST /api/fighters`; `fetchLeaderboard` uses `GET /api/fighters`
- Solana wallet connect/disconnect in ArenaTopBar (shows truncated address + SOL balance when connected)
- SOL↔credits deposit/withdrawal modal (`SolCreditBridgeModal.tsx`) — builds SOL transfer tx, calls `confirmDeposit()` to credit account
- Credit safety: optimistic updates use `fetchCredits()` for server-sync on success and rollback on failure (no blind `credits + amount`)

**Not Yet Built:**
- Stripe frontend integration (CreditPurchase component exists but not wired to checkout-session API)
- Multiplayer (mock data only)
- Deployment/environment setup

## Scripts

```
npm run dev          → Start dev server
npm run build        → Production build
npm run lint         → ESLint (runs `eslint .` directly — `next lint` removed in Next.js 16)
npm run type-check   → TypeScript checking
npm run db:migrate   → Prisma migrations
npm run db:generate  → Prisma client generation
npm run db:studio    → Prisma Studio
npm run db:seed      → Seed database with sample data
npm run db:reset     → Clean + re-seed database
```

## Design System

See `DESIGN_SYSTEM.md` for the complete visual specification: colors, typography, spacing, borders, buttons, animations, component patterns, and anti-patterns.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in values. Required for backend:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH0_*` — Auth0 tenant credentials (when auth is enabled)

## Recent Workflow Changes (2026-02-18) — READ THIS

The following changes affect **ALL agents on ALL teams**:

1. **New file: `LEARNINGS.md`** — Shared knowledge base at repo root. Contains gotchas about Prisma 7, Next.js 16, Jest/ESM, multi-agent git, auth patterns, credit safety, and canvas rendering. **You must read this before starting work.** If you discover a new gotcha, append it here.

2. **New file: `.github/PRD-TEMPLATE.md`** — For non-trivial features, copy this template and fill it in before breaking work into tasks. Locks scope + acceptance criteria.

3. **Tasks now require acceptance criteria** — Every task must have machine-verifiable pass/fail conditions (e.g., "test X passes", "route returns 200"). Self-verify locally before opening a PR.

4. **AI PR Review runs on every PR** — An automated Claude Code reviewer will post comments on your PR within minutes of opening it. It checks correctness, security, and MFC conventions (requireAuth, no border-radius, zod validation, etc.). This does NOT replace human review — it's a first pass. Fix any issues it flags.

5. **PR checklist updated** — Now requires reading `LEARNINGS.md`, verifying acceptance criteria, and noting new gotchas.

6. **PR #68 (2026-02-18) — Border-radius removal complete** — All 44 instances of `rounded`, `border-radius`, and `borderRadius` removed from 14 component files. Components now comply with pixel-art design system (sharp corners only). This is Phase 1 of custom linter plan; Phase 2 will add ESLint rule.

**No changes to existing code, components, or APIs.** These are process/workflow additions only.

---

## Team Coordination

**This file (CLAUDE.md) is the master coordination document.** Two teams work on this repo:
- **Backend team** — database, API routes, auth, Solana integration
- **Frontend/design team** — components, UI, fight rendering, UX

**Before making ANY code changes:** Read this file AND `LEARNINGS.md` first.
**After making ANY code changes:** Update this file to document what changed. If you discovered a gotcha, append it to `LEARNINGS.md`.

## Task Workflow

Every feature goes through this pipeline:

### 1. PRD (for non-trivial features)
Copy `.github/PRD-TEMPLATE.md` and fill it in before breaking work into tasks. This locks scope, requirements, and acceptance criteria upfront.

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

Agents self-verify acceptance criteria locally before opening a PR. If all criteria pass, the task is done — no ambiguity.

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
5. Test (`npm test -- --selectProjects=api --no-coverage`) — API tests in CI; frontend tests also passing locally
6. Build (`npm run build`)

All steps must pass for a PR to be mergeable.

### AI PR Review (`.github/workflows/ai-pr-review.yml`)
Runs automatically on every PR (opened, synced, reopened, ready for review). Uses OpenAI (gpt-4o) to perform a first-pass code review checking:
- Correctness, security, performance
- MFC conventions (requireAuth, ensureUser, no border-radius, no raw fetch, zod validation, credit safety)
- Compliance with CLAUDE.md patterns

Posts review comments directly on the PR with inline suggestions. This does NOT auto-approve — a human or lead engineer still merges. The AI review catches obvious issues fast so authors get feedback in minutes rather than waiting for a manual review session.

**Setup requirement:** `OPENAI_API_KEY` must be stored as a repository secret in GitHub (Settings → Secrets → Actions).

### Custom Linters

**ESLint rules** (via `eslint-plugin-mfc` in `eslint-rules/`):
- `mfc/no-rounded-corners` (**error**) — flags `rounded`, `rounded-*` Tailwind classes and `borderRadius` styles. MFC uses sharp corners only. Adding rounded corners will fail the build.
- `mfc/no-raw-fetch-in-components` (**error**) — flags raw `fetch()` calls in `components/`. Use `lib/api-client.ts` instead.

**CI route checks** (`scripts/lint-mfc-routes.sh`):
- `requireAuth → ensureUser` — auth-required routes must call both `requireAuth()` and `ensureUser()`.
- `route test coverage` — every route file needs a corresponding test in `__tests__/api/`.

Route checks currently in **warn mode** (non-blocking). Will be promoted to error after Orcus adds missing test files.

### PR Template
`.github/pull_request_template.md` includes a checklist requiring CLAUDE.md compliance, passing checks, and no secrets.

## Branch Protection (Recommended)

These settings should be configured by the repo admin on the `main` branch:
- Require pull request before merging (no direct pushes)
- Require status checks to pass before merging (CI workflow)
- Require at least 1 approval before merging
- Dismiss stale pull request approvals when new commits are pushed
- Do not allow bypassing the above settings

## Testing

Jest 30 with three projects:
- **frontend** (`jsdom`) — component tests in `__tests__/` (45 tests, all passing)
- **api** (`node`) — API route integration tests in `__tests__/api/` (43 tests, all passing)
- **solana** — Solana module tests in `__tests__/solana/` (27 tests, all passing). Per-file `@jest-environment` directives (node for credit-bridge, jsdom for use-wallet hook).

API tests mock the Prisma client, Auth0 session (`requireAuth`), and user sync (`ensureUser`) in `__tests__/api/helpers.ts` and test route handlers directly.

```
npm test                              → Run all tests
npm test -- --selectProjects=api      → Run only API tests
npm test -- --selectProjects=solana   → Run only Solana tests
npm run test:watch                    → Watch mode
npm run test:coverage                 → With coverage
```

## Brand Direction

- Pixel-art with serious sports presentation (not parody)
- ESPN-style overlays, professional tone
- Real rankings, belt system, divisions
- Color scheme: dark bg (#0a0a0f), red accent (#ff4444), blue accent (#4488ff), gold (#ffd700)
- No border-radius anywhere — sharp corners, pixel aesthetic
- See `DESIGN_SYSTEM.md` for full rules

## Compliance

- Structured as an event contract exchange for simulated combat outcomes
- Not a casino, not a sportsbook, not a counterparty
- Compliance pathway TBD with legal counsel

## Revenue Model

| Stream | Description |
|--------|-------------|
| Trading fees | Maker/taker on contract trades |
| Training fees | Fighter progression costs |
| Featured fights | Promoted fight placement |
| Sponsorships | Brand integrations |
