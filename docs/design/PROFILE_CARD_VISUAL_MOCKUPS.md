# Profile Card Redesign: Visual Mockups & Comparisons

This document shows before/after comparisons and detailed visual mockups for each concept.

---

## Current Design vs. Trading Card Concept

### BEFORE: Current Generic Design

```
┌──────────────────────────────────────────────────┐
│ ⚡ FORESIGHT             ct-foresight.xyz        │  ← Minimal header
│ ─────────────────────────────────────────────────   ← Thin divider
│                                                  │
│  [Avatar]  @username                            │
│           Founding Member #18                    │
│                                                  │
│ ─────────────────────────────────────────────────   ← Thin divider
│                                                  │
│                    1,135                         │  ← Plain score (no background)
│            FORESIGHT SCORE                       │
│                                                  │
│  ★ SILVER · 1.58×                               │  ← Badges (small, neutral)
│                                                  │
│ ─────────────────────────────────────────────────   ← Thin divider
│                                                  │
│  All-Time     Season      This Week              │  ← Grid layout
│    #8           #2        +1,135                 │     (text only, no visual)
│                                                  │
│ ─────────────────────────────────────────────────   ← Thin divider
│                                                  │
│  Tapestry · Solana verified                      │
└──────────────────────────────────────────────────┘

PERSONALITY SCORE: 4/10
- Looks like a crypto portfolio dashboard
- No visual tension or drama
- Every card looks identical (just numbers swap)
- No reason to share vs. screenshot text
```

### AFTER: Trading Card Redesign

```
┌────────────────────────────────────────────────────┐
│ ⚡ FORESIGHT               ct-foresight.xyz        │
│                                                   │
│  ╭─ HOLOGRAPHIC SHIMMER (animated gradient) ─╮  │
│  │ Gold → Cyan → Gold → Cyan → Gold           │  │
│  │ (opacity shifts subtly 0.3-0.8-0.3...)     │  │
│  ╰───────────────────────────────────────────╯  │
│                                                   │
│  ┌─── RARITY FRAME (3px gold border) ────────┐  │
│  │                                           │  │
│  │      [Avatar Circle in center]            │  │
│  │                                           │  │
│  │           @username                       │  │
│  │      Founding Member #18                  │  │
│  │                                           │  │
│  │   ★ DIAMOND  ·  1.58× Multiplier          │  │
│  │                                           │  │
│  │   ┌─ SCORE BOX (gold bg, 15% opacity) ┐  │  │
│  │   │                                   │  │  │
│  │   │          1,135                    │  │  │
│  │   │   FORESIGHT SCORE                 │  │  │
│  │   │                                   │  │  │
│  │   └───────────────────────────────────┘  │  │
│  │                                           │  │
│  │  ▓▓▓▓▓▓▓▓░░░░░░░░░░                       │  │  ← Progress bar
│  │  All-Time #8  ·  Moving: ↓2 since season  │  │
│  │                                           │  │
│  │  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░                      │  │
│  │  Season #2  ·  Moving: ↑1 this week       │  │
│  │                                           │  │
│  │  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                     │  │
│  │  +1,135 this week  ·  Best: +1,847        │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                   │
│  Tapestry · Solana verified                      │
└────────────────────────────────────────────────────┘

PERSONALITY SCORE: 9/10
✓ Rarity frame = "this is a rare card"
✓ Holographic shimmer = premium, eye-catching
✓ Colored score box = visual weight
✓ Progress bars = shows momentum, not just rank
✓ Shareable = looks like a collectible, not a dashboard
```

---

## Side-by-Side: All 5 Concepts

### Concept A: Trading Card

```
WIDTH: 480  |  FOCUS: Rarity + Collection
┌──────────────────────────────────────┐
│ ✦ FORESIGHT ✦                        │  Holographic shimmer (animated)
│                                      │
│  ┌───────────────────────────────┐  │
│  │  [Avatar]  @user              │  │  3px colored border
│  │  Founding Member #18          │  │  (frame color = tier)
│  │                               │  │
│  │  ┌──────────────────────────┐│  │
│  │  │       1,135              ││  │  Colored score box
│  │  │   FORESIGHT SCORE        ││  │  (tier color + 15% opacity)
│  │  └──────────────────────────┘│  │
│  │                               │  │
│  │ ▓▓▓▓▓░░░░░░░░░░  All-Time    │  │  Progress bars
│  │ ▓▓▓▓▓▓░░░░░░░░░  Season      │  │  (visual momentum)
│  │ ▓▓▓▓▓▓▓░░░░░░░░  This Week   │  │
│  └───────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
IMPLEMENTATION: 10 hours
PERSONALITY:   9/10
SHAREABILITY:  ⭐⭐⭐⭐⭐
```

### Concept B: Terminal

```
WIDTH: 480  |  FOCUS: Bloomberg-style Data
┌──────────────────────────────────────┐
│ ╔═════════════════════════════════╗  │
│ ║ ⚡ FORESIGHT TERMINAL  v1.0     ║  │  Box-drawing border
│ ║ ════════════════════════════════ ║  │  Unicode frame
│ ║                                 ║  │
│ ║ USER    @username               ║  │  Monospace labels
│ ║ TIER    ★ DIAMOND               ║  │
│ ║ MULT    1.58×                   ║  │
│ ║ ─────────────────────────────── ║  │
│ ║                                 ║  │
│ ║ $   1,135 FS            [GOLD]  ║  │  $ prefix + color coding
│ ║ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ ║  │
│ ║ RANK STATS                      ║  │
│ ║ ALL-TIME:  #8    ↓2  ▼          ║  │  Arrow indicators
│ ║ SEASON:    #2    ↑1  ▲          ║  │  (green for up, red for down)
│ ║ THIS WEEK: +1,135   Hot 🔥      ║  │
│ ║                                 ║  │
│ ║ APR:  24.2%                     ║  │  New metric (implicit return)
│ ║ APY:  298.6%                    ║  │
│ ║                                 ║  │
│ ║ Tapestry · Solana verified      ║  │
│ ╚═════════════════════════════════╝  │
│                                      │
└──────────────────────────────────────┘
IMPLEMENTATION: 8 hours
PERSONALITY:   7.5/10
SHAREABILITY:  ⭐⭐⭐ (crypto natives only)
```

### Concept C: Battle Pass

```
WIDTH: 480  |  FOCUS: Seasonal Progression
┌──────────────────────────────────────┐
│ SEASON 3 - COMPETITIVE               │  Seasonal context
│ ════════════════════════════════════  │
│                                      │
│  [Avatar]  @username                 │
│  Founding Member #18                 │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ★ DIAMOND · 1.58× ACTIVE    │   │  Status box
│  └──────────────────────────────┘   │
│                                      │
│  ┌─ SEASON PROGRESSION ──────────┐  │  Progress to next tier
│  │ #2 ████████░░░░░░  #1 (next)  │  │
│  │ 18,500 / 22,000 XP   (84%)    │  │
│  └───────────────────────────────┘  │
│                                      │
│  ACHIEVEMENTS UNLOCKED                │  Badge grid
│  ◆ Top-10     ◆ Streaks               │
│  ◆ Silver     ◆ 1.5× Mult             │
│                                      │
│  1,135 FS · #8 All-Time · +1,135     │
│                                      │
└──────────────────────────────────────┘
IMPLEMENTATION: 12 hours (new data)
PERSONALITY:   8.5/10
SHAREABILITY:  ⭐⭐⭐⭐
```

### Concept D: Oracle/Tarot

```
WIDTH: 480  |  FOCUS: Mystique + Premium
┌──────────────────────────────────────┐
│ ✦                                 ✦  │
│                                      │
│      ✦ THE ORACLE ✦                  │  Mystical title
│                                      │
│      [Avatar Circle]                 │
│                                      │
│      @username                       │
│      Founding Member #18             │
│      ─────────────────               │
│                                      │
│   Your Foresight is Ascendant        │  Mystical statement
│                                      │
│            1,135                     │  Large centered number
│       HARMONIC RESONANCE             │  Mystical label
│                                      │
│  ✦ ★ DIAMOND ✦ · 1.58× Aligned ✦   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ YOUR TRAJECTORY              │   │  Reading box
│  │ All-Time:  #8 (apex)         │   │
│  │ Season:    #2 (rising)       │   │
│  │ Week:   +1,135 (ascendant)   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Divined on Tapestry, Sealed Solana  │
│                                      │
│ ✦                                 ✦  │
└──────────────────────────────────────┘
IMPLEMENTATION: 6 hours (minimal)
PERSONALITY:   8/10
SHAREABILITY:  ⭐⭐⭐⭐⭐ (aesthetic audience)
```

### Concept E: Heatmap

```
WIDTH: 480  |  FOCUS: Behavioral Data
┌──────────────────────────────────────┐
│ ⚡ FORESIGHT          ct-foresight.xyz│
│                                      │
│ [Avatar]  @user  Founding #18        │
│                                      │
│ 1,135 FS  ★ DIAMOND  1.58×           │
│                                      │
│ ┌─ YOUR 30-DAY HEATMAP ──────────┐  │
│ │ Sun Mon Tue Wed Thu Fri Sat    │  │  Activity grid
│ │ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░   │  │
│ │ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░   │  │
│ │ ▒▒▒ ▒▒▒ ▓▓▓ ▓▓▓ ▓▓▓ ░░░ ░░░   │  │  Color intensity
│ │ ▓▓▓ ███ ███ ███ ▓▓▓ ▒▒▒ ░░░   │  │  = engagement
│ │ ███ ███ ███ ██░ ░░░ ░░░ ░░░   │  │
│ │                                │  │
│ │ Legend:                        │  │
│ │ ░=None ▒=Low ▓=High █=Peak    │  │
│ └────────────────────────────────┘  │
│                                      │
│ STREAKS & MILESTONES                 │
│ 🔥 Current: 5 days | 🏆 Best: 9 days│
│ 📈 Avg/Week: +42.5k FS               │
│ 🎯 Top Day: +327 FS                  │
│                                      │
│ Tapestry · Solana verified           │
└──────────────────────────────────────┘
IMPLEMENTATION: 14 hours (new data + grid)
PERSONALITY:   7.5/10
SHAREABILITY:  ⭐⭐⭐⭐
```

---

## Detailed Visual: Trading Card Breakdown

### Element 1: Holographic Shimmer (Top)

**CSS Animation:**
```css
@keyframes shimmer {
  0%   { opacity: 0.3; }
  25%  { opacity: 0.8; }
  50%  { opacity: 0.3; }
  75%  { opacity: 0.8; }
  100% { opacity: 0.3; }
}

.holographic-strip {
  height: 4px;
  background: linear-gradient(90deg,
    #F59E0B 0%,
    #06B6D4 25%,
    #F59E0B 50%,
    #06B6D4 75%,
    #F59E0B 100%
  );
  animation: shimmer 3s ease-in-out infinite;
}
```

**Visual Effect:**
```
Before: ─────────────────  (solid thin line)
After:  ▓▓░░▓▓░░▓▓░░▓▓░░  (animated shimmer)
        Gold → Cyan → Gold (repeating)
        Opacity: subtle pulse 0.3-0.8
        Duration: 3 seconds
        Result: "premium card" feeling
```

### Element 2: Rarity Frame Border

**By Tier (3px border):**
```
Bronze:   #F97316  (orange)
Silver:   #D1D5DB  (gray)
Gold:     #FBBF24  (gold)
Platinum: #22D3EE  (cyan)
Diamond:  #F59E0B  (gold accent)
```

**Visual Effect:**
```
CURRENT:                    AFTER:
┌─────────────────┐        ┌════════════════┐
│ [No border]     │        │ [3px GOLD border]
│ Content         │        │ Content        │
│                 │        │                │
└─────────────────┘        └════════════════┘

Result: Immediately signals "rarity" + "collectible"
```

### Element 3: Score Box with Colored Background

**By Tier (15% opacity background):**
```
Diamond box background:  #F59E0B + 0.15 opacity = rgba(245, 158, 11, 0.15)
Text color:              #FFFFFF (white)
Border:                  #F59E0B + 0.4 opacity = rgba(245, 158, 11, 0.4)
```

**Visual Effect:**
```
CURRENT:                    AFTER:
  1,135                       ┌──────────────┐
  SCORE                       │   1,135      │
  (plain black bg)            │   SCORE      │
                              │ (gold bg)    │
                              └──────────────┘

Result: Score has visual weight, feels important
```

### Element 4: Progress Bars (Stats Section)

**Bar Specifications:**
```
Width:           300px
Height:          18px
Outer border:    1px dark gray (#1F1F23)
Fill color:      Tier color (e.g., #F59E0B for diamond)
Fill opacity:    100% (solid)
Corner radius:   4px
Progress %:      (currentRank / maxRank) × 100
```

**Visual Effect:**
```
CURRENT (Grid):                AFTER (Bars):
All-Time     Season     Week
  #8           #2      +1,135

  ▓▓▓▓▓░░░░░░░░░░░░░  #8
  ▓▓▓▓▓▓░░░░░░░░░░░░  #2
  ▓▓▓▓▓▓▓▓░░░░░░░░░░░ +1,135

Result: Shows momentum visually, not just numbers
```

---

## Example: Trading Card with Different Tiers

### Diamond Tier (Best)
```
┌──────────────────────────────────────┐
│ ╭─ HOLOGRAPHIC SHIMMER ─╮            │ Gold/Cyan animated
│ │                       │            │
│ ╰───────────────────────╯            │
│                                      │
│ ┌─── 3px GOLD BORDER ────────────┐  │
│ │  [Avatar]  @elite_player       │  │
│ │  Founding Member #5            │  │
│ │                                │  │
│ │  ┌────────────────────────┐   │  │ Gold bg score box
│ │  │      2,847             │   │  │
│ │  │  FORESIGHT SCORE       │   │  │
│ │  └────────────────────────┘   │  │
│ │                                │  │
│ │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  All-Time  │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  Season    │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  Week      │  │
│ └───────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Silver Tier (Mid)
```
┌──────────────────────────────────────┐
│ ╭─ HOLOGRAPHIC SHIMMER ─╮            │ Gold/Cyan animated
│ │                       │            │
│ ╰───────────────────────╯            │
│                                      │
│ ┌─── 3px GRAY BORDER ────────────┐  │
│ │  [Avatar]  @casual_player      │  │
│ │  Founding Member #42           │  │
│ │                                │  │
│ │  ┌────────────────────────┐   │  │ Gray bg score box
│ │  │        894             │   │  │
│ │  │  FORESIGHT SCORE       │   │  │
│ │  └────────────────────────┘   │  │
│ │                                │  │
│ │ ▓▓░░░░░░░░░░░░░░░░░░  All-Time  │  │
│ │ ▓▓▓░░░░░░░░░░░░░░░░░  Season    │  │
│ │ ▓▓▓░░░░░░░░░░░░░░░░░  Week      │  │
│ └───────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Bronze Tier (New)
```
┌──────────────────────────────────────┐
│ ╭─ HOLOGRAPHIC SHIMMER ─╮            │ Gold/Cyan animated
│ │                       │            │
│ ╰───────────────────────╯            │
│                                      │
│ ┌─── 3px ORANGE BORDER ──────────┐  │
│ │  [Avatar]  @new_player         │  │
│ │  CT Fantasy Player             │  │
│ │                                │  │
│ │  ┌────────────────────────┐   │  │ Orange bg score box
│ │  │        156             │   │  │
│ │  │  FORESIGHT SCORE       │   │  │
│ │  └────────────────────────┘   │  │
│ │                                │  │
│ │ ░░░░░░░░░░░░░░░░░░░░  All-Time  │  │
│ │ ░░░░░░░░░░░░░░░░░░░░  Season    │  │
│ │ ░░░░░░░░░░░░░░░░░░░░  Week      │  │
│ └───────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Styling Reference: CSS + Canvas

### Color Values (Hex)

**Tier Colors (from current code):**
```javascript
{
  bronze:   '#F97316',  // Orange
  silver:   '#D1D5DB',  // Gray
  gold:     '#FBBF24',  // Yellow
  platinum: '#22D3EE',  // Cyan
  diamond:  '#F59E0B',  // Gold
}
```

**Background Colors (from current code):**
```javascript
{
  bg:      '#09090B',  // Black
  surface: '#111113',  // Very dark gray
  divider: '#1F1F23',  // Dark gray
  muted:   '#52525B',  // Medium gray
  text:    '#FAFAFA',  // White
}
```

**New Additions for Trading Card:**
```javascript
{
  holo_1: '#F59E0B',   // Gold
  holo_2: '#06B6D4',   // Cyan
  frame_width: 3,      // pixels
  score_box_opacity: 0.15,  // 15%
  shimmer_duration: 3000,   // ms
}
```

### Canvas Code Reference

**Loading images with CORS fallback:**
```typescript
// From existing code (line 50-59)
function loadImg(url: string, ms = 3000): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => { img.src = ''; res(null); }, ms);
    img.onload = () => { clearTimeout(t); res(img); };
    img.onerror = () => { clearTimeout(t); res(null); };
    img.src = url;
  });
}
```

**Drawing rounded rectangles:**
```typescript
// From existing code (line 61-73)
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
```

**Drawing gradients:**
```typescript
// Holographic shimmer (5-color gradient)
const holoGrad = ctx.createLinearGradient(0, 0, W, 0);
holoGrad.addColorStop(0.0, '#F59E0B4D');  // Gold @ 30%
holoGrad.addColorStop(0.25, '#06B6D4CC'); // Cyan @ 80%
holoGrad.addColorStop(0.5, '#F59E0B4D');  // Gold @ 30%
holoGrad.addColorStop(0.75, '#06B6D4CC'); // Cyan @ 80%
holoGrad.addColorStop(1.0, '#F59E0B4D');  // Gold @ 30%
ctx.fillStyle = holoGrad;
ctx.fillRect(0, 0, W, 4);
```

---

## Final Comparison Table

| Aspect | Trading Card | Terminal | Battle Pass | Oracle | Heatmap |
|--------|--------------|----------|-------------|--------|---------|
| **Visual Interest** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Shareability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Implementation** | 7 hours | 6 hours | 12 hours | 5 hours | 14 hours |
| **Code Complexity** | Medium | Low | High | Very Low | High |
| **New Data Needed** | No | No | Yes | No | Yes |
| **Personality** | 9/10 | 7.5/10 | 8.5/10 | 8/10 | 7.5/10 |
| **Risk** | Low | Low | Medium | Very Low | High |

---

## Recommendation

**For maximum impact with manageable scope:**

**Option A (Conservative):** Oracle/Tarot + Trading Card shimmer/frame
- Combines two visually distinct concepts
- Low implementation risk
- Both have high shareability
- Total time: ~8 hours

**Option B (Ambitious):** Full Trading Card + phase into Battle Pass
- Phase 1 (7h): Shimmer + frame + score box
- Phase 2 (3h): Progress bars
- Phase 3 (optional, 12h): Battle pass metrics
- Can do Phase 1-2 in one sprint

**Option C (Safe):** Oracle/Tarot only
- Fastest to implement (5 hours)
- Visually distinctive
- Lowest risk
- Ship today, iterate tomorrow

---

## Sign-Off Checklist

Before implementing any concept, confirm:

- [ ] Concept approved by product
- [ ] Visual mockups reviewed and okayed
- [ ] Canvas + DOM parity understood
- [ ] Testing plan documented
- [ ] Success metrics defined
- [ ] Timeline committed
- [ ] Dev resource allocated
