# Foresight Landing Page: Implementation Quick Start
## Copy-Paste Ready Code for Bento Grid Redesign

**Status:** Ready to implement immediately
**Effort:** 4-6 hours (structure + polish)
**Key Files:** `frontend/src/pages/Home.tsx`

---

## THE 3-STEP IMPLEMENTATION FLOW

```
STEP 1: Restructure HTML (Grid Layout)
        └─ Change from 2-card to 3-card asymmetric layout
        └─ Time: 30 minutes

STEP 2: Polish Content (Remove Placeholders)
        └─ Add tier breakdown grid
        └─ Add medal emojis to leaderboard
        └─ Verify monospace fonts
        └─ Time: 1 hour

STEP 3: Add Animation (Stagger on Scroll)
        └─ Implement IntersectionObserver
        └─ Add CSS transitions
        └─ Time: 1 hour

STEP 4: Mobile Responsive (375px Testing)
        └─ Verify single-column stack
        └─ Adjust card heights
        └─ Time: 1 hour

STEP 5: Visual Polish (Spacing + Breathing)
        └─ Increase section padding
        └─ Add borders between sections
        └─ Time: 1 hour
```

---

## COPY-PASTE READY CODE

### Step 1: New Grid Structure (Replace "How it works" section)

**Before:** Asymmetric left/right cards within a 2-column grid
**After:** True asymmetric bento with tall left, stacked right

```tsx
// In: frontend/src/pages/Home.tsx
// Replace this section (around line 438-542):

{/* ══════════════════ BENTO: GAME LOOP ═══════════════════════════ */}
<section className="py-16 border-t border-gray-800/50 px-4 md:px-0">
  {/* Header row */}
  <div className="flex items-center justify-between mb-8">
    <span className="text-[11px] font-mono text-gray-600 uppercase tracking-widest">How it works</span>
    <span className="text-[11px] font-mono text-gray-700 uppercase tracking-wider hidden md:block">
      Resets Sunday 23:59 UTC
    </span>
  </div>

  {/* Mobile: compact vertical stack */}
  <div className="md:hidden space-y-4">
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest mb-3 block">Draft</span>
      <h3 className="font-semibold text-white text-base mb-2">Build your formation</h3>
      <p className="text-gray-500 text-xs leading-relaxed mb-4">
        Pick 5 from S/A/B/C tiers. Assign a captain for 2×. Stay under 150pt budget.
      </p>
      <MiniFormation animate={howVisible} />
      {/* Tier breakdown for mobile */}
      <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-4 gap-2 text-center">
        <div>
          <span className="text-xs font-mono font-bold text-gold-400">S</span>
          <p className="text-[8px] text-gray-600 mt-0.5">4 available</p>
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-gray-400">A</span>
          <p className="text-[8px] text-gray-600 mt-0.5">16 available</p>
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-gray-400">B</span>
          <p className="text-[8px] text-gray-600 mt-0.5">30 available</p>
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-gray-400">C</span>
          <p className="text-[8px] text-gray-600 mt-0.5">50 available</p>
        </div>
      </div>
    </div>

    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 block">Score</span>
      <h3 className="font-semibold text-white text-base mb-1">Earn daily</h3>
      <p className="text-gray-500 text-xs leading-relaxed mb-4">4 metrics scored every 24h</p>
      <MiniScoreBreakdown animate={howVisible} />
    </div>

    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 block">Win</span>
      <h3 className="font-semibold text-white text-base mb-1">Compete</h3>
      <p className="text-gray-500 text-xs leading-relaxed">Top teams win SOL</p>
      <MiniLeaderboard />
    </div>
  </div>

  {/* Desktop: Asymmetric bento grid (60-40 split) */}
  <div className="hidden md:grid md:grid-cols-[1.2fr_1fr] gap-5">

    {/* LEFT COLUMN: Formation (tall, 2-row height) */}
    <div
      className={`bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 md:row-span-2 transition-[border-color,opacity,transform] duration-300 flex flex-col justify-between ${
        howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: howVisible ? '0ms' : '0ms' }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest block mb-1">
              Draft
            </span>
            <h3 className="font-bold text-white text-lg">Build your formation</h3>
          </div>
          <span className="text-xs font-mono text-gray-600">5 picks · 150pt</span>
        </div>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Pick from S/A/B/C tiers. Assign a captain for 2× points. Stay under budget.
        </p>
      </div>

      {/* Formation Grid */}
      <MiniFormation animate={howVisible} />

      {/* Tier Breakdown (fills remaining space) */}
      <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-4 gap-3">
        {[
          { tier: 'S', label: '4', accent: true },
          { tier: 'A', label: '16', accent: false },
          { tier: 'B', label: '30', accent: false },
          { tier: 'C', label: '50', accent: false },
        ].map(t => (
          <div key={t.tier} className="text-center">
            <span className={`text-base font-mono font-bold ${t.accent ? 'text-gold-400' : 'text-gray-500'}`}>
              {t.tier}
            </span>
            <p className="text-[10px] text-gray-600 mt-1">
              {t.label} available
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* RIGHT COLUMN: Stacked cards */}
    <div className="flex flex-col gap-5">

      {/* SCORE CARD */}
      <div
        className={`bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 transition-[border-color,opacity,transform] duration-300 flex flex-col justify-between ${
          howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: howVisible ? '100ms' : '0ms' }}
      >
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
            Score
          </span>
          <h3 className="font-bold text-white text-lg">Earn points daily</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">
            4 metrics update every 24 hours
          </p>
        </div>

        <MiniScoreBreakdown animate={howVisible} />
      </div>

      {/* LEADERBOARD CARD */}
      <div
        className={`bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 transition-[border-color,opacity,transform] duration-300 flex flex-col justify-between ${
          howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: howVisible ? '200ms' : '0ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
              Win
            </span>
            <h3 className="font-bold text-white text-lg">Climb the leaderboard</h3>
          </div>
          <Trophy size={20} className="text-gray-600" weight="fill" />
        </div>

        <MiniLeaderboardPremium />
      </div>

    </div>

  </div>
</section>
```

### Step 2: Improved Leaderboard Component (with medals + prizes)

```tsx
// New component: MiniLeaderboardPremium
// Add to: frontend/src/pages/Home.tsx

function MiniLeaderboardPremium() {
  return (
    <div className="bg-gray-950 rounded-lg space-y-1 overflow-hidden">
      {[
        { rank: 1, handle: 'saylor', name: 'Saylor', score: '847', prize: '2.5 SOL' },
        { rank: 2, handle: 'blknoiz06', name: 'Ansem', score: '721', prize: '1.5 SOL' },
        { rank: 3, handle: '', name: 'you', score: '—', prize: '1 SOL', isYou: true },
      ].map(row => {
        const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉';

        return (
          <div
            key={row.rank}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150 ${
              row.rank <= 3 ? 'bg-gray-800/50' : ''  // Podium highlight
            } ${row.isYou ? 'bg-gold-500/10 border border-gold-500/20' : ''}`}
          >
            {/* Rank with medal */}
            <span className="text-sm font-mono w-8 text-center">
              {medal}
            </span>

            {/* Avatar or placeholder */}
            {row.handle ? (
              <img
                src={`https://unavatar.io/twitter/${row.handle}`}
                alt={row.name}
                className="w-6 h-6 rounded-full shrink-0 bg-gray-700 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gold-500/20 shrink-0 flex items-center justify-center">
                <span className="text-[9px] text-gold-400 font-bold">✓</span>
              </div>
            )}

            {/* Name */}
            <span className={`text-xs flex-1 truncate ${row.isYou ? 'text-gold-400 font-semibold' : 'text-gray-400'}`}>
              {row.name}
            </span>

            {/* Score (monospace) */}
            <span className={`text-xs font-mono tabular-nums ${row.isYou ? 'text-gold-500 font-bold' : 'text-gray-300'}`}>
              {row.score}
            </span>

            {/* Prize (new!) */}
            <span className="text-xs font-mono text-gold-400 ml-1 text-right w-16">
              {row.prize}
            </span>
          </div>
        );
      })}

      {/* Footer: Prize pool info */}
      <div className="flex justify-between items-center pt-2.5 px-3 border-t border-gray-800">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Prize Pool</span>
        <span className="text-[10px] font-mono text-gold-400 font-semibold">5 SOL Total</span>
      </div>
    </div>
  );
}
```

### Step 3: Increase Section Padding + Add Borders

```tsx
// In: frontend/src/pages/Home.tsx
// Update padding and borders

{/* Change from: py-10 border-t border-gray-800/50 */}
<section className="py-16 border-t border-gray-800 px-4 md:px-0">
  {/* Rest of section */}
</section>

{/* For XP + Activity section */}
<section className="py-16 border-t border-gray-800 px-4 md:px-0">
  {/* Rest of section */}
</section>
```

### Step 4: Verify Tailwind Classes Are Present

Check that `frontend/tailwind.config.js` has:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        gray: {
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
      },
    },
  },
};
```

### Step 5: CSS for Animations (if not already present)

Add to `frontend/src/styles/animations.css`:

```css
/* Stagger animation for bento cards */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Monospace number animation (score bars) */
@keyframes barFill {
  from {
    width: 0;
  }
  to {
    width: var(--target-width, 100%);
  }
}

.animate-bar-fill {
  animation: barFill 400ms ease-out forwards;
}
```

---

## TESTING CHECKLIST

### Desktop (1440px)
- [ ] Grid displays as 60/40 left/right split
- [ ] Left card (formation) is noticeably taller
- [ ] Right cards (score + leaderboard) are equal height
- [ ] Borders between sections are visible (`border-gray-800`)
- [ ] Padding feels generous (5rem = 80px)
- [ ] Hover states work: border-color changes to `border-gray-700`

### Tablet (768px)
- [ ] Grid switches to 1-column layout
- [ ] Cards stack vertically without overlap
- [ ] All text remains readable
- [ ] Touch targets are ≥44px tall

### Mobile (375px)
- [ ] Formation card renders without overflow
- [ ] Tier breakdown grid doesn't break (4 columns, each ~70px)
- [ ] Leaderboard card is scrollable if needed
- [ ] Padding is reduced (2.5rem instead of 5rem)
- [ ] Medal emojis display correctly

### Browser Console
- [ ] `npx tsc --noEmit` passes (no TS errors)
- [ ] No layout shifts (CLS = 0)
- [ ] No console warnings about missing keys or props

---

## FINAL POLISH DETAILS

### If Leaderboard Numbers "Bounce" on Mobile
Add to score/leaderboard rows:
```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

### If Medals Don't Display
Replace emoji with Phosphor icons if needed:
```tsx
import { Medal, MedalCircle } from '@phosphor-icons/react';

// Instead of medal, use icon
{rank === 1 && <Medal size={16} className="text-gold-400" weight="fill" />}
{rank === 2 && <Medal size={16} className="text-gray-400" weight="fill" />}
{rank === 3 && <Medal size={16} className="text-emerald-400" weight="fill" />}
```

### If Section Feels Too Tight
Increase padding:
```css
.section {
  @apply py-20;  /* Was py-16, now py-20 (160px total) */
}
```

---

## DEPLOYMENT STEPS

1. **Create branch:**
   ```bash
   git checkout -b redesign/landing-bento-grid
   ```

2. **Make changes:**
   - Update `frontend/src/pages/Home.tsx` (steps 1-2)
   - Update padding in same file (step 3)
   - Verify Tailwind config (step 4)
   - Update animations CSS (step 5)

3. **Test locally:**
   ```bash
   cd frontend && pnpm dev
   # Visit http://localhost:5173
   # Test on desktop, tablet, mobile
   ```

4. **Take screenshot (BEFORE fixing was already taken):**
   ```bash
   cd /Users/mujeeb/foresight && ./node_modules/.bin/tsx scripts/screenshot.ts / --full
   # Saves to screenshots/home-redesigned.png
   ```

5. **Commit:**
   ```bash
   git add frontend/src/pages/Home.tsx frontend/src/styles/animations.css
   git commit -m "refactor: redesign landing 'how it works' section with asymmetric bento grid

- Replace 2-column layout with asymmetric 60-40 split (tall formation left, stacked score+leaderboard right)
- Add tier breakdown grid in formation card footer
- Add prize amounts to leaderboard (2.5/1.5/1 SOL for ranks 1-3)
- Add medal emojis (🥇🥈🥉) to podium ranks
- Increase section padding from 2.5rem to 4rem (better breathing room)
- Add 100-200ms stagger animations on card appearance
- Improve mobile responsiveness: single-column stack on tablet/mobile
- All numbers use tabular-nums for vertical alignment
- Monospace font (JetBrains Mono) for all numeric values"
   ```

6. **Push and create PR:**
   ```bash
   git push origin redesign/landing-bento-grid
   gh pr create --title "Redesign landing page 'How it Works' section (asymmetric bento)" \
               --body "Replaces generic 3-equal-cards layout with asymmetric bento grid pattern inspired by Linear/Vercel. Formation (unique differentiator) gets 60% of space; score + leaderboard support it on the right."
   ```

---

## TIME ESTIMATE

| Phase | Time | Effort |
|-------|------|--------|
| Grid restructuring | 30m | Simple HTML rearrange |
| New components | 30m | Copy-paste, modify |
| Styling/spacing | 45m | Tailwind adjustments |
| Animation implementation | 45m | CSS + scroll observer |
| Mobile testing | 30m | Responsive tweaks |
| **Total** | **3 hours** | Straightforward |

---

*Last updated: February 27, 2026*
*Status: Ready to code immediately*
