/**
 * Foresight Score API
 *
 * Endpoints for:
 * - Getting user's FS data
 * - Leaderboards
 * - Transaction history
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import foresightScoreService from '../services/foresightScoreService';
import questService from '../services/questService';
import { validators, handleValidationErrors } from '../middleware/validation';
import logger from '../utils/logger';

// Extended request type with user info
interface AuthRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

// Helper to get userId from request
const getUserId = (req: AuthRequest): string | undefined => {
  return req.user?.userId;
};
import db from '../utils/db';

const router = Router();

/**
 * GET /api/v2/fs/me
 * Get current user's Foresight Score data
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const fsData = await foresightScoreService.getUserFs(userId);

    if (!fsData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get ranks
    const allTimeRank = await foresightScoreService.getUserRank(userId, 'all_time');
    const seasonRank = await foresightScoreService.getUserRank(userId, 'season');
    const weekRank = await foresightScoreService.getUserRank(userId, 'weekly');

    // Calculate tier progress
    const tierThresholds = {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 20000,
      diamond: 50000,
    };

    const currentTierThreshold = tierThresholds[fsData.tier as keyof typeof tierThresholds] || 0;
    const nextTiers = Object.entries(tierThresholds).filter(([_, threshold]) => threshold > currentTierThreshold);
    const nextTier = nextTiers.length > 0 ? nextTiers[0] : null;

    const tierProgress = nextTier
      ? {
          currentTier: fsData.tier,
          nextTier: nextTier[0],
          currentThreshold: currentTierThreshold,
          nextThreshold: nextTier[1],
          progress: Math.min(100, ((fsData.totalScore - currentTierThreshold) / (nextTier[1] - currentTierThreshold)) * 100),
          fsToNextTier: nextTier[1] - fsData.totalScore,
        }
      : {
          currentTier: 'diamond',
          nextTier: null,
          progress: 100,
          fsToNextTier: 0,
        };

    // Calculate effective multiplier
    const effectiveMultiplier = await foresightScoreService.calculateMultiplier(userId);

    // Check if early adopter multiplier is active
    const multiplierActive = fsData.multiplierExpiresAt
      ? new Date(fsData.multiplierExpiresAt) > new Date()
      : false;

    const multiplierDaysRemaining = multiplierActive && fsData.multiplierExpiresAt
      ? Math.ceil((new Date(fsData.multiplierExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return res.json({
      success: true,
      data: {
        ...fsData,
        allTimeRank: allTimeRank?.rank || null,
        allTimeTotal: allTimeRank?.total || 0,
        seasonRank: seasonRank?.rank || null,
        seasonTotal: seasonRank?.total || 0,
        weekRank: weekRank?.rank || null,
        weekTotal: weekRank?.total || 0,
        tierProgress,
        effectiveMultiplier,
        multiplierActive,
        multiplierDaysRemaining,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting user FS:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/leaderboard
 * Get leaderboard data
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'all_time';
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!['all_time', 'season', 'weekly', 'referral'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid leaderboard type' });
    }

    const leaderboard = await foresightScoreService.getLeaderboard(
      type as 'all_time' | 'season' | 'weekly' | 'referral',
      limit,
      offset
    );

    // Get total count
    const scoreColumn = {
      all_time: 'total_score',
      season: 'season_score',
      weekly: 'week_score',
      referral: 'referral_score',
    }[type];

    const totalResult = await db('foresight_scores')
      .count('* as count')
      .where(scoreColumn!, '>', 0)
      .first();

    const total = parseInt(totalResult?.count as string) || 0;

    return res.json({
      success: true,
      data: {
        type,
        entries: leaderboard,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting leaderboard:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/leaderboard/position
 * Get current user's position on a leaderboard
 */
router.get('/leaderboard/position', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const type = (req.query.type as string) || 'all_time';

    if (!['all_time', 'season', 'weekly', 'referral'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid leaderboard type' });
    }

    const position = await foresightScoreService.getUserRank(
      userId,
      type as 'all_time' | 'season' | 'weekly' | 'referral'
    );

    if (!position) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Trigger daily quest for checking scores
    questService.triggerAction(userId, 'check_scores').catch(console.error);

    return res.json({
      success: true,
      data: {
        type,
        rank: position.rank,
        total: position.total,
        percentile: position.total > 0
          ? Math.round((1 - (position.rank / position.total)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting position:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/history
 * Get user's FS transaction history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await foresightScoreService.getTransactionHistory(userId, limit, offset);

    // Get total count
    const totalResult = await db('foresight_score_transactions')
      .count('* as count')
      .where({ user_id: userId })
      .first();

    const total = parseInt(totalResult?.count as string) || 0;

    return res.json({
      success: true,
      data: {
        transactions,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting history:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/config
 * Get FS earning config (public)
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const config = await db('foresight_score_config')
      .select('key', 'category', 'base_amount', 'description')
      .where({ is_active: true })
      .orderBy(['category', 'key']);

    // Group by category
    const grouped = config.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({
        key: item.key,
        baseAmount: item.base_amount,
        description: item.description,
      });
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        config: grouped,
        tiers: {
          bronze: { threshold: 0, multiplier: 1.0 },
          silver: { threshold: 1000, multiplier: 1.05 },
          gold: { threshold: 5000, multiplier: 1.1 },
          platinum: { threshold: 20000, multiplier: 1.15 },
          diamond: { threshold: 50000, multiplier: 1.2 },
        },
        earlyAdopterTiers: {
          founding: { range: '1-1000', multiplier: 1.5, duration: '90 days' },
          early: { range: '1001-5000', multiplier: 1.25, duration: '60 days' },
          bird: { range: '5001-10000', multiplier: 1.1, duration: '30 days' },
          standard: { range: '10001+', multiplier: 1.0, duration: 'N/A' },
        },
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting config:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/founding-members
 * Get founding members wall
 */
router.get('/founding-members', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const founders = await db('users')
      .select(
        'id',
        'username',
        'avatar_url as avatarUrl',
        'founding_member_number as foundingMemberNumber',
        'created_at as joinedAt'
      )
      .where('is_founding_member', true)
      .whereNotNull('founding_member_number')
      .orderBy('founding_member_number', 'asc')
      .limit(limit)
      .offset(offset);

    // Get count of claimed spots
    const countResult = await db('users')
      .count('* as count')
      .where('is_founding_member', true)
      .first();

    const claimed = parseInt(countResult?.count as string) || 0;

    return res.json({
      success: true,
      data: {
        founders,
        claimed,
        total: 1000,
        remaining: Math.max(0, 1000 - claimed),
        isClosed: claimed >= 1000,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting founding members:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/fs/track-activity
 * Track daily activity and award FS if eligible
 * Used for browse_ct_feed, check_live_scores, etc.
 */
router.post('/track-activity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { activityType, durationSeconds } = req.body;

    // Validate activity type
    const validActivities = ['browse_ct_feed', 'check_live_scores', 'daily_login'];
    if (!activityType || !validActivities.includes(activityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid activity type. Valid: browse_ct_feed, check_live_scores, daily_login'
      });
    }

    // For browse activities, require minimum duration
    if (activityType === 'browse_ct_feed' && (!durationSeconds || durationSeconds < 30)) {
      return res.status(400).json({
        success: false,
        error: 'Browse activity requires minimum 30 seconds',
        required: 30,
        provided: durationSeconds || 0
      });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if already claimed today
    const existing = await db('user_daily_activities')
      .where({
        user_id: userId,
        activity_type: activityType,
        activity_date: today,
      })
      .first();

    if (existing) {
      return res.json({
        success: true,
        data: {
          alreadyClaimed: true,
          message: 'Already claimed today',
          activityType,
          claimedAt: existing.created_at,
        },
      });
    }

    // Record the activity (don't award FS here - quest system handles rewards)
    await db('user_daily_activities').insert({
      user_id: userId,
      activity_type: activityType,
      activity_date: today,
      duration_seconds: durationSeconds || null,
      metadata: JSON.stringify({ questTriggered: true }),
    });

    // Map activity to quest action and reward amount
    const questMap: Record<string, { action: string; fsReward: number }> = {
      browse_ct_feed: { action: 'browse_feed', fsReward: 10 },
      check_live_scores: { action: 'check_scores', fsReward: 10 },
      daily_login: { action: 'daily_login', fsReward: 10 },
    };

    // Trigger quest progress (quest system handles FS rewards)
    const questInfo = questMap[activityType];
    if (questInfo) {
      questService.triggerAction(userId, questInfo.action).catch(console.error);
    }

    return res.json({
      success: true,
      data: {
        alreadyClaimed: false,
        fsAwarded: questInfo?.fsReward || 10,
        activityType,
        message: `Quest triggered! Claim +${questInfo?.fsReward || 10} FS in Quests`,
      },
    });
  } catch (error) {
    console.error('[FS API] Error tracking activity:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/fs/daily-status
 * Check which daily activities have been completed
 */
router.get('/daily-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];

    const completedToday = await db('user_daily_activities')
      .where({
        user_id: userId,
        activity_date: today,
      })
      .select('activity_type', 'created_at', 'duration_seconds');

    const activities = {
      browse_ct_feed: { completed: false, requiredSeconds: 30, fsReward: 10 },
      check_live_scores: { completed: false, fsReward: 10 },
      daily_login: { completed: false, fsReward: 10 },
    };

    for (const record of completedToday) {
      const type = record.activity_type as keyof typeof activities;
      if (activities[type]) {
        activities[type].completed = true;
      }
    }

    return res.json({
      success: true,
      data: {
        date: today,
        activities,
        completedCount: completedToday.length,
        totalPossible: Object.keys(activities).length,
      },
    });
  } catch (error) {
    console.error('[FS API] Error getting daily status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/fs/earn (Internal - requires admin or service auth)
 * Manually award FS (for testing or admin purposes)
 */
router.post(
  '/earn',
  authenticate,
  requireAdmin,
  [
    validators.uuidBody('targetUserId'),
    validators.sanitizeString('reason', 200),
    validators.sanitizeString('category', 50),
    validators.amount('amount'),
    handleValidationErrors,
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { targetUserId, reason, category, amount, sourceType, sourceId, metadata } = req.body;

      const result = await foresightScoreService.earnFs({
        userId: targetUserId,
        reason,
        category,
        baseAmount: amount,
        sourceType,
        sourceId,
        metadata,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error earning FS:', error, { context: 'FS API' });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
