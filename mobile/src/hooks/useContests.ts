import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Contest, LeaderboardEntry } from '../types';

export function useActiveContests() {
  return useQuery({
    queryKey: ['contests', 'active'],
    queryFn: async (): Promise<Contest[]> => {
      const { data } = await api.get('/api/v2/contests');
      const contests = data.data?.contests ?? [];
      // Filter to active/live/open contests
      return contests
        .filter(
          (c: any) =>
            c.status === 'active' ||
            c.status === 'live' ||
            c.status === 'upcoming' ||
            c.status === 'open' ||
            c.status === 'locked'
        )
        .map((c: any): Contest => ({
          id: String(c.id),
          name: c.name,
          status: c.status,
          startDate: c.createdAt ?? c.lockTime ?? new Date().toISOString(),
          endDate: c.endTime ?? c.endDate ?? new Date().toISOString(),
          lockTime: c.lockTime,
          isPrizeLeague: !c.isFree,
          prizePool: c.prizePool ?? 0,
          prizePoolFormatted: c.prizePoolFormatted,
          playerCount: c.playerCount ?? 0,
          entryFee: c.entryFee ?? 0,
          entryFeeFormatted: c.entryFeeFormatted,
          isFree: c.isFree ?? false,
          description: c.description,
          teamSize: c.teamSize,
          hasCaptain: c.hasCaptain,
          maxPlayers: c.maxPlayers,
        }));
    },
  });
}

export function useContestDetail(contestId: string) {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v2/contests/${contestId}`);
      const contest = data.data?.contest;
      // Also fetch entries for the leaderboard
      const entriesRes = await api.get(`/api/v2/contests/${contestId}/entries`);
      const entries = entriesRes.data?.data?.entries ?? [];
      return {
        ...contest,
        entries,
        prizePool: contest?.prizePool ?? 0,
        prizePoolFormatted: contest?.prizePoolFormatted,
        totalEntries: entries.length,
        status: contest?.status ?? 'open',
        endDate: contest?.endTime ?? contest?.endDate ?? new Date().toISOString(),
        lockTime: contest?.lockTime,
      };
    },
    enabled: !!contestId,
  });
}

export function useContestLeaderboard(contestId: string) {
  return useQuery({
    queryKey: ['contest-leaderboard', contestId],
    queryFn: async (): Promise<{ entries: LeaderboardEntry[]; prizePool: number; totalEntries: number }> => {
      const { data } = await api.get(`/api/v2/contests/${contestId}/entries`);
      const entries = data.data?.entries ?? [];
      // Get contest for prize pool
      const contestRes = await api.get(`/api/v2/contests/${contestId}`);
      const contest = contestRes.data?.data?.contest;
      return {
        entries: entries.map((e: any, i: number) => ({
          rank: e.rank ?? i + 1,
          userId: e.userId ?? '',
          username: e.username ?? 'Unknown',
          walletAddress: e.walletAddress ?? '',
          totalScore: parseFloat(e.score) || 0,
          prizeAmount: e.prizeAmount ?? 0,
        })),
        prizePool: contest?.prizePool ?? 0,
        totalEntries: entries.length,
      };
    },
    enabled: !!contestId,
  });
}
