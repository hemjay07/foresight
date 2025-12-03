import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * GET /api/referrals/my-code
 * Get user's referral code and stats
 */
router.get(
  '/my-code',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await db('users')
      .where({ id: userId })
      .select(
        'referral_code',
        'referral_count',
        'active_referral_count',
        'is_founding_member',
        'founding_member_number',
        'referral_quality_score',
        'total_referral_xp_earned'
      )
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get referral milestones
    const milestones = await db('referral_milestones')
      .where({ user_id: userId })
      .select('milestone_type', 'achieved_at');

    // Get recent referrals (last 10)
    const recentReferrals = await db('users')
      .where({ referred_by: userId })
      .select('username', 'ct_mastery_level', 'created_at', 'last_seen_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    // Calculate if user is in top recruiters
    const topRecruiterRank = await db('users')
      .where('active_referral_count', '>', user.active_referral_count)
      .count('* as count')
      .first();

    const rank = topRecruiterRank ? parseInt(topRecruiterRank.count as string) + 1 : 1;

    res.json({
      referralCode: user.referral_code,
      referralCount: user.referral_count,
      activeReferralCount: user.active_referral_count,

      // Founding member status (hints at future value)
      isFoundingMember: user.is_founding_member,
      foundingMemberNumber: user.founding_member_number,

      // Quality metrics (for future token distribution)
      qualityScore: user.referral_quality_score,
      totalReferralXP: user.total_referral_xp_earned,

      // Leaderboard position
      recruiterRank: rank,

      milestones: milestones.map(m => ({
        type: m.milestone_type,
        achievedAt: m.achieved_at
      })),

      recentReferrals: recentReferrals.map(r => ({
        username: r.username,
        level: r.ct_mastery_level,
        joinedAt: r.created_at,
        lastActive: r.last_seen_at
      }))
    });
  })
);

/**
 * POST /api/referrals/validate
 * Validate a referral code before signup
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { referralCode } = req.body;

    if (!referralCode) {
      throw new AppError('Referral code is required', 400);
    }

    const referrer = await db('users')
      .where({ referral_code: referralCode })
      .select('id', 'username', 'referral_count', 'is_founding_member')
      .first();

    if (!referrer) {
      throw new AppError('Invalid referral code', 404);
    }

    res.json({
      valid: true,
      referrerUsername: referrer.username,
      referrerIsFoundingMember: referrer.is_founding_member,
      bonusXP: 50, // Invitee gets 50 XP
    });
  })
);

/**
 * POST /api/referrals/track-event
 * Track a referral event (called by other services)
 * INTERNAL USE - requires authentication
 */
router.post(
  '/track-event',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { refereeId, eventType, metadata } = req.body;
    const referrerId = req.user!.userId;

    if (!refereeId || !eventType) {
      throw new AppError('Missing required fields', 400);
    }

    // Check if referee was actually referred by this user
    const referee = await db('users')
      .where({ id: refereeId, referred_by: referrerId })
      .first();

    if (!referee) {
      throw new AppError('User was not referred by you', 403);
    }

    // Check if event already tracked (prevent duplicates)
    const existingEvent = await db('referral_events')
      .where({ referrer_id: referrerId, referee_id: refereeId, event_type: eventType })
      .first();

    if (existingEvent) {
      return res.json({ message: 'Event already tracked', xpAwarded: 0 });
    }

    // Calculate XP based on event type
    const xpMap: Record<string, number> = {
      signup: 100,
      first_team: 50,
      week_complete: 100,
      level_5: 200,
      level_10: 300,
      tournament_entry: 150,
      referred_someone: 25, // One level deep only
    };

    const xpAwarded = xpMap[eventType] || 0;

    // Create event
    await db('referral_events').insert({
      id: uuidv4(),
      referrer_id: referrerId,
      referee_id: refereeId,
      event_type: eventType,
      xp_awarded: xpAwarded,
      metadata: metadata || {},
      created_at: db.fn.now(),
    });

    // Award XP to referrer
    if (xpAwarded > 0) {
      await db('users')
        .where({ id: referrerId })
        .increment('ct_mastery_score', xpAwarded)
        .increment('total_referral_xp_earned', xpAwarded);

      // Update XP actions table for tracking
      await db('xp_actions').insert({
        id: uuidv4(),
        user_id: referrerId,
        action_key: `referral_${eventType}`,
        xp_earned: xpAwarded,
        reference_type: 'referral',
        reference_id: refereeId,
        created_at: db.fn.now(),
      });
    }

    // Check for milestone achievements
    await checkMilestones(referrerId);

    res.json({
      success: true,
      xpAwarded,
      message: `Earned ${xpAwarded} XP for referee ${eventType}`,
    });
  })
);

/**
 * GET /api/referrals/leaderboard
 * Get top recruiters
 */
router.get(
  '/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const topRecruiters = await db('users')
      .where('active_referral_count', '>', 0)
      .select(
        'id',
        'username',
        'avatar_url',
        'referral_count',
        'active_referral_count',
        'referral_quality_score',
        'total_referral_xp_earned',
        'is_founding_member',
        'founding_member_number'
      )
      .orderBy('active_referral_count', 'desc')
      .orderBy('referral_quality_score', 'desc')
      .limit(limit);

    res.json({
      leaderboard: topRecruiters.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        totalReferrals: user.referral_count,
        activeReferrals: user.active_referral_count,
        qualityScore: user.referral_quality_score,
        totalXPEarned: user.total_referral_xp_earned,
        isFoundingMember: user.is_founding_member,
        foundingMemberNumber: user.founding_member_number,
      })),
    });
  })
);

/**
 * Helper: Check and award milestones
 */
async function checkMilestones(userId: string) {
  const user = await db('users')
    .where({ id: userId })
    .select('active_referral_count')
    .first();

  if (!user) return;

  const milestones = [
    { type: 'recruiter', threshold: 1, xp: 50 },
    { type: 'talent_scout', threshold: 5, xp: 100 },
    { type: 'ct_influencer', threshold: 25, xp: 500 },
    { type: 'kingmaker', threshold: 50, xp: 1000 },
    { type: 'legend', threshold: 100, xp: 2500 },
  ];

  for (const milestone of milestones) {
    if (user.active_referral_count >= milestone.threshold) {
      // Check if already achieved
      const existing = await db('referral_milestones')
        .where({ user_id: userId, milestone_type: milestone.type })
        .first();

      if (!existing) {
        // Award milestone
        await db('referral_milestones').insert({
          id: uuidv4(),
          user_id: userId,
          milestone_type: milestone.type,
          threshold: milestone.threshold,
          achieved_at: db.fn.now(),
        });

        // Award bonus XP
        await db('users')
          .where({ id: userId })
          .increment('ct_mastery_score', milestone.xp);

        // Log XP action
        await db('xp_actions').insert({
          id: uuidv4(),
          user_id: userId,
          action_key: `milestone_${milestone.type}`,
          xp_earned: milestone.xp,
          reference_type: 'milestone',
          reference_id: milestone.type,
          created_at: db.fn.now(),
        });
      }
    }
  }

  // Update quality score based on retention
  const referrals = await db('users')
    .where({ referred_by: userId })
    .select('last_seen_at', 'created_at');

  const now = new Date();
  const activeCount = referrals.filter(r => {
    const lastSeen = new Date(r.last_seen_at);
    const daysSinceActive = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceActive < 7; // Active in last 7 days
  }).length;

  const qualityScore = referrals.length > 0
    ? Math.round((activeCount / referrals.length) * 100)
    : 0;

  await db('users')
    .where({ id: userId })
    .update({
      active_referral_count: activeCount,
      referral_quality_score: qualityScore,
    });
}

export default router;
