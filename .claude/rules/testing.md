---
description: Testing conventions and TDD workflow
---

# Testing Rules

## TDD Workflow (MANDATORY)

1. **Write test FIRST** - Define expected behavior
2. **Run test** - Confirm it FAILS (red)
3. **Write minimal code** - Just enough to pass
4. **Run test** - Confirm it PASSES (green)
5. **Refactor** - Clean up while tests pass

## Backend Tests (Vitest)

### Location
```
backend/
├── src/
│   └── services/
│       └── myService.ts
└── tests/
    └── services/
        └── myService.test.ts
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ServiceName', () => {
  describe('functionName', () => {
    it('should do expected behavior', async () => {
      // Arrange
      const input = {...};

      // Act
      const result = await functionName(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle edge case', async () => {...});

    it('should throw on invalid input', async () => {
      await expect(functionName(bad)).rejects.toThrow();
    });
  });
});
```

## Frontend Tests (Vitest + React Testing Library)

### Location
```
frontend/
├── src/
│   └── components/
│       └── MyComponent.tsx
└── tests/
    └── components/
        └── MyComponent.test.tsx
```

### Test Structure
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('After Click')).toBeInTheDocument();
    });
  });
});
```

## What to Test

### Backend
- Service functions (business logic)
- API endpoint responses
- Database queries (with test DB)
- Error handling

### Frontend
- Component renders correctly
- User interactions work
- Loading/error/empty states show
- API integration (mock responses)

## What NOT to Test
- Implementation details
- Third-party libraries
- Simple getters/setters
- Private functions directly
