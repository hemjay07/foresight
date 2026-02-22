# Tapestry Product Strategy — Direct Answers to 5 Key Questions

> **For:** Product strategist, judges, team leads
> **Quick answers to:** Core user journey, feature placement, "wow moment", cuts, demo narrative
> **Full strategy:** See `docs/TAPESTRY_PRODUCT_STRATEGY.md` (2,000+ lines)

---

## QUESTION 1: Core User Journey Showcasing Tapestry

### The 90-Second Journey

```
STEP 1: Land on /home
└─ See formation hero + "Start Playing"
   PSYCHOLOGY: "I understand this immediately"

STEP 2: Auth (15 seconds)
└─ Privy modal → Email/Google → [Tap] Done
   [TAPESTRY EVENT] findOrCreateProfile() called
   TOAST: "✓ Your Foresight identity is ready on Tapestry"
   PSYCHOLOGY: "That was instant. No wallet nonsense."

STEP 3: Draft (30 seconds)
└─ Pick 5 influencers → Formation fills → Click "Submit"
   [TAPESTRY EVENT] storeTeam() called
   TOAST: "✓ Team published to Tapestry Protocol (immutable)"
   PSYCHOLOGY: "I just created something permanent."

STEP 4: Leaderboard (15 seconds)
└─ Auto-redirect → See rank #47 highlighted in GOLD
   Real-time updates streaming in
   PSYCHOLOGY: "Everyone can see my rank. I need to watch it rise."

STEP 5: Contest Ends (6 days later)
└─ Final score: 245 pts (Rank 12)
   [TAPESTRY EVENT] storeScore() called
   TOAST: "✓ Your score locked on Tapestry"
   PSYCHOLOGY: "My achievement is permanent. It's on blockchain."
```

### Why This Wins

1. **Tapestry is invisible at first** — Users see value before learning about onchain
2. **Every checkpoint shows Tapestry** — "immutable", "verifiable", "permanent"
3. **Social proof** — 50+ other profiles all created via Tapestry
4. **Composability hint** — Teams/scores can theoretically feed other apps
5. **No friction** — Wallet complexity hidden; Privy handles it

**Key principle:** Tapestry is the plumbing, not the feature. Users care about rank permanence, not blockchain technology.

---

## QUESTION 2: Where Each Tapestry Feature Lives

### MVP Feature Placement (6 Hours Development)

| Feature | Page | What Shows | Why Here | Time |
|---------|------|-----------|---------|------|
| **Profiles** ✅ | Profile (Overview) | "✓ Published to Tapestry" badge + ID | User's permanent identity | 30 min |
| **Social Counts** ✅ | Profile (Overview) | Followers/following from Tapestry | Social proof visible | 1 hour |
| **Teams on Tapestry** ✅ | Profile (Teams tab) | List of teams + "View on Tapestry Explorer" | Your permanent record | 1 hour |
| **Team Preview** ✅ | Compete (Leaderboard hover) | Formation + "✓ On Tapestry" badge | Proof every rank is verified | 1.5 hours |
| **Success Toast** ✅ | Draft (After submit) | "Published to Tapestry Protocol" message | Confirm immutability at key moment | 0.5 hours |
| **Home Intro** ✅ | Home (Below hero) | 3 feature cards: Teams, Social, Scores | Sets expectations, primes judges | 1 hour |

**Total MVP time: 6 hours. ROI: 95/100.**

### Features to CUT (Save 10+ Hours)

- ❌ **Follow/unfollow UI** — Backend exists but frontend is 3 hours. Shows social graph but doesn't prove core value.
- ❌ **Comments/likes UI** — Nice but adds complexity. Teams are already visual proof.
- ❌ **Activity feed** — "What did users do?" is less compelling than "What's my rank?"
- ❌ **Achievement badges** — Leaderboard rank IS the achievement.
- ❌ **Network tab** (optional, only if time) — Can add later, not critical for demo.

**Reasoning:** Judges care about core game + Tapestry integration, not every social feature. Polish > feature count.

---

## QUESTION 3: The "Wow Moment"

### The Single Interaction That Proves It's Real

**Scenario:**

1. Judge signs up, drafts a team
2. Clicks "Submit"
3. Sees toast: "✓ Published to Tapestry Protocol"
4. Judge clicks "View on Tapestry Explorer"
5. **Actual Tapestry explorer opens** showing:
   ```
   Content ID: foresight-team-judge-123-6
   Profile ID: [judge's Tapestry ID]
   Properties:
     type: draft_team
     app: foresight
     captain_id: 42
     picks_json: [...]
     created_at: 1708617600000
   ```
6. Judge reloads the Foresight app
7. **Goes to Profile → Teams tab**
8. **The team is still there, with "On Tapestry" badge**

**Judge's internal monologue:** "Wait. This isn't just a database. The data is actually on-chain. This is verifiable. This is real."

### How to Execute (2 Hours)

1. Add "View on Tapestry" link to team displays (20 min)
   ```
   URL format: https://explorer.usetapestry.dev/content/foresight-team-{userId}-{contestId}
   ```

2. Test the chain (1 hour)
   - Create team → Check Tapestry explorer
   - Reload page → Team still visible
   - Click link → Opens explorer with correct properties
   - **CRITICAL:** Use test Tapestry account first

3. Add helper utility (20 min)
   ```typescript
   export const getTapestryExplorerUrl = (contentId: string) =>
     `https://explorer.usetapestry.dev/content/${contentId}`;
   ```

### Why This Beats Other Entries

Other teams will use Tapestry. **We'll be the only ones that prove it works by showing actual data in explorer.**

---

## QUESTION 4: What Should We NOT Build (Strategic Cuts)

### MVP-Only Features (What's Left When You Cut Smart)

**Keep these (6 pages total):**
1. Home — landing + Tapestry intro
2. Draft — team builder + success toast
3. Compete — leaderboard + contest listings
4. Feed — CT tweets
5. Profile — stats + Tapestry identity
6. Contest Detail — rules + prizes

**Cut these (save 20-30 hours):**
- ❌ Follow/unfollow UI (3 hrs) — Backend exists, but UI doesn't prove value
- ❌ Comments/likes UI (2 hrs) — Nice but not critical
- ❌ Achievement badges (1.5 hrs) — Leaderboard rank is achievement
- ❌ Activity feed (3 hrs) — Less compelling than rankings
- ❌ Settings overhaul (1 hr) — Profile has essentials
- ❌ Email notifications (1 hr) — Toast is enough
- ❌ Custom Solana program (40+ hrs) — Tapestry is your blockchain layer
- ❌ Paid contests (2 hrs) — Free-only for hackathon
- ❌ Mobile app (20 hrs) — Responsive web sufficient

### Time Budget

```
Available: 15 hours (Feb 22-27, accounting for QA)
MVP features: 6 hours
Buffer/polish: 9 hours remaining

Recommendation: Build MVP (6h) + video (1h) + Polish (2h) + QA (2h) = DONE
Remaining 4 hours: Deploy + contingency
```

### Decision Matrix

| Feature | Time | Judges Care? | Differentiator? | Include? |
|---------|------|---|---|---|
| Home Tapestry intro | 1h | ✅ High | ✅ Yes (sets frame) | **YES** |
| Profile Tapestry badge | 0.5h | ✅ High | ✅ Yes (proves integration) | **YES** |
| Leaderboard team preview | 1.5h | ✅ High | ✅ Yes (shows verification) | **YES** |
| Draft success toast | 0.5h | ✅ High | ✅ Yes (key moment) | **YES** |
| Explorer links | 1h | ✅ High | ✅ Yes (proves real data) | **YES** |
| Social counts | 1h | ⚠️ Med | ⚠️ Nice | **YES** (cheap ROI) |
| Follow UI | 3h | ⚠️ Med | ❌ No | **NO** |
| Comments/likes | 2h | ⚠️ Med | ❌ No | **NO** |
| Activity feed | 3h | ❌ Low | ❌ No | **NO** |

---

## QUESTION 5: Demo Narrative (3 Minutes)

### The Story Arc (Word-for-Word Script)

**[0:00-0:30] FRAMING**
```
"Traditional fantasy sports keep your data locked in one app.
We're building something different.

This is Foresight — fantasy sports for Crypto Twitter,
built on Solana's social graph.
```

**[0:30-1:15] THE CORE MECHANIC**
```
[SCREEN: Landing page with formation hero]

"You draft teams of influencers, earn points based on their activity,
compete for prizes.

[CLICK: Start Playing]

But here's what's different: Your profile, your teams, your scores
all go directly to Tapestry — Solana's social data protocol.

[PRIVY MODAL]

"Sign in with email. We handle the wallet behind the scenes."

[AUTH → PROFILE CREATED]

"Your identity is now on Tapestry. Immutable. Verifiable.
```

**[1:15-1:45] TEAM CREATION**
```
[FORMATION VIEW]

"You pick 5 people. Captain gets 1.5x multiplier. Budget is tight.
Real decisions matter.

[SELECT 5 PEOPLE]

[CLICK: Submit]

[TOAST: "✓ Published to Tapestry Protocol"]

"Your team is now stored on Tapestry.
It's permanent. It's on-chain.
If Foresight shut down tomorrow, your record would still exist."
```

**[1:45-2:15] SOCIAL PROOF**
```
[LEADERBOARD]

"Here are 2,847 players competing this week.

[HOVER: Show team preview + "✓ On Tapestry" badge]

Every team on this leaderboard is a verified Tapestry record.
Every score is verifiable.

[SHOW: Your rank #47 highlighted in gold]

"As influencers tweet, your score updates in real-time.
When the contest ends, your final score locks on Tapestry forever."
```

**[2:15-2:45] THE PAYOFF**
```
[PROFILE PAGE]

"Your profile aggregates everything.
Teams you've drafted. Scores you've earned. All portable.

This data could feed leaderboards in other apps built on Tapestry.
Your achievements follow you across the ecosystem.

This is composable gaming."
```

**[2:45-3:00] CLOSE**
```
"Foresight shows what happens when fantasy sports meet
Solana's social graph.

Foresight on Tapestry.

Learn more at foresight.gg"

[FADE OUT]
```

### Key Talking Points (If Q&A)

**"Why Tapestry instead of a custom Solana program?"**
> "Tapestry is designed for social data. Teams and scores are inherently social — they need to exist in a graph where players discover each other. A custom program would be isolated. Tapestry makes our data composable."

**"What makes this different from other Tapestry entries?"**
> "Three things: Real use case (fantasy sports is proven), verifiable data (judges can check explorer), and polish (design + UX + onboarding). Most entries just store data. We solve a real problem."

**"Could users fake their scores?"**
> "No. Scores are calculated serverside and locked to Tapestry. Tamper-proof. That's the whole point of on-chain storage."

---

## FINAL SUMMARY

| Question | Answer | Time | ROI |
|----------|--------|------|-----|
| **1. User Journey** | 90 sec: auth → draft → leaderboard. Tapestry invisible, then celebrated. | Shipped | 10/10 |
| **2. Feature Placement** | Profile (badge, counts, teams), Home (intro), Leaderboard (preview), Draft (toast), Explorer links | 6 hours | 9.5/10 |
| **3. Wow Moment** | Submit team → "Published to Tapestry" → Click link → Actual data in explorer → Reload page → Still there | 2 hours | 10/10 |
| **4. What to Cut** | Follow UI, comments, activity feed, achievements, custom program. Focus on core value. | Saves 20-30h | — |
| **5. Demo Narrative** | "Composability changes gaming. Tapestry enables it. Here's proof." (2:45 video) | 1 hour | 9/10 |

---

## Next Step

Read `docs/TAPESTRY_PRODUCT_STRATEGY.md` for full context.
Use `docs/TAPESTRY_IMPLEMENTATION_CHECKLIST.md` during development.
Reference `docs/TAPESTRY_STRATEGIC_SUMMARY.md` for leadership/judges.

**Start building.** You have 4.5 days. The plan is solid.

---

*Last updated: February 22, 2026*
