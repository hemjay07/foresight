import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { ForesightScore, DailyStatus, LeaderboardEntry } from '../types';

export function useForesightScore(enabled = true) {
  return useQuery({
    queryKey: ['foresight-score'],
    queryFn: async (): Promise<ForesightScore> => {
      const { data } = await api.get('/api/v2/fs/me');
      return data.data;
    },
    enabled,
  });
}

export function useDailyStatus(enabled = true) {
  return useQuery({
    queryKey: ['daily-status'],
    queryFn: async (): Promise<DailyStatus> => {
      const { data } = await api.get('/api/v2/fs/daily-status');
      return data.data;
    },
    enabled,
  });
}

export function useFSLeaderboard(type: 'all_time' | 'season' | 'weekly' = 'season', limit = 50) {
  return useQuery({
    queryKey: ['fs-leaderboard', type],
    queryFn: async (): Promise<{ entries: LeaderboardEntry[]; total: number }> => {
      const { data } = await api.get('/api/v2/fs/leaderboard', { params: { type, limit } });
      return data.data;
    },
  });
}

export function useTrackActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityType: string) => {
      const { data } = await api.post('/api/v2/fs/track-activity', { activityType });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      queryClient.invalidateQueries({ queryKey: ['foresight-score'] });
    },
  });
}
