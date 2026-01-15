# CT Feed - Technical Specification

> Part of the CT Intelligence Platform vision
> Version: 1.0 (MVP)
> Last Updated: December 28, 2025

---

## Vision

CT Feed is the **top of funnel** for an intelligence platform that:
- Hooks users with curated CT content (free)
- Converts them to fantasy players (engagement)
- Builds a data moat for future premium features (defensibility)

---

## MVP Scope

### What We're Building

1. **Real Tweet Fetching** - Fetch actual tweets from our influencers via twitterapi.io
2. **Tweet Storage** - Store tweets in database (data moat starts day 1)
3. **Highlights Section** - Top viral tweets (highest engagement)
4. **Rising Stars** - Accounts gaining traction (discovery pipeline)
5. **Twitter Links** - Users can engage on Twitter
6. **FS Rewards** - Earn +5 FS for 30s browse time

### What We're NOT Building (Yet)

- Prediction tagging/tracking (Phase 2)
- Accuracy scores (Phase 2)
- "Your Team" personalized feed (Phase 3)
- Premium features (Phase 4)

---

## Database Schema

### Table: `ct_tweets`

```sql
CREATE TABLE ct_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id VARCHAR(255) UNIQUE NOT NULL,        -- Twitter's tweet ID
  influencer_id INTEGER REFERENCES influencers(id),

  -- Tweet content
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,                -- Tweet creation time

  -- Engagement metrics (updated periodically)
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  quotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,

  -- Calculated scores
  engagement_score DECIMAL(12,2) DEFAULT 0,     -- Weighted engagement
  viral_score DECIMAL(12,2) DEFAULT 0,          -- Normalized virality

  -- Metadata
  is_reply BOOLEAN DEFAULT FALSE,
  is_retweet BOOLEAN DEFAULT FALSE,
  has_media BOOLEAN DEFAULT FALSE,

  -- Future: prediction tracking
  is_prediction BOOLEAN DEFAULT NULL,           -- Tagged as prediction?
  prediction_outcome VARCHAR(50) DEFAULT NULL,  -- 'correct', 'incorrect', 'pending'

  -- Timestamps
  fetched_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_tweets_influencer (influencer_id),
  INDEX idx_tweets_engagement (engagement_score DESC),
  INDEX idx_tweets_created (created_at DESC),
  INDEX idx_tweets_viral (viral_score DESC)
);
```

### Table: `rising_stars`

```sql
CREATE TABLE rising_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle VARCHAR(255) UNIQUE NOT NULL,
  twitter_id VARCHAR(255),

  -- Profile data
  name VARCHAR(255),
  bio TEXT,
  profile_image_url TEXT,

  -- Growth metrics
  followers_count INTEGER DEFAULT 0,
  followers_7d_ago INTEGER DEFAULT 0,
  follower_growth_rate DECIMAL(8,4) DEFAULT 0,  -- % growth in 7 days

  -- Engagement metrics
  avg_likes_per_tweet DECIMAL(10,2) DEFAULT 0,
  avg_retweets_per_tweet DECIMAL(10,2) DEFAULT 0,
  viral_tweet_count INTEGER DEFAULT 0,          -- Tweets with >1K likes

  -- Discovery tracking
  discovered_at TIMESTAMP DEFAULT NOW(),
  discovery_source VARCHAR(50),                 -- 'viral_tweet', 'follower_growth', 'nomination'

  -- Pipeline status
  status VARCHAR(50) DEFAULT 'discovered',      -- 'discovered', 'under_review', 'approved', 'rejected', 'added'
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  added_to_game_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `feed_interactions`

```sql
CREATE TABLE feed_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),

  -- Interaction type
  interaction_type VARCHAR(50) NOT NULL,        -- 'view', 'click', 'save', 'share', 'vote_prediction'

  -- Target
  tweet_id UUID REFERENCES ct_tweets(id),
  rising_star_id UUID REFERENCES rising_stars(id),

  -- Session tracking
  session_id VARCHAR(255),
  time_spent_seconds INTEGER DEFAULT 0,         -- For browse time tracking

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### GET /api/ct-feed

Main feed endpoint.

**Query Parameters:**
- `limit` (default: 20, max: 50)
- `offset` (default: 0)
- `filter` ('all' | 'highlights' | 'rising')

**Response:**
```json
{
  "success": true,
  "data": {
    "tweets": [
      {
        "id": "uuid",
        "tweetId": "1234567890",
        "influencer": {
          "id": 1,
          "handle": "CryptoGuru",
          "name": "Crypto Guru",
          "avatar": "https://...",
          "tier": "A"
        },
        "text": "BTC looking bullish...",
        "createdAt": "2025-12-28T10:00:00Z",
        "likes": 5420,
        "retweets": 892,
        "replies": 234,
        "views": 125000,
        "engagementScore": 8750,
        "twitterUrl": "https://twitter.com/CryptoGuru/status/1234567890"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "lastUpdated": "2025-12-28T10:30:00Z"
  }
}
```

### GET /api/ct-feed/highlights

Top viral tweets.

**Query Parameters:**
- `limit` (default: 5, max: 20)
- `timeframe` ('24h' | '7d' | '30d')

**Response:** Same structure as main feed.

### GET /api/ct-feed/rising-stars

Accounts gaining traction.

**Response:**
```json
{
  "success": true,
  "data": {
    "risingstars": [
      {
        "id": "uuid",
        "handle": "NewCTVoice",
        "name": "New CT Voice",
        "avatar": "https://...",
        "followers": 15420,
        "followerGrowth": 23.5,
        "avgLikes": 850,
        "viralTweets": 3,
        "discoveredAt": "2025-12-25T00:00:00Z",
        "status": "discovered"
      }
    ]
  }
}
```

### POST /api/ct-feed/interaction

Track user interactions (for FS rewards + analytics).

**Request Body:**
```json
{
  "type": "browse_time",
  "sessionId": "abc123",
  "timeSpentSeconds": 35,
  "tweetsViewed": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fsAwarded": 5,
    "message": "Earned +5 FS for browsing CT Feed"
  }
}
```

### POST /api/ct-feed/refresh (Admin)

Force refresh tweet cache.

---

## Service Layer

### CTFeedService

```typescript
interface CTFeedService {
  // Fetch and store tweets
  refreshTweets(): Promise<RefreshResult>;

  // Get feed data
  getFeed(options: FeedOptions): Promise<Tweet[]>;
  getHighlights(limit: number, timeframe: string): Promise<Tweet[]>;
  getRisingStars(limit: number): Promise<RisingStar[]>;

  // Track interactions
  trackInteraction(userId: string, interaction: Interaction): Promise<void>;
  awardBrowseTimeFS(userId: string, seconds: number): Promise<FSAward | null>;

  // Discovery pipeline
  detectRisingStars(): Promise<RisingStar[]>;
  updateRisingStarMetrics(): Promise<void>;
}
```

### Engagement Score Calculation

```typescript
function calculateEngagementScore(tweet: RawTweet): number {
  const weights = {
    likes: 1,
    retweets: 3,      // Higher value - signals strong agreement
    replies: 2,       // Engagement driver
    quotes: 4,        // Highest - creates conversation
    views: 0.001,     // Normalized for large numbers
    bookmarks: 2      // Intent signal
  };

  return (
    tweet.likes * weights.likes +
    tweet.retweets * weights.retweets +
    tweet.replies * weights.replies +
    tweet.quotes * weights.quotes +
    tweet.views * weights.views +
    tweet.bookmarks * weights.bookmarks
  );
}
```

---

## Frontend Components

### CTFeed Component

```
┌─────────────────────────────────────────────────────┐
│  CT FEED                              [Refresh] 🔄  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔥 HIGHLIGHTS                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Tweet 1 │ │ Tweet 2 │ │ Tweet 3 │  → scroll    │
│  │ 5.2K ❤️  │ │ 3.1K ❤️  │ │ 2.8K ❤️  │              │
│  └─────────┘ └─────────┘ └─────────┘              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⭐ RISING STARS                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ @NewVoice  +23% followers  │  [View Profile] │  │
│  │ @CTAlpha   +18% followers  │  [View Profile] │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📰 LATEST                                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ @CryptoGuru · 2h                             │  │
│  │ BTC looking bullish, expecting new ATH...    │  │
│  │ ❤️ 1.2K  🔄 234  💬 89  👁️ 45K               │  │
│  │                              [Open on X →]   │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ @DeFiDegen · 3h                              │  │
│  │ This new protocol is going to change...      │  │
│  │ ❤️ 892  🔄 156  💬 67  👁️ 28K                │  │
│  │                              [Open on X →]   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [Load More]                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Browse Time Tracking

```typescript
// Track time spent in feed
useEffect(() => {
  const startTime = Date.now();
  let awarded = false;

  const checkTime = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= 30 && !awarded) {
      awardFS();
      awarded = true;
    }
  }, 5000);

  return () => clearInterval(checkTime);
}, []);
```

---

## Cron Jobs

### Tweet Refresh (Every 30 minutes)

```typescript
// Runs every 30 minutes
async function refreshCTFeed() {
  const influencers = await getActiveInfluencers();

  for (const influencer of influencers) {
    const tweets = await twitterApiIo.getUserTweets(influencer.handle, 10);
    await storeTweets(tweets, influencer.id);
    await sleep(5500); // Rate limiting
  }

  await updateEngagementScores();
  await detectRisingStars();
}
```

### Rising Star Detection (Every 6 hours)

```typescript
async function detectRisingStars() {
  // Find accounts with:
  // 1. Recent viral tweets (>1K likes) from non-tracked accounts
  // 2. High follower growth rate
  // 3. Mentioned by our influencers
}
```

---

## FS Reward Logic

**Trigger:** User spends 30+ seconds browsing feed
**Reward:** +5 FS
**Limit:** Once per day per user
**Tracking:** `feed_interactions` table with `browse_time` type

---

## Success Metrics

1. **Engagement:** Daily active feed users
2. **Time spent:** Average session duration
3. **Discovery:** Rising stars identified per week
4. **Conversion:** Feed users → Fantasy players
5. **Data:** Tweets stored, interactions logged

---

## Implementation Checklist

### Backend
- [ ] Create `ct_tweets` migration
- [ ] Create `rising_stars` migration
- [ ] Create `feed_interactions` migration
- [ ] Implement `CTFeedService`
- [ ] Implement API endpoints
- [ ] Add cron job for tweet refresh
- [ ] Add cron job for rising star detection

### Frontend
- [ ] Rewrite `CTFeed.tsx` component
- [ ] Add highlights carousel
- [ ] Add rising stars section
- [ ] Add browse time tracking
- [ ] Add FS reward notification

### Testing
- [ ] Backend unit tests for CTFeedService
- [ ] API endpoint tests
- [ ] Frontend component tests
- [ ] E2E test for FS reward flow
