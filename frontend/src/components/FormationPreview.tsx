/**
 * Formation Preview Component
 * Shows a simplified 5-person football pitch formation
 * Used on landing page to instantly communicate the product
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Crown, Users } from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  name: string;
  twitter_handle?: string;
  handle?: string;
  tier: string;
  profile_image_url?: string;
  price?: number;
  total_points?: number;
}

interface FormationPreviewProps {
  variant?: 'hero' | 'compact' | 'team';
  showStats?: boolean;
  className?: string;
  /** If provided, shows this team instead of fetching sample data */
  team?: Influencer[];
  /** Callback when clicking the edit button */
  onEdit?: () => void;
  /** Show edit button */
  showEdit?: boolean;
}

// Example team for when API fails or is loading
const EXAMPLE_TEAM: Influencer[] = [
  { id: 1, name: 'CT Legend', twitter_handle: 'ctlegend', tier: 'S', price: 45 },
  { id: 2, name: 'Alpha Caller', twitter_handle: 'alphacaller', tier: 'A', price: 35 },
  { id: 3, name: 'Gem Hunter', twitter_handle: 'gemhunter', tier: 'A', price: 30 },
  { id: 4, name: 'Chart Master', twitter_handle: 'chartmaster', tier: 'B', price: 25 },
  { id: 5, name: 'Degen Pro', twitter_handle: 'degenpro', tier: 'C', price: 15 },
];

export default function FormationPreview({
  variant = 'hero',
  showStats = true,
  className = '',
  team,
  onEdit,
  showEdit = false,
}: FormationPreviewProps) {
  const [influencers, setInfluencers] = useState<Influencer[]>(team || EXAMPLE_TEAM);
  const [loading, setLoading] = useState(!team);

  useEffect(() => {
    // If team is provided, use it directly
    if (team && team.length >= 5) {
      setInfluencers(team);
      setLoading(false);
      return;
    }

    // Only fetch sample data for hero variant when no team provided
    if (team) return;

    const fetchTopInfluencers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/league/influencers`);
        if (res.data.influencers && res.data.influencers.length >= 5) {
          // Get a mix of tiers for the preview
          const all = res.data.influencers;
          const sTier = all.filter((i: Influencer) => i.tier === 'S')[0];
          const aTier = all.filter((i: Influencer) => i.tier === 'A').slice(0, 2);
          const bTier = all.filter((i: Influencer) => i.tier === 'B')[0];
          const cTier = all.filter((i: Influencer) => i.tier === 'C')[0];

          const teamData = [sTier, ...aTier, bTier, cTier].filter(Boolean);
          if (teamData.length >= 5) {
            setInfluencers(teamData.slice(0, 5));
          }
        }
      } catch (error) {
        // Use example team on error
      } finally {
        setLoading(false);
      }
    };

    fetchTopInfluencers();
  }, [team]);

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'S':
        return {
          bg: 'bg-gradient-to-br from-gold-400 to-amber-600',
          border: 'border-gold-400',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
          badge: 'bg-gold-500 text-gray-950',
        };
      case 'A':
        return {
          bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
          border: 'border-cyan-400',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
          badge: 'bg-cyan-500 text-white',
        };
      case 'B':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          border: 'border-emerald-400',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
          badge: 'bg-emerald-500 text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-500 to-gray-700',
          border: 'border-gray-400',
          glow: '',
          badge: 'bg-gray-500 text-white',
        };
    }
  };

  const renderPlayerCard = (influencer: Influencer, index: number, isCaptain: boolean = false) => {
    const colors = getTierColors(influencer.tier);
    const isLarge = variant === 'hero' || variant === 'team';

    return (
      <div
        key={influencer.id}
        className={`relative group transition-transform hover:scale-105 ${
          loading ? 'animate-pulse' : ''
        }`}
      >
        {/* Captain Crown */}
        {isCaptain && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gold-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-gold">
              <Crown size={12} weight="fill" className="text-gray-950" />
              <span className="text-[10px] font-bold text-gray-950">CPT</span>
            </div>
          </div>
        )}

        {/* Player Card */}
        <div className={`relative ${colors.bg} p-0.5 rounded-xl ${colors.glow} transition-all`}>
          <div className={`bg-gray-900 rounded-xl ${isLarge ? 'p-3 w-28 md:w-32' : 'p-2 w-20'}`}>
            {/* Avatar */}
            <div className={`relative mx-auto mb-2 ${isLarge ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10'}`}>
              <div className={`w-full h-full rounded-full border-2 ${colors.border} overflow-hidden bg-gray-800`}>
                {influencer.profile_image_url ? (
                  <img
                    src={influencer.profile_image_url}
                    alt={influencer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={isLarge ? 24 : 16} className="text-gray-500" />
                  </div>
                )}
              </div>
              {/* Tier Badge */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${colors.badge} px-1.5 py-0.5 rounded-full text-[10px] font-bold`}>
                {influencer.tier}
              </div>
            </div>

            {/* Name */}
            <h4 className={`text-center font-bold text-white truncate ${isLarge ? 'text-xs' : 'text-[10px]'}`}>
              {influencer.name.split(' ')[0]}
            </h4>
            <p className={`text-center text-gray-400 truncate ${isLarge ? 'text-[10px]' : 'text-[8px]'}`}>
              @{influencer.handle || influencer.twitter_handle}
            </p>

            {/* Stats (optional) */}
            {showStats && isLarge && (
              <div className="mt-2 pt-2 border-t border-gray-800 flex justify-center">
                <span className="text-[10px] text-gold-400 font-semibold">
                  {variant === 'team' && influencer.total_points !== undefined
                    ? `${influencer.total_points} pts`
                    : `${Math.round(influencer.price || 25)} pts`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isHero = variant === 'hero';
  const isTeamView = variant === 'team';
  const containerHeight = isHero || isTeamView ? 'min-h-[380px] md:min-h-[440px]' : 'min-h-[260px]';
  const gap = isHero || isTeamView ? 'gap-14 md:gap-20' : 'gap-8';

  return (
    <div className={`relative ${className}`}>
      {/* Edit Button */}
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 z-20 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-gray-950 font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path fill="currentColor" d="M227.31 73.37L182.63 28.68a16 16 0 0 0-22.63 0L36.69 152a16 16 0 0 0-4.47 9.06L24 218.67a8 8 0 0 0 9.26 9.26l57.69-8.14a16 16 0 0 0 9.06-4.47L223.31 96a16 16 0 0 0 0-22.63ZM92.69 208L40 215.93l8-52.69l104-104l44.69 44.69Z"/>
          </svg>
          Edit Team
        </button>
      )}

      {/* Pitch Background */}
      <div className={`relative rounded-2xl overflow-hidden ${containerHeight}`}>
        {/* Gradient Background — rich emerald pitch feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-gray-900/80 to-gray-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]"></div>

        {/* Pitch Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 md:w-52 h-36 md:h-52 border border-white/[0.07] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/10 rounded-full"></div>

          {/* Horizontal Line */}
          <div className="absolute top-1/2 left-8 right-8 h-px bg-white/[0.05]"></div>

          {/* Top & Bottom Arcs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 md:w-56 h-16 border-b border-l border-r border-white/[0.05] rounded-b-full"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 md:w-56 h-16 border-t border-l border-r border-white/[0.05] rounded-t-full"></div>
        </div>

        {/* Formation: 2-1-2 Layout */}
        <div className="relative z-10 h-full flex items-center justify-center py-8">
          <div className="space-y-8 md:space-y-10">
            {/* Top Row - 2 Forwards (S-tier + A-tier) */}
            <div className={`flex justify-center ${gap}`}>
              {renderPlayerCard(influencers[0], 0, true)} {/* Captain - S-tier */}
              {renderPlayerCard(influencers[1], 1)}
            </div>

            {/* Middle Row - 1 Midfielder (A-tier) */}
            <div className="flex justify-center">
              {renderPlayerCard(influencers[2], 2)}
            </div>

            {/* Bottom Row - 2 Defenders (B-tier + C-tier) */}
            <div className={`flex justify-center ${gap}`}>
              {renderPlayerCard(influencers[3], 3)}
              {renderPlayerCard(influencers[4], 4)}
            </div>
          </div>
        </div>

        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/[0.08] rounded-tl"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-white/[0.08] rounded-tr"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-white/[0.08] rounded-bl"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/[0.08] rounded-br"></div>
      </div>
    </div>
  );
}
