# Foresight — Design Overhaul Master Tracker

> **Owned by:** CTO (Claude)
> **Goal:** Transform Foresight from hackathon prototype to a product thousands of CT users will adopt daily
> **Standard:** Enterprise-level, CT-native, War Room aesthetic — comparable to Hyperliquid/Linear in polish
> **Last Updated:** 2026-02-27

---

## The Brief (One Paragraph)

Foresight is the fantasy sports layer for Crypto Twitter. Our users are CT degens, traders, and power users who live in dark-mode terminals all day. They respect precision, hate fluff, and immediately spot anything that feels inauthentic. Our design must feel like it belongs in the same ecosystem as Hyperliquid, Axiom, and Photon — not a startup side project. Every number is data. Every interaction is deliberate. Every screen is a command center.

---

## The Team

| Role | Responsibility |
|------|----------------|
| **CTO** (orchestrator) | Process, decisions, implementation oversight |
| **Creative Director** | Brand identity, visual language, aesthetic direction |
| **UX Researcher** | Competitive analysis, user behavior, patterns that work |
| **Lead UX Designer** | Page layouts, flows, wireframes, interaction specs |
| **Frontend Architect** | Component structure, implementation patterns |

---

## Overall Status

```
Phase 1: Research & Discovery     ✅ COMPLETE (14 files, 8K+ lines)
Phase 2: Creative Direction       ✅ COMPLETE (CREATIVE_BRIEF.md)
Phase 3: Design Specs (per page)  ✅ COMPLETE (inline with Phase 4)
Phase 4: Implementation           ✅ COMPLETE (all 7 pages + components)
Phase 5: QA & Polish              ⏳ IN PROGRESS
```

---

## Phase 1: Research & Discovery

**Goal:** Understand what makes CT-native products feel excellent. Don't guess — research.

| Task | Agent | Status | Output File |
|------|-------|--------|-------------|
| Trading app aesthetics (Hyperliquid, Axiom, Photon, Birdeye) | UX Researcher | ⏳ | `docs/design/research/TRADING_APPS.md` |
| Fantasy sports UX (DraftKings, Sleeper, Sorare, Underdog) | UX Researcher | ⏳ | `docs/design/research/FANTASY_SPORTS.md` |
| Premium SaaS design (Linear, Vercel, Raycast, Clerk) | UX Researcher | ⏳ | `docs/design/research/PREMIUM_SAAS.md` |
| CT culture & product authenticity | UX Researcher | ⏳ | `docs/design/research/CT_CULTURE.md` |

---

## Phase 2: Creative Direction

**Goal:** Synthesize research into actionable brand and visual direction.

| Task | Agent | Status | Output File |
|------|-------|--------|-------------|
| Creative Director synthesis session | CD + UX Designer | ⬜ | `docs/design/CREATIVE_BRIEF.md` |
| Design token decisions (colors, type, spacing) | Frontend Architect | ⬜ | `docs/design/DESIGN_TOKENS_V2.md` |
| Component library spec | Lead UX Designer | ⬜ | `docs/design/COMPONENT_SPEC_V2.md` |

---

## Phase 3: Page Design Specs

For each page: **UX audit → Layout spec → Component list → Copy**

| Page | Designer | Status | Spec File |
|------|----------|--------|-----------|
| Feed (`/feed`) | UX Designer | ⬜ | `docs/design/pages/FEED_SPEC.md` |
| Compete/Rankings | UX Designer | ⬜ | `docs/design/pages/RANKINGS_SPEC.md` |
| Draft (`/draft`) | UX Designer | ⬜ | `docs/design/pages/DRAFT_SPEC.md` |
| Profile (`/profile`) | UX Designer | ⬜ | `docs/design/pages/PROFILE_SPEC.md` |
| Contest Detail (`/contest/:id`) | UX Designer | ⬜ | `docs/design/pages/CONTEST_DETAIL_SPEC.md` |
| Progress (`/progress`) | UX Designer | ⬜ | `docs/design/pages/PROGRESS_SPEC.md` |
| Home (`/`) | UX Designer | ⬜ | `docs/design/pages/HOME_SPEC.md` |
| Compete/Contests | UX Designer | ⬜ | `docs/design/pages/CONTESTS_SPEC.md` |

---

## Phase 4: Implementation (One Page at a Time)

**Process for each page:**
1. Read the spec file for that page
2. Screenshot current state (BEFORE)
3. Implement changes
4. Screenshot new state (AFTER)
5. Compare — iterate if needed
6. Mark complete only when visually approved

| Page | Status | Notes |
|------|--------|-------|
| Feed (Intel) | ✅ DONE | Ghost scout buttons, neon FS reward, font-mono numbers, neon live dot, trophy draft count |
| Rankings (Compete) | ✅ DONE | gold/#1 crown, gray-300/#2, emerald/#3, hover-reveal follow, font-mono scores, neon Tapestry dots |
| Draft | ✅ DONE | font-mono prices in cards + tier headers, ghost error link, Phosphor trophy icons |
| Profile | ✅ DONE | gold XP card, font-mono stats, softer Tapestry copy, all cyan UI → gray, Tapestry connect → ghost btn |
| Contest Detail | ✅ DONE | neon-green "You're In!" banner w/ left border glow, Phosphor win icons, font-mono rank/scores |
| Progress | ✅ DONE | neon claim cards, ghost claim buttons, font-mono FS amounts, neon dot indicators |
| Home | ✅ DONE | Step 2 gray (not cyan), Step 3 neon, Tapestry card gray, formation gradient gold-only |
| Compete/Contests | ✅ DONE | font-mono SOL amounts, LIVE indicator neon, gold CTA buttons |

---

## Phase 5: QA & Polish

| Task | Status |
|------|--------|
| Mobile (375px) screenshot pass — all pages | ⬜ |
| Interaction audit (hover states, loading states, empty states) | ⬜ |
| TypeScript clean (`npx tsc --noEmit`) | ✅ PASS |
| Deploy to production & verify | ⬜ |
| Final before/after comparison deck | ⬜ |

---

## Known Issues Backlog

These were identified during the initial audit and must be fixed during Phase 4:

### Global
- [ ] All numbers across the app need `font-mono` (prices, scores, ranks, stats)
- [ ] Transition timings: standardize to 150ms
- [ ] neon-green (`#10F981`) animations for real-time updates

### Feed
- [ ] Scout buttons: cyan → gold (or ghost with gold amount)
- [ ] Engagement numbers: need `font-mono`
- [ ] `🔥` → Phosphor `<Fire />` icon
- [ ] `+10 FS earned!` pill → neon-green glow treatment

### Rankings
- [ ] Rank numbers (`#1`, `#2`) → `font-mono font-bold text-gold-400`
- [ ] `2,850 FS` inline (not stacked)
- [ ] Follow button → ghost, hover-reveal only
- [ ] Score hierarchy: top 3 bold, rest subtler

### Draft
- [ ] Influencer card prices → `font-mono`
- [ ] Budget `$80 / $150` sidebar → `font-mono`
- [ ] Card vertical padding: reduce for density
- [ ] Tier headers: consistent styling

### Profile
- [ ] Tapestry "Not connected" → softer "optional upgrade" state
- [ ] Score `534 FS` → hero number, `font-mono font-black text-5xl`
- [ ] Stats row → all `font-mono`
- [ ] Avatar placeholder → generated/wallet avatar
- [ ] Share Certificate → secondary button treatment

### Contest Detail
- [ ] Stats grid numbers → `font-mono`
- [ ] "You're In!" banner → neon-green left border glow
- [ ] Team section visible without scroll on desktop

### Progress
- [ ] Score → `font-mono font-black`
- [ ] Stats row → `font-mono`
- [ ] Quest amounts (`+100 FS`) → `font-mono`

### Home
- [ ] Player card prices → `font-mono`
- [ ] Card border colors → tier-consistent only

---

## Design Principles (Non-Negotiable)

1. **Every number is data** — All numeric values use JetBrains Mono
2. **Neon green means alive** — Only use `#10F981` for real-time, wins, alerts
3. **Gold means authority** — Primary actions, #1 rank, S-tier, winning
4. **Gray is chrome** — UI structure stays gray; color lives in content
5. **Density respects users** — CT users are not afraid of information
6. **150ms is snappy** — No transitions longer than 200ms
7. **Mobile is primary** — Every decision starts at 375px
8. **No emoji in code** — Phosphor icons only

---

## Agent Collaboration Log

| Date | Session | Participants | Output |
|------|---------|--------------|--------|
| 2026-02-27 | Research kickoff | CTO + 3 Research Agents | Phase 1 research files |

