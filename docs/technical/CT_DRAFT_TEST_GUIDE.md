# CT Draft Testing Guide
**Resolution Time: 3 minutes** (for testing)

---

## ✅ Changes Made

### 1. **Cron Job Modified**
- **Before:** Daily at midnight UTC
- **Now:** Every 3 minutes
- **File:** `backend/src/services/cronJobs.ts:29`

### 2. **Manual Trigger Endpoints Created**
```
POST /api/admin/trigger-draft-scoring   - Manually trigger scoring
POST /api/admin/trigger-twitter-scrape  - Manually update influencer data
GET  /api/admin/cron-status             - Check cron job status
```

---

## 🧪 Test Plan

### **Test 1: Create a Draft Team**

**Endpoint:** `POST /api/draft/team`

**Request:**
```bash
curl -X POST http://localhost:3001/api/draft/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamName": "Test Team Alpha",
    "influencerIds": [1, 2, 3, 4, 5]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "team": {
    "id": 1,
    "teamName": "Test Team Alpha",
    "influencerIds": [1, 2, 3, 4, 5],
    "totalCost": 85,
    "totalScore": 0
  }
}
```

**What to Check:**
- ✅ Team is created
- ✅ Total cost ≤ 100 points
- ✅ 5 influencers selected
- ✅ Initial score is 0

---

### **Test 2: Get Team Details**

**Endpoint:** `GET /api/draft/team/:address`

```bash
curl http://localhost:3001/api/draft/team/0x414A1F683feB519C4F24EbAbF782FF71A75C7BC0
```

**Expected Response:**
```json
{
  "success": true,
  "team": {
    "teamName": "Test Team Alpha",
    "influencers": [
      {"id": 1, "name": "Elon Musk", "basePrice": 25},
      {"id": 2, "name": "Vitalik", "basePrice": 20},
      ...
    ],
    "totalScore": 0,
    "rank": null
  }
}
```

---

### **Test 3: Manual Scoring Trigger**

**Endpoint:** `POST /api/admin/trigger-draft-scoring`

```bash
curl -X POST http://localhost:3001/api/admin/trigger-draft-scoring \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Draft scoring cycle completed",
  "timestamp": "2025-11-17T20:00:00.000Z"
}
```

**What Happens:**
1. Calculates score for each influencer
2. Updates team `total_score`
3. Recalculates rankings
4. Emits WebSocket events

---

### **Test 4: Verify Score Updated**

**Wait 30 seconds after triggering, then check team again:**

```bash
curl http://localhost:3001/api/draft/team/0x414A1F683feB519C4F24EbAbF782FF71A75C7BC0
```

**Expected Changes:**
```json
{
  "totalScore": 142,  // Updated from 0!
  "rank": 1           // Ranked based on score
}
```

---

### **Test 5: Automatic 3-Minute Resolution**

**Steps:**
1. Create a team
2. Note the current time
3. **Wait exactly 3 minutes**
4. Check backend logs for: `[CRON] Running Draft Scoring Cycle...`
5. Verify team score updated automatically

**Expected Log Output:**
```
[CRON] Running Draft Scoring Cycle...
========================================
Draft Scoring Engine Starting
========================================
Calculating scores for 1 teams...
Team "Test Team Alpha": 142 points

✅ Team scores calculated
✅ Team rankings updated
```

---

### **Test 6: Budget Validation**

**Try creating over-budget team:**

```bash
curl -X POST http://localhost:3001/api/draft/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamName": "Expensive Team",
    "influencerIds": [1, 2, 3, 4, 6]
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Team exceeds budget. Total: 105, Max: 100"
}
```

---

### **Test 7: Duplicate Influencer Prevention**

**Try selecting same influencer twice:**

```bash
curl -X POST http://localhost:3001/api/draft/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamName": "Duplicate Team",
    "influencerIds": [1, 1, 2, 3, 4]
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Duplicate influencers not allowed"
}
```

---

### **Test 8: Leaderboard**

**Endpoint:** `GET /api/draft/leaderboard`

```bash
curl http://localhost:3001/api/draft/leaderboard
```

**Expected Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x414A1F...",
      "teamName": "Test Team Alpha",
      "totalScore": 142,
      "influencerCount": 5
    }
  ]
}
```

---

### **Test 9: Update Team**

**Try updating team after creation:**

```bash
curl -X POST http://localhost:3001/api/draft/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamName": "Updated Team",
    "influencerIds": [2, 3, 4, 5, 7]
  }'
```

**Expected:**
- ✅ Team updated successfully
- ✅ Score resets to 0
- ✅ Next scoring cycle recalculates

---

### **Test 10: Get All Influencers**

**Endpoint:** `GET /api/draft/influencers`

```bash
curl http://localhost:3001/api/draft/influencers
```

**Expected Response:**
```json
{
  "success": true,
  "influencers": [
    {
      "id": 1,
      "name": "Elon Musk",
      "handle": "@elonmusk",
      "basePrice": 25,
      "tier": "A",
      "followerCount": 170000000
    },
    ...
  ]
}
```

---

## 📊 Score Calculation (Current Formula)

```typescript
score = base_price + (follower_count / 1,000,000) * 10

Example:
- Elon Musk: 25 + (170M / 1M) * 10 = 25 + 1,700 = 1,725 points
- Vitalik: 20 + (5.8M / 1M) * 10 = 20 + 58 = 78 points
```

**Total Team Score = Sum of all 5 influencer scores**

---

## ⏱️ Timing Verification

### Check Cron Job is Running:
```bash
curl http://localhost:3001/api/admin/cron-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Monitor Backend Logs:
```bash
# Watch for scoring cycles every 3 minutes
tail -f backend/logs/app.log
# OR check the terminal where backend is running
```

**Expected Output Every 3 Minutes:**
```
[CRON] Running Draft Scoring Cycle...
Draft Scoring Engine Starting
...
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "No token provided"
**Fix:** You need to authenticate first via `/api/auth/wallet`

### Issue 2: Score not updating
**Fix:**
1. Check backend logs for cron execution
2. Manually trigger: `POST /api/admin/trigger-draft-scoring`
3. Verify influencer data exists

### Issue 3: "User not found"
**Fix:** Create user account via auth flow first

### Issue 4: Budget validation not working
**Fix:** Check `backend/src/api/draft.ts` line 115-120

---

## 🎯 Success Criteria

**CT Draft is working perfectly when:**

1. ✅ Teams can be created with 5 influencers
2. ✅ Budget validation prevents >100 point teams
3. ✅ Duplicate influencers are rejected
4. ✅ Scoring runs every 3 minutes automatically
5. ✅ Manual trigger works instantly
6. ✅ Scores calculate correctly based on formula
7. ✅ Leaderboard updates and ranks teams
8. ✅ Team updates are allowed
9. ✅ WebSocket events fire on score updates
10. ✅ All 50 influencers are available

---

## 🔄 Revert to Production (After Testing)

**Change this line back:**

`backend/src/services/cronJobs.ts:29`

```typescript
// TESTING:
cron.schedule('*/3 * * * *', async () => {

// PRODUCTION:
cron.schedule('0 0 * * *', async () => {
```

---

## 📝 Next Steps After Testing

1. **Fix any bugs found during testing**
2. **Add real Twitter API integration** (replace mock scoring)
3. **Implement smart contract rewards distribution**
4. **Add team history/past scores tracking**
5. **Create frontend UI for team management**
6. **Add team comparison/analysis tools**

---

Generated: November 17, 2025
