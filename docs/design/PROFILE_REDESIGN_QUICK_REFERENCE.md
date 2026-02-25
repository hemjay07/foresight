# Profile Redesign — Quick Reference for Developers

> **TL;DR:** Consolidate 5 sections → 3 sections. Merge FS+XP. Move Tapestry up. Kill nav cards.

---

## What's Changing

| Section | Before | After |
|---------|--------|-------|
| Today's Actions | 3 nav cards | ❌ REMOVED |
| FS Score Card | Standalone | 🔄 Merged with XP |
| XP Card | Standalone | 🔄 Merged with FS Score |
| Quick Links | 3 nav cards | ❌ REMOVED |
| Tapestry | Bottom position | ⬆️ Moved to #2 |

---

## The New Structure (Mobile → Desktop)

### 1. Header (Compact)
- Avatar: `w-14 h-14` (mobile) → `w-20 h-20` (desktop)
- Name + Wallet on one line (mobile), two lines (desktop)
- Level + Streak inline
- Share + Settings icons top-right

### 2. Player Status Card (NEW)
**Merges old FS Score + XP cards**

```tsx
<PlayerStatusCard
  score={1135}
  tier="SILVER"
  badge="Founder #18"
  thisWeekRank={1}
  seasonRank={2}
  allTimeRank={8}
  boost={{ multiplier: 1.58, daysLeft: 87 }}
  xpCurrent={127}
  xpLevel="NOVICE"
  xpProgress={45} // percent to next level
/>
```

**Styling:** `bg-gray-900/50 border-gray-800` (no gradient)

### 3. Tapestry Identity Card (MOVED UP)
**Same component, new position (was at bottom)**

```tsx
<TapestryIdentityCard
  connected={true}
  followers={0}
  following={3}
  teamsOnChain={2}
  tapestryId="Trader_ohm...r_ohm3mi"
/>
```

**Styling:** Add green "Live on Solana" badge to header

### 4. Your Team Card (NEW)
**Shows current team or "Start drafting" CTA**

```tsx
<YourTeamCard
  team={myTeam}
  hasTeam={boolean}
  onEdit={() => navigate('/draft')}
  onShare={() => openShareModal()}
/>
```

---

## Components to Create

### 1. PlayerStatusCard.tsx
**File:** `/frontend/src/components/PlayerStatusCard.tsx`

```typescript
interface PlayerStatusCardProps {
  score: number;
  tier: string;
  badge?: string;
  thisWeekRank?: number;
  seasonRank?: number;
  allTimeRank?: number;
  boost?: { multiplier: number; daysLeft: number };
  xpCurrent: number;
  xpLevel: string;
  xpProgress: number; // 0-100 percent
  onLeaderboardClick: () => void;
  onEarnMoreClick: () => void;
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Foresight Score             │
│ 1,135 FS                    │  ← font-black text-2xl text-white
│ SILVER • Founder #18        │  ← text-sm text-gray-400
│                             │
│ This Week: #1               │  ← text-sm
│ Season: #2 | All-Time: #8   │
│                             │
│ ☐ 1.58x Active • 87d left   │  ← Only if boost active, emerald pill
│                             │
│ Progress to GOLD            │  ← text-xs text-gray-400
│ ████████░░░ 3,865 to go     │  ← Gold progress bar
│                             │
│ 127 XP • Level 3 (NOVICE)   │  ← text-xs text-gray-500
│                             │
│ [Leaderboard] [Earn More]   │  ← Two full-width button group
└─────────────────────────────┘
```

**Notes:**
- Progress bar uses gold (same as score icon)
- XP is secondary (small, gray)
- Boost only shows if active (not placeholder)
- Two button CTAs at bottom

### 2. YourTeamCard.tsx
**File:** `/frontend/src/components/YourTeamCard.tsx`

```typescript
interface YourTeamCardProps {
  team?: Team;
  hasTeam: boolean;
  onEdit: () => void;
  onShare: () => void;
}
```

**Layout (with team):**
```
┌──────────────────────────────┐
│ YOUR TEAM                    │
│                              │
│ [Formation visual: 1C+4]      │
│                              │
│ Team Name                    │
│ 142 pts • Rank #3            │
│ Budget: $150 / $150          │
│                              │
│ [Edit Draft] [Share Team]    │
└──────────────────────────────┘
```

**Layout (no team):**
```
┌──────────────────────────────┐
│ [Trophy icon]                │
│ No Team Yet                  │
│ Draft your first squad       │
│ [Start Drafting] →           │
└──────────────────────────────┘
```

### 3. TapestryIdentityCard.tsx
**File:** `/frontend/src/components/TapestryIdentityCard.tsx` (refactor existing)

Move the existing Tapestry section code to this component. Add:
- Green "Live on Solana" badge in header
- Better positioning for social counts
- Clear "immutable proof" messaging

---

## What Code to Delete

### Remove from Profile.tsx Overview Tab:
1. **Today's Actions section** (lines 531-607)
   - `<Link to="/compete?tab=contests">` (Enter Contest)
   - `<Link to="/progress">` (Daily Quests)
   - `<Link to="/compete">` (Check Standings)

2. **ForesightScoreDisplay** usage (line 610)
   - Replace with `<PlayerStatusCard />`

3. **Old XP Card** (lines 613-644)
   - Delete entirely (merged into PlayerStatusCard)

4. **Quick Links section** (lines 647-695)
   - Remove all 3 links (Browse Contests, Quests, Referrals)

5. **Keep Tapestry section** (lines 698-777)
   - Extract to component, don't delete
   - Just move it to position #2

### Files to Delete (if they exist):
- [ ] Any old "QuickActions" or "TodaysActions" component files

---

## New Profile.tsx Structure

```tsx
// Simplified Overview tab section
{activeTab === 'overview' && (
  <div className="space-y-6">
    {/* 1. Player Status (merged FS + XP) */}
    <PlayerStatusCard
      score={stats.foresightScore}
      tier={stats.tier}
      badge={stats.badge}
      thisWeekRank={stats.thisWeekRank}
      seasonRank={stats.seasonRank}
      allTimeRank={stats.allTimeRank}
      boost={stats.activeBoost}
      xpCurrent={stats.xp}
      xpLevel={xpInfo.level}
      xpProgress={xpInfo.progress}
      onLeaderboardClick={() => navigate('/compete?tab=rankings')}
      onEarnMoreClick={() => navigate('/progress')}
    />

    {/* 2. Tapestry Identity (moved up) */}
    <TapestryIdentityCard
      connected={tapestryStatus.connected}
      followers={socialCounts.followers}
      following={socialCounts.following}
      teamsOnChain={tapestryContent.filter(i => i.properties?.type === 'draft_team').length}
      tapestryId={tapestryStatus.tapestryUserId}
    />

    {/* 3. Your Team Card */}
    <YourTeamCard
      team={myTeam}
      hasTeam={!!myTeam && teamForFormation?.length >= 5}
      onEdit={() => navigate('/compete?tab=contests')}
      onShare={() => setShowShareTeam(true)}
    />
  </div>
)}
```

---

## Styling Guidelines

**All new cards:**
```tsx
className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
```

**Progress bars:**
```tsx
className="h-2 bg-gray-800 rounded-full overflow-hidden"
// For gold progress:
className="h-full bg-gold-500 rounded-full"
```

**Section titles:**
```tsx
className="text-lg font-semibold text-white"
```

**Secondary text:**
```tsx
className="text-sm text-gray-400"
```

**Never use gradient backgrounds.** (Violates Design Principles)

---

## Mobile Breakpoints

| Breakpoint | Usage |
|-----------|-------|
| `sm` (375px+) | Default (mobile) |
| `md` (768px+) | Tablet - two-column layout starts |
| `lg` (1024px+) | Desktop - full layout |

**Avatar sizes:**
- Mobile: `w-14 h-14`
- Desktop: `w-20 h-20`

**Button widths:**
- Mobile: Full width (`w-full`)
- Desktop: Can use `flex-1` for button groups

---

## Testing Checklist

### States to Test:
- [ ] New user (0 XP, no team, 0 followers)
- [ ] Active user (150+ XP, team drafted, followers)
- [ ] With active boost
- [ ] Without active boost
- [ ] On mobile (375px)
- [ ] On tablet (768px)
- [ ] On desktop (1024px)

### Interactions:
- [ ] Tap "Leaderboard" button → /compete?tab=rankings
- [ ] Tap "Earn More" button → /progress
- [ ] Tap "Edit Draft" → /compete?tab=contests
- [ ] Tap "Share Team" → share modal opens
- [ ] Tap "View on Solana" → external link
- [ ] Tabs still work (Teams, History, Watchlist)

### Visual:
- [ ] No purple/violet colors
- [ ] No gradient card backgrounds
- [ ] Gold only on FS Score
- [ ] Cyan only on Tapestry badge
- [ ] All buttons ≥44px height
- [ ] Spacing consistent (6/12/24px grid)

---

## Removed Components/Code

Once these sections are gone, check if we can delete these:
- `ForesightScoreDisplay` (consolidate into PlayerStatusCard)
- Any "Quick Actions" component (if it existed)
- Any "Today's Actions" component (if it existed)

Ask before deleting anything used elsewhere.

---

## Timeline

| Phase | Time | Owner |
|-------|------|-------|
| Review & Approval | 30 min | PM |
| Create Components | 2 hours | Frontend |
| Integrate Profile.tsx | 1.5 hours | Frontend |
| Mobile + Desktop Testing | 1 hour | QA |
| Screenshot Comparison | 30 min | Designer |
| Iterate & Polish | 1 hour | Frontend |
| **Total** | **6 hours** | |

---

*Update this doc after completion. Add notes if you find issues or need clarifications.*
