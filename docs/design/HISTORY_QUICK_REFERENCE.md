# History & Performance Feature — Quick Reference

**Status:** Ready to implement, 13-16 hours (Phase 2, post-hackathon optional)

---

## One-Line Summary

Unify Tapestry (immutability proof) + DB (rich context) into a `/history` page showing all past contests with team compositions, scores, and on-chain verification links.

---

## The Problem (3 sentences)

Currently, Tapestry section in Profile links to wrong app (Solana DEX). Users can't see their past contests, scores, or team compositions. No proof that Tapestry integration is meaningful (just cosmetic).

---

## The Solution (5 points)

1. **New endpoint:** `GET /api/league/my-history` — Returns paginated list of user's past contests with scores, team picks, rank
2. **New page:** `/history` — Interactive timeline with search, filter, pagination
3. **Rich card component:** HistoryEntryCard — Shows team, score breakdown (4 categories), rank, "Verify on Solana" link
4. **Constraint handling:** Async Tapestry lookup (non-blocking), JSON aggregation (avoid cartesian explosion), mobile-first UI
5. **Integration:** Link from Profile header, replace broken Tapestry section, add navigation route

---

## Implementation Checklist

### Backend (3-4 hours)

- [ ] **league.ts:** Add `GET /api/league/my-history?page=X&limit=Y` endpoint
  ```typescript
  // Joins user_teams + team_picks + influencers + fantasy_contests
  // Returns 20-item paginated list with score breakdown, rank, percentile
  // Time: 2-3 hours
  ```

- [ ] **historyService.ts (NEW):** Create reusable data hydration service
  ```typescript
  export async function getUserContestHistory(userId, limit, offset)
  export async function enrichWithTapestryProof(entries, profileId)
  // Time: 1 hour
  ```

- [ ] **Tests:** 5 test cases for my-history endpoint
  ```typescript
  // Empty history, pagination, score breakdown, percentile, contentId
  // Time: 1 hour (run last)
  ```

### Frontend (8-10 hours)

- [ ] **History.tsx (NEW):** Main page component
  ```typescript
  // Fetch + display entries, pagination, filters
  // Time: 3 hours
  ```

- [ ] **HistoryEntryCard.tsx (NEW):** Single entry card
  ```typescript
  // Contest name, dates, score breakdown, formation, rank, "Verify" link
  // Time: 2 hours
  ```

- [ ] **Navigation integration:**
  ```typescript
  // Add /history route in App.tsx
  // Add link in Profile header ("View History")
  // Replace broken Tapestry section with Recent History widget
  // Time: 2 hours
  ```

- [ ] **Tests:** History page + pagination + mobile responsive
  ```typescript
  // Time: 1 hour
  ```

- [ ] **Mobile verification:** Screenshot at 375px width
  ```bash
  ./node_modules/.bin/tsx scripts/screenshot.ts /history --width=375
  // Time: 0.5 hour
  ```

---

## API Response Shape

```typescript
// GET /api/league/my-history?page=1&limit=20

{
  success: true,
  data: {
    entries: [
      {
        id: 42,
        contestId: 6,
        contestName: "Hackathon Demo League",
        contestStartDate: "2026-02-24T12:00:00Z",
        contestEndDate: "2026-03-03T23:59:59Z",
        contestStatus: "finalized",
        teamName: "Alpha Pack",
        picks: [
          { id: 123, name: "vitalik.eth", tier: "S", isCaptain: true },
          // ... 4 more
        ],
        totalScore: 287.5,
        rank: 18,
        percentile: 96,
        scoreBreakdown: { activity: 67, engagement: 128, growth: 54, viral: 38.5 },
        tapestryContentId: "foresight-team-user123-contest6",
        createdAt: "2026-02-24T14:22:11Z"
      }
    ],
    pagination: { page: 1, limit: 20, total: 47, pages: 3 },
    stats: {
      totalContests: 47,
      bestRank: 3,
      bestScore: 421,
      averageRank: 142,
      topPercentile: 92
    }
  }
}
```

---

## Three Critical Constraints

| # | Constraint | Impact | Mitigation |
|---|-----------|--------|-----------|
| 1 | **Mobile 375px** | History card must stack vertically, no horiz scroll | Design HistoryEntryCard with `flex-col`, test at 375px |
| 2 | **Tapestry rate limit (25 req/sec)** | N contentId lookups = N+1 problem, 2s latency | Cache contentId in DB during team creation, make async non-blocking |
| 3 | **Join query complexity** | 20 entries × 5 picks = 100 rows, cartesian explosion | Use PostgreSQL JSON_AGG() or rehydrate in-memory |

---

## Files to Create/Modify

| File | Type | Status | Hours |
|------|------|--------|-------|
| `backend/src/api/league.ts` | Modify | Add endpoint | 2-3 |
| `backend/src/services/historyService.ts` | Create | New service | 1 |
| `backend/tests/api/league.history.test.ts` | Create | Tests | 1 |
| `frontend/src/pages/History.tsx` | Create | Main page | 3 |
| `frontend/src/components/HistoryEntryCard.tsx` | Create | Card component | 2 |
| `frontend/src/App.tsx` | Modify | Add route | 0.5 |
| `frontend/src/pages/Profile.tsx` | Modify | Add nav link | 0.5 |
| `frontend/tests/pages/History.test.tsx` | Create | Tests | 1 |

---

## Why This Matters for Judges

**Current Tapestry score:** 60% decorative, 40% load-bearing

**After History feature:** 70% load-bearing because:
- Users can verify past teams on Solana (Tapestry explorer link)
- Identity is anchored to Tapestry (can't fake history)
- Not just storage, but core feature (prove immutability)

**Judge reaction:** "Oh, this team built a real use case that only works because Tapestry is immutable. That's +8 points."

---

## Decision Matrix

| Question | Answer | Rationale |
|----------|--------|-----------|
| **New page, tab, or modal?** | New page `/history` | History deserves prominence, pagination needed, mobile-friendly |
| **Reuse existing endpoints?** | Yes, 100% | All data in `user_teams`, `team_picks`, `fantasy_contests` — just need to join |
| **Make Tapestry meaningful?** | Yes, verification links | Show contentId, link to Solana explorer, prove immutability |
| **Cache Tapestry lookups?** | Yes, in DB | Store `tapestry_content_id` when team created, not on-demand |
| **Optimize N+1 problem?** | JSON_AGG() | PostgreSQL aggregation, single query, no rehydration |

---

## Common Pitfalls to Avoid

1. ❌ **Don't fetch Tapestry contentId for each entry (blocking)**
   - ✅ Store it in DB during team creation

2. ❌ **Don't JOIN team_picks without GROUP BY (cartesian explosion)**
   - ✅ Use JSON_AGG() or fetch flat, rehydrate in JS

3. ❌ **Don't make History a 5th bottom nav item**
   - ✅ Link from Profile header ("View History")

4. ❌ **Don't assume users have score_breakdown (could be NULL)**
   - ✅ Check exists, fallback to empty object

5. ❌ **Don't show "Verify on Solana" if contentId is null**
   - ✅ Conditionally render link only if present

---

## Testing Checklist

- [ ] Backend: Empty history (0 entries) ✅
- [ ] Backend: Paginated history (25 entries, page 2) ✅
- [ ] Backend: Score breakdown included ✅
- [ ] Backend: Percentile calculated correctly ✅
- [ ] Backend: Tapestry contentId present (non-null) ✅
- [ ] Frontend: Sign-in prompt when not authenticated ✅
- [ ] Frontend: Entries load and display ✅
- [ ] Frontend: Pagination works (next/prev) ✅
- [ ] Frontend: "Verify on Solana" links are clickable ✅
- [ ] Mobile: 375px width, no horiz scroll ✅
- [ ] Mobile: Touch targets >= 44px ✅

---

## Done Checklist (Implementation Complete)

```bash
# Backend
✅ GET /api/league/my-history endpoint complete
✅ Tests passing (5/5)
✅ No N+1 queries (JSON_AGG verified)
✅ Tapestry contentId non-blocking
✅ TypeScript clean

# Frontend
✅ History page loads
✅ HistoryEntryCard renders correctly
✅ Mobile responsive at 375px
✅ Navigation integrated
✅ Tests passing
✅ No TypeScript errors
✅ Production build clean

# Verification
✅ Screenshot: /history page
✅ Screenshot: Mobile 375px
✅ E2E: Click "View History" → See past contests
✅ E2E: Click "Verify on Solana" → Opens explorer
```

---

## Timeline

**Day 1 (8 hours):**
- Backend API (2-3h)
- Frontend History page (3h)
- HistoryEntryCard (2h)

**Day 2 (5-8 hours):**
- Navigation integration (2h)
- Tests + mobile verification (2h)
- Iteration + polish (1-4h)

**Total: 13-16 hours**

---

## Post-Launch Ideas

1. Season stats (best week, consistency score)
2. Team comparison ("How did I draft in Contest 5 vs 7?")
3. Export to CSV (for spreadsheet geeks)
4. AI insights ("You draft Engagement teams, try Activity next week")
5. Rival tracking (follow + compare friends over time)
