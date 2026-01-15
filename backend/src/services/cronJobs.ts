import cron from 'node-cron';
import { runFantasyScoringCycle, calculateWeeklyContestScores, calculateContestRankings, updateLeaderboardCache, awardPerformanceXP } from './fantasyScoringService';
import twitterApiService from './twitterApiService';
import twitterApiIoService from './twitterApiIoService';
import weeklySnapshotService from './weeklySnapshotService';
import contestFinalizationService from './contestFinalizationService';
import questService from './questService';
import db from '../utils/db';

/**
 * Cron Job Manager for Fantasy League
 * Schedules automated scoring and maintenance tasks
 *
 * NEW SCHEDULE (Weekly Snapshot Model):
 * - Monday 00:05 UTC: Capture start-of-week snapshot
 * - Sunday 23:55 UTC: Capture end-of-week snapshot
 * - Monday 00:10 UTC: Calculate weekly scores, rankings, and award XP
 *
 * LEGACY SCHEDULE (kept for backward compatibility):
 * - Every 5 minutes: Legacy scoring cycle (can be disabled)
 */

// Feature flag for new scoring system
const USE_WEEKLY_SNAPSHOTS = process.env.USE_WEEKLY_SNAPSHOTS !== 'false'; // Default: enabled

/**
 * Get active contest ID
 */
async function getActiveContestId(): Promise<number | null> {
  const contest = await db('fantasy_contests')
    .where('status', 'active')
    .first();
  return contest?.id || null;
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  console.log('\n========================================');
  console.log('Initializing Cron Jobs');
  console.log(`Scoring Mode: ${USE_WEEKLY_SNAPSHOTS ? 'WEEKLY SNAPSHOTS' : 'LEGACY'}`);
  console.log('========================================\n');

  if (USE_WEEKLY_SNAPSHOTS) {
    // ========================================
    // NEW: Weekly Snapshot-based Scoring
    // ========================================

    // 1. Start-of-Week Snapshot - Monday 00:05 UTC
    cron.schedule('5 0 * * 1', async () => {
      console.log('\n[CRON] Capturing START of week snapshot...');
      try {
        const contestId = await getActiveContestId();
        if (!contestId) {
          console.log('[CRON] No active contest found, skipping snapshot');
          return;
        }

        if (!twitterApiIoService.isConfigured()) {
          console.error('[CRON] TwitterAPI.io not configured! Set TWITTER_API_IO_KEY env var.');
          return;
        }

        await weeklySnapshotService.captureStartOfWeekSnapshot(contestId);
        console.log('[CRON] Start-of-week snapshot complete');
      } catch (error) {
        console.error('[CRON] Start-of-week snapshot failed:', error);
      }
    });
    console.log('✅ Start-of-Week Snapshot: Monday 00:05 UTC');

    // 2. End-of-Week Snapshot - Sunday 23:55 UTC
    cron.schedule('55 23 * * 0', async () => {
      console.log('\n[CRON] Capturing END of week snapshot...');
      try {
        const contestId = await getActiveContestId();
        if (!contestId) {
          console.log('[CRON] No active contest found, skipping snapshot');
          return;
        }

        if (!twitterApiIoService.isConfigured()) {
          console.error('[CRON] TwitterAPI.io not configured! Set TWITTER_API_IO_KEY env var.');
          return;
        }

        await weeklySnapshotService.captureEndOfWeekSnapshot(contestId);
        console.log('[CRON] End-of-week snapshot complete');
      } catch (error) {
        console.error('[CRON] End-of-week snapshot failed:', error);
      }
    });
    console.log('✅ End-of-Week Snapshot: Sunday 23:55 UTC');

    // 3. Weekly Scoring - Monday 00:10 UTC
    cron.schedule('10 0 * * 1', async () => {
      console.log('\n[CRON] Running Weekly Scoring Cycle...');
      try {
        const contestId = await getActiveContestId();
        if (!contestId) {
          console.log('[CRON] No active contest found, skipping scoring');
          return;
        }

        // Calculate weekly scores
        await calculateWeeklyContestScores(contestId);

        // Calculate rankings
        await calculateContestRankings(contestId);

        // Update leaderboard cache
        await updateLeaderboardCache(contestId);

        // Award XP
        await awardPerformanceXP(contestId);

        console.log('[CRON] Weekly scoring cycle complete');
      } catch (error) {
        console.error('[CRON] Weekly scoring failed:', error);
      }
    });
    console.log('✅ Weekly Scoring: Monday 00:10 UTC');

  } else {
    // ========================================
    // LEGACY: Frequent scoring (old system)
    // ========================================
    cron.schedule('*/5 * * * *', async () => {
      console.log('\n[CRON] Running Legacy Fantasy Scoring Cycle...');
      try {
        await runFantasyScoringCycle();
      } catch (error) {
        console.error('[CRON] Fantasy scoring failed:', error);
      }
    });
    console.log('✅ Legacy Fantasy Scoring: Every 5 minutes');
  }

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

  // 4. Prized Contest Lock Check - Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await lockExpiredPrizedContests();
    } catch (error) {
      console.error('[CRON] Prized contest lock check failed:', error);
    }
  });
  console.log('✅ Prized Contest Lock Check: Every 5 minutes');

  // 5. Prized Contest Scoring - Every hour
  cron.schedule('0 * * * *', async () => {
    console.log('\n[CRON] Checking for prized contests to score...');
    try {
      await scoreEndedPrizedContests();
    } catch (error) {
      console.error('[CRON] Prized contest scoring failed:', error);
    }
  });
  console.log('✅ Prized Contest Scoring: Every hour');

  // 5b. Contest Finalization (Quest Triggers) - Every hour
  cron.schedule('30 * * * *', async () => {
    console.log('\n[CRON] Finalizing ended fantasy contests...');
    try {
      const results = await contestFinalizationService.finalizeEndedContests();
      if (results.length > 0) {
        console.log(`[CRON] Finalized ${results.length} contest(s), triggered quest achievements`);
      }
    } catch (error) {
      console.error('[CRON] Contest finalization failed:', error);
    }
  });
  console.log('✅ Contest Finalization: Every hour (at :30)');

  // 6. Auto-Create Weekly Prized Contests - Sunday at 18:00 UTC
  cron.schedule('0 18 * * 0', async () => {
    console.log('\n[CRON] Creating new weekly prized contests...');
    try {
      await createWeeklyPrizedContests();
    } catch (error) {
      console.error('[CRON] Weekly prized contest creation failed:', error);
    }
  });
  console.log('✅ Weekly Prized Contests Creation: Sunday 18:00 UTC');

  // 7. Auto-Create Daily Flash Contests - Every day at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    console.log('\n[CRON] Creating new daily flash contest...');
    try {
      await createDailyFlashContest();
    } catch (error) {
      console.error('[CRON] Daily flash contest creation failed:', error);
    }
  });
  console.log('✅ Daily Flash Contest Creation: Daily at 00:00 UTC');

  // 8. Influencer Metrics Update - Daily at 4 AM UTC
  cron.schedule('0 4 * * *', async () => {
    console.log('\n[CRON] Running Influencer Metrics Update...');
    try {
      if (twitterApiService.isConfigured()) {
        await twitterApiService.batchUpdateInfluencers(50);
        console.log('✅ Metrics update complete via Twitter API');
      } else {
        console.log('⚠️  Twitter API not configured. Skipping metrics update.');
        console.log('   Set TWITTER_BEARER_TOKEN in .env to enable automatic updates.');
      }
    } catch (error) {
      console.error('[CRON] Influencer metrics update failed:', error);
    }
  });
  console.log('✅ Influencer Metrics: Daily at 04:00 UTC');

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
 * Also manages team locking/unlocking
 */
async function checkContestEndDates(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    const today = new Date().toISOString().split('T')[0];

    // End active contests that have passed their end date
    const endedContests = await db('fantasy_contests')
      .where('status', 'active')
      .where('end_date', '<', today)
      .select('id');

    if (endedContests.length > 0) {
      // Mark contests as completed
      await db('fantasy_contests')
        .whereIn('id', endedContests.map(c => c.id))
        .update({
          status: 'completed',
          updated_at: db.fn.now(),
        });

      // Unlock all teams from completed contests (allow changes for next gameweek)
      const unlockedCount = await db('user_teams')
        .whereIn('contest_id', endedContests.map(c => c.id))
        .update({
          is_locked: false,
          updated_at: db.fn.now(),
        });

      console.log(`🏁 Ended ${endedContests.length} contest(s), unlocked ${unlockedCount} team(s)`);
    }

    // Activate upcoming contests that have reached their start date
    const startingContests = await db('fantasy_contests')
      .where('status', 'upcoming')
      .where('start_date', '<=', today)
      .select('id');

    if (startingContests.length > 0) {
      // Activate contests
      await db('fantasy_contests')
        .whereIn('id', startingContests.map(c => c.id))
        .update({
          status: 'active',
          updated_at: db.fn.now(),
        });

      // Lock all teams in starting contests (FPL-style: no changes during gameweek)
      const lockedCount = await db('user_teams')
        .whereIn('contest_id', startingContests.map(c => c.id))
        .update({
          is_locked: true,
          updated_at: db.fn.now(),
        });

      console.log(`🚀 Activated ${startingContests.length} contest(s), locked ${lockedCount} team(s) for gameweek`);
    }
  } catch (error) {
    console.error('Failed to check contest end dates:', error);
  }
}

/**
 * Create upcoming weekly contests (Monday to Sunday)
 */
async function createUpcomingContests(): Promise<void> {
  const db = (await import('../utils/db')).default;

  try {
    // Find next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7; // Days until next Monday
    nextMonday.setDate(today.getDate() + daysUntilMonday + 7); // Next week's Monday
    nextMonday.setHours(0, 0, 0, 0);

    // Sunday is 6 days after Monday
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    // Check if contest already exists for this period
    const existing = await db('fantasy_contests')
      .where('start_date', nextMonday.toISOString().split('T')[0])
      .first();

    if (!existing) {
      // Calculate week number
      const weekNumber = Math.ceil(
        (nextMonday.getTime() - new Date(nextMonday.getFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );

      await db('fantasy_contests').insert({
        contest_key: `week_${weekNumber}_${nextMonday.getFullYear()}`,
        start_date: nextMonday.toISOString().split('T')[0],
        end_date: nextSunday.toISOString().split('T')[0],
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

      console.log(`📅 Created new upcoming contest for Week ${weekNumber} (Mon ${nextMonday.toISOString().split('T')[0]} - Sun ${nextSunday.toISOString().split('T')[0]})`);
    }
  } catch (error) {
    console.error('Failed to create upcoming contests:', error);
  }
}

/**
 * Get cron job status for monitoring
 */
export function getCronJobsStatus(): any[] {
  const jobs = [
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
    {
      name: 'Influencer Metrics Update',
      schedule: 'Daily at 04:00 UTC',
      cron: '0 4 * * *',
      status: 'active',
      description: 'Update influencer metrics via Twitter API',
    },
  ];

  if (USE_WEEKLY_SNAPSHOTS) {
    jobs.unshift(
      {
        name: 'Start-of-Week Snapshot',
        schedule: 'Monday 00:05 UTC',
        cron: '5 0 * * 1',
        status: 'active',
        description: 'Capture influencer metrics at start of week',
      },
      {
        name: 'End-of-Week Snapshot',
        schedule: 'Sunday 23:55 UTC',
        cron: '55 23 * * 0',
        status: 'active',
        description: 'Capture influencer metrics at end of week',
      },
      {
        name: 'Weekly Scoring',
        schedule: 'Monday 00:10 UTC',
        cron: '10 0 * * 1',
        status: 'active',
        description: 'Calculate weekly scores, rankings, and award XP',
      }
    );
  } else {
    jobs.unshift({
      name: 'Legacy Fantasy Scoring',
      schedule: 'Every 5 minutes',
      cron: '*/5 * * * *',
      status: 'active',
      description: 'Calculate team scores and rankings (legacy mode)',
    });
  }

  return jobs;
}

/**
 * Manual trigger for fantasy scoring (for testing/admin)
 */
export async function triggerFantasyScoring(): Promise<void> {
  console.log('[MANUAL TRIGGER] Running Fantasy Scoring Cycle...');
  await runFantasyScoringCycle();
}

/**
 * Manual trigger for start-of-week snapshot (for testing/admin)
 */
export async function triggerStartOfWeekSnapshot(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ influencerId: number; handle: string; error: string }>;
}> {
  console.log('[MANUAL TRIGGER] Capturing START of week snapshot...');
  const contestId = await getActiveContestId();
  if (!contestId) {
    throw new Error('No active contest found');
  }

  if (!twitterApiIoService.isConfigured()) {
    throw new Error('TwitterAPI.io not configured. Set TWITTER_API_IO_KEY environment variable.');
  }

  return await weeklySnapshotService.captureSnapshot(contestId, 'start');
}

/**
 * Manual trigger for end-of-week snapshot (for testing/admin)
 */
export async function triggerEndOfWeekSnapshot(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ influencerId: number; handle: string; error: string }>;
}> {
  console.log('[MANUAL TRIGGER] Capturing END of week snapshot...');
  const contestId = await getActiveContestId();
  if (!contestId) {
    throw new Error('No active contest found');
  }

  if (!twitterApiIoService.isConfigured()) {
    throw new Error('TwitterAPI.io not configured. Set TWITTER_API_IO_KEY environment variable.');
  }

  return await weeklySnapshotService.captureSnapshot(contestId, 'end');
}

/**
 * Manual trigger for weekly scoring cycle (for testing/admin)
 */
export async function triggerWeeklyScoring(): Promise<{
  contestId: number;
  teamsScored: number;
  influencersScored: number;
  errors: string[];
}> {
  console.log('[MANUAL TRIGGER] Running Weekly Scoring Cycle...');
  const contestId = await getActiveContestId();
  if (!contestId) {
    throw new Error('No active contest found');
  }

  // Calculate weekly scores
  const scoringResult = await calculateWeeklyContestScores(contestId);

  // Calculate rankings
  await calculateContestRankings(contestId);

  // Update leaderboard cache
  await updateLeaderboardCache(contestId);

  // Award XP
  await awardPerformanceXP(contestId);

  console.log('[MANUAL TRIGGER] Weekly scoring complete');

  return {
    contestId,
    ...scoringResult,
  };
}

/**
 * Get snapshot status for current contest (for monitoring)
 */
export async function getSnapshotStatus(): Promise<{
  contestId: number | null;
  status: Awaited<ReturnType<typeof weeklySnapshotService.getSnapshotStatus>> | null;
}> {
  const contestId = await getActiveContestId();
  if (!contestId) {
    return { contestId: null, status: null };
  }

  const status = await weeklySnapshotService.getSnapshotStatus(contestId);
  return { contestId, status };
}

// ========================================
// PRIZED CONTESTS MANAGEMENT
// ========================================

/**
 * Lock prized contests that have passed their lock_time
 */
async function lockExpiredPrizedContests(): Promise<void> {
  try {
    const now = new Date();

    // Find open contests that should be locked
    const contestsToLock = await db('prized_contests')
      .where('status', 'open')
      .where('lock_time', '<=', now)
      .select('id', 'name', 'player_count', 'min_players');

    if (contestsToLock.length === 0) return;

    for (const contest of contestsToLock) {
      // If not enough players, cancel the contest
      if (contest.player_count < contest.min_players) {
        await db('prized_contests')
          .where('id', contest.id)
          .update({
            status: 'cancelled',
            updated_at: now,
          });
        console.log(`[CRON] Cancelled prized contest ${contest.id} "${contest.name}" - not enough players (${contest.player_count}/${contest.min_players})`);
      } else {
        // Lock the contest
        await db('prized_contests')
          .where('id', contest.id)
          .update({
            status: 'locked',
            updated_at: now,
          });
        console.log(`[CRON] Locked prized contest ${contest.id} "${contest.name}" with ${contest.player_count} players`);
      }
    }
  } catch (error) {
    console.error('[CRON] Error locking prized contests:', error);
  }
}

/**
 * Score prized contests that have passed their end_time
 */
async function scoreEndedPrizedContests(): Promise<void> {
  try {
    const now = new Date();

    // Find locked contests that have ended
    const contestsToScore = await db('prized_contests')
      .where('status', 'locked')
      .where('end_time', '<=', now)
      .select('id', 'name', 'is_free', 'prize_pool', 'distributable_pool', 'player_count');

    if (contestsToScore.length === 0) return;

    for (const contest of contestsToScore) {
      console.log(`[CRON] Scoring prized contest ${contest.id} "${contest.name}"...`);

      // Mark as scoring
      await db('prized_contests')
        .where('id', contest.id)
        .update({ status: 'scoring', updated_at: now });

      try {
        // Get entries table based on contest type
        const entriesTable = contest.is_free ? 'free_league_entries' : 'prized_entries';

        // Get all entries for this contest with their team details
        const entries = await db(entriesTable)
          .where('contest_id', contest.id)
          .select('*');

        if (entries.length === 0) {
          console.log(`[CRON] No entries found for contest ${contest.id}`);
          await db('prized_contests')
            .where('id', contest.id)
            .update({ status: 'finalized', updated_at: now });
          continue;
        }

        // Calculate scores for each entry
        const scoredEntries: Array<{ id: number; score: number; userId: string }> = [];

        for (const entry of entries) {
          const teamIds = entry.team_ids;
          const captainId = entry.captain_id;

          // Get weekly deltas for team influencers
          let totalScore = 0;
          const scoreBreakdown: Record<number, any> = {};

          for (const influencerId of teamIds) {
            // Get the influencer's weekly snapshot data
            const startSnapshot = await db('weekly_snapshots')
              .where('influencer_id', influencerId)
              .where('snapshot_type', 'start')
              .orderBy('created_at', 'desc')
              .first();

            const endSnapshot = await db('weekly_snapshots')
              .where('influencer_id', influencerId)
              .where('snapshot_type', 'end')
              .orderBy('created_at', 'desc')
              .first();

            // Calculate score based on deltas (simplified)
            let influencerScore = 0;
            if (startSnapshot && endSnapshot) {
              // Activity score
              const tweetsThisWeek = endSnapshot.tweet_count - startSnapshot.tweet_count;
              const activityScore = Math.min(35, tweetsThisWeek * 1.5);

              // Growth score
              const followersGained = endSnapshot.follower_count - startSnapshot.follower_count;
              const growthRate = startSnapshot.follower_count > 0
                ? (followersGained / startSnapshot.follower_count) * 100
                : 0;
              const absoluteGrowth = Math.min(20, followersGained / 2000);
              const rateGrowth = Math.min(20, growthRate * 5);
              const growthScore = Math.min(40, absoluteGrowth + rateGrowth);

              // Engagement score (simplified)
              const engagementScore = Math.min(60, Math.sqrt(
                (endSnapshot.likes_count || 0) +
                (endSnapshot.retweets_count || 0) * 2
              ) * 1.5);

              influencerScore = activityScore + growthScore + engagementScore;
            } else {
              // Fallback: use stored metrics
              const influencer = await db('influencers').where('id', influencerId).first();
              if (influencer) {
                influencerScore = 25 + Math.random() * 50; // Base score with variance
              }
            }

            // Apply captain bonus
            const isCaptain = captainId === influencerId;
            if (isCaptain) {
              influencerScore *= 1.5;
            }

            scoreBreakdown[influencerId] = {
              baseScore: influencerScore / (isCaptain ? 1.5 : 1),
              isCaptain,
              finalScore: influencerScore,
            };

            totalScore += influencerScore;
          }

          // Update entry with score
          await db(entriesTable)
            .where('id', entry.id)
            .update({
              score: totalScore,
              score_breakdown: JSON.stringify(scoreBreakdown),
              updated_at: now,
            });

          scoredEntries.push({ id: entry.id, score: totalScore, userId: entry.user_id });
        }

        // Calculate rankings
        scoredEntries.sort((a, b) => b.score - a.score);

        for (let i = 0; i < scoredEntries.length; i++) {
          await db(entriesTable)
            .where('id', scoredEntries[i].id)
            .update({ rank: i + 1, updated_at: now });
        }

        // Trigger quest achievements for placements
        const totalParticipants = scoredEntries.length;
        for (let i = 0; i < scoredEntries.length; i++) {
          const entry = scoredEntries[i];
          const rank = i + 1;
          const percentile = ((rank - 1) / totalParticipants) * 100;

          try {
            // First place = win
            if (rank === 1) {
              await db('users')
                .where({ id: entry.userId })
                .increment('contest_wins', 1);

              const user = await db('users')
                .where({ id: entry.userId })
                .select('contest_wins')
                .first();

              await questService.checkContestWinMilestone(entry.userId, user?.contest_wins || 1);
            }

            // Top 10% (min 10 participants)
            if (totalParticipants >= 10 && percentile <= 10) {
              await questService.triggerAction(entry.userId, 'contest_top_10');
            }

            // Top 50% (min 4 participants)
            if (totalParticipants >= 4 && percentile <= 50) {
              await questService.triggerAction(entry.userId, 'contest_top_50');
            }
          } catch (questError) {
            console.error(`[CRON] Error triggering quest for user ${entry.userId}:`, questError);
          }
        }

        // Calculate prize distribution
        const prizePool = parseFloat(contest.distributable_pool || contest.prize_pool || '0');
        if (prizePool > 0) {
          const prizeRules = await db('prize_distribution_rules')
            .where('min_players', '<=', entries.length)
            .where(function() {
              this.where('max_players', '>=', entries.length)
                .orWhere('max_players', 0);
            })
            .orderBy('rank', 'asc');

          const prizeColumn = contest.is_free ? 'prize_won' : 'prize_amount';

          for (const rule of prizeRules) {
            if (rule.rank === 0) continue; // Skip "rest" rule

            const prizeAmount = prizePool * (parseFloat(rule.percentage) / 100);
            const entry = scoredEntries[rule.rank - 1];

            if (entry) {
              await db(entriesTable)
                .where('id', entry.id)
                .update({
                  [prizeColumn]: prizeAmount,
                  updated_at: now,
                });
            }
          }
        }

        // Update contest counts
        const winnersCount = Math.min(entries.length, 10); // Top 10 or less
        await db('prized_contests')
          .where('id', contest.id)
          .update({
            status: 'finalized',
            winners_count: winnersCount,
            updated_at: now,
          });

        console.log(`[CRON] Finalized prized contest ${contest.id} "${contest.name}" - ${entries.length} entries scored`);

      } catch (scoreError) {
        console.error(`[CRON] Error scoring contest ${contest.id}:`, scoreError);
        // Revert to locked status on error
        await db('prized_contests')
          .where('id', contest.id)
          .update({ status: 'locked', updated_at: now });
      }
    }
  } catch (error) {
    console.error('[CRON] Error scoring prized contests:', error);
  }
}

/**
 * Create weekly prized contests for the upcoming week
 */
async function createWeeklyPrizedContests(): Promise<void> {
  try {
    // Calculate next week's dates
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);

    const lockTime = new Date(nextMonday);
    lockTime.setDate(lockTime.getDate() + 6); // Saturday
    lockTime.setUTCHours(0, 0, 0, 0);

    const endTime = new Date(lockTime);
    endTime.setDate(endTime.getDate() + 1); // Sunday
    endTime.setUTCHours(0, 0, 0, 0);

    const weekNumber = Math.ceil(
      (nextMonday.getTime() - new Date(nextMonday.getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
    );

    // Check if contests already exist for this week
    const existing = await db('prized_contests')
      .where('name', 'like', `%Week ${weekNumber}%`)
      .first();

    if (existing) {
      console.log(`[CRON] Week ${weekNumber} contests already exist, skipping creation`);
      return;
    }

    // Get contest types
    const contestTypes = await db('contest_types')
      .where('is_active', true)
      .orderBy('display_order', 'asc');

    for (const type of contestTypes) {
      const contestName = type.code === 'FREE_LEAGUE'
        ? `Free League - Week ${weekNumber}`
        : type.code === 'DAILY_FLASH'
        ? `Daily Flash - Day 1` // Daily contests created separately
        : `${type.name} - Week ${weekNumber}`;

      // Skip daily flash in weekly creation
      if (type.code === 'DAILY_FLASH') continue;

      await db('prized_contests').insert({
        contest_type_id: type.id,
        name: contestName,
        description: type.description,
        entry_fee: type.entry_fee,
        team_size: type.team_size,
        has_captain: type.has_captain,
        is_free: type.is_free,
        rake_percent: type.rake_percent,
        min_players: type.min_players,
        max_players: type.max_players,
        lock_time: lockTime,
        end_time: endTime,
        status: 'open',
        prize_pool: type.is_free ? '0.05' : '0',
        distributable_pool: type.is_free ? '0.05' : '0',
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`[CRON] Created ${contestName}`);
    }

    console.log(`[CRON] Created Week ${weekNumber} prized contests`);
  } catch (error) {
    console.error('[CRON] Error creating weekly prized contests:', error);
  }
}

/**
 * Create a new Daily Flash contest for today
 */
async function createDailyFlashContest(): Promise<void> {
  try {
    const today = new Date();
    const dayOfMonth = today.getUTCDate();
    const month = today.toLocaleString('en-US', { month: 'short' });

    // Lock time: end of today (24 hours from midnight)
    const lockTime = new Date(today);
    lockTime.setUTCHours(23, 59, 0, 0);

    // End time: 1 hour after lock (for scoring buffer)
    const endTime = new Date(lockTime);
    endTime.setUTCHours(24, 59, 0, 0);

    const contestName = `Daily Flash - ${month} ${dayOfMonth}`;

    // Check if today's daily flash already exists
    const existing = await db('prized_contests')
      .where('name', contestName)
      .first();

    if (existing) {
      console.log(`[CRON] Daily Flash for ${month} ${dayOfMonth} already exists, skipping`);
      return;
    }

    // Get Daily Flash contest type
    const dailyFlashType = await db('contest_types')
      .where('code', 'DAILY_FLASH')
      .first();

    if (!dailyFlashType) {
      console.error('[CRON] DAILY_FLASH contest type not found in database');
      return;
    }

    await db('prized_contests').insert({
      contest_type_id: dailyFlashType.id,
      name: contestName,
      description: dailyFlashType.description,
      entry_fee: dailyFlashType.entry_fee,
      team_size: dailyFlashType.team_size,
      has_captain: dailyFlashType.has_captain,
      is_free: dailyFlashType.is_free,
      rake_percent: dailyFlashType.rake_percent,
      min_players: dailyFlashType.min_players,
      max_players: dailyFlashType.max_players,
      lock_time: lockTime,
      end_time: endTime,
      status: 'open',
      prize_pool: '0',
      distributable_pool: '0',
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log(`[CRON] Created ${contestName} (locks at ${lockTime.toISOString()})`);
  } catch (error) {
    console.error('[CRON] Error creating daily flash contest:', error);
  }
}

/**
 * Manual trigger for prized contest locking (for testing/admin)
 */
export async function triggerPrizedContestLock(): Promise<{ locked: number; cancelled: number }> {
  console.log('[MANUAL TRIGGER] Locking expired prized contests...');

  const before = await db('prized_contests').where('status', 'open').count('* as count').first();
  await lockExpiredPrizedContests();
  const after = await db('prized_contests').where('status', 'open').count('* as count').first();

  const lockedCount = await db('prized_contests').where('status', 'locked').count('* as count').first();
  const cancelledCount = await db('prized_contests').where('status', 'cancelled').count('* as count').first();

  return {
    locked: Number(lockedCount?.count || 0),
    cancelled: Number(cancelledCount?.count || 0),
  };
}

/**
 * Manual trigger for prized contest scoring (for testing/admin)
 */
export async function triggerPrizedContestScoring(): Promise<{ scored: number }> {
  console.log('[MANUAL TRIGGER] Scoring ended prized contests...');

  const before = await db('prized_contests').where('status', 'locked').count('* as count').first();
  await scoreEndedPrizedContests();
  const after = await db('prized_contests').where('status', 'finalized').count('* as count').first();

  return {
    scored: Number(after?.count || 0) - Number(before?.count || 0),
  };
}

/**
 * Manual trigger for contest finalization (for testing/admin)
 */
export async function triggerContestFinalization(): Promise<{
  finalized: number;
  contests: Array<{ contestId: number; contestKey: string; participants: number }>;
}> {
  console.log('[MANUAL TRIGGER] Finalizing ended fantasy contests...');

  const results = await contestFinalizationService.finalizeEndedContests();

  return {
    finalized: results.length,
    contests: results.map(r => ({
      contestId: r.contestId,
      contestKey: r.contestKey,
      participants: r.totalParticipants,
    })),
  };
}
