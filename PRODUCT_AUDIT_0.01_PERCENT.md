# Foresight Product Audit - Path to 0.01%

## Current Status Assessment

After Whisperer cleanup, we have **54 database tables**. For a PURE CT Fantasy League, many are unnecessary.

---

## ✅ CORE CT FANTASY (KEEP - Essential)

### Influencers & Scoring
- `influencers` - The 61 CT personalities
- `influencer_metrics` - Twitter stats, engagement
- `influencer_scores` - Performance tracking

### Fantasy Teams & Draft
- `user_teams` - User's fantasy teams
- `team_picks` - 5 influencers per team
- `draft_teams` - Draft selections
- `draft_scores` - Team performance

### Voting & Competition
- `daily_votes` - Vote on best takes
- `weekly_spotlight_votes` - Weekly competitions
- `fantasy_contests` - Organized contests
- `contest_leaderboard` - Rankings

### Users & Auth
- `users` - User accounts (61 influencers ready!)
- `sessions` - Auth sessions
- `wallets` - Wallet connections

---

## ✅ VIRAL GROWTH (KEEP - Critical for 0.01%)

### Referral System
- `referrals` - Referral tracking
- `referral_events` - Signup, engagement events
- `referral_milestones` - 1, 5, 25, 50, 100 invites
- **Status:** ✅ Complete, ready for Founding Members

---

## ✅ ENGAGEMENT (KEEP - Important)

### XP & Progression
- `achievements` - Unlock achievements
- `user_achievements` - User progress
- `user_xp_ledger` - XP history
- `user_xp_totals` - Total XP
- `xp_actions` - XP earning actions
- `daily_xp_summary` - Daily tracking
- **Status:** ✅ Working, well-integrated

---

## ❌ REMOVE - Arena Mode (Not CT Fantasy)

**From Timecaster Arena battles - NOT fantasy league:**
- `arena_duels` - 1v1 battles (not fantasy)
- `arena_leaderboard` - Arena rankings
- `arena_results` - Battle results
- `arena_votes` - Arena voting

**Impact:** These are head-to-head battles, not fantasy drafting
**Action:** DELETE (save ~4 tables)

---

## ❌ REMOVE - Daily Gauntlet (Not CT Fantasy)

**From Timecaster Gauntlet mode - NOT fantasy league:**
- `gauntlet_days` - Daily challenges
- `gauntlet_entries` - User entries
- `gauntlet_leaderboard` - Gauntlet rankings
- `gauntlet_predictions` - Predictions
- `gauntlet_results` - Results

**Impact:** Daily predictions game, not fantasy drafting
**Action:** DELETE (save ~5 tables)

---

## ⚠️ EVALUATE - Streak System

**Current:**
- `user_streaks` - User streak tracking
- `streak_activity_log` - Activity log
- `streak_milestones` - Milestones
- `streak_types` - Streak types

**Questions:**
- Are we using streaks for anything?
- Does it drive engagement?
- Is it integrated with frontend?

**Recommendation:**
- If NOT actively used → DELETE
- If used for "play daily" mechanic → KEEP

**Action:** Check frontend integration first

---

## ⚠️ EVALUATE - Badge System

**Current:**
- `badges` - Badge definitions
- `user_badges` - User badges earned

**Questions:**
- Different from achievements?
- Is it redundant with achievement system?

**Recommendation:**
- If redundant with achievements → DELETE
- If unique visual badges → KEEP

**Action:** Check if used in frontend

---

## ⚠️ EVALUATE - Quest System

**Current:**
- `quests` - Quest definitions
- `user_quest_completions` - Completed quests
- `user_quest_progress` - Quest progress
- `quest_reward_pool` - Quest rewards

**Questions:**
- Are quests just achievements?
- Is this actively used?

**Recommendation:**
- If redundant with achievements → DELETE
- If driving engagement → KEEP & improve

**Action:** Check frontend integration

---

## ⚠️ EVALUATE - Foresight Terminal

**Current:**
- `foresight_drops` - Terminal content drops
- `foresight_user_reads` - User reads
- `foresight_user_stats` - Terminal stats

**Questions:**
- What is "Foresight Terminal"?
- Is this a news feed?
- Is it used?

**Recommendation:**
- If not core to fantasy league → DELETE
- If content feed is valuable → KEEP & improve

**Action:** Research what this is

---

## ❓ UNCLEAR - Private Leagues

**Current:**
- `private_leagues` - Private league definitions
- `league_members` - League members

**Questions:**
- Is this for "play with friends" feature?
- Is this mentioned in the PRD?

**Recommendation:**
- If NOT implemented → DELETE (add later in Phase 2)
- If core feature → KEEP & finish

**Impact:** Could be valuable for engagement (friends competing)

---

## ❓ UNCLEAR - Other Tables

**Current:**
- `relations` - Unknown purpose
- `prize_distributions` - Prize distribution (for paid tournaments?)
- `daily_activity` - Activity tracking

**Action:** Research and categorize

---

## 📊 Cleanup Impact

**Current:** 54 tables
**Arena Mode:** -4 tables
**Gauntlet Mode:** -5 tables
**Potential:** -10-15 more (streaks, badges, quests if unused)

**Target:** 25-30 core tables for pure CT Fantasy

---

## 🎯 0.01% Product Checklist

### Must Have (Core Fantasy):
- ✅ Draft 5 influencers within budget
- ✅ Teams compete based on performance
- ✅ Daily voting on best takes
- ✅ Weekly leaderboards
- ✅ XP & achievement progression
- ✅ Referral system with Founding Members

### Should Have (Engagement):
- ✅ Profile pages with stats
- ✅ Achievement unlocks
- ✅ Toast notifications
- ✅ Leaderboards (Fantasy, XP, Achievements)
- ❓ Streaks (if implemented)
- ❓ Quests (if implemented)
- ❓ Private leagues (if implemented)

### Don't Need (Bloat):
- ❌ Arena battles
- ❌ Daily Gauntlet predictions
- ❌ CT Whisperer trivia (REMOVED ✅)
- ❌ Multiple game modes
- ❌ Unused features

---

## 🚀 Path to 0.01%

### Phase 1: Cleanup (Now)
1. ✅ Remove Whisperer (DONE)
2. ⏳ Remove Arena mode
3. ⏳ Remove Gauntlet mode
4. ⏳ Evaluate streaks/badges/quests
5. ⏳ Remove unused features

### Phase 2: Polish (Before Launch)
1. Ensure all 61 influencers have Twitter data
2. Test referral flow end-to-end
3. Test fantasy drafting & scoring
4. Mobile optimization (already done for Mini App)
5. Performance testing

### Phase 3: Deploy (Launch)
1. Deploy backend with clean DB
2. Deploy frontend Mini App
3. Test in production
4. Launch to first 1,000 users

---

## 💎 What Makes 0.01%

**FPL Comparison:**
- FPL: 10M users, $0 monetization
- Foresight: Paid tournaments + token rewards

**We Have:**
- ✅ Complete fantasy drafting system
- ✅ 61 verified human CT influencers
- ✅ Voting & leaderboards
- ✅ XP & achievements
- ✅ Viral referral system
- ✅ Founding Member tracking
- ✅ Base Mini App integration
- ✅ Mobile-optimized

**We're Missing:**
- ⏳ Clean database (too many unused tables)
- ⏳ Twitter data for influencers
- ⏳ Production deployment
- ⏳ Actual users

**Unnecessary:**
- ❌ Arena mode (not fantasy)
- ❌ Gauntlet mode (not fantasy)
- ❌ Multiple game modes (focus = fantasy)

---

## Next Actions

### Immediate (Today):
1. Remove Arena tables/code
2. Remove Gauntlet tables/code
3. Audit streaks/badges/quests
4. Remove unused features

### Tomorrow:
1. Test clean app
2. Deploy to production
3. Seed influencer Twitter data
4. Launch!

---

**Bottom Line:**
- Product is 80% there
- 20% is cleanup & polish
- Main bloat: leftover Timecaster game modes
- Once cleaned: PURE fantasy league, 0.01% quality

**Focus = Fantasy Drafting ONLY. Nothing else.**
