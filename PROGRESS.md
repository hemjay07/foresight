# Foresight — Progress

## Current Status: E2E Testing In Progress (Mar 2, 2026)

### NEXT ACTION
Run E2E test on Contest #28 (`/draft/28`) — all 3 accounts entering, watch lock → results flow.
After lock (3min) + end (5min), trigger:
```bash
TOKEN="<fresh-admin-token>"
curl -s -X POST "http://localhost:3001/api/admin/trigger-prized-scoring" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
```
Admin token generation (expires 2h):
```bash
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({userId:'9fbab7f2-4f98-4524-a2b1-70ecbdb1b8c2',walletAddress:'HNohm3miR1SQinELVFXKnLnqzHUG2YiAp2kU4JtcSni1',privyDid:'did:privy:cmlx3yhwj01yr0cla94jpgtf0',role:'admin'},'b8f3d4e7a9c2f1e6d8b5a3c9f2e7d4b8a1c5e9f3d7b2a8c4e6f1d9b3a7c5e2f8',{expiresIn:'2h'}))"
```

---

## Session Fixes (Mar 2, 2026) — ALL ON MAIN

### Auth / Sign-in
- Fixed sign-in from non-home pages — `customOAuthRedirectUrl: window.location.origin` in PrivyProvider
- sessionStorage preserves path before OAuth redirect, restores after
- Removed `window.location.reload()` from `syncWithBackend` (caused double-bounce)
- Fixed Vite HMR broken by `clientPort: 443` — removed it from vite.config.ts
- Stale OAuth params cleanup when `ready && !authenticated`

### Free League Entry (walletless users)
- **Removed "No wallet connected" block on free league entry** — wallet not needed to enter
- `enter-free`, `update-free-team`, `transfer-status`, `my-entry` endpoints now use:
  ```ts
  const entryKey = walletAddress ? walletAddress.toLowerCase() : `user:${userId}`;
  ```
- **Prize claim** still requires wallet (SOL needs somewhere to go) but finds entry by `user_id` fallback:
  - Atomic UPDATE finds entry by `user_id` (for walletless) or `wallet_address` (for paid)
  - On claim, updates `wallet_address` to real wallet and sends SOL
  - Clear error message: "A Solana wallet is required to claim prizes. Connect one in your Privy settings."

### Weekly Entry Limit — REMOVED (temporarily)
- Removed the "1 free league per week" limit from `enter-free`
- Reason: too restrictive for testing/hackathon demo
- TODO in `docs/TODO.md`: rethink with XP tiers, per-user vs per-wallet logic before launch

### Autofill
- Fixed deterministic autofill — was always same team (greedy value sort)
- Now uses Fisher-Yates shuffle before budget-constrained fill

### Contest UI — Compete Page
- Added `getResultsCountdown()` function
- When contest is LOCKED: stat tile shows **"RESULTS IN"** + `2m 30s` countdown
- Sidebar list item shows `results in 2m 30s`
- Past end time: `Scoring now`
- `getResultsCountdown` ticks live (same interval as lock countdown)

### ContestDetail Page
- `fetchContestData` switched from `Promise.all` → `Promise.allSettled` — one failed API no longer shows "Contest Not Found"
- My-entry fetched with `hasSession()` only (no wallet required)
- "isMe" leaderboard highlight uses `entry.id === myEntry.id` (works for walletless)
- Added `userId` field to Entry interface

### Activity Feed (Home page)
- Was empty for users who haven't followed anyone
- Now falls back to **global recent activity** (all users' entries + follows) when following nobody
- Switches to followed-only feed once you follow people
- Empty state copy: "No recent activity yet"

### Backend Entries API
- `/api/v2/contests/:id/entries` now returns `userId` field per entry
- Username fallback for walletless: `Player #${userId.slice(-4)}` instead of `user:UUID`

---

## E2E Test Contests (Mar 2, 2026)
- Contest 27: finalized, 3 entries (rank 1: 210pts, rank 2: 116pts, rank 3: 110pts), prizes assigned
- Contest 28: ACTIVE — lock 19:02 UTC, end 19:04 UTC, free league

---

## Previous: Security Audit Complete (Mar 1, 2026)

Branch `audit/security-review` merged to main.
45 findings total, 43 fixed. Key fixes:
- httpOnly cookies for JWTs
- CSRF double-submit pattern
- 15-min access tokens + 30-day refresh
- Logout always clears cookies

---

## Dev Commands
```bash
cd backend && NODE_OPTIONS='--import tsx' pnpm dev   # Backend :3001
cd frontend && pnpm dev                               # Frontend :5173
```
