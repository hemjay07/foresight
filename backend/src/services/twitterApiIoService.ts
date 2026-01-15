/**
 * TwitterAPI.io Service
 *
 * Handles all interactions with the TwitterAPI.io API for fetching
 * Twitter profile and tweet data.
 *
 * Features:
 * - Rate limiting (1 request per 5 seconds for free tier)
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Request logging for debugging and cost tracking
 */

import axios, { AxiosError } from 'axios';
import db from '../utils/db';

// Configuration
const CONFIG = {
  baseUrl: process.env.TWITTER_API_IO_BASE_URL || 'https://api.twitterapi.io',
  apiKey: process.env.TWITTER_API_IO_KEY || '',

  // Rate limiting (free tier = 1 request per 5 seconds)
  minDelayBetweenRequests: 5500, // 5.5 seconds to be safe

  // Retry configuration
  maxRetries: 3,
  retryBaseDelayMs: 5000,
  retryMaxDelayMs: 60000,
  retryBackoffMultiplier: 2,

  // Timeouts
  requestTimeoutMs: 30000,

  // Batch sizes
  tweetsPerInfluencer: 20,

  // Cost tracking (per 1000 requests)
  costPerProfile: 0.00018,
  costPerTweet: 0.00015,
};

// Types
export interface ProfileData {
  twitterId: string;
  username: string;
  name: string;
  followers: number;
  following: number;
  tweetCount: number;
  isVerified: boolean;
  profilePicture: string;
  description: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export interface TweetData {
  id: string;
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  isReply: boolean;
  raw: Record<string, unknown>;
}

export interface FetchResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  statusCode: number | null;
  responseTimeMs: number;
  retryCount: number;
}

// Track last request time for rate limiting
let lastRequestTime = 0;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for rate limit if needed
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < CONFIG.minDelayBetweenRequests) {
    const waitTime = CONFIG.minDelayBetweenRequests - timeSinceLastRequest;
    await sleep(waitTime);
  }

  lastRequestTime = Date.now();
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = CONFIG.retryBaseDelayMs * Math.pow(CONFIG.retryBackoffMultiplier, attempt - 1);
  return Math.min(delay, CONFIG.retryMaxDelayMs);
}

/**
 * Log API fetch to database
 */
async function logApiFetch(params: {
  fetchType: string;
  influencerId?: number;
  contestId?: number;
  endpoint: string;
  requestParams?: Record<string, unknown>;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  responseTimeMs: number;
  retryCount: number;
  estimatedCredits?: number;
}): Promise<void> {
  try {
    await db('api_fetch_logs').insert({
      fetch_type: params.fetchType,
      influencer_id: params.influencerId || null,
      contest_id: params.contestId || null,
      endpoint: params.endpoint,
      request_params: params.requestParams ? JSON.stringify(params.requestParams) : null,
      status_code: params.statusCode || null,
      success: params.success,
      error_message: params.errorMessage || null,
      response_time_ms: params.responseTimeMs,
      retry_count: params.retryCount,
      estimated_credits: params.estimatedCredits || null,
      created_at: new Date(),
    });
  } catch (error) {
    // Don't let logging failures break the main flow
    console.error('[TwitterApiIo] Failed to log API fetch:', error);
  }
}

/**
 * Check if service is configured
 */
export function isConfigured(): boolean {
  return !!CONFIG.apiKey;
}

/**
 * Get API configuration info
 */
export function getConfigInfo(): string {
  return `
TwitterAPI.io Configuration:
- API Key: ${CONFIG.apiKey ? `${CONFIG.apiKey.substring(0, 8)}...` : 'NOT SET'}
- Base URL: ${CONFIG.baseUrl}
- Rate Limit Delay: ${CONFIG.minDelayBetweenRequests}ms
- Max Retries: ${CONFIG.maxRetries}
- Configured: ${isConfigured() ? 'YES' : 'NO'}
  `.trim();
}

/**
 * Validate profile data from API response
 */
function validateProfileData(data: Record<string, unknown>): ProfileData | null {
  if (!data) return null;

  // Required fields
  if (!data.userName || !data.id) {
    console.warn('[TwitterApiIo] Profile missing required fields:', { hasUserName: !!data.userName, hasId: !!data.id });
    return null;
  }

  const followers = Number(data.followers) || 0;
  const tweetCount = Number(data.statusesCount) || 0;

  // Sanity checks
  if (followers < 0 || tweetCount < 0) {
    console.warn('[TwitterApiIo] Profile has negative values:', { followers, tweetCount });
    return null;
  }

  if (followers > 500_000_000) {
    console.warn('[TwitterApiIo] Profile followers exceeds sanity limit:', followers);
    return null;
  }

  return {
    twitterId: String(data.id),
    username: String(data.userName),
    name: String(data.name || data.userName),
    followers,
    following: Number(data.following) || 0,
    tweetCount,
    isVerified: Boolean(data.isBlueVerified || data.isVerified),
    profilePicture: String(data.profilePicture || ''),
    description: String(data.description || (data.profile_bio as Record<string, unknown>)?.description || ''),
    createdAt: String(data.createdAt || ''),
    raw: data,
  };
}

/**
 * Validate tweet data from API response
 */
function validateTweetData(data: Record<string, unknown>): TweetData | null {
  if (!data || !data.id) return null;

  const likes = Number(data.likeCount) || 0;
  const retweets = Number(data.retweetCount) || 0;
  const replies = Number(data.replyCount) || 0;

  // Sanity checks
  if (likes < 0 || retweets < 0 || replies < 0) {
    console.warn('[TwitterApiIo] Tweet has negative engagement:', { likes, retweets, replies });
    return null;
  }

  let createdAt: Date;
  try {
    createdAt = new Date(String(data.createdAt));
    if (isNaN(createdAt.getTime())) {
      createdAt = new Date();
    }
  } catch {
    createdAt = new Date();
  }

  return {
    id: String(data.id),
    text: String(data.text || ''),
    createdAt,
    likes,
    retweets,
    replies,
    quotes: Number(data.quoteCount) || 0,
    views: Number(data.viewCount) || 0,
    bookmarks: Number(data.bookmarkCount) || 0,
    isReply: Boolean(data.isReply),
    raw: data,
  };
}

/**
 * Fetch user profile from TwitterAPI.io
 */
export async function getUserProfile(
  username: string,
  options?: { influencerId?: number; contestId?: number }
): Promise<FetchResult<ProfileData>> {
  const startTime = Date.now();
  let retryCount = 0;
  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

  if (!isConfigured()) {
    return {
      success: false,
      data: null,
      error: 'TwitterAPI.io not configured - missing API key',
      statusCode: null,
      responseTimeMs: 0,
      retryCount: 0,
    };
  }

  const endpoint = '/twitter/user/info';
  const params = { userName: username };

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      // Wait for rate limit
      await waitForRateLimit();

      const response = await axios.get(`${CONFIG.baseUrl}${endpoint}`, {
        headers: {
          'X-API-Key': CONFIG.apiKey,
        },
        params,
        timeout: CONFIG.requestTimeoutMs,
      });

      lastStatusCode = response.status;

      // API returns { status: "success", data: {...} }
      const rawData = response.data?.data || response.data;
      const validatedData = validateProfileData(rawData);

      if (!validatedData) {
        lastError = 'Invalid profile data received';
        continue;
      }

      const responseTimeMs = Date.now() - startTime;

      // Log successful fetch
      await logApiFetch({
        fetchType: 'profile',
        influencerId: options?.influencerId,
        contestId: options?.contestId,
        endpoint,
        requestParams: params,
        statusCode: response.status,
        success: true,
        responseTimeMs,
        retryCount,
        estimatedCredits: CONFIG.costPerProfile,
      });

      return {
        success: true,
        data: validatedData,
        error: null,
        statusCode: response.status,
        responseTimeMs,
        retryCount,
      };

    } catch (error) {
      retryCount = attempt;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        lastStatusCode = axiosError.response?.status || null;
        lastError = axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message;

        // Don't retry on 404 (user not found) or 401 (auth error)
        if (lastStatusCode === 404 || lastStatusCode === 401) {
          break;
        }

        // For rate limit (429), wait longer
        if (lastStatusCode === 429) {
          console.log(`[TwitterApiIo] Rate limited for @${username}, waiting longer...`);
          await sleep(10000); // Wait 10 seconds
        }
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry (unless it's the last attempt)
      if (attempt < CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.log(`[TwitterApiIo] Retry ${attempt}/${CONFIG.maxRetries} for @${username} in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // Log failed fetch
  await logApiFetch({
    fetchType: 'profile',
    influencerId: options?.influencerId,
    contestId: options?.contestId,
    endpoint,
    requestParams: params,
    statusCode: lastStatusCode || undefined,
    success: false,
    errorMessage: lastError || 'Unknown error',
    responseTimeMs,
    retryCount,
  });

  return {
    success: false,
    data: null,
    error: lastError,
    statusCode: lastStatusCode,
    responseTimeMs,
    retryCount,
  };
}

/**
 * Fetch user's recent tweets from TwitterAPI.io
 */
export async function getUserTweets(
  username: string,
  count: number = CONFIG.tweetsPerInfluencer,
  options?: { influencerId?: number; contestId?: number }
): Promise<FetchResult<TweetData[]>> {
  const startTime = Date.now();
  let retryCount = 0;
  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

  if (!isConfigured()) {
    return {
      success: false,
      data: null,
      error: 'TwitterAPI.io not configured - missing API key',
      statusCode: null,
      responseTimeMs: 0,
      retryCount: 0,
    };
  }

  const endpoint = '/twitter/user/last_tweets';
  const params = { userName: username };

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      // Wait for rate limit
      await waitForRateLimit();

      const response = await axios.get(`${CONFIG.baseUrl}${endpoint}`, {
        headers: {
          'X-API-Key': CONFIG.apiKey,
        },
        params,
        timeout: CONFIG.requestTimeoutMs,
      });

      lastStatusCode = response.status;

      // API returns { status: "success", data: { tweets: [...] } }
      const tweetsArray = response.data?.data?.tweets || response.data?.tweets || [];

      // Validate and limit tweets
      const validatedTweets: TweetData[] = [];
      for (const rawTweet of tweetsArray) {
        if (validatedTweets.length >= count) break;

        const validated = validateTweetData(rawTweet);
        if (validated) {
          validatedTweets.push(validated);
        }
      }

      const responseTimeMs = Date.now() - startTime;

      // Log successful fetch
      await logApiFetch({
        fetchType: 'tweets',
        influencerId: options?.influencerId,
        contestId: options?.contestId,
        endpoint,
        requestParams: params,
        statusCode: response.status,
        success: true,
        responseTimeMs,
        retryCount,
        estimatedCredits: validatedTweets.length * CONFIG.costPerTweet,
      });

      return {
        success: true,
        data: validatedTweets,
        error: null,
        statusCode: response.status,
        responseTimeMs,
        retryCount,
      };

    } catch (error) {
      retryCount = attempt;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        lastStatusCode = axiosError.response?.status || null;
        lastError = axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message;

        // Don't retry on 404 or 401
        if (lastStatusCode === 404 || lastStatusCode === 401) {
          break;
        }

        // For rate limit (429), wait longer
        if (lastStatusCode === 429) {
          console.log(`[TwitterApiIo] Rate limited for @${username} tweets, waiting longer...`);
          await sleep(10000);
        }
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry
      if (attempt < CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.log(`[TwitterApiIo] Retry ${attempt}/${CONFIG.maxRetries} for @${username} tweets in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // Log failed fetch
  await logApiFetch({
    fetchType: 'tweets',
    influencerId: options?.influencerId,
    contestId: options?.contestId,
    endpoint,
    requestParams: params,
    statusCode: lastStatusCode || undefined,
    success: false,
    errorMessage: lastError || 'Unknown error',
    responseTimeMs,
    retryCount,
  });

  return {
    success: false,
    data: null,
    error: lastError,
    statusCode: lastStatusCode,
    responseTimeMs,
    retryCount,
  };
}

/**
 * Fetch profile and tweets for a single influencer
 */
export async function getInfluencerData(
  username: string,
  options?: { influencerId?: number; contestId?: number; tweetsCount?: number }
): Promise<{
  profile: FetchResult<ProfileData>;
  tweets: FetchResult<TweetData[]>;
}> {
  // Fetch profile first
  const profile = await getUserProfile(username, options);

  // Then fetch tweets
  const tweets = await getUserTweets(username, options?.tweetsCount || CONFIG.tweetsPerInfluencer, options);

  return { profile, tweets };
}

/**
 * Batch fetch data for multiple influencers
 * Respects rate limiting automatically
 */
export async function batchFetchInfluencers(
  influencers: Array<{ id: number; twitter_handle: string }>,
  contestId?: number,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<Map<number, { profile: ProfileData | null; tweets: TweetData[] | null; error: string | null }>> {
  const results = new Map<number, { profile: ProfileData | null; tweets: TweetData[] | null; error: string | null }>();

  console.log(`[TwitterApiIo] Starting batch fetch for ${influencers.length} influencers...`);

  for (let i = 0; i < influencers.length; i++) {
    const influencer = influencers[i];

    if (onProgress) {
      onProgress(i, influencers.length, influencer.twitter_handle);
    }

    console.log(`[TwitterApiIo] Fetching ${i + 1}/${influencers.length}: @${influencer.twitter_handle}`);

    const { profile, tweets } = await getInfluencerData(influencer.twitter_handle, {
      influencerId: influencer.id,
      contestId,
    });

    if (profile.success && tweets.success) {
      results.set(influencer.id, {
        profile: profile.data,
        tweets: tweets.data,
        error: null,
      });

      // Update influencer's tracking columns
      await db('influencers')
        .where({ id: influencer.id })
        .update({
          twitter_id: profile.data?.twitterId || null,
          consecutive_failures: 0,
          last_fetch_error: null,
          last_successful_fetch: new Date(),
          updated_at: new Date(),
        });

    } else {
      const error = profile.error || tweets.error || 'Unknown error';
      results.set(influencer.id, {
        profile: profile.data,
        tweets: tweets.data,
        error,
      });

      // Update failure tracking
      await db('influencers')
        .where({ id: influencer.id })
        .update({
          consecutive_failures: db.raw('consecutive_failures + 1'),
          last_fetch_error: error,
          updated_at: new Date(),
        });

      console.error(`[TwitterApiIo] Failed to fetch @${influencer.twitter_handle}: ${error}`);
    }
  }

  const successCount = Array.from(results.values()).filter(r => !r.error).length;
  console.log(`[TwitterApiIo] Batch fetch complete: ${successCount}/${influencers.length} successful`);

  return results;
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(days: number = 7): Promise<{
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  estimatedCost: number;
  byType: Record<string, number>;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await db('api_fetch_logs')
    .where('created_at', '>=', since)
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful'),
      db.raw('SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed'),
      db.raw('SUM(COALESCE(estimated_credits, 0)) as total_credits')
    )
    .first();

  const byType = await db('api_fetch_logs')
    .where('created_at', '>=', since)
    .groupBy('fetch_type')
    .select('fetch_type', db.raw('COUNT(*) as count'));

  const typeMap: Record<string, number> = {};
  for (const row of byType) {
    typeMap[row.fetch_type] = Number(row.count);
  }

  return {
    totalCalls: Number(logs?.total) || 0,
    successfulCalls: Number(logs?.successful) || 0,
    failedCalls: Number(logs?.failed) || 0,
    estimatedCost: Number(logs?.total_credits) || 0,
    byType: typeMap,
  };
}

// Export default instance
export default {
  isConfigured,
  getConfigInfo,
  getUserProfile,
  getUserTweets,
  getInfluencerData,
  batchFetchInfluencers,
  getApiUsageStats,
};
