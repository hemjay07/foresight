# Profile Page Redesign — Quick Reference

> **TL;DR for fast implementation decisions**
> **For the full reasoning, read PROFILE_PAGE_COMPETITIVE_ANALYSIS.md**

---

## ONE-PAGE SUMMARY

**Current Problem:** Profile is a dashboard (tabs + daily actions + cards). Judges see it and think "okay there's a profile here" (neutral).

**Target:** Profile is a trophy card (metric-first, credential-heavy). Judges see it and think "wow, this player is legit and #8 ranked" (impressed).

### The Redesign (Before vs. After)

```
BEFORE:
┌─────────────────────────────┐
│ [Avatar] Username           │
│ NOVICE level                │
│ Tabs: Overview|Teams|History│
├─────────────────────────────┤
│ Today's Actions (irrelevant) │
│ FS Score card               │
│ Experience card             │
│ Tapestry section            │
│ Action tiles                │
└─────────────────────────────┘

AFTER:
┌─────────────────────────────┐
│ [Avatar] @user              │
│                             │
│ 1,135 pts           #8      │  ← HERO section
│ Founder #18  ✓Tapestry     │
│                             │
│ 👥2  👁️3  Streak: 4w       │
│ [FOLLOW] [Share] [⋯]       │
├─────────────────────────────┤
│ Tabs: Overview|Teams|History│
│ (content below reorganized) │
└─────────────────────────────┘
```

---

## QUICK DECISIONS

| Question | Answer | Why |
|----------|--------|-----|
| **Keep "Today's Actions" on Profile?** | NO | It's navigation, not identity. Move to Home. |
| **Separate XP and FS?** | YES, but reorder | FS is primary metric (hero). XP is secondary (below in tabs). |
| **Make Tapestry prominent?** | YES, badge in header | On-chain verification is credential for judges. |
| **Include action tiles (Browse, Quests, Referrals)?** | NO | Remove entirely. Navigation belongs on other pages. |
| **What's the primary metric?** | FS Score (1,135) | Make it gold, huge, first thing you see. |
| **What's secondary?** | Rank (#8) | Make it cyan, next to score. |
| **What's tertiary?** | Win rate, streak | Below header, small gray text. |
| **Should profile be tabs or single page?** | Tabs (Overview, Teams, History, Watchlist) | Keep structure, reorganize content. |
| **Mobile layout?** | Portrait-mode friendly, stacked vertically | Should be shareable as a screenshot. |

---

## THE HERO SECTION (Copy This)

```jsx
// Pseudocode structure

<ProfileHeader>
  <AvatarRow>
    [Avatar] @username
  </AvatarRow>

  <MetricsRow>
    <Score>1,135 pts</Score>         {/* gold, 4xl, hero */}
    <Rank>#8 all-time</Rank>         {/* cyan, 2xl */}
  </MetricsRow>

  <CredentialsRow>
    <Badge type="founder">Founder #18</Badge>
    <Badge type="tapestry">✓ Verified</Badge>
  </CredentialsRow>

  <SocialRow>
    <Count>👥 2 Followers</Count>
    <Count>👁️ 3 Following</Count>
    <Stat>Streak: 4 weeks</Stat>
  </SocialRow>

  <ActionRow>
    <Button>FOLLOW</Button>
    <Button type="ghost">Share</Button>
    <Button type="icon">⋯</Button>
  </ActionRow>
</ProfileHeader>
```

**Design Tokens:**
```
Score:
  - Font: Plus Jakarta Sans 700
  - Size: text-4xl (48px desktop, 2xl mobile)
  - Color: text-gold-500
  - Margin: mb-2

Rank:
  - Font: Inter 700
  - Size: text-2xl
  - Color: text-cyan-500

Badges:
  - Font: Inter 600
  - Size: text-xs (uppercase)
  - Background: gray-800
  - Color: gray-300
  - Icon: small (16px)

Social Counts:
  - Font: Inter 400
  - Size: text-sm
  - Color: text-gray-400

Action Buttons:
  - Primary (Follow): bg-cyan-500, text-white, 44px height
  - Ghost (Share): border-gray-600, text-gray-400
  - Icon (⋯): text-gray-500
```

---

## CONTENT REORGANIZATION

### Remove from Profile
- ❌ Today's Actions card (move to Home)
- ❌ Action tiles (Browse Contests, Quests, Referrals)
- ❌ Separate "Experience Level" card (merge into Overview tab)
- ❌ Tapestry section at bottom (move badge to header)

### Keep in Tabs

**Overview Tab (DEFAULT):**
```
┌─ Weekly/Monthly/All-Time Toggle
├─ This Week: +245 pts
├─ Record: 2W 3L (40% win rate)
├─ Best Rank: #8
├─ Current Streak: 4 weeks
├─ Contests Entered: 5
└─ Level: NOVICE (0 XP / 1,234 needed)
```

**Teams Tab:**
```
┌─ Draft 1: Team Name
│  Score: 102 pts  |  ❤️ 5 likes  |  [Share]
│  [Formation visual]
├─ Draft 2: ...
└─ [Submit New Team Button]
```

**History Tab:** (keep as-is)

**Watchlist Tab:** (keep as-is)

---

## PHASED ROLLOUT (5-6 hours total)

### Phase 1: Hero Section (2-3 hours) — DO THIS FIRST
1. Create `ProfileHeader.tsx` component
2. Display: avatar, score (gold), rank (cyan), badges, social counts
3. Add Follow button, Share button, Settings menu
4. Mobile responsive: portrait-friendly stacking
5. Test on real profile (ensure numbers display correctly)

### Phase 2: Tab Reorganization (2-3 hours)
1. Move "This Week" stats to Overview tab top
2. Show W/L record prominently (not buried)
3. Move XP down (secondary)
4. Delete "Today's Actions" section entirely
5. Delete action tiles (Browse, Quests, Referrals)

### Phase 3: Polish (1 hour)
1. Update color usage (verify gold/cyan semantics)
2. Mobile testing (375px width, portrait mode)
3. Screenshot-sharing flow (ensure clean layout)
4. Verify social counts display correctly (followers, following)

---

## CRITICAL DESIGN RULES

**Rule 1: Color in Metrics, Not Chrome**
- Gold (#F59E0B) = score (semantic: "winning")
- Cyan (#06B6D4) = rank (semantic: "secondary, on-chain")
- Gray = all card backgrounds and borders
- ❌ NO colored card backgrounds, NO teal borders on elements

**Rule 2: Primary Metric Dominates**
- Score (1,135) = HUGE, gold, first thing you see
- Everything else is smaller
- Eye should land on score first, then rank, then stats

**Rule 3: Mobile First**
- Design at 375px first
- Touch targets 44x44px minimum (buttons)
- Portrait orientation (for screenshots)
- No fancy scroll effects

**Rule 4: Credentials Are Badges**
- Founder status = badge icon + text (gold background)
- Tapestry verified = checkmark badge (cyan)
- Not toggles or section headings

**Rule 5: Profile Is Read-Only**
- Navigation (Browse Contests) belongs on Home
- Daily actions belong on Home
- Profile = "Here's who I am"
- Home = "Here's what you can do"

---

## SUCCESS CHECKLIST

After redesign, verify:

- [ ] Score is gold, 48px, hero-size
- [ ] Rank is cyan, 24px, secondary
- [ ] Founder badge visible in header
- [ ] Tapestry verified badge visible in header
- [ ] Follow button works (cyan solid button)
- [ ] Share button works (portrait-friendly screenshot)
- [ ] Today's Actions section deleted
- [ ] Action tiles deleted
- [ ] Overview tab shows W/L record prominently
- [ ] XP moved to secondary (below streak/record)
- [ ] Mobile layout stacks vertically
- [ ] All text is readable at 375px
- [ ] No console errors
- [ ] Judges say "This looks professional"

---

## COMMON MISTAKES TO AVOID

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| Making XP as big as score | Keep score 3x bigger than XP |
| Using purple/teal for badges | Use gold (Founder) and cyan (Tapestry) only |
| Centering text in header | Left-align for mobile scannability |
| Keeping action tiles on profile | Delete them entirely, move to Home |
| Making Follow button gray | Make it cyan (secondary action) |
| Showing "0 XP" prominently | Show it as secondary progress bar |
| Tab design unclear | Keep tabs: Overview, Teams, History, Watchlist |
| Tapestry as separate section | Move to header as badge |

---

## FOR JUDGES/DEMO

After redesign, your profile shows:
1. **Rank #8** ← proves skill (top 1% of players)
2. **Founder #18** ← proves exclusivity (early access)
3. **✓ Tapestry verified** ← proves legitimacy (on-chain backed)
4. **1,135 FS + win rate** ← proves consistency
5. **Clean, professional layout** ← proves polish

The narrative: "Serious early player who earned rank through skill and strategy."

---

## IMPLEMENTATION ORDER (Start with Phase 1)

1. **Screenshot current Profile** (before state)
2. **Implement ProfileHeader component** (hero section)
3. **Remove action tiles and Today's Actions** (clean up)
4. **Reorganize Overview tab** (move win rate up)
5. **Reorganize Teams tab** (add like counts)
6. **Mobile test** (375px, portrait)
7. **Screenshot new Profile** (after state)
8. **Compare** (did it improve?)
9. **Share with judges** (get feedback)

**Estimated Time: 5-6 hours**

**ROI: High** (judges will immediately notice the profile looks more professional and credible)

---

**Created:** February 25, 2026
**Status:** Ready for Phase 1 implementation
