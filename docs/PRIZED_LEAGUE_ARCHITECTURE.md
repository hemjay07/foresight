yest voclau# Prized CT Draft League - Complete Architecture

## Overview

This document outlines the complete architecture for the prized CT Draft league system - the core revenue-generating feature of the Foresight platform.

---

## 1. SYSTEM COMPONENTS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRIZED CT DRAFT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   FRONTEND   │───▶│   BACKEND    │───▶│SMART CONTRACT│                  │
│  │   (React)    │◀───│   (Node.js)  │◀───│  (Solidity)  │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  • Contest UI        • Scoring Engine    • Payment Escrow                   │
│  • Payment Flow      • Twitter API       • Prize Distribution               │
│  • Team Builder      • Rankings          • Refund Logic                     │
│  • Leaderboard       • Event Indexing    • 15% Platform Fee                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CONTEST LIFECYCLE

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐
│ CREATE  │───▶│  OPEN   │───▶│ LOCKED  │───▶│ SCORING │───▶│ FINALIZED │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └───────────┘
   Admin         Users           Auto          Backend         Admin
   creates       pay &          at lock        calculates      submits
   contest       join           time           scores          rankings
                   │                                               │
                   ▼                                               ▼
              ┌─────────┐                                    ┌─────────┐
              │CANCELLED│◀─── If < min players              │ CLAIMED │
              └─────────┘     before lock                    └─────────┘
                   │                                               │
                   ▼                                               ▼
              Full refunds                                   Users claim
              to all users                                   their prizes
```

### Status Definitions

| Status | Description | User Actions | Admin Actions |
|--------|-------------|--------------|---------------|
| OPEN | Contest accepting entries | Enter, Update Team, Withdraw | Cancel |
| LOCKED | No changes allowed, contest running | View only | None |
| SCORING | Backend calculating final scores | View only | None |
| FINALIZED | Rankings submitted, prizes ready | Claim Prize | None |
| CANCELLED | Contest cancelled | Claim Refund | None |

---

## 3. SMART CONTRACT: CTDraftPrized.sol

### Key Functions

```solidity
// Admin Functions
createContest(entryFee, minPlayers, maxPlayers, lockTime, endTime)
lockContest(contestId)
finalizeContest(contestId, rankedPlayers[])
cancelContest(contestId)

// User Functions
enterContest(contestId, teamIds[5], captainId) payable
updateTeam(contestId, teamIds[5], captainId)
withdrawEntry(contestId)
claimPrize(contestId)
claimRefund(contestId)
```

### Fee Structure

- **Platform Fee**: 15% of prize pool
- **Distributable Pool**: 85% of prize pool
- **Fee Recipient**: Treasury contract

### Prize Distribution (10+ players)

| Rank | Percentage |
|------|------------|
| 1st | 40% |
| 2nd | 25% |
| 3rd | 15% |
| 4th-5th | 5% each |
| 6th-10th | 2% each |

### Small Contest Distribution (<10 players)

- Top 30% get paid (minimum 1 winner)
- 1 winner: 100%
- 2 winners: 65% / 35%
- 3 winners: 50% / 30% / 20%

---

## 4. BACKEND INTEGRATION

### New API Endpoints

```
POST   /api/prized/contests                    # Create contest (admin)
GET    /api/prized/contests                    # List all prized contests
GET    /api/prized/contests/:id                # Get contest details
GET    /api/prized/contests/:id/entries        # Get all entries
GET    /api/prized/contests/:id/my-entry       # Get user's entry
POST   /api/prized/contests/:id/verify-entry   # Verify on-chain entry
POST   /api/prized/contests/:id/finalize       # Submit rankings (admin)
GET    /api/prized/contests/:id/rankings       # Get final rankings
```

### Event Indexing

Backend listens to contract events:
- `ContestCreated` → Create contest record in DB
- `ContestEntered` → Link wallet to user, create team record
- `TeamUpdated` → Update team record
- `ContestLocked` → Update contest status
- `ContestFinalized` → Update rankings, enable claims
- `ContestCancelled` → Update status, enable refunds
- `PrizeClaimed` → Mark entry as claimed

### Scoring Flow

```
1. Contest ends (endTime reached)
2. Cron job triggers scoring:
   a. Fetch weekly snapshots for all influencers
   b. Calculate V2 scores for each entry
   c. Apply captain multiplier (1.5x)
   d. Rank all entries by total score
3. Admin reviews rankings
4. Admin calls finalizeContest(contestId, rankedPlayers[])
5. Contract stores rankings and calculates prizes
6. Users can now claim prizes
```

---

## 5. FRONTEND FLOW

### Contest Discovery

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIZED CONTESTS                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Weekly Classic  │  │ High Roller     │  │ Whale Pool  │ │
│  │ 0.01 ETH Entry  │  │ 0.05 ETH Entry  │  │ 0.1 ETH     │ │
│  │ 45 Players      │  │ 12 Players      │  │ 5 Players   │ │
│  │ 0.38 ETH Pool   │  │ 0.51 ETH Pool   │  │ 0.42 ETH    │ │
│  │ [Enter Now]     │  │ [Enter Now]     │  │ [Enter Now] │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  Your Active Entries: 1                                     │
│  Total Winnings: 0.15 ETH                                   │
└─────────────────────────────────────────────────────────────┘
```

### Entry Flow

```
1. User clicks "Enter Now"
2. Modal shows entry fee + prize pool info
3. User selects team (5 influencers)
4. User selects captain (1.5x multiplier)
5. User clicks "Pay & Enter"
6. Wallet popup: approve transaction
7. Transaction confirmed
8. Backend verifies on-chain entry
9. User sees confirmation + team in "My Entries"
```

### Claim Flow

```
1. Contest ends
2. User sees final rank + prize amount
3. User clicks "Claim Prize"
4. Wallet popup: approve transaction
5. ETH transferred to user
6. Celebration animation
```

---

## 6. DATABASE SCHEMA UPDATES

### New Tables

```sql
-- Prized contests (synced from contract)
CREATE TABLE prized_contests (
  id SERIAL PRIMARY KEY,
  contract_contest_id INTEGER UNIQUE NOT NULL,
  entry_fee DECIMAL(18, 8) NOT NULL,
  min_players INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 0,
  lock_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  prize_pool DECIMAL(18, 8) DEFAULT 0,
  player_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prized entries (synced from contract)
CREATE TABLE prized_entries (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES prized_contests(id),
  user_id INTEGER REFERENCES users(id),
  wallet_address VARCHAR(42) NOT NULL,
  team_ids INTEGER[] NOT NULL,
  captain_id INTEGER NOT NULL,
  paid_amount DECIMAL(18, 8) NOT NULL,
  rank INTEGER,
  prize_amount DECIMAL(18, 8),
  score DECIMAL(10, 2),
  claimed BOOLEAN DEFAULT FALSE,
  entry_tx_hash VARCHAR(66),
  claim_tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contest_id, wallet_address)
);

-- Prize claims history
CREATE TABLE prize_claims (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES prized_entries(id),
  amount DECIMAL(18, 8) NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  claimed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. SECURITY CONSIDERATIONS

### Smart Contract Security

- [x] Reentrancy protection (checks-effects-interactions pattern)
- [x] Integer overflow protection (Solidity 0.8+)
- [x] Access control (onlyOwner modifier)
- [x] Input validation (team size, influencer IDs, captain)
- [ ] Audit by third party (TODO before mainnet)

### Backend Security

- Verify all entries on-chain before counting
- Validate wallet signatures for user actions
- Rate limiting on entry verification
- Admin actions require multi-sig (future)

### Anti-Gaming Measures

- Wallet-based entry (1 entry per wallet per contest)
- Lock time prevents last-minute changes
- Scoring based on verifiable Twitter data
- Rankings submitted by admin (not auto-calculated on-chain)

---

## 8. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Smart contract audit
- [ ] Testnet deployment and testing
- [ ] Frontend integration testing
- [ ] Backend event indexing testing
- [ ] Scoring accuracy verification

### Deployment Steps

1. Deploy CTDraftPrized.sol to Base mainnet
2. Set Treasury address in contract
3. Update frontend with contract address
4. Update backend with contract ABI
5. Test with small entry fee contest
6. Monitor first contest end-to-end

### Post-Deployment

- [ ] Monitor gas costs
- [ ] Track user completion rates
- [ ] Analyze prize claim timing
- [ ] Gather feedback on entry flow

---

## 9. REVENUE PROJECTIONS

### Fee Model

- 15% platform fee on all prize pools

### Example Scenarios

| Scenario | Players | Entry Fee | Prize Pool | Platform Fee |
|----------|---------|-----------|------------|--------------|
| Small | 20 | 0.01 ETH | 0.20 ETH | 0.03 ETH |
| Medium | 50 | 0.05 ETH | 2.50 ETH | 0.375 ETH |
| Large | 100 | 0.1 ETH | 10.0 ETH | 1.5 ETH |

### Monthly Projection (Conservative)

- 4 weekly contests
- Average 30 players per contest
- Average 0.03 ETH entry fee
- Monthly prize pools: ~3.6 ETH
- Monthly platform revenue: ~0.54 ETH (~$1,500 at $2,800/ETH)

---

## 10. FUTURE ENHANCEMENTS

### Phase 2
- Multiple entry tiers (beginner, pro, whale)
- Head-to-head matchups
- Private prized leagues

### Phase 3
- Tournament brackets
- Season-long leagues
- NFT prizes for top performers

### Phase 4
- Mobile app integration
- Push notifications for contest updates
- Social features (team sharing, rivalries)
