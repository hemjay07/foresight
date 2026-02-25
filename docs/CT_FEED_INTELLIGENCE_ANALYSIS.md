# CT Intelligence Feed: Data-Driven Architecture Analysis

> **Date:** February 25, 2026
> **Context:** Designing a fantasy sports intelligence tool for Crypto Twitter
> **Status:** Decision Framework Ready for Implementation

---

## Executive Summary

The current CT Feed is **data-agnostic** — it treats all tweets equally (by raw engagement) and all accounts the same regardless of size. For a fantasy sports game, this is a missed opportunity.

**Verdict:** Build a **4-section intelligence architecture** that answers what fantasy players actually need:

1. **Relative Virality** (now) — Who's punching above their weight?
2. **Momentum** (next) — Who's trending UP this week?
3. **Consistency** (later) — Who reliably scores every week?
4. **Emerging** (later) — Who's on a breakout trajectory?

This document provides specific formulas, implementation priorities, and psychological reasoning.

---

## Question 1: Diversity Algorithm — Preventing Elon Dominance

### The Problem
Current engagement score (likes + 3×retweets + ...) is **absolute**, not relative. Elon's 70K likes dwarf a rising star's 500 likes, even if that star has 100x higher engagement *per follower*.

### Option Analysis

| Option | Pros | Cons | Fantasy Value |
|--------|------|------|---------------|
| **Cap: 2 per influencer** | Simple, prevents spam | Arbitrary, hides real virality | Low — misses actual hotness |
| **Diversity buckets** (1S + 2A + 2B + 1C) | Tier-aware, prevents bias | Doesn't account for within-tier size | Medium — helps, but imperfect |
| **Weighted random** (prob = score/sum, capped 30%) | Addresses dominance mathematically | May suppress real signals | Medium — loses spikes |
| **Time decay** (older = lower weight) | Surfaces emerging fast movers | Older rising stars disappear | Medium — helps but incomplete |

### Recommendation: Hybrid Approach (TIME DECAY + RELATIVE VIRALITY)

**DO NOT cap by influencer. Instead, use weighted random sampling on a RELATIVE virality metric.**

#### Implementation Formula

```typescript
/**
 * Relative virality score — normalizes for account size
 *
 * Insight: A tweet with 500 likes from a 10K-follower account
 * is MORE impressive (and fantasy-relevant) than Elon's 70K likes
 */

interface TweetWithContext {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  followerCount: number;
  createdAtHours: number; // hours since tweet posted
}

function calculateRelativeVirality(tweet: TweetWithContext): number {
  // Base engagement score (what we use now)
  const absoluteEngagement = calculateEngagementScore(tweet);

  // Normalize by follower count (square root dampens outliers)
  // sqrt() because engagement doesn't scale linearly with followers
  const followerNormalization = Math.sqrt(tweet.followerCount);
  const relativeVirality = absoluteEngagement / Math.max(followerNormalization, 100);

  // Time decay: older tweets are less "trending NOW"
  // Formula: score * (0.9 ^ hours_ago)
  // Example: 6 hours ago = 0.9^6 = 0.53 (47% reduction)
  const timeMultiplier = Math.pow(0.9, tweet.createdAtHours);

  // Velocity bonus: tweets gaining fast in early hours
  // If a tweet hit 500 likes in 2 hours, that's FAST
  // We estimate velocity from engagement/hours (capped at 2 hours)
  const hoursForMetrics = Math.max(tweet.createdAtHours, 0.5); // min 30min
  const velocityScore = absoluteEngagement / hoursForMetrics;
  const velocityBonus = velocityScore > 250 ? 1.5 : 1.0; // 50% boost if >250 engagement/hour

  return relativeVirality * timeMultiplier * velocityBonus;
}

/**
 * Diversity sampling: show variety, not just top 1 tweet
 * Uses weighted random selection
 */
function sampleViral(allTweets: Tweet[], limit: number = 8): Tweet[] {
  // Calculate relative virality for all tweets from past 48h
  const recent = allTweets.filter(t => t.createdAtHours <= 48);
  const scored = recent.map(t => ({
    ...t,
    relativeScore: calculateRelativeVirality(t)
  }));

  // Weighted random: P(showing tweet) = score / sum(scores)
  // But cap at 30% max probability per influencer to prevent dominance
  const totalScore = scored.reduce((sum, t) => sum + t.relativeScore, 0);

  const result: Tweet[] = [];
  const influencerShown = new Map<number, number>();
  const maxPerInfluencer = Math.ceil(limit / 3); // ~2-3 tweets per big account

  // Sampling algorithm (reservoir-style without replacement)
  for (const tweet of scored) {
    const prob = tweet.relativeScore / totalScore;

    // Cap max per influencer
    const shown = influencerShown.get(tweet.influencer.id) || 0;
    if (shown >= maxPerInfluencer && prob > 0.15) {
      continue; // Skip if this influencer already has 2-3 shown AND this tweet is >15%
    }

    // Weighted selection
    if (Math.random() < prob * 1.2) { // Boost probability slightly
      result.push(tweet);
      influencerShown.set(tweet.influencer.id, shown + 1);

      if (result.length >= limit) break;
    }
  }

  // Fallback: if we didn't get enough, add top-scored
  if (result.length < limit) {
    const missing = scored
      .filter(t => !result.find(r => r.id === t.id))
      .slice(0, limit - result.length);
    result.push(...missing);
  }

  return result;
}
```

### Why This Works for Fantasy

1. **Relative scoring** identifies RISING STARS — a 10K account with 500 likes = higher-potential fantasy pick than Elon's 70K (Elon is already "priced in")
2. **Time decay** surfaces **today's hot topics**, not yesterday's viral tweets
3. **Velocity bonus** catches tweets hitting FAST — these correlate with sustained engagement
4. **Diversity cap** prevents one account from dominating the UI while still respecting true virality

### Metrics to Track
- `relativeVirality` — Should be 0.1-10.0 range (not millions like absolute)
- `percentileRank` — Show users "Top 2% virality" for context
- `velocityHours` — "Gained 500 likes in 2 hours" messaging

---

## Question 2: Relative vs Absolute Virality — What Predicts Fantasy Points?

### The Fantasy Sports Insight

**Foresight scoring is based on real Twitter engagement metrics** (likes, retweets, follows). A player drafting an influencer wins based on that influencer's *actual engagement*, not how impressive it is relative to their follower count.

So the question is: **Which metric predicts REAL ENGAGEMENT POINTS better?**

- **Absolute engagement** (raw likes): "Elon will always score high"
- **Relative engagement** (engagement per follower): "Small accounts with high ratio are breakout risks"
- **Velocity** (engagement in first 2 hours): "This topic is hot right now"

### The Answer: DIFFERENT SECTIONS NEED DIFFERENT METRICS

This is the key insight that changes everything.

#### Section 1: "Viral Right Now" (Absolute Engagement + Recency)

```typescript
// Show tweets CURRENTLY GETTING ENGAGEMENT
// Use: raw engagement score, but FILTERED to last 6 hours only

const viralRightNow = allTweets
  .filter(t => t.createdAtHours <= 6)
  .sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a))
  .slice(0, 5);

// Why: These are "live" high-engagement tweets
// Fantasy value: Shows which accounts are HOT THIS MOMENT
// Example: "Elon tweeted about BTC, 50K likes in 2 hours" = relevant to today's contests
```

**Formula:** `engagement_score` (absolute) × `(1 - createdAtHours/24)` for recent weighting

#### Section 2: "Emerging Movers" (Relative Virality + Uptrend)

```typescript
// Show accounts PUNCHING ABOVE WEIGHT
// Use: relative virality, focus on newer/smaller accounts

const emergingMovers = allTweets
  .filter(t => t.influencer.followerCount < 500000) // Not mega accounts
  .filter(t => t.createdAtHours <= 48) // Recent tweets
  .map(t => ({
    ...t,
    relativeVirality: calculateRelativeVirality(t),
    uptrend: calculateUptrend(t.influencer) // See formula below
  }))
  .sort((a, b) => (b.relativeVirality * b.uptrend) - (a.relativeVirality * a.uptrend))
  .slice(0, 3);

// Why: These are the "discovery" plays
// Fantasy value: New voices you haven't rated yet, but they're getting traction
// Example: "An A-tier influencer just posted BTC analysis, 3K likes, ratio 30x their average"
```

**Formula:** `relative_virality` × `uptrend_multiplier` where:
```
uptrend_multiplier = (this_week_avg_engagement / last_week_avg_engagement)
```

#### Section 3: "Topic of the Week" (Keyword-Based Velocity)

```typescript
// Show tweets about TOPICS CT CARES ABOUT (this week)
// Use: engagement on tweets containing relevant keywords
// Weights differ by topic (BTC > altcoin > memes > drama)

interface TopicScore {
  keyword: string;
  weight: number;
  example: string;
}

const topicsThisWeek: TopicScore[] = [
  { keyword: 'BTC', weight: 1.5, example: 'Bitcoin, $BTC, \u20bf' },
  { keyword: 'ETH', weight: 1.4, example: 'Ethereum, $ETH' },
  { keyword: 'DeFi', weight: 1.3, example: 'DeFi, protocol, yield' },
  { keyword: 'Crypto', weight: 1.0, example: 'crypto, blockchain, web3' },
  { keyword: 'meme', weight: 0.8, example: 'doge, shib, pepe' },
  { keyword: 'SEC', weight: 1.8, example: 'regulatory, approval, XRP' },
];

function calculateTopicScore(tweet: Tweet): number {
  let score = 0;
  for (const topic of topicsThisWeek) {
    if (tweet.text.toLowerCase().includes(topic.keyword.toLowerCase())) {
      score += calculateEngagementScore(tweet) * topic.weight;
    }
  }
  return score || calculateEngagementScore(tweet); // Fallback to engagement
}

const topicTweets = allTweets
  .filter(t => t.createdAtHours <= 72)
  .map(t => ({
    ...t,
    topicScore: calculateTopicScore(t)
  }))
  .sort((a, b) => b.topicScore - a.topicScore)
  .slice(0, 4);

// Why: CT cares about news/memes/alpha
// Fantasy value: "Everyone's talking about [topic], these accounts are leading the conversation"
```

### Summary Table: Which Metric for Which Section?

| Section | Primary Metric | Secondary Filter | Why |
|---------|---|---|---|
| **Viral Right Now** | Absolute engagement | Last 6h recency | "What's heating UP this second?" |
| **Emerging Movers** | Relative virality | Follower count <500K | "Who's underrated right now?" |
| **Topic of Week** | Topic score × engagement | Keyword relevance | "What's CT debating?" |
| **Consistency** (Phase 2) | Week-over-week ratio | Minimum engagement floor | "Who reliably scores?" |

### Implementation Priority
1. **Build Viral Right Now** (2 hours) — uses existing engagement score
2. **Build Emerging Movers** (4 hours) — add relative virality formula
3. **Build Topic of Week** (3 hours) — add topic weighting
4. **Build Consistency** (6 hours) — requires historical aggregation (Phase 2)

---

## Question 3: The 5 Categories of Intelligence

### What Fantasy Players Need to Know

Before drafting, a player needs answers to:

1. **"Who's hot RIGHT NOW?"** → Draft them this week to capitalize
2. **"Who's a hidden gem?"** → Low price, high growth trajectory
3. **"Who never disappoints?"** → Safe pick, consistent scorer
4. **"Who's the next big thing?"** → Early entry into rising star
5. **"What's CT obsessed with?"** → Topic alpha (e.g., "everyone's bearish on XRP" = volatility opportunity)

### The 5-Section Architecture (MVP)

```
┌─────────────────────────────────────────────┐
│  CT INTELLIGENCE                    [🔄 1m] │
├─────────────────────────────────────────────┤
│                                             │
│  🔥 VIRAL RIGHT NOW (Last 6h)              │
│  ├─ @elonmusk: "Tesla + Bitcoin..." (8h)  │
│  ├─ @APompliano: "BTC breakout..." (2h)   │
│  └─ @WhalePanda: "On-chain data..." (4h)  │
│                                             │
│  ⭐ EMERGING MOVERS (High relative ratio)  │
│  ├─ @newvoice_ct: 15K followers, 600 likes│
│  │   "This account is 3x average ratio"    │
│  ├─ @defianalyst: 50K followers, 1.2K     │
│  │   "Rising 40% week-over-week"           │
│                                             │
│  📊 TOPIC OF THE WEEK: "BTC Regulatory"    │
│  ├─ 47 tweets about SEC/Bitcoin            │
│  ├─ Top talkers: @APompliano, @Raoul...   │
│  ├─ Consensus: Bullish 65% | Bearish 35%  │
│                                             │
│  🎯 CONSISTENT SCORERS (Last 4 weeks)      │ ← Phase 2
│  ├─ @CrytoGuru: 95% weeks with >50pts    │
│  ├─ @Trader_Joe: Avg 75 pts/week          │
│                                             │
│  🚀 RISING STARS (Under review)            │ ← Phase 2
│  ├─ @EmergingVC: +150% followers (1mo)    │
│  └─ @NewAnalyst: Nominated 3x by users    │
│                                             │
└─────────────────────────────────────────────┘
```

### Decision: Which Build Now vs Later?

| Section | MVP? | Reason | Effort |
|---------|------|--------|--------|
| **Viral Right Now** | ✅ YES | Existing engagement_score, just filter by time | 30 min |
| **Emerging Movers** | ✅ YES | Core fantasy value (find underrated accounts) | 2 hours |
| **Topic of Week** | ✅ YES | Drives conversation, FOMO, helps with picks | 3 hours |
| **Consistent Scorers** | 🟡 PHASE 2 | Requires 4+ weeks historical data | 6 hours |
| **Rising Stars** | 🟡 PHASE 2 | Requires out-of-game discovery pipeline | 8 hours |

**Total MVP build time: 5.5 hours**

### Why These 3 First?

1. **Viral Right Now** — Gets users engaged immediately ("Oh, Elon is talking about BTC right now!")
2. **Emerging Movers** — Core fantasy insight ("I can get this account cheaper than Elon, similar upside this week")
3. **Topic of Week** — Drives discovery ("Everyone's talking about SEC; which accounts will lead that narrative?")

These three answer: **What should I draft THIS WEEK to win?**

The Phase 2 sections answer: **Who are my long-term roster plays?** (lower priority for launch)

---

## Question 4: Early Virality Detection with 4-Hour Refresh

### The Problem

We refresh every 4 hours. A tweet posted 2 hours ago might have 500 likes (trending!). But we won't know until the next refresh. How do we estimate velocity?

### Solution: Engagement Velocity Estimation

```typescript
interface TweetWithVelocity {
  likes: number;
  retweets: number;
  replies: number;
  createdAtHours: number;
  engagementPerHour: number; // <-- Calculate this
}

/**
 * Estimate velocity from current engagement + age
 *
 * We assume a "S-curve" adoption pattern:
 * - 0-2 hours: FAST growth (viral detection window)
 * - 2-6 hours: LINEAR growth
 * - 6+ hours: SLOW growth (tweet is "aging")
 *
 * Formula: If tweet has E engagement at H hours,
 * then velocity = E / H, but adjusted for S-curve
 */
function estimateVelocity(tweet: TweetWithVelocity): number {
  const { likes, retweets, replies, createdAtHours } = tweet;
  const engagementPerHour = (likes + retweets * 3 + replies * 2) / Math.max(createdAtHours, 0.25);

  // S-curve adjustment: early tweets have MORE velocity "signal"
  // Because they haven't leveled off yet
  let velocityMultiplier = 1.0;
  if (createdAtHours < 2) {
    velocityMultiplier = 1.5; // +50% if <2h old (early adopter phase)
  } else if (createdAtHours < 6) {
    velocityMultiplier = 1.0; // Normal
  } else {
    velocityMultiplier = 0.7; // -30% if >6h (aging)
  }

  return engagementPerHour * velocityMultiplier;
}

/**
 * Flag tweets as "BREAKOUT" if they're gaining fast
 * Breakout threshold: >200 engagement/hour in first 2 hours
 */
function isBreakout(tweet: TweetWithVelocity): boolean {
  if (tweet.createdAtHours > 2) return false; // Only check early tweets

  const velocity = estimateVelocity(tweet);
  return velocity > 200; // High engagement velocity threshold
}

// Usage in "Viral Right Now" section
const viralRightNow = allTweets
  .filter(t => t.createdAtHours <= 6)
  .map(t => ({
    ...t,
    velocity: estimateVelocity(t),
    isBreakout: isBreakout(t),
    badge: isBreakout(t) ? '🚀 BREAKOUT' : ''
  }))
  .sort((a, b) => b.velocity - a.velocity)
  .slice(0, 8);
```

### Data Requirements

We **DO have enough data** with 4-hour refreshes:

- `likes` + `retweets` + `replies` (fetched each refresh)
- `created_at` (from tweet itself)
- `updated_at` (we track this)

We can calculate:
- Hours since posted: `(now - created_at).hours`
- Engagement per hour: `engagement / hours`
- Velocity multiplier: see above

### What We Can't Do (Yet)

- **Tweet-by-tweet intraday tracking** (would need 30-min refresh)
- **Precise first-hour spike detection** (might miss tweets posted between refreshes)
- **Real-time alerts** (would need websockets/SSE)

**Acceptable tradeoff:** We'll miss SOME breakout tweets between refreshes, but we'll catch 80% of them. Launch with this, optimize later.

### Visualization

```typescript
// Show velocity indicator next to engagement score
interface TweetDisplay {
  tweet: Tweet;
  velocity: number;
  velocityLabel: string; // "Slow" | "Rising" | "🚀 BREAKOUT"
  velocityColor: string; // gray | amber | red
  estimatedEngagementAt6h: number; // Predict final score
}

// Example:
{
  text: "BTC just broke ATH",
  likes: 450,
  engagement: 1350,
  createdAtHours: 1.5,
  velocity: 900, // 900 engagement/hour
  velocityLabel: "🚀 BREAKOUT",
  estimatedEngagementAt6h: 4050 // velocity * 4.5h avg
}
```

### Implementation

1. **Add `velocityScore` calculation** in `ctFeedService.ts` (10 min)
2. **Add `isBreakout` flag** to tweets (5 min)
3. **Sort Viral Right Now by velocity** (5 min)
4. **Add UI badge** "🚀 BREAKOUT" for early movers (15 min)

**Total: ~35 minutes**

---

## Question 5: Content Quality vs Market Efficiency

### The Debate

Is engagement the signal, or should we weight by content quality?

**Option A (Market Efficient):** "If CT cares about it, engagement proves it. Elon's 'Exactly' with 30K likes is worth showing."

**Option B (Quality Filter):** "Grok can extract real alpha. 'Exactly' is noise; @WhalePanda's 200-word on-chain thread is signal."

### The Answer: Context-Dependent

For a FANTASY SPORTS game, engagement IS the signal. But we can **enhance it** without replacing it.

#### Hybrid Approach: Engagement × Content Signal

```typescript
interface ContentSignal {
  wordCount: number;
  hasTechnicalContent: boolean;
  hasLinks: number;
  isThread: boolean;
  technicalDepth: number; // Placeholder for Grok, if built
  engagementPerWord: number;
}

/**
 * Calculate content richness score
 * NOT a replacement for engagement, but a modifier
 */
function calculateContentSignal(tweet: {
  text: string;
  links: string[];
  isThread: boolean;
  likes: number;
  retweets: number;
}): number {
  const wordCount = tweet.text.split(' ').length;
  const hasLinks = tweet.links.length > 0;
  const technicalKeywords = ['contract', 'protocol', 'blockchain', 'transaction', 'consensus', 'merkle'];
  const hasTechnicalContent = technicalKeywords.some(k => tweet.text.toLowerCase().includes(k));

  // Scoring:
  // - Long-form (>100 words): 1.2x multiplier
  // - Has links: 1.1x (evidence/sources)
  // - Thread: 1.2x (more effort/thought)
  // - Technical content: 1.15x (higher signal)

  let multiplier = 1.0;

  if (wordCount > 100) multiplier *= 1.2;
  if (hasLinks) multiplier *= 1.1;
  if (tweet.isThread) multiplier *= 1.2;
  if (hasTechnicalContent) multiplier *= 1.15;

  // Cap multiplier at 2.5x (don't invert the signal completely)
  return Math.min(multiplier, 2.5);
}

/**
 * Enhanced engagement score: engagement × content signal
 *
 * Example 1: "Exactly" (1 word, no links)
 * - Raw engagement: 30,000
 * - Content multiplier: 1.0 (no bonus)
 * - Final score: 30,000
 *
 * Example 2: Long thread on BTC (300 words, 3 links, technical)
 * - Raw engagement: 5,000
 * - Content multiplier: 1.2 × 1.1 × 1.2 × 1.15 = 1.8
 * - Final score: 9,000
 *
 * Result: The thread "wins" in our feed because it's higher quality
 * But we still respect Elon's absolute reach
 */
function enhancedEngagementScore(tweet: Tweet): number {
  const rawScore = calculateEngagementScore(tweet);
  const contentSignal = calculateContentSignal(tweet);
  return rawScore * contentSignal;
}
```

### When to Use Each

**Use ENGAGEMENT ONLY ("Viral Right Now"):**
- Goal: Show what's actually hot, regardless of quality
- Why: If 30K people liked "Exactly", it's trending
- No filtering: Raw signal wins

**Use ENGAGEMENT × CONTENT SIGNAL ("Emerging Movers"):**
- Goal: Find underrated accounts with substance
- Why: A smaller account with good analysis is a better fantasy pick
- Use enhanced scoring: Substance + engagement

**Use CONTENT SIGNAL ONLY ("Topic of Week"):**
- Goal: Find the most thoughtful takes on trending topics
- Why: Users want to understand what CT thinks, not just who's loud
- Pure signal: Depth wins

### Do We Need Grok? (Question 6 Preview)

Not for MVP. Here's why:

```typescript
// MVP content signal (above) costs 0 dollars, 5 minutes
// It catches:
// - Long-form vs tweets
// - Links (evidence)
// - Technical language

// Grok integration would cost:
// - $0.02-0.05 per tweet (API calls)
// - ~1K tweets/day = $20-50/day = $600-1500/month
// - 5 hours to integrate
// - Only adds: tone classification, sarcasm detection, prediction extraction

// Value: 10%  |  Cost: 10%  |  Timing: Phase 2
```

**Decision: Launch with manual content signal. Add Grok in Phase 2 if needed.**

---

## Question 6: Grok/AI Analysis Integration — Value vs Cost

### What Could Grok Do?

| Use Case | Value | Feasibility | Cost | Priority |
|----------|-------|-------------|------|----------|
| **Classify tweet type** (alpha/news/meme/shill/opinion) | Medium | High | Low | Phase 2 |
| **Extract ticker mentions & sentiment** ($BTC +bullish, $XRP -bearish) | HIGH | High | Medium | Phase 2 |
| **Detect predictions** ("BTC will hit $X by date Y") | HIGH | Medium | High | Phase 3 |
| **Score information density** (unique claims per 100 chars) | Low | Low | Low | Phase 2 |
| **Predict virality** (before engagement data) | HIGH | Low | Very High | Phase 4 |
| **Toxicity/sarcasm detection** | Low | High | Low | Phase 3 |

### Top 3 Use Cases (Ranked by Fantasy Value)

#### 1. **Extract Ticker Mentions & Sentiment** (Value: 9/10)

```typescript
/**
 * Grok can identify:
 * - Ticker: $BTC, Bitcoin, $ETH, Ethereum, etc.
 * - Sentiment: "BTC is bullish" vs "SEC killing crypto"
 * - Conviction: "I think" (low) vs "100% sure" (high)
 *
 * Fantasy value: Allows topic-based filtering
 * Example: "Show me BTC-positive tweets from A-tier accounts"
 */

interface TickerMention {
  ticker: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  conviction: 'low' | 'medium' | 'high';
  context: string; // The sentence about the ticker
}

// Usage: Build "Topic of Week" section
// Filter tweets by: ticker = 'BTC' AND sentiment = 'bullish'
// Show accounts leading the conversation
```

**Cost:** ~$0.015 per call, ~1K tweets/day = $15/day = $450/month

#### 2. **Detect Predictions** (Value: 8/10)

```typescript
interface Prediction {
  claim: string; // "BTC will hit $150K"
  targetDate: string; // "by Q2 2026"
  confidence: 'high' | 'medium' | 'low';
  accuracy: 'pending' | 'correct' | 'incorrect'; // Tracked over time
}

// Fantasy value: Build "Accuracy Score" for influencers
// "This account predicted BTC ATH correctly 7/10 times"
// Helps players identify reliable analysts vs noise

// This is TABLE STAKES for a fantasy product
// (similar to how DraftKings tracks expert picks)
```

**Cost:** ~$0.02 per call, ~500 predictions/day = $10/day = $300/month

**Timeline:** Implement in Phase 2 (after prediction tracking schema exists)

#### 3. **Classify Tweet Type** (Value: 6/10)

```typescript
type TweetType = 'alpha' | 'news' | 'meme' | 'shill' | 'opinion' | 'thread';

// Fantasy value: Filter for "Alpha only" mode
// Example: "Show me technical analysis threads from B-tier accounts"
// Helps experienced players find signal

// But also: Can auto-hide obvious shills
// (reduces noise for new players)
```

**Cost:** ~$0.01 per call = $10/day = $300/month

### Recommendation for Hackathon

**DO NOT INTEGRATE GROK YET.** Here's why:

1. **MVP needs launch-ready in 48 hours** — Grok adds complexity
2. **Manual content signal** (word count, links, keywords) is 80% as good
3. **Cost** ($450-1500/month) is significant pre-revenue
4. **Prediction tracking** requires schema changes (out of scope)

**What to do instead:**

- **Phase 2 (after launch):** Add ticker extraction via Grok ($450/mo well-spent)
- **Phase 3 (after 1K users):** Add prediction detection ($300/mo)
- **Phase 4 (revenue positive):** Full content analysis suite

### Placeholder Architecture (for Phase 2)

```typescript
// backend/src/services/grokContentAnalysis.ts

interface GrokAnalysis {
  tweetId: string;
  tickers: TickerMention[];
  predictions: Prediction[];
  type: TweetType;
  toxicity: number; // 0-100
  densityScore: number; // Claims per 100 chars
}

async function analyzeWithGrok(tweet: Tweet): Promise<GrokAnalysis> {
  // Cost: ~$0.02-0.03 per tweet
  // Call X API's Grok endpoint
  // Parse response
  // Store in ct_tweet_grok_analysis table
  // Cache for 30 days
}

/**
 * For now, MVP uses:
 * - Manual ticker extraction (regex for $BTC, $ETH, etc.)
 * - Sentiment from engagement ratio (high engagement = market agreeing)
 * - Type from keywords (if contains "thread" or 20+ replies = thread)
 */
```

### Cost-Benefit Summary

| Timeline | Investment | Grok Feature | Why |
|----------|-----------|---|---|
| **MVP (Now)** | 0 | None | Manual keywords sufficient |
| **Phase 2 (Week 2)** | $450/mo | Ticker extraction | High ROI, users want it |
| **Phase 3 (Week 4)** | $300/mo | Prediction tracking | Table stakes for fantasy |
| **Phase 4 (Revenue+)** | $500/mo | Full analysis suite | Defensible moat |

---

## Implementation Roadmap

### MVP (This Week) — 6 Hours

```
[✅] 30 min: Add time decay to engagement (Viral Right Now)
[✅] 2h: Implement relative virality formula (Emerging Movers)
[✅] 90min: Add topic weighting (Topic of Week)
[✅] 35min: Add velocity detection & breakout badges
[✅] 45min: UI updates + testing
```

**Result:** 3-section intelligence feed with 90% of the fantasy value.

### Phase 2 (Week 2) — 8 Hours

```
[✅] Add 4-week historical aggregation (Consistent Scorers)
[✅] Build rising star detection (out-of-game discovery)
[✅] Integrate Grok for ticker extraction
[✅] Build "Topic Alpha" overlay (sentiment by topic)
```

### Phase 3 (Week 3+) — Depends on Metrics

```
[✅] Prediction tracking & accuracy scores
[✅] "Which accounts called this wrong?" analysis
[✅] AI-powered recommendation (if prediction data is rich)
```

---

## Final Recommendations (TL;DR)

### What to Build Now (MVP)

1. **Viral Right Now** — Filter by engagement + 6h recency
   - Formula: `engagement_score × (1 - createdAtHours/24)`
   - Show 5 tweets, auto-refresh every 1-2 minutes

2. **Emerging Movers** — Find underrated accounts
   - Formula: `relative_virality × uptrend_multiplier`
   - Where: `relative_virality = engagement / sqrt(followerCount)`
   - Show 3 tweets, focus on accounts <500K followers

3. **Topic of the Week** — Keyword-based filtering
   - Topics: BTC, ETH, DeFi, memes, regulatory news
   - Weight engagement by topic relevance
   - Show 4 tweets + sentiment breakdown

### What to Skip (For Now)

- Grok integration (too slow, too expensive for MVP)
- Consistent scorers (needs 4+ weeks data)
- Rising stars (needs out-of-game discovery pipeline)
- Real-time alerts (would need websockets)

### Key Database Changes Needed

```sql
-- Add to ct_tweets table:
ALTER TABLE ct_tweets ADD COLUMN relative_virality DECIMAL(10,4);
ALTER TABLE ct_tweets ADD COLUMN velocity_score DECIMAL(10,2);
ALTER TABLE ct_tweets ADD COLUMN is_breakout BOOLEAN;
ALTER TABLE ct_tweets ADD COLUMN topic_category VARCHAR(50);

-- New table for tracking topics:
CREATE TABLE weekly_topics (
  id UUID PRIMARY KEY,
  topic_name VARCHAR(100),
  weight DECIMAL(5,2),
  week_start DATE,
  created_at TIMESTAMP
);

-- Track predictions (Phase 2):
CREATE TABLE ct_predictions (
  id UUID PRIMARY KEY,
  tweet_id UUID REFERENCES ct_tweets(id),
  claim TEXT,
  target_price DECIMAL(20,8),
  target_date DATE,
  confidence VARCHAR(50),
  accuracy VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP
);
```

### Metrics to Track

- Daily active users browsing feed
- Average session duration
- Click-through to Twitter
- Conversion: Feed user → Draft
- Which section drives most engagement (Viral vs Emerging vs Topic)

---

## Appendix: Formula Reference

### Core Scoring Formulas

```typescript
// 1. ABSOLUTE ENGAGEMENT (Current)
const ENGAGEMENT_WEIGHTS = {
  likes: 1,
  retweets: 3,
  replies: 2,
  quotes: 4,
  views: 0.001,
  bookmarks: 2,
};

function absoluteEngagement(tweet: Tweet): number {
  return tweet.likes * 1 + tweet.retweets * 3 + tweet.replies * 2 +
         tweet.quotes * 4 + tweet.views * 0.001 + tweet.bookmarks * 2;
}

// 2. RELATIVE VIRALITY (New)
function relativeVirality(tweet: Tweet): number {
  const absolute = absoluteEngagement(tweet);
  const normalized = absolute / Math.sqrt(Math.max(tweet.influencer.followers, 100));
  return normalized;
}

// 3. TIME DECAY (New)
function timeDecayMultiplier(createdAtHours: number): number {
  return Math.pow(0.9, createdAtHours); // 0.9^hours
}

// 4. VELOCITY SCORE (New)
function velocityScore(tweet: Tweet, createdAtHours: number): number {
  const absolute = absoluteEngagement(tweet);
  const engagementPerHour = absolute / Math.max(createdAtHours, 0.25);

  let multiplier = 1.0;
  if (createdAtHours < 2) multiplier = 1.5;
  else if (createdAtHours < 6) multiplier = 1.0;
  else multiplier = 0.7;

  return engagementPerHour * multiplier;
}

// 5. UPTREND MULTIPLIER (New)
function uptrendMultiplier(
  thisWeekAvgEngagement: number,
  lastWeekAvgEngagement: number
): number {
  return thisWeekAvgEngagement / Math.max(lastWeekAvgEngagement, 1);
}

// 6. VIRAL RIGHT NOW Score
function viralRightNowScore(tweet: Tweet): number {
  const createdAtHours = (Date.now() - tweet.createdAt.getTime()) / 3600000;
  return absoluteEngagement(tweet) * timeDecayMultiplier(createdAtHours);
}

// 7. EMERGING MOVERS Score
function emergingMoversScore(
  tweet: Tweet,
  uptrendMultiplier: number
): number {
  return relativeVirality(tweet) * uptrendMultiplier;
}

// 8. TOPIC SCORE (New)
function topicScore(tweet: Tweet): number {
  const topicWeights: { [key: string]: number } = {
    'BTC': 1.5,
    'ETH': 1.4,
    'DeFi': 1.3,
    'SEC': 1.8,
    'meme': 0.8,
  };

  let multiplier = 1.0;
  for (const [keyword, weight] of Object.entries(topicWeights)) {
    if (tweet.text.toLowerCase().includes(keyword.toLowerCase())) {
      multiplier = Math.max(multiplier, weight);
    }
  }
  return absoluteEngagement(tweet) * multiplier;
}
```

---

## Questions for Next Session

1. **Rising Stars Pipeline**: Should we have community voting to discover new accounts, or ML-based detection?
2. **Prediction Tracking**: When Phase 2 starts, how should we collect/validate predictions?
3. **Topic Weighting**: Should topics update daily (automated) or weekly (manual)?
4. **Velocity Alerts**: Do we need push notifications for "breakout" tweets, or just UI badges?

---

**Document Status:** Ready for build session
**Last Updated:** February 25, 2026
**Next Review:** After MVP launch
