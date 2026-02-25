# Next Steps: After Scoring Analysis Complete
## What to Focus on for Launch & Week 1

**Date:** February 25, 2026, 23:45 UTC
**Status:** Scoring system validated. Ready for launch.
**Days Until Submission:** 2 days (Feb 27, 11:59 PM UTC)
**Current Focus:** Visual verification + demo video + final polish

---

## Priority 1: Visual Verification (Today, Feb 25)

### What to Do
Take screenshots to verify the UI reflects the scoring system correctly:

```bash
# From frontend directory
./node_modules/.bin/tsx scripts/screenshot.ts /compete --full
./node_modules/.bin/tsx scripts/screenshot.ts /draft --full
./node_modules/.bin/tsx scripts/screenshot.ts /contest/6 --full
./node_modules/.bin/tsx scripts/screenshot.ts / --full
```

### What to Verify
1. **Leaderboard (`/compete`)**
   - Do users understand the scoring? (Scores visible, rank clear)
   - Are follow buttons visible? (Show social integration)
   - Are avatars loaded? (Influencer recognition)

2. **Draft Page (`/draft`)**
   - Is formation visual clear? (Captain 1.5x visible)
   - Budget tracking obvious? (150 pts allocation visible)
   - Team balance apparent? (5 tiers represented)

3. **Contest Detail (`/contest/6`)**
   - Score breakdown visible? (Activity, Engagement, Growth, Viral)
   - Prize display USD-first? (Green, prominent)
   - Countdown banner visible? (Urgency signal)

4. **Home (`/`)**
   - Activity feed visible? (Social proof)
   - XP progression card visible? (Engagement signal)
   - Onboarding clear? (New users know what to do)

### Expected Outcome
Screenshots confirm UI matches scoring system. If anything is confusing, note it for iteration.

---

## Priority 2: Demo Video Script (Today, Feb 25)

### The 3-Minute Video Breakdown

**Segment 1: Hook (30 seconds)**
- "Foresight is fantasy sports for Crypto Twitter"
- Show leaderboard with real influencers
- "You draft 5 CT influencers. Their real-world engagement = your points."
- Visual: Zoom into leaderboard, see names + scores

**Segment 2: The Draft (1 minute)**
- "Let's draft a team. 150 points budget, 5 slots to fill"
- Show draft interface
- "S-tier influencers cost more but score higher"
- Pick 4 influencers, show budget bar filling
- "My captain is @analyst_name - 1.5x multiplier on their score"
- Show formation visual with captain highlighted

**Segment 3: The Scoring (45 seconds)**
- "Here's the genius part: We measure what actually matters"
- Show leaderboard with score breakdown
- "Not just followers - we weight engagement quality"
- Click on a player, show Activity/Engagement/Growth/Viral breakdown
- "Replies count 3x (discourse matters), retweets 2x, likes 1x"
- "Follower growth = momentum (small accounts can compete)"
- "Top 3 community-voted = spotlight bonuses"

**Segment 4: Social Integration (45 seconds)**
- "Built on Solana with Tapestry Protocol"
- Show follow button on leaderboard
- "Follow other players, see their drafts"
- Show activity feed (social proof)
- "Share your winning teams on Twitter"
- Show shareable card
- "Everything is transparent and verifiable"

**Segment 5: Call-to-Action (15 seconds)**
- "Draft this week, compete for SOL prizes"
- "Leaderboard is live. Real engagement, real skill."
- "foresight.gg"

### Video Production Notes
- Use actual gameplay (not mockups)
- Highlight score breakdown (the differentiator)
- Show both winning team and leaderboard
- Include social features (follow, activity feed)
- End on "this is fair" message

**Script File:** Will be in `VIDEO_SCRIPT_FINAL.md` (create if needed)

---

## Priority 3: Final Polish (Tomorrow, Feb 26)

### UI Polish Checklist
- [ ] Leaderboard: Check spacing, alignment, readability
- [ ] Draft: Verify budget bar animates smoothly
- [ ] Contest Detail: Confirm score breakdown is clear
- [ ] Mobile: Test on 375px width (critical!)
- [ ] Toast notifications: Verify they appear (team created, win claimed)
- [ ] Loading states: Smooth spinners, not janky
- [ ] Error handling: Try to break things, confirm graceful failures

### Data Verification
- [ ] All 100 influencers have avatars
- [ ] Leaderboard has 15+ entries (not bare)
- [ ] Demo contest (ID 6) is in SCORING status (active)
- [ ] Team scores visible and updating
- [ ] Spotlight voted influencers showing bonuses

### Performance Check
```bash
# From root
cd frontend && pnpm build
# Check: build succeeds, no TS errors
# Check: dist/ is generated, size <5MB
```

### Testing
- [ ] Create team on demo contest (test full flow)
- [ ] Verify team appears on leaderboard
- [ ] Check score updates (polling works)
- [ ] Follow an influencer (social features work)
- [ ] Share team card (Twitter pre-fill works)

---

## Priority 4: Messaging Alignment (Tomorrow, Feb 26)

### What to Say When Submitting

**When Judges Ask: "How is your scoring system different?"**

Answer:
> "We measure influence the way Crypto Twitter actually values it. Not follower count—that's fakeable. Instead: engagement quality (replies 3x weight), follower growth momentum, and community voting on callout accuracy. Small accounts with real engagement beat large accounts with bots. Rising stars can win against mega-accounts. The scoring is transparent, explainable, and hard to game. It respects the culture."

**When Judges Ask: "Why should we care about this?"**

Answer:
> "This solves a real problem in crypto: influence measurement is broken. Follower counts are faked, engagement is purchased. Foresight creates a transparent, automated way to measure actual influence in real-time. CT respects this system. And it's extensible—same framework works for DeFi analysts, protocol developers, NFT creators. We're building the infrastructure for reputation in crypto."

**When Judges Ask: "How will users actually play this?"**

Answer:
> "Weekly fantasy contests. Draft 5 influencers, compete for SOL prizes. Users return every week because: (1) Contests reset weekly (new meta), (2) Scoring is fair (they understand why winners won), (3) Social elements (follow players, see their drafts). And because discovering new influencers is valuable—users find underrated analysts through gameplay."

---

## Priority 5: Backup Plan (If Scoring Concerns Arise)

### If Someone Says: "The Scoring Seems Arbitrary"

**Immediate Response:**
- Show this doc: `docs/CT_INFLUENCE_CULTURAL_ANALYSIS.md`
- Say: "We analyzed how CT actually defines influence"
- Show the four pillars (Accuracy, Alpha, Skin, Community)
- Point out: "Our formula measures three of four directly"

### If Someone Says: "Why Not Just Use Follower Count?"

**Immediate Response:**
- Show example: "A 10K account with real engagement > 500K account with 2% engagement"
- Say: "Follower count is the easiest thing to fake (bot farms)"
- Show: "Our system is resistant to gaming. Fake followers don't engage authentically."

### If Someone Says: "The Numbers Seem Low (Max 160 pts)"

**Immediate Response:**
- Explain: "This scales relative to account size. A 5M follower account hitting 160 pts is exceptional."
- Say: "We cap scores to prevent outliers from dominating. Consistency matters more than one viral moment."
- Show: "A player with 20 pts/week consistently will beat someone with 100 pts one week and 0 the next."

---

## Priority 6: Week 1 Roadmap (After Launch)

### Day 1 (Feb 26 - Launch Day)
- [ ] Deploy to production
- [ ] Announce on Twitter (thread about scoring system)
- [ ] Monitor for errors + feedback
- [ ] Update PROGRESS.md with launch notes

### Day 2-3 (Feb 27-28)
- [ ] Publish "Why Foresight Works" blog post / Twitter thread
- [ ] Respond to community questions about scoring
- [ ] Monitor retention metrics
- [ ] Fix any UX issues that emerge

### Week 1 (Feb 26 - Mar 2)
- [ ] Collect sentiment data (Discord, Twitter mentions)
- [ ] Identify if users understand scoring system
- [ ] Note any gaming attempts (record them)
- [ ] Plan Week 2 improvements (if needed)

### Success Signals (Week 1)
- ✅ Users can explain why winners won
- ✅ Sentiment is neutral-to-positive
- ✅ No "scoring is broken" complaints
- ✅ Repeat engagement >30%

### Failure Signals (Week 1)
- ❌ "Scoring seems unfair" sentiment spreads
- ❌ Users can't explain results
- ❌ Repeat engagement <15%
- ❌ Gaming exploits discovered

---

## Final Checklist Before Submission

### Code & Deployment
- [ ] Frontend builds without TS errors
- [ ] Backend passes all tests (64/64)
- [ ] No console errors in browser
- [ ] Performance is acceptable (<2s load time)
- [ ] Mobile responsive (test at 375px)

### Data & Game State
- [ ] Demo contest (ID 6) is active/scoring
- [ ] Leaderboard has 15+ teams
- [ ] Influencers have avatars + metadata
- [ ] Scoring is calculating (scores visible)
- [ ] Social features functional (follow/activity feed)

### Messaging & Positioning
- [ ] Pitch is clear (30-second explanation)
- [ ] Scoring system is defensible
- [ ] Judge talking points ready
- [ ] Demo video script finalized
- [ ] Documentation is polished

### Documentation
- [ ] CLAUDE.md is updated
- [ ] PROGRESS.md is current
- [ ] README has clear instructions
- [ ] Scoring system docs are in /docs
- [ ] Demo video is recorded + ready

---

## Team Assignments (Suggested)

### If 2 People Available (Now → Feb 26)

**Person A: Demo & Messaging**
- Create video script (today)
- Record demo video (tomorrow AM)
- Polish messaging + talking points
- Final UI verification (screenshots)

**Person B: Technical Polish**
- Run full test suite
- Check performance (build time, load time)
- Mobile responsive testing
- Fix any bugs that emerge

### If 1 Person Available

**Priority Order:**
1. Demo video (most important)
2. Screenshots + verification
3. Messaging polish
4. Test suite run
5. Mobile testing

---

## The Bottom Line

**We're ready to launch.** The scoring system is validated, culturally aligned, and technically sound. The next 48 hours are about:

1. **Visual verification** — Make sure UI matches the strategy
2. **Demo video** — Show judges why this matters
3. **Messaging** — Be able to defend the scoring system
4. **Polish** — No bugs, no performance issues
5. **Week 1 prep** — Monitor feedback, be ready to iterate

**Confidence Level:** 8/10

**Expected Outcome:** 86-93 points (1st-2nd place, $2.5K or $1.5K)

**Path to 95+:** Perfect execution + strong demo video + zero bugs on launch day

---

**— The CT Native**
**February 25, 2026, 23:45 UTC**

*"We've done the hard work. Now we just need to show it clearly."*
