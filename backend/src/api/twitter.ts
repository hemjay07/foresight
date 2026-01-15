/**
 * Twitter OAuth 2.0 Integration API
 *
 * Endpoints for:
 * - Connecting Twitter account via OAuth 2.0
 * - Verifying follows (for quests)
 * - Getting Twitter profile data
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../utils/db';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import questService from '../services/questService';

const router: Router = Router();

// Twitter API response types
interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
    public_metrics?: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
    };
  };
}

interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
    author_id: string;
  };
}

interface TwitterFollowingResponse {
  data?: Array<{ id: string; username: string }>;
}

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/twitter/callback';
const TWITTER_ACCOUNT_TO_FOLLOW = process.env.TWITTER_ACCOUNT_TO_FOLLOW || 'ForesightCT';

// Store PKCE verifiers temporarily (in production, use Redis)
const pkceStore = new Map<string, { verifier: string; userId: string; expiresAt: number }>();

// Clean up expired PKCE entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pkceStore.entries()) {
    if (data.expiresAt < now) {
      pkceStore.delete(state);
    }
  }
}, 60000); // Clean up every minute

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/**
 * Check if Twitter is configured
 */
function isTwitterConfigured(): boolean {
  return !!(TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET);
}

/**
 * GET /api/twitter/status
 * Check if Twitter integration is available and user's connection status
 */
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await db('users')
      .where({ id: userId })
      .select(
        'twitter_id',
        'twitter_handle',
        'twitter_followers',
        'twitter_connected_at',
        'twitter_follows_foresight',
        'twitter_last_verified_at'
      )
      .first();

    res.json({
      success: true,
      data: {
        configured: isTwitterConfigured(),
        connected: !!user?.twitter_id,
        handle: user?.twitter_handle || null,
        followers: user?.twitter_followers || 0,
        connectedAt: user?.twitter_connected_at || null,
        followsForesight: user?.twitter_follows_foresight || false,
        lastVerifiedAt: user?.twitter_last_verified_at || null,
      },
    });
  })
);

/**
 * GET /api/twitter/connect
 * Start Twitter OAuth 2.0 authorization flow
 */
router.get(
  '/connect',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!isTwitterConfigured()) {
      throw new AppError('Twitter integration not configured', 503);
    }

    const userId = req.user!.userId;

    // Generate PKCE
    const { verifier, challenge } = generatePKCE();

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store PKCE verifier with state (expires in 10 minutes)
    pkceStore.set(state, {
      verifier,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_CALLBACK_URL,
      scope: 'tweet.read users.read follows.read offline.access',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  })
);

/**
 * GET /api/twitter/callback
 * Handle OAuth 2.0 callback from Twitter
 */
router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      // User denied or error occurred
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=${error}`);
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=missing_params`);
    }

    // Retrieve PKCE verifier
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=invalid_state`);
    }

    pkceStore.delete(state);

    // Exchange code for tokens
    try {
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: TWITTER_CALLBACK_URL,
          code_verifier: pkceData.verifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('[Twitter] Token exchange failed:', errorData);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=token_exchange_failed`);
      }

      const tokens = await tokenResponse.json() as TwitterTokenResponse;

      // Get user info from Twitter
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        console.error('[Twitter] User info fetch failed');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=user_info_failed`);
      }

      const userData = await userResponse.json() as TwitterUserResponse;
      const twitterUser = userData.data;

      // Calculate token expiration
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 7200) * 1000);

      // Update user with Twitter data
      await db('users')
        .where({ id: pkceData.userId })
        .update({
          twitter_id: twitterUser.id,
          twitter_handle: twitterUser.username,
          twitter_followers: twitterUser.public_metrics?.followers_count || 0,
          twitter_access_token: tokens.access_token, // In production, encrypt this
          twitter_refresh_token: tokens.refresh_token || null,
          twitter_connected_at: db.fn.now(),
          twitter_token_expires_at: expiresAt,
        });

      console.log(`[Twitter] User ${pkceData.userId.slice(0, 8)}... connected Twitter: @${twitterUser.username}`);

      // Check if user follows Foresight (async, don't block redirect)
      verifyFollow(pkceData.userId, tokens.access_token).catch(console.error);

      // Redirect back to settings with success
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=success&handle=${twitterUser.username}`);
    } catch (error) {
      console.error('[Twitter] Callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?twitter=error&message=unexpected_error`);
    }
  })
);

/**
 * POST /api/twitter/verify-follow
 * Manually trigger follow verification
 */
router.post(
  '/verify-follow',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await db('users')
      .where({ id: userId })
      .select('twitter_access_token', 'twitter_token_expires_at', 'twitter_refresh_token')
      .first();

    if (!user?.twitter_access_token) {
      throw new AppError('Twitter not connected', 400);
    }

    // Check if token needs refresh
    let accessToken = user.twitter_access_token;
    if (user.twitter_token_expires_at && new Date(user.twitter_token_expires_at) < new Date()) {
      if (!user.twitter_refresh_token) {
        throw new AppError('Twitter session expired, please reconnect', 401);
      }
      accessToken = await refreshAccessToken(userId, user.twitter_refresh_token);
    }

    const followsUs = await verifyFollow(userId, accessToken);

    res.json({
      success: true,
      data: {
        followsForesight: followsUs,
        verifiedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * POST /api/twitter/disconnect
 * Disconnect Twitter account
 */
router.post(
  '/disconnect',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await db('users')
      .where({ id: userId })
      .update({
        twitter_id: null,
        twitter_handle: null,
        twitter_followers: 0,
        twitter_access_token: null,
        twitter_refresh_token: null,
        twitter_connected_at: null,
        twitter_token_expires_at: null,
        twitter_follows_foresight: false,
        twitter_last_verified_at: null,
      });

    console.log(`[Twitter] User ${userId.slice(0, 8)}... disconnected Twitter`);

    res.json({
      success: true,
      message: 'Twitter disconnected successfully',
    });
  })
);

/**
 * POST /api/twitter/verify-tweet
 * Verify that user tweeted about Foresight
 */
router.post(
  '/verify-tweet',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { tweetUrl } = req.body;

    if (!tweetUrl) {
      throw new AppError('Tweet URL is required', 400);
    }

    // Extract tweet ID from URL
    // Formats: twitter.com/user/status/123, x.com/user/status/123
    const tweetIdMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    if (!tweetIdMatch) {
      throw new AppError('Invalid tweet URL', 400);
    }
    const tweetId = tweetIdMatch[1];

    const user = await db('users')
      .where({ id: userId })
      .select('twitter_id', 'twitter_access_token', 'twitter_token_expires_at', 'twitter_refresh_token')
      .first();

    if (!user?.twitter_access_token) {
      throw new AppError('Twitter not connected', 400);
    }

    // Check if token needs refresh
    let accessToken = user.twitter_access_token;
    if (user.twitter_token_expires_at && new Date(user.twitter_token_expires_at) < new Date()) {
      if (!user.twitter_refresh_token) {
        throw new AppError('Twitter session expired, please reconnect', 401);
      }
      accessToken = await refreshAccessToken(userId, user.twitter_refresh_token);
    }

    // Fetch the tweet
    const tweetResponse = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=author_id,text`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.json();
      if (tweetResponse.status === 404) {
        throw new AppError('Tweet not found', 404);
      }
      console.error('[Twitter] Tweet fetch failed:', errorData);
      throw new AppError('Failed to verify tweet', 500);
    }

    const tweetData = await tweetResponse.json() as TwitterTweetResponse;
    const tweet = tweetData.data;

    // Verify the tweet is from the connected user
    if (tweet.author_id !== user.twitter_id) {
      throw new AppError('This tweet is not from your connected Twitter account', 400);
    }

    // Verify tweet mentions Foresight (case insensitive)
    const tweetText = tweet.text.toLowerCase();
    const mentionsForesight =
      tweetText.includes('foresight') ||
      tweetText.includes('@foresightct') ||
      tweetText.includes('ct draft') ||
      tweetText.includes('crypto twitter fantasy');

    if (!mentionsForesight) {
      throw new AppError('Tweet must mention Foresight, @ForesightCT, or CT Draft', 400);
    }

    // Check if this tweet was already verified (prevent double-claiming)
    const existingVerification = await db('twitter_verified_tweets')
      .where({ tweet_id: tweetId })
      .first();

    if (existingVerification) {
      throw new AppError('This tweet has already been verified', 400);
    }

    // Record the verification
    await db('twitter_verified_tweets').insert({
      user_id: userId,
      tweet_id: tweetId,
      tweet_text: tweet.text.substring(0, 500),
      verified_at: db.fn.now(),
    });

    // Trigger the weekly_tweet quest
    await questService.triggerAction(userId, 'twitter_tweet');

    console.log(`[Twitter] User ${userId.slice(0, 8)}... verified tweet ${tweetId} - quest triggered`);

    res.json({
      success: true,
      data: {
        tweetVerified: true,
        tweetId,
        questTriggered: true,
      },
    });
  })
);

/**
 * Verify if user follows the Foresight Twitter account
 */
async function verifyFollow(userId: string, accessToken: string): Promise<boolean> {
  try {
    // First, get the Foresight account ID
    const foresightUserResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_ACCOUNT_TO_FOLLOW}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!foresightUserResponse.ok) {
      console.error('[Twitter] Failed to get Foresight account ID');
      return false;
    }

    const foresightData = await foresightUserResponse.json() as TwitterUserResponse;
    const foresightId = foresightData.data?.id;

    if (!foresightId) {
      console.error('[Twitter] Foresight account not found');
      return false;
    }

    // Get user's Twitter ID
    const user = await db('users')
      .where({ id: userId })
      .select('twitter_id')
      .first();

    if (!user?.twitter_id) {
      return false;
    }

    // Check if user follows Foresight
    const followsResponse = await fetch(
      `https://api.twitter.com/2/users/${user.twitter_id}/following?user.fields=id`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!followsResponse.ok) {
      console.error('[Twitter] Failed to get following list');
      return false;
    }

    const followsData = await followsResponse.json() as TwitterFollowingResponse;
    const followsUs = followsData.data?.some((f) => f.id === foresightId) || false;

    // Update user record
    await db('users')
      .where({ id: userId })
      .update({
        twitter_follows_foresight: followsUs,
        twitter_last_verified_at: db.fn.now(),
      });

    // If follows, trigger quest
    if (followsUs) {
      questService.triggerAction(userId, 'follow_twitter').catch(console.error);
      console.log(`[Twitter] User ${userId.slice(0, 8)}... follows @${TWITTER_ACCOUNT_TO_FOLLOW} - quest triggered`);
    }

    return followsUs;
  } catch (error) {
    console.error('[Twitter] Error verifying follow:', error);
    return false;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new AppError('Failed to refresh Twitter token', 401);
  }

  const tokens = await response.json() as TwitterTokenResponse;
  const expiresAt = new Date(Date.now() + (tokens.expires_in || 7200) * 1000);

  // Update stored tokens
  await db('users')
    .where({ id: userId })
    .update({
      twitter_access_token: tokens.access_token,
      twitter_refresh_token: tokens.refresh_token || refreshToken,
      twitter_token_expires_at: expiresAt,
    });

  return tokens.access_token;
}

export default router;
