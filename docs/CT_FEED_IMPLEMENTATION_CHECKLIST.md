# CT Feed Intelligence: Implementation Checklist

> **Deliverable Date:** Feb 26-27, 2026
> **Time Budget:** 6 hours for MVP
> **Status:** Ready to code

---

## Phase 1: Add Formulas to Backend (2.5 hours)

### 1.1 Update ctFeedService.ts — Add New Scoring Functions (1h)

File: `/Users/mujeeb/foresight/backend/src/services/ctFeedService.ts`

```typescript
// ADD THESE FUNCTIONS after calculateEngagementScore()

/**
 * Relative virality: engagement per follower
 * Higher = more impressive for account size
 */
export function calculateRelativeVirality(tweet: {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  followerCount: number;
}): number {
  const absoluteEngagement = calculateEngagementScore(tweet);
  const normalized = absoluteEngagement / Math.sqrt(Math.max(tweet.followerCount, 100));
  return Math.round(normalized * 100) / 100; // Round to 2 decimals
}

/**
 * Velocity score: engagement per hour since posted
 * Higher = breaking out right now
 */
export function calculateVelocityScore(tweet: {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  createdAtHours: number;
}): number {
  const absoluteEngagement = calculateEngagementScore(tweet);
  const engagementPerHour = absoluteEngagement / Math.max(tweet.createdAtHours, 0.25);

  let multiplier = 1.0;
  if (tweet.createdAtHours < 2) multiplier = 1.5;
  else if (tweet.createdAtHours < 6) multiplier = 1.0;
  else multiplier = 0.7;

  return Math.round(engagementPerHour * multiplier * 100) / 100;
}

/**
 * Check if tweet is "breaking out" (early viral detection)
 */
export function isBreakout(tweet: {
  createdAtHours: number;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
}): boolean {
  if (tweet.createdAtHours > 2) return false;
  const velocity = calculateVelocityScore(tweet);
  return velocity > 200;
}

/**
 * Topic detection: which crypto topic is this about?
 */
export function detectTopic(text: string): string | null {
  const topics = [
    { keyword: /\$?BTC|bitcoin/i, topic: 'BTC' },
    { keyword: /\$?ETH|ethereum/i, topic: 'ETH' },
    { keyword: /defi|protocol|yield/i, topic: 'DeFi' },
    { keyword: /sec|regulatory|xrp|approval/i, topic: 'Regulatory' },
    { keyword: /doge|shib|pepe|meme|coin/i, topic: 'Memes' },
  ];

  for (const { keyword, topic } of topics) {
    if (keyword.test(text)) return topic;
  }

  return null;
}
```

**Changes to getFeed() function:**

```typescript
// Inside getFeed(), after getting rows, add these fields:
const tweets: Tweet[] = rows.map((row) => {
  const createdAtHours = (Date.now() - new Date(row.created_at).getTime()) / 3600000;

  return {
    // ... existing fields ...
    engagementScore: Number(row.engagement_score),
    twitterUrl: `https://twitter.com/${row.twitter_handle}/status/${row.tweet_id}`,
    // NEW FIELDS:
    relativeVirality: calculateRelativeVirality({
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      quotes: row.quotes,
      views: row.views,
      bookmarks: row.bookmarks,
      followerCount: row.follower_count, // Need to add to JOIN
    }),
    velocityScore: calculateVelocityScore({
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      quotes: row.quotes,
      views: row.views,
      bookmarks: row.bookmarks,
      createdAtHours,
    }),
    isBreakout: isBreakout({
      createdAtHours,
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      quotes: row.quotes,
      views: row.views,
      bookmarks: row.bookmarks,
    }),
    topic: detectTopic(row.text),
    createdAtHours,
  };
});
```

**Update TypeScript interface:**

```typescript
export interface Tweet {
  // ... existing fields ...
  relativeVirality: number; // NEW
  velocityScore: number; // NEW
  isBreakout: boolean; // NEW
  topic: string | null; // NEW
  createdAtHours: number; // NEW
}
```

**Tests to write (5 test cases):**
```typescript
// In backend/tests/services/ctFeedService.test.ts

describe('CTFeedService scoring', () => {
  it('should calculate relative virality correctly', () => {
    const tweet = {
      likes: 500,
      retweets: 100,
      replies: 50,
      quotes: 10,
      views: 5000,
      bookmarks: 50,
      followerCount: 10000,
    };
    const score = calculateRelativeVirality(tweet);
    expect(score).toBeGreaterThan(0);
  });

  it('should mark tweet as breakout if velocity > 200 and <2h old', () => {
    const tweet = {
      likes: 500,
      retweets: 100,
      replies: 50,
      quotes: 10,
      views: 5000,
      bookmarks: 50,
      createdAtHours: 1,
    };
    expect(isBreakout(tweet)).toBe(true);
  });

  it('should detect BTC topic', () => {
    expect(detectTopic('$BTC is going up')).toBe('BTC');
    expect(detectTopic('Bitcoin pump incoming')).toBe('BTC');
  });

  it('should detect ETH topic', () => {
    expect(detectTopic('Ethereum staking is bullish')).toBe('ETH');
  });

  it('should return null for unknown topic', () => {
    expect(detectTopic('just posting some random stuff')).toBeNull();
  });
});
```

**Checklist:**
- [ ] Add relative virality function
- [ ] Add velocity score function
- [ ] Add isBreakout function
- [ ] Add detectTopic function
- [ ] Update Tweet interface
- [ ] Update getFeed() to populate new fields
- [ ] Add test cases (5)
- [ ] Run tests: `cd backend && pnpm test`

---

### 1.2 Add Three New API Endpoints (1.5h)

File: `/Users/mujeeb/foresight/backend/src/api/ctFeed.ts` (or create if doesn't exist)

```typescript
import { Router, Request, Response } from 'express';
import * as ctFeedService from '../services/ctFeedService';

const router = Router();

/**
 * GET /api/ct-feed/viral-now
 * Tweets trending RIGHT NOW (last 6h)
 * Sorted by: raw engagement × time decay
 */
router.get('/viral-now', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    const allTweets = await ctFeedService.getFeed({ limit: 100, offset: 0 });

    // Filter to last 6 hours
    const recent = allTweets.tweets.filter(t => t.createdAtHours <= 6);

    // Sort by: raw engagement × time decay
    // Earlier tweets get dampened slightly (1 - hours/24)
    const viral = recent
      .sort((a, b) => {
        const decayA = 1 - Math.min(a.createdAtHours / 24, 0.5);
        const decayB = 1 - Math.min(b.createdAtHours / 24, 0.5);
        const scoreA = a.engagementScore * decayA;
        const scoreB = b.engagementScore * decayB;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    res.json({ success: true, data: { tweets: viral } });
  } catch (error) {
    console.error('[CTFeed] Error getting viral tweets:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/ct-feed/emerging
 * Accounts punching above their weight
 * Sorted by: relative virality × uptrend
 */
router.get('/emerging', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 3, 20);

    const allTweets = await ctFeedService.getFeed({ limit: 100, offset: 0 });

    // Filter: <500K followers, last 48h
    const candidates = allTweets.tweets.filter(
      t => t.createdAtHours <= 48 && t.influencer.followerCount < 500000
    );

    // Sort by relative virality (already calculated)
    const emerging = candidates
      .sort((a, b) => (b.relativeVirality || 0) - (a.relativeVirality || 0))
      .slice(0, limit);

    res.json({ success: true, data: { tweets: emerging } });
  } catch (error) {
    console.error('[CTFeed] Error getting emerging tweets:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/ct-feed/topic
 * Tweets about specific topic
 * ?topic=BTC|ETH|DeFi|Regulatory|Memes
 */
router.get('/topic', async (req: Request, res: Response) => {
  try {
    const topic = (req.query.topic as string) || 'BTC';
    const limit = Math.min(parseInt(req.query.limit as string) || 4, 20);

    const allTweets = await ctFeedService.getFeed({ limit: 100, offset: 0 });

    // Filter by topic, last 72h
    const byTopic = allTweets.tweets
      .filter(t => t.createdAtHours <= 72 && t.topic === topic)
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        topic,
        tweets: byTopic,
        count: byTopic.length,
      },
    });
  } catch (error) {
    console.error('[CTFeed] Error getting topic tweets:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
```

**Mount in main API file:**

```typescript
// In backend/src/api/index.ts or main.ts
import ctFeedRouter from './ctFeed';

app.use('/api/ct-feed', ctFeedRouter);
```

**API Tests:**

```typescript
// In backend/tests/api/ctFeed.test.ts

describe('CT Feed API', () => {
  it('GET /api/ct-feed/viral-now should return tweets from last 6h', async () => {
    const res = await request(app).get('/api/ct-feed/viral-now');
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tweets)).toBe(true);
  });

  it('GET /api/ct-feed/emerging should filter by follower count', async () => {
    const res = await request(app).get('/api/ct-feed/emerging');
    expect(res.body.success).toBe(true);
    res.body.data.tweets.forEach((t: any) => {
      expect(t.influencer.followerCount).toBeLessThan(500000);
    });
  });

  it('GET /api/ct-feed/topic?topic=BTC should filter by topic', async () => {
    const res = await request(app).get('/api/ct-feed/topic?topic=BTC');
    expect(res.body.success).toBe(true);
    expect(res.body.data.topic).toBe('BTC');
  });
});
```

**Checklist:**
- [ ] Create/update ctFeed.ts route file
- [ ] Implement /viral-now endpoint
- [ ] Implement /emerging endpoint
- [ ] Implement /topic endpoint
- [ ] Mount router in main API file
- [ ] Write API tests (3)
- [ ] Test locally: `curl http://localhost:3001/api/ct-feed/viral-now`

---

## Phase 2: Update Frontend (2.5 hours)

### 2.1 Create Intelligence Feed Component (1.5h)

File: `/Users/mujeeb/foresight/frontend/src/components/CTIntelligenceFeed.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, Hash } from 'lucide-react';
import { api } from '../config/api';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface Tweet {
  id: string;
  text: string;
  likes: number;
  retweets: number;
  engagementScore: number;
  relativeVirality: number;
  velocityScore: number;
  isBreakout: boolean;
  topic: string | null;
  createdAtHours: number;
  influencer: {
    id: number;
    handle: string;
    name: string;
    avatar: string;
    tier: string;
    followerCount: number;
  };
  twitterUrl: string;
}

const CTIntelligenceFeed: React.FC = () => {
  const [viralTweets, setViralTweets] = useState<Tweet[]>([]);
  const [emergingTweets, setEmergingTweets] = useState<Tweet[]>([]);
  const [topicTweets, setTopicTweets] = useState<Tweet[]>([]);
  const [topic, setTopic] = useState('BTC');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 60000); // Refresh every 1 min
    return () => clearInterval(interval);
  }, [topic]);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const [viralRes, emergingRes, topicRes] = await Promise.all([
        api.get('/ct-feed/viral-now?limit=5'),
        api.get('/ct-feed/emerging?limit=3'),
        api.get(`/ct-feed/topic?topic=${topic}&limit=4`),
      ]);

      setViralTweets(viralRes.data.tweets);
      setEmergingTweets(emergingRes.data.tweets);
      setTopicTweets(topicRes.data.tweets);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return '<1h ago';
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  const TweetRow: React.FC<{ tweet: Tweet; badge?: string }> = ({ tweet, badge }) => (
    <div className="border-b border-gray-800 last:border-b-0 p-4 hover:bg-gray-900/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img
          src={tweet.influencer.avatar}
          alt={tweet.influencer.name}
          className="w-10 h-10 rounded-full"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-white">
              {tweet.influencer.name}
            </span>
            <span className="text-gray-500 text-sm">@{tweet.influencer.handle}</span>
            <Badge variant={getTierVariant(tweet.influencer.tier)}>
              {tweet.influencer.tier}
            </Badge>
            {tweet.isBreakout && (
              <span className="text-red-500 text-xs font-bold">🚀 BREAKOUT</span>
            )}
            {badge && <span className="text-xs text-amber-500">{badge}</span>}
          </div>

          <p className="text-gray-100 text-sm mb-2 line-clamp-2">{tweet.text}</p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>❤️ {tweet.likes.toLocaleString()}</span>
            <span>🔄 {tweet.retweets.toLocaleString()}</span>
            <span>{formatTime(tweet.createdAtHours)}</span>
            <a
              href={tweet.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400 ml-auto"
            >
              View on X →
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const getTierVariant = (tier: string) => {
    switch (tier) {
      case 'S':
        return 's-tier';
      case 'A':
        return 'a-tier';
      case 'B':
        return 'b-tier';
      default:
        return 'c-tier';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Hash className="w-5 h-5 text-amber-500" />
          CT Intelligence
        </h2>
        <span className="text-xs text-gray-500">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* Viral Right Now */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Viral Right Now (Last 6h)
          </h3>
        </div>
        {viralTweets.length ? (
          <div>
            {viralTweets.map((tweet) => (
              <TweetRow key={tweet.id} tweet={tweet} badge="🔥 Trending" />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            No viral tweets in the last 6 hours
          </div>
        )}
      </Card>

      {/* Emerging Movers */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Emerging Movers (Hidden Gems)
          </h3>
        </div>
        {emergingTweets.length ? (
          <div>
            {emergingTweets.map((tweet) => (
              <TweetRow
                key={tweet.id}
                tweet={tweet}
                badge={`Ratio: ${tweet.relativeVirality.toFixed(2)}x`}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            No emerging tweets found
          </div>
        )}
      </Card>

      {/* Topic of the Week */}
      <Card>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-white">📊 Topic of the Week</h3>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="BTC">Bitcoin</option>
            <option value="ETH">Ethereum</option>
            <option value="DeFi">DeFi</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Memes">Memes</option>
          </select>
        </div>
        {topicTweets.length ? (
          <div>
            {topicTweets.map((tweet) => (
              <TweetRow key={tweet.id} tweet={tweet} badge={topic} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            No tweets about {topic} in the last 72 hours
          </div>
        )}
      </Card>
    </div>
  );
};

export default CTIntelligenceFeed;
```

**Checklist:**
- [ ] Create CTIntelligenceFeed component
- [ ] Add Flame, TrendingUp icons (via lucide-react)
- [ ] Fetch from 3 new endpoints
- [ ] Display in 3 card sections
- [ ] Add auto-refresh (1 min)
- [ ] Style with gold/dark theme
- [ ] Test responsiveness on mobile (375px)

---

### 2.2 Update Feed Page (1h)

File: `/Users/mujeeb/foresight/frontend/src/pages/Feed.tsx`

```typescript
// Replace old CTFeed with new CTIntelligenceFeed

import React from 'react';
import CTIntelligenceFeed from '../components/CTIntelligenceFeed';
import { useAuth } from '../hooks/useAuth';

const FeedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CT Intelligence</h1>
          <p className="text-gray-400 text-sm">
            Real-time insights from Crypto Twitter's top voices. Use this to decide which accounts
            to draft.
          </p>
        </div>

        {/* Main Feed */}
        <CTIntelligenceFeed />

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800 text-xs text-gray-400">
          <p>
            <strong>How to use this:</strong> Look for accounts trending right now (Viral Right Now),
            accounts outperforming their follower count (Emerging Movers), and conversations happening
            across CT (Topic of the Week). These are your best fantasy picks this week.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
```

**Checklist:**
- [ ] Replace old Feed page content with CTIntelligenceFeed
- [ ] Add helpful header text
- [ ] Add usage guidance footer
- [ ] Test on mobile (375px width)
- [ ] Verify dark theme consistency

---

### 2.3 Update API Client (15 min)

File: `/Users/mujeeb/foresight/frontend/src/config/api.ts`

Make sure these endpoints exist in your API client:

```typescript
// Typical structure — adjust to match your actual setup
export const api = {
  get: (path: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    }).then(r => r.json()),

  // Verify these work:
  // GET /api/ct-feed/viral-now
  // GET /api/ct-feed/emerging
  // GET /api/ct-feed/topic?topic=BTC
};
```

**Checklist:**
- [ ] Verify API client can make GET requests
- [ ] Test endpoints in Postman/curl
- [ ] Handle 500 errors gracefully

---

## Phase 3: Database Migrations (30 min)

### 3.1 Add New Columns to ct_tweets

File: `/Users/mujeeb/foresight/backend/migrations/[timestamp]_add_intelligence_fields.ts`

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('ct_tweets', (table) => {
    // New scoring fields
    table.decimal('relative_virality', 10, 4).nullable();
    table.decimal('velocity_score', 10, 2).nullable();
    table.boolean('is_breakout').defaultTo(false);
    table.string('topic', 50).nullable();

    // Indexes for performance
    table.index(['relative_virality']);
    table.index(['velocity_score']);
    table.index(['topic']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('ct_tweets', (table) => {
    table.dropColumn('relative_virality');
    table.dropColumn('velocity_score');
    table.dropColumn('is_breakout');
    table.dropColumn('topic');
  });
}
```

**Run migration:**
```bash
cd backend
NODE_OPTIONS='--import tsx' pnpm exec knex migrate:latest
```

**Checklist:**
- [ ] Create migration file
- [ ] Run migration
- [ ] Verify columns exist: `SELECT * FROM ct_tweets LIMIT 1;`

---

## Testing Checklist (1h)

### Unit Tests
- [ ] `calculateRelativeVirality()` returns valid number
- [ ] `calculateVelocityScore()` returns valid number
- [ ] `isBreakout()` returns true/false correctly
- [ ] `detectTopic()` identifies BTC, ETH, DeFi, Regulatory
- [ ] `/api/ct-feed/viral-now` filters by 6h
- [ ] `/api/ct-feed/emerging` filters by follower count
- [ ] `/api/ct-feed/topic` filters by topic

### Manual Testing (UI)
- [ ] Navigate to `/feed` page
- [ ] See 3 sections (Viral, Emerging, Topic)
- [ ] Each section shows tweets
- [ ] Topic selector works and refreshes
- [ ] Tweets link to Twitter correctly
- [ ] Page refreshes every 1 minute
- [ ] Mobile view (375px) looks good
- [ ] Dark theme is consistent

### Performance
- [ ] Page loads in <2s
- [ ] No console errors
- [ ] API calls complete in <1s

---

## Deployment Checklist

- [ ] All tests passing: `pnpm test`
- [ ] No TypeScript errors: `pnpm build`
- [ ] Environment variables set correctly
- [ ] Database migrations run
- [ ] API endpoints accessible
- [ ] Frontend deployed
- [ ] Test on staging

---

## Rollback Plan

If issues arise:

```bash
# Rollback migration
cd backend
NODE_OPTIONS='--import tsx' pnpm exec knex migrate:rollback

# Revert files
git checkout backend/src/services/ctFeedService.ts
git checkout frontend/src/components/CTIntelligenceFeed.tsx
```

---

## Success Criteria

✅ 3 new API endpoints working
✅ 3 new formulas calculating correctly
✅ Intelligence feed displays all 3 sections
✅ Topic selector filters by topic
✅ Auto-refreshes every 1 min
✅ Mobile responsive
✅ All tests passing
✅ No console errors
✅ Deploys without issues

**Estimated Time:** 6 hours
**Target Completion:** Feb 27, 2026
