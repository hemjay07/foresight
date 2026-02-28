# Foresight Backend

Express API powering the Foresight fantasy CT league. Handles authentication, team drafting, scoring, contests, and Tapestry Protocol integration.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL + Knex.js (migrations + query builder)
- Privy for auth (email/social + Solana wallet)
- Tapestry Protocol SDK for onchain social data
- TwitterAPI.io for influencer metrics
- node-cron for scheduled scoring jobs

## Setup

```bash
pnpm install
cp .env.example .env  # fill in your keys
NODE_OPTIONS='--import tsx' pnpm exec knex migrate:latest
NODE_OPTIONS='--import tsx' pnpm dev
```

Runs on port 3001.

## Key directories

```
src/
  api/            Route handlers (auth, draft, contests, feed, scoring)
  services/       Business logic (scoring engine, Twitter scraper, Tapestry integration)
  middleware/     Auth, rate limiting, error handling
  utils/          DB connection, helpers
migrations/       Knex migration files
seeds/            Influencer roster + demo data
tests/            Vitest test suites
```

## Cron jobs

The backend runs scheduled tasks for scoring and data collection:

- **Twitter scraper**: Pulls engagement metrics for all 62 influencers
- **Scoring engine**: Calculates team scores from influencer performance
- **Weekly snapshots**: Captures leaderboard state for contest finalization

## API overview

- `POST /api/auth/privy` - Authenticate via Privy token
- `GET /api/league/influencers` - Get all draftable influencers
- `GET /api/v2/fs/contests` - List active contests
- `POST /api/v2/fs/contests/:id/enter` - Enter a contest with team
- `GET /api/v2/fs/contests/:id/leaderboard` - Contest leaderboard
- `GET /api/ct-feed` - CT feed (curated influencer tweets)
- `GET /api/v2/fs/me` - Current user profile + Foresight Score

## Testing

```bash
pnpm test
```
