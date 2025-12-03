import db from '../utils/db';
import {
  checkTeamAchievements,
  checkRankingAchievements,
  checkXPAchievements,
} from './achievementService';

/**
 * Fantasy League Scoring Service
 * Calculates metrics-based scores for CT Draft teams
 *
 * Daily Scoring Formula:
 * - Base: base_price (tier-based pricing)
 * - Follower bonus: (follower_count / 1M) * 5 points
 * - Tweet activity: daily_tweets * 2 points
 * - Engagement: (likes + retweets + replies) * 0.01 points
 * - Engagement rate multiplier: (1 + engagement_rate / 100)
 * - Captain gets 2x multiplier (FPL-style)
 */

interface Influencer {
  id: number;
  twitter_handle: string;
  display_name: string;
  tier: string;
  base_price: number;
  follower_count: number;
  engagement_rate?: number;
  is_captain?: boolean;
}

interface InfluencerMetrics {
  follower_count: number;
  daily_tweets: number;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  engagement_rate: number;
  scraped_at: Date;
}

interface Team {
  id: number;
  user_id: string;
  contest_id: number;
  team_name: string;
  total_score: number;
  current_score: number;
  previous_score: number;
  rank: number | null;
}

interface TeamWithInfluencers extends Team {
  influencers: Influencer[];
}

/**
 * Get latest metrics for an influencer
 */
async function getLatestMetrics(influencerId: number): Promise<InfluencerMetrics | null> {
  const metrics = await db('influencer_metrics')
    .where({ influencer_id: influencerId })
    .orderBy('scraped_at', 'desc')
    .first();

  return metrics || null;
}

/**
 * Calculate daily score for a single influencer based on Twitter metrics
 * Uses real-time Twitter data from influencer_metrics table
 */
export function calculateInfluencerDailyScore(
  influencer: Influencer,
  metrics: InfluencerMetrics | null
): number {
  // Base score from tier pricing
  const baseScore = Number(influencer.base_price) || 0;

  // If no metrics available yet, return base price only
  if (!metrics) {
    return baseScore;
  }

  // Follower bonus: 5 points per million followers
  const followerCount = Number(metrics.follower_count) || 0;
  const followerBonus = (followerCount / 1_000_000) * 5;

  // Tweet activity bonus: 2 points per tweet today
  const dailyTweets = Number(metrics.daily_tweets) || 0;
  const tweetBonus = dailyTweets * 2;

  // Engagement bonus: 0.01 points per interaction
  const likes = Number(metrics.likes_count) || 0;
  const retweets = Number(metrics.retweets_count) || 0;
  const replies = Number(metrics.replies_count) || 0;
  const engagementBonus = (likes + retweets + replies) * 0.01;

  // Engagement rate multiplier (1.0 to 2.0x based on engagement rate)
  const engagementRate = Number(metrics.engagement_rate) || 0;
  const engagementMultiplier = 1 + (engagementRate / 100);

  // Calculate total score with engagement multiplier
  const rawScore = baseScore + followerBonus + tweetBonus + engagementBonus;
  const totalScore = rawScore * engagementMultiplier;

  // Round to 2 decimals
  return Math.round(totalScore * 100) / 100;
}

/**
 * Get all teams with their influencers for a contest
 */
async function getTeamsWithInfluencers(contestId: number): Promise<TeamWithInfluencers[]> {
  // Get all teams for this contest
  const teams = await db('user_teams')
    .where('contest_id', contestId)
    .select('*');

  // For each team, get their influencers from team_picks
  const teamsWithInfluencers: TeamWithInfluencers[] = [];

  for (const team of teams) {
    // Get team picks
    const picks = await db('team_picks')
      .where('team_id', team.id)
      .join('influencers', 'team_picks.influencer_id', 'influencers.id')
      .select(
        'influencers.id',
        'influencers.twitter_handle',
        'influencers.display_name',
        'influencers.tier',
        'influencers.base_price',
        'influencers.follower_count',
        'influencers.engagement_rate',
        'team_picks.is_captain'
      );

    teamsWithInfluencers.push({
      ...team,
      influencers: picks,
    });
  }

  return teamsWithInfluencers;
}

/**
 * Calculate scores for all teams in a contest
 * Includes weekly spotlight bonus for top voted influencers
 * Stores individual influencer scores in team_picks
 */
export async function calculateContestScores(contestId: number): Promise<void> {
  console.log('========================================');
  console.log(`Calculating Scores for Contest ${contestId}`);
  console.log('========================================');

  try {
    const teamsWithInfluencers = await getTeamsWithInfluencers(contestId);

    console.log(`Found ${teamsWithInfluencers.length} teams to score...`);

    // Get top 3 voted influencers for weekly spotlight bonus
    const topVotedInfluencers = await db('influencer_weekly_votes')
      .where('contest_id', contestId)
      .orderBy('weighted_score', 'desc')
      .limit(3)
      .select('influencer_id', 'weighted_score', 'vote_count');

    const spotlightBonuses: Record<number, number> = {};
    if (topVotedInfluencers.length > 0) {
      spotlightBonuses[topVotedInfluencers[0].influencer_id] = 0.10; // #1 gets 10% bonus
      if (topVotedInfluencers.length > 1) {
        spotlightBonuses[topVotedInfluencers[1].influencer_id] = 0.05; // #2 gets 5% bonus
      }
      if (topVotedInfluencers.length > 2) {
        spotlightBonuses[topVotedInfluencers[2].influencer_id] = 0.03; // #3 gets 3% bonus
      }

      console.log('\n🔥 CT Spotlight Bonuses:');
      topVotedInfluencers.forEach((inf, idx) => {
        const bonus = spotlightBonuses[inf.influencer_id];
        console.log(`   ${idx + 1}. Influencer #${inf.influencer_id}: +${(bonus * 100).toFixed(0)}% (${inf.vote_count} votes, ${inf.weighted_score} score)`);
      });
      console.log('');
    }

    for (const team of teamsWithInfluencers) {
      let totalScore = 0;
      let bonusAmount = 0;

      // Calculate score for each influencer and update team_picks
      for (const influencer of team.influencers) {
        // Get latest metrics for this influencer
        const metrics = await getLatestMetrics(influencer.id);

        // Calculate daily score using real Twitter metrics
        const dailyScore = calculateInfluencerDailyScore(influencer, metrics);

        // Apply 2x multiplier for captain (FPL-style)
        const multiplier = influencer.is_captain ? 2 : 1;
        const influencerFinalScore = dailyScore * multiplier;

        // Apply spotlight bonus if this influencer is in top 3
        let influencerWithBonus = influencerFinalScore;
        if (spotlightBonuses[influencer.id]) {
          const bonus = influencerFinalScore * spotlightBonuses[influencer.id];
          influencerWithBonus += bonus;
          bonusAmount += bonus;
        }

        // Update team_picks with individual influencer scores
        await db('team_picks')
          .where({
            team_id: team.id,
            influencer_id: influencer.id,
          })
          .update({
            daily_points: Math.round(dailyScore),
            total_points: db.raw('total_points + ?', [Math.round(dailyScore)]),
            updated_at: db.fn.now(),
          });

        totalScore += influencerWithBonus;

        console.log(`  ${influencer.display_name}: ${Math.round(dailyScore)} pts${influencer.is_captain ? ' (Captain 2x)' : ''}`);
      }

      // Round to integer for leaderboard ranking
      const roundedScore = Math.round(totalScore);

      // Store previous score
      const scoreChange = roundedScore - (team.current_score || 0);

      // Update team score
      await db('user_teams')
        .where('id', team.id)
        .update({
          previous_score: team.current_score || 0,
          current_score: roundedScore,
          total_score: roundedScore,
          score_change: scoreChange,
          spotlight_bonus: Math.round(bonusAmount),
          last_score_update: db.fn.now(),
          updated_at: db.fn.now(),
        });

      const bonusText = bonusAmount > 0 ? ` +${Math.round(bonusAmount)} spotlight bonus` : '';
      console.log(`✓ Team "${team.team_name}": ${roundedScore} pts (${scoreChange >= 0 ? '+' : ''}${scoreChange})${bonusText}\n`);
    }

    console.log('✅ All team scores calculated');
  } catch (error) {
    console.error('❌ Failed to calculate team scores:', error);
    throw error;
  }
}

/**
 * Calculate rankings for all teams in a contest
 */
export async function calculateContestRankings(contestId: number): Promise<void> {
  try {
    // Get all teams ordered by score (highest first)
    const teams = await db('user_teams')
      .where('contest_id', contestId)
      .orderBy('total_score', 'desc')
      .orderBy('created_at', 'asc') // Tiebreaker: earlier creation wins
      .select('id', 'total_score', 'team_name');

    console.log(`Calculating rankings for ${teams.length} teams...`);

    // Assign ranks
    for (let i = 0; i < teams.length; i++) {
      const rank = i + 1;
      await db('user_teams')
        .where('id', teams[i].id)
        .update({ rank });
    }

    console.log('✅ Team rankings calculated');
  } catch (error) {
    console.error('❌ Failed to calculate team rankings:', error);
    throw error;
  }
}

/**
 * Update leaderboard cache
 */
export async function updateLeaderboardCache(contestId: number): Promise<void> {
  try {
    // Get top teams for leaderboard cache
    const topTeams = await db('user_teams')
      .where('contest_id', contestId)
      .orderBy('rank', 'asc')
      .limit(100)
      .select('*');

    console.log(`Caching leaderboard for top ${topTeams.length} teams...`);

    // Clear existing cache for this contest
    await db('contest_leaderboard')
      .where('contest_id', contestId)
      .del();

    // Insert new cache entries
    const cacheEntries = topTeams.map((team) => ({
      contest_id: contestId,
      user_id: team.user_id,
      team_id: team.id,
      final_score: team.total_score,
      rank: team.rank,
      xp_reward: calculateXPReward(team.rank),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    }));

    if (cacheEntries.length > 0) {
      await db('contest_leaderboard').insert(cacheEntries);
    }

    console.log('✅ Leaderboard cache updated');
  } catch (error) {
    console.error('❌ Failed to update leaderboard cache:', error);
    throw error;
  }
}

/**
 * Award performance XP to all teams at end of contest
 */
export async function awardPerformanceXP(contestId: number): Promise<void> {
  try {
    console.log('Awarding performance XP...');

    // Get all teams with their ranks
    const teams = await db('user_teams')
      .where('contest_id', contestId)
      .select('id', 'user_id', 'rank', 'total_score', 'team_name');

    for (const team of teams) {
      const xpReward = calculateXPReward(team.rank);

      // Award XP to user
      await db('user_xp_totals')
        .where({ user_id: team.user_id })
        .update({
          total_xp: db.raw('total_xp + ?', [xpReward]),
          lifetime_xp: db.raw('lifetime_xp + ?', [xpReward]),
          performance_xp: db.raw('performance_xp + ?', [xpReward]),
          last_xp_at: db.fn.now(),
          updated_at: db.fn.now(),
        });

      console.log(`  ${team.team_name} (Rank #${team.rank}): +${xpReward} XP`);

      // Check and award achievements based on rank
      await checkPerformanceAchievements(team.user_id, team.rank, team.total_score);
    }

    console.log('✅ Performance XP awarded');
  } catch (error) {
    console.error('❌ Failed to award performance XP:', error);
    throw error;
  }
}

/**
 * Check and award performance-based achievements
 */
async function checkPerformanceAchievements(userId: number, rank: number, score: number): Promise<void> {
  const achievementsToCheck: string[] = [];

  if (rank === 1) achievementsToCheck.push('WIN_CONTEST');
  if (rank <= 3) achievementsToCheck.push('TOP_3_FINISH');
  if (rank <= 10) achievementsToCheck.push('TOP_10_FINISH');
  if (score >= 100) achievementsToCheck.push('TEAM_100_POINTS');

  for (const key of achievementsToCheck) {
    await tryUnlockAchievement(userId, key);
  }
}

/**
 * Try to unlock an achievement for a user (if not already unlocked)
 */
export async function tryUnlockAchievement(userId: number, achievementKey: string): Promise<boolean> {
  try {
    // Get achievement
    const achievement = await db('achievements').where({ key: achievementKey }).first();
    if (!achievement) return false;

    // Check if already unlocked
    const existing = await db('user_achievements')
      .where({ user_id: userId, achievement_id: achievement.id })
      .first();

    if (existing) return false;

    // Unlock achievement
    await db('user_achievements').insert({
      user_id: userId,
      achievement_id: achievement.id,
      unlocked_at: db.fn.now(),
    });

    // Award XP reward
    if (achievement.xp_reward > 0) {
      await db('user_xp_totals')
        .where({ user_id: userId })
        .update({
          total_xp: db.raw('total_xp + ?', [achievement.xp_reward]),
          lifetime_xp: db.raw('lifetime_xp + ?', [achievement.xp_reward]),
          engagement_xp: db.raw('engagement_xp + ?', [achievement.xp_reward]),
          last_xp_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
    }

    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xp_reward} XP)`);
    return true;
  } catch (error) {
    console.error(`Failed to unlock achievement ${achievementKey}:`, error);
    return false;
  }
}

/**
 * Check milestone achievements (XP thresholds)
 */
export async function checkMilestoneAchievements(userId: number): Promise<void> {
  const userXP = await db('user_xp_totals')
    .where({ user_id: userId })
    .select('lifetime_xp')
    .first();

  if (!userXP) return;

  const xp = userXP.lifetime_xp || 0;

  if (xp >= 100) await tryUnlockAchievement(userId, 'XP_100');
  if (xp >= 500) await tryUnlockAchievement(userId, 'XP_500');
  if (xp >= 1000) await tryUnlockAchievement(userId, 'XP_1000');
  if (xp >= 2500) await tryUnlockAchievement(userId, 'XP_2500');
}

/**
 * Check voting achievements
 */
export async function checkVotingAchievements(userId: number, totalVotes: number, streak: number): Promise<void> {
  // First vote
  if (totalVotes === 1) await tryUnlockAchievement(userId, 'FIRST_VOTE');

  // Vote count achievements
  if (totalVotes >= 10) await tryUnlockAchievement(userId, 'VOTES_10');
  if (totalVotes >= 50) await tryUnlockAchievement(userId, 'VOTES_50');
  if (totalVotes >= 100) await tryUnlockAchievement(userId, 'VOTES_100');

  // Streak achievements (CT themed)
  if (streak >= 7) await tryUnlockAchievement(userId, 'GM_STREAK');
  if (streak >= 30) await tryUnlockAchievement(userId, 'GM_LEGEND');
}

/**
 * Calculate XP reward based on rank
 */
function calculateXPReward(rank: number): number {
  if (rank === 1) return 1000;
  if (rank === 2) return 750;
  if (rank === 3) return 500;
  if (rank <= 10) return 250;
  if (rank <= 25) return 100;
  if (rank <= 50) return 50;
  return 25;
}

/**
 * Run complete scoring cycle for active contests
 */
export async function runFantasyScoringCycle(): Promise<void> {
  console.log('\n========================================');
  console.log('Fantasy League Scoring Cycle');
  console.log('========================================\n');

  try {
    // Get all active contests
    const activeContests = await db('fantasy_contests')
      .where('status', 'active')
      .select('*');

    if (activeContests.length === 0) {
      console.log('⚠️  No active contests found');
      return;
    }

    console.log(`Found ${activeContests.length} active contest(s)\n`);

    for (const contest of activeContests) {
      console.log(`\nProcessing Contest: ${contest.contest_key}`);
      console.log(`Period: ${contest.start_date} to ${contest.end_date}`);
      console.log('---');

      // Step 1: Calculate team scores
      await calculateContestScores(contest.id);

      // Step 2: Calculate rankings
      await calculateContestRankings(contest.id);

      // Step 3: Update leaderboard cache
      await updateLeaderboardCache(contest.id);

      // Step 4: Check achievements for all teams
      await checkAchievementsForContest(contest.id);

      console.log(`\n✅ Contest ${contest.contest_key} scoring complete\n`);
    }

    console.log('\n========================================');
    console.log('✅ Fantasy Scoring Cycle Complete');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Fantasy scoring cycle failed:', error);
    throw error;
  }
}

/**
 * Check achievements for all teams in a contest
 */
async function checkAchievementsForContest(contestId: number): Promise<void> {
  try {
    // Get all teams with scores and ranks
    const teams = await db('user_teams')
      .where('contest_id', contestId)
      .select('*');

    for (const team of teams) {
      // Check team-based achievements
      await checkTeamAchievements(team.user_id, team.id, contestId);

      // Check ranking achievements
      if (team.rank) {
        await checkRankingAchievements(team.user_id, team.rank, contestId);
      }

      // Check XP milestones
      const user = await db('users').where('id', team.user_id).first();
      if (user) {
        await checkXPAchievements(team.user_id, user.xp || 0);
      }
    }

    console.log('✅ Achievement checks complete');
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Get leaderboard for a contest
 */
export async function getContestLeaderboard(
  contestId: number,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  const leaderboard = await db('user_teams')
    .where('contest_id', contestId)
    .join('users', 'user_teams.user_id', 'users.id')
    .orderBy('user_teams.rank', 'asc')
    .limit(limit)
    .offset(offset)
    .select(
      'user_teams.*',
      'users.address as wallet_address',
      'users.username'
    );

  return leaderboard;
}

/**
 * Get user's team for a contest
 */
export async function getUserTeam(userId: string, contestId: number): Promise<any | null> {
  const team = await db('user_teams')
    .where({
      user_id: userId,
      contest_id: contestId,
    })
    .first();

  if (!team) return null;

  // Get team picks with influencer details
  const picks = await db('team_picks')
    .where('team_id', team.id)
    .join('influencers', 'team_picks.influencer_id', 'influencers.id')
    .orderBy('team_picks.pick_order', 'asc')
    .select(
      'team_picks.*',
      'influencers.twitter_handle',
      'influencers.display_name',
      'influencers.tier',
      'influencers.base_price',
      'influencers.follower_count',
      'influencers.avatar_url'
    );

  return {
    ...team,
    picks,
  };
}
