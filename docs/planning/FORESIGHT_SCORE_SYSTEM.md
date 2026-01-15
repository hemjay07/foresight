# Foresight Score System - Master Design Document

**Version:** 1.0
**Created:** December 27, 2025
**Status:** Planning Phase

> This document is the single source of truth for the Foresight Score system, user identity, shareable cards, leaderboards, quests, and all related engagement mechanics.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Audit](#current-state-audit)
3. [Foresight Score (FS) System](#foresight-score-fs-system)
4. [User Identity System](#user-identity-system)
5. [Shareable Profile Card](#shareable-profile-card)
6. [Tier/Status System](#tierstatus-system)
7. [Early Adopter Mechanics](#early-adopter-mechanics)
8. [Leaderboard System](#leaderboard-system)
9. [Quest/Task System](#questtask-system)
10. [Database Schema](#database-schema)
11. [API Endpoints](#api-endpoints)
12. [Frontend Components](#frontend-components)
13. [Implementation Roadmap](#implementation-roadmap)
14. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem
Currently, users have no compelling reason to return daily. The weekly fantasy format means engagement spikes on Monday (team creation) and Sunday (results), with dead zones Tuesday-Saturday.

### The Solution
Implement **Foresight Score (FS)** - a unified points currency that accumulates from ALL activities, appears on ALL leaderboards, and implies future value (without explicit promises).

### Key Principles
1. **One Metric** - Foresight Score is THE universal currency
2. **Daily Habits** - Every day has a reason to open the app
3. **Status Flex** - Users can boast via shareable cards
4. **Implied Value** - "Early supporters will be rewarded"
5. **Synergy** - Fantasy + Engagement + Social all feed into FS

---

## Current State Audit

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Users table | ✅ Exists | Has: id, address, username, created_at, last_seen |
| Username editing | ✅ Works | In Profile.tsx and Settings.tsx |
| Avatar URL | ✅ Works | Can set custom avatar URL |
| Twitter handle | ✅ Works | Optional field |
| XP system | ✅ Exists | Basic XP with levels (utils/xp.ts) |
| Achievements | ✅ Exists | Basic achievement system |
| Streaks | ✅ Exists | Vote streak tracking |
| Team management | ✅ Works | Can create/edit fantasy teams |
| Leaderboard | ⚠️ Partial | Only weekly contest leaderboard |
| Referrals | ⚠️ Basic | Table exists, not fully integrated |
| Quests | ⚠️ Partial | Schema exists, not complete |
| Profile card | ❌ Missing | No shareable card |
| Founding Member | ❌ Missing | No early adopter tracking |
| FS system | ❌ Missing | No unified score |
| Tier badges | ❌ Missing | No Bronze/Silver/Gold/etc. |

### Existing Database Tables (User-Related)

```sql
-- Current users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50),
  created_at TIMESTAMP,
  last_seen TIMESTAMP
);

-- Existing user_profiles table (from migration)
-- Has: xp, vote_streak, referral_code, referred_by, etc.
```

---

## Foresight Score (FS) System

### What is Foresight Score?

Foresight Score (FS) is the universal currency of the platform. It represents a user's total contribution and engagement across all activities.

### How Users Earn FS

#### 1. Fantasy Performance (Primary - 60% of FS)

| Activity | FS Earned | Notes |
|----------|-----------|-------|
| 1st place finish | +1,000 | Weekly contest |
| 2nd place | +750 | |
| 3rd place | +500 | |
| Top 10% | +300 | |
| Top 25% | +150 | |
| Top 50% | +75 | |
| Contest entry (any) | +25 | Participation bonus |
| Captain in top 3 | +100 | Rewards good picks |
| Daily Flash win | +200 | Quick format |
| Daily Flash top 10 | +50 | |

#### 2. Daily Engagement (Secondary - 25% of FS)

| Activity | FS Earned | Notes |
|----------|-----------|-------|
| Daily login | +10 | Base habit |
| Login streak bonus | +5/day | Caps at +50 (day 10) |
| Daily prediction correct | +25 | Mini-game |
| Check live scores | +5 | Engagement tracking |
| Browse CT Feed (30s) | +5 | Content consumption |
| Share a take | +20 | Content creation |

#### 3. Social Tasks (Tertiary - 15% of FS)

| Activity | FS Earned | Notes |
|----------|-----------|-------|
| Follow on Twitter | +100 | One-time |
| Follow on Farcaster | +100 | One-time |
| Tweet about us | +50 | Weekly cap: 2 |
| Cast about us | +50 | Weekly cap: 2 |
| Referral signup | +100 | Immediate |
| Referral enters contest | +200 | Quality bonus |
| Referral wins prize | +100 | Ongoing passive |

#### 4. Milestones & Achievements

| Activity | FS Earned | Notes |
|----------|-----------|-------|
| Founding Member bonus | +1,000 | One-time, first 1000 |
| First contest win | +500 | Achievement |
| 7-day streak | +200 | Achievement |
| 30-day streak | +1,000 | Achievement |
| Refer 5 friends | +500 | Achievement |
| Reach Gold tier | +1,000 | Tier unlock |
| Reach Diamond tier | +5,000 | Tier unlock |

### FS Multipliers

| User Segment | Multiplier | Duration |
|--------------|------------|----------|
| Founding Member (#1-1000) | 1.5x | First 90 days |
| Early Adopter (#1001-5000) | 1.25x | First 60 days |
| Early Bird (#5001-10000) | 1.1x | First 30 days |
| Premium subscriber | 1.25x | While subscribed |
| Gold tier | 1.1x | Permanent |
| Platinum tier | 1.15x | Permanent |
| Diamond tier | 1.2x | Permanent |

### FS Formula

```
Final FS = Base FS × Early Adopter Multiplier × Tier Multiplier × Premium Multiplier
```

---

## User Identity System

### Profile Data Model

```typescript
interface UserProfile {
  // Core Identity
  id: string;                    // UUID
  walletAddress: string;         // 0x...
  username: string;              // Display name (required after first login)
  displayName: string;           // Computed: username or truncated address

  // Visual Identity
  avatarUrl: string | null;      // Custom avatar URL
  avatarType: 'custom' | 'generated' | 'nft';
  bannerColor: string;           // Profile banner gradient

  // Social Links
  twitterHandle: string | null;
  farcasterHandle: string | null;

  // Foresight Score
  foresightScore: number;        // Total accumulated FS
  foresightScoreWeek: number;    // FS earned this week
  foresightScoreSeason: number;  // FS earned this season

  // Status
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tierProgress: number;          // Progress to next tier (0-100)

  // Early Adopter
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;  // #1-1000
  earlyAdopterNumber: number | null;    // User signup order
  earlyAdopterMultiplier: number;       // 1.0-1.5
  multiplierExpiresAt: Date | null;

  // Engagement
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: Date;
  totalLogins: number;

  // Stats
  contestsEntered: number;
  contestsWon: number;
  winRate: number;
  bestRank: number;
  totalPrizeWon: number;

  // Referrals
  referralCode: string;
  referralCount: number;
  referralFsEarned: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Username Requirements

1. **Length:** 3-20 characters
2. **Characters:** Letters, numbers, underscores only
3. **Uniqueness:** Must be unique (case-insensitive)
4. **Profanity filter:** Block offensive usernames
5. **Reserved words:** Block "admin", "mod", "foresight", etc.

### Avatar System

1. **Custom URL:** User provides image URL
2. **Generated:** Blockie/Jazzicon from wallet address (default)
3. **NFT:** Future - pull from owned NFTs

---

## Shareable Profile Card

### Card Design

```
┌─────────────────────────────────────────────────────────────┐
│  [Gradient Banner based on Tier]                           │
│                                                             │
│     ┌──────┐                                               │
│     │Avatar│   USERNAME                                    │
│     │ 80px │   @twitterhandle                              │
│     └──────┘   Founding Member #234                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              FORESIGHT SCORE                                │
│                                                             │
│                 12,450                                      │
│                   FS                                        │
│                                                             │
│              🥇 GOLD TIER                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   #127        8 Wins       🔥 14 Day                        │
│   All-Time    This Season     Streak                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Achievement] [Achievement] [Achievement] [+5 more]      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Join me on CT Draft → ctdraft.xyz/join/abc123            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Card Variants

| Variant | Use Case | Size |
|---------|----------|------|
| **Full Card** | Twitter/Farcaster share | 1200x630 (OG image) |
| **Square Card** | Instagram, profile pics | 1080x1080 |
| **Mini Card** | In-app display, embeds | 400x200 |
| **Story Card** | Instagram/TikTok stories | 1080x1920 |

### Card Customization

Users can customize:
1. **Background:** Solid colors or gradients (tier unlocks more)
2. **Stats shown:** Choose which 3 stats to display
3. **Achievements:** Choose which achievements to showcase
4. **Referral link:** Auto-included or hidden

### Card Generation

1. **Frontend:** Canvas-based generation for instant preview
2. **Backend:** Server-side rendering for high-quality exports
3. **Caching:** Cache generated images for 1 hour

### Share Flows

```
[Share Button] →
  → [Customize Card Modal]
    → [Preview Card]
    → [Download PNG]
    → [Copy to Clipboard]
    → [Share to Twitter] (with pre-filled text)
    → [Share to Farcaster] (with frame)
```

---

## Tier/Status System

### Tier Progression

| Tier | FS Required | Badge | Color | Perks |
|------|-------------|-------|-------|-------|
| **Bronze** | 0 | 🥉 | #CD7F32 | Base access |
| **Silver** | 1,000 | 🥈 | #C0C0C0 | +5% FS bonus, silver border |
| **Gold** | 5,000 | 🥇 | #FFD700 | +10% FS, early access, gold glow |
| **Platinum** | 20,000 | 💠 | #E5E4E2 | +15% FS, exclusive contests |
| **Diamond** | 50,000 | 💎 | #B9F2FF | +20% FS, VIP features, custom card |

### Visual Treatment

Each tier has:
1. **Badge icon** - Displayed next to username
2. **Border color** - On profile card and avatar
3. **Glow effect** - On leaderboard and card
4. **Exclusive backgrounds** - For shareable cards

### Tier Benefits

| Benefit | Bronze | Silver | Gold | Platinum | Diamond |
|---------|--------|--------|------|----------|---------|
| FS Multiplier | 1.0x | 1.05x | 1.1x | 1.15x | 1.2x |
| Free transfers/week | 1 | 1 | 2 | 3 | 5 |
| Card backgrounds | 3 | 5 | 10 | 15 | All |
| Early contest access | No | No | Yes | Yes | Yes |
| Exclusive contests | No | No | No | Yes | Yes |
| Priority support | No | No | No | Yes | Yes |
| Custom referral code | No | No | Yes | Yes | Yes |

---

## Early Adopter Mechanics

### Founding Member Program

**Who qualifies:** First 1,000 users to create a team

**Benefits:**
1. **Permanent badge:** "Founding Member #XXX"
2. **1.5x FS multiplier** for first 90 days
3. **Exclusive "Founding Member" achievement**
4. **Priority for future rewards** (implied)
5. **Listed on Founders Wall** (future feature)

### Founding Member Display

```
┌─────────────────────────────────────────────────────────────┐
│  🌟 FOUNDING MEMBER #234                                    │
│                                                             │
│  You're among the first 1,000 believers.                   │
│  This status is permanent and exclusive.                   │
│                                                             │
│  Your benefits:                                             │
│  ✓ 1.5x Foresight Score (expires in 67 days)               │
│  ✓ Exclusive Founding Member badge                         │
│  ✓ Priority for future rewards                             │
│                                                             │
│  ████████████████░░░░  847/1,000 claimed                   │
└─────────────────────────────────────────────────────────────┘
```

### Early Adopter Tiers

| Tier | User Numbers | Multiplier | Duration | Badge |
|------|--------------|------------|----------|-------|
| Founding Member | #1-1,000 | 1.5x | 90 days | 🌟 |
| Early Adopter | #1,001-5,000 | 1.25x | 60 days | ⚡ |
| Early Bird | #5,001-10,000 | 1.1x | 30 days | 🐦 |
| Standard | #10,001+ | 1.0x | N/A | None |

### FOMO Messaging

**During signup (pre-1000):**
> "You're Founding Member #847! Only 153 spots remain."

**After 1000 (users 1001-5000):**
> "Founding Member status is CLOSED. You're Early Adopter #1,234."

**After 5000:**
> "You're user #7,234. The early believers are already building their positions."

---

## Leaderboard System

### Four Leaderboards

#### 1. All-Time Leaderboard
- **Metric:** Total accumulated FS
- **Purpose:** Ultimate prestige ranking
- **Reset:** Never
- **Message:** "Your all-time position"

#### 2. Season Leaderboard
- **Metric:** FS earned this season (monthly)
- **Purpose:** Fresh start for newcomers
- **Reset:** Monthly (1st of each month)
- **Message:** "This month's top performers"

#### 3. Weekly Leaderboard
- **Metric:** Current contest points
- **Purpose:** Immediate gratification
- **Reset:** Weekly (Monday 00:00 UTC)
- **Message:** "This week's contest rankings"

#### 4. Referral Leaderboard
- **Metric:** FS earned from referrals
- **Purpose:** Growth incentive
- **Reset:** Never
- **Message:** "Top community builders"

### Leaderboard Entry Design

```
┌───┬──────────────────────────────┬───────────┬──────────────┐
│ # │ Player                       │ Tier      │ Score        │
├───┼──────────────────────────────┼───────────┼──────────────┤
│ 1 │ 🏆 CryptoKing  🌟 💎         │ Diamond   │ 142,500 FS   │
│ 2 │ 🥈 AlphaSeeker ⚡ 💎         │ Diamond   │ 128,300 FS   │
│ 3 │ 🥉 DeFiDegen  🌟 💠          │ Platinum  │ 115,200 FS   │
│...│                              │           │              │
│127│ ⭐ YOU        🌟 🥇          │ Gold      │ 12,450 FS    │
└───┴──────────────────────────────┴───────────┴──────────────┘

Legend: 🌟 = Founding Member, ⚡ = Early Adopter
```

### Your Position Widget

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR POSITION                                              │
│                                                             │
│  #127 / 2,341 players              ↑ 14 this week          │
│                                                             │
│  ████████████░░░░░░  12,450 FS                             │
│                                                             │
│  Next tier: Platinum (7,550 FS to go)                      │
│  Next rank: #126 needs 12,680 FS (+230 FS)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quest/Task System

### Quest Categories

#### 1. Onboarding Quests (One-time)

| Quest | FS Reward | Trigger |
|-------|-----------|---------|
| Connect wallet | +50 | Wallet connected |
| Set username | +25 | Username saved |
| Create first team | +100 | Team created |
| Enter first contest | +100 | Contest joined |
| Follow on Twitter | +100 | Verified via OAuth or honor |
| Join Discord | +50 | Honor system |
| Invite a friend | +200 | Referral signup |
| **Completion Bonus** | +500 | All 7 complete |

#### 2. Daily Quests (Reset 00:00 UTC)

| Quest | FS Reward | Requirement |
|-------|-----------|-------------|
| Log in | +10 | Open app |
| Check live scores | +10 | View team score page |
| Browse CT Feed | +10 | 30 seconds on feed |
| Make daily prediction | +25 | Submit prediction |
| Share a take | +20 | Post in CT Feed |
| **Daily Bonus** | +25 | Complete all 5 |

#### 3. Weekly Quests (Reset Monday 00:00 UTC)

| Quest | FS Reward | Requirement |
|-------|-----------|-------------|
| Enter a contest | +50 | Join any contest |
| Finish top 50% | +100 | Contest result |
| Finish top 10% | +250 | Contest result |
| Tweet about us | +50 | Verified tweet |
| Refer a friend | +200 | New signup |
| **Weekly Bonus** | +100 | Complete all 5 |

#### 4. Achievement Quests (Milestone)

| Achievement | FS Reward | Badge | Requirement |
|-------------|-----------|-------|-------------|
| First Blood | +500 | 🏆 | Win first contest |
| Consistent | +200 | 🔥 | 7-day login streak |
| Ironman | +1,000 | 💪 | 30-day login streak |
| Networker | +300 | 🤝 | Refer 3 friends |
| Whale Whisperer | +500 | 🐳 | Pick 10 viral tweets |
| Oracle | +250 | 🔮 | 5 correct daily predictions |
| Diamond Hands | +200 | 💎 | Same team all week |
| Champion | +1,000 | 👑 | Win 5 contests |
| Legend | +5,000 | ⭐ | Win 20 contests |

### Quest UI Design

```
┌─────────────────────────────────────────────────────────────┐
│  📋 DAILY QUESTS                        3/5 Complete       │
│  Resets in: 14h 23m                                         │
├─────────────────────────────────────────────────────────────┤
│  ✅ Log in today                                +10 FS     │
│  ✅ Check your team's live score               +10 FS     │
│  ✅ Browse CT Feed                              +10 FS     │
│  ⬜ Make a daily prediction                     +25 FS     │
│  ⬜ Share a take                                +20 FS     │
├─────────────────────────────────────────────────────────────┤
│  Complete all 5: +25 FS bonus                              │
│  🔥 Current streak: 4 days (+20 FS bonus)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables Required

```sql
-- Foresight Score tracking
CREATE TABLE foresight_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Scores
  total_score BIGINT DEFAULT 0,
  season_score BIGINT DEFAULT 0,
  week_score BIGINT DEFAULT 0,
  referral_score BIGINT DEFAULT 0,

  -- Multipliers
  base_multiplier DECIMAL(3,2) DEFAULT 1.0,
  tier_multiplier DECIMAL(3,2) DEFAULT 1.0,
  early_adopter_multiplier DECIMAL(3,2) DEFAULT 1.0,
  premium_multiplier DECIMAL(3,2) DEFAULT 1.0,

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

-- FS transaction history (for auditing)
CREATE TABLE foresight_score_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  multiplied_amount INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,  -- 'contest_win', 'daily_login', 'referral', etc.
  metadata JSONB,               -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fs_transactions_user ON foresight_score_transactions(user_id);
CREATE INDEX idx_fs_transactions_created ON foresight_score_transactions(created_at);

-- User extended profile
CREATE TABLE user_profiles_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Identity
  display_name VARCHAR(50),
  avatar_url TEXT,
  avatar_type VARCHAR(20) DEFAULT 'generated',
  banner_color VARCHAR(7) DEFAULT '#6366f1',
  twitter_handle VARCHAR(50),
  farcaster_handle VARCHAR(50),

  -- Tier
  tier VARCHAR(20) DEFAULT 'bronze',
  tier_updated_at TIMESTAMP,

  -- Early Adopter
  is_founding_member BOOLEAN DEFAULT FALSE,
  founding_member_number INTEGER,
  early_adopter_number INTEGER,
  early_adopter_tier VARCHAR(20),  -- 'founding', 'early', 'bird', 'standard'
  multiplier_expires_at TIMESTAMP,

  -- Engagement
  login_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER DEFAULT 0,

  -- Stats
  contests_entered INTEGER DEFAULT 0,
  contests_won INTEGER DEFAULT 0,
  best_rank INTEGER,
  total_prize_won DECIMAL(18,8) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Quests tracking
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_id VARCHAR(50) NOT NULL,
  quest_type VARCHAR(20) NOT NULL,  -- 'onboarding', 'daily', 'weekly', 'achievement'

  -- Progress
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,

  -- For daily/weekly reset
  period_start TIMESTAMP,
  period_end TIMESTAMP,

  -- Reward
  fs_reward INTEGER NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, quest_id, period_start)
);

-- Quest definitions (reference table)
CREATE TABLE quest_definitions (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  quest_type VARCHAR(20) NOT NULL,
  fs_reward INTEGER NOT NULL,
  target INTEGER DEFAULT 1,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard snapshots (for historical data)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(20) NOT NULL,  -- 'all_time', 'season', 'weekly', 'referral'
  period_key VARCHAR(20),                  -- '2025-01' for season, '2025-W52' for weekly
  user_id UUID REFERENCES users(id),
  rank INTEGER NOT NULL,
  score BIGINT NOT NULL,
  snapshot_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(leaderboard_type, period_key, user_id)
);

-- Indexes for leaderboards
CREATE INDEX idx_leaderboard_type_period ON leaderboard_snapshots(leaderboard_type, period_key);
CREATE INDEX idx_leaderboard_rank ON leaderboard_snapshots(leaderboard_type, period_key, rank);
```

### Schema Modifications

```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_number INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Trigger to assign signup_number
CREATE OR REPLACE FUNCTION assign_signup_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.signup_number := (SELECT COALESCE(MAX(signup_number), 0) + 1 FROM users);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_signup_number
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION assign_signup_number();
```

---

## API Endpoints

### Foresight Score

```
GET  /api/v2/fs/me                    - Get my FS details
GET  /api/v2/fs/leaderboard           - Get leaderboard (params: type, limit, offset)
POST /api/v2/fs/earn                  - Record FS earning (internal)
GET  /api/v2/fs/history               - Get my FS transaction history
```

### User Profile

```
GET  /api/v2/profile/me               - Get extended profile
PATCH /api/v2/profile/me              - Update profile
GET  /api/v2/profile/:username        - Get public profile by username
GET  /api/v2/profile/card/:username   - Get shareable card image
POST /api/v2/profile/card/generate    - Generate custom card
```

### Quests

```
GET  /api/v2/quests/active            - Get my active quests
POST /api/v2/quests/:id/claim         - Claim quest reward
GET  /api/v2/quests/history           - Get completed quests
```

### Founding Member

```
GET  /api/v2/founding/status          - Get founding member stats
GET  /api/v2/founding/wall            - Get founders wall (first 1000)
```

---

## Frontend Components

### New Pages

| Page | Route | Purpose |
|------|-------|---------|
| Leaderboard Hub | `/leaderboard` | All 4 leaderboards |
| Quests | `/quests` | Quest tracking |
| Share Card | `/share` | Card customization |
| Founders Wall | `/founders` | Celebrate early users |

### New Components

```
components/
├── fs/
│   ├── ForesightScoreDisplay.tsx    - Big FS number with tier
│   ├── ForesightScoreHistory.tsx    - Transaction history
│   ├── FsEarnAnimation.tsx          - +10 FS popup animation
│   └── TierBadge.tsx                - Bronze/Silver/Gold/etc badge
├── leaderboard/
│   ├── LeaderboardTabs.tsx          - Switch between 4 leaderboards
│   ├── LeaderboardTable.tsx         - Ranking table
│   ├── LeaderboardEntry.tsx         - Single row
│   ├── YourPositionWidget.tsx       - Where you stand
│   └── RankChangeIndicator.tsx      - ↑14 / ↓2 / =
├── quests/
│   ├── QuestCard.tsx                - Single quest
│   ├── QuestProgress.tsx            - Progress bar
│   ├── QuestCategory.tsx            - Daily/Weekly/Achievement group
│   ├── DailyQuestWidget.tsx         - Compact home widget
│   └── QuestClaimModal.tsx          - Claim reward celebration
├── profile/
│   ├── ShareableCard.tsx            - Profile card component
│   ├── CardCustomizer.tsx           - Customize card modal
│   ├── CardPreview.tsx              - Live preview
│   ├── ShareButtons.tsx             - Twitter/Farcaster/Download
│   ├── FoundingMemberBadge.tsx      - FM #XXX badge
│   └── EarlyAdopterBanner.tsx       - Multiplier countdown
└── identity/
    ├── UserPill.tsx                 - Username + tier badge (compact)
    ├── UserAvatar.tsx               - Avatar with tier border
    └── UserHoverCard.tsx            - Hover to see mini profile
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Core FS system working

- [ ] Create database migrations
- [ ] Implement FS earning logic
- [ ] Add FS to user profile API
- [ ] Create ForesightScoreDisplay component
- [ ] Add FS to home dashboard
- [ ] Implement tier calculation

### Phase 2: Leaderboards (Week 2-3)
**Goal:** All 4 leaderboards working

- [ ] Create leaderboard API endpoints
- [ ] Build LeaderboardTabs component
- [ ] Build LeaderboardTable component
- [ ] Add YourPositionWidget
- [ ] Implement season/week reset logic
- [ ] Add rank change tracking

### Phase 3: User Identity (Week 3-4)
**Goal:** Complete profile system

- [ ] Extend user profile schema
- [ ] Implement founding member tracking
- [ ] Add tier badges everywhere
- [ ] Build UserPill/UserAvatar components
- [ ] Add early adopter multipliers
- [ ] Implement multiplier expiration

### Phase 4: Quests (Week 4-5)
**Goal:** Quest system live

- [ ] Create quest definitions table
- [ ] Implement quest tracking logic
- [ ] Build quest UI components
- [ ] Add daily quest reset cron
- [ ] Add weekly quest reset cron
- [ ] Implement quest claiming

### Phase 5: Shareable Cards (Week 5-6)
**Goal:** Users can share profile cards

- [ ] Design card templates
- [ ] Build CardCustomizer modal
- [ ] Implement server-side card generation
- [ ] Add share to Twitter/Farcaster
- [ ] Add download as PNG
- [ ] Implement card caching

### Phase 6: Polish & Launch (Week 6-7)
**Goal:** Production ready

- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics tracking
- [ ] A/B test messaging
- [ ] Documentation
- [ ] Soft launch to beta users

---

## Success Metrics

### Primary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users (DAU) | +50% | Users opening app daily |
| DAU/MAU Ratio | >40% | Engagement depth |
| Avg Sessions/User/Day | >2 | App stickiness |
| Quest Completion Rate | >60% | Feature adoption |
| Card Shares/Week | >100 | Viral coefficient |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg FS Earned/User/Week | >200 | Engagement breadth |
| Tier Progression Rate | 10%/month | Users moving up tiers |
| Founding Member Conversion | 80% | First 1000 users |
| Referral Rate | 20% | Users who refer |
| Premium Conversion | 5% | Paid subscribers |

---

## Open Questions

1. **Token integration?** Should FS convert to tokens? (Keep vague for now)
2. **Premium tier pricing?** $4.99/month or $49.99/year?
3. **Card NFT minting?** Allow minting profile cards as NFTs?
4. **Leaderboard prizes?** Should season-end leaderboard have prizes?
5. **Anti-gaming?** How to prevent FS farming/botting?

---

## Appendix: Messaging Guidelines

### What to Say

| Context | Messaging |
|---------|-----------|
| Leaderboard | "Build your position" |
| Early Adopter | "Early supporters will be rewarded" |
| Score | "Your Foresight Score tracks everything" |
| Tier | "Unlock exclusive benefits as you climb" |
| Founding | "Permanent recognition for first believers" |

### What NOT to Say

| Avoid | Why |
|-------|-----|
| "Earn tokens" | Securities implication |
| "Get airdrop" | Explicit promise |
| "Make money from referrals" | MLM/pyramid vibes |
| Specific dates | Creates liability |
| Specific amounts | Creates expectation |

---

**Document Status:** Living Document
**Next Review:** After Phase 1 completion
**Owner:** Product Team
