import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useMyEntry(contestId: string, isAuthenticated = true) {
  return useQuery({
    queryKey: ['my-entry', contestId],
    queryFn: async (): Promise<{ hasEntry: boolean; teamName?: string }> => {
      try {
        const { data } = await api.get(`/api/v2/contests/${contestId}/my-entry`);
        return { hasEntry: true, teamName: data.data?.teamName };
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 401) {
          return { hasEntry: false };
        }
        throw err;
      }
    },
    enabled: !!contestId && isAuthenticated,
  });
}
