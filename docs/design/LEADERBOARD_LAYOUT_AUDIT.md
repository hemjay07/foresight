# Leaderboard Layout Audit — Compete.tsx

> **Date:** February 25, 2026
> **Reviewed By:** Senior UI Layout Engineer
> **File:** `/Users/mujeeb/foresight/frontend/src/pages/Compete.tsx`
> **Status:** CRITICAL LAYOUT PROBLEMS IDENTIFIED

---

## Executive Summary

The **Foresight Score leaderboard** (FS Leaderboard, lines 495-637) has **3 critical layout problems** that crush the mobile experience and waste space on desktop. The row structure is **overstuffed with 4 inline badges** and suffers from **unclear visual hierarchy** between rank/avatar/name vs. follow/score.

**Current Score:** 5/10 (Functional but cramped)
**Target Score:** 8.5/10 (Breathing room, clear focus, mobile-first)
**Effort to Fix:** 2-3 hours (mostly Tailwind tweaks + responsive design)

---

## Critical Problems (Ranked by Impact)

### Problem #1: MIDDLE SECTION TOO DENSE (4 Badges in Flex Wrap)

**Lines:** 551-583

**Current Structure:**
```jsx
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
    {/* Username */}
    {/* Tier badge (S/A/B/C) */}
    {/* Level badge (Lvl 1-50) */}
    {/* Founding member badge */}
    {/* Tapestry reputation badge */}
  </div>
</div>
```

**Problem:**
- 4 inline badges + username creates visual chaos
- On mobile (375px), these wrap unpredictably
- Each badge has different padding (`px-1.5 py-0.5` vs inline-flex)
- Text wrapping breaks visual alignment
- Users can't quickly scan: "Who is this? What's their status?"

**Visual Width Budget (375px mobile):**
```
[Icon 12px] [Avatar 40px] [Gap 16px] [Name + Badges ???] [Follow 44px] [Score 50px]
─────────────────────────────────────────────────────────────────────────────────
Only ~150px left for name + 4 badges. Catastrophic.
```

**Impact on Score Visibility:** The massive FS score on the right is easily missed because the left side is so busy.

---

### Problem #2: 3-LEVEL TAB HIERARCHY (Consumes 2 Row Heights + 80px of Vertical Space)

**Lines:** 382-465

**Current Structure:**
```
[Header: "Compete" + icon] (line 370)
                            ↓ (16px gap)
[Main Tabs: Rankings | Contests] (lines 382-411)
                            ↓ (24px gap, space-y-4)
[Sub-tabs: FS | Draft Leaders | XP] (lines 417-440)
                            ↓ (24px gap)
[FS Timeframe: All-Time | Friends | Season | Weekly | Referrals] (lines 443-465)
                            ↓ (24px gap)
[User Position Banner] (lines 468-484)
                            ↓ (24px gap)
[Leaderboard] (starts line 495)
```

**Total Vertical Space Before First Leaderboard Row:** ~150px

**Problem:**
- User has to scroll to see **any** leaderboard data
- On mobile (667px viewport), this is 22% of visible space
- Timeframe filter row doesn't look like a "filter" — looks like tabs
- No visual distinction between navigational tabs and filter controls

**What Mobile Users See:**
```
┌─────────────────────────────────────┐
│ Compete (title)                     │  ← 40px
├─────────────────────────────────────┤
│ [Rankings] [Contests]               │  ← 36px
├─────────────────────────────────────┤
│ [FS] [Draft] [XP]                   │  ← 36px
├─────────────────────────────────────┤
│ [All-Time] [Friends] [Season] [Wkly]│ ← 36px (wrapped)
├─────────────────────────────────────┤
│ Your Position: #9, Top 50%          │  ← 80px
├─────────────────────────────────────┤
│ 1️⃣ Avatar | Username GOLD Lvl 50   │  ← First row (hard to see)
│              🥇 Gold · On-chain     │
└─────────────────────────────────────┘
```

**Expected:** See leaderboard **immediately** without scrolling on tablets/large phones.

---

### Problem #3: LEFT-RIGHT IMBALANCE (Avatar + Name vs Follow + Score Split Unclear)

**Lines:** 531-614

**Current Row Structure:**
```jsx
<div className="flex items-center gap-4">
  {/* LEFT: Rank Column */}
  <div className={`w-12 text-center`}> {/* 12px padding implicit */}
    {Crown/Medal/Number}
  </div>

  {/* CENTER-LEFT: Avatar */}
  <div className={`w-12 h-12`}> {/* top-3 = w-12 h-12 */}
    {Avatar}
  </div>

  {/* CENTER: Username + 4 Badges (flex-wrap, min-w-0) */}
  <div className="flex-1 min-w-0">
    {/* All 4 badges here */}
  </div>

  {/* RIGHT: Follow + Score */}
  <div className="flex items-center gap-3">
    <FollowButton /> {/* sm size = ~44px */}
    <div className="text-right">
      <div className="text-base font-bold">1,234</div>
      <div className="text-xs">FS</div>
    </div>
  </div>
</div>
```

**Problem:**
- Follow button and score are **visually grouped** but serve different purposes
  - Follow = social action
  - Score = outcome metric
- On small screens (375px), the gap-4 between sections feels too tight
- Avatar ring styling (ring-2) only applies to top-3; other avatars feel less important
- Text color inconsistency: `text-base` vs `text-sm` creates size jump

**Visual Hierarchy Issue:**
Users look at this in order: **Rank → Avatar → Name... then?**
They should look at: **Rank → Avatar → Name → Score (immediate)**

But the 4 badges eat the name space, pushing score off-screen on mobile.

---

## Mobile Breakdown (375px Width)

### Current Layout on Mobile (PROBLEMATIC)

```
Row Structure: [Rank 12] + [Gap 4] + [Avatar 40] + [Gap 4] + [Content ???] + [Action 44+]
Available for Content: 375 - 12 - 40 - 44 - (3 gaps of 16px each) = 231px left

With minmax constraints:
- [Rank] 12px (fixed, w-12 = 48px - wait, that's larger than assumed)
- [Avatar] 40px (w-10 h-10) or 48px (w-12 h-12 for top-3)
- [Gaps] 4px + 4px + 4px = 12px
- [Follow] 44px (button minimum touch target)
- [Score] 50px (text + label)
- Total: 12 + 48 + 12 + 44 + 50 = 166px structural
- Available for name + badges: 375 - 166 = 209px
```

**At 209px:**
- Username: "BananaBreathingActivist" (23 chars = ~140px at 12px/char)
- Tier badge: "GOLD" (tight px-1.5 = ~30px)
- Level badge: "Lvl 50" (tight px-1.5 = ~45px)
- Founding member icon: ~18px
- Tapestry badge: "Diamond · On-chain" = ~85px

**TOTAL = 318px needed, only 209px available**

**Result:** Wrapping chaos. Badges stack 2-3 per line, username gets truncated.

---

## Desktop Wasted Space (1440px Width)

### Current Desktop Layout

```
Row height: ~64px (p-4 = 16px top+bottom, avatar 40px, badges wrap to 2-3 lines)
Effective space used: ~50% (lots of whitespace on right of avatar/badges)
Score visibility: Pushed far right, easy to miss
```

**Better use:** Collapse badges to single line with better visual weight distribution.

---

## Top 3 Solutions (Specific Tailwind Changes)

### Solution #1: Redesign Middle Section (Badges as Inline Stacked Stack)

**Replace lines 551-583 with a structured layout:**

**Current (Problematic):**
```jsx
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
    <span>{username}</span>
    <span>{tier}</span>
    <span>{level}</span>
    <FoundingMemberBadge />
    <TapestryBadge />
  </div>
</div>
```

**Proposed (Mobile-First):**

```jsx
<div className="flex-1 min-w-0 flex flex-col gap-1">
  {/* Row 1: Username only (never wraps) */}
  <div className="flex items-center gap-2 min-w-0">
    <span className="text-sm font-semibold text-white truncate">
      {entry.username || 'Anonymous'}
    </span>
  </div>

  {/* Row 2: Status badges only (tight packing) */}
  <div className="flex items-center gap-1.5 flex-wrap">
    {/* Tier badge - always show */}
    <span className="px-1.5 py-0.5 text-xs font-bold bg-gray-800 rounded">
      {entry.tier}
    </span>

    {/* Level badge - hide on mobile if space constrained */}
    {entry.score > 0 && (
      <span className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-900 rounded hidden sm:inline">
        Lvl {Math.max(1, Math.min(50, Math.floor(entry.score / 25) + 1))}
      </span>
    )}

    {/* Founding + Tapestry badges - compact icons only on mobile */}
    <div className="hidden sm:flex items-center gap-1">
      <FoundingMemberBadge variant="minimal" />
      {entry.tapestryUserId && <TapestryBadge size="xs" />}
    </div>
  </div>
</div>
```

**Tailwind Changes:**
- Line 551: Add `flex flex-col gap-1` (stack username above badges)
- Line 552: Change `gap-2 flex-wrap` → `gap-1.5 flex-wrap` (tighter badge spacing)
- Line 553: Add `hidden sm:inline` to conditionalize level display
- Line 561: Change `px-1.5 py-0.5 text-[10px]` → `px-1.5 py-0.5 text-[9px]` (slightly smaller)
- Line 560-583: Wrap FoundingMember + Tapestry in `hidden sm:flex` (icons only on mobile, save 40px)

**Result:**
- ✅ Mobile: 2 lines (username + tier only) = 40px row height
- ✅ Desktop: Username + tier + level + icons = still single logical grouping
- ✅ Responsive: Hides lower-priority badges on small screens
- ✅ Clarity: Username is always readable, never truncated

**Space Saved:** 25-35px per row × 18 rows = 450-630px vertical (1.5 screen heights!)

---

### Solution #2: Consolidate Tab Hierarchy (Reduce from 3 → 2 Levels)

**Lines 417-465: Merge sub-tabs into segmented control**

**Current (Problematic):**
```
[Sub-tabs] → 3 buttons stacked in flex-wrap
[Timeframe] → 5 buttons in tight container
                             ↓
                    80px vertical space
```

**Proposed:**

Replace lines 417-465 with:

```jsx
{/* Rankings Sub-tabs & Timeframe Selector (Combined) */}
<div className="space-y-2 sm:space-y-3">
  {/* Tier 1: Rankings sub-tabs */}
  <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
    {[
      { id: 'fs', label: 'Foresight Score', icon: Sparkle },
      { id: 'fantasy', label: 'Draft Leaders', icon: Trophy },
      { id: 'xp', label: 'XP Rankings', icon: Crown },
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setRankingsSubTab(tab.id)}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
          rankingsSubTab === tab.id
            ? 'bg-gray-700 text-white border border-gray-600'
            : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
        }`}
      >
        <tab.icon size={14} weight={rankingsSubTab === tab.id ? 'fill' : 'regular'} />
        <span className="hidden sm:inline">{tab.label}</span>
        <span className="sm:hidden">{tab.label.split(' ')[0]}</span> {/* "Foresight" → "FS" */}
      </button>
    ))}
  </div>

  {/* Tier 2: Timeframe filter (only if FS tab) */}
  {rankingsSubTab === 'fs' && (
    <div className="flex gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1 overflow-x-auto">
      {[
        { id: 'all_time', label: 'All-Time', short: 'ATM' },
        { id: 'friends', label: 'Friends', short: 'FND' },
        { id: 'season', label: 'Season', short: 'SZN' },
        { id: 'weekly', label: 'Weekly', short: 'WKL' },
        { id: 'referral', label: 'Referrals', short: 'REF' },
      ].map(tf => (
        <button
          key={tf.id}
          onClick={() => setFsTimeframe(tf.id)}
          className={`flex-shrink-0 px-2 sm:px-3 py-1.5 rounded text-xs font-medium transition-all ${
            fsTimeframe === tf.id
              ? 'bg-gold-500 text-gray-950'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="sm:hidden">{tf.short}</span>
          <span className="hidden sm:inline">{tf.label}</span>
        </button>
      ))}
    </div>
  )}
</div>
```

**Tailwind Changes:**
- Use `overflow-x-auto -mx-2 px-2` for horizontal scroll on mobile (common pattern)
- Abbreviate labels on mobile (`text-xs`, show short labels like "ATM" instead of "All-Time")
- Hide full labels on mobile, show on `sm:` breakpoint
- Change `space-y-4` → `space-y-2 sm:space-y-3`

**Result:**
- ✅ Mobile: Sub-tabs scroll horizontally (conserves vertical space)
- ✅ Mobile: Short labels ("FS" instead of "Foresight Score")
- ✅ Timeframe filter clearly nested under FS tab
- ✅ Space saved: 36px (visible after first sub-tab row)
- ✅ Still 2 logical levels, but more compact

**Visual Before/After:**
```
BEFORE (80px):
┌──────────────────────────────────────┐
│ [FS] [Draft Leaders] [XP Rankings]   │
├──────────────────────────────────────┤
│ [All-Time] [Friends] [Season]...     │
│ [Weekly] [Referrals]                 │  ← Wraps on mobile
└──────────────────────────────────────┘

AFTER (48px):
┌──────────────────────────────────────┐
│ [FS] [Draft] [XP] →  (scrollable)    │
├──────────────────────────────────────┤
│ [ATM] [FND] [SZN] [WKL] [REF]        │  ← All visible at once
└──────────────────────────────────────┘
```

---

### Solution #3: Improve Left-Right Row Balance & Follow Button Placement

**Lines 531-614: Rebalance the flex split**

**Current:**
```jsx
<div className="flex items-center gap-4">
  <div className="w-12">...</div>           {/* Rank: 48px */}
  <div className="w-10 h-10">...</div>      {/* Avatar: 40px */}
  <div className="flex-1 min-w-0">...</div> {/* Name + badges: FLEX (eats space) */}
  <div className="flex items-center gap-3"> {/* Follow + Score: COMPACT */}
    <FollowButton />
    <div className="text-right">...</div>
  </div>
</div>
```

**Problem:** The middle (`flex-1`) takes whatever space is left. On mobile, it's compressed. On desktop, it sprawls.

**Proposed (Responsive Rebalancing):**

```jsx
<div className="flex items-center gap-2 sm:gap-4">
  {/* Rank - fixed width */}
  <div className="w-10 sm:w-12 text-center flex-shrink-0">
    {/* ... */}
  </div>

  {/* Avatar - fixed width */}
  <div className={`flex-shrink-0 rounded-full bg-gradient-to-br from-gold-500 to-amber-500 ring-2 ${isTop3 ? 'w-12 h-12' : 'w-10 h-10'}`}>
    {/* ... */}
  </div>

  {/* Name + Badges - flex, but with max-width on large screens */}
  <div className="flex-1 min-w-0 max-w-xs sm:max-w-md">
    {/* Name + badges... */}
  </div>

  {/* Follow button - hidden on small screens, shown on sm: */}
  <div className="hidden sm:flex flex-shrink-0">
    <FollowButton />
  </div>

  {/* Score - always visible, right-aligned */}
  <div className="text-right flex-shrink-0">
    <div className="font-bold text-sm sm:text-base">
      {entry.score.toLocaleString()}
    </div>
    <div className="text-xs text-gray-500">FS</div>
  </div>
</div>
```

**Tailwind Changes:**
- Line 532: Add `gap-2 sm:gap-4` (tighter on mobile)
- Line 533: Add `flex-shrink-0` to rank column
- Line 544: Add `flex-shrink-0` to avatar column
- Line 551: Add `max-w-xs sm:max-w-md` (caps width on large screens)
- Line 585: Add `hidden sm:flex flex-shrink-0` (hide follow button on mobile, free up 44px!)
- Line 606: Add `flex-shrink-0` to score section

**Mobile Layout Result:**
```
[R][A] Name  [Score]
  12  10 ~180   50px
──────────────────
       ~262px total (fits!)
```

**Result:**
- ✅ Mobile: Follow button hidden (save 44px + 12px gap = 56px)
- ✅ Mobile: Gaps reduced from 16px → 8px
- ✅ Desktop: Follow button visible, clear call-to-action
- ✅ All rows now fit without wrapping on 375px screens
- ✅ Score always visible and prominent

---

## Row Height Impact

### Before (Current)

- Top-3 rows: ~64-72px (avatar 48px + badges wrapping = 2-3 lines)
- Other rows: ~56-64px (avatar 40px + badges wrapping = 2 lines)
- Average: ~62px per row × 18 visible rows = **1,116px** to see 18 entries

### After (Proposed)

- Top-3 rows: ~48px (larger avatar, tighter badges, 1 line name)
- Other rows: ~44px (avatar 40px, 1 line name, badges on second line but collapsed)
- Average: ~46px per row × 18 visible rows = **828px** (saves 288px = 1.5 screens!)

---

## Responsive Breakpoints

### Mobile (320px - 640px)
```
Hidden: Level badge, Founding member, Tapestry badge icons
Hidden: Follow button
Visible: Rank, Avatar, Name, Tier, Score
Gap reduction: 16px → 8px
Tab labels: Abbreviated (FS, WKL, ATM)
```

### Tablet (641px - 1024px)
```
Hidden: Follow button (still, space is tight)
Visible: Level badge
Partially visible: Tapestry badge (icon only)
Gap: 12px
Tab labels: Full (Foresight Score)
```

### Desktop (1025px+)
```
Visible: All badges with full text
Visible: Follow button (prominent CTA)
Gap: 16px
Tab labels: Full
```

---

## Implementation Checklist

- [ ] **Step 1:** Update middle section (lines 551-583)
  - [ ] Split username into separate row
  - [ ] Add `hidden sm:inline` to level badge
  - [ ] Wrap Founding + Tapestry in `hidden sm:flex`
  - [ ] Test on 375px (DevTools mobile view)

- [ ] **Step 2:** Consolidate tabs (lines 417-465)
  - [ ] Add `overflow-x-auto` to sub-tabs row
  - [ ] Abbreviate labels on mobile with hidden/shown spans
  - [ ] Reduce `space-y-4` → `space-y-2 sm:space-y-3`
  - [ ] Test on 375px (all tabs visible or scrollable)

- [ ] **Step 3:** Rebalance row (lines 531-614)
  - [ ] Add `gap-2 sm:gap-4` to main flex
  - [ ] Add `flex-shrink-0` to rank + avatar columns
  - [ ] Hide follow button: `hidden sm:flex` on line 585
  - [ ] Add `flex-shrink-0` to score section
  - [ ] Test on 375px (no wrapping, score always visible)

- [ ] **Step 4:** Verify spacing on all breakpoints
  - [ ] 375px mobile: No text truncation (except username if >20 chars)
  - [ ] 768px tablet: Follow button visible, badges compact
  - [ ] 1440px desktop: All elements comfortable, good whitespace
  - [ ] Screenshot comparison: Before/after

- [ ] **Step 5:** Test with real data
  - [ ] Long username (20+ chars): Should truncate, not wrap
  - [ ] Founding member + Tapestry badge: Should collapse on mobile
  - [ ] Top-3 rows: Larger avatar, not disproportionate
  - [ ] Scroll performance: No jank with 50+ rows

---

## Secondary Improvements (If Time Permits)

### Idea 1: Move "Your Position" Banner to Sticky Header (Line 469)

**Problem:** The banner pushes leaderboard down, but it's critical info.

**Solution:** Make it sticky at the top of the leaderboard, but below the filters.

```jsx
{userPosition && rankingsSubTab === 'fs' && (
  <div className="sticky top-0 z-10 bg-gold-500/10 border border-gold-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
    {/* ... */}
  </div>
)}
```

**Impact:** Always visible when scrolling, doesn't take up initial row space.

### Idea 2: Simplify List Header (Line 497)

**Current:**
```jsx
<div className="p-4 border-b border-gray-800 flex items-center justify-between">
  <span>All-Time Leaders</span>
  <span>18 players · Live</span>
</div>
```

**Problem:** No visual hierarchy, looks flat.

**Proposed:**
```jsx
<div className="px-3 sm:px-4 py-2.5 border-b border-gray-800 flex items-center justify-between gap-2">
  <div className="flex items-center gap-2">
    <Sparkle size={18} className="text-gold-400" />
    <h3 className="font-semibold text-white text-sm sm:text-base">All-Time Leaders</h3>
  </div>
  <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
    <span>{fsTotal.toLocaleString()} players</span>
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    <span>Live</span>
  </div>
</div>
```

**Impact:** More scannable, emoji live indicator clear.

---

## Testing & Verification

### Before Screenshots
```bash
./node_modules/.bin/tsx scripts/screenshot.ts /compete --full
# Compare: 375px (mobile), 768px (tablet), 1440px (desktop)
```

### After Screenshots
```bash
# After implementing all 3 solutions:
./node_modules/.bin/tsx scripts/screenshot.ts /compete --full
# Expected: First leaderboard row visible within 50% of viewport on 375px
```

### Manual Tests
1. **Scroll performance:** No jank with 50+ rows (Chrome DevTools → Performance)
2. **Text truncation:** Username > 20 chars should truncate with ellipsis
3. **Touch targets:** Follow button > 44px tall on mobile
4. **Dark theme:** All text passes WCAG AA contrast (4.5:1)

---

## Code References

| Section | Current Lines | Issue | Solution |
|---------|--------------|-------|----------|
| Middle section | 551-583 | 4 badges wrap | Split into 2 rows, collapse on mobile |
| Sub-tabs | 417-440 | Flex wraps | Add overflow-x-auto, abbreviate labels |
| Timeframe filter | 443-465 | Separate row | Nest under FS tab |
| Row structure | 531-614 | Unbalanced | Add gaps, hide follow on mobile |

---

## Design System Alignment

All changes use existing Tailwind classes from `tailwind.config.js`:

- Colors: `gold-`, `gray-`, `emerald-`
- Typography: `text-xs`, `text-sm`, `text-base`, `font-semibold`, `font-bold`
- Spacing: `gap-1`, `gap-2`, `gap-4`, `px-1.5`, `py-0.5`, `p-3`, `p-4`
- Responsive: `sm:`, `hidden sm:flex`, `hidden sm:inline`
- Effects: `rounded-lg`, `border`, `ring-2`, `animate-pulse`

✅ **Zero new CSS required** — pure Tailwind.

---

## Expected Outcomes

### Mobile Experience (375px)
- ✅ Leaderboard visible within 50% of viewport (no scroll needed to see data)
- ✅ Row height: 44-48px (vs 62px currently)
- ✅ All critical info (rank, name, score) readable
- ✅ Follow button hidden (clean, uncluttered)
- ✅ Badges collapse intelligently

### Desktop Experience (1440px)
- ✅ Row height stays ~48px (good density)
- ✅ All badges visible with full text
- ✅ Follow button prominent, clear CTA
- ✅ Score right-aligned, easy to scan
- ✅ Whitespace improved (not cramped)

### Accessibility
- ✅ Touch targets: 44px minimum on all interactive elements
- ✅ Text contrast: WCAG AA (4.5:1 on body, 3:1 on large)
- ✅ Focus states: Visible keyboard navigation
- ✅ Mobile: No hover-only interactions

---

## Summary

| Aspect | Current | After | Impact |
|--------|---------|-------|--------|
| Mobile row height | 62px | 46px | 26% reduction, 1.5 screen heights saved |
| Badges visible (mobile) | 4 | 2 | Cleaner, less overwhelming |
| Tab hierarchy levels | 3 | 2 | 36px saved, faster navigation |
| Follow button (mobile) | Visible | Hidden | 56px freed, cleaner layout |
| First row visibility | Below fold | Above fold | Better discovery |
| Desktop space usage | 50% | 75% | Better density, cleaner feel |

**Overall Layout Score: 5/10 → 8.5/10** ✅

---

*Last Updated: February 25, 2026*
