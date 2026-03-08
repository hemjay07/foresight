import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Tweet } from '../types';

export function useCTFeed(filter: 'all' | 'highlights' | 'rising' = 'all') {
  return useQuery({
    queryKey: ['ct-feed', filter],
    queryFn: async (): Promise<{ tweets: Tweet[]; highlights: Tweet[] }> => {
      const { data } = await api.get('/api/ct-feed', { params: { filter, limit: 30 } });
      return data.data;
    },
  });
}

export function useHighlights(timeframe: '1h' | '24h' | '7d' = '24h') {
  return useQuery({
    queryKey: ['highlights', timeframe],
    queryFn: async (): Promise<Tweet[]> => {
      const { data } = await api.get('/api/ct-feed/highlights', { params: { timeframe, limit: 10 } });
      return data.data?.tweets ?? [];
    },
  });
}
