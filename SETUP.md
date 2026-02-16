# MFC Backend Setup Guide

<!-- Test PR for GitHub Agentic Workflows - minimal change -->

## 🔑 Required API Keys & Configuration

The following API keys and configuration are needed for full production functionality:

### Auth0 Setup
1. Create an Auth0 application at https://manage.auth0.com/
2. Configure the following in your `.env` file:
```
AUTH0_SECRET="generate_32_random_bytes_here"
AUTH0_BASE_URL="http://localhost:3000" (or production URL)
AUTH0_ISSUER_BASE_URL="https://your-auth0-domain.auth0.com"
AUTH0_CLIENT_ID="your_auth0_client_id"
AUTH0_CLIENT_SECRET="your_auth0_client_secret"
```

### Stripe Payment Integration
1. Create a Stripe account at https://dashboard.stripe.com/
2. Get your API keys from the Stripe dashboard:
```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." (for webhooks)
```

### Solana Wallet Integration
1. Generate a Solana keypair for the platform treasury
2. Configure the wallet:
```
SOLANA_PRIVATE_KEY="base58_encoded_private_key"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com" (or devnet for testing)
```

### Database (Already Configured)
- Local Prisma Postgres is set up and running
- For production, replace `DATABASE_URL` with your production PostgreSQL URL

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Start the database:**
```bash
npx prisma dev &
```

3. **Run migrations:**
```bash
npx prisma migrate dev
```

4. **Seed development data (optional):**
```bash
npm run seed
```

5. **Start the development server:**
```bash
npm run dev
```

## 🎯 What's Built

### ✅ Phase 1 - Backend Infrastructure
- [x] PostgreSQL database with Prisma ORM
- [x] User authentication system (Auth0 ready)
- [x] API routes for all core functionality
- [x] Database migrations and schema

### ✅ Phase 2 - Enhanced Fight Algorithm  
- [x] **Training-based stat progression** - Hours trained directly boost fighter stats
- [x] **Record momentum system** - Win/loss streaks affect fight outcomes
- [x] **Upset probability curve** - Always 5-95% range, never 100% certain
- [x] **Server-side fight resolution** - No client-side cheating possible
- [x] **ELO rating system** - Proper competitive rankings

### 🔄 Phase 3 - Monetization (Mocked)
- [x] Training fee system (100% revenue)
- [x] Credits-based economy  
- [x] Betting/prediction markets API
- [ ] Stripe integration (needs API keys)
- [ ] Solana wallet integration (needs wallet setup)

### 📋 API Endpoints

#### Authentication
- `GET/POST /api/auth/[...auth0]` - Auth0 authentication

#### Fighters
- `GET /api/fighters` - Get user's fighters
- `POST /api/fighters` - Create new fighter

#### Training  
- `POST /api/training` - Train fighter (costs credits, improves stats)

#### Fights
- `POST /api/fights` - Run server-side fight simulation

#### Betting
- `GET /api/bets` - Get user's bets
- `POST /api/bets` - Place bet on fight outcome

#### User
- `GET /api/user` - Get user profile and stats
- `PATCH /api/user` - Update user profile

## 🎮 Fight Algorithm Details

The core fight algorithm implements all Phase 2 requirements:

1. **Training drives everything** - Each training session:
   - Costs credits (100% revenue to platform)
   - Improves 1-3 random stats by 1-3 points
   - Has diminishing returns for high stats (80+)
   - Increases future training costs by 5%

2. **Record momentum** - Fighter power calculation includes:
   - Base power from average stats (primary factor)
   - Training bonus: up to +20 points from total training hours
   - Win streak bonus: up to +15% from consecutive wins
   - Loss streak penalty: up to -15% from consecutive losses

3. **Upset probability curve** - Uses logistic function:
   - Always maintains 5-95% probability range
   - Steep curve rewards training investment
   - No fight is ever 100% certain
   - Power differences create meaningful but not insurmountable advantages

4. **Fight simulation generates**:
   - Realistic fight statistics
   - Variable finish methods (KO/TKO/Decision)
   - ELO rating changes
   - Permanent record updates

## 🧪 Mock Data Generation

Run `npm run seed` to generate:
- Sample users with fighters
- Training history
- Fight records  
- Betting markets

This allows full testing without real API keys.

## 🔧 Development Notes

- All payment integrations are mocked until API keys are provided
- Auth0 will need real configuration for authentication to work  
- Solana integration is prepared but not functional without wallet setup
- Database runs locally via Prisma dev server
- All fight logic is server-side to prevent cheating

## 🚢 Production Deployment

1. Set up production database (PostgreSQL)
2. Configure all API keys in environment variables
3. Run `npx prisma migrate deploy` 
4. Deploy to Vercel/similar platform
5. Configure Auth0 callback URLs for production domain

The app is fully production-ready once API keys are configured!