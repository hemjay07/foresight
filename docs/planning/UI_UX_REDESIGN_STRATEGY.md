# CT Draft (Foresight) - Complete UI/UX Redesign Strategy

> **Version:** 1.0
> **Date:** December 27, 2025
> **Goal:** Transform into a $10M+ revenue product with world-class UX

---

## Executive Summary

After comprehensive analysis of the current application, I've identified critical issues in navigation, information architecture, user flows, and visual identity that must be addressed to achieve premium product status.

**Key Finding:** The app has solid functionality but suffers from feature sprawl, inconsistent user journeys, and a generic visual identity that doesn't differentiate it in the competitive crypto gaming space.

---

## Part 1: Current State Audit

### 1.1 Navigation Analysis

**Current Navigation (Layout.tsx):**
```
Home → Play (Contests) → CT Spotlight → XP Ranks → Profile
```

**Problems:**
1. "Play" and "CT Spotlight" are both game actions - confusing hierarchy
2. "XP Ranks" is buried but Leaderboard has 5 different ranking systems
3. No clear path for new users vs returning users
4. Quests and Referrals are hidden (not in nav)
5. Mobile navigation is a horizontal scroll nightmare

**Evidence:** Users land on /quests and see confusing "View Quests" loops

### 1.2 Page Purpose Analysis

| Page | Intended Purpose | Actual State | Problem |
|------|-----------------|--------------|---------|
| Home | Welcome + Daily action | Info dump | Too much content, no focus |
| LeagueUltra | Draft team | Complex 2-column | Works but overwhelming |
| ContestsHub | Browse contests | Contest list | Good, but disconnected from draft |
| Vote | Weekly voting | Standalone | Feels like separate app |
| Leaderboard | Rankings | 5 tabs (!) | Feature creep |
| Profile | User stats | Mixed content | Settings mixed with stats |
| Quests | Daily tasks | New, functional | Navigation dead-end |
| Referrals | Growth | Functional | Hidden from main nav |

### 1.3 User Flow Issues

**New User Journey (Current):**
```
Connect Wallet → Home (confusion) → Where do I start?
→ Maybe click Play? → Contest list (what's free?)
→ Enter contest → Draft page (budget? tiers?)
→ Somehow complete team → Submit → Now what?
```

**Pain Points:**
- No guided onboarding after wallet connect
- Multiple CTAs compete for attention
- User doesn't understand game mechanics before drafting
- Success moment (team submission) is underwhelming

**Returning User Journey (Current):**
```
Home → Check if contest is live → Navigate to Leaderboard
→ Find my rank (which tab?) → Back to Home
→ Check Quests (if remembered) → Vote? → Lost
```

**Pain Points:**
- No personalized "what to do today" guidance
- Information scattered across 3+ pages
- Daily actions (vote, quests) buried

### 1.4 Visual Identity Assessment

**Strengths:**
- Clean dark theme
- Consistent card patterns
- Good use of brand purple

**Weaknesses:**
- Generic "crypto dark mode" aesthetic
- No distinctive illustrations or mascot
- Tier colors (S/A/B/C) compete with FS tier colors
- No memorable visual hooks
- Hero sections are text-heavy, not visual

### 1.5 Mobile Experience

**Critical Issues:**
- Draft interface requires horizontal scroll
- 5-tab leaderboard doesn't fit
- Touch targets too small in dense areas
- No bottom navigation pattern

---

## Part 2: Proposed Information Architecture

### 2.1 New Navigation Structure

**Primary Navigation (5 items):**

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]   Dashboard   Arena   Compete   Progress   Profile  │
└─────────────────────────────────────────────────────────────┘
```

| Nav Item | Page | Purpose |
|----------|------|---------|
| **Dashboard** | / | Personalized home - today's actions, live stats |
| **Arena** | /arena | ALL game modes: Draft, Vote, Daily Challenges |
| **Compete** | /compete | Leaderboards + Active Contests (unified) |
| **Progress** | /progress | Quests, FS, Achievements, Level |
| **Profile** | /profile | Stats, Settings, Referrals (tabs) |

### 2.2 Page Hierarchy

```
Dashboard (/)
├── Hero: Today's Priority Action
├── My Active Contest Status (if any)
├── Quick Stats Row
├── Activity Feed (condensed)
└── CTA: What's New / Help

Arena (/arena)
├── Tab: Draft (weekly contest)
│   ├── Contest Info Banner
│   ├── Team Builder (responsive)
│   └── Submit/Lock Actions
├── Tab: Vote (CT Spotlight)
│   ├── This Week's Candidates
│   └── My Vote Status
└── Tab: Quick Play (future: daily challenges)

Compete (/compete)
├── My Standings Card (personal rank in all boards)
├── Tab: This Week (active contest leaderboard)
├── Tab: All-Time (Foresight Score)
├── Tab: Hall of Fame (seasonal winners)
└── Contest Browser (below tabs)

Progress (/progress)
├── Foresight Score Hero (big, prominent)
├── Tier Progress Bar
├── Tab: Quests (daily/weekly)
├── Tab: Achievements
├── Tab: History (FS transactions)
└── Founding Member Badge (if applicable)

Profile (/profile)
├── User Card (avatar, name, FS, tier)
├── Tab: Stats (all-time performance)
├── Tab: Teams (draft history)
├── Tab: Settings (account, socials)
└── Tab: Referrals (code, recruits)
```

### 2.3 Simplified User Flows

**New User (First Visit):**
```
Connect Wallet
→ Welcome Modal (explains game in 3 steps)
→ Dashboard shows "Start Your First Draft" hero
→ Click → Arena/Draft tab
→ Guided tour tooltip on budget/tiers
→ Build team → Submit
→ Success celebration → "Check back Sunday!"
→ Dashboard shows contest status
```

**Returning User (Daily):**
```
Open App → Dashboard
→ See "Today's Actions" card:
  - [ ] Cast your vote (5 min)
  - [ ] Complete daily quest (+20 FS)
  - [ ] Check team rank (#12, up 3)
→ One-click to each action
→ Complete → Return to Dashboard → Celebrate
```

**Contest Day (Sunday):**
```
Dashboard shows "Contest Ends Today!" banner
→ Check Compete tab for final standings
→ See winnings (if paid contest)
→ Notification: "New contest starting Monday"
→ CTA: "Draft for next week"
```

---

## Part 3: Page-by-Page Redesign Specs

### 3.1 Dashboard (Home)

**Current Problem:** Information overload, no personalization, unclear action priority

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ HERO SECTION (dynamic based on user state)                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [New User] "Welcome to Foresight"                       │ │
│ │ Build your first CT dream team and compete for ETH      │ │
│ │ [Start Draft →]                                         │ │
│ │─────────────────────────────────────────────────────────│ │
│ │ [Has Team] "Your Team is Live"                          │ │
│ │ Rank #12 (↑3) • 847 points • 2 days left               │ │
│ │ [View Leaderboard →]                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ TODAY'S ACTIONS                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ 🗳️ Vote      │ │ ✓ Quest     │ │ 📊 Check     │         │
│ │ Cast weekly  │ │ +20 FS      │ │ Rank #12     │         │
│ │ [Vote Now]   │ │ [Claim]     │ │ [Details]    │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                             │
│ LIVE THIS WEEK                        YOUR FORESIGHT        │
│ ┌─────────────────────────┐          ┌─────────────────────┐│
│ │ 🔥 Top Performer        │          │ 2,450 FS            ││
│ │ @cobie +127 pts today  │          │ Silver Tier (→Gold) ││
│ │                         │          │ Rank #234           ││
│ │ 📈 Your Best Pick      │          │ [View Progress →]   ││
│ │ @naval +89 pts         │          └─────────────────────┘│
│ └─────────────────────────┘                                 │
│                                                             │
│ RECENT ACTIVITY (3 items max)                               │
│ • Your team moved up 3 spots                                │
│ • @CryptoHayes gained 50k followers                        │
│ • Weekly quest completed                                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. Dynamic hero based on user state
2. "Today's Actions" - clear, completable tasks
3. Live stats condensed to essential info
4. FS prominent but not overwhelming
5. Activity feed trimmed to 3 items

### 3.2 Arena (Game Hub)

**Current Problem:** Draft and Vote are separate pages, inconsistent UX

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ ARENA                                     [Contest Info ⓘ] │
│                                                             │
│ ┌─────────┬─────────┬─────────────┐                        │
│ │  Draft  │  Vote   │ Quick Play  │  (tabs)                │
│ └─────────┴─────────┴─────────────┘                        │
│                                                             │
│ [DRAFT TAB - Default]                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ WEEKLY CONTEST: Dec 23-29 • Prize: 0.5 ETH • 47 entries │ │
│ │ Budget: 78/150 remaining • Team: 3/5 picks              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─── YOUR TEAM ───────────┐  ┌─── AVAILABLE ─────────────┐ │
│ │                         │  │ 🔍 Search   [Filter ▼]    │ │
│ │ 1. @cobie (S) $28      │  │                           │ │
│ │ 2. @naval (C) $12      │  │ ┌─────────────────────┐   │ │
│ │ 3. @APompliano (A) $22 │  │ │ @CryptoHayes (S)    │   │ │
│ │ 4. ─ empty ─           │  │ │ 782k followers • $28│   │ │
│ │ 5. ─ empty ─           │  │ │ [+ Add]             │   │ │
│ │                         │  │ └─────────────────────┘   │ │
│ │ [Clear All]            │  │ ┌─────────────────────┐   │ │
│ └─────────────────────────┘  │ │ @VitalikButerin (B) │   │ │
│                              │ │ 5.8M followers • $18│   │ │
│ ┌─────────────────────────┐  │ │ [+ Add]             │   │ │
│ │ [Lock Team & Enter] 🔒  │  │ └─────────────────────┘   │ │
│ └─────────────────────────┘  └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. Single "Arena" page with tabbed game modes
2. Contest info always visible
3. Team builder side-by-side (responsive: stacks on mobile)
4. Single CTA: "Lock Team & Enter"
5. Vote tab identical pattern but for voting

### 3.3 Compete (Leaderboards)

**Current Problem:** 5 tabs is overwhelming, personal rank buried

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ COMPETE                                                     │
│                                                             │
│ YOUR STANDINGS                                              │
│ ┌───────────┬───────────┬───────────┬───────────┐          │
│ │ This Week │ All-Time  │ Voting    │ Referrals │          │
│ │ #12 (↑3)  │ #234      │ #8        │ #156      │          │
│ └───────────┴───────────┴───────────┴───────────┘          │
│                                                             │
│ ┌───────────┬───────────┬───────────────┐                  │
│ │ This Week │ All-Time  │ Hall of Fame  │ (tabs)           │
│ └───────────┴───────────┴───────────────┘                  │
│                                                             │
│ [THIS WEEK TAB]                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Weekly Contest: Dec 23-29 • 47 entries • Ends in 2d 4h │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ │ #  │ Player          │ Team Score │ Best Pick         │ │
│ ├────┼─────────────────┼────────────┼───────────────────┤ │
│ │ 🥇 │ whale.eth       │ 1,247      │ @cobie +312       │ │
│ │ 🥈 │ degen_king      │ 1,189      │ @naval +298       │ │
│ │ 🥉 │ alpha_chad      │ 1,156      │ @CZ +276          │ │
│ │ 4  │ ...             │ ...        │ ...               │ │
│ │ 12 │ ★ YOU           │ 847        │ @APompliano +201  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ACTIVE CONTESTS                                             │
│ ┌───────────────────┐ ┌───────────────────┐                │
│ │ Free League       │ │ Weekly Pro        │                │
│ │ 47/100 entries    │ │ 0.1 ETH • 23 in   │                │
│ │ [Enter Free]      │ │ [Enter $20]       │                │
│ └───────────────────┘ └───────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. "Your Standings" card shows personal rank in all boards instantly
2. Only 3 main tabs (This Week, All-Time, Hall of Fame)
3. Contest browser integrated below
4. User's row highlighted in leaderboard

### 3.4 Progress (FS + Quests)

**Current Problem:** FS shown 3 places, quests hidden, no sense of progression

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS                                                    │
│                                                             │
│ FORESIGHT SCORE                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │         ⭐ 2,450 FS                                     │ │
│ │         ══════════════════░░░░░░░ Silver → Gold        │ │
│ │         2,550 more to Gold tier (1.1x multiplier)      │ │
│ │                                                         │ │
│ │  Rank #234 All-Time  •  1.25x Active Boost (42d left) │ │
│ │                                                         │ │
│ │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │ │
│ │  │ Fantasy │  │ Voting  │  │ Quests  │  │ Social  │   │ │
│ │  │ 1,200   │  │ 450     │  │ 600     │  │ 200     │   │ │
│ │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────┬──────────────┬──────────────┐                  │
│ │ Quests  │ Achievements │ FS History   │ (tabs)           │
│ └─────────┴──────────────┴──────────────┘                  │
│                                                             │
│ [QUESTS TAB]                                                │
│ DAILY (resets in 6h)                    2/3 complete       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Log in today                           +10 FS [Done] │ │
│ │ ✅ Cast your vote                         +20 FS [Done] │ │
│ │ ⬜ Check leaderboard                      +10 FS [Go →] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ WEEKLY (resets Monday)                  1/4 complete       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Enter a contest                       +50 FS [Done]  │ │
│ │ ⬜ Finish top 50%                        +100 FS        │ │
│ │ ⬜ Refer a friend                        +200 FS        │ │
│ │ ⬜ Share on Twitter                      +50 FS [Go →]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. FS is THE hero of this page - big, proud, progress-focused
2. Breakdown shows where FS comes from
3. Quests feel achievable with clear progress
4. History tab for transparency

### 3.5 Profile (Consolidated)

**Current Problem:** Stats scattered, settings mixed in, referrals hidden

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ PROFILE                                          [Share 📤] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [Avatar]  whale_trader.eth                             │ │
│ │            ⭐ 2,450 FS • Silver Tier                    │ │
│ │            🏆 Founding Member #247                       │ │
│ │            Member since Dec 2025                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────┬───────────┬───────────┬───────────┐          │
│ │   Stats   │   Teams   │  Settings │ Referrals │ (tabs)   │
│ └───────────┴───────────┴───────────┴───────────┘          │
│                                                             │
│ [STATS TAB]                                                 │
│ ┌───────────┬───────────┬───────────┬───────────┐          │
│ │ Contests  │ Best Rank │ Win Rate  │ Earnings  │          │
│ │    12     │    #3     │   42%     │  0.15 ETH │          │
│ └───────────┴───────────┴───────────┴───────────┘          │
│                                                             │
│ ACHIEVEMENTS (8/24 unlocked)                                │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│ │ 🏆  │ │ 🔥  │ │ 👑  │ │ ⭐  │ │ 🎯  │ ...               │
│ │First│ │7-day│ │Top10│ │Found│ │Vote │                   │
│ │ Win │ │Strk │ │     │ │ Mem │ │ 10x │                   │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │
│                                                             │
│ [REFERRALS TAB]                                             │
│ Your Code: WHALE247                    [Copy] [Share]      │
│ Quality Score: 87/100 ⭐                                    │
│ Recruited: 5 players (3 active)                            │
│ Earnings: +500 FS from referrals                           │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. User card prominent with key identity info
2. 4 tabs consolidate all user-related pages
3. Referrals finally have a home
4. Share button enables shareable profile card

---

## Part 4: Visual Identity Refresh

### 4.1 Brand Personality

**Current:** Generic dark crypto theme
**Proposed:** "Confident Expert" personality

**Attributes:**
- Knowledgeable but approachable
- Competitive but fair
- Premium but not pretentious
- Crypto-native but not intimidating

**Voice Examples:**
- Current: "Complete quests to earn Foresight Score"
- New: "Level up your game. Your score, your rep, your way."

### 4.2 Color Refinement

**Primary Palette (keep):**
- Brand: #6172F3 (vibrant blue-purple)
- Background: #0A0A0F (near black)
- Surface: #171717 (cards)

**Accent Updates:**
- Success: #10B981 → #22C55E (brighter green)
- Gold tier: Add subtle shimmer/gradient
- Diamond tier: Add holographic effect

**New Addition:**
- Highlight gradient: `from-brand-500 via-purple-500 to-pink-500`
- Use for hero CTAs, tier achievements

### 4.3 Illustrations & Iconography

**Proposed Additions:**
1. **Empty state illustrations** - Custom, not generic
2. **Achievement badges** - Unique designs per badge
3. **Tier emblems** - Distinctive icons (Bronze shield → Diamond crystal)
4. **Mascot consideration** - Subtle brand character for celebrations

### 4.4 Animation & Micro-interactions

**Add:**
- Number count-up on FS changes
- Confetti on achievements (already exists, keep)
- Subtle pulse on CTAs
- Smooth tab transitions
- Card hover lift effect

---

## Part 5: Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create new navigation structure
- [ ] Build Dashboard page (new Home)
- [ ] Consolidate Arena page (merge Draft + Vote)
- [ ] Update routing in App.tsx

### Phase 2: Core Pages (Week 2)
- [ ] Build Compete page (unified leaderboards)
- [ ] Build Progress page (FS + Quests hero)
- [ ] Update Profile with tab structure
- [ ] Remove redundant pages (Vote.tsx, UserStats.tsx, XPLeaderboard.tsx)

### Phase 3: Components (Week 3)
- [ ] Create TodayActions component
- [ ] Create UserStandingsCard component
- [ ] Create FSHero component
- [ ] Update all loading/empty states

### Phase 4: Mobile (Week 4)
- [ ] Add bottom navigation for mobile
- [ ] Make Draft interface responsive
- [ ] Touch-optimize all interactions
- [ ] Test on real devices

### Phase 5: Polish (Week 5)
- [ ] Add animations and transitions
- [ ] Create custom illustrations
- [ ] Refine copywriting throughout
- [ ] Performance optimization

---

## Part 6: Success Metrics

| Metric | Current (Est.) | Target | Measurement |
|--------|---------------|--------|-------------|
| Onboarding completion | ~50% | >80% | Track wallet connect → first draft |
| Daily active users | Unknown | +50% | PostHog/Analytics |
| Quest completion | Unknown | >60% | Backend logs |
| Mobile sessions | ~20% | >50% | Analytics |
| Bounce rate (Home) | ~40% | <25% | Analytics |
| Time to first action | ~60s | <20s | Analytics |

---

## Appendix: Files to Modify/Create

### Create New:
- `pages/Dashboard.tsx` (new home)
- `pages/Arena.tsx` (unified game hub)
- `pages/Compete.tsx` (leaderboards + contests)
- `pages/Progress.tsx` (FS + quests)
- `components/TodayActions.tsx`
- `components/UserStandingsCard.tsx`
- `components/FSHero.tsx`
- `components/BottomNav.tsx` (mobile)

### Modify:
- `components/Layout.tsx` (new nav)
- `pages/Profile.tsx` (tab structure)
- `App.tsx` (new routes)
- `index.css` (new tokens)

### Archive/Remove:
- `pages/Home.tsx` → Archive
- `pages/Vote.tsx` → Merge into Arena
- `pages/UserStats.tsx` → Merge into Profile
- `pages/XPLeaderboard.tsx` → Merge into Compete
- `pages/ContestsHub.tsx` → Merge into Compete
- `pages/Quests.tsx` → Merge into Progress

---

*This document should be updated as implementation progresses.*
