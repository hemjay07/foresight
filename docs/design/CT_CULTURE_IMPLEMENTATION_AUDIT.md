# CT Culture Implementation Audit

> **For:** Design review, QA, feature sign-off
> **Use:** Before merging any PR, before screenshot validation, before demo
> **Time per page:** 10 minutes

---

## How to Use This Audit

1. Select the page/feature to audit (e.g., "Draft Page")
2. Go through each section
3. Mark items as ✅ (pass), ⚠️ (needs work), or ❌ (fail)
4. Document failures with line numbers/screenshots
5. Fix before shipping
6. Record pass/fail in git commit message

---

## UNIVERSAL CHECKS (Every Page/Feature)

### Colors & Theming

- [ ] **Background is dark** (`#0A0A0F`, `#12121A`, or `#1A1A24`)
  - ❌ FAIL if: Any `bg-white`, `bg-gray-100`, or light background visible
  - [ ] Screenshots: Full page screenshot showing darkness throughout

- [ ] **No purple or violet colors** (even in disabled states)
  - ❌ FAIL if: Any `purple-*` or `violet-*` classes or hex codes
  - [ ] Search code: `grep -r "purple\|violet" --include="*.tsx" --include="*.css"`

- [ ] **No pastel colors** (bright greens except neon for real-time)
  - ❌ FAIL if: Any pastel colors visible (e.g., `bg-blue-100`, `bg-green-200`)
  - [ ] Visual inspection: Does any color look "soft" or "friendly"?

- [ ] **Gold accent (#F59E0B) used correctly**
  - ✅ PASS if: Primary CTA, winning status, rank #1, Spotlight bonus
  - ❌ FAIL if: Used for secondary actions, disabled states, or decorative

- [ ] **Cyan accent (#06B6D4) used correctly**
  - ✅ PASS if: Secondary actions, rank #2, secondary links, Tapestry dot
  - ❌ FAIL if: Used for primary actions or decorative

- [ ] **Neon green (#10F981) only for real-time indicators**
  - ❌ FAIL if: Used for anything except "live now," "updated now," or real-time states
  - [ ] Search: `grep -r "10F981\|#10f981" --include="*.tsx" --include="*.css"`

- [ ] **No gradient backgrounds on cards**
  - ❌ FAIL if: Any `bg-gradient-to-*` on card/container elements
  - [ ] Search: `grep -r "bg-gradient" --include="*.tsx" | grep -v "icon\|badge"`
  - ✅ PASS if: Gradients only on small icons/badges inside cards

- [ ] **No excessive shadows or glows**
  - ❌ FAIL if: Glowing text, halos, or heavy shadows (`shadow-lg`, `shadow-xl`)
  - [ ] Visual: Does any element have a "glow"?
  - ✅ PASS if: `shadow-sm` or no shadow

### Typography

- [ ] **All numbers use monospace font (JetBrains Mono)**
  - ❌ FAIL if: Any number in sans-serif or serif font
  - [ ] Search component: Find score displays, rank numbers, counts
  - [ ] Verify: `class="font-mono"` or `style={{fontFamily: 'JetBrains Mono'}}`

- [ ] **Body text uses Inter font**
  - ❌ FAIL if: Different font used for copy
  - [ ] Check: `font-inter` or default `font-sans`

- [ ] **Display/headings use Plus Jakarta Sans**
  - ❌ FAIL if: Different font used for titles
  - [ ] Check: Large headings have proper font-weight (600-700)

### Copy & Language

- [ ] **No emojis in UI copy** (except rare, earned moments)
  - ❌ FAIL if: Emojis in button text, labels, or routine copy
  - ✅ PASS if: Maybe one emoji in celebration message after major win
  - [ ] Search: `grep -r "🚀\|🎉\|🎊\|✨" --include="*.tsx" --include="*.ts"`

- [ ] **No corporate language** (activate, leverage, engage, ecosystem)
  - ❌ FAIL if: Any of these words in UI copy
  - [ ] Search: `grep -r "activate\|leverage\|engage\|ecosystem" --include="*.tsx"`
  - [ ] Read every button label, heading, and placeholder text

- [ ] **No "fun" tone** (no try-hard humor, "awesome," "nice work")
  - ❌ FAIL if: Patronizing messages, false enthusiasm, forced jokes
  - [ ] Examples: "Awesome! You're winning!" → "You're #1" (just state it)
  - [ ] Search: `grep -r "awesome\|great job\|nice work" --include="*.tsx"`

- [ ] **CTAs are 1-3 words** (Draft, Submit, Play, Compete)
  - ❌ FAIL if: Button text is >3 words or uses verbs+objects
  - [ ] Check every button: `<button>` → must be ≤3 words

- [ ] **Placeholders and labels use native language**
  - ❌ FAIL if: Placeholder says "Enter your email" → ✅ Say "Email"
  - [ ] Check form inputs: Are they concise and clear?

- [ ] **No vague phrases** (each sentence explains something concrete)
  - ❌ FAIL if: "Unlock the power of influence" → ✅ "Track influencer engagement"
  - [ ] Read every subtitle and description

### Information Density

- [ ] **10+ rows of data visible on mobile without scrolling** (when applicable)
  - ⚠️ PARTIAL if: 5-9 rows visible (acceptable but could be denser)
  - ❌ FAIL if: <5 rows visible, forces scrolling immediately
  - [ ] Mobile screenshot: Show first screen without scroll

- [ ] **Key metrics visible immediately** (no tabs, modals, or hidden sections)
  - ❌ FAIL if: Important data hidden behind "Show More," tabs, or collapse
  - [ ] Leaderboard: Rank, name, score all visible at once
  - [ ] Contest detail: Rules, timeline, prizes all visible

- [ ] **Formulas are explainable or visible**
  - ❌ FAIL if: Black-box scoring (no explanation)
  - ✅ PASS if: Tooltip on hover shows calculation, or explanation section exists
  - [ ] Example: "Score = Activity (12) + Engagement (35) + Growth (8) = 55"

- [ ] **Data sources documented**
  - ❌ FAIL if: "Where did this number come from?" is unanswerable
  - ✅ PASS if: Small text says "Updated from Twitter API" or "Community voted"
  - [ ] Check: Tooltip, footer note, or "data source" badge

- [ ] **Timestamps show when data was last updated**
  - ❌ FAIL if: Data is stale and user doesn't know when it was last refreshed
  - ✅ PASS if: "Updated 23 seconds ago" or "Last updated 2:34 PM"
  - [ ] Visible on: Leaderboard, contest scores, influencer stats

### Gamification

- [ ] **Scoring is skill-based, not luck-based**
  - ❌ FAIL if: Any randomness in scoring (random tier selection, random bonuses)
  - ✅ PASS if: Scoring is 100% deterministic and data-driven

- [ ] **Captain bonus is strategic (1.5x multiplier)**
  - ❌ FAIL if: Captain bonus is not visible or not 1.5x
  - [ ] Check: UI clearly shows "1.5x multiplier"
  - [ ] Calculate: Captain score = influencer_score × 1.5

- [ ] **Tiers are earned by data, not arbitrary**
  - ❌ FAIL if: Tier assignment is unclear or subjective
  - ✅ PASS if: Tier is based on followers, engagement rate, or other metrics
  - [ ] Example: "S-Tier: >50K followers + >10% engagement rate"

- [ ] **No "yay!" messages for routine actions**
  - ❌ FAIL if: Toast shows "Great job!" for clicking a button
  - ✅ PASS if: Only celebrations for major milestones (top 3, beat friend, milestone)

- [ ] **Confetti only on major wins** (top 3, significant achievement)
  - ❌ FAIL if: Confetti on every action, small wins, or routine updates
  - ✅ PASS if: Confetti is rare and meaningful
  - [ ] Search: `grep -r "confetti\|animate" --include="*.tsx" | count`

- [ ] **Achievements are meaningful, not participatory**
  - ❌ FAIL if: Achievement for "Opened app 5 times" or "Scrolled this page"
  - ✅ PASS if: Achievements are real milestones ("Drafted rising star who became top 10")

- [ ] **Rankings use percentile at low user counts** (<100 users)
  - ❌ FAIL if: Showing absolute rank when it's discouraging (you're #89 of 100)
  - ✅ PASS if: Shows "Top 11%" instead
  - [ ] Leaderboard: When <100 users total, show percentile not rank

### Mobile First

- [ ] **Touch targets are ≥44px tall**
  - ❌ FAIL if: Any clickable element is <44px (measured in DevTools)
  - [ ] Buttons: Check height
  - [ ] Links in leaderboard rows: Check tap area
  - [ ] Form inputs: Check input height

- [ ] **Bottom nav has 4 items max and is thumb-reachable**
  - ❌ FAIL if: 5+ items (reduces reachability), or items not at bottom
  - ✅ PASS if: Home, Draft, Compete, Feed (4 items) in bottom nav
  - [ ] Design: Is nav at bottom of screen on mobile?

- [ ] **No hover-only states** (everything works with tap)
  - ❌ FAIL if: Any reveal or action only on hover (no tap equivalent)
  - ✅ PASS if: All hover states also work as tap states
  - [ ] Test on real phone: Tap every interaction

- [ ] **Forms use appropriate `inputmode`**
  - ❌ FAIL if: `<input type="text">` for numbers (keyboard is letters)
  - ✅ PASS if: `<input type="number">` for scores, `<input type="email">` for emails
  - [ ] Check: Number fields show number pad, email shows @ key

- [ ] **No horizontal scrolling** (except data tables if necessary)
  - ❌ FAIL if: Page scrolls left/right on mobile
  - ✅ PASS if: Content fits 375px width or stacks vertically
  - [ ] Test: Rotate phone to landscape, still no horizontal scroll?

- [ ] **No single-column layout looks cramped**
  - ❌ FAIL if: Text is tiny or unreadable on mobile
  - ✅ PASS if: Readable at 14px font size minimum
  - [ ] Mobile screenshot: Is text readable without zooming?

### Real-Time & Updates

- [ ] **Leaderboard updates every 30-60 seconds**
  - ❌ FAIL if: No updates or stale for >2 minutes
  - ✅ PASS if: Consistent 30-60s polling interval
  - [ ] Network inspector: Check XHR/fetch frequency

- [ ] **"Last Updated" timestamp is visible**
  - ❌ FAIL if: User doesn't know when data was last refreshed
  - ✅ PASS if: Shows "Updated 23 seconds ago" or similar
  - [ ] Visual: Is timestamp visible on screen?

- [ ] **Live indicator shows for real-time data** (only use neon green)
  - ❌ FAIL if: No visual indicator that data is updating
  - ✅ PASS if: "Updated now" or "Live" indicator with neon green color
  - [ ] Check: Color is #10F981 for live states only

### Navigation

- [ ] **Bottom nav is consistent across all pages**
  - ❌ FAIL if: Navigation items change order or disappear on different pages
  - ✅ PASS if: Same 4 items in same order everywhere
  - [ ] Navigate through all pages: Verify consistency

- [ ] **Back button present on sub-pages**
  - ❌ FAIL if: Sub-page has no way to go back
  - ✅ PASS if: Back button, breadcrumb, or nav clearly shows path
  - [ ] Test: Can you navigate back without using phone's back button?

- [ ] **No more than 1 level of nesting**
  - ❌ FAIL if: Page → Modal → Another Modal (too nested)
  - ✅ PASS if: Max 1 modal/sub-screen per nav level

- [ ] **Breadcrumbs exist for nested flows**
  - ❌ FAIL if: Nested page shows no path ("Where am I?")
  - ✅ PASS if: Shows path (Home > Draft > Select Captain)

### Trust & Transparency

- [ ] **Nothing is hidden or obscured**
  - ❌ FAIL if: Important info is tiny gray text or in collapsed section
  - ✅ PASS if: All relevant data is visible and readable

- [ ] **Formulas are visible, not estimated**
  - ❌ FAIL if: Score shows as "1,250" with no breakdown
  - ✅ PASS if: Breakdown shows "Activity: 35 + Engagement: 60 + Growth: 40 + Viral: 15 = 150"

- [ ] **User is treated as intelligent**
  - ❌ FAIL if: Copy is condescending ("This is easy!") or oversimplified
  - ✅ PASS if: Copy assumes user understands complex systems

- [ ] **No dark patterns or trick design**
  - ❌ FAIL if: "Unfollow" buried in tiny text, aggressive upsells, confusing CTAs
  - ✅ PASS if: All CTAs are clear and honest

- [ ] **Disclaimers are readable and honest**
  - ❌ FAIL if: Disclaimer is 6pt gray text on gray background
  - ✅ PASS if: Disclaimer is readable and clearly states limitations

- [ ] **When uncertain, transparency wins**
  - ❌ FAIL if: Ambiguous or vague language
  - ✅ PASS if: Specific, measurable, explainable

---

## PAGE-SPECIFIC AUDITS

### HOME / DASHBOARD

- [ ] **Welcome/intro shows value in <30 seconds**
  - Visual test: Does new user understand what Foresight is immediately?

- [ ] **Current contests visible** (with status, time remaining, entry fee)
  - No hidden modals or tabs to see contest list

- [ ] **Recent activity or trending topics shown** (if available)
  - Real-time updates of what's happening in community

- [ ] **CTA to "Draft" or "Join" is prominent**
  - One gold CTA button, everything else secondary

- [ ] **No unnecessary onboarding or tutorials**
  - Users should feel productive immediately, not educated

### DRAFT PAGE

- [ ] **Team formation is visual and intuitive**
  - Grid showing 5 slots (1 Captain, 4 regular)
  - Click to fill, clear to remove

- [ ] **Captain slot is visually distinct**
  - Different styling, crown icon, or "1.5x" label

- [ ] **Budget remaining is always visible**
  - "150 points remaining" shown prominently

- [ ] **Influencer cards show tier, followers, engagement rate**
  - All key metrics visible at a glance
  - No hover to see essential info

- [ ] **Search/filter for influencers works**
  - Can find specific person quickly
  - Shows results instantly (no loading delay)

- [ ] **Draft validation is clear**
  - "You're missing a Captain" or "You're over budget"
  - Error messages explain what to fix

- [ ] **Submit button only appears when draft is valid**
  - Disabled state if team is incomplete
  - One gold button to "Submit Team"

### LEADERBOARD / COMPETE PAGE

- [ ] **Rank, Name, Score visible in every row**
  - No scrolling horizontally to see key data

- [ ] **Rows are compact and scannable**
  - 10+ rows visible without scrolling (on mobile)
  - Monospace font for all numbers

- [ ] **Updates show real-time** (scores change, live indicator)
  - "Updated 12 seconds ago" visible
  - No manual refresh required

- [ ] **Top 3 have visual distinction**
  - Gold medal for #1, cyan for #2, emerald for #3

- [ ] **User's rank is highlighted**
  - Can immediately find their own position

- [ ] **Optional: Follow, Like buttons present**
  - Quiet styling (no border by default)
  - Appear on hover (mobile: always visible)

- [ ] **Filtering/sorting options work**
  - Sort by score, rank, change
  - Filter by tier, followers, etc.

### CONTEST DETAIL PAGE

- [ ] **Contest rules visible immediately**
  - Scoring breakdown, tier criteria, captain bonus
  - No tabs or modals to read rules

- [ ] **Timeline is clear**
  - Start time, end time, update frequency
  - Countdown timer if active

- [ ] **Prizes are visible and attractive**
  - Prize pool, distribution, how to claim

- [ ] **Leaderboard snapshot shows current standings**
  - Top 10, user's position, live updates

- [ ] **Related contests or upcoming contests shown**
  - Drive engagement to next contest

- [ ] **All data is real-time**
  - Scores update as engagement happens

### PROFILE PAGE

- [ ] **User stats are prominent**
  - Total score, rank, tier achievements
  - Monospace for all numbers

- [ ] **Drafted teams are shown**
  - Current contest team visible
  - Past contests and historical records accessible

- [ ] **Social elements present** (if implemented)
  - Follow count, like count, activity
  - All visible without scrolling

- [ ] **Settings link is easy to find**
  - Bottom of profile or gear icon

- [ ] **Achievements/badges shown**
  - Visual display of accomplishments
  - Not hidden in tabs

### INTEL / FEED PAGE

- [ ] **Tweets from top influencers shown**
  - Latest tweets, trending threads
  - Real-time updates (new tweets appear)

- [ ] **Highlights section shows viral tweets**
  - Top engagement, most-quoted, trending

- [ ] **Influencer cards show stats**
  - Followers, tier, engagement rate
  - Link to profile or leaderboard rank

- [ ] **No excessive whitespace**
  - Dense feed of content

- [ ] **Scrolling is smooth**
  - No lag when loading more tweets

---

## DESIGN SYSTEM AUDIT

### Button Components

- [ ] **Primary button (gold) used only for main CTA**
  - `bg-gold-500 text-gray-950 font-semibold`
  - One per page/section maximum

- [ ] **Secondary button (gray outline) used for less important actions**
  - `border border-gray-700 text-gray-300`
  - Hover: `border-gray-600 bg-gray-800`

- [ ] **Ghost button (text only) used for tertiary actions**
  - `text-gray-500 hover:text-gray-300`
  - Repeating actions use this style

- [ ] **No button has multiple colors or gradients**
  - Only solid backgrounds allowed

### Card Components

- [ ] **Cards have dark backgrounds** (`bg-gray-900` or `bg-gray-800`)
  - Not white, not gradient, not colored

- [ ] **Card borders are subtle** (`border-gray-800` or `border-gray-700`)
  - Not colored, not glowing

- [ ] **Content inside cards is legible**
  - Sufficient contrast (4.5:1 minimum)
  - Text is not tiny

### Badge Components

- [ ] **Tier badges use correct colors**
  - S: Gold (#F59E0B)
  - A: Cyan (#06B6D4)
  - B: Emerald (#10B981)
  - C: Gray (#A1A1AA)

- [ ] **Badges are prominent** (not hidden)
  - Visible on cards, profiles, leaderboards

### Input Components

- [ ] **Form inputs use appropriate types**
  - `type="number"` for numbers
  - `type="email"` for emails
  - `inputmode` set correctly for mobile keyboards

- [ ] **Placeholders are concise**
  - "Email" not "Enter your email address"

- [ ] **Labels are clear**
  - Visible above or inside input (not hidden)

### Icons

- [ ] **All icons from Phosphor icon set**
  - No custom icon designs
  - No emoji icons (use Phosphor equivalents)

- [ ] **Icon colors are semantic**
  - Gold for winning/primary
  - Gray for disabled
  - Red for destructive

---

## ACCESSIBILITY AUDIT

- [ ] **Color contrast is sufficient** (4.5:1 minimum for text)
  - Test with WebAIM contrast checker

- [ ] **Text is readable at default zoom** (no tiny text)
  - Minimum 14px for body text
  - Minimum 18px for display headings

- [ ] **Focus states are visible** (for keyboard navigation)
  - Tab through page, focus indicators visible

- [ ] **Alt text on images** (if any)
  - Describe image content, not "Image"

- [ ] **Form labels are associated** (not just placeholders)
  - `<label for="email">` pattern used

---

## PERFORMANCE AUDIT

- [ ] **Page loads in <3 seconds** (on 4G)
  - Lighthouse performance score ≥80

- [ ] **No layout shift** (CLS score <0.1)
  - Elements don't move after load

- [ ] **Animations are 60fps** (not janky)
  - No stuttering on scroll or interactions

- [ ] **API calls are batched** (not waterfall)
  - Don't load second data after first completes

---

## SIGN-OFF CHECKLIST

Before marking page as "DONE":

- [ ] All universal checks passed
- [ ] Page-specific checks passed
- [ ] Design system audit passed
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Screenshots taken (before and after if changed)
- [ ] Code review approved
- [ ] Tested on real mobile phone
- [ ] Tested with screen reader (accessibility)
- [ ] Team agrees: "This is CT-native"

**Sign-off:** (Product lead or design lead) ________________
**Date:** ________
**Notes:** _______________________________________________

---

## Common Failures & Quick Fixes

| Issue | Example | Fix |
|-------|---------|-----|
| Numbers not monospace | Score: 1,250 (serif) | Change to `font-mono` |
| Too much whitespace | 3 rows per screen | Reduce padding, show 10+ rows |
| Corporate copy | "Activate your potential" | Change to "Draft now" |
| Hidden data | Score visible, formula hidden | Show breakdown: "35+60+40=135" |
| Stale data | "Updated 2 hours ago" | Implement 30-60s polling |
| Unclear CTA | "Continue" button | Use specific: "Draft," "Submit," "Compete" |
| Gradient cards | Purple gradient card bg | Remove gradient, use flat `bg-gray-900` |
| No tier badge | Influencer visible, tier hidden | Add colored badge (gold/cyan/emerald) |
| Confetti spam | Confetti on every button click | Remove, only show on major wins |
| Light bg | White card backgrounds | Change to #12121A (dark) |

---

**Last Updated:** February 27, 2026
**Print this out. Tape it to your monitor. Refer to it constantly.**
