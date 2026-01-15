# MASTER LAUNCH TRACKER

> **Project:** Foresight - $10M Fantasy CT Platform
> **Created:** December 29, 2025
> **Status:** PRE-LAUNCH AUDIT IN PROGRESS

---

## CURRENT SESSION OVERVIEW

We started reviewing the League page and discovered the system needs comprehensive validation before launch. This document tracks ALL work streams.

---

## WORK STREAMS

### Stream 1: GAME DESIGN RESEARCH (NOT STARTED)
**Priority:** HIGH - Must validate before launch
**Status:** 🔴 Not Started

Questions that need research & answers:

| Question | Current Value | Research Needed | Decision |
|----------|---------------|-----------------|----------|
| Why 150 budget? | 150 points | How do DraftKings/FanDuel handle salary caps? What's the math? | TBD |
| Why 5 team members? | 5 influencers | Industry standard? More/less engaging? | TBD |
| Why 1.5x captain? | 1.5x multiplier | DraftKings uses 1.5x. FanDuel uses 1.5x. Confirm. | TBD |
| Tier pricing balanced? | S=$28-50, A=$18-28, B=$12-18, C=$8-12 | Does performance match price? | TBD |
| Scoring weights fair? | Activity 35, Engage 60, Growth 40, Viral 25 | Total 160 max - is this balanced? | TBD |
| Prize distribution? | Top 30-40% win | Industry standard? | TBD |
| Entry fees right? | 0.002-0.05 ETH | Market research on crypto game fees | TBD |
| Contest duration? | 7 days weekly | Too long? Too short? | TBD |

**Action Required:**
- Research DraftKings, FanDuel, Sorare game mechanics
- Document findings
- Validate or adjust our values

---

### Stream 2: END-TO-END TESTING (NOT STARTED)
**Priority:** CRITICAL - Must pass before launch
**Status:** 🔴 Not Started

**Test Plan:** `docs/planning/E2E_TEST_PLAN.md`

Phases to test:
- [ ] Phase 1: Contest discovery & entry
- [ ] Phase 2: Team draft flow
- [ ] Phase 3: Team editing (before lock)
- [ ] Phase 4: Scoring cycle (manual trigger)
- [ ] Phase 5: Score breakdown display
- [ ] Phase 6: Contest finalization
- [ ] Phase 7: Prize distribution

---

### Stream 3: UI/UX FIXES (PLANNED)
**Priority:** HIGH - After testing confirms backend works
**Status:** 🟡 Planned (not started)

**Plan:** `docs/planning/LEAGUE_CONTEST_OVERHAUL_V2.md`

Fixes needed:
- [ ] Captain selection UX (tiny crown → dedicated slot)
- [ ] Influencer card simplification
- [ ] My Teams section (see all teams across contests)
- [ ] Edit Team flow (clear button before lock)
- [ ] Scoring explainer (already exists in modal - verify it's accessible)

---

### Stream 4: BUG FIXES (PARTIAL)
**Priority:** CRITICAL
**Status:** 🟡 In Progress

| Bug | Status | Notes |
|-----|--------|-------|
| `/contests` route blank | ✅ Fixed | Now redirects to `/compete?tab=contests` |
| Q4 NaN bug | ✅ Fixed | Added null check in getQuarterFromDate() |
| Duplicate contestId declaration | ✅ Fixed | Removed duplicate const |
| Sidebar on wrong side | ✅ Fixed | Now on right with flex-row-reverse |
| Leaderboard tab removed | ✅ Fixed | Use /contest/:id instead |
| Squad view removed | ✅ Fixed | Redirects to /contest/:id after creation |

---

### Stream 5: CODE CLEANUP (PARTIAL)
**Priority:** MEDIUM
**Status:** 🟡 In Progress

- [x] Removed unused state variables in LeagueUltra
- [x] Removed unused imports
- [x] Simplified League.tsx to hub page
- [ ] More cleanup may be needed after testing

---

## COMPLETED WORK (This Session)

1. ✅ Created comprehensive plan: `LEAGUE_CONTEST_OVERHAUL_V2.md`
2. ✅ Fixed `/contests` route (was blank, now redirects)
3. ✅ Fixed Q4 NaN bug
4. ✅ Fixed duplicate contestId declaration
5. ✅ Moved sidebar to right side
6. ✅ Removed leaderboard tab from draft page
7. ✅ Removed squad view (redirects to contest detail)
8. ✅ Simplified League.tsx to hub page
9. ✅ Updated navigation CTAs across app
10. ✅ Completed scoring system audit
11. ✅ Created E2E test plan: `E2E_TEST_PLAN.md`
12. ✅ Documented all admin endpoints for manual testing

---

## PENDING WORK (Prioritized)

### Priority 1: CRITICAL (Before Launch)
1. 🔴 Game design research (validate 150 budget, scoring, etc.)
2. 🔴 Execute E2E test plan
3. 🔴 Fix any issues found in testing

### Priority 2: HIGH (Before Launch)
4. 🟡 Captain selection UX redesign
5. 🟡 My Teams section
6. 🟡 Edit Team flow from ContestDetail

### Priority 3: MEDIUM (Can launch without)
7. ⚪ Influencer card simplification
8. ⚪ Additional UI polish
9. ⚪ Mobile optimization

---

## KEY DOCUMENTS

| Document | Path | Purpose |
|----------|------|---------|
| Master Tracker | `docs/planning/MASTER_LAUNCH_TRACKER.md` | This file - tracks everything |
| UI/UX Plan | `docs/planning/LEAGUE_CONTEST_OVERHAUL_V2.md` | Detailed UI fixes |
| E2E Test Plan | `docs/planning/E2E_TEST_PLAN.md` | Testing checklist |
| Design Tokens | `docs/design/DESIGN_TOKENS.md` | Color, typography specs |
| CLAUDE.md | `CLAUDE.md` | Session context |

---

## RESEARCH TASKS

### R1: Fantasy Sports Game Design
**Goal:** Validate our game mechanics against industry standards

**Sources to check:**
- DraftKings salary cap system
- FanDuel lineup builder
- Sorare card pricing
- Sleeper fantasy mechanics

**Questions:**
1. What salary cap do they use?
2. How many players per team?
3. Captain/MVP multiplier?
4. How is player pricing determined?
5. Prize distribution percentages?

### R2: Crypto Gaming Market
**Goal:** Validate entry fees and prize pools

**Sources to check:**
- Polymarket entry sizes
- Other crypto prediction markets
- Web3 game economics

---

## SESSION HISTORY

### Session: Dec 29, 2025 (Current)
**Started:** League page review
**Discovered:** Multiple system-wide issues
**Pivoted to:** Comprehensive pre-launch audit
**Progress:**
- Fixed 6 bugs
- Created 3 planning documents
- Audited scoring system
- Created test plan

**Still TODO:**
- Game design research
- Execute E2E tests
- UI/UX fixes

---

## DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 29 | Keep /league and /draft separate | /league = hub with voting, /draft = full draft UI |
| Dec 29 | Sidebar on RIGHT | Better reading flow - browse left, select right |
| Dec 29 | Redirect to /contest/:id after draft | Single source of truth for results |
| Dec 29 | Remove leaderboard from draft page | Use ContestDetail for leaderboard |

---

## NEXT ACTIONS (In Order)

1. **NOW:** Research game design (budget, scoring, pricing)
2. **THEN:** Execute E2E test plan
3. **THEN:** Fix any issues found
4. **THEN:** UI/UX improvements
5. **FINALLY:** Polish and launch prep

---

*Update this document as work progresses. Never lose track of pending items.*
