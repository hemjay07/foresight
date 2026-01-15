/**
 * ComparisonTool
 * Side-by-side comparison of 2-3 influencers
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Scales,
  Trophy,
  Users,
  Lightning,
  CurrencyDollar,
  TwitterLogo,
  Warning,
  ArrowClockwise,
  Crown,
  Target,
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ComparisonInfluencer {
  id: number;
  handle: string;
  name: string;
  avatar: string | null;
  tier: string;
  price: number;
  totalPoints: number;
  followers: number;
  engagementRate: number;
}

interface ComparisonStats {
  bestValue: number;
  mostFollowers: number;
  highestEngagement: number;
  mostPoints: number;
}

interface ComparisonData {
  influencers: ComparisonInfluencer[];
  comparison: ComparisonStats;
}

interface ComparisonToolProps {
  influencerIds: number[];
  onClose: () => void;
  onRemove: (id: number) => void;
}

export default function ComparisonTool({ influencerIds, onClose, onRemove }: ComparisonToolProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data
  const fetchComparison = async () => {
    if (influencerIds.length < 2) {
      setError('Select at least 2 influencers to compare');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/intel/compare`, {
        params: { ids: influencerIds.join(',') },
      });

      if (res.data.success) {
        setData(res.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('[ComparisonTool] Error:', err);
      setError('Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [influencerIds]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'text-gold-400 bg-gold-500/20 border-gold-500/40';
      case 'A': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
      case 'B': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-400">Loading comparison...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scales size={24} className="text-cyan-400" />
              Compare Influencers
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="py-12 text-center">
            <Warning size={40} className="mx-auto mb-3 text-red-400" />
            <p className="text-gray-400 mb-4">{error || 'Failed to load comparison'}</p>
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

  const { influencers, comparison } = data;

  // Stats to compare
  const stats = [
    {
      key: 'totalPoints',
      label: 'Total Points',
      icon: Trophy,
      format: (v: number) => (v ?? 0).toLocaleString(),
      winnerId: comparison.mostPoints,
      color: 'gold',
    },
    {
      key: 'price',
      label: 'Price',
      icon: CurrencyDollar,
      format: (v: number) => `$${v ?? 0}M`,
      winnerId: comparison.bestValue,
      color: 'emerald',
      invert: true, // Lower is better for value
    },
    {
      key: 'followers',
      label: 'Followers',
      icon: Users,
      format: (v: number) => formatNumber(v ?? 0),
      winnerId: comparison.mostFollowers,
      color: 'cyan',
    },
    {
      key: 'engagementRate',
      label: 'Engagement',
      icon: Lightning,
      format: (v: number) => `${(v ?? 0).toFixed(2)}%`,
      winnerId: comparison.highestEngagement,
      color: 'purple',
    },
  ];

  return (
    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scales size={24} className="text-cyan-400" />
            Compare Influencers
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Influencer Headers */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${influencers.length}, 1fr)` }}>
            {/* Empty corner cell */}
            <div></div>

            {/* Influencer cards */}
            {influencers.map((inf) => (
              <div key={inf.id} className="relative">
                <button
                  onClick={() => onRemove(inf.id)}
                  className="absolute -top-2 -right-2 p-1 bg-gray-800 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-rose-500 z-10"
                >
                  <X size={12} />
                </button>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  {/* Avatar */}
                  <div className="relative w-16 h-16 mx-auto mb-3">
                    {inf.avatar ? (
                      <img src={inf.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <TwitterLogo size={24} weight="fill" className="text-white" />
                      </div>
                    )}
                    {/* Best value indicator */}
                    {comparison.bestValue === inf.id && (
                      <div className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full">
                        <Target size={10} className="text-white" weight="fill" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-white truncate mb-1">
                    {inf.name || `@${inf.handle}`}
                  </h3>
                  <a
                    href={`https://twitter.com/${inf.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-[#1DA1F2]"
                  >
                    @{inf.handle}
                  </a>

                  {/* Tier Badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getTierColor(inf.tier)}`}>
                      {inf.tier}-Tier
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Comparison Table */}
          <div className="mt-6 space-y-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const values = influencers.map(inf => (inf as any)[stat.key] as number);
              const maxValue = Math.max(...values);
              const minValue = Math.min(...values);

              return (
                <div
                  key={stat.key}
                  className="grid gap-4 items-center"
                  style={{ gridTemplateColumns: `150px repeat(${influencers.length}, 1fr)` }}
                >
                  {/* Stat Label */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon size={16} />
                    {stat.label}
                  </div>

                  {/* Values */}
                  {influencers.map((inf) => {
                    const value = (inf as any)[stat.key] as number;
                    const isWinner = stat.winnerId === inf.id;
                    const isBest = stat.invert ? value === minValue : value === maxValue;

                    return (
                      <div
                        key={inf.id}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          isWinner
                            ? 'bg-gold-500/10 border border-gold-500/30'
                            : isBest
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-gray-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isWinner && <Crown size={14} className="text-gold-400" weight="fill" />}
                          <span className={`font-semibold ${isWinner ? 'text-gold-400' : isBest ? 'text-emerald-400' : 'text-white'}`}>
                            {stat.format(value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-gold-400" />
              Quick Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Best Value:</span>
                <span className="ml-2 text-emerald-400 font-medium">
                  @{influencers.find(i => i.id === comparison.bestValue)?.handle || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Most Points:</span>
                <span className="ml-2 text-gold-400 font-medium">
                  @{influencers.find(i => i.id === comparison.mostPoints)?.handle || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Most Followers:</span>
                <span className="ml-2 text-cyan-400 font-medium">
                  @{influencers.find(i => i.id === comparison.mostFollowers)?.handle || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Best Engagement:</span>
                <span className="ml-2 text-purple-400 font-medium">
                  @{influencers.find(i => i.id === comparison.highestEngagement)?.handle || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
