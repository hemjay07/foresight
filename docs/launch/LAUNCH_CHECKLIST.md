# Foresight Launch Checklist & Status Dashboard

**Last Updated**: December 21, 2025
**Launch Target**: [SET DATE]
**Current Status**: 🟢 NEARLY READY - Minor fixes needed

---

## Quick Status Dashboard

| Component | Status | Blocker? | Evidence |
|-----------|--------|----------|----------|
| Auth/Login | ✅ 95% | No | SIWE working, 2 users exist |
| Team Creation | ✅ 90% | No | 2 teams created, scores calculated |
| Data Pipeline | ✅ 85% | No | 102 tweet fetches, 92 profile fetches successful |
| Scoring System | ✅ 80% | No | Teams have real scores (249, 433 pts) |
| Smart Contracts | 🟡 50% | **For paid only** | Free leagues work, V2 not deployed |
| Frontend UI | 🟡 75% | No | Core works, polish needed |
| Database | ✅ 95% | No | Schema complete, data exists |

**Overall Readiness**: 75% - Can demo free leagues today after minor fixes

---

## 🔧 QUICK FIXES NEEDED (Before Demo)

### Fix #1: Add API Key to .env (Permanently)
**Status**: 🟡 WORKS VIA EXPORT - Needs to be permanent
**Impact**: API works when exported, but need in .env for cron jobs
**Time to Fix**: 2 minutes

**Current State**:
- TwitterAPI.io HAS BEEN WORKING (102 successful fetches on record)
- Key was set via `export TWITTER_API_IO_KEY=...` during testing
- Cron jobs won't work without it in .env

**How to Fix**:
```bash
# Add to backend/.env:
echo "TWITTER_API_IO_KEY=your_actual_key_here" >> backend/.env

# Verify:
grep "TWITTER_API_IO" backend/.env
```

**Verification**:
- [ ] API key added to .env file
- [ ] Server can read it without export

---

### Fix #2: Refresh Data (2 Weeks Stale)
**Status**: 🟡 DATA EXISTS - Just outdated
**Impact**: Scores based on Dec 7 data, need fresh for demo
**Time to Fix**: 5-10 minutes (API rate limited)

**Current State**:
- Last successful fetch: December 7, 2025
- Snapshots exist with real engagement data
- CryptoHayes: 37K likes, cdixon: 15K likes (real data!)

**How to Fix**:
```bash
cd backend

# Option 1: Trigger via admin API
curl -X POST http://localhost:3001/api/admin/trigger-metrics-update

# Option 2: Run script directly (with API key exported)
export TWITTER_API_IO_KEY=your_key
npx tsx src/scripts/testTwitterApiIo.ts
```

**Verification**:
- [ ] New metrics in database (check scraped_at timestamps)
- [ ] Most influencers have non-zero engagement

---

### Fix #3: Create Fresh Contest
**Status**: 🟡 STALE CONTESTS - Need current one
**Impact**: Contests from Nov 24 still marked "active"
**Time to Fix**: 5 minutes

**Current State**:
- Contest 7 & 8: Nov 24-30, still "active" (should be completed)
- Contest 9: Dec 7-14, marked "upcoming" (should be active/completed)
- No contest for current week (Dec 21-28)

**How to Fix**:
```bash
# Option 1: Create via API
curl -X POST http://localhost:3001/api/admin/create-contest \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-12-21", "endDate": "2025-12-28", "duration": "weekly"}'

# Option 2: Direct SQL
psql foresight -c "
INSERT INTO fantasy_contests (contest_key, start_date, end_date, status, duration)
VALUES ('weekly-2025-12-21', '2025-12-21', '2025-12-28', 'active', 'weekly');
"

# Clean up old contests
psql foresight -c "
UPDATE fantasy_contests SET status = 'completed' WHERE end_date < CURRENT_DATE AND status = 'active';
"
```

**Verification**:
- [ ] New contest exists for current week
- [ ] Old contests marked completed
- [ ] Users can join new contest

---

### Fix #4: Fix Failed Influencers (Optional)
**Status**: 🟡 SOME FAILURES - ~10 influencers have 0 data
**Impact**: Some influencers won't score properly
**Time to Fix**: 10 minutes

**Current State**:
- ~10 influencers returned 0 followers/engagement
- Likely API failures or changed handles
- Examples: nic__carter, hasufl, rovercrc, DegenSpartan

**How to Fix**:
```bash
# Check which influencers have issues
psql foresight -c "
SELECT i.twitter_handle, i.consecutive_failures, i.last_fetch_error
FROM influencers i
WHERE i.follower_count = 0 OR i.consecutive_failures > 0
ORDER BY i.consecutive_failures DESC;
"

# For each failed handle, verify it exists on Twitter
# Then update the handle if needed, or mark inactive
```

**Verification**:
- [ ] Identify all failed influencers
- [ ] Fix or mark inactive
- [ ] Re-fetch data for fixed ones

---

### NOT A BLOCKER: CTDraftPrizedV2
**Status**: ❌ NOT DEPLOYED
**Impact**: Only affects PAID contests
**Can Demo Without?**: ✅ YES - Free leagues work perfectly

**For MVP Demo**: Skip this. Free leagues demonstrate the full game loop.
**For Monetization**: Deploy when ready for paid contests.

---

## 📋 LAUNCH READINESS CHECKLIST

### Phase 1: Make It Playable (Must Have)

#### Data Pipeline
- [ ] Add TWITTER_API_IO_KEY to .env
- [ ] Test API connection works
- [ ] Verify can fetch influencer profiles
- [ ] Verify can fetch influencer tweets
- [ ] Run initial data fetch for all 50 influencers

#### Scoring System
- [ ] Capture initial "start" snapshot for all influencers
- [ ] Verify snapshots saved to database
- [ ] Run scoring cycle manually
- [ ] Verify non-zero scores appear
- [ ] Verify leaderboard updates correctly

#### Core User Flow
- [ ] User can connect wallet (RainbowKit)
- [ ] User can sign SIWE message
- [ ] User gets JWT token
- [ ] User can browse influencers
- [ ] User can draft 5 influencers within budget
- [ ] User can lock their team
- [ ] User can see their team
- [ ] User can see their score
- [ ] User can see leaderboard

#### Active Contest
- [ ] At least 1 free league contest exists
- [ ] Contest is in "active" status
- [ ] Contest has valid start/end dates
- [ ] Users can enter the contest

---

### Phase 2: Make It Presentable (Should Have)

#### User Experience
- [ ] Users can set a username (not null)
- [ ] Users can edit team name
- [ ] Toast notifications for actions (success/error)
- [ ] Loading states while data fetches
- [ ] Error messages are user-friendly
- [ ] Mobile layout works (basic)

#### Influencer Display
- [ ] All 50 influencers have profile images
- [ ] All 50 influencers have bios
- [ ] All 50 influencers have correct tiers (S/A/B/C)
- [ ] All 50 influencers have correct pricing
- [ ] Follower counts display correctly

#### Leaderboard
- [ ] Shows real rankings
- [ ] Shows team scores
- [ ] Shows rank changes (optional)
- [ ] Links to team details

---

### Phase 3: Make It Polished (Nice to Have)

#### Advanced Features
- [ ] Form indicators (hot/cold/stable)
- [ ] Score breakdown modal
- [ ] Voting system working
- [ ] Achievement system working
- [ ] Referral tracking working
- [ ] XP system working

#### Smart Contracts
- [ ] CTDraftPrizedV2 deployed
- [ ] Paid contest creation works
- [ ] Entry fee collection works
- [ ] Prize distribution works

#### Polish
- [ ] Animations on key actions
- [ ] Confetti on wins
- [ ] Share to Twitter/Farcaster
- [ ] Profile cards for sharing
- [ ] Empty states have CTAs

---

## 🎯 MARKETING VS REALITY GAP ANALYSIS

### What We're Promising (from MONETIZATION_STRATEGY.md)

| Promise | Current Reality | Gap |
|---------|-----------------|-----|
| "Draft influencers like Cobie/Wales" | ✅ Works | None |
| "Score based on Twitter metrics" | ❌ Broken | TwitterAPI.io not connected |
| "Weekly contests" | 🟡 Partial | Contest exists but no real scoring |
| "10% platform rake, 90% to winners" | ❌ Not deployed | Smart contract not live |
| "Already on Base" | ✅ Old contracts | V2 not deployed |
| "XP tracking" | 🟡 Schema exists | Not fully integrated |
| "Founding member status" | 🟡 Concept exists | Not implemented |
| "Referral system" | 🟡 API exists | UI unclear |

### What We Can Demo Today (After Fixing Blockers #1 & #2)

✅ **Can Demo**:
- Wallet connection
- Team drafting (pick 5 influencers)
- Budget management (100 points)
- Locking teams
- Viewing leaderboard
- Basic profile

❌ **Cannot Demo**:
- Real-time scoring (need TwitterAPI.io)
- Prize payouts (need V2 contract)
- Paid contests (need V2 contract)
- Username editing (not built)

### Minimum Viable Demo

To demo to influencers, we need:
1. ✅ Working draft experience
2. ❌ Non-zero scores (FIX BLOCKER #1 & #2)
3. ✅ Working leaderboard (shows something)
4. 🟡 At least 1 active contest (verify exists)

**With just Blocker #1 & #2 fixed, we can demo a free league with real scoring.**

---

## 📅 SUGGESTED FIX SEQUENCE

### Day 1: Fix Data Pipeline (2-3 hours)

**Morning**:
1. Get TwitterAPI.io API key (if you don't have one)
2. Add to backend/.env
3. Run test script to verify connection
4. Manually fetch data for 5 influencers to test

**Afternoon**:
5. Run batch fetch for all 50 influencers
6. Verify data in database (influencer_metrics table)
7. Capture "start" snapshot for current contest
8. Trigger scoring cycle
9. Verify leaderboard shows non-zero scores

### Day 2: Verify User Flow (2 hours)

1. Test complete flow: Connect → Draft → Lock → View Score
2. Fix any errors encountered
3. Test on mobile (basic check)
4. Take screenshots for demo

### Day 3: Record Demo & Start Outreach (2 hours)

1. Record 2-min Loom demo showing working product
2. Start influencer outreach (10 DMs)
3. Monitor for any issues

### Day 4+: Polish While Doing Outreach

- Add username editing
- Add toast notifications
- Deploy V2 contract (for paid contests)
- Continue outreach

---

## 🔧 QUICK COMMANDS REFERENCE

### Check Current State
```bash
# Check if Twitter API configured
grep "TWITTER_API_IO" backend/.env

# Check influencer metrics in DB
psql foresight -c "SELECT COUNT(*), MAX(scraped_at) FROM influencer_metrics;"

# Check scores in DB
psql foresight -c "SELECT twitter_handle, total_points FROM influencers ORDER BY total_points DESC LIMIT 10;"

# Check active contests
psql foresight -c "SELECT id, name, status, start_date, end_date FROM fantasy_contests WHERE status = 'active';"
```

### Fix Commands
```bash
# Start backend
cd backend && pnpm dev

# Start frontend
cd frontend && pnpm dev

# Test Twitter API
cd backend && npx tsx src/scripts/testTwitterApiIo.ts

# Trigger scoring
curl -X POST http://localhost:3001/api/admin/trigger-scoring

# Check cron status
curl http://localhost:3001/api/admin/cron-status
```

### Database Commands
```bash
# Connect to DB
psql foresight

# Check influencer data
SELECT id, twitter_handle, tier, base_price, follower_count FROM influencers LIMIT 10;

# Check recent metrics
SELECT influencer_id, followers, scraped_at FROM influencer_metrics ORDER BY scraped_at DESC LIMIT 10;

# Check weekly snapshots
SELECT * FROM weekly_snapshots ORDER BY captured_at DESC LIMIT 10;

# Check user teams
SELECT u.wallet_address, t.team_name, t.current_score FROM user_teams t JOIN users u ON t.user_id = u.id;
```

---

## ✅ FINAL LAUNCH CHECKLIST

Before contacting influencers, verify ALL of these:

### Absolute Minimum (Cannot Demo Without)
- [ ] TwitterAPI.io configured and working
- [ ] Scoring produces non-zero points
- [ ] At least 1 active contest exists
- [ ] Draft → Lock → Score flow works end-to-end
- [ ] Leaderboard shows real data

### Demo Ready
- [ ] 2-min Loom video recorded
- [ ] Product stable (no crashes)
- [ ] Mobile basically works
- [ ] At least YOU have played through the whole flow

### Outreach Ready
- [ ] Tracking spreadsheet set up
- [ ] DM templates ready
- [ ] Partnership tiers defined
- [ ] Referral links can be generated

---

## 📊 PROGRESS TRACKER

Use this to track daily progress:

### Week of [DATE]

| Date | Task | Status | Notes |
|------|------|--------|-------|
| Day 1 | Configure TwitterAPI.io | ⬜ | |
| Day 1 | Test data fetching | ⬜ | |
| Day 1 | Run full influencer fetch | ⬜ | |
| Day 2 | Verify scoring works | ⬜ | |
| Day 2 | Test complete user flow | ⬜ | |
| Day 3 | Record demo video | ⬜ | |
| Day 3 | Start influencer outreach | ⬜ | |

---

**Document Owner**: [Your Name]
**Next Review**: [Date]
**Status**: Work in Progress

---

*This document is the source of truth for launch readiness. Update as you complete tasks.*
