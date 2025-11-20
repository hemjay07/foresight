/**
 * Private Leagues API
 * Create/join leagues with entry fees, compete for prizes
 */

import express, { Request, Response } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth';
import db from '../utils/db';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate unique league code
 */
function generateLeagueCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create private league
 * POST /api/private-leagues/create
 * Body: { name, entry_fee, max_members }
 */
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      name,
      entry_fee = 0,
      max_members = 10,
      prize_distribution = 'winner_takes_all',
      duration = 'monthly'
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'League name required' });
    }

    if (entry_fee < 0 || entry_fee > 1) {
      return res.status(400).json({ error: 'Entry fee must be between 0 and 1 ETH' });
    }

    const validDistributions = ['winner_takes_all', 'top_3', 'top_5'];
    if (!validDistributions.includes(prize_distribution)) {
      return res.status(400).json({ error: 'Invalid prize distribution type' });
    }

    // Get active contest
    const contest = await db('fantasy_contests')
      .where({ status: 'active' })
      .first();

    if (!contest) {
      return res.status(404).json({ error: 'No active contest' });
    }

    // Generate unique code
    let code = generateLeagueCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db('private_leagues').where({ code }).first();
      if (!existing) break;
      code = generateLeagueCode();
      attempts++;
    }

    // Create league
    const [league] = await db.transaction(async (trx) => {
      const [newLeague] = await trx('private_leagues')
        .insert({
          name,
          code,
          creator_id: userId,
          contest_id: contest.id,
          entry_fee,
          prize_pool: 0,
          max_members,
          current_members: 1,
          status: 'open',
          prize_distribution,
          duration,
        })
        .returning('*');

      // Creator automatically joins (no entry fee for creator)
      await trx('league_members').insert({
        league_id: newLeague.id,
        user_id: userId,
        entry_paid: entry_fee === 0, // Free leagues = paid, paid leagues = creator doesn't pay
        joined_at: db.fn.now(),
      });

      return [newLeague];
    });

    res.json({
      success: true,
      league: {
        ...league,
        invite_url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/league/join/${code}`,
      },
    });
  } catch (error: any) {
    console.error('Error creating league:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get league by code
 * GET /api/private-leagues/:code
 */
router.get('/:code', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const league = await db('private_leagues')
      .where({ code })
      .first();

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Get members
    const members = await db('league_members')
      .where({ league_id: league.id })
      .orderBy('total_score', 'desc')
      .select('*');

    // Check if user is member
    const userId = (req as any).user.userId;
    const isMember = members.some((m) => m.user_id === userId);

    res.json({
      league: {
        ...league,
        members,
        is_member: isMember,
      },
    });
  } catch (error: any) {
    console.error('Error fetching league:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Join league with code
 * POST /api/private-leagues/join
 * Body: { code, tx_hash? }
 */
router.post('/join', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { code, tx_hash } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'League code required' });
    }

    const league = await db('private_leagues')
      .where({ code })
      .first();

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (league.status !== 'open') {
      return res.status(400).json({ error: 'League is not accepting new members' });
    }

    if (league.current_members >= league.max_members) {
      return res.status(400).json({ error: 'League is full' });
    }

    // Check if already member
    const existing = await db('league_members')
      .where({ league_id: league.id, user_id: userId })
      .first();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this league' });
    }

    // For paid leagues, verify payment (in production, verify on-chain)
    const entryPaid = league.entry_fee === 0 || !!tx_hash;

    // Join league
    await db.transaction(async (trx) => {
      await trx('league_members').insert({
        league_id: league.id,
        user_id: userId,
        entry_paid: entryPaid,
        entry_tx_hash: tx_hash,
        joined_at: db.fn.now(),
      });

      // Update league
      const newPrizePool = parseFloat(league.prize_pool) + parseFloat(league.entry_fee);
      await trx('private_leagues')
        .where({ id: league.id })
        .update({
          current_members: league.current_members + 1,
          prize_pool: newPrizePool,
          status: league.current_members + 1 >= league.max_members ? 'full' : 'open',
          updated_at: db.fn.now(),
        });
    });

    res.json({
      success: true,
      message: 'Successfully joined league!',
    });
  } catch (error: any) {
    console.error('Error joining league:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's leagues
 * GET /api/private-leagues/my-leagues
 */
router.get('/my-leagues', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const leagues = await db('league_members')
      .join('private_leagues', 'league_members.league_id', 'private_leagues.id')
      .where({ 'league_members.user_id': userId })
      .select(
        'private_leagues.*',
        'league_members.total_score',
        'league_members.rank',
        'league_members.entry_paid'
      )
      .orderBy('private_leagues.created_at', 'desc');

    res.json({ leagues });
  } catch (error: any) {
    console.error('Error fetching user leagues:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get league leaderboard
 * GET /api/private-leagues/:id/leaderboard
 */
router.get('/:id/leaderboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const leagueId = parseInt(req.params.id);

    const leaderboard = await db('league_members')
      .join('user_teams', 'league_members.team_id', 'user_teams.id')
      .where({ 'league_members.league_id': leagueId })
      .orderBy('user_teams.total_score', 'desc')
      .select(
        'league_members.*',
        'user_teams.team_name',
        'user_teams.total_score as team_score'
      );

    // Update ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({ leaderboard });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Distribute prizes (admin only for now)
 * POST /api/private-leagues/:id/distribute
 */
router.post('/:id/distribute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const leagueId = parseInt(req.params.id);

    const league = await db('private_leagues').where({ id: leagueId }).first();

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Only creator can distribute
    if (league.creator_id !== userId) {
      return res.status(403).json({ error: 'Only league creator can distribute prizes' });
    }

    if (league.prize_distributed) {
      return res.status(400).json({ error: 'Prizes already distributed' });
    }

    // Get top finishers
    const topFinishers = await db('league_members')
      .join('user_teams', 'league_members.team_id', 'user_teams.id')
      .where({ 'league_members.league_id': leagueId })
      .orderBy('user_teams.total_score', 'desc')
      .limit(5)
      .select('league_members.user_id', 'user_teams.total_score', 'user_teams.team_name');

    if (topFinishers.length === 0) {
      return res.status(400).json({ error: 'No participants found' });
    }

    // Calculate prize splits (15% platform fee)
    const totalPrizePool = parseFloat(league.prize_pool);
    const afterFee = totalPrizePool * 0.85;

    let prizeDistributions: Array<{ user_id: string; amount: number; rank: number }> = [];

    switch (league.prize_distribution) {
      case 'winner_takes_all':
        prizeDistributions = [
          { user_id: topFinishers[0].user_id, amount: afterFee, rank: 1 }
        ];
        break;

      case 'top_3':
        if (topFinishers.length >= 3) {
          prizeDistributions = [
            { user_id: topFinishers[0].user_id, amount: afterFee * 0.50, rank: 1 },
            { user_id: topFinishers[1].user_id, amount: afterFee * 0.30, rank: 2 },
            { user_id: topFinishers[2].user_id, amount: afterFee * 0.20, rank: 3 },
          ];
        } else {
          // Fallback to winner-takes-all if not enough participants
          prizeDistributions = [
            { user_id: topFinishers[0].user_id, amount: afterFee, rank: 1 }
          ];
        }
        break;

      case 'top_5':
        if (topFinishers.length >= 5) {
          prizeDistributions = [
            { user_id: topFinishers[0].user_id, amount: afterFee * 0.40, rank: 1 },
            { user_id: topFinishers[1].user_id, amount: afterFee * 0.25, rank: 2 },
            { user_id: topFinishers[2].user_id, amount: afterFee * 0.20, rank: 3 },
            { user_id: topFinishers[3].user_id, amount: afterFee * 0.10, rank: 4 },
            { user_id: topFinishers[4].user_id, amount: afterFee * 0.05, rank: 5 },
          ];
        } else if (topFinishers.length >= 3) {
          // Fallback to top 3
          prizeDistributions = [
            { user_id: topFinishers[0].user_id, amount: afterFee * 0.50, rank: 1 },
            { user_id: topFinishers[1].user_id, amount: afterFee * 0.30, rank: 2 },
            { user_id: topFinishers[2].user_id, amount: afterFee * 0.20, rank: 3 },
          ];
        } else {
          // Fallback to winner-takes-all
          prizeDistributions = [
            { user_id: topFinishers[0].user_id, amount: afterFee, rank: 1 }
          ];
        }
        break;
    }

    // Record distributions
    await db.transaction(async (trx) => {
      for (const prize of prizeDistributions) {
        await trx('prize_distributions').insert({
          league_id: leagueId,
          winner_id: prize.user_id,
          amount: prize.amount,
          distributed_by: userId,
        });
      }

      await trx('private_leagues')
        .where({ id: leagueId })
        .update({
          prize_distributed: true,
          status: 'completed',
          updated_at: db.fn.now(),
        });
    });

    res.json({
      success: true,
      distributions: prizeDistributions.map((p, idx) => ({
        rank: p.rank,
        user_id: p.user_id,
        team_name: topFinishers[idx].team_name,
        amount: p.amount.toFixed(6),
      })),
      platform_fee: (totalPrizePool * 0.15).toFixed(6),
    });
  } catch (error: any) {
    console.error('Error distributing prizes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
