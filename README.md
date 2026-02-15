# MFC — Molt Fighting Championship

> A Fighting League for AI Agents. Regulated event contract exchange for AI fighter outcomes.

## Overview

MFC is a Next.js web application that simulates AI fighter battles with real-time prediction markets. Built with a pixel-art aesthetic and professional sports presentation, it combines:

- **AI Fighter Simulation**: Deterministic yet probabilistic fight engine with varied attacks, combos, and strategies
- **Prediction Markets**: Continuous order book trading with YES/NO binary contracts
- **Fighter Management**: Own and train AI fighters with persistent stats and progression
- **Live Broadcasting**: Real-time pixel-art fight rendering with dynamic commentary
- **Professional UI**: ESPN-style presentation with Kalshi/Polymarket-quality trading interface

## Features

### 🥊 Enhanced Fight Engine
- Sophisticated combat simulation with jabs, crosses, hooks, uppercuts, and combos
- Advanced defensive mechanics including dodging, blocking, and clinching  
- Dynamic stamina, health, and stun systems
- Combo system with escalating damage bonuses
- Multiple win conditions (KO, TKO, Decision)

### 📊 Advanced Prediction Markets
- Real-time order book with continuous price discovery
- Market prices adjust based on fight momentum and events
- Sophisticated order matching engine
- Visual order book depth with percentage bars
- Trade history and position tracking

### 🎮 Fighter Management
- Persistent AI fighters with 6 core stats (Strength, Speed, Defense, Stamina, Fight IQ, Aggression)
- ELO rating system with win/loss records
- Training system to improve fighter capabilities
- Multiple weight classes and ranking system
- Champion belt progression

### 🎨 Professional Presentation
- Pixel-art rendering engine with smooth animations
- ESPN-style overlays and statistics
- Real-time commentary system with contextual reactions
- Sound effects for immersive experience
- Responsive design for all screen sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom pixel-art theme
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Canvas Rendering**: HTML5 Canvas with pixel-perfect rendering
- **Audio**: Web Audio API with custom sound manager

## Project Structure

```
mfc-app/
├── app/                    # Next.js app router
├── components/            # React components
│   ├── LandingPage.tsx   # Main landing page
│   ├── ArenaPage.tsx     # Main arena container
│   ├── LiveFightSection.tsx # Fight viewing area
│   ├── FightCanvas.tsx   # Pixel-art fight renderer
│   ├── MarketSidebar.tsx # Trading interface
│   ├── FightersSection.tsx # Fighter management
│   └── RankingsSection.tsx # Global rankings
├── lib/                   # Core libraries
│   ├── fight-engine.ts   # Enhanced fight simulation
│   ├── market-engine.ts  # Prediction market logic
│   └── sound-manager.ts  # Audio management
├── types/                # TypeScript definitions
└── public/               # Static assets
    └── sounds/           # Audio files
```

## Key Improvements Over Prototype

### Fight Engine Enhancements
- **Varied Combat**: 6 different attack types with unique properties
- **Defensive Options**: Dodging, blocking, and movement mechanics
- **Combo System**: Chain attacks for bonus damage
- **Stamina Management**: Strategic energy conservation
- **Advanced AI**: Context-aware decision making

### Market Improvements
- **Dynamic Order Book**: Real-time depth visualization
- **Smart Pricing**: Fight-state-aware price adjustments
- **Professional Interface**: Kalshi-inspired trading UI
- **Order Management**: Limit and market order support
- **Trade Feedback**: Audio and visual confirmation

### Visual & Audio Polish
- **Smooth Animations**: 60fps pixel-art rendering
- **Sound Effects**: Contextual audio for all actions
- **Professional UI**: ESPN-quality overlays and stats
- **Responsive Design**: Mobile-optimized layouts
- **Loading States**: Polished transitions and feedback

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This app is configured for seamless deployment to Vercel:

1. Push to GitHub repository
2. Connect to Vercel
3. Deploy automatically

The app includes proper TypeScript configuration, optimized builds, and production-ready settings.

## Credits

Built for Brandon's MFC project - a next-generation AI fighting league with real prediction markets.

---

**Important**: This is a regulated event contract exchange, not a sportsbook.