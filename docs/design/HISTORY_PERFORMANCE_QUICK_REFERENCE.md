# History & Performance — Quick Reference

**Location**: Profile → Teams tab (expand existing, don't create new page)

---

## The Pitch (30 seconds)

**Problem**: Users can only see their current team. Past teams, win rates, and best performances are invisible.

**Solution**: Show career stats prominently on the Teams tab (23% win rate, best score 847, 12 contests, ranked top 18%). Below, a browsable list of all past teams with full details when tapped.

**Why it wins**:
1. Mobile-first (no new nav items)
2. Competitive requirement (DraftKings/FanDuel have this)
3. Demo impact ("I won 3 of 12 contests" is impressive)
4. User retention (progression is visible)
5. Tapestry integration becomes meaningful (not just a redirect)

---

## The Structure (Mobile-First)

```
┌─────────────────────────────┐
│ CAREER STATS (Hero Section) │ ← Always visible at top
│ 23%  |  #1  |  12  | 847pts │
└─────────────────────────────┘

┌─────────────────────────────┐
│ TEAM HISTORY (List)         │ ← Tap any team to expand
│ [Current Week ▼]            │
│ Feb 25 · 847pts · #4 · Active
│ Feb 18 · 692pts · #12 · Ended
│ Feb 11 · 734pts · #8 · Ended
│ [Load More]                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SELECTED TEAM (Expanded)    │ ← Shows on tap
│ Formation + Details         │
│ Budget breakdown            │
│ [Share] [Re-draft]          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ INFLUENCER PERFORMANCE      │ ← Collapsible
│ How each pick did in team   │
│ Draft cost vs. points earned│
└─────────────────────────────┘

┌─────────────────────────────┐
│ TAPESTRY IDENTITY (Bottom)  │ ← Moved down, clearer context
│ "12 teams on Solana"        │
└─────────────────────────────┘
```

---

## Career Stats to Show (Hero Section)

| Stat | Why | Example |
|------|-----|---------|
| Win Rate | Shows competitive track record | 23% (3 of 12 won) |
| Best Finish | Credibility | #1 / 1st Place |
| Total Contests | Activity/commitment | 12 contests |
| Best Score | Peak performance | 847 pts |
| (Optional) Percentile | Relative standing | Top 18% |

---

## API Endpoints Needed

### New: GET /api/users/me/teams
```json
{
  teams: [
    {
      id: "uuid",
      name: "Team Name",
      contest_end_date: "2026-02-25T23:59:00Z",
      total_score: 847,
      rank: 4,
      total_entries: 156,
      status: "active" | "ended",
      budget_used: 148,
      max_budget: 150,
      picks: [
        { id: 1, handle: "elonmusk", tier: "S", draft_cost: 90, total_points: 420, is_captain: true },
        ...4 more
      ]
    }
    ...more teams
  ],
  careerStats: {
    totalContests: 12,
    totalWins: 3,
    winRate: 0.25,
    bestScore: 847,
    bestRank: 1,
    averageScore: 691,
    seasonPercentile: 18
  }
}
```

**Estimated effort**: 1-2 hours (straightforward aggregation query + pagination)

---

## Frontend Implementation Phases

### Phase 1: Core (2-3 hours) — MVP
- [ ] Replace "Teams" tab content with hero stats + team list
- [ ] Fetch user teams with pagination from new endpoint
- [ ] Make team cards tappable (expand to show details)
- [ ] Show formation + details when expanded
- [ ] Mobile responsive (375px first)

### Phase 2: Polish (2 hours) — Almost there
- [ ] Influencer performance section (collapsible)
- [ ] Share/Re-draft buttons
- [ ] Loading/empty states
- [ ] Desktop layout optimization

### Phase 3: Tapestry Clarity (1 hour) — Context
- [ ] Move Tapestry section to bottom
- [ ] Add "12 teams published on Solana" count
- [ ] Change "View full history" → "View career on-chain"
- [ ] Add context explaining Tapestry = immutable proof

**Total**: 5-6 hours for full MVP

---

## Design Decisions (Why This Way)

| Decision | Alternative | Why Winning Approach |
|----------|-------------|----------------------|
| Expand Teams tab | Create new "Stats" page | Doesn't break sacred 4-item nav; uses existing pattern |
| Hero stats at top | Hide in modal | Visibility = credibility; users see their achievement first |
| Team list with pagination | Show all teams at once | Mobile UX; not overwhelming; "load more" is familiar |
| Single team expansion | Side-by-side comparison | 375px is too narrow for two teams |
| Influencer section collapsible | Separate "Pick Stats" page | Context matters; want to see picks within team context |
| Redesigned Tapestry link | Keep "View full history" → SSE | Currently broken/confusing; fix by making real |

---

## Mobile UX Checklist

✅ Touch targets ≥ 44px (all tappable items)
✅ No hover-only interactions (everything works with tap)
✅ Scrollable list (teams stack vertically)
✅ Hero stats visible without scrolling
✅ Expansion/collapse preferred to modals
✅ Text size ≥ 16px (body), good contrast
✅ Web Share API for team sharing

---

## Success Metrics

- **Engagement**: Users spend 3+ min in Teams tab (vs. 30sec now)
- **Shares**: 15%+ of teams shared via "Share Team"
- **Retention**: Profile views +40% week-over-week
- **Demo impact**: Can say "best team was 847 points, ranked #1 of 156"

---

## Objection Handling (30-second responses)

**"This adds complexity; should we cut?"**
→ Not complex; just reshuffling existing data. One new API endpoint. Every fantasy app has this. User retention driver. Demo narrative improves significantly.

**"Why not create new 'Stats' page?"**
→ Would need 5th nav item (breaks mobile). Data already exists in this tab. Competitive apps don't split this (DraftKings has it on profile page). Users expect: Profile → Teams → see my teams.

**"Tapestry link is confusing. Just remove it?"**
→ Don't remove; make it real. Change "View full history" to "View career on-chain." Add context: "12 teams published, immutable on Solana." Turns confusion into a unique selling point.

---

## Next Steps

1. **Review** this doc + full strategy (HISTORY_PERFORMANCE_UX_STRATEGY.md)
2. **Approve** scope (MVP 5-6 hours)
3. **Confirm** hero stats (win rate, best finish, contests, best score)
4. **Greenlight** Phase 1 → Start building

---

## Files Updated
- `docs/design/HISTORY_PERFORMANCE_UX_STRATEGY.md` — Full strategic proposal with wireframes, flows, arguments
- `docs/design/HISTORY_PERFORMANCE_QUICK_REFERENCE.md` — This file (TL;DR for decision-making)
