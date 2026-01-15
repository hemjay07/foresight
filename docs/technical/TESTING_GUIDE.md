# 🧪 Timecaster - Testing Guide

**Purpose:** End-to-end testing checklist for the Timecaster platform
**Network:** Base Sepolia Testnet
**Date:** November 16, 2025

---

## 🚀 Quick Start

### Prerequisites
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:5173
- ✅ MetaMask or compatible wallet installed
- ✅ Base Sepolia testnet added to wallet
- ⚠️ **Need testnet ETH** from faucet (see below)

### Get Base Sepolia Testnet ETH

**Option 1: Alchemy Faucet (Recommended)**
```
https://www.alchemy.com/faucets/base-sepolia
```
- Connect your wallet
- Receive 0.1 ETH (usually instant)
- Enough for ~50 transactions

**Option 2: Base Official Faucet**
```
https://docs.base.org/tools/network-faucets
```

**Option 3: Use Deployed Wallet**
```
Address: 0x414A1F683feB519C4F24EbAbF782FF71A75C7BC0
Has: ~0.099 ETH remaining
```

---

## 📋 Testing Checklist

### Phase 1: Basic Connectivity ✅

#### 1.1 Backend Health
```bash
# Test backend is running
curl http://localhost:3001/health

# Expected output:
{
  "status": "ok",
  "timestamp": "2025-11-16T13:00:00.000Z",
  "uptime": 1234.567,
  "websocket": {
    "connected": 0
  }
}
```

#### 1.2 Frontend Access
```bash
# Open in browser
open http://localhost:5173

# Should see:
- Timecaster homepage
- Navigation menu (Home, Draft, Arena, Gauntlet, Whisperer)
- "Connect Wallet" button
- Hero banner
```

#### 1.3 Database Connection
```bash
# Verify influencers are loaded
curl http://localhost:3001/api/draft/influencers | jq '.influencers | length'

# Expected: 50
```

**Status:** ✅ All systems operational

---

### Phase 2: Wallet Connection 🔐

#### 2.1 Connect Wallet
1. Click "Connect Wallet" button
2. Select MetaMask (or your wallet)
3. Approve connection
4. Switch to Base Sepolia network if prompted

**Expected Result:**
- Wallet address shown in header
- Network: Base Sepolia (84532)
- Balance displayed (if funded)

#### 2.2 Verify Contract Addresses
Open browser console (F12) and check:
```javascript
// Should see contract addresses loaded
console.log(window.ethereum.chainId) // Should be '0x14a34' (84532)
```

**Deployed Contracts:**
- CTDraft: `0x378105C2081Cc2235e6637DC9757a63F20263aa9`
- TimecasterArena: `0x5b8e61e873da5EC1616b3931F4Bc7Fc32D1B9F62`
- DailyGauntlet: `0x16ABD5fC02Ba7E64527320b2C042BaaCBc2BB854`
- Treasury: `0x7A395d0B4E1542335DB3478171a08Cf34E97180f`

---

### Phase 3: CT Draft (Fantasy League) 🏆

#### 3.1 View Influencers
1. Navigate to **Draft** page
2. Should see 50 influencers loaded
3. Check tier distribution:
   - **A-tier (Red):** 15 influencers @ 35 ETH each
   - **B-tier (Blue):** 15 influencers @ 25 ETH each
   - **C-tier (Green):** 20 influencers @ 15 ETH each

**Sample Influencers:**
- sassal (A-tier, 710k followers)
- Ivan on Tech (A-tier, 690k followers)
- Crypto Wendy O (A-tier, 670k followers)

#### 3.2 Create Draft Team
1. Select **5 influencers** (any tier combination)
2. Enter team name (e.g., "Test Team Alpha")
3. Click "Submit Team"
4. **Approve transaction** in MetaMask
5. Wait for confirmation

**Expected Gas Cost:** ~0.001-0.003 ETH

**What Happens:**
- Team saved to backend database
- User linked to team
- Ready for weekly scoring

#### 3.3 View Team
1. Should see your team listed
2. Total roster: 5 influencers
3. Team name displayed
4. Current score: 0 (updates weekly)

**Test Contract Read:**
```bash
# Check total teams created (will be > 0 after your team)
cast call 0x378105C2081Cc2235e6637DC9757a63F20263aa9 "nextTeamId()(uint256)" --rpc-url https://sepolia.base.org
```

---

### Phase 4: Timecaster Arena (1v1 Duels) ⚔️

#### 4.1 View Active Duels
1. Navigate to **Arena** page
2. Should see duel list (may be empty)
3. Filters: Open, Active, Resolved

#### 4.2 Create a Duel
1. Click **"Create Duel"**
2. Fill in details:
   - **Type:** Price Prediction (ETH/USD)
   - **Position:** OVER / UNDER
   - **Target:** 3000 (example)
   - **Stake:** 0.01 ETH
   - **Expiry:** 7 days
3. Submit and approve transaction

**Expected Gas:** ~0.002-0.004 ETH

**What Happens:**
- Duel created on-chain
- Stake locked in contract
- Waiting for opponent

#### 4.3 Accept a Duel
1. Find an open duel
2. Click **"Accept Duel"**
3. Match the stake amount
4. Approve transaction

**Result:**
- Duel status → Active
- Both stakes locked
- Waiting for oracle resolution

#### 4.4 Resolve Duel (Oracle/Admin)
**Note:** Only oracle address can resolve. This is automated in production.

```bash
# Manual resolution (for testing)
cast send 0x5b8e61e873da5EC1616b3931F4Bc7Fc32D1B9F62 \
  "resolveDuel(uint256,address)" \
  0 0xWINNER_ADDRESS \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia.base.org
```

**Expected:**
- Winner receives ~95% of pot
- Protocol gets 5%
- Reputation score updated

---

### Phase 5: Daily Gauntlet (Daily Predictions) 🎯

#### 5.1 View Today's Gauntlet
1. Navigate to **Gauntlet** page
2. Should see 5 daily predictions
3. Entry fee: 0.05 ETH

#### 5.2 Enter Gauntlet
1. Click **"Enter Gauntlet"**
2. Make 5 predictions:
   - ETH price (OVER/UNDER target)
   - BTC price
   - Protocol metric
   - Narrative prediction
   - Custom prediction
3. Submit with 0.05 ETH stake
4. Approve transaction

**Expected Gas:** ~0.003-0.005 ETH

#### 5.3 Submit Predictions
After entry:
- All 5 predictions locked on-chain
- Waiting for daily resolution
- Scoring: Proportional to accuracy

**Scoring Algorithm:**
```
Accuracy = (Correct Predictions / 5) * 100
Reward = (Accuracy / Total Accuracy) * Prize Pool
```

#### 5.4 View Results (Next Day)
1. Oracle resolves all predictions
2. Accuracy scores calculated
3. Rewards distributed proportionally
4. Leaderboard updated

---

### Phase 6: CT Whisperer (Quiz Game) 🧠

#### 6.1 Start Quiz
1. Navigate to **Whisperer** page
2. Click **"Start Quiz"**
3. Must be authenticated (SIWE login)

#### 6.2 Play Quiz
1. Read the tweet
2. Guess which influencer tweeted it
3. 4 multiple choice options (randomized)
4. Answer within time limit

**Question Example:**
```
"Bitcoin to $100k by EOY. Bookmark this tweet 🚀"

A) Vitalik Buterin
B) CryptoCobain
C) PlanB
D) Crypto Wendy O
```

#### 6.3 View Score
After quiz:
- Correct answers: X/10
- Accuracy: X%
- Time spent per question
- Leaderboard ranking

**Prizes:**
- Free to play
- Sponsored daily prize pool
- Top players share rewards

---

### Phase 7: Profile & Stats 👤

#### 7.1 View Profile
1. Click on wallet address (top right)
2. Navigate to **Profile**
3. Should see:
   - Wallet address
   - Username (editable)
   - Avatar (optional)
   - Bio (optional)

#### 7.2 User Statistics
- **Draft:** Teams created, total score
- **Arena:** Duels won/lost, win rate
- **Gauntlet:** Entries, avg accuracy
- **Whisperer:** Games played, correct %

#### 7.3 Edit Profile
1. Click **"Edit Profile"**
2. Update:
   - Username
   - Avatar URL
   - Bio
3. Save changes

---

### Phase 8: Leaderboards 🏅

#### 8.1 Global Leaderboard
1. Navigate to **Leaderboard** page
2. View tabs:
   - **Draft:** Top teams by score
   - **Arena:** Most duel wins
   - **Gauntlet:** Highest accuracy
   - **Whisperer:** Top quiz scores

#### 8.2 Weekly Rankings
- Top 10 players displayed
- Your rank highlighted
- Filters: Weekly, Monthly, All-Time

#### 8.3 Rewards
- Top players earn reputation badges
- Featured on homepage
- Exclusive perks

---

## 🔍 Contract Testing Commands

### Read Contract Data

```bash
# Set RPC URL
export RPC="https://sepolia.base.org"

# ReputationEngine - Get total players
cast call 0x24C8171af3e2EbA7fCF53BDB5B958Ed2AB36fb0c "totalPlayers()(uint256)" --rpc-url $RPC

# CTDraft - Check owner
cast call 0x378105C2081Cc2235e6637DC9757a63F20263aa9 "owner()(address)" --rpc-url $RPC

# TimecasterArena - Get next duel ID
cast call 0x5b8e61e873da5EC1616b3931F4Bc7Fc32D1B9F62 "nextDuelId()(uint256)" --rpc-url $RPC

# Treasury - Check balance
cast balance 0x7A395d0B4E1542335DB3478171a08Cf34E97180f --rpc-url $RPC

# Check your balance
cast balance 0xYOUR_ADDRESS --rpc-url $RPC
```

### Write Contract Data (Testing)

**⚠️ Only use test wallets!**

```bash
# Load private key
export PRIVATE_KEY="0x..."

# Create test duel
cast send 0x5b8e61e873da5EC1616b3931F4Bc7Fc32D1B9F62 \
  "createDuel(uint8,bytes32,string,uint256,uint256)" \
  0 \
  "0x4554482f555344000000000000000000000000000000000000000000000000" \
  "OVER 3000" \
  3000000000000000000000 \
  $(($(date +%s) + 604800)) \
  --value 0.01ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC
```

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem:** "Connect Wallet" not working
**Solution:**
1. Check MetaMask is installed
2. Refresh page (Cmd+R)
3. Clear browser cache
4. Try different wallet

**Problem:** Transactions failing
**Solution:**
1. Check sufficient ETH for gas
2. Verify correct network (Base Sepolia)
3. Increase gas limit in MetaMask
4. Check contract addresses are correct

**Problem:** Influencers not loading
**Solution:**
```bash
# Restart backend
pkill -f "tsx watch"
cd backend && pnpm dev

# Check API
curl http://localhost:3001/api/draft/influencers
```

### Backend Issues

**Problem:** Database connection error
**Solution:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@15

# Verify database exists
psql -l | grep timecaster
```

**Problem:** Port already in use
**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart backend
cd backend && pnpm dev
```

### Contract Issues

**Problem:** Contract reads failing
**Solution:**
1. Check RPC URL is correct
2. Verify contract is deployed: `cast code 0xCONTRACT_ADDRESS --rpc-url $RPC`
3. Try public RPC: `https://sepolia.base.org`

**Problem:** Transactions reverting
**Solution:**
1. Check you have sufficient ETH
2. Verify function parameters are correct
3. Check contract owner/permissions
4. View error: Add `--trace` flag to cast command

---

## ✅ Success Criteria

After testing, you should have:

- [ ] Backend health check passing
- [ ] Frontend loading without errors
- [ ] Wallet connected to Base Sepolia
- [ ] 50 influencers visible in Draft
- [ ] Created at least 1 draft team
- [ ] Created at least 1 Arena duel
- [ ] Submitted at least 1 Gauntlet entry
- [ ] Played CT Whisperer quiz
- [ ] Profile updated with username
- [ ] No console errors in browser
- [ ] All transactions confirmed on-chain
- [ ] Basescan showing contract interactions

---

## 📊 Expected Performance

### Response Times
- **API calls:** < 50ms average
- **Database queries:** < 20ms
- **Contract reads:** < 500ms
- **Contract writes:** 2-5 seconds (Base Sepolia)

### Gas Costs (Sepolia)
- **Create draft team:** ~0.002 ETH
- **Create duel:** ~0.003 ETH
- **Accept duel:** ~0.002 ETH
- **Enter gauntlet:** ~0.004 ETH
- **Update profile:** ~0.001 ETH

### Success Rates
- **API uptime:** 99.9%
- **Transaction success:** 95%+ (if properly funded)
- **Database queries:** 100%
- **Contract reads:** 100%

---

## 🎯 Test Scenarios

### Scenario 1: New User Onboarding
1. Open http://localhost:5173
2. Connect wallet (Base Sepolia)
3. Get testnet ETH from faucet
4. Browse influencers in Draft
5. Create first team
6. Check leaderboard
7. Update profile

**Expected time:** 5-10 minutes

### Scenario 2: Full Draft Experience
1. Create draft team (5 influencers)
2. View team on profile
3. Wait for weekly scoring (or trigger manually)
4. Check updated score
5. View leaderboard ranking
6. Join private league

**Expected time:** 10-15 minutes

### Scenario 3: Arena Competition
1. Create price prediction duel
2. Wait for opponent (or create second wallet)
3. Accept own duel (from different wallet)
4. Wait for expiry
5. Oracle resolves duel
6. Check reputation score update

**Expected time:** 15-20 minutes (or instant with manual resolution)

### Scenario 4: Daily Gauntlet
1. Enter today's gauntlet (0.05 ETH)
2. Submit 5 predictions
3. Wait 24 hours (or trigger resolution)
4. Check accuracy score
5. View reward distribution
6. Check leaderboard

**Expected time:** 2-3 minutes entry + 24h waiting

### Scenario 5: CT Whisperer Quiz
1. Start quiz game
2. Answer 10 questions
3. View results
4. Check leaderboard
5. Play again for higher score

**Expected time:** 5-10 minutes per game

---

## 📝 Bug Reporting

If you find bugs, please note:
1. **What you were doing**
2. **What you expected to happen**
3. **What actually happened**
4. **Browser console errors** (F12)
5. **Transaction hash** (if applicable)
6. **Screenshot** (if visual issue)

---

## 🚀 Next Steps After Testing

1. **Production Deployment**
   - Deploy to Base Mainnet
   - Update contract addresses
   - Deploy frontend to Vercel
   - Deploy backend to Railway

2. **Feature Additions**
   - Private leagues full implementation
   - Team customization
   - Social sharing
   - Achievement system

3. **Marketing**
   - Community building
   - Twitter promotion
   - Farcaster integration
   - Influencer partnerships

---

**Happy Testing! 🎮**

*For issues or questions, check TROUBLESHOOTING.md or DEPLOYMENT_COMPLETE.md*
