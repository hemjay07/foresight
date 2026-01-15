# CT league - Deployment Guide

This guide covers deploying all components of the CT league platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

### Required Accounts & Services

- **Base Sepolia/Mainnet Wallet**: With ETH for deployment gas
- **PostgreSQL Database**: Railway, Neon, Supabase, or self-hosted
- **Redis Instance**: Upstash, Railway, or self-hosted
- **Twitter API**: Developer account with API v2 Bearer token
- **Reown (WalletConnect)**: Free project ID from https://cloud.reown.com
- **Backend Hosting**: Railway, Render, or similar
- **Frontend Hosting**: Vercel, Netlify, or similar

### Development Tools

```bash
# Node.js 20+
node --version

# pnpm package manager
pnpm --version

# Foundry for smart contracts
forge --version

# PostgreSQL client (optional)
psql --version
```

---

## Smart Contract Deployment

### 1. Configure Deployment Wallet

Create `contracts/.env`:

```bash
# Copy from template
cp contracts/.env.example contracts/.env

# Edit with your values
PRIVATE_KEY=your_deployer_private_key_without_0x
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# Or use Alchemy/Infura:
# BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

BASESCAN_API_KEY=your_basescan_api_key_for_verification
```

### 2. Test Compilation

```bash
cd contracts
forge build
```

### 3. Run Tests (when Forge is working)

```bash
forge test -vvv
```

### 4. Deploy to Base Sepolia

```bash
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify -vvvv
```

**Expected Output:**
```
Deploying on chain: 84532

Step 1: Deploying Treasury...
  ✅ Treasury deployed: 0x...

Step 2: Deploying ReputationEngine...
  ✅ ReputationEngine deployed: 0x...

Step 3: Deploying ForesightNFT...
  ✅ ForesightNFT deployed: 0x...

Step 4: Deploying CTDraft...
  ✅ CTDraft deployed: 0x...

Step 5: Deploying TimecasterArena...
  ✅ TimecasterArena deployed: 0x...

Step 6: Deploying DailyGauntlet...
  ✅ DailyGauntlet deployed: 0x...
```

### 5. Save Contract Addresses

Copy the deployment addresses to:
- `backend/.env` - Update all contract addresses
- `frontend/.env` - Update all contract addresses

---

## Database Setup

### Option A: Railway (Recommended)

1. Create new project: https://railway.app/new
2. Add PostgreSQL service
3. Add Redis service
4. Copy connection strings

### Option B: Neon/Supabase

1. Create PostgreSQL database
2. Get connection string
3. Setup Redis separately (Upstash recommended)

### Configure Backend Database

```bash
cd backend

# Copy env template
cp .env.example .env

# Edit with your values
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://default:password@host:6379
```

### Run Migrations

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Seed data (100 influencers + 25 Whisperer questions)
pnpm db:seed
```

**Verify:**
```bash
# Check tables were created
psql $DATABASE_URL -c "\dt"

# Should show 18 tables
```

---

## Backend Deployment

### 1. Configure Environment Variables

Update `backend/.env` with all values from `.env.example`:

**Critical Variables:**
```bash
# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app

# Database (from Railway/Neon)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# JWT Secret (generate strong secret)
JWT_SECRET=$(openssl rand -base64 32)

# Twitter API v2
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Smart Contract Addresses (from deployment)
TREASURY_ADDRESS=0x...
REPUTATION_ENGINE_ADDRESS=0x...
FORESIGHT_NFT_ADDRESS=0x...
CT_DRAFT_ADDRESS=0x...
TIMECASTER_ARENA_ADDRESS=0x...
DAILY_GAUNTLET_ADDRESS=0x...

# Oracle Keeper Wallet (for resolving predictions)
KEEPER_PRIVATE_KEY=your_keeper_wallet_private_key
BASE_RPC_URL=https://sepolia.base.org
```

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

**Or manually:**
1. Push to GitHub
2. Connect Railway to repository
3. Set root directory: `/backend`
4. Add environment variables
5. Deploy

### 3. Deploy to Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `cd backend && pnpm install && pnpm build`
   - **Start Command**: `cd backend && pnpm start`
4. Add environment variables
5. Deploy

### 4. Verify Backend

```bash
# Check health endpoint
curl https://your-backend.railway.app/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-01-15T...",
  "uptime": 123.456,
  "websocket": {
    "connected": 0
  }
}

# Check cron jobs
curl https://your-backend.railway.app/api/admin/cron-status
```

---

## Frontend Deployment

### 1. Configure Environment Variables

Create `frontend/.env`:

```bash
# Reown Project ID (get free at https://cloud.reown.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Backend API URL
VITE_API_URL=https://your-backend.railway.app

# Smart Contract Addresses (from deployment)
VITE_TREASURY_ADDRESS=0x...
VITE_REPUTATION_ENGINE_ADDRESS=0x...
VITE_FORESIGHT_NFT_ADDRESS=0x...
VITE_CT_DRAFT_ADDRESS=0x...
VITE_TIMECASTER_ARENA_ADDRESS=0x...
VITE_DAILY_GAUNTLET_ADDRESS=0x...
```

### 2. Test Locally

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:5173
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

**Or via Vercel Dashboard:**
1. Import GitHub repository
2. Framework Preset: Vite
3. Root Directory: `frontend`
4. Add environment variables
5. Deploy

### 4. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
pnpm build
netlify deploy --prod --dir=dist
```

---

## Post-Deployment Verification

### 1. Smart Contracts

```bash
# Verify on Basescan
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain base-sepolia

# Test interactions
cast call <REPUTATION_ENGINE_ADDRESS> "getReputation(address)" <YOUR_ADDRESS> --rpc-url base-sepolia
```

### 2. Backend Services

```bash
# Check all endpoints
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/api/draft/influencers
curl https://your-backend.railway.app/api/whisperer/leaderboard
curl https://your-backend.railway.app/api/arena/duels
curl https://your-backend.railway.app/api/gauntlet/today
```

### 3. Frontend

- [ ] Visit deployed URL
- [ ] Connect wallet (MetaMask/Coinbase)
- [ ] Navigate all 4 apps (Draft, Whisperer, Arena, Gauntlet)
- [ ] Check Profile page
- [ ] Check Leaderboard page
- [ ] Verify no console errors

### 4. Cron Jobs

Wait 15 minutes and verify:

```bash
# Check Twitter scraper ran
curl https://your-backend.railway.app/api/admin/cron-status

# Check database for updated influencer data
psql $DATABASE_URL -c "SELECT twitter_handle, updated_at FROM influencers ORDER BY updated_at DESC LIMIT 5;"
```

---

## Monitoring & Maintenance

### Recommended Services

- **Error Tracking**: Sentry (add SENTRY_DSN to backend .env)
- **Analytics**: PostHog (add POSTHOG_API_KEY to backend .env)
- **Uptime**: BetterStack, Uptime Robot
- **Logs**: Railway/Render built-in logs

### Database Backups

```bash
# Railway: automatic daily backups
# Manual backup:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Contract Upgrades

Contracts are **not upgradeable**. For updates:
1. Deploy new contracts
2. Migrate data if needed
3. Update addresses in backend/frontend
4. Redeploy

---

## Troubleshooting

### Backend Won't Start

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli -u $REDIS_URL ping

# View logs
railway logs  # or check Render logs
```

### Frontend Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

### Cron Jobs Not Running

1. Check backend logs for errors
2. Verify Twitter API token is valid
3. Ensure KEEPER_PRIVATE_KEY has Base Sepolia ETH
4. Check RPC URL is working

### WebSocket Issues

1. Ensure backend PORT is correct
2. Check CORS configuration (FRONTEND_URL)
3. Verify WebSocket endpoints are exposed

---

## Cost Estimates

### Monthly Costs (Testnet)

- **Railway** (Hobby): $5/month (backend + PostgreSQL + Redis)
- **Vercel** (Hobby): Free tier (frontend)
- **Twitter API** (Basic): Free tier
- **Base Sepolia**: Free (testnet ETH from faucet)

**Total: ~$5/month**

### Production Costs

- **Railway** (Pro): $20/month
- **Vercel** (Pro): $20/month
- **Twitter API** (Basic): $100/month
- **Base Mainnet**: Gas fees variable
- **Reown**: Free tier

**Total: ~$140/month + gas**

---

## Security Checklist

- [ ] All `.env` files added to `.gitignore`
- [ ] Strong JWT secret generated
- [ ] Database credentials secured
- [ ] Keeper private key secured
- [ ] Smart contracts verified on Basescan
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enabled (automatic on Vercel/Railway)

---

## Support

- **GitHub Issues**: https://github.com/your-username/timecaster/issues
- **Documentation**: README.md files in each directory
- **Smart Contract Docs**: `/contracts/README.md`
- **Backend API Docs**: `/backend/README.md`
- **Frontend Docs**: `/frontend/README.md`

---

**Deployment Complete! 🎉**

Your CT league platform is now live on Base Sepolia.
