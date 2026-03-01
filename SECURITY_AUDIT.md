# Security Audit — Foresight

**Started:** 2026-03-01
**Branch:** `audit/security-review`
**Status:** In Progress

---

## Architecture Overview

Foresight is a fantasy sports platform for Crypto Twitter influencers with two blockchain integrations:

| Layer | Tech | Chain | Purpose |
|-------|------|-------|---------|
| Entry Fees (Prized) | Solidity / Foundry | Base Sepolia (EVM) | `CTDraftPrizedV2.sol` — collects ETH, manages prize pools |
| Prize Distribution | Node.js + `@solana/web3.js` | Solana Devnet | Server-side treasury wallet sends SOL to winners |
| Free Leagues | PostgreSQL only | None | **CRITICAL: No on-chain verification** |
| Auth | Privy + JWT | N/A | Email/Twitter/wallet login via Privy, JWT for sessions |
| Backend | Express + TypeScript | N/A | Port 3001, Knex ORM for PostgreSQL |
| Frontend | React 18 + Vite | N/A | Port 5173, TailwindCSS |

### Critical Env Vars

| Variable | Sensitivity | Location |
|----------|------------|----------|
| `TREASURY_SECRET_KEY_BASE64` | **CRITICAL** | `backend/.env` — Solana keypair |
| `PRIVY_APP_SECRET` | **CRITICAL** | `backend/.env` — Auth provider secret |
| `JWT_SECRET` | **CRITICAL** | `backend/.env` — Session signing |
| `DATABASE_URL` | **CRITICAL** | `backend/.env` — PostgreSQL connection |

---

## Phase Tracker

| Phase | Status | Findings | Notes |
|-------|--------|----------|-------|
| 0: Setup | ✅ Complete | 1 | Branch, docs, snapshots created |
| 1A: Dependency Scanning | ✅ Complete | 4 | 1 critical, 10+ high, 8+ moderate across packages |
| 1B: SAST (Static Analysis) | ✅ Complete | 1 | Semgrep: XSS in image proxy (server.ts:127) |
| 1C: Secret Scanning | ✅ Complete | 1 | JWT secrets found in git history (2 distinct values) |
| 1D: Smart Contract Audit | ⬜ Pending | 0 | Solidity contracts — needs TokenFi Shield / manual review |
| 1E: Solana Tx Security Scan | ✅ Complete | 4 | Race condition, simulated tx, commitment level, finalization |
| 1F: Frontend Security Scan | ✅ Complete | 3 | localStorage JWT, no CSRF, no dangerouslySetInnerHTML (good) |
| 2A: Auth & Authorization | ✅ Complete | 7 | Admin no role check, JWT algo, token storage, logout, refresh |
| 2B: SOL Transaction Security | ✅ Complete | 4 | TOCTOU race, simulated fallback, commitment, finalization race |
| 2C: EVM Contract Security | ⬜ Pending | 0 | CTDraftPrizedV2.sol deep review still needed |
| 2D: API Input Validation | ✅ Complete | 3 | Duplicate influencers, limit/offset, admin batch |
| 2E: Frontend Security | ✅ Complete | 3 | localStorage, CSRF, VITE_ prefix clean |
| 2F: Database Security | ✅ Complete | 2 | No SSL, plaintext refresh tokens. SQL injection: SAFE (Knex) |
| 2G: Infrastructure & Config | ✅ Complete | 5 | SSRF proxy, ngrok CORS, HTTPS, CSP, console.log PII |
| 3: OWASP Top 10 | ⬜ Not Started | 0 | A01-A10 systematic check |
| 4: Fix & Harden | ⬜ Not Started | 0 | All fixes with individual commits |
| 5: Verify & Document | ⬜ Not Started | 0 | Re-scan, smoke test, SECURITY.md |

---

## Findings Summary

**Totals: 6 Critical, 12 High, 8 Medium = 26 findings**

| # | Severity | Category | Short Description | Status |
|---|----------|----------|-------------------|--------|
| 001 | **Critical** | Architecture | Free leagues off-chain | Open |
| 002 | **Critical** | SOL Transactions | Race condition in prize claim (TOCTOU) | Open |
| 003 | **Critical** | SSRF | Image proxy unvalidated URL | Open |
| 004 | **Critical** | Authorization | Admin endpoints no role check | Open |
| 005 | **Critical** | SOL Transactions | Simulated transfers can trigger in prod | Open |
| 006 | **Critical** | Secrets | JWT secrets in git history | Open |
| 007 | High | Auth / Frontend | JWT in localStorage | Open |
| 008 | High | API / DoS | No rate limit on prize claim | Open |
| 009 | High | Auth | No rate limit on token refresh | Open |
| 010 | High | Auth | Stolen tokens valid post-logout (7 days) | Open |
| 011 | High | Database | No SSL on DB connection | Open |
| 012 | High | CORS | ngrok allowed in production | Open |
| 013 | High | Infrastructure | No HTTPS enforcement | Open |
| 014 | High | SOL Transactions | Contest finalization race condition | Open |
| 015 | High | Auth / Database | Refresh tokens stored plaintext | Open |
| 016 | Medium | Auth | JWT algorithm not pinned | Open |
| 017 | Medium | Input Validation | Duplicate influencers in teams | Open |
| 018 | Medium | Info Disclosure | Console.log leaks PII/wallets | Open |
| 019 | Medium | SOL Transactions | 'confirmed' not 'finalized' commitment | Open |
| 020 | Medium | Headers | Helmet CSP not configured | Open |
| 021 | Medium | Frontend | Missing CSRF protection | Open |
| 022 | Medium | Input Validation | Unvalidated limit/offset params | Open |
| 023 | High | Dependencies | jws HMAC signature bypass (via jsonwebtoken) | Open |
| 024 | High | Dependencies | axios DoS via __proto__ | Open |
| 025 | High | Dependencies | react-router XSS + CSRF | Open |
| 026 | Medium | Dependencies | Multiple transitive vulns (hono, h3, minimatch, etc.) | Open |

See `AUDIT_FINDINGS.md` for full details on each finding.

---

## Tools Used

### Confirmed
- [x] `pnpm audit` — dependency vulnerability scanning (frontend + backend + contracts)
- [x] `eslint-plugin-security` — code-level security linting
- [x] `semgrep` — SAST with OWASP + TypeScript rulesets
- [x] Git history secret scan — leaked keys in commit history
- [x] OWASP ZAP — dynamic testing against running backend API
- [x] CDSecurity / Solodit checklists — self-audit reference for prize logic

### From Grok Research (CT Security Community)
- [x] **AuditAgent** (Nethermind) — AI vulnerability detection trained on Solana audit findings. Free tier at auditagent.nethermind.io
- [x] **rnsec** — React-specific CLI scanner, 65+ rules for XSS/auth bypass. Free OSS on GitHub
- [ ] **TokenFi Shield** — AI-powered Solana/EVM contract audit (free beta). Evaluate for Solidity contracts
- [ ] **Radar** (audit_wizard) — OSS vulnerability hunter for Solidity/Rust. Evaluate for contracts

### Skipped (with reason)
- solidityguard.org — Ethereum-only, our contracts are on Base (EVM-compatible but tool is Mainnet-focused)
- Immunefi/CertiK bounties — budget too high for hackathon project
- AuditInspect — insufficient community vetting

---

## Key Security Files

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Express setup: helmet (L44), CORS (L45-78), rate limiter |
| `backend/src/middleware/auth.ts` | JWT auth middleware: `authenticate()`, `optionalAuthenticate()` |
| `backend/src/middleware/rateLimiter.ts` | Rate limits: 500/15min API, 50/15min auth, 3/hr strict |
| `backend/src/api/auth.ts` | Auth endpoints, Privy token verification |
| `backend/src/api/prizedContestsV2.ts` | Prize claim endpoint (L1124), Solana transfer (L1177-1225) |
| `backend/src/utils/auth.ts` | JWT utilities |
| `contracts/src/CTDraftPrizedV2.sol` | Main EVM contest contract |
| `contracts/src/Treasury.sol` | Prize vault contract |
| `frontend/src/App.tsx` | Privy wallet connector |

---

## Git Workflow

```
main (clean, production)
  └── audit/security-review (all audit work)
        ├── commit: "audit: setup — tracking docs, dep snapshots"
        ├── commit: "audit: phase 1A — dependency scan results"
        ├── commit: "audit: fix FINDING-XXX — [description]"
        └── ... (one commit per fix category)
```

- Never force-push the audit branch
- Each fix commit references the finding number
- Final merge to main via PR for review
