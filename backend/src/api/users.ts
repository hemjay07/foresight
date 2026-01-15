import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import questService from '../services/questService';
import logger from '../utils/logger';

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
      .where({ 'users.id': userId })
      .leftJoin('user_xp_totals', 'users.id', 'user_xp_totals.user_id')
      .select(
        'users.*',
        'user_xp_totals.total_xp as xp'
      )
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      twitterHandle: user.twitter_handle,
      avatarUrl: user.avatar_url,
      xp: user.xp || 0,
      voteStreak: user.vote_streak || 0,
      lastVoteDate: user.last_vote_date,
      ctMasteryScore: user.ct_mastery_score,
      ctMasteryLevel: user.ct_mastery_level,
      createdAt: user.created_at,
    });
  })
);

/**
 * GET /api/users/xp-leaderboard
 * Get top users by XP with level info
 */
router.get(
  '/xp-leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const period = req.query.period as string || 'all-time';

    let query = db('users')
      .leftJoin('user_xp_totals', 'users.id', 'user_xp_totals.user_id')
      .select(
        'users.id',
        'users.wallet_address',
        'users.username',
        'users.avatar_url',
        'users.vote_streak',
        'user_xp_totals.total_xp as xp',
        'user_xp_totals.lifetime_xp'
      );

    if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      query = query
        .where('user_xp_totals.last_xp_at', '>=', startOfMonth)
        .orderBy('user_xp_totals.total_xp', 'desc');
    } else {
      query = query.orderByRaw('COALESCE(user_xp_totals.lifetime_xp, 0) DESC');
    }

    const users = await query.limit(limit).offset(offset);
    const total = await db('users').count('* as count').first();

    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      xp: user.xp || 0,
      lifetime_xp: user.lifetime_xp || 0,
    }));

    sendSuccess(res, {
      users: rankedUsers,
      total: parseInt(total?.count as string) || 0,
      limit,
      offset,
      period,
    });
  })
);

/**
 * GET /api/users/achievements
 * Get user's achievements
 */
router.get(
  '/achievements',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const achievements = await db('user_achievements')
      .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
      .where({ user_id: userId })
      .select(
        'achievements.id',
        'achievements.key',
        'achievements.name',
        'achievements.description',
        'achievements.icon',
        'achievements.xp_reward',
        'achievements.rarity',
        'user_achievements.unlocked_at'
      )
      .orderBy('user_achievements.unlocked_at', 'desc');

    const allAchievements = await db('achievements').select('*');

    sendSuccess(res, {
      unlocked: achievements,
      all: allAchievements,
      total_unlocked: achievements.length,
      total_available: allAchievements.length,
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

    sendSuccess(res, {
      users,
      total: parseInt(total?.count as string) || 0,
      limit,
      offset,
    });
  })
);

/**
 * GET /api/users/stats/me
 * Get comprehensive stats for current user
 */
router.get(
  '/stats/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get user basic info
    const user = await db('users')
      .where({ 'users.id': userId })
      .leftJoin('user_xp_totals', 'users.id', 'user_xp_totals.user_id')
      .select(
        'users.*',
        'user_xp_totals.total_xp as xp',
        'user_xp_totals.lifetime_xp'
      )
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get voting stats
    const voteStats = await db('daily_votes')
      .where({ user_id: userId })
      .count('* as total_votes')
      .first();

    // Get fantasy team stats
    const fantasyStats = await db('user_teams')
      .where({ user_id: userId })
      .select(
        db.raw('COUNT(*) as total_teams'),
        db.raw('MAX(total_score) as best_score'),
        db.raw('AVG(total_score) as avg_score')
      )
      .first();

    // Get achievement stats
    const achievementStats = await db('user_achievements')
      .where({ user_id: userId })
      .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
      .select(
        db.raw('COUNT(*) as total_achievements'),
        db.raw('SUM(achievements.xp_reward) as xp_from_achievements')
      )
      .first();

    // Get recent XP history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const xpHistory = await db('user_xp_ledger')
      .where({ user_id: userId })
      .where('earned_at', '>=', thirtyDaysAgo)
      .select(
        db.raw('DATE(earned_at) as date'),
        db.raw('SUM(xp_amount) as xp_earned'),
        'source_type as source'
      )
      .groupBy(db.raw('DATE(earned_at)'), 'source_type')
      .orderBy('date', 'asc');

    // Get XP breakdown by source
    const xpBySource = await db('user_xp_ledger')
      .where({ user_id: userId })
      .select(
        'source_type as source',
        db.raw('SUM(xp_amount) as total_xp'),
        db.raw('COUNT(*) as count')
      )
      .groupBy('source_type');

    // Get user rank
    const rankQuery = await db('user_xp_totals')
      .where('lifetime_xp', '>', user.lifetime_xp || user.xp || 0)
      .count('* as rank')
      .first();
    const userRank = (parseInt(rankQuery?.rank as string) || 0) + 1;

    // Get total users for percentile
    const totalUsers = await db('users').count('* as count').first();
    const percentile = totalUsers ?
      Math.round(((parseInt(totalUsers.count as string) - userRank) / parseInt(totalUsers.count as string)) * 100) :
      0;

    sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        wallet_address: user.wallet_address,
        avatar_url: user.avatar_url,
        xp: user.xp || 0,
        lifetime_xp: user.lifetime_xp || 0,
        vote_streak: user.vote_streak || 0,
        ct_mastery_score: user.ct_mastery_score || 0,
        ct_mastery_level: user.ct_mastery_level || 0,
      },
      ranking: {
        rank: userRank,
        percentile,
        total_users: parseInt(totalUsers?.count as string) || 0,
      },
      stats: {
        voting: {
          total_votes: parseInt(voteStats?.total_votes as string) || 0,
          current_streak: user.vote_streak || 0,
        },
        fantasy: {
          total_teams: parseInt(fantasyStats?.total_teams as string) || 0,
          best_score: parseFloat(fantasyStats?.best_score as string) || 0,
          avg_score: parseFloat(fantasyStats?.avg_score as string) || 0,
        },
        achievements: {
          total_unlocked: parseInt(achievementStats?.total_achievements as string) || 0,
          xp_earned: parseInt(achievementStats?.xp_from_achievements as string) || 0,
        },
      },
      xp_history: xpHistory,
      xp_by_source: xpBySource,
    });
  })
);

/**
 * GET /api/users/stats/trending
 * Get trending users and weekly highlights
 */
router.get(
  '/stats/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get top XP gainers this week
    const topGainers = await db('user_xp_ledger')
      .where('earned_at', '>=', sevenDaysAgo)
      .join('users', 'user_xp_ledger.user_id', 'users.id')
      .select(
        'users.id',
        'users.username',
        'users.wallet_address',
        'users.avatar_url',
        db.raw('SUM(user_xp_ledger.xp_amount) as xp_gained')
      )
      .groupBy('users.id', 'users.username', 'users.wallet_address', 'users.avatar_url')
      .orderBy('xp_gained', 'desc')
      .limit(10);

    // Get most active voters this week
    const topVoters = await db('daily_votes')
      .where('daily_votes.created_at', '>=', sevenDaysAgo)
      .join('users', 'daily_votes.user_id', 'users.id')
      .select(
        'users.id',
        'users.username',
        'users.wallet_address',
        'users.avatar_url',
        db.raw('COUNT(*) as vote_count')
      )
      .groupBy('users.id', 'users.username', 'users.wallet_address', 'users.avatar_url')
      .orderBy('vote_count', 'desc')
      .limit(10);

    // Get recent achievement unlocks
    const recentAchievements = await db('user_achievements')
      .where('unlocked_at', '>=', sevenDaysAgo)
      .join('users', 'user_achievements.user_id', 'users.id')
      .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
      .select(
        'users.id as user_id',
        'users.username',
        'users.wallet_address',
        'users.avatar_url',
        'achievements.name as achievement_name',
        'achievements.icon',
        'achievements.rarity',
        'user_achievements.unlocked_at'
      )
      .orderBy('user_achievements.unlocked_at', 'desc')
      .limit(20);

    // Get longest active streaks
    const topStreaks = await db('users')
      .where('vote_streak', '>', 0)
      .select(
        'id',
        'username',
        'wallet_address',
        'avatar_url',
        'vote_streak'
      )
      .orderBy('vote_streak', 'desc')
      .limit(10);

    sendSuccess(res, {
      top_gainers: topGainers,
      top_voters: topVoters,
      recent_achievements: recentAchievements,
      top_streaks: topStreaks,
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

    sendSuccess(res, {
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

    // Check if user had no username before (for quest tracking)
    const currentUser = await db('users').where({ id: userId }).first();
    const hadNoUsername = !currentUser.username;

    await db('users').where({ id: userId }).update(updates);

    // Trigger quest if username was set for the first time
    if (updates.username && hadNoUsername) {
      questService.triggerAction(userId, 'username_set').catch((err) =>
        logger.error('Error triggering username_set quest:', err, { context: 'Users API' })
      );
    }

    const updatedUser = await db('users').where({ id: userId }).first();

    sendSuccess(res, {
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

export default router;
