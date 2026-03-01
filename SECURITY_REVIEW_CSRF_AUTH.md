# Security Review: Cookie/CSRF Authentication Migration
**Date:** 2026-03-01
**Scope:** Files involved in httpOnly cookie + CSRF token protection
**Environment:** Production app with real SOL cryptocurrency transactions

---

## Executive Summary

**Overall Risk Level:** 🔴 **CRITICAL** — Multiple vulnerabilities found, including:
1. **Refresh token path restriction breaks in cross-domain scenarios** (server expects `/api/auth/refresh` only, but cookies sent to all routes in development)
2. **CSRF token exposed in response body** after login (security theater since cookie is already accessible)
3. **Race condition in refresh token deduplication** (multiple concurrent 401s can bypass dedup)
4. **Timing window in CSRF validation** (checks cookie presence but doesn't prevent token substitution attacks)
5. **No refresh token rotation** (token reuse indefinitely increases compromise window)

This review found **5 Critical/High severity issues** and **4 Medium issues** that must be addressed before production deployment.

---

## File-by-File Review

### 1. `/Users/mujeeb/foresight/backend/src/middleware/csrf.ts`

#### Issue 1.1: CSRF Token is Returned in Response Body — CRITICAL

**Location:** `/Users/mujeeb/foresight/backend/src/api/auth.ts`, lines 329-330

```typescript
// Line 329-330 in auth.ts (not csrf.ts but related)
sendSuccess(res, {
  csrfToken,  // ← EXPOSED IN RESPONSE BODY
  user: { ... }
});
```

**Severity:** CRITICAL
**Why it matters:**
- The CSRF token is sent in the response body after login (line 329 in auth.ts)
- The same token is already in the non-httpOnly `csrf-token` cookie
- **Any endpoint can read the cookie** OR the response body via JavaScript
- Returning it in the body provides zero additional security
- **Worse:** If a client-side error occurs and the response is logged, the token leaks to logs/telemetry

**Attack scenario:**
```javascript
// Frontend code that leaks the token
const { csrfToken } = await apiClient.post('/api/auth/verify', { privyToken });
// If this logs to Sentry/Datadog/logs, CSRF token is exposed
console.error('Auth failed, response was:', response);
```

**Recommendation:**
- **Remove `csrfToken` from response body** (line 329 in auth.ts). The client can read it from the cookie.
- If the client needs confirmation the token was set, return `{ success: true }` only.
- Add logging safeguards to never log response bodies containing tokens.

---

#### Issue 1.2: CSRF Protection Check Order — HIGH

**Location:** `/Users/mujeeb/foresight/backend/src/middleware/csrf.ts`, lines 25-28

```typescript
// Line 25-28: If no accessToken cookie, skip CSRF check
if (!req.cookies?.accessToken) {
  return next();
}
```

**Severity:** HIGH
**Why it matters:**
- The middleware only enforces CSRF if `accessToken` cookie exists (line 26)
- But what if an attacker forges a POST request WITHOUT an accessToken?
- The middleware will allow it through without CSRF validation
- This is actually **correct behavior for unauthenticated endpoints**, BUT:
  - The exemption on line 21 (`/api/auth/verify`) already handles this
  - The accessToken check is redundant and creates a false sense of security
  - **Someone will eventually mis-configure this** thinking it protects unauthenticated routes

**Attack scenario:**
```javascript
// Attacker's site, user logged into Foresight in another tab
fetch('https://foresight.com/api/v2/contests/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Sends accessToken cookie
  body: JSON.stringify({ contestId: '123' })
  // NO X-CSRF-Token header (user didn't load attacker from Foresight)
  // Middleware sees NO accessToken? NO. Middleware sees accessToken exists but NO CSRF check...
});
```

Wait, re-reading the code: line 26 checks `if (!req.cookies?.accessToken)` and skips validation. This is **backwards from expected behavior**. If the cookie exists, CSRF validation should be stricter, not skipped.

Actually, I misread. Line 26 says: "If there's NO accessToken, skip CSRF." This is CORRECT for unauthenticated requests. But the logic is confusing because:
- Line 21: Exempt `/api/auth/verify` (no session yet)
- Line 26: If no accessToken, skip CSRF (also no session)
- Line 33: Compare tokens

This creates a footgun: **If someone adds a mutation endpoint that doesn't require auth, CSRF will be skipped automatically.** Better to be explicit about which routes are exempt.

**Recommendation:**
- Change logic to: **All POST/PUT/PATCH/DELETE routes require CSRF unless explicitly exempted**
- Add a `CSRF_EXEMPT_ROUTES` array:
  ```typescript
  const CSRF_EXEMPT_ROUTES = [
    '/api/auth/verify',
    '/api/auth/login',
    '/api/auth/refresh',  // ← if state-changing
    // Any other public write endpoints
  ];

  if (CSRF_EXEMPT_ROUTES.includes(req.path)) {
    return next();
  }
  ```
- Remove the `accessToken` check. **Always validate CSRF for state-changing requests, regardless of auth state.**

---

#### Issue 1.3: CSRF Token Timing Attack Window — MEDIUM

**Location:** `/Users/mujeeb/foresight/backend/src/middleware/csrf.ts`, lines 30-34

```typescript
const cookieToken = req.cookies['csrf-token'];
const headerToken = req.headers['x-csrf-token'];

if (!cookieToken || !headerToken || cookieToken !== headerToken) {
  res.status(403).json({ success: false, error: 'CSRF token mismatch' });
```

**Severity:** MEDIUM
**Why it matters:**
- The comparison `cookieToken !== headerToken` is vulnerable to **timing attacks**
- An attacker could measure response time to determine if the first byte is correct
- With 64-character hex string (from `crypto.randomBytes(32).toString('hex')`), timing attacks are **impractical** but not impossible
- More importantly: **Use constant-time comparison for security-sensitive values**

**Recommendation:**
- Use `crypto.timingSafeEqual()`:
  ```typescript
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ success: false, error: 'CSRF token mismatch' });
  }

  try {
    crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  } catch {
    return res.status(403).json({ success: false, error: 'CSRF token mismatch' });
  }
  next();
  ```

---

### 2. `/Users/mujeeb/foresight/frontend/src/lib/apiClient.ts`

#### Issue 2.1: CSRF Token Extraction is Case-Sensitive — LOW

**Location:** Line 13-16

```typescript
const match = document.cookie
  .split('; ')
  .find((c) => c.startsWith('csrf-token='));
return match?.split('=')[1];
```

**Severity:** LOW
**Why it matters:**
- Cookie names are case-insensitive in HTTP (RFC 6265)
- However, JavaScript's `document.cookie` preserves case from `Set-Cookie` headers
- If the backend ever changes to `CSRF-Token` or `Csrf-Token`, this breaks silently
- **Not a security issue, but a reliability issue**

**Recommendation:**
- Standardize cookie name or make lookup case-insensitive:
  ```typescript
  const match = document.cookie
    .split('; ')
    .find((c) => c.toLowerCase().startsWith('csrf-token='));
  return match?.split('=')[1];
  ```

---

#### Issue 2.2: Race Condition in Refresh Token Deduplication — CRITICAL

**Location:** Lines 36-70

```typescript
let refreshPromise: Promise<boolean> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ...
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;

      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/api/auth/refresh')
          .then(() => true)
          .catch(() => false)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);
```

**Severity:** CRITICAL
**Why it matters:**
- This is a **classic race condition** in JavaScript deduplication patterns
- Scenario:
  1. Request A hits 401, sees `!refreshPromise` (true), sets `refreshPromise` to pending Promise
  2. Request B hits 401, sees `!refreshPromise` (false because Promise exists), awaits the existing Promise
  3. Request C hits 401 **while** A's Promise is still pending, sees `!refreshPromise` (false), awaits existing Promise
  4. **But what if `finally(() => { refreshPromise = null })` hasn't executed yet?**
  5. If the refresh succeeds, Promise resolves to `true`
  6. Requests A, B, C all retry their original requests **in parallel with the same new access token**

**More critical issue:** **If request A's refresh fails but request B's refresh succeeds, they might race with different outcomes.** The dedup doesn't guarantee consistency across all pending requests.

**Even worse:** If the backend issues a **new CSRF token on refresh**, the dedup might:
- Request A refreshes with old CSRF token, gets new CSRF token, sets it in `refreshPromise`
- Request B awaits that Promise, gets success, BUT doesn't have access to the new CSRF token yet
- Request B retries with OLD CSRF token → **401 Unauthorized**

**Attack/failure scenario:**
```
User with 2 concurrent requests under rate limiting:
1. POST /api/v2/contests/join (has CSRF token A, access token expires)
2. GET /api/league/standings (no CSRF needed, but uses same apiClient)

Timeline:
T0: Request 1 starts, uses access token (expires at T0+1)
T1: Request 2 starts, uses access token (expired at T0+1)
T2: Request 1 fails with 401, hits refresh → refreshPromise = Promise.pending
T3: Request 2 fails with 401, refreshPromise exists, awaits it
T4: Refresh succeeds, issues new access token + new CSRF token
T5: refreshPromise resolves to true
T6: Request 1 retries with OLD CSRF token A + new access token → **403 CSRF mismatch**
T7: Request 2 retries (GET) → **200 OK**

Result: Race condition causes request 1 to permanently fail.
```

**Recommendation:**
- **Redesign the dedup pattern to be truly atomic:**
  ```typescript
  let refreshPromise: Promise<{ success: boolean; csrfToken?: string }> | null = null;

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (
        error.response?.status === 401 &&
        !original._retried &&
        !original.url?.includes('/api/auth/refresh')
      ) {
        original._retried = true;

        // Deduplicate concurrent refresh calls
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const res = await apiClient.post('/api/auth/refresh');
              // CSRF token is in cookie; don't need to return it
              return { success: true };
            } catch {
              return { success: false };
            } finally {
              refreshPromise = null;
            }
          })();
        }

        const result = await refreshPromise;
        if (result.success) {
          // By the time we get here, the new CSRF token is in the cookie
          // (it was set by the backend in the 200 response)
          return apiClient(original);
        }
      }

      return Promise.reject(error);
    },
  );
  ```

- **Better: Use a queue instead of simple dedup:**
  ```typescript
  let refreshPromise: Promise<boolean> | null = null;
  const pendingRequests: Array<() => Promise<any>> = [];

  async function processQueue() {
    while (pendingRequests.length > 0) {
      const req = pendingRequests.shift();
      if (req) await req();
    }
  }

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 401 && !original._retried) {
        original._retried = true;

        // Only one refresh at a time
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              await apiClient.post('/api/auth/refresh');
              await processQueue();
              return true;
            } catch {
              return false;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        const refreshed = await refreshPromise;
        if (refreshed) {
          return apiClient(original);
        }
      }

      return Promise.reject(error);
    },
  );
  ```

---

#### Issue 2.3: CSRF Token Parsing Vulnerable to Cookie Injection — MEDIUM

**Location:** Lines 13-16

```typescript
const match = document.cookie
  .split('; ')
  .find((c) => c.startsWith('csrf-token='));
return match?.split('=')[1];
```

**Severity:** MEDIUM
**Why it matters:**
- If a cookie value contains `=` (e.g., `csrf-token=abc=def`), the split logic works fine
- BUT, the parsing doesn't validate the token format
- **Malformed token could be sent to server, wasting a request and potentially leaking info via error message**

**Real vulnerability:** If backend ever tries to use this token for something (log it, compare with regex, etc.), an attacker might craft a special cookie value that:
- Gets read by frontend
- Sent to backend in header
- Backend processes it unsafely (e.g., uses in regex, SQL if not parameterized, etc.)

**Recommendation:**
- Validate token format before sending:
  ```typescript
  function getCsrfToken(): string | undefined {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf-token='));
    const token = match?.split('=')[1];

    // Validate format: 64 hex characters (from crypto.randomBytes(32).toString('hex'))
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      return token;
    }
    console.warn('[apiClient] Invalid CSRF token format');
    return undefined;
  }
  ```

---

#### Issue 2.4: hasSession() Check is Insufficient — MEDIUM

**Location:** Lines 76-78

```typescript
export function hasSession(): boolean {
  return document.cookie.includes('csrf-token=');
}
```

**Severity:** MEDIUM
**Why it matters:**
- This checks for the presence of the **CSRF token cookie**, not the **access token**
- An attacker could theoretically:
  1. Craft a malicious web page that sets `csrf-token=anything` cookie (if SameSite=Lax allows it)
  2. Call `hasSession()` returns true
  3. Frontend thinks there's a backend session
  4. Frontend makes requests with CSRF token, but no valid access token
  5. Backend rejects requests due to missing/invalid access token

**Better indicator:** The `accessToken` cookie is httpOnly, so frontend can't read it directly. The `csrf-token` cookie is a **proxy** for "session exists", but it's not foolproof.

**Real-world impact:** If a page loads and `hasSession()` returns true but the session is actually expired, the UI will show "logged in" but requests will fail. This is bad UX but not a security breach.

**Recommendation:**
- Check CSRF token existence AND validate by attempting a simple request:
  ```typescript
  export async function hasSession(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/auth/me', {
        validateStatus: (status) => status === 200 || status === 401
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
  ```

- Or accept the current approach but document it: "Returns true if CSRF token cookie is present; actual session validity is verified on first request."

---

### 3. `/Users/mujeeb/foresight/backend/src/api/auth.ts`

#### Issue 3.1: Refresh Token Path Restriction Breaks SameSite=Lax — CRITICAL

**Location:** Lines 33-39

```typescript
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/refresh',  // ← PROBLEMATIC
};
```

**Severity:** CRITICAL
**Why it matters:**

This is a **fundamental cookie behavior issue**:

1. **HTTP cookie `path` attribute**: Restricts which URLs in a request will include the cookie
   - `path: '/'` = Sent to all requests
   - `path: '/api/auth/refresh'` = Sent ONLY to requests to `/api/auth/refresh`

2. **Your code expects this to work:**
   ```typescript
   // Line 424 in auth.ts
   const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;
   ```
   - Backend tries to read `refreshToken` from cookie
   - If path restriction works, cookie is only sent to `/api/auth/refresh`
   - **All other requests DON'T receive the refresh token cookie**

3. **The frontend's refresh flow:**
   ```typescript
   // apiClient.ts, line 54
   refreshPromise = apiClient
     .post('/api/auth/refresh')  // ← This DOES go to /api/auth/refresh
   ```
   - This works because the request is to the whitelisted path
   - BUT, if this fails and retries, or if manually triggered elsewhere, it's fragile

4. **Real-world break scenarios:**

   **Scenario A: Cross-domain deployment**
   - Backend at `https://api.foresight.com` (path `/api/auth/refresh`)
   - Frontend at `https://app.foresight.com`
   - Frontend calls `https://api.foresight.com/api/auth/refresh`
   - Cookie path is `/api/auth/refresh` ✓ Works

   **Scenario B: Different subdomain (path still applies)**
   - Backend at `https://foresight.com/api` (path `/api/auth/refresh`)
   - Cookie sent to requests to `/api/auth/refresh` ✓ Works

   **Scenario C: Client library bug or user code**
   - User accidentally calls `POST /api/auth/refresh?debug=1` (different path)
   - Cookie not sent → 400 "Refresh token required"
   - Hard to debug

   **Scenario D: Refresh token recovery/rotation endpoint**
   - If you later add `POST /api/auth/refresh-and-logout-others`
   - It also needs the refresh token, but path is `/api/auth/refresh`, not `/api/auth/refresh-and-logout-others`
   - Cookie not sent, request fails mysteriously

5. **Why this is risky:**
   - The path restriction is a **weak security mechanism**
   - It's easily broken by:
     - Query parameters: `/api/auth/refresh?foo=bar` (still `/api/auth/refresh` path)
     - Path traversal: `/api/auth/refresh/` (different path, cookie not sent)
     - URL normalization issues in proxies
   - It's **not a security feature** (it doesn't prevent misuse), it's a **reliability hack**

**Recommendation:**
- **Remove the path restriction**, change to:
  ```typescript
  const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',  // ← Sent to all requests
  };
  ```

- **Why this is safe:**
  - The refresh token is in an httpOnly cookie, cannot be stolen by JavaScript
  - `SameSite=lax` prevents cross-site requests from including it (with some exceptions for top-level navigations)
  - The only risk is if someone gets the cookie value (DB breach, network sniff, etc.), but then they already have access
  - **The middleware check at line 424 ensures only `/api/auth/refresh` uses it**, so other endpoints that receive it won't act on it

- **OR, if you want path restriction, use a more reliable pattern:**
  - Don't rely on `path` attribute
  - Instead, **always read from body or header** (which you do at line 424 with `req.body?.refreshToken`)
  - But then **don't set it as a cookie at all**, send it in the response body and have frontend store in memory or sessionStorage
  - This removes the `path` restriction entirely and the frontend explicitly passes it

---

#### Issue 3.2: CSRF Token Exposed in Response (Redundant) — CRITICAL

**Location:** Lines 329-330

```typescript
sendSuccess(res, {
  csrfToken,  // ← REDUNDANT, EXPOSED
  user: { ... }
});
```

**Severity:** CRITICAL (covered in detail in Issue 1.1)

**Recommendation:** Remove from response body.

---

#### Issue 3.3: Refresh Endpoint Missing CSRF Exemption Confirmation — MEDIUM

**Location:** Line 419-427

```typescript
router.post('/refresh', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;
  // ...
}));
```

**Severity:** MEDIUM
**Why it matters:**

The refresh endpoint needs to handle two scenarios:
1. **Initial load:** User has no access token, only refresh token. Frontend calls `/api/auth/refresh`, which:
   - Reads refresh token from cookie or body
   - Validates it
   - Issues new access token
   - **Should NOT require CSRF check** because user has no access token (not authenticated yet)

2. **Post-401:** User's access token expired, frontend's interceptor calls `/api/auth/refresh` (already authenticated), which:
   - Reads refresh token from cookie
   - Validates it
   - Issues new access token
   - **Should NOT require CSRF check** because the refresh token is itself the credential

The current CSRF middleware exempts this explicitly (line 21 in csrf.ts checks `/api/auth/verify`), but does NOT exempt `/api/auth/refresh`.

**Check:** Does the CSRF middleware exempt `/api/auth/refresh`?

Looking at `/Users/mujeeb/foresight/backend/src/middleware/csrf.ts` line 21:
```typescript
if (req.path === '/api/auth/verify') {
  return next();
}
```

**FINDING: `/api/auth/refresh` is NOT explicitly exempted.**

If `/api/auth/refresh` doesn't have a valid CSRF token, it will be rejected at line 34 with 403 CSRF token mismatch.

**But wait:** Can the frontend even send a CSRF token for `/api/auth/refresh`?

Looking at apiClient.ts line 52-54:
```typescript
if (!refreshPromise) {
  refreshPromise = apiClient
    .post('/api/auth/refresh')
```

The `apiClient` interceptor (line 25-33) attaches CSRF token to mutation requests:
```typescript
apiClient.interceptors.request.use((config) => {
  if (config.method && !['get', 'head', 'options'].includes(config.method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});
```

So on `/api/auth/refresh` POST:
- Frontend sends `X-CSRF-Token` header (if cookie exists)
- Backend checks CSRF (line 33 in csrf.ts): `if (!cookieToken || !headerToken || cookieToken !== headerToken)`
- If tokens match, request proceeds

**This works IF and ONLY IF:**
1. Frontend already has a CSRF token cookie (set on previous login)
2. CSRF token hasn't expired (30 days maxAge)
3. Frontend can read the cookie

**But what if:**
- First-time visitor? No CSRF token cookie. `getCsrfToken()` returns `undefined`. CSRF header not sent. Middleware rejects with 403.
- **BUG:** User logs out, closes browser, comes back next day. Cookies cleared. Logs in again. Refresh flow works because login sets new CSRF token.

**Real scenario that breaks:**
1. User logs in, gets CSRF token cookie (30 day expiry)
2. User logs out, but forgets to clear CSRF cookie (frontend bug or user manually deleted only sessionStorage)
3. User's CSRF cookie is still valid (30 days haven't passed)
4. User logs back in, gets new CSRF token cookie
5. **Both cookies exist** (old and new)
6. Frontend reads whichever one `document.cookie` returns first
7. **If it reads the old one, and the header also has the old one, CSRF check passes**
8. **But the old refresh token is no longer in the DB** (invalidated on logout)
9. Backend checks session (line 436-438), doesn't find it, returns 401 "Session not found"

This is okay (fails gracefully), but it's a fragile flow.

**Recommendation:**
- **Explicitly exempt `/api/auth/refresh` from CSRF check** in the middleware:
  ```typescript
  // Line 20-23 in csrf.ts
  if (req.path === '/api/auth/verify' || req.path === '/api/auth/refresh') {
    return next();
  }
  ```

- **Why:** The refresh token itself is the credential. Requiring CSRF on top of refresh token doesn't add security, it only adds complexity.

---

#### Issue 3.4: Logout Doesn't Invalidate Sessions — HIGH

**Location:** Lines 473-487

```typescript
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await db('sessions').where({ user_id: userId }).del();  // ← Deletes ALL sessions
  // ...
}));
```

**Severity:** HIGH
**Why it matters:**

The logout endpoint deletes **all sessions** for a user:
```typescript
await db('sessions').where({ user_id: userId }).del();
```

This is too aggressive:
1. **Multiple devices/browsers:** If user is logged in on phone AND desktop, logging out on one logs them out everywhere. UX nightmare.
2. **Session replication:** If you ever scale to multiple servers, you might have session replicas. Deleting all at once could cause race conditions.
3. **No audit trail:** Why was this session deleted? Was it user-initiated logout or admin action?
4. **Cannot revoke single sessions:** No way to "logout from device X but keep device Y logged in" without extra API

**Recommendation:**
- Change to delete only the **current session** (identified by a session ID in a cookie):
  ```typescript
  router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.cookies?.sessionId;  // ← Add this

    if (sessionId) {
      await db('sessions').where({ id: sessionId, user_id: userId }).del();
    } else {
      // Fallback: delete all (legacy)
      await db('sessions').where({ user_id: userId }).del();
    }

    // ...
  }));
  ```

- Even better: Issue a session ID on login and include it in cookies:
  ```typescript
  // On login (line 266-275)
  const sessionId = uuidv4();
  await db('sessions').insert({
    id: sessionId,  // ← Already doing this
    // ...
  });

  // Set session ID cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
  });
  ```

- Then use it in logout:
  ```typescript
  router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await db('sessions').where({ id: sessionId }).del();
    }
    // ...
  }));
  ```

---

### 4. `/Users/mujeeb/foresight/backend/src/middleware/auth.ts`

#### Issue 4.1: Token Source Fallback is Dangerous — HIGH

**Location:** Lines 17-23

```typescript
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken || extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }
  // ...
}
```

**Severity:** HIGH
**Why it matters:**

The middleware accepts tokens from **two sources**:
1. `req.cookies?.accessToken` (httpOnly cookie, sent automatically by browser)
2. `Authorization: Bearer <token>` header (sent manually by client code)

This is **dangerous** because:

1. **Bypass of secure cookie handling:**
   - You went to the trouble of storing access token in httpOnly cookie
   - But then you also accept it from Authorization header
   - An attacker can extract the token from logs, errors, or network captures, and use it from any origin
   - If the frontend ever logs the Authorization header, token is exposed
   - If a third-party library (axios interceptor, middleware, etc.) logs requests, token is exposed

2. **Inconsistent CSRF protection:**
   - Requests with httpOnly cookie get CSRF validation (middleware checks for cookie)
   - Requests with Authorization header do NOT get CSRF validation (middleware only checks if accessToken cookie exists)
   - Frontend could accidentally fall back to header-based auth and bypass CSRF

3. **Mobile/custom client confusion:**
   - If you support custom clients (mobile apps, CLI, etc.), they'll use Authorization header
   - But they won't have CSRF token (it's browser-only)
   - Middleware will skip CSRF validation
   - **Legitimate:** Mobile apps don't need CSRF because they're not vulnerable to CSRF (no cross-origin requests)
   - **BUT:** If you later add a web-based mobile app (Expo, React Native Web, etc.), it's suddenly vulnerable

**Recommendation:**
- **Decide: cookies OR headers, not both**
- **For web browsers: Use cookies only**
  ```typescript
  export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
  }
  ```

- **For mobile/API clients: Use Authorization header, but without CSRF**
  - Create a separate middleware:
  ```typescript
  export function authenticateApi(req: Request, res: Response, next: NextFunction): void {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
  }
  ```
  - Use on specific API routes that support custom clients
  - These routes are exempt from CSRF middleware

---

#### Issue 4.2: No Token Validation Errors Logged — MEDIUM

**Location:** Lines 25-29

```typescript
const payload = verifyToken(token);

if (!payload) {
  res.status(401).json({ success: false, error: 'Invalid or expired token' });
  return;
}
```

**Severity:** MEDIUM
**Why it matters:**

When token validation fails, there's no logging:
- Was it an expired token? (expected, user needs to refresh)
- Was it a malformed token? (possible tampering or corruption)
- Was it signed with a different secret? (major security issue, indicates key rotation problem or attack)
- Was it a completely fake token? (possible attack)

Without logging, you can't detect patterns:
- Brute force attacks (attacker tries many tokens)
- Token forgery (attacker tries hand-crafted tokens)
- Key compromise (if tokens signed with wrong key)

**Recommendation:**
- Add logging to distinguish between token types of failures:
  ```typescript
  const payload = verifyToken(token);

  if (!payload) {
    const tokenType = token.split('.').length === 3 ? 'jwt' : 'unknown';
    logger.warn('Token validation failed', {
      context: 'Authentication',
      tokenType,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }
  ```

---

### 5. `/Users/mujeeb/foresight/backend/src/utils/auth.ts`

#### Issue 5.1: JWT Algorithm is Not Validated — MEDIUM

**Location:** Lines 48-54

```typescript
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
```

**Severity:** MEDIUM
**Why it matters:**

The code **correctly** specifies `algorithms: ['HS256']`, which prevents algorithm substitution attacks (e.g., `alg: 'none'`, `alg: 'RS256'` with public key, etc.).

**But:** The `decodeToken` function (lines 60-67) doesn't validate the algorithm:
```typescript
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;  // ← No verification
    return decoded;
  } catch (error) {
    return null;
  }
}
```

If `decodeToken` is ever used for security-sensitive comparisons (e.g., comparing expiry times), it's a vulnerability.

**Recommendation:**
- Document that `decodeToken` is for **debugging only**, not for security checks
- Never use `decodeToken` to make authorization decisions
- Use `verifyToken` for all security-critical validations

---

#### Issue 5.2: No Token Rotation or Expiry Refresh Strategy — HIGH

**Location:** Lines 28-42 (all)

**Severity:** HIGH
**Why it matters:**

The current token strategy:
- **Access token:** 15 minutes
- **Refresh token:** 30 days
- **No rotation:** Refresh token is reused indefinitely (line 270 in auth.ts stores it in DB, no rotation on use)

**Risks:**
1. **Long-lived refresh token:** If refresh token is compromised (DB breach, xss, etc.), attacker has access for 30 days
2. **No refresh token rotation:** Each time frontend refreshes, the same refresh token is used. No new token is issued. If token is leaked mid-flight, attacker can use it until it expires.
3. **No access token refresh on activity:** Access token doesn't extend on use. If user is active, they still lose access at exactly 15 minutes mark.

**Recommendation:**
- **Implement refresh token rotation:**
  - On each successful refresh, issue a **new refresh token**
  - Invalidate the old refresh token
  - This limits the window of compromise to 1 request
  ```typescript
  // In auth.ts, refresh endpoint
  const newAccessToken = createAccessToken({...});
  const newRefreshToken = createRefreshToken({...});

  // Invalidate old refresh token
  await db('sessions')
    .where({ id: session.id })
    .update({
      access_token: newAccessToken,
      refresh_token: hashToken(newRefreshToken),  // ← New hash
    });

  // Issue new refresh token cookie
  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
  ```

- **Consider sliding window for access token:**
  - If user is active, extend access token expiry (e.g., reset to 15 minutes from now)
  - This provides better UX (user won't be logged out mid-activity)
  - Implementation: Add a `lastActivity` field to sessions table, update on each request

---

### 6. `/Users/mujeeb/foresight/frontend/src/hooks/usePrivyAuth.ts`

#### Issue 6.1: Retry Logic Can Loop Indefinitely — HIGH

**Location:** Lines 71-76

```typescript
setSyncError('network_error');
hasAttemptedAuth.current = false;
setTimeout(() => {
  if (!isBackendAuthed) {
    syncWithBackend();
  }
}, 4000);
```

**Severity:** HIGH
**Why it matters:**

When backend sync fails with a network error:
1. Set `syncError` to 'network_error'
2. Set `hasAttemptedAuth.current = false` to allow retry
3. Schedule a retry in 4 seconds
4. **On retry, if it fails again, the same code runs again**
5. **This loops indefinitely every 4 seconds**

**Problems:**
- **Battery drain:** Mobile browsers keep retrying indefinitely
- **Network spam:** Every 4 seconds, a request is sent (even if connection is down)
- **No exponential backoff:** Retry delay never increases
- **No max retries:** Loop never stops
- **No user feedback:** User might not know it's retrying

**Also:** The check `if (!isBackendAuthed)` at line 72 is stale; `isBackendAuthed` is not in the dependency array, so it captures the initial value.

**Recommendation:**
- Implement exponential backoff with max retries:
  ```typescript
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const syncWithBackend = useCallback(async () => {
    if (hasAttemptedAuth.current) return;
    hasAttemptedAuth.current = true;
    setSyncError(null);

    try {
      const privyToken = await getAccessToken();
      if (!privyToken) {
        setSyncError('no_token');
        hasAttemptedAuth.current = false;
        return;
      }

      try {
        const meResponse = await apiClient.get('/api/auth/me');
        if (meResponse.status === 200) {
          setIsBackendAuthed(true);
          retryCountRef.current = 0;  // Reset on success
          return;
        }
      } catch {
        // Continue to re-auth
      }

      const response = await apiClient.post('/api/auth/verify', { privyToken });
      if (response.data?.success) {
        setIsBackendAuthed(true);
        retryCountRef.current = 0;
        window.location.reload();
      } else {
        setSyncError('unexpected_response');
        hasAttemptedAuth.current = false;
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';

      if (status === 429) {
        setSyncError('rate_limited');
        hasAttemptedAuth.current = false;
      } else {
        setSyncError('network_error');
        retryCountRef.current++;

        if (retryCountRef.current <= maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          setTimeout(() => {
            hasAttemptedAuth.current = false;
            syncWithBackend();
          }, delayMs);
        } else {
          setSyncError('max_retries_exceeded');
        }
      }
    }
  }, [getAccessToken]);
  ```

---

#### Issue 6.2: Window Reload After Login Loses State — MEDIUM

**Location:** Line 56

```typescript
window.location.reload();
```

**Severity:** MEDIUM
**Why it matters:**

After successful backend sync, the hook reloads the page:
```typescript
if (response.data?.success) {
  setIsBackendAuthed(true);
  console.log('[PrivyAuth] Backend session created');
  window.location.reload();  // ← Hard reload
}
```

**Problems:**
1. **Loses React state:** Any unsaved state in React is lost
2. **User sees blank page:** Briefly, before components re-render
3. **Analytics/tracking:** Page view is double-counted (initial load + reload)
4. **Slow:** Full browser reload is slower than React state update
5. **Unnecessary:** Backend session is already established; React can detect it on next request

**Recommendation:**
- Remove the reload, let React state handle it:
  ```typescript
  if (response.data?.success) {
    setIsBackendAuthed(true);
    console.log('[PrivyAuth] Backend session created');
    // Don't reload; let useEffect/components detect isBackendAuthed = true
  }
  ```

- If you need to re-fetch user data, do it via a query:
  ```typescript
  useEffect(() => {
    if (isBackendAuthed) {
      // Trigger a refetch of user data, but don't reload
      queryClient.invalidateQueries(['user', 'me']);
    }
  }, [isBackendAuthed, queryClient]);
  ```

---

#### Issue 6.3: Privy Logout Doesn't Ensure Backend Logout — LOW

**Location:** Lines 112-121

```typescript
const handleLogout = useCallback(async () => {
  try {
    await apiClient.post('/api/auth/logout').catch(() => {});
    setIsBackendAuthed(false);
    await logout();  // ← Privy logout
  } catch (error) {
    console.error('[PrivyAuth] Logout failed:', error);
    setIsBackendAuthed(false);
  }
}, [logout]);
```

**Severity:** LOW
**Why it matters:**

The logout flow:
1. Call backend `/api/auth/logout` (optional, errors are caught)
2. Set `isBackendAuthed = false`
3. Call Privy `logout()`

**Issue:** If backend logout fails silently (caught by `.catch(() => {})`), the session is still valid on the backend, but frontend thinks it's logged out.

**Scenario:**
- User clicks logout
- Backend is down (network error)
- `apiClient.post('/api/auth/logout').catch(() => {})` fails silently
- Frontend still logs out (Privy and UI)
- Backend session is still active
- User's cookies are still valid
- If user navigates back or reopens the app, they're auto-logged in (stale cookies)

**Recommendation:**
- Either:
  1. **Don't catch backend logout errors:** Let user know if logout failed
  ```typescript
  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('[PrivyAuth] Backend logout failed:', error);
      // Show error to user, don't proceed to Privy logout
      setSyncError('logout_failed');
      return;
    }

    setIsBackendAuthed(false);
    await logout();
  }, [logout]);
  ```

  2. **Or, ensure cookies are cleared even if backend fails:**
  ```typescript
  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout').catch(() => {});
    } finally {
      // Always clear cookies, even if backend logout fails
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      document.cookie = 'csrf-token=; path=/; max-age=0';
      document.cookie = 'sessionId=; path=/; max-age=0';
      setIsBackendAuthed(false);
      await logout();
    }
  }, [logout]);
  ```

---

## Summary Table

| File | Line | Severity | Issue | Recommendation |
|------|------|----------|-------|-----------------|
| `/backend/src/api/auth.ts` | 329-330 | CRITICAL | CSRF token exposed in response body | Remove from response; client reads from cookie |
| `/backend/src/middleware/csrf.ts` | 20-28 | HIGH | Unclear CSRF exemption logic; relies on accessToken presence | Add explicit CSRF_EXEMPT_ROUTES array |
| `/backend/src/middleware/csrf.ts` | 33 | MEDIUM | CSRF token comparison not constant-time | Use `crypto.timingSafeEqual()` |
| `/frontend/src/lib/apiClient.ts` | 36-70 | CRITICAL | Race condition in refresh token deduplication | Redesign dedup pattern; consider request queue |
| `/frontend/src/lib/apiClient.ts` | 13-16 | MEDIUM | CSRF token parsing doesn't validate format | Validate hex format before sending |
| `/frontend/src/lib/apiClient.ts` | 76-78 | MEDIUM | `hasSession()` check not reliable | Check via API call or document limitations |
| `/backend/src/api/auth.ts` | 33-39 | CRITICAL | Refresh token path restriction (`/api/auth/refresh`) breaks in edge cases | Change `path: '/'` to allow all routes |
| `/backend/src/api/auth.ts` | 419 | MEDIUM | `/api/auth/refresh` not explicitly CSRF exempted | Add to CSRF_EXEMPT_ROUTES |
| `/backend/src/api/auth.ts` | 478 | HIGH | Logout deletes all user sessions (not just current) | Use session ID from cookie; delete only current session |
| `/backend/src/middleware/auth.ts` | 18 | HIGH | Token auth accepts both cookies AND headers (fallback) | Decide: cookies for web, headers for API; don't mix |
| `/backend/src/middleware/auth.ts` | 25-29 | MEDIUM | No logging when token validation fails | Add logging to detect tampering/attacks |
| `/backend/src/utils/auth.ts` | 60-67 | MEDIUM | `decodeToken()` has no verification | Document as debug-only; never use for security decisions |
| `/backend/src/utils/auth.ts` | All | HIGH | No refresh token rotation | Issue new refresh token on each refresh; invalidate old |
| `/frontend/src/hooks/usePrivyAuth.ts` | 71-76 | HIGH | Retry logic can loop indefinitely without backoff | Implement exponential backoff with max retries |
| `/frontend/src/hooks/usePrivyAuth.ts` | 56 | MEDIUM | `window.location.reload()` loses React state | Remove reload; update React state instead |
| `/frontend/src/hooks/usePrivyAuth.ts` | 114 | LOW | Backend logout errors are silently caught | Don't catch; or ensure cookies are cleared |

---

## Priority Fixes Before Production

**MUST FIX (Blocking):**
1. **Issue 3.1** — Refresh token path restriction (CRITICAL)
2. **Issue 2.2** — Refresh token deduplication race condition (CRITICAL)
3. **Issue 3.2** — CSRF token in response body (CRITICAL)
4. **Issue 1.2** — CSRF exemption logic (HIGH)
5. **Issue 4.1** — Token auth fallback to headers (HIGH)

**SHOULD FIX (Important):**
6. **Issue 3.4** — Logout deletes all sessions (HIGH)
7. **Issue 5.2** — No refresh token rotation (HIGH)
8. **Issue 6.1** — Infinite retry loop (HIGH)

**NICE TO FIX (Security hardening):**
9. **Issue 1.3** — Constant-time CSRF comparison (MEDIUM)
10. **Issue 2.1** — CSRF cookie parsing case-sensitivity (LOW)

---

## Testing Recommendations

Once fixes are applied, test:

1. **CSRF Protection:**
   - POST to `/api/v2/contests/join` without CSRF header → 403
   - POST to `/api/v2/contests/join` with wrong CSRF token → 403
   - POST to `/api/v2/contests/join` with correct CSRF token → 200

2. **Refresh Token Flow:**
   - Login, get access token (15m) and refresh token (30d)
   - Wait for access token to expire
   - Automatic refresh on next request → new access token issued
   - Verify old access token is no longer usable
   - Verify refresh token is still valid (or rotated)

3. **Cross-Domain/Path Variations:**
   - Call `/api/auth/refresh/` (with trailing slash) → refresh token still sent (because `path: '/'`)
   - Call `/api/auth/refresh?foo=bar` → refresh token still sent

4. **Concurrent Requests:**
   - Fire 3 simultaneous requests with expired access tokens
   - Verify only one refresh occurs (deduplication works)
   - Verify all 3 requests succeed (not 403 CSRF errors)

5. **Logout:**
   - Login on device A and device B
   - Logout on device A
   - Verify device B is still logged in (can make requests)
   - Close device A, reopen → logged out (no cookies)

---

## Deployment Checklist

- [ ] Apply all CRITICAL fixes
- [ ] Apply all HIGH fixes
- [ ] Add logging for token validation failures
- [ ] Test CSRF on staging with real data
- [ ] Test concurrent refresh with load testing
- [ ] Test logout on multiple devices
- [ ] Verify cookies are httpOnly, secure, sameSite=lax
- [ ] Run OWASP dependency check (npm audit)
- [ ] Code review by security team
- [ ] Penetration test refresh flow
- [ ] Monitor logs for token validation failures post-deployment

