# Foresight

Fantasy sports for Crypto Twitter. Draft teams of real CT influencers, earn points based on their actual Twitter engagement, and compete against other players for prizes.

**Live at [ct-foresight.xyz](https://ct-foresight.xyz)**

## What is this

Foresight turns the CT meta-game into an actual game. Instead of arguing about who's the best account on CT, you put your money where your mouth is.

You draft a team of 5 influencers from a roster of 62 real CT accounts (think @cobie, @hsaka, @blknoiz06). Each influencer has a tier (S/A/B/C) and a price, and you build your team under a 150-point budget. Pick a captain for 2x points. Then your team earns points throughout the week based on what those influencers actually do on Twitter: tweets, engagement, follower growth, viral moments.

Weekly contests run Monday 00:00 to Sunday 23:59 UTC. Free leagues and paid entry leagues with real SOL prizes.

## How scoring works

Every influencer gets scored on 4 factors:

- **Activity** (0-35 pts): How much they tweet
- **Engagement** (0-60 pts): Likes, retweets, replies they get
- **Growth** (0-40 pts): Follower changes
- **Viral** (0-25 pts): Breakout tweets that go way beyond their normal reach

Plus spotlight bonuses (+12/+8/+4) for the top 3 influencers each scoring period.

Captains get a 2x multiplier on all points. Choosing the right captain is usually the difference between winning and losing.

## Tapestry Protocol integration

All social data flows through [Tapestry Protocol](https://www.tapestry.so/) on Solana:

- **Teams**: Every draft submission is stored as immutable content on Tapestry
- **Scores**: Contest results are written back as content updates
- **Profiles**: User identities are linked through Tapestry's profile system
- **Social graph**: Follows and activity feeds run on Tapestry's social layer

This means your draft history, scores, and social connections live onchain rather than in our database alone.

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript, PostgreSQL, Knex.js
- **Auth**: Privy (email/social + Solana wallet)
- **Social layer**: Tapestry Protocol SDK
- **Twitter data**: TwitterAPI.io for real-time influencer metrics
- **Chain**: Solana (devnet)

## Project structure

```
foresight/
  frontend/     React app
  backend/      Express API + scoring engine + cron jobs
  contracts/    Solana smart contracts (Foundry)
  scripts/      Deployment and utility scripts
```

## Running locally

```bash
# Install
pnpm install

# Set up Postgres
psql postgres -c "CREATE DATABASE foresight;"

# Backend
cd backend
cp .env.example .env   # fill in your keys
NODE_OPTIONS='--import tsx' pnpm dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env
pnpm dev
```

Backend runs on :3001, frontend on :5173.

## What's next

- Mainnet SOL prize pools
- Expanding roster from 62 to 200+ influencers
- Daily micro-contests (1-hour sprints alongside weekly leagues)
- Creator leagues where influencers can spin up their own contests
- Scout mode for discovering rising CT accounts before they blow up
- Mobile app (the web app is mobile-first already, but native would be better)

## Built for

Solana Graveyard Hackathon 2026, Tapestry Track.

The thesis is simple: SocialFi died because every attempt was either pay-to-win NFT trading or bot-manipulated engagement farming. Foresight fixes both problems. Budget drafting means everyone starts equal. Multi-factor scoring means you can't game it with a bot army. And Tapestry gives us a real social layer without building it from scratch.
