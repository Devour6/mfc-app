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
| Rendering | HTML5 Canvas (pixel-art fight visuals) |
| Audio | Web Audio API via custom SoundManager |
| Database | PostgreSQL 16 via Prisma 7.4 + `@prisma/adapter-pg` (connected, migrated, seeded) |
| Auth | Auth0 (middleware exists, currently disabled) |
| Fonts | Press Start 2P (pixel), Inter (UI) |
| Build | Turbopack |

## Project Structure

```
app/                  → Next.js App Router (layout, page, globals.css)
components/           → 30 React components (~8,000 lines)
lib/                  → Core engines (~3,400 lines)
  ├── fight-engine.ts       → Tick-based combat simulation
  ├── market-engine.ts      → Price discovery + order book
  ├── evolution-engine.ts   → Fighter traits + signature moves
  ├── tournament-engine.ts  → Single-elimination brackets
  ├── achievement-engine.ts → 20+ achievements with rarity tiers
  ├── daily-rewards-engine.ts → Login streak rewards
  ├── credit-engine.ts      → Currency + transaction management
  ├── sound-manager.ts      → Fight-aware audio
  ├── store.ts              → Zustand state management
  ├── prisma.ts             → Prisma client singleton (uses pg adapter)
  ├── api-utils.ts          → API response helpers (jsonResponse, errorResponse, notFound, unauthorized, serverError, validationError)
  ├── validations.ts        → Zod schemas for all API inputs (fighters, fights, bets, training, user, credits)
  ├── api-client.ts         → Typed fetch wrappers for all API routes (frontend→backend bridge)
  └── solana/               → Solana wallet integration
      ├── wallet-provider.tsx  → React context (ConnectionProvider + WalletProvider + WalletModalProvider)
      ├── use-wallet.ts        → Custom hook: connect/disconnect/balance/signAndSend
      └── credit-bridge.ts     → SOL↔credits deposit/withdrawal (devnet, 1 SOL = 1000 credits)
types/index.ts        → Comprehensive type definitions (~370 lines)
prisma/schema.prisma  → DB models: User, Fighter, Training, Fight, FightResult, Bet
prisma.config.ts      → Prisma 7 config (holds DATABASE_URL for migrations)
public/sounds/        → 10 MP3 sound effects
scripts/seed.ts       → DB seed script (creates sample users, fighters, fights, bets)
.env.example          → Environment variable template
app/api/              → API routes (see API Routes section below)
```

## Core Engines

### Fight Engine (`lib/fight-engine.ts`)
- Tick-based simulation at 80ms intervals, 3 rounds × 180 seconds
- Actions: jab, cross, hook, uppercut, combo, dodge, block, clinch, move
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

## State Management

Zustand store (`lib/store.ts`) manages:
- User data (id, name, credits, fighters, trades, settings)
- Game state (tournament, achievements, login streak, credit balance, transactions)
- Currently uses mock data (2 sample fighters on startup)
- Persists to localStorage

## Database Schema (Prisma)

Models: `User`, `Fighter`, `Training`, `Fight`, `FightResult`, `Bet`
Enums: `FighterClass` (LIGHTWEIGHT/MIDDLEWEIGHT/HEAVYWEIGHT), `FightStatus`, `FightMethod`, `BetSide`, `BetStatus`

**Prisma 7 setup:**
- `prisma/schema.prisma` — models only, no `url` in datasource (Prisma 7 requirement)
- `prisma.config.ts` — provides DATABASE_URL for migrations
- `lib/prisma.ts` — uses `@prisma/adapter-pg` with a `pg` Pool for runtime connections
- `scripts/seed.ts` — seeds sample data (run `npm run db:seed` or `npm run db:reset`)

**Status:** Database is connected, migrated, and seeded with sample data (2 users, 5 fighters, fights, bets). PostgreSQL 16 runs locally via Homebrew at `~/.homebrew/opt/postgresql@16/`. Start with: `pg_ctl -D ~/.homebrew/var/postgresql@16 start`

**Note:** Both `prisma.config.ts` and `scripts/seed.ts` load `.env.local` first (Next.js convention), then `.env` as fallback.

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/fighters` | GET, POST | List fighters (with filters), create fighter |
| `/api/fighters/[id]` | GET, PATCH | Get fighter details, update fighter stats |
| `/api/fights` | GET, POST | List fights (with status filter), create fight |
| `/api/fights/[id]` | GET, POST, PATCH | Get fight details, submit result (with round/winner validation), update status (with legal transition enforcement) |
| `/api/user` | GET, POST, PATCH | Get/create/update user profile (email format, username regex validation) |
| `/api/user/credits` | GET, POST | Get credit balance, add/deduct credits (transaction-safe) |
| `/api/bets` | GET, POST | List bets (filter by fight/user/status), place bet (deducts credits, validates fight state) |
| `/api/bets/[id]` | GET, PATCH | Get bet details, settle/cancel bet (credits payout/refund via transaction) |
| `/api/training` | GET, POST | List training sessions, create session (deducts credits, applies random stat gains, caps at 100) |
| `/api/training/[id]` | GET | Get training session details |
| `/api/health` | GET | Health check — returns `{ status, timestamp, db }` |

**Validation:** All routes use zod schemas from `lib/validations.ts` for input validation. Invalid requests return `{ error: "Validation failed", issues: [...] }` with 400 status.

**Fight status transitions:** SCHEDULED→LIVE, SCHEDULED→CANCELLED, LIVE→COMPLETED, LIVE→CANCELLED. All other transitions are rejected.

All routes use `lib/api-utils.ts` for consistent response formatting. Auth middleware migrated to `proxy.ts` (Next.js 16 convention) but is currently disabled — routes are unprotected.

## What Works (Prototype Status)

**Functional:**
- Full fight simulation engine with tick-based combat
- Real-time market pricing reacting to fight state
- Pixel-art canvas fight rendering with visual effects
- Achievement and daily reward systems
- Credit economy with purchase/withdrawal UI
- Fighter progression with traits and signature moves
- Tournament bracket structure
- Sound effects system
- Responsive UI with mobile nav
- Zustand persistence

**Backend (In Progress):**
- PostgreSQL 16 connected locally, migrated, and seeded with sample data
- API routes exist for all entities with zod validation (need auth guards)
- Seed script working (`npm run db:seed` / `npm run db:reset`)
- Auth0 proxy exists but disabled (migrated from middleware.ts to proxy.ts for Next.js 16)
- CI pipeline runs lint, typecheck, tests, and build on every PR to main
- 44 API integration tests covering all route handlers

**Not Yet Built:**
- Auth0 authentication flow (middleware disabled, routes unprotected)
- Stripe payment integration
- Solana wallet integration (scaffold built: provider, hook, credit bridge — needs frontend wiring + mainnet config)
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

## Team Coordination

**This file (CLAUDE.md) is the master coordination document.** Two teams work on this repo:
- **Backend team** — database, API routes, auth, Solana integration
- **Frontend/design team** — components, UI, fight rendering, UX

**Before making ANY code changes:** Read this file first.
**After making ANY code changes:** Update this file to document what changed.

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`) runs on every PR to `main` and on push to `main`:
1. Checkout + install deps (`npm ci`)
2. Lint (`npm run lint`)
3. Type check (`npm run type-check`)
4. Test (`npm test`)
5. Build (`npm run build`)

All steps must pass for a PR to be mergeable.

**PR template** (`.github/pull_request_template.md`) includes a checklist requiring CLAUDE.md compliance, passing checks, and no secrets.

## Branch Protection (Recommended)

These settings should be configured by the repo admin on the `main` branch:
- Require pull request before merging (no direct pushes)
- Require status checks to pass before merging (CI workflow)
- Require at least 1 approval before merging
- Dismiss stale pull request approvals when new commits are pushed
- Do not allow bypassing the above settings

## Testing

Jest 30 with two projects:
- **frontend** (`jsdom`) — component tests in `__tests__/` (pre-existing, some failing)
<<<<<<< HEAD
- **api** (`node`) — API route integration tests in `__tests__/api/` (44 tests, all passing)
=======
- **api** (`node`) — API route integration tests in `__tests__/api/` (42 tests, all passing)
>>>>>>> d26a26d (feat: Scaffold Solana wallet adapter + credit bridge)

API tests mock the Prisma client (`__tests__/api/helpers.ts`) and test route handlers directly.

```
npm test                          → Run all tests
npm test -- --selectProjects=api  → Run only API tests
npm run test:watch                → Watch mode
npm run test:coverage             → With coverage
```

## Known Lint Issues

4 pre-existing `react/no-unescaped-entities` errors in frontend components (`DailyRewards.tsx`, `EnhancedTrainingInterface.tsx`, `ErrorBoundary.tsx`). These need to be fixed by the frontend team to make the lint step pass in CI. Unescaped `'` characters should be replaced with `&apos;`.

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
