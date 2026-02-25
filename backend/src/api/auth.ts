import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../utils/auth';
import { verifyPrivyToken, getPrivyUserWallet, isPrivyConfigured } from '../utils/privy';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import questService from '../services/questService';
import foresightScoreService from '../services/foresightScoreService';
import tapestryService from '../services/tapestryService';
import { sendSuccess } from '../utils/response';
import logger from '../utils/logger';

const router: Router = Router();

// ─── Shared Auth Logic ─────────────────────────────────────────────────────

interface FindOrCreateResult {
  user: any;
  isNewUser: boolean;
}

/**
 * Find existing user by wallet address or create a new one.
 */
async function findOrCreateUser(
  walletAddress: string,
  options: { referralCode?: string; authProvider?: string } = {}
): Promise<FindOrCreateResult> {
  const { referralCode, authProvider = 'privy' } = options;

  // Case-insensitive lookup — handles transition from lowercase to original Solana case
  let user = await db('users')
    .whereRaw('LOWER(wallet_address) = LOWER(?)', [walletAddress])
    .first();
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    let referrerId: string | null = null;

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
    const totalUsers = parseInt((userCount?.count as string) || '0');
    const isFoundingMember = totalUsers < 1000;
    const foundingMemberNumber = isFoundingMember ? totalUsers + 1 : null;

    // Generate collision-safe referral code
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    const refCode = `FORESIGHT_${walletAddress.slice(2, 10).toUpperCase()}_${suffix}`;
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
        auth_provider: authProvider,
        joined_at: db.fn.now(),
        created_at: db.fn.now(),
        last_seen_at: db.fn.now(),
        ct_mastery_score: referrerId ? 50 : 0,
      })
      .returning('*');

    user = newUser;

    // Award referrer (async, non-blocking)
    if (referrerId) {
      awardReferrer(referrerId, user.id, isFoundingMember).catch((err) =>
        logger.error('Error awarding referrer:', err, { context: 'Auth API' })
      );
    }
  } else {
    // Update last seen, auth provider, and fix wallet case if needed
    const updates: Record<string, any> = { last_seen_at: db.fn.now() };
    if (user.auth_provider !== authProvider) {
      updates.auth_provider = authProvider;
    }
    if (user.wallet_address !== walletAddress) {
      updates.wallet_address = walletAddress; // Fix case to match Privy
    }
    await db('users').where({ id: user.id }).update(updates);
  }

  return { user, isNewUser };
}

/**
 * Award referrer XP and trigger quests (extracted for clarity)
 */
async function awardReferrer(
  referrerId: string,
  refereeId: string,
  isFoundingMember: boolean
): Promise<void> {
  await db('users')
    .where({ id: referrerId })
    .increment('referral_count', 1)
    .increment('ct_mastery_score', 100);

  const referrer = await db('users').where({ id: referrerId }).first();
  if (referrer && !referrer.first_referral_at) {
    await db('users')
      .where({ id: referrerId })
      .update({ first_referral_at: db.fn.now() });
  }

  await db('referral_events').insert({
    id: uuidv4(),
    referrer_id: referrerId,
    referee_id: refereeId,
    event_type: 'signup',
    xp_awarded: 100,
    metadata: { founding_member: isFoundingMember },
    created_at: db.fn.now(),
  });

  await db('xp_actions').insert({
    id: uuidv4(),
    user_id: referrerId,
    action_key: 'referral_signup',
    xp_earned: 100,
    reference_type: 'referral',
    reference_id: refereeId,
    created_at: db.fn.now(),
  });

  questService.triggerAction(referrerId, 'invite_friend').catch(console.error);
  questService.triggerAction(referrerId, 'referral_converted').catch(console.error);
  questService.checkReferralMilestone(referrerId, referrer.referral_count + 1).catch(console.error);
}

/**
 * Create session, issue JWTs, trigger post-auth side effects, and send response.
 */
async function createSessionAndRespond(
  user: any,
  isNewUser: boolean,
  req: Request,
  res: Response
): Promise<void> {
  // Create JWT tokens (our own session layer)
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
  expiresAt.setDate(expiresAt.getDate() + 7);

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

  // Create Tapestry profile on signup (async, non-blocking)
  if (isNewUser) {
    tapestryService.findOrCreateProfile(user.wallet_address, user.username)
      .then(async (profile) => {
        if (profile) {
          await db('users').where({ id: user.id }).update({ tapestry_user_id: profile.id });
          logger.info(`Tapestry profile linked for user ${user.id}: ${profile.id}`, { context: 'Auth API' });
        }
      })
      .catch((err) => logger.error('Error creating Tapestry profile:', err, { context: 'Auth API' }));
  }

  // Trigger quest progress and FS awarding (async, don't block response)
  if (isNewUser) {
    questService.triggerAction(user.id, 'wallet_connected').catch(console.error);
    foresightScoreService
      .earnFs({
        userId: user.id,
        reason: 'signup_bonus',
        category: 'engagement',
        baseAmount: user.is_founding_member ? 100 : 25,
        sourceType: 'signup',
        metadata: {
          isFoundingMember: user.is_founding_member,
          foundingMemberNumber: user.founding_member_number,
        },
      })
      .catch((err) => logger.error('Error awarding signup FS:', err, { context: 'Auth API' }));
  } else {
    questService
      .triggerAction(user.id, 'daily_login')
      .catch((err) => logger.error('Error triggering daily_login quest:', err, { context: 'Auth API' }));
    foresightScoreService
      .earnFs({
        userId: user.id,
        reason: 'daily_login',
        category: 'engagement',
        baseAmount: 5,
        sourceType: 'login',
      })
      .catch((err) => logger.error('Error awarding daily login FS:', err, { context: 'Auth API' }));
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
    message: isNewUser
      ? user.is_founding_member
        ? `Welcome, Founding Member #${user.founding_member_number}! Early supporters will be rewarded.`
        : user.referred_by
          ? 'Welcome! You earned 50 bonus XP from your referral.'
          : 'Welcome to Foresight!'
      : 'Welcome back!',
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/verify
 * Login endpoint — Privy auth only.
 *
 * Send { privyToken, referralCode? }
 */
router.post(
  '/verify',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { privyToken, referralCode } = req.body;

    if (!privyToken) {
      throw new AppError(
        'Authentication required. Send { privyToken }.',
        400
      );
    }

    if (!isPrivyConfigured()) {
      throw new AppError(
        'Privy auth is not configured on this server. Set PRIVY_APP_ID and PRIVY_APP_SECRET.',
        503
      );
    }

    const claims = await verifyPrivyToken(privyToken);
    if (!claims) {
      throw new AppError('Invalid or expired Privy token', 401);
    }

    const walletInfo = await getPrivyUserWallet(claims.userId);
    if (!walletInfo) {
      throw new AppError(
        'No wallet found for this Privy account. Please connect a wallet first.',
        400
      );
    }

    // Keep original case for Solana (base58 is case-sensitive)
    const walletAddress = walletInfo.chainType === 'solana'
      ? walletInfo.address
      : walletInfo.address.toLowerCase();

    logger.info(`Privy auth successful for wallet ${walletAddress}`, {
      context: 'Auth API',
      data: { privyUserId: claims.userId, chainType: walletInfo.chainType },
    });

    // Find/create user and create session
    const { user, isNewUser } = await findOrCreateUser(walletAddress, {
      referralCode,
      authProvider: 'privy',
    });

    await createSessionAndRespond(user, isNewUser, req, res);
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

    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const session = await db('sessions')
      .where({ refresh_token: refreshToken })
      .first();

    if (!session) {
      throw new AppError('Session not found', 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      await db('sessions').where({ id: session.id }).del();
      throw new AppError('Session expired', 401);
    }

    const newAccessToken = createAccessToken({
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      role: payload.role,
    });

    await db('sessions')
      .where({ id: session.id })
      .update({ access_token: newAccessToken });

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

/**
 * GET /api/auth/tapestry-status
 * Get user's Tapestry integration status
 */
router.get(
  '/tapestry-status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await db('users').where({ id: userId }).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tapestryProfile = user.tapestry_user_id
      ? await tapestryService.getProfile(user.tapestry_user_id)
      : null;

    sendSuccess(res, {
      connected: !!user.tapestry_user_id,
      tapestryUserId: user.tapestry_user_id || null,
      walletAddress: user.wallet_address || null,
      profile: tapestryProfile,
    });
  })
);

export default router;
