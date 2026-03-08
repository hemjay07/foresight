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
      const { data } = await api.get(`/api/v2/contests/${contestId}/leaderboard`);
      return data.data;
    },
    enabled: !!contestId,
  });
}

export function useContestLeaderboard(contestId: string) {
  return useQuery({
    queryKey: ['contest-leaderboard', contestId],
    queryFn: async (): Promise<{ entries: LeaderboardEntry[]; prizePool: number; totalEntries: number }> => {
      const { data } = await api.get(`/api/v2/contests/${contestId}/leaderboard`);
      return data.data;
    },
    enabled: !!contestId,
  });
}
