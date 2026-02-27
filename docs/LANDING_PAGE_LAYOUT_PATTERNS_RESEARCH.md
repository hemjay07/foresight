# Foresight Landing Page: Layout Patterns Research
## Competitive Analysis of DraftKings, Hyperliquid, Linear, Raycast, Vercel

**Research Date:** February 27, 2026
**Purpose:** Extract specific, actionable layout patterns to replace generic "How it Works" section
**Target:** Premium feel (Linear × Hyperliquid), gaming engagement (DraftKings × Sleeper)

---

## THE PROBLEM: CURRENT STATE ANALYSIS

### What's Working
- ✅ Hero section: Headline left, formation grid right (good visual balance)
- ✅ Contest panel: Clear data (prize, entry fee, countdown)
- ✅ Mini previews: Formation, score breakdown, leaderboard rows exist

### What's Broken (User Feedback + Screenshot Analysis)
1. **Dead space in left card** — Formation mini-preview leaves 40% of vertical space empty
2. **Placeholder aesthetics** — Mini-previews look like wireframes, not real data
3. **SaaS template vibe** — 3 equal-height cards with generic "how it works" flow
4. **Vertical spacing feels flat** — No visual rhythm; all sections equally weighted
5. **No emotional pull below fold** — Missing urgency, social proof, credibility signals
6. **Missing premium signals** — Monospace numbers, data density, real-time animation are absent

---

## PATTERN 1: THE ASYMMETRIC BENTO GRID (Linear Pattern)
**Source:** Linear.app landing page
**Why It Works:** Variable card heights + content type variation creates visual interest without feeling chaotic

### Structure
```
┌─────────────────────────────────────────┐
│  [TALL HERO CARD - 2 rows height]      │  Left column: 2x height
│         (main feature showcase)         │  Natural focal point
├──────────────────┬──────────────────────┤
│ [SHORT CARD 1]   │ [SHORT CARD 2]      │  Right column: 1x height each
│ (supporting)     │ (supporting)        │  Secondary info
└──────────────────┴──────────────────────┘

Grid Layout:
- Left:  1 column, 2 rows (tall)
- Right: 1 column, 2 rows stacked
- Ratio: 1.2fr | 1fr (60/40 split)
```

### CSS Implementation
```css
.bento-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;  /* 60-40 split */
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;  /* Stack on mobile */
  }
}

.card-hero {
  grid-row: span 2;  /* Tall card on left */
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Lots of internal content = fills tall space naturally */
  padding: 2rem;
  min-height: 400px;  /* Ensures visible tallness */
}

.card-supporting {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
  min-height: 180px;  /* Short cards */
}
```

### Psychological Why This Works
- **Asymmetry draws eye** — Tall card breaks grid monotony; brain expects 3 equal cards, gets surprised
- **Tall card = importance** — Formation grid (unique differentiator) gets maximum visual real estate
- **Right column (stacked) = supporting details** — Score + leaderboard are "see this too" info
- **No jarring transitions** — Content naturally fills tall card (formation + tier breakdown + budget)

### For Foresight: Formation Card (TALL LEFT)
```
┌─────────────────────────────────┐
│ [Badge: DRAFT]                  │
│ Build your formation             │  Header: badge + title
├─────────────────────────────────┤
│                                  │
│    [5-Player Formation Grid]     │  Hero content: animated on scroll
│                                  │
├─────────────────────────────────┤
│ [Tier availability breakdown]    │
│  S  A  B  C                      │  Context: what's available
│  4  16 30 50                     │
├─────────────────────────────────┤
│ • 150pt budget                   │
│ • Captain earns 2×               │  Key points in bulleted list
│ • Pick any tier combo            │
└─────────────────────────────────┘
```

---

## PATTERN 2: THE CARD VARIATION RULE (Raycast + Linear)
**Source:** Raycast.com, Linear.app
**Why It Works:** Three content types in three card styles prevents "3 identical boxes" trap

### The Three Card Types

#### Type A: Data-Dense Hero Card
- Lots of information packed in
- Complex visual elements (formation grid, bars, avatars)
- Tall height (280px+) allows breathing room
- Hero content area should be ~60% of card height; supporting info ~40%

```
.card-hero-dense {
  display: grid;
  grid-template-rows: auto 1fr auto;  /* Header, hero content, footer */

  /* Header: compact */
  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  /* Content: main visual takes most space */
  .card-content {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;  /* Formation grid space */
  }

  /* Footer: summary/supporting info */
  .card-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    display: grid;
    grid-template-columns: repeat(4, 1fr);  /* Tier breakdown */
  }
}
```

#### Type B: Single-Metric Card (Score Breakdown)
- ONE focused metric with visual breakdown
- Mid-height (200px)
- Supports list-based content (score categories with bars)
- Less visual weight than hero, more than supporting

```
.card-metric {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 200px;

  .card-header {
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .card-content {
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    /* Each metric gets equal space */
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;

      .metric-bar {
        flex: 1;
        height: 4px;
        background: var(--bg-elevated);
        border-radius: 2px;
        margin: 0 0.75rem;
        overflow: hidden;

        .metric-fill {
          height: 100%;
          background: var(--gold-500);
          border-radius: 2px;
          transition: width 200ms ease-out;
        }
      }
    }
  }
}
```

#### Type C: Leaderboard Card (List-Based)
- SAME height as Type B (visual pairing)
- Scrollable list inside card
- Minimal decoration; information is hero
- Rank badges + monospace numbers create hierarchy

```
.card-leaderboard {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 200px;

  .card-content {
    padding: 0.5rem 0;
    overflow-y: auto;
    max-height: 160px;

    .leaderboard-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1.5rem;

      &:hover {
        background: var(--bg-elevated);
      }

      .rank {
        font-mono;
        font-weight: 500;
        width: 24px;
        color: var(--text-muted);

        &[data-rank="1"] {
          color: var(--gold-400);
          font-weight: 600;
        }
      }

      .name {
        flex: 1;
        font-size: 0.875rem;
      }

      .score {
        font-mono;
        font-weight: 500;
        text-align: right;
        width: 60px;
      }
    }
  }
}
```

### Psychological Why This Works
- **Type variation mirrors information hierarchy** — Complex formation (hero), single-axis scoring (supporting), list-based comparison (supporting)
- **Same height for Types B + C** — Creates visual pairing; brain groups them as "secondary"
- **Tall Type A establishes focal point** — Asymmetry signals "this matters most"
- **List-based content (Type C) builds habit** — Users check leaderboard repeatedly; placement encourages engagement

---

## PATTERN 3: THE "LIVE DATA" AESTHETIC (Hyperliquid + DraftKings)
**Source:** Hyperliquid.xyz, DraftKings.com
**Why It Works:** Real/mock data preview makes product feel alive, not "coming soon"

### The Problem with Current Mini-Previews
- They look like wireframes (gray circles, placeholder bars)
- No personality; could be any app
- Doesn't demonstrate actual gameplay

### The Solution: Use Real Sample Data + Animate on Scroll
```tsx
// React component pattern
function MiniFormation({ animate = false, sampleTeam = SAMPLE_TEAM }) {
  return (
    <div className="formation-grid space-y-3">
      {/* Top: Captain with actual avatar + name */}
      <div className="flex justify-center">
        <PlayerCard
          name={sampleTeam[0].name}
          handle={sampleTeam[0].handle}
          tier="S"
          isCaptain={true}
          animate={animate}
          animationDelay={0}
        />
      </div>

      {/* Middle: A-tier pair */}
      <div className="flex justify-center gap-8">
        {sampleTeam.slice(1, 3).map((p, i) => (
          <PlayerCard
            key={p.handle}
            name={p.name}
            handle={p.handle}
            tier="A"
            animate={animate}
            animationDelay={100 * (i + 1)}
          />
        ))}
      </div>

      {/* Bottom: B/C tier pair */}
      <div className="flex justify-center gap-8">
        {sampleTeam.slice(3).map((p, i) => (
          <PlayerCard
            key={p.handle}
            name={p.name}
            handle={p.handle}
            tier={i === 0 ? 'B' : 'C'}
            animate={animate}
            animationDelay={300 + 100 * i}
          />
        ))}
      </div>

      {/* Stat bar: Budget */}
      <div className="budget-bar">
        <div className="budget-fill"
             style={{
               width: '88%',
               animation: animate ? 'slideIn 300ms ease-out' : 'none'
             }}
        />
      </div>
    </div>
  );
}

// Animation: Stagger on scroll-into-view
@keyframes slideIn {
  from { width: 0; }
  to { width: var(--target-width); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Sample Data Quality Standards
```typescript
// GOOD: Real-looking sample data
const SAMPLE_TEAM = [
  { handle: 'saylor', name: 'Saylor', tier: 'S', isCaptain: true },
  { handle: 'blknoiz06', name: 'Ansem', tier: 'A' },
  { handle: 'zachxbt', name: 'ZachXBT', tier: 'A' },
  { handle: 'Pentosh1', name: 'Pentoshi', tier: 'B' },
  { handle: 'CryptoKaleo', name: 'Kaleo', tier: 'C' },
];

// Scores that look realistic (not too perfect)
const SAMPLE_SCORES = {
  Activity: { pts: 32, pct: 91 },
  Engagement: { pts: 54, pct: 90 },
  Growth: { pts: 38, pct: 95 },
  Viral: { pts: 21, pct: 84 },
};
// Total: 145 pts (within expected daily range, not max)

// Leaderboard with mixed data
const SAMPLE_LEADERBOARD = [
  { rank: 1, name: 'Saylor', score: '847', isYou: false },
  { rank: 2, name: 'Ansem', score: '721', isYou: false },
  { rank: 3, name: 'you', score: '—', isYou: true },  // Placeholder for user
];
```

### Psychological Why This Works
- **Real data = real product** — Prototypes/wireframes feel hypothetical; actual data feels alive
- **Staggered animation on scroll** — Mimics real-time updates; reinforces "live" feeling
- **Sample data is aspirational** — Users see "Saylor is #1 with 847pts"; makes goal tangible
- **Monospace numbers** — Font treatment (JetBrains Mono) signals trading app / data-first product, not gaming app

---

## PATTERN 4: THE "HERO THEN SUPPORTING" CONTENT RHYTHM (Vercel Pattern)
**Source:** Vercel.com landing page structure
**Why It Works:** Sections below fold don't all feel equal; some sections lead, others support

### Section Hierarchy Pattern
```
SECTION 1: HERO (biggest, visual-heavy)
───────────────────────────────────────
  ┌─ Formation Grid ──┐
  │ 40% of viewport   │
  └───────────────────┘

SECTION 2: SUPPORTING FEATURES (asymmetric bento)
───────────────────────────────────────
  ┌─ Tall Card (Score) ┬─ Short Card (Leaderboard) ┐
  │ 60% content        │ 40% content              │
  └────────────────────┴──────────────────────────┘

SECTION 3: SOCIAL PROOF (wide, low visual weight)
───────────────────────────────────────
  "1,247 teams competing right now"
  [Activity feed of recent wins]

SECTION 4: CTA FINAL (medium prominence)
───────────────────────────────────────
  XP Tracking + Next Contest Countdown
```

### CSS Rhythm Pattern
```css
/* Hero: Maximum visual weight */
.section-hero {
  padding: 6rem 2rem;  /* Extra padding = importance */
  background: none;    /* No bg, cleaner */
}

/* Supporting: Medium weight */
.section-supporting {
  padding: 4rem 2rem;
  border-top: 1px solid var(--border);
}

/* Social proof: Low weight (gray text, minimal styling) */
.section-social-proof {
  padding: 3rem 2rem;
  background: var(--bg-elevated);  /* Subtle bg = less important */

  .proof-text {
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);  /* Gray, not white */
  }

  .proof-item {
    opacity: 0.6;  /* Reduced visual weight */
  }
}

/* CTA: Medium-high weight (needs action) */
.section-cta {
  padding: 3rem 2rem;
  background: linear-gradient(135deg, transparent, var(--gold-500/5%));  /* Subtle warmth */
}
```

### Psychological Why This Works
- **Padding variation = importance signaling** — More padding = "pay attention to this"
- **Horizontal lines (borders) = section breaks** — Cognitive reset; users know they're on new topic
- **Social proof section is subtle** — Credibility signal (1K+ teams) doesn't fight formation grid for attention
- **Gradient backdrop on CTA** — Subtle directional cue; gold color whispers "action required"

---

## PATTERN 5: THE "DATA AS NARRATIVE" APPROACH (DraftKings + Hyperliquid)
**Source:** DraftKings leaderboard, Hyperliquid price ticker
**Why It Works:** Data isn't presented as "look at this feature"; it's presented as "this is what's happening RIGHT NOW"

### Current Problem
- Mini-leaderboard shows Saylor #1, Ansem #2, you #?
- Feels static; no narrative

### Better Approach: Real-Time Simulation
```tsx
function LiveLeaderboard({ simulate = true }) {
  const [leaderboard, setLeaderboard] = useState(SAMPLE_LEADERBOARD);

  // Simulate score updates every 2 seconds
  useEffect(() => {
    if (!simulate) return;

    const interval = setInterval(() => {
      setLeaderboard(prev => prev.map(row => {
        if (row.rank === 1) {
          // #1 slowly climbing
          return { ...row, score: String(parseInt(row.score) + Math.random() * 5) };
        }
        return row;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [simulate]);

  return (
    <div className="space-y-1.5">
      {leaderboard.map((row, idx) => (
        <LeaderboardRow
          key={row.rank}
          {...row}
          highlight={row.isYou}
          animate={animate && idx < 2}  // Animate top 2 only
        />
      ))}
    </div>
  );
}
```

### Narrative Frame in Copy
Instead of:
> "Compete on the leaderboard"

Do:
> "See Saylor's 847 points climbing in real-time. Will you catch them?"

This transforms a feature into a narrative: **there's a race happening, live, and you can join**.

---

## PATTERN 6: THE VISUAL HIERARCHY THROUGH MONOSPACE (Axiom + Hyperliquid)
**Source:** Axiom.so, Hyperliquid.xyz
**Why It Works:** Font selection is a design decision that speaks subconsciously

### Current State Issue
- Mini-previews use regular Inter font for numbers
- Looks like "nice numbers," not "data to trust"

### Fix: JetBrains Mono for All Numeric Data
```tsx
function ScoreRow({ label, points, percentage }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-500/70"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* THIS IS KEY: font-mono makes numbers feel precise */}
        <span className="text-xs font-mono text-gold-400 tabular-nums">
          +{points}
        </span>
      </div>
    </div>
  );
}
```

### CSS Specification
```css
/* All numeric values */
.number-metric,
.score,
.rank,
.budget,
.price {
  font-family: 'JetBrains Mono', monospace;
  font-feature-settings: "tnum";  /* Tabular numbers = aligned columns */
}

/* Why tabular-nums matters:
   Without: 1 2 3 4 5  (1 is thinner, not aligned)
   With:    1 2 3 4 5  (all same width, perfect columns)
*/
```

### Psychological Why This Works
- **Monospace = technical credibility** — Font subconsciously signals "this data is precise"
- **Tabular alignment = scannable** — Eye can trace vertically; easier to compare numbers
- **Contrast to body text** — Using different font for numbers creates visual weight hierarchy automatically

---

## PATTERN 7: THE "NOTHING HIDDEN, EVERYTHING EARNED" SECTION (DraftKings Leaderboard)
**Source:** DraftKings leaderboard design
**Why It Works:** Shows what users will be able to do; builds confidence in product

### What This Means for Foresight
Instead of vague copy like:
> "Climb the leaderboard and win SOL"

Show an actual leaderboard with:
1. **Real rank ordering** — Saylor is clearly #1
2. **Real point totals** — Transparent scoring
3. **Prize visualization** — Show what prizes map to which ranks
4. **Your potential position** — "You are here" indicator

### Implementation Pattern
```tsx
function CompetitionPreview() {
  return (
    <div className="leaderboard-preview bg-gray-900 border border-gray-800 rounded-xl p-4">
      {/* Header: Prize pool is visible */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-mono text-gray-600 uppercase">Leaderboard</span>
        <span className="text-xs font-mono text-gold-400">Prize Pool: 5 SOL</span>
      </div>

      {/* Rankings with prize tiers */}
      <div className="space-y-1">
        {SAMPLE_LEADERBOARD.map(row => (
          <div
            key={row.rank}
            className={`flex items-center gap-2 p-2 rounded ${
              row.rank <= 3 ? 'bg-gray-800' : ''  // Highlight podium
            }`}
          >
            {/* Rank with medal emoji logic */}
            <span className="text-xs font-mono font-bold w-8">
              {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
            </span>
            <span className="text-xs text-gray-400">{row.name}</span>
            <span className="text-xs font-mono text-gray-300 ml-auto">{row.score}</span>
            {/* Prize earned for this position */}
            <span className="text-xs font-mono text-gold-400">
              {row.rank === 1 ? '+ 2.5 SOL' : row.rank === 2 ? '+ 1.5 SOL' : row.rank === 3 ? '+ 1 SOL' : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Psychological Why This Works
- **Transparency builds trust** — Seeing actual point totals and prizes = real product
- **Prize mapping is motivational** — "#1 gets 2.5 SOL" is tangible, not abstract
- **Emoji/medals add personality** — Subtle celebration without being garish
- **Your position placeholder** — Showing "you are here" reminds user they can compete immediately

---

## PATTERN 8: THE "SECTION BREATHING" RULE (Linear + Vercel)
**Source:** Linear.app, Vercel.com
**Why It Works:** Whitespace isn't empty; it's a design element that prevents visual fatigue

### Current Problem
```
[Hero] — 40% spacing
[Bento Grid] — 10% spacing (feels cramped)
[Social Proof] — 5% spacing (claustrophobic)
[CTA] — 15% spacing
```

### Better Approach
```css
.section {
  padding: 5rem 2rem;  /* 5rem = ~80px top/bottom */
  border-top: 1px solid var(--border);
}

.section:first-child {
  border-top: none;
  padding-top: 3rem;  /* Hero: less breathing room */
}

/* On mobile: reduce proportionally */
@media (max-width: 768px) {
  .section {
    padding: 2.5rem 1.5rem;
    border-top: none;  /* Remove borders on mobile, just space */
  }
}
```

### Psychological Why This Works
- **Vertical rhythm creates readability** — Brain processes content in "chunks" with clear separation
- **Reduces cognitive load** — Spacing = time to process, reset, move to next idea
- **Premium feel** — Extra whitespace signals confidence in design ("we don't need to cram")

---

## REVISED LANDING PAGE STRUCTURE (RECOMMENDED)

```
┌────────────────────────────────────────────────────┐
│ SECTION 1: HERO (unchanged)                        │
│ - Headline + Formation Grid (desktop)              │
│ - Contest Panel below                              │
│ Padding: 3rem top, 5rem bottom                     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ SECTION 2: "HOW IT WORKS" (REDESIGNED BENTO)      │
│                                                    │
│  ┌──────────────┬──────────────┐                   │
│  │ Formation    │ Score        │                   │
│  │ (tall, 2x)   │ Breakdown    │  Layout:         │
│  │              │ (short, 1x)  │  60% left        │
│  │              ├──────────────┤  40% right       │
│  │              │ Leaderboard  │                   │
│  │              │ (short, 1x)  │                   │
│  └──────────────┴──────────────┘                   │
│                                                    │
│ Content: Real sample data, monospace numbers      │
│ Animation: Stagger on scroll into view            │
│ Padding: 5rem top/bottom                          │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ SECTION 3: SOCIAL PROOF (LOW VISUAL WEIGHT)       │
│                                                    │
│   "1,247 teams competing this week"               │
│   [3-4 recent wins: Avatar + name + score]       │
│                                                    │
│ Padding: 3rem top/bottom                          │
│ Background: Subtle (bg-gray-950)                  │
│ Text: Gray-500 (muted)                            │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ SECTION 4: FINAL CTA (for logged-in users)        │
│                                                    │
│  ┌──────────────┬──────────────┐                   │
│  │ Your XP      │ Next Contest │                   │
│  │ Progress     │ Countdown    │                   │
│  └──────────────┴──────────────┘                   │
│                                                    │
│ Padding: 3rem top/bottom                          │
└────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Bento Grid Restructuring
- [ ] Wrap "How it Works" in asymmetric grid (60/40 left-right split)
- [ ] Move formation to left column (span 2 rows)
- [ ] Stack score + leaderboard on right (each 1 row)
- [ ] Ensure equal heights on right column cards
- [ ] Test mobile fallback (stack to 1 column)

### Phase 2: Data Quality + Animation
- [ ] Verify sample team data is realistic
- [ ] Verify sample scores sum to realistic daily total (~145 pts)
- [ ] Implement stagger animation on scroll-into-view (250ms delay between cards)
- [ ] Ensure monospace font (JetBrains Mono) on ALL numbers
- [ ] Use `tabular-nums` CSS feature for column alignment

### Phase 3: Visual Polish
- [ ] Formation card: Verify tier breakdown grid at bottom fills space nicely
- [ ] Score card: Ensure bars animate on scroll (300ms fill animation)
- [ ] Leaderboard card: Verify top 3 rows have subtle background (top 3 = podium)
- [ ] Add medal emoji (🥇🥈🥉) for ranks 1-3
- [ ] Test border colors: should all be `border-gray-800`, never gold

### Phase 4: Spacing Review
- [ ] Verify each section has 5rem padding (80px) top/bottom
- [ ] Verify section dividers are borders (`border-top: 1px solid var(--border)`)
- [ ] Verify mobile spacing is proportional (2.5rem instead of 5rem)
- [ ] Check that content doesn't feel claustrophobic on 1200px desktop

### Phase 5: Desktop + Mobile Verification
- [ ] Desktop (1920px): Bento grid renders correctly
- [ ] Tablet (768px): Bento grid adapts to 2-column-stacked
- [ ] Mobile (375px): All content stacks vertically, no overflow
- [ ] Touch targets: All interactive elements ≥ 44px tall

---

## SPECIFIC COPY RECOMMENDATIONS

### Formation Card Header
Current: "Build your formation"
Better: "Pick 5 CT influencers, manage your captain"
Why: More specific, action-oriented, highlights unique mechanic

### Score Card Header
Current: "Earn points daily"
Better: "Score 4 ways: Activity, Engagement, Growth, Viral"
Why: Transparent scoring model builds trust; shows complexity without overwhelming

### Leaderboard Card
Current: "Climb the leaderboard"
Better: "1st place: 2.5 SOL, 2nd: 1.5 SOL, 3rd: 1 SOL"
Why: Concrete prizes > vague climbing metaphor

### Social Proof Section
Current: (text box with counts)
Better: **"1,247 teams competing right now"** with recent activity feed
Why: FOMO + social proof combined; "competing right now" creates urgency

---

## SUMMARY: WHY THESE PATTERNS WIN

| Pattern | Why Foresight Benefits |
|---------|----------------------|
| **Asymmetric Bento** | Formation (unique differentiator) gets max space; supporting info doesn't compete |
| **Card Type Variation** | Prevents "3 equal boxes" SaaS template feel |
| **Live Data Aesthetic** | Sample data makes product feel real, not conceptual |
| **Hero → Supporting** | Section hierarchy prevents cognitive overload |
| **Data as Narrative** | Transforms "leaderboard feature" into "race happening now" |
| **Monospace Numbers** | Font treatment signals trading/data-first, not gaming/casual |
| **Section Breathing** | Whitespace = premium feel, not empty space |

---

## NEXT STEPS

1. **Review with user** — Approve layout structure before coding
2. **Take screenshot** — Current state (reference for before/after)
3. **Implement** — Phase 1-5 checklist (one phase per commit)
4. **Iterate** — Mobile testing, refinement loops
5. **Deploy** — Push to staging for live review

---

*Document created: February 27, 2026*
*Based on: DraftKings, Hyperliquid, Linear, Raycast, Vercel research*
*Status: Ready for implementation*
