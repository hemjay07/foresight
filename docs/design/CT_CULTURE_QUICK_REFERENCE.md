# CT Culture: Quick Reference (TL;DR)

> **For:** Designers, PMs, writers, anyone shipping to Foresight
> **Use:** Before every design decision, during code review, when you're unsure
> **Time to read:** 5 minutes

---

## The 3-Second Test

**Is this CT-native or cringe?**

Ask yourself:
1. Would a CT native use this without irony?
2. Could I defend this design on Twitter?
3. Does this respect intelligence or talk down?

If any answer is "no," redesign.

---

## The Palette (No Exceptions)

```
BACKGROUND:    #0A0A0F (almost black)
SURFACE:       #12121A (card bg)
TEXT PRIMARY:  #FAFAFA (off-white)
TEXT MUTED:    #A1A1AA (secondary info)

ACCENT PRIMARY:   #F59E0B (Gold, primary CTA, winning)
ACCENT SECONDARY: #06B6D4 (Cyan, #2, secondary actions)
REAL-TIME ONLY:   #10F981 (Neon green, live indicators)
SUCCESS:          #10B981 (Emerald, #3)
ERROR:            #F43F5E (Rose, destructive)

NEVER EVER:
- Purple / Violet (AI slop vibes)
- Pastels (consumer energy)
- Multi-color gradients (auto-generated)
- Bright greens except for real-time
- Light backgrounds (use dark)
```

---

## The Language (No Jargon)

```
WORDS THAT GET YOU MOCKED:
- Activate, leverage, engage (corporate)
- Blockchain, ecosystem, digital (vague)
- Fun, friendly, awesome (patronizing)
- Leverage, synergy (finance-bro)

WORDS THAT GET RESPECT:
- Influence, alpha, callout (CT native)
- Degen, rekt, based, signal (authentic)
- Earn, compete, draft (action)
- Skill, strategy, meritocratic (CT values)
```

---

## The Numbers Rule

**Every number in `font-mono` (JetBrains Mono or similar).**

```
WRONG: Your Score: 1,250
RIGHT: Your Score: 1250  (in monospace)

WRONG: Rank: 87th (serif font)
RIGHT: Rank: 87   (monospace, aligned right)
```

---

## The Density Rule

**Show 10+ rows without scrolling (if possible).**

```
WRONG (Whitespace):
┌──────────────┐
│              │
│ Score: 1,250 │
│              │
└──────────────┘

RIGHT (Dense):
┌─────────────────────────┐
│ Rank Name      Score    │
│ #1   @user1    1,500    │
│ #2   @user2    1,450    │
│ #3   @user3    1,420    │
│ ...  ...       ...      │
└─────────────────────────┘
```

---

## The Real-Time Rule

**Update every 30-60 seconds. Show "Last Updated X seconds ago."**

```
OLD:   Leaderboard updated 4 hours ago
NEW:   Updated now / Updated 23 seconds ago
```

---

## The Transparency Rule

**Show the formula, not the spin.**

```
WRONG: "You're in the top 10!"
RIGHT: "You're in the top 10% (234 of 2,340 players)
        Rank #234 | Score: 1,250"

WRONG: "Your score improved!"
RIGHT: "Activity: +12 | Engagement: +25 | Growth: +3 | Score: 1,250"
```

---

## The Mobile-First Rule

**Touch targets ≥44px. Bottom nav 4 items max.**

```
TOUCH TARGET HEIGHTS:
- Buttons: min 44px
- Rows: min 48px
- Links: min 44px

BOTTOM NAV (Sacred):
- Max 4 items (Home, Draft, Compete, Feed, Profile = 5 = TOO MANY)
- Always thumb-reachable
- Never hide items or use hamburger menu as primary nav
```

---

## The Gamification Rule

**Respect intelligence. Confetti only on major wins.**

```
WRONG: Confetti on every action
WRONG: "Nice work!" for scrolling through a list
WRONG: Luck-based mechanics
WRONG: Participation trophies

RIGHT: Leaderboards (skill-based)
RIGHT: Transparent scoring (math-based)
RIGHT: Earned achievements (real milestones)
RIGHT: Quiet, respectful feedback
```

---

## The Copy Rule

**1-3 words per button/CTA. Direct and native.**

```
WRONG: "Click here to activate your team"
RIGHT: "Draft"

WRONG: "Leverage your crypto portfolio ecosystem"
RIGHT: "Compete on influence metrics"

WRONG: "You've successfully engaged with the community!"
RIGHT: "Following @analyst (1 of 5)"
```

---

## The Badge Rule

**Visible, colored, and meaningful.**

```
S-Tier:  Gold (#F59E0B)     [★ S-Tier]
A-Tier:  Cyan (#06B6D4)     [★ A-Tier]
B-Tier:  Emerald (#10B981)  [★ B-Tier]
C-Tier:  Gray (#A1A1AA)     [★ C-Tier]

Never hide in small text. Should be obvious.
```

---

## The Anti-Patterns (DO NOT)

1. **Pastels** - Robinhood energy
2. **Whitespace** - Feels slow
3. **Try-hard humor** - "LFG! 🚀"
4. **Hidden data** - Show the formula
5. **Gradients on cards** - Use flat colors
6. **Asking for signup before value** - Show sample data first
7. **Too many notifications** - Only important alerts
8. **Inconsistent navigation** - Same 4 items everywhere
9. **Purple colors** - AI slop vibes
10. **Patronizing mechanics** - Confetti, "Awesome!", luck-based

---

## The Authenticity Checklist (30-Second Version)

- [ ] Dark background (black-ish)
- [ ] Numbers in monospace
- [ ] No pastels or purple
- [ ] Dense layout (10+ rows visible)
- [ ] Formulas transparent
- [ ] Native language (no corporate jargon)
- [ ] Real-time updates shown
- [ ] Mobile touch targets 44px+
- [ ] Bottom nav 4 items max
- [ ] Would a CT native use this?

---

## The Scoring Formula (Memorize This)

```
Weekly Score = Activity (0-35) + Engagement (0-60) + Growth (0-40) + Viral (0-25)

ACTIVITY:
- 1.5 pts per tweet
- Cap: 35 (prevents spam)
- Meaning: Consistency matters, not volume

ENGAGEMENT:
- sqrt(weighted_engagement) × 1.5
- Weights: replies 3x, retweets 2x, likes 1x
- Cap: 60
- Meaning: Quality discourse > passive consumption

GROWTH:
- 1 pt per 2K followers + 5 pts per 1% growth
- Cap: 40
- Meaning: Both absolute (real people) and relative (momentum)

VIRAL:
- 4-12 pts per ultra-high-engagement tweet
- Cap: 25
- Meaning: Identify breakout moments, not just baseline

CAPTAIN: 1.5x multiplier (strategic, mathematical)
SPOTLIGHT: 12/8/4 pts (community voting)
```

---

## The 5 Archetypes (Know These)

1. **Analyst** (Safe) - Consistent, credible, 15-25 pts/week
2. **Rising Star** (Risk) - Low followers, explosive growth, volatile
3. **Specialist** (Contrarian) - Niche expertise, cult following, non-correlated
4. **Trader** (Volatile) - High followers, correlated with market, unpredictable
5. **Narrative Driver** (Thought Leader) - Sets conversation, 30-50 pts/week

**Design Signal:** Show different archetypes, help users understand draft strategy.

---

## The Share Triggers (Why People Post About Foresight)

1. **Vindication** - "Drafted them at 2K followers, now 50K"
2. **Upset Victory** - "Beat the mega-followings with unknowns"
3. **Meme Victory** - "Drafted ironically, somehow winning"
4. **Callout** - "Overrated influencer, my team beat yours"
5. **Discovery** - "Everyone sleeping on @hidden_gem"
6. **Meta Commentary** - "Foresight meta: Solo builders > VC founders"

**Design Signal:** Make sharing easy, show the right context, make results visually compelling.

---

## Decision Tree: Is This OK to Ship?

```
Question: Does this have CT energy?
├─ Is it dark themed?
│  └─ No? REDESIGN
├─ Is it dense or whitespace-heavy?
│  └─ Whitespace? REDESIGN
├─ Are numbers in monospace?
│  └─ No? FIX
├─ Is the language direct and native?
│  └─ Corporate or jargon? REWRITE
├─ Could a CT native understand it in 5 seconds?
│  └─ No? SIMPLIFY
├─ Is any data hidden or obscured?
│  └─ Yes? EXPOSE IT
├─ Would I defend this on Twitter?
│  └─ No? REDESIGN
└─ SHIP IT
```

---

## When You're Unsure

1. Read `/Users/mujeeb/foresight/docs/design/CT_CULTURE.md` (full guide)
2. Look at Hyperliquid or Phantom (reference products)
3. Ask yourself: "Is this respecting intelligence?"
4. Run the 3-second test above
5. Ask for design review if still unsure

---

## Slack/Discord Shorthand

When reviewing design:
- **"More density"** = Too much whitespace, compact it
- **"Show the formula"** = Data is hidden, expose it
- **"CT energy?"** = Does this feel native or corporate?
- **"Monospace that number"** = Use `font-mono` for stats
- **"Transparency win"** = We're showing the data, good call
- **"Respect the user"** = Stop talking down
- **"Ship it"** = This is CT-native and ready

---

**Last Updated:** February 27, 2026
