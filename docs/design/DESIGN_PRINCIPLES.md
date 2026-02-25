# Foresight Design Principles

> **MANDATORY:** Read this before making any UI/design change.
> These principles are derived from decisions made building Foresight.
> When in doubt, apply these rather than inventing something new.

---

## The Core Philosophy

**Color in content, not chrome.**

UI chrome (card borders, backgrounds, containers, action buttons) should be dark and quiet. Color belongs on the *things that mean something* — scores, rank medals, tier badges, status indicators. This creates natural visual hierarchy: the eye goes to color, so color should mark what matters.

---

## Principle 1 — Color Lives in Content, Not Chrome

**Chrome is always gray.** Card borders, card backgrounds, dividers, wrappers — always `gray-800`/`gray-900` family. Never colorful.

**Content carries color.** Color appears on icons that signal status, badges that signal tier, text that signals rank or outcome. It should be *earned* by semantic meaning.

```
✅ Good                              ❌ Bad
border-gray-800                      border-cyan-500/30
bg-gray-900/50                       bg-cyan-500/10 (as a card background)
[gold crown icon] for rank #1        [gold border] on rank #1 card
[emerald badge] for free contest     [emerald border] on contest card
```

**Where we applied this:**
- Contest cards: borders changed from `border-l-4 border-l-emerald-500` to `border-gray-800`
- ContestDetail header: removed `bg-gradient-to-br` background
- Follow button: removed `bg-cyan-500/10 border-cyan-500/30`
- Tab buttons: changed from gradient to `bg-gold-500/10 text-gold-400` (active), `bg-gray-800` (inactive)

---

## Principle 2 — Every Color Has One Semantic Role

Colors are a vocabulary. Each word has one meaning. Never use color decoratively.

| Color | Semantic Role | Use For |
|-------|--------------|---------|
| `gold-500` | Primary / #1 / Win | Primary CTAs, rank #1 crown, achievements, Signature League |
| `cyan-400` | Secondary / #2 / On-chain | Rank #2 medal, Tapestry on-chain dot, secondary links |
| `emerald-400/500` | Success / #3 / Free | Rank #3 medal, free contests, positive outcomes, success toasts |
| `rose-400/500` | Danger | Destructive hover states (unfollow, delete) — never ambient |
| `gray-*` | Neutral / Inactive | Chrome, disabled states, secondary text, ghost actions |
| `amber-500` | Warm accent | Gradient pair with gold, never standalone |

**Never use purple/violet** — it reads as "AI slop" in crypto contexts.
**Never use color decoratively** — if you can't explain what a color *means* semantically, don't use it.

---

## Principle 3 — Primary Metrics Are the Visual Heroes

In any row or card, the primary metric (score, price, rank) must visually dominate everything else.

**Hierarchy formula for a leaderboard row:**
```
Rank indicator     → bold, colored (meaningful)
Avatar             → medium weight
Username           → font-semibold text-white
Tier/meta badges   → small, muted
Primary metric     → text-xl font-black text-white  ← HERO
Secondary action   → ghost/whisper  ← smallest
```

The eye should move left to right and land on the score.
If anything else draws the eye, it's wrong.

---

## Principle 4 — Repeated Actions Whisper

Any button or action that appears on every row in a list must be ghost-level styling. Solid-colored buttons on every row = visual noise that drowns the data.

**Rule:** The more times an action repeats in a view, the quieter its styling must be.

```
Primary CTA (once per page)  → gold solid button
Secondary action (once per card) → gray outlined or ghost
Tertiary action (every row)  → no border, no bg — just muted text
                                 border + bg appear only on hover
```

**Applied to:** Follow button on leaderboard rows — changed from teal outlined (`bg-cyan-500/10 border-cyan-500/30 text-cyan-400`) to borderless text (`border-transparent text-gray-500`). Border and background (`border-gray-600 bg-gray-800`) only appear on hover.

---

## Principle 5 — Destructive Actions Are Hidden Until Hover

Destructive affordances (unfollow, remove, delete) must not be visible by default. They appear on hover so the ambient state of the UI is always positive and encouraging.

```
Default:  [✓ Following]  ← text-gray-500, no background
Hover:    [− Unfollow]   ← text-rose-400, faint rose background
```

This keeps the UI feeling clean and avoids making the interface feel aggressive.

---

## Principle 6 — One Primary Action Per Context

Each card, section, and page has **one** primary action — styled with `bg-gold-500 text-gray-950`. Everything else is secondary or tertiary.

```
Page-level CTA:     bg-gold-500 (solid gold)        ← ONE per view
Card-level action:  bg-gold-500/10 text-gold-400     ← secondary
Row-level action:   border-gray-700 text-gray-400    ← tertiary
```

If two actions are fighting for attention with the same style, one of them is wrong.

---

## Principle 7 — No Gradient Backgrounds on Content Cards

Gradients live inside icons, badge fills, and decorative illustrations — not on card backgrounds.

```
✅ Good                                          ❌ Bad
bg-gray-900/50 border border-gray-800            bg-gradient-to-br from-emerald-900/30 to-gray-900
bg-gray-900 (flat, clean)                        bg-gradient-to-r from-gold-500/10 to-cyan-500/10
w-10 h-10 bg-gradient-to-br from-gold-500 ...   [full card] bg-gradient-to-br ...
```

The gradient inside a small icon or badge is a jewel. A gradient card background is wallpaper.

---

## Principle 8 — Hover Is a Reveal, Not a Repaint

Hover states should *reveal* information or slightly intensify — not completely repaint the element.

```
✅ Good hover                      ❌ Bad hover
border-gray-600 (was gray-700)     Goes from gray to bright cyan
text-gray-100 (was gray-400)       Background flashes to solid color
opacity 100% (was 70%)             Completely different visual style appears
```

Exception: Destructive hover (Principle 5) is intentionally a strong reveal, because it warns the user.

---

## Principle 9 — Subtle Animation Only

- Timing: 150–300ms `transition-all` or specific properties
- Animate: `opacity`, `border-color`, `text-color`, `background-color`
- Don't animate: layout, size, position (unless intentional and meaningful)
- No jarring color jumps — transitions should feel like breathing

---

## Principle 10 — Mobile First, Always

- Design at 375px first, then scale up
- Touch targets: minimum 44px height for anything tappable
- No hover-only states — every interaction must work with tap
- For actions on every row (like follow): `py-1` minimum in `sm` size, ensure adequate tap area on mobile

---

## Quick Decision Checklist

Before adding any new UI element, run through:

1. **Is this color semantic or decorative?** If decorative — remove it or use gray.
2. **Is this action repeated in a list?** If yes — ghost style, not outlined/solid.
3. **Is the primary metric the visual hero?** If not — reduce weight of competing elements.
4. **Does this card have a gradient background?** Move gradient inside an icon/badge instead.
5. **Is the destructive state visible by default?** Move it to hover-only.
6. **Is there more than one primary (gold) action visible?** One of them is wrong.
7. **Does it work at 375px with touch?** Test on mobile before calling done.

---

## Anti-Patterns We've Seen and Fixed

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| Cyan border on every follow button | Repeating color noise drowns the data | Ghost gray button |
| Gradient left-border on contest cards | Chrome color competes with content | Gray border, color only on type icon |
| Gold + gradient on card backgrounds | Background competes with content | Flat `bg-gray-900/50` |
| Reputation-tier color on Tapestry dot | Same user gets different dot color per tab (rank changes) | Fixed `text-cyan-400` |
| "Unfollow" always visible | Creates ambient negativity | Reveal on hover only |
| Two gold CTAs in one section | Eye doesn't know where to go | One gold CTA, others ghost |
