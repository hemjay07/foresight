/**
 * InfluencerProfileCard
 * Compact card for displaying influencer data in Intel Profiles tab
 */

import { useState } from 'react';
import {
  TwitterLogo,
  TrendUp,
  TrendDown,
  Users,
  Lightning,
  Binoculars,
  Check,
  Star,
} from '@phosphor-icons/react';

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
  isCompareMode?: boolean;
  isSelected?: boolean;
  scouting?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-gold-500/20', text: 'text-gold-400', border: 'border-gold-500/40' },
  A: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  B: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  C: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
};

export default function InfluencerProfileCard({
  influencer,
  onScout,
  onSelect,
  isCompareMode = false,
  isSelected = false,
  scouting = false,
}: InfluencerProfileCardProps) {
  const tierStyle = TIER_STYLES[influencer.tier] || TIER_STYLES.C;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const handleClick = () => {
    if (isCompareMode && onSelect) {
      onSelect(influencer);
    }
  };

  const handleScout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScout) {
      onScout(influencer.id, influencer.name);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-xl border transition-all
        ${isCompareMode ? 'cursor-pointer hover:border-cyan-500/50' : ''}
        ${isSelected ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}
      `}
    >
      {/* Selection indicator */}
      {isCompareMode && isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
          <Check size={12} weight="bold" className="text-gray-950" />
        </div>
      )}

      {/* Header: Avatar + Name + Tier */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {influencer.avatar ? (
            <img
              src={influencer.avatar}
              alt={influencer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <TwitterLogo size={20} weight="fill" className="text-white" />
            </div>
          )}
          {/* Tier badge overlay */}
          <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
            {influencer.tier}
          </div>
        </div>

        {/* Name + Handle */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{influencer.name}</h3>
          <p className="text-sm text-gray-500 truncate">@{influencer.handle}</p>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-lg font-bold text-white">${influencer.price}</div>
          <div className="text-xs text-gray-500">price</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Followers */}
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={12} className="text-gray-500" />
            {influencer.trends && influencer.trends.followers !== 0 && (
              influencer.trends.followers > 0 ? (
                <TrendUp size={10} className="text-emerald-400" />
              ) : (
                <TrendDown size={10} className="text-rose-400" />
              )
            )}
          </div>
          <div className="text-sm font-medium text-white">{formatNumber(influencer.followers)}</div>
          <div className="text-[10px] text-gray-500">Followers</div>
        </div>

        {/* Engagement */}
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Lightning size={12} className="text-gray-500" />
            {influencer.trends && influencer.trends.engagement !== 0 && (
              influencer.trends.engagement > 0 ? (
                <TrendUp size={10} className="text-emerald-400" />
              ) : (
                <TrendDown size={10} className="text-rose-400" />
              )
            )}
          </div>
          <div className="text-sm font-medium text-white">{influencer.engagementRate.toFixed(1)}%</div>
          <div className="text-[10px] text-gray-500">Engagement</div>
        </div>

        {/* Points */}
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star size={12} className="text-gold-400" />
          </div>
          <div className="text-sm font-medium text-white">{influencer.totalPoints}</div>
          <div className="text-[10px] text-gray-500">Points</div>
        </div>
      </div>

      {/* Actions */}
      {!isCompareMode && (
        <div className="flex items-center gap-2">
          {/* Scout Button */}
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
              <>
                <Check size={14} weight="bold" />
                Scouted
              </>
            ) : (
              <>
                <Binoculars size={14} />
                Scout
              </>
            )}
          </button>

          {/* Twitter Link */}
          <a
            href={`https://twitter.com/${influencer.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <TwitterLogo size={18} weight="fill" className="text-[#1DA1F2]" />
          </a>
        </div>
      )}

      {/* Compare mode action hint */}
      {isCompareMode && !isSelected && (
        <div className="text-center text-xs text-gray-500 mt-2">
          Click to add to comparison
        </div>
      )}
    </div>
  );
}
