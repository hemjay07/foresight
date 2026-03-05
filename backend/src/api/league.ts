/**
 * CT Fantasy League API
 * Endpoints for team management, picks, and contests
 */

import express, { Request, Response } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth';
import db from '../utils/db';
import { getVoteWeight } from '../utils/xp';
import { checkVotingAchievements, checkMilestoneAchievements, tryUnlockAchievement } from '../services/fantasyScoringService';
import { checkDraftAchievements } from '../services/achievementService';
import foresightScoreService from '../services/foresightScoreService';
import activityFeedService from '../services/activityFeedService';
import questService from '../services/questService';
import tapestryService from '../services/tapestryService';
import leagueService from '../services/leagueService';

const router = express.Router();

/**
 * Get current active contests (both free and prize leagues)
 * GET /api/league/contests/active (PUBLIC - no auth required)
 */
router.get('/contests/active', async (req: Request, res: Response) => {
  try {
    const contests = await db('fantasy_contests')
      .where({ status: 'active' })
      .orderBy('is_prize_league', 'asc') // Free leagues first
      .orderBy('start_date', 'desc');

    if (contests.length === 0) {
      return res.status(404).json({ error: 'No active contests found' });
    }

    res.json({ contests });
  } catch (error: any) {
    console.error('Error fetching active contests:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current active contest (DEPRECATED - use /contests/active)
 * GET /api/league/contest/current (PUBLIC - no auth required)
 */
router.get('/contest/current', async (req: Request, res: Response) => {
  try {
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .orderBy('start_date', 'desc')
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'No active contest found' });
    }

    res.json({ contest });
  } catch (error: any) {
    console.error('Error fetching current contest:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's active contest entry (simplified)
 * GET /api/league/my-active-entry
 */
router.get('/my-active-entry', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get current active contest
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!contest) {
      return res.json({ success: true, data: { entry: null, contest: null } });
    }

    // Get user's team for this contest
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (!team) {
      return res.json({ success: true, data: { entry: null, contest } });
    }

    // Get team picks count
    const picksCount = await db('team_picks')
      .where({ team_id: team.id })
      .count('* as count')
      .first();

    return res.json({
      success: true,
      data: {
        entry: {
          id: team.id,
          teamName: team.name || team.team_name,
          isLocked: team.is_locked || false,
          totalPoints: parseFloat(team.total_points || '0'),
          rank: team.rank || null,
          picksCount: parseInt(String(picksCount?.count || 0)),
          createdAt: team.created_at,
        },
        contest: {
          id: contest.id,
          name: contest.name,
          startDate: contest.start_date,
          endDate: contest.end_date,
          status: contest.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching active entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user's team for specific or current contest
 * GET /api/league/team/me?contest_id=123 (optional contest_id)
 */
router.get('/team/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const contestIdParam = req.query.contest_id;

    // Get contest using service
    const contestId = contestIdParam ? parseInt(contestIdParam as string) : undefined;
    const contest = await leagueService.getActiveContest(contestId).catch(() => null);

    if (!contest) {
      return res.status(404).json({ error: contestId ? 'Contest not found or not active' : 'No active contest' });
    }

    // Get user's team using service
    const team = await leagueService.getUserTeam(userId, contest.id);

    if (!team) {
      return res.json({ team: null, contest });
    }

    // Get team picks with influencer details using service
    const picks = await leagueService.getTeamPicks(team.id);

    const totalBudget = picks.reduce((sum: number, pick: any) => sum + parseFloat(pick.price || 0), 0);

    res.json({
      team: {
        ...team,
        picks,
        total_budget_used: totalBudget,
        max_budget: 150,
      },
      contest,
    });
  } catch (error: any) {
    console.error('Error fetching user team:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create team for current contest
 * POST /api/league/team/create
 * Body: { team_name: string, influencer_ids: number[] }
 */
router.post('/team/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { team_name, influencer_ids, captain_id, contest_id } = req.body;

    if (!team_name || !influencer_ids || !Array.isArray(influencer_ids)) {
      return res.status(400).json({ error: 'team_name and influencer_ids array required' });
    }

    if (influencer_ids.length !== 5) {
      return res.status(400).json({ error: 'Must select exactly 5 influencers' });
    }

    if (!captain_id) {
      return res.status(400).json({ error: 'Must select a captain' });
    }

    if (!influencer_ids.includes(captain_id)) {
      return res.status(400).json({ error: 'Captain must be one of your selected influencers' });
    }

    // Get contest - use provided contest_id or default to active contest
    let contest;
    if (contest_id) {
      contest = await db('fantasy_contests')
        .where({ id: contest_id, status: 'active' })
        .first();
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found or not active' });
      }
    } else {
      contest = await db('fantasy_contests')
        .where({ status: 'active' })
        .first();
      if (!contest) {
        return res.status(404).json({ error: 'No active contest' });
      }
    }

    // Check if user already has team
    const existingTeam = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (existingTeam) {
      return res.status(400).json({ error: 'You already have a team for this contest' });
    }

    // Verify all influencers exist and are active
    const influencers = await db('influencers')
      .whereIn('id', influencer_ids)
      .where({ is_active: true });

    if (influencers.length !== influencer_ids.length) {
      return res.status(400).json({ error: 'One or more influencers not found or inactive' });
    }

    // Validate budget: max 150 points
    const totalPrice = influencers.reduce((sum, inf) => sum + parseFloat(inf.price || 0), 0);
    const MAX_BUDGET = 150;

    if (totalPrice > MAX_BUDGET) {
      return res.status(400).json({
        error: `Team exceeds budget. Total: ${totalPrice.toFixed(1)}M, Budget: ${MAX_BUDGET}M`,
        total_price: totalPrice,
        max_budget: MAX_BUDGET,
      });
    }

    // Create team and picks in transaction
    await db.transaction(async (trx) => {
      // Create team
      const [team] = await trx('user_teams')
        .insert({
          user_id: userId,
          contest_id: contest.id,
          team_name,
          total_score: 0,
          is_locked: false,
        })
        .returning('*');

      // Create picks
      const picks = influencer_ids.map((influencer_id, index) => ({
        team_id: team.id,
        influencer_id,
        pick_order: index + 1,
        daily_points: 0,
        total_points: 0,
        is_captain: influencer_id === captain_id,
      }));

      await trx('team_picks').insert(picks);

      // Update contest participant count
      await trx('fantasy_contests')
        .where({ id: contest.id })
        .increment('total_participants', 1);
    });

    // Fetch created team with picks
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    const picks = await db('team_picks')
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .where({ team_id: team.id })
      .select(
        'team_picks.*',
        'influencers.display_name as influencer_name',
        'influencers.twitter_handle as influencer_handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier',
        'influencers.price'
      )
      .orderBy('team_picks.pick_order');

    const totalBudget = picks.reduce((sum, pick) => sum + parseFloat(pick.price || 0), 0);

    // Check for draft achievements (async, don't block response)
    checkDraftAchievements(userId, team.id).catch(console.error);

    // Check if this is user's first team ever and award FS
    const teamCount = await db('user_teams')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    if (teamCount && parseInt(teamCount.count as string) === 1) {
      // First team ever - award onboarding FS
      foresightScoreService.earnFs({
        userId,
        reason: 'onboard_create_team',
        category: 'fantasy',
        sourceType: 'team',
        sourceId: team.id.toString(),
        metadata: { teamName: team_name, contestId: contest.id }
      }).catch(err => console.error('[FS] Error awarding first team FS:', err));
    }

    // Record activity (async, don't block response)
    activityFeedService.recordActivity(
      userId,
      'draft_team',
      `drafted their team "${team_name}"`,
      { teamName: team_name, contestId: contest.id }
    ).catch(console.error);

    // Trigger quest progress (async, don't block response)
    questService.triggerAction(userId, 'team_created', { teamName: team_name, contestId: contest.id })
      .catch(console.error);
    questService.triggerAction(userId, 'contest_entered', { contestId: contest.id })
      .catch(console.error);

    // Publish team to Tapestry (async, non-blocking)
    const userRecord = await db('users').where({ id: userId }).first();
    if (userRecord?.tapestry_user_id) {
      tapestryService.storeTeam(userRecord.tapestry_user_id, userId, {
        contestId: String(contest.id),
        picks: picks.map((p: any) => ({
          influencerId: String(p.influencer_id),
          tier: p.tier || 'unknown',
          isCaptain: p.is_captain,
          price: parseFloat(p.price || 0),
        })),
        totalBudgetUsed: totalBudget,
        captainId: String(captain_id),
      }).catch((err) => console.error('[Tapestry] Error publishing team:', err));
    }

    res.json({
      success: true,
      team: {
        ...team,
        picks,
        total_budget_used: totalBudget,
        max_budget: 150,
      },
      tapestry: {
        published: !!userRecord?.tapestry_user_id,
      },
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update team picks (before locking)
 * PUT /api/league/team/update
 * Body: { influencer_ids: number[], captain_id: number, contest_id?: number }
 */
router.put('/team/update', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { influencer_ids, captain_id, contest_id } = req.body;

    if (!influencer_ids || !Array.isArray(influencer_ids) || influencer_ids.length !== 5) {
      return res.status(400).json({ error: 'Must provide exactly 5 influencer IDs' });
    }

    if (!captain_id) {
      return res.status(400).json({ error: 'Must select a captain' });
    }

    if (!influencer_ids.includes(captain_id)) {
      return res.status(400).json({ error: 'Captain must be one of your selected influencers' });
    }

    // Get contest - use provided contest_id or default to first active contest
    let contest;
    if (contest_id) {
      contest = await db('fantasy_contests')
        .where({ id: contest_id, status: 'active' })
        .first();
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found or not active' });
      }
    } else {
      contest = await db('fantasy_contests')
        .where({ status: 'active' })
        .orderBy('is_prize_league', 'asc') // Free leagues first
        .orderBy('id', 'asc')
        .first();
    }

    if (!contest) {
      return res.status(404).json({ error: 'No active contest' });
    }

    // Get user's team
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.is_locked) {
      return res.status(400).json({ error: 'Team is locked and cannot be modified' });
    }

    // Verify influencers
    const influencers = await db('influencers')
      .whereIn('id', influencer_ids)
      .where({ is_active: true });

    if (influencers.length !== influencer_ids.length) {
      return res.status(400).json({ error: 'One or more influencers not found or inactive' });
    }

    // Validate budget: max 150 points
    const totalPrice = influencers.reduce((sum, inf) => sum + parseFloat(inf.price || 0), 0);
    const MAX_BUDGET = 150;

    if (totalPrice > MAX_BUDGET) {
      return res.status(400).json({
        error: `Team exceeds budget. Total: ${totalPrice.toFixed(1)}M, Budget: ${MAX_BUDGET}M`,
        total_price: totalPrice,
        max_budget: MAX_BUDGET,
      });
    }

    // Update picks
    await db.transaction(async (trx) => {
      // Delete old picks
      await trx('team_picks').where({ team_id: team.id }).delete();

      // Insert new picks
      const picks = influencer_ids.map((influencer_id, index) => ({
        team_id: team.id,
        influencer_id,
        pick_order: index + 1,
        daily_points: 0,
        total_points: 0,
        is_captain: influencer_id === captain_id,
      }));

      await trx('team_picks').insert(picks);
    });

    // Fetch updated team
    const picks = await db('team_picks')
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .where({ team_id: team.id })
      .select(
        'team_picks.*',
        'influencers.display_name as influencer_name',
        'influencers.twitter_handle as influencer_handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier',
        'influencers.price'
      )
      .orderBy('team_picks.pick_order');

    const totalBudget = picks.reduce((sum, pick) => sum + parseFloat(pick.price || 0), 0);

    res.json({
      success: true,
      team: {
        ...team,
        picks,
        total_budget_used: totalBudget,
        max_budget: 150,
      },
    });
  } catch (error: any) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update team name
 * PATCH /api/league/team/name
 * Body: { team_name: string }
 */
router.patch('/team/name', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { team_name } = req.body;

    // Validate team name
    if (!team_name || typeof team_name !== 'string') {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const trimmedName = team_name.trim();

    if (trimmedName.length < 3) {
      return res.status(400).json({ error: 'Team name must be at least 3 characters' });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({ error: 'Team name must be 50 characters or less' });
    }

    // Check for profanity/inappropriate content (basic check)
    const inappropriateWords = ['fuck', 'shit', 'bitch', 'ass', 'damn', 'crap'];
    const lowerCaseName = trimmedName.toLowerCase();
    const hasProfanity = inappropriateWords.some(word => lowerCaseName.includes(word));

    if (hasProfanity) {
      return res.status(400).json({ error: 'Team name contains inappropriate content' });
    }

    // Get active contest
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'No active contest' });
    }

    // Get user's team
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (!team) {
      return res.status(404).json({ error: 'Team not found. Create a team first.' });
    }

    // Update team name
    await db('user_teams')
      .where({ id: team.id })
      .update({ team_name: trimmedName });

    // Fetch updated team with picks
    const updatedTeam = await db('user_teams')
      .where({ id: team.id })
      .first();

    const picks = await db('team_picks')
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .where({ team_id: team.id })
      .select(
        'team_picks.*',
        'influencers.display_name as influencer_name',
        'influencers.twitter_handle as influencer_handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier',
        'influencers.price'
      )
      .orderBy('team_picks.pick_order');

    const totalBudget = picks.reduce((sum, pick) => sum + parseFloat(pick.price || 0), 0);

    res.json({
      success: true,
      message: 'Team name updated successfully',
      team: {
        ...updatedTeam,
        picks,
        total_budget_used: totalBudget,
        max_budget: 150,
      },
    });
  } catch (error: any) {
    console.error('Error updating team name:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Lock team (finalize picks)
 * POST /api/league/team/lock
 */
router.post('/team/lock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get active contest
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'No active contest' });
    }

    // Get user's team
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.is_locked) {
      return res.status(400).json({ error: 'Team is already locked' });
    }

    // Lock team
    await db('user_teams')
      .where({ id: team.id })
      .update({
        is_locked: true,
        locked_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

    res.json({
      success: true,
      message: 'Team locked successfully',
    });
  } catch (error: any) {
    console.error('Error locking team:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available influencers for picking
 * GET /api/league/influencers (PUBLIC - no auth required)
 */
router.get('/influencers', async (req: Request, res: Response) => {
  try {
    // Get all 50 influencers with pricing (S, A, B, C tiers)
    // Join with latest metrics to show recent performance
    const influencers = await db('influencers')
      .leftJoin('influencer_metrics', function() {
        this.on('influencers.id', '=', 'influencer_metrics.influencer_id')
          .andOn('influencer_metrics.scraped_at', '=', db.raw(`(
            SELECT MAX(scraped_at)
            FROM influencer_metrics im2
            WHERE im2.influencer_id = influencers.id
          )`));
      })
      .where({ 'influencers.is_active': true })
      .whereIn('influencers.tier', ['S', 'A', 'B', 'C'])
      .orderByRaw(`
        CASE influencers.tier
          WHEN 'S' THEN 1
          WHEN 'A' THEN 2
          WHEN 'B' THEN 3
          WHEN 'C' THEN 4
        END ASC
      `)
      .orderBy('influencers.price', 'desc')
      .select(
        'influencers.id',
        'influencers.display_name as name',
        'influencers.twitter_handle as handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier',
        'influencers.price',
        'influencers.follower_count',
        'influencers.avg_likes',
        'influencers.avg_retweets',
        db.raw('COALESCE(influencer_metrics.daily_tweets, 0) as daily_tweets'),
        db.raw('COALESCE(influencer_metrics.engagement_rate, 0) as engagement_rate'),
        db.raw(`
          CASE
            WHEN influencer_metrics.daily_tweets > 8 THEN 95
            WHEN influencer_metrics.daily_tweets > 5 THEN 85
            WHEN influencer_metrics.daily_tweets > 2 THEN 75
            ELSE 65
          END as form_score
        `),
        db.raw(`
          ROUND(
            influencers.price +
            (COALESCE(influencer_metrics.follower_count, influencers.follower_count, 0) / 1000000.0) * 5 +
            COALESCE(influencer_metrics.daily_tweets, 0) * 2 +
            (COALESCE(influencer_metrics.likes_count, 0) +
             COALESCE(influencer_metrics.retweets_count, 0) +
             COALESCE(influencer_metrics.replies_count, 0)) * 0.01 *
            (1 + COALESCE(influencer_metrics.engagement_rate, 0) / 100.0)
          ) as total_points
        `)
      );

    // Compute archetype for each influencer from available metrics
    const withArchetypes = influencers.map((inf) => {
      const engRate  = parseFloat(String(inf.engagement_rate || 0));
      const tweets   = parseFloat(String(inf.daily_tweets   || 0));
      const followers = parseInt(String(inf.follower_count  || 0), 10);

      // Normalize each metric to 0–1 scale
      const actNorm  = Math.min(1, tweets   / 10);           // 10+ tweets/day = peak activity
      const engNorm  = Math.min(1, engRate  / 5);            // 5%+ engagement = peak engagement
      const growNorm = Math.min(1, followers / 5_000_000);   // 5M+ followers = peak growth

      const scores = [
        { key: 'activity',   norm: actNorm  },
        { key: 'engagement', norm: engNorm  },
        { key: 'growth',     norm: growNorm },
      ].sort((a, b) => b.norm - a.norm);

      const dominant = scores[0];
      const second   = scores[1];

      let archetype = 'All-Rounder';
      if (dominant.norm >= 0.25) {
        // Clear leader in one category
        const gap = dominant.norm - second.norm;
        if (gap > 0.15) {
          // Significantly dominant in one category
          const map: Record<string, string> = {
            activity:   'Activity Beast',
            engagement: 'Engagement Wizard',
            growth:     'Growth Machine',
          };
          archetype = map[dominant.key] ?? 'All-Rounder';
        } else if (engRate > 4 && tweets < 5) {
          // High engagement but low volume = punchy/viral
          archetype = 'Viral Sniper';
        } else {
          archetype = 'All-Rounder';
        }
      }

      return { ...inf, archetype };
    });

    res.json({
      influencers: withArchetypes,
      budget_info: {
        max_budget: 150,
        team_size: 5,
        currency: 'points',
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get contest leaderboard
 * GET /api/league/leaderboard/:contest_id? (PUBLIC - no auth required)
 */
router.get('/leaderboard/:contest_id?', async (req: Request, res: Response) => {
  try {
    let contestId = req.params.contest_id ? parseInt(req.params.contest_id) : null;

    // If no contest_id provided, get active contest (prefer free league over prize league)
    if (!contestId) {
      const contest = await db('fantasy_contests')
        .where({ status: 'active' })
        .orderBy('is_prize_league', 'asc') // Free leagues first
        .orderBy('id', 'asc')
        .first();

      if (!contest) {
        return res.status(404).json({ error: 'No active contest' });
      }

      contestId = contest.id;
    }

    // Get top 100 teams for this contest
    const leaderboard = await db('user_teams')
      .where({ contest_id: contestId })
      .orderBy('total_score', 'desc')
      .orderBy('created_at', 'asc')
      .limit(100)
      .select('user_teams.*');

    // Update ranks
    leaderboard.forEach((team, index) => {
      team.rank = index + 1;
    });

    res.json({ leaderboard });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit weekly spotlight vote (CT Spotlight)
 * POST /api/league/vote
 * Body: { influencer_id: number }
 * Note: Users can vote once per week and update their vote anytime during the week
 */
router.post('/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { influencer_id } = req.body;

    if (!influencer_id) {
      return res.status(400).json({ error: 'influencer_id required' });
    }

    // Get active contest
    const activeContest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!activeContest) {
      return res.status(404).json({ error: 'No active contest. Check back when a new week starts!' });
    }

    // Verify influencer exists
    const influencer = await db('influencers')
      .where({ id: influencer_id, is_active: true })
      .first();

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Get user data (XP, streak)
    const user = await db('users')
      .where({ 'users.id': userId })
      .leftJoin('user_xp_totals', 'users.id', 'user_xp_totals.user_id')
      .select('users.vote_streak', 'users.last_vote_date', 'user_xp_totals.total_xp as xp')
      .first();

    const userXP = user?.xp || 0;
    const voteWeight = getVoteWeight(userXP); // Returns 1.0 to 2.0 based on level

    // Calculate streak
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastVoteDate = user?.last_vote_date;
    let currentStreak = user?.vote_streak || 0;
    let streakBroken = false;

    if (lastVoteDate) {
      const lastDate = new Date(lastVoteDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Already voted today - keep existing streak
      } else if (daysDiff === 1) {
        // Voted yesterday - increment streak
        currentStreak += 1;
      } else {
        // Missed a day - reset streak
        currentStreak = 1;
        streakBroken = true;
      }
    } else {
      // First vote ever
      currentStreak = 1;
    }

    // Check if user already voted this week
    const existingVote = await db('weekly_spotlight_votes')
      .where({
        user_id: userId,
        contest_id: activeContest.id,
      })
      .first();

    let isUpdate = false;
    let previousInfluencerId = null;

    if (existingVote) {
      isUpdate = true;
      previousInfluencerId = existingVote.influencer_id;

      // Don't allow voting for the same influencer
      if (previousInfluencerId === influencer_id) {
        return res.json({
          success: true,
          message: 'You already voted for this influencer',
          vote_weight: voteWeight,
          is_update: false,
        });
      }

      // Update existing vote
      await db('weekly_spotlight_votes')
        .where({ id: existingVote.id })
        .update({
          influencer_id,
          vote_weight: voteWeight,
          updated_at: db.fn.now(),
        });

      // Decrement previous influencer's vote count
      await db.raw(`
        UPDATE influencer_weekly_votes
        SET vote_count = GREATEST(vote_count - 1, 0),
            weighted_score = GREATEST(weighted_score - ?, 0)
        WHERE influencer_id = ? AND contest_id = ?
      `, [voteWeight, previousInfluencerId, activeContest.id]);
    } else {
      // Insert new vote
      await db('weekly_spotlight_votes').insert({
        user_id: userId,
        influencer_id,
        contest_id: activeContest.id,
        vote_weight: voteWeight,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }

    // Update or create influencer weekly vote count
    const existingInfluencerVote = await db('influencer_weekly_votes')
      .where({
        influencer_id,
        contest_id: activeContest.id,
      })
      .first();

    if (existingInfluencerVote) {
      await db('influencer_weekly_votes')
        .where({ id: existingInfluencerVote.id })
        .update({
          vote_count: db.raw('vote_count + 1'),
          weighted_score: db.raw('weighted_score + ?', [voteWeight]),
          updated_at: db.fn.now(),
        });
    } else {
      await db('influencer_weekly_votes').insert({
        influencer_id,
        contest_id: activeContest.id,
        vote_count: 1,
        weighted_score: voteWeight,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }

    // Update user's streak and award bonus XP
    const totalBonusXP = !isUpdate ? (currentStreak >= 7 ? 25 : currentStreak >= 3 ? 10 : 5) : 0;
    const baseVoteXP = !isUpdate ? 10 : 0; // 10 XP for voting
    const totalXP = baseVoteXP + totalBonusXP;

    if (currentStreak !== user?.vote_streak) {
      await db('users')
        .where({ id: userId })
        .update({
          vote_streak: currentStreak,
          last_vote_date: today,
        });
    }

    if (totalXP > 0) {
      // Award XP in the XP totals table
      await db('user_xp_totals')
        .where({ user_id: userId })
        .update({
          total_xp: db.raw('total_xp + ?', [totalXP]),
          lifetime_xp: db.raw('lifetime_xp + ?', [totalXP]),
          engagement_xp: db.raw('engagement_xp + ?', [totalXP]),
          last_xp_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
    }

    // Check for voting achievements (async, don't block response)
    if (!isUpdate) {
      // Get total vote count for this user
      const voteCount = await db('weekly_spotlight_votes')
        .where({ user_id: userId })
        .count('* as count')
        .first();

      const totalVotes = parseInt(voteCount?.count as string) || 0;

      // Check voting achievements
      checkVotingAchievements(userId, totalVotes, currentStreak).catch(console.error);

      // Check milestone achievements
      checkMilestoneAchievements(userId).catch(console.error);

      // Check streak quest achievements (7-day, 30-day)
      questService.checkLoginStreak(userId, currentStreak).catch(console.error);

      // Award Foresight Score for daily engagement (voting counts as daily activity)
      foresightScoreService.earnFs({
        userId,
        reason: 'daily_login',
        category: 'engagement',
        sourceType: 'vote',
        sourceId: influencer_id.toString(),
        metadata: { streak: currentStreak, voteWeight }
      }).catch(err => console.error('[FS] Error awarding daily login FS:', err));

      // Award streak bonus if applicable
      if (currentStreak >= 7) {
        foresightScoreService.earnFs({
          userId,
          reason: 'login_streak_bonus',
          category: 'engagement',
          baseAmount: Math.min(50, currentStreak * 5), // 5 FS per day, max 50
          sourceType: 'streak',
          metadata: { streak: currentStreak }
        }).catch(err => console.error('[FS] Error awarding streak bonus FS:', err));
      }
    }

    res.json({
      success: true,
      message: isUpdate ? 'Vote updated successfully' : 'Vote submitted successfully',
      vote_weight: voteWeight,
      is_update: isUpdate,
      streak: currentStreak,
      streak_broken: streakBroken,
      xp_earned: totalXP,
      bonus_xp: totalBonusXP,
    });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get weekly spotlight voting status
 * GET /api/league/vote/status
 */
router.get('/vote/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get active contest
    const activeContest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!activeContest) {
      return res.json({
        has_voted: false,
        vote: null,
        contest: null,
        message: 'No active contest',
      });
    }

    const vote = await db('weekly_spotlight_votes')
      .join('influencers', 'weekly_spotlight_votes.influencer_id', 'influencers.id')
      .where({
        'weekly_spotlight_votes.user_id': userId,
        'weekly_spotlight_votes.contest_id': activeContest.id,
      })
      .select(
        'weekly_spotlight_votes.*',
        'influencers.display_name as influencer_name',
        'influencers.twitter_handle as influencer_handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier'
      )
      .first();

    res.json({
      has_voted: !!vote,
      vote: vote || null,
      contest: {
        id: activeContest.id,
        contest_key: activeContest.contest_key,
        start_date: activeContest.start_date,
        end_date: activeContest.end_date,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vote status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get weekly spotlight leaderboard
 * GET /api/league/vote/leaderboard (PUBLIC - no auth required)
 */
router.get('/vote/leaderboard', async (req: Request, res: Response) => {
  try {
    // Get active contest
    const activeContest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!activeContest) {
      return res.json({
        leaderboard: [],
        contest: null,
        message: 'No active contest',
      });
    }

    const leaderboard = await db('influencer_weekly_votes')
      .join('influencers', 'influencer_weekly_votes.influencer_id', 'influencers.id')
      .where({
        'influencer_weekly_votes.contest_id': activeContest.id,
      })
      .orderBy('influencer_weekly_votes.weighted_score', 'desc')
      .orderBy('influencer_weekly_votes.vote_count', 'desc')
      .limit(20)
      .select(
        'influencers.id',
        'influencers.display_name as name',
        'influencers.twitter_handle as handle',
        'influencers.avatar_url as profile_image_url',
        'influencers.tier',
        'influencer_weekly_votes.vote_count',
        'influencer_weekly_votes.weighted_score'
      );

    res.json({
      leaderboard,
      contest: {
        id: activeContest.id,
        contest_key: activeContest.contest_key,
        start_date: activeContest.start_date,
        end_date: activeContest.end_date,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vote leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get team score breakdown (PUBLIC - for showing score details)
 * GET /api/league/team/:teamId/breakdown
 */
router.get('/team/:teamId/breakdown', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Get team info
    const team = await db('user_teams')
      .where('id', teamId)
      .select('*')
      .first();

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get picks with score breakdown
    const picks = await db('team_picks')
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .where('team_id', teamId)
      .orderBy('team_picks.total_points', 'desc')
      .select(
        'team_picks.*',
        'influencers.display_name',
        'influencers.twitter_handle',
        'influencers.avatar_url',
        'influencers.tier'
      );

    // Parse score_details JSON for each pick (only if it's a string)
    const picksWithDetails = picks.map(pick => ({
      ...pick,
      score_details: typeof pick.score_details === 'string'
        ? JSON.parse(pick.score_details)
        : pick.score_details || null,
    }));

    // Calculate totals for summary
    const totals = {
      activity: picks.reduce((sum, p) => sum + parseFloat(p.activity_score || 0), 0),
      engagement: picks.reduce((sum, p) => sum + parseFloat(p.engagement_score || 0), 0),
      growth: picks.reduce((sum, p) => sum + parseFloat(p.growth_score || 0), 0),
      viral: picks.reduce((sum, p) => sum + parseFloat(p.viral_score || 0), 0),
      captainBonus: picks.reduce((sum, p) => sum + parseFloat(p.captain_bonus || 0), 0),
      spotlightBonus: picks.reduce((sum, p) => sum + parseFloat(p.spotlight_bonus || 0), 0),
    };

    res.json({
      success: true,
      team: {
        id: team.id,
        name: team.team_name,
        totalScore: team.total_score,
        rank: team.rank,
        scoreChange: team.score_change,
        lastUpdate: team.last_score_update,
      },
      picks: picksWithDetails,
      totals,
      scoringVersion: 'v2',
      formula: {
        activity: { max: 35, description: '1.5 pts per tweet' },
        engagement: { max: 60, description: 'sqrt(weighted_engagement) × volume' },
        growth: { max: 40, description: 'absolute + rate bonus' },
        viral: { max: 25, description: 'bonus for 10K+ engagement tweets' },
        captain: { multiplier: 2.0, description: 'captain gets ×2.0' },
        spotlight: { bonuses: [12, 8, 4], description: 'top 3 voted get flat bonus' },
      },
    });
  } catch (error: any) {
    console.error('Error fetching team breakdown:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get transfer status for user
 * Shows remaining free transfers and cost for additional
 * GET /api/league/transfer/status
 */
router.get('/transfer/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get current week/year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const year = now.getFullYear();

    // Get user's FS tier
    const fsData = await db('foresight_scores')
      .where({ user_id: userId })
      .first();
    const userTier = fsData?.tier || 'bronze';

    // Get tier limits
    const tierLimits = await db('transfer_tier_limits')
      .where({ tier: userTier })
      .first();
    const freeTransfersAllowed = tierLimits?.free_transfers_per_week || 1;
    const extraCost = tierLimits?.extra_transfer_fs_cost || 50;

    // Count transfers this week
    const transfersThisWeek = await db('team_transfers')
      .where({ user_id: userId, week_number: weekNumber, year })
      .count('* as count')
      .first();
    const usedTransfers = parseInt(transfersThisWeek?.count as string) || 0;

    // Count free transfers used
    const freeUsed = await db('team_transfers')
      .where({ user_id: userId, week_number: weekNumber, year, is_free: true })
      .count('* as count')
      .first();
    const freeTransfersUsed = parseInt(freeUsed?.count as string) || 0;

    res.json({
      success: true,
      data: {
        tier: userTier,
        freeTransfersAllowed,
        freeTransfersRemaining: Math.max(0, freeTransfersAllowed - freeTransfersUsed),
        usedTransfersThisWeek: usedTransfers,
        nextTransferCost: freeTransfersUsed < freeTransfersAllowed ? 0 : extraCost,
        userFsBalance: fsData?.total_score || 0,
        weekNumber,
      },
    });
  } catch (error: any) {
    console.error('Error getting transfer status:', error);
    res.status(500).json({ success: false, error: 'Failed to get transfer status' });
  }
});

/**
 * Execute a team transfer (swap influencers)
 * POST /api/league/transfer
 */
router.post('/transfer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { outInfluencerId, inInfluencerId } = req.body;

    if (!outInfluencerId || !inInfluencerId) {
      return res.status(400).json({ success: false, error: 'Both out and in influencer IDs required' });
    }

    if (outInfluencerId === inInfluencerId) {
      return res.status(400).json({ success: false, error: 'Cannot swap same influencer' });
    }

    // Get user's team
    const team = await db('user_teams')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    if (!team) {
      return res.status(404).json({ success: false, error: 'No team found' });
    }

    // Verify out_influencer is on the team
    const existingPick = await db('team_picks')
      .where({ team_id: team.id, influencer_id: outInfluencerId })
      .first();

    if (!existingPick) {
      return res.status(400).json({ success: false, error: 'Influencer not on your team' });
    }

    // Verify in_influencer is not already on the team
    const alreadyOnTeam = await db('team_picks')
      .where({ team_id: team.id, influencer_id: inInfluencerId })
      .first();

    if (alreadyOnTeam) {
      return res.status(400).json({ success: false, error: 'Influencer already on your team' });
    }

    // Get both influencers for price check
    const [outInfluencer, inInfluencer] = await Promise.all([
      db('influencers').where({ id: outInfluencerId }).first(),
      db('influencers').where({ id: inInfluencerId }).first(),
    ]);

    if (!outInfluencer || !inInfluencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' });
    }

    // Calculate budget impact
    const currentBudgetUsed = parseFloat(team.total_budget_used || '0');
    const budgetChange = parseFloat(inInfluencer.price || '0') - parseFloat(outInfluencer.price || '0');
    const newBudget = currentBudgetUsed + budgetChange;

    if (newBudget > parseFloat(team.max_budget || '150')) {
      return res.status(400).json({
        success: false,
        error: `Transfer would exceed budget. Need ${budgetChange.toFixed(2)} more budget.`,
      });
    }

    // Get week info
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const year = now.getFullYear();

    // Get user's FS tier and transfer limits
    const fsData = await db('foresight_scores')
      .where({ user_id: userId })
      .first();
    const userTier = fsData?.tier || 'bronze';

    const tierLimits = await db('transfer_tier_limits')
      .where({ tier: userTier })
      .first();
    const freeTransfersAllowed = tierLimits?.free_transfers_per_week || 1;
    const extraCost = tierLimits?.extra_transfer_fs_cost || 50;

    // Count free transfers this week
    const freeUsed = await db('team_transfers')
      .where({ user_id: userId, week_number: weekNumber, year, is_free: true })
      .count('* as count')
      .first();
    const freeTransfersUsed = parseInt(freeUsed?.count as string) || 0;

    const isFree = freeTransfersUsed < freeTransfersAllowed;
    const fsCost = isFree ? 0 : extraCost;

    // Check if user has enough FS if not free
    if (!isFree && (fsData?.total_score || 0) < fsCost) {
      return res.status(400).json({
        success: false,
        error: `Not enough FS. Need ${fsCost} FS, you have ${fsData?.total_score || 0}.`,
      });
    }

    // Get current contest
    const currentContest = await db('fantasy_contests')
      .where({ status: 'active' })
      .orderBy('start_date', 'desc')
      .first();

    // Execute transfer in transaction
    await db.transaction(async (trx) => {
      // Update team pick
      await trx('team_picks')
        .where({ team_id: team.id, influencer_id: outInfluencerId })
        .update({
          influencer_id: inInfluencerId,
          is_captain: existingPick.is_captain, // Preserve captain status
        });

      // Update team budget
      await trx('user_teams')
        .where({ id: team.id })
        .update({ total_budget_used: newBudget });

      // Record transfer
      await trx('team_transfers').insert({
        user_id: userId,
        team_id: team.id,
        contest_id: currentContest?.id || null,
        out_influencer_id: outInfluencerId,
        in_influencer_id: inInfluencerId,
        is_free: isFree,
        fs_cost: fsCost,
        week_number: weekNumber,
        year,
      });

      // Deduct FS if not free
      if (!isFree) {
        await foresightScoreService.earnFs({
          userId,
          reason: 'transfer_cost',
          category: 'fantasy',
          baseAmount: -fsCost, // Negative to deduct
          metadata: {
            description: `Transfer: ${outInfluencer.handle} → ${inInfluencer.handle}`
          }
        });
      }
    });

    // Record activity (async, don't block response)
    activityFeedService.recordActivity(
      userId,
      'transfer',
      `transferred @${outInfluencer.handle} → @${inInfluencer.handle}`,
      {
        influencerOut: outInfluencer.handle,
        influencerIn: inInfluencer.handle,
        isFree,
        fsCost,
      }
    ).catch(console.error);

    // Trigger quest progress (async, don't block response)
    questService.triggerAction(userId, 'transfer_made', {
      influencerOut: outInfluencer.handle,
      influencerIn: inInfluencer.handle,
    }).catch(console.error);

    res.json({
      success: true,
      data: {
        message: isFree ? 'Free transfer successful!' : `Transfer complete. ${fsCost} FS deducted.`,
        transfer: {
          out: { id: outInfluencer.id, name: outInfluencer.name, handle: outInfluencer.handle },
          in: { id: inInfluencer.id, name: inInfluencer.name, handle: inInfluencer.handle },
        },
        wasFree: isFree,
        fsCost,
        newBudget: newBudget.toFixed(2),
        freeTransfersRemaining: isFree
          ? freeTransfersAllowed - freeTransfersUsed - 1
          : freeTransfersAllowed - freeTransfersUsed,
      },
    });
  } catch (error: any) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ success: false, error: 'Failed to execute transfer' });
  }
});

/**
 * Get transfer history for user
 * GET /api/league/transfer/history
 */
router.get('/transfer/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const transfers = await db('team_transfers')
      .where({ user_id: userId })
      .join('influencers as out_inf', 'team_transfers.out_influencer_id', 'out_inf.id')
      .join('influencers as in_inf', 'team_transfers.in_influencer_id', 'in_inf.id')
      .select(
        'team_transfers.*',
        'out_inf.name as out_name',
        'out_inf.handle as out_handle',
        'in_inf.name as in_name',
        'in_inf.handle as in_handle'
      )
      .orderBy('team_transfers.created_at', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: transfers.map((t) => ({
        id: t.id,
        out: { name: t.out_name, handle: t.out_handle },
        in: { name: t.in_name, handle: t.in_handle },
        isFree: t.is_free,
        fsCost: t.fs_cost,
        createdAt: t.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching transfer history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transfer history' });
  }
});

/**
 * Get live scoring data for user's team
 * Shows real-time performance of drafted influencers
 * GET /api/league/live-scoring
 */
router.get('/live-scoring', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user's active team
    const team = await db('user_teams')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    if (!team) {
      return res.json({
        success: true,
        data: {
          hasTeam: false,
          message: 'No active team. Draft your team to see live scoring.',
        },
      });
    }

    // Get team picks with current influencer data
    const picks = await db('team_picks')
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .leftJoin('influencer_metrics', function () {
        this.on('influencers.id', '=', 'influencer_metrics.influencer_id')
          .andOn('influencer_metrics.scraped_at', '=', db.raw(
            '(SELECT MAX(scraped_at) FROM influencer_metrics WHERE influencer_id = influencers.id)'
          ));
      })
      .where({ 'team_picks.team_id': team.id })
      .select(
        'influencers.id',
        'influencers.name',
        'influencers.handle',
        'influencers.tier',
        'influencers.profile_image_url',
        'team_picks.is_captain',
        'influencers.follower_count',
        'influencer_metrics.likes_count',
        'influencer_metrics.retweets_count',
        'influencer_metrics.daily_tweets',
        'influencer_metrics.engagement_rate',
        'influencer_metrics.scraped_at as last_updated'
      );

    // Get weekly snapshot data if available
    const currentContest = await db('fantasy_contests')
      .where({ status: 'active' })
      .orderBy('start_date', 'desc')
      .first();

    let weeklyData: any[] = [];
    if (currentContest) {
      weeklyData = await db('weekly_snapshots')
        .whereIn('influencer_id', picks.map(p => p.id))
        .where('contest_id', currentContest.id)
        .select('*');
    }

    // Build performance data for each pick
    const influencerPerformance = picks.map((pick) => {
      const startSnapshot = weeklyData.find(s => s.influencer_id === pick.id && s.snapshot_type === 'start');
      const endSnapshot = weeklyData.find(s => s.influencer_id === pick.id && s.snapshot_type === 'end');

      // Calculate follower delta if we have start snapshot
      let followerDelta = 0;
      if (startSnapshot) {
        followerDelta = (pick.follower_count || 0) - (startSnapshot.follower_count || 0);
      }

      // Calculate activity score estimate
      const tweetsThisWeek = pick.daily_tweets || 0;
      const activityScore = Math.min(35, tweetsThisWeek * 1.5);

      // Calculate engagement score estimate
      const avgLikes = pick.likes_count || 0;
      const avgRetweets = pick.retweets_count || 0;
      const quality = Math.sqrt(avgLikes + avgRetweets * 2) * 1.5;
      const engagementScore = Math.min(60, quality);

      // Calculate growth score estimate
      const growthScore = Math.min(20, followerDelta / 2000);

      // Estimate total (without viral bonus, captain will be added)
      let estimatedScore = Math.round(activityScore + engagementScore + growthScore);
      if (pick.is_captain) {
        estimatedScore = Math.round(estimatedScore * 1.5);
      }

      return {
        id: pick.id,
        name: pick.name,
        handle: pick.handle,
        tier: pick.tier,
        profileImage: pick.profile_image_url,
        isCaptain: pick.is_captain,
        currentStats: {
          followers: pick.follower_count || 0,
          followerDelta,
          dailyTweets: pick.daily_tweets || 0,
          likes: pick.likes_count || 0,
          retweets: pick.retweets_count || 0,
          engagementRate: parseFloat(pick.engagement_rate || '0'),
        },
        estimatedScore,
        lastUpdated: pick.last_updated,
        breakdown: {
          activity: Math.round(activityScore),
          engagement: Math.round(engagementScore),
          growth: Math.round(growthScore),
          captainBonus: pick.is_captain ? Math.round((activityScore + engagementScore + growthScore) * 0.5) : 0,
        },
      };
    });

    // Calculate team totals
    const teamTotal = influencerPerformance.reduce((sum, p) => sum + p.estimatedScore, 0);
    const totalFollowerDelta = influencerPerformance.reduce((sum, p) => sum + p.currentStats.followerDelta, 0);

    // Get team rank if in contest
    let teamRank = null;
    if (currentContest) {
      const entry = await db('free_league_entries')
        .where({ contest_id: currentContest.id, user_id: userId })
        .first();
      if (entry) {
        teamRank = entry.rank;
      }
    }

    res.json({
      success: true,
      data: {
        hasTeam: true,
        team: {
          id: team.id,
          name: team.team_name,
          createdAt: team.created_at,
        },
        contest: currentContest ? {
          id: currentContest.id,
          name: currentContest.name,
          status: currentContest.status,
          endsAt: currentContest.end_date,
        } : null,
        summary: {
          estimatedScore: teamTotal,
          rank: teamRank,
          followerDelta: totalFollowerDelta,
          topPerformer: influencerPerformance.reduce((top, p) =>
            p.estimatedScore > (top?.estimatedScore || 0) ? p : top,
            influencerPerformance[0]
          ),
        },
        influencers: influencerPerformance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching live scoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live scoring data',
    });
  }
});

router.get('/scoring-formula', async (_req: Request, res: Response) => {
  res.json({
    version: 'v2',
    name: 'Performance-Based Scoring',
    description: 'All points earned through actual performance - no free points from tier',
    categories: [
      {
        name: 'Activity',
        icon: '🐦',
        range: '0-35 pts',
        formula: 'tweets × 1.5',
        description: 'Rewards consistent tweeting. 1.5 points per tweet this week.',
      },
      {
        name: 'Engagement',
        icon: '💬',
        range: '0-60 pts',
        formula: 'sqrt(weighted) × volume',
        description: 'Quality of interactions. Replies count 3×, Retweets 2×, Likes 1×. Square root normalizes across account sizes.',
      },
      {
        name: 'Growth',
        icon: '📈',
        range: '0-40 pts',
        formula: 'absolute + rate',
        description: 'Follower growth. 1 pt per 2K new followers + 5 pts per 1% growth rate.',
      },
      {
        name: 'Viral',
        icon: '🔥',
        range: '0-25 pts',
        formula: 'bonus per viral tweet',
        description: '10K-49K: +4 pts, 50K-99K: +7 pts, 100K+: +12 pts. Max 3 tweets count.',
      },
    ],
    multipliers: [
      {
        name: 'Captain',
        icon: '⭐',
        value: '×2.0',
        description: 'Your captain gets 2.0× their base score.',
      },
      {
        name: 'Spotlight',
        icon: '🎯',
        values: '+12 / +8 / +4',
        description: 'Top 3 community-voted influencers get flat bonus points.',
      },
    ],
    maxPossible: {
      perInfluencer: 160,
      withCaptain: 240,
      perTeam: 1200,
      realisticTop: '400-700',
    },
  });
});

export default router;
