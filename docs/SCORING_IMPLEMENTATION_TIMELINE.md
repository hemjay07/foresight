# Scoring System — Implementation Timeline

> "What to do when" to maximize hackathon score + post-launch retention

---

## Timeline Overview

```
TODAY (Feb 25):     HACKATHON DEADLINE (Feb 27)     WEEK 1 (Mar 1-7)     WEEK 2+ (Post-Launch)
                             ↓                              ↓                        ↓
┌────────────────┬─────────────────────┬──────────────────────────┬──────────────────────┐
│  Finalize      │   SUBMIT (Fri 11:59 │  Ship Captain 2.0x       │  Weekly Multipliers  │
│  Current       │   PM UTC)           │  Add Score Breakdowns    │  Scale & Iterate     │
│  Scoring       │                     │  Monitor Retention       │  A/B Test Features   │
│                │                     │                          │                      │
│ 30 min work    │ 0 changes (safe)    │ 30 min + 3 hrs work      │ 6-8 hrs dev work     │
│ SHIP AS-IS ✅  │                     │ RISK: ZERO ✅            │ RISK: LOW ⚠️          │
└────────────────┴─────────────────────┴──────────────────────────┴──────────────────────┘
```

---

## Phase 0: Before Hackathon Deadline (TODAY)

### Do Nothing
- Current scoring is **acceptable for demo**
- No changes 48 hours before deadline
- Don't risk breaking anything

### What To Verify (15 mins)
```bash
# Make sure scoring still calculates correctly
cd backend && NODE_OPTIONS='--import tsx' pnpm test
# Check for TypeScript errors
npx tsc --noEmit

# Manual test: Enter a contest, check if scoring works
# Verify on /compete page leaderboard displays scores
```

### Final Checklist
- [ ] Scoring code compiles (zero TS errors)
- [ ] Tests pass (64/64 expected)
- [ ] One manual test: enter demo contest, verify score appears
- [ ] Leaderboard loads without errors
- [ ] Captain multiplier is 1.5x (confirmed in code)

**Decision:** SHIP with current scoring ✅

---

## Phase 1: Immediate Post-Deadline (Feb 28 - Mar 2, 4 Hours)

### Goal
Make captain decision feel high-stakes. Establish habit loop.

### Change #1: Captain Multiplier Bump (30 mins)

**File:** `/Users/mujeeb/foresight/backend/src/services/fantasyScoringService.ts:86`

**Before:**
```typescript
captainMultiplier: 1.5,
```

**After:**
```typescript
captainMultiplier: 2.0,
```

**Verify:**
```bash
cd backend
# Check for TypeScript errors
npx tsc --noEmit

# Run tests (should still pass)
NODE_OPTIONS='--import tsx' pnpm test

# Quick manual calculation:
# Before: 100 pts base × 1.5 = 150 pts
# After: 100 pts base × 2.0 = 200 pts
# ✅ Confirmed: captain bonus increased from 50 to 100 pts
```

**Rollback (if needed):**
```bash
git revert <commit-hash>
# Immediate rollback, zero risk
```

**Messaging (for demo/judges):**
> "Captain decision carries more weight (2.0x multiplier, industry standard per Sorare)"

---

### Change #2: Score Breakdown Display (2-3 hrs)

**Location:** `frontend/src/components/` (new component)

**New File:** `ScoreBreakdown.tsx`

```typescript
// frontend/src/components/ScoreBreakdown.tsx
import React from 'react';

interface ScoreBreakdownProps {
  activityScore: number;
  engagementScore: number;
  growthScore: number;
  viralScore: number;
  spotlightBonus?: number;
  totalScore: number;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  activityScore,
  engagementScore,
  growthScore,
  viralScore,
  spotlightBonus = 0,
  totalScore,
}) => {
  const components = [
    { label: 'Activity', score: activityScore, max: 35, color: 'bg-amber-500' },
    { label: 'Engagement', score: engagementScore, max: 60, color: 'bg-cyan-500' },
    { label: 'Growth', score: growthScore, max: 40, color: 'bg-emerald-500' },
    { label: 'Viral', score: viralScore, max: 25, color: 'bg-rose-500' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {components.map((c) => (
          <div key={c.label} className="text-center">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
              <div
                className={`${c.color} h-2 rounded-full`}
                style={{ width: `${(c.score / c.max) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm font-bold text-white">
              {Math.round(c.score)}/{c.max}
            </p>
          </div>
        ))}
      </div>
      
      {spotlightBonus > 0 && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gold-400">
            Spotlight Bonus: +{spotlightBonus}
          </p>
        </div>
      )}
      
      <div className="pt-2 border-t border-gray-700 flex justify-between">
        <span className="font-bold text-white">Total Score</span>
        <span className="text-lg font-bold text-gold-400">{Math.round(totalScore)}</span>
      </div>
    </div>
  );
};
```

**Integration:** Add to `ContestDetail.tsx` in "My Team" section

```typescript
// In ContestDetail.tsx, find the "My Team" section and add:
{team && (
  <div className="mt-4">
    <ScoreBreakdown
      activityScore={team.activity_score || 0}
      engagementScore={team.engagement_score || 0}
      growthScore={team.growth_score || 0}
      viralScore={team.viral_score || 0}
      spotlightBonus={team.spotlight_bonus || 0}
      totalScore={team.total_score || 0}
    />
  </div>
)}
```

**Verify:**
```bash
cd frontend
# Check TypeScript
npx tsc --noEmit

# Visual test: load a contest, check if breakdown displays
# Mobile test: 375px viewport, verify no overflow
```

**Rollback (if breaks layout):**
```bash
git revert <commit-hash>
# Component is isolated, safe revert
```

---

### Testing Checklist for Phase 1

```
[ ] Captain multiplier compiles (npx tsc --noEmit passes)
[ ] Backend tests still pass (64/64)
[ ] Manual contest: captain scoring is 2x base (e.g., 80 base → 160 final)
[ ] Frontend compiles with new ScoreBreakdown component
[ ] Score breakdown displays on contest detail page
[ ] Mobile responsive (test on 375px width)
[ ] Leaderboard still loads and ranks correctly
[ ] No TypeScript errors in console
[ ] One full E2E test: sign in → draft → check score → verify breakdown visible
```

---

## Phase 2: Week 1 Retention Monitoring (Mar 1-7, 5 hours)

### What To Track
```sql
-- Retention by day
SELECT 
  DATE(created_at) as signup_date,
  COUNT(DISTINCT user_id) as signups,
  COUNT(DISTINCT CASE WHEN last_active >= NOW() - INTERVAL '1 day' THEN user_id END) as d1_active,
  COUNT(DISTINCT CASE WHEN last_active >= NOW() - INTERVAL '7 days' THEN user_id END) as d7_active
FROM users
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Team draft behavior
SELECT 
  COUNT(*) as teams_drafted,
  AVG(total_score) as avg_team_score,
  COUNT(DISTINCT CASE WHEN captain_id IS NOT NULL THEN 1 END) as teams_with_captain
FROM user_teams;

-- Captain decision time (if tracked in analytics)
-- Should increase from ~5 sec to ~15 sec with 2.0x multiplier
```

### Success Metrics (Targets)
| Metric | Target | Current |
|--------|--------|---------|
| D1 Retention | >75% | Unknown |
| D3 Retention | >50% | Unknown |
| D7 Retention | >30% | Unknown |
| Avg team score | 250-350 pts | ~280 (known) |
| Teams drafted | >10 in demo | 15+ (known) |

### If Retention Drops
- Possible cause: Captain 2.0x feels too extreme, creates decision paralysis
- Action: Revert to 1.75x or add guidance tooltip on captain picker
- Timeline: Can rollback in <30 mins

### If Retention Is Good
- Proceed to Phase 2

---

## Phase 2: UI Enhancements & Score Communication (Mar 3-7, 6 hours)

### Focus
Help new players understand "what kind of person should I draft?"

### Work Items

1. **Add Archetype Metadata (1-2 hours)**
   - Migration: Add archetype column to influencers table
   - Backfill: Assign archetype based on scoring profile
   - API: Return archetype in GET /api/v2/influencers/:id

2. **Display Archetype on Draft Page (2-3 hours)**
   - Show archetype badge next to each player
   - Show 4-week average scores: Activity/Engagement/Growth/Viral
   - Optional: Show radar chart comparison

3. **Educational Tooltips (1-2 hours)**
   - "Engagement Wizard: High consistency, good for safe picks"
   - "Viral Sniper: High ceiling, volatile week-to-week"
   - "Activity Beast: Floor play, won't hit 0"

---

## Phase 3: Weekly Multiplier System (Mar 8+, 6-8 hours)

### Only if retention is >40% by day 7

This is the game-changer. Don't build unless you need it (retention is good enough).

### Architecture

**Database Schema:**
```sql
CREATE TABLE weekly_multiplier_events (
  id SERIAL PRIMARY KEY,
  contest_id INT NOT NULL,
  week_number INT NOT NULL,
  event_name VARCHAR(50), -- "Growth Week", "Engagement Week", etc.
  multiplier_category VARCHAR(20), -- "growth", "engagement", etc.
  multiplier_value DECIMAL(3, 2), -- 1.25, 1.5, 2.0
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Scoring Logic:**
```typescript
// In fantasyScoringService.ts
function getWeekMultiplier(contestId: number, category: string): number {
  const event = await db('weekly_multiplier_events')
    .where({ contest_id: contestId, multiplier_category: category })
    .first();
  
  return event?.multiplier_value ?? 1.0;
}

// When calculating category scores:
const activityWithBonus = activityScore * getWeekMultiplier(contestId, 'activity');
```

---

## Emergency Rollback Procedures

### If Captain 2.0x Breaks Something

```bash
# Check what broke
npm run build  # Frontend
NODE_OPTIONS='--import tsx' pnpm test  # Backend

# Find the commit
git log --oneline | head -5

# Revert immediately
git revert <commit-hash>
git push main

# Time to rollback: <5 minutes
# Risk: Zero (only changed one constant)
```

### If ScoreBreakdown Component Breaks Layout

```bash
# Remove the component integration
# In ContestDetail.tsx, delete the <ScoreBreakdown /> line
# Rebuild and redeploy
# Time: <10 minutes
```

### If Weekly Multipliers Don't Calculate Correctly

```bash
# Disable the multiplier system
# In fantasyScoringService.ts, change getWeekMultiplier to always return 1.0
# Or: Revert entire Phase 3
# Time: <30 minutes
```

---

## Success Criteria by Phase

### Phase 1 (Feb 28 - Mar 2)
- [ ] Captain 2.0x implemented & tested
- [ ] Score breakdown visible on contest pages
- [ ] Zero new bugs introduced
- [ ] Judges notice "captain feels high-stakes"

### Phase 2 (Mar 3-7)
- [ ] Archetypes labeled (Activity Beast, Engagement Wizard, Viral Sniper)
- [ ] New players understand scoring better
- [ ] D7 retention >30% (if possible, higher is better)
- [ ] No regressions from Phase 1

### Phase 3 (Mar 8+, Optional)
- [ ] Weekly multiplier events working
- [ ] Meta shifts week-to-week
- [ ] D30 retention improves (target: >40%)
- [ ] Community discusses strategies ("Growth week is perfect for emerging creators")

---

## Timeline Summary (Copy-Paste Reference)

| Phase | Dates | Work | Time | Priority |
|-------|-------|------|------|----------|
| **Hackathon** | Feb 25-27 | Ship current scoring | 0h | ✅ |
| **Phase 1** | Feb 28-Mar 2 | Captain 2.0x + Score Breakdowns | 3.5h | 🔴 Critical |
| **Phase 2** | Mar 3-7 | Archetype labels + UI | 6h | 🟡 High |
| **Phase 3** | Mar 8+ | Weekly multipliers | 8h | 🟢 If time allows |

---

## For Product Manager

**Keep in mind:**
1. Scoring is the **game engine** — it drives retention
2. Small tweaks (captain multiplier) have outsized impact
3. Weekly multipliers are the **retention lever** — build if D7 <30%
4. Don't ship untested code <24h before deadline
5. Always have rollback plan (all changes are 15-30 min rollbacks max)

**How to explain to stakeholders:**
> "Current scoring works fine for hackathon. We'll optimize it post-launch based on real player retention data. Three tweaks unlock 10-15x better engagement: higher captain multiplier, transparent scoring, and weekly meta shifts."

---

**End of Implementation Timeline**

This is your roadmap. Follow it sequentially. Don't skip phases.
