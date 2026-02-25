# CT Intelligence Redesign — Quick Reference

> TL;DR for decision-makers and builders

---

## The Problem in 30 Seconds

Intel page is disconnected from drafting. Players see fake "+99 pts" labels, no weekly trends, and can't answer "Should I draft this person?"

---

## 6 Questions Answered

### Q1: Player Research Needs (Ranked)
1. **Who's hot RIGHT NOW?** (Discovery)
2. **Is my target worth the price THIS WEEK?** (Validation)
3. **Who's consistent?** (Safety rating)
4. **Who are rivals drafting?** (Social proof)
5. **Who's on a breakout run?** (High ceiling)

### Q2: Information Architecture
**Recommended: Keep 3-tab structure, enhance content**
- Feed: Show weekly scores instead of fake "+99"
- Profiles: Add archetype + consistency metric
- Rising Stars: Fix voting, add growth trajectory

*Future (post-launch): Collapse to single-page 4-section scroll (Your Picks → Trending → Archetypes → Rising Stars)*

### Q3: Five Analyst-Grade Metrics
1. **Weekly Score Contribution** — Actual game points (Activity + Engagement + Growth + Viral)
2. **Consistency Score** — Coefficient of variation (0-100%) = Safe floor prediction
3. **Peak Engagement** — Highest single-week engagement in last 4 weeks
4. **Engagement Momentum** — Week-over-week trend (↑ ↓ →)
5. **Content Archetype** — "Activity Beast", "Engagement Wizard", "Viral Sniper", "Rising Star", "Balanced"

**Data Status:** ✅ All computable from `weekly_snapshots` table. No new data collection needed.

### Q4: Categories vs. Chronology (Heuristic Solution)
**Primary sort:** Tier (S, A, B, C, Rising)
**Secondary:** Momentum (trending up/stable/down)
**Tags (no AI, pattern-based):**
- BTC Focus: Regex on last 10 tweets for "btc|bitcoin|eth|ethereum"
- DeFi Focus: "swap|liquidity|defi|uniswap|aave"
- Meme Focus: Interactions with @pumpdotfun, humor accounts
- Macro: "macro|economy|inflation"

**Why heuristics work:** CT culture is repetitive. Regex catches 90% of specialization.

### Q5: Making "+99 pts" Meaningful
**Current (wrong):** Capped at 99, doesn't match game formula

**New (honest):**
```
Est. Weekly Contribution: +2.4 pts
├─ Engagement: +1.5 pts (1/5 of weekly)
├─ Viral bonus: +0.5 pts (strong for account size)
└─ Assumes 8 tweets/week normal activity
```

**Why it works:**
- Elon's tweet: "+1.8 pts" (normal for mega-account)
- Micro-account's tweet: "+4.2 pts" (exceptional for them)
- Shows actual game formula (builds trust)

### Q6: Personalization (What's Feasible)
**Available APIs:**
- Your team picks
- Your watchlist
- Your follows
- Community picks

**3 High-Impact Cards (all feasible):**
1. **Your Team Card** — "This week +43 pts, Rank #2,847" [TOP IMPACT]
2. **Watchlist Trending** — "3 of your scouted are hot this week" [HIGH IMPACT]
3. **Rival Picks** — "8 drafters picked @Hsaka (12% of meta)" [MODERATE IMPACT]

---

## 3 Recommended Changes (Priority Order)

### Change #1: Real Weekly Score Breakdown (⭐ HIGHEST)
**Impact:** Players understand game mechanics, see B/C tier value
**Time:** 4-5 hours
**Where:** Feed tab, every influencer card
**What changes:** "+99 pts" → "87 pts breakdown (28 activity + 45 engagement + 12 growth + 2 viral)"
**Data:** ✅ Ready (weekly_snapshots table complete)
**Metric:** "Is consistency breakdown visible?" (target: 100%)

### Change #2: Personalization Cards (⭐ HIGH)
**Impact:** Closes research→draft gap; increases engagement
**Time:** 3-4 hours
**Where:** Top of Intel page (3 new cards)
**What:** Your team score + watchlist trending + rival picks
**Data:** ✅ Ready (APIs exist)
**Metric:** Click rate on "Your Team" card (target: 50%)

### Change #3: Single-Page Mobile IA (⭐ LOWER PRIORITY)
**Impact:** Better mobile UX, cleaner mental model
**Time:** 6-8 hours
**When:** Post-launch, next session
**Why wait:** Changes #1 & #2 deliver most value; current 3-tab structure works

---

## Implementation Checklist

### Backend (Phase 1: 2 hours)
- [ ] Add `/api/intel/influencer/:id/analytics` endpoint
  - Query `weekly_snapshots` for last 4 weeks
  - Compute: consistency%, peak engagement, momentum, archetype
  - Return: `{ weeklyScores: [], consistency: {}, momentum: {}, archetype: "" }`
- [ ] Test response with 5 real influencers
- [ ] Verify scores match game formula

### Frontend (Phase 2: 3 hours)
- [ ] Build `InfluencerWeeklyBreakdown.tsx` component
  - Stacked bar chart or table: Activity | Engagement | Growth | Viral
  - Show 4-week trend line
  - Display consistency badge + archetype
- [ ] Build `YourTeamCard.tsx` (current week score)
- [ ] Build `WatchlistTrendingCard.tsx` (scouted players on fire)
- [ ] Replace "+99 pts" labels in Viral Highlights section
- [ ] Test on mobile (375px width)

### Testing (Phase 3: 1 hour)
- [ ] Verify breakdowns match actual game scoring formula
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Visual audit: Does the redesign feel like a research tool?

### Optional Polish (Phase 4: 1 hour)
- [ ] Fix Rising Stars voting (currently 0/0)
- [ ] Add archetype icons to every influencer card
- [ ] Add consistency % badge

---

## Mobile Considerations

**Width:** Design for 375px first

**Changes:**
- Weekly breakdown: Vertical stack (don't try to fit all in row)
- Personalization cards: Full width, tap-friendly
- Tier tabs: Horizontal scroll (already done)
- Consistency badge: Include in card, not separate

**No hover-only interactions** — Must all work with tap

---

## Success Metrics (After Launch)

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Time on Intel page | 2-3x increase | Analytics |
| Scouting rate | 40% of new players | Watchlist API calls |
| "Found my pick on Intel before drafting" | 60% | Survey |
| Click-through on "Your Team" card | 50% | Event tracking |
| Confidence in draft (before/after) | +30% | Survey |

---

## Anti-Patterns (Don't Do These)

❌ Add more filters (already cramped on mobile)
❌ Show all 100 influencers at once (cognitive overload)
❌ Use AI/ML for recommendations (we lack historical data)
❌ Remove Profiles tab (some players like all-time view)
❌ Break scouting flow (must stay <3 taps from Intel → Watchlist)

---

## Data Availability Checklist

| Data | Table | Status |
|------|-------|--------|
| Weekly activity/engagement/growth/viral scores | `weekly_snapshots` | ✅ Complete |
| 4-week historical scores | `weekly_snapshots` | ✅ Complete |
| Community picks count | `fantasy_league_picks` | ✅ Complete |
| User's team picks | `fantasy_league_picks` + `league_teams` | ✅ Complete |
| User's watchlist | `watchlist` | ✅ Complete |
| User's follows | Tapestry Protocol | ✅ Complete |

**Result:** Zero new data collection needed. All metrics can be computed from existing tables.

---

## Decision Checkpoint

Before starting implementation, confirm:

1. ✅ **Scope:** Building Change #1 + #2 (not #3 yet)?
2. ✅ **Time:** Do we have 7-8 hours before next deadline?
3. ✅ **Design:** Is the breakdown display approved (stacked bar chart vs. table)?
4. ✅ **Priority:** Personalization cards are #2, not Rising Stars voting?

---

## File Locations (For Reference)

| Component | Location |
|-----------|----------|
| Intel page | `/frontend/src/pages/Intel.tsx` |
| Feed service | `/backend/src/services/ctFeedService.ts` |
| Scoring service | `/backend/src/services/fantasyScoringService.ts` |
| Weekly snapshots | `/backend/migrations/20251206000001_create_weekly_snapshots.ts` |
| Design principles | `/docs/design/DESIGN_PRINCIPLES.md` |

---

## Open Questions

1. Should we show "Consistency %" for every influencer, or just draft picks?
2. For "Rival Picks," include only current contest or all-time popularity?
3. Should archetype labels be visible on every card, or only in profile?
4. Do we want the breakdown as stacked bar chart or vertical table?
5. Post-launch: How quickly can we fix Rising Stars voting?

---

**Ready to build. Next session starts with backend `/api/intel/influencer/:id/analytics` endpoint.**
