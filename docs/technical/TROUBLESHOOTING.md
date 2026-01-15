# 🔧 Blank White Screen Troubleshooting

## Step 1: Open Browser Console

**In your browser (Chrome/Firefox/Safari):**
1. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Click the **Console** tab
3. Look for any **red error messages**
4. Take a screenshot or copy the error text

## Step 2: Common Issues & Fixes

### Issue: React/Module Errors
If you see errors like:
- `Failed to resolve module`
- `Cannot find module`
- `Unexpected token`

**Fix:**
```bash
cd frontend
rm -rf node_modules .vite
pnpm install
pnpm dev
```

### Issue: Port Already in Use
If port 5173 is busy:

**Fix:**
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
pnpm dev --port 5174
```

### Issue: CSS Not Loading
If the page loads but everything is invisible:

**Fix:**
Check browser console for 404 errors on CSS files

### Issue: Wagmi/RainbowKit Errors
If you see wallet-related errors:

**Fix:**
Check that `.env` has `VITE_WALLETCONNECT_PROJECT_ID`

## Step 3: Hard Refresh

**Try a hard refresh:**
- Chrome/Windows: `Ctrl + Shift + R`
- Chrome/Mac: `Cmd + Shift + R`
- Firefox: `Ctrl/Cmd + Shift + R`
- Safari: `Cmd + Option + R`

## Step 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Step 5: Check What You See

### Completely Blank White Screen
- Check browser console for errors
- The app isn't loading at all

### Page with Header/Footer but No Content
- React is loading but a component is broken
- Check console for component errors

### Flash of Content Then White
- A component is crashing after mount
- Error boundary should catch this

## Step 6: Test Basic Connectivity

```bash
# Check if server is running
curl http://localhost:5173

# Should return HTML with <div id="root"></div>
```

## Step 7: Simple Debug

**Temporarily simplify App.tsx:**

```tsx
function App() {
  return <div style={{ color: 'red', padding: '50px' }}>TEST - If you see this, React is working!</div>;
}
```

If you see the red text, React works and the issue is in a component.

## Step 8: Check Network Tab

1. Open DevTools
2. Go to **Network** tab
3. Refresh page
4. Look for failed requests (red status codes)
5. Common issues:
   - 404 on `/src/main.tsx` - path issue
   - 404 on fonts/images - asset loading issue
   - 500 errors - server issue

## What to Report

If still stuck, provide:
1. **Browser console screenshot** (all errors)
2. **Network tab screenshot** (failed requests)
3. **Browser + version** (Chrome 120, Firefox 121, etc.)
4. **What you see** (completely blank? partial content?)

---

## Quick Reset (Nuclear Option)

```bash
cd frontend

# Stop all dev servers
lsof -ti:5173 | xargs kill -9

# Clean everything
rm -rf node_modules .vite dist

# Reinstall
pnpm install

# Restart
pnpm dev
```

Then try http://localhost:5173 again.
