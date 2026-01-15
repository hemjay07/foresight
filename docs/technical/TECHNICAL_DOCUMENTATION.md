# Foresight: CT Draft - Technical Documentation

**Version:** 1.0.0
**Last Updated:** November 2025
**Project Type:** Web3 Fantasy Sports Platform for Crypto Twitter

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Authentication Flow](#authentication-flow)
9. [Key Features & Workflows](#key-features--workflows)
10. [Web3 Integration](#web3-integration)
11. [Setup & Installation](#setup--installation)
12. [Deployment](#deployment)
13. [Security](#security)
14. [Future Roadmap](#future-roadmap)

---

## Project Overview

### Background

**Foresight (CT Draft)** is a standalone Web3 fantasy sports platform extracted from the larger **Timecaster** project. While Timecaster encompassed multiple game modes (Arena battles, Daily Gauntlet, Whisperer trivia, CT Draft fantasy league), this project focuses exclusively on the **CT Draft** fantasy league experience.

### What is CT Draft?

CT Draft is a **fantasy sports game for Crypto Twitter**. Users draft teams of 5 CT influencers within a 25M budget constraint, then compete by voting on the best crypto takes each day. Points are awarded based on community votes, with teams climbing weekly leaderboards to earn rewards.

### Core Value Proposition

- **Fantasy Sports Meets Crypto Twitter**: Gamify CT engagement
- **Community-Driven**: Voting determines winners, not algorithms
- **Skill-Based Competition**: Strategic drafting within budget constraints
- **Social Features**: Create private leagues with friends, share strategies
- **Web3 Native**: Wallet authentication (SIWE), blockchain integration optional

### Target Users

- Crypto Twitter enthusiasts
- Fantasy sports fans
- DeFi/NFT community members
- CT influencer followers
- Competitive gamers seeking alpha

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
│  localhost:5173 │
└────────┬────────┘
         │ HTTP/WebSocket
         │ JWT Auth
         ▼
┌─────────────────┐      ┌──────────────┐
│    Backend      │◄────►│  PostgreSQL  │
│ (Express/Node)  │      │   Database   │
│  localhost:3001 │      │              │
└────────┬────────┘      └──────────────┘
         │
         │ (Optional)
         ▼
┌─────────────────┐
│  Smart Contracts│
│  Base Sepolia   │
│  (Future)       │
└─────────────────┘
```

### Design Philosophy

1. **Progressive Enhancement**: Works without Web3, enhanced with blockchain
2. **API-First**: RESTful backend, frontend-agnostic
3. **Real-time Updates**: WebSocket for live presence, scores
4. **Modular**: Features can be enabled/disabled independently
5. **Security First**: SIWE authentication, JWT tokens, rate limiting

---

## Technology Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | Server execution |
| Framework | Express.js | 4.18.2 | HTTP server |
| Language | TypeScript | 5.3.3 | Type safety |
| Database | PostgreSQL | 15+ | Data persistence |
| Query Builder | Knex.js | 3.1.0 | SQL abstraction |
| Authentication | SIWE | 2.3.2 | Wallet sign-in |
| Tokens | jsonwebtoken | 9.0.2 | JWT creation/verification |
| Real-time | Socket.io | 4.8.1 | WebSocket server |
| Scheduling | node-cron | 3.0.3 | Automated tasks |
| Security | Helmet | 8.0.0 | HTTP headers |
| CORS | cors | 2.8.5 | Cross-origin |
| Rate Limiting | express-rate-limit | 7.5.0 | API protection |

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React | 19.1.1 | UI library |
| Build Tool | Vite | 7.1.7 | Dev server & bundler |
| Language | TypeScript | 5.9.3 | Type safety |
| Routing | React Router | 7.9.5 | SPA navigation |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| State (Server) | TanStack Query | 5.90.7 | Server state caching |
| Web3 Core | Wagmi | 2.19.2 | Ethereum hooks |
| Web3 UI | RainbowKit | 2.2.9 | Wallet connection UI |
| Ethereum | Viem | 2.38.6 | Low-level Web3 |
| Authentication | SIWE | 2.3.2 | Message signing |
| Animations | Framer Motion | 12.23.24 | UI animations |
| Icons | Lucide + Phosphor | - | Icon sets |
| Utils | axios, date-fns | - | HTTP, dates |

### Database

- **PostgreSQL 15+** (via Homebrew on macOS)
- **Connection URL**: `postgresql://localhost:5432/foresight`
- **No password required** (local dev setup)

### Blockchain

- **Network**: Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC URL**: `https://sepolia.base.org`

---

## Backend Architecture

### Project Structure

```
backend/
├── src/
│   ├── api/                      # Route handlers
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── users.ts             # User profile management
│   │   ├── league.ts            # Fantasy league logic
│   │   ├── privateLeagues.ts    # Private league creation
│   │   └── admin.ts             # Admin statistics
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── rateLimiter.ts       # Rate limiting configs
│   │   └── errorHandler.ts     # Global error handling
│   ├── utils/
│   │   ├── db.ts                # Database connection
│   │   └── auth.ts              # SIWE & JWT utilities
│   ├── server.ts                # Express app setup
│   └── index.ts                 # Entry point
├── migrations/                   # Database migrations (Knex)
│   ├── 20241116000000_initial_schema.ts
│   ├── 20241116000001_xp_system.ts
│   ├── 20241116000002_streak_system.ts
│   └── ...
├── seeds/                        # Seed data
│   └── 01_influencers.ts        # 20 CT influencers
├── .env                         # Environment variables
├── knexfile.ts                  # Database config
├── package.json
└── tsconfig.json
```

### Core Modules

#### 1. Authentication (`src/api/auth.ts`)

Handles SIWE (Sign-In with Ethereum) authentication:

```typescript
// Key endpoints:
POST /api/auth/nonce              // Get challenge nonce
POST /api/auth/verify             // Verify signature, return JWT
POST /api/auth/login              // Alias for verify
POST /api/auth/refresh            // Refresh access token
POST /api/auth/logout             // Invalidate session
GET  /api/auth/me                 // Get current user
```

**Flow**:
1. Client requests nonce
2. Client signs SIWE message with wallet
3. Server verifies signature using SIWE library
4. Server creates/finds user in database
5. Server returns access token (15min) + refresh token (7 days)
6. Client stores tokens in localStorage

#### 2. User Management (`src/api/users.ts`)

User profiles and leaderboards:

```typescript
GET  /api/users/:walletAddress    // Public profile
PATCH /api/users/profile           // Update profile (auth required)
GET  /api/users/leaderboard        // Top users by CT Mastery Score
```

#### 3. Fantasy League (`src/api/league.ts`)

Main game logic:

```typescript
// Contest Management
GET  /api/league/contests/active   // All active contests (FREE & PRIZE) (PUBLIC)
GET  /api/league/contest/current   // Single active contest (DEPRECATED) (PUBLIC)
GET  /api/league/leaderboard/:id?  // Rankings (PUBLIC)

// Team Management
GET  /api/league/team/me?contest_id=X  // My team for specific contest (AUTH)
POST /api/league/team/create       // Draft team (AUTH, +50 XP)
                                   // Body: { team_name, influencer_ids, captain_id, contest_id }
PUT  /api/league/team/update       // Update picks (AUTH)
POST /api/league/team/lock         // Lock team (AUTH, +25 XP)

// Influencers
GET  /api/league/influencers       // 50 available players (PUBLIC)

// Voting
POST /api/league/vote              // Submit daily vote (AUTH, +10 XP)
GET  /api/league/vote/status       // Check if voted today (AUTH)
GET  /api/league/vote/leaderboard  // Today's vote rankings (PUBLIC)
```

**Budget Rules**:
- Total team cost: Max 150 points
- 5 influencers required
- Tier pricing: S (~40pts), A (~30pts), B (~20pts), C (~12pts)
- Captain selection required (2x points multiplier)

#### 4. Private Leagues (`src/api/privateLeagues.ts`)

User-created competitive leagues:

```typescript
POST /api/private-leagues/create         // Create league (AUTH)
GET  /api/private-leagues/:code          // Get league details (PUBLIC)
POST /api/private-leagues/join           // Join with code (AUTH)
GET  /api/private-leagues/my-leagues     // User's leagues (AUTH)
GET  /api/private-leagues/:id/leaderboard // League rankings (PUBLIC)
POST /api/private-leagues/:id/distribute  // Pay prizes (CREATOR)
```

**League Features**:
- Unique 8-character invite codes
- Entry fees (0-1 ETH range)
- Prize pool with 15% platform fee
- Prize distributions: winner_takes_all, top_3, top_5
- Max members: 2-100

### Middleware Stack

```typescript
// Request Pipeline:
1. CORS                    // Allow frontend origin
2. Helmet                  // Security headers
3. express.json()          // Body parsing
4. Rate Limiter            // Abuse prevention
5. Routes                  // Application logic
6. 404 Handler             // Unknown routes
7. Error Handler           // Catch all errors
```

### Real-time Features (Socket.io)

```typescript
// Server events:
io.on('connection', (socket) => {
  // Track online users
  emit('user:online', { count: onlineUsers });

  // Live score updates
  emit('scores:update', { teamId, newScore });

  // Vote notifications
  emit('vote:cast', { influencerId, votes });
});
```

### Background Jobs (node-cron)

```typescript
// Scheduled tasks:
// Every day at midnight UTC
'0 0 * * *': resetDailyVotes()
'0 0 * * *': calculateDailyScores()
'0 0 * * 1': startNewContest()     // Monday
'0 0 * * 0': finalizeContest()      // Sunday
```

---

## Frontend Architecture

### Project Structure

```
frontend/src/
├── pages/                       # Route components
│   ├── Home.tsx                # Landing page
│   ├── League.tsx              # Fantasy draft & leaderboards
│   ├── Vote.tsx                # Daily voting
│   └── Profile.tsx             # User profile
├── components/
│   ├── Layout.tsx              # App shell
│   ├── home/
│   │   └── SmartHeroBanner.tsx
│   ├── draft/                  # League components
│   │   ├── InfluencerCard.tsx  # Player card
│   │   ├── TeamBoard.tsx       # Team display
│   │   ├── TeamCard.tsx        # Compact team view
│   │   ├── PrivateLeagues.tsx  # League management
│   │   └── PrivateLeagueLeaderboard.tsx
│   └── modals/                 # Modal dialogs
├── contexts/
│   ├── RealtimeContext.tsx     # WebSocket state
│   └── NotificationContext.tsx # Toast system
├── contracts/
│   ├── addresses.ts            # Contract addresses
│   ├── abis.ts                 # Contract ABIs
│   └── hooks/                  # Web3 hooks
├── config/
│   └── wagmi.ts                # RainbowKit config
├── utils/
│   └── api.ts                  # Backend API client
├── types/
│   └── index.ts                # TypeScript types
├── App.tsx                     # Root with providers
├── main.tsx                    # Entry point
└── index.css                   # Tailwind + custom styles
```

### Routing

```typescript
// Routes (React Router v7)
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/draft" element={<League />} />
  <Route path="/league" element={<League />} />  // Alias
  <Route path="/vote" element={<Vote />} />
  <Route path="/profile" element={<Profile />} />
</Routes>
```

### State Management

#### 1. TanStack Query (Server State)

```typescript
// Cached API responses
const { data: influencers } = useQuery({
  queryKey: ['influencers'],
  queryFn: () => api.getInfluencers(),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

const { data: team } = useQuery({
  queryKey: ['team', userId],
  queryFn: () => api.getUserTeam(),
  enabled: !!userId,  // Only fetch if authenticated
});
```

#### 2. React Context (Global State)

```typescript
// RealtimeContext.tsx - WebSocket connection
<RealtimeProvider>
  {children}
</RealtimeProvider>

const { onlineUsers, isConnected } = useRealtime();
```

#### 3. Wagmi Hooks (Web3 State)

```typescript
const { address, isConnected } = useAccount();
const { signMessageAsync } = useSignMessage();
```

### Component Patterns

#### Layout Component

```typescript
<Layout>
  <Header>
    <Logo />
    <OnlineUsers />
    <ProfileIcon />
    <ConnectButton />
  </Header>

  <Navigation>
    <NavTab to="/" icon={House}>Home</NavTab>
    <NavTab to="/draft" icon={Trophy} highlight>CT Draft</NavTab>
    <NavTab to="/vote" icon={Target}>Vote</NavTab>
    <NavTab to="/profile" icon={Users}>Profile</NavTab>
  </Navigation>

  <Main>{children}</Main>

  <Footer />
</Layout>
```

#### League Page (Main Feature)

```typescript
// Three view modes:
<LeaguePage>
  <ViewTabs>
    <Tab active={view === 'my-team'}>My Team</Tab>
    <Tab active={view === 'leaderboard'}>Leaderboard</Tab>
    <Tab active={view === 'private'}>Private Leagues</Tab>
  </ViewTabs>

  {view === 'my-team' && (
    team ? <TeamBoard team={team} /> : <TeamCreation />
  )}

  {view === 'leaderboard' && (
    <Leaderboard teams={teams} />
  )}

  {view === 'private' && (
    <PrivateLeagues />
  )}
</LeaguePage>
```

### API Client (`utils/api.ts`)

Centralized backend communication:

```typescript
class API {
  private baseURL = import.meta.env.VITE_API_URL;
  private axios = axios.create({ baseURL: this.baseURL });

  constructor() {
    // Attach token to requests
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Refresh token on 401
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return this.axios.request(error.config);
        }
        throw error;
      }
    );
  }

  // Auth methods
  async getNonce() { ... }
  async login(message, signature) { ... }
  async refreshToken() { ... }

  // League methods
  async getInfluencers() { ... }
  async createTeam(teamData) { ... }
  async vote(influencerId) { ... }
}

export default new API();
```

### Styling Strategy

**Tailwind CSS** with custom utilities:

```css
/* Base colors */
--color-base-blue: #3B82F6;
--color-purple: #A855F7;
--color-cyan: #06B6D4;

/* Custom utilities */
.text-gradient-cyan-blue {
  background: linear-gradient(to right, var(--color-cyan), var(--color-base-blue));
  -webkit-background-clip: text;
  color: transparent;
}

.glass-card {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Design System**:
- Typography: Inter font family
- Border radius: 8px (lg), 12px (xl)
- Shadows: Colored shadows matching gradients
- Hover states: Scale 1.05, brightness increase
- Loading: Skeleton screens, not spinners

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (UUID)   │◄────┐
│ wallet_addr │     │
│ username    │     │
└─────────────┘     │
       │            │
       │ 1:N        │
       ▼            │
┌──────────────┐    │
│ user_teams   │    │
├──────────────┤    │
│ id           │    │
│ user_id      │────┘
│ contest_id   │────┐
│ team_name    │    │
│ total_score  │    │
└──────────────┘    │
       │            │
       │ 1:N        │
       ▼            │
┌──────────────┐    │
│ team_picks   │    │
├──────────────┤    │
│ team_id      │    │
│ influencer_id│────┐
│ pick_order   │    │
└──────────────┘    │
                    │
┌─────────────┐     │
│ influencers │◄────┘
├─────────────┤
│ id          │
│ twitter_hdl │
│ display_name│
│ tier (S/A/B)│
│ price       │
└─────────────┘

┌──────────────────┐
│ fantasy_contests │◄────┐
├──────────────────┤     │
│ id               │     │
│ contest_key      │     │
│ start_date       │     │
│ end_date         │     │
└──────────────────┘     │
                         │
                    (contest_id)
```

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  twitter_handle VARCHAR(50),
  avatar_url VARCHAR(500),
  ct_mastery_score INTEGER DEFAULT 0,
  ct_mastery_level VARCHAR(20) DEFAULT 'NOVICE',
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);
```

**CT Mastery Levels**: NOVICE, EMERGING, EXPERT, VISIONARY, LEGENDARY

#### influencers
```sql
CREATE TABLE influencers (
  id SERIAL PRIMARY KEY,
  twitter_handle VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  tier VARCHAR(1) DEFAULT 'C',              -- S, A, B
  price DECIMAL(10,2) DEFAULT 5.0,          -- Budget cost (M)
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  form_score INTEGER DEFAULT 0,              -- Recent performance
  total_points INTEGER DEFAULT 0,            -- All-time points
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Current Influencers** (50 total):
- S-Tier (10): Premium CT influencers (~40pts each)
- A-Tier (15): High-tier CT voices (~30pts each)
- B-Tier (15): Mid-tier CT personalities (~20pts each)
- C-Tier (10): Emerging CT influencers (~12pts each)

#### fantasy_contests
```sql
CREATE TABLE fantasy_contests (
  id SERIAL PRIMARY KEY,
  contest_key VARCHAR(50) UNIQUE NOT NULL,   -- e.g. 'week-47-2024'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming',      -- upcoming, active, completed
  total_participants INTEGER DEFAULT 0,
  max_participants INTEGER,
  prize_pool DECIMAL(18,6),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_teams
```sql
CREATE TABLE user_teams (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  contest_id INTEGER REFERENCES fantasy_contests(id),
  team_name VARCHAR(100) NOT NULL,
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contest_id)                -- One team per contest
);
```

#### team_picks
```sql
CREATE TABLE team_picks (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES user_teams(id) ON DELETE CASCADE,
  influencer_id INTEGER REFERENCES influencers(id),
  pick_order INTEGER CHECK (pick_order BETWEEN 1 AND 5),
  daily_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, pick_order),               -- 5 picks per team
  UNIQUE(team_id, influencer_id)             -- No duplicate influencers
);
```

#### daily_votes
```sql
CREATE TABLE daily_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  influencer_id INTEGER REFERENCES influencers(id),
  contest_id INTEGER REFERENCES fantasy_contests(id),
  vote_date DATE DEFAULT CURRENT_DATE,
  vote_weight INTEGER DEFAULT 1,             -- Based on user level
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vote_date)                 -- One vote per day
);
```

#### private_leagues
```sql
CREATE TABLE private_leagues (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES fantasy_contests(id),
  creator_id UUID REFERENCES users(id),
  league_name VARCHAR(100) NOT NULL,
  code VARCHAR(8) UNIQUE NOT NULL,           -- Invite code
  entry_fee DECIMAL(18,6) DEFAULT 0,         -- ETH
  prize_pool DECIMAL(18,6) DEFAULT 0,
  max_members INTEGER DEFAULT 10,
  prize_distribution VARCHAR(20) DEFAULT 'winner_takes_all',
  status VARCHAR(20) DEFAULT 'open',         -- open, active, completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### league_members
```sql
CREATE TABLE league_members (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES private_leagues(id),
  user_id UUID REFERENCES users(id),
  team_id INTEGER REFERENCES user_teams(id),
  entry_paid BOOLEAN DEFAULT false,
  entry_tx_hash VARCHAR(66),
  rank INTEGER,
  total_score INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);
```

### Indexes

```sql
-- Performance optimization
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_teams_user_contest ON user_teams(user_id, contest_id);
CREATE INDEX idx_picks_team ON team_picks(team_id);
CREATE INDEX idx_votes_date ON daily_votes(vote_date);
CREATE INDEX idx_influencers_tier ON influencers(tier, price DESC);
CREATE INDEX idx_league_code ON private_leagues(code);
```

---

## API Documentation

### Authentication Endpoints

#### Get Nonce
```http
GET /api/auth/nonce
```

**Response**:
```json
{
  "nonce": "8d2f7a9b3c5e6f1a"
}
```

#### Login (SIWE Verification)
```http
POST /api/auth/verify
Content-Type: application/json

{
  "message": "localhost:5173 wants you to sign in...",
  "signature": "0x..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "walletAddress": "0x...",
    "username": "cobie",
    "ctMasteryScore": 1250,
    "ctMasteryLevel": "EXPERT"
  }
}
```

### League Endpoints

#### Get Influencers
```http
GET /api/league/influencers
```

**Response**:
```json
{
  "influencers": [
    {
      "id": 1,
      "displayName": "Cobie",
      "twitterHandle": "cobie",
      "avatarUrl": "https://...",
      "tier": "S",
      "price": "12.00",
      "followerCount": 850000,
      "bio": "Crypto OG, legendary shitposter",
      "formScore": 95,
      "totalPoints": 3240
    },
    ...
  ]
}
```

#### Create Team
```http
POST /api/league/team/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamName": "Alpha Hunters",
  "picks": [1, 5, 8, 12, 15]  // Influencer IDs
}
```

**Validation**:continue
- Total price ≤ 25M
- Exactly 5 unique influencers
- Team name required

**Response**:
```json
{
  "team": {
    "id": 123,
    "teamName": "Alpha Hunters",
    "totalScore": 0,
    "rank": null,
    "picks": [
      {
        "influencerId": 1,
        "displayName": "Cobie",
        "pickOrder": 1,
        "totalPoints": 0
      },
      ...
    ]
  },
  "xpEarned": 50
}
```

#### Submit Vote
```http
POST /api/league/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "influencerId": 3
}
```

**Response**:
```json
{
  "success": true,
  "influencer": "Ico Beast",
  "voteWeight": 2,
  "xpEarned": 10,
  "nextVoteAt": "2025-11-21T00:00:00Z"
}
```

**Vote Weight Calculation**:
- NOVICE: 1x
- EMERGING: 1.5x
- EXPERT: 2x
- VISIONARY: 3x
- LEGENDARY: 5x

### Private League Endpoints

#### Create Private League
```http
POST /api/private-leagues/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "leagueName": "CT Degens Only",
  "entryFee": "0.01",          // ETH
  "maxMembers": 20,
  "prizeDistribution": "top_3"  // winner_takes_all | top_3 | top_5
}
```

**Response**:
```json
{
  "league": {
    "id": 45,
    "leagueName": "CT Degens Only",
    "code": "DEGEN420",
    "entryFee": "0.01",
    "prizePool": "0.00",
    "maxMembers": 20,
    "currentMembers": 1,
    "prizeDistribution": "top_3",
    "status": "open"
  }
}
```

**Prize Distributions**:
- `winner_takes_all`: 85% to 1st (15% platform fee)
- `top_3`: 50% / 25% / 10% (15% platform fee)
- `top_5`: 40% / 25% / 15% / 5% / 0% (15% platform fee)

#### Join Private League
```http
POST /api/private-leagues/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "DEGEN420"
}
```

**Response**:
```json
{
  "success": true,
  "league": { ... },
  "memberCount": 2
}
```

---

## Authentication Flow

### SIWE (Sign-In with Ethereum) Flow

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │ Backend │                  │ Database │
└────┬────┘                  └────┬────┘                  └────┬─────┘
     │                            │                             │
     │ 1. GET /api/auth/nonce     │                             │
     ├───────────────────────────►│                             │
     │                            │                             │
     │ 2. Return nonce            │                             │
     │◄───────────────────────────┤                             │
     │                            │                             │
     │ 3. Sign SIWE message       │                             │
     │    with wallet             │                             │
     │                            │                             │
     │ 4. POST /api/auth/verify   │                             │
     │    {message, signature}    │                             │
     ├───────────────────────────►│                             │
     │                            │ 5. Verify signature         │
     │                            │    (SIWE library)           │
     │                            │                             │
     │                            │ 6. Find/create user         │
     │                            ├────────────────────────────►│
     │                            │◄────────────────────────────┤
     │                            │                             │
     │                            │ 7. Generate JWT tokens      │
     │                            │                             │
     │                            │ 8. Store session            │
     │                            ├────────────────────────────►│
     │                            │                             │
     │ 9. Return tokens + user    │                             │
     │◄───────────────────────────┤                             │
     │                            │                             │
     │ 10. Store in localStorage  │                             │
     │                            │                             │
     │ 11. Subsequent requests    │                             │
     │     with Bearer token      │                             │
     ├───────────────────────────►│                             │
     │                            │ 12. Verify JWT              │
     │                            │                             │
     │ 13. Protected response     │                             │
     │◄───────────────────────────┤                             │
```

### Token Management

**Access Token**:
- Lifetime: 15 minutes
- Payload: `{ userId, walletAddress, iat, exp }`
- Storage: `localStorage.authToken`

**Refresh Token**:
- Lifetime: 7 days
- Payload: `{ userId, walletAddress, type: 'refresh', iat, exp }`
- Storage: `localStorage.refreshToken`

**Refresh Flow**:
1. Access token expires (401 response)
2. Frontend sends refresh token: `POST /api/auth/refresh`
3. Backend validates refresh token
4. Backend issues new access token
5. Frontend retries original request

---

## Key Features & Workflows

### 1. Team Drafting Workflow

```
┌───────────────────────────────────────────────────────────┐
│                    User Journey                           │
└───────────────────────────────────────────────────────────┘

1. Connect Wallet
   └─► RainbowKit modal
       └─► MetaMask/WalletConnect/Coinbase

2. Sign In (Optional for browsing)
   └─► Sign SIWE message
       └─► No gas fees

3. Browse Influencers (No auth required)
   └─► View all 20 influencers
       └─► S-tier, A-tier, B-tier

4. Create Team (Auth required)
   ├─► Enter team name
   ├─► Select 5 influencers
   │   ├─► Real-time budget tracker
   │   └─► Max 25M total
   ├─► Submit team (+50 XP)
   └─► Team created!

5. Update Picks (Before locking)
   └─► Swap influencers
       └─► Re-optimize budget

6. Lock Team (+25 XP)
   └─► Finalize for contest
       └─► No more changes allowed

7. Compete
   └─► Vote daily
       └─► Earn points
           └─► Climb leaderboard
```

### 2. Daily Voting Workflow

```
┌───────────────────────────────────────────────────────────┐
│                  Voting Mechanics                         │
└───────────────────────────────────────────────────────────┘

1. User visits /vote page
   └─► Check vote status
       ├─► Already voted: Show results
       └─► Not voted: Show influencers

2. User selects influencer
   └─► "Best CT take of the day"

3. Submit vote (+10 XP)
   └─► Vote weight applied (1x-5x based on level)

4. Points distribution
   ├─► Influencer gains weighted votes
   ├─► All teams with that influencer gain points
   └─► Leaderboard updates

5. Cooldown
   └─► Next vote available in 24 hours
```

**Point Formula**:
```
Team Points = Σ (Influencer Daily Votes × Vote Weights)

Example:
- Team has Cobie, Ansem, Wales
- Cobie: 150 votes (weighted)
- Ansem: 80 votes
- Wales: 45 votes
→ Team Total: 275 points for the day
```

### 3. Private League Workflow

```
┌───────────────────────────────────────────────────────────┐
│                Private League System                      │
└───────────────────────────────────────────────────────────┘

Creator Flow:
1. Navigate to "Private Leagues" tab
2. Click "Create League"
3. Configure:
   ├─► League name
   ├─► Entry fee (0-1 ETH)
   ├─► Max members (2-100)
   └─► Prize distribution (winner/top3/top5)
4. Submit
5. Receive unique 8-char code
6. Share code with friends

Member Flow:
1. Receive invite code from friend
2. Navigate to "Join League"
3. Enter code
4. View league details
5. Confirm join
6. (Optional) Pay entry fee
7. Compete with teams in league

Prize Distribution:
1. Contest ends (Sunday midnight)
2. Final rankings calculated
3. Creator clicks "Distribute Prizes"
4. Backend calculates splits:
   ├─► 85% to winners
   └─► 15% platform fee
5. Prizes sent to winners' wallets
```

### 4. XP & Progression System

**XP Actions & Rewards**:

| Action | XP | Cooldown | Max/Day |
|--------|-----|----------|---------|
| App Open | +5 XP | 12h | 2 |
| Create Team | +50 XP | - | 1 |
| Lock Team | +25 XP | - | 1 |
| Daily Vote | +10 XP | 24h | 1 |
| Join League | +15 XP | - | 5 |
| Win Daily Vote | +20 XP | - | ∞ |
| Win Contest | +100 XP | - | 1 |

**Level Thresholds**:
```typescript
const LEVEL_THRESHOLDS = {
  1: 0,          // NOVICE
  2: 100,        // NOVICE
  3: 250,        // EMERGING
  4: 500,        // EMERGING
  5: 1000,       // EXPERT
  6: 2000,       // EXPERT
  7: 4000,       // VISIONARY
  8: 8000,       // VISIONARY
  9: 15000,      // LEGENDARY
  10: 30000,     // LEGENDARY
};
```

**CT Mastery Score**:
- Aggregated XP across all actions
- Determines user level
- Increases vote weight
- Unlocks perks (future)

### 5. Streak System

**Tracked Streaks**:
- Daily login
- Daily vote
- Team management

**Streak Milestones**:
```typescript
{
  7:   { multiplier: 1.2, xpBonus: 50 },   // 1 week
  14:  { multiplier: 1.3, xpBonus: 100 },  // 2 weeks
  30:  { multiplier: 1.5, xpBonus: 250 },  // 1 month
  60:  { multiplier: 1.7, xpBonus: 500 },  // 2 months
  100: { multiplier: 2.0, xpBonus: 1000 }, // 100 days
}
```

**Freeze System**:
- 1 free freeze per month
- Prevents streak break if missed day
- Auto-applied or manual activation

---

## Web3 Integration

### Smart Contracts (Base Sepolia)

```typescript
// Deployed contract addresses
export const CONTRACTS = {
  ctDraft: '0x378105C2081Cc2235e6637DC9757a63F20263aa9',
  reputationEngine: '0x24C8171af3e2EbA7fCF53BDB5B958Ed2AB36fb0c',
  treasury: '0x7A395d0B4E1542335DB3478171a08Cf34E97180f',
  timecasterArena: '0x5b8e61e873da5EC1616b3931F4Bc7Fc32D1B9F62',
  dailyGauntlet: '0x16ABD5fC02Ba7E64527320b2C042BaaCBc2BB854',
  foresightNFT: '0x8DCEb1aC97d3Ab305b6d7B2D44305d3F52c26bfa',
  questRewards: '0xE3a2f682A5F22221F5f67c3cda917D7058aAbfe8',
};
```

### RainbowKit Configuration

```typescript
// src/config/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'CT Draft',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'fallback',
  chains: [baseSepolia],
  ssr: false,
});
```

### Custom Web3 Hooks

```typescript
// Example: useCTDraft hook
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS } from '../addresses';
import { CTDraftABI } from '../abis';

export function useCTDraft() {
  // Read operations (free)
  const { data: teamData } = useReadContract({
    address: CONTRACTS.ctDraft,
    abi: CTDraftABI,
    functionName: 'getUserTeam',
    args: [address],
  });

  // Write operations (gas required)
  const { writeContractAsync: submitTeam } = useWriteContract();

  const handleSubmitTeam = async (influencerIds: number[]) => {
    const tx = await submitTeam({
      address: CONTRACTS.ctDraft,
      abi: CTDraftABI,
      functionName: 'submitTeam',
      args: [influencerIds],
    });
    await tx.wait();
  };

  return { teamData, submitTeam: handleSubmitTeam };
}
```

### Future Blockchain Features

**Phase 1** (Current): Off-chain, gasless
- All game logic in PostgreSQL
- Free to play
- No blockchain transactions

**Phase 2** (Future): Hybrid
- NFT rewards for top performers
- On-chain leaderboard snapshots
- Prize pools in smart contracts

**Phase 3** (Future): Fully on-chain
- Teams stored on-chain
- Votes recorded on-chain
- Decentralized governance

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 15+ (Homebrew on macOS)
- **Git**

### Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/foresight.git
cd foresight/backend

# 2. Install dependencies
pnpm install

# 3. Setup PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15
createdb foresight

# 4. Configure environment
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL=postgresql://localhost:5432/foresight
# JWT_SECRET=<generate-random-secret>
# PORT=3001

# 5. Run migrations
pnpm knex migrate:latest

# 6. Seed database with influencers
pnpm knex seed:run

# 7. Start development server
pnpm dev

# Server running at http://localhost:3001
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:3001
# VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
# VITE_CHAIN_ID=84532

# 4. Start development server
pnpm dev

# App running at http://localhost:5173
```

### Database Migrations

```bash
# Create new migration
pnpm knex migrate:make migration_name

# Run all pending migrations
pnpm knex migrate:latest

# Rollback last migration
pnpm knex migrate:rollback

# Check migration status
pnpm knex migrate:status
```

### Seed Data

```bash
# Run all seed files
pnpm knex seed:run

# Run specific seed file
pnpm knex seed:run --specific=01_influencers.ts
```

---

## Deployment

### Backend (Production)

**Recommended Platforms**:
- Railway
- Render
- Fly.io
- DigitalOcean App Platform

**Environment Variables**:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<secure-random-secret-256-bits>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://your-app.com
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
```

**Build Command**:
```bash
pnpm install && pnpm build
```

**Start Command**:
```bash
pnpm start
```

**Database**:
- Use managed PostgreSQL (Railway, Supabase, etc.)
- Run migrations on deploy
- Setup automatic backups

### Frontend (Production)

**Recommended Platforms**:
- Vercel (recommended for Next.js/React)
- Netlify
- Cloudflare Pages

**Environment Variables**:
```bash
VITE_API_URL=https://api.your-app.com
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
VITE_CHAIN_ID=84532
```

**Build Command**:
```bash
pnpm install && pnpm build
```

**Output Directory**:
```bash
dist/
```

**Deployment Steps**:
1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy
5. Configure custom domain

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Deploy Backend
        run: |
          cd backend
          pnpm install
          pnpm build
          # Deploy to Railway/Render

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Deploy Frontend
        run: |
          cd frontend
          pnpm install
          pnpm build
          # Deploy to Vercel
```

---

## Security

### Authentication Security

1. **SIWE (Sign-In with Ethereum)**
   - Cryptographic proof of wallet ownership
   - No passwords to leak
   - Nonce prevents replay attacks
   - Domain binding prevents phishing

2. **JWT Tokens**
   - Short-lived access tokens (15 min)
   - Refresh tokens for sessions (7 days)
   - Signed with HMAC SHA256
   - Stored in localStorage (not cookies to prevent CSRF)

3. **Token Rotation**
   - Automatic refresh on 401
   - Invalidate on logout
   - Track sessions in database

### API Security

1. **Rate Limiting**
   ```typescript
   // Auth endpoints: 5 requests / 15 minutes
   // General API: 100 requests / 15 minutes
   // Per IP address
   ```

2. **CORS**
   ```typescript
   // Whitelist frontend origin only
   origin: process.env.FRONTEND_URL
   ```

3. **Helmet.js**
   ```typescript
   // Security headers:
   // - Content-Security-Policy
   // - X-Frame-Options: DENY
   // - X-Content-Type-Options: nosniff
   // - Strict-Transport-Security
   ```

4. **Input Validation**
   ```typescript
   // express-validator for all inputs
   // Sanitize user-generated content
   // Parameterized SQL queries (Knex)
   ```

### Database Security

1. **Connection Pooling**
   ```typescript
   // Limited connections (max: 20)
   // Timeout after 30 seconds
   // SSL in production
   ```

2. **SQL Injection Prevention**
   ```typescript
   // Knex parameterized queries
   db('users').where({ id: userId })  // Safe
   // Never raw SQL with user input
   ```

3. **Sensitive Data**
   ```typescript
   // Passwords: N/A (wallet authentication)
   // JWT secrets: Environment variables
   // Private keys: Never stored
   ```

### Frontend Security

1. **XSS Prevention**
   ```typescript
   // React auto-escapes by default
   // DOMPurify for user HTML
   // CSP headers block inline scripts
   ```

2. **Wallet Security**
   ```typescript
   // Users control their private keys
   // Sign messages, don't expose keys
   // Warn on suspicious transactions
   ```

3. **localStorage Risks**
   ```typescript
   // Tokens vulnerable to XSS
   // Mitigation: CSP, input sanitization
   // Consider httpOnly cookies (future)
   ```

### Smart Contract Security

1. **Access Control**
   ```solidity
   // OpenZeppelin Ownable
   // Role-based permissions
   // Timelock for critical functions
   ```

2. **Reentrancy Protection**
   ```solidity
   // ReentrancyGuard on all payable functions
   // Checks-Effects-Interactions pattern
   ```

3. **Integer Overflow**
   ```solidity
   // Solidity 0.8+ built-in overflow checks
   // SafeMath for older versions
   ```

4. **Audits**
   - Internal review
   - Public testnet deployment (current)
   - Professional audit before mainnet (future)

---

## Future Roadmap

### Phase 1: Core Features (✅ Complete)
- [x] SIWE authentication
- [x] Fantasy team drafting
- [x] Daily voting system
- [x] Leaderboards
- [x] Private leagues
- [x] XP system
- [x] Streak tracking

### Phase 2: Enhanced Engagement (Q1 2025)
- [ ] Push notifications (web push)
- [ ] Email digests (weekly summaries)
- [ ] Referral system (invite friends, earn XP)
- [ ] Achievement badges (UI display)
- [ ] Social sharing (team cards as images)
- [ ] Historical stats (past contests)
- [ ] Trade influencers mid-week
- [ ] Captain system (2x points for one pick)

### Phase 3: Monetization (Q2 2025)
- [ ] Premium leagues ($10 entry)
- [ ] Sponsored contests (brand partnerships)
- [ ] NFT rewards for winners
- [ ] Marketplace for rare badges
- [ ] Ad system (non-intrusive)
- [ ] Subscription tier ($5/month)
  - Ad-free
  - Analytics dashboard
  - Priority support

### Phase 4: Blockchain Integration (Q3 2025)
- [ ] Deploy to Base Mainnet
- [ ] On-chain team submissions
- [ ] NFT team cards (dynamic metadata)
- [ ] Smart contract prize pools
- [ ] Governance token ($DRAFT)
- [ ] DAO for contest rules
- [ ] Cross-chain support (Polygon, Arbitrum)

### Phase 5: Platform Expansion (Q4 2025)
- [ ] Mobile app (React Native)
- [ ] Multiple sports (NFL, NBA, etc.)
- [ ] Live drafts (real-time snake draft)
- [ ] AI predictions (ML models)
- [ ] Video content (highlight reels)
- [ ] Podcast integration
- [ ] Influencer partnerships (sponsored picks)

### Phase 6: Advanced Features (2026)
- [ ] DeFi integrations (yield on prizes)
- [ ] Betting markets (Polymarket style)
- [ ] Automated market makers
- [ ] Derivative products (options on influencers)
- [ ] Real-time scoring (tweet analysis)
- [ ] Sentiment analysis (AI-powered)
- [ ] Multi-week championships
- [ ] Franchise mode (manager multiple teams)

---

## Contributing

### Development Workflow

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

**TypeScript**:
- ESLint + Prettier
- Strict mode enabled
- Explicit return types
- No `any` types

**React**:
- Functional components only
- Custom hooks for logic
- Props interface for all components
- Descriptive variable names

**Database**:
- Snake_case for columns
- Camel_case for tables
- Always include timestamps
- Foreign keys with CASCADE

### Testing (Future)

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL is running
brew services list
brew services restart postgresql@15

# Verify database exists
psql -l

# Create if missing
createdb foresight
```

**2. Port Already in Use**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

**3. Migration Errors**
```bash
# Rollback last migration
pnpm knex migrate:rollback

# Check migration status
pnpm knex migrate:status

# Reset database (DANGEROUS)
pnpm knex migrate:rollback --all
pnpm knex migrate:latest
pnpm knex seed:run
```

**4. CORS Errors**
```bash
# Update backend CORS origin
FRONTEND_URL=http://localhost:5173

# Restart backend
pnpm dev
```

**5. Wallet Connection Fails**
```bash
# Check WalletConnect project ID
VITE_WALLETCONNECT_PROJECT_ID=<valid-id>

# Clear browser cache
# Disconnect wallet from RainbowKit
# Reconnect
```

---

## License

MIT License - See LICENSE file for details

---

## Contact & Support

- **GitHub**: https://github.com/yourusername/foresight
- **Twitter**: @your_handle
- **Discord**: https://discord.gg/your_server
- **Email**: support@your-app.com

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
**Status**: Production Ready 🚀
