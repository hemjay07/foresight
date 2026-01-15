/**
 * Activity Feed Service
 *
 * Records and retrieves user activities for social proof
 */

import db from '../utils/db';

export interface ActivityMetadata {
  teamName?: string;
  questName?: string;
  influencerIn?: string;
  influencerOut?: string;
  fsAmount?: number;
  tier?: string;
  rank?: number;
  [key: string]: any;
}

export type ActivityType =
  | 'draft_team'
  | 'claim_quest'
  | 'transfer'
  | 'vote'
  | 'earn_fs'
  | 'tier_up'
  | 'join_contest'
  | 'win_contest'
  | 'referral'
  | 'login_streak';

const activityFeedService = {
  /**
   * Record a new activity
   */
  async recordActivity(
    userId: string,
    activityType: ActivityType,
    message: string,
    metadata?: ActivityMetadata,
    isPublic: boolean = true
  ): Promise<void> {
    try {
      await db('activity_feed').insert({
        user_id: userId,
        activity_type: activityType,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
        is_public: isPublic,
      });
    } catch (error) {
      console.error('Error recording activity:', error);
      // Don't throw - activity recording should not block main operations
    }
  },

  /**
   * Get global activity feed (public activities)
   */
  async getGlobalFeed(limit: number = 20, offset: number = 0) {
    const activities = await db('activity_feed')
      .where({ is_public: true })
      .join('users', 'activity_feed.user_id', 'users.id')
      .select(
        'activity_feed.id',
        'activity_feed.activity_type',
        'activity_feed.message',
        'activity_feed.metadata',
        'activity_feed.created_at',
        'users.username',
        'users.wallet_address'
      )
      .orderBy('activity_feed.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return activities.map((a) => ({
      id: a.id,
      type: a.activity_type,
      message: a.message,
      metadata: a.metadata,
      createdAt: a.created_at,
      user: {
        username: a.username || `${a.wallet_address.slice(0, 6)}...${a.wallet_address.slice(-4)}`,
        address: a.wallet_address,
      },
    }));
  },

  /**
   * Get user's own activity feed
   */
  async getUserFeed(userId: string, limit: number = 20, offset: number = 0) {
    const activities = await db('activity_feed')
      .where({ user_id: userId })
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return activities.map((a) => ({
      id: a.id,
      type: a.activity_type,
      message: a.message,
      metadata: a.metadata,
      createdAt: a.created_at,
      isPublic: a.is_public,
    }));
  },

  /**
   * Get activity count for a user (for stats)
   */
  async getUserActivityCount(userId: string): Promise<number> {
    const result = await db('activity_feed')
      .where({ user_id: userId })
      .count('* as count')
      .first();
    return parseInt(result?.count as string) || 0;
  },

  /**
   * Clean up old activities (keep last 30 days)
   */
  async cleanupOldActivities(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db('activity_feed')
      .where('created_at', '<', cutoffDate)
      .delete();

    return result;
  },
};

export default activityFeedService;
