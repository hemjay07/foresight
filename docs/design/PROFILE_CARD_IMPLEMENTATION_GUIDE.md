# Profile Card Redesign: Implementation Playbook

**Goal:** Transform the profile card from a generic stats dashboard into a shareworthy game artifact.

**Current state:** Lines 48-298 in `frontend/src/components/ShareableProfileCard.tsx` (the `generateProfileCard` function).

---

## Part 1: Quick Decision Matrix

**Answer these 3 questions:**

1. **What's our user psychology priority?**
   - **Collection?** → Trading Card (users want to own rare cards)
   - **Competition?** → Battle Pass (users want to climb ranks)
   - **Commitment?** → Heatmap (users want to show consistency)
   - **Premium feeling?** → Oracle/Tarot (users want exclusivity)
   - **Data respect?** → Terminal (users respect hard metrics)

2. **What stops the CT scroll?**
   - Rarity/scarcity signals → Trading Card wins
   - Mystical/aesthetic appeal → Oracle wins
   - Data density/credibility → Terminal wins
   - Gamification → Battle Pass wins
   - Behavioral insight → Heatmap wins

3. **What fits our timeline?**
   - Fastest to implement (low complexity) → Oracle/Tarot
   - Medium (can parallelize with other work) → Trading Card, Terminal
   - Slowest (new data + UI) → Heatmap, Battle Pass

**Recommended:** Start with **Trading Card** (9/10 personality, medium complexity) because:
- Highest shareability
- Aligns with team formation card's success (visual metaphor = personality)
- Can be implemented in ~6 hours
- Rarity frame + holographic shimmer are distinct

---

## Part 2: Trading Card — Detailed Implementation

### 2a. Visual Specs

**Dimensions:**
```
Canvas: 480×480 (current, perfect)
Scaling: 2x for retina
Safe area: 24px margins (left/right)
```

**Color Palette (add to DESIGN_TOKENS.md):**
```javascript
// Rarity frame border width (px)
FRAME_WIDTH = 3;

// Holographic gradient colors (5 stops)
HOLO_COLORS = [
  '#F59E0B', // Gold
  '#06B6D4', // Cyan
  '#F59E0B', // Gold
  '#06B6D4', // Cyan
  '#F59E0B', // Gold
];

// Holo opacity progression
HOLO_OPACITY = [0.3, 0.8, 0.3, 0.8, 0.3];

// Tier-to-frame-color mapping (already have TIER.color)
FRAME_COLORS = {
  bronze: '#F97316',
  silver: '#D1D5DB',
  gold: '#FBBF24',
  platinum: '#22D3EE',
  diamond: '#F59E0B',
};

// Score box background (tier color + opacity)
SCORE_BOX_BG_OPACITY = 0.15;
```

### 2b. Layout Structure

**Step-by-step breakdown (keep existing structure, enhance):**

```
┌─ Header (24px top margin) ─────────────────────┐
│ ⚡ FORESIGHT          ct-foresight.xyz         │  [Keep as-is]
└────────────────────────────────────────────────┘

┌─ Holographic shimmer ─────────────────────────┐
│ [Gradient strip with 5-color animated gradient] │  [NEW: 4px tall]
└────────────────────────────────────────────────┘

┌─ Rarity Frame Card ───────────────────────────┐  [NEW: colored border]
│                                               │
│  [Avatar 44×44 centered]                      │
│                                               │
│  @username · Founding Member #18              │
│                                               │
│  ★ DIAMOND Tier · 1.58× Multiplier            │  [Badge row, same as before]
│                                               │
│  ┌─ Score Box (colored background) ──────┐   │  [MODIFIED: now has bg color]
│  │         1,135                         │   │
│  │    FORESIGHT SCORE                    │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░  All-Time #8              │  [NEW: progress bars]
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░  Season #2               │  [instead of text]
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  +1,135 this week       │
│                                               │
└───────────────────────────────────────────────┘

Tapestry · Solana verified
```

### 2c. Implementation Checklist

**Step 1: Add holographic shimmer (lines 111-112)**

```typescript
// Current:
ctx.fillRect(0, 0, W, 2);

// New: animated holographic strip (4px tall)
const holoGrad = ctx.createLinearGradient(0, 0, W, 0);
const holoStops = [
  { pos: 0.0, color: HOLO_COLORS[0], opacity: HOLO_OPACITY[0] },
  { pos: 0.25, color: HOLO_COLORS[1], opacity: HOLO_OPACITY[1] },
  { pos: 0.5, color: HOLO_COLORS[2], opacity: HOLO_OPACITY[2] },
  { pos: 0.75, color: HOLO_COLORS[3], opacity: HOLO_OPACITY[3] },
  { pos: 1.0, color: HOLO_COLORS[4], opacity: HOLO_OPACITY[4] },
];
holoStops.forEach(s => {
  holoGrad.addColorStop(s.pos, s.color + Math.round(s.opacity * 255).toString(16).padStart(2, '0'));
});
ctx.fillStyle = holoGrad;
ctx.fillRect(0, 0, W, 4); // Taller now
```

**Step 2: Add rarity frame border (new, after header)**

```typescript
// Draw thick colored border around main card content
const frameColor = FRAME_COLORS[data.tier] || FRAME_COLORS.bronze;
const frameX = 16;
const frameY = 50; // Below holographic + header
const frameW = W - 32;
const frameH = 340; // Rest of card height

// Outer frame (colored)
ctx.strokeStyle = frameColor;
ctx.lineWidth = FRAME_WIDTH;
rr(ctx, frameX, frameY, frameW, frameH, 12);
ctx.stroke();

// Optional: inner frame (subtle, tier color at low opacity)
ctx.strokeStyle = frameColor + '22';
ctx.lineWidth = 1;
rr(ctx, frameX + 2, frameY + 2, frameW - 4, frameH - 4, 10);
ctx.stroke();
```

**Step 3: Colored score box (modify lines 184-194)**

```typescript
// New: draw background for score box first
const scoreBoxX = W / 2 - 100;
const scoreBoxY = scoreY - 60;
const scoreBoxW = 200;
const scoreBoxH = 120;

// Colored background
const scoreBoxBgColor = FRAME_COLORS[data.tier] || FRAME_COLORS.bronze;
ctx.fillStyle = scoreBoxBgColor + '26'; // Hex opacity
rr(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 10);
ctx.fill();

// Border
ctx.strokeStyle = scoreBoxBgColor + '66';
ctx.lineWidth = 1.5;
rr(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 10);
ctx.stroke();

// Now draw score text (white, centered)
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#FFFFFF'; // White text on colored box
ctx.font = `bold 72px Inter, sans-serif`;
ctx.fillText(data.totalScore.toLocaleString(), W / 2, scoreY);

ctx.fillStyle = '#FFFFFF';
ctx.font = '10px Inter, sans-serif';
ctx.letterSpacing = '3px';
ctx.fillText('FORESIGHT SCORE', W / 2, scoreY + 48);
ctx.letterSpacing = '0px';
```

**Step 4: Progress bars (replace stats section, lines 252-280)**

```typescript
// Replace the 3-column grid with 3 progress bars
const barY = d2 + 50;
const barW = W - 48;
const barH = 18;
const barGap = 28;

const stats = [
  { label: 'All-Time', value: data.allTimeRank || 100, max: 100 },
  { label: 'Season', value: data.seasonRank || 100, max: 100 },
  { label: 'This Week', value: Math.min(data.weekScore, 5000), max: 5000 },
];

stats.forEach((stat, i) => {
  const y = barY + i * barGap;
  const progress = Math.max(0, Math.min(1, stat.value / stat.max));

  // Label
  ctx.fillStyle = MUTED;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(stat.label, 24, y + 4);

  // Background bar
  ctx.fillStyle = DIV;
  rr(ctx, 24 + 70, y - barH / 2, barW - 70, barH, 4);
  ctx.fill();

  // Progress bar
  const tier = TIER[data.tier as keyof typeof TIER] ?? TIER.bronze;
  ctx.fillStyle = tier.color;
  rr(ctx, 24 + 70, y - barH / 2, (barW - 70) * progress, barH, 4);
  ctx.fill();

  // Value text (right)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    stat.label === 'This Week' ? `+${stat.value.toLocaleString()}` : `#${stat.value}`,
    W - 24,
    y + 4
  );
};
```

### 2d. DOM Component Mirror

Update the preview component (lines 418-513) to match canvas:

```typescript
// Add holographic shimmer
<div className="h-1 bg-gradient-to-r from-gold-500 via-cyan-500 to-gold-500 opacity-60" />

// Add rarity frame
<div style={{
  border: `3px solid ${tierCfg.color}`,
  borderRadius: '12px',
  padding: '20px',
  margin: '8px 12px',
}}>
  {/* Avatar + name + tier (keep as before) */}
  {/* Score box with colored background */}
  <div style={{
    background: `${tierCfg.color}26`,
    border: `1px solid ${tierCfg.color}66`,
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '16px',
  }}>
    <div className="font-black text-6xl text-white">
      {data?.totalScore.toLocaleString() || '0'}
    </div>
    <div className="text-xs tracking-widest text-white mt-2 uppercase">Foresight Score</div>
  </div>

  {/* Progress bars instead of grid */}
  <div className="space-y-4">
    {[
      { label: 'All-Time', value: data?.allTimeRank, max: 100 },
      { label: 'Season', value: data?.seasonRank, max: 100 },
      { label: 'This Week', value: data?.weekScore, max: 5000 },
    ].map(stat => (
      <div key={stat.label} className="flex items-center gap-2">
        <div className="w-16 text-xs font-medium text-gray-400">{stat.label}</div>
        <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r"
            style={{
              width: `${(stat.value || 0) / stat.max * 100}%`,
              background: `linear-gradient(90deg, ${tierCfg.color}, ${tierCfg.color}dd)`,
            }}
          />
        </div>
        <div className="w-12 text-right text-xs font-bold text-white">
          #{stat.value || '—'}
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## Part 3: Testing Checklist

### Visual Tests
- [ ] Holographic shimmer renders (not just solid color)
- [ ] Rarity frame color matches tier
- [ ] Score box background is readable (white text on colored background)
- [ ] Progress bars animate smoothly (if using CSS animations)
- [ ] All text aligns properly (centered, justified)

### Canvas-to-DOM Parity
- [ ] Canvas PNG and React preview look identical
- [ ] Colors match exactly (use eyedropper tool)
- [ ] Text sizing matches (measure in browser dev tools)
- [ ] Border widths are consistent

### Twitter Shareability
- [ ] Download PNG from modal
- [ ] Attach to tweet and share
- [ ] Verify image quality on Twitter (retina 2x scale working)
- [ ] Test on both desktop and mobile share flows

### Edge Cases
- [ ] No avatar image → initials display properly
- [ ] Very long username → truncation works
- [ ] Rank = null → displays "—"
- [ ] New user with no stats → card still looks complete

---

## Part 4: Phased Rollout Strategy

### Phase 1 (Week 1): Core Changes
- [ ] Add holographic shimmer (4 hours)
- [ ] Add rarity frame (2 hours)
- [ ] Modify score box with color (1 hour)
- **Total: 7 hours**

**Acceptance criteria:**
- Canvas + DOM match visually
- All edge cases handle gracefully
- Twitter sharing works

### Phase 2 (Week 2): Progress Bars
- [ ] Replace stats grid with progress bars (3 hours)
- [ ] Add progress bar animations (CSS + Canvas) (1 hour)
- **Total: 4 hours**

**Acceptance criteria:**
- Progress accurately represents rank/score
- Animation is smooth (no jank)
- Mobile display is readable

### Phase 3 (Week 3): Polish & A/B Testing
- [ ] Screenshot comparisons (current vs. new)
- [ ] User testing (5-10 users, measure shareability)
- [ ] Iterate based on feedback
- **Total: 5 hours**

**Acceptance criteria:**
- ≥80% of testers prefer new design
- Share rate increases ≥20%

---

## Part 5: Success Metrics

**How to measure if this redesign works:**

1. **Shareability**
   - Before: X profile cards shared per day
   - After: X + 20% target
   - Track via unique image downloads

2. **Engagement**
   - Twitter impressions on cards (check X Analytics)
   - Screenshot retains / mentions

3. **Perceived Quality**
   - User comments: "card looks sick", "dope design"
   - Comparison with competitors (DraftKings, FanDuel)

4. **Retention**
   - Users who share a profile card have higher DAU
   - Frequency: how often do they re-generate cards?

---

## Part 6: Competitive Benchmarks

**For reference, what others do:**

| Platform | Card Style | Key Elements | URL |
|----------|-----------|--------------|-----|
| Sorare | Trading Card | Rarity border, gradient ring, tier badge | sorare.com/cards |
| DraftKings | Stats Dashboard | Grid layout, tier badge, multiplier | draftkings.com |
| FanDuel | Leaderboard | Rank + score, tier colors | fanduel.com |
| Axie Infinity | Battle Card | Rarity aura, stats bars, tier | axieinfinity.com |

**Takeaway:** Rarity borders + gradient rings (Sorare's approach) are proven converters.

---

## Part 7: Quick Reference — Files to Modify

```
frontend/src/components/ShareableProfileCard.tsx
├── Line 48: function generateProfileCard(data) → ADD holographic shimmer
├── Line 75-83: Color constants → ADD FRAME_COLORS, HOLO_COLORS
├── Line 104-111: Gold top accent → EXTEND to 4px, make holographic
├── Line 130-155: Avatar + name section → ADD rarity frame around
├── Line 183-194: Score display → WRAP in colored box
├── Line 252-280: Stats grid → REPLACE with progress bars
└── Line 418-513: React preview → MIRROR all changes

frontend/src/index.css
├── ADD: .profile-card-shimmer animation (if using CSS animation)
└── ADD: .progress-bar-fill animation (smooth width transition)

docs/design/DESIGN_TOKENS.md
├── ADD: Rarity frame color mapping
├── ADD: Holographic gradient stops
└── ADD: Progress bar dimensions
```

---

## Part 8: Decision Point

**Before building, decide:**

1. **Do we want all 3 changes (shimmer + frame + bars)?**
   - **Pro:** Highest visual impact, most "wow" factor
   - **Con:** Largest code changes, longest testing
   - **Recommended:** YES, phase it (Phase 1 + 2)

2. **Do we keep the stats grid as fallback?**
   - **Pro:** If progress bars break, we have a safety net
   - **Con:** Code complexity
   - **Recommended:** NO, just replace (we have time to test)

3. **Do we animate the holographic shimmer?**
   - **Pro:** Feels premium, draws eye
   - **Con:** Slight performance cost
   - **Recommended:** YES, very subtle (0.5% opacity shift over 3s)

4. **Do we A/B test this against current design?**
   - **Pro:** Data-driven decision, know impact before full rollout
   - **Con:** Logistics (need to track old vs. new)
   - **Recommended:** YES (5-10 target users, 1 week)

---

## Next: Approval & Timeline

**This document serves as:**
- ✅ Design specification
- ✅ Implementation guide
- ✅ Testing checklist
- ✅ Success criteria

**Share with user:** "Here's the Trading Card concept in detail. Ready to build?"

**Decision needed:**
1. Approve Trading Card concept (or pick different concept)
2. Decide on phased approach (just shimmer+frame vs. add progress bars)
3. Commit to timeline (7 hours Phase 1, then decide on Phase 2)

Once approved, we code Phase 1 in a single day.
