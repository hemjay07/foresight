# Architecture Reference

## Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (local: `foresight`)
- **ORM:** Knex.js (migrations + queries)
- **Auth:** SIWE (Sign-In With Ethereum) + JWT
- **Twitter Data:** twitterapi.io (API key in .env)

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** TailwindCSS
- **Icons:** Phosphor Icons
- **Web3:** wagmi + viem + RainbowKit
- **State:** React Context + local state

### Smart Contracts
- **Chain:** Base Sepolia (testnet)
- **Framework:** Foundry
- **Contracts:** See `frontend/src/contracts/addresses.ts`

## Directory Structure

```
/Users/yonko/foresight/
├── backend/
│   ├── src/
│   │   ├── api/           # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── scripts/       # One-off scripts
│   │   └── utils/         # Helpers
│   ├── migrations/        # Knex migrations
│   └── tests/             # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # React contexts
│   │   └── contracts/     # ABIs + addresses
│   └── tests/             # Frontend tests
├── contracts/             # Solidity + Foundry
├── docs/                  # Design/planning docs
├── .claude/               # Claude Code config
│   ├── rules/             # Development rules
│   └── docs/              # Reference docs
├── CLAUDE.md              # Main context file
└── TODO.md                # Task tracker
```

## Database Schema

### Core Tables
- `users` - Wallet address, username, signup_number
- `influencers` - CT accounts (74 total, tiers S/A/B/C)
- `influencer_metrics` - Twitter stats (scraped daily)
- `fantasy_contests` - Weekly/daily contests
- `user_teams` - User's drafted teams
- `team_picks` - Influencers in each team

### Foresight Score Tables
- `foresight_scores` - FS totals per user
- `foresight_score_transactions` - FS audit trail
- `leaderboard_snapshots` - Historical rankings

### Quest Tables
- `quest_definitions_v2` - Quest config (27 quests)
- `user_quests_v2` - User progress

### Session Tables
- `sessions` - JWT token management

## API Conventions

### Authentication
- SIWE for wallet login → JWT token
- Token in `Authorization: Bearer <token>` header
- Stored in `localStorage.authToken`

### Response Format
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "message" }
```

## Cron Jobs
See `backend/src/services/cronJobs.ts` for scheduled tasks.

## Foresight Score System

### Tier Thresholds
| Tier | FS Required | Multiplier |
|------|-------------|------------|
| Bronze | 0 | 1.0x |
| Silver | 1,000 | 1.05x |
| Gold | 5,000 | 1.1x |
| Platinum | 20,000 | 1.15x |
| Diamond | 50,000 | 1.2x |

### Early Adopter Multipliers
| User # | Tier | Multiplier | Duration |
|--------|------|------------|----------|
| 1-1,000 | Founding Member | 1.5x | 90 days |
| 1,001-5,000 | Early Adopter | 1.25x | 60 days |
| 5,001-10,000 | Early Bird | 1.1x | 30 days |
