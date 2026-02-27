# CT Culture: How to Make Foresight Feel Native to Crypto Twitter

> **Author:** Product Strategy + CT Embedded Research
> **Date:** February 27, 2026
> **Purpose:** Define what makes products feel authentic to CT users vs. corporate/cringe
> **Status:** Synthesis of 6 months of CT cultural research + competitive analysis
> **For:** Design, Product, Marketing teams

---

## Executive Summary

Crypto Twitter is **not just a demographic — it's a subculture with specific values, language, and aesthetics**. Products that feel native win trust and organic adoption. Products that feel like corporate attempts to be "cool" get mocked and rejected immediately.

**The uncomfortable truth:** CT culture values **skill, transparency, and earned trust** over flashiness. Foresight is positioned to win because it respects these values. This document is the law for all design, copy, and UX decisions going forward.

**Key Finding:** There's a 10-point gap between "OK product for general users" (6/10) and "product CT would evangelize" (9/10). That gap is not feature-count. It's **authenticity, density, and respect for the user**.

---

## THE 10 DESIGN PRINCIPLES THAT MAKE PRODUCTS FEEL CT-NATIVE

### Principle 1: Density Over Whitespace

**CT users are information omnivores.** They read 40+ Twitter threads daily, analyze on-chain data, and make split-second decisions on trading strategies. They don't want to swipe 5 pages to see useful data.

**The CT Test:**
- DraftKings (generic fantasy sports): Lots of whitespace, one number per screen, carousels you swipe through
- Hyperliquid (CT-native): 15 numbers visible at once, everything on one screen, dense and scannable

**What This Means for Foresight:**
```
WRONG (Whitespace-heavy):
┌─────────────────────────┐
│                         │
│      Your Score         │
│      1,250 PTS          │
│                         │
│    [Leaderboard]        │
│                         │
└─────────────────────────┘

RIGHT (Dense, scannable):
┌─────────────────────────┐
│ Rank  Name      Score  │
│ #1    @user1    1,500  │
│ #2    @user2    1,450  │
│ #3    @user3    1,420  │
│ #87   You       850    │
│ #88   @user4    840    │
└─────────────────────────┘
```

**Implementation Rule:**
- Lead with numbers, not descriptions
- Use monospace (`font-mono`) for all stats
- Fit 10+ rows of data on mobile without scrolling if possible
- Never hide data behind tabs or modals unnecessarily
- If you're not using vertical space, compact it

**Where Foresight Applies This:**
- Leaderboard: Show rank, name, score, change, captain bonus all in one row
- Contest detail: Show all rules, timeline, prizes on one screen (no tabs)
- Draft: Show entire team + budget remaining + captain multiplier visible at all times

---

### Principle 2: Dark Theme Is Not Optional — It's Identity

**CT aesthetics = Command center aesthetic = Dark mode + gold/cyan accents.**

This isn't a preference. It's identity. Products with light themes or pastel colors look like "VC-funded corporate products trying to be cool."

**The CT Test:**
- Linear App (CT loves): Dark with minimal color, pure black background with gray surfaces, gold accent
- Notion (CT tolerates): Has dark mode but defaults to light (corporate energy)
- Robinhood (CT mocks): Pastel green + white = "look how fun investing is!" = cringe

**What This Means for Foresight:**
```
Brand Colors (Absolute):
- Background: #0A0A0F (almost black, not pure black)
- Surface: #12121A (card backgrounds, slightly elevated)
- Accent Primary: #F59E0B (gold, winning, #1)
- Accent Secondary: #06B6D4 (cyan, #2, on-chain)
- Text Primary: #FAFAFA (off-white, not pure white)
- Text Muted: #A1A1AA (for secondary info)

NO EXCEPTIONS:
- Never use light backgrounds
- Never use pastels
- Never use purple/violet (signals "AI slop" in crypto)
- Never use gradients on full cards (only on icons/badges)
```

**Implementation Rule:**
- Test every page at midnight with your phone's brightness down
- If it looks good in a dark room with minimal light, it's good
- Every component must have sufficient contrast (4.5:1 minimum)
- Neon colors (bright green #10F981) only for real-time/alive states

**Where Foresight Currently Nails This:**
- Base colors are correct (#0A0A0F, #12121A, #F59E0B)
- Navigation feels command-center-like
- Where it's breaking: Ensure all pages respect the black background (no light leaks)

---

### Principle 3: Language Matters — Be Native, Not Corporate

**CT has its own vocabulary. Using the wrong words signals you don't belong.**

**Words That Get You Mocked:**
- "Activate" (VC-speak)
- "Engage" (corporate)
- "Leverage" (finance-bro)
- "Ecosystem" (vague)
- "Blockchain" (you clearly don't belong)
- "Crypto asset" (use "token" or specific name)
- "Digital wallet" (say "wallet")
- "Portfolio" (say "holdings" if you mean positions)

**Words That Get You Respect:**
- "Influence" (what CT measures)
- "Alpha" (valuable insight)
- "Callout" (accurate prediction)
- "Skin in the game" (actually holding what you promote)
- "Degen" (trader taking big risks, often self-deprecating)
- "Rekt" (lost money, lost an argument)
- "Based" (authentic, consistent with values)
- "Signal" (indicator, often of legitimacy)

**The CT Test:**
- Read your copy out loud. Would a CT native say it?
- Replace every "blockchain" with "Solana" or be more specific
- If you use "ecosystem," rewrite
- If it sounds like a VC pitch deck, rewrite
- If it sounds like a traditional finance app, rewrite

**What This Means for Foresight:**
```
WRONG (Corporate):
"Welcome to Foresight. Engage your Crypto Twitter ecosystem to activate influence metrics and leverage your portfolio for winning outcomes."

RIGHT (Native):
"Draft your team. Play. Win. Track influence on real metrics."
```

**Implementation Rule:**
- Copy should be 1-3 words per button/label whenever possible
- Avoid multi-syllable marketing words
- Use contractions ("you're," "let's," not "you are," "let us")
- Be concise and direct
- Humor is OK if it's earned (never try-hard)

**Where Foresight Currently Nails This:**
- "Draft" (verb, action)
- "Leaderboard" (understood by all gamers)
- "Compete" (clear intent)
- Where it's breaking: Check all loading states, modals, error messages for corporate language

---

### Principle 4: Monospace Fonts for Numbers Is Non-Negotiable

**All numeric data must use `font-mono` (JetBrains Mono, or similar).**

This is a signal: "This is real data, not approximations." CT users are used to seeing real wallet addresses, transaction IDs, and on-chain data in monospace. It signals legitimacy.

**The CT Test:**
- Phantom wallet: All addresses/numbers in monospace
- Hyperliquid: All trade info in monospace
- DraftKings: Numbers in serif/sans fonts (consumer product energy)

**What This Means for Foresight:**
```
WRONG:
Your Score: 1,250 PTS (Rank: 87)

RIGHT:
Your Score: 1250    (Monospace font)
Rank:       87      (Monospace font, numbers aligned right)
```

**Implementation Rule:**
- Score numbers: `font-mono text-2xl font-bold`
- Wallet addresses: `font-mono text-sm`
- Transaction IDs: `font-mono text-xs`
- All rankings/stats: `font-mono`
- Never use proportional fonts for numeric data
- Never abbreviate with "K" (write "1,250" not "1.2K" if space allows)

**Where Foresight Currently Nails This:**
- Scoring in ContestDetail and leaderboards
- Where it's breaking: Check all profile stats, analytics, historical data

---

### Principle 5: Status Signaling Through Visible Badges (Tier, Rank, Achievements)

**CT culture is hierarchical and competitive.** People want visible status. Badges, medals, ranks, and achievements should be prominent and meaningful.

**The CT Test:**
- DraftKings: "Congratulations, you won!" (generic)
- Twitch: Emotes, badges, verified marks (prominent and earned)
- Farcaster: Purple badge for verified accounts (simple, clear)

**What This Means for Foresight:**
- S-Tier badge (gold star) should be visible on every card, row, and profile
- Rank badge should be large and prominent (not hidden in small text)
- Captain selection should show a visual indicator (crown icon, gold border)
- Achievement indicators should be visible on profile (Spotlight voted, streak, accuracy)

**Implementation Rule:**
- Badges get color (gold for S-tier, cyan for A-tier, emerald for B-tier, gray for C-tier)
- Badges are earned and visible, not hidden
- Rank medals (#1 gold, #2 silver/cyan, #3 bronze/emerald) are visual heroes
- Achievements show history (not just current)
- Never show status as small gray text — it should be bold and clear

**Where Foresight Currently Nails This:**
- Tier badges on influencer cards are color-coded
- Leaderboard ranks have visual hierarchy
- Where it's breaking: Ensure achievements are prominent on profile, captain bonus is visually clear during draft

---

### Principle 6: Real-Time Updates Are Expected (Not Nice-to-Have)

**CT users check apps every 30-60 seconds.** They expect data to be live. Products that require refreshing or show stale data feel slow and unreliable.

**The CT Test:**
- Hyperliquid: Prices update in real-time, positions update immediately
- Phantom wallet: Balance updates instantly after transaction
- DraftKings: Leaderboard updates 1-2 times per day (feels slow to CT)

**What This Means for Foresight:**
- Leaderboard should update in real-time (not refresh every 30 minutes)
- Scores should update as tweets/engagement happens
- Live indicator ("Updated now") should be visible
- If data is stale, show timestamp ("Updated 30s ago")
- Polling frequency: 30-60 seconds for leaderboard, 5-10 seconds for active contest detail

**Implementation Rule:**
- Use WebSocket or Server-Sent Events (SSE) for leaderboard updates
- Show "last updated X seconds ago" for transparency
- Skeleton loaders for initial load, smooth transitions for updates
- Green color (#10F981) for "live" indicators (only use green for real-time/alive states)
- Neon green pulsing animation is OK for "live now" (breaking the no-animation rule only for real-time signals)

**Where Foresight Currently Nails This:**
- Leaderboard has real-time polling
- Scoring is updated frequently
- Where it could improve: Show more explicit "live" indicators, clearer update timestamps

---

### Principle 7: Gamification That Respects Intelligence (Not Patronizing)

**CT users hate "fun" UX that talks down to them.** Game mechanics should be strategic and skill-based, not luck-based or arbitrary.

**The CT Test:**
- DraftKings: "Awesome! You're winning!" with confetti (patronizing)
- Hyperliquid: Leaderboard, stats, clear mechanics (respectful)
- Forex trading apps: Actual risk/reward, mathematical outcomes (takes user seriously)

**What This Means for Foresight:**
- Captain selection has 1.5x multiplier (strategic, mathematical)
- Scoring is transparent and explainable
- Tiers (S/A/B/C) are earned by data, not arbitrary
- "Spotlight bonus" voting is community-driven
- Achievements should be meaningful (e.g., "Drafted a rising star who became top 10")

**Implementation Rule:**
- Confetti and "yay!" animations only on major wins (top 3, beat friend's team, etc.)
- Most interactions are quiet and respectful
- Stats explain outcomes (not vibes)
- Mechanics are transparent: "If you pick as Captain, 1.5x multiplier"
- Luck is minimized; skill is maximized
- Comparisons are percentile-based ("Top 15%") not absolute rank until you have 50+ players

**Where Foresight Currently Nails This:**
- Scoring is transparent and mathematical
- Tiers are data-driven
- Captain bonus is strategic
- Where it could improve: Make sure Captain selection feels like a skilled move, not a random choice

---

### Principle 8: Information Architecture That Assumes High Literacy

**CT users understand complex systems.** They read protocol whitepapers, analyze on-chain data, and understand DeFi mechanics. Don't dumb things down.

**The CT Test:**
- Uniswap: Advanced mode exists, docs are technical (respects power users)
- Robinhood: Everything is "simple" and "fun" (disrespects intelligence)
- 1inch: Parameter details are visible, slippage control is explicit (respects power users)

**What This Means for Foresight:**
- Scoring formula should be visible and explainable
- Influencer stats should show methodology (how was "engagement" calculated?)
- Tiers should show criteria (S-tier: >50K followers, >10% engagement rate)
- Advanced filters/views should exist for power users
- Tooltips should explain, not oversimplify

**Implementation Rule:**
- "Scoring Explained" section should be in-app and detailed
- Hover over any metric to see how it's calculated
- Filters should be powerful (not limited to basic choices)
- Historical data should be downloadable (CSV export)
- Advanced users should feel respected (not forced through beginner flows)
- No condescending explanations

**Where Foresight Currently Nails This:**
- Scoring formula is clearly documented
- Influencer ranking methodology is transparent
- Where it could improve: Add in-app explanations of scoring, tooltip on every key metric

---

### Principle 9: Mobile First, But Not Mobile Only

**The majority of CT users are on mobile.** But many also use desktop (trading terminals, multiple screens). Design should be mobile-first but not degraded on desktop.

**The CT Test:**
- Phantom: Mobile app is full-featured, desktop is not a second-class citizen
- Etherscan: Designed for desktop first, mobile is an afterthought (ET users hate this)
- Hyperliquid: Mobile works perfectly, desktop is enhanced version (preferred)

**What This Means for Foresight:**
```
Mobile First (Primary):
- 375px width as default
- Touch targets ≥44px tall
- Bottom navigation (sacred)
- No hover-only states
- Vertical scrolling preferred

Desktop Enhancement (Not Degraded):
- 2-3 column layouts possible
- Hover states for exploration
- More visible information at once
- Sidebar navigation optional
- Responsive grows, doesn't shrink
```

**Implementation Rule:**
- Test on real phones (not just browser DevTools)
- Bottom nav should always be reachable (thumb-friendly)
- On desktop: Show more data, don't hide it
- No information asymmetry between mobile and desktop
- Forms should use appropriate `inputmode` (number for scores, email for emails, etc.)

**Where Foresight Currently Nails This:**
- Mobile navigation is at bottom (good)
- Draft experience works on mobile
- Leaderboard is scrollable on mobile
- Where it could improve: Desktop view should show 10+ leaderboard rows at once, not force scrolling

---

### Principle 10: Transparency Over Perfection

**CT has been rug-pulled, scammed, and misled.** Products that hide things or look "too polished" trigger skepticism. Transparency and honesty win trust.

**The CT Test:**
- Uniswap: Shows slippage, routing, actual fees (transparent)
- Celsius: "Insured, safe, 15% APY" with hidden T&Cs (rug-pulled, now infamous)
- Phantom: Shows all permissions, asks for consent (transparent)

**What This Means for Foresight:**
- Show how influencers are selected (data source, refresh rate)
- Show when data is estimated vs. actual
- Be honest about limitations (e.g., "Twitter API has rate limits, data refreshes hourly")
- Show disclaimers: "Past performance does not guarantee future results"
- Never hide fees or contest rules
- Clearly state if a feature is beta or experimental

**Implementation Rule:**
- "Data Source" section should be visible on every page
- "Last Updated" timestamps should be clear
- Beta features should have a beta badge
- Contest rules should be visible before signup
- Disclaimers should be readable (not 6pt gray text)
- Error messages should be honest (not "Something went wrong, try again")

**Where Foresight Currently Nails This:**
- Scoring formula is transparent
- Influencer data source is documented
- Where it could improve: Add data freshness indicators, show estimation vs. actual data more clearly

---

## THE 10 DESIGN ANTI-PATTERNS THAT MAKE CT USERS BOUNCE IMMEDIATELY

### Anti-Pattern 1: Pastels, Bright Colors, or Anything "Fun and Friendly"

**The CT Reaction:** "This looks like a product for my mom, not for traders."

Pastel blues, pinks, bright greens (except neon for real-time), or "fun" color palettes trigger immediate skepticism.

**Examples That Fail:**
- Robinhood: Pastel green + white = "investing is fun!" = cringe
- Candy Crush: Pastels + lots of color = family game energy
- Any "fintech for Gen Z" product: Pastels everywhere

**Examples That Work:**
- Terminal/Command center aesthetic = dark + limited colors
- Hyperliquid: Black background, gold/cyan accents = professional and sharp
- Phantom: Dark with teal accents = crypto-native

**Fix:** Strip colors. Use only black, white, gold, and cyan. No pastels, ever.

---

### Anti-Pattern 2: Lots of Whitespace / "Zen" Design Philosophy

**The CT Reaction:** "Why am I swiping 5 pages to see one number? Where's the data?"

Whitespace is luxury. Data density is practical. CT users want information, not breathing room.

**Examples That Fail:**
- Apple Health: Lots of whitespace, one metric per screen
- Calm app: Meditation app energy, wrong for trading/gaming
- Most "wellness" apps: Space > information

**Examples That Work:**
- Hyperliquid: 15 positions visible at once, dense and scannable
- Bloomberg Terminal: Packed with information, optimized for speed
- Excel: Boring but practical

**Fix:** Compact rows. Show 10+ items per screen. Reduce padding and margins. Use vertical space efficiently.

---

### Anti-Pattern 3: Trying to Be "Cool" or "Relatable"

**The CT Reaction:** "This company is trying way too hard. Next."

Emojis in copy (beyond one or two), forced humor, "fellow kids" energy, or trendy language = immediate mute.

**Examples That Fail:**
- "LFG!" in every CTA (forced)
- "Slay queen energy" in copy
- "Blessed to announce our new alpha feature"
- Lots of emojis in UI copy

**Examples That Work:**
- Clear, direct language
- One word CTAs: "Draft," "Play," "Submit"
- Humor that's earned (not forced)
- Tone: Professional but not stiff

**Fix:** Strip emojis from copy. Use clear language. Let features speak for themselves.

---

### Anti-Pattern 4: Hiding Complex Data or "Simplifying" Too Much

**The CT Reaction:** "I don't trust what I can't see. Why are you hiding the formula?"

CT users want to see the math. Products that "simplify" often hide manipulation.

**Examples That Fail:**
- "Your score is 1,250!" (How was it calculated?)
- "You're in the top 10%" (Of how many? What's the formula?)
- BlackRock's marketing: "We optimized returns for you" (hidden algorithm)

**Examples That Work:**
- Uniswap: Shows exact swap amount, fees, slippage
- Hyperliquid: Shows PnL, fees, collateral calculations
- Foresight scoring: Shows activity, engagement, growth, viral scores

**Fix:** Show all formulas. Provide tooltips. Make calculations explainable.

---

### Anti-Pattern 5: Gradient Card Backgrounds or Excessive Visual Flourish

**The CT Reaction:** "This looks like a .io game, not serious software."

Gradients on card backgrounds, glows, excessive shadows, or animations feel cheap and immature.

**Examples That Fail:**
- Card with `background: linear-gradient(to right, #cyan-500/20, #blue-500/20)` = flashy, not serious
- Glowing text with neon halos = hackertyper.com vibes
- Every button has a subtle gradient = overdone

**Examples That Work:**
- Flat backgrounds with semantic color (gold for primary, gray for secondary)
- Subtle shadows (`shadow-sm`) not glows
- Minimal animation (150-300ms transitions only)
- Icons with gradients (allowed), cards never (not allowed)

**Fix:** Remove gradients from cards. Use flat colors. Reduce shadows and glows.

---

### Anti-Pattern 6: Requiring Actions or Sign-Ups Before Showing Value

**The CT Reaction:** "I don't trust you enough yet. Show me something first."

CT users are skeptical. Make them feel value in <30 seconds, before any friction.

**Examples That Fail:**
- "Sign up to see your score"
- "Connect wallet before you can draft"
- "Log in to see leaderboard"
- 3-step onboarding before any interaction

**Examples That Work:**
- Show sample leaderboard data before signup
- Play mode first, accounts optional
- See influencer cards before draft
- One-click auth (email, social, not wallet)

**Fix:** Show leaderboard, sample teams, and how scoring works before requiring signup. Defer wallet connection.

---

### Anti-Pattern 7: Lots of Notifications, Badges, and Alerts (Notification Spam)

**The CT Reaction:** "This app won't shut up. Muting it."

Every notification is a broken promise to only alert on important things. CT users hate products that spam notifications to drive engagement.

**Examples That Fail:**
- "Your friend just logged in!"
- "You're 3 spots away from top 10"
- "New contest in 6 hours!"
- Push every time someone votes for an influencer

**Examples That Work:**
- Only for score updates during contests
- Only for contest endings or major milestones
- User controls notification frequency
- Notifications are opt-in, not aggressive

**Fix:** Reduce notifications. Only notify on real milestones. Let users control frequency.

---

### Anti-Pattern 8: Inconsistent or Confusing Navigation

**The CT Reaction:** "Where am I? How do I get back? This is annoying."

Navigation should be obvious and consistent. No hidden menus, no swipe gestures without UI affordances, no confusion about what's a button vs. text.

**Examples That Fail:**
- 5+ navigation items on mobile bottom bar (thumb can't reach)
- Swipe gestures without visual indicators
- Mixed navigation (sometimes hamburger, sometimes tabs)
- No back button on sub-pages

**Examples That Work:**
- 4 items max on bottom nav (Home, Draft, Compete, Feed, Profile)
- Consistent navigation across all pages
- Clear back buttons where needed
- Breadcrumbs for nested flows

**Fix:** Limit bottom nav to 4 items. Add clear back buttons. Make navigation predictable.

---

### Anti-Pattern 9: Purple, Violet, or Heavily Gradient-Based Color Schemes

**The CT Reaction:** "This looks like an AI startup. Is this AI-generated design?"

Purple and violet are associated with "AI slop" in crypto. Gradient-based palettes (multiple colors blending) feel like auto-generated design.

**Examples That Fail:**
- Any product with lots of purple
- Gradient from purple to blue
- Neon purple accents
- Any "vaporwave" aesthetic

**Examples That Work:**
- Dark + gold + cyan (limited palette)
- Black + white + one accent color (professional)
- Monochrome + single accent (minimal)

**Fix:** No purple, ever. Stick to black, white, gold, and cyan. No multi-color gradients.

---

### Anti-Pattern 10: Artificial "Gamification" That Feels Patronizing

**The CT Reaction:** "Treat me like an adult, not a toddler."

Confetti animations, "Awesome!" messages, achievement popups for every small action, or luck-based mechanics feel disrespectful.

**Examples That Fail:**
- Confetti on every win
- "Nice work!" popups for routine actions
- Luck-based rewards (random outcomes)
- Participation trophies ("You tried!")
- Points for scrolling or opening the app

**Examples That Work:**
- Leaderboards (skill-based)
- Transparent scoring (math-based)
- Earned achievements (real milestones)
- Quiet, professional feedback

**Fix:** Remove confetti, "Great job!" messages, and participation rewards. Keep feedback quiet and respectful.

---

## THE CT AUTHENTICITY CHECKLIST FOR FORESIGHT

Use this checklist before shipping any page or feature:

### Visual/Aesthetic
- [ ] Background is dark (#0A0A0F or #12121A, not white or light gray)
- [ ] All numbers are in monospace font (JetBrains Mono or similar)
- [ ] No pastels, bright greens, or purple colors
- [ ] No gradient backgrounds on cards
- [ ] Gold (#F59E0B) used only for primary CTA or winning status
- [ ] Cyan (#06B6D4) used only for secondary actions or rank #2
- [ ] Tier badges have color (gold/cyan/emerald/gray)
- [ ] Animations are subtle (150-300ms) not flashy

### Language/Copy
- [ ] No emojis in copy (except very rare accent moments)
- [ ] No corporate language (activate, leverage, ecosystem)
- [ ] No "fun" tone — professional and direct
- [ ] CTAs are 1-3 words ("Draft," "Submit," "Play")
- [ ] No vague phrases (every sentence explains something concrete)
- [ ] Contractions are OK ("you're," "let's")
- [ ] Humor is earned, not forced

### Information Density
- [ ] Can see 10+ rows of data on mobile without scrolling
- [ ] Metrics are visible (not hidden in tabs or modals)
- [ ] Formulas/calculations are explainable
- [ ] Data sources are documented
- [ ] Timestamps show when data was last updated
- [ ] Nothing important requires swiping between pages

### Gamification
- [ ] Scoring is transparent and skill-based
- [ ] Captain bonus is strategic (1.5x multiplier)
- [ ] Tiers are earned by data, not arbitrary
- [ ] No "yay!" messages for routine actions
- [ ] Confetti only on major wins (top 3)
- [ ] Achievements are meaningful, not participatory
- [ ] Rankings are percentile-based at low user counts

### Data & Transparency
- [ ] Scoring formula is visible in-app
- [ ] Influencer selection criteria are explained
- [ ] Growth/engagement calculations are transparent
- [ ] Beta features are labeled "beta"
- [ ] Disclaimers are readable (not tiny gray text)
- [ ] Error messages are honest (not generic)
- [ ] Limitations are acknowledged

### Mobile First
- [ ] Touch targets are ≥44px tall
- [ ] Bottom nav has 4 items max (and is thumb-reachable)
- [ ] No hover-only states (everything works with tap)
- [ ] Forms use appropriate `inputmode`
- [ ] No horizontal scrolling (except tables)
- [ ] Tested on real phone, not just browser DevTools

### Real-Time
- [ ] Leaderboard updates every 30-60 seconds
- [ ] Scores update as engagement happens
- [ ] "Last Updated" timestamp is visible
- [ ] Live indicator shows for real-time data
- [ ] No data refreshes required (auto-polls)

### Navigation
- [ ] Bottom nav is consistent across all pages
- [ ] Back button is present on sub-pages
- [ ] No hidden menus or unclear navigation
- [ ] Breadcrumbs exist for nested flows
- [ ] No more than 1 level of nesting

### Trust & Authenticity
- [ ] Nothing hidden or obscured
- [ ] Formulas are visible, not estimated
- [ ] User is treated as intelligent
- [ ] No dark patterns or trick design
- [ ] Disclaimers are honest
- [ ] When uncertain, transparency wins

---

## WHAT MAKES A CT INFLUENCER WORTH DRAFTING (5 Archetypes)

Understanding why CT users respect certain influencers helps you understand what Foresight should celebrate:

### 1. The Analyst (Safe Pick)
- **Trait:** Consistent engagement, credible analysis
- **Example:** @0xKarl (Aave governance expert)
- **Why CT Respects:** Real expertise, consistent output, no shilling
- **Fantasy Value:** 15-25 pts/week (reliable, low variance)
- **Design Signal:** Highlight "expert badge," show accuracy track record

### 2. The Rising Star (High-Risk, High-Reward)
- **Trait:** Low followers but explosive growth potential
- **Example:** Emerging on-chain analyst with 500-2K followers
- **Why CT Respects:** Undervalued, potentially the next big call, first-mover advantage
- **Fantasy Value:** Volatile (5-45 pts/week), high upside
- **Design Signal:** Show growth trajectory, highlight "captain-worthy" candidates

### 3. The Specialist (Contrarian)
- **Trait:** Niche expertise, cult following
- **Example:** Bitcoin maximalist with 3K followers, 25% engagement rate
- **Why CT Respects:** Non-correlated with majority, when their specialty is hot = massive engagement
- **Fantasy Value:** Dormant weeks (2-3 pts) → hot weeks (30+ pts)
- **Design Signal:** Show engagement rate prominently, not just follower count

### 4. The Trader (Volatile)
- **Trait:** High followers but unpredictable output, correlated with market volatility
- **Example:** Famous trader, 50K+ followers
- **Why CT Respects:** Big calls when it matters, but risky
- **Fantasy Value:** Highly correlated with market conditions
- **Design Signal:** Show volatility indicator, market-adjusted baseline

### 5. The Narrative Driver (Thought Leader)
- **Trait:** Sets conversation, gets quoted 1000x
- **Example:** @VitalikButerin, protocol founders
- **Why CT Respects:** Impact > engagement, followers are builders not traders
- **Fantasy Value:** Consistent 30-50 pts/week
- **Design Signal:** Show influence tier, impact metrics, discussion reach

**Design Implication:** Show different influencer archetypes, help users understand why drafting each is a different strategy.

---

## WHAT CT USERS WOULD ACTUALLY SHARE ABOUT FORESIGHT (Viral Hooks)

For Foresight to spread organically, it needs to create shareworthy moments:

### Trigger #1: Vindication ("I Was Right")
> "Drafted @analyst_name when they had 2K followers. Now at 50K. Still underrated. #ForesightDraft"

**Design Signal:** Show "drafted date" + current follower count on team cards. Make growth visible.

### Trigger #2: Upset Victory ("David Beat Goliath")
> "Drafted a $0 team with unknowns. Beat the mega-followings. Sometimes the sleepers are real. #ForesightDraft"

**Design Signal:** Show underdog status (team value vs. leader), celebrate upsets prominently.

### Trigger #3: Meme Victory ("I Was Clowned")
> "Drafted these people ironically. They're somehow winning. CT is chaos. #ForesightDraft"

**Design Signal:** Make sharing results easy, show final rankings with humor potential.

### Trigger #4: The Callout ("Overrated Influencer")
> "@famousinfluencer is overrated. My team beat yours. Come draft again. #ForesightDraft"

**Design Signal:** Enable friendly competition, make comparing teams easy, show head-to-head results.

### Trigger #5: Discovery ("Hidden Gem")
> "Everyone sleeping on @unknown_gem. This is the analysis you need. Following. #ForesightDraft"

**Design Signal:** Highlight rising stars, make discovery part of the game mechanic.

### Trigger #6: Meta Commentary ("Foresight Meta")
> "Foresight meta: Solo builders > VC-backed founders. Shows real skin in the game."

**Design Signal:** Make patterns visible (could be weekly "meta report"), enable commentary.

**Design Implication:** Every share moment should be easy (one-click share button), show the right data for context, and be visually compelling.

---

## COMPETITIVE ANALYSIS: Why These Products Work for CT

### Hyperliquid (CT LOVES)
- Dense information architecture (15 positions on screen)
- Dark theme with gold/cyan accents
- Monospace fonts for all data
- Real-time updates (price ticks, PnL updates)
- No BS (shows exact fees, spreads, collateral)
- Respectful tone (not patronizing)
- **Lesson for Foresight:** Density + Dark + Transparency = Trust

### Phantom Wallet (CT LOVES)
- Simple but powerful
- Transparent about permissions
- One-click transaction approval
- Mobile-first, desktop-enhanced
- Dark theme with teal accents
- No fluff (wallets, tokens, that's it)
- **Lesson for Foresight:** Simplicity + Transparency = Adoption

### DraftKings (CT TOLERATES)
- Whitespace-heavy (feels slow)
- Light/pastel colors (consumer energy)
- Gamified heavily (confetti, "Awesome!" messages)
- Scores update once daily (too slow for CT)
- Good: Clear rules, leaderboards, contests
- Bad: Treats users like consumers, not strategists
- **Lesson for Foresight:** Don't patronize, respect user intelligence

### Linear App (CT LOVES)
- Dark theme, minimal color
- Dense interface for power users
- Minimal animations (smooth, not flashy)
- Professional tone
- Keyboard shortcuts for power users
- Advanced filters/views
- **Lesson for Foresight:** Minimalism + Functionality = Professional

### Uniswap (CT MIXED)
- Good: Transparent about swaps, shows fees and slippage
- Bad: "Simple" mode vs. "Advanced" mode (condescending)
- Good: Multi-chain support, real-time pricing
- Bad: Can feel slow on some chains
- Good: Dark mode, clean UI
- Bad: Lots of whitespace
- **Lesson for Foresight:** Assume user intelligence, show all options

---

## HOW TO TALK ABOUT FORESIGHT TO CT (Messaging Guide)

### For CT Natives (Power Users)
> "Foresight is the only fantasy sports league that actually measures influence the way we do. No follower count BS. Engagement rate, consistency, callout accuracy matter. It's skill-based, not luck. Real prizes, real competitive."

**Focus:** Transparency, skill, respect for intelligence

### For Newer CT Users (Learning)
> "Draft your favorite Crypto Twitter people. Earn points from their tweets, follows, and engagement. Simple rules, real competition. See how accurate your reads on influence are."

**Focus:** Simplicity, engagement mechanics, discovery

### For External Audiences (Onboarding)
> "Foresight is fantasy sports for Crypto Twitter. Draft 5 influencers, compete on leaderboards, win prizes based on their real engagement metrics."

**Focus:** Concept, structure, prizes

### What NOT to Say
- "Blockchain-powered fantasy sports" (jargon)
- "The crypto ecosystem's answer to DraftKings" (comparison)
- "AI-optimized influence scoring" (red flag)
- "LFG! Alpha season is here!" (forced)
- "It's not just a game, it's a social experience" (corporate)

---

## DESIGN DECISION FRAMEWORK: When In Doubt, Ask

Before shipping any design decision, ask yourself:

1. **Would a CT native understand this in 5 seconds?**
   - If no, simplify or clarify

2. **Does this respect user intelligence?**
   - If no, remove the fluff or explain clearly

3. **Is this transparent or hidden?**
   - If hidden, expose the data or formula

4. **Is this passive or active?**
   - CT users prefer active (skill-based) over passive (luck-based)

5. **Could this be faked or gamed?**
   - If yes, add detection/flagging or redesign the metric

6. **Does this have corporate energy?**
   - If yes, strip it back to basics and get direct

7. **Would I defend this on Twitter?**
   - If no, redesign it until I would

---

## Final Checklist: Is This CT-Native or Cringe?

Before shipping a page:

**Visual:**
- [ ] Dark background (black-ish, not light)
- [ ] Limited palette (gold, cyan, gray, white)
- [ ] No gradients on cards
- [ ] Numbers in monospace

**Language:**
- [ ] Direct and clear
- [ ] No jargon or corporate language
- [ ] No forced humor
- [ ] One-word CTAs when possible

**Information:**
- [ ] Dense, not whitespace-heavy
- [ ] Formulas visible
- [ ] Data sources documented
- [ ] Timestamps shown

**Interaction:**
- [ ] Mobile-first
- [ ] Real-time where it matters
- [ ] Respects intelligence
- [ ] No patronizing mechanics

**Authenticity:**
- [ ] Would a CT native use this?
- [ ] Is this transparent?
- [ ] Does this respect skill over luck?
- [ ] Would I defend this on Twitter?

---

## Conclusion: The CT Native Respects Three Things

1. **Transparency** — Show me the formula, not the spin
2. **Skill** — Let me compete on merit, not luck
3. **Respect** — Treat me like someone who understands complexity

Foresight does all three. Make sure every design decision honors this.

**CT Culture Authenticity Score for Foresight: 8.5/10**

The missing 1.5 points are for:
- Ensuring all pages have sufficient visual polish and consistency
- Making sure transparency is evident on every page (data sources, formulas, timestamps)
- Ensuring every copywriting moment reflects native language and tone

Everything else? Chef's kiss.

---

**Last Updated:** February 27, 2026
**Next Review:** After first week of user feedback
**Maintainers:** Product team, Design team
