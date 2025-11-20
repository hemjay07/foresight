/**
 * CT Fantasy League API
 * Endpoints for team management, picks, and contests
 */

import express, { Request, Response } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth';
import db from '../utils/db';

const router = express.Router();

/**
 * Get current active contest
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
 * Get user's team for current contest
 * GET /api/league/team/me
 */
router.get('/team/me', authenticateToken, async (req: Request, res: Response) => {
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
        max_budget: 25.0,
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
    const { team_name, influencer_ids } = req.body;

    if (!team_name || !influencer_ids || !Array.isArray(influencer_ids)) {
      return res.status(400).json({ error: 'team_name and influencer_ids array required' });
    }

    if (influencer_ids.length !== 5) {
      return res.status(400).json({ error: 'Must select exactly 5 influencers' });
    }

    // Get active contest
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'No active contest' });
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

    // Validate budget: max 25M
    const totalPrice = influencers.reduce((sum, inf) => sum + parseFloat(inf.price || 0), 0);
    const MAX_BUDGET = 25.0;

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
        max_budget: 25.0,
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
    const { influencer_ids } = req.body;

    if (!influencer_ids || !Array.isArray(influencer_ids) || influencer_ids.length !== 5) {
      return res.status(400).json({ error: 'Must provide exactly 5 influencer IDs' });
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

    // Validate budget: max 25M
    const totalPrice = influencers.reduce((sum, inf) => sum + parseFloat(inf.price || 0), 0);
    const MAX_BUDGET = 25.0;

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
        max_budget: 25.0,
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
    // Get all 20 influencers with pricing (S, A, B tiers)
    const influencers = await db('influencers')
      .where({ is_active: true })
      .whereIn('tier', ['S', 'A', 'B'])
      .orderBy('tier', 'asc')
      .orderBy('price', 'desc')
      .limit(20)
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
        max_budget: 25.0,
        team_size: 5,
        currency: 'M (millions)',
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
 * Submit daily vote
 * POST /api/league/vote
 * Body: { influencer_id: number, category: 'general' }
 */
router.post('/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { influencer_id, category = 'general' } = req.body;

    if (!influencer_id) {
      return res.status(400).json({ error: 'influencer_id required' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if user already voted today in this category
    const existingVote = await db('daily_votes')
      .where({
        user_id: userId,
        vote_date: today,
        category,
      })
      .first();

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted today in this category' });
    }

    // Verify influencer exists
    const influencer = await db('influencers')
      .where({ id: influencer_id, is_active: true })
      .first();

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Calculate vote weight based on user level/reputation
    const userXP = await db('user_xp_totals')
      .where({ user_id: userId })
      .first();

    const voteWeight = userXP ? Math.floor(userXP.current_level / 5) + 1 : 1; // Level 1-4 = weight 1, 5-9 = weight 2, etc.

    // Submit vote and update scores in transaction
    await db.transaction(async (trx) => {
      // Insert vote
      await trx('daily_votes').insert({
        user_id: userId,
        influencer_id,
        vote_date: today,
        vote_weight: voteWeight,
        category,
      });

      // Update or create influencer score for today
      const existingScore = await trx('influencer_scores')
        .where({
          influencer_id,
          score_date: today,
          category,
        })
        .first();

      if (existingScore) {
        await trx('influencer_scores')
          .where({ id: existingScore.id })
          .update({
            vote_count: existingScore.vote_count + 1,
            weighted_score: existingScore.weighted_score + voteWeight,
            updated_at: db.fn.now(),
          });
      } else {
        await trx('influencer_scores').insert({
          influencer_id,
          score_date: today,
          vote_count: 1,
          weighted_score: voteWeight,
          category,
        });
      }

      // Update team picks scores if influencer is in active teams
      const activeContest = await trx('fantasy_contests')
        .where({ status: 'active' })
        .first();

      if (activeContest) {
        const picks = await trx('team_picks')
          .join('user_teams', 'team_picks.team_id', 'user_teams.id')
          .where({
            'user_teams.contest_id': activeContest.id,
            'team_picks.influencer_id': influencer_id,
          })
          .select('team_picks.id');

        if (picks.length > 0) {
          for (const pick of picks) {
            await trx('team_picks')
              .where({ id: pick.id })
              .increment('daily_points', voteWeight)
              .increment('total_points', voteWeight);
          }

          // Update team total scores
          await trx.raw(`
            UPDATE user_teams
            SET total_score = (
              SELECT COALESCE(SUM(total_points), 0)
              FROM team_picks
              WHERE team_picks.team_id = user_teams.id
            ),
            updated_at = NOW()
            WHERE contest_id = ?
          `, [activeContest.id]);
        }
      }
    });

    res.json({
      success: true,
      message: 'Vote submitted successfully',
      vote_weight: voteWeight,
    });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get today's voting status
 * GET /api/league/vote/status
 */
router.get('/vote/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const today = new Date().toISOString().split('T')[0];

    const vote = await db('daily_votes')
      .join('influencers', 'daily_votes.influencer_id', 'influencers.id')
      .where({
        'daily_votes.user_id': userId,
        'daily_votes.vote_date': today,
      })
      .select(
        'daily_votes.*',
        'influencers.name as influencer_name',
        'influencers.handle as influencer_handle'
      )
      .first();

    res.json({
      has_voted: !!vote,
      vote: vote || null,
    });
  } catch (error: any) {
    console.error('Error fetching vote status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get today's voting leaderboard
 * GET /api/league/vote/leaderboard
 */
router.get('/vote/leaderboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const leaderboard = await db('influencer_scores')
      .join('influencers', 'influencer_scores.influencer_id', 'influencers.id')
      .where({
        'influencer_scores.score_date': today,
        'influencer_scores.category': 'general',
      })
      .orderBy('influencer_scores.weighted_score', 'desc')
      .limit(10)
      .select(
        'influencers.id',
        'influencers.name',
        'influencers.handle',
        'influencers.profile_image_url',
        'influencers.tier',
        'influencer_scores.vote_count',
        'influencer_scores.weighted_score'
      );

    res.json({ leaderboard });
  } catch (error: any) {
    console.error('Error fetching vote leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
