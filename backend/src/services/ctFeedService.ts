/**
 * CT Feed Service
 *
 * Handles all CT Feed functionality:
 * - Fetching and caching tweets from influencers
 * - Calculating engagement scores
 * - Rising stars discovery
 * - User interaction tracking
 * - FS reward for browsing
 */

import db from '../utils/db';
import twitterApiIo, { TweetData } from './twitterApiIoService';

// Types
export interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  engagementScore: number;
  twitterUrl: string;
  influencer: {
    id: number;
    handle: string;
    name: string;
    avatar: string;
    tier: string;
    price: number;
    totalPoints: number;
  };
}

export interface RisingStar {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  followers: number;
  followerGrowth: number;
  avgLikes: number;
  viralTweets: number;
  discoveredAt: string;
  status: string;
}

export interface FeedOptions {
  limit: number;
  offset: number;
  filter?: 'all' | 'highlights' | 'rising';
}

export interface FeedResult {
  tweets: Tweet[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  lastUpdated: string;
}

export interface HighlightsResult {
  tweets: Tweet[];
}

export interface RisingStarsResult {
  risingstars: RisingStar[];
}

export interface Interaction {
  type: string;
  tweetId?: string;
  sessionId?: string;
  timeSpentSeconds?: number;
  tweetsViewed?: number;
}

export interface FSAwardResult {
  awarded: boolean;
  fsAmount?: number;
  reason?: string;
}

export interface RefreshResult {
  success: boolean;
  tweetsStored: number;
  influencersProcessed: number;
  scoresUpdated: number;
  errors: string[];
}

// Engagement score weights
const ENGAGEMENT_WEIGHTS = {
  likes: 1,
  retweets: 3,
  replies: 2,
  quotes: 4,
  views: 0.001,
  bookmarks: 2,
};

/**
 * Calculate weighted engagement score for a tweet
 */
export function calculateEngagementScore(tweet: {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
}): number {
  return Math.round(
    tweet.likes * ENGAGEMENT_WEIGHTS.likes +
    tweet.retweets * ENGAGEMENT_WEIGHTS.retweets +
    tweet.replies * ENGAGEMENT_WEIGHTS.replies +
    tweet.quotes * ENGAGEMENT_WEIGHTS.quotes +
    tweet.views * ENGAGEMENT_WEIGHTS.views +
    tweet.bookmarks * ENGAGEMENT_WEIGHTS.bookmarks
  );
}

/**
 * Get the main CT feed
 */
export async function getFeed(options: FeedOptions): Promise<FeedResult> {
  const { limit, offset } = options;
  const cappedLimit = Math.min(limit, 50);

  try {
    // Get total count (excluding spam)
    const countResult = await db('ct_tweets')
      .whereRaw("text !~ '抽選|リポスト|フォロー.*無料|follow.*retweet.*win'")
      .andWhere(function() {
        this.where('engagement_score', '>', 0).orWhere('views', '>', 1000);
      })
      .count('* as count')
      .first();
    const total = Number(countResult?.count) || 0;

    // Get tweets with influencer data (quality filtered)
    const rows = await db('ct_tweets as t')
      .join('influencers as i', 't.influencer_id', 'i.id')
      .select(
        't.id',
        't.tweet_id',
        't.text',
        't.created_at',
        't.likes',
        't.retweets',
        't.replies',
        't.quotes',
        't.views',
        't.bookmarks',
        't.engagement_score',
        'i.id as influencer_id',
        'i.twitter_handle',
        'i.display_name as influencer_name',
        'i.avatar_url',
        'i.tier',
        'i.price',
        'i.total_points'
      )
      .whereRaw("t.text !~ '抽選|リポスト|フォロー.*無料|follow.*retweet.*win'")
      .andWhere(function() {
        this.where('t.engagement_score', '>', 0).orWhere('t.views', '>', 1000);
      })
      .orderBy('t.engagement_score', 'desc')
      .limit(cappedLimit)
      .offset(offset);

    const tweets: Tweet[] = rows.map((row) => ({
      id: row.id,
      tweetId: row.tweet_id,
      text: row.text,
      createdAt: new Date(row.created_at).toISOString(),
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      quotes: row.quotes,
      views: row.views,
      bookmarks: row.bookmarks,
      engagementScore: Number(row.engagement_score),
      twitterUrl: `https://twitter.com/${row.twitter_handle}/status/${row.tweet_id}`,
      influencer: {
        id: row.influencer_id,
        handle: row.twitter_handle,
        name: row.influencer_name || row.twitter_handle,
        avatar: row.avatar_url || '',
        tier: row.tier || 'C',
        price: parseFloat(row.price) || 10,
        totalPoints: row.total_points || 0,
      },
    }));

    // Get last update time
    const lastTweet = await db('ct_tweets')
      .orderBy('updated_at', 'desc')
      .first('updated_at');

    return {
      tweets,
      pagination: {
        total,
        limit: cappedLimit,
        offset,
        hasMore: offset + tweets.length < total,
      },
      lastUpdated: lastTweet?.updated_at
        ? new Date(lastTweet.updated_at).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error('[CTFeedService] Error getting feed:', error);
    return {
      tweets: [],
      pagination: { total: 0, limit: cappedLimit, offset, hasMore: false },
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get top viral tweets (highlights)
 */
export async function getHighlights(
  limit: number = 5,
  timeframe: string = '24h'
): Promise<HighlightsResult> {
  const cappedLimit = Math.min(limit, 20);

  // Calculate time cutoff
  let hoursBack = 24;
  if (timeframe === '7d') hoursBack = 168;
  if (timeframe === '30d') hoursBack = 720;

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

  try {
    const rows = await db('ct_tweets as t')
      .join('influencers as i', 't.influencer_id', 'i.id')
      .select(
        't.id',
        't.tweet_id',
        't.text',
        't.created_at',
        't.likes',
        't.retweets',
        't.replies',
        't.quotes',
        't.views',
        't.bookmarks',
        't.engagement_score',
        'i.id as influencer_id',
        'i.twitter_handle',
        'i.display_name as influencer_name',
        'i.avatar_url',
        'i.tier',
        'i.price',
        'i.total_points'
      )
      .where('t.created_at', '>=', cutoffDate)
      .orderBy('t.engagement_score', 'desc')
      .limit(cappedLimit);

    const tweets: Tweet[] = rows.map((row) => ({
      id: row.id,
      tweetId: row.tweet_id,
      text: row.text,
      createdAt: new Date(row.created_at).toISOString(),
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      quotes: row.quotes,
      views: row.views,
      bookmarks: row.bookmarks,
      engagementScore: Number(row.engagement_score),
      twitterUrl: `https://twitter.com/${row.twitter_handle}/status/${row.tweet_id}`,
      influencer: {
        id: row.influencer_id,
        handle: row.twitter_handle,
        name: row.influencer_name || row.twitter_handle,
        avatar: row.avatar_url || '',
        tier: row.tier || 'C',
        price: parseFloat(row.price) || 10,
        totalPoints: row.total_points || 0,
      },
    }));

    return { tweets };
  } catch (error) {
    console.error('[CTFeedService] Error getting highlights:', error);
    return { tweets: [] };
  }
}

/**
 * Get rising star accounts
 */
export async function getRisingStars(limit: number = 5): Promise<RisingStarsResult> {
  const cappedLimit = Math.min(limit, 20);

  try {
    const rows = await db('rising_stars')
      .whereIn('status', ['discovered', 'under_review'])
      .orderBy('follower_growth_rate', 'desc')
      .limit(cappedLimit);

    const risingstars: RisingStar[] = rows.map((row) => ({
      id: row.id,
      handle: row.twitter_handle,
      name: row.name || row.twitter_handle,
      avatar: row.profile_image_url || '',
      followers: row.followers_count,
      followerGrowth: Number(row.follower_growth_rate),
      avgLikes: Number(row.avg_likes_per_tweet),
      viralTweets: row.viral_tweet_count,
      discoveredAt: new Date(row.discovered_at).toISOString(),
      status: row.status,
    }));

    return { risingstars };
  } catch (error) {
    console.error('[CTFeedService] Error getting rising stars:', error);
    return { risingstars: [] };
  }
}

/**
 * Track user interaction with feed
 */
export async function trackInteraction(interaction: {
  userId: string;
  type: string;
  tweetId?: string;
  sessionId?: string;
  timeSpentSeconds?: number;
  tweetsViewed?: number;
}): Promise<void> {
  try {
    await db('feed_interactions').insert({
      user_id: interaction.userId,
      interaction_type: interaction.type,
      tweet_id: interaction.tweetId || null,
      session_id: interaction.sessionId || null,
      time_spent_seconds: interaction.timeSpentSeconds || 0,
      tweets_viewed: interaction.tweetsViewed || 0,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('[CTFeedService] Error tracking interaction:', error);
    throw error;
  }
}

/**
 * Award FS for browse time (30+ seconds)
 */
export async function awardBrowseTimeFS(
  userId: string,
  seconds: number
): Promise<FSAwardResult> {
  // Must browse for at least 30 seconds
  if (seconds < 30) {
    return { awarded: false, reason: 'insufficient_time' };
  }

  try {
    // Check if user already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingClaim = await db('feed_interactions')
      .where('user_id', userId)
      .where('interaction_type', 'browse_time_reward')
      .where('created_at', '>=', today)
      .first();

    if (existingClaim) {
      return { awarded: false, reason: 'already_claimed_today' };
    }

    // Award 5 FS
    const fsAmount = 5;

    // Record the reward interaction
    await db('feed_interactions').insert({
      user_id: userId,
      interaction_type: 'browse_time_reward',
      time_spent_seconds: seconds,
      created_at: new Date(),
    });

    // Add FS to user's score (if foresight_scores table exists)
    try {
      await db('foresight_score_transactions').insert({
        user_id: userId,
        amount: fsAmount,
        source: 'ct_feed_browse',
        description: 'Browsed Intel for 30+ seconds',
        created_at: new Date(),
      });

      // Update total score
      await db('foresight_scores')
        .where('user_id', userId)
        .increment('total_fs', fsAmount)
        .increment('week_fs', fsAmount)
        .increment('season_fs', fsAmount);
    } catch (fsError) {
      // FS tables might not exist yet, log but don't fail
      console.warn('[CTFeedService] Could not update FS (tables may not exist):', fsError);
    }

    return { awarded: true, fsAmount };
  } catch (error) {
    console.error('[CTFeedService] Error awarding browse time FS:', error);
    return { awarded: false, reason: 'error' };
  }
}

/**
 * Refresh tweets from all active influencers
 */
export async function refreshTweets(): Promise<RefreshResult> {
  const result: RefreshResult = {
    success: false,
    tweetsStored: 0,
    influencersProcessed: 0,
    scoresUpdated: 0,
    errors: [],
  };

  if (!twitterApiIo.isConfigured()) {
    result.errors.push('Twitter API not configured');
    return result;
  }

  try {
    // Get all active influencers
    const influencers = await db('influencers')
      .where('is_active', true)
      .select('id', 'twitter_handle', 'display_name as name');

    console.log(`[CTFeedService] Refreshing tweets for ${influencers.length} influencers...`);

    for (const influencer of influencers) {
      try {
        // Fetch tweets from Twitter API
        const tweetsResult = await twitterApiIo.getUserTweets(
          influencer.twitter_handle,
          10,
          { influencerId: influencer.id }
        );

        if (!tweetsResult.success || !tweetsResult.data) {
          result.errors.push(`Failed to fetch @${influencer.twitter_handle}: ${tweetsResult.error}`);
          continue;
        }

        // Store tweets
        for (const tweet of tweetsResult.data) {
          const engagementScore = calculateEngagementScore({
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            quotes: tweet.quotes,
            views: tweet.views,
            bookmarks: tweet.bookmarks,
          });

          await db('ct_tweets')
            .insert({
              tweet_id: tweet.id,
              influencer_id: influencer.id,
              text: tweet.text,
              created_at: tweet.createdAt,
              likes: tweet.likes,
              retweets: tweet.retweets,
              replies: tweet.replies,
              quotes: tweet.quotes,
              views: tweet.views,
              bookmarks: tweet.bookmarks,
              engagement_score: engagementScore,
              is_reply: tweet.isReply,
              fetched_at: new Date(),
              updated_at: new Date(),
            })
            .onConflict('tweet_id')
            .merge({
              likes: tweet.likes,
              retweets: tweet.retweets,
              replies: tweet.replies,
              quotes: tweet.quotes,
              views: tweet.views,
              bookmarks: tweet.bookmarks,
              engagement_score: engagementScore,
              updated_at: new Date(),
            });

          result.tweetsStored++;
          result.scoresUpdated++;
        }

        result.influencersProcessed++;

        // Rate limiting pause between influencers
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error processing @${influencer.twitter_handle}: ${errorMsg}`);
      }
    }

    result.success = result.errors.length === 0;
    console.log(`[CTFeedService] Refresh complete: ${result.tweetsStored} tweets, ${result.influencersProcessed} influencers`);

  } catch (error) {
    console.error('[CTFeedService] Error refreshing tweets:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

export default {
  calculateEngagementScore,
  getFeed,
  getHighlights,
  getRisingStars,
  trackInteraction,
  awardBrowseTimeFS,
  refreshTweets,
};
