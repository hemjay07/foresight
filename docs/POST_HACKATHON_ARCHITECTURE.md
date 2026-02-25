# Foresight: Post-Hackathon Architecture & Decision Record

> **Document Status:** Comprehensive Decision Record
> **Last Updated:** February 25, 2026
> **Scope:** All decisions from 2-round war room brainstorm (ProductLead, BackendArch, TapestryLead, GameDesigner)
> **Audience:** Post-hackathon team, new engineers, future architects

---

## Executive Summary

Foresight is a **CT fantasy sports game** where users draft 5 Twitter influencers per week, earn points from their engagement, and compete for SOL prizes. This document captures all architectural decisions from the hackathon → post-hackathon transition, including what was shipped, what's documented for Phase 2, and the rationale behind each choice.

**Key Insight:** The system has two critical phases:
1. **Entry Phase (Editable):** Users draft and update teams freely
2. **Lock Phase (Sealed):** Contest freezes, entries immutable on Solana, scoring begins

This document ensures new engineers understand both what exists and why it was designed that way.

---

## Part 1: The Two Progression Systems

Foresight uses **two independent progression systems** that work together:

### System 1: Foresight Score (FS) Tiers
- **Purpose:** Competitive ranking system (how good you are at drafting)
- **Input:** Weekly contest results (points earned)
- **Calculation:** `foresightScore = (pointsEarned * tierMultiplier * earlyAdopterBonus) / scale`
- **Output:** FS Tiers (Bronze, Silver, Gold, Platinum, Diamond) displayed on leaderboard
- **Multipliers:** Bronze (1.0x) → Diamond (1.2x) — reward consistent top performers
- **Early Adopter Bonus:** 1.1x-1.5x for accounts created in first month (incentivizes early signup)
- **Visibility:** Public on leaderboard, used for seeding future contests
- **Business Model:** Enables "Season Pass" premium tier (unlock at Gold+)

**Key Files:**
- `backend/src/services/foresightScoreService.ts` — Calculates FS multipliers
- `backend/src/api/v2.ts` — `/api/v2/fs/me`, `/api/v2/fs/leaderboard` endpoints
- Database: `foresight_scores` table (userId, contestId, pointsEarned, multiplier, totalScore)

### System 2: XP Levels (Experience)
- **Purpose:** Account progression system (how engaged you are with the game)
- **Input:** Quests (enter contest, draft team, comment, share, etc.)
- **Calculation:** XP accumulates → levels unlock features
- **Output:** XP Levels (NOVICE, APPRENTICE, EXPERT, VETERAN, LEGENDARY)
- **Level-Gated Feature:** Transfers per week
  - NOVICE: 1 free transfer/week
  - APPRENTICE: 2 free transfers/week
  - EXPERT: 3 free transfers/week
  - VETERAN: 4 free transfers/week
  - LEGENDARY: 5 free transfers/week
- **Philosophy:** Like FPL (Fantasy Premier League) — transfers are a weekly resource, not unlimited
- **Visibility:** Personal on profile + badge next to leaderboard name
- **Prevents:** Pay-to-win (more transfers only from engagement, not money)

**Key Files:**
- `backend/src/services/questService.ts` — Quest completion → XP award
- `backend/src/api/users.ts` — `GET /api/users/me` returns user.xp
- Database: `users.xp`, `users.xp_level`, `quests` table

**Relationship Example:**
```
User A: FS Tier = Silver, XP Level = APPRENTICE
→ Earned 2,000 FS from contests (middle of pack) + completed 15 quests
→ Can use 2 free transfers this week, ineligible for Season Pass yet

User B: FS Tier = Diamond, XP Level = VETERAN
→ Earned 5,000 FS from contests (top performer) + completed 80 quests
→ Can use 4 free transfers this week, eligible for Season Pass
```

**Critical Design Decision:** These systems are **intentionally separate**.
- FS Tier = skill signal (helps judges evaluate balance + fairness)
- XP Level = engagement signal (helps us track retention + prevent churn)

---

## Part 2: Transfer Economy

### The Transfer System (FPL-Inspired)

**Problem Solved:** Unlimited edits encourage second-guessing and reduce decision weight. Weekly transfer limits create tension (is this swap worth my only transfer?).

**Design:**
- Users get a **fixed number of free transfers per week** based on XP level
- Transfers reset every Sunday (contest cycle)
- Each transfer replaces one influencer on the team
- After using free transfers, paid transfers could be offered (post-hackathon premium feature)

**Why This Matters:**
1. **Increases decision weight** — "Can I really afford to swap this player?" creates cognitive load
2. **Mimics real fantasy sports** — DraftKings, FanDuel, FPL all use transfer limits
3. **Levels the playing field** — Veterans get more transfers (4) than Novices (1), but both feel this is fair
4. **Retention lever** — Transfers feel like "currency" users want to spend wisely

### Implementation Specification

**Database:**
```sql
CREATE TABLE team_transfers (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  contest_id INT NOT NULL REFERENCES prized_contests(id),
  from_influencer_id INT NOT NULL REFERENCES influencers(id),
  to_influencer_id INT NOT NULL REFERENCES influencers(id),
  transfer_type VARCHAR(50) NOT NULL, -- 'FREE' or 'PAID'
  created_at TIMESTAMP DEFAULT NOW(),

  -- For weekly reset tracking
  week_number INT NOT NULL,
  year INT NOT NULL,

  UNIQUE(user_id, contest_id, week_number, year) -- One team per contest per week
);

ALTER TABLE free_league_entries
  ADD COLUMN transfer_count INT DEFAULT 0,
  ADD COLUMN update_count INT DEFAULT 0,
  ADD COLUMN locked_team_ids JSONB, -- Snapshot of team at lock time
  ADD COLUMN locked_at TIMESTAMP,
  ADD COLUMN tapestry_team_id VARCHAR(255);
```

**Enforcement in `update-free-team` Endpoint:**
```typescript
// backend/src/api/prizedContestsV2.ts

router.put('/:contestId/entries/:entryId/team', authMiddleware, async (req, res) => {
  try {
    const { contestId, entryId } = req.params;
    const userId = req.user.id;
    const { newTeam } = req.body;

    // 1. Get user's XP level
    const user = await db('users').where('id', userId).first();
    const xpLevel = calculateXpLevel(user.xp); // Returns { level, maxTransfersPerWeek }
    const maxTransfers = xpLevel.maxTransfersPerWeek;

    // 2. Check transfer limit for current week
    const { week, year } = getCurrentWeekYear();
    const transfersUsedThisWeek = await db('team_transfers')
      .where({
        user_id: userId,
        contest_id: contestId,
        week_number: week,
        year: year,
        is_free: true // Only count free transfers against quota
      })
      .count('id as count')
      .first();

    if ((transfersUsedThisWeek.count || 0) >= maxTransfers) {
      return res.status(429).json({
        success: false,
        error: `Transfer limit reached (${maxTransfers} per week for ${xpLevel.level})`,
        remaining_transfers: 0
      });
    }

    // 3. Wrap in transaction to prevent race condition
    const result = await db.transaction(async (tx) => {
      // Lock contest row to prevent concurrent edits
      const contest = await tx('prized_contests')
        .where('id', contestId)
        .forUpdate()
        .first();

      // Verify contest is still open
      if (contest.status !== 'open') {
        throw new Error('Contest is locked or finalized');
      }
      if (new Date(contest.lock_time) <= new Date()) {
        throw new Error('Contest lock time has passed');
      }

      // Get current team
      const entry = await tx('free_league_entries')
        .where('id', entryId)
        .first();

      // Calculate which influencers were replaced
      const currentTeam = JSON.parse(entry.team_ids);
      const replacedInfluencers = currentTeam.filter(id => !newTeam.includes(id));

      // Update team
      await tx('free_league_entries')
        .where('id', entryId)
        .update({
          team_ids: JSON.stringify(newTeam),
          update_count: entry.update_count + 1,
          updated_at: new Date()
        });

      // Log the transfer
      for (const replacedId of replacedInfluencers) {
        const addedId = newTeam.find(id => !currentTeam.includes(id));
        await tx('team_transfers').insert({
          user_id: userId,
          contest_id: contestId,
          from_influencer_id: replacedId,
          to_influencer_id: addedId,
          transfer_type: 'FREE',
          week_number: week,
          year: year,
          created_at: new Date()
        });
      }

      // Call Tapestry to update team (only if NOT locked yet)
      // See Section 4: Tapestry Integration for details
      if (contest.status === 'open') {
        const tapestryTeamId = entry.tapestry_team_id;
        if (tapestryTeamId) {
          const { Tapestry } = require('socialfi');
          const tapestry = new Tapestry(process.env.TAPESTRY_API_KEY);

          // Update existing content (mutable before lock)
          await tapestry.contents.update(tapestryTeamId, {
            content: formatTeamForTapestry(newTeam),
            metadata: { updateCount: entry.update_count + 1 }
          });
        }
      }

      return { success: true, remainingTransfers: maxTransfers - (transfersUsedThisWeek.count || 0) - 1 };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Helper: Calculate max transfers based on XP level
function calculateXpLevel(totalXp) {
  const levelThresholds = {
    NOVICE: { min: 0, max: 100, maxTransfers: 1 },
    APPRENTICE: { min: 100, max: 250, maxTransfers: 2 },
    EXPERT: { min: 250, max: 500, maxTransfers: 3 },
    VETERAN: { min: 500, max: 1000, maxTransfers: 4 },
    LEGENDARY: { min: 1000, max: Infinity, maxTransfers: 5 }
  };

  for (const [level, config] of Object.entries(levelThresholds)) {
    if (totalXp >= config.min && totalXp < config.max) {
      return { level, maxTransfersPerWeek: config.maxTransfers };
    }
  }
  return { level: 'LEGENDARY', maxTransfersPerWeek: 5 };
}
```

**Frontend Display:**
```typescript
// frontend/src/pages/Draft.tsx - show transfer count

function DraftPage() {
  const user = useAuth();
  const xpLevel = calculateXpLevel(user.xp);
  const [transfersRemaining, setTransfersRemaining] = useState(xpLevel.maxTransfersPerWeek);

  const handleTeamUpdate = async (newTeam) => {
    try {
      const response = await api.put(`/prized-contests/${contestId}/entries/${entryId}/team`, {
        newTeam
      });

      if (response.success) {
        setTransfersRemaining(response.data.remainingTransfers);
        showToast(`Transfer made! ${response.data.remainingTransfers} remaining this week`, 'success');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div>
      <TransferCounter
        remaining={transfersRemaining}
        max={xpLevel.maxTransfersPerWeek}
        level={xpLevel.level}
      />
      <Formation team={team} onUpdate={handleTeamUpdate} />
    </div>
  );
}
```

---

## Part 3: Tapestry Integration Architecture

### The Three-Phase Model

Tapestry Protocol stores user teams and scores immutably on Solana. The design uses **three distinct phases** to manage mutability:

```
ENTRY PHASE          LOCK PHASE          SCORING PHASE
(Editable)           (Sealed)            (Updates)
─────────────────────────────────────────────────────────

User drafts team     Contest lock time   Scoring cron runs
↓                    reached (Sat 20:00) 4x daily
                     ↓                   ↓
DB updates           Publish to          Update content
Tapestry SILENT      Tapestry            via contentsUpdate()
                     Lock snapshot       (mutable, OK)
                     (immutable)

Content ID:          Content ID:         Content ID:
foresight-team-      foresight-team-     foresight-score-
{userId}-{contestId} {userId}-{contestId}-locked

Tapestry            Tapestry             Tapestry
(no write)          (first & only write) (mutable updates)
```

### Why This Model?

**Problem 1: Teams are mutable before lock**
- Users can swap influencers all week
- But we want proof on Tapestry for judges

**Solution:** Don't publish to Tapestry until lock time
- During entry phase: Teams live in DB only (mutable)
- At lock time: Snapshot is immutable on Tapestry
- After lock: Updates go to Tapestry via `contentsUpdate()` (mutable, expected for scores)

**Problem 2: Judges want verifiable data**
- "Can you prove this team was locked on Feb 22?"
- Need immutable record

**Solution:** Lock-time snapshot becomes immutable proof
- Content ID includes `-locked` suffix
- Published at contest.lock_time
- Users can click link to Tapestry explorer and verify

### Implementation Specification

**Database Columns (already migrated):**
```sql
ALTER TABLE free_league_entries
  ADD COLUMN tapestry_team_id VARCHAR(255),      -- Stores Tapestry contentId
  ADD COLUMN locked_team_ids JSONB,              -- Snapshot of team at lock
  ADD COLUMN locked_at TIMESTAMP;                -- When snapshot was taken

ALTER TABLE prized_contests
  ADD COLUMN locked_at TIMESTAMP;                -- When contest was locked
```

**Step 1: Entry Phase (User creates/updates team)**
```typescript
// backend/src/api/prizedContestsV2.ts - POST /create-entry

router.post('/:contestId/create-entry', authMiddleware, async (req, res) => {
  const { contestId } = req.params;
  const { teamIds, captainId } = req.body;

  // Store in DB only, Tapestry is silent
  const entry = await db('free_league_entries').insert({
    contest_id: contestId,
    user_id: req.user.id,
    team_ids: JSON.stringify(teamIds),
    captain_id: captainId,
    created_at: new Date(),
    tapestry_team_id: null  // Will be filled at lock time
  });

  res.json({ success: true, entryId: entry[0] });
});
```

**Step 2: Lock Phase (Cron publishes to Tapestry)**
```typescript
// backend/src/services/cronJobs.ts - runs every 5 minutes

async function contestLockingCron() {
  const now = new Date();

  // Find contests that just hit lock_time
  const contestsToLock = await db('prized_contests')
    .where('status', 'open')
    .whereRaw('lock_time <= ? AND locked_at IS NULL', [now])
    .limit(10);

  for (const contest of contestsToLock) {
    await db.transaction(async (tx) => {
      // Get all entries for this contest
      const entries = await tx('free_league_entries')
        .where('contest_id', contest.id)
        .whereNull('locked_at');

      // Publish each entry to Tapestry
      for (const entry of entries) {
        const teamIds = JSON.parse(entry.team_ids);
        const team = await tx('influencers')
          .whereIn('id', teamIds)
          .select('id', 'username', 'handle');

        // Create immutable content on Tapestry
        const contentId = `foresight-team-${entry.user_id}-${contest.id}-locked`;

        const tapestry = new Tapestry(process.env.TAPESTRY_API_KEY);
        const result = await tapestry.contents.create({
          contentId,
          content: {
            type: 'draft-team',
            team: team.map(t => ({ id: t.id, username: t.username })),
            captainId: entry.captain_id,
            contestId: contest.id,
            contestName: contest.name,
            lockedAt: new Date().toISOString(),
            lockedBlockNumber: await getLatestBlockNumber() // For immutability proof
          },
          metadata: {
            app: 'foresight',
            version: '1.0',
            immutable: true  // Signal to Tapestry
          }
        });

        // Store contentId back to entry
        await tx('free_league_entries')
          .where('id', entry.id)
          .update({
            tapestry_team_id: contentId,
            locked_team_ids: JSON.stringify(teamIds),
            locked_at: now
          });
      }

      // Mark contest as locked
      await tx('prized_contests')
        .where('id', contest.id)
        .update({
          status: 'scoring',
          locked_at: now
        });
    });
  }
}
```

**Step 3: Scoring Phase (Updates via contentsUpdate)**
```typescript
// backend/src/services/contestFinalizationService.ts

async function updateTeamScoreOnTapestry(entry, contest, score) {
  // Teams are now locked, but scores are mutable
  const contentId = entry.tapestry_team_id;

  if (!contentId) {
    console.warn(`Entry ${entry.id} has no Tapestry ID, skipping Tapestry update`);
    return;
  }

  const tapestry = new Tapestry(process.env.TAPESTRY_API_KEY);

  // Use contentsUpdate() because this is mutable (scores change 4x/day)
  const result = await tapestry.contents.update(contentId, {
    score: score.totalPoints,
    scoreBreakdown: {
      activity: score.activity,
      engagement: score.engagement,
      growth: score.growth,
      viral: score.viral
    },
    rank: score.rank,
    updatedAt: new Date().toISOString(),
    finalizedAt: contest.finalized_at || null
  });

  return result;
}
```

**Content Structure on Tapestry (for judges):**
```json
{
  "contentId": "foresight-team-12345-6-locked",
  "type": "draft-team",
  "content": {
    "type": "draft-team",
    "team": [
      { "id": 1, "username": "vitalik.eth" },
      { "id": 2, "username": "punk6529" },
      { "id": 3, "username": "0xPolygon" }
    ],
    "captainId": 1,
    "contestId": 6,
    "contestName": "Hackathon Demo League",
    "lockedAt": "2026-02-22T20:00:00Z",
    "lockedBlockNumber": 1234567,
    "score": 235,
    "scoreBreakdown": {
      "activity": 28,
      "engagement": 45,
      "growth": 31,
      "viral": 6
    }
  },
  "metadata": {
    "app": "foresight",
    "immutable": true
  }
}
```

### Why contentsUpdate() is Correct

The scoring system calls `contentsUpdate()` (mutable) because:
1. Scores change 4x daily as influencer metrics update
2. Scores are not finalized until contest end
3. Players expect real-time score changes (they check leaderboard multiple times)
4. `contentsUpdate()` is designed for this: "store data that changes frequently"

---

## Part 4: Contest Lifecycle & Cron Jobs

### Weekly Cadence

```
MONDAY 12:00 UTC     SATURDAY 20:00 UTC     SUNDAY 23:59 UTC
└─ Contest opens     └─ Contest locks        └─ Scoring finalized
   Draft window         No more updates         Prizes awarded
   Live 6 days          Entries immutable       New contest created
                        Tapestry publish       (18:00 UTC)
```

### Cron Jobs Required

#### Job 1: Contest Lock Cron (Runs every 5 minutes)
**What:** Publishes all entries to Tapestry when lock time is reached
**When:** 5-minute intervals throughout the week
**Trigger:** `contest.lock_time <= NOW AND contest.locked_at IS NULL`
**Action:** Snapshot all entries, publish to Tapestry, set locked_at
**File:** `backend/src/services/cronJobs.ts::contestLockingCron()`
**Status:** EXISTS but not in cron scheduler — needs `scheduleJob('*/5 * * * *', contestLockingCron)`

#### Job 2: Scoring Update Cron (Runs every 60 minutes)
**What:** Updates influencer metrics from Twitter, recalculates scores, publishes to Tapestry
**When:** Every 60 minutes (4x daily)
**Trigger:** Always runs (time-based)
**Action:** Fetch new tweets, update scores, call `contentsUpdate()` on Tapestry
**File:** `backend/src/services/cronJobs.ts::scoringUpdateCron()`
**Status:** EXISTS and hooked up

#### Job 3: Contest Finalization Cron (NEEDS BUILDING)
**What:** Finalizes prizes 7 days after contest ends
**When:** Daily at 23:59 UTC
**Trigger:** `contest.status = 'scoring' AND finalizedAt IS NULL AND NOW >= endTime + 7 days`
**Action:**
- Lock scores (no more updates)
- Award Foresight points
- Mark entries as claimable
- Update final Tapestry content
**File:** `backend/src/services/cronJobs.ts::contestFinalizationCron()` (NEW)
**Status:** NEEDS BUILDING

#### Job 4: Free League Auto-Creation Cron (NEEDS BUILDING)
**What:** Creates new FREE_LEAGUE contest for following week
**When:** Sunday 18:00 UTC
**Trigger:** Time-based, once per week
**Action:**
- Calculate next week's Monday 12:00 UTC
- Create prized_contests row
- Seed with all 100 influencers' current metrics
**File:** `backend/src/services/cronJobs.ts::autoCreateNextContestCron()` (NEW)
**Status:** NEEDS BUILDING

### Cron Scheduler Setup

```typescript
// backend/src/server.ts

import schedule from 'node-schedule';
import {
  contestLockingCron,
  scoringUpdateCron,
  contestFinalizationCron,
  autoCreateNextContestCron
} from './services/cronJobs';

// Hook up cron jobs
schedule.scheduleJob('*/5 * * * *', async () => {
  try {
    await contestLockingCron();
  } catch (error) {
    console.error('Contest locking cron failed:', error);
  }
});

schedule.scheduleJob('0 * * * *', async () => {
  try {
    await scoringUpdateCron();
  } catch (error) {
    console.error('Scoring update cron failed:', error);
  }
});

schedule.scheduleJob('59 23 * * *', async () => {
  try {
    await contestFinalizationCron();
  } catch (error) {
    console.error('Contest finalization cron failed:', error);
  }
});

schedule.scheduleJob('0 18 * * 0', async () => {
  try {
    await autoCreateNextContestCron();
  } catch (error) {
    console.error('Auto-create next contest cron failed:', error);
  }
});

app.listen(3001, () => console.log('Server running on :3001'));
```

---

## Part 5: Data Model Changes

### New Columns (Hackathon vs Post-Hackathon)

**Already Added (Hackathon):**
```sql
ALTER TABLE free_league_entries
  ADD COLUMN tapestry_team_id VARCHAR(255),
  ADD COLUMN locked_team_ids JSONB,
  ADD COLUMN locked_at TIMESTAMP;

ALTER TABLE prized_contests
  ADD COLUMN locked_at TIMESTAMP;
```

**Needed (Phase 1 Post-Hackathon):**
```sql
-- Contest finalization tracking
ALTER TABLE prized_contests
  ADD COLUMN finalized_at TIMESTAMP,
  ADD COLUMN final_ranks JSONB; -- Maps userId → rank

-- Update count tracking (for UX feedback)
ALTER TABLE free_league_entries
  ADD COLUMN update_count INT DEFAULT 0;

-- Transfer history (already exists as team_transfers table)
-- Confirm team_transfers table has all columns:
CREATE TABLE IF NOT EXISTS team_transfers (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  contest_id INT NOT NULL,
  from_influencer_id INT,
  to_influencer_id INT,
  transfer_type VARCHAR(50), -- 'FREE' or 'PAID'
  week_number INT,
  year INT,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (contest_id) REFERENCES prized_contests(id)
);

-- Indexes for performance
CREATE INDEX idx_team_transfers_user_week ON team_transfers(user_id, week_number, year);
CREATE INDEX idx_team_transfers_contest ON team_transfers(contest_id);
CREATE INDEX idx_free_league_entries_locked_at ON free_league_entries(locked_at);
CREATE INDEX idx_prized_contests_lock_time ON prized_contests(lock_time, status);
```

---

## Part 6: Hackathon vs Post-Hackathon Implementation Table

| Feature | Hackathon (Shipped) | Post-Hackathon (Phase 1) | Post-Hackathon (Phase 2+) |
|---------|-------------------|--------------------------|---------------------------|
| **Transfer Limit Enforcement** | ✅ Code spec in Part 2 | ⏳ 4 hours to implement | — |
| **Transfer UI on Draft** | ✅ Shows counter | ⏳ Visual improvements | ⏳ Animation on swap |
| **Tapestry Lock Publish** | ✅ Cron job spec | ⏳ Hook into scheduler | ⏳ Retry logic, alerts |
| **Tapestry Content Updates** | ✅ contentsUpdate() ready | ⏳ Wire into scoring | ⏳ Batch updates |
| **Contest Finalization Cron** | ❌ Not needed for demo | ⏳ 6 hours to build | ⏳ Prize claims |
| **Free League Auto-Creation** | ❌ Manual only | ⏳ 4 hours to build | ⏳ Test coverage |
| **Score Visibility Split** | ❌ Show full breakdown always | ⏳ Hide pre-lock (2h) | — |
| **Captain Swap Window** | ❌ Can't change captain | ⏳ 24h before lock (3h) | ⏳ UI + tests |
| **Locked Team Snapshot** | ✅ Column exists | ⏳ Populate at lock (2h) | — |
| **Race Condition Fix** | ⚠️ Partial (no transaction) | ⏳ Add forUpdate() (1h) | — |
| **Prize Finalization UI** | ✅ Modal spec done | ⏳ Hook into BE (3h) | ⏳ Claim flow |
| **Paid Transfers** | ❌ Feature out of scope | — | ⏳ 6 hours Phase 2+ |
| **Percentile Leaderboard** | ❌ Show raw rank | ⏳ Add "Top X%" display | ⏳ Hide under 500 users |

**Total Phase 1 Effort:** ~25-30 hours
**Critical Path:** Transfer enforcement (4h) + Finalization cron (6h) + Free league auto-creation (4h) = 14 hours

---

## Part 7: Known Risks & Mitigations

### Risk 1: Race Condition on Team Update (CRITICAL)
**Problem:** Multiple concurrent updates to the same entry could cause inconsistency
**Current:** No transaction wrapping, check and write are separate
**Impact:** User A's swap might partially overwrite User B's swap (low probability but catastrophic)
**Mitigation:** Already specified in Part 2 — use `db.transaction()` with `forUpdate()` lock

**Code Fix (1 hour):**
```typescript
const result = await db.transaction(async (tx) => {
  const entry = await tx('free_league_entries')
    .where('id', entryId)
    .forUpdate()  // ← This line prevents concurrent access
    .first();

  // Rest of update logic
});
```

### Risk 2: Score Visibility Before Lock (MEDIUM)
**Problem:** Showing detailed score breakdowns pre-lock lets savvy players copy leader picks
**Current:** Full breakdown always visible
**Impact:** Reduces decision-making variance, meta locks in faster
**Mitigation (Phase 1):** Hide score breakdown until contest lock
- Pre-lock: Show only `Total: 235 pts` (aggregate)
- Post-lock: Show `Activity: 28 | Engagement: 45 | Growth: 31 | Viral: 6`

### Risk 3: Tapestry API Failures (MEDIUM)
**Problem:** If Tapestry API fails during lock, entries don't get published
**Current:** No retry logic or fallback
**Impact:** Users can't prove teams on Solana, judges question validity
**Mitigation (Phase 1):**
- Add exponential backoff retry (3 attempts)
- Log failures to error_logs table
- Alert ops on 3 consecutive failures
- Manual republish endpoint for ops

### Risk 4: Pay-to-Win Perception (LOW)
**Problem:** If users perceive more transfers = better performance, premium feels unfair
**Current:** Transfers tied to XP (engagement), not money
**Impact:** Trust erosion, churn above 1K users
**Mitigation:**
- ✅ Already mitigated: XP only comes from quests (engagement), not purchases
- ⏳ Phase 2: Communicate this explicitly in docs + onboarding
- ⏳ Phase 2: Monitor retention by XP level (ensure no cliff)

### Risk 5: Stale Team Content After Update (MEDIUM)
**Problem:** User updates team pre-lock, but Tapestry content shows old team
**Current:** `storeTeam()` called async at entry time, never updated
**Impact:** Judges see outdated team, user confused
**Mitigation (Part 2, Section 3):**
- Update Tapestry via `contentsUpdate()` on every swap (pre-lock)
- Add `updateCount` to content metadata
- Show badge on UI: "Team updated 2 times (latest version on Solana)"

---

## Part 8: Success Metrics

### Phase 1 Success (4 weeks post-hackathon)

| Metric | Target | Definition |
|--------|--------|-----------|
| Transfer Usage Rate | >60% | % of users making >= 1 transfer per week |
| Avg Transfers/Week | >1.5 | Average across active users |
| Lock-time Reliability | 99.9% | Contests lock within 60s of lock_time |
| Tapestry Publish Success | 99.5% | Entries published without error |
| Score Update Cadence | 60±10 min | Average time between score updates |
| D7 Retention | >35% | Users active 7+ days after signup |
| Leaderboard Diversity | >70% | % of unique top-10 finishers across weeks |

### Phase 2 Success (8 weeks post-hackathon)

| Metric | Target | Definition |
|--------|--------|-----------|
| Captain Swap Usage | >40% | % of users swapping captain in final 24h |
| Paid Transfer Adoption | >10% | % of users purchasing extra transfers |
| Churn at 500+ users | <5% | Weekly churn rate with healthy percentile display |
| Community Growth | 2-3x | Players in contests week 2 vs week 1 |
| Tapestry Bounty Awarded | Yes | $2.5K prize for best Tapestry integration |

---

## Part 9: Implementation Checklist

### Phase 1 (Weeks 1-2 Post-Hackathon) — 25-30 hours

**Must Ship (Critical Path):**
- [ ] Transfer limit enforcement + UI (4 hours)
- [ ] Contest finalization cron (6 hours)
- [ ] Free league auto-creation cron (4 hours)
- [ ] Locked team snapshot population (2 hours)
- [ ] Tapestry lock-time publish hook (3 hours)
- [ ] Race condition fix (transaction + forUpdate) (1 hour)
- [ ] Prize claim flow (backend) (3 hours)

**Should Ship (High Value):**
- [ ] Score visibility split (hide pre-lock) (2 hours)
- [ ] Paid transfer scaffolding (API + DB) (2 hours)
- [ ] Error logging + alerts (2 hours)
- [ ] Retry logic for Tapestry (1.5 hours)

**Tests (10 hours):**
- Transfer enforcement tests (3 hours)
- Finalization cron tests (3 hours)
- Tapestry lock publish tests (2 hours)
- Race condition stress tests (2 hours)

### Phase 2 (Weeks 3-4) — 15-20 hours

- [ ] Captain swap window (3 hours)
- [ ] Percentile leaderboard display (2 hours)
- [ ] Paid transfers (premium) (6 hours)
- [ ] Email notifications (score updates, countdown) (3 hours)
- [ ] Tapestry visibility enhancements (2 hours)

---

## Part 10: Architecture Decision Rationale

### Why Separate XP and FS Tiers?

**Alternative Considered:** Single "rank" that measures both skill + engagement
**Why Rejected:** Conflates two signals judges need to see separately
- Skill (FS Tier) → "Is the game mechanically fair?"
- Engagement (XP Level) → "Are users retained?"

**Why Chosen:** Decoupled systems are independently testable and optimize for different goals

### Why Transfer Limits?

**Alternative Considered:** Unlimited edits, transfer penalty (reduce points)
**Why Rejected:** Less visible to users, doesn't solve "second-guessing" problem

**Why Chosen:** FPL proven model, creates weekly decision tension, educates users about scarcity

### Why Three Tapestry Phases?

**Alternative Considered:** Publish on entry, immutable forever
**Why Rejected:** Can't update scores, entries stale after swaps, bad judge experience

**Alternative 2:** Never publish, only Tapestry is for scores
**Why Rejected:** Can't prove teams existed, "where's the blockchain?"

**Why Chosen:** Maximizes immutability proof (lock snapshot) while allowing score updates (real-time)

---

## Appendix: File Structure & Key Services

```
backend/
├── src/
│   ├── api/
│   │   ├── prizedContestsV2.ts    ← Transfer enforcement
│   │   └── v2.ts                  ← FS Tier endpoints
│   ├── services/
│   │   ├── cronJobs.ts            ← Contest locking, scoring, finalization
│   │   ├── foresightScoreService.ts ← FS Tier calculation
│   │   ├── fantasyS coringService.ts ← Influencer score calculation
│   │   ├── tapestryService.ts     ← Tapestry API wrapper
│   │   ├── contestFinalizationService.ts ← Prize distribution (NEEDS BUILDING)
│   │   └── questService.ts        ← XP award
│   └── middleware/
│       └── auth.ts                ← Privy + Tapestry auth
├── migrations/
│   ├── 20260221000001_add_privy_tapestry_fields.ts ← Column adds
│   └── [future] 20260301000000_fix_contest_finalization.ts
└── tests/
    ├── transfer-enforcement.test.ts (NEW)
    ├── cron-jobs.test.ts (NEW)
    └── tapestry-integration.test.ts (NEW)

frontend/
├── src/
│   ├── pages/
│   │   ├── Draft.tsx              ← Transfer counter UI
│   │   ├── Compete.tsx            ← Leaderboard (XP badges)
│   │   └── ContestDetail.tsx      ← Prize claim modal
│   ├── components/
│   │   ├── TransferCounter.tsx    (NEW)
│   │   ├── PrizeClaimModal.tsx    (NEW)
│   │   └── TapestryBadge.tsx      ← "Saved on Solana"
│   └── hooks/
│       └── useTransfers.ts        (NEW)
└── tests/
    ├── draft-transfers.test.tsx (NEW)
    └── prize-claim.test.tsx (NEW)

docs/
├── POST_HACKATHON_ARCHITECTURE.md ← This file
├── PRODUCT_SPECIFICATION_FINAL.md
└── [future] TRANSFER_ECONOMY_DETAILED_SPEC.md
```

---

## Summary

This document captures all architectural decisions for Foresight's post-hackathon development. The key insight is the **three-phase Tapestry model**: Entry (editable, DB only) → Lock (sealed snapshot on Solana) → Scoring (mutable updates).

New engineers should:
1. Read **Part 1** (progression systems) for context
2. Read **Part 2** (transfer enforcement) for implementation spec
3. Read **Part 3** (Tapestry architecture) for the core design
4. Use **Part 6** (implementation table) to prioritize work
5. Use **Part 9** (checklist) to track progress

**Phase 1 Critical Path:** 14 hours (transfer enforcement + finalization cron + auto-creation cron)

For questions, see CLAUDE.md, PROGRESS.md, or open a discussion in the architecture doc comments.
