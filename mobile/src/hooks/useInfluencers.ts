import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Influencer, InfluencerDetail } from '../types';

export function useInfluencers(params?: { tier?: string; search?: string; sortBy?: string }) {
  return useQuery({
    queryKey: ['influencers', params],
    queryFn: async (): Promise<{ influencers: Influencer[]; budget: number }> => {
      // Use /api/league/influencers which returns ALL 69 influencers at once
      const { data } = await api.get('/api/league/influencers');
      const raw = data.data?.influencers ?? [];
      const budget: number = data.data?.budget_info?.max_budget ?? 150;

      // Map backend field names to mobile Influencer type
      let influencers: Influencer[] = raw.map((inf: any) => ({
        id: inf.id,
        handle: inf.handle ?? inf.twitter_handle ?? '',
        name: inf.name ?? inf.display_name ?? '',
        avatar: inf.profile_image_url ?? inf.avatar_url ?? inf.avatar ?? '',
        tier: inf.tier ?? 'C',
        price: inf.price ?? 0,
        totalPoints: inf.fs_rating ?? inf.total_points ?? 0,
        followers: inf.follower_count ?? inf.followers ?? 0,
        engagementRate: inf.engagement_rate ?? inf.engagementRate ?? 0,
      }));

      // Client-side filtering (backend returns all at once)
      if (params?.tier) {
        influencers = influencers.filter((inf) => inf.tier === params.tier);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        influencers = influencers.filter(
          (inf) =>
            inf.handle.toLowerCase().includes(q) ||
            inf.name.toLowerCase().includes(q)
        );
      }
      if (params?.sortBy === 'price') {
        influencers.sort((a, b) => b.price - a.price);
      } else if (params?.sortBy === 'points') {
        influencers.sort((a, b) => b.totalPoints - a.totalPoints);
      }

      return { influencers, budget };
    },
    staleTime: 60_000,
  });
}

export function useInfluencerDetail(id: number) {
  return useQuery({
    queryKey: ['influencer', id],
    queryFn: async (): Promise<InfluencerDetail> => {
      const { data } = await api.get(`/api/intel/influencers/${id}`);
      return data.data?.influencer;
    },
    enabled: !!id,
  });
}

export function useInfluencerWeeklyHistory(id: number) {
  return useQuery({
    queryKey: ['influencer-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/intel/influencers/${id}/weekly-history`);
      return data.data;
    },
    enabled: !!id,
  });
}
