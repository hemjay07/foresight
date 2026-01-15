import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db';
import {
  generateNonce,
  verifySiweMessage,
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../utils/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import questService from '../services/questService';
import foresightScoreService from '../services/foresightScoreService';
import { sendSuccess } from '../utils/response';
import logger from '../utils/logger';

const router: Router = Router();

/**
 * GET /api/auth/nonce
 * Generate a nonce for SIWE message
 */
router.get(
  '/nonce',
  asyncHandler(async (req: Request, res: Response) => {
    const nonce = generateNonce();

    sendSuccess(res, { nonce });
  })
);

/**
 * POST /api/auth/verify
 * Verify SIWE message and create session (alias for login)
 */
router.post(
  '/verify',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, signature, referralCode } = req.body;

    if (!message || !signature) {
      throw new AppError('Message and signature are required', 400);
    }

    // Verify SIWE message
    const verification = await verifySiweMessage(message, signature);

    if (!verification.success || !verification.address) {
      throw new AppError(verification.error || 'Invalid signature', 401);
    }

    const walletAddress = verification.address.toLowerCase();

    // Find or create user
    let user = await db('users').where({ wallet_address: walletAddress }).first();
    let isNewUser = false;
    let referrerId: string | null = null;

    if (!user) {
      isNewUser = true;

      // Validate referral code if provided
      if (referralCode) {
        const referrer = await db('users')
          .where({ referral_code: referralCode })
          .first();

        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Check if user should be marked as founding member (first 1000 users)
      const userCount = await db('users').count('* as count').first();
      const totalUsers = parseInt(userCount?.count as string || '0');
      const isFoundingMember = totalUsers < 1000;
      const foundingMemberNumber = isFoundingMember ? totalUsers + 1 : null;

      // Generate unique referral code
      const refCode = `FORESIGHT_${walletAddress.slice(2, 10).toUpperCase()}`;

      // Create new user with auto-generated username
      const autoUsername = `Trader_${walletAddress.slice(2, 8)}`;

      const [newUser] = await db('users')
        .insert({
          id: uuidv4(),
          wallet_address: walletAddress,
          username: autoUsername,
          referral_code: refCode,
          referred_by: referrerId,
          is_founding_member: isFoundingMember,
          founding_member_number: foundingMemberNumber,
          joined_at: db.fn.now(),
          created_at: db.fn.now(),
          last_seen_at: db.fn.now(),
          // Give bonus XP if referred
          ct_mastery_score: referrerId ? 50 : 0,
        })
        .returning('*');

      user = newUser;

      // Award referrer
      if (referrerId) {
        // Increment referrer's count
        await db('users')
          .where({ id: referrerId })
          .increment('referral_count', 1)
          .increment('ct_mastery_score', 100); // Referrer gets 100 XP

        // Update first_referral_at if this is their first
        const referrer = await db('users').where({ id: referrerId }).first();
        if (referrer && !referrer.first_referral_at) {
          await db('users')
            .where({ id: referrerId })
            .update({ first_referral_at: db.fn.now() });
        }

        // Create referral event
        await db('referral_events').insert({
          id: uuidv4(),
          referrer_id: referrerId,
          referee_id: user.id,
          event_type: 'signup',
          xp_awarded: 100,
          metadata: { founding_member: isFoundingMember },
          created_at: db.fn.now(),
        });

        // Log XP action for referrer
        await db('xp_actions').insert({
          id: uuidv4(),
          user_id: referrerId,
          action_key: 'referral_signup',
          xp_earned: 100,
          reference_type: 'referral',
          reference_id: user.id,
          created_at: db.fn.now(),
        });

        // Trigger referral quests for the referrer (async, non-blocking)
        // 1. invite_friend quest (onboarding - first referral)
        questService.triggerAction(referrerId, 'invite_friend').catch(console.error);
        // 2. referral_converted (weekly quest)
        questService.triggerAction(referrerId, 'referral_converted').catch(console.error);
        // 3. Check referral milestone achievements (3, 10 referrals)
        questService.checkReferralMilestone(referrerId, referrer.referral_count + 1).catch(console.error);
      }
    } else {
      // Update last seen
      await db('users').where({ id: user.id }).update({
        last_seen_at: db.fn.now(),
      });
    }

    // Create JWT tokens
    const accessToken = createAccessToken({
      userId: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
    });

    const refreshToken = createRefreshToken({
      userId: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
    });

    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db('sessions').insert({
      id: uuidv4(),
      user_id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      created_at: db.fn.now(),
    });

    // Trigger quest progress and FS awarding (async, don't block response)
    if (isNewUser) {
      questService.triggerAction(user.id, 'wallet_connected').catch(console.error);
      // Award initial FS to populate leaderboard
      foresightScoreService.earnFs({
        userId: user.id,
        reason: 'signup_bonus',
        category: 'engagement',
        baseAmount: user.is_founding_member ? 100 : 25, // Founding members get more
        sourceType: 'signup',
        metadata: {
          isFoundingMember: user.is_founding_member,
          foundingMemberNumber: user.founding_member_number,
        },
      }).catch((err) => logger.error('Error triggering first_login quest:', err, { context: 'Auth API' }));
    } else {
      questService.triggerAction(user.id, 'daily_login').catch((err) =>
        logger.error('Error triggering daily_login quest:', err, { context: 'Auth API' })
      );
      // Award daily login FS
      foresightScoreService.earnFs({
        userId: user.id,
        reason: 'daily_login',
        category: 'engagement',
        baseAmount: 5,
        sourceType: 'login',
      }).catch((err) => logger.error('Error awarding daily login FS:', err, { context: 'Auth API' }));
    }

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url,
        ctMasteryScore: user.ct_mastery_score,
        ctMasteryLevel: user.ct_mastery_level,
        referralCode: user.referral_code,
        isFoundingMember: user.is_founding_member,
        foundingMemberNumber: user.founding_member_number,
      },
      // Hint at future value for new users
      message: isNewUser
        ? user.is_founding_member
          ? `Welcome, Founding Member #${user.founding_member_number}! Early supporters will be rewarded.`
          : referrerId
          ? 'Welcome! You earned 50 bonus XP from your referral.'
          : 'Welcome to CT Fantasy League!'
        : 'Welcome back!',
    });
  })
);


/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    if (!payload) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Check if session exists
    const session = await db('sessions')
      .where({ refresh_token: refreshToken })
      .first();

    if (!session) {
      throw new AppError('Session not found', 401);
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await db('sessions').where({ id: session.id }).del();
      throw new AppError('Session expired', 401);
    }

    // Create new access token
    const newAccessToken = createAccessToken({
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      role: payload.role,
    });

    // Update session
    await db('sessions')
      .where({ id: session.id })
      .update({
        access_token: newAccessToken,
      });

    sendSuccess(res, { accessToken: newAccessToken });
  })
);

/**
 * POST /api/auth/logout
 * Delete session
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Delete all user sessions
    await db('sessions').where({ user_id: userId }).del();

    sendSuccess(res, { message: 'Logged out successfully' });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await db('users').where({ id: userId }).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      twitterHandle: user.twitter_handle,
      avatarUrl: user.avatar_url,
      ctMasteryScore: user.ct_mastery_score,
      ctMasteryLevel: user.ct_mastery_level,
      createdAt: user.created_at,
      lastSeenAt: user.last_seen_at,
    });
  })
);

export default router;
