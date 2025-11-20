import db from '../utils/db';

/**
 * Fantasy League Scoring Service
 * Calculates metrics-based scores for CT Draft teams
 *
 * Scoring Formula (Enhanced):
 * Base Score = base_price + (follower_count / 1,000,000) * 10
 *
 * Future enhancements will add:
 * - Engagement rate multiplier
 * - Tweet velocity bonus
 * - Follower growth trend
 */

interface Influencer {
  id: number;
  twitter_handle: string;
  display_name: string;
  tier: string;
  base_price: number;
  follower_count: number;
  engagement_rate?: number;
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
 * Calculate score for a single influencer
 * Enhanced formula that can be expanded with Twitter API data
 */
export function calculateInfluencerScore(influencer: Influencer): number {
  // Base score from tier pricing (ensure it's a number)
  const baseScore = Number(influencer.base_price) || 0;

  // Follower bonus: 10 points per million followers (ensure it's a number)
  const followerCount = Number(influencer.follower_count) || 0;
  const followerBonus = (followerCount / 1_000_000) * 10;

  // Engagement bonus (future enhancement)
  // const engagementBonus = (influencer.engagement_rate || 0) * 5;

  // Total score
  const totalScore = baseScore + followerBonus;

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
        'influencers.engagement_rate'
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
 */
export async function calculateContestScores(contestId: number): Promise<void> {
  console.log('========================================');
  console.log(`Calculating Scores for Contest ${contestId}`);
  console.log('========================================');

  try {
    const teamsWithInfluencers = await getTeamsWithInfluencers(contestId);

    console.log(`Found ${teamsWithInfluencers.length} teams to score...`);

    for (const team of teamsWithInfluencers) {
      // Calculate total score for this team
      const totalScore = team.influencers.reduce((sum, influencer) => {
        const influencerScore = calculateInfluencerScore(influencer);
        return sum + influencerScore;
      }, 0);

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
          last_score_update: db.fn.now(),
          updated_at: db.fn.now(),
        });

      console.log(`✓ Team "${team.team_name}": ${roundedScore} pts (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
    }

    console.log('\n✅ All team scores calculated');
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
