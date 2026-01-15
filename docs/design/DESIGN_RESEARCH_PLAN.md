# Foresight Design Research Plan

> Goal: Create a design system and philosophy that makes Foresight a memorable, $10M+ product with its own personality.

## Phase 1: Research & Discovery

### 1.1 Competitive Analysis

**Fantasy Sports (Engagement Mechanics)**
- DraftKings - How they handle draft UI, live scoring, leaderboards
- FanDuel - Contest discovery, entry flow, results celebration
- Sorare - NFT + fantasy sports hybrid, card-based design
- Sleeper - Social features, chat, modern mobile-first design

**Crypto/DeFi Apps (Visual Language)**
- Zerion - Portfolio dashboard, clean data visualization
- Zapper - Multi-chain, activity feeds, transaction history
- Rainbow - Wallet UX, NFT display, playful personality
- Uniswap - Swap interface, minimalist, trusted
- Blur - Trading interface, dark theme, professional

**Social Finance (Community Feel)**
- Robinhood - Gamification, celebrations, simple flows
- Public - Social investing, activity feeds
- Friend.tech - Crypto Twitter social, key mechanics

**Research Questions:**
- How do they handle information density?
- What makes their brand memorable?
- How do they celebrate wins/achievements?
- What's their onboarding flow?
- How do they balance data vs simplicity?

### 1.2 Visual Research Categories

**Typography**
- Primary font: Trust + Modernity (Inter, Plus Jakarta Sans, Satoshi)
- Display font: Personality + Impact (for headlines, numbers)
- Mono font: Data/scores (JetBrains Mono, SF Mono)

**Color Psychology**
- Primary: What emotion? (Trust=Blue, Energy=Orange, Wealth=Gold, Innovation=Purple)
- Secondary: Complementary actions
- Semantic: Success/Error/Warning/Info
- Dark theme: Rich blacks vs pure blacks, accent visibility

**Spacing & Layout**
- 4px or 8px base unit?
- Grid system (12-column, flexible)
- Card patterns, container widths
- Breathing room vs density

**Iconography**
- Style: Outlined vs Filled vs Duotone
- Consistency with brand personality
- Custom icons for key concepts (draft, score, tier)

**Motion & Interaction**
- Micro-interactions (hover, click, success)
- Page transitions
- Loading states (skeleton vs spinner)
- Celebration moments (confetti, particles)

### 1.3 User Flow Mapping

**Primary Personas**
1. **New User** - Curious, needs education, quick win
2. **Casual Player** - Weekly check-in, wants simple experience
3. **Power User** - Daily engagement, wants depth and stats
4. **Whale** - Competitive, wants prestige and recognition

**Core User Journeys**
1. Discovery → Understanding → First Draft → First Score → Hooked
2. Return Visit → Check Scores → Daily Actions → Explore → Leave Satisfied
3. Contest End → Results → Share → Next Contest → Repeat

**Key Screens (Priority Order)**
1. Dashboard (home base, daily actions)
2. Draft Interface (core gameplay)
3. Live Scoring (engagement driver)
4. Leaderboard (competition/social proof)
5. Profile (identity/progress)
6. Contest Discovery (entry point)

---

## Phase 2: Design System Definition

### 2.1 Brand Personality

**Brand Attributes (Pick 3-4)**
- [ ] Trustworthy
- [ ] Playful
- [ ] Professional
- [ ] Bold
- [ ] Sophisticated
- [ ] Energetic
- [ ] Innovative
- [ ] Exclusive

**Voice & Tone**
- Headlines: [Confident/Exciting/Clever]
- Body: [Clear/Friendly/Professional]
- CTAs: [Action-oriented/Inviting]
- Errors: [Helpful/Not Patronizing]

**Visual Metaphors**
- Fantasy sports? Trading floor? Social club? Arena?
- What physical space does the app feel like?

### 2.2 Design Tokens

```
Typography Scale:
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px
- 4xl: 36px
- 5xl: 48px
- hero: 60-72px

Spacing Scale (8px base):
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px

Border Radius:
- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- 2xl: 24px
- full: 9999px

Shadows:
- sm: subtle elevation
- md: cards, dropdowns
- lg: modals, popovers
- glow: brand accent glow
```

### 2.3 Component Library

**Atoms**
- Button (primary, secondary, ghost, danger)
- Input (text, number, search)
- Badge (tier, status, count)
- Avatar (user, influencer, placeholder)
- Icon (consistent set)

**Molecules**
- Card (base, highlight, interactive)
- Stat display (label + value + change)
- User row (avatar + name + stats)
- Influencer card (avatar + name + tier + price)
- Toast/notification

**Organisms**
- Navigation (desktop + mobile)
- Leaderboard table
- Draft board
- Score ticker
- Activity feed
- CT Feed

**Templates**
- Dashboard layout
- List/detail layout
- Full-screen modal
- Settings layout

---

## Phase 3: Information Architecture

### 3.1 Site Map

```
/ (Dashboard)
├── /arena
│   ├── /arena/draft (Draft interface)
│   └── /arena/vote (CT Spotlight voting)
├── /compete
│   ├── /compete/contests (Contest discovery)
│   ├── /compete/leaderboard (Rankings)
│   └── /compete/contest/:id (Contest detail)
├── /progress
│   ├── /progress/quests (Daily/weekly tasks)
│   └── /progress/achievements (Milestones)
├── /profile
│   ├── /profile/stats (Detailed statistics)
│   ├── /profile/history (Past contests)
│   └── /profile/settings (Preferences)
└── /ct-feed (Full CT Feed experience)
```

### 3.2 Navigation Philosophy

**Primary Nav (5 items max)**
- Dashboard (home, daily actions)
- Arena (play - draft & vote)
- Compete (contests & leaderboards)
- Progress (quests & achievements)
- Profile (you)

**Secondary Nav**
- Tabs within pages
- Breadcrumbs for deep pages
- Quick actions in context

### 3.3 Page Purposes

| Page | Primary Purpose | Key Action |
|------|-----------------|------------|
| Dashboard | Daily engagement hub | Complete daily action |
| Arena/Draft | Build team | Submit draft |
| Arena/Vote | Engage with CT | Cast votes |
| Compete | Find contests | Enter contest |
| Leaderboard | Check standing | View details |
| Progress | Track growth | Claim rewards |
| Profile | Identity & stats | Share/customize |

---

## Phase 4: Implementation Plan

### 4.1 Foundation (Week 1)
- [ ] Finalize design tokens
- [ ] Set up Tailwind config with tokens
- [ ] Create base component library
- [ ] Establish layout templates

### 4.2 Core Pages (Week 2-3)
- [ ] Dashboard redesign
- [ ] Draft interface overhaul
- [ ] Leaderboard rebuild
- [ ] Navigation implementation

### 4.3 Polish (Week 4)
- [ ] Micro-interactions
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Celebrations/achievements

### 4.4 Mobile (Ongoing)
- [ ] Responsive breakpoints
- [ ] Touch interactions
- [ ] Bottom navigation
- [ ] Mobile-specific patterns

---

## Research Resources

### Inspiration Sites
- Dribbble: "fantasy sports dashboard", "crypto app", "dark theme dashboard"
- Behance: "fintech app", "sports betting UI"
- Mobbin: Mobile app patterns
- Refero: Landing pages

### Design Systems to Study
- Radix UI (components)
- Shadcn/ui (Tailwind components)
- Vercel's Geist (typography, spacing)
- Linear (dark theme, professional feel)
- Discord (dark theme, community app)

### Tools
- Figma (design)
- Coolors (color palette)
- Fontjoy (font pairing)
- Phosphor Icons (current icon set)
- Heroicons (alternative)

---

## Success Metrics

A successful redesign will:
1. **Feel premium** - Users perceive value, willing to pay
2. **Be memorable** - Distinct from competitors
3. **Drive engagement** - Clear daily actions, return visits
4. **Scale gracefully** - Works for new and power users
5. **Load fast** - Performance is part of UX

---

## Questions to Answer Before Implementation

1. What 3 words describe Foresight's personality?
2. What's our primary color and why?
3. What makes us visually different from DraftKings/FanDuel?
4. What's the one thing users should remember about our UI?
5. How do we celebrate wins without being cheesy?
