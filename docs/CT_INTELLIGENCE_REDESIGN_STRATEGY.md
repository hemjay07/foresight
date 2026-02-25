# CT Intelligence Page Redesign Strategy
## From Research Afterthought to Draft Decision Engine

> **Document Purpose:** Strategic recommendation for redesigning the "CT Intelligence" page (/intel) to become the core research tool that drives draft decisions, not a forgotten tab.
>
> **Status:** Draft Strategy Document
> **Date:** February 25, 2026
> **Scope:** Information architecture, metric selection, personalization, UI patterns

---

## EXECUTIVE SUMMARY

The current Intel page is **disconnected from the draft experience**. Players browse tweets, see tier badges, and watch fake "+99 pts" labels, but there's no connection to "Should I draft this person?" or "How consistent are they?"

### Current Problems

1. **Chronological/Engagement Dominated Feed** — Elon Musk shows up 5x, C-tier accounts hidden
2. **Fake "+99 pts" Visual Label** — Misleading, capped, doesn't reflect actual game scoring
3. **Three Tabs Don't Map to Player Needs** — Feed/Profiles/Rising Stars are organizational, not decision-based
4. **No Personalization** — Same data for new users, veterans, and drafters mid-season
5. **No Context Bridge** — Intelligence gathered doesn't flow to draft interface
6. **Rising Stars Voting Broken** — Shows 0/0 for everyone, no signal

### Strategic Goal

**Transform Intel from "tweets we collected" into "decision support system for drafting."**

Players should be able to:
- Quickly assess **consistency** of draft targets (safe pick vs. volatile)
- Understand **peak performance** (when do they go viral?)
- Spot **emerging value** (underpriced high-performers)
- Compare **styles** (Activity Beast vs. Engagement Wizard)
- See **social proof** (who's popular with other drafters?)

---

## QUESTION 1: PLAYER RESEARCH NEEDS (Ranked by Importance)

### Rank 1: "Who's hot RIGHT NOW?" (Discovery)
**Importance:** Critical for both new and experienced users
- Feeds FOMO, urgency
- Changes week-to-week (viral moment, new focus area)
- Drives impulsive picks (which is fun in fantasy)
**Current solution:** Viral Highlights section (exists but dominated by Elon)
**Problem:** No filtering for tier; raw engagement favors mega-accounts
**Fix needed:** Filter by tier, normalize by follower count

---

### Rank 2: "Is my planned pick worth the price THIS WEEK?" (Validation)
**Importance:** Critical for experienced drafters; moderate for new users
- Player has a tier/archetype in mind, needs to validate they're "on"
- Dynamic — changes week-to-week based on recent performance
- Example: "I always draft @Hsaka (Engagement Wizard), is he worth 32 pts this week?"
**Current solution:** None (Profiles tab shows all-time stats only)
**Problem:** No weekly trend view; can't see recent form
**Fix needed:** Weekly performance card for each influencer

---

### Rank 3: "Who's consistent?" (Safety Pick)
**Importance:** Moderate for both segments
- Risk-averse drafters want "I know they'll score 50-80 pts this week"
- DraftKings equivalent: "Consistency rating" or "Floor vs. Ceiling"
- Reduces draft anxiety
**Current solution:** None
**Problem:** No consistency metrics available
**Fix needed:** Add historical variance (std dev) and "safe floor" metric

---

### Rank 4: "Who are my rivals drafting?" (Social Intel)
**Importance:** Moderate-to-low; mostly engagement/fun
- Community pick count is collected but hidden
- Creates competitive dynamic ("3 other drafters picked @Hsaka")
**Current solution:** "Community Picks" exists but not exposed prominently
**Problem:** Hidden in a comment variable, not surfaced in UI
**Fix needed:** Make it visible on leaderboard and Intel page

---

### Rank 5: "Who's on a breakout run?" (High Ceiling Pick)
**Importance:** Lower for new users; higher for experienced
- Emerging accounts, recent format changes, newfound audience
- Gamblers and sophisticated drafters love this
- Rising Stars tab exists but broken (voting shows 0/0)
**Current solution:** Rising Stars tab
**Problem:** No voting data; no trend visualization
**Fix needed:** Fix voting mechanic; show weekly growth trajectory

---

## QUESTION 2: INFORMATION ARCHITECTURE RECOMMENDATION

### ❌ Current IA: Feed | Profiles | Rising Stars
**Problems:**
- Organizational (how we store data), not user-centric
- Feed drives visibility to Elon, hides B/C tier
- Profiles are all-time stats, don't inform THIS WEEK's decisions
- Rising Stars are broken (voting doesn't work)

### ✅ Recommended IA: **"Draft Intel" Single-Page Architecture**

**Radical change: Collapse to ONE page with FOUR scrollable sections**

```
┌─────────────────────────────────────────┐
│    CT Intelligence — Draft Command      │
├─────────────────────────────────────────┤
│
│  🎯 YOUR PICKS & RIVALS (Personalized)
│  ├─ Your team (if active): +0 pts this week
│  ├─ 2 Scouted picks trending this week
│  └─ 3 players your rivals are drafting
│
│  🔥 TRENDING THIS WEEK (Tier-Filtered)
│  ├─ Tier tabs: All | S | A | B | C | Rising
│  ├─ [Card view: Each influencer with weekly perf]
│  └─ Performance breakdown: Activity, Engagement, Growth, Viral
│
│  📊 PERFORMANCE TIERS (Archetype-Based)
│  ├─ Activity Beasts: Daily tweet machines (10-35 pts/week)
│  ├─ Engagement Wizards: High-quality interactions (40-60 pts/week)
│  ├─ Viral Snipers: Occasional massive moments (varies, high ceiling)
│  └─ Stable Grinders: Consistent performers (60-90 pts/week)
│
│  ⭐ RISING STARS (Emerging Opportunities)
│  ├─ Week-over-week growth leaders
│  └─ Your follower count + predicted emergence curve
│
└─────────────────────────────────────────┘
```

### Why This IA Wins

1. **One mental model for users:** "All my research is here, scrolled vertically"
2. **Personalization is primary:** Your picks/rivals are always at top
3. **Performance-based grouping:** Players naturally group by playstyle (Activity Beast vs. Engagement Wizard)
4. **Tier filtering is built-in:** No more "show me S-tier" navigation, tabs stay visible
5. **On mobile:** All sections scroll, no tab confusion

### Implementation Notes

- **Desktop (md+):** Keep current 3-tab design but restructure CONTENT of each tab
- **Mobile (sm):** Collapse to single-page scroll, tabs become section headers
- **Tab structure (simplified):**
  - **Trending** = Main section with tier filter (replace current Feed tab)
  - **Archetypes** = New, replace Profiles (shows style + weekly breakdown)
  - **Rising Stars** = Fixed voting mechanism, keep mostly same

---

## QUESTION 3: ANALYST-GRADE METRICS (5 Must-Have Signals)

### The Problem with "+99 pts"

Current display: Capped at 99, computed from fake formula, doesn't match game scoring.

**Solution:** Display ACTUAL game-scoring contribution with breakdown.

### 5 Analyst Metrics We Should Compute & Display

#### 1. **Weekly Score Contribution (Actual Game Points)**
**What it is:** Real points this influencer earned toward their team's score, computed from actual game formula.
**Formula:** Activity (0-35) + Engagement (0-60) + Growth (0-40) + Viral (0-25) = 0-160 pts/week
**Why it matters:** Shows what they *actually* contributed, not engagement engagement
**Data source:** `weekly_snapshots` table already captures everything needed
**Display:**
```
┌─────────────────────────────────┐
│ Weekly Points: 87 pts           │
│ ├─ Activity (tweets): 28        │
│ ├─ Engagement (quality): 45     │
│ ├─ Growth (followers): 12       │
│ └─ Viral bonus: +2              │
└─────────────────────────────────┘
```

#### 2. **Consistency Score (Safety Rating)**
**What it is:** Coefficient of variation of scores over last 4 weeks (low = predictable, high = volatile)
**Formula:** `std_dev(4 week scores) / mean(4 week scores)` → scales to 0-100 "Consistency %"
- 80-100% = Stable grinder (safe)
- 60-80% = Variable performer
- 0-60% = Volatile, high ceiling/floor risk
**Why it matters:** DraftKings players obsess over "floor vs ceiling" — this quantifies it
**Data source:** `weekly_snapshots` + historical scores
**Display:**
```
Consistency: 78% ✅ (Safe pick)
Safe Floor: 65 pts   |████████░░| Ceiling: 95 pts
```

#### 3. **Peak Engagement (Viral Ceiling)**
**What it is:** Highest single-week engagement score in last 4 weeks
**Formula:** Max engagement from last 4 `weekly_snapshots.engagement_score`
**Why it matters:** "Best-case scenario for this player" — helps gamblers evaluate risk/reward
**Data source:** `weekly_snapshots`
**Display:**
```
Peak This Month: 58 pts (2 weeks ago)
└─ Driven by: Viral thread on AI safety
```

#### 4. **Engagement Velocity (Momentum)**
**What it is:** Week-over-week trend in engagement score (is it climbing, falling, stable?)
**Formula:** Last week engagement - week before = delta. Arrow: ↑ / → / ↓
**Why it matters:** Shows if account is gaining/losing relevance (real-time indicator of form)
**Data source:** `weekly_snapshots` (compare recent weeks)
**Display:**
```
Engagement Momentum: ↑ +8 pts (heating up)
Last 4 weeks: [42] → [44] → [48] → [56]
```

#### 5. **Content Archetype (Playstyle Category)**
**What it is:** Classification based on 4-week average: which scoring category (Activity/Engagement/Growth/Viral) drives their points?
**Formula:**
- If Activity% > 35%: "Activity Beast"
- If Engagement% > 45%: "Engagement Wizard"
- If Growth% > 30%: "Rising Star"
- If Viral% > 20%: "Viral Sniper"
- Default: "Balanced"
**Why it matters:** Helps new players understand *how* each player scores (teaching tool)
**Data source:** `weekly_snapshots` — compute average of last 4 weeks
**Display:**
```
Archetype: Engagement Wizard
└─ Usually wins through quality interactions, not frequency
```

### How to Build These (Technical)

**Backend change required:** Add endpoint `/api/intel/influencer/:id/analytics`

```typescript
// GET /api/intel/influencer/:id/analytics
// Returns:
interface InfluencerAnalytics {
  influencerId: number;
  weeklyScores: {
    week: string;
    activity: number;
    engagement: number;
    growth: number;
    viral: number;
    total: number;
  }[];
  consistency: {
    percentage: number; // 0-100
    safeFloor: number;
    ceiling: number;
  };
  peakEngagement: {
    score: number;
    week: string;
    reason?: string;
  };
  momentum: {
    delta: number;
    trend: 'up' | 'flat' | 'down';
    weeklyDelta: number[];
  };
  archetype: 'Activity Beast' | 'Engagement Wizard' | 'Viral Sniper' | 'Rising Star' | 'Balanced';
}
```

**Frontend change:** Two new components:
- `InfluencerWeeklyCard.tsx` — Shows weekly breakdown + archetype
- `PerformanceTrendChart.tsx` — Simple line chart of 4-week scores

**Data availability:** ✅ ALL READY (weekly_snapshots table has everything)

---

## QUESTION 4: Categories vs. Chronology (Heuristic Solution)

### The Problem

Chronological/engagement-sorted feed = Elon dominates, CT culture invisible.

Categories would be better but require AI (classify tweets as BTC vs DeFi vs Memes).

### Solution: Hybrid Approach (No AI Needed)

**Primary sorting: Tier** (S, A, B, C, Rising)
- Mobile-first: One tier visible at a time
- Desktop: All tiers visible in columns
- This is 80% of what players want ("show me S-tier activity")

**Secondary sorting within tier: Momentum** (trending up, stable, trending down)
- Use `engagement_momentum` (delta from last week)
- Emerging accounts rise to top
- Fading accounts sink

**Tertiary: Tag heuristics** (no AI, pattern-based)

For **detecting specialization** without NLP:
- **BTC Focus:** `btc|bitcoin|eth|ethereum` in handle or last 10 tweets frequently
  - **Implementation:** Regex scan of tweet text, count keyword frequency
  - Cost: 1 SQL query per influencer per week
- **DeFi Focus:** `swap|liquidity|defi|uniswap|aave|compound`
  - Similar regex approach
- **Meme Focus:** Account interacts heavily with @pumpdotfun, @draftkinfs, humor/culture accounts
  - **Implementation:** Check if >5 interactions/week with known meme influencers
- **Macro/Econ:** `macro|economy|inflation|rates|usdx`
- **Predictions:** Watch for accounts with history of time-bound predictions
  - Check if tweets contain "when", "by", "next", "watch", "mark my words"

**Why heuristics work:**
- CT culture is *repetitive* — BTC people talk about the same things
- Regex on 10 recent tweets catches ~90% of specialization
- No external API calls, super fast
- Can be manually reviewed and tuned

### Recommended Display (No Breaking Change)

**Keep current 3-tab structure, enhance with heuristics:**

1. **Feed Tab:**
   - Filter by tier (already done)
   - Sort by: Momentum (↑ trending up first)
   - Optional: Icon badge for specialization (🔗 DeFi, 🎨 Memes, 📊 Macro)

2. **Profiles Tab:**
   - Add specialization tags to each card
   - "Activity Beast · DeFi Focused" under name

3. **Rising Stars Tab:**
   - Add specialization to each emerging account
   - "New Macro Analyst · +12K followers this week"

---

## QUESTION 5: Making "+99 pts" Actually Meaningful

### Current Problem

Line 296-299 in Intel.tsx:
```typescript
const estimatePoints = (tweet: Tweet): number => {
  const raw = tweet.likes + tweet.retweets * 2 + tweet.replies;
  return Math.min(99, Math.round(Math.sqrt(raw) / 2));  // ← FAKE CAP
};
```

This is **intentionally misleading** — caps at 99, doesn't match game formula.

### Solution: Display Actual Score Contribution

**Key insight:** A single tweet doesn't earn points — weekly performance earns points.

But we CAN estimate a tweet's **expected contribution** using the game formula:

**Single-Tweet Score Contribution Formula**

```
If this tweet is representative of the week, estimate:
├─ If 10 tweets/week (normal): This tweet contributes ~1/10 of their weekly score
├─ If 5 tweets/week (quiet): This tweet contributes ~1/5 of their weekly score
└─ If 20+ tweets/week: This tweet is routine, minimal contribution

Engagement Score per Tweet =
  sqrt(likes + retweets×2 + replies×3) × 1.5
  ÷ tweets_this_week

Viral Bonus if this tweet hits:
  10K-49K engagement: +0.4-1.2 pts
  50K-99K: +1.4-2.1 pts
  100K+: +2.4-3.6 pts (distributed across weekly cap)
```

### UI Change: Replace "+99 pts" Label

**Currently (misleading):**
```
+99 pts
```

**New (honest & educational):**
```
~+2 pts (if week avg)
├─ Engagement: +1.5
├─ Viral bonus: +0.5 (strong for this account)
└─ Caveat: Assumes 8 tweets/week
```

**Even better: Show range**

```
Estimated Contribution:
 Safe (5 tweets/week): +1.8 pts
 Normal (8 tweets/week): +2.4 pts  ← Most likely
 Busy (15 tweets/week): +1.6 pts
```

### Why This Works

1. **Honest:** Shows the actual game formula
2. **Educational:** Teaches new players how scoring works
3. **Contextual:** Adjusts for that influencer's activity level
4. **Differentiates:** Elon's tweet gets "+1.8 pts" (huge account, base engagement is baseline), micro-account's tweet gets "+4.2 pts" (exceptional for them)

### Technical Implementation

**Backend:** Add to `/api/ct-feed` response

```typescript
interface TweetWithEstimate {
  // ... existing tweet fields
  scoreEstimate: {
    lowEstimate: number;  // Conservative (high tweet volume)
    normalEstimate: number;  // Expected (average tweet volume)
    highEstimate: number;  // If they're quiet that week
    viralBonus?: number;  // +X if this is viral-level engagement
    assumptions: {
      tweetsPerWeek: number;
      engagementWeight: string;
    };
  };
}
```

**Frontend:** New component `ScoreEstimateTooltip.tsx`

```typescript
export function ScoreEstimateTooltip({ estimate }: { estimate: ScoreEstimate }) {
  return (
    <div className="text-xs text-gray-400">
      <div className="font-semibold text-emerald-400 mb-1">
        Est. +{estimate.normalEstimate} pts
      </div>
      <div className="space-y-0.5 text-[10px]">
        <div>Low: +{estimate.lowEstimate} (busy week)</div>
        <div>High: +{estimate.highEstimate} (quiet week)</div>
        {estimate.viralBonus && (
          <div className="text-gold-400">+ {estimate.viralBonus} viral bonus</div>
        )}
      </div>
    </div>
  );
}
```

### What This Solves

- **Elon dominance:** His tweets get low estimates (normal for him)
- **C-tier visibility:** Their tweets get higher estimates (exceptional for them)
- **Game understanding:** Players learn "a tweet with 10K engagement means different things at different scales"
- **Trust:** "They showed me their formula, I can see they're being fair"

---

## QUESTION 6: Personalization Hooks (What's Feasible?)

### What We Know About The User

✅ **Available (free):**
- Their team picks (if active) → /api/league/team/me
- Their watchlist/scouted players → /api/watchlist/ids
- Their follows → /api/follows (Tapestry)
- Their recent drafts → /api/league/history (if implemented)

❌ **Not available (would need to build):**
- Their draft performance history
- Their preferred archetypes
- Their risk tolerance (based on past picks)

### 3 High-Impact Personalization Features (Feasible)

#### 1. "Your Team This Week" Card (⭐⭐⭐ HIGHEST IMPACT)

**Where:** Top of Intel page, always visible
**For:** Active players (have current team)
**Content:**
```
┌──────────────────────────────────┐
│ YOUR TEAM'S PERFORMANCE          │
│                                  │
│ This week: +43 pts so far        │
│ Rank: #2,847 in Signature League │
│                                  │
│ 🔥 Hot: @Hsaka (+12 pts, ↑)      │
│ ❄️ Cold: @dcfcarpenter (-2, ↓)  │
│ ⏱️ TBD: @bneilson (0 pts yet)    │
│                                  │
│ [View Full Team Stats]           │
└──────────────────────────────────┘
```

**Why it works:**
- Creates feedback loop: "Browse Intel → See my team's impact → Adjust next draft"
- Motivates engagement (shows active score real-time)
- Answers their immediate question: "Am I winning?"

**Technical:**
- Query: `SELECT SUM(weekly_score) FROM team_scores WHERE team_id = ? AND week = current_week`
- Cost: 1 API call on page load
- Data ready: ✅ (weekly_snapshots + fantasy_league_scores tables)

#### 2. "Scouted Players Trending" (⭐⭐⭐ HIGH IMPACT)

**Where:** Second section below "Your Team"
**For:** Everyone (shows their watchlist visibility)
**Content:**
```
3 of your scouted players are trending this week:

[Card] @Hsaka: Engagement Wizard, ↑ +8 pts
      Watchlisted 10 days ago. Now hot.

[Card] @bneilson: Activity Beast, → +1 pt
      Watchlisted 3 weeks ago. Stable.

[Card] @dcfcarpenter: Viral Sniper, ↓ -5 pts
      Watchlisted 5 weeks ago. Cooling down.

[View All 12 Watchlisted Players]
```

**Why it works:**
- **"Is my scouted pick still good?"** — Answered immediately
- **FOMO engine:** "I watched @Hsaka 10 days ago, he's NOW trending, I should draft him!"
- **Justifies scouting mechanic:** Makes watchlist feel useful

**Technical:**
- Query: Fetch watchlist IDs, get their weekly_snapshots from this week, sort by momentum
- Cost: 1 API call + 1 secondary query
- Data ready: ✅

#### 3. "Rivals Are Picking..." (⭐⭐ MODERATE IMPACT)

**Where:** Third section, "Social Intel"
**For:** Competitive players (mainly engagement/fun)
**Content:**
```
🏆 RIVAL ACTIVITY (From your contest)

Most drafted this week:
  @Hsaka     [████████░░] 8 picks (12% of active drafters)
  @bneilson  [██████░░░░] 5 picks (8%)
  @dcfcarp..  [████░░░░░░] 3 picks (5%)

└─ These are popular — expect competition
```

**Why it works:**
- Competitive psychology: "Everyone's drafting them, but can I find value elsewhere?"
- Transparency: "Here's what's in the meta"
- Matches DraftKings "expert picks" section

**Technical:**
- Query: `SELECT influencer_id, COUNT(*) as pick_count FROM fantasy_league_picks WHERE contest_id = ? AND week = current_week GROUP BY influencer_id ORDER BY pick_count DESC`
- Cost: 1 query on page load
- Data ready: ✅ (fantasy_league_picks table exists)

### What's NOT Feasible (Don't Build)

❌ **"Based on your draft history, you love Activity Beasts"**
- Requires 5+ prior drafts to build profile
- Risk: Wrong categorization in early sessions
- **Skip:** Solve post-launch after we have data

❌ **"Recommend undervalued players for your style"**
- Too complex (ML model for draft value)
- Requires game-theory-level analysis
- **Skip:** Build simple version (most consistent in tier) later

❌ **"Your rivals' teams in past contests"**
- Privacy concern
- Requires tracking rivals across contests
- **Skip:** Build social features gradually

### Implementation Priority

**MUST HAVE (1-2 hours):**
1. "Your Team This Week" card
2. "Scouted Players Trending" card

**NICE TO HAVE (3-4 hours):**
3. "Rivals Are Picking" social intel

**DEFER (post-launch):**
- ML-based recommendations
- Draft style analysis
- Win prediction

---

## FINAL RECOMMENDATION: 3 Impactful Changes

### Change #1: Restructure Feed to Show Actual Weekly Scores (⭐ HIGHEST IMPACT)

**What:** Replace fake "+99 pts" with honest score breakdown
**Where:** Intel page, Feed tab, every influencer card
**Time:** 4-5 hours (2h backend, 2h frontend, 1h testing)
**Impact:** Players understand game mechanics, see value in B/C tier accounts
**Data:** ✅ Ready (weekly_snapshots table complete)

**Deliverables:**
- Backend: `/api/intel/influencer/:id/analytics` endpoint
- Frontend: `InfluencerWeeklyBreakdown.tsx` component
- Visual: Stacked bar chart or breakdown table

**Before:**
```
+99 pts (fake, capped)
```

**After:**
```
This Week: 87 pts
├─ Activity (tweets): 28 pts
├─ Engagement (quality): 45 pts
├─ Growth (followers): 12 pts
└─ Viral bonus: +2 pts

Last 4 weeks: [73] [91] [85] [87]
Consistency: 78% (Safe pick)
Safe Floor: 65 pts | Ceiling: 95 pts
```

---

### Change #2: Add Personalization Cards (Your Team, Watchlist, Rivals) (⭐ HIGH IMPACT)

**What:** Three new sections at top of Intel page showing personalized data
**Where:** Intel page, before main Trending section
**Time:** 3-4 hours (1h per card, 1h integration)
**Impact:** Closes gap between research and decision-making; increases engagement
**Data:** ✅ Ready (all APIs exist)

**Deliverables:**
- `YourTeamCard.tsx` — Current week score
- `WatchlistTrendingCard.tsx` — Scouted players on fire
- `RivalPicksCard.tsx` — Social proof/competition

**Why it matters:**
- "Your team" answers "Am I winning?"
- "Scouted trending" answers "Should I really draft them?"
- "Rival picks" creates competitive dynamic

---

### Change #3: Collapse to Single-Page IA (Lower Priority, Future)

**What:** Move from 3-tab structure to 4-section scroll on mobile
**Where:** Entire Intel component
**Time:** 6-8 hours (full redesign + responsive work)
**Impact:** Mobile-first, cleaner, more scannable
**Feasibility:** Medium (requires component refactor)

**Why this is #3:**
- Current 3-tab structure is *working* (just not optimized)
- Changes #1 and #2 add huge value without refactor
- Post-launch can do this as UX polish

**Future IA:**
```
┌─ Your Picks & Rivals (personalized)
├─ Trending This Week (tier-filtered)
├─ Performance Archetypes (by style)
└─ Rising Stars (emerging opportunities)
```

---

## IMPLEMENTATION ROADMAP (Next Session)

### Phase 1: Quick Wins (2-3 hours)
- [ ] Add `/api/intel/influencer/:id/analytics` endpoint
- [ ] Compute weekly breakdown in response
- [ ] Build `ScoreBreakdownCard.tsx` component
- [ ] Replace fake "+99 pts" in Viral Highlights section
- [ ] Test with 5 influencers

### Phase 2: Personalization (2-3 hours)
- [ ] Build `YourTeamCard.tsx` with live weekly score
- [ ] Build `WatchlistTrendingCard.tsx` showing scouted player momentum
- [ ] Add to Intel page top (above Trending section)
- [ ] Test: Verify scores match game formula

### Phase 3: UI Polish (1-2 hours)
- [ ] Tier filtering already works, enhance it
- [ ] Add consistency % badge to each influencer
- [ ] Add archetype label (Activity Beast, etc.)
- [ ] Responsive check: test on mobile

### Phase 4: Rising Stars Fix (1 hour)
- [ ] Fix voting mechanic (shows 0/0 currently)
- [ ] Add vote count display
- [ ] Sort by votes, not just growth rate

---

## Success Metrics (How We'll Know It Works)

After launch, measure:

1. **Time on Intel page:** Should increase 2-3x (currently low)
2. **Scouting rate:** % of new players who add watchlist (target: 40%)
3. **Draft-from-Intel:** Did they find their pick on Intel before drafting? (target: 60%)
4. **Personalization CTR:** Click rate on "Your Team" card (target: 50%)
5. **Confidence survey:** "How confident are you in your draft?" before/after reading Intel

---

## Anti-Patterns to Avoid

❌ **Don't add MORE filters** — Mobile already cramped
❌ **Don't show all 100 influencers at once** — Cognitive overload
❌ **Don't use predictive AI** — We don't have data for it yet
❌ **Don't remove Profiles tab** — Some players like the all-time view
❌ **Don't break the scouting flow** — Must stay <3 taps from Intel → Watchlist

---

## Appendix: Data Model for Score Breakdown

**Already exists in database:**
```
weekly_snapshots {
  id, influencer_id, contest_id,
  snapshot_type: 'start' | 'end',
  follower_count,
  tweets_analyzed,
  total_likes, total_retweets, total_replies,
  total_views, total_quotes, total_bookmarks,
  avg_engagement_rate,
  created_at
}
```

**Can compute from fantasy_scoring_service.ts:**
```typescript
interface WeeklyBreakdown {
  weekNumber: string;
  activity: number;      // min(35, tweets × 1.5)
  engagement: number;    // min(60, sqrt(...) × volume)
  growth: number;        // min(40, follower_delta)
  viral: number;         // 0-25 based on thresholds
  total: number;         // activity + engagement + growth + viral
}
```

**New metric calculations:**
```typescript
// Consistency over 4 weeks
consistency = stdDev(last4Weeks) / mean(last4Weeks)

// Momentum (week-over-week delta)
momentum = thisWeekTotal - lastWeekTotal

// Archetype (which category dominates?)
archetype = argmax([activity%, engagement%, growth%, viral%])
```

All data exists in database. No new tables needed.

---

## Questions This Proposal Answers

1. ✅ **What does a CT player need?** Ranked: Discovery → Validation → Consistency → Social Intel → Breakout Picks
2. ✅ **What IA should we build?** Single-page 4-section scroll (future), enhanced 3-tab now
3. ✅ **What 5 metrics to show?** Weekly Score, Consistency, Peak Engagement, Momentum, Archetype
4. ✅ **Categories vs. chronology?** Hybrid: Tier-based + momentum + heuristic tags (no AI)
5. ✅ **How to make +pts meaningful?** Honest breakdown: show activity/engagement/growth/viral components
6. ✅ **What personalization is feasible?** Your team, watchlist trending, rival picks (all 3 doable)

---

## Next Session TODO

1. **Review this doc** — Does the recommendation align with product vision?
2. **Decide on scope** — All 3 changes now, or phased approach?
3. **Allocate time** — Do we have 5-7 hours before deadline?
4. **Start Phase 1** — Build `/api/intel/influencer/:id/analytics` endpoint
5. **Screenshot before/after** — Visual comparison to track progress
6. **Test with real data** — Verify breakdowns match actual game formula

---

**Questions? Clarifications needed before implementation?**
