# Security Review Executive Summary
**Cookie/CSRF Authentication Migration**

**Date:** 2026-03-01 | **Risk Level:** 🔴 **CRITICAL**

---

## Critical Issues (Must Fix Before Production)

### 1. Refresh Token Path Restriction Breaks Cross-Domain Access
**File:** `/backend/src/api/auth.ts:33-39`
**Issue:** `path: '/api/auth/refresh'` only sends cookie to `/api/auth/refresh` endpoint. In production with multiple servers/domains, path restrictions become fragile.
**Fix:** Change to `path: '/'` and rely on middleware logic to handle token usage.

### 2. Race Condition in Refresh Token Deduplication
**File:** `/frontend/src/lib/apiClient.ts:36-70`
**Issue:** Multiple concurrent 401 errors can trigger multiple refresh attempts simultaneously. The dedup pattern using `let refreshPromise` is non-atomic and can result in requests retrying with mismatched CSRF tokens.
**Fix:** Redesign to use a request queue or better Promise handling. Ensure CSRF token is synchronized across all pending requests.

### 3. CSRF Token Exposed in Response Body
**File:** `/backend/src/api/auth.ts:329-330`
**Issue:** Login response includes `csrfToken` in JSON body. The token is already in the non-httpOnly cookie; returning it in the body is redundant and leaks it to logs/telemetry.
**Fix:** Remove from response body. Client reads from cookie via JavaScript.

### 4. Unclear CSRF Exemption Logic
**File:** `/backend/src/middleware/csrf.ts:20-28`
**Issue:** Middleware checks for `accessToken` cookie presence to decide whether to enforce CSRF. This is backwards — should always enforce on state-changing requests, with explicit exemptions only for auth endpoints.
**Fix:** Add `CSRF_EXEMPT_ROUTES` array and exempt only: `/api/auth/verify`, `/api/auth/refresh`, `/api/auth/logout`.

### 5. Token Authentication Accepts Unsafe Fallback
**File:** `/backend/src/middleware/auth.ts:18`
**Issue:** Middleware accepts access token from both httpOnly cookie AND Authorization header. Using headers bypasses CSRF protection and is less secure. Should be one or the other.
**Fix:** For web browsers, use cookies only. If supporting mobile/API clients, use separate `authenticateApi()` middleware with Authorization headers (CSRF-exempt).

---

## High-Priority Issues (Strongly Recommend)

### 6. Logout Deletes All Sessions
**File:** `/backend/src/api/auth.ts:478`
**Issue:** User logout deletes ALL sessions across all devices. Multi-device users are logged out everywhere. Should only logout current session.
**Fix:** Use session ID from cookie; delete only that session.

### 7. No Refresh Token Rotation
**File:** `/backend/src/utils/auth.ts`
**Issue:** Refresh token is issued once and reused for 30 days. If token leaks, attacker has 30 days of access. Industry standard is to rotate token on each use.
**Fix:** Issue new refresh token on each successful refresh; invalidate the old one.

### 8. Infinite Retry Loop Without Backoff
**File:** `/frontend/src/hooks/usePrivyAuth.ts:71-76`
**Issue:** Network errors trigger retries every 4 seconds indefinitely, with no exponential backoff and no maximum retry limit. Drains battery on mobile.
**Fix:** Implement exponential backoff (1s → 2s → 4s → 8s, capped at 30s) and max 3 retries.

---

## Medium-Priority Issues (Should Fix)

### 9. CSRF Token Comparison Not Constant-Time
**File:** `/backend/src/middleware/csrf.ts:33`
**Issue:** Using `!==` for token comparison. While timing attacks are impractical on 64-char hex strings, security best practice is constant-time comparison.
**Fix:** Use `crypto.timingSafeEqual(Buffer.from(tokenA), Buffer.from(tokenB))`.

### 10. No Logging on Token Validation Failure
**File:** `/backend/src/middleware/auth.ts:25-29`
**Issue:** Silent failures make it impossible to detect token tampering, forgery, or key compromise attacks.
**Fix:** Add warning log with IP, user-agent, token type on validation failure.

### 11. CSRF Token Parsing Lacks Validation
**File:** `/frontend/src/lib/apiClient.ts:13-16`
**Issue:** Frontend reads CSRF cookie without validating format. Could send malformed token to backend.
**Fix:** Validate format is 64 hex characters before sending.

### 12. Window Reload After Login
**File:** `/frontend/src/hooks/usePrivyAuth.ts:56`
**Issue:** Hard page reload after login loses React state and causes double page-view analytics.
**Fix:** Remove reload; let React state changes trigger re-renders.

---

## Why This Matters

**This is production code handling real money (SOL cryptocurrency).** The issues above could result in:
- **Account takeover:** Refresh token compromise (30-day window)
- **CSRF attacks:** Cross-site transactions (joining contests, spending SOL)
- **Session fixation:** Attacker logs user out, injects their own session
- **Denial of service:** Infinite retries crash mobile browsers
- **Data leaks:** Tokens in logs, errors, responses

---

## Immediate Actions

1. **Implement fixes 1-5** (CRITICAL) before any production deployment
2. **Implement fixes 6-8** (HIGH) before public launch
3. **Add fixes 9-12** (MEDIUM) in next sprint
4. **Run load testing** on refresh flow with concurrent requests
5. **Penetration test** CSRF protection and token handling
6. **Code review** by security team before merge

---

## Timeline

- **Today:** Apply CRITICAL fixes to `csrf.ts`, `auth.ts`, `apiClient.ts`, `usePrivyAuth.ts`
- **Tomorrow:** Implement HIGH fixes + comprehensive testing
- **Before launch:** Penetration test + security code review
- **Post-launch:** Monitor logs for token validation failures, CSRF mismatches

---

## Questions?

Refer to `/Users/mujeeb/foresight/SECURITY_REVIEW_CSRF_AUTH.md` for detailed analysis of each issue, attack scenarios, and code recommendations.
