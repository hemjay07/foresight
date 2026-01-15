# Foresight - Base Mini App Deployment Guide

## What We Built

Converted **Foresight CT Fantasy League** into a Farcaster/Base Mini App with:
- ✅ Farcaster Mini App SDK integration
- ✅ Proper manifest (`.well-known/farcaster.json`)
- ✅ Embed metadata for rich previews
- ✅ Lexend font integration
- ✅ Mobile-optimized UI
- ✅ Safe area handling for notched devices
- ✅ Touch-optimized interactions

## Files Created/Modified

### New Files:
- `frontend/public/.well-known/farcaster.json` - Mini App manifest
- `frontend/src/hooks/useMiniApp.ts` - SDK initialization hook
- `frontend/src/styles/miniapp.css` - Mobile optimizations

### Modified Files:
- `frontend/index.html` - Added Lexend font, fc:miniapp metadata, viewport settings
- `frontend/tailwind.config.js` - Updated to use Lexend font
- `frontend/src/App.tsx` - Added Mini App SDK initialization
- `frontend/src/main.tsx` - Import miniapp.css
- `frontend/package.json` - Added @farcaster/miniapp-sdk

## Deployment Steps

### 1. Update Manifest Configuration

Edit `frontend/public/.well-known/farcaster.json`:

```json
{
  "homeUrl": "https://YOUR-DOMAIN.com",
  "iconUrl": "https://YOUR-DOMAIN.com/icon.png",
  "splashImageUrl": "https://YOUR-DOMAIN.com/splash.png",
  "screenshotUrls": ["https://YOUR-DOMAIN.com/screenshots/draft.png"],
  "heroImageUrl": "https://YOUR-DOMAIN.com/hero.png",
  "ogImageUrl": "https://YOUR-DOMAIN.com/og-image.png",
  "baseBuilder": {
    "ownerAddress": "YOUR_BASE_WALLET_ADDRESS"
  }
}
```

### 2. Update Embed Metadata

Edit `frontend/index.html` line 25 fc:miniapp content:

```json
{
  "version": "next",
  "imageUrl": "https://YOUR-DOMAIN.com/embed-image.png",
  "button": {
    "title": "Play Now",
    "action": {
      "type": "launch_miniapp",
      "name": "Foresight - CT Fantasy League",
      "url": "https://YOUR-DOMAIN.com"
    }
  }
}
```

### 3. Create Required Images

You need to create and upload these images:
- **Icon** (512x512 PNG): App icon
- **Splash** (1080x1920 PNG): Loading screen
- **Hero** (1200x630 PNG): Marketing image
- **OG Image** (1200x630 PNG): Social preview
- **Embed Image** (1200x630 PNG): Frame preview
- **Screenshots** (750x1334 PNG): App previews

### 4. Deploy Frontend

```bash
cd frontend

# Build
pnpm build

# Deploy to Vercel
vercel --prod

# Or deploy to your hosting provider
```

### 5. Verify Manifest Access

After deployment, ensure your manifest is accessible:
```
https://YOUR-DOMAIN.com/.well-known/farcaster.json
```

### 6. Create Account Association

1. Go to https://build.base.org (Base Build)
2. Navigate to Mini Apps verification tool
3. Enter your domain
4. Follow verification prompts
5. Copy the generated `accountAssociation` credentials
6. Paste into your `farcaster.json` manifest:

```json
{
  "accountAssociation": {
    "header": "YOUR_HEADER",
    "payload": "YOUR_PAYLOAD",
    "signature": "YOUR_SIGNATURE"
  }
}
```

7. Redeploy with updated manifest

### 7. Preview Mini App

Test your Mini App:
1. Go to https://build.base.org
2. Use the Mini App preview tool
3. Enter your domain URL
4. Verify it loads correctly

### 8. Publish

Share your Mini App:
1. Create a Base app post
2. Include your Mini App URL
3. The fc:miniapp metadata will generate rich preview
4. Users can launch directly from the frame

## Environment Variables

Update these in your deployment platform:

```bash
VITE_API_URL=https://your-backend-url.com
```

## Testing Checklist

Before publishing:
- [ ] Manifest accessible at `.well-known/farcaster.json`
- [ ] All image URLs return 200 status
- [ ] fc:miniapp metadata in HTML
- [ ] SDK initializes without errors
- [ ] App renders on mobile viewport
- [ ] Touch interactions work properly
- [ ] Safe areas respected (notched devices)
- [ ] Account association verified
- [ ] Preview works in Base Build tool

## Mini App Dimensions

The app is optimized for:
- Mobile viewport (375px - 428px width)
- Portrait orientation
- Safe area insets (notched devices)
- Touch-based interactions

## Important Notes

1. **Account Association**: Required to claim ownership. Do this AFTER deploying but BEFORE publishing.

2. **Images**: All images must be publicly accessible URLs. Upload to your hosting or use a CDN.

3. **Manifest Updates**: After changing the manifest, you may need to wait a few minutes for caches to clear.

4. **Testing**: Always test in the Base Build preview tool before publishing.

5. **Mobile First**: The UI is now optimized for mobile. Test on actual devices.

## Resources

- Farcaster Mini Apps: https://miniapps.farcaster.xyz/
- Base Mini Apps: https://docs.base.org/mini-apps/
- Base Build: https://build.base.org
- Mini App SDK Docs: https://github.com/farcasterxyz/miniapp-sdk

## Support

If you encounter issues:
1. Check browser console for SDK errors
2. Verify manifest is valid JSON
3. Ensure all URLs are https://
4. Test in Base Build preview tool
5. Check that account association is complete

## Next Steps

After deploying:
1. Share on Farcaster/Warpcast
2. Post in Base builders community
3. Monitor analytics
4. Iterate based on user feedback
5. Add Mini App-specific features (haptics, notifications, etc.)
