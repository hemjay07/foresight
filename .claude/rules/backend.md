---
paths: backend/**/*.ts
description: Backend development patterns for Express/Knex
---

# Backend Development Rules

## TypeScript
- Use strict mode
- All functions must have return types
- Avoid `any` - use generics or proper types
- Use interfaces for API request/response shapes

## Express API Patterns

### Response Format (ALWAYS)
```typescript
// Success
res.json({ success: true, data: {...} });

// Error
res.status(400).json({ success: false, error: "message" });
```

### Route Structure
```typescript
router.get('/endpoint', authenticate, async (req: Request, res: Response) => {
  try {
    // Validate input
    // Business logic
    // Return response
  } catch (error) {
    console.error('[ServiceName] Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

## Database (Knex.js)
- Always use Knex query builder (no raw SQL unless necessary)
- Always await database calls
- Handle null/undefined gracefully
- Use transactions for multi-table operations

## Error Handling
- Log errors with context: `[ServiceName] Error description:`
- Never expose internal errors to users
- Use specific error messages for client errors (400)
- Use generic messages for server errors (500)

## File Organization
```
backend/src/
├── api/           # Route handlers
├── services/      # Business logic
├── middleware/    # Express middleware
├── utils/         # Helpers
└── scripts/       # One-off scripts
```
