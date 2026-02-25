# Profile Redesign — Before/After Comparison

> **Format:** Visual wireframes comparing current vs. proposed
> **Use this:** To get buy-in before implementation

---

## MOBILE (375px) — BEFORE vs. AFTER

### BEFORE (Current)

```
┌──────────────────────────────────────┐
│  Foresight    Home Compete Feed ...   │ ← Top nav (fixed)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ ┌────────────────────────────────┐   │ ← HEADER
│ │ [Avatar]  You        [Share][⚙]│   │   70px height
│ │ 0x123...9abc                   │   │   Avatar: w-20
│ │ ⭐ NOVICE  🔥 3 day streak     │   │
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ ┌────────────────────────────────┐   │ ← TODAY'S ACTIONS (3 CARDS)
│ │ 🏆  Enter Contest   [Free FS]  │   │   ~100px section
│ │ Draft your team & compete      │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ 🔥  Daily Quests        [0/3 ✓]│   │
│ │ ▒▒▒░░░░░░░░░░░░░        │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ 🏆  Check Standings            │   │
│ │ View leaderboards              │   │
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ ┌────────────────────────────────┐   │ ← FORESIGHT SCORE (Large card)
│ │ Foresight Score: 1,135 FS      │   │   ~180px section
│ │ SILVER • Founder #18           │   │   Uses GOLD color
│ │                                │   │
│ │ This Week: #1 (1,135 pts)      │   │
│ │ Season: #2 | All-Time: #8      │   │
│ │                                │   │
│ │ ☐ 1.58x Active • 87 days      │   │
│ │                                │   │
│ │ Progress to GOLD               │   │
│ │ ████████░░░░░ 3,865 to go     │   │
│ │ [Leaderboard] [Earn More]      │   │
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ ┌────────────────────────────────┐   │ ← EXPERIENCE LEVEL (Separate card)
│ │ ☐ Experience Level             │   │   ~140px section
│ │ NOVICE                         │   │   Uses CYAN color
│ │ 0 Total XP                     │   │ (COLOR CONFLICT! Gold + Cyan together)
│ │                                │   │
│ │ Progress to APPRENTICE         │   │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │   (0 XP looks like error)
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ ┌────────────────────────────────┐   │ ← QUICK LINKS (3 MORE CARDS)
│ │ 🎮  Browse Contests            │   │   ~120px section
│ │ Join leagues & compete → │   │   (Redundant nav)
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ 🔥  Quests                     │   │
│ │ Complete daily tasks → │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ 📤  Referrals                  │   │
│ │ Invite friends, earn FS → │   │
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ ┌────────────────────────────────┐   │ ← TAPESTRY (Buried at bottom!)
│ │ ✓ Live on Solana               │   │   ~200px section
│ │ Your on-chain identity & proof │   │   (Users might not see this)
│ │                                │   │
│ │ 0 Followers | 3 Following      │   │
│ │ 2 Teams on-chain               │   │
│ │                                │   │
│ │ Your 2 draft teams are         │   │
│ │ permanently recorded on Solana │   │
│ │ via Tapestry Protocol...       │   │
│ │                                │   │
│ │ [View on Solana] [History] →   │   │
│ └────────────────────────────────┘   │
│ (Scroll required)                    │
│                                      │
│ Overview | Teams | History | ... │   │ ← TABS
│                                      │
│ ┌────────────────────────────────┐   │
│ │ (More tab content below)       │   │
│ └────────────────────────────────┘   │

TOTAL SCROLLABLE HEIGHT: ~1,200px
USER SEES WITHOUT SCROLLING: 1.5 card heights
KEY DIFFERENTIATOR (TAPESTRY): Hidden at bottom!
```

### AFTER (Proposed)

```
┌──────────────────────────────────────┐
│  Foresight    Home Compete Feed ...   │ ← Top nav (fixed)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ [Avatar]  You    [Share] [⚙]        │ ← HEADER (COMPACT!)
│ 0x123...9abc • Lvl 3 • 3d streak    │   40px height
│                                      │   Avatar: w-14
└──────────────────────────────────────┘
(Scroll not required for header)

┌──────────────────────────────────────┐
│ ┌──────────────────────────────┐    │ ← PLAYER STATUS (Merged FS+XP)
│ │ Foresight Score              │    │   ~180px section
│ │ 1,135 FS                     │    │   Single card
│ │ SILVER • Founder #18         │    │   ONE focal point
│ │                              │    │
│ │ This Week: #1 (1,135 pts)    │    │
│ │ Season: #2 | All-Time: #8    │    │
│ │                              │    │
│ │ ☐ 1.58x Active • 87 days    │    │ ← Boost visible (good sign!)
│ │                              │    │
│ │ Progress to GOLD             │    │
│ │ ████████░░░░░ 3,865 to go   │    │
│ │ 127 XP • Level 3 (NOVICE)    │    │ ← XP secondary (not competing)
│ │                              │    │
│ │ [Leaderboard] [Earn More]    │    │
│ └──────────────────────────────┘    │
│ (Scroll not required for this)       │
│                                      │
│ ┌──────────────────────────────┐    │ ← TAPESTRY (PROMOTED!)
│ │ ✓ Live on Solana             │    │   ~180px section
│ │ Your on-chain identity       │    │   (Users see FIRST)
│ │                              │    │   (Judges see EARLY)
│ │ 0 followers • 3 following    │    │
│ │ 2 teams locked on-chain      │    │
│ │                              │    │
│ │ Your 2 teams are permanently │    │
│ │ recorded on Solana via       │    │
│ │ Tapestry Protocol.           │    │
│ │                              │    │
│ │ [View on Solana] [History] → │    │
│ └──────────────────────────────┘    │
│ (Scroll not required for this)       │
│                                      │
│ ┌──────────────────────────────┐    │ ← YOUR TEAM CARD
│ │ Your Team                    │    │   ~180px section
│ │                              │    │
│ │ [Formation: 1 captain + 4]   │    │
│ │                              │    │
│ │ Team Name                    │    │
│ │ 142 pts • Rank #3 • $150/$150│    │
│ │ [Edit Draft] [Share Team]    │    │
│ └──────────────────────────────┘    │
│ (Scroll not required for this)       │
│                                      │
│ Overview | Teams | History | ... │   │ ← TABS
│                                      │
│ ┌────────────────────────────────┐   │
│ │ (Tab content below)            │   │
│ └────────────────────────────────┘   │

TOTAL SCROLLABLE HEIGHT: ~600px (50% less!)
USER SEES WITHOUT SCROLLING: 3 full card heights
KEY DIFFERENTIATOR (TAPESTRY): Visible on first screen!
MESSAGING: Clean, clear story (Status → Proof → Team)
```

### Key Differences (Mobile)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Header height | 70px | 40px | -43% |
| Cards on first screen | 1.5 | 3 | 2x more visible |
| Competing color focus | 2 (gold + cyan) | 1 (gold only) | Clearer hierarchy |
| Tapestry visibility | Scrolled off | Immediate | Critical for judges |
| Redundant nav cards | 6 | 0 | Cleaner focus |
| Total scroll height | ~1,200px | ~600px | -50% |

---

## DESKTOP (1024px+) — BEFORE vs. AFTER

### BEFORE (Current)

```
┌──────────────────────────────────────────────────────────────────┐
│ Foresight    Home   Compete   Feed   Profile      [Sign In]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [Avatar M]  You          [Your Profile]  [Share] [Settings]  │ │
│ │             0x123...9abc  NOVICE • 3d streak                 │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [TODAY'S ACTIONS GRID - 3 COLUMNS]                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │ 🏆 Enter       │ │ 🔥 Daily        │ │ 🏆 Check        │   │
│ │    Contest     │ │    Quests       │ │    Standings    │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │ ← FS SCORE
│ │ Foresight Score: 1,135 FS                                    │ │   (Full width)
│ │ SILVER • Founder #18                                         │ │
│ │ This Week: #1 | Season: #2 | All-Time: #8                   │ │
│ │ Progress to GOLD: ████████░░░ 3,865 to go                   │ │
│ │ [Leaderboard] [Earn More]                                    │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │ ← XP CARD
│ │ ☐ Experience Level: NOVICE  0 Total XP                      │ │   (Full width)
│ │ Progress to APPRENTICE: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [QUICK LINKS GRID - 3 COLUMNS]                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │ 🎮 Browse      │ │ 🔥 Quests       │ │ 📤 Referrals    │   │
│ │    Contests    │ │                 │ │                 │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │ ← TAPESTRY
│ │ ✓ Live on Solana                                             │ │   (Buried)
│ │ Your on-chain identity & proof on Solana                     │ │
│ │ 0 Followers | 3 Following | 2 Teams on-chain                 │ │
│ │ Your 2 draft teams are permanently recorded on Solana...     │ │
│ │ [View on Solana] [Contest history] →                         │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Overview | Teams (2) | History | Watchlist (5) | Stats          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### AFTER (Proposed)

```
┌──────────────────────────────────────────────────────────────────┐
│ Foresight    Home   Compete   Feed   Profile      [Sign In]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [Avatar L] You           [Your Profile]    [Share] [Settings]│ │
│ │            0x123...9abc   Level 3 • 3d streak                │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────┐  ┌────────────────────────┐ │
│ │ PLAYER STATUS (Merged) │  │ TAPESTRY (Promoted)    │ │
│ ├────────────────────────────────┤  ├────────────────────────┤ │
│ │ Foresight Score                │  │ ✓ Live on Solana       │ │
│ │ 1,135 FS                       │  │ Your on-chain identity │ │
│ │ SILVER • Founder #18           │  │                        │ │
│ │                                │  │ 0 followers            │ │
│ │ This Week: #1                  │  │ 3 following            │ │
│ │ Season: #2 | All-Time: #8      │  │ 2 teams locked         │ │
│ │                                │  │                        │ │
│ │ ☐ 1.58x Active • 87 days      │  │ Your 2 teams are      │ │
│ │                                │  │ permanently recorded   │ │
│ │ Progress to GOLD               │  │ on Solana via Tapestry │ │
│ │ ████████░░░ 3,865 to go       │  │                        │ │
│ │ 127 XP • Level 3 (NOVICE)      │  │ [View on Solana]      │ │
│ │                                │  │ [Contest history] →    │ │
│ │ [Leaderboard] [Earn More]      │  │                        │ │
│ └────────────────────────────────┘  └────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │ ← YOUR TEAM
│ │ Your Team                                                     │ │
│ │ [Formation visual]    Team Name                              │ │
│ │                       142 pts • Rank #3 • $150/$150          │ │
│ │                       [Edit] [Share]                         │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Overview | Teams (2) | History | Watchlist (5) | Stats          │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ (Tab content here)                                           │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Differences (Desktop)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Header height | 80px | 60px | -25% |
| Card sections | 5 (sequentially) | 3 (2-column grid) | Better use of space |
| Nav card redundancy | 6 cards | 0 | Cleaner layout |
| Tapestry visibility | Bottom | Sticky right column | Always visible |
| Layout efficiency | Single column | Two-column grid | Judges see key info faster |
| Cognitive load | High (5 sections) | Low (3 sections) | Clearer story |

---

## DESIGN SYSTEM COMPLIANCE CHECK

### Colors

```
BEFORE:
  FS Score card:     Gold icon, Gold progress bar
  XP Card:           Cyan icon, Cyan progress bar     ← CONFLICT!
  Buttons:           Multiple gold buttons (competing focus)

AFTER:
  Player Status:     Gold ONLY (consistent)
  Tapestry badge:    Cyan ONLY (secondary, on-chain)
  Boost indicator:   Emerald (positive state)
  All buttons:       One gold CTA per card
```

**Verdict:** AFTER follows Design Principles 1, 2, and 6 ✅

### Typography

```
BEFORE:
  FS Score:          text-3xl (hero)
  XP:                text-2xl (competing hero)     ← CONFLICT!
  Section headers:   text-lg (inconsistent)

AFTER:
  FS Score number:   text-2xl font-black (hero)
  Tier/badges:       text-sm (context)
  XP:                text-xs (secondary, not competing)
```

**Verdict:** AFTER has clear hierarchy ✅

### Card Styling

```
BEFORE:
  Some cards:        bg-gray-900/50 border-gray-800
  Some cards:        bg-gold-500/10 border-gold-500/30    ← GRADIENT!
  Some cards:        bg-green-500/10 border-green-500/30  ← GRADIENT!

AFTER:
  All cards:         bg-gray-900/50 border-gray-800 (consistent)
  Color in badges:   Only on content (FS score, tier badges, status icons)
```

**Verdict:** AFTER follows Design Principles 1 and 7 ✅

---

## USER FLOW COMPARISON

### BEFORE (Current)
```
User opens /profile
        ↓
Sees header + avatar
        ↓
Scrolls down to see actions (Today's Actions)
        ↓
Scrolls down to see FS Score
        ↓
Scrolls down to see XP (confusion: two progression cards)
        ↓
Scrolls down to see nav cards (Quick Links) — goes to /compete instead
        ↓
Never scrolls to Tapestry
        ↓
Confused about what profile page is for
```

### AFTER (Proposed)
```
User opens /profile
        ↓
Sees header + avatar (compact, clear)
        ↓
Sees Player Status (FS Score + XP merged) → "I know my score"
        ↓
Sees Tapestry section immediately → "My teams are on Solana"
        ↓
Sees Your Team card → "Here's what I drafted"
        ↓
Taps tabs to see history, watchlist, or full team list
        ↓
Clear story: "I'm a player with score + teams on-chain + draft history"
```

**Verdict:** AFTER has clearer UX ✅

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Code Changes
- [ ] Delete Today's Actions section (lines 531-607 in Profile.tsx)
- [ ] Delete Quick Links section (lines 647-695)
- [ ] Delete old XP Card (lines 613-644)
- [ ] Create PlayerStatusCard component
- [ ] Create YourTeamCard component
- [ ] Refactor TapestryIdentityCard component
- [ ] Update Profile.tsx to use new components in correct order

### Phase 2: Styling
- [ ] Verify all cards use `bg-gray-900/50 border-gray-800`
- [ ] No gradient backgrounds on cards (only icons/badges)
- [ ] Gold only on FS Score section
- [ ] Cyan only on Tapestry badge
- [ ] Emerald only on boost indicator
- [ ] Typography hierarchy correct (score > badges > secondary text)

### Phase 3: Testing
- [ ] Mobile 375px: All 3 sections fit without required scrolling
- [ ] Tablet 768px: Layout looks good
- [ ] Desktop 1024px: Two-column grid works
- [ ] Responsive images (avatar, formation)
- [ ] Button interactions (Leaderboard, Edit, Share)
- [ ] Tab navigation still works

### Phase 4: Screenshots
- [ ] Before screenshot (current state)
- [ ] After screenshot (new state)
- [ ] Compare at 375px, 768px, 1024px
- [ ] Highlight Tapestry visibility improvement

---

## QUICK WINS

**What's easy to fix now:**
1. Move Tapestry section up (copy/paste code)
2. Delete Today's Actions section (remove code)
3. Delete Quick Links section (remove code)
4. Merge FS Score + XP (move UI elements, no new data)

**What takes more time:**
1. Create new components cleanly
2. Test all breakpoints
3. Ensure design system compliance

**Estimated total time:** 6-8 hours (2 hours to delete cruft, 4-6 hours to consolidate and test)

---

*This comparison is ready to share with product. Use mobile/desktop wireframes above to explain the redesign in meetings.*
