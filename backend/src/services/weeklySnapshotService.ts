/**
 * Weekly Snapshot Service
 *
 * Handles capturing start and end of week snapshots for all influencers,
 * and calculating deltas for fantasy scoring.
 */

import db from '../utils/db';
import twitterApiIo, { ProfileData, TweetData } from './twitterApiIoService';

// Types
export interface Snapshot {
  id: number;
  influencerId: number;
  contestId: number;
  snapshotType: 'start' | 'end';
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  tweetsAnalyzed: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalViews: number;
  totalQuotes: number;
  totalBookmarks: number;
  avgEngagementRate: number;
  capturedAt: Date;
  isValid: boolean;
  errorMessage: string | null;
}

export interface SnapshotPair {
  influencerId: number;
  twitterHandle: string;
  displayName: string;
  tier: string;
  basePrice: number;
  start: Snapshot | null;
  end: Snapshot | null;
}

export interface InfluencerDelta {
  influencerId: number;
  twitterHandle: string;
  displayName: string;
  tier: string;
  basePrice: number;

  // Deltas
  followerGrowth: number;
  tweetsThisWeek: number;

  // Engagement from end-of-week snapshot
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalViews: number;
  tweetsAnalyzed: number;
  avgEngagementPerTweet: number;

  // Metadata
  hasStartSnapshot: boolean;
  hasEndSnapshot: boolean;
  isComplete: boolean;
}

/**
 * Calculate engagement metrics from tweets
 */
function calculateEngagementMetrics(tweets: TweetData[]): {
  tweetsAnalyzed: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalViews: number;
  totalQuotes: number;
  totalBookmarks: number;
  avgEngagementRate: number;
} {
  if (!tweets || tweets.length === 0) {
    return {
      tweetsAnalyzed: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0,
      totalViews: 0,
      totalQuotes: 0,
      totalBookmarks: 0,
      avgEngagementRate: 0,
    };
  }

  let totalLikes = 0;
  let totalRetweets = 0;
  let totalReplies = 0;
  let totalViews = 0;
  let totalQuotes = 0;
  let totalBookmarks = 0;

  for (const tweet of tweets) {
    totalLikes += tweet.likes;
    totalRetweets += tweet.retweets;
    totalReplies += tweet.replies;
    totalViews += tweet.views;
    totalQuotes += tweet.quotes;
    totalBookmarks += tweet.bookmarks;
  }

  const totalEngagement = totalLikes + totalRetweets + totalReplies + totalQuotes;
  const avgEngagementRate = totalViews > 0
    ? (totalEngagement / totalViews) * 100
    : 0;

  return {
    tweetsAnalyzed: tweets.length,
    totalLikes,
    totalRetweets,
    totalReplies,
    totalViews,
    totalQuotes,
    totalBookmarks,
    avgEngagementRate: Math.round(avgEngagementRate * 10000) / 10000, // 4 decimal places
  };
}

/**
 * Capture a snapshot for all active influencers
 */
export async function captureSnapshot(
  contestId: number,
  snapshotType: 'start' | 'end'
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ influencerId: number; handle: string; error: string }>;
}> {
  console.log(`\n========================================`);
  console.log(`[DEBUG] Capturing ${snapshotType.toUpperCase()} snapshot for contest ${contestId}`);
  console.log(`[DEBUG] Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  // Check if TwitterAPI.io is configured
  console.log(`[DEBUG] Checking TwitterAPI.io configuration...`);
  console.log(`[DEBUG] API Key present: ${!!process.env.TWITTER_API_IO_KEY}`);
  console.log(`[DEBUG] isConfigured(): ${twitterApiIo.isConfigured()}`);

  if (!twitterApiIo.isConfigured()) {
    console.error(`[DEBUG] ERROR: TwitterAPI.io is NOT configured!`);
    console.error(`[DEBUG] TWITTER_API_IO_KEY env var: ${process.env.TWITTER_API_IO_KEY ? 'SET (length: ' + process.env.TWITTER_API_IO_KEY.length + ')' : 'NOT SET'}`);
    throw new Error('TwitterAPI.io is not configured. Set TWITTER_API_IO_KEY environment variable.');
  }

  console.log(`[DEBUG] TwitterAPI.io is configured ✓`);

  // Get all active influencers
  console.log(`[DEBUG] Querying database for active influencers...`);
  const influencers = await db('influencers')
    .where('is_active', true)
    .select('id', 'twitter_handle', 'display_name')
    .orderBy('id', 'asc');

  console.log(`[DEBUG] Found ${influencers.length} active influencers to snapshot`);
  if (influencers.length > 0) {
    console.log(`[DEBUG] First 5 influencers: ${influencers.slice(0, 5).map(i => `@${i.twitter_handle}`).join(', ')}`);
  }
  console.log('');

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ influencerId: number; handle: string; error: string }>,
  };

  // Fetch data for all influencers
  const fetchResults = await twitterApiIo.batchFetchInfluencers(
    influencers,
    contestId,
    (completed, total, current) => {
      // Progress callback - could be used for real-time updates
      if (completed % 10 === 0) {
        console.log(`Progress: ${completed}/${total} (${Math.round(completed / total * 100)}%)`);
      }
    }
  );

  // Process results and save snapshots
  for (const influencer of influencers) {
    const result = fetchResults.get(influencer.id);

    if (!result) {
      results.failed++;
      results.errors.push({
        influencerId: influencer.id,
        handle: influencer.twitter_handle,
        error: 'No result returned from fetch',
      });
      continue;
    }

    if (result.error || !result.profile) {
      results.failed++;
      results.errors.push({
        influencerId: influencer.id,
        handle: influencer.twitter_handle,
        error: result.error || 'Profile data missing',
      });

      // Save a failed snapshot record
      await saveSnapshot({
        influencerId: influencer.id,
        contestId,
        snapshotType,
        profile: null,
        tweets: null,
        error: result.error || 'Profile data missing',
      });

      continue;
    }

    // Calculate engagement metrics from tweets
    const engagementMetrics = calculateEngagementMetrics(result.tweets || []);

    // Save successful snapshot
    await saveSnapshot({
      influencerId: influencer.id,
      contestId,
      snapshotType,
      profile: result.profile,
      tweets: result.tweets,
      engagementMetrics,
      error: null,
    });

    results.success++;
    console.log(`✅ @${influencer.twitter_handle}: ${result.profile.followers.toLocaleString()} followers, ${engagementMetrics.tweetsAnalyzed} tweets analyzed`);
  }

  console.log(`\n========================================`);
  console.log(`Snapshot capture complete`);
  console.log(`Success: ${results.success}/${influencers.length}`);
  console.log(`Failed: ${results.failed}/${influencers.length}`);
  console.log(`========================================\n`);

  return results;
}

/**
 * Save a snapshot to the database
 */
async function saveSnapshot(params: {
  influencerId: number;
  contestId: number;
  snapshotType: 'start' | 'end';
  profile: ProfileData | null;
  tweets: TweetData[] | null;
  engagementMetrics?: ReturnType<typeof calculateEngagementMetrics>;
  error: string | null;
}): Promise<void> {
  const { influencerId, contestId, snapshotType, profile, tweets, engagementMetrics, error } = params;

  // Check if snapshot already exists (upsert)
  const existing = await db('weekly_snapshots')
    .where({
      influencer_id: influencerId,
      contest_id: contestId,
      snapshot_type: snapshotType,
    })
    .first();

  const snapshotData = {
    influencer_id: influencerId,
    contest_id: contestId,
    snapshot_type: snapshotType,
    follower_count: profile?.followers || 0,
    following_count: profile?.following || 0,
    tweet_count: profile?.tweetCount || 0,
    tweets_analyzed: engagementMetrics?.tweetsAnalyzed || 0,
    total_likes: engagementMetrics?.totalLikes || 0,
    total_retweets: engagementMetrics?.totalRetweets || 0,
    total_replies: engagementMetrics?.totalReplies || 0,
    total_views: engagementMetrics?.totalViews || 0,
    total_quotes: engagementMetrics?.totalQuotes || 0,
    total_bookmarks: engagementMetrics?.totalBookmarks || 0,
    avg_engagement_rate: engagementMetrics?.avgEngagementRate || 0,
    captured_at: new Date(),
    source: 'twitterapi.io',
    raw_profile_response: profile?.raw ? JSON.stringify(profile.raw) : null,
    raw_tweets_response: tweets ? JSON.stringify(tweets.map(t => t.raw)) : null,
    is_valid: !error && !!profile,
    error_message: error,
    updated_at: new Date(),
  };

  if (existing) {
    await db('weekly_snapshots')
      .where({ id: existing.id })
      .update(snapshotData);
  } else {
    await db('weekly_snapshots').insert({
      ...snapshotData,
      created_at: new Date(),
    });
  }
}

/**
 * Get snapshots for a contest
 */
export async function getSnapshotsForContest(contestId: number): Promise<SnapshotPair[]> {
  // Get all influencers with their snapshots
  const influencers = await db('influencers')
    .where('is_active', true)
    .select('id', 'twitter_handle', 'display_name', 'tier', 'base_price');

  const snapshots = await db('weekly_snapshots')
    .where('contest_id', contestId)
    .select('*');

  // Group snapshots by influencer
  const snapshotMap = new Map<number, { start?: Snapshot; end?: Snapshot }>();

  for (const row of snapshots) {
    const snapshot: Snapshot = {
      id: row.id,
      influencerId: row.influencer_id,
      contestId: row.contest_id,
      snapshotType: row.snapshot_type,
      followerCount: Number(row.follower_count),
      followingCount: Number(row.following_count),
      tweetCount: Number(row.tweet_count),
      tweetsAnalyzed: Number(row.tweets_analyzed),
      totalLikes: Number(row.total_likes),
      totalRetweets: Number(row.total_retweets),
      totalReplies: Number(row.total_replies),
      totalViews: Number(row.total_views),
      totalQuotes: Number(row.total_quotes),
      totalBookmarks: Number(row.total_bookmarks),
      avgEngagementRate: Number(row.avg_engagement_rate),
      capturedAt: new Date(row.captured_at),
      isValid: row.is_valid,
      errorMessage: row.error_message,
    };

    if (!snapshotMap.has(row.influencer_id)) {
      snapshotMap.set(row.influencer_id, {});
    }

    const entry = snapshotMap.get(row.influencer_id)!;
    if (row.snapshot_type === 'start') {
      entry.start = snapshot;
    } else {
      entry.end = snapshot;
    }
  }

  // Build pairs
  const pairs: SnapshotPair[] = influencers.map(inf => ({
    influencerId: inf.id,
    twitterHandle: inf.twitter_handle,
    displayName: inf.display_name,
    tier: inf.tier,
    basePrice: Number(inf.base_price),
    start: snapshotMap.get(inf.id)?.start || null,
    end: snapshotMap.get(inf.id)?.end || null,
  }));

  return pairs;
}

/**
 * Calculate weekly deltas for all influencers
 */
export async function calculateWeeklyDeltas(contestId: number): Promise<InfluencerDelta[]> {
  const pairs = await getSnapshotsForContest(contestId);
  const deltas: InfluencerDelta[] = [];

  for (const pair of pairs) {
    const hasStart = pair.start?.isValid ?? false;
    const hasEnd = pair.end?.isValid ?? false;

    // Calculate follower growth
    let followerGrowth = 0;
    if (hasStart && hasEnd) {
      followerGrowth = pair.end!.followerCount - pair.start!.followerCount;
    }

    // Calculate tweets this week
    let tweetsThisWeek = 0;
    if (hasStart && hasEnd) {
      tweetsThisWeek = pair.end!.tweetCount - pair.start!.tweetCount;
    }

    // Get engagement from end snapshot (represents week's activity)
    const endSnapshot = pair.end;
    const totalLikes = endSnapshot?.totalLikes || 0;
    const totalRetweets = endSnapshot?.totalRetweets || 0;
    const totalReplies = endSnapshot?.totalReplies || 0;
    const totalViews = endSnapshot?.totalViews || 0;
    const tweetsAnalyzed = endSnapshot?.tweetsAnalyzed || 0;

    // Calculate average engagement per tweet
    const totalEngagement = totalLikes + totalRetweets + totalReplies;
    const avgEngagementPerTweet = tweetsAnalyzed > 0
      ? totalEngagement / tweetsAnalyzed
      : 0;

    deltas.push({
      influencerId: pair.influencerId,
      twitterHandle: pair.twitterHandle,
      displayName: pair.displayName,
      tier: pair.tier,
      basePrice: pair.basePrice,
      followerGrowth: Math.max(0, followerGrowth), // Floor at 0 (no penalty for losses)
      tweetsThisWeek: Math.max(0, tweetsThisWeek), // Floor at 0
      totalLikes,
      totalRetweets,
      totalReplies,
      totalViews,
      tweetsAnalyzed,
      avgEngagementPerTweet: Math.round(avgEngagementPerTweet * 100) / 100,
      hasStartSnapshot: hasStart,
      hasEndSnapshot: hasEnd,
      isComplete: hasStart && hasEnd,
    });
  }

  return deltas;
}

/**
 * Get snapshot status for a contest
 */
export async function getSnapshotStatus(contestId: number): Promise<{
  startSnapshots: { total: number; valid: number; invalid: number };
  endSnapshots: { total: number; valid: number; invalid: number };
  completePairs: number;
}> {
  const snapshots = await db('weekly_snapshots')
    .where('contest_id', contestId)
    .select('snapshot_type', 'is_valid');

  let startTotal = 0, startValid = 0;
  let endTotal = 0, endValid = 0;

  for (const s of snapshots) {
    if (s.snapshot_type === 'start') {
      startTotal++;
      if (s.is_valid) startValid++;
    } else {
      endTotal++;
      if (s.is_valid) endValid++;
    }
  }

  // Count complete pairs (both start and end valid)
  const completePairs = await db('weekly_snapshots as ws1')
    .join('weekly_snapshots as ws2', function() {
      this.on('ws1.influencer_id', '=', 'ws2.influencer_id')
        .andOn('ws1.contest_id', '=', 'ws2.contest_id');
    })
    .where('ws1.contest_id', contestId)
    .where('ws1.snapshot_type', 'start')
    .where('ws2.snapshot_type', 'end')
    .where('ws1.is_valid', true)
    .where('ws2.is_valid', true)
    .count('* as count')
    .first();

  return {
    startSnapshots: { total: startTotal, valid: startValid, invalid: startTotal - startValid },
    endSnapshots: { total: endTotal, valid: endValid, invalid: endTotal - endValid },
    completePairs: Number(completePairs?.count) || 0,
  };
}

/**
 * Capture start-of-week snapshot (convenience function for cron job)
 */
export async function captureStartOfWeekSnapshot(contestId: number): Promise<void> {
  console.log('[WeeklySnapshot] Capturing START of week snapshot...');
  const results = await captureSnapshot(contestId, 'start');

  if (results.failed > 0) {
    console.warn(`[WeeklySnapshot] ${results.failed} influencers failed to snapshot`);
    // Could send alert here
  }
}

/**
 * Capture end-of-week snapshot (convenience function for cron job)
 */
export async function captureEndOfWeekSnapshot(contestId: number): Promise<void> {
  console.log('[WeeklySnapshot] Capturing END of week snapshot...');
  const results = await captureSnapshot(contestId, 'end');

  if (results.failed > 0) {
    console.warn(`[WeeklySnapshot] ${results.failed} influencers failed to snapshot`);
    // Could send alert here
  }
}

// Export default
export default {
  captureSnapshot,
  captureStartOfWeekSnapshot,
  captureEndOfWeekSnapshot,
  getSnapshotsForContest,
  calculateWeeklyDeltas,
  getSnapshotStatus,
};
