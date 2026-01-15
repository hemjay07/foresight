/**
 * Contest Finalization Service
 *
 * Handles end-of-contest processing:
 * - Calculating final standings
 * - Triggering quest achievements for placements
 * - Recording contest wins
 */

import db from '../utils/db';
import questService from './questService';

interface ContestResult {
  contestId: number;
  contestKey: string;
  totalParticipants: number;
  winners: Array<{
    userId: string;
    rank: number;
    score: number;
    percentile: number;
  }>;
}

class ContestFinalizationService {
  /**
   * Finalize all contests that have ended but aren't finalized yet
   */
  async finalizeEndedContests(): Promise<ContestResult[]> {
    const now = new Date();
    const results: ContestResult[] = [];

    try {
      // Find contests that have ended but aren't finalized
      const endedContests = await db('fantasy_contests')
        .where('end_date', '<', now)
        .where(function () {
          this.where('is_finalized', false).orWhereNull('is_finalized');
        })
        .where('status', '!=', 'cancelled')
        .select('*');

      console.log(`[ContestFinalization] Found ${endedContests.length} contests to finalize`);

      for (const contest of endedContests) {
        try {
          const result = await this.finalizeContest(contest.id);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`[ContestFinalization] Error finalizing contest ${contest.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('[ContestFinalization] Error in finalizeEndedContests:', error);
      return results;
    }
  }

  /**
   * Finalize a specific contest
   */
  async finalizeContest(contestId: number): Promise<ContestResult | null> {
    try {
      const contest = await db('fantasy_contests')
        .where({ id: contestId })
        .first();

      if (!contest) {
        console.error(`[ContestFinalization] Contest ${contestId} not found`);
        return null;
      }

      if (contest.is_finalized) {
        console.log(`[ContestFinalization] Contest ${contestId} already finalized`);
        return null;
      }

      // Get all teams in this contest, ordered by score
      const teams = await db('user_teams')
        .where({ contest_id: contestId })
        .orderBy('total_score', 'desc')
        .select('user_id', 'total_score', 'rank');

      if (teams.length === 0) {
        console.log(`[ContestFinalization] Contest ${contestId} has no participants`);
        // Mark as finalized even with no participants
        await db('fantasy_contests')
          .where({ id: contestId })
          .update({
            is_finalized: true,
            finalized_at: db.fn.now(),
            status: 'completed',
          });
        return null;
      }

      const totalParticipants = teams.length;
      const winners: ContestResult['winners'] = [];

      // Update ranks and trigger quests for each participant
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const rank = i + 1;
        const percentile = ((rank - 1) / totalParticipants) * 100;

        // Update team rank
        await db('user_teams')
          .where({ user_id: team.user_id, contest_id: contestId })
          .update({ rank });

        winners.push({
          userId: team.user_id,
          rank,
          score: team.total_score,
          percentile,
        });

        // Trigger quest achievements based on placement
        await this.triggerPlacementQuests(team.user_id, rank, percentile, totalParticipants);
      }

      // Mark contest as finalized
      await db('fantasy_contests')
        .where({ id: contestId })
        .update({
          is_finalized: true,
          finalized_at: db.fn.now(),
          status: 'completed',
          total_participants: totalParticipants,
        });

      console.log(`[ContestFinalization] Finalized contest ${contest.contest_key} with ${totalParticipants} participants`);

      return {
        contestId,
        contestKey: contest.contest_key,
        totalParticipants,
        winners,
      };
    } catch (error) {
      console.error(`[ContestFinalization] Error finalizing contest ${contestId}:`, error);
      return null;
    }
  }

  /**
   * Trigger quests based on contest placement
   */
  private async triggerPlacementQuests(
    userId: string,
    rank: number,
    percentile: number,
    totalParticipants: number
  ): Promise<void> {
    try {
      // Increment contests entered
      await db('users')
        .where({ id: userId })
        .increment('contests_entered', 1);

      // First place = win
      if (rank === 1) {
        // Increment win counter
        await db('users')
          .where({ id: userId })
          .increment('contest_wins', 1);

        // Get updated win count
        const user = await db('users')
          .where({ id: userId })
          .select('contest_wins')
          .first();

        const totalWins = user?.contest_wins || 1;

        // Trigger win quests
        await questService.checkContestWinMilestone(userId, totalWins);

        console.log(`[ContestFinalization] User ${userId.slice(0, 8)}... won (${totalWins} total wins)`);
      }

      // Top 10% (minimum 10 participants to qualify)
      if (totalParticipants >= 10 && percentile <= 10) {
        await questService.triggerAction(userId, 'contest_top_10');
        console.log(`[ContestFinalization] User ${userId.slice(0, 8)}... finished top 10% (rank ${rank}/${totalParticipants})`);
      }

      // Top 50% (minimum 4 participants to qualify)
      if (totalParticipants >= 4 && percentile <= 50) {
        await questService.triggerAction(userId, 'contest_top_50');
        console.log(`[ContestFinalization] User ${userId.slice(0, 8)}... finished top 50% (rank ${rank}/${totalParticipants})`);
      }
    } catch (error) {
      console.error(`[ContestFinalization] Error triggering placement quests for user ${userId}:`, error);
    }
  }

  /**
   * Get finalization status for a contest
   */
  async getContestStatus(contestId: number): Promise<{
    isFinalized: boolean;
    finalizedAt: Date | null;
    totalParticipants: number;
  } | null> {
    const contest = await db('fantasy_contests')
      .where({ id: contestId })
      .select('is_finalized', 'finalized_at', 'total_participants')
      .first();

    if (!contest) return null;

    return {
      isFinalized: contest.is_finalized || false,
      finalizedAt: contest.finalized_at || null,
      totalParticipants: contest.total_participants || 0,
    };
  }
}

export const contestFinalizationService = new ContestFinalizationService();
export default contestFinalizationService;
