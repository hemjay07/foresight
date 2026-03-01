# Audit Findings — Foresight

**Audit Branch:** `audit/security-review`
**Started:** 2026-03-01

Each finding follows a standard format. Findings are numbered sequentially.

---

## FINDING-001: Free Leagues Have No On-Chain Verification

- **Severity:** Critical
- **Category:** Architecture / Data Integrity
- **Phase:** 0 (Pre-audit observation)
- **File:** `backend/src/api/` (free league endpoints)
- **Description:** Free league contest entries, results, and rankings are stored exclusively in PostgreSQL with no on-chain verification. Unlike prized contests (which use `CTDraftPrizedV2.sol` on Base Sepolia for entry fees and prize pools), free leagues exist entirely off-chain. This means contest results can be silently modified by anyone with database access, undermining trust in the platform.
- **Impact:** A compromised DB or malicious admin could alter free league results. For a crypto-native app, this is a trust deficit — users expect verifiable results. If free leagues are used as a stepping stone to prized contests (reputation, qualification), manipulation here cascades to real money.
- **Recommended Fix:** Implement on-chain result anchoring for free leagues — at minimum, publish a hash of final standings to Solana/Base after each contest concludes. Full fix would be a lightweight on-chain program for free league entries.
- **Commit:** N/A (architectural — requires separate feature work)
- **Status:** Open — flagged for post-audit implementation

---

_Additional findings will be appended as they are discovered during the audit._
