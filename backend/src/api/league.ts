/**
 * CT Fantasy League API
 * Endpoints for team management, picks, and contests
 */

import express, { Request, Response } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth';
import db from '../utils/db';
import { getVoteWeight } from '../utils/xp';

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
 * Get user's team for specific or current contest
 * GET /api/league/team/me?contest_id=123 (optional contest_id)
 */
router.get('/team/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const contestIdParam = req.query.contest_id;

    // Get contest - use provided contest_id or default to active contest
    let contest;
    if (contestIdParam) {
      const contestId = parseInt(contestIdParam as string);
      contest = await db('fantasy_contests')
        .where({ id: contestId, status: 'active' })
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

    // Get user's team
    const team = await db('user_teams')
      .where({ user_id: userId, contest_id: contest.id })
      .first();

    if (!team) {
      return res.json({ team: null, contest });
    }

    // Get team picks with influencer details
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
    console.error('Error creating team:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update team picks (before locking)
 * PUT /api/league/team/update
 * Body: { influencer_ids: number[] }
 */
router.put('/team/update', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { influencer_ids, captain_id } = req.body;

    if (!influencer_ids || !Array.isArray(influencer_ids) || influencer_ids.length !== 5) {
      return res.status(400).json({ error: 'Must provide exactly 5 influencer IDs' });
    }

    if (!captain_id) {
      return res.status(400).json({ error: 'Must select a captain' });
    }

    if (!influencer_ids.includes(captain_id)) {
      return res.status(400).json({ error: 'Captain must be one of your selected influencers' });
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
    // Order by tier: S (Legendary) first, then A (Epic), B (Rare), C (Common)
    const influencers = await db('influencers')
      .where({ is_active: true })
      .whereIn('tier', ['S', 'A', 'B', 'C'])
      .orderByRaw(`
        CASE tier
          WHEN 'S' THEN 1
          WHEN 'A' THEN 2
          WHEN 'B' THEN 3
          WHEN 'C' THEN 4
        END ASC
      `)
      .orderBy('price', 'desc')
      .select(
        'id',
        'display_name as name',
        'twitter_handle as handle',
        'avatar_url as profile_image_url',
        'tier',
        'price',
        'follower_count',
        'form_score',
        'total_points'
      );

    res.json({
      influencers,
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

    // If no contest_id provided, get active contest
    if (!contestId) {
      const contest = await db('fantasy_contests')
        .where({ status: 'active' })
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

    // Calculate vote weight based on user XP level (1x to 2x multiplier)
    const user = await db('users')
      .where({ id: userId })
      .select('xp')
      .first();

    const userXP = user?.xp || 0;
    const voteWeight = getVoteWeight(userXP); // Returns 1.0 to 2.0 based on level

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

    res.json({
      success: true,
      message: isUpdate ? 'Vote updated successfully' : 'Vote submitted successfully',
      vote_weight: voteWeight,
      is_update: isUpdate,
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

export default router;
