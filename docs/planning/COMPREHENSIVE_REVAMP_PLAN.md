# Comprehensive Revamp Plan

> **Created:** December 29, 2025
> **Priority:** CRITICAL - Must fix before launch
> **Status:** PLANNING

---

## Part 1: GAME DESIGN FIXES (Critical)

### Problem: Salary Cap Doesn't Work

**Current broken math:**
```
Budget: 150 points
S-tier: $28
5 × S-tier = 140 points ✅ CAN AFFORD ALL ELITE PLAYERS

This defeats the entire purpose of salary caps!
```

**How DraftKings/FanDuel work:**
- Salary cap forces you to pick 1-2 elite + fill with value plays
- Elite players cost 1.5-2x the average slot cost
- You CANNOT stack all elite players

**The fix - Option A: Increase S-tier prices**
```
Budget: 150 (keep)
Team size: 5
Average per slot: 30

NEW PRICING:
- S-tier: $38-45 (avg $42) - 1.4x average
- A-tier: $28-35 (avg $32) - 1.07x average
- B-tier: $22-28 (avg $25) - 0.83x average
- C-tier: $15-20 (avg $18) - 0.6x average
```

**Validation of new pricing:**
| Team Composition | Cost | Valid? |
|------------------|------|--------|
| 5 S-tier | 5 × 42 = 210 | ❌ Over budget |
| 3 S + 2 C | 126 + 36 = 162 | ❌ Over budget |
| 2 S + 3 B | 84 + 75 = 159 | ❌ Over budget |
| 2 S + 2 B + 1 C | 84 + 50 + 18 = 152 | ❌ Slightly over |
| 2 S + 1 B + 2 C | 84 + 25 + 36 = 145 | ✅ Works! |
| 1 S + 2 A + 2 B | 42 + 64 + 50 = 156 | ❌ Over budget |
| 1 S + 2 A + 1 B + 1 C | 42 + 64 + 25 + 18 = 149 | ✅ Works! |
| 1 S + 1 A + 2 B + 1 C | 42 + 32 + 50 + 18 = 142 | ✅ Works! |
| 5 A-tier | 5 × 32 = 160 | ❌ Over budget |
| 4 A + 1 C | 128 + 18 = 146 | ✅ Works! |
| 3 A + 2 B | 96 + 50 = 146 | ✅ Works! |
| 5 B-tier | 5 × 25 = 125 | ✅ Easy (value play) |

**This creates real trade-offs:**
- Max 2 S-tier players (with cheap supports)
- Can't stack 5 A-tier either
- Must balance stars vs depth
- Multiple valid strategies

### Implementation Steps

1. **Database migration:** Update influencer prices
2. **Recalculate all influencer prices** based on their tier
3. **Add price variation within tiers** (not all S-tier same price)
4. **Update frontend** to reflect new prices

### Price Variation Within Tiers

More realistic - prices should vary based on performance:

| Tier | Price Range | Example |
|------|-------------|---------|
| S | $38-48 | Top performers $48, others $38 |
| A | $28-36 | Top A-tier $36, others $28 |
| B | $22-28 | Based on engagement |
| C | $15-22 | Entry level |

---

## Part 2: UI/UX COMPLETE REVAMP

### Design Philosophy

**Before:** Generic dark theme, no clear hierarchy
**After:** Command center aesthetic, clear information architecture

### Page-by-Page Analysis

---

### 2.1 HOME PAGE (`/`)

**Current problems:**
- No clear primary action
- Information overload
- Doesn't guide new users

**New layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Home | League | Compete | Intel | Profile    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           HERO BANNER (40vh)                         │   │
│  │                                                      │   │
│  │    "Fantasy League for Crypto Twitter"               │   │
│  │                                                      │   │
│  │    [Formation Preview - 5 silhouettes]               │   │
│  │                                                      │   │
│  │    [ Enter Free League ]  [ How It Works ]          │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  ACTIVE CONTESTS │  │  QUICK STATS                  │   │
│  │                  │  │                               │   │
│  │  Free League     │  │  Your Rank: #12              │   │
│  │  ⏱ 10h left      │  │  Foresight Score: 311 FS     │   │
│  │  2 entries       │  │  Teams: 2 active             │   │
│  │                  │  │                               │   │
│  │  [Enter Now]     │  │  [View Profile →]            │   │
│  └──────────────────┘  └──────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TRENDING ON CT (3 viral tweets)                     │   │
│  │  [Tweet 1] [Tweet 2] [Tweet 3]                       │   │
│  │                                        [View Intel →]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key changes:**
- Hero with formation preview (visual differentiator)
- Clear CTA: "Enter Free League"
- Quick stats for returning users
- Intel preview to drive engagement

---

### 2.2 LEAGUE PAGE (`/league`)

**Current:** Hub page with two cards
**New:** Draft interface entry point

```
┌─────────────────────────────────────────────────────────────┐
│                         CT LEAGUE                            │
│              Draft your dream team, compete for prizes       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────────┐ │
│  │                    │  │                                │ │
│  │   CT LEAGUE        │  │   CT SPOTLIGHT                 │ │
│  │   Draft Mode       │  │   Weekly Vote                  │ │
│  │                    │  │                                │ │
│  │   • 5 influencers  │  │   • Vote for top CT            │ │
│  │   • $150 budget    │  │   • Earn +20 FS                │ │
│  │   • Weekly scoring │  │   • Results Sundays            │ │
│  │                    │  │                                │ │
│  │   [Start Draft →]  │  │   [Vote Now →]                 │ │
│  │                    │  │                                │ │
│  └────────────────────┘  └────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  YOUR ACTIVE TEAMS                                    │   │
│  │                                                       │   │
│  │  Team 1: Free League Week 1    Score: -- pts         │   │
│  │  [cobie] [ansem] [hayes] [gcr] [hsaka]   [Edit]     │   │
│  │                                                       │   │
│  │  Team 2: Weekly Starter        Score: -- pts         │   │
│  │  [...]                                    [Edit]     │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 DRAFT PAGE (`/draft`)

**Current problems:**
- Tiny captain crown (hard to see/click)
- Overwhelming information
- Sidebar position inconsistent
- No clear budget visualization

**New layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  FREE LEAGUE - WEEK 1 2026                    Budget: $142 / $150   │
│  ⏱ Locks in 10h 36m                           [Save Draft] [Submit] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  YOUR TEAM (Select Captain)                                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                 │ │
│  │     ┌─────────┐                                                │ │
│  │     │ CAPTAIN │  ← Click any player to make captain            │ │
│  │     │  ????   │     Captain scores 1.5x points                 │ │
│  │     │  +50%   │                                                │ │
│  │     └─────────┘                                                │ │
│  │                                                                 │ │
│  │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐                   │ │
│  │  │ Slot 1│  │ Slot 2│  │ Slot 3│  │ Slot 4│                   │ │
│  │  │  ???  │  │  ???  │  │  ???  │  │  ???  │                   │ │
│  │  │  $--  │  │  $--  │  │  $--  │  │  $--  │                   │ │
│  │  └───────┘  └───────┘  └───────┘  └───────┘                   │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  AVAILABLE INFLUENCERS                     [Search] [Filter: All ▼] │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  S-TIER ($38-48)                                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │@cobie    │ │@ansem    │ │@hayes    │ │@gcr      │          │ │
│  │  │ $45      │ │ $42      │ │ $42      │ │ $38      │          │ │
│  │  │ [+Add]   │ │ [+Add]   │ │ [+Add]   │ │ [+Add]   │          │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │
│  │                                                                │ │
│  │  A-TIER ($28-36)                                               │ │
│  │  [Cards...]                                                    │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
1. **Captain slot is DEDICATED and PROMINENT**
   - Separate from other 4 slots
   - Visually distinct (larger, different style)
   - Shows "+50% bonus" clearly

2. **Budget bar** at top - always visible

3. **Tier sections** clearly separated with price ranges

4. **Simplified cards** - name, price, add button only

5. **Formation layout** - visual football pitch arrangement

---

### 2.4 CAPTAIN SELECTION UX (Critical Fix)

**Current:** Tiny crown icon on card corner
**Problem:**
- Users don't know captain exists
- Hard to click
- No explanation of benefit

**New approach:**

```
STEP 1: Draft 5 players normally

STEP 2: After 5th pick, modal appears:

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              🏆 SELECT YOUR CAPTAIN 🏆                       │
│                                                              │
│     Your captain earns 1.5x points!                         │
│     Choose wisely - pick your highest performer.            │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ @cobie  │ │ @ansem  │ │ @hayes  │ │ @gcr    │ │ @hsaka  ││
│  │  S-tier │ │  S-tier │ │  S-tier │ │  S-tier │ │  S-tier ││
│  │         │ │         │ │         │ │         │ │         ││
│  │ [Pick]  │ │ [Pick]  │ │ [Pick]  │ │ [Pick]  │ │ [Pick]  ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                              │
│                    [ Skip - Pick Later ]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

ALTERNATIVE: Dedicated captain slot at top

Visual hierarchy:
- Captain slot is LARGER (1.5x)
- Different border color (gold)
- Crown icon is BIG not tiny
- Shows "1.5x" multiplier clearly
```

---

### 2.5 COMPETE PAGE (`/compete`)

**Current:** Rankings and Contests tabs
**Keep but improve:**

```
┌─────────────────────────────────────────────────────────────┐
│                         COMPETE                              │
│              Rankings, leaderboards & contests               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Rankings]  [Contests (2)]                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  OPEN CONTESTS                                          ││
│  │                                                          ││
│  │  ┌─────────────────────┐  ┌─────────────────────────┐  ││
│  │  │ FREE LEAGUE         │  │ WEEKLY STARTER          │  ││
│  │  │ Week 1 2026         │  │ Week 1 2026             │  ││
│  │  │                     │  │                          │  ││
│  │  │ Entry: FREE         │  │ Entry: 0.002 ETH        │  ││
│  │  │ Prize: 0.05 ETH     │  │ Prize: Pool-based       │  ││
│  │  │ Players: 2          │  │ Players: 0              │  ││
│  │  │ ⏱ 10h left          │  │ ⏱ 10h left              │  ││
│  │  │                     │  │                          │  ││
│  │  │ [Enter Free]        │  │ [Enter 0.002 ETH]       │  ││
│  │  └─────────────────────┘  └─────────────────────────┘  ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.6 INTEL PAGE (`/intel`)

**Current:** Good foundation, just fixed the filter bug
**Improvements needed:**

1. Add "Viral Highlights" section at top
2. Better empty state when no tweets
3. "My Team" filter should be more prominent

---

### 2.7 PROFILE PAGE (`/profile`)

**Current:** Hub with 3 cards
**Add:** My Teams section, edit capability

```
┌─────────────────────────────────────────────────────────────┐
│                       YOUR PROFILE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OVERVIEW                                             │   │
│  │                                                       │   │
│  │  Foresight Score: 311 FS     Rank: #1 / 2            │   │
│  │  League: BRONZE              Wins: 1                  │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MY TEAMS                                             │   │
│  │                                                       │   │
│  │  Free League - Week 1 2026          Score: -- pts    │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │   │
│  │  │cobie│ │ansem│ │hayes│ │gcr  │ │hsaka│            │   │
│  │  │ 👑  │ │     │ │     │ │     │ │     │            │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │   │
│  │  [View Contest] [Edit Team]                          │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Stats & XP │  │ Quests     │  │ Settings   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: IMPLEMENTATION ORDER

### Phase 1: Game Design Fixes (CRITICAL)
1. [ ] Fix influencer pricing (S: $38-48, A: $28-36, B: $22-28, C: $15-22)
2. [ ] Add price variation within tiers based on performance
3. [ ] Update database with new prices
4. [ ] Verify budget constraints work

### Phase 2: Captain Selection UX
1. [ ] Create dedicated captain slot in formation
2. [ ] Add captain selection modal after drafting 5
3. [ ] Make captain visually distinct (gold border, crown, 1.5x label)

### Phase 3: Layout Revamp
1. [ ] Home page - hero with formation preview
2. [ ] Draft page - new layout with clear budget
3. [ ] Profile page - add My Teams section

### Phase 4: Polish
1. [ ] Consistent card designs
2. [ ] Better empty states
3. [ ] Loading states
4. [ ] Mobile optimization

---

## Validation Checklist

Before launch, verify:

- [ ] Cannot draft 5 S-tier players (budget exceeded)
- [ ] Cannot draft 5 A-tier players (budget exceeded)
- [ ] Can draft balanced teams (2S + 2B + 1C works)
- [ ] Captain selection is obvious and easy
- [ ] New users understand the game in <30 seconds
- [ ] Edit team works before lock
- [ ] Score breakdown is accessible

---

## Questions for User

1. **Budget:** Keep 150 or change to 100 (simpler math)?
2. **Price variation:** Fixed prices per tier or variable based on performance?
3. **Captain:** Modal after drafting OR dedicated slot from start?
4. **Timeline:** Which phase is most urgent?

---

*Plan created December 29, 2025. Awaiting approval before implementation.*
