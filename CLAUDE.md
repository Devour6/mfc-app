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
| Database | PostgreSQL via Prisma 7.4 (schema exists, not connected) |
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
  └── prisma.ts             → Prisma client singleton
types/index.ts        → Comprehensive type definitions (~370 lines)
prisma/schema.prisma  → DB models: User, Fighter, Training, Fight, FightResult, Bet
public/sounds/        → 10 MP3 sound effects
scripts/              → DB seed script (disabled)
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

**Not yet connected** — schema exists but no migrations have been run.

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

**Not Yet Built:**
- Auth0 authentication (middleware disabled)
- API routes (planned paths exist, no implementation)
- Database connection (Prisma schema only)
- Stripe payment integration
- Solana wallet integration (component shell only)
- Multiplayer (mock data only)
- Deployment/environment setup

## Scripts

```
npm run dev          → Start dev server
npm run build        → Production build
npm run lint         → ESLint
npm run type-check   → TypeScript checking
npm run db:migrate   → Prisma migrations
npm run db:generate  → Prisma client generation
npm run db:studio    → Prisma Studio
```

## Design System

See `DESIGN_SYSTEM.md` for the complete visual specification: colors, typography, spacing, borders, buttons, animations, component patterns, and anti-patterns.

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
