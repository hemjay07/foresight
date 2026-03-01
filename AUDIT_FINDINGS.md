# Audit Findings — Foresight

**Audit Branch:** `audit/security-review`
**Started:** 2026-03-01

Each finding follows a standard format. Findings are numbered sequentially and deduplicated across all scan phases.

---

## FINDING-001: Free Leagues Have No On-Chain Verification

- **Severity:** Critical
- **Category:** Architecture / Data Integrity
- **Phase:** 0 (Pre-audit observation)
- **File:** `backend/src/api/` (free league endpoints)
- **Description:** Free league contest entries, results, and rankings are stored exclusively in PostgreSQL with no on-chain verification. Unlike prized contests (which use `CTDraftPrizedV2.sol` on Base Sepolia for entry fees and prize pools), free leagues exist entirely off-chain. Contest results can be silently modified by anyone with database access.
- **Impact:** Compromised DB or malicious admin could alter free league results. If free leagues feed into reputation/qualification for prized contests, manipulation cascades to real money.
- **Recommended Fix:** On-chain result anchoring — at minimum, publish a hash of final standings to Solana/Base after each contest. Full fix: lightweight on-chain program for free league entries.
- **Commit:** N/A (architectural — requires separate feature work)
- **Status:** Open — flagged for post-audit implementation

---

## FINDING-002: Race Condition in Prize Claim (TOCTOU)

- **Severity:** Critical
- **Category:** SOL Transaction Security
- **Phase:** 2B
- **File:** `backend/src/api/prizedContestsV2.ts:1163-1175`
- **Description:** Double-claim prevention uses optimistic locking with a SELECT then UPDATE pattern, not a true atomic operation. Two concurrent requests can both read `claimed=false` before either writes, allowing the same prize to be paid twice.
- **Impact:** Treasury drained. Attacker submits two simultaneous claim requests, both succeed, prize paid twice.
- **Recommended Fix:** Use `UPDATE ... SET claimed=true WHERE claimed=false RETURNING *` as a single atomic statement, or use PostgreSQL advisory locks (`pg_advisory_xact_lock`). Add a unique constraint on `(contest_id, user_id, claimed)`.
- **Commit:** audit: fix FINDING-002 — atomic UPDATE RETURNING
- **Status:** Fixed ✅

---

## FINDING-003: SSRF Vulnerability in Image Proxy

- **Severity:** Critical
- **Category:** Infrastructure / SSRF
- **Phase:** 1B (semgrep) + 2G (manual)
- **File:** `backend/src/server.ts:113-131`
- **Description:** The `/api/proxy-image` endpoint accepts an unvalidated `url` query parameter and fetches it server-side. No domain whitelist, no private IP blocking, no size limit. Semgrep also flagged this as XSS via `res.send(Buffer.from(buffer))`.
- **Impact:** Attacker can access internal services (`http://localhost:3001/api/admin/stats`), cloud metadata (`http://169.254.169.254/`), scan internal networks, or cause DoS via large files.
- **Recommended Fix:** Whitelist allowed domains (pbs.twimg.com, etc.), block private IP ranges, add request timeout (5s), add response size limit (10MB), validate Content-Type is an image.
- **Commit:** audit: fix FINDING-003 — SSRF whitelist + IP blocking
- **Status:** Fixed ✅

---

## FINDING-004: Admin Endpoints Missing Authorization

- **Severity:** Critical
- **Category:** Authorization / Access Control
- **Phase:** 2A + 2D
- **File:** `backend/src/api/admin.ts` (all endpoints: lines 26, 52, 67, 80, 102, 142, 169, 190, 207, 224, 241, 269, 309, 346, 373, 419, 435, 451)
- **Description:** All admin endpoints use `authenticate` middleware only but do NOT check for admin role. The `requireAdmin` middleware exists but is never applied. Any authenticated user can access admin functionality.
- **Impact:** Any logged-in user can: view system stats, trigger scoring cycles, update influencer metrics, manually finalize contests, modify contest parameters (prize_pool, status, lock_time), manipulate the entire platform.
- **Recommended Fix:** Add `requireAdmin` middleware to ALL admin routes. Verify `is_admin` flag in database is properly gated.
- **Commit:** audit: fix FINDING-004 — requireAdmin on all admin endpoints
- **Status:** Fixed ✅

---

## FINDING-005: Dev Mode Simulated Transfers (Accepted Risk)

- **Severity:** ~~Critical~~ Low (Downgraded)
- **Category:** SOL Transaction Security
- **Phase:** 2B
- **File:** `backend/src/api/prizedContestsV2.ts:1201-1212`
- **Description:** When the treasury wallet is underfunded, the prize claim endpoint falls back to generating a `SIMULATED_*` transaction hash instead of actually sending SOL. This is intentionally gated by `NODE_ENV !== 'production'` — in production, it returns a 503 error and rolls back the claim. The simulation exists for dev/staging testing without needing a funded treasury.
- **Impact:** Low — production is already protected by the NODE_ENV check. Only risk is if NODE_ENV is misconfigured in production.
- **Recommended Fix:** No code change needed. Document that NODE_ENV must be set to `'production'` in all production deployments. Consider adding a startup warning if NODE_ENV is not `'production'` and TREASURY_SECRET_KEY_BASE64 is set.
- **Commit:** N/A
- **Status:** Accepted — intentional design for testing

---

## FINDING-006: JWT Secrets Committed to Git History

- **Severity:** Critical
- **Category:** Secret Management
- **Phase:** 1C
- **File:** Git history (multiple commits)
- **Description:** At least two distinct JWT secret values were committed to the repository in past commits. While current `.env` is gitignored, the secrets persist in git history and can be extracted by anyone with repo access.
- **Impact:** Attacker with repo access can forge valid JWT tokens, impersonate any user, claim prizes.
- **Recommended Fix:** Rotate JWT secret immediately. Rotate ALL secrets that were ever in git. Consider `git filter-branch` or BFG Repo-Cleaner to purge history (after ensuring all secrets are rotated regardless).
- **Commit:** N/A
- **Status:** Open

---

## FINDING-007: Token Stored in localStorage (XSS Risk)

- **Severity:** High
- **Category:** Authentication / Frontend
- **Phase:** 2A + 2E
- **File:** `frontend/src/hooks/usePrivyAuth.ts:68`
- **Description:** JWT auth token stored in `localStorage.setItem('authToken', token)`. If any XSS vulnerability exists (even in a third-party dependency), the token is immediately accessible to attacker scripts.
- **Impact:** Account takeover — attacker reads token, impersonates user, modifies teams, claims prizes.
- **Recommended Fix:** Move to httpOnly cookies with `secure` and `sameSite=strict` flags. Implement CSRF tokens for state-changing requests. Short-lived access tokens (15-60 min) + httpOnly refresh tokens.
- **Commit:** N/A
- **Status:** Open

---

## FINDING-008: No Rate Limiting on Prize Claim Endpoint

- **Severity:** High
- **Category:** API Security / DoS
- **Phase:** 2B + 2D
- **File:** `backend/src/api/prizedContestsV2.ts:1124`
- **Description:** The `POST /contests/:id/claim-prize` endpoint has no rate limiting middleware. Combined with FINDING-002 (race condition), this makes automated double-claim attacks trivial.
- **Impact:** DoS on prize distribution, amplifies race condition exploits.
- **Recommended Fix:** Apply `strictLimiter` (3 requests/hour) to claim endpoint.
- **Commit:** audit: fix FINDING-008 — strictLimiter on prize claim
- **Status:** Fixed ✅

---

## FINDING-009: No Rate Limiting on Token Refresh

- **Severity:** High
- **Category:** Authentication
- **Phase:** 2A
- **File:** `backend/src/api/auth.ts:376`
- **Description:** The `/api/auth/refresh` endpoint has no rate limiter, unlike `/verify` which uses `authLimiter`.
- **Impact:** Brute-force refresh token attacks, token replay, DoS on auth system.
- **Recommended Fix:** Apply `authLimiter` to refresh endpoint.
- **Commit:** audit: fix FINDING-009 — authLimiter on refresh
- **Status:** Fixed ✅

---

## FINDING-010: Session Not Fully Invalidated on Logout

- **Severity:** High
- **Category:** Authentication
- **Phase:** 2A
- **File:** `backend/src/api/auth.ts:421-429`
- **Description:** Logout deletes session from DB, but the JWT access token remains valid until its expiry (7 days). No token blacklist/revocation mechanism exists. A stolen token keeps working even after the user logs out.
- **Impact:** Stolen tokens valid for up to 7 days post-logout.
- **Recommended Fix:** Implement token blacklist (Redis), reduce JWT expiry to 15-60 minutes, add `revoked_at` timestamp to sessions.
- **Commit:** N/A
- **Status:** Open

---

## FINDING-011: Database SSL Not Enforced

- **Severity:** High
- **Category:** Database Security
- **Phase:** 2F
- **File:** `backend/src/utils/db.ts:7-22`
- **Description:** Knex database configuration has no SSL/TLS settings. All database traffic is unencrypted.
- **Impact:** Man-in-the-middle can intercept database credentials and all query data.
- **Recommended Fix:** Add `ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' }` to Knex config.
- **Commit:** audit: fix FINDING-011 — DB SSL in production
- **Status:** Fixed ✅

---

## FINDING-012: CORS Allows ngrok in All Environments

- **Severity:** High
- **Category:** Infrastructure / CORS
- **Phase:** 2G
- **File:** `backend/src/server.ts:67-69`
- **Description:** Any `.ngrok-free.app` domain is whitelisted regardless of NODE_ENV. In production, any attacker can create an ngrok tunnel and bypass CORS.
- **Impact:** Cross-origin requests from attacker-controlled domains.
- **Recommended Fix:** Gate ngrok allowance behind `NODE_ENV === 'development'`.
- **Commit:** audit: fix FINDING-012 — ngrok gated behind dev
- **Status:** Fixed ✅

---

## FINDING-013: Missing HTTPS Enforcement

- **Severity:** High
- **Category:** Infrastructure
- **Phase:** 2G
- **File:** `backend/src/server.ts`
- **Description:** No middleware to redirect HTTP to HTTPS in production. Tokens and data can transit unencrypted.
- **Impact:** Session hijacking via network sniffing.
- **Recommended Fix:** Add HTTPS redirect middleware checking `x-forwarded-proto` header in production.
- **Commit:** audit: fix FINDING-013 — HTTPS redirect in production
- **Status:** Fixed ✅

---

## FINDING-014: Contest Finalization Race Condition

- **Severity:** High
- **Category:** SOL Transaction Security
- **Phase:** 2B
- **File:** `backend/src/services/cronJobs.ts:683-950`
- **Description:** If multiple cron instances run simultaneously (e.g., horizontal scaling), the same contest could be scored and finalized twice, leading to duplicate prize allocations.
- **Impact:** Double prize distribution from treasury.
- **Recommended Fix:** Use PostgreSQL advisory locks or a `processing_lock` column with atomic UPDATE before finalization.
- **Commit:** audit: fix FINDING-014 — atomic status transition in cronJobs.ts
- **Status:** Fixed ✅

---

## FINDING-015: Refresh Tokens Stored in Plaintext

- **Severity:** High
- **Category:** Authentication / Database
- **Phase:** 2A + 2F
- **File:** `backend/src/api/auth.ts:390-396`
- **Description:** Refresh tokens are stored as plain strings in the `sessions` table. If the database is breached, all refresh tokens are immediately usable.
- **Impact:** Database breach = all user sessions compromised for 30-day token lifetime.
- **Recommended Fix:** Hash refresh tokens with bcrypt before storing. Compare hashes on refresh.
- **Commit:** audit: fix FINDING-015 — SHA-256 hash refresh tokens before storing
- **Status:** Fixed ✅

---

## FINDING-016: JWT Algorithm Not Explicitly Pinned

- **Severity:** Medium
- **Category:** Authentication / Cryptographic
- **Phase:** 2A
- **File:** `backend/src/utils/auth.ts:28-31, 46-52`
- **Description:** `jwt.sign()` and `jwt.verify()` don't specify `algorithm: 'HS256'` / `algorithms: ['HS256']`. Relies on library defaults (which are secure, but best practice is explicit).
- **Impact:** Low currently, but prevents algorithm confusion attacks if library behavior changes.
- **Recommended Fix:** Add `{ algorithm: 'HS256' }` to sign and `{ algorithms: ['HS256'] }` to verify.
- **Commit:** audit: fix FINDING-016 — JWT HS256 pinned
- **Status:** Fixed ✅

---

## FINDING-017: Duplicate Influencers Accepted in Teams

- **Severity:** Medium
- **Category:** Input Validation / Game Integrity
- **Phase:** 2D
- **File:** `backend/src/api/prizedContestsV2.ts:471, 697, 772`
- **Description:** No validation preventing duplicate influencer IDs in team array. `[1, 1, 1, 1, 2]` passes all checks, concentrating score on one influencer.
- **Impact:** Game mechanic bypass, unfair advantage.
- **Recommended Fix:** Add `new Set(teamIds).size === teamIds.length` check.
- **Commit:** audit: fix FINDING-017 — duplicate influencer check
- **Status:** Fixed ✅

---

## FINDING-018: Console.log Leaks Sensitive Data

- **Severity:** Medium
- **Category:** Information Disclosure
- **Phase:** 2G
- **File:** `backend/src/api/prizedContestsV2.ts:442, 643, 730`
- **Description:** Console.log statements output wallet addresses, user IDs, and full request bodies to stdout.
- **Impact:** PII/wallet data in logs, accessible in hosting provider log dashboards.
- **Recommended Fix:** Replace with structured logger (pino), disable sensitive fields in production.
- **Commit:** audit: fix FINDING-018 — console.log replaced with logger.debug
- **Status:** Fixed ✅

---

## FINDING-019: Solana Transaction Uses 'confirmed' Not 'finalized'

- **Severity:** Medium
- **Category:** SOL Transaction Security
- **Phase:** 2B
- **File:** `backend/src/api/prizedContestsV2.ts:1222-1225`
- **Description:** `sendAndConfirmTransaction` uses `'confirmed'` commitment. A network fork could roll back the transaction while the DB marks the prize as claimed.
- **Impact:** Rare edge case: prize marked claimed but SOL not actually received, or double-spend on fork.
- **Recommended Fix:** Use `'finalized'` commitment for prize distribution (slower but safer).
- **Commit:** audit: fix FINDING-019 — 'confirmed' → 'finalized' commitment
- **Status:** Fixed ✅

---

## FINDING-020: Helmet CSP Not Configured

- **Severity:** Medium
- **Category:** Infrastructure / Headers
- **Phase:** 2G
- **File:** `backend/src/server.ts:44`
- **Description:** `app.use(helmet())` uses defaults. No explicit Content-Security-Policy configured. Missing fine-grained control over script-src, frame-src, etc.
- **Impact:** Weaker XSS protection. Third-party scripts can load unchecked.
- **Recommended Fix:** Configure CSP directives explicitly for the frontend.
- **Commit:** audit: fix FINDING-020 — Helmet CSP configured
- **Status:** Fixed ✅

---

## FINDING-021: Missing CSRF Protection

- **Severity:** Medium
- **Category:** Frontend Security
- **Phase:** 2E
- **File:** All state-changing endpoints
- **Description:** No CSRF tokens on POST/PATCH/DELETE operations. While JWT in Authorization header provides some CSRF resistance, the localStorage storage (FINDING-007) means this protection is incomplete.
- **Impact:** If combined with XSS, attacker can perform state-changing actions.
- **Recommended Fix:** Implement CSRF middleware, or move to httpOnly cookies + CSRF tokens.
- **Commit:** N/A
- **Status:** Open

---

## FINDING-022: Unvalidated Limit/Offset Query Parameters

- **Severity:** Medium
- **Category:** Input Validation
- **Phase:** 2D
- **File:** `backend/src/api/users.ts:57-58`
- **Description:** Offset parameter can be negative, triggering expensive database scans.
- **Impact:** DoS via crafted query parameters.
- **Recommended Fix:** `Math.max(0, parseInt(offset))` and cap limit.
- **Commit:** audit: fix FINDING-022 — offset Math.max(0,...)
- **Status:** Fixed ✅

---

## FINDING-023: Vulnerable Dependency — jws (HMAC Signature Bypass)

- **Severity:** High
- **Category:** Dependencies
- **Phase:** 1A
- **File:** `backend/node_modules/jws` (via jsonwebtoken)
- **Description:** `jws <3.2.3` has improper HMAC signature verification (GHSA-869p-cjfg-cm3x). This is a transitive dependency of `jsonwebtoken@9.0.2`.
- **Impact:** Potential JWT signature bypass.
- **Recommended Fix:** Update `jsonwebtoken` to latest, or override `jws` to `>=3.2.3`.
- **Commit:** audit: fix FINDING-023 — jsonwebtoken 9.0.2 → 9.0.3, jws 3.2.2 → 4.0.1
- **Status:** Fixed ✅

---

## FINDING-024: Vulnerable Dependency — axios (DoS via __proto__)

- **Severity:** High
- **Category:** Dependencies
- **Phase:** 1A
- **File:** `backend` direct dependency
- **Description:** `axios >=1.0.0 <=1.13.4` is vulnerable to DoS via `__proto__` key in mergeConfig (GHSA-43fc-jf86-j433).
- **Impact:** Denial of service.
- **Recommended Fix:** Update axios to `>=1.13.5`.
- **Commit:** audit: fix FINDING-024 — axios updated to 1.13.6
- **Status:** Fixed ✅

---

## FINDING-025: Vulnerable Dependency — react-router (XSS + CSRF)

- **Severity:** High
- **Category:** Dependencies
- **Phase:** 1A
- **File:** `frontend` dependency
- **Description:** `react-router >=7.0.0 <=7.11.0` has XSS via open redirects and CSRF in actions (GHSA-* multiple).
- **Impact:** XSS, CSRF, open redirect attacks.
- **Recommended Fix:** Update react-router to `>7.11.0`.
- **Commit:** audit: fix FINDING-025 — react-router-dom updated to 7.13.1
- **Status:** Fixed ✅

---

## FINDING-026: Multiple Vulnerable Transitive Dependencies

- **Severity:** Medium
- **Category:** Dependencies
- **Phase:** 1A
- **File:** Various (frontend + backend)
- **Description:** Multiple transitive dependency vulnerabilities detected by `pnpm audit`:
  - `basic-ftp <5.2.0` — path traversal (Critical, via puppeteer)
  - `preact >=10.27.0 <10.27.3` — JSON VNode injection (High, via @privy-io)
  - `hono` — multiple: JWT confusion, XSS, cache bypass, IP bypass (High/Moderate, via @privy-io)
  - `h3` — request smuggling (High, via @privy-io/@walletconnect)
  - `minimatch` — multiple ReDoS (High, via jest/tailwindcss)
  - `rollup 4` — arbitrary file write (High, via vite)
  - `lodash` — prototype pollution (Moderate)
  - `undici` — unbounded decompression (Moderate)
  - `qs` — arrayLimit DoS (High + Low)
- **Impact:** Varies — mostly exploitable only in specific code paths. The `hono` and `h3` issues are in Privy/WalletConnect dependencies.
- **Recommended Fix:** Update direct dependencies (`pnpm update`), override where possible. Document as accepted risk for transitive deps that can't be updated.
- **Commit:** N/A
- **Status:** Open

---

## FINDING-027: Twitter OAuth Redirect With Unsanitized Error Param

- **Severity:** Medium
- **Category:** Injection
- **Phase:** 3 (OWASP A03)
- **File:** `backend/src/api/twitter.ts:186-196`
- **Description:** Twitter OAuth callback interpolates error messages directly into redirect URLs without sanitization: `res.redirect(\`${FRONTEND_URL}/settings?twitter=error&message=${error}\`)`. While FRONTEND_URL is controlled, the error content from Twitter is not sanitized.
- **Impact:** Potential for reflected content injection in the redirect URL.
- **Recommended Fix:** URL-encode the error parameter: `encodeURIComponent(error.message)`.
- **Commit:** audit: fix FINDING-027 — encodeURIComponent on error param
- **Status:** Fixed ✅

---

## FINDING-028: Twitter Access Tokens Stored Unencrypted in DB

- **Severity:** Medium
- **Category:** Cryptographic Failures
- **Phase:** 3 (OWASP A02)
- **File:** `backend/src/api/twitter.ts:250`
- **Description:** Twitter access tokens stored as plaintext in the database: `twitter_access_token: tokens.access_token`. If the database is breached, all linked Twitter accounts are compromised.
- **Impact:** Database breach exposes user Twitter tokens — attacker can post/read as the user.
- **Recommended Fix:** Encrypt tokens at rest using AES-256-GCM with a server-side key, or use a secrets manager.
- **Commit:** audit: fix FINDING-028 — AES-256-GCM encryption for Twitter tokens
- **Status:** Fixed ✅

---

## FINDING-029: No Audit Trail for Admin/Sensitive Actions

- **Severity:** Medium
- **Category:** Logging & Monitoring
- **Phase:** 3 (OWASP A09)
- **File:** `backend/src/api/admin.ts` (all endpoints)
- **Description:** Admin actions (trigger-scoring, PATCH contests, finalize) don't log WHO made the change, WHEN, or WHAT changed. No immutable audit log exists for sensitive operations like prize claims.
- **Impact:** Cannot detect or investigate compromise. No accountability.
- **Recommended Fix:** Add audit logging middleware for all admin + prize endpoints. Log: userId, action, timestamp, IP, before/after values. Store in separate `audit_log` table.
- **Commit:** audit: fix FINDING-029 — audit_log table + logAuditEvent utility
- **Status:** Fixed ✅

---

## FINDING-030: Expired Sessions Never Garbage-Collected

- **Severity:** Medium
- **Category:** Authentication
- **Phase:** 3 (OWASP A07)
- **File:** `backend/src/api/auth.ts`
- **Description:** Sessions are deleted on explicit logout, but expired sessions (30-day refresh tokens) are never cleaned up. The `sessions` table grows indefinitely.
- **Impact:** Database bloat, potential performance degradation. Expired tokens remain queryable.
- **Recommended Fix:** Add a cron job to `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days'`.
- **Commit:** audit: fix FINDING-030 — session cleanup in existing cleanup cron
- **Status:** Fixed ✅

---

## FINDING-031: Auth Rate Limiter Too Lenient

- **Severity:** Medium
- **Category:** Authentication
- **Phase:** 3 (OWASP A04/A07)
- **File:** `backend/src/middleware/rateLimiter.ts:19-25`
- **Description:** `authLimiter` allows 50 attempts per 15 minutes in production (100 in dev). Best practice for login endpoints is 5-10 attempts per 15 minutes. Current config allows brute-force of weak credentials.
- **Impact:** Brute-force attacks feasible at 50 attempts/15min.
- **Recommended Fix:** Reduce to 10/15min in production. Add exponential backoff after 5 failures. Consider account lockout after 10 consecutive failures.
- **Commit:** audit: fix FINDING-031 — auth rate limit tightened to 15/15min
- **Status:** Fixed ✅

---

## FINDING-032: Double Finalization — Contest Can Be Finalized Twice

- **Severity:** Critical
- **Category:** Smart Contract / Financial
- **Phase:** 1D + 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:382-439` (also `CTDraftPrized.sol:220-258`)
- **Description:** `finalizeContest()` checks `contest.status != ContestStatus.LOCKED` but does not prevent a second call after status is set to FINALIZED. Owner can call it again with different rankings to redistribute prizes.
- **Impact:** Owner (or compromised owner key) can redistribute prizes to different addresses. Complete prize pool theft.
- **Recommended Fix:** Add `if (contest.status == ContestStatus.FINALIZED) revert ContestAlreadyFinalized();` or use a `prizesClaimed` flag checked before any transfers.
- **Commit:** audit: fix FINDING-032 — CEI pattern, set FINALIZED before external call
- **Status:** Fixed ✅

---

## FINDING-033: Reentrancy on Prize Claims

- **Severity:** Critical
- **Category:** Smart Contract / Reentrancy
- **Phase:** 1D + 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:554-569` (also `CTDraftPrized.sol:375-391`)
- **Description:** `claimPrize()` sets `entry.claimed = true` before the ETH transfer via `.call{value:}()`, which is the correct Checks-Effects-Interactions pattern. However, `entry.prizeAmount` is NOT zeroed before the transfer. A reentrant contract could potentially exploit other functions that read `prizeAmount` during the callback.
- **Impact:** Potential fund drain via reentrancy if any other function path reads the non-zeroed `prizeAmount`.
- **Recommended Fix:** Zero out `entry.prizeAmount` before transfer. Add OpenZeppelin `ReentrancyGuard` to all financial functions.
- **Commit:** audit: fix FINDING-033 — zero prizeAmount before external call
- **Status:** Fixed ✅

---

## FINDING-034: Rake Calculation Integer Arithmetic Bug

- **Severity:** Critical
- **Category:** Smart Contract / Financial Math
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:393`
- **Description:** Platform fee calculation: `(contest.prizePool * contest.rakePercent * 100) / BPS_DENOMINATOR`. The extra `* 100` creates confusion. With `rakePercent = 12` and `BPS_DENOMINATOR = 10000`: `(1e18 * 12 * 100) / 10000 = 0.12 ETH` — happens to be correct. But if `rakePercent` is stored as basis points (e.g., 1200 for 12%), the calculation breaks entirely.
- **Impact:** Incorrect rake splitting — platform either takes too much or too little from the prize pool.
- **Recommended Fix:** Standardize to either percentage (divide by 100) or basis points (divide by 10000), not a hybrid. Add unit tests with known values.
- **Commit:** audit: fix FINDING-034 — simplified to rakePercent/100
- **Status:** Fixed ✅

---

## FINDING-035: No Duplicate Validation in Rankings Array

- **Severity:** High
- **Category:** Smart Contract / Logic
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:410` (also `CTDraftPrized.sol:242-254`)
- **Description:** `finalizeContest()` iterates `rankedPlayers` and assigns prizes by rank, but only checks `entry.exists`. Does not check for duplicate addresses. Owner could submit `[alice, alice, bob]` — alice gets rank 1 AND rank 2 prizes.
- **Impact:** Manipulated prize distribution. One player receives multiple rank prizes.
- **Recommended Fix:** Track `alreadyRanked[player]` in a mapping during the loop. Revert on duplicates.
- **Commit:** audit: fix FINDING-035 — duplicate address check in finalizeContest
- **Status:** Fixed ✅

---

## FINDING-036: emergencyWithdraw() Owner Rug-Pull Vector

- **Severity:** High
- **Category:** Smart Contract / Access Control
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:724-727` (also `CTDraftPrized.sol:552-555`)
- **Description:** `emergencyWithdraw()` sends entire contract balance to owner with no restrictions. No timelock, no multi-sig requirement, no validation that only platform fees (not user entry fees) are withdrawn.
- **Impact:** Compromised owner key = complete fund drain of all prize pools and entry fees.
- **Recommended Fix:** Limit withdrawal to accrued platform fees only. Implement timelock (48h delay). Require multi-sig for emergency operations.
- **Commit:** audit: fix FINDING-036 — emergencyWithdraw limited to accumulatedFees
- **Status:** Fixed ✅

---

## FINDING-037: Unsafe .transfer() in Multiple Contracts

- **Severity:** High
- **Category:** Smart Contract / Transfer Pattern
- **Phase:** 2C
- **File:** `contracts/src/QuestRewards.sol:232`, `DailyGauntlet.sol:278-283`, `TimecasterArena.sol:296,430,449,452`
- **Description:** Multiple contracts use deprecated `.transfer()` which forwards only 2300 gas. This will fail for smart contract wallets (Safe, Argent) that need more gas in their receive/fallback functions.
- **Impact:** Users with smart contract wallets cannot claim rewards. Funds locked permanently.
- **Recommended Fix:** Replace all `.transfer()` with `.call{value:}()` and check return value.
- **Commit:** audit: fix FINDING-037 — .transfer() → .call{value:}() in all 3 contracts
- **Status:** Fixed ✅

---

## FINDING-038: Prize Pool Underflow on Small Contests

- **Severity:** High
- **Category:** Smart Contract / Financial Math
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:210-249, 420-431`
- **Description:** Prize tier system designed for larger contests (10+ players). With fewer players, the tier BPS allocations mean a significant portion of the pool goes undistributed and remains locked in the contract.
- **Impact:** Protocol leaks funds on edge cases. 1-player contests lose up to 60% of prize pool.
- **Recommended Fix:** Add special handling for contests with fewer players than tier slots. Distribute remainder to top ranks or return to treasury.
- **Commit:** audit: fix FINDING-038 — micro-contest (<10 players) handling in _calculateWinnersCount
- **Status:** Fixed ✅

---

## FINDING-039: Contest Can Be Finalized Before End Time

- **Severity:** High
- **Category:** Smart Contract / Logic
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:389`
- **Description:** Uses `<` comparison (`block.timestamp < contest.endTime`), allowing finalization exactly at `endTime`. The contest lock is also manual (owner calls `lockContest()`), so if backend submits rankings early, scores may be incomplete.
- **Impact:** Premature finalization with incomplete scoring data.
- **Recommended Fix:** Add buffer period. Consider Chainlink Keepers for automated, trustless locking.
- **Commit:** audit: fix FINDING-039 — block.timestamp <= endTime (strict after)
- **Status:** Fixed ✅

---

## FINDING-040: No Minimum Duration Between Lock and End Time

- **Severity:** Medium
- **Category:** Smart Contract / Validation
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:262-272`
- **Description:** `createContest()` only validates `lockTime <= endTime` but doesn't enforce a minimum gap. A contest could have lockTime and endTime 1 second apart — insufficient time for scoring.
- **Recommended Fix:** `require(endTime >= lockTime + 1 days)`.
- **Commit:** audit: fix FINDING-040 — MIN_CONTEST_DURATION = 1 hour
- **Status:** Fixed ✅

---

## FINDING-041: Single-Step Ownership Transfer

- **Severity:** Medium
- **Category:** Smart Contract / Access Control
- **Phase:** 2C
- **File:** `contracts/src/CTDraftPrizedV2.sol:719-722` (all contracts)
- **Description:** Ownership transfer is single-step. If transferred to wrong address, ownership is permanently lost along with all admin capabilities.
- **Recommended Fix:** Use OpenZeppelin's `Ownable2Step` (propose → accept pattern).
- **Commit:** audit: fix FINDING-041 — pendingOwner + acceptOwnership pattern
- **Status:** Fixed ✅

---

## FINDING-042: Unbounded allPlayers Array DoS

- **Severity:** Medium
- **Category:** Smart Contract / Gas
- **Phase:** 2C
- **File:** `contracts/src/CTDraft.sol:79,127-148`, `CTDraftV2.sol:24-25,136`
- **Description:** `allPlayers` array grows without bound. `getAllPlayers()` reads from storage in a loop, which will exceed gas limits once enough users have entered.
- **Impact:** DoS on `getAllPlayers()`. Off-chain reads still work, but any on-chain function calling this will fail.
- **Recommended Fix:** Implement pagination or remove on-chain iteration.
- **Commit:** N/A — already paginated with offset/limit parameters
- **Status:** Mitigated ✅ (pagination already implemented in code)

---

## FINDING-043: ReputationEngine Division-by-Zero Risk

- **Severity:** Medium
- **Category:** Smart Contract / Math
- **Phase:** 2C
- **File:** `contracts/src/ReputationEngine.sol:246`
- **Description:** `_calculateMasteryScore()` divides by `totalPlayers` without checking for zero: `((totalPlayers - rep.draftRank) * 30) / totalPlayers`.
- **Impact:** Revert on division by zero if called before any players exist.
- **Recommended Fix:** Add `if (totalPlayers == 0) return 0;` guard.
- **Commit:** N/A — guard already exists at line 243: `if (totalPlayers > 0 && rep.draftRank > 0)`
- **Status:** Mitigated ✅ (guard already exists in code)

---

## FINDING-044: Treasury Allows Zero-Fee Distribution

- **Severity:** Medium
- **Category:** Smart Contract / Logic
- **Phase:** 2C
- **File:** `contracts/src/Treasury.sol:69-124`
- **Description:** `distributeMonthly()` doesn't check if `currentMonthFees == 0`. Calling it with zero fees wastes gas and resets the month counter without distributing anything.
- **Recommended Fix:** `if (currentMonthFees == 0) revert InsufficientFunds();`
- **Commit:** audit: fix FINDING-044 — require(currentMonthFees > 0)
- **Status:** Fixed ✅

---

## FINDING-045: QuestRewards Budget Can Exceed Contract Balance

- **Severity:** Medium
- **Category:** Smart Contract / Validation
- **Phase:** 2C
- **File:** `contracts/src/QuestRewards.sol:131-143`
- **Description:** `allocateMonthlyBudget()` allows setting budget up to `MONTHLY_BUDGET_CAP` without checking if the contract actually holds that much ETH. Users could vest rewards that can never be claimed.
- **Impact:** Phantom rewards — users see vested amounts but claims revert due to insufficient balance.
- **Recommended Fix:** `require(amount <= address(this).balance)`.
- **Commit:** audit: fix FINDING-045 — require(amount <= address(this).balance)
- **Status:** Fixed ✅

---

## OWASP Top 10 (2021) Assessment

| Category | Verdict | Key Findings |
|----------|---------|--------------|
| A01: Broken Access Control | **FAIL** | FINDING-004 (admin no auth), no user-level ownership checks |
| A02: Cryptographic Failures | **FAIL** | FINDING-006 (JWT in git), FINDING-028 (tokens unencrypted), FINDING-011 (no DB SSL) |
| A03: Injection | **PARTIAL** | FINDING-003 (SSRF), FINDING-027 (redirect param). SQL injection SAFE (Knex parameterized) |
| A04: Insecure Design | **FAIL** | FINDING-002 (TOCTOU), FINDING-021 (no CSRF), FINDING-031 (weak rate limits) |
| A05: Security Misconfiguration | **FAIL** | FINDING-020 (no CSP), FINDING-012 (ngrok CORS), FINDING-018 (console.log PII) |
| A06: Vulnerable Components | **PARTIAL** | FINDING-023/024/025/026 (dep vulns). Direct deps manageable |
| A07: Authentication Failures | **PARTIAL** | FINDING-007 (localStorage), FINDING-010 (no revocation), FINDING-015 (plaintext refresh) |
| A08: Data Integrity Failures | **PARTIAL** | No package pinning, HTTPS not enforced. No active exploit path |
| A09: Logging & Monitoring | **FAIL** | FINDING-029 (no audit trail), FINDING-018 (PII in logs), no alerting |
| A10: SSRF | **FAIL** | FINDING-003 (image proxy). Critical — immediate fix required |

---

## Summary Table

| # | Severity | Category | Short Description | Status |
|---|----------|----------|-------------------|--------|
| 001 | **Critical** | Architecture | Free leagues off-chain | Open |
| 002 | **Critical** | SOL Transactions | Race condition in prize claim | Fixed ✅ |
| 003 | **Critical** | SSRF | Image proxy unvalidated URL | Fixed ✅ |
| 004 | **Critical** | Authorization | Admin endpoints no role check | Fixed ✅ |
| 005 | Low | SOL Transactions | Simulated transfers (gated by NODE_ENV) | Accepted |
| 006 | **Critical** | Secrets | JWT secrets in git history | Deferred |
| 007 | High | Auth / Frontend | JWT in localStorage | Deferred |
| 008 | High | API / DoS | No rate limit on prize claim | Fixed ✅ |
| 009 | High | Auth | No rate limit on token refresh | Fixed ✅ |
| 010 | High | Auth | Stolen tokens valid post-logout | Deferred |
| 011 | High | Database | No SSL on DB connection | Fixed ✅ |
| 012 | High | CORS | ngrok allowed in production | Fixed ✅ |
| 013 | High | Infrastructure | No HTTPS enforcement | Fixed ✅ |
| 014 | High | SOL Transactions | Contest finalization race condition | Fixed ✅ |
| 015 | High | Auth / Database | Refresh tokens stored plaintext | Fixed ✅ |
| 016 | Medium | Auth | JWT algorithm not pinned | Fixed ✅ |
| 017 | Medium | Input Validation | Duplicate influencers in teams | Fixed ✅ |
| 018 | Medium | Info Disclosure | Console.log leaks PII | Fixed ✅ |
| 019 | Medium | SOL Transactions | 'confirmed' not 'finalized' commitment | Fixed ✅ |
| 020 | Medium | Headers | Helmet CSP not configured | Fixed ✅ |
| 021 | Medium | Frontend | Missing CSRF protection | Deferred |
| 022 | Medium | Input Validation | Unvalidated limit/offset params | Fixed ✅ |
| 023 | High | Dependencies | jws HMAC signature bypass | Fixed ✅ |
| 024 | High | Dependencies | axios DoS via __proto__ | Fixed ✅ |
| 025 | High | Dependencies | react-router XSS + CSRF | Fixed ✅ |
| 026 | Medium | Dependencies | Multiple transitive vulns | Deferred |
| 027 | Medium | Injection | Twitter OAuth redirect unsanitized error param | Fixed ✅ |
| 028 | Medium | Cryptographic | Twitter access tokens unencrypted in DB | Fixed ✅ |
| 029 | Medium | Logging | No audit trail for admin/sensitive actions | Fixed ✅ |
| 030 | Medium | Auth | Expired sessions never garbage-collected | Fixed ✅ |
| 031 | Medium | Auth | Auth rate limiter too lenient (50-100/15min) | Fixed ✅ |
| 032 | **Critical** | Smart Contract | Double finalization — contest can be finalized twice | Fixed ✅ |
| 033 | **Critical** | Smart Contract | Reentrancy on prize claims (flag set after transfer) | Fixed ✅ |
| 034 | **Critical** | Smart Contract | Rake calculation integer arithmetic bug | Fixed ✅ |
| 035 | High | Smart Contract | No duplicate validation in rankings array | Fixed ✅ |
| 036 | High | Smart Contract | emergencyWithdraw() = owner rug-pull vector | Fixed ✅ |
| 037 | High | Smart Contract | Unsafe .transfer() in QuestRewards/DailyGauntlet/Arena | Fixed ✅ |
| 038 | High | Smart Contract | Prize pool underflow on small contests (<10 players) | Fixed ✅ |
| 039 | High | Smart Contract | Contest can be finalized before end time | Fixed ✅ |
| 040 | Medium | Smart Contract | No min duration between lock and end time | Fixed ✅ |
| 041 | Medium | Smart Contract | Single-step ownership transfer (no 2-step) | Fixed ✅ |
| 042 | Medium | Smart Contract | Unbounded allPlayers array DoS in CTDraft/V2 | Mitigated ✅ |
| 043 | Medium | Smart Contract | ReputationEngine division-by-zero risk | Mitigated ✅ |
| 044 | Medium | Smart Contract | Treasury distributeMonthly allows 0-fee distribution | Fixed ✅ |
| 045 | Medium | Smart Contract | QuestRewards budget allocation can exceed balance | Fixed ✅ |

**Totals: 37 Fixed, 1 Accepted, 2 Mitigated, 5 Deferred out of 45 findings**

### Deferred Items (require architectural changes or operational procedures)
| # | Severity | Why Deferred |
|---|----------|-------------|
| 001 | Critical | Free leagues on-chain — requires new smart contract / program |
| 006 | Critical | JWT secrets in git history — operational: rotate secrets, consider BFG Repo-Cleaner |
| 007 | High | JWT in localStorage — requires full auth refactor to httpOnly cookies |
| 010 | High | Token revocation — requires Redis or DB-backed blacklist |
| 021 | Medium | CSRF protection — depends on cookie-based auth migration (FINDING-007) |
| 026 | Medium | Transitive dep vulns — limited control, upstream updates needed |
