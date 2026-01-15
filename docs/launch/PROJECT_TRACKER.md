# Foresight Project Tracker

**Use this document as your daily command center.**

---

## 🎯 CURRENT SPRINT: Pre-Launch

**Sprint Goal**: Get demo-ready and start influencer outreach
**Sprint Dates**: Dec 21 - Dec 28, 2025
**Status**: 🟡 In Progress

---

## 📊 DAILY STANDUP FORMAT

Copy this each day:

```
### [DATE] Standup

**Yesterday**:
-

**Today**:
-

**Blockers**:
-

**Notes**:
-
```

---

## 📅 THIS WEEK'S TASKS

### Day 1 (Dec 21) - Technical Prep
| Task | Priority | Status | Time Est | Notes |
|------|----------|--------|----------|-------|
| Add TWITTER_API_IO_KEY to .env | P0 | ⬜ | 2 min | |
| Refresh Twitter data | P0 | ⬜ | 10 min | Rate limited |
| Create fresh weekly contest | P0 | ⬜ | 5 min | |
| Test full user flow | P1 | ⬜ | 15 min | Connect → Draft → Score |
| Fix stale contest statuses | P1 | ⬜ | 5 min | |

### Day 2 (Dec 22) - Demo Prep
| Task | Priority | Status | Time Est | Notes |
|------|----------|--------|----------|-------|
| Record 2-min Loom demo | P0 | ⬜ | 30 min | Script in INFLUENCER_PIPELINE.md |
| Take product screenshots | P1 | ⬜ | 10 min | Draft, Leaderboard, Profile |
| Test mobile experience | P1 | ⬜ | 10 min | Basic check |
| Create demo account | P2 | ⬜ | 5 min | For influencers to try |

### Day 3 (Dec 23) - Outreach Prep
| Task | Priority | Status | Time Est | Notes |
|------|----------|--------|----------|-------|
| Use Grok to find 30 influencers | P0 | ⬜ | 1 hour | Use GROK_PROMPTS.md |
| Score and tier influencers | P0 | ⬜ | 30 min | Use scorecard |
| Set up tracking spreadsheet | P1 | ⬜ | 15 min | Import CSV template |
| Customize DM templates | P1 | ⬜ | 20 min | Personalize |

### Day 4-7 (Dec 24-27) - Outreach
| Task | Priority | Status | Time Est | Notes |
|------|----------|--------|----------|-------|
| Send 10 DMs to A-tier | P0 | ⬜ | 30 min | Day 4 |
| Send 10 DMs to B-tier | P0 | ⬜ | 30 min | Day 5 |
| Send 10 DMs to C-tier | P0 | ⬜ | 30 min | Day 6 |
| Follow up on non-responders | P1 | ⬜ | 20 min | Day 7 |
| Respond to all replies | P0 | ⬜ | As needed | 2-hour max |

---

## 🏆 SUCCESS METRICS

### Technical (Before Outreach)
- [ ] All 50 influencers have recent data (< 7 days old)
- [ ] At least 1 active contest exists
- [ ] Team scores calculate correctly
- [ ] Full user flow works without errors

### Outreach (Week 1)
- [ ] 30 DMs sent
- [ ] 5+ responses received
- [ ] 2+ influencers try the product
- [ ] 1+ partnership discussion started

### Launch (Week 2)
- [ ] Demo video completed
- [ ] 2-3 partnerships formalized
- [ ] First external users onboarded
- [ ] No critical bugs discovered

---

## 🔴 BLOCKERS LOG

| Date | Blocker | Impact | Resolution | Status |
|------|---------|--------|------------|--------|
| | | | | |

---

## 📝 DECISION LOG

| Date | Decision | Reasoning | Outcome |
|------|----------|-----------|---------|
| Dec 21 | Skip V2 contract for MVP | Free leagues demo full game loop | TBD |
| | | | |

---

## 💡 IDEAS PARKING LOT

Ideas to consider later (don't distract from current sprint):

- [ ] Achievement system polish
- [ ] Referral UI improvements
- [ ] Mobile-first redesign
- [ ] Token economics refinement
- [ ] Private leagues feature
- [ ] Daily flash contests

---

## 📈 WEEKLY REVIEW FORMAT

Copy this each week:

```
### Week of [DATE] Review

**Goals Set**:
1.
2.
3.

**Goals Achieved**:
1.
2.
3.

**What Went Well**:
-

**What Could Improve**:
-

**Key Learnings**:
-

**Next Week Focus**:
-
```

---

## 🚀 LAUNCH COUNTDOWN

### T-minus Checklist

**T-7 Days** (Technical Ready)
- [ ] Data pipeline running automatically
- [ ] Fresh contest created weekly (cron or manual)
- [ ] No critical bugs in user flow

**T-3 Days** (Demo Ready)
- [ ] 2-min Loom video recorded
- [ ] Screenshots prepared
- [ ] DM templates finalized

**T-1 Day** (Outreach Ready)
- [ ] 30 influencers identified and scored
- [ ] Tracking spreadsheet ready
- [ ] First 10 DMs drafted

**Launch Day**
- [ ] Send first batch of DMs
- [ ] Monitor for responses
- [ ] Be ready to demo

---

## 📂 KEY DOCUMENTS

| Document | Purpose | Location |
|----------|---------|----------|
| Launch Checklist | Technical readiness | `LAUNCH_CHECKLIST.md` |
| Influencer Pipeline | Outreach process | `INFLUENCER_PIPELINE.md` |
| Grok Prompts | Research templates | `GROK_PROMPTS.md` |
| Monetization Strategy | Business model | `MONETIZATION_STRATEGY.md` |
| Tracking Template | Outreach tracking | `influencer_tracking_template.csv` |

---

## 🔄 QUICK COMMANDS

### Check System Status
```bash
# Backend running?
curl http://localhost:3001/health

# Data freshness
psql foresight -c "SELECT MAX(scraped_at) FROM influencer_metrics;"

# Active contests
psql foresight -c "SELECT * FROM fantasy_contests WHERE status = 'active';"

# Team scores
psql foresight -c "SELECT team_name, current_score FROM user_teams ORDER BY current_score DESC;"
```

### Trigger Updates
```bash
# Refresh metrics
curl -X POST http://localhost:3001/api/admin/trigger-metrics-update

# Trigger scoring
curl -X POST http://localhost:3001/api/admin/trigger-scoring

# Check cron status
curl http://localhost:3001/api/admin/cron-status
```

---

## ✅ DAILY CHECKLIST

Start each day with:
- [ ] Check this tracker
- [ ] Review yesterday's progress
- [ ] Set today's priorities (max 3)
- [ ] Update task statuses
- [ ] Log any blockers

End each day with:
- [ ] Update completed tasks
- [ ] Note what's rolling to tomorrow
- [ ] Quick standup entry

---

*Last Updated: December 21, 2025*
*Sprint: Pre-Launch*
*Status: Active*
