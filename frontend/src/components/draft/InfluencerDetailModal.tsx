/**
 * InfluencerDetailModal - Shows detailed stats for an influencer
 */

import { X, TwitterLogo, TrendUp, Users, Fire, ChartLineUp, Crown } from '@phosphor-icons/react';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
  follower_count?: number;
  engagement_rate?: number;
  total_points?: number;
  avg_likes?: number;
  avg_retweets?: number;
}

interface Props {
  influencer: Influencer;
  isSelected: boolean;
  isCaptain: boolean;
  canAfford: boolean;
  onClose: () => void;
  onSelect: () => void;
  onSetCaptain?: () => void;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-gold-500/20', text: 'text-gold-400', border: 'border-gold-500' },
  A: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500' },
  B: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500' },
  C: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' },
};

export default function InfluencerDetailModal({
  influencer,
  isSelected,
  isCaptain,
  canAfford,
  onClose,
  onSelect,
  onSetCaptain,
}: Props) {
  const tier = TIER_STYLES[influencer.tier] || TIER_STYLES.C;

  const formatNumber = (n: number | undefined) => {
    if (!n) return '—';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header with close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Profile Header */}
        <div className={`p-6 ${tier.bg} border-b ${tier.border}`}>
          <div className="flex items-center gap-4">
            {influencer.profile_image_url ? (
              <img
                src={influencer.profile_image_url}
                alt={influencer.handle}
                className="w-20 h-20 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                <Users size={32} className="text-gray-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${tier.bg} ${tier.text} border ${tier.border}`}>
                  {influencer.tier}-TIER
                </span>
                {isCaptain && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-gold-500 text-gray-950 flex items-center gap-1">
                    <Crown size={10} weight="fill" />
                    CAPTAIN
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{influencer.name || `@${influencer.handle}`}</h2>
              <a
                href={`https://twitter.com/${influencer.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-sm"
              >
                <TwitterLogo size={14} weight="fill" />
                @{influencer.handle}
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={<Users size={18} />}
              label="Followers"
              value={formatNumber(influencer.follower_count)}
              color="text-gray-400"
            />
            <StatCard
              icon={<TrendUp size={18} />}
              label="Engagement"
              value={influencer.engagement_rate ? `${influencer.engagement_rate.toFixed(2)}%` : '—'}
              color="text-cyan-400"
            />
            <StatCard
              icon={<Fire size={18} />}
              label="Total Points"
              value={formatNumber(influencer.total_points)}
              color="text-gold-400"
            />
            <StatCard
              icon={<ChartLineUp size={18} />}
              label="Salary"
              value={`$${influencer.price}`}
              color="text-emerald-400"
            />
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Performance Summary</h3>
            <p className="text-sm text-gray-300">
              {influencer.tier === 'S' && 'Elite performer. Consistently high engagement and viral potential. Premium price but worth it for your captain slot.'}
              {influencer.tier === 'A' && 'Strong performer with above-average engagement. Great value for building a competitive team.'}
              {influencer.tier === 'B' && 'Solid mid-tier option. Reliable points with occasional breakout games.'}
              {influencer.tier === 'C' && 'Budget-friendly pick. Lower ceiling but allows flexibility in your lineup.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isSelected ? (
              <>
                <button
                  onClick={onSelect}
                  className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium rounded-lg"
                >
                  Remove from Team
                </button>
                {!isCaptain && onSetCaptain && (
                  <button
                    onClick={() => {
                      onSetCaptain();
                      onClose();
                    }}
                    className="flex-1 py-3 bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/50 text-gold-400 font-medium rounded-lg flex items-center justify-center gap-2"
                  >
                    <Crown size={18} weight="fill" />
                    Make Captain
                  </button>
                )}
              </>
            ) : canAfford ? (
              <button
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 font-medium rounded-lg"
              >
                Add to Team (${influencer.price})
              </button>
            ) : (
              <button
                disabled
                className="flex-1 py-3 bg-gray-800 text-gray-500 font-medium rounded-lg cursor-not-allowed"
              >
                Over Budget
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className={`flex items-center gap-2 ${color} mb-1`}>
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}
