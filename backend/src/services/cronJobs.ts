import cron from 'node-cron';
import { runFantasyScoringCycle } from './fantasyScoringService';

/**
 * Cron Job Manager for Fantasy League
 * Schedules automated scoring and maintenance tasks
 */

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  console.log('\n========================================');
  console.log('Initializing Cron Jobs');
  console.log('========================================\n');

  // 1. Fantasy Scoring - Every 5 minutes (TESTING MODE)
  // Production: '0 0 * * *' (daily at midnight UTC)
  // Alternative: '0 */6 * * *' (every 6 hours)
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n[CRON] Running Fantasy Scoring Cycle...');
    try {
      await runFantasyScoringCycle();
    } catch (error) {
      console.error('[CRON] Fantasy scoring failed:', error);
    }
  });
  console.log('✅ Fantasy Scoring: Every 5 minutes (TESTING MODE)');
  console.log('   Production schedule: Daily at 00:00 UTC');

  // 2. Database Cleanup - Daily at 3 AM UTC
  cron.schedule('0 3 * * *', async () => {
    console.log('\n[CRON] Running Database Cleanup...');
    try {
      await cleanupExpiredSessions();
      await cleanupOldScoreHistory();
    } catch (error) {
      console.error('[CRON] Database cleanup failed:', error);
    }
  });
  console.log('✅ Database Cleanup: Daily at 03:00 UTC');

  // 3. Contest Management - Daily at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    console.log('\n[CRON] Running Contest Management...');
    try {
      await checkContestEndDates();
      await createUpcomingContests();
    } catch (error) {
      console.error('[CRON] Contest management failed:', error);
    }
  });
  console.log('✅ Contest Management: Daily at 00:00 UTC');

  console.log('\n========================================');
  console.log('All Cron Jobs Initialized');
  console.log('========================================\n');
}

/**
 * Cleanup expired authentication sessions
 */
async function cleanupExpiredSessions(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    const result = await db('auth_sessions')
      .where('expires_at', '<', db.fn.now())
      .del();

    console.log(`🧹 Cleaned up ${result} expired sessions`);
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
  }
}

/**
 * Cleanup old score history (keep last 90 days)
 */
async function cleanupOldScoreHistory(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await db('influencer_scores')
      .where('score_date', '<', ninetyDaysAgo)
      .del();

    console.log(`🧹 Cleaned up ${result} old score records (>90 days)`);
  } catch (error) {
    console.error('Failed to cleanup score history:', error);
  }
}

/**
 * Check and update contest statuses based on end dates
 */
async function checkContestEndDates(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    const today = new Date().toISOString().split('T')[0];

    // End active contests that have passed their end date
    const endedCount = await db('fantasy_contests')
      .where('status', 'active')
      .where('end_date', '<', today)
      .update({
        status: 'completed',
        updated_at: db.fn.now(),
      });

    if (endedCount > 0) {
      console.log(`🏁 Ended ${endedCount} completed contest(s)`);
    }

    // Activate upcoming contests that have reached their start date
    const startedCount = await db('fantasy_contests')
      .where('status', 'upcoming')
      .where('start_date', '<=', today)
      .update({
        status: 'active',
        updated_at: db.fn.now(),
      });

    if (startedCount > 0) {
      console.log(`🚀 Activated ${startedCount} new contest(s)`);
    }
  } catch (error) {
    console.error('Failed to check contest end dates:', error);
  }
}

/**
 * Create upcoming weekly contests
 */
async function createUpcomingContests(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    // Check if we need to create a new contest for next week
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    nextWeekStart.setHours(0, 0, 0, 0);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    // Check if contest already exists for this period
    const existing = await db('fantasy_contests')
      .where('start_date', nextWeekStart.toISOString().split('T')[0])
      .first();

    if (!existing) {
      // Calculate week number
      const weekNumber = Math.ceil(
        (nextWeekStart.getTime() - new Date(nextWeekStart.getFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );

      await db('fantasy_contests').insert({
        contest_key: `week_${weekNumber}_${nextWeekStart.getFullYear()}`,
        start_date: nextWeekStart.toISOString().split('T')[0],
        end_date: nextWeekEnd.toISOString().split('T')[0],
        status: 'upcoming',
        total_participants: 0,
        max_participants: 1000,
        is_prize_league: false,
        entry_fee: 0.000,
        prize_pool: 0.000,
        prize_distribution: {
          '1': 40,
          '2': 25,
          '3': 15,
          '4': 5,
          '5': 5,
          '6-10': 2,
        },
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

      console.log(`📅 Created new upcoming contest for Week ${weekNumber}`);
    }
  } catch (error) {
    console.error('Failed to create upcoming contests:', error);
  }
}

/**
 * Get cron job status for monitoring
 */
export function getCronJobsStatus(): any[] {
  return [
    {
      name: 'Fantasy Scoring',
      schedule: 'Every 5 minutes (TEST) / Daily at 00:00 UTC (PROD)',
      cron: '*/5 * * * * (TEST) / 0 0 * * * (PROD)',
      status: 'active',
      description: 'Calculate team scores and rankings',
    },
    {
      name: 'Database Cleanup',
      schedule: 'Daily at 03:00 UTC',
      cron: '0 3 * * *',
      status: 'active',
      description: 'Remove expired sessions and old data',
    },
    {
      name: 'Contest Management',
      schedule: 'Daily at 00:00 UTC',
      cron: '0 0 * * *',
      status: 'active',
      description: 'Update contest statuses and create upcoming contests',
    },
  ];
}

/**
 * Manual trigger for fantasy scoring (for testing/admin)
 */
export async function triggerFantasyScoring(): Promise<void> {
  console.log('[MANUAL TRIGGER] Running Fantasy Scoring Cycle...');
  await runFantasyScoringCycle();
}
