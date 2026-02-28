# Foresight Frontend

React app for the Foresight fantasy CT league. Draft teams, enter contests, track scores, browse the CT feed.

## Stack

- React 18 + TypeScript + Vite
- TailwindCSS for styling
- Privy for wallet/social auth
- Phosphor Icons
- Framer Motion for animations

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Runs on port 5173. Expects the backend running on port 3001.

## Pages

- **Home** (`/`) - Dashboard with current rank, active contests, Foresight Score
- **Draft** (`/draft/:contestId`) - Team builder with formation view, budget system, captain selection
- **Compete** (`/compete`) - Contest listings and global leaderboard
- **Contest Detail** (`/contest/:id`) - Rules, prizes, leaderboard for a specific contest
- **Feed** (`/feed`) - Curated CT tweets from rostered influencers
- **Profile** (`/profile`) - User stats, achievements, team history

## Key components

- `FormationPreview` - 1-2-2 pyramid formation showing your drafted team
- `InfluencerGrid` - Browse and select influencers by tier during draft
- `ScoutingPanel` - Influencer stats and analysis sidebar
- `WelcomeModal` - Onboarding flow for new users

## Testing

```bash
pnpm test
```
