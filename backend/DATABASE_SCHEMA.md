# Foresight Database Schema

> **Last Updated:** December 30, 2025
> **Database:** PostgreSQL
> **Total Tables:** 49

This document provides an overview of the database schema for the Foresight application.

---

## Table of Contents

- [Core Tables](#core-tables)
- [Authentication & Users](#authentication--users)
- [Fantasy League & Contests](#fantasy-league--contests)
- [Influencers & Metrics](#influencers--metrics)
- [CT Feed & Social](#ct-feed--social)
- [Gamification & Progression](#gamification--progression)
- [Financial & Prizes](#financial--prizes)
- [System & Logs](#system--logs)

---

## Core Tables

### `users`
Primary user accounts.

**Key Columns:**
- `id` (UUID, PK) - User identifier
- `wallet_address` (VARCHAR, UNIQUE) - Ethereum wallet
- `username` (VARCHAR, UNIQUE) - Display name
- `twitter_handle` (VARCHAR) - Twitter username
- `role` (VARCHAR) - User role (user/admin) - Added 2025-12-30
- `ct_mastery_score` (INT) - User's CT mastery level
- `referral_code` (VARCHAR) - Unique referral code
- `created_at`, `last_seen_at` (TIMESTAMP)

---

## Authentication & Users

### `sessions`
Active user sessions with JWT tokens.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `access_token` (TEXT)
- `refresh_token` (TEXT)
- `expires_at` (TIMESTAMP)

### `user_watchlist`
Users' watchlist of influencers.

---

## Fantasy League & Contests

### `fantasy_contests`
Main contest definitions (free and prized).

**Key Columns:**
- `id` (INT, PK)
- `name` (VARCHAR)
- `contest_type` (VARCHAR) - 'free' or 'prized'
- `entry_fee` (DECIMAL)
- `prize_pool` (DECIMAL)
- `start_time`, `end_time` (TIMESTAMP)
- `status` (VARCHAR) - 'upcoming', 'active', 'finalized'

### `prized_contests`
Enhanced prized contest data.

### `free_league_entries`
Free contest entries.

### `prized_entries`
Prized contest entries with on-chain data.

### `user_teams`
User team compositions.

**Key Columns:**
- `user_id` (UUID, FK → users)
- `influencer_ids` (INT[]) - Array of influencer IDs
- `team_score` (INT)

### `team_picks`
Individual influencer selections per team.

### `league_members`
Contest participation tracking.

### `leaderboard_snapshots`
Historical leaderboard data.

---

## Influencers & Metrics

### `influencers`
CT (Crypto Twitter) influencers available for drafting.

**Key Columns:**
- `id` (INT, PK)
- `name` (VARCHAR)
- `twitter_handle` (VARCHAR, UNIQUE)
- `tier` (VARCHAR) - S, A, B, C
- `followers_count` (INT)
- `profile_picture_url` (VARCHAR)
- `is_active` (BOOLEAN)

### `influencer_metrics`
Time-series metrics for influencers.

**Key Columns:**
- `influencer_id` (INT, FK → influencers)
- `likes` (INT)
- `retweets` (INT)
- `replies` (INT)
- `engagement_score` (INT)
- `recorded_at` (TIMESTAMP)

### `influencer_weekly_votes`
Weekly voting data.

### `weekly_spotlight_votes`
Spotlight feature votes.

---

## CT Feed & Social

### `ct_tweets`
Curated tweets for the CT Feed.

**Key Columns:**
- `id` (UUID, PK)
- `tweet_id` (VARCHAR, UNIQUE) - Twitter tweet ID
- `influencer_id` (INT, FK → influencers)
- `content` (TEXT)
- `like_count`, `retweet_count`, `reply_count` (INT)
- `created_at` (TIMESTAMP)

### `rising_stars`
Emerging influencers.

### `feed_interactions`
User interactions with CT Feed.

**Key Columns:**
- `user_id` (UUID, FK → users)
- `tweet_id` (UUID, FK → ct_tweets)
- `interaction_type` (VARCHAR) - 'view', 'like', 'share'
- `browse_time_seconds` (INT)

### `twitter_verified_tweets`
Verified tweets from Twitter API.

---

## Gamification & Progression

### `foresight_scores`
User's Foresight Score (FS) balances.

**Key Columns:**
- `user_id` (UUID, PK, FK → users)
- `total_earned` (INT)
- `total_spent` (INT)
- `current_balance` (INT)
- `daily_streak` (INT)
- `last_daily_claim` (DATE)

### `foresight_score_transactions`
FS transaction history.

**Key Columns:**
- `user_id` (UUID, FK → users)
- `amount` (INT)
- `transaction_type` (VARCHAR) - 'earn' or 'spend'
- `reason` (VARCHAR)
- `category` (VARCHAR)

### `foresight_score_config`
FS earning rules and multipliers.

### `quest_definitions_v2`
Quest templates and requirements.

### `user_quests_v2`
User quest progress and completion.

### `achievements`
Achievement definitions.

### `user_achievements`
User achievement unlocks.

### `user_xp_ledger`
XP transaction log.

### `user_xp_totals`
Aggregated XP balances.

### `xp_actions`
XP earning actions.

### `user_daily_activities`
Daily activity tracking.

---

## Financial & Prizes

### `prize_distributions`
Prize pool distribution rules.

### `prize_claims`
User prize claims and payouts.

### `platform_fees`
Platform fee collection.

### `contest_types`
Contest type definitions.

### `prize_distribution_rules`
Rules for prize allocation.

### `prized_contract_events`
On-chain events from prized contests.

---

## Referrals & Social

### `referrals`
Referral tracking.

**Key Columns:**
- `referrer_id` (UUID, FK → users)
- `referred_id` (UUID, FK → users)
- `referral_code` (VARCHAR)
- `created_at` (TIMESTAMP)

### `referral_events`
Referral milestone events.

### `referral_milestones`
Referral tier rewards.

---

## System & Logs

### `error_logs`
Application error logging.

### `api_fetch_logs`
External API call tracking.

### `activity_feed`
User activity stream.

### `team_transfers`
Team composition changes.

### `transfer_tier_limits`
Transfer restrictions.

### `private_leagues`
Private league definitions.

### `knex_migrations`
Database migration history (managed by Knex).

### `knex_migrations_lock`
Migration lock table (managed by Knex).

---

## Relationships & Foreign Keys

### Core Relationships:
```
users (1) ←→ (N) sessions
users (1) ←→ (N) user_teams
users (1) ←→ (N) foresight_score_transactions
users (1) ←→ (N) user_quests_v2
users (1) ←→ (N) user_achievements

influencers (1) ←→ (N) influencer_metrics
influencers (1) ←→ (N) ct_tweets
influencers (1) ←→ (N) team_picks

fantasy_contests (1) ←→ (N) league_members
fantasy_contests (1) ←→ (N) prized_entries
```

---

## Indexes

Key indexes for performance:
- `users`: wallet_address, username, referral_code
- `influencers`: twitter_handle
- `ct_tweets`: tweet_id, influencer_id, created_at
- `foresight_score_transactions`: user_id, created_at
- `sessions`: user_id, expires_at

---

## Recent Changes

- **2025-12-30**: Added `role` column to `users` table for role-based access control
- **2025-12-29**: Added `twitter_verified_tweets` table for Twitter API integration
- **2025-12-29**: Added contest finalization features
- **2025-12-29**: Deactivated unimplemented quests

---

## Maintenance

To regenerate this documentation:
```bash
# Connect to database
psql -d foresight

# List all tables
\dt

# Describe a specific table
\d table_name
```

To update after migrations:
```bash
# Run migrations
NODE_OPTIONS='--import tsx' pnpm exec knex migrate:latest

# Update this document with new table structures
```

---

**Note:** For detailed column definitions, constraints, and triggers, refer to the migration files in `/migrations/`.
