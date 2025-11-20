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

const router: Router = Router();

/**
 * GET /api/auth/nonce
 * Generate a nonce for SIWE message
 */
router.get(
  '/nonce',
  asyncHandler(async (req: Request, res: Response) => {
    const nonce = generateNonce();

    res.json({ nonce });
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
    const { message, signature } = req.body;

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

    if (!user) {
      // Create new user
      const [newUser] = await db('users')
        .insert({
          id: uuidv4(),
          wallet_address: walletAddress,
          created_at: db.fn.now(),
          last_seen_at: db.fn.now(),
        })
        .returning('*');

      user = newUser;
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
    });

    const refreshToken = createRefreshToken({
      userId: user.id,
      walletAddress: user.wallet_address,
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

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url,
        ctMasteryScore: user.ct_mastery_score,
        ctMasteryLevel: user.ct_mastery_level,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Verify SIWE message and create session
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, signature } = req.body;

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

    if (!user) {
      // Create new user
      const [newUser] = await db('users')
        .insert({
          id: uuidv4(),
          wallet_address: walletAddress,
          created_at: db.fn.now(),
          last_seen_at: db.fn.now(),
        })
        .returning('*');

      user = newUser;
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
    });

    const refreshToken = createRefreshToken({
      userId: user.id,
      walletAddress: user.wallet_address,
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

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url,
        ctMasteryScore: user.ct_mastery_score,
        ctMasteryLevel: user.ct_mastery_level,
      },
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
    });

    // Update session
    await db('sessions')
      .where({ id: session.id })
      .update({
        access_token: newAccessToken,
      });

    res.json({ accessToken: newAccessToken });
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

    res.json({ message: 'Logged out successfully' });
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

    res.json({
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
