import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * GET /api/users/me
 * Get current user's profile (authenticated)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      twitterHandle: user.twitter_handle,
      avatarUrl: user.avatar_url,
      xp: user.xp || 0,
      ctMasteryScore: user.ct_mastery_score,
      ctMasteryLevel: user.ct_mastery_level,
      createdAt: user.created_at,
    });
  })
);

/**
 * GET /api/users/:walletAddress
 * Get user profile by wallet address
 */
router.get(
  '/:walletAddress',
  optionalAuthenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    const user = await db('users')
      .where({ wallet_address: walletAddress.toLowerCase() })
      .first();

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
    });
  })
);

/**
 * PATCH /api/users/profile
 * Update user profile
 */
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { username, twitterHandle, avatarUrl } = req.body;

    const updates: any = {};

    if (username !== undefined) {
      // Check if username is taken
      const existing = await db('users')
        .where({ username })
        .whereNot({ id: userId })
        .first();

      if (existing) {
        throw new AppError('Username already taken', 400);
      }

      updates.username = username;
    }

    if (twitterHandle !== undefined) {
      updates.twitter_handle = twitterHandle;
    }

    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('No updates provided', 400);
    }

    await db('users').where({ id: userId }).update(updates);

    const updatedUser = await db('users').where({ id: userId }).first();

    res.json({
      id: updatedUser.id,
      walletAddress: updatedUser.wallet_address,
      username: updatedUser.username,
      twitterHandle: updatedUser.twitter_handle,
      avatarUrl: updatedUser.avatar_url,
      ctMasteryScore: updatedUser.ct_mastery_score,
      ctMasteryLevel: updatedUser.ct_mastery_level,
    });
  })
);

/**
 * GET /api/users/leaderboard
 * Get top users by CT Mastery Score
 */
router.get(
  '/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await db('users')
      .select(
        'id',
        'wallet_address',
        'username',
        'avatar_url',
        'ct_mastery_score',
        'ct_mastery_level'
      )
      .orderBy('ct_mastery_score', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('users').count('* as count').first();

    res.json({
      users,
      total: parseInt(total?.count as string) || 0,
      limit,
      offset,
    });
  })
);

export default router;
