# Foresight Design Tokens

> **Brand Personality:** Bold. Sharp. Electric.
> **Physical Metaphor:** The Command Center
> **Last Updated:** December 28, 2025

---

## Color Palette

### Primary - Gold/Amber (Winning, Wealth, Premium)

```
gold-50:   #FFFBEB
gold-100:  #FEF3C7
gold-200:  #FDE68A
gold-300:  #FCD34D
gold-400:  #FBBF24
gold-500:  #F59E0B  ← Primary
gold-600:  #D97706  ← Primary Hover
gold-700:  #B45309
gold-800:  #92400E
gold-900:  #78350F
gold-950:  #451A03
```

### Secondary - Electric Cyan (Energy, Links, Accents)

```
cyan-50:   #ECFEFF
cyan-100:  #CFFAFE
cyan-200:  #A5F3FC
cyan-300:  #67E8F9
cyan-400:  #22D3EE
cyan-500:  #06B6D4  ← Secondary
cyan-600:  #0891B2
cyan-700:  #0E7490
cyan-800:  #155E75
cyan-900:  #164E63
cyan-950:  #083344
```

### Semantic Colors

```
Success (Emerald):
  light:   #34D399
  default: #10B981
  dark:    #059669

Warning (Amber - lighter than primary):
  light:   #FCD34D
  default: #FBBF24
  dark:    #F59E0B

Error (Rose):
  light:   #FB7185
  default: #F43F5E
  dark:    #E11D48

Info (Sky):
  light:   #7DD3FC
  default: #0EA5E9
  dark:    #0284C7
```

### Neutral - Rich Blacks (Command Center Dark Theme)

```
gray-50:   #FAFAFA
gray-100:  #F4F4F5
gray-200:  #E4E4E7
gray-300:  #D4D4D8
gray-400:  #A1A1AA
gray-500:  #71717A
gray-600:  #52525B
gray-700:  #3F3F46
gray-800:  #27272A  ← Card backgrounds
gray-900:  #18181B  ← Surface
gray-950:  #09090B  ← Base background
```

### Special Effects

```
Gold Glow:    0 0 20px rgba(245, 158, 11, 0.3)
Cyan Glow:    0 0 20px rgba(6, 182, 212, 0.3)
Success Glow: 0 0 20px rgba(16, 185, 129, 0.3)
```

---

## Typography

### Font Stack

```css
--font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `hero` | 64px | 1.1 | 700 | Main headlines only |
| `display` | 48px | 1.15 | 700 | Page titles |
| `h1` | 36px | 1.2 | 600 | Section headers |
| `h2` | 28px | 1.25 | 600 | Card titles |
| `h3` | 22px | 1.3 | 600 | Subsections |
| `h4` | 18px | 1.4 | 600 | Labels |
| `body-lg` | 18px | 1.6 | 400 | Lead paragraphs |
| `body` | 16px | 1.6 | 400 | Default text |
| `body-sm` | 14px | 1.5 | 400 | Secondary text |
| `caption` | 12px | 1.4 | 400 | Captions, metadata |
| `micro` | 10px | 1.3 | 500 | Badges, tiny labels |

### Font Weights

```
Light:    300 (sparingly)
Regular:  400 (body text)
Medium:   500 (emphasis)
Semibold: 600 (headings)
Bold:     700 (display, CTAs)
```

---

## Spacing Scale (8px base)

```
0:    0px
0.5:  2px
1:    4px
2:    8px
3:    12px
4:    16px
5:    20px
6:    24px
7:    28px
8:    32px
9:    36px
10:   40px
11:   44px
12:   48px
14:   56px
16:   64px
20:   80px
24:   96px
32:   128px
```

---

## Border Radius

```
none:   0px
sm:     4px   (buttons, badges)
md:     8px   (cards, inputs)
lg:     12px  (modals, larger cards)
xl:     16px  (hero cards)
2xl:    24px  (special elements)
full:   9999px (avatars, pills)
```

---

## Shadows

```css
/* Subtle - for slight elevation */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default - cards, dropdowns */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
             0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Elevated - modals, popovers */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
             0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Prominent - hero elements */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1),
             0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Gold glow - achievements, primary CTAs */
--shadow-gold: 0 0 20px rgba(245, 158, 11, 0.25),
               0 0 40px rgba(245, 158, 11, 0.1);

/* Cyan glow - secondary accents */
--shadow-cyan: 0 0 20px rgba(6, 182, 212, 0.25),
               0 0 40px rgba(6, 182, 212, 0.1);
```

---

## Transitions

```css
/* Micro interactions */
--transition-fast: 100ms ease-out;

/* UI elements */
--transition-base: 200ms ease-out;

/* Page transitions */
--transition-slow: 300ms ease-out;

/* Dramatic reveals */
--transition-slower: 500ms ease-out;
```

---

## Z-Index Scale

```
0:      Base content
10:     Elevated cards, dropdowns
20:     Sticky headers
30:     Fixed navigation
40:     Overlays, backdrops
50:     Modals, dialogs
60:     Popovers, tooltips
70:     Notifications, toasts
100:    Maximum (dev tools, debug)
```

---

## Breakpoints

```
sm:   640px   (large phones)
md:   768px   (tablets)
lg:   1024px  (small laptops)
xl:   1280px  (desktops)
2xl:  1536px  (large screens)
```

---

## Component-Specific Tokens

### Buttons

```
Primary:
  bg: gold-500
  hover: gold-600
  active: gold-700
  text: gray-950
  shadow: shadow-gold (on hover)

Secondary:
  bg: transparent
  border: gray-700
  hover: gray-800
  text: gray-100

Ghost:
  bg: transparent
  hover: gray-800/50
  text: gray-300

Danger:
  bg: rose-500
  hover: rose-600
  text: white
```

### Cards

```
Default:
  bg: gray-800
  border: gray-700
  radius: md (8px)

Elevated:
  bg: gray-800
  border: gray-700
  shadow: shadow-md

Highlighted:
  bg: gray-800
  border: gold-500/30
  shadow: shadow-gold
```

### Inputs

```
Default:
  bg: gray-900
  border: gray-700
  focus-border: gold-500
  text: gray-100
  placeholder: gray-500
```

### Badges (Tiers)

```
S-Tier:
  bg: gold-500/20
  text: gold-400
  border: gold-500/30

A-Tier:
  bg: cyan-500/20
  text: cyan-400
  border: cyan-500/30

B-Tier:
  bg: emerald-500/20
  text: emerald-400
  border: emerald-500/30

C-Tier:
  bg: gray-500/20
  text: gray-400
  border: gray-500/30
```

---

## Usage Guidelines

### Color Usage

- **Gold** - Primary actions, achievements, important numbers, CTAs
- **Cyan** - Links, secondary actions, accents
- **White** - Primary text, important info
- **Gray-400** - Secondary text, labels
- **Gray-600** - Disabled states, dividers

### Typography Usage

- **Display font (Plus Jakarta Sans)** - Hero text, headlines, numbers
- **Body font (Inter)** - All body text, UI elements
- **Mono font (JetBrains Mono)** - Scores, stats, code, data

### Spacing Usage

- **4px** - Tight grouping (icon + label)
- **8px** - Related elements
- **16px** - Section padding, card padding
- **24px** - Between sections
- **32px+** - Major section breaks

---

## Dark Theme Notes

This is a dark-first design system. Light theme is NOT planned.

Key principles:
- Pure black (#000) should be avoided - use gray-950
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large)
- Gold and cyan work beautifully on dark backgrounds
- Use subtle borders (gray-700/800) rather than shadows for separation
