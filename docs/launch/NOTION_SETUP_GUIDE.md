# Notion Setup Guide - Step by Step

**Time Required**: 15-20 minutes
**Files to Import**: 3 CSV files in this folder

---

## Step 1: Create Workspace (2 min)

1. Go to [notion.so](https://notion.so)
2. Click **+ New Page** in sidebar
3. Name it: **F

**
4. Add emoji: 🚀
5. Add a cover image (optional)

---

## Step 2: Import Sprint Tasks Database (3 min)

1. Inside your new page, type `/table` and select **Table - Full page**
2. Name it: **Sprint Board**
3. Click **⋮⋮** (6 dots) at top right → **Merge with CSV**
4. Upload: `notion-import-sprint-tasks.csv`
5. After import, adjust column types:
   - **Status**: Change to "Select" → Add options: To Do, In Progress, Done, Backlog
   - **Priority**: Change to "Select" → Add options: P0, P1, P2
   - **Category**: Change to "Select" → Add options: Technical, Content, Outreach, Admin, Documentation
   - **Due Date**: Change to "Date"
   - **Time Estimate**: Keep as Number

6. Add a **Board View**:
   - Click **+ Add a view** → **Board**
   - Group by: **Status**
   - This gives you Kanban-style task management

---

## Step 3: Import Influencer Pipeline (3 min)

1. Go back to main page, type `/table` → **Table - Full page**
2. Name it: **Influencer Pipeline**
3. Click **⋮⋮** → **Merge with CSV**
4. Upload: `notion-import-influencer-pipeline.csv`
5. Adjust column types:
   - **Followers**: Number
   - **Engagement Rate**: Number
   - **Score**: Number
   - **Tier**: Select → Options: A, B, C
   - **Status**: Select → Options: Researched, DM Sent, Follow-up 1, Follow-up 2, Responded, Trying Product, Negotiating, Partner, Declined, No Response
   - **Partnership Level**: Select → Options: None, Tier 1 (Referral), Tier 2 (Featured), Tier 3 (Advisor)

6. Add a **Board View**:
   - Group by: **Status**
   - This shows your outreach pipeline visually

7. Delete the 2 example rows after you've set up the columns

---

## Step 4: Import Launch Checklist (2 min)

1. Go back to main page, type `/table` → **Table - Full page**
2. Name it: **Launch Checklist**
3. Click **⋮⋮** → **Merge with CSV**
4. Upload: `notion-import-launch-checklist.csv`
5. Adjust column types:
   - **Done**: Checkbox
   - **Category**: Select → Options: Technical, Content, Outreach, Documentation
   - **Priority**: Select → Options: Must Have, Should Have, Nice to Have

6. Add a **Filter**:
   - Show only: Priority = "Must Have" for focus view

---

## Step 5: Create Dashboard (5 min)

1. Go back to main page
2. At the top, add this header (just type it):

```
# 🚀 Foresight Launch Hub

**Current Sprint**: Pre-Launch
**Sprint Dates**: Dec 21 - Dec 28, 2025
**Status**: 🟡 In Progress

---
```

3. Add linked database views:
   - Type `/linked` → **Linked view of database**
   - Select **Sprint Board**
   - Choose **Board view**
   - Repeat for **Influencer Pipeline** and **Launch Checklist**

4. Add a "Quick Links" section:
```
## 📂 Quick Links

- [Sprint Board](#)
- [Influencer Pipeline](#)
- [Launch Checklist](#)
- [TODO.md](file in repo)
```

5. Add a "Key Metrics" table:
   - Type `/table` → **Table - Inline**
   - Add columns: Metric, Target, Current
   - Add rows:
     - Influencers Researched | 30 | 0
     - DMs Sent | 30 | 0
     - Responses | 6+ | 0
     - Partnerships | 2-3 | 0

---

## Step 6: Create Daily Standups Page (2 min)

1. Create new page: **Daily Standups**
2. Add template button:
   - Type `/template` → **Template button**
   - Name: **New Standup**
   - Template content:
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

3. Click the button each day to create a new standup

---

## Step 7: Final Structure Check

Your workspace should now have:

```
📁 Foresight Launch Hub (Dashboard)
├── 📊 Sprint Board (Database - Board view)
├── 👥 Influencer Pipeline (Database - Board view)
├── ✅ Launch Checklist (Database - Table view)
└── 📝 Daily Standups (Page with template)
```

---

## Daily Workflow

### Morning (5 min)
1. Open Dashboard
2. Check Sprint Board for today's P0 tasks
3. Create daily standup entry

### During Day
1. Move tasks through Sprint Board (To Do → In Progress → Done)
2. Update Influencer Pipeline as you contact people
3. Check off Launch Checklist items

### Evening (2 min)
1. Update any incomplete tasks
2. Note blockers in standup
3. Plan tomorrow's focus

---

## Tips

- **Use keyboard shortcuts**:
  - `Cmd+N` = New page
  - `Cmd+Shift+L` = Toggle dark mode
  - `/` = Command menu

- **Pin important pages** to sidebar for quick access

- **Use status colors** in Board view:
  - 🟢 Done = Green
  - 🟡 In Progress = Yellow
  - ⚪ To Do = Gray
  - 🔵 Backlog = Blue

---

## Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `notion-import-sprint-tasks.csv` | Sprint tasks | docs/launch/ |
| `notion-import-influencer-pipeline.csv` | Outreach tracking | docs/launch/ |
| `notion-import-launch-checklist.csv` | Launch readiness | docs/launch/ |
| `TODO.md` | Quick reference | root |

---

**Done!** Your Notion workspace is ready. Start by working through the P0 tasks in Sprint Board.
