/**
 * InfluencerProfileCard
 * Compact card for displaying influencer data in Intel Profiles tab
 */

import {
  XLogo,
  TrendUp,
  TrendDown,
  Users,
  Lightning,
  Binoculars,
  Check,
  Star,
  Diamond,
  ThumbsUp,
  Minus,
  Fire,
} from '@phosphor-icons/react';
import { getAvatarUrl } from '../../utils/avatar';

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
  trends?: {
    followers: number;
    engagement: number;
  };
}

interface InfluencerProfileCardProps {
  influencer: Influencer;
  onScout?: (id: number, name: string) => void;
  onSelect?: (influencer: Influencer) => void;
  onOpenDetail?: (influencer: Influencer) => void;
  isCompareMode?: boolean;
  isSelected?: boolean;
  scouting?: boolean;
  draftCount?: number;
}

// Tier visual tokens — badge only; color lives here and nowhere else on the card
const TIER_CONFIG: Record<string, {
  badge: string;  // badge text + bg
  label: string;  // human label
}> = {
  S: {
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    label: 'S-Tier',
  },
  A: {
    badge: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
    label: 'A-Tier',
  },
  B: {
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    label: 'B-Tier',
  },
  C: {
    badge: 'bg-gray-500/20 text-gray-400 border border-gray-600/40',
    label: 'C-Tier',
  },
};

// Points ceiling per tier — used to scale the progress bar
const TIER_MAX_POINTS: Record<string, number> = {
  S: 1500,
  A: 1000,
  B: 700,
  C: 400,
};

// Bar color encodes performance relative to tier ceiling (not tier identity)
function getBarColor(pct: number): string {
  if (pct >= 85) return 'bg-emerald-500';  // elite — filling their tier ceiling
  if (pct >= 60) return 'bg-amber-400';    // strong performer
  if (pct >= 30) return 'bg-gray-400';     // average
  return 'bg-rose-500';                     // underperforming relative to tier
}

// Value label: icon + text only, no color — supplementary info whispers
function valueLabel(ptsPerDollar: number): { Icon: React.ElementType; label: string } {
  if (ptsPerDollar >= 45) return { Icon: Diamond,   label: 'Elite value' };
  if (ptsPerDollar >= 28) return { Icon: ThumbsUp,  label: 'Good value'  };
  if (ptsPerDollar >= 15) return { Icon: Minus,     label: 'Fair'        };
  return                         { Icon: TrendDown, label: 'Expensive'   };
}

export default function InfluencerProfileCard({
  influencer,
  onScout,
  onSelect,
  onOpenDetail,
  isCompareMode = false,
  isSelected = false,
  scouting = false,
  draftCount = 0,
}: InfluencerProfileCardProps) {
  const tier = influencer.tier in TIER_CONFIG ? influencer.tier : 'C';
  const tc = TIER_CONFIG[tier];
  const maxPts = TIER_MAX_POINTS[tier] ?? 400;
  const barPct = Math.min(100, Math.round((influencer.totalPoints / maxPts) * 100));
  const ptsPerDollar = influencer.price > 0
    ? Math.round(influencer.totalPoints / influencer.price)
    : 0;
  const { Icon: ValIcon, label: valLabel } = valueLabel(ptsPerDollar);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const handleCardClick = () => {
    if (isCompareMode && onSelect) onSelect(influencer);
    else if (!isCompareMode && onOpenDetail) onOpenDetail(influencer);
  };

  const handleScout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScout) onScout(influencer.id, influencer.name);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        relative rounded-xl border transition-all overflow-hidden cursor-pointer
        ${isSelected
          ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30'
          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/80'}
      `}
    >
      {/* Selection checkmark (compare mode) */}
      {isCompareMode && isSelected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center z-10">
          <Check size={11} weight="bold" className="text-gray-950" />
        </div>
      )}

      <div className="p-4">
        {/* Header: Avatar · Name · Tier · Price */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar with tier badge overlay */}
          <div className="relative flex-shrink-0">
            <img
              src={getAvatarUrl(influencer.handle, influencer.avatar)}
              alt={influencer.name}
              className="w-11 h-11 rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded text-[9px] font-bold leading-none ${tc.badge}`}>
              {tier}
            </div>
          </div>

          {/* Name + handle */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {influencer.name}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">@{influencer.handle}</p>
            {draftCount > 0 && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-400 font-medium">
                <Fire size={10} weight="fill" />
                {draftCount} drafted
              </span>
            )}
          </div>

          {/* Draft cost */}
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-white leading-tight">{influencer.price} <span className="text-sm font-normal text-gray-400">pts</span></div>
            <div className="text-[10px] font-medium mt-0.5 text-gray-500">
              {ptsPerDollar > 0 ? `${ptsPerDollar} pts/pt` : ''}
            </div>
          </div>
        </div>

        {/* Points bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Star size={11} weight="fill" className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Points</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {influencer.totalPoints.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-500">
                <ValIcon size={10} weight="fill" />
                {valLabel}
              </span>
            </div>
          </div>
          {/* Bar track — color encodes performance strength, width encodes magnitude */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(barPct)}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>

        {/* Followers + engagement inline row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {formatNumber(influencer.followers)}
            {influencer.trends?.followers !== undefined && influencer.trends.followers !== 0 && (
              influencer.trends.followers > 0
                ? <TrendUp size={10} className="text-emerald-400" />
                : <TrendDown size={10} className="text-rose-400" />
            )}
          </span>
          <span className="flex items-center gap-1">
            <Lightning size={11} />
            {influencer.engagementRate.toFixed(1)}% eng
            {influencer.trends?.engagement !== undefined && influencer.trends.engagement !== 0 && (
              influencer.trends.engagement > 0
                ? <TrendUp size={10} className="text-emerald-400" />
                : <TrendDown size={10} className="text-rose-400" />
            )}
          </span>
        </div>

        {/* Actions */}
        {!isCompareMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleScout}
              disabled={scouting}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                influencer.isScouted
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
              }`}
            >
              {scouting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : influencer.isScouted ? (
                <><Check size={13} weight="bold" />Scouted</>
              ) : (
                <><Binoculars size={13} />Scout</>
              )}
            </button>
            <a
              href={`https://x.com/${influencer.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center w-9 h-9 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XLogo size={16} weight="fill" className="text-white" />
            </a>
          </div>
        )}

        {isCompareMode && !isSelected && (
          <div className="text-center text-xs text-gray-600 mt-1">
            Click to compare
          </div>
        )}
      </div>
    </div>
  );
}
