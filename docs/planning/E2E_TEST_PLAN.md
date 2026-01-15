# End-to-End Test Plan: Contest Lifecycle

> **Created:** December 29, 2025
> **Priority:** CRITICAL - Must pass before launch
> **Status:** Ready for execution

---

## Overview

This document outlines the complete end-to-end testing procedure for the Foresight contest system. We will test the entire lifecycle from contest creation to prize distribution.

---

## Prerequisites

### 1. Backend Server Running
```bash
cd backend && NODE_OPTIONS='--import tsx' pnpm dev
```

### 2. Frontend Server Running
```bash
cd frontend && pnpm dev
```

### 3. Database Ready
- PostgreSQL running
- All migrations applied
- Influencers seeded

### 4. API Keys Configured
- `TWITTER_API_IO_KEY` set in backend/.env
- Verify: `GET /api/admin/snapshot-status` should return `apiConfigured: true`

### 5. Test User Authenticated
- Connect wallet in frontend
- Verify `authToken` exists in localStorage

---

## Test Phases

## Phase 1: Contest Discovery & Entry

### Test 1.1: View Available Contests
**Endpoint:** `GET /api/v2/contests?active=true`
**Frontend:** Navigate to `/compete?tab=contests`

**Expected:**
- [ ] At least one contest visible (Free League or paid)
- [ ] Contest shows: name, entry fee, prize pool, players, time remaining
- [ ] "Enter Free" or "Enter (X ETH)" button visible

**Screenshot:** Take screenshot of contests page

---

### Test 1.2: Enter Free League
**Endpoint:** `POST /api/v2/contests/:id/enter-free`
**Frontend:** Click "Enter Free" on Free League contest

**Expected:**
- [ ] Redirects to `/draft?contestId=X&type=FREE_LEAGUE&...`
- [ ] Draft page loads with influencer grid
- [ ] Sidebar shows empty team slots
- [ ] Budget shows 150 points

---

### Test 1.3: Enter Paid Contest (Test Mode)
**Endpoint:** `POST /api/v2/contests/:id/enter-test` (dev only)

```bash
curl -X POST http://localhost:3001/api/v2/contests/1/enter-test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"teamIds": [1,2,3,4,5], "captainId": 1}'
```

**Expected:**
- [ ] Returns success with entry details
- [ ] `prized_entries` table has new row
- [ ] Contest `player_count` incremented

---

## Phase 2: Team Draft

### Test 2.1: Select Influencers
**Frontend:** `/draft` page

**Steps:**
1. Click on 5 different influencers to add to team
2. Verify budget updates correctly
3. Verify each slot fills in sidebar

**Expected:**
- [ ] Can select 5 influencers
- [ ] Budget decreases with each pick
- [ ] Cannot exceed 150 budget
- [ ] Selected cards show checkmark or highlight

---

### Test 2.2: Captain Selection
**Frontend:** In sidebar, select captain

**Expected:**
- [ ] Can click on a team member to make captain
- [ ] Captain shows crown icon
- [ ] "1.5x" badge visible on captain
- [ ] Only one captain allowed

**Issues to Watch:**
- Captain selection UX currently poor (tiny crown)
- Document exact interaction pattern

---

### Test 2.3: Create Team
**Frontend:** Click "Enter Free League" or equivalent

**Expected:**
- [ ] Success toast appears
- [ ] Redirects to `/contest/:id` (contest detail page)
- [ ] Team visible on contest detail page

---

## Phase 3: Team Editing (Before Lock)

### Test 3.1: View Team on Contest Detail
**Frontend:** `/contest/:id`

**Expected:**
- [ ] "My Team" tab shows team formation
- [ ] All 5 influencers visible
- [ ] Captain marked
- [ ] Current score shown (may be 0 initially)

---

### Test 3.2: Edit Team
**Endpoint:** `PUT /api/league/team/update`
**Frontend:** Should have "Edit Team" button

**Expected:**
- [ ] Edit button visible if before lock time
- [ ] Clicking edit returns to draft with pre-selected picks
- [ ] Can swap influencers
- [ ] Can change captain
- [ ] Save updates team

**Current State:** Edit button may not exist - document if missing

---

## Phase 4: Scoring Cycle

### Test 4.1: Trigger Start Snapshot (Manually)
**Endpoint:** `POST /api/admin/trigger-start-snapshot`

```bash
curl -X POST http://localhost:3001/api/admin/trigger-start-snapshot \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- [ ] Returns success with snapshot count
- [ ] `weekly_snapshots` table has entries with type='start'
- [ ] Each active influencer has snapshot

---

### Test 4.2: Trigger End Snapshot (Manually)
**Endpoint:** `POST /api/admin/trigger-end-snapshot`

```bash
curl -X POST http://localhost:3001/api/admin/trigger-end-snapshot \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- [ ] Returns success with snapshot count
- [ ] `weekly_snapshots` table has entries with type='end'

---

### Test 4.3: Trigger Scoring (Manually)
**Endpoint:** `POST /api/admin/trigger-weekly-scoring`

```bash
curl -X POST http://localhost:3001/api/admin/trigger-weekly-scoring \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- [ ] Returns success with teams scored count
- [ ] `team_picks` table has score columns populated
- [ ] `user_teams` has `total_score` updated
- [ ] Contest rankings calculated

---

### Test 4.4: Alternative - Run Script
```bash
cd backend && NODE_OPTIONS='--import tsx' npx tsx src/scripts/runScoringNow.ts
```

**Expected:**
- [ ] Script outputs top 5 influencers with scores
- [ ] Scores visible in database

---

## Phase 5: Score Breakdown Display

### Test 5.1: View Score Breakdown
**Frontend:** On contest detail page, click to view score breakdown

**Expected:**
- [ ] ScoreBreakdownModal opens
- [ ] Team total score visible
- [ ] Per-influencer breakdown with:
  - [ ] Activity score (0-35)
  - [ ] Engagement score (0-60)
  - [ ] Growth score (0-40)
  - [ ] Viral score (0-25)
  - [ ] Captain bonus (if applicable)
  - [ ] Spotlight bonus (if applicable)
- [ ] Raw metrics visible (tweets, avg likes, etc.)
- [ ] "How Scoring Works" section available

**Screenshot:** Take screenshot of score breakdown modal

---

### Test 5.2: Verify Score Calculations
**Compare:**
- Database values in `team_picks` table
- API response from `/api/league/team/:teamId/breakdown`
- Frontend display in ScoreBreakdownModal

**Expected:**
- [ ] All three match
- [ ] Activity + Engagement + Growth + Viral + Bonuses = Total

---

## Phase 6: Contest Finalization

### Test 6.1: Lock Contest (Manually or Wait)
**Endpoint:** Contest auto-locks when `lock_time` passes

**To force lock:**
```sql
UPDATE prized_contests
SET status = 'locked', lock_time = NOW() - INTERVAL '1 hour'
WHERE id = YOUR_CONTEST_ID;
```

**Expected:**
- [ ] Contest status = 'locked'
- [ ] No more team edits allowed
- [ ] "Locked" indicator visible in UI

---

### Test 6.2: Finalize Contest
**Endpoint:** Contest auto-finalizes when `end_time` passes after scoring

**To force finalize:**
```sql
UPDATE prized_contests
SET status = 'finalized', end_time = NOW() - INTERVAL '1 hour'
WHERE id = YOUR_CONTEST_ID;
```

**Or trigger via cron:**
```bash
curl -X POST http://localhost:3001/api/admin/trigger-weekly-scoring \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- [ ] Contest status = 'finalized'
- [ ] Final rankings calculated
- [ ] Prize amounts calculated for winners

---

### Test 6.3: Verify Prize Distribution
**Check database:**
```sql
SELECT wallet_address, rank, score, prize_amount, claimed
FROM prized_entries
WHERE contest_id = YOUR_CONTEST_ID
ORDER BY rank;
```

**Expected:**
- [ ] Top N players have `prize_amount > 0`
- [ ] Amounts follow prize distribution rules
- [ ] Total prizes = distributable_pool

---

## Phase 7: Frontend Polish Verification

### Test 7.1: Leaderboard Display
**Frontend:** Contest detail page, "Leaderboard" tab

**Expected:**
- [ ] All teams ranked
- [ ] Scores visible
- [ ] Current user highlighted
- [ ] Prize amounts shown for winners

---

### Test 7.2: Profile - My Entries
**Frontend:** `/profile` or relevant section

**Expected:**
- [ ] All user's contest entries visible
- [ ] Each shows: contest name, rank, score, status
- [ ] Can click to view contest detail

---

## Critical Issues Found

Document any issues discovered during testing:

| # | Issue | Severity | File | Notes |
|---|-------|----------|------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Test Execution Log

| Date | Tester | Phase | Result | Notes |
|------|--------|-------|--------|-------|
| | | | | |

---

## Success Criteria

All phases must pass for launch readiness:

- [ ] Phase 1: Contest discovery working
- [ ] Phase 2: Team draft working
- [ ] Phase 3: Team editing working (or documented as missing)
- [ ] Phase 4: Scoring cycle working
- [ ] Phase 5: Score breakdown displays correctly
- [ ] Phase 6: Contest finalization working
- [ ] Phase 7: All UI elements display correctly

---

## Quick Commands Reference

```bash
# Start servers
cd backend && NODE_OPTIONS='--import tsx' pnpm dev
cd frontend && pnpm dev

# Check API status
curl http://localhost:3001/api/admin/snapshot-status -H "Authorization: Bearer TOKEN"

# Trigger scoring
curl -X POST http://localhost:3001/api/admin/trigger-weekly-scoring -H "Authorization: Bearer TOKEN"

# Run scoring script
cd backend && NODE_OPTIONS='--import tsx' npx tsx src/scripts/runScoringNow.ts

# Check contest status
curl http://localhost:3001/api/v2/contests/1

# Get score breakdown
curl http://localhost:3001/api/league/team/TEAM_ID/breakdown -H "Authorization: Bearer TOKEN"
```

---

*Execute this test plan completely before making any UI changes.*
