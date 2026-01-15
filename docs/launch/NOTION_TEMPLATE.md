# Notion Workspace Template for Foresight Launch

## How to Use This

1. Create a new Notion workspace or page
2. Follow the structure below to create your project hub
3. Copy the database templates as Notion databases
4. Link everything together

---

## Workspace Structure

```
📁 Foresight Launch Hub
├── 📋 Dashboard (Home Page)
├── 📊 Sprint Board (Database)
├── 👥 Influencer Pipeline (Database)
├── ✅ Launch Checklist (Database)
├── 📝 Daily Standups (Database)
├── 📚 Documentation (Page with links)
└── 💡 Ideas Parking Lot (Page)
```

---

## Page 1: Dashboard (Home Page)

Create a page with these sections:

### Header
```
# 🚀 Foresight Launch Hub

**Current Sprint**: Pre-Launch
**Sprint Dates**: Dec 21 - Dec 28, 2025
**Status**: 🟡 In Progress
```

### Quick Links (Callout blocks)
```
📊 [Sprint Board] | 👥 [Influencer Pipeline] | ✅ [Launch Checklist]
```

### This Week's Focus (Numbered list)
```
1. Get product demo-ready
2. Research 30 influencers via Grok
3. Start outreach (10 DMs/day)
```

### Key Metrics (Table)
```
| Metric | Target | Current |
|--------|--------|---------|
| Influencers Contacted | 30 | 0 |
| Response Rate | 20% | - |
| Partnerships | 2-3 | 0 |
| Product Ready | Yes | 🟡 |
```

---

## Page 2: Sprint Board (Database)

**Database Type**: Board (Kanban)

**Properties**:
| Property | Type | Options |
|----------|------|---------|
| Name | Title | - |
| Status | Select | Backlog, To Do, In Progress, Done |
| Priority | Select | P0, P1, P2 |
| Due Date | Date | - |
| Assignee | Person | - |
| Time Estimate | Number | (in hours) |
| Category | Select | Technical, Outreach, Content, Admin |

**Views**:
1. **Board View** - Group by Status
2. **Calendar View** - By Due Date
3. **Priority View** - Filter P0 only

**Initial Tasks to Add**:
```
| Task | Priority | Status | Category |
|------|----------|--------|----------|
| Add API key to .env | P0 | To Do | Technical |
| Refresh Twitter data | P0 | To Do | Technical |
| Create fresh contest | P0 | To Do | Technical |
| Test user flow | P0 | To Do | Technical |
| Record Loom demo | P0 | To Do | Content |
| Research 30 influencers (Grok) | P0 | To Do | Outreach |
| Score and tier influencers | P1 | Backlog | Outreach |
| Send first 10 DMs | P0 | Backlog | Outreach |
| Fix founding member cap | P1 | Backlog | Technical |
| Fix private league split | P1 | Backlog | Technical |
```

---

## Page 3: Influencer Pipeline (Database)

**Database Type**: Table

**Properties**:
| Property | Type | Options/Format |
|----------|------|----------------|
| Handle | Title | @username |
| Name | Text | - |
| Followers | Number | - |
| Engagement Rate | Number | % |
| Score | Number | 0-100 |
| Tier | Select | A, B, C |
| Status | Select | Researched, DM Sent, Follow-up 1, Follow-up 2, Responded, Trying Product, Negotiating, Partner, Declined, No Response |
| DM Sent Date | Date | - |
| Last Contact | Date | - |
| Next Action | Text | - |
| Partnership Level | Select | None, Tier 1 (Referral), Tier 2 (Featured), Tier 3 (Advisor) |
| Notes | Text | - |
| Personalization Hook | Text | - |

**Views**:
1. **Pipeline View** - Board grouped by Status
2. **All Contacts** - Table sorted by Score
3. **Active Conversations** - Filter: Status = Responded, Trying Product, Negotiating
4. **Partners** - Filter: Status = Partner

**Template for New Entry**:
```
Handle: @
Name:
Followers:
Engagement Rate: %
Score: /100
Tier:
Status: Researched
Personalization Hook:
Notes:
```

---

## Page 4: Launch Checklist (Database)

**Database Type**: Table with checkboxes

**Properties**:
| Property | Type |
|----------|------|
| Task | Title |
| Done | Checkbox |
| Category | Select (Technical, Content, Outreach, Legal) |
| Priority | Select (Must Have, Should Have, Nice to Have) |
| Notes | Text |

**Initial Items**:
```
MUST HAVE - TECHNICAL
[ ] Add TWITTER_API_IO_KEY to .env
[ ] Refresh Twitter data (< 7 days old)
[ ] Create current week contest
[ ] Test full user flow (connect → draft → score)
[ ] Verify leaderboard shows real data
[ ] No critical bugs in demo

MUST HAVE - CONTENT
[ ] Record 2-min Loom demo
[ ] Take product screenshots
[ ] Prepare DM templates

MUST HAVE - OUTREACH
[ ] Research 30 influencers
[ ] Score and tier all contacts
[ ] Set up tracking in Notion

SHOULD HAVE - TECHNICAL
[ ] Fix founding member cap (limit to 1,000)
[ ] Fix private league split (or update docs)
[ ] Deploy V2 contract for paid contests

SHOULD HAVE - CONTENT
[ ] Create one-pager PDF
[ ] Test mobile experience

NICE TO HAVE
[ ] Username editing feature
[ ] Toast notifications
[ ] Daily flash contests active
```

---

## Page 5: Daily Standups (Database)

**Database Type**: Table

**Properties**:
| Property | Type |
|----------|------|
| Date | Date |
| Yesterday | Text |
| Today | Text |
| Blockers | Text |
| Notes | Text |

**Template**:
```
## [Date] Standup

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

## Page 6: Documentation (Links Page)

Create a page with links to key docs (stored in repo):

```
# 📚 Documentation

## Launch Docs
- [Launch Checklist](./docs/launch/LAUNCH_CHECKLIST.md)
- [Influencer Pipeline](./docs/launch/INFLUENCER_PIPELINE.md)
- [Grok Prompts](./docs/launch/GROK_PROMPTS.md)
- [Project Tracker](./docs/launch/PROJECT_TRACKER.md)

## Planning Docs
- [Marketing vs Reality](./docs/planning/MARKETING_VS_REALITY.md)
- [Improvements Needed](./docs/planning/IMPROVEMENTS_NEEDED.md)
- [Prized Leagues V2 Plan](./docs/planning/PRIZED_LEAGUES_V2_PLAN.md)

## Marketing Docs
- [Monetization Strategy](./docs/marketing/MONETIZATION_STRATEGY.md)

## Technical Docs
- [Deployment Guide](./docs/technical/DEPLOYMENT_GUIDE.md)
- [Testing Guide](./docs/technical/TESTING_GUIDE.md)
```

---

## Page 7: Ideas Parking Lot

Simple page for ideas to consider later:

```
# 💡 Ideas Parking Lot

Ideas to consider after launch. Don't distract from current sprint.

## Features
- [ ] Achievement system polish
- [ ] Mobile-first redesign
- [ ] Daily flash contests
- [ ] Token economics refinement

## Marketing
- [ ] Twitter thread strategy
- [ ] Farcaster promotion
- [ ] CT influencer collaborations

## Technical
- [ ] Performance optimization
- [ ] Analytics dashboard
- [ ] Automated contest creation
```

---

## Quick Setup Steps

### Step 1: Create Workspace (2 min)
1. Go to Notion
2. Create new page: "Foresight Launch Hub"
3. Add icon: 🚀
4. Add cover image (optional)

### Step 2: Create Databases (10 min)
1. Create "Sprint Board" as linked database (Board view)
2. Create "Influencer Pipeline" as linked database (Table view)
3. Create "Launch Checklist" as linked database (Table view)
4. Create "Daily Standups" as linked database (Table view)

### Step 3: Add Properties (10 min)
- Copy properties from templates above
- Add select options

### Step 4: Add Initial Data (15 min)
- Add sprint tasks from template
- Add checklist items
- Add first standup entry

### Step 5: Create Dashboard (10 min)
- Add header and status
- Embed linked views of each database
- Add quick links

---

## Daily Workflow

### Morning (5 min)
1. Open Dashboard
2. Check Sprint Board for today's tasks
3. Write daily standup

### During Day
1. Move tasks through Sprint Board
2. Update Influencer Pipeline as you contact people
3. Check off Launch Checklist items

### Evening (5 min)
1. Update task statuses
2. Note any blockers
3. Plan tomorrow's focus

---

## Weekly Review

Every Sunday:
1. Review Sprint Board - what got done?
2. Check Launch Checklist progress
3. Analyze Influencer Pipeline - response rates?
4. Plan next week's priorities
5. Update Dashboard metrics

---

*Created: December 21, 2025*
*Use this template to set up your Notion workspace*
