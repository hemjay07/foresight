# Profile Page Redesign — Complete Strategic Analysis

> **Status:** Ready for Implementation
> **Date:** February 25, 2026
> **Audience:** Design + Engineering team
> **Priority:** CRITICAL — UX bottleneck for user retention

---

## EXECUTIVE SUMMARY

The current Profile Overview tab has **5 distinct visual sections with competing visual weights** and **2 redundant cards** (FS Score + XP Level) that serve nearly identical purposes. This creates cognitive overload and buries Foresight's key differentiator (**Tapestry on-chain integration**) at the bottom.

**What we'll do:**
1. **Consolidate** FS Score + XP into a single "Player Status Card"
2. **Remove navigation cruft** (Today's Actions, Quick Links) — users already have bottom nav
3. **Promote Tapestry to hero position** — key for hackathon judges
4. **One clear action per section** — eliminate competing CTAs
5. **Mobile-first layout** — 375px width as primary design constraint

**Expected outcome:** A profile page that tells a clear story in 3 sections (Status → Teams → On-Chain), loads fast, and showcases Tapestry as the core differentiator.

---

## CURRENT PAIN POINTS (DETAILED)

### 1. **Information Overload**
Current structure on Overview tab:
- Today's Actions (3 cards)
- Foresight Score (full card)
- XP Card (full card, CYAN icon = visual competition)
- Quick Links (3 cards repeating nav destinations)
- Tapestry section (buried)

**Problem:** User sees 5 visual blocks of equal weight. No clear primary → secondary → tertiary hierarchy. Eye doesn't know where to go.

### 2. **Redundant Progression Cards**
- **FS Score card** shows: Score + this week/season rank + boost timer + progress bar
- **XP Card** shows: Level + total XP + progress bar to next level

Both are **player progression metrics in different systems**. They say the same thing: "You're growing."

**Problem:** These should be merged. Showing them separately wastes real estate and confuses the mental model.

### 3. **Navigation Redundancy**
"Today's Actions" and "Quick Links" are navigation cards to:
- Enter Contest
- Check Standings
- Browse Contests
- Quests
- Referrals

But the **bottom nav already has**:
- Compete (for contests + leaderboards)
- (Implied) feed for referrals/social

**Problem:** These cards say "go somewhere else." Profiles should say "here's who you are." They're defeating the purpose of a profile.

### 4. **Tapestry Buried**
Tapestry Protocol integration is:
- Our **Solana hackathon differentiator**
- A **key value proposition** (immutable proof)
- **Judges will look for this** in the demo

Currently it's at the **bottom of the Overview tab**. Users might scroll past it. Judges might not see it during a quick walkthrough.

**Problem:** We're hiding our ace card.

### 5. **Avatar Placeholder**
- Generic silhouette with gold background
- Looks unfinished
- No way to upload custom avatar
- Contrasts with the polished rest of the UI

**Problem:** First impression is "early project" not "ready for production."

### 6. **"Anonymous" as Username Default**
When a user hasn't set a username, it shows "Anonymous" — correct but feels like an error state.

**Problem:** Small detail, but signals incompleteness. Should have guidance or fallback.

### 7. **XP Display Shows "0 XP"**
For new users, "0 Total XP" in large cyan text reads as an error or incomplete state.

**Problem:** Should feel encouraging ("you're getting started") not broken.

### 8. **Cyan + Gold Color Conflict**
- FS Score card: Gold icon, gold progress bar
- XP Card: Cyan icon, cyan progress bar

Both use their signature colors. **By Design Principles, only one should be primary per context.**

**Problem:** Eye is pulled in two directions. Which one matters? This violates Principle 1 (color in content, not competing).

---

## PROPOSED REDESIGN: THE "PLAYER CARD" MODEL

### Three-Section Structure

```
┌─ HEADER ─────────────────────────────────┐
│  Avatar | Name | Level | Streak | Share  │  ← Compact, clear identity
├─ PLAYER STATUS (Merged FS+XP) ───────────┤
│  • Foresight Score (big number, gold)     │  ← Single focus
│  • Rank this week / season                │
│  • Active boosts (pills)                  │
│  • Progress to next tier (1 bar)          │  ← One primary metric per card
│  • XP shown as secondary badge            │
├─ TEAMS (Link to Teams tab) ───────────────┤
│  Last drafted team card / "Start drafting"│
├─ ON-CHAIN IDENTITY (Tapestry) ───────────┤
│  • Live on Solana badge                   │
│  • 3 quick stats (followers, following, teams)
│  • Immutability statement                 │
│  • Links to full history (tabs)           │
└───────────────────────────────────────────┘
```

### Key Changes

#### 1. **Merge FS Score + XP into "Player Status Card"**

**Old:** Two separate cards, both showing progression in different systems.

**New:** One card with clear visual hierarchy:

```
┌─────────────────────────────────────┐
│ PLAYER STATUS                       │
├─────────────────────────────────────┤
│ Foresight Score: 1,135              │  ← PRIMARY: large, gold, bold
│ Founder #18 • SILVER Tier           │  ← Context badges
│                                     │
│ This Week: #1 (1,135 pts)           │  ← Ranking context
│ Season: #2 | All-Time: #8           │
│                                     │
│ [Active Boost: 1.58x for 87 days]   │  ← Emerald pill, only if active
│                                     │
│ Progress to GOLD                    │  ← 1 progress bar (gold)
│ ████████░░░ 3,865 FS to go          │
│                                     │
│ 127 XP • Level 3 (NOVICE)           │  ← Secondary: small, gray
│                                     │
│ [Leaderboard]  [Earn More]          │  ← Two full-width CTAs
└─────────────────────────────────────┘
```

**Why this works:**
- Single focal point: FS Score dominates
- XP is visible but not competing
- One progress bar (not two)
- Clear hierarchy: score → tier → ranking → progress
- Boosts only show if active (emerald shows action happened)
- Saves vertical real estate by ~50%

---

#### 2. **Remove "Today's Actions" and "Quick Links"**

**Old:** 6 navigation cards telling users to go elsewhere

**New:** None of these on Overview tab. Users can:
- Tap **Compete** in bottom nav for contests
- Tap **Profile** → **Teams** tab for team management
- Follow **prompts in modals** (e.g., after contest submission: "View leaderboard?")

**Why:** A profile should answer "Who am I? What's my status?" not "Where should I go?" That's what nav is for.

---

#### 3. **Elevate Tapestry to Second Position**

**Old:** Buried at bottom, below nav cards

**New:** Immediately after Player Status card, above Teams

**Structure:**

```
┌─────────────────────────────────────┐
│ LIVE ON SOLANA                      │  ← Green dot badge
├─────────────────────────────────────┤
│ Your on-chain identity & proof      │  ← Subtitle
│                                     │
│ Followers: 0 | Following: 3         │  ← Social counts (from Tapestry)
│ Teams locked: 2                     │
│                                     │
│ "Your 2 draft teams are permanently │  ← Immutability message
│  recorded on Solana via Tapestry    │
│  Protocol — verifiable by anyone."  │
│                                     │
│ Tapestry ID: Trader...r_ohm3mi      │  ← Identity reference (copyable)
│                                     │
│ [View on Solana] [Contest history]  │  ← Two CTAs (external + internal)
└─────────────────────────────────────┘
```

**Why this position:**
- Right after "Who I am" (Player Status)
- Explains "This is verifiable on-chain"
- Judges see it early in the walkthrough
- Reinforces Foresight ≠ normal fantasy app
- Natural flow: Status → Proof → Team Details

---

#### 4. **Compact Header**

**Old:**
- Large avatar (w-20 h-20)
- Name, wallet, level, streak (multi-line)
- Share + Settings buttons (right side)

**New (Mobile-optimized):**

```
┌──────────────────────────────────┐
│ [Avatar]  Name           [Share]  │
│ @wallet   Lvl 3   3d streak [⚙️]  │
└──────────────────────────────────┘
```

For mobile (375px):
- Avatar: `w-14 h-14` (still prominent, saves horizontal space)
- Name on one line, wallet as secondary text
- Level + streak on same line (compact)
- Share + settings at top right as icon buttons

For desktop (≥768px):
- Avatar: `w-20 h-20`
- Horizontal layout: avatar | [info] | [actions]
- More breathing room

**Why:** Profile header should be instant visual recognition, not a full section. Real estate needed for content below.

---

#### 5. **"Your Teams" Section (Minimal)**

**Old:** Entire tab dedicated to teams. User sees nothing on Overview.

**New:** Card on Overview showing:
- **If they have a team:** Formation preview card with stats + link to Teams tab
- **If they don't:** "Draft your first team" CTA

```
┌──────────────────────────────────┐
│ YOUR TEAM (TAP TO EDIT)           │
├──────────────────────────────────┤
│ [Formation visual: 1 cap + 4]     │  ← Captain highlighted
│                                  │
│ Team Name                        │
│ 142 pts • Rank #3 • $150/$150    │  ← Score, rank, budget
│                                  │
│ [Edit Draft] [Share Team]        │  ← Two CTAs
└──────────────────────────────────┘

OR (if no team):

┌──────────────────────────────────┐
│ [Trophy icon]                    │
│ No Team Yet                      │
│ Draft your first squad           │
│ [Start Drafting] →               │
└──────────────────────────────────┘
```

**Why:** Shows active context (current team) without needing a separate tab scroll. Users who tap "Teams" tab still see full list + edit options.

---

#### 6. **Tabs Remain, But Simplified**

**Visible tabs:**
- **Overview** (current section)
- **Teams** (full list of drafts, edit UI)
- **History** (past contests, results)
- **Watchlist** (scouted influencers)
- (Optional) **Stats** (advanced analytics)

**Action:** Remove or move "Daily Quests" and "Referrals" to separate pages in navigation (not profile tabs).

---

## VISUAL DESIGN RULES (Apply Design Principles)

### Color Usage

**Gold (#F59E0B):**
- FS Score (primary number)
- Player Status section accents
- Primary CTA buttons

**Cyan (#06B6D4):**
- Only on Tapestry "Live" badge
- Consistent with on-chain identity

**Emerald (#10B981):**
- Active boost pill (only if boost exists)
- Signals positive state

**Gray (#27272A, #12121A):**
- Card backgrounds
- All dividers, borders
- Secondary text

**Never use purple/violet** on this page (violates Design Principles).

### Card Styling

- **Background:** `bg-gray-900/50 border border-gray-800`
- **Hover:** `hover:border-gold-500/30` (slight reveal, not repaint)
- **Border radius:** `rounded-xl` (consistent with system)
- **Padding:** `p-6` (mobile) → `p-6-8` (desktop)

### Typography

- **Headers:** Inter 700, `text-white`
- **Labels:** Inter 400, `text-gray-400`
- **Primary metric:** Inter 700, `text-2xl text-gold-400` or `text-white`
- **Secondary metric:** Inter 500, `text-sm text-gray-400`

---

## MOBILE LAYOUT (375px FIRST)

### Overview Tab Flow (Mobile)

```
1. HEADER (compact, 60px total)
   [Avatar] Name | Share | Settings
   Wallet • Level 3 • 3d streak

2. PLAYER STATUS CARD (180px)
   Foresight Score: 1,135
   SILVER • Founder #18

   This Week: #1
   Progress bar: ████░ to next tier
   127 XP • Level 3

   [Leaderboard] [Earn More]

3. TAPESTRY CARD (200px)
   ✓ Live on Solana

   Your on-chain identity

   Followers: 0 | Following: 3
   Teams: 2

   "Your 2 teams permanently recorded..."

   [View on Solana] [History]

4. YOUR TEAM CARD (200px)
   [Formation visual]
   Team Name
   142 pts • #3
   [Edit] [Share]

5. FOOTER
   (Already scrolled past)
```

**Total viewport on first load:** 2.5-3 card heights. User must scroll to see all content, but sees 3 key sections without scrolling.

### Desktop Layout (≥768px)

```
HEADER (full-width, horizontal)
├─ Avatar (larger)
├─ Name, Wallet, Level, Streak (vertical stack)
└─ Share, Settings (buttons)

2-COLUMN GRID (gap-6):
├─ LEFT COLUMN (60% width)
│  ├─ Player Status Card (full width)
│  ├─ Your Team Card (full width)
│  └─ Tabs section
└─ RIGHT COLUMN (40% width)
   └─ Tapestry Card (sticky, top-aligned)
      └─ Social counts, on-chain proof
```

**Rationale:**
- Player Status + Team prominent (left)
- Tapestry always visible on right (judges see it immediately)
- Takes advantage of wide screen without making cards too wide

---

## WHAT GETS REMOVED

### From Overview Tab:
1. ❌ "Today's Actions" card section
   - "Enter Contest" — users access via /compete
   - "Daily Quests" — moving to dedicated /quests page
   - "Check Standings" — users access via /compete

2. ❌ "Quick Links" card section (Browse Contests, Quests, Referrals)
   - Duplicate navigation
   - Users have bottom nav

3. ❌ Separate "Experience Level" card
   - Merged into Player Status

4. ❌ Generic silhouette avatar
   - Replace with initials + color, or user photo if uploaded

### From Profile as a Whole:
- ⚠️ "Stats" tab — combine into Overview or move to /analytics
- ⚠️ "Referrals" — move to dedicated /referrals page (not a profile feature)

### Keep:
- ✅ Teams tab (full team list, edit UI)
- ✅ History tab (past contests)
- ✅ Watchlist tab (scouted influencers)
- ✅ Settings (keep top-right button)
- ✅ Header (compact, optimized)

---

## ASCII WIREFRAMES

### Mobile (375px)

```
┌─────────────────────────────┐
│ Foresight   Home Compete..  │ ← Top nav (fixed)
│                             │
│ ┌──────────────────────────┐│ ← HEADER
││ [👤] You      [✓] [⚙]    ││ Profile
│ │ 0x123...9abc • Lvl 3 • 3d││
│ └──────────────────────────┘│
│                             │
│ ┌──────────────────────────┐│ ← PLAYER STATUS
││ Foresight Score           ││
││ 1,135 FS                  ││
││ SILVER • Founder #18      ││
││ This Week: #1 (1,135 pts) ││
││ ────────────────────────  ││
││ Progress to GOLD          ││
││ ████████░░░░░ 3,865 to go ││
││ 127 XP • Level 3 (NOVICE) ││
││ [Leaderboard] [Earn More] ││
│ └──────────────────────────┘│
│                             │
│ ┌──────────────────────────┐│ ← TAPESTRY
││ ✓ Live on Solana          ││
││ Your on-chain identity    ││
││ 0 followers • 3 following ││
││ 2 teams locked on-chain   ││
││                           ││
││ Your 2 teams are         ││
││ permanently recorded on  ││
││ Solana via Tapestry.     ││
││                           ││
││ [View on Solana]          ││
││ [Contest history] →       ││
│ └──────────────────────────┘│
│                             │
│ ┌──────────────────────────┐│ ← YOUR TEAM
││ Your Team                 ││
││                           ││
││  [Formation: 1C + 4]      ││
││                           ││
││ Team Name                 ││
││ 142 pts • Rank #3         ││
││ Budget: $150 / $150       ││
││ [Edit Draft] [Share Team] ││
│ └──────────────────────────┘│
│                             │
│ Overview | Teams | History │ ← TABS
│                             │
│ ┌────────────────────────────┐ ← TAB CONTENT
│                              │
│   (Teams tab, History, etc.) │
│                              │
└──────────────────────────────┘
```

### Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────┐
│ Foresight    Home   Compete   Feed   Profile      [Sign In]│ ← Nav
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Avatar L]  You          [Your Profile]  [Share] [⚙] │  │ ← HEADER
│ │             0x123...9abc   Lvl 3 • 3d streak         │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │ PLAYER STATUS CARD       │  │ TAPESTRY             │  │
│  ├──────────────────────────┤  ├──────────────────────┤  │
│  │ Foresight Score          │  │ ✓ Live on Solana    │  │
│  │ 1,135 FS                 │  │ Your on-chain ID    │  │
│  │ SILVER • Founder #18     │  │                     │  │
│  │                          │  │ 0 followers         │  │
│  │ This Week: #1 (1,135)    │  │ 3 following         │  │
│  │ Season: #2 | All-Time: #8│  │ 2 teams locked      │  │
│  │                          │  │                     │  │
│  │ Boost: 1.58x • 87 days   │  │ Your 2 teams are   │  │
│  │                          │  │ permanently on     │  │
│  │ Progress to GOLD         │  │ Solana via Tapestry│  │
│  │ ████████░░░ to 5,000     │  │                     │  │
│  │ 127 XP • Level 3 (NOVICE)│  │ [View on Solana]   │  │
│  │                          │  │ [Contest history]→ │  │
│  │ [Leaderboard] [Earn More]│  │                     │  │
│  └──────────────────────────┘  └──────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ YOUR TEAM                                            │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ [Formation visual]    Team Name                      │ │
│  │                       142 pts • Rank #3 • $150/$150  │ │
│  │                       [Edit] [Share]                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Overview | Teams (2) | History | Watchlist (5) | Stats│ │
│ ├────────────────────────────────────────────────────────┤ │
│ │                                                        │ │
│ │   [Tab content here]                                 │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Consolidation (2-3 hours)
- [ ] Create `PlayerStatusCard.tsx` component (merged FS + XP)
  - Accepts: `foresightScore`, `xpLevel`, `xpCurrent`, `xpNext`, `rank`, `badge`, `boost`
  - Shows: Score + tier + ranking + progress
  - CTAs: Leaderboard, Earn More

- [ ] Create `TapestryIdentityCard.tsx` component (promote existing)
  - Reorganize existing Tapestry section code
  - Add "Live on Solana" badge to header
  - Keep stats, message, links

- [ ] Create `YourTeamCard.tsx` component
  - Show current team or "Start drafting" state
  - Include formation visual
  - Two CTAs: Edit, Share

### Phase 2: Profile Overview Tab Refactor (2-3 hours)
- [ ] Remove `Today's Actions` section
- [ ] Remove `Quick Links` section
- [ ] Keep header (optimize for mobile)
- [ ] Replace old FS Score + XP cards with `PlayerStatusCard`
- [ ] Move Tapestry section to second position
- [ ] Add `YourTeamCard` section
- [ ] Update spacing, colors, hierarchy

### Phase 3: Navigation/Routing (1 hour)
- [ ] Move Quests → `/quests` page (or keep link in nav only)
- [ ] Move Referrals → `/referrals` page (or keep link in nav only)
- [ ] Ensure bottom nav covers all primary paths
- [ ] Update any broken links

### Phase 4: Testing (2 hours)
- [ ] Mobile (375px): Header, 3-section flow
- [ ] Tablet (768px): Two-column layout
- [ ] Desktop (1200px): Full layout
- [ ] Test with empty states (new user, no team, 0 XP)
- [ ] Test with full states (active boost, teams, history)
- [ ] Verify tab navigation (Teams, History, Watchlist)

### Phase 5: Screenshots + QA (1 hour)
- [ ] Take Before screenshot (current state)
- [ ] Implement changes
- [ ] Take After screenshot (new state)
- [ ] Compare, iterate if needed
- [ ] Get user sign-off

---

## EXPECTED IMPROVEMENTS

### User Experience
- ✅ **Clarity:** One primary metric (FS Score) instead of competing cards
- ✅ **Mobile-friendly:** Compact header, stacked sections, clear scroll depth
- ✅ **Self-awareness:** User sees status instantly without navigation
- ✅ **Tapestry prominent:** Judges see key differentiator in first 3 seconds

### Performance
- ✅ **Reduced vertical scrolling:** Consolidated cards mean less content
- ✅ **Faster cognitive load:** Hierarchy is clear (status → proof → team)
- ✅ **Better conversion:** No competing CTAs that pull user away

### Design System Compliance
- ✅ **One primary action per section:** No color competition
- ✅ **No unnecessary gradients:** Flat cards, color in content (badges, icons)
- ✅ **Consistent spacing:** 6px, 12px, 24px grid
- ✅ **Touch-friendly:** All buttons ≥44px height

---

## RISKS & MITIGATION

| Risk | Mitigation |
|------|-----------|
| Users lose "quick navigation" (Today's Actions) | Bottom nav covers all primary paths. Add contextual prompts ("View leaderboard?" after contest) |
| XP hidden when merged into Player Status | Still visible, but not competing visually. Users understand XP is progression toward next level |
| Tapestry card feels out of place to new users | Add brief label: "Your teams are recorded on Solana" — explains value immediately |
| Desktop layout too wide if not constrained | Set `max-w-4xl` on container, use 2-col grid only on ≥1024px |
| Mobile bounces between tabs | Sticky header + smooth scroll transitions. Tab badges show content count |

---

## NEXT STEPS

1. **Review & Approval** (30 min)
   - Share this doc with product/design leads
   - Confirm removal of "Today's Actions" and "Quick Links" sections
   - Approve Tapestry promotion and Player Status consolidation

2. **Component Planning** (30 min)
   - List exact props for each new component
   - Plan shared utilities (formatting, styling)
   - Identify any shared state needs

3. **Build Phase 1** (2-3 hours)
   - Create components in isolation
   - Test with mock data
   - Run design system audit (colors, spacing, typography)

4. **Integrate & Test** (2-3 hours)
   - Replace old sections in Profile.tsx
   - Mobile + desktop testing
   - Screenshot comparisons

5. **Iterate** (1 hour)
   - User feedback from screenshot comparison
   - Polish animations, spacing, colors
   - Final QA before merge

---

## QUESTIONS FOR PRODUCT

1. Should "Daily Quests" have dedicated page, or stay in bottom nav only?
2. Should "Referrals" have dedicated page, or move to settings?
3. Can we add user avatar upload, or keep silhouette placeholder?
4. Is "Stats" tab (advanced analytics) MVP, or post-launch feature?
5. Should "Watchlist" show on Overview (mini-version), or tabs-only?

---

## APPENDIX: DESIGN PRINCIPLES CHECKLIST

Before implementation, verify all changes follow `/docs/design/DESIGN_PRINCIPLES.md`:

- ✅ **Principle 1 (Color in Content):** No colored card backgrounds; color only on icons, badges, text
- ✅ **Principle 2 (One Semantic Role):** Gold = primary, Cyan = on-chain, Emerald = success
- ✅ **Principle 3 (Primary Metric Hero):** FS Score is visual hero of Player Status card
- ✅ **Principle 4 (Repeated Actions Whisper):** No buttons on every row (n/a, not a list)
- ✅ **Principle 5 (Destructive Hidden):** No destructive actions on profile (n/a)
- ✅ **Principle 6 (One Primary CTA):** "Leaderboard" or "Earn More" — verify only one is gold
- ✅ **Principle 7 (No Gradient BGs):** All cards are `bg-gray-900/50 border-gray-800`
- ✅ **Principle 8 (Hover as Reveal):** Buttons show `bg-gray-800/50 → bg-gray-800` on hover, not repaint
- ✅ **Principle 9 (Subtle Animation):** 150-300ms transitions on hover, not jarring
- ✅ **Principle 10 (Mobile First):** 375px design first, scales up for tablet/desktop

---

*End of document. Ready for implementation.*
