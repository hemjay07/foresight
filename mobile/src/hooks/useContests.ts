import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Contest, LeaderboardEntry } from '../types';

export function useActiveContests() {
  return useQuery({
    queryKey: ['contests', 'active'],
    queryFn: async (): Promise<Contest[]> => {
      const { data } = await api.get('/api/v2/contests');
      const contests = data.data?.contests ?? [];
      // Filter to active/live contests only
      return contests.filter(
        (c: any) => c.status === 'active' || c.status === 'live' || c.status === 'upcoming'
      );
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
