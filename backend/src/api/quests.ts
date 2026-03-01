/**
 * Quest System API
 *
 * Endpoints for:
 * - Getting available quests
 * - Tracking quest progress
 * - Claiming quest rewards
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import db from '../utils/db';
import foresightScoreService from '../services/foresightScoreService';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    walletAddress?: string;
  };
}

const router = Router();

/**
 * GET /api/v2/quests
 * Get all available quests with user progress
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get current period dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Weekly period (Monday to Sunday)
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get all active quest definitions
    const questDefinitions = await db('quest_definitions_v2')
      .where({ is_active: true })
      .orderBy(['quest_type', 'display_order']);

    // Get user's quest progress
    const userQuests = await db('user_quests_v2')
      .where({ user_id: userId });

    // Helper to normalize date for comparison (handles Date objects and strings)
    // Must use UTC methods to match toISOString() — local methods diverge on non-UTC servers
    const normalizeDate = (d: Date | string | null): string | null => {
      if (!d) return null;
      if (typeof d === 'string') return d.split('T')[0];
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Map quests with user progress
    const quests = questDefinitions.map((def: any) => {
      // Find matching user quest based on type and period
      let userQuest = null;

      if (def.quest_type === 'daily') {
        userQuest = userQuests.find((uq: any) =>
          uq.quest_id === def.id && normalizeDate(uq.period_start) === today
        );
      } else if (def.quest_type === 'weekly') {
        userQuest = userQuests.find((uq: any) =>
          uq.quest_id === def.id && normalizeDate(uq.period_start) === weekStartStr
        );
      } else {
        // One-time quests (onboarding, achievement)
        userQuest = userQuests.find((uq: any) => uq.quest_id === def.id);
      }

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        questType: def.quest_type,
        category: def.category,
        target: def.target,
        targetType: def.target_type,
        fsReward: def.fs_reward,
        icon: def.icon,
        displayOrder: def.display_order,
        // User progress
        progress: userQuest?.progress || 0,
        isCompleted: userQuest?.is_completed || false,
        completedAt: userQuest?.completed_at,
        isClaimed: userQuest?.is_claimed || false,
        claimedAt: userQuest?.claimed_at,
        fsEarned: userQuest?.fs_earned || 0,
      };
    });

    // Group by quest type
    const grouped = {
      onboarding: quests.filter((q: any) => q.questType === 'onboarding'),
      daily: quests.filter((q: any) => q.questType === 'daily'),
      weekly: quests.filter((q: any) => q.questType === 'weekly'),
      achievement: quests.filter((q: any) => q.questType === 'achievement'),
    };

    // Calculate summary stats
    const summary = {
      onboarding: {
        total: grouped.onboarding.length,
        completed: grouped.onboarding.filter((q: any) => q.isCompleted).length,
        claimed: grouped.onboarding.filter((q: any) => q.isClaimed).length,
      },
      daily: {
        total: grouped.daily.length,
        completed: grouped.daily.filter((q: any) => q.isCompleted).length,
        claimed: grouped.daily.filter((q: any) => q.isClaimed).length,
      },
      weekly: {
        total: grouped.weekly.length,
        completed: grouped.weekly.filter((q: any) => q.isCompleted).length,
        claimed: grouped.weekly.filter((q: any) => q.isClaimed).length,
      },
      achievement: {
        total: grouped.achievement.length,
        completed: grouped.achievement.filter((q: any) => q.isCompleted).length,
        claimed: grouped.achievement.filter((q: any) => q.isClaimed).length,
      },
    };

    return res.json({
      success: true,
      data: {
        quests: grouped,
        summary,
        periods: {
          daily: today,
          weekStart: weekStartStr,
        },
      },
    });
  } catch (error) {
    console.error('[Quests API] Error getting quests:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/quests/summary
 * Get quest summary stats only (lightweight endpoint)
 */
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get current period dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Weekly period (Monday to Sunday)
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Count quests by type
    const questCounts = await db('quest_definitions_v2')
      .where({ is_active: true })
      .select('quest_type')
      .count('* as total')
      .groupBy('quest_type');

    // Count user completions for today (daily) and this week (weekly)
    const dailyCompleted = await db('user_quests_v2')
      .where({ user_id: userId, is_completed: true, period_start: today })
      .whereIn('quest_id', db('quest_definitions_v2').select('id').where('quest_type', 'daily'))
      .count('* as count')
      .first();

    const weeklyCompleted = await db('user_quests_v2')
      .where({ user_id: userId, is_completed: true, period_start: weekStartStr })
      .whereIn('quest_id', db('quest_definitions_v2').select('id').where('quest_type', 'weekly'))
      .count('* as count')
      .first();

    const onboardingCompleted = await db('user_quests_v2')
      .where({ user_id: userId, is_completed: true })
      .whereIn('quest_id', db('quest_definitions_v2').select('id').where('quest_type', 'onboarding'))
      .count('* as count')
      .first();

    // Count unclaimed rewards
    const unclaimed = await db('user_quests_v2')
      .where({ user_id: userId, is_completed: true, is_claimed: false })
      .count('* as count')
      .first();

    // Build summary object
    const countMap = Object.fromEntries(
      questCounts.map((c: any) => [c.quest_type, parseInt(c.total)])
    );

    return res.json({
      success: true,
      data: {
        daily: {
          total: countMap.daily || 0,
          completed: parseInt(String(dailyCompleted?.count || 0)),
        },
        weekly: {
          total: countMap.weekly || 0,
          completed: parseInt(String(weeklyCompleted?.count || 0)),
        },
        onboarding: {
          total: countMap.onboarding || 0,
          completed: parseInt(String(onboardingCompleted?.count || 0)),
        },
        unclaimed: parseInt(String(unclaimed?.count || 0)),
        periods: {
          daily: today,
          weekStart: weekStartStr,
        },
      },
    });
  } catch (error) {
    console.error('[Quests API] Error getting summary:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/quests/:questId/progress
 * Update quest progress (called by game actions)
 */
router.post('/:questId/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { questId } = req.params;
    const { increment = 1 } = req.body;

    // Get quest definition
    const questDef = await db('quest_definitions_v2')
      .where({ id: questId, is_active: true })
      .first();

    if (!questDef) {
      return res.status(404).json({ success: false, error: 'Quest not found' });
    }

    // Calculate period dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Determine period based on quest type
    let periodType: string | null = null;
    let periodStart: string | null = null;
    let periodEnd: string | null = null;

    if (questDef.quest_type === 'daily') {
      periodType = 'daily';
      periodStart = today;
      periodEnd = today;
    } else if (questDef.quest_type === 'weekly') {
      periodType = 'weekly';
      periodStart = weekStartStr;
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      periodEnd = weekEnd.toISOString().split('T')[0];
    }

    // Find or create user quest record
    let userQuest = await db('user_quests_v2')
      .where({
        user_id: userId,
        quest_id: questId,
        period_start: periodStart,
      })
      .first();

    if (!userQuest) {
      // Create new quest progress record
      const [newQuest] = await db('user_quests_v2')
        .insert({
          user_id: userId,
          quest_id: questId,
          progress: 0,
          target: questDef.target,
          fs_reward: questDef.fs_reward,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
        })
        .returning('*');
      userQuest = newQuest;
    }

    // Don't update if already completed
    if (userQuest.is_completed) {
      return res.json({
        success: true,
        data: {
          questId,
          progress: userQuest.progress,
          target: questDef.target,
          isCompleted: true,
          isClaimed: userQuest.is_claimed,
        },
      });
    }

    // Update progress
    const newProgress = Math.min(userQuest.progress + increment, questDef.target);
    const isNowCompleted = newProgress >= questDef.target;

    await db('user_quests_v2')
      .where({ id: userQuest.id })
      .update({
        progress: newProgress,
        is_completed: isNowCompleted,
        completed_at: isNowCompleted ? db.fn.now() : null,
        updated_at: db.fn.now(),
      });

    return res.json({
      success: true,
      data: {
        questId,
        progress: newProgress,
        target: questDef.target,
        isCompleted: isNowCompleted,
        isClaimed: false,
        fsReward: questDef.fs_reward,
      },
    });
  } catch (error) {
    console.error('[Quests API] Error updating progress:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/quests/:questId/claim
 * Claim reward for a completed quest
 */
router.post('/:questId/claim', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { questId } = req.params;

    // Get quest definition
    const questDef = await db('quest_definitions_v2')
      .where({ id: questId, is_active: true })
      .first();

    if (!questDef) {
      return res.status(404).json({ success: false, error: 'Quest not found' });
    }

    // Calculate period dates for finding the right quest record
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    let periodStart: string | null = null;
    if (questDef.quest_type === 'daily') {
      periodStart = today;
    } else if (questDef.quest_type === 'weekly') {
      periodStart = weekStartStr;
    }

    // Find user's quest
    const userQuest = await db('user_quests_v2')
      .where({
        user_id: userId,
        quest_id: questId,
        period_start: periodStart,
      })
      .first();

    if (!userQuest) {
      return res.status(404).json({ success: false, error: 'Quest progress not found' });
    }

    if (!userQuest.is_completed) {
      return res.status(400).json({ success: false, error: 'Quest not completed yet' });
    }

    if (userQuest.is_claimed) {
      return res.status(400).json({ success: false, error: 'Reward already claimed' });
    }

    // Award Foresight Score
    const fsResult = await foresightScoreService.earnFs({
      userId,
      reason: `quest_${questId}`,
      category: questDef.category || 'engagement',
      baseAmount: questDef.fs_reward,
      sourceType: 'quest',
      sourceId: questId,
      metadata: {
        questName: questDef.name,
        questType: questDef.quest_type,
      },
    });

    // Mark as claimed
    await db('user_quests_v2')
      .where({ id: userQuest.id })
      .update({
        is_claimed: true,
        claimed_at: db.fn.now(),
        fs_earned: fsResult.multipliedAmount,
        updated_at: db.fn.now(),
      });

    return res.json({
      success: true,
      data: {
        questId,
        questName: questDef.name,
        baseReward: questDef.fs_reward,
        multipliedReward: fsResult.multipliedAmount,
        multiplier: fsResult.multiplier,
        newTotal: fsResult.newTotal,
        tierChanged: fsResult.tierChanged,
        newTier: fsResult.newTier,
      },
    });
  } catch (error) {
    console.error('[Quests API] Error claiming reward:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/quests/check-and-complete
 * Check if a quest should be completed based on action (internal use)
 */
router.post('/check-and-complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { action, metadata } = req.body;

    // Map actions to quest IDs
    const actionToQuestMap: Record<string, string[]> = {
      'wallet_connected': ['onboard_connect_wallet'],
      'username_set': ['onboard_set_username'],
      'team_created': ['onboard_create_team'],
      'contest_entered': ['onboard_enter_contest', 'weekly_enter_contest'],
      'daily_login': ['daily_login'],
      'check_scores': ['daily_check_scores'],
      'browse_feed': ['daily_browse_feed'],
      'prediction_made': ['daily_prediction'],
      'share_take': ['daily_share_take'],
      'twitter_followed': ['onboard_follow_twitter', 'weekly_tweet'],
      'friend_invited': ['onboard_invite_friend'],
      'referral_converted': ['weekly_referral'],
      'contest_top_50': ['weekly_top_50'],
      'contest_top_10': ['weekly_top_10'],
      'contest_win': ['achieve_first_win'],
    };

    const questIds = actionToQuestMap[action] || [];
    const results = [];

    for (const questId of questIds) {
      // Trigger progress update for each matching quest
      const progressResult = await updateQuestProgress(userId, questId, 1);
      if (progressResult) {
        results.push(progressResult);
      }
    }

    return res.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error('[Quests API] Error checking quests:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Helper function to update quest progress
async function updateQuestProgress(userId: string, questId: string, increment: number = 1) {
  try {
    const questDef = await db('quest_definitions_v2')
      .where({ id: questId, is_active: true })
      .first();

    if (!questDef) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    let periodType: string | null = null;
    let periodStart: string | null = null;
    let periodEnd: string | null = null;

    if (questDef.quest_type === 'daily') {
      periodType = 'daily';
      periodStart = today;
      periodEnd = today;
    } else if (questDef.quest_type === 'weekly') {
      periodType = 'weekly';
      periodStart = weekStartStr;
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      periodEnd = weekEnd.toISOString().split('T')[0];
    }

    let userQuest = await db('user_quests_v2')
      .where({
        user_id: userId,
        quest_id: questId,
        period_start: periodStart,
      })
      .first();

    if (!userQuest) {
      const [newQuest] = await db('user_quests_v2')
        .insert({
          user_id: userId,
          quest_id: questId,
          progress: 0,
          target: questDef.target,
          fs_reward: questDef.fs_reward,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
        })
        .returning('*');
      userQuest = newQuest;
    }

    if (userQuest.is_completed) {
      return { questId, alreadyCompleted: true };
    }

    const newProgress = Math.min(userQuest.progress + increment, questDef.target);
    const isNowCompleted = newProgress >= questDef.target;

    await db('user_quests_v2')
      .where({ id: userQuest.id })
      .update({
        progress: newProgress,
        is_completed: isNowCompleted,
        completed_at: isNowCompleted ? db.fn.now() : null,
        updated_at: db.fn.now(),
      });

    return {
      questId,
      questName: questDef.name,
      progress: newProgress,
      target: questDef.target,
      isCompleted: isNowCompleted,
      fsReward: questDef.fs_reward,
    };
  } catch (error) {
    console.error(`Error updating quest ${questId}:`, error);
    return null;
  }
}

export default router;
