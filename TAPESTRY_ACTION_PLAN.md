# TAPESTRY BOUNTY: 48-Hour Action Plan

> **Start:** Friday, Feb 25, 2026
> **Deadline:** Sunday, Feb 27, 2026, 11:59 PM UTC
> **Target:** 80-82/100 → 1st place, $2.5K
> **Status:** READY TO EXECUTE

---

## TL;DR: What You Need to Know

**Current situation:** Your Tapestry integration is solid but invisible. Judges see it as nice infrastructure, not essential. Score: ~69/100 (2nd-3rd place, $1-1.5K).

**What to do:** Spend 14-16 hours building 3 visible features that make Tapestry load-bearing. Score will jump to 80-82/100 (1st place, $2.5K).

**Why it works:** Judges can verify everything on Tapestry explorer. Clear demo story. Novel use cases.

---

## Step 1: Read This (30 minutes)

### Quick Overview (5 min)
Read: `/docs/TAPESTRY_EXPERT_MEMO.md`
- Why current integration scores 69/100
- Why full implementation scores 80-82/100
- What judges care about (verifiable, load-bearing, novel)

### Strategy Deep Dive (10 min)
Read: `/docs/TAPESTRY_STRATEGY_FOR_JUDGES.md` sections 1-5
- The difference between decorative and load-bearing
- 3 features that make Tapestry essential
- Top 5 demo moments (your roadmap)

### Decision Matrix (5 min)
Read: `/docs/TAPESTRY_DECISION_MATRIX.md`
- Feature priorities
- Timeline breakdown
- Risk-reward analysis
- Judge evaluation checklist

### Navigation Guide (10 min)
Read: `/docs/TAPESTRY_IMPLEMENTATION_INDEX.md`
- How to use all documents
- Cross-references
- FAQ

---

## Step 2: Team Decision (15 minutes)

### Ask: Do we want $2.5K or $1.5K?

**Option A: Day 1 Only (8 hours, +5 points = 74/100)**
- Draft receipts
- Reputation badges
- Visibility banners
- Result: 2nd-3rd place, $1-1.5K
- Risk: Low
- Upside: Medium

**Option B: Both Days (14-16 hours, +11-13 points = 80-82/100)**
- Everything in Day 1 PLUS
- Scouting panel
- Social graph impact
- Result: 1st place, $2.5K
- Risk: Medium (but all code is ready)
- Upside: High

**Recommendation:** Option B. Code is ready, effort is feasible, payoff is clear.

### Commit as a Team
If choosing Option B:
- [ ] Frontend engineer: Commit to 9 hours (Fri + Sat)
- [ ] Backend engineer: Commit to 4 hours (Sat morning)
- [ ] Demo/Marketing person: Commit to 3 hours (Sat evening)
- [ ] Exec/Lead: Commit to reviewing + final QA

---

## Step 3: Friday (8 hours) — Build Visibility

**Goal:** Make Tapestry visible everywhere. Expected score: 69 → 74 (+5 points)

**Before starting:** Read `/docs/TAPESTRY_BOUNTY_QUICKSTART.md` sections 1.1-1.5

### Frontend Lead: 6 hours

**Task 1.1: Draft Receipt Component (2 hours)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 1.1
- Copy: Full code from `DraftReceipt.tsx` code block
- Create file: `/frontend/src/components/DraftReceipt.tsx`
- Paste code
- Modify Draft.tsx to show component in success modal
- Test: Make sure it renders + link works

**Task 1.2: Reputation Badges (2 hours)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 1.2
- Navigate: `/frontend/src/pages/Compete.tsx` (leaderboard section)
- Add: S/A/B/C tier calculation logic (code provided)
- Add: Tier badge rendering next to player name
- Test: Check all 4 tiers show correctly
- Mobile: Test at 375px width

**Task 1.3: Visibility Banners (2 hours)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 1.3
- Add: Header banner to Draft page (says "Saved to Solana")
- Add: Rules section to Contest detail (says "Verified on Tapestry")
- Add: Profile page enhancement (already has TapestryBadge)
- Add: Leaderboard footer (says "All data verified on Tapestry Protocol")
- Test: All text visible, colors correct

### Backend Lead: 1 hour
- Verify: `tapestryService.storeTeam()` returns `contentId`
- Check: `prizedContestsV2.ts` returns `tapestryContentId` in response
- If missing: Add it
- Test: Call endpoint, confirm contentId returned

### QA Person: 1 hour
- Run: `cd frontend && npx tsc --noEmit` (zero errors?)
- Run: `cd frontend && pnpm build` (clean build?)
- Test: All visible changes appear correctly
- Mobile: Test Draft page + Leaderboard at 375px

**End of Day 1:** Commit + push all changes
```bash
git add .
git commit -m "feat: Tapestry visibility - Draft receipts, reputation, banners

- Add DraftReceipt component (shows immutable proof)
- Add reputation badges to leaderboard (S/A/B/C tiers)
- Add visibility banners to Draft, Contest Detail, Leaderboard
- All changes visible to users, judges see Tapestry everywhere"
```

---

## Step 4: Saturday (6-8 hours) — Build Innovation

**Goal:** Add load-bearing feature (scouting). Expected score: 74 → 80-82 (+6-8 points)

**Before starting:** Read `/docs/TAPESTRY_BOUNTY_QUICKSTART.md` sections 2.1-2.4

### Backend Engineer: 2 hours

**Task 2.1: Followed Drafts Endpoint (2 hours)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 2.1
- Copy: Full code from `tapestryFollowedDrafts.ts` code block
- Create file: `/backend/src/api/tapestryFollowedDrafts.ts`
- Paste code
- Register: Add to `/backend/src/server.ts` imports + route
- Test:
  - Endpoint responds: `curl http://localhost:3001/api/tapestry/followed-drafts?contestId=6`
  - Returns correct format (playerId, playerName, picks array)
  - Auth works (requires Bearer token)

### Frontend Engineer: 3 hours

**Task 2.2: Scouting Panel Component (2 hours)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 2.2
- Copy: Full code from `ScoutingPanel.tsx` code block
- Create file: `/frontend/src/components/draft/ScoutingPanel.tsx`
- Paste code
- Check: All imports correct, no TypeScript errors

**Task 2.3: Integration (1 hour)**
- Open: `TAPESTRY_BOUNTY_QUICKSTART.md` section 2.3
- Navigate: `/frontend/src/pages/Draft.tsx`
- Import: `import ScoutingPanel from '../components/draft/ScoutingPanel';`
- Add: Component to right sidebar (see code block)
- Test: Panel loads + shows followed players
- Mobile: Test responsive behavior (should stack on mobile)

### QA + Testing: 1-2 hours

**Task 2.4: Testing & Polish**
- Verify: Backend endpoint returns correct data
- Verify: Frontend panel loads without errors
- Test: Click to expand/collapse players
- Test: Accuracy % shows correctly
- Test: Mobile responsive (375px, 768px, 1024px)
- Check: No TypeScript errors (`npx tsc --noEmit`)
- Check: Production build clean (`pnpm build`)

**End of Day 2:** Commit + push all changes
```bash
git add .
git commit -m "feat: Scouting insights - Load-bearing social feature

- Add GET /api/tapestry/followed-drafts endpoint
- Add ScoutingPanel component (shows followed players' teams)
- Wire to Draft page (right sidebar)
- Proves social graph directly impacts gameplay
- Innovation feature for Tapestry bounty"
```

---

## Step 5: Saturday Evening (1.5-2 hours) — Demo Video

**Who:** 1 person (marketing/demo lead)
**Duration:** 3 minutes
**Script:** Word-for-word provided in `/docs/TAPESTRY_BOUNTY_QUICKSTART.md`

### Recording Setup (15 min)
- Device: Laptop + webcam OR screen recording software
- Resolution: 1080p minimum
- Lighting: Natural light, avoid shadows
- Audio: Use mic, test levels
- Background: Clean, professional

### Recording Script (Follow exactly)

**Moment 1: Draft Receipt (0:00-0:45)**
1. Open app, navigate to Draft
2. Build a team (show formation visual)
3. Click "Submit Team"
4. Success modal appears
5. Point to draft receipt card
6. Say: "Every team is locked on Solana the moment you submit."
7. Click "View Proof on Tapestry"
8. Opens explorer showing immutable content
9. **Key point:** Judges see this is verifiable

**Moment 2: Reputation (0:45-1:30)**
1. Navigate to Leaderboard
2. Point out reputation badges (S/A/B/C tiers)
3. Click a player's profile
4. Show TapestryBadge with profile info
5. Click "View on Tapestry"
6. Show profile properties (contests, accuracy, tier)
7. Say: "Player reputation is verifiable on Solana. No faking it."
8. **Key point:** This is on-chain, judges can verify

**Moment 3: Scouting (1:30-2:15)**
1. Go back to Draft page
2. Show right sidebar "Scouting Insights"
3. List of 5 followed players
4. Click one to expand
5. Show their team composition
6. Say: "You learn from your network. The social graph directly improves your draft."
7. **Key point:** Tapestry feature drives gameplay

**Moment 4: Friends Leaderboard (2:15-3:00)**
1. Navigate to Compete > Leaderboard > Friends tab
2. Show only followed players, ranked
3. Point out "Verified on Tapestry" badges
4. Click a friend, show their past drafts
5. Say: "Social graph is load-bearing. Remove Tapestry, this breaks."
6. **Key point:** Judges see ecosystem integration

### Editing (15-30 min)
- Add captions (optional, helps with sound-off viewing)
- Add title card: "Foresight: Tapestry-Native Fantasy Sports"
- Add closing card: "Built for Solana Graveyard Hackathon"
- Export as MP4 (1080p, H.264)

### Checklist Before Submitting
- [ ] All 4 moments show clearly
- [ ] Audio is clear (can understand every word)
- [ ] No technical glitches
- [ ] Under 3:30 (preferably under 3 min)
- [ ] Judges can read every UI element
- [ ] Verifiable links shown (Tapestry explorer)

---

## Step 6: Sunday (2 hours) — Final Polish & Submit

### 9:00 AM: Documentation (1 hour)

**Update README.md:**
```markdown
## Tapestry Protocol Integration

Foresight is built on Tapestry Protocol, Solana's social graph. Every team,
score, and player interaction is stored immutably on-chain and verifiable.

### Load-Bearing Features:
- **Immutable Draft Receipts** — Proof your predictions locked on Solana
- **On-Chain Reputation** — Verifiable player expertise scores
- **Scouting via Social Graph** — See what followed players drafted

See: [TAPESTRY_STRATEGY_FOR_JUDGES.md](./docs/TAPESTRY_STRATEGY_FOR_JUDGES.md)
```

**Create GitHub comment/issue:**
```markdown
# Tapestry Protocol Bounty Submission

This submission leverages Tapestry Protocol's social graph as a load-bearing
foundation for competitive fantasy sports.

**Features:**
- Draft receipts stored on Solana (verifiable proof of predictions)
- Player reputation derived from on-chain contest history
- Scouting mechanics powered by Tapestry social graph

**Expected Score:** 80-82/100 (1st place, $2.5K)

See documentation in `/docs/TAPESTRY_*.md` for full strategy.
```

### 10:00 AM: Final QA (0.5 hours)

Checklist:
- [ ] All features work end-to-end
- [ ] No TypeScript errors (frontend + backend)
- [ ] Production builds clean
- [ ] Mobile responsive (test at 375px)
- [ ] Demo video is clear + under 3:30
- [ ] All links work (Tapestry explorer)

### 10:30 AM: Submit (0.5 hours)

1. Ensure all code is committed and pushed
2. Create final GitHub tag: `v-tapestry-bounty`
3. Upload demo video to hackathon platform (if required)
4. Fill out bounty submission form with:
   - Repo link
   - Demo video link
   - 2-3 sentence description:
     > "Foresight uses Tapestry Protocol as a load-bearing foundation for
     > competitive fantasy sports. Immutable draft receipts, on-chain reputation,
     > and scouting mechanics make the social graph central to gameplay. All
     > features verifiable on Solana."
5. **Submit before 11:59 PM UTC**

---

## Time Tracking

### Friday: 8 hours
```
08:00-10:00: Draft Receipt (2h)
10:00-12:00: Reputation Badges (2h)
12:00-13:00: LUNCH
13:00-15:00: Visibility Banners (2h)
15:00-16:00: QA + Testing (1h)
```

### Saturday: 7-8 hours
```
09:00-11:00: Followed Drafts Endpoint (2h)
11:00-13:00: Scouting Panel UI (2h)
13:00-14:00: LUNCH
14:00-15:00: Integration + Testing (1h)
15:00-16:30: Demo Video (1.5h)
```

### Sunday: 2 hours
```
09:00-10:00: Documentation + polish (1h)
10:00-10:30: Final QA (0.5h)
10:30-11:00: Submit (0.5h)
```

**Total: 17-18 hours (with buffer)**

---

## Success Looks Like

**Friday End-of-Day (After Step 3):**
- Draft receipts show in modal with Tapestry link
- Reputation badges visible on leaderboard
- Visibility banners on Draft, Contest, Leaderboard pages
- Score estimate: 69 → 74/100

**Saturday End-of-Day (After Step 4):**
- Scouting panel loads in Draft page sidebar
- Clicking player expands their team
- Social graph visibly impacts gameplay
- Demo video recorded and edited
- Score estimate: 74 → 80-82/100

**Sunday Submission:**
- All code committed + pushed
- Demo video uploaded
- Submission form completed
- **Expected result: 1st place, $2.5K**

---

## If Something Goes Wrong

### "Draft receipt component won't render"
→ Check: Is `storeTeam()` returning contentId?
→ Check: Is component imported in Draft.tsx?
→ Check: Is it inside the success modal?

### "Reputation badge calculation is wrong"
→ Check: `foresight_score` is populated for player?
→ Check: Calculation: `Math.floor(foresight_score / 25)` = tier?
→ Check: CSS classes for tier colors are correct?

### "Scouting panel not loading"
→ Check: Backend endpoint returns 200?
→ Check: Auth token being sent in headers?
→ Check: User has followed other players?

### "Tapestry API is slow during demo"
→ Cache responses (5-minute TTL)
→ Have fallback text ready ("Scouting unavailable")
→ Pre-record demo with data cached

### "Don't have time for Day 2"
→ Ship Day 1 only (still 74/100, still 2nd-3rd place, $1-1.5K)
→ Better incomplete than late

---

## Communication Plan

### To Your Team (Slack/Email)
```
Subject: 48-Hour Tapestry Sprint - Let's Win $2.5K

Team,

We have a clear path to 1st place in the Tapestry bounty. The strategy
is complete (all docs in /docs/TAPESTRY_*.md), code is ready (copy-paste),
and timeline is feasible (14-16 hours).

Day 1 (Fri): Visibility - Draft receipts, reputation, banners (8h)
Day 2 (Sat): Innovation - Scouting panel, demo (6-8h)
Day 3 (Sun): Polish & submit (2h)

Current score: 69/100 (2-3rd place)
Target score: 80-82/100 (1st place, $2.5K)

Who's in?

[Leader name]
```

### To Judges (Submission Form)
```
Foresight transforms Tapestry Protocol from infrastructure to game mechanic.

Load-bearing features:
• Immutable draft receipts (verifiable on Tapestry explorer)
• On-chain reputation scores (proof of expertise)
• Scouting mechanics powered by social graph (verifiable gameplay impact)

If you remove Tapestry, three core features break. This is Tapestry-native.

See demo video + full strategy docs for details.
```

---

## Final Motivation

You're not trying to win a generic hackathon. You're competing for a **protocol-specific bounty** where judges are experts in Tapestry Protocol.

They've seen 50+ submissions. Most are decorative (storage + badge). You're building something they've never seen (immutable proofs + on-chain reputation + social-graph-driven gameplay).

They can **verify everything on Tapestry explorer**. That's your competitive advantage.

14-16 hours. Clear roadmap. Code ready. Go win $2.5K.

---

## Checklist: Before You Start

- [ ] Read TAPESTRY_EXPERT_MEMO.md ✓
- [ ] Read TAPESTRY_STRATEGY_FOR_JUDGES.md ✓
- [ ] Read TAPESTRY_BOUNTY_QUICKSTART.md ✓
- [ ] Team committed to 14-16 hours ✓
- [ ] Roles assigned (frontend, backend, demo, QA) ✓
- [ ] Calendar blocked Friday-Sunday ✓
- [ ] Environment set up (repos cloned, dev servers ready) ✓
- [ ] Slack/email open for coordination ✓

**If all checked:** You're ready to execute.

---

**Go win the bounty. Let's make Tapestry-native fantasy sports a reality.**
