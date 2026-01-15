# TwitterAPI.io Integration Architecture

## Overview

This document outlines the complete architecture for integrating TwitterAPI.io as our data source for the Fantasy CT League scoring system.

---

## 1. Data Source Summary

**Provider:** TwitterAPI.io
**API Key:** Stored in `TWITTER_API_IO_KEY` environment variable
**Base URL:** `https://api.twitterapi.io`
**Rate Limit:** 1 request per 5 seconds (free tier)
**Cost:** ~$0.70/month for 50 influencers with weekly updates

### Endpoints Used

| Endpoint | Purpose | Response Fields |
|----------|---------|-----------------|
| `GET /twitter/user/info` | Profile data | followers, following, statusesCount |
| `GET /twitter/user/last_tweets` | Tweet engagement | likeCount, retweetCount, replyCount, viewCount, createdAt |

---

## 2. Scoring Model Decision

### Option A: Weekly Delta Model (RECOMMENDED)

**How it works:**
- Capture snapshot at START of contest (Monday 00:00 UTC)
- Capture snapshot at END of contest (Sunday 23:59 UTC)
- Score = Growth during the week

**Pros:**
- Simple, cheap (~$0.17/week)
- Measures actual weekly performance
- Like FPL matchday scoring

**Cons:**
- Only 2 data points per week
- Can't show daily progress

### Option B: Daily Accumulation Model

**How it works:**
- Capture data daily
- Accumulate engagement metrics throughout the week

**Pros:**
- More granular data
- Can show daily leaderboard changes

**Cons:**
- 7x more API calls (~$0.59/week)
- More complex to implement

### DECISION: Option A (Weekly Delta)

Rationale: Simpler, cheaper, matches FPL model user expects.

---

## 3. Revised Scoring Formula

### Current Formula (Broken - uses unavailable real-time data)
```
score = basePrice + (followers/1M × 5) + (dailyTweets × 2) + (engagement × 0.01) × multiplier
```

### New Formula (Weekly Delta Based)
```typescript
weeklyScore =
  BASE_SCORE                                    // Tier-based: S=28, A=22, B=18, C=12
  + FOLLOWER_GROWTH_BONUS                       // (endFollowers - startFollowers) / 10,000 × 5
  + TWEET_ACTIVITY_BONUS                        // tweetsThisWeek × 1
  + ENGAGEMENT_BONUS                            // avgEngagementPerTweet × 0.1
  × CAPTAIN_MULTIPLIER                          // 2x if captain
  + SPOTLIGHT_BONUS                             // Top 3 voted: +10%, +5%, +3%

Where:
  - tweetsThisWeek = endTweetCount - startTweetCount
  - avgEngagementPerTweet = (totalLikes + totalRTs + totalReplies) / tweetsAnalyzed
```

### Score Component Breakdown

| Component | Formula | Max Points | Notes |
|-----------|---------|------------|-------|
| Base Score | tier_price | 28 | S=28, A=22, B=18, C=12 |
| Follower Growth | (delta / 10,000) × 5 | ~50 | Capped at 100K growth |
| Tweet Activity | tweets × 1 | ~20 | Capped at 20 tweets |
| Engagement | avg_engagement × 0.1 | ~50 | Based on recent tweets |
| Captain | × 2 | 2x | One per team |
| Spotlight | +3% to +10% | +10% | Top 3 voted |

### Edge Cases for Scoring

| Scenario | Handling |
|----------|----------|
| Negative follower growth | Floor at 0 (no penalty) |
| Account suspended mid-week | Use last known data, mark as "inactive" |
| No tweets this week | Tweet bonus = 0, engagement = 0 |
| Viral spike (>100K followers) | Cap follower growth bonus at 50 points |
| Handle changed | Track by Twitter ID, not handle |

---

## 4. Database Schema Changes

### New Table: `weekly_snapshots`

Stores start/end of week snapshots for delta calculation.

```sql
CREATE TABLE weekly_snapshots (
  id SERIAL PRIMARY KEY,
  influencer_id INTEGER NOT NULL REFERENCES influencers(id),
  contest_id INTEGER NOT NULL REFERENCES fantasy_contests(id),
  snapshot_type VARCHAR(10) NOT NULL,  -- 'start' or 'end'

  -- Profile metrics
  follower_count INTEGER NOT NULL,
  following_count INTEGER,
  tweet_count INTEGER NOT NULL,

  -- Engagement metrics (from recent tweets at snapshot time)
  tweets_analyzed INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_retweets INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  captured_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source VARCHAR(20) DEFAULT 'twitterapi.io',
  raw_response JSONB,  -- Store full API response for debugging

  -- Constraints
  UNIQUE(influencer_id, contest_id, snapshot_type)
);

CREATE INDEX idx_weekly_snapshots_contest ON weekly_snapshots(contest_id);
CREATE INDEX idx_weekly_snapshots_influencer ON weekly_snapshots(influencer_id);
```

### New Table: `api_fetch_logs`

Track all API calls for debugging and cost monitoring.

```sql
CREATE TABLE api_fetch_logs (
  id SERIAL PRIMARY KEY,
  fetch_type VARCHAR(50) NOT NULL,  -- 'profile', 'tweets', 'batch'
  influencer_id INTEGER REFERENCES influencers(id),
  contest_id INTEGER REFERENCES fantasy_contests(id),

  -- Request details
  endpoint VARCHAR(200) NOT NULL,
  request_params JSONB,

  -- Response details
  status_code INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,

  -- Cost tracking
  estimated_credits DECIMAL(10,4),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_fetch_logs_date ON api_fetch_logs(created_at);
CREATE INDEX idx_api_fetch_logs_type ON api_fetch_logs(fetch_type);
```

### Modify: `influencers` table

Add Twitter ID for reliable tracking.

```sql
ALTER TABLE influencers ADD COLUMN twitter_id VARCHAR(30);
ALTER TABLE influencers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE influencers ADD COLUMN last_error TEXT;
ALTER TABLE influencers ADD COLUMN consecutive_failures INTEGER DEFAULT 0;
```

---

## 5. Service Architecture

### New Service: `TwitterApiIoService`

```
src/services/
  twitterApiIoService.ts    # NEW: TwitterAPI.io client
  weeklySnapshotService.ts  # NEW: Snapshot capture logic
  fantasyScoringService.ts  # MODIFIED: Use new scoring formula
  cronJobs.ts               # MODIFIED: New cron schedule
```

### TwitterApiIoService Interface

```typescript
interface TwitterApiIoService {
  // Core API methods
  getUserProfile(username: string): Promise<ProfileData | null>;
  getUserTweets(username: string, count?: number): Promise<TweetData[]>;

  // Batch operations (with rate limiting)
  batchFetchProfiles(usernames: string[]): Promise<Map<string, ProfileData>>;
  batchFetchTweets(usernames: string[]): Promise<Map<string, TweetData[]>>;

  // Health checks
  checkApiHealth(): Promise<boolean>;
  getApiCreditsRemaining(): Promise<number | null>;
}
```

### WeeklySnapshotService Interface

```typescript
interface WeeklySnapshotService {
  // Capture snapshots
  captureStartOfWeekSnapshot(contestId: number): Promise<void>;
  captureEndOfWeekSnapshot(contestId: number): Promise<void>;

  // Retrieve snapshots
  getSnapshotsForContest(contestId: number): Promise<SnapshotPair[]>;

  // Calculate deltas
  calculateWeeklyDeltas(contestId: number): Promise<InfluencerDelta[]>;
}
```

---

## 6. Cron Job Schedule

### Updated Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| Start-of-Week Snapshot | Monday 00:05 UTC | Capture baseline metrics |
| End-of-Week Snapshot | Sunday 23:55 UTC | Capture final metrics |
| Calculate Scores | Monday 00:10 UTC | Process deltas, update scores |
| Contest Management | Daily 00:00 UTC | Activate/complete contests |
| Database Cleanup | Daily 03:00 UTC | Remove old data |

### Cron Expressions

```javascript
// Start-of-week snapshot (Monday 00:05 UTC)
cron.schedule('5 0 * * 1', captureStartOfWeekSnapshot);

// End-of-week snapshot (Sunday 23:55 UTC)
cron.schedule('55 23 * * 0', captureEndOfWeekSnapshot);

// Calculate weekly scores (Monday 00:10 UTC)
cron.schedule('10 0 * * 1', calculateWeeklyScores);
```

---

## 7. Error Handling Strategy

### Retry Logic

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 5000,      // 5 seconds (respects rate limit)
  maxDelayMs: 60000,      // 1 minute max
  backoffMultiplier: 2,   // Exponential backoff
};

async function fetchWithRetry(fn, config = RETRY_CONFIG) {
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === config.maxRetries) throw error;

      const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );

      await sleep(delay);
    }
  }
}
```

### Error Types and Handling

| Error Type | HTTP Code | Handling |
|------------|-----------|----------|
| Rate Limited | 429 | Wait 5 seconds, retry |
| Unauthorized | 401 | Log error, alert admin, stop job |
| Not Found | 404 | Mark influencer as "not_found", skip |
| Server Error | 5xx | Retry with backoff |
| Network Error | - | Retry with backoff |
| Timeout | - | Retry with backoff |

### Circuit Breaker

```typescript
const CIRCUIT_BREAKER = {
  failureThreshold: 5,     // Open circuit after 5 consecutive failures
  resetTimeMs: 300000,     // Try again after 5 minutes
  halfOpenRequests: 1,     // Test with 1 request before fully closing
};
```

### Graceful Degradation

If API fails completely during snapshot capture:

1. **Start-of-week fails:**
   - Retry for up to 1 hour
   - If still failing, use last known data as baseline
   - Alert admin

2. **End-of-week fails:**
   - Retry for up to 1 hour
   - If still failing, extend deadline by 1 hour
   - If still failing, use last successful fetch as end snapshot
   - Alert admin

3. **Partial failure (some influencers fail):**
   - Continue with successful ones
   - Mark failed influencers with error
   - Use last known data for failed influencers
   - Alert admin with failure list

---

## 8. Monitoring & Alerting

### Metrics to Track

| Metric | Alert Threshold |
|--------|-----------------|
| API success rate | < 95% in 1 hour |
| Average response time | > 5 seconds |
| Consecutive failures | > 3 for same influencer |
| Credits remaining | < $0.10 |
| Snapshot completion | < 90% influencers captured |

### Logging

```typescript
// Log levels
INFO:  Successful operations, job starts/ends
WARN:  Retries, partial failures, rate limits
ERROR: Failed operations, circuit breaker open
DEBUG: Raw API responses (only in development)
```

### Admin Notifications

Store in `error_logs` table and optionally send webhook/email for:
- Circuit breaker opened
- Snapshot capture failed
- Credits running low
- Influencer account issues (suspended, etc.)

---

## 9. Data Validation

### Profile Data Validation

```typescript
function validateProfile(data: any): ProfileData | null {
  if (!data) return null;

  // Required fields
  if (!data.userName || !data.id) return null;

  // Numeric fields must be non-negative
  if (data.followers < 0 || data.statusesCount < 0) return null;

  // Reasonable bounds (sanity check)
  if (data.followers > 500_000_000) return null;  // No one has 500M followers

  return {
    twitterId: data.id,
    username: data.userName,
    followers: data.followers || 0,
    following: data.following || 0,
    tweetCount: data.statusesCount || 0,
  };
}
```

### Tweet Data Validation

```typescript
function validateTweet(data: any): TweetData | null {
  if (!data || !data.id) return null;

  // Engagement can't be negative
  if (data.likeCount < 0 || data.retweetCount < 0) return null;

  return {
    id: data.id,
    text: data.text || '',
    createdAt: new Date(data.createdAt),
    likes: data.likeCount || 0,
    retweets: data.retweetCount || 0,
    replies: data.replyCount || 0,
    views: data.viewCount || 0,
  };
}
```

---

## 10. Implementation Plan

### Phase 1: Foundation (Day 1)
- [ ] Create database migrations
- [ ] Create TwitterApiIoService with rate limiting
- [ ] Add comprehensive logging

### Phase 2: Snapshot System (Day 2)
- [ ] Create WeeklySnapshotService
- [ ] Implement snapshot capture with retries
- [ ] Add validation and error handling

### Phase 3: Scoring Integration (Day 3)
- [ ] Update fantasyScoringService with new formula
- [ ] Update cron jobs with new schedule
- [ ] Add admin endpoints for manual triggers

### Phase 4: Testing (Day 4)
- [ ] Test with real API calls
- [ ] Test error scenarios (simulate failures)
- [ ] Test scoring calculations
- [ ] Verify cost estimation

### Phase 5: Monitoring (Day 5)
- [ ] Add metrics tracking
- [ ] Set up alerts
- [ ] Document operations runbook

---

## 11. Cost Monitoring

### Budget Tracking

```typescript
// Estimated costs per operation
const COSTS = {
  profileFetch: 0.00018,    // $0.18 per 1000
  tweetsFetch: 0.00015,     // $0.15 per 1000 tweets (varies by response size)
};

// Weekly estimate for 50 influencers
const WEEKLY_ESTIMATE = {
  profiles: 50 * 2 * COSTS.profileFetch,  // Start + end snapshots
  tweets: 50 * 2 * 20 * COSTS.tweetsFetch / 1000,  // ~20 tweets per fetch
  total: 0.17,  // ~$0.17 per week
};
```

### Credit Alerts

- Alert at $0.25 remaining (1 month buffer)
- Alert at $0.10 remaining (critical)
- Stop non-essential fetches at $0.05

---

## 12. Configuration

### Environment Variables

```bash
# Required
TWITTER_API_IO_KEY=your_api_key_here

# Optional (defaults shown)
TWITTER_API_IO_BASE_URL=https://api.twitterapi.io
TWITTER_API_RATE_LIMIT_MS=5000
TWITTER_API_MAX_RETRIES=3
TWITTER_API_TIMEOUT_MS=30000

# Feature flags
ENABLE_TWITTER_API_IO=true
TWITTER_API_DEBUG_MODE=false
```

### Runtime Configuration

```typescript
const CONFIG = {
  // Rate limiting
  minDelayBetweenRequests: 5000,  // 5 seconds (API requirement)

  // Batch sizes
  maxInfluencersPerBatch: 50,
  tweetsPerInfluencer: 20,

  // Timeouts
  requestTimeout: 30000,
  jobTimeout: 600000,  // 10 minutes for full batch

  // Retries
  maxRetries: 3,
  retryBaseDelay: 5000,
};
```

---

## 13. Rollback Plan

If the new system fails in production:

1. **Immediate:** Disable TwitterAPI.io cron jobs
2. **Short-term:** Revert to static scoring (base prices only)
3. **Investigation:** Check logs, identify root cause
4. **Fix:** Patch and re-enable

### Feature Flag

```typescript
// In .env
SCORING_MODE=twitterapi  // or 'static' for fallback

// In code
if (process.env.SCORING_MODE === 'static') {
  return calculateStaticScore(influencer);  // Old formula
} else {
  return calculateDynamicScore(influencer, snapshots);  // New formula
}
```

---

## 14. Questions Before Implementation

1. **Follower loss penalty?** Should negative growth = 0 or negative points?
2. **Tweet activity cap?** Should we cap at 20 tweets/week to prevent spam gaming?
3. **Engagement normalization?** Should we normalize by follower count?
4. **Historical data?** Do we need to backfill old contests?
5. **Manual override?** Should admins be able to manually adjust scores?

---

## Approval Checklist

Before proceeding with implementation, please confirm:

- [ ] Weekly delta model is acceptable
- [ ] New scoring formula is balanced
- [ ] Database schema changes are approved
- [ ] Cron schedule works for your timezone
- [ ] Error handling strategy is sufficient
- [ ] Cost estimate is acceptable (~$8.50/year)
- [ ] Questions above are answered

---

*Document Version: 1.0*
*Created: December 6, 2025*
*Status: PENDING APPROVAL*
