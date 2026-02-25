# Foresight Profile Page — Competitive Analysis & Redesign Strategy

> **Date:** February 25, 2026
> **Analyst:** UX Researcher (competitive analysis methodology)
> **Status:** Research-Based Design Recommendations
> **Scope:** Profile page information hierarchy, identity presentation, and competitive insights

---

## EXECUTIVE SUMMARY

Your current Profile page has a **structural problem**: it's designed like a personal dashboard (tabs, daily actions, experience progression) when it should be designed like a **proof-of-skill card** that makes judges & competitors say "wow, this player is legit."

### The Core Issue

In **competitive fantasy sports**, a profile page serves THREE primary functions:
1. **Proof of skill** (rank, score, streak) — visible at a glance
2. **Social proof** (followers, wins, achievements) — credibility signals
3. **Skill comparison** (how you stack up) — psychological appeal

Your current design prioritizes #1 (partially) but buries #2 and #3. This is backward.

### The Fix (Summary)

**Redesign the profile header as a "trophy card"** that leads with the three most impressive facts about the user:
- Rank (#8 all-time) — the primary metric
- Win rate (58%) or weekly boost (1.58x) — proof of skill
- Social credibility (18 followers) — proof others watch you

Everything else (tabs, daily actions, XP) becomes secondary content below the fold.

---

## 1. COMPETITIVE BENCHMARKING

### 1.1 DraftKings / FanDuel (Fantasy Sports Baseline)

**Information Hierarchy:**
```
Header (Above fold)
├── Username + Avatar (identity)
├── Primary metric: Total Points (e.g., "8,950 pts")
├── Status badges (VIP tier, experience level, tournament wins)
└── CTA (Enter Contest, View Leaderboard)

Secondary (Scrollable)
├── This week / This month / All-time stats (toggle)
├── Win rate, streak, best rank
├── Recent contests + results
└── Account settings
```

**Key Insight:** The primary metric (total points) is visually HEROIC — text-xl, bold, gold. Everything else is muted. The eye lands there first.

**Evidence from DraftKings:**
- Uses "My Stat Sheet" — a dedicated stats view showing deposits, withdrawals, time-on-platform, net win/loss
- Shows "experienced player" badges (star icons) next to usernames on leaderboards
- VIP tiers visible on profile (MVP status at 25K points = special perks)

**Evidence from FanDuel:**
- FanDuel Points (FDP) earned per $1 wagered
- Players Club status determined monthly
- Experienced/Highly Experienced badges next to player names (status signaling)
- Easy-to-scan rewards center showing tier and current progress

**What You're Missing:**
- A clear "Proof of Experience" badge (like FanDuel's star icons)
- Win rate as primary metric (not buried in tabs)
- Visible proof that others follow you (social credibility)

---

### 1.2 Sorare (NFT/Web3 Context)

**Design Principles:**
```
Player Card (Physical Metaphor)
├── Card rarity visual (gold border for unique, blue for super-rare)
├── Player name + position
├── Stats (limited, rare, super-rare, unique editions owned)
├── On-chain proof (smart contract address visible)
└── Trade value (market price)
```

**Key Insight:** Rarity tiers use COLOR at the card border/frame — not content. The card itself is clean. Color signals status.

**Why This Matters for Foresight:**
- You have tiers (S, A, B, C) but they're not visually prominent enough
- Sorare makes scarcity visible (you own 1 of 10 unique cards) — you should do the same (Founder #18 of ?)
- On-chain verification is a BADGE, not a toggle

---

### 1.3 StepN (Crypto-Native Gamification)

**Profile Shows:**
1. Avatar + username (identity)
2. SOL balance + in-game currency (wealth signal)
3. NFT shoe collection (visual, scrollable)
4. Lifetime stats (total distance, total earnings, average pace)
5. Level + rarity (color-coded shoe stats)
6. Leaderboard rank (time-based cohorts)

**Key Insight:** StepN leads with NFT ownership (visual). Then stats. Then rank.

**Why This Matters:** Your teams are on Tapestry (on-chain) — **show them visually**. Not in a tab. On the profile header.

---

### 1.4 Reddit/Discord (Community Identity)

**Profile Shows:**
1. Avatar + username
2. Karma (points) — the primary metric
3. Badges (awards, achievements)
4. Followers/Following
5. Post history + upvotes

**Key Insight:** Badges are VISUAL and prominent. Karma is BIG. Everything else is scrollable.

**Why This Matters:** You have "Founder" status but it's buried. It should be a BADGE at the top.

---

## 2. RESEARCH ANSWERS TO YOUR QUESTIONS

### 2.1 How Do DraftKings/FanDuel Handle Profile Pages?

**Above the Fold:**
- Username + avatar (small, upper left)
- **Primary metric (total points) — HERO size, gold/branded color, right side**
- Status badges (VIP tier, experienced, tournament winner) — icons, not text
- One CTA button (Enter Contest / View Leaderboard)

**Below the Fold (Tabs/Sections):**
- This Week / This Month / Lifetime toggle
- Win rate, average score, best rank
- Recent contest results
- Responsible gaming stats (time played, deposits, withdrawals)

**Mobile Design:**
- Avatar + metric stacked vertically
- One button below
- Everything else scrollable

**Psychology:** The metric (points) becomes your identity. "I have 8,950 points" = "I'm serious." This is status signaling at work.

---

### 2.2 How Do Crypto/Web3 Apps Handle Identity?

**On-Chain Proof:**
- Wallet address visible (sometimes partially hidden: `0x1234...5678`)
- On-chain verification badge (checkmark icon, usually cyan or gold)
- Transaction history visible (recent wins, prize claims)
- NFT collection visible (teams on Tapestry, achievements)

**Identity Architecture:**
- Decentralized identifier (DID) → Solana wallet → public profile
- Verifiable credentials (zero-knowledge proofs) → you can prove things without exposing raw data
- On-chain attestations → immutable proof of participation

**Why This Matters for Foresight:**
- Your users care about on-chain proof ("Is this person legit?")
- Tapestry verification is not a toggle — it's a CREDENTIAL
- Show: "Verified on Tapestry" + wallet address (partial)

---

### 2.3 Profile Page Psychology — When & Why Users Visit

**Psychological Triggers for Profile Visits:**

1. **After a big win** ("I want to see my score updated")
   - Need: Celebrate, screenshot proof
   - Design: BIG score display, share button adjacent
   - Psychology: Endowment effect (my score is valuable)

2. **When comparing to peers** ("How am I doing vs. top players?")
   - Need: Quick rank reference, win rate visible
   - Design: Rank badge at top, win rate below
   - Psychology: Social comparison drive

3. **To adjust settings/username** ("I want to control my identity")
   - Need: Username edit, avatar change
   - Design: Prominent but secondary (not first thing)
   - Psychology: Identity control

4. **To share with others** ("Prove to my friends I'm ranked #8")
   - Need: Share button, clean screenshot-friendly layout
   - Design: Profile card is "portrait mode" friendly
   - Psychology: Status signaling, social proof

5. **To track long-term progress** ("Am I improving?")
   - Need: Historical stats, chart showing trajectory
   - Design: Week/Month/All-time toggle
   - Psychology: Progress motivation

### The Emotion You Should Trigger

**When judges see your profile:**
- First thought: "Wow, this person is *serious* about this" (proof of skill)
- Second thought: "Other people follow/trust this person" (social proof)
- Third thought: "This is on-chain verified = real" (credibility)

Current design triggers: "Oh, there are some stats here" (neutral, not impressive)

---

### 2.4 Information Hierarchy for Your Specific User

You showed: User with 1,135 FS, Rank #8 all-time, Founder #18, 1.58x boost, 0 contests won, 2 teams drafted on-chain, 0 followers/3 following on Tapestry.

**The three most impressive facts:**
1. **Rank #8 all-time** ← PRIMARY (in top 1% of all players)
2. **Founder #18** ← SECONDARY (exclusive status, scarcity)
3. **1.58x multiplier active** ← TERTIARY (credible strategy signal)

**The one gap to close:**
- 0 followers is a problem (looks lonely)
- Solution: Not shown on profile. Will be solved by follow button social features.

**The narrative:**
"This is a serious, early player who made strategic choices (founder) and achieved top-8 rank. Likely to win."

---

### 2.5 Specific Redesign Recommendations

#### Q: Should "Today's Actions" be on Profile?

**Current placement:** Top of page after header

**Answer:** NO. Move it to HOME page.

**Reasoning:**
- "Enter Contest," "Check Standings," "Daily Quests" are ACTION PROMPTS, not PROFILE CONTENT
- A profile page is introspective (looking at yourself)
- Home page is action-oriented (what should I do next?)
- Profile should answer "Who am I?" not "What should I do?"
- DraftKings doesn't put "New contests available" on the profile; it puts that on the lobby/home

**Better Use:** Use the home page for action cards. Profile is for proof and stats.

---

#### Q: Should XP and FS Be Shown Separately?

**Current design:** Two separate cards (FS Score card, Experience Level card)

**Answer:** YES, separate is correct. **BUT restructure the hierarchy.**

**Reasoning:**
- FS (Foresight Score) is your **game score** (primary metric, like points in DraftKings)
- XP is your **progression** (secondary, like your VIP tier)
- They measure different things

**Current Problem:**
- FS is shown well (1,135, progress bar, tier badge)
- XP is shown poorly (0 XP, feels like you haven't done anything)
- Both are equal weight in the layout (both are cards)

**Fix:**
```
ABOVE FOLD:
┌─────────────────────────────────────────┐
│ [Avatar] @username      [FOLLOW] [⋯]    │
│                                         │
│ Foresight Score: 1,135 pts │ Rank #8   │
│ [████████░░░] SILVER tier (Week view)  │
│                                         │
│ 👥 2 Followers | 👁️ 3 Following        │
└─────────────────────────────────────────┘

BELOW FOLD:
Tabs: Overview | Teams | History | Watchlist

OVERVIEW TAB:
┌─────────────────────────────────────────┐
│ This Week                    +245 pts   │
│ Contests Entered: 5   Wins: 2   W/L: 40%│
│ Best Rank: #8       Streak: 4 weeks    │
├─────────────────────────────────────────┤
│ Level: NOVICE  │  0 XP (1,234 to next) │
│ [████░░░░░░]                           │
├─────────────────────────────────────────┤
│ Founder Edition  #18 of [?]            │
│ ✓ Verified on Tapestry                 │
│ 2 teams submitted on-chain             │
└─────────────────────────────────────────┘
```

Key changes:
1. **Rank is next to score** (both primary)
2. **Win rate is above XP** (competitive metric > progression)
3. **Founder badge is a CREDENTIAL** (proof of early access)
4. **Tapestry verification is visible** (proof of legitimacy)
5. **XP moved down** (secondary)

---

#### Q: Should Tapestry Be Prominent or Secondary?

**Current placement:** Separate section at bottom of page

**Answer:** Move it UP, make it a CREDENTIAL (not a section).

**Reasoning:**
- Tapestry verification is proof of legitimacy for blockchain apps
- It should be at the same visual level as rank and score
- Think of it like a "Verified" checkmark on Twitter

**Fix:**
```
NEW LAYOUT:

Header (above fold):
┌─────────────────────────────────────────┐
│ [Avatar] @username    [1,135 pts]       │
│ Rank #8  │  Founder  │  ✓ Tapestry     │
│ 👥 2 Followers | 👁️ 3 Following        │
└─────────────────────────────────────────┘

The "✓ Tapestry" is a small badge with Tapestry logo, indicating this profile is on-chain verified.
```

**Why this works:**
- Judges immediately see: rank, founder status, on-chain verified
- It tells the story: "Serious early player, blockchain-backed"
- Tapestry is a credential, not a feature

---

#### Q: Should Action Tiles Stay on Profile?

**Current tiles:** Browse Contests, Quests, Referrals

**Answer:** NO. These are NAVIGATION, not PROFILE CONTENT.

**Better placement:**
- "Browse Contests" → Home or Compete page (where contests live)
- "Quests" → Home page or dedicated Quests tab
- "Referrals" → Settings page

**Reasoning:**
- Profile = "Here's who I am"
- Navigation = "Here's what you can do"
- DraftKings doesn't put "Browse Contests" on the profile; it's on the main lobby

**New Rule:** Profile is READ-ONLY introspection. All CTAs should be on Home or other primary pages.

---

## 3. REDESIGN STRATEGY

### 3.1 Information Hierarchy (Proposed)

```
ABOVE FOLD (Hero Section):
├── Avatar + Username (left)
├── Primary Metrics (center-right)
│   ├── Foresight Score (biggest): "1,135 pts"
│   ├── Rank (next): "#8 all-time"
│   ├── Win Rate: "40% (2W, 3L)"
│   └── Status Badges: Founder #18, ✓ Tapestry
├── Social Proof (below)
│   ├── 👥 2 Followers
│   ├── 👁️ 3 Following
│   └── Streak: 4 weeks
└── CTA (right): [FOLLOW] [Share Profile] [Settings]

BELOW FOLD (Scrollable Tabs):
├── Overview (default)
│   ├── This Week stats
│   ├── All-time stats
│   ├── Contests entered + win rate chart
│   ├── Streak counter
│   └── Progression: XP level
├── Teams
│   ├── Drafts (on-chain verified, with like count)
│   ├── Formations (visual)
│   └── Share buttons
├── History
│   ├── Recent contests (sortable by result)
│   ├── Detailed scoring breakdown
│   └── Prize claims
└── Watchlist
    ├── Influencers being monitored
    └── Notes
```

**Color & Visual Hierarchy:**

```
Primary Metric (1,135 pts):
  - Font: Plus Jakarta Sans 700
  - Size: 4xl (48px on desktop, 2xl on mobile)
  - Color: #F59E0B (gold)
  - Weight: 900

Rank (#8):
  - Size: 2xl (24px)
  - Color: #06B6D4 (cyan)
  - Weight: 700

Secondary Metrics (Win Rate, Streak):
  - Size: sm (14px)
  - Color: gray-400
  - Weight: 400

Badges (Founder, Tapestry):
  - Visual: Small icons with labels
  - Founder: gold background, scarcity indicator
  - Tapestry: cyan checkmark, on-chain badge
```

---

### 3.2 Mobile Layout

On mobile, the header should be **portrait-mode friendly** (square aspect ratio, easy to screenshot and share).

```
┌──────────────────────┐
│   [Avatar]           │
│   @username          │
│                      │
│   1,135 pts          │  (gold, huge)
│   Rank #8            │  (cyan)
│                      │
│   Founder #18        │  (badge)
│   ✓ Tapestry         │  (badge)
│                      │
│   👥 2  👁️ 3         │  (social counts)
│   Streak: 4 weeks    │  (text)
│                      │
│   [FOLLOW]  [Share]  │  (two buttons)
│   [Settings]         │  (gear icon)
└──────────────────────┘
```

This layout is:
- Screenshot-friendly (portrait)
- Mobile-touch-friendly (44px+ button targets)
- Information-dense but readable
- Shareable (can send to friends)

---

### 3.3 What to Remove

**Remove entirely:**
1. "Today's Actions" section from Profile → move to Home
2. Action tiles (Browse Contests, Quests, Referrals) → move to Home/Settings
3. Separate "Experience Level" card → merge into Overview tab as secondary
4. "Tapestry Protocol section" at bottom → move badge to header

**Keep but reorganize:**
1. FS Score → Hero section (make bigger)
2. Tabs (Overview, Teams, History, Watchlist) → same, but content reorganized
3. Founder status → make it a badge in header
4. Social counts → show in header, expandable modal for lists

---

## 4. TACTICAL IMPLEMENTATION

### 4.1 Phase 1: Hero Section Redesign (2-3 hours)

1. **Create new ProfileHeader component:**
   - Display: avatar, username, score (gold), rank (cyan)
   - Add badges: Founder + Tapestry
   - Add social counts: Followers | Following
   - Add CTA buttons: Follow, Share, Settings

2. **Update design tokens:**
   - Score text: text-4xl font-900 text-gold-500
   - Rank text: text-2xl font-700 text-cyan-500
   - Badges: small icons with label text
   - Social counts: text-sm text-gray-400

3. **Mobile responsive:**
   - Stack vertically on mobile
   - Center-align text
   - Buttons full-width
   - 44px min height on all touch targets

### 4.2 Phase 2: Tab Content Reorganization (2-3 hours)

1. **Overview tab:**
   - Move "This Week" stats to top (cards or grid)
   - Show W/L record and win rate prominently
   - Move XP down (secondary)
   - Add streak counter (if applicable)

2. **Teams tab:**
   - Show drafts with like count
   - Add formation visual
   - Share button on each team

3. **History tab:**
   - Keep as-is (already good structure)

4. **Watchlist tab:**
   - Keep as-is (already good structure)

### 4.3 Phase 3: Remove Non-Profile Content (1 hour)

1. Delete "Today's Actions" section
2. Delete action tiles (Browse, Quests, Referrals)
3. Move that content to Home page or relevant sections

### Timeline: ~5-6 hours total

---

## 5. DESIGN PRINCIPLES TO APPLY

### Principle 1: Color Lives in Metrics, Not Chrome

```
❌ Bad (current):
- Purple/teal borders on cards
- Colored backgrounds on sections
- Inconsistent color usage

✅ Good (proposed):
- Gold (#F59E0B) for score (metric)
- Cyan (#06B6D4) for rank (metric)
- Gray for all chrome (cards, dividers, borders)
```

### Principle 2: Primary Metric Dominates Visually

The score (1,135 pts) should be the HERO. The eye lands on it first.

```
❌ Bad:
Username: @user
Score: 1,135 pts
Status: Silver

✅ Good:
[Avatar] @user
1,135 pts       ← HUGE, gold, first thing you see
Rank #8
```

### Principle 3: Repeated Interactions Whisper

Follow button appears on multiple pages. It should be:
- Small on leaderboard rows (ghost style)
- Full-size on profile (cyan, primary action)

### Principle 4: Credentials Are Badges, Not Toggles

Founder status, Tapestry verification, etc. should be:
- Visual badges (icons + labels)
- Not toggle switches or section titles
- Positioned next to rank/tier for credibility

### Principle 5: Mobile First

- Test at 375px width
- Touch targets 44x44px minimum
- Portrait-mode friendly for screenshots
- No hover-only states

---

## 6. SUCCESS METRICS

After redesign, measure:

1. **Screenshot sharing rate** (did users share their profile?)
2. **Follow button clicks** (did redesign increase follows?)
3. **Profile revisit rate** (do users come back after wins?)
4. **Judge feedback** (did Tapestry + credential design impress?)
5. **Mobile conversions** (did portrait-friendly layout help?)

---

## 7. COMPETITIVE TEARDOWN: WHAT EACH APP DOES RIGHT

| App | Strength | Why It Works | Apply to Foresight |
|-----|----------|--------------|------------------|
| **DraftKings** | Score is primary metric | Creates identity ("I'm 8,950 points") | Make score your hero metric |
| **FanDuel** | Status badges visible | Badges = instant credibility | Add Founder/Verified badges |
| **Sorare** | Rarity visual + on-chain | Scarcity creates status | Show Founder #18, Tapestry ✓ |
| **StepN** | NFT collection visual | Ownership is identity | Show teams as on-chain proof |
| **Reddit/Discord** | Karma is big + badges | Metric + credentials | Same hierarchy |
| **Stripe** | Minimal, data-forward | Trust via clarity | Don't overcomplicate |

---

## 8. FINAL SUMMARY & DECISION MATRIX

### The Core Redesign

**Old structure:**
```
Header (small metrics)
Tabs
Today's Actions (irrelevant)
FS Score card
XP card
Tapestry section
Action tiles
```

**New structure:**
```
HERO HEADER
├── Avatar + score (gold) + rank (cyan)
├── Status badges (Founder, Tapestry)
├── Social proof (followers, streak)
└── CTA buttons (Follow, Share, Settings)

TABS (reorganized)
├── Overview (stats, W/L, XP secondary)
├── Teams (with likes, shares)
├── History (existing)
└── Watchlist (existing)
```

### Phased Rollout

1. **Phase 1 (highest impact):** Redesign hero section, move score to gold + rank to cyan
2. **Phase 2:** Reorganize tabs, delete action tiles
3. **Phase 3 (polish):** Add badges, credential design

### Judge-Readiness Criteria

After redesign, judges should see:
- [ ] Rank #8 visible immediately (proof of skill)
- [ ] Founder status visible (exclusive, early access)
- [ ] Tapestry verified badge (on-chain credibility)
- [ ] Win rate visible (proof of consistency)
- [ ] Screenshot-friendly layout (shareable)
- [ ] Mobile-optimized (no janky scrolling)

---

## APPENDIX: Research Sources

- [DraftKings My Stat Sheet](https://support.draftkings.com/dk/en-us/my-stat-sheet-overview-us?id=kb_article_view&sysparm_article=KB0010569)
- [FanDuel VIP Program](https://www.fanduel.com/fanduel-points)
- [Sorare NFT Card Design](https://www.marknelson.design/work/sorare-nft-card-design)
- [Psychology of Leaderboards](https://www.commoninja.com/blog/the-psychology-behind-leaderboards)
- [Competitive Gaming Profile Design](https://medium.com/design-bootcamp/gamification-strategy-when-to-use-leaderboards-7bef0cf842e1)
- [Web3 Identity & On-Chain Verification](https://www.dock.io/post/web3-identity)
- [Polygon ID Zero-Knowledge Identity](https://polygon.technology/blog/introducing-polygon-id-zero-knowledge-own-your-identity-for-web3)

---

**Created:** February 25, 2026
**Next Action:** Review recommendations, get approval, then proceed to Phase 1 implementation.
