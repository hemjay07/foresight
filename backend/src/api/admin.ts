import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import db from '../utils/db';
import { logAuditEvent } from '../utils/auditLog';
import {
  triggerFantasyScoring,
  getCronJobsStatus,
  triggerStartOfWeekSnapshot,
  triggerEndOfWeekSnapshot,
  triggerWeeklyScoring,
  getSnapshotStatus,
  triggerPrizedContestLock,
  triggerPrizedContestScoring,
  triggerContestFinalization,
  triggerPrizedContestSnapshot,
} from '../services/cronJobs';
import twitterApiService from '../services/twitterApiService';
import twitterApiIoService from '../services/twitterApiIoService';
import weeklySnapshotService from '../services/weeklySnapshotService';

const router = Router();

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.post('/trigger-scoring', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await logAuditEvent(req, 'trigger-scoring', 'system');
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
router.get('/cron-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.post('/update-metrics', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.get('/metrics-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.get('/influencer-metrics/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.get('/snapshot-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.post('/trigger-start-snapshot', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.post('/trigger-end-snapshot', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
 * @route POST /api/admin/trigger-prized-snapshot
 * @desc Take a start or end snapshot for the active prized contest.
 *       Body: { type: 'start' | 'end', contestId?: number }
 *       Runs async — returns immediately, snapshot runs in background.
 *       No auth required so it can be triggered from scripts.
 */
router.post('/trigger-prized-snapshot', async (req: Request, res: Response) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.query.key as string | undefined;
    if (adminKey && providedKey !== adminKey) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { type, contestId } = req.body || {};
    if (type !== 'start' && type !== 'end') {
      return sendError(res, 'Body must include type: "start" or "end"', 400);
    }

    // Fire and forget — snapshot takes ~6 min (62 influencers × 5.5s rate limit)
    // Return immediately so the request doesn't timeout at the proxy layer
    triggerPrizedContestSnapshot(type, contestId)
      .then(result => {
        console.log(`[SNAPSHOT] ${type.toUpperCase()} snapshot complete for contest ${result.contestId}: ${result.success} success, ${result.failed} failed`);
      })
      .catch(err => {
        console.error(`[SNAPSHOT] ${type.toUpperCase()} snapshot failed:`, err.message);
      });

    sendSuccess(res, {
      message: `${type.toUpperCase()} snapshot started — running in background (~6 min for 62 influencers)`,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger prized snapshot', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-weekly-scoring
 * @desc Manually trigger weekly scoring cycle
 */
router.post('/trigger-weekly-scoring', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.get('/weekly-deltas/:contestId', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.get('/api-fetch-logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
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
router.post('/test-twitterapi-io', authenticate, requireAdmin, async (req: Request, res: Response) => {
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

// ============================================
// PRIZED CONTEST LIFECYCLE ENDPOINTS
// ============================================

/**
 * @route GET /api/admin/contests/:id/raw
 * @desc Get raw DB row for a prized contest (ADMIN ONLY)
 */
router.get('/contests/:id/raw', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const contestId = parseInt(req.params.id);
    if (isNaN(contestId)) {
      return sendError(res, 'Invalid contest ID', 400);
    }

    const contest = await db('prized_contests').where('id', contestId).first();
    if (!contest) {
      return sendError(res, 'Contest not found', 404);
    }

    // Also fetch entries
    const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';
    const entries = await db(entriesTable).where('contest_id', contestId).select('*');

    sendSuccess(res, { contest, entries, entriesTable });
  } catch (error: any) {
    sendError(res, 'Failed to get contest details', 500, error.message);
  }
});

/**
 * @route PATCH /api/admin/contests/:id
 * @desc Update prized contest settings for testing (ADMIN ONLY)
 *       Allows changing lock_time, end_time, min_players, status, etc.
 */
router.patch('/contests/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const contestId = parseInt(req.params.id);
    if (isNaN(contestId)) {
      return sendError(res, 'Invalid contest ID', 400);
    }

    const contest = await db('prized_contests').where('id', contestId).first();
    if (!contest) {
      return sendError(res, 'Contest not found', 404);
    }

    const allowedFields = [
      'min_players', 'max_players', 'lock_time', 'end_time',
      'status', 'prize_pool', 'distributable_pool', 'name', 'description',
    ];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No valid fields to update', 400);
    }

    updates.updated_at = new Date();

    // FINDING-029: Audit log for contest modifications
    await logAuditEvent(req, 'update-contest', 'contest', String(contestId), { updates });

    await db('prized_contests').where('id', contestId).update(updates);

    const updated = await db('prized_contests').where('id', contestId).first();
    sendSuccess(res, {
      message: `Contest ${contestId} updated`,
      contest: updated,
    });
  } catch (error: any) {
    sendError(res, 'Failed to update contest', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-prized-lock
 * @desc Manually lock prized contests past their lock_time (ADMIN ONLY)
 */
router.post('/trigger-prized-lock', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await logAuditEvent(req, 'trigger-prized-lock', 'system');
    const result = await triggerPrizedContestLock();
    sendSuccess(res, {
      message: 'Prized contest lock check completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger prized contest lock', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-prized-scoring
 * @desc Manually score locked prized contests past their end_time (ADMIN ONLY)
 */
router.post('/trigger-prized-scoring', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await logAuditEvent(req, 'trigger-prized-scoring', 'system');
    const result = await triggerPrizedContestScoring();
    sendSuccess(res, {
      message: 'Prized contest scoring completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger prized contest scoring', 500, error.message);
  }
});

/**
 * @route POST /api/admin/trigger-contest-finalization
 * @desc Manually finalize ended fantasy contests and trigger quest achievements (ADMIN ONLY)
 */
router.post('/trigger-contest-finalization', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await logAuditEvent(req, 'trigger-contest-finalization', 'system');
    const result = await triggerContestFinalization();
    sendSuccess(res, {
      message: 'Contest finalization completed',
      result,
    });
  } catch (error: any) {
    sendError(res, 'Failed to trigger contest finalization', 500, error.message);
  }
});

/**
 * Shared logic: ensure FREE_LEAGUE contest type + demo contest exist.
 * Returns { created: boolean, contest: object }
 */
export async function ensureDemoContest(): Promise<{ created: boolean; contest: Record<string, unknown> }> {
  // 1. Ensure FREE_LEAGUE contest type exists
  let contestType = await db('contest_types').where('code', 'FREE_LEAGUE').first();
  if (!contestType) {
    await db('contest_types').insert({
      code: 'FREE_LEAGUE',
      name: 'Free League',
      description: 'Practice mode - no entry fee, real prizes funded by platform',
      entry_fee: 0,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 0,
      min_players: 10,
      max_players: 0,
      winners_percent: 10,
      is_free: true,
      display_order: 1,
    });
    contestType = await db('contest_types').where('code', 'FREE_LEAGUE').first();
  }

  // 2. Return early if active contest already exists
  const activeContest = await db('prized_contests')
    .where('name', '🎯 CT Draft — Free League')
    .whereIn('status', ['open', 'locked', 'scoring'])
    .first();

  if (activeContest) {
    return { created: false, contest: activeContest };
  }

  // 3. Compute lock_time (next Monday 12:00 UTC) and end_time
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const lockTime = new Date(now);
  lockTime.setUTCDate(now.getUTCDate() + daysUntilMonday);
  lockTime.setUTCHours(12, 0, 0, 0);
  const endTime = new Date(lockTime.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);

  const [contest] = await db('prized_contests').insert({
    contest_type_id: contestType.id,
    contract_contest_id: null,
    contract_address: null,
    name: '🎯 CT Draft — Free League',
    description: 'Draft 5 CT influencers and compete for prizes. Free to enter!',
    entry_fee: '0',
    team_size: contestType.team_size || 5,
    has_captain: contestType.has_captain ?? true,
    is_free: true,
    rake_percent: '0',
    min_players: contestType.min_players || 2,
    max_players: contestType.max_players || 0,
    lock_time: lockTime,
    end_time: endTime,
    status: 'open',
    prize_pool: '0.05',
    distributable_pool: '0.05',
    player_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning('*');

  return { created: true, contest };
}

/**
 * @route GET /api/admin/ensure-contest
 * @desc Public endpoint — creates demo contest if none exists. Safe to call from browser.
 */
router.get('/ensure-contest', async (_req: Request, res: Response) => {
  try {
    const result = await ensureDemoContest();
    sendSuccess(res, {
      message: result.created ? 'Demo contest created' : 'Demo contest already active',
      contest: { id: result.contest.id, status: result.contest.status },
    });
  } catch (error: any) {
    sendError(res, 'Failed to ensure contest', 500, error.message);
  }
});

/**
 * @route POST /api/admin/seed-demo-contest
 * @desc Create the FREE_LEAGUE demo contest if one doesn't exist.
 *       No auth required so it can be called from the frontend.
 *       Optionally protected by ADMIN_KEY env var (?key= query param).
 */
router.post('/seed-demo-contest', async (req: Request, res: Response) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.query.key as string | undefined;
    if (adminKey && providedKey !== adminKey) {
      return sendError(res, 'Unauthorized', 401);
    }
    const result = await ensureDemoContest();
    sendSuccess(res, {
      message: result.created ? 'Demo contest created' : 'Demo contest already active',
      contest: { id: result.contest.id, status: result.contest.status },
    });
  } catch (error: any) {
    sendError(res, 'Failed to seed demo contest', 500, error.message);
  }
});

// ─── Launch Campaign Contest ──────────────────────────────────────────────────

/**
 * Create the single hero launch contest:
 * "The Call" — FREE, 72h, 500 cap, $100 USD prize pool ($50/$30/$20)
 *
 * Prizes are paid out-of-band (real USD/SOL on mainnet). The prize_pool
 * field stores 100 as a display value; the description makes it clear.
 */
async function seedLaunchContest(): Promise<{ created: boolean; contest: Record<string, unknown> }> {
  // Ensure FREE_LEAGUE type exists
  let freeType = await db('contest_types').where('code', 'FREE_LEAGUE').first();
  if (!freeType) {
    await db('contest_types').insert({
      code: 'FREE_LEAGUE',
      name: 'Free League',
      description: 'Practice mode - no entry fee, real prizes funded by platform',
      entry_fee: 0,
      team_size: 5,
      has_captain: true,
      duration_hours: 168,
      rake_percent: 0,
      min_players: 10,
      max_players: 0,
      winners_percent: 10,
      is_free: true,
      display_order: 1,
    });
    freeType = await db('contest_types').where('code', 'FREE_LEAGUE').first();
  }

  const contestName = 'The Call';

  // Idempotent — skip if already active
  const existing = await db('prized_contests')
    .where('name', contestName)
    .whereIn('status', ['open', 'locked', 'scoring'])
    .first();

  if (existing) {
    return { created: false, contest: existing };
  }

  const now = new Date();
  // Entries lock after 48h, contest ends at 72h
  const lockTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const [contest] = await db('prized_contests').insert({
    contest_type_id: freeType.id,
    contract_contest_id: null,
    contract_address: null,
    name: contestName,
    description: 'Draft 5 CT influencers. Captain gets 2x. $100 in prizes: $50 / $30 / $20 to top 3. Free entry. This is your call.',
    entry_fee: '0',
    team_size: 5,
    has_captain: true,
    is_free: true,
    rake_percent: '0',
    min_players: 2,
    max_players: 500,
    lock_time: lockTime,
    end_time: endTime,
    status: 'open',
    prize_pool: '100',
    distributable_pool: '100',
    player_count: 0,
    created_at: now,
    updated_at: now,
  }).returning('*');

  return { created: true, contest };
}

/**
 * @route POST /api/admin/seed-launch-contest
 * @desc Create the hero launch contest. Idempotent — skips if already active.
 *       Optionally protected by ADMIN_KEY env var (?key= query param).
 */
router.post('/seed-launch-contest', async (req: Request, res: Response) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.query.key as string | undefined;
    if (adminKey && providedKey !== adminKey) {
      return sendError(res, 'Unauthorized', 401);
    }
    const result = await seedLaunchContest();
    sendSuccess(res, {
      message: result.created ? 'Launch contest "The Call" created' : 'Launch contest already active',
      contest: { id: result.contest.id, name: result.contest.name, status: result.contest.status },
    });
  } catch (error: any) {
    sendError(res, 'Failed to seed launch contest', 500, error.message);
  }
});

/**
 * @route POST /api/admin/cleanup-contests
 * @desc Cancel all active contests EXCEPT "The Call".
 *       For launch week — only the hero contest should be visible.
 */
router.post('/cleanup-contests', async (req: Request, res: Response) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.query.key as string | undefined;
    if (adminKey && providedKey !== adminKey) {
      return sendError(res, 'Unauthorized', 401);
    }

    const keepName = 'The Call';

    // Find all active contests that aren't "The Call"
    const toCancel = await db('prized_contests')
      .whereIn('status', ['open', 'locked', 'scoring'])
      .whereNot('name', keepName)
      .select('id', 'name', 'status');

    if (toCancel.length === 0) {
      return sendSuccess(res, { message: 'No contests to clean up', cancelled: [] });
    }

    // Cancel them all
    const ids = toCancel.map((c: { id: number }) => c.id);
    await db('prized_contests')
      .whereIn('id', ids)
      .update({ status: 'cancelled', updated_at: new Date() });

    sendSuccess(res, {
      message: `Cancelled ${toCancel.length} contest(s), kept "${keepName}"`,
      cancelled: toCancel.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })),
    });
  } catch (error: any) {
    sendError(res, 'Failed to clean up contests', 500, error.message);
  }
});

export default router;
