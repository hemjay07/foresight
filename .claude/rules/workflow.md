---
description: Development workflow for all features
---

# CT Draft Development Workflow

## The 4-Phase Cycle (MANDATORY for all features)

### Phase 1: PLAN
1. Understand feature requirements
2. Review existing code/docs
3. Write plan in dedicated doc or TODO.md
4. Review with user until common understanding reached
5. **DO NOT proceed until user approves plan**

### Phase 2: TDD - Write Failing Tests
1. Write test cases for expected behavior
2. Run tests - confirm they FAIL
3. Review test cases with user if needed
4. Tests define the contract

### Phase 3: IMPLEMENT
1. Write minimal code to pass tests
2. Run tests - confirm they PASS
3. Refactor if needed (tests must still pass)
4. No gold-plating - only what tests require

### Phase 4: VERIFY
1. Manual testing
2. Screenshot comparison (for UI changes)
3. Update CLAUDE.md with completion
4. Mark TODO items as complete

## For UI/Design Work

```
BEFORE  → Take screenshot of current state
IMPLEMENT → Make changes
AFTER   → Take screenshot of new state
COMPARE → Review with user
ITERATE → Until approved
```

## Key Rules

- **Never skip the plan phase**
- **Never write code without tests first**
- **Never mark complete without verification**
- **Always update CLAUDE.md after significant work**
