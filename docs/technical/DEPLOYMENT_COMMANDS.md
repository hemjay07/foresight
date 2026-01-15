# Deployment Commands - Ship It NOW 🚀

## 🎯 Pre-Flight Check (5 minutes)

### 1. Test Referral System Locally
```bash
# Make sure backend is running
cd backend
pnpm dev

# In another terminal, test the API
curl http://localhost:3001/health
# Should return: {"status":"healthy"}

# Test referrals endpoint (with your auth token)
curl http://localhost:3001/api/referrals/leaderboard
# Should return leaderboard data
```

### 2. Build Frontend
```bash
cd frontend
pnpm build

# Should complete without errors
# Output: dist/ folder created
```

---

## 🚀 Deployment (30 minutes)

### Option 1: Quick Deploy (Vercel + Render)

#### Backend (Render.com)
```bash
# 1. Push to GitHub (if not already)
cd /Users/yonko/foresight
git add .
git commit -m "Launch ready: Referral system complete"
git push origin main

# 2. Go to Render.com
# - Create New > Web Service
# - Connect GitHub repo
# - Root Directory: backend
# - Build Command: pnpm install
# - Start Command: pnpm start
# - Add Environment Variables:
#   DATABASE_URL=your_production_db
#   JWT_SECRET=your_secret_key
#   NODE_ENV=production
#   PORT=3001
```

#### Frontend (Vercel)
```bash
# 1. Install Vercel CLI (if not installed)
pnpm add -g vercel

# 2. Deploy frontend
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Your account
# - Link to existing project? N
# - Project name? foresight-league
# - Directory? ./
# - Override settings? N

# 3. Add environment variable
vercel env add VITE_API_URL
# Enter: https://your-backend-url.render.com

# 4. Deploy production
vercel --prod
```

### Option 2: Railway Deploy (Simpler)

```bash
# 1. Install Railway CLI
brew install railway

# 2. Login
railway login

# 3. Deploy backend
cd backend
railway init
railway up

# Get your backend URL
railway domain

# 4. Deploy frontend
cd ../frontend
# Update VITE_API_URL in .env
echo "VITE_API_URL=https://your-backend.railway.app" > .env.production

# Deploy to Vercel
vercel --prod
```

---

## 🧪 Post-Deployment Testing (10 minutes)

### 1. Test Backend
```bash
# Health check
curl https://your-backend-url.com/health

# Nonce endpoint
curl https://your-backend-url.com/api/auth/nonce

# Referral leaderboard
curl https://your-backend-url.com/api/referrals/leaderboard
```

### 2. Test Frontend
```
1. Visit https://your-frontend-url.vercel.app
2. Connect wallet
3. Sign in (SIWE)
4. Check if you're Founding Member #1 👑
5. Go to /referrals page
6. Copy your referral link
7. Share on Twitter (test)
```

### 3. Test Referral Flow
```
1. Open incognito window
2. Use your referral link
3. Create new account
4. Verify:
   - New user gets "Founding Member #2"
   - New user starts with 50 XP
   - Your account gets +100 XP
   - Your referral count = 1
```

---

## 📢 Launch Marketing (30 minutes)

### Tweet 1: The Announcement
```
🚨 CT Fantasy League is LIVE

The first fantasy game for Crypto Twitter.

✨ Draft your dream team of influencers
📊 Earn points from their Twitter performance
🏆 Compete for glory & rewards

🔥 First 1,000 get Founding Member status
💰 Early supporters will be rewarded

Play now: [YOUR_URL]
```

### Tweet 2: The FOMO (1 hour later)
```
#47 Founding Members already claimed 👀

953 spots left.

If you're reading this, you're still early.

[YOUR_URL]
```

### Tweet 3: The Urgency (4 hours later)
```
Founding Member #156 just signed up.

844 spots remaining.

Quality score matters. Invite friends who'll actually play.

Not all invites are equal. 📈

[YOUR_URL]
```

### Tweet 4: Social Proof (Day 2)
```
24 hours in:

• 312 Founding Members
• 688 spots left
• Average quality score: 76%
• Top recruiter: 14 active invites

The early birds are building serious equity.

Are you in yet? 👀

[YOUR_URL]
```

---

## 🎯 Launch Checklist

### Before Launch
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrated (referral tables)
- [ ] Test account created
- [ ] Referral flow tested
- [ ] Tweet drafted
- [ ] Screenshot taken (for tweet)

### Day 1 (Launch Day)
- [ ] Tweet announcement
- [ ] Pin tweet
- [ ] Share in CT Discord/Telegram groups
- [ ] DM 5-10 CT influencers
- [ ] Monitor for bugs/errors
- [ ] Respond to all comments/questions

### Day 2-7 (Growth Week)
- [ ] Tweet updates (Founding Member count)
- [ ] Fix any critical bugs
- [ ] Track metrics (signups, referrals, quality scores)
- [ ] Aim for 1,000 Founding Members by Week 2

### Week 2+
- [ ] Close Founding Member status (1,000 cap)
- [ ] Tweet: "Too late, all 1,000 spots taken"
- [ ] Keep growing (5K users goal)
- [ ] Plan paid tournaments
- [ ] Announce token plans

---

## 📊 Metrics to Track

### Growth Metrics (Daily)
```bash
# Connect to your production DB
psql $PRODUCTION_DATABASE_URL

# Check user count
SELECT COUNT(*) FROM users;

# Check founding members
SELECT COUNT(*) FROM users WHERE is_founding_member = true;

# Check referrals
SELECT
  COUNT(*) as total_referrals,
  AVG(referral_count) as avg_per_user
FROM users WHERE referral_count > 0;

# Check quality scores
SELECT
  AVG(referral_quality_score) as avg_quality,
  MAX(referral_quality_score) as max_quality
FROM users WHERE referral_count > 0;
```

### Success Signals (Week 1)
```
✅ 100+ users in first 3 days
✅ 40%+ referral rate
✅ 60%+ weekly active users
✅ 500+ users by Day 7
✅ <1% error rate
✅ Social mentions/shares
```

---

## 🐛 Common Issues & Fixes

### Issue: "CORS error"
```javascript
// backend/src/server.ts
// Add your production frontend URL
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-app.vercel.app', // ADD THIS
  'http://localhost:5173',
];
```

### Issue: "Database connection failed"
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:5432/dbname

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Referral code not generated"
```sql
-- Manually generate for existing users
UPDATE users
SET referral_code = UPPER(CONCAT('FORESIGHT_', SUBSTRING(MD5(id::text), 1, 8)))
WHERE referral_code IS NULL;
```

### Issue: "Founding member not showing"
```sql
-- Check user
SELECT id, username, is_founding_member, founding_member_number
FROM users
WHERE wallet_address = 'YOUR_WALLET';

-- Manually set if needed
UPDATE users
SET is_founding_member = true, founding_member_number = 1
WHERE id = 'YOUR_USER_ID';
```

---

## 🎉 Post-Launch Celebration

### When you hit milestones:

**100 Users:**
```
Just hit 100 users! 🎉

900 Founding Member spots left.

This is moving fast. Get in while you can.

[YOUR_URL]
```

**500 Users:**
```
500 players in 5 days 🔥

The CT Fantasy revolution is real.

500 Founding Member spots left. Don't sleep.

[YOUR_URL]
```

**1,000 Founding Members:**
```
🔒 ALL 1,000 FOUNDING MEMBER SPOTS CLAIMED

If you're reading this, you're too late.

But you can still play... you just won't have that 5x multiplier when we launch $FORESIGHT 😏

See you in Phase 2.

[YOUR_URL]
```

---

## 💰 Revenue Milestones (Future)

### Month 2: First Dollar
```
Just launched paid tournaments! 🎮

$10 entry, $900 prize pool.
Top 10 share the pot.

Let's goooo 💰

[TOURNAMENT_LINK]
```

### Month 3: $10K MRR
```
$10K MRR hit! 🚀

Crazy what happens when you:
- Build a good product
- Give users value
- Don't rug

Phase 3 (token) coming soon 👀
```

### Month 6: Token Launch
```
$FORESIGHT airdrop is LIVE 🪂

Founding Members: Check your wallets
Everyone else: You should've been early

This is what we meant by "early supporters will be rewarded"

Claim: [AIRDROP_URL]
```

---

## 🏁 Final Commands (Do This Now)

```bash
# 1. Commit everything
cd /Users/yonko/foresight
git add .
git commit -m "🚀 Launch: Referral system + monetization ready"
git push origin main

# 2. Deploy backend (choose Railway or Render)
# Follow steps above

# 3. Deploy frontend
cd frontend
vercel --prod

# 4. Test it works
# Visit your URL, create account, get referral code

# 5. TWEET IT
# Post your launch tweet

# 6. CELEBRATE 🎉
# You just launched a top 0.1% product
```

---

## 🎯 Remember

**You're not launching an MVP.**
**You're launching a complete product with:**
- ✅ Working game
- ✅ Viral growth
- ✅ Monetization plan
- ✅ Path to top 0.01%

**This is the beginning of something big.**

**First 1,000 users will be legendary.**

**GO MAKE IT HAPPEN.** 🚀

---

**Need help during deployment? I'm here.**
**Got your first user? Tell me.**
**Hit 100 users? We celebrate.**

**LET'S FUCKING GO!** 💎
