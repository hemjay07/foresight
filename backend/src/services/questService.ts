/**
 * Quest Service
 *
 * Handles quest progress triggers from various game actions.
 * This allows other parts of the system to trigger quest progress.
 */

import db from '../utils/db';

// Action to quest ID mappings
// IMPORTANT: Quest IDs must match quest_definitions_v2 table exactly
const ACTION_QUEST_MAP: Record<string, string[]> = {
  // Onboarding quests
  'wallet_connected': ['onboard_connect_wallet'],
  'username_set': ['onboard_set_username'],
  'team_created': ['onboard_create_team'],
  'contest_entered': ['onboard_enter_contest', 'weekly_enter_contest'],
  'follow_twitter': ['onboard_follow_twitter'],
  'invite_friend': ['onboard_invite_friend'],

  // Daily quests
  'daily_login': ['daily_login'],
  'check_scores': ['daily_check_scores'],
  'browse_feed': ['daily_browse_feed'],
  'make_prediction': ['daily_prediction'],  // Deferred to v2
  'share_take': ['daily_share_take'],       // Feature not built

  // Weekly quests
  'twitter_tweet': ['weekly_tweet'],
  'referral_converted': ['weekly_referral'],
  'contest_top_50': ['weekly_top_50'],
  'contest_top_10': ['weekly_top_10'],

  // Achievement quests - Contest wins
  'first_win': ['achieve_first_win'],
  'contest_win': ['achieve_champion', 'achieve_legend'],  // Check milestones

  // Achievement quests - Tier milestones (FIXED: corrected quest IDs)
  'reach_gold': ['achieve_tier_gold'],
  'reach_diamond': ['achieve_tier_diamond'],

  // Achievement quests - Login streaks
  'streak_7': ['achieve_streak_7'],
  'streak_30': ['achieve_streak_30'],

  // Achievement quests - Referrals
  'refer_milestone': ['achieve_refer_3', 'achieve_refer_10'],

  // Transfer-related
  'transfer_made': ['onboard_first_transfer', 'daily_make_transfer'],
};

interface QuestProgressResult {
  questId: string;
  questName?: string;
  progress?: number;
  target?: number;
  isCompleted?: boolean;
  fsReward?: number;
  alreadyCompleted?: boolean;
  error?: string;
}

class QuestService {
  /**
   * Trigger quest progress for an action
   */
  async triggerAction(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<QuestProgressResult[]> {
    const questIds = ACTION_QUEST_MAP[action] || [];
    const results: QuestProgressResult[] = [];
    let anyCompleted = false;

    for (const questId of questIds) {
      try {
        const result = await this.updateProgress(userId, questId, 1);
        if (result) {
          results.push(result);
          if (result.isCompleted && !result.alreadyCompleted) {
            anyCompleted = true;
          }
        }
      } catch (error) {
        console.error(`[QuestService] Error processing quest ${questId}:`, error);
      }
    }

    // If any quest was newly completed, check meta-quest progress
    if (anyCompleted) {
      this.checkMetaQuestCompletion(userId).catch(console.error);
    }

    // Log the action for debugging
    if (results.length > 0) {
      console.log(`[QuestService] User ${userId.slice(0, 8)}... triggered ${action}:`,
        results.map(r => `${r.questId}(${r.progress}/${r.target})`).join(', ')
      );
    }

    return results;
  }

  /**
   * Update progress on a specific quest
   */
  async updateProgress(
    userId: string,
    questId: string,
    increment: number = 1
  ): Promise<QuestProgressResult | null> {
    try {
      const questDef = await db('quest_definitions_v2')
        .where({ id: questId, is_active: true })
        .first();

      if (!questDef) return null;

      // Calculate period dates
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
      // One-time quests (onboarding, achievement) have null period

      // Find or create user quest record
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

      // Already completed
      if (userQuest.is_completed) {
        return { questId, alreadyCompleted: true };
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

      return {
        questId,
        questName: questDef.name,
        progress: newProgress,
        target: questDef.target,
        isCompleted: isNowCompleted,
        fsReward: questDef.fs_reward,
      };
    } catch (error) {
      console.error(`[QuestService] Error updating quest ${questId}:`, error);
      return { questId, error: 'Update failed' };
    }
  }

  /**
   * Complete a quest immediately (for one-time checks)
   */
  async completeQuest(userId: string, questId: string): Promise<QuestProgressResult | null> {
    try {
      const questDef = await db('quest_definitions_v2')
        .where({ id: questId, is_active: true })
        .first();

      if (!questDef) return null;

      // Set progress to target directly
      return this.updateProgress(userId, questId, questDef.target);
    } catch (error) {
      console.error(`[QuestService] Error completing quest ${questId}:`, error);
      return null;
    }
  }

  /**
   * Check if a quest is completed
   */
  async isQuestCompleted(userId: string, questId: string): Promise<boolean> {
    try {
      const userQuest = await db('user_quests_v2')
        .where({ user_id: userId, quest_id: questId })
        .first();

      return userQuest?.is_completed || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get count of unclaimed completed quests
   */
  async getUnclaimedCount(userId: string): Promise<number> {
    try {
      const result = await db('user_quests_v2')
        .where({ user_id: userId, is_completed: true, is_claimed: false })
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check and update meta-quest completion (onboard_complete_all, daily_complete_all, weekly_complete_all)
   * Called after any quest completes to see if meta-quests should advance
   */
  async checkMetaQuestCompletion(userId: string): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const dayOfWeek = now.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Check onboarding completion (excluding onboard_complete_all itself)
      const onboardingQuests = ['onboard_connect_wallet', 'onboard_set_username', 'onboard_create_team',
        'onboard_enter_contest', 'onboard_follow_twitter', 'onboard_invite_friend'];
      const completedOnboarding = await db('user_quests_v2')
        .where({ user_id: userId, is_completed: true })
        .whereIn('quest_id', onboardingQuests)
        .count('* as count')
        .first();
      const onboardingCount = parseInt(completedOnboarding?.count as string) || 0;

      // Update onboard_complete_all progress
      if (onboardingCount > 0) {
        await this.setProgress(userId, 'onboard_complete_all', onboardingCount);
      }

      // Check daily completion (excluding daily_complete_all itself)
      const dailyQuests = ['daily_login', 'daily_check_scores', 'daily_browse_feed',
        'daily_prediction', 'daily_share_take'];
      const completedDaily = await db('user_quests_v2')
        .where({ user_id: userId, is_completed: true, period_start: today })
        .whereIn('quest_id', dailyQuests)
        .count('* as count')
        .first();
      const dailyCount = parseInt(completedDaily?.count as string) || 0;

      // Update daily_complete_all progress
      if (dailyCount > 0) {
        await this.setProgress(userId, 'daily_complete_all', dailyCount);
      }

      // Check weekly completion (excluding weekly_complete_all itself)
      const weeklyQuests = ['weekly_enter_contest', 'weekly_top_50', 'weekly_top_10',
        'weekly_tweet', 'weekly_referral'];
      const completedWeekly = await db('user_quests_v2')
        .where({ user_id: userId, is_completed: true, period_start: weekStartStr })
        .whereIn('quest_id', weeklyQuests)
        .count('* as count')
        .first();
      const weeklyCount = parseInt(completedWeekly?.count as string) || 0;

      // Update weekly_complete_all progress
      if (weeklyCount > 0) {
        await this.setProgress(userId, 'weekly_complete_all', weeklyCount);
      }
    } catch (error) {
      console.error('[QuestService] Error checking meta-quest completion:', error);
    }
  }

  /**
   * Set progress to a specific value (for meta-quests)
   */
  async setProgress(userId: string, questId: string, value: number): Promise<void> {
    try {
      const questDef = await db('quest_definitions_v2')
        .where({ id: questId, is_active: true })
        .first();

      if (!questDef) return;

      // Calculate period
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

      // Find or create
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

      if (userQuest.is_completed) return;

      const newProgress = Math.min(value, questDef.target);
      const isNowCompleted = newProgress >= questDef.target;

      await db('user_quests_v2')
        .where({ id: userQuest.id })
        .update({
          progress: newProgress,
          is_completed: isNowCompleted,
          completed_at: isNowCompleted ? db.fn.now() : null,
          updated_at: db.fn.now(),
        });
    } catch (error) {
      console.error(`[QuestService] Error setting progress for ${questId}:`, error);
    }
  }

  /**
   * Check login streak and trigger streak achievements
   */
  async checkLoginStreak(userId: string, currentStreak: number): Promise<void> {
    try {
      if (currentStreak >= 7) {
        await this.triggerAction(userId, 'streak_7');
      }
      if (currentStreak >= 30) {
        await this.triggerAction(userId, 'streak_30');
      }
    } catch (error) {
      console.error('[QuestService] Error checking login streak:', error);
    }
  }

  /**
   * Check referral count and trigger referral milestones
   */
  async checkReferralMilestone(userId: string, referralCount: number): Promise<void> {
    try {
      // Update progress on referral achievement quests
      await this.setProgress(userId, 'achieve_refer_3', referralCount);
      await this.setProgress(userId, 'achieve_refer_10', referralCount);
    } catch (error) {
      console.error('[QuestService] Error checking referral milestone:', error);
    }
  }

  /**
   * Check contest wins and trigger win milestones
   */
  async checkContestWinMilestone(userId: string, totalWins: number): Promise<void> {
    try {
      // First win
      if (totalWins === 1) {
        await this.triggerAction(userId, 'first_win');
      }
      // Update progress on win achievement quests
      await this.setProgress(userId, 'achieve_champion', totalWins);  // target: 5
      await this.setProgress(userId, 'achieve_legend', totalWins);    // target: 20
    } catch (error) {
      console.error('[QuestService] Error checking contest win milestone:', error);
    }
  }
}

export const questService = new QuestService();
export default questService;
