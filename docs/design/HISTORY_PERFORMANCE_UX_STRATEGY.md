# History & Performance UX Strategy for Foresight

**Status:** Strategic Proposal (ready for user feedback)
**Date:** February 25, 2026

---

## Executive Summary

The current "Teams" tab on Profile shows only the current/active team. Users want to see **their complete career history** — past contests, previous teams, win rates, best performers, and how they've improved over time.

The current "View full history" Tapestry link redirects to SSE (a trading app), which is irrelevant and breaks user expectations.

This document proposes the optimal UX structure to make history tracking feel like a **player career card** (similar to DraftKings/FanDuel player stats) while meaningfully integrating Tapestry Protocol.

---

## 1. The Core Problem

**What users want to do:**
- "How did my Team from 2 weeks ago do?" ← *Time navigation*
- "What's my best contest ever?" ← *Historical ranking*
- "Which influencer has scored the most points for me?" ← *Player performance aggregation*
- "What's my win rate?" ← *Career stats*
- "Show me my journey as a player" ← *Narrative/progress*

**Current friction:**
1. **Teams tab only shows current team** — Past teams are invisible
2. **Tapestry link is broken** — Goes to SSE (trading app), not team history
3. **No aggregation across contests** — Can't see "best team" or "worst team" easily
4. **No influencer performance tracking** — Don't know which picks have been profitable historically
5. **No win-rate or percentile tracking** — No sense of progression or achievement

---

## 2. The Winning Structure: "Career Card" Design

### Location: Expand the "Teams" Tab (Not a New Page)

**Why not a new page?**
- ✗ Navigation is already at 4 items (sacred on mobile)
- ✗ Users primarily enter via Profile → Teams (existing pattern)
- ✗ Competitive apps put history inside player cards, not separate pages
- ✓ Mobile-first: Tab is already thumb-reachable

**Why expand Teams, not create new tab?**
- The Teams tab currently only shows 1 team (the current one)
- Natural evolution: 1 team → all teams
- Single, cohesive "team portfolio" view

### Information Hierarchy (Mobile-First at 375px)

```
┌─────────────────────────────────┐
│  CAREER STATS (HERO SECTION)    │  ← Always visible, at top
│  ✓ Win rate (23%)               │
│  ✓ Best finish (#1)             │
│  ✓ Total contests (12)          │
│  ✓ All-time best score (847 pts)│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  TEAM SELECTOR / TIMELINE       │  ← Pivot: Current or All?
│  [Current] [Past 4 weeks▼]      │
│  Shows 1-5 most recent teams    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  SELECTED TEAM CARD             │  ← Details for picked team
│  Team name                      │
│  Score, rank, finish position   │
│  Budget breakdown               │
│  Formation (visual)             │
│  Share button                   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  INFLUENCER STATS (if selected) │  ← On-demand deep dive
│  How each pick performed        │
│  Historical pts per influencer  │
│  Value analysis (draft cost vs. │
│                   actual return)│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  TAPESTRY ON-CHAIN IDENTITY     │  ← Moved down, context clearer
│  (existing section, redesigned) │
└─────────────────────────────────┘
```

---

## 3. Detailed UI Wireframe (Mobile & Desktop)

### MOBILE (375px) - Primary Design

```
╔═══════════════════════════════════════════════════╗
║  PROFILE > TEAMS TAB                              ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ┌───────────────────────────────────────────┐   ║
║  │  YOUR CONTEST RECORD                      │   ║
║  │                                           │   ║
║  │   23%        #1          12        847pts │   ║
║  │  Win Rate   Best       Contests   Best   │   ║
║  │            Finish                  Score │   ║
║  └───────────────────────────────────────────┘   ║
║   (4-column stat grid, responsive to 2-col on    ║
║    smaller phones)                               ║
║                                                   ║
║  ┌───────────────────────────────────────────┐   ║
║  │  TEAM HISTORY                             │   ║
║  │                                           │   ║
║  │  [Current Week ▼]                         │   ║
║  │  (dropdown or segmented control)          │   ║
║  │                                           │   ║
║  │  Feb 25 (Current)   ───────────┐          │   ║
║  │  Team Name                      │847 pts  │   ║
║  │  Rank: #4 of 156  |  Status: Active       │   ║
║  │                                           │   ║
║  │  Feb 18 (Last Week)  ───────────┐          │   ║
║  │ "Attack Club"                   │692 pts  │   ║
║  │  Rank: #12 of 156  |  Ended     │         │   ║
║  │                                           │   ║
║  │  Feb 11 (Week before) ──────────┐          │   ║
║  │  "Golden Eagles"                │734 pts  │   ║
║  │  Rank: #8 of 156  |  Ended      │         │   ║
║  │                                           │   ║
║  │  [Load More] (if more than 3)             │   ║
║  └───────────────────────────────────────────┘   ║
║   (Each team is a tappable card)                 ║
║                                                   ║
║  ┌───────────────────────────────────────────┐   ║
║  │  SELECTED TEAM DETAILS                    │   ║
║  │  (Expands when a team is tapped)          │   ║
║  │                                           │   ║
║  │  🏆 Team Name                             │   ║
║  │                                           │   ║
║  │  Rank #4 · 847 points                     │   ║
║  │  Win: No  |  Prize: —                     │   ║
║  │                                           │   ║
║  │  Budget: 148/150 used                     │   ║
║  │  ████████████░  [98%]                     │   ║
║  │                                           │   ║
║  │  FORMATION:                               │   ║
║  │   [Formation Visual - 5 Cards]            │   ║
║  │    S-Tier (Captain):                      │   ║
║  │    @elonmusk · 280 pts (1.5x = 420)      │   ║
║  │                                           │   ║
║  │    A-Tier Slots:                          │   ║
║  │    @vitalik.eth · 156 pts (90 cost)       │   ║
║  │    @jack · 189 pts (75 cost)              │   ║
║  │                                           │   ║
║  │    B-Tier Slots:                          │   ║
║  │    @balaji · 142 pts                      │   ║
║  │    @naval · 156 pts                       │   ║
║  │                                           │   ║
║  │  [Share Team]  [Draft Again]              │   ║
║  └───────────────────────────────────────────┘   ║
║                                                   ║
║  ┌───────────────────────────────────────────┐   ║
║  │  INFLUENCER PERFORMANCE (in this team)    │   ║
║  │                                           │   ║
║  │  1. @elonmusk                             │   ║
║  │     420 pts  (Captain, 1.5x)              │   ║
║  │     Drafted cost: 90 · Earned: 420        │   ║
║  │     ROI: 466%                             │   ║
║  │                                           │   ║
║  │  2. @jack                                 │   ║
║  │     189 pts                               │   ║
║  │     Drafted cost: 75 · Earned: 189        │   ║
║  │     ROI: 252%                             │   ║
║  │                                           │   ║
║  │  [Collapse]                               │   ║
║  └───────────────────────────────────────────┘   ║
║                                                   ║
║  ┌───────────────────────────────────────────┐   ║
║  │  🔗 TAPESTRY PROTOCOL                     │   ║
║  │  Your on-chain identity & history         │   ║
║  │  12 teams · 3 contests won · Live on Sol  │   ║
║  │                                           │   ║
║  │  [All records immutable & verifiable]     │   ║
║  │                                           │   ║
║  │  [View full career on-chain]              │   ║
║  └───────────────────────────────────────────┘   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### DESKTOP (1280px+) - Expanded Layout

```
╔══════════════════════════════════════════════════════════════════════════╗
║ PROFILE > TEAMS TAB                                                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐  ║
║ │ YOUR CONTEST RECORD                                                │  ║
║ │                                                                    │  ║
║ │  23%         #1         12        847 pts     Season    Streak    │  ║
║ │ Win Rate    Best      Contests    Best      Percentile  12 days   │  ║
║ │            Finish                 Score      Top 18%               │  ║
║ │                                                                    │  ║
║ └────────────────────────────────────────────────────────────────────┘  ║
║                                                                          ║
║ ┌─────────────────────────────────────┬─────────────────────────────┐  ║
║ │ TEAM HISTORY (All 12 Contests)     │ SELECTED TEAM: Current Week  │  ║
║ │                                     │                             │  ║
║ │ [Timeline/Dropdown▼]                │ 🏆 Team Name                │  ║
║ │ View: Current Week | All | Filters │ #4 of 156 · 847 pts         │  ║
║ │                                     │                             │  ║
║ │ Feb 25 (Current)         847 pts    │ Win: —  Prize: —            │  ║
║ │ Team Name    [#4/156]     Rank ▲   │                             │  ║
║ │ Status: Active            Cap: 98%  │ Budget: 148/150 (98%)       │  ║
║ │                                     │ ████████████░               │  ║
║ │ Feb 18        692 pts               │                             │  ║
║ │ "Attack Club" [#12/156]             │ FORMATION:                  │  ║
║ │ Status: Ended             Cap: 97%  │                             │  ║
║ │                                     │ ┌─S-Tier────────────────┐   │  ║
║ │ Feb 11        734 pts               │ │ @elonmusk             │   │  ║
║ │ "Golden...    [#8/156]              │ │ 420 pts (Cap 1.5x)     │   │  ║
║ │ Status: Ended             Cap: 95%  │ └───────────────────────┘   │  ║
║ │                                     │                             │  ║
║ │ Feb 04        521 pts               │ ┌─A-Tier────────────────┐   │  ║
║ │ "Swift Team"  [#27/156]             │ │ @vitalik   156 pts     │   │  ║
║ │ Status: Ended             Cap: 99%  │ │ @jack      189 pts     │   │  ║
║ │                                     │ └───────────────────────┘   │  ║
║ │ [Load more →]                       │                             │  ║
║ │                                     │ ┌─B-Tier────────────────┐   │  ║
║ │                                     │ │ @balaji    142 pts     │   │  ║
║ │                                     │ │ @naval     156 pts     │   │  ║
║ │                                     │ └───────────────────────┘   │  ║
║ │                                     │                             │  ║
║ │                                     │ [Share Team]  [Re-draft]    │  ║
║ └─────────────────────────────────────┴─────────────────────────────┘  ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐  ║
║ │ INFLUENCER PERFORMANCE IN THIS TEAM                                │  ║
║ │                                                                    │  ║
║ │ Rank  Player        Drafted   Points   ROI     Notes              │  ║
║ │ ─────────────────────────────────────────────────────────────────  │  ║
║ │ 1.    @elonmusk      90 cost   420pts   +466%   Captain (1.5x)    │  ║
║ │ 2.    @jack          75 cost   189pts   +252%                     │  ║
║ │ 3.    @vitalik       85 cost   156pts   +183%                     │  ║
║ │ 4.    @balaji        70 cost   142pts   +202%                     │  ║
║ │ 5.    @naval         80 cost   156pts   +195%                     │  ║
║ │                                                                    │  ║
║ └────────────────────────────────────────────────────────────────────┘  ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐  ║
║ │ 🔗 TAPESTRY PROTOCOL - ON-CHAIN IDENTITY                          │  ║
║ │ All your teams and contest records are immutable & verifiable     │  ║
║ │                                                                    │  ║
║ │ 12 Teams Published · 23 Contests · 3 Wins                          │  ║
║ │ [View complete on-chain career →]                                  │  ║
║ │                                                                    │  ║
║ └────────────────────────────────────────────────────────────────────┘  ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 4. The UX Flows

### Flow A: User Opens Profile → Teams Tab (Current Behavior, Improved)

```
1. User clicks "Teams" tab on Profile
2. Hero section shows CAREER STATS (always visible)
   - Win rate
   - Best finish
   - Total contests
   - Best score
3. Below: Team history list (most recent 3-5 teams, with load more)
4. User taps a team → expands team details below the list
5. Can scroll to see formation + influencer performance
6. Can share the team or "re-draft" it
```

**Mobile engagement**: Hero stats establish credibility immediately. List format reduces cognitive load. Tap-to-expand is familiar pattern.

### Flow B: User Wants to See "Best Team Ever"

```
1. Open Profile → Teams tab
2. Hero shows "Best Score: 847 pts" (tap to highlight)
3. When user taps, auto-filters to show that team
4. OR, user uses dropdown "View: All teams, sort by score DESC"
5. Best team floats to top of list
6. User taps to see full composition
```

**Why this works**: Sorting is implied by hero stats. Users naturally want to see the "best" team backing up a stat they just read.

### Flow C: User Wants to See Win Rate Breakdown

```
1. Hero shows "Win rate: 23%" (could be tappable)
2. User taps → shows small modal or expandable section:
   - Total contests: 12
   - Contests won: 3
   - Prize breakdown (if any)
   - Percentile rank among all users
   - Upcoming contests to improve record
```

**Optional enhancement**: This could become a micro-expansion, not a full modal (respects mobile UX).

### Flow D: User Wants to Know "Which influencer has helped me most?"

```
1. User is viewing a specific team
2. Influencer performance section shows ROI ranking
3. User can see historical performance of each pick
4. (Future) Aggregate across all teams: "Historical pick performance"
   - Shows career stats for each influencer they've drafted
   - Best ROI picks historically
   - Most expensive vs. most valuable picks
```

**Note**: This requires aggregation across contests, doable in backend with one new endpoint.

---

## 5. Key Design Decisions & Rationale

### Decision 1: Career Stats in a Hero Section (Not Hidden)

**The principle**: *Primary metrics are visual heroes.*

Most fantasy apps hide historical stats somewhere. We put them **at the top, always visible**, because:
- Players want to understand their career before diving into team details
- 23% win rate is a badge of honor (or motivation to improve)
- Hero stats create context for why the user should care about the team history
- Competitive psychology: "Top 18%? Cool, let me see what helped me get there."

**Design**: 4-column stat grid (responsive to 2 on phones <320px)

---

### Decision 2: "Teams" Tab Stays; "View Full History" Becomes Meaningful

**The problem**: Current link redirects to SSE (a trading app), which is irrelevant and breaks trust.

**The solution**:
- "View full history" now means: "View my complete team portfolio + career stats on Tapestry"
- The Tapestry section (moved to bottom) explains: "12 teams published, 3 contests won, all verifiable on Solana"
- The link could say: "View on Solana Verifier" or "Verify on Tapestry" (more specific than "View full history")
- **Rationale**: Users want to understand what "view full history" means before they click it. Tapestry is a feature, not a redirect trap.

---

### Decision 3: Influencer Performance is Contextual, Not a Separate Page

**Why not create "Player Stats" page?**
- ✗ Would need a 5th nav item (breaks sacred 4-item rule)
- ✗ Users primarily want to see performance *within a team context*, not as standalone
- ✗ Leaderboard page already shows influencer rankings

**Why include it here?**
- ✓ Users want to understand "which picks won, which lost?" after viewing a team
- ✓ Helps them learn what made a team successful
- ✓ Drives better draft decisions next week

**Design**: Collapsible section below team formation, expandable only when a team is selected.

---

### Decision 4: Timeline/Dropdown, Not Full Historical Leaderboard

**Why not show every past contest as a full leaderboard?**
- ✗ Information overload at 375px
- ✗ Users don't need to see all 156 other players from 2 weeks ago
- ✗ Would require heavy backend changes

**Why dropdown + limited list?**
- ✓ Show 3-5 most recent teams by default
- ✓ "Load More" for older teams
- ✓ Optional: Filter by date range or contest type
- ✓ Simple API change: fetch user's teams with pagination

---

### Decision 5: Single Team Expansion, Not a Multi-Team Comparison View

**Why not compare two teams side-by-side?**
- ✗ Mobile viewport is 375px — two teams can't fit well
- ✗ Comparison feature is rare in fantasy sports (DraftKings doesn't have it)
- ✗ Adds complexity for minimal value

**Why single expansion?**
- ✓ Mobile-friendly
- ✓ Natural flow: list → tap → details
- ✓ User can always scroll up to the hero stats for quick comparisons
- ✓ Future: "Compare two teams" could be desktop-only feature

---

## 6. Backend Requirements (Minimal)

### Current Endpoint Usage
- `GET /api/v2/contests` — Already fetches all contests
- `GET /api/v2/contests/:id` — Already fetches contest detail with teams
- User team data is already queryable

### New Endpoints Needed

**1. GET /api/users/me/teams (with pagination)**
```typescript
// Returns user's all-time teams with summary stats
GET /api/users/me/teams?limit=10&offset=0

{
  teams: [
    {
      id: "uuid",
      name: "Team Name",
      contest_id: "uuid",
      contest_end_date: "2026-02-25T23:59:00Z",
      total_score: 847,
      rank: 4,
      total_entries: 156,
      status: "active" | "ended",
      budget_used: 148,
      max_budget: 150,
      picks: [
        {
          id: 1,
          handle: "elonmusk",
          name: "Elon Musk",
          tier: "S",
          draft_cost: 90,
          total_points: 420,
          is_captain: true
        }
        // ... 4 more picks
      ]
    }
    // ... 9 more teams
  ],
  pagination: {
    total: 12,
    limit: 10,
    offset: 0
  },
  careerStats: {
    totalContests: 12,
    totalWins: 3,
    winRate: 0.25,
    bestScore: 847,
    bestRank: 1,
    bestFinish: "1st",
    averageScore: 691,
    totalPointsEarned: 8292,
    seasonPercentile: 18  // Top 18%
  }
}
```

**2. GET /api/users/me/influencer-stats (optional, for future "Historical Pick Performance")**
```typescript
// How each influencer has performed historically for this user
{
  influencers: [
    {
      influencer_id: 1,
      handle: "elonmusk",
      times_drafted: 8,
      total_points: 2840,
      average_points_per_draft: 355,
      best_score: 487,
      worst_score: 234,
      average_draft_cost: 89,
      roi: "+318%"
    }
  ]
}
```

**Cost**: 1-2 hours to implement these endpoints (straightforward queries, mostly aggregation).

---

## 7. Frontend Implementation Roadmap

### Phase 1: Core Structure (2-3 hours)
1. Refactor Profile "Teams" tab to show hero stats + team list
2. Add pagination to team history
3. Expand team card to show full formation + details
4. Wire up backend to fetch all user teams

### Phase 2: Details & Polish (2 hours)
1. Influencer performance section (within expanded team)
2. Share/re-draft buttons
3. Responsive design (mobile → desktop)
4. Loading states and empty states

### Phase 3: Tapestry Integration & Refinement (1 hour)
1. Redesign Tapestry section to show "X teams published" count
2. Change "View full history" to more specific CTA
3. Clarify what Tapestry means in context

**Total**: 5-6 hours for MVP (career stats + team history + influencer performance within team)

---

## 8. Mobile-First Design Checklist

✅ **Hero stats visible at top** — Career credibility established immediately
✅ **Touch target sizing** — Min 44px for all tappable elements (team list items, buttons)
✅ **No hover-only interactions** — Everything works with tap (ghost buttons on desktop, visible on mobile)
✅ **Scrollable content** — Stats, teams, team details all stack vertically
✅ **No modals for critical flows** — Expansion/collapse preferred to modals
✅ **Readable text** — 16px min for body, good contrast on dark bg
✅ **Lazy loading for images** — Influencer avatars load as user scrolls
✅ **Share flows** — Native Web Share API for team sharing (not just copy)

---

## 9. Three Strongest Arguments Against Objections

### Argument 1: "This Adds Too Much Complexity; Should We Cut?"

**Defense**:
- **Not complex; just data reshuffling.** We already store all this data. We're not building new features — we're surfacing existing data with better UX.
- **One new endpoint (GET /api/users/me/teams).** The Profile page already fetches user stats. This is a minimal addition.
- **Competitive requirement.** Every fantasy sports app shows historical performance. DraftKings, FanDuel, Sleeper all have it. Foresight can't be credible without it.
- **User retention driver.** "Look how much I've improved" is one of the strongest retention hooks in gaming. Without career stats, users don't feel progression.
- **Demo impact.** In a hackathon demo, showing "12 contests played, won 3, 847-point best" is way more impressive than "here's your current team."

**Cost-benefit**: 5-6 hours of work. Returns:
- Credibility bump for judges
- Better demo narrative
- Stronger retention mechanic
- Data that will drive future monetization (premium "career insights" features)

---

### Argument 2: "Why Not Just Add a New 'Stats' Page Instead?"

**Defense**:
- **Navigation is full.** You've set 4 items (Home, Arena, Compete, Feed, Profile) as sacred on mobile. Adding a 5th breaks thumb-reachability and forces smaller icons.
- **This tab exists already.** The "Teams" tab is the natural home. Expanding it is cheaper than creating new routes.
- **Competitive apps don't split this.** DraftKings doesn't have a separate "career page" — player stats are on their profile/team page.
- **User mental model.** If I want to see my teams, I go to Profile → Teams. Not to a separate "Stats" tab. We'd confuse users.
- **Desktop scales fine.** The wireframe shows this works beautifully on desktop with side-by-side layout (teams list + team details).

**Analogy**: You wouldn't create a separate "Stats" app in DraftKings. You'd expand the existing team/profile view.

---

### Argument 3: "The Tapestry Link is Confusing; Why Not Just Remove It?"

**Defense**:
- **Don't remove it; redirect it meaningfully.** "View full history" should link to something that says: "Your 12 teams have been stored on Tapestry Protocol. This is immutable proof of your contest history. [Verify on Solana]" — not to a random trading app.
- **Tapestry is a differentiator.** If Foresight is in the Solana ecosystem, teams on Tapestry is a **competitive advantage**. We should celebrate it, not hide it.
- **Build user trust.** Right now, "View full history" breaks trust (goes to wrong place). Fix it by making it real.
- **Future monetization.** Career stats on-chain is a unique selling point. Premium users could get "verified career card" NFTs or downloadable proof. Right now we're leaving money on the table.

**Action**:
1. Keep the Tapestry section (move to bottom)
2. Change CTA from "View full history" to "View career on-chain" or "Verify on Solana"
3. Add context: "Your 12 teams are permanently stored on Solana via Tapestry."

---

## 10. Success Metrics (Post-Launch)

- **Engagement**: Users spending 3+ min in Teams tab (vs. 30sec currently)
- **Retention**: Profile views increase 40%+ after first week
- **Share rate**: 15%+ of teams shared via "Share Team" button
- **Conversion**: Users entering more contests after seeing career stats
- **Demo impact**: "Best team: 847 points, ranked #4" is more impressive than "current team"

---

## 11. Wireframe Summary

| Mobile (375px) | Desktop (1280px) | Mobile Key UX |
|---|---|---|
| Hero stats (stacked) | Hero stats (grid) | Hero = credibility |
| Team list (full width) | Left: team list, Right: team detail | Tap to expand |
| Tap to expand details | Side-by-side layout | Scroll for formation |
| Formation (stacked) | Formation (normal) | Formation preview |
| Influencer section (collapsed) | Influencer table | Tap to expand |
| Tapestry (bottom) | Tapestry (bottom) | Context clearer |

---

## 12. Next Steps

**For User Approval:**
1. Read this strategy (you're reading it now)
2. Review the wireframes and flows above
3. Approve scope: MVP (6-8 hours) vs. Extended (add historical influencer agg)

**To Proceed:**
1. **Confirm** the location (expand Teams tab, don't create new page)
2. **Confirm** the hero stats we show (I suggested: win rate, best finish, total contests, best score)
3. **Confirm** API endpoints (GET /api/users/me/teams with pagination + careerStats)
4. Start Phase 1: Refactor Teams tab with hero stats + team list

---

## 13. Alternative Approaches Considered (& Why Not)

| Approach | Why Not | Why This Wins |
|---|---|---|
| Create new "Career" page | Breaks 4-item nav rule | Expands existing Teams tab |
| Full leaderboard history | Info overload, backend cost | Simple list + pagination |
| Side-by-side team comparison | 375px doesn't fit two teams | Single expansion, compare via hero stats |
| Redirect "View full history" to SSE | Completely irrelevant to users | Redesign to show on-chain career with context |
| Hide past teams in dropdown | Users can't discover history | Always visible in list |
| Weekly leaderboard archive | Data storage + complex query | Just fetch user's teams |

---

## Conclusion

This design treats **career progression as the hero**, not the current team. It borrows from DraftKings/FanDuel (proven patterns) but fits Foresight's mobile-first, Solana-native philosophy.

The Tapestry integration is no longer a "redirect to a random trading app" — it's **credible proof** that your contests were on-chain. This is a unique selling point for a hackathon entry.

**Expected impact**:
- Demo narrative goes from "here's my team" → "here's my 12-contest journey, won 3, best was #1"
- User retention improves (progression is visible)
- Judges impressed by Tapestry integration (not just a buzzword)

Would you like to proceed with this structure?
