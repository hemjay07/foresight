import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import db from '../utils/db';
import { triggerFantasyScoring, getCronJobsStatus } from '../services/cronJobs';

const router = Router();

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const [users, teams, leagues, influencers] = await Promise.all([
      db('users').count('* as count').first(),
      db('user_teams').count('* as count').first(),
      db('private_leagues').count('* as count').first(),
      db('influencers').where({ is_active: true }).count('* as count').first(),
    ]);

    res.json({
      success: true,
      stats: {
        users: users?.count || 0,
        teams: teams?.count || 0,
        leagues: leagues?.count || 0,
        influencers: influencers?.count || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

/**
 * @route POST /api/admin/trigger-scoring
 * @desc Manually trigger fantasy league scoring
 */
router.post('/trigger-scoring', async (req: Request, res: Response) => {
  try {
    await triggerFantasyScoring();
    res.json({
      success: true,
      message: 'Fantasy scoring cycle triggered successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scoring',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/admin/cron-status
 * @desc Get cron job status
 */
router.get('/cron-status', async (req: Request, res: Response) => {
  try {
    const jobs = getCronJobsStatus();
    res.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cron status',
    });
  }
});

export default router;
