---
paths: frontend/**/*.tsx, frontend/**/*.ts
description: Frontend development patterns for React/TailwindCSS
---

# Frontend Development Rules

## React Patterns

### Component Structure
```typescript
export default function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState(initialValue);

  // 2. Derived state / computations
  const computed = useMemo(() => ..., [deps]);

  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [deps]);

  // 4. Event handlers
  const handleClick = () => {...};

  // 5. Early returns (loading, error, empty states)
  if (loading) return <Loading />;
  if (error) return <Error />;

  // 6. Main render
  return (...);
}
```

### API Calls
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Always include auth token
const token = localStorage.getItem('authToken');
const response = await axios.get(`${API_URL}/api/endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## TailwindCSS
- Use utility classes directly
- Custom classes in index.css: `.card`, `.btn-primary`
- Color palette: `brand-*` (purple), `gray-*` (dark theme)
- Mobile-first: Start with mobile, add `md:` `lg:` for larger

## State Management
- Use React Context for global state
- Use local state (useState) for component state
- Use URL params for shareable state (tabs, filters)

## File Organization
```
frontend/src/
├── components/    # Reusable components
├── pages/         # Route pages
├── hooks/         # Custom hooks
├── contexts/      # React contexts
├── contracts/     # ABIs + addresses
└── utils/         # Helpers
```

## Loading/Error/Empty States
Every data-fetching component MUST handle:
1. Loading state (skeleton or spinner)
2. Error state (with retry option)
3. Empty state (helpful message + CTA)
