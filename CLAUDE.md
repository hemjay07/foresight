# Foresight - Claude Memory

> **Last Updated:** December 28, 2025
> **Status:** Design System Implementation - Phase 1 Complete

---

## CRITICAL: Read This First

This file persists context across Claude sessions. **Update after major decisions.**

**Current Priority:** Complete UI/UX revamp - deep analysis of every page before implementation.

### UX Philosophy (ALWAYS FOLLOW)

**Before implementing ANY UI/UX change:**
1. **STOP and THINK** - Deep-think about the layout and user flow
2. **Research** - Look at how competitors handle this pattern
3. **Question everything** - Is this the optimal layout? Would a modal, accordion, or different pattern work better?
4. **Consider alternatives** - What are 2-3 other ways to solve this?
5. **User journey** - How does this fit into the overall user flow?
6. **Mobile first** - Will this work on mobile?

**For every page/section, answer:**
- WHY does this exist?
- WHAT is the ONE primary action?
- WHO is this for (new/returning, connected/not)?
- WHERE do users come from and go to?
- HOW do competitors handle this?

Never just implement UI blindly. Always rethink from scratch to ensure we're using the best approach.

### MANDATORY: Screenshot Workflow (NEVER SKIP)

**Before ANY UI work:**
```bash
# Take screenshot of current state
./node_modules/.bin/tsx scripts/screenshot.ts /page-name --full
```

**After completing UI changes:**
```bash
# Take screenshot to verify changes
./node_modules/.bin/tsx scripts/screenshot.ts /page-name --full
```

**RULES:**
1. **ONE PAGE AT A TIME** - Never batch-edit multiple pages. Complete one fully with visual verification before moving to the next.
2. **BEFORE screenshot** - Always capture current state before making changes
3. **AFTER screenshot** - Always verify changes visually after implementation
4. **Deep analysis first** - Before coding, document in REVAMP_TRACKER.md:
   - Current problems with this page
   - Proposed changes and WHY
   - Alternatives considered
5. **No mechanical find-replace** - Never do bulk color/style changes without understanding context of each instance
6. **User approval** - For significant layout changes, share screenshot and get user approval before proceeding
7. **ALWAYS CLEAN UP** - When replacing/refactoring code:
   - Delete old files that are no longer used
   - Remove legacy routes that have been replaced
   - Don't keep "backwards compatibility" code unless explicitly requested
   - No dead code, no orphaned files, no redundant routes

### Memory System

| File | Purpose |
|------|---------|
| `CLAUDE.md` | High-level context, current focus, quick reference |
| `docs/design/REVAMP_TRACKER.md` | **Detailed page-by-page analysis and decisions** |
| `docs/design/DESIGN_TOKENS.md` | Color, typography, spacing specifications |
| `docs/design/DESIGN_RESEARCH_PLAN.md` | Competitive analysis framework |

**Always check REVAMP_TRACKER.md for current progress and open questions.**

---

## Project Overview

**Foresight (CT Draft)** - Fantasy sports for Crypto Twitter. Draft teams of CT influencers, earn points based on their engagement, compete for ETH prizes.

**Business Model:** Free tier → Paid contests (10% rake) → Premium ($4.99/mo)

**Tech Stack:**
- Frontend: React 18 + Vite + TailwindCSS
- Backend: Express + TypeScript + Knex
- Database: PostgreSQL
- Chain: Base Sepolia
- Icons: Phosphor Icons

---

## DESIGN SYSTEM (Implemented Dec 28, 2025)

### Brand Identity

**Personality:** Bold. Sharp. Electric.
**Physical Metaphor:** The Command Center
**Primary Color:** Gold/Amber (#F59E0B) - Winning, Wealth, Premium
**Secondary Color:** Cyan (#06B6D4) - Energy, Links, Accents

### Design Tokens

**File:** `docs/design/DESIGN_TOKENS.md`
**Tailwind Config:** `frontend/tailwind.config.js`
**CSS:** `frontend/src/index.css`

**Colors:**
- `gold-500` (#F59E0B) - Primary CTAs, achievements
- `cyan-500` (#06B6D4) - Secondary actions, links
- `gray-950` (#09090B) - Base background
- `gray-800` (#27272A) - Card backgrounds
- `emerald-500` (#10B981) - Success
- `rose-500` (#F43F5E) - Error

**Typography:**
- Display: Plus Jakarta Sans (700)
- Body: Inter (400-600)
- Mono: JetBrains Mono (stats/data)

**Tier Badges:**
- S-Tier: Gold (`badge-s-tier`)
- A-Tier: Cyan (`badge-a-tier`)
- B-Tier: Emerald (`badge-b-tier`)
- C-Tier: Gray (`badge-c-tier`)

### UI Components

**Location:** `frontend/src/components/ui/`
- `Button.tsx` - Primary, secondary, ghost, danger, cyan variants
- `Card.tsx` - Default, elevated, highlight, interactive variants
- `Badge.tsx` - Tier and status badges
- `Input.tsx` - Form inputs with validation

### Navigation Structure

**5 Primary Items:**
1. **Home** (`/`) - Dashboard, daily actions
2. **Arena** (`/arena`) - Draft, vote
3. **Compete** (`/compete`) - Leaderboards, contests
4. **Feed** (`/feed`) - CT Feed (curated tweets)
5. **Profile** (`/profile`) - Stats, settings, quests

### Key Documents

| Document | Location |
|----------|----------|
| Design Tokens | `docs/design/DESIGN_TOKENS.md` |
| Design Research Plan | `docs/design/DESIGN_RESEARCH_PLAN.md` |
| UI Components | `frontend/src/components/ui/` |

---

## Completed Features (Dec 28, 2025)

### CT Feed ✅
- **Backend:** `ctFeedService.ts`, API at `/api/ct-feed`
- **Frontend:** `CTFeed.tsx` component with highlights, main feed
- **Database:** `ct_tweets`, `rising_stars`, `feed_interactions` tables
- **Tests:** 33/33 backend, 15/16 frontend (1 test has RTL+fake timer issue)
- **Status:** Working but crammed into tiny section on /home page

### Puppeteer Screenshots ✅
- **Script:** `scripts/screenshot.ts`
- **Usage:** `./node_modules/.bin/tsx scripts/screenshot.ts [page] [--full]`
- **Output:** `screenshots/` directory

---

## Development Workflow

```
PLAN → REVIEW → TEST (failing) → IMPLEMENT → TEST (passing) → VERIFY
```

1. **PLAN** - Document requirements in `docs/planning/`
2. **REVIEW** - User approves before coding
3. **TEST** - Write failing tests first (TDD)
4. **IMPLEMENT** - Minimal code to pass tests
5. **VERIFY** - Screenshots + manual testing

---

## Quick Commands

```bash
# Start servers
cd backend && NODE_OPTIONS='--import tsx' pnpm dev  # :3001
cd frontend && pnpm dev                              # :5173

# Screenshots (from root)
./node_modules/.bin/tsx scripts/screenshot.ts /home --full
./node_modules/.bin/tsx scripts/screenshot.ts ctfeed

# Database
cd backend && NODE_OPTIONS='--import tsx' pnpm exec knex migrate:latest

# Tests
cd backend && pnpm test
cd frontend && pnpm test
```

---

## File Structure

```
/Users/yonko/foresight/
├── backend/
│   ├── src/
│   │   ├── api/           # Route handlers
│   │   ├── services/      # Business logic (ctFeedService.ts)
│   │   ├── middleware/    # Auth, rate limiting
│   │   └── utils/         # Helpers
│   ├── migrations/        # Knex migrations
│   └── tests/             # Vitest tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (CTFeed.tsx)
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   └── contexts/      # React contexts
│   └── tests/             # Vitest + RTL tests
├── docs/
│   ├── design/            # Design system docs (NEW)
│   ├── planning/          # Feature specs
│   └── technical/         # Architecture docs
├── scripts/
│   └── screenshot.ts      # Puppeteer automation
└── screenshots/           # Auto-generated screenshots
```

---

## API Reference

**Auth:** `localStorage.authToken` → `Authorization: Bearer <token>`

**Response format:**
```typescript
{ success: true, data: {...} }  // Success
{ success: false, error: "msg" } // Error
```

**Key endpoints:**
- `GET /api/ct-feed` - CT Feed tweets
- `GET /api/ct-feed/highlights` - Top viral tweets
- `GET /api/v2/fs/me` - User's Foresight Score
- `GET /api/league/influencers` - All influencers

---

## Known Issues

1. **Navigation confusion** - `/` is Dashboard, `/home` is landing (should be reversed or unified)
2. **CT Feed placement** - Crammed into tiny section, needs prominence
3. **Rate limiting** - Adjusted for dev (1000 req/15min), prod uses 100
4. **One flaky test** - `should track browse time` has RTL + fake timer incompatibility

---

## Design Research: Competitive Analysis Notes

### What to Study

**Fantasy Sports Apps:**
- DraftKings - Contest discovery, draft UX, results celebration
- FanDuel - Mobile-first, entry flow, leaderboards
- Sorare - NFT cards, collection feel, scarcity
- Sleeper - Social features, modern design, chat

**Crypto Apps:**
- Zerion - Clean data viz, portfolio feel
- Rainbow - Playful, personality, NFT display
- Blur - Professional, trading focus, dark theme
- Uniswap - Minimalist, trusted, simple swap

**Questions to Answer:**
- How do they handle information density?
- What makes their brand memorable?
- How do they celebrate achievements?
- What's their onboarding like?

---

## Session History

> **Moved to `SESSION_LOG.md`** to reduce token usage. Check there for historical context.

---

*Update this file after major decisions or session completions.*
