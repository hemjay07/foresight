import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Quest, QuestSummary } from '../types';

export function useQuests() {
  return useQuery({
    queryKey: ['quests'],
    queryFn: async (): Promise<{ quests: Record<string, Quest[]>; summary: QuestSummary }> => {
      const { data } = await api.get('/api/v2/quests');
      return data.data;
    },
  });
}

export function useQuestSummary(enabled = true) {
  return useQuery({
    queryKey: ['quest-summary'],
    queryFn: async (): Promise<QuestSummary> => {
      const { data } = await api.get('/api/v2/quests/summary');
      return data.data;
    },
    enabled,
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      const { data } = await api.post(`/api/v2/quests/${questId}/claim`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['quest-summary'] });
      queryClient.invalidateQueries({ queryKey: ['foresight-score'] });
    },
  });
}
