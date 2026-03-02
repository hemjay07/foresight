import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../utils/db';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../utils/auth';
import { verifyPrivyToken, getPrivyUserInfo, isPrivyConfigured, type PrivyUserInfo } from '../utils/privy';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import { generateCsrfToken } from '../middleware/csrf';
import questService from '../services/questService';
import foresightScoreService from '../services/foresightScoreService';
import tapestryService from '../services/tapestryService';
import { sendSuccess } from '../utils/response';
import logger from '../utils/logger';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// FINDING-007: Cookie options for httpOnly JWT storage
// Production uses sameSite:'none' because frontend (ct-foresight.xyz) and backend
// (railway.app) are on different domains — 'lax' blocks cross-origin cookie sending.
// sameSite:'none' requires secure:true (already enforced in prod).
const SAME_SITE = IS_PROD ? ('none' as const) : ('lax' as const);

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: SAME_SITE,
  maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT_EXPIRES_IN)
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: SAME_SITE,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Frontend JS must read this
  secure: IS_PROD,
  sameSite: SAME_SITE,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const router: Router = Router();

// FINDING-015: Hash refresh tokens before storing in DB
// If DB is breached, hashed tokens are not directly usable
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Shared Auth Logic ─────────────────────────────────────────────────────

interface FindOrCreateResult {
  user: any;
  isNewUser: boolean;
}

/**
 * Find existing user by privy_did (primary), wallet, or email — or create a new one.
 * Supports wallet, email, and Twitter login via Privy.
 */
async function findOrCreateUser(
  privyDid: string,
  info: PrivyUserInfo,
  options: { referralCode?: string; authProvider?: string } = {}
): Promise<FindOrCreateResult> {
  const { referralCode, authProvider = 'privy' } = options;

  // Lookup order: privy_did → wallet_address → email
  let user = await db('users').where({ privy_did: privyDid }).first();

  if (!user && info.wallet) {
    user = await db('users')
      .whereRaw('LOWER(wallet_address) = LOWER(?)', [info.wallet.address])
      .first();
  }

  if (!user && info.email) {
    user = await db('users').where({ email: info.email }).first();
  }

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    let referrerId: string | null = null;

    if (referralCode) {
      const referrer = await db('users')
        .where({ referral_code: referralCode })
        .first();
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const userCount = await db('users').count('* as count').first();
    const totalUsers = parseInt((userCount?.count as string) || '0');
    const isFoundingMember = totalUsers < 1000;
    const foundingMemberNumber = isFoundingMember ? totalUsers + 1 : null;

    // Auto-generate username: @twitterHandle → email prefix → Trader_{uuid}
    const autoUsername = info.twitter?.handle
      ? `@${info.twitter.handle}`
      : info.email
        ? info.email.split('@')[0]
        : `Trader_${uuidv4().slice(0, 6)}`;

    // Generate referral code — use wallet fragment, twitter handle, or uuid
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    const identFragment = info.wallet
      ? info.wallet.address.slice(0, 8).toUpperCase()
      : info.twitter?.handle
        ? info.twitter.handle.slice(0, 8).toUpperCase()
        : uuidv4().slice(0, 8).toUpperCase();
    const refCode = `FORESIGHT_${identFragment}_${suffix}`;

    const walletAddress = info.wallet
      ? info.wallet.chainType === 'solana'
        ? info.wallet.address
        : info.wallet.address.toLowerCase()
      : null;

    const [newUser] = await db('users')
      .insert({
        id: uuidv4(),
        privy_did: privyDid,
        wallet_address: walletAddress,
        email: info.email || null,
        twitter_handle: info.twitter?.handle || null,
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

    if (referrerId) {
      awardReferrer(referrerId, user.id, isFoundingMember).catch((err) =>
        logger.error('Error awarding referrer:', err, { context: 'Auth API' })
      );
    }
  } else {
    // Existing user — update last_seen and backfill any newly linked accounts
    const updates: Record<string, any> = { last_seen_at: db.fn.now() };

    if (!user.privy_did) {
      updates.privy_did = privyDid;
    }
    if (user.auth_provider !== authProvider) {
      updates.auth_provider = authProvider;
    }
    if (info.wallet && !user.wallet_address) {
      const addr = info.wallet.chainType === 'solana'
        ? info.wallet.address
        : info.wallet.address.toLowerCase();
      updates.wallet_address = addr;
    } else if (info.wallet && user.wallet_address !== info.wallet.address) {
      // Fix case to match Privy
      updates.wallet_address = info.wallet.chainType === 'solana'
        ? info.wallet.address
        : info.wallet.address.toLowerCase();
    }
    if (info.email && !user.email) {
      updates.email = info.email;
    }
    if (info.twitter?.handle && !user.twitter_handle) {
      updates.twitter_handle = info.twitter.handle;
    }

    await db('users').where({ id: user.id }).update(updates);
    // Refresh user object with updates
    user = { ...user, ...updates };
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
    walletAddress: user.wallet_address || undefined,
    privyDid: user.privy_did || undefined,
    role: user.role,
  });

  const refreshToken = createRefreshToken({
    userId: user.id,
    walletAddress: user.wallet_address || undefined,
    privyDid: user.privy_did || undefined,
    role: user.role,
  });

  // Store session — FINDING-015: hash refresh token before storing
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db('sessions').insert({
    id: uuidv4(),
    user_id: user.id,
    access_token: accessToken,
    refresh_token: hashToken(refreshToken),
    expires_at: expiresAt,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    created_at: db.fn.now(),
  });

  // Create Tapestry profile on signup (async, non-blocking) — requires wallet
  if (isNewUser && user.wallet_address) {
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

  // FINDING-007: Set httpOnly cookies instead of sending tokens in body
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  // FINDING-021: Set CSRF token (readable by frontend JS)
  const csrfToken = generateCsrfToken();
  res.cookie('csrf-token', csrfToken, CSRF_COOKIE_OPTIONS);

  sendSuccess(res, {
    csrfToken,
    user: {
      id: user.id,
      walletAddress: user.wallet_address || null,
      email: user.email || null,
      twitterHandle: user.twitter_handle || null,
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

    const userInfo = await getPrivyUserInfo(claims.userId);
    if (!userInfo) {
      throw new AppError(
        'Could not retrieve Privy account information. Please try again.',
        400
      );
    }

    logger.info(`Privy auth successful`, {
      context: 'Auth API',
      data: {
        privyUserId: claims.userId,
        hasWallet: !!userInfo.wallet,
        hasEmail: !!userInfo.email,
        hasTwitter: !!userInfo.twitter,
      },
    });

    // Find/create user and create session
    const { user, isNewUser } = await findOrCreateUser(
      userInfo.privyDid,
      userInfo,
      { referralCode, authProvider: 'privy' }
    );

    await createSessionAndRespond(user, isNewUser, req, res);
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token (from httpOnly cookie or body)
 */
router.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Read refresh token from cookie (preferred) or body (legacy)
    const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshTokenValue) {
      throw new AppError('Refresh token is required', 400);
    }

    const payload = verifyToken(refreshTokenValue);
    if (!payload) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // FINDING-015: Compare against hashed refresh token
    const session = await db('sessions')
      .where({ refresh_token: hashToken(refreshTokenValue) })
      .first();

    if (!session) {
      throw new AppError('Session not found', 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      await db('sessions').where({ id: session.id }).del();
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      res.clearCookie('csrf-token', { path: '/' });
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

    // FINDING-007: Set new access token as httpOnly cookie
    res.cookie('accessToken', newAccessToken, ACCESS_COOKIE_OPTIONS);

    sendSuccess(res, { refreshed: true });
  })
);

/**
 * POST /api/auth/logout
 * Delete session and clear cookies
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    // Try to delete session if token is valid, but always clear cookies
    const token = req.cookies?.accessToken;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        await db('sessions').where({ user_id: payload.userId }).del();
      }
    }

    // FINDING-007: Always clear httpOnly cookies, even if token is expired
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('csrf-token', { path: '/' });

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
      walletAddress: user.wallet_address || null,
      email: user.email || null,
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
 * Get user's Tapestry integration status.
 * Auto-links if user has a wallet but no tapestry_user_id yet (backfill).
 */
router.get(
  '/tapestry-status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    let user = await db('users').where({ id: userId }).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Auto-backfill: if user has a wallet but no Tapestry profile, create one now
    if (!user.tapestry_user_id && user.wallet_address) {
      try {
        const profile = await tapestryService.findOrCreateProfile(
          user.wallet_address,
          user.username || `Trader_${user.wallet_address.slice(2, 8)}`
        );
        if (profile) {
          await db('users').where({ id: userId }).update({ tapestry_user_id: profile.id });
          user = { ...user, tapestry_user_id: profile.id };
          logger.info(`Tapestry profile auto-linked for user ${userId}: ${profile.id}`, { context: 'Auth API' });
        }
      } catch (err) {
        logger.error('Tapestry auto-link failed:', err, { context: 'Auth API' });
      }
    }

    let tapestryProfile = null;
    if (user.tapestry_user_id) {
      try {
        tapestryProfile = await tapestryService.getProfile(user.tapestry_user_id);
      } catch {
        // Tapestry API unreachable — still report connected from our DB
      }
    }

    sendSuccess(res, {
      connected: !!user.tapestry_user_id,
      tapestryUserId: user.tapestry_user_id || null,
      walletAddress: user.wallet_address || null,
      profile: tapestryProfile,
    });
  })
);

export default router;
