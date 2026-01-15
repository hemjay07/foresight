/**
 * Foresight Score Service
 *
 * Manages the unified Foresight Score (FS) system:
 * - Earning FS from various activities
 * - Calculating multipliers
 * - Updating tiers
 * - Ranking users
 */

import db from '../utils/db';
import { questService } from './questService';

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 20000,
  diamond: 50000,
} as const;

// Tier multipliers
const TIER_MULTIPLIERS = {
  bronze: 1.0,
  silver: 1.05,
  gold: 1.1,
  platinum: 1.15,
  diamond: 1.2,
} as const;

export type Tier = keyof typeof TIER_THRESHOLDS;
export type FsCategory = 'fantasy' | 'engagement' | 'social' | 'achievement';

interface EarnFsParams {
  userId: string;
  reason: string;
  category: FsCategory;
  baseAmount?: number;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

interface FsEarnResult {
  success: boolean;
  baseAmount: number;
  multipliedAmount: number;
  multiplier: number;
  newTotal: number;
  newTier: Tier;
  tierChanged: boolean;
  error?: string;
}

interface UserFsData {
  userId: string;
  totalScore: number;
  seasonScore: number;
  weekScore: number;
  referralScore: number;
  tier: Tier;
  tierMultiplier: number;
  allTimeRank: number | null;
  seasonRank: number | null;
  rankChangeWeek: number;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  earlyAdopterTier: string | null;
  currentMultiplier: number;
  multiplierExpiresAt: Date | null;
}

class ForesightScoreService {
  /**
   * Get the base FS amount for a given reason from config
   */
  async getBaseAmount(reason: string): Promise<number> {
    const config = await db('foresight_score_config')
      .where({ key: reason, is_active: true })
      .first();

    return config?.base_amount || 0;
  }

  /**
   * Calculate the total multiplier for a user
   */
  async calculateMultiplier(userId: string): Promise<number> {
    const user = await db('users')
      .select('current_multiplier', 'multiplier_expires_at')
      .where({ id: userId })
      .first();

    if (!user) return 1.0;

    // Check if early adopter multiplier has expired
    let earlyAdopterMultiplier = 1.0;
    if (user.multiplier_expires_at) {
      const expiresAt = new Date(user.multiplier_expires_at);
      if (expiresAt > new Date()) {
        earlyAdopterMultiplier = parseFloat(user.current_multiplier) || 1.0;
      }
    }

    // Get tier multiplier
    const fsRecord = await db('foresight_scores')
      .select('tier_multiplier')
      .where({ user_id: userId })
      .first();

    const tierMultiplier = fsRecord?.tier_multiplier || 1.0;

    // Combine multipliers (they stack multiplicatively)
    return earlyAdopterMultiplier * tierMultiplier;
  }

  /**
   * Calculate tier from total score
   */
  calculateTier(totalScore: number): Tier {
    if (totalScore >= TIER_THRESHOLDS.diamond) return 'diamond';
    if (totalScore >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (totalScore >= TIER_THRESHOLDS.gold) return 'gold';
    if (totalScore >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Ensure user has a foresight_scores record
   */
  async ensureFsRecord(userId: string): Promise<void> {
    const exists = await db('foresight_scores')
      .where({ user_id: userId })
      .first();

    if (!exists) {
      // Get current season and week
      const now = new Date();
      const currentSeason = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const weekNumber = this.getWeekNumber(now);

      await db('foresight_scores').insert({
        user_id: userId,
        total_score: 0,
        season_score: 0,
        week_score: 0,
        referral_score: 0,
        fantasy_score: 0,
        engagement_score: 0,
        social_score: 0,
        achievement_score: 0,
        tier: 'bronze',
        tier_multiplier: 1.0,
        current_season: currentSeason,
        current_week: weekNumber,
      });
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Earn Foresight Score for a user
   */
  async earnFs(params: EarnFsParams): Promise<FsEarnResult> {
    const { userId, reason, category, sourceType, sourceId, metadata } = params;

    try {
      // Ensure user has FS record
      await this.ensureFsRecord(userId);

      // Get base amount from config or params
      const baseAmount = params.baseAmount ?? await this.getBaseAmount(reason);

      if (baseAmount <= 0) {
        return {
          success: false,
          baseAmount: 0,
          multipliedAmount: 0,
          multiplier: 1,
          newTotal: 0,
          newTier: 'bronze',
          tierChanged: false,
          error: `No FS configured for reason: ${reason}`,
        };
      }

      // Calculate multiplier
      const multiplier = await this.calculateMultiplier(userId);
      const multipliedAmount = Math.round(baseAmount * multiplier);

      // Get current FS record
      const currentFs = await db('foresight_scores')
        .where({ user_id: userId })
        .first();

      const oldTier = currentFs.tier as Tier;

      // Update category-specific score column
      const categoryColumn = `${category}_score`;

      // CRITICAL: Parse as integers to prevent string concatenation bug
      const currentTotal = parseInt(currentFs.total_score) || 0;
      const currentSeason = parseInt(currentFs.season_score) || 0;
      const currentWeek = parseInt(currentFs.week_score) || 0;
      const currentCategory = parseInt(currentFs[categoryColumn]) || 0;

      const newTotal = currentTotal + multipliedAmount;
      const newTier = this.calculateTier(newTotal);
      const tierChanged = newTier !== oldTier;

      // Start transaction
      await db.transaction(async (trx) => {
        // Record transaction
        await trx('foresight_score_transactions').insert({
          user_id: userId,
          base_amount: baseAmount,
          multiplied_amount: multipliedAmount,
          multiplier_applied: multiplier,
          reason,
          category,
          source_type: sourceType,
          source_id: sourceId,
          metadata: metadata ? JSON.stringify(metadata) : null,
        });

        // Update scores (using parsed values to prevent string concatenation)
        const updateData: Record<string, any> = {
          total_score: newTotal,
          season_score: currentSeason + multipliedAmount,
          week_score: currentWeek + multipliedAmount,
          [categoryColumn]: currentCategory + multipliedAmount,
          last_earned_at: new Date(),
          updated_at: new Date(),
        };

        // Update tier if changed
        if (tierChanged) {
          updateData.tier = newTier;
          updateData.tier_multiplier = TIER_MULTIPLIERS[newTier];
          updateData.tier_updated_at = new Date();

          // Trigger tier achievement quests (async, non-blocking)
          if (newTier === 'gold') {
            questService.triggerAction(userId, 'reach_gold').catch(console.error);
          } else if (newTier === 'diamond') {
            questService.triggerAction(userId, 'reach_diamond').catch(console.error);
          }
        }

        // Special handling for referral score
        if (category === 'social' && reason.startsWith('referral_')) {
          updateData.referral_score = (parseInt(currentFs.referral_score) || 0) + multipliedAmount;
        }

        await trx('foresight_scores')
          .where({ user_id: userId })
          .update(updateData);
      });

      return {
        success: true,
        baseAmount,
        multipliedAmount,
        multiplier,
        newTotal,
        newTier,
        tierChanged,
      };
    } catch (error) {
      console.error('[FS] Error earning FS:', error);
      return {
        success: false,
        baseAmount: 0,
        multipliedAmount: 0,
        multiplier: 1,
        newTotal: 0,
        newTier: 'bronze',
        tierChanged: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's FS data
   */
  async getUserFs(userId: string): Promise<UserFsData | null> {
    await this.ensureFsRecord(userId);

    const result = await db('foresight_scores as fs')
      .join('users as u', 'fs.user_id', 'u.id')
      .select(
        'fs.user_id as userId',
        'fs.total_score as totalScore',
        'fs.season_score as seasonScore',
        'fs.week_score as weekScore',
        'fs.referral_score as referralScore',
        'fs.tier',
        'fs.tier_multiplier as tierMultiplier',
        'fs.all_time_rank as allTimeRank',
        'fs.season_rank as seasonRank',
        'fs.rank_change_week as rankChangeWeek',
        'u.is_founding_member as isFoundingMember',
        'u.founding_member_number as foundingMemberNumber',
        'u.early_adopter_tier as earlyAdopterTier',
        'u.current_multiplier as currentMultiplier',
        'u.multiplier_expires_at as multiplierExpiresAt'
      )
      .where({ 'fs.user_id': userId })
      .first();

    if (!result) return null;

    return {
      ...result,
      totalScore: parseInt(result.totalScore) || 0,
      seasonScore: parseInt(result.seasonScore) || 0,
      weekScore: parseInt(result.weekScore) || 0,
      referralScore: parseInt(result.referralScore) || 0,
      tierMultiplier: parseFloat(result.tierMultiplier) || 1.0,
      currentMultiplier: parseFloat(result.currentMultiplier) || 1.0,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'all_time' | 'season' | 'weekly' | 'referral',
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    const scoreColumn = {
      all_time: 'total_score',
      season: 'season_score',
      weekly: 'week_score',
      referral: 'referral_score',
    }[type];

    const rankColumn = {
      all_time: 'all_time_rank',
      season: 'season_rank',
      weekly: null,
      referral: null,
    }[type];

    let query = db('foresight_scores as fs')
      .join('users as u', 'fs.user_id', 'u.id')
      .select(
        'fs.user_id as userId',
        'u.username',
        'u.avatar_url as avatarUrl',
        `fs.${scoreColumn} as score`,
        'fs.tier',
        'u.is_founding_member as isFoundingMember',
        'u.founding_member_number as foundingMemberNumber',
        'u.early_adopter_tier as earlyAdopterTier'
      )
      .where(`fs.${scoreColumn}`, '>', 0)
      .orderBy(`fs.${scoreColumn}`, 'desc')
      .limit(limit)
      .offset(offset);

    if (rankColumn) {
      query = query.select(`fs.${rankColumn} as rank`);
    }

    const results = await query;

    // Add rank if not stored
    if (!rankColumn) {
      return results.map((r, i) => ({
        ...r,
        rank: offset + i + 1,
        score: parseInt(r.score) || 0,
      }));
    }

    return results.map(r => ({
      ...r,
      score: parseInt(r.score) || 0,
    }));
  }

  /**
   * Get user's rank on a leaderboard
   */
  async getUserRank(
    userId: string,
    type: 'all_time' | 'season' | 'weekly' | 'referral'
  ): Promise<{ rank: number; total: number } | null> {
    const scoreColumn = {
      all_time: 'total_score',
      season: 'season_score',
      weekly: 'week_score',
      referral: 'referral_score',
    }[type];

    const userScore = await db('foresight_scores')
      .select(scoreColumn)
      .where({ user_id: userId })
      .first();

    if (!userScore) return null;

    const score = userScore[scoreColumn] || 0;

    // Count users with higher score
    const rankResult = await db('foresight_scores')
      .count('* as count')
      .where(scoreColumn, '>', score)
      .first();

    const totalResult = await db('foresight_scores')
      .count('* as count')
      .where(scoreColumn, '>', 0)
      .first();

    const rank = (parseInt(rankResult?.count as string) || 0) + 1;
    const total = parseInt(totalResult?.count as string) || 0;

    return { rank, total };
  }

  /**
   * Update rankings (called by cron)
   */
  async updateRankings(): Promise<void> {
    console.log('[FS] Updating rankings...');

    // Update all-time rankings
    await db.raw(`
      UPDATE foresight_scores fs
      SET all_time_rank = ranked.rank
      FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
        FROM foresight_scores
        WHERE total_score > 0
      ) ranked
      WHERE fs.user_id = ranked.user_id
    `);

    // Update season rankings
    await db.raw(`
      UPDATE foresight_scores fs
      SET season_rank = ranked.rank
      FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY season_score DESC) as rank
        FROM foresight_scores
        WHERE season_score > 0
      ) ranked
      WHERE fs.user_id = ranked.user_id
    `);

    console.log('[FS] Rankings updated');
  }

  /**
   * Reset weekly scores (called by cron on Monday 00:00 UTC)
   */
  async resetWeeklyScores(): Promise<void> {
    console.log('[FS] Resetting weekly scores...');

    const weekNumber = this.getWeekNumber(new Date());

    await db('foresight_scores').update({
      week_score: 0,
      current_week: weekNumber,
      rank_change_week: 0,
    });

    console.log('[FS] Weekly scores reset');
  }

  /**
   * Reset season scores (called by cron on 1st of month)
   */
  async resetSeasonScores(): Promise<void> {
    console.log('[FS] Resetting season scores...');

    const now = new Date();
    const currentSeason = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Take snapshot before resetting
    const topUsers = await db('foresight_scores')
      .select('user_id', 'season_score', 'tier')
      .join('users', 'foresight_scores.user_id', 'users.id')
      .select('users.username')
      .where('season_score', '>', 0)
      .orderBy('season_score', 'desc')
      .limit(1000);

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    // Insert snapshot
    for (let i = 0; i < topUsers.length; i++) {
      await db('leaderboard_snapshots').insert({
        leaderboard_type: 'season',
        period_key: periodKey,
        user_id: topUsers[i].user_id,
        rank: i + 1,
        score: topUsers[i].season_score,
        tier: topUsers[i].tier,
        username: topUsers[i].username,
      }).onConflict(['leaderboard_type', 'period_key', 'user_id']).ignore();
    }

    // Reset season scores
    await db('foresight_scores').update({
      season_score: 0,
      season_rank: null,
      current_season: currentSeason,
    });

    console.log('[FS] Season scores reset');
  }

  /**
   * Get FS transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return db('foresight_score_transactions')
      .select('*')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  /**
   * Check and expire multipliers (called by cron)
   */
  async expireMultipliers(): Promise<void> {
    console.log('[FS] Checking for expired multipliers...');

    const now = new Date();

    await db('users')
      .where('multiplier_expires_at', '<', now)
      .whereNot('current_multiplier', 1.0)
      .update({
        current_multiplier: 1.0,
        early_adopter_tier: 'standard',
      });

    console.log('[FS] Multipliers checked');
  }
}

export const foresightScoreService = new ForesightScoreService();
export default foresightScoreService;
