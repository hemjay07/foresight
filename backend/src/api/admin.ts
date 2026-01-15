import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import db from '../utils/db';
import {
  triggerFantasyScoring,
  getCronJobsStatus,
  triggerStartOfWeekSnapshot,
  triggerEndOfWeekSnapshot,
  triggerWeeklyScoring,
  getSnapshotStatus,
} from '../services/cronJobs';
import twitterApiService from '../services/twitterApiService';
import twitterApiIoService from '../services/twitterApiIoService';
import weeklySnapshotService from '../services/weeklySnapshotService';

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

    sendSuccess(res, {
      stats: {
        users: users?.count || 0,
        teams: teams?.count || 0,
        leagues: leagues?.count || 0,
        influencers: influencers?.count || 0,
      },
    });
  } catch (error: any) {
    sendError(res, 'Failed to get stats', 500);
  }
});

/**
 * @route POST /api/admin/trigger-scoring
 * @desc Manually trigger fantasy league scoring (ADMIN ONLY)
 */
router.post('/trigger-scoring', authenticate, async (req: Request, res: Response) => {
  try {
    await triggerFantasyScoring();
    sendSuccess(res, {
      message: 'Fantasy scoring cycle triggered successfully',
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger scoring', 500, error.message);
  }
});

/**
 * @route GET /api/admin/cron-status
 * @desc Get cron job status (ADMIN ONLY)
 */
router.get('/cron-status', authenticate, async (req: Request, res: Response) => {
  try {
    const jobs = getCronJobsStatus();
    sendSuccess(res, { jobs });
  } catch (error: any) {
    sendError(res, 'Failed to get cron status', 500);
  }
});

/**
 * @route POST /api/admin/update-metrics
 * @desc Manually trigger influencer metrics update (ADMIN ONLY)
 */
router.post('/update-metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.body;

    if (!twitterApiService.isConfigured()) {
      return sendError(res, 'Twitter API not configured. Set TWITTER_BEARER_TOKEN in .env', 400);
    }

    await twitterApiService.batchUpdateInfluencers(limit);

    sendSuccess(res, {
      message: `Updated metrics for ${limit} influencers`,
    });
  } catch (error: any) {
    sendError(res, 'Failed to update metrics', 500, error.message);
  }
});

/**
 * @route GET /api/admin/metrics-status
 * @desc Get Twitter API configuration status and usage info
 */
router.get('/metrics-status', authenticate, async (req: Request, res: Response) => {
  try {
    const isConfigured = twitterApiService.isConfigured();
    const rateLimitInfo = twitterApiService.getRateLimitInfo();

    // Get last update time
    const lastUpdate = await db('influencers')
      .max('last_scraped_at as last_update')
      .first();

    // Get total influencers tracked
    const totalInfluencers = await db('influencers')
      .where({ is_active: true })
      .count('* as count')
      .first();

    // Get metrics from last 24 hours
    const recentMetrics = await db('influencer_metrics')
      .where('scraped_at', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
      .count('* as count')
      .first();

    sendSuccess(res, {
      status: {
        apiConfigured: isConfigured,
        rateLimitInfo,
        lastUpdate: lastUpdate?.last_update,
        totalInfluencers: totalInfluencers?.count || 0,
        metricsLast24h: recentMetrics?.count || 0,
      },
    });
  } catch (error: any) {
    sendError(res, 'Failed to get metrics status', 500);
  }
});

/**
 * @route GET /api/admin/influencer-metrics/:id
 * @desc Get metrics history for an influencer (ADMIN ONLY)
 */
router.get('/influencer-metrics/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const metrics = await db('influencer_metrics')
      .where('influencer_id', id)
      .where('scraped_at', '>=', cutoffDate)
      .orderBy('scraped_at', 'asc');

    sendSuccess(res, { metrics });
  } catch (error: any) {
    sendError(res, 'Failed to get influencer metrics', 500);
  }
});

// ============================================
// WEEKLY SNAPSHOT ENDPOINTS (TwitterAPI.io)
// ============================================

/**
 * @route GET /api/admin/snapshot-status
 * @desc Get weekly snapshot status for current contest
 */
router.get('/snapshot-status', authenticate, async (req: Request, res: Response) => {
  try {
    const { contestId, status } = await getSnapshotStatus();

    // Also check if TwitterAPI.io is configured
    const apiConfigured = twitterApiIoService.isConfigured();

    sendSuccess(res, {
      contestId,
      apiConfigured,
      status,
    });
  } catch (error: any) {
    sendError(res, 'Failed to get snapshot status', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-start-snapshot
 * @desc Manually trigger start-of-week snapshot capture
 */
router.post('/trigger-start-snapshot', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await triggerStartOfWeekSnapshot();

    sendSuccess(res, {
      message: 'Start-of-week snapshot capture completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger start snapshot', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-end-snapshot
 * @desc Manually trigger end-of-week snapshot capture
 */
router.post('/trigger-end-snapshot', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await triggerEndOfWeekSnapshot();

    sendSuccess(res, {
      message: 'End-of-week snapshot capture completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger end snapshot', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-weekly-scoring
 * @desc Manually trigger weekly scoring cycle
 */
router.post('/trigger-weekly-scoring', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await triggerWeeklyScoring();

    sendSuccess(res, {
      message: 'Weekly scoring cycle completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger weekly scoring', 500, error.message);
  }
});

/**
 * @route GET /api/admin/weekly-deltas/:contestId
 * @desc Get weekly delta calculations for a contest (preview before scoring)
 */
router.get('/weekly-deltas/:contestId', authenticate, async (req: Request, res: Response) => {
  try {
    const contestId = parseInt(req.params.contestId);

    if (isNaN(contestId)) {
      return sendError(res, 'Invalid contest ID', 400);
    }

    const deltas = await weeklySnapshotService.calculateWeeklyDeltas(contestId);

    // Sort by engagement (most active influencers first)
    deltas.sort((a, b) => b.avgEngagementPerTweet - a.avgEngagementPerTweet);

    sendSuccess(res, {
      contestId,
      totalInfluencers: deltas.length,
      completeData: deltas.filter(d => d.isComplete).length,
      deltas,
    });
  } catch (error: any) {
    sendError(res, 'Failed to calculate weekly deltas', 500, error.message);
  }
});

/**
 * @route GET /api/admin/api-fetch-logs
 * @desc Get recent API fetch logs for monitoring/debugging
 */
router.get('/api-fetch-logs', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = 100, success } = req.query;

    let query = db('api_fetch_logs')
      .orderBy('created_at', 'desc')
      .limit(Number(limit));

    if (success !== undefined) {
      query = query.where('success', success === 'true');
    }

    const logs = await query;

    // Also get summary stats
    const stats = await db('api_fetch_logs')
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful'),
        db.raw('SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed'),
        db.raw('SUM(estimated_credits) as total_credits')
      )
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .first();

    sendSuccess(res, {
      stats: {
        last7Days: stats,
      },
      logs,
    });
  } catch (error: any) {
    sendError(res, 'Failed to get API fetch logs', 500, error.message);
  }
});

/**
 * @route POST /api/admin/test-twitterapi-io
 * @desc Test TwitterAPI.io connection with a single handle
 */
router.post('/test-twitterapi-io', authenticate, async (req: Request, res: Response) => {
  try {
    const { handle = 'VitalikButerin' } = req.body;

    if (!twitterApiIoService.isConfigured()) {
      return sendError(res, 'TwitterAPI.io not configured. Set TWITTER_API_IO_KEY in .env', 400);
    }

    // Fetch profile
    const profileResult = await twitterApiIoService.getUserProfile(handle);

    if (!profileResult.success || !profileResult.data) {
      return sendError(res, 'Failed to fetch profile', 400, profileResult.error);
    }

    // Fetch recent tweets
    const tweetsResult = await twitterApiIoService.getUserTweets(handle, 5);

    sendSuccess(res, {
      handle,
      profile: profileResult.data,
      tweets: tweetsResult.data || [],
      apiCalls: 2,
    });
  } catch (error: any) {
    sendError(res, 'Failed to test TwitterAPI.io', 500, error.message);
  }
});

export default router;
