/**
 * InfluencerDetailModal
 * Full-screen detail view for influencer with weekly history, trends, and community picks
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  TrendUp,
  TrendDown,
  Binoculars,
  Check,
  XLogo,
  Users,
  Lightning,
  Star,
  Fire,
  Warning,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { getAvatarUrl } from '../../utils/avatar';
import { useToast } from '../../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  handle: string;
  name: string;
  avatar: string | null;
  tier: string;
  price: number;
  totalPoints: number;
  followers: number;
  engagementRate: number;
  isScouted?: boolean;
}

interface WeeklyMetric {
  week: number;
  tweets: number;
  likes: number;
  retweets: number;
  estimatedPoints: number;
  trend: 'up' | 'down' | 'stable';
}

interface InfluencerDetail extends Influencer {
  trends: {
    followers: number;
    engagement: number;
  };
  metrics: Array<{
    followers: number;
    engagementRate: number;
    likes: number;
    retweets: number;
    date: string;
  }>;
  recentTweets: Array<{
    id: string;
    tweetId: string;
    text: string;
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    engagementScore: number;
    createdAt: string;
  }>;
}

interface InfluencerDetailModalProps {
  influencer: Influencer;
  onClose: () => void;
  onScout?: (id: number, name: string) => void;
  scouting?: boolean;
  communityPickCount?: number;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-gold-500/20', text: 'text-gold-400', border: 'border-gold-500/40' },
  A: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  B: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  C: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
};

export default function InfluencerDetailModal({
  influencer,
  onClose,
  onScout,
  scouting = false,
  communityPickCount = 0,
}: InfluencerDetailModalProps) {
  const { showToast } = useToast();
  const tierStyle = TIER_STYLES[influencer.tier] || TIER_STYLES.C;

  const [detail, setDetail] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [influencer.id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/api/intel/influencers/${influencer.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        setDetail(res.data.data.influencer);
        setError(null);
      }
    } catch (err) {
      console.error('[InfluencerDetailModal] Error fetching:', err);
      setError('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getConsistencyLabel = (): string => {
    if (!detail || !detail.trends) return 'Stable';
    const engagementTrend = detail.trends.engagement;
    if (engagementTrend > 5) return 'Rising';
    if (engagementTrend < -5) return 'Declining';
    if (Math.abs(engagementTrend) > 2) return 'Volatile';
    return 'Stable';
  };

  const getConsistencyColor = (): string => {
    const label = getConsistencyLabel();
    if (label === 'Rising') return 'text-emerald-400';
    if (label === 'Declining') return 'text-rose-400';
    if (label === 'Volatile') return 'text-orange-400';
    return 'text-cyan-400';
  };

  const handleScout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScout) {
      onScout(influencer.id, influencer.name);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <img
              src={getAvatarUrl(influencer.handle, influencer.avatar)}
              alt={influencer.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-white truncate">{influencer.name}</h2>
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${tierStyle.bg} ${tierStyle.text}`}>
                  {influencer.tier}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">@{influencer.handle}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span className={getConsistencyColor()}>{getConsistencyLabel()}</span>
                <span>•</span>
                <span>{influencer.price} pts</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading details...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <Warning size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-gray-400 text-sm mb-3">{error}</p>
              <button
                onClick={fetchDetail}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs"
              >
                <ArrowClockwise size={14} />
                Try again
              </button>
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-medium text-white">{formatNumber(detail.followers)}</div>
                  <div className="text-[10px] text-gray-500">Followers</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-medium text-white">{detail.engagementRate.toFixed(1)}%</div>
                  <div className="text-[10px] text-gray-500">Engagement</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-medium text-white">{detail.totalPoints}</div>
                  <div className="text-[10px] text-gray-500">Points</div>
                </div>
              </div>

              {/* Community Picks */}
              {communityPickCount > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5">
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                    <Fire size={16} weight="fill" />
                    {communityPickCount} players drafted this week
                  </div>
                </div>
              )}

              {/* Trend Summary */}
              <div className="bg-gray-800/30 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Trend Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs text-gray-400">Avg Weekly:</span>
                    <span className="text-sm font-medium text-white">{Math.round(detail.totalPoints / 4)} pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={detail.trends.followers > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {detail.trends.followers > 0 ? (
                        <TrendUp size={14} weight="bold" />
                      ) : (
                        <TrendDown size={14} weight="bold" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">Followers:</span>
                    <span className={`text-sm font-medium ${detail.trends.followers > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {detail.trends.followers > 0 ? '+' : ''}{formatNumber(detail.trends.followers)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Tweets */}
              {detail.recentTweets && detail.recentTweets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2.5">Recent Tweets</h3>
                  <div className="space-y-2">
                    {detail.recentTweets.slice(0, 3).map((tweet) => (
                      <a
                        key={tweet.id}
                        href={`https://x.com/${influencer.handle}/status/${tweet.tweetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-800 rounded-lg transition-colors"
                      >
                        <p className="text-xs text-gray-300 line-clamp-2 mb-1.5">{tweet.text}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>❤️ {formatNumber(tweet.likes)}</span>
                          <span>🔄 {formatNumber(tweet.retweets)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && detail && (
          <div className="flex items-center gap-2 p-4 sm:p-6 border-t border-gray-800 flex-shrink-0 bg-gray-950">
            <button
              onClick={handleScout}
              disabled={scouting}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                detail.isScouted
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
              }`}
            >
              {scouting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : detail.isScouted ? (
                <>
                  <Check size={16} weight="bold" />
                  Scouted
                </>
              ) : (
                <>
                  <Binoculars size={16} />
                  Scout
                </>
              )}
            </button>

            <a
              href={`https://x.com/${influencer.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-12 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XLogo size={18} weight="fill" className="text-white" />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
