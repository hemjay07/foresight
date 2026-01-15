# CT Draft - Master TODO Tracker

**Last Updated:** December 27, 2025
**Current Focus:** Foresight Score System Implementation

> **IMPORTANT:** Update this file after completing major tasks. This is the single source of truth.

---

## Current Initiative: Foresight Score System

**Design Document:** `docs/planning/FORESIGHT_SCORE_SYSTEM.md`

### Phase 1: Foundation (Week 1-2) - MOSTLY COMPLETE

#### Database Schema
- [x] Create migration: `foresight_scores` table
- [x] Create migration: `foresight_score_transactions` table
- [x] Create migration: `leaderboard_snapshots` table
- [x] Create migration: `foresight_score_config` table
- [x] Create migration: `quest_definitions_v2` table
- [x] Create migration: `user_quests_v2` table
- [x] Add `signup_number` to users table with trigger
- [x] Add `early_adopter_tier`, `current_multiplier`, `multiplier_expires_at` to users
- [x] Seed FS earning config (27 earning types)
- [x] Seed quest definitions (27 quests)

#### Backend API
- [x] `GET /api/v2/fs/me` - Get my FS details
- [x] `GET /api/v2/fs/leaderboard` - Get leaderboard
- [x] `GET /api/v2/fs/leaderboard/position` - Get user's rank
- [x] `POST /api/v2/fs/earn` - Record FS earning
- [x] `GET /api/v2/fs/history` - Get FS transaction history
- [x] `GET /api/v2/fs/config` - Get FS earning config
- [x] `GET /api/v2/fs/founding-members` - Get founding members wall
- [x] Implement FS earning service (`foresightScoreService.ts`)
- [x] Implement tier calculation service
- [x] Implement multiplier logic
- [x] Implement ranking updates
- [x] Implement season/week reset functions

#### Frontend - Core
- [x] `ForesightScoreDisplay.tsx` - 3 variants (full/compact/minimal)
- [x] Update Home dashboard with FS widget
- [x] Update Profile page with FS display
- [x] Add minimal FS display to header/Layout
- [ ] `TierBadge.tsx` - Standalone tier badge component
- [ ] `FsEarnAnimation.tsx` - +10 FS popup animation

#### FS Earning Triggers (Backend Integration)
- [x] Contest entry (prizedContestsV2.ts) - Awards FS when entering free/paid contest
- [x] Team creation (league.ts) - Awards FS for first team created
- [x] Daily voting (league.ts) - Awards FS for daily engagement + streak bonus
- [x] Contest placements (fantasyScoringService.ts) - Awards FS for 1st/2nd/3rd/top10%/top25%/top50%

### Phase 2: Leaderboards (Week 2-3)

- [ ] `GET /api/v2/leaderboard/:type` - All 4 types
- [ ] `LeaderboardTabs.tsx` - Tab navigation
- [ ] `LeaderboardTable.tsx` - Ranking table
- [ ] `LeaderboardEntry.tsx` - Single row component
- [ ] `YourPositionWidget.tsx` - Where you stand
- [ ] `RankChangeIndicator.tsx` - ↑14 / ↓2 / =
- [ ] Create `/leaderboard` page
- [ ] Implement season reset cron (1st of month)
- [ ] Implement week reset cron (Monday 00:00 UTC)

### Phase 3: User Identity (Week 3-4)

- [ ] `GET /api/v2/profile/me` - Extended profile
- [ ] `PATCH /api/v2/profile/me` - Update profile
- [ ] `GET /api/v2/profile/:username` - Public profile
- [ ] Implement founding member number assignment
- [ ] `FoundingMemberBadge.tsx` - FM #XXX badge
- [ ] `EarlyAdopterBanner.tsx` - Multiplier countdown
- [ ] `UserPill.tsx` - Username + tier (compact)
- [ ] `UserAvatar.tsx` - Avatar with tier border
- [ ] Update leaderboard to show badges
- [ ] Implement multiplier expiration cron

### Phase 4: Quests (Week 4-5)

- [ ] Quest definitions seed data
- [ ] Quest tracking service
- [ ] Daily quest reset cron (00:00 UTC)
- [ ] Weekly quest reset cron (Monday 00:00 UTC)
- [ ] `GET /api/v2/quests/active` - Active quests
- [ ] `POST /api/v2/quests/:id/claim` - Claim reward
- [ ] `QuestCard.tsx` - Single quest
- [ ] `QuestProgress.tsx` - Progress bar
- [ ] `QuestCategory.tsx` - Daily/Weekly/Achievement
- [ ] `DailyQuestWidget.tsx` - Home widget
- [ ] `QuestClaimModal.tsx` - Claim celebration
- [ ] Create `/quests` page

### Phase 5: Shareable Cards (Week 5-6)

- [ ] Card template designs (4 variants)
- [ ] `ShareableCard.tsx` - Card component
- [ ] `CardCustomizer.tsx` - Customize modal
- [ ] `CardPreview.tsx` - Live preview
- [ ] Server-side card generation (canvas/puppeteer)
- [ ] `GET /api/v2/profile/card/:username` - Get card image
- [ ] `POST /api/v2/profile/card/generate` - Custom card
- [ ] Share to Twitter integration
- [ ] Share to Farcaster integration
- [ ] Download as PNG
- [ ] Card caching (1 hour)
- [ ] Create `/share` page

### Phase 6: Polish & Launch (Week 6-7)

- [ ] Performance optimization
- [ ] Error handling audit
- [ ] Analytics tracking (FS events)
- [ ] A/B test messaging
- [ ] Documentation update
- [ ] Soft launch to beta users
- [ ] Monitor and iterate

---

## Previous Work (Completed)

### December 22-27, 2025

- [x] Audit project state
- [x] Organize docs into folders
- [x] Create FORESIGHT_SCORE_SYSTEM.md design doc
- [x] Design database schema
- [x] Design shareable Profile Card
- [x] Design user identity system
- [x] Design Quest/Task system
- [x] Design Leaderboard system
- [x] Design Early Adopter mechanics

### December 22 - Prized Contests

- [x] Audit prized contests implementation
- [x] Cancel 5 expired Week 51 contests
- [x] Create 5 new Week 52 contests
- [x] Add PRIZED_V2_CONTRACT_ADDRESS to backend/.env
- [x] Add prized contest lock check cron job
- [x] Add prized contest scoring cron job
- [x] Add weekly prized contests creation cron job
- [x] Add daily flash contest creation cron job

### December 21 - Foundation

- [x] Verify founding member cap works
- [x] Verify scoring system works
- [x] Research 22 potential influencer partners via Grok
- [x] Audit in-game influencer tiers
- [x] Apply 18 tier adjustments to database
- [x] Add 13 missing high-value CT influencers

---

## Current System Status

### What Works

| Component | Status | Notes |
|-----------|--------|-------|
| User auth (SIWE) | ✅ | Working |
| Username editing | ✅ | Profile + Settings |
| Avatar URL | ✅ | Custom URL support |
| Twitter handle | ✅ | Optional field |
| XP system (legacy) | ✅ | Will migrate to FS |
| Achievements | ✅ | Basic system |
| Streaks | ✅ | Vote streak |
| Team management | ✅ | Create/edit teams |
| Weekly contests | ✅ | Auto-lock/score |
| Daily Flash | ✅ | Automated |
| Prized contests | ✅ | V2 deployed |
| Twitter metrics | ✅ | twitterapi.io |

### What's Missing (This Sprint)

| Component | Priority | Notes |
|-----------|----------|-------|
| Foresight Score | P0 | Core engagement metric |
| Tier system | P0 | Bronze → Diamond |
| All-Time leaderboard | P0 | Prestige ranking |
| Founding Member | P1 | First 1000 users |
| Quest system | P1 | Daily/Weekly tasks |
| Shareable cards | P2 | Viral growth |
| CT Feed | P2 | Content aggregation |
| Live scoring | P2 | Real-time updates |

---

## Quick Commands

```bash
# Start dev servers
pnpm dev

# Backend only
cd backend && pnpm dev

# Frontend only
cd frontend && pnpm dev

# Run database migrations
cd backend && pnpm db:migrate

# Create new migration
cd backend && pnpm exec knex migrate:make migration_name

# Refresh Twitter data
curl -X POST http://localhost:3001/api/admin/trigger-metrics-update

# Check data freshness
psql foresight -c "SELECT MAX(scraped_at) FROM influencer_metrics;"
```

---

## Architecture Notes

### Foresight Score (FS)

- **One metric** that rules everything
- Accumulates from: Fantasy wins + Daily engagement + Social tasks + Referrals
- Multipliers: Early adopter (1.5x-1.1x) + Tier (1.05x-1.2x) + Premium (1.25x)
- Never resets (All-Time), but tracks Season and Week for leaderboards

### Tier System

| Tier | FS Required | Multiplier |
|------|-------------|------------|
| Bronze | 0 | 1.0x |
| Silver | 1,000 | 1.05x |
| Gold | 5,000 | 1.1x |
| Platinum | 20,000 | 1.15x |
| Diamond | 50,000 | 1.2x |

### Early Adopter Tiers

| User # | Tier | Multiplier | Duration |
|--------|------|------------|----------|
| 1-1,000 | Founding Member | 1.5x | 90 days |
| 1,001-5,000 | Early Adopter | 1.25x | 60 days |
| 5,001-10,000 | Early Bird | 1.1x | 30 days |
| 10,001+ | Standard | 1.0x | N/A |

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| DAU | ? | +50% |
| DAU/MAU Ratio | ? | >40% |
| Avg Sessions/Day | ? | >2 |
| Quest Completion | N/A | >60% |
| Card Shares/Week | N/A | >100 |

---

## Files to Reference

- **Design Doc:** `docs/planning/FORESIGHT_SCORE_SYSTEM.md`
- **Monetization:** `docs/marketing/MONETIZATION_STRATEGY.md`
- **Prized Leagues:** `docs/PRIZED_LEAGUE_ARCHITECTURE.md`
- **V2 Plan:** `docs/planning/PRIZED_LEAGUES_V2_PLAN.md`

---

*Keep this file updated. It's your north star.*
