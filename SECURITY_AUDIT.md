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
| 1A: Dependency Scanning | ⬜ Not Started | 0 | `pnpm audit` on all packages |
| 1B: SAST (Static Analysis) | ⬜ Not Started | 0 | eslint-plugin-security, semgrep |
| 1C: Secret Scanning | ⬜ Not Started | 0 | Git history + env file audit |
| 1D: Smart Contract Audit | ⬜ Not Started | 0 | Solidity contracts via tools + manual |
| 1E: Solana Tx Security Scan | ⬜ Not Started | 0 | AuditAgent (Nethermind) + manual |
| 1F: Frontend Security Scan | ⬜ Not Started | 0 | rnsec + manual XSS review |
| 2A: Auth & Authorization | ⬜ Not Started | 0 | Privy flow, JWT, middleware |
| 2B: SOL Transaction Security | ⬜ Not Started | 0 | Server wallet, double-claim, race conditions |
| 2C: EVM Contract Security | ⬜ Not Started | 0 | CTDraftPrizedV2.sol deep review |
| 2D: API Input Validation | ⬜ Not Started | 0 | All endpoints, SQL injection, rate limits |
| 2E: Frontend Security | ⬜ Not Started | 0 | XSS, CSRF, exposed secrets |
| 2F: Database Security | ⬜ Not Started | 0 | Connection, isolation, RLS |
| 2G: Infrastructure & Config | ⬜ Not Started | 0 | CORS, helmet, error responses, logging |
| 3: OWASP Top 10 | ⬜ Not Started | 0 | A01-A10 systematic check |
| 4: Fix & Harden | ⬜ Not Started | 0 | All fixes with individual commits |
| 5: Verify & Document | ⬜ Not Started | 0 | Re-scan, smoke test, SECURITY.md |

---

## Findings Summary

| # | Severity | Category | Description | File | Status |
|---|----------|----------|-------------|------|--------|
| 1 | Critical | Architecture | Free leagues have no on-chain verification — results are DB-only, manipulable | `backend/src/api/` | Open |

_Findings are added as they are discovered. See `AUDIT_FINDINGS.md` for full details._

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
