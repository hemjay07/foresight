# League/Contest/Draft System - Comprehensive Overhaul Plan V2

> **Created:** December 29, 2025
> **Status:** PLANNING
> **Priority:** HIGH

---

## Executive Summary

After deep analysis of the codebase and user feedback, we have identified major UX issues that need immediate attention. This document outlines the problems, proposed solutions, and implementation plan.

---

## Part 1: Current State Analysis

### Data Model Summary (from codebase research)

| Relationship | Rule |
|--------------|------|
| User → Teams | ONE team per contest (unique constraint on user_id + contest_id) |
| Team → Influencers | 5 picks per team (or 3 for DAILY_FLASH) |
| Team → Captain | 1 captain per team (1.5x multiplier) |
| Team Editing | FREE before lock time, FS cost after (transfer system) |

### Route Inventory

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/` | Home.tsx | Landing page | ✅ Working |
| `/league` | League.tsx | Hub page with Vote + CTA | ✅ Working |
| `/draft` | LeagueUltra.tsx | Draft interface | ⚠️ UI issues |
| `/compete` | Compete.tsx | Rankings + Contests tabs | ✅ Working |
| `/compete?tab=contests` | Compete.tsx | Contest listing | ✅ Working |
| `/contest/:id` | ContestDetail.tsx | Contest detail + leaderboard | ✅ Working |
| `/contests` | ??? | Direct contests route | ❌ BROKEN (empty page) |

---

## Part 2: Identified Problems

### P1: Critical Bugs

1. **`/contests` route is broken** (empty page)
   - User navigated to `/contests` and got blank page
   - This route likely doesn't exist or isn't configured
   - **Fix:** Either create route or redirect to `/compete?tab=contests`

### P2: UX/UI Issues

2. **Captain selection UX is terrible**
   - Only indicator is a tiny crown icon
   - Users don't know HOW to select captain
   - No clear visual hierarchy for captain vs regular picks
   - **Fix:** Redesign captain selection with clear UI

3. **Draft page layout issues**
   - Cards are cluttered with too much data
   - Tier badges, prices, draft buttons all competing
   - "Your Squad" sidebar slots aren't visually clear
   - **Fix:** Simplify card design, improve visual hierarchy

4. **No "My Teams" view**
   - Users can have different teams in different contests
   - No single place to see all their teams
   - **Fix:** Add My Teams section to Profile or Compete page

5. **Team editing flow unclear**
   - Users don't know they CAN edit teams before lock
   - No clear "Edit Team" button on contest detail
   - **Fix:** Add visible edit button, show lock deadline

### P3: Information Architecture

6. **What happens after draft?**
   - User creates team → redirected to `/contest/:id`
   - But is team editable? How? Where?
   - **Fix:** Clear post-draft flow with editing options

7. **Point system not explained**
   - Users don't understand how scoring works
   - No in-app documentation
   - **Fix:** Add "How Scoring Works" explainer

---

## Part 3: Proposed Solutions

### Solution 1: Fix `/contests` Route

**Option A (Recommended):** Redirect to existing contests view
```typescript
// In App.tsx routes
{ path: '/contests', element: <Navigate to="/compete?tab=contests" replace /> }
```

**Option B:** Create dedicated ContestsHub page (more work, less value)

### Solution 2: Redesign Captain Selection

**Current State:**
- Tiny crown icon on hover
- No explanation of captain mechanic
- Users click randomly hoping something happens

**Proposed Design:**
```
┌─────────────────────────────────────────────────────┐
│  YOUR SQUAD (5/5)                    Budget: 23/150 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👑 CAPTAIN (1.5x Points)                    │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ [Empty - Click an influencer to set]    │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  TEAM MEMBERS                                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ 1   │ │ 2   │ │ 3   │ │ 4   │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  💡 Captain earns 1.5x points. Choose wisely!      │
│                                                     │
│  [Enter Contest]                                    │
└─────────────────────────────────────────────────────┘
```

**Captain Selection Flow:**
1. User picks 5 influencers (fills slots)
2. Captain slot at top is highlighted, shows "Click any pick to make captain"
3. Clicking a pick moves them to captain slot
4. Old captain moves to regular slot
5. Clear visual: Captain card has gold border + crown + "1.5x" badge

### Solution 3: Simplify Influencer Cards

**Current Card Problems:**
- Too much data visible at once
- Score, Draft button, Price, Tier all competing
- No clear visual hierarchy

**Proposed Card Design:**
```
┌──────────────────────────┐
│ [Avatar]  Name           │
│           @handle        │
│                          │
│  $28.00        [S-Tier]  │
│                          │
│  [+ Draft]               │
└──────────────────────────┘
```

**Hover/Expanded State:**
```
┌──────────────────────────┐
│ [Avatar]  Name           │
│           @handle        │
│                          │
│  Score: 1,234 pts        │
│  Followers: 1.2M         │
│  7d Engagement: +23%     │
│                          │
│  $28.00        [S-Tier]  │
│                          │
│  [+ Draft]               │
└──────────────────────────┘
```

### Solution 4: Add "My Teams" Section

**Location:** Profile page or dedicated section in Compete

**Design:**
```
┌─────────────────────────────────────────────────────┐
│  MY TEAMS                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Free League Week 1 2026                     │   │
│  │ Team: "Alpha Squad"        Rank: #12        │   │
│  │ Score: 2,345 pts          Status: Active    │   │
│  │                                              │   │
│  │ [View Contest] [Edit Team*]                 │   │
│  │ *Editable until Jan 6, 2026 12:00 PM       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Weekly Starter #23                          │   │
│  │ Team: "Degen Dreams"       Rank: #5         │   │
│  │ Score: 3,102 pts          Status: Locked    │   │
│  │                                              │   │
│  │ [View Contest]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Solution 5: Team Editing Flow

**Current:** No clear path to edit team after creation

**Proposed Flow:**
1. Contest Detail page shows team
2. If before lock time: Show "Edit Team" button prominently
3. Click Edit → Goes to `/draft?contestId=X&edit=true`
4. Draft page loads with existing picks pre-selected
5. User can swap picks (within budget)
6. "Update Team" button (instead of "Create Team")

### Solution 6: Scoring Explainer

**Add to:**
- Contest Detail page (collapsible "How Scoring Works")
- Draft page (tooltip on score column)

**Content:**
```
HOW SCORING WORKS

Your team earns points based on influencer activity:

📊 Activity (0-35 pts)
   Tweets, replies, and quote tweets

💬 Engagement (0-60 pts)
   Likes, retweets, replies received

📈 Growth (0-40 pts)
   New followers gained

🔥 Viral Bonus (0-25 pts)
   Posts with 10K+ engagement

👑 Captain Bonus
   Your captain earns 1.5x all points!

Scores update every 6 hours during contest.
```

---

## Part 4: Implementation Plan

### Phase 1: Critical Fixes (Day 1)

| Task | File | Effort |
|------|------|--------|
| Add `/contests` redirect | App.tsx | 5 min |
| Verify all routes work | - | 30 min |

### Phase 2: Captain Selection Redesign (Day 1-2)

| Task | File | Effort |
|------|------|--------|
| Redesign sidebar captain section | LeagueUltra.tsx | 2 hr |
| Add captain selection tutorial tooltip | LeagueUltra.tsx | 30 min |
| Add visual feedback on captain click | LeagueUltra.tsx | 1 hr |

### Phase 3: Card & Layout Improvements (Day 2)

| Task | File | Effort |
|------|------|--------|
| Simplify influencer card design | LeagueUltra.tsx | 2 hr |
| Improve visual hierarchy | LeagueUltra.tsx | 1 hr |
| Add hover/expand states | LeagueUltra.tsx | 1 hr |

### Phase 4: My Teams & Editing Flow (Day 3)

| Task | File | Effort |
|------|------|--------|
| Create My Teams section | Profile.tsx or new component | 2 hr |
| Add "Edit Team" to ContestDetail | ContestDetail.tsx | 1 hr |
| Handle edit mode in draft | LeagueUltra.tsx | 2 hr |

### Phase 5: Scoring Explainer (Day 3)

| Task | File | Effort |
|------|------|--------|
| Create ScoringExplainer component | New component | 1 hr |
| Add to ContestDetail | ContestDetail.tsx | 30 min |
| Add tooltips to draft | LeagueUltra.tsx | 30 min |

---

## Part 5: Questions to Resolve

### Q1: Where should "My Teams" live?
- **Option A:** Profile page (keeps Profile as user hub)
- **Option B:** Compete page (near contests)
- **Option C:** Dedicated `/teams` route

**Recommendation:** Option A (Profile) - Profile should be the user's home base

### Q2: What happens if user tries to edit locked team?
- Show message: "Team locked. Use transfers to swap 1 pick."
- Link to transfer system

### Q3: Mobile layout for captain selection?
- Stack vertically: Captain slot on top, then 4 member slots below
- Bottom sheet for card details

---

## Part 6: Success Criteria

- [ ] `/contests` route works (redirects or has content)
- [ ] Captain selection is obvious and discoverable
- [ ] Users can see all their teams in one place
- [ ] Edit team button visible before lock time
- [ ] Scoring system explained in-app
- [ ] Card design is clean and scannable
- [ ] Visual tests pass (screenshots match designs)

---

## Part 7: Research Needed

### Competitor Analysis
- [ ] DraftKings captain selection UI
- [ ] FanDuel lineup builder
- [ ] Sorare team management
- [ ] Sleeper draft interface

### Point System Review
- [ ] Current scoring weights fair?
- [ ] Captain multiplier balanced?
- [ ] Tier pricing reflects performance?

---

## Appendix: API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/league/team/create` | POST | Create new team |
| `/api/league/team/update` | PUT | Update team picks (before lock) |
| `/api/league/team/me` | GET | Get current user's team |
| `/api/v2/contests` | GET | List all contests |
| `/api/v2/me/entries` | GET | User's entries across contests |
| `/api/v2/contests/:id/my-entry` | GET | Single entry details |

---

*This plan will be implemented in phases with visual verification at each step.*
