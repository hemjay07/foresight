/**
 * League Service
 *
 * Extracted business logic from league.ts API routes.
 * This service handles contest, team, and league-related operations.
 */

import db from '../utils/db';

/**
 * Get active contest by ID or the currently active contest
 */
export async function getActiveContest(contestId?: number) {
  if (contestId) {
    const contest = await db('fantasy_contests')
      .where({ id: contestId, status: 'active' })
      .first();

    if (!contest) {
      throw new Error('Contest not found or not active');
    }

    return contest;
  }

  // Get the currently active contest
  const contest = await db('fantasy_contests')
    .where({ status: 'active' })
    .first();

  if (!contest) {
    throw new Error('No active contest');
  }

  return contest;
}

/**
 * Get user's team for a specific contest
 */
export async function getUserTeam(userId: string, contestId: number) {
  const team = await db('user_teams')
    .where({ user_id: userId, contest_id: contestId })
    .first();

  return team || null;
}

/**
 * Get team picks with influencer details
 */
export async function getTeamPicks(teamId: number) {
  const picks = await db('team_picks')
    .join('influencers', 'team_picks.influencer_id', 'influencers.id')
    .where({ team_id: teamId })
    .select(
      'team_picks.*',
      'influencers.display_name as influencer_name',
      'influencers.twitter_handle as influencer_handle',
      'influencers.avatar_url as profile_image_url',
      'influencers.tier',
      'influencers.price'
    )
    .orderBy('team_picks.position');

  return picks;
}

/**
 * Get all active influencers
 */
export async function getActiveInfluencers() {
  const influencers = await db('influencers')
    .where({ is_active: true })
    .select('*')
    .orderBy([
      { column: 'tier', order: 'asc' },
      { column: 'display_name', order: 'asc' }
    ]);

  return influencers;
}

/**
 * Calculate total team cost
 */
export function calculateTeamCost(picks: Array<{ price: number }>): number {
  return picks.reduce((total, pick) => total + pick.price, 0);
}

/**
 * Validate team budget
 */
export function validateTeamBudget(picks: Array<{ price: number }>, maxBudget: number = 100000): boolean {
  const totalCost = calculateTeamCost(picks);
  return totalCost <= maxBudget;
}

/**
 * Get contest leaderboard
 */
export async function getContestLeaderboard(contestId: number, limit: number = 100, offset: number = 0) {
  const leaderboard = await db('user_teams')
    .join('users', 'user_teams.user_id', 'users.id')
    .where({ 'user_teams.contest_id': contestId })
    .select(
      'user_teams.id as team_id',
      'user_teams.team_name',
      'user_teams.team_score',
      'users.wallet_address',
      'users.username',
      'users.avatar_url',
      db.raw('ROW_NUMBER() OVER (ORDER BY user_teams.team_score DESC) as rank')
    )
    .orderBy('user_teams.team_score', 'desc')
    .limit(limit)
    .offset(offset);

  return leaderboard;
}

/**
 * Check if user has an active team in contest
 */
export async function userHasTeamInContest(userId: string, contestId: number): Promise<boolean> {
  const team = await getUserTeam(userId, contestId);
  return team !== null;
}

/**
 * Get user's rank in contest
 */
export async function getUserRankInContest(userId: string, contestId: number): Promise<number | null> {
  const result = await db('user_teams')
    .where({ contest_id: contestId })
    .select(
      'user_id',
      db.raw('ROW_NUMBER() OVER (ORDER BY team_score DESC) as rank')
    )
    .as('ranked_teams')
    .where({ user_id: userId })
    .first();

  return result?.rank || null;
}

/**
 * Get team score breakdown
 */
export async function getTeamScoreBreakdown(teamId: number) {
  const picks = await db('team_picks')
    .join('influencers', 'team_picks.influencer_id', 'influencers.id')
    .leftJoin('influencer_metrics as latest_metrics', function() {
      this.on('influencers.id', '=', 'latest_metrics.influencer_id')
        .andOn('latest_metrics.recorded_at', '=', db.raw(`(
          SELECT MAX(recorded_at)
          FROM influencer_metrics
          WHERE influencer_id = influencers.id
        )`));
    })
    .where({ 'team_picks.team_id': teamId })
    .select(
      'team_picks.*',
      'influencers.display_name',
      'influencers.twitter_handle',
      'influencers.tier',
      'latest_metrics.engagement_score',
      'latest_metrics.likes',
      'latest_metrics.retweets',
      'latest_metrics.replies'
    );

  return picks;
}

export default {
  getActiveContest,
  getUserTeam,
  getTeamPicks,
  getActiveInfluencers,
  calculateTeamCost,
  validateTeamBudget,
  getContestLeaderboard,
  userHasTeamInContest,
  getUserRankInContest,
  getTeamScoreBreakdown,
};
