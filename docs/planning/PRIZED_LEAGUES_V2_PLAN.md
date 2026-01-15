# CT Draft Prized Leagues V2 - Master Plan

## Vision Statement
Build the definitive fantasy game for Crypto Twitter - where users compete by predicting which CT influencers will have the best week, with real ETH stakes and rewards.

**Core Value Proposition:** "Pick winners. Win ETH. Simple."

---

## Phase 1: Foundation (Current Sprint)

### 1.1 Game Modes to Implement

#### A. WEEKLY DRAFT (Primary Product)
**What:** Pick 5 CT influencers, compete over 7 days
**Why:** Familiar fantasy format, strategic depth, creates weekly habit

| Component | Specification | Success Criteria |
|-----------|---------------|------------------|
| Team Size | 5 influencers | User can select exactly 5 |
| Captain | 1 influencer gets 1.5x | Captain selection works, multiplier applied correctly |
| Budget | 150 points | Cannot exceed budget, UI shows remaining |
| Duration | Monday 00:00 UTC → Sunday 23:59 UTC | Contests auto-lock and auto-score |
| Tiers | Starter (0.002), Standard (0.01), Pro (0.05) | All three tiers available |

#### B. FREE LEAGUE (Onboarding Funnel)
**What:** Same as Weekly Draft but no entry fee
**Why:** Zero-barrier onboarding, teaches mechanics, drives conversion

| Component | Specification | Success Criteria |
|-----------|---------------|------------------|
| Entry Fee | 0 ETH | No blockchain transaction needed |
| Limit | 1 entry per wallet per week | Duplicate prevention works |
| Prize Pool | 0.05 ETH (platform-funded) | Winners receive ETH |
| Conversion | Show "what you would have won" | Upsell prompt after results |

#### C. DAILY FLASH (Engagement)
**What:** Pick 3 influencers, 24-hour contest
**Why:** Daily touchpoint, quick dopamine, lower stakes

| Component | Specification | Success Criteria |
|-----------|---------------|------------------|
| Team Size | 3 influencers | User can select exactly 3 |
| Captain | None (simpler format) | No captain selection shown |
| Duration | 24 hours (8am UTC → 8am UTC) | Auto-lock and score daily |
| Entry Fee | 0.001 ETH | Transaction completes |
| Scoring | % change in metrics (not absolute) | Delta scoring works |

---

### 1.2 Smart Contract Architecture

#### Contract: CTDraftV2.sol

```solidity
// Contest Types
enum ContestType {
    WEEKLY_STARTER,    // 0.002 ETH, 5 picks, 7 days
    WEEKLY_STANDARD,   // 0.01 ETH, 5 picks, 7 days
    WEEKLY_PRO,        // 0.05 ETH, 5 picks, 7 days
    DAILY_FLASH,       // 0.001 ETH, 3 picks, 24 hours
    FREE_LEAGUE        // 0 ETH, 5 picks, 7 days (off-chain entries)
}

// Contest Configuration
struct ContestConfig {
    ContestType contestType;
    uint256 entryFee;
    uint256 minPlayers;
    uint256 maxPlayers;
    uint8 teamSize;          // 3 or 5
    uint8 rakePercent;       // 8-12%
    uint256 lockTime;
    uint256 endTime;
    bool hasCaptain;
}
```

**Success Criteria for Contract:**
- [ ] All contest types can be created
- [ ] Entry fees collected correctly for each type
- [ ] Rake calculated correctly (8%, 10%, 12% based on type)
- [ ] Team size validated (3 for daily, 5 for weekly)
- [ ] Captain multiplier only applies when hasCaptain=true
- [ ] Prize distribution handles variable winner counts
- [ ] Refunds work if contest cancelled
- [ ] Gas efficient (< 200k gas for entry)

---

### 1.3 Prize Distribution Model

#### Distribution Tiers (% of players who win)

| Contest Size | Winners | Distribution |
|--------------|---------|--------------|
| 10-20 | Top 30% | 1st: 40%, 2nd: 25%, 3rd: 15%, 4th+: split 20% |
| 21-50 | Top 35% | 1st: 30%, 2nd: 20%, 3rd: 12%, 4-10th: 3%, rest: 0.5% |
| 51-100 | Top 40% | 1st: 25%, 2nd: 15%, 3rd: 10%, 4-10: 2.5%, 11-40: 0.75% |
| 100+ | Top 40% | Same as above, scales proportionally |

**Success Criteria:**
- [ ] Prize calculation matches specification exactly
- [ ] No rounding errors leave funds stuck
- [ ] Distribution verified with test cases for each size bracket
- [ ] Winners can claim prizes correctly

---

### 1.4 Database Schema

```sql
-- Contest Types Configuration (static reference)
CREATE TABLE contest_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,     -- 'WEEKLY_STARTER', 'DAILY_FLASH', etc.
    name VARCHAR(50) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(18,8) NOT NULL,
    team_size INT NOT NULL,               -- 3 or 5
    has_captain BOOLEAN DEFAULT true,
    duration_hours INT NOT NULL,          -- 168 for weekly, 24 for daily
    rake_percent DECIMAL(4,2) NOT NULL,
    min_players INT DEFAULT 2,
    max_players INT DEFAULT 0,            -- 0 = unlimited
    is_active BOOLEAN DEFAULT true
);

-- Contests (instances of contest types)
CREATE TABLE contests (
    id SERIAL PRIMARY KEY,
    contest_type_id INT REFERENCES contest_types(id),
    contract_contest_id INT,              -- On-chain ID (null for free leagues)
    name VARCHAR(100),
    lock_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    prize_pool DECIMAL(18,8) DEFAULT 0,
    player_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',    -- open, locked, scoring, finalized, cancelled
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Entries
CREATE TABLE entries (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id),
    user_id UUID REFERENCES users(id),
    wallet_address VARCHAR(42),
    team_ids INT[] NOT NULL,              -- Array of influencer IDs
    captain_id INT,                       -- Null for daily flash
    entry_fee_paid DECIMAL(18,8),
    score DECIMAL(10,2),
    rank INT,
    prize_won DECIMAL(18,8),
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contest_id, wallet_address)
);

-- Weekly Performance Snapshots (for scoring)
CREATE TABLE influencer_snapshots (
    id SERIAL PRIMARY KEY,
    influencer_id INT REFERENCES influencers(id),
    snapshot_time TIMESTAMP NOT NULL,
    followers INT,
    tweets_count INT,
    likes_received INT,
    retweets_received INT,
    replies_received INT,
    engagement_rate DECIMAL(8,4),
    UNIQUE(influencer_id, snapshot_time)
);
```

**Success Criteria:**
- [ ] Schema supports all contest types
- [ ] Free leagues don't require contract interaction
- [ ] Snapshots captured at contest start AND end
- [ ] Score calculation uses delta between snapshots
- [ ] Indexes on frequently queried columns

---

### 1.5 Scoring System V2

#### Weekly Scoring (Absolute Performance)
```
Base Score = (
    tweets_delta × 2 +
    likes_delta × 0.5 +
    retweets_delta × 1 +
    replies_delta × 0.3 +
    follower_growth_delta × 3 +
    viral_bonus
)

Viral Bonus:
- Tweet with >1000 likes: +50 pts
- Tweet with >500 RTs: +75 pts
- Tweet with >10000 likes: +200 pts

Captain Multiplier: 1.5x

Final Score = SUM(influencer_scores) + (captain_score × 0.5)
```

#### Daily Scoring (Delta/Growth)
```
Daily Score = (
    engagement_rate_change% × 100 +
    follower_growth% × 50 +
    activity_spike_bonus
)

Activity Spike: If tweets today > 3x average → +100 pts
```

**Success Criteria:**
- [ ] Scoring formula documented and consistent
- [ ] Test cases for edge cases (0 activity, negative growth)
- [ ] Captain multiplier applies correctly
- [ ] Daily vs Weekly scoring produces different rankings
- [ ] Scores reproducible (same inputs = same outputs)

---

### 1.6 API Endpoints

#### Contests
```
GET  /api/v2/contests                    - List all contests
GET  /api/v2/contests/:id                - Get contest details
GET  /api/v2/contests/:id/entries        - Get leaderboard
GET  /api/v2/contests/:id/my-entry       - Get user's entry
POST /api/v2/contests/:id/enter          - Enter contest (free)
POST /api/v2/contests/:id/verify-entry   - Verify on-chain entry
```

#### User
```
GET  /api/v2/me/entries                  - User's active entries
GET  /api/v2/me/history                  - Past contest results
GET  /api/v2/me/winnings                 - Claimable prizes
```

#### Admin
```
POST /api/v2/admin/contests              - Create contest
POST /api/v2/admin/contests/:id/lock     - Lock contest
POST /api/v2/admin/contests/:id/score    - Trigger scoring
POST /api/v2/admin/contests/:id/finalize - Finalize & enable claims
```

**Success Criteria:**
- [ ] All endpoints documented with request/response examples
- [ ] Authentication works (JWT for user routes)
- [ ] Rate limiting in place
- [ ] Error responses are consistent
- [ ] API responds < 200ms for read operations

---

### 1.7 Frontend Components

#### Pages
```
/draft              - Main draft page (pick influencers)
/contests           - Browse all contests
/contests/:id       - Single contest view + leaderboard
/my-entries         - User's active entries
/results            - Past results + claim prizes
```

#### Key Components
```
ContestCard         - Display contest info (entry fee, players, time)
ContestTabs         - Filter: Free | Daily | Weekly
TeamBuilder         - Select 5/3 influencers + captain
EntryModal          - Confirm entry + pay
LeaderboardTable    - Rankings with scores
ClaimPrizeButton    - Claim winnings
```

**Success Criteria:**
- [ ] Mobile responsive (primary use case)
- [ ] Page load < 2 seconds
- [ ] Entry flow completes in < 30 seconds
- [ ] Clear visual feedback for all actions
- [ ] Error states handled gracefully

---

## Phase 2: Quality Assurance

### 2.1 Test Cases

#### Smart Contract Tests
```
1. Contest Creation
   - Can create each contest type
   - Cannot create with invalid parameters
   - Events emitted correctly

2. Entry
   - Entry with correct fee succeeds
   - Entry with wrong fee fails
   - Cannot enter after lock time
   - Cannot enter twice
   - Team size validated

3. Scoring & Prizes
   - Finalization sets correct ranks
   - Prize amounts calculated correctly
   - Cannot claim before finalization
   - Can claim after finalization
   - Cannot double claim

4. Edge Cases
   - Contest with minimum players
   - Contest cancelled (refunds)
   - Tie scores handled
```

#### Backend Tests
```
1. API Endpoints
   - All CRUD operations work
   - Auth required where specified
   - Validation rejects bad input

2. Scoring Engine
   - Score calculation accurate
   - Handles missing data gracefully
   - Performance with 1000+ entries

3. Cron Jobs
   - Snapshots captured on schedule
   - Auto-lock triggers at correct time
   - Scoring runs without errors
```

#### Frontend Tests
```
1. User Flows
   - Complete entry flow (free)
   - Complete entry flow (paid)
   - View results and claim

2. Edge Cases
   - No wallet connected
   - Insufficient balance
   - Network errors
```

### 2.2 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Entry completion rate | >80% | Entries started vs completed |
| Page load time | <2s | Lighthouse |
| Contract gas cost | <200k | Foundry gas reports |
| API response time | <200ms | Server logs |
| Mobile usability | >90 | Lighthouse |
| Zero critical bugs | 0 | Bug tracker |

---

## Phase 3: Launch Checklist

### Pre-Launch
- [ ] Contract audited (at least self-audit + peer review)
- [ ] Contract deployed to mainnet
- [ ] Database migrations run on production
- [ ] Environment variables set
- [ ] Monitoring/alerts configured
- [ ] First contest created and tested

### Launch Day
- [ ] Free league contest live
- [ ] Starter tier contest live
- [ ] Social announcement ready
- [ ] Support channel monitored

### Post-Launch (Week 1)
- [ ] Monitor for errors
- [ ] Gather user feedback
- [ ] Track conversion (free → paid)
- [ ] Adjust parameters if needed

---

## Implementation Order

```
Week 1: Foundation
├── Day 1-2: Database schema + migrations
├── Day 3-4: Smart contract updates
├── Day 5-6: Backend API
└── Day 7: Integration testing

Week 2: Frontend + Polish
├── Day 1-3: Frontend components
├── Day 4-5: End-to-end testing
├── Day 6: Bug fixes
└── Day 7: Documentation

Week 3: Soft Launch
├── Day 1-2: Deploy to testnet
├── Day 3-4: Beta testing with friends
├── Day 5-6: Fix issues
└── Day 7: Deploy to mainnet
```

---

## Definition of Done

A feature is DONE when:

1. **Code Complete**
   - [ ] Implemented as specified
   - [ ] No TypeScript errors
   - [ ] No console errors/warnings

2. **Tested**
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual QA completed

3. **Documented**
   - [ ] Code comments where complex
   - [ ] API docs updated
   - [ ] User-facing help text

4. **Reviewed**
   - [ ] Self-review completed
   - [ ] Edge cases considered

5. **Deployed**
   - [ ] Works on testnet
   - [ ] Works on local dev

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Smart contract bug | Medium | Critical | Thorough testing, start small |
| Twitter API rate limits | High | Medium | Cache aggressively, batch requests |
| Low initial participation | High | Medium | Guaranteed prize pools, free tier |
| Score manipulation | Low | High | Multiple data sources, outlier detection |
| Gas price spikes | Medium | Low | Optimize contract, batch operations |

---

## Questions to Answer Before Building

1. **Influencer Selection:** Do we have enough influencers with good data?
2. **Twitter API:** Can we get reliable metrics? Cost?
3. **Legal:** Any gambling regulations to consider?
4. **Marketing:** How do we get first 100 users?
5. **Economics:** Can we sustain free tier prize pools?

---

## Appendix: Technical Decisions

### Why Solidity over other chains?
- Base L2 = low gas costs
- EVM ecosystem = familiar tools
- Existing wallet infrastructure

### Why PostgreSQL?
- Relational data fits well
- JSONB for flexible fields
- Proven at scale

### Why separate free league from contract?
- No gas for free entries = better UX
- Platform controls prize distribution
- Simplifies onboarding

---

*Document Version: 1.0*
*Last Updated: 2024-12-11*
*Author: CT Draft Team*
