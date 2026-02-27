/**
 * ComparisonView
 * Side-by-side comparison of 2-3 influencers
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  XLogo,
  Users,
  Lightning,
  Star,
  TrendUp,
  TrendDown,
  ChartLine,
  Trophy,
  Warning,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { getAvatarUrl } from '../../utils/avatar';
import MetricsChart from './MetricsChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface InfluencerComparison {
  id: number;
  handle: string;
  name: string;
  avatar: string | null;
  tier: string;
  price: number;
  totalPoints: number;
  followers: number;
  engagementRate: number;
  weeklyTrend: number;
  history: {
    date: string;
    points: number;
    followers: number;
  }[];
}

interface ComparisonViewProps {
  influencerIds: number[];
  onClose: () => void;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-gold-500/20', text: 'text-gold-400', border: 'border-gold-500/40' },
  A: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  B: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  C: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
};

// Stats to compare
const COMPARISON_STATS = [
  { key: 'totalPoints', label: 'Total Points', icon: Star, format: (v: number) => v.toLocaleString() },
  { key: 'price', label: 'Draft Cost', icon: Trophy, format: (v: number) => `${v} pts` },
  { key: 'followers', label: 'Followers', icon: Users, format: (v: number) => formatNumber(v) },
  { key: 'engagementRate', label: 'Engagement', icon: Lightning, format: (v: number) => `${v.toFixed(2)}%` },
  { key: 'weeklyTrend', label: '7-Day Trend', icon: ChartLine, format: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function ComparisonView({ influencerIds, onClose }: ComparisonViewProps) {
  const [influencers, setInfluencers] = useState<InfluencerComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data
  const fetchComparison = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const res = await axios.get(`${API_URL}/api/intel/compare`, {
        params: { ids: influencerIds.join(',') },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        setInfluencers(res.data.data.influencers);
        setError(null);
      }
    } catch (err) {
      console.error('[ComparisonView] Error:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (influencerIds.length >= 2) {
      fetchComparison();
    }
  }, [influencerIds]);

  // Find best value for each stat
  const getBestValue = (key: string): number => {
    if (influencers.length === 0) return 0;

    // For price, lower is better (value pick)
    if (key === 'price') {
      return Math.min(...influencers.map(i => (i as any)[key] || 0));
    }
    // For others, higher is better
    return Math.max(...influencers.map(i => (i as any)[key] || 0));
  };

  // Check if this is the best value
  const isBestValue = (key: string, value: number): boolean => {
    const best = getBestValue(key);
    if (key === 'price') return value === best && value > 0;
    return value === best && value > 0;
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/90 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-4xl w-full">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-400">Loading comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/90 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-4xl w-full">
          <div className="flex justify-end mb-4">
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="text-center py-8">
            <Warning size={40} className="mx-auto mb-3 text-red-400" />
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchComparison}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              <ArrowClockwise size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gridCols = influencers.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ChartLine size={20} className="text-cyan-400" />
            Influencer Comparison
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Influencer Headers */}
          <div className={`grid ${gridCols} gap-4 mb-6`}>
            {influencers.map((inf) => {
              const tierStyle = TIER_STYLES[inf.tier] || TIER_STYLES.C;
              return (
                <div key={inf.id} className="text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-2">
                    <img
                      src={getAvatarUrl(inf.handle, inf.avatar)}
                      alt={inf.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto"
                    />
                    <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded text-xs font-bold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
                      {inf.tier}
                    </div>
                  </div>
                  {/* Name */}
                  <h3 className="font-semibold text-white truncate">{inf.name}</h3>
                  <p className="text-sm text-gray-500">@{inf.handle}</p>
                </div>
              );
            })}
          </div>

          {/* Stats Comparison */}
          <div className="space-y-3">
            {COMPARISON_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400">{stat.label}</span>
                  </div>
                  <div className={`grid ${gridCols} gap-4`}>
                    {influencers.map((inf) => {
                      const value = (inf as any)[stat.key] || 0;
                      const isBest = isBestValue(stat.key, value);
                      const isPositive = stat.key === 'weeklyTrend' && value > 0;
                      const isNegative = stat.key === 'weeklyTrend' && value < 0;

                      return (
                        <div
                          key={inf.id}
                          className={`text-center p-2 rounded-lg ${
                            isBest ? 'bg-emerald-500/10 border border-emerald-500/30' : ''
                          }`}
                        >
                          <div className={`text-lg font-bold ${
                            isBest ? 'text-emerald-400' :
                            isPositive ? 'text-emerald-400' :
                            isNegative ? 'text-rose-400' :
                            'text-white'
                          }`}>
                            {stat.format(value)}
                            {stat.key === 'weeklyTrend' && (
                              value > 0 ? (
                                <TrendUp size={14} className="inline ml-1" />
                              ) : value < 0 ? (
                                <TrendDown size={14} className="inline ml-1" />
                              ) : null
                            )}
                          </div>
                          {isBest && (
                            <div className="text-[10px] text-emerald-400 mt-0.5">Best</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Points History Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <ChartLine size={14} />
              Points History (7 Days)
            </h4>
            <div className={`grid ${gridCols} gap-4`}>
              {influencers.map((inf) => (
                <div key={inf.id} className="bg-gray-800/50 rounded-xl p-3">
                  <div className="text-center mb-2">
                    <span className="text-xs text-gray-500">@{inf.handle}</span>
                  </div>
                  {inf.history && inf.history.length > 0 ? (
                    <MetricsChart
                      data={inf.history.map(h => ({ value: h.points, date: h.date }))}
                      height={60}
                      width={200}
                      color="cyan"
                      showTrend={false}
                    />
                  ) : (
                    <div className="h-[60px] flex items-center justify-center text-xs text-gray-600">
                      No history data
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verdict Section */}
          <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Quick Analysis</h4>
            <div className="text-xs text-gray-400 space-y-1">
              {influencers.length > 0 && (() => {
                const bestPoints = influencers.reduce((a, b) => a.totalPoints > b.totalPoints ? a : b);
                const bestValue = influencers.reduce((a, b) => (a.totalPoints / a.price) > (b.totalPoints / b.price) ? a : b);
                const bestGrowth = influencers.reduce((a, b) => a.weeklyTrend > b.weeklyTrend ? a : b);

                return (
                  <>
                    <p>
                      <span className="text-cyan-400">Top Performer:</span>{' '}
                      <span className="text-white">@{bestPoints.handle}</span> with {bestPoints.totalPoints} pts
                    </p>
                    <p>
                      <span className="text-emerald-400">Best Value:</span>{' '}
                      <span className="text-white">@{bestValue.handle}</span> at {bestValue.price} pts ({(bestValue.totalPoints / bestValue.price).toFixed(1)} pts/pt)
                    </p>
                    {bestGrowth.weeklyTrend > 0 && (
                      <p>
                        <span className="text-gold-400">Trending Up:</span>{' '}
                        <span className="text-white">@{bestGrowth.handle}</span> +{bestGrowth.weeklyTrend.toFixed(1)}% this week
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
