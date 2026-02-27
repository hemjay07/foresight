/**
 * Foresight Score Display Component
 * Shows user's FS data, tier, multiplier, and progress
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Star, Crown, Lightning, TrendUp, Medal, Diamond,
  Trophy, Fire, ArrowRight, Sparkle, Users
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import { API_URL } from '../config/api';

interface TierProgress {
  currentTier: string;
  nextTier: string | null;
  currentThreshold: number;
  nextThreshold: number;
  progress: number;
  fsToNextTier: number;
}

interface FSData {
  userId: string;
  totalScore: number;
  seasonScore: number;
  weekScore: number;
  referralScore: number;
  tier: string;
  tierMultiplier: number;
  allTimeRank: number | null;
  seasonRank: number | null;
  weekRank: number | null;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  earlyAdopterTier: string | null;
  effectiveMultiplier: number;
  multiplierActive: boolean;
  multiplierDaysRemaining: number;
  tierProgress: TierProgress;
}

interface Props {
  variant?: 'full' | 'compact' | 'minimal';
  showLeaderboardLink?: boolean;
  hideEmptyState?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  bronze: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    gradient: 'from-orange-600/20 to-orange-500/5',
    icon: Medal
  },
  silver: {
    color: 'text-gray-300',
    bg: 'bg-gray-400/20',
    border: 'border-gray-400/30',
    gradient: 'from-gray-400/20 to-gray-300/5',
    icon: Medal
  },
  gold: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-500/20 to-yellow-400/5',
    icon: Star
  },
  platinum: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500/20 to-cyan-400/5',
    icon: Crown
  },
  diamond: {
    color: 'text-gold-400',
    bg: 'bg-gold-500/20',
    border: 'border-gold-500/30',
    gradient: 'from-gold-500/20 to-gold-400/5',
    icon: Diamond
  },
} as const;

export default function ForesightScoreDisplay({
  variant = 'full',
  showLeaderboardLink = true,
  hideEmptyState = false,
  className = ''
}: Props) {
  const { address, isConnected } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fsData, setFsData] = useState<FSData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchFSData();
    } else {
      setLoading(false);
      setFsData(null);
    }
  }, [isConnected, address]);

  const fetchFSData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/v2/fs/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFsData(response.data.data);
      }
    } catch (err: any) {
      // Not authenticated or no FS record yet - not an error state for UI
      if (err.response?.status === 401 || err.response?.status === 404) {
        setFsData(null);
      } else {
        console.error('Error fetching FS data:', err);
        setError('Failed to load score data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    if (variant === 'minimal') return null;

    return (
      <div className={`bg-gray-900/50 rounded-xl border border-gray-800 p-6 ${className}`}>
        <div className="text-center">
          <Sparkle size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm mb-4">Sign in to track your Foresight Score</p>
        </div>
      </div>
    );
  }

  // Loading state - don't show skeleton for minimal variant (prevents header flash)
  if (loading) {
    if (variant === 'minimal') return null;

    return (
      <div className={`bg-gray-900/50 rounded-xl border border-gray-800 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-800 rounded w-32"></div>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Error state — minimal variant renders nothing (avoids broken navbar UI)
  if (error) {
    if (variant === 'minimal') return null;
    return (
      <div className={`bg-gray-900/50 rounded-xl border border-gray-800 p-4 ${className}`}>
        <p className="text-gray-500 text-sm text-center">Score unavailable</p>
      </div>
    );
  }

  // No data yet (new user)
  if (!fsData) {
    if (hideEmptyState || variant === 'minimal') {
      return null;
    }
    return (
      <div className={`bg-gradient-to-br from-gold-600/20 via-gold-500/10 to-transparent rounded-xl border border-gold-500/30 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
            <Lightning size={28} className="text-gold-400" weight="fill" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Start Earning Foresight Score</h3>
          <p className="text-gray-400 text-sm mb-4">
            Complete quests, win contests, and climb the leaderboard!
          </p>
          <Link to="/quests" className="btn-primary btn-sm inline-flex">
            View Quests
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[fsData.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
  const TierIcon = tierConfig.icon;

  // Minimal variant - just score and tier badge
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${tierConfig.bg} ${tierConfig.border} border`}>
          <TierIcon size={14} weight="fill" className={tierConfig.color} />
          <span className={`text-sm font-mono font-bold ${tierConfig.color}`}>
            {fsData.totalScore.toLocaleString()} FS
          </span>
        </div>
      </div>
    );
  }

  // Compact variant - score, tier, and rank
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r ${tierConfig.gradient} rounded-xl border ${tierConfig.border} p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${tierConfig.bg} flex items-center justify-center`}>
              <TierIcon size={24} weight="fill" className={tierConfig.color} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Foresight Score</div>
              <div className={`text-2xl font-mono font-bold ${tierConfig.color} tabular-nums`}>
                {fsData.totalScore.toLocaleString()}
                <span className="text-sm font-sans font-normal text-gray-400 ml-1">FS</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs px-2 py-0.5 rounded ${tierConfig.bg} ${tierConfig.color} font-semibold uppercase tracking-wide`}>
              {fsData.tier}
            </div>
            {fsData.allTimeRank && (
              <div className="text-xs font-mono text-gray-500 mt-1">
                #{fsData.allTimeRank}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant - all details
  return (
    <div className={`bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header with tier gradient */}
      <div className={`bg-gradient-to-r ${tierConfig.gradient} p-4 border-b border-gray-800`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${tierConfig.bg} border ${tierConfig.border} flex items-center justify-center shrink-0`}>
              <TierIcon size={28} weight="fill" className={tierConfig.color} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded ${tierConfig.bg} ${tierConfig.color} font-semibold uppercase tracking-widest`}>
                  {fsData.tier}
                </span>
                {fsData.isFoundingMember && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-semibold flex items-center gap-1">
                    <Star size={9} weight="fill" />
                    Founder #{fsData.foundingMemberNumber}
                  </span>
                )}
              </div>
              {/* Hero score number — monospace, big */}
              <div className={`text-3xl font-mono font-bold tabular-nums leading-none ${tierConfig.color}`}>
                {fsData.totalScore.toLocaleString()}
                <span className="text-sm font-sans font-normal text-gray-400 ml-1.5">FS</span>
              </div>
            </div>
          </div>

          {/* Multiplier display */}
          {fsData.effectiveMultiplier > 1 && (
            <div className="text-right shrink-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Boost</div>
              <div className="flex items-center gap-1 text-neon-500 font-mono font-bold">
                <Lightning size={14} weight="fill" />
                {fsData.effectiveMultiplier.toFixed(2)}x
              </div>
              {fsData.multiplierDaysRemaining > 0 && (
                <div className="text-[10px] text-gray-600 font-mono">{fsData.multiplierDaysRemaining}d left</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress to next tier */}
      {fsData.tierProgress.nextTier && (
        <div className="px-4 py-3 border-b border-gray-800/60">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-gray-400">→ {fsData.tierProgress.nextTier}</span>
            <span className="font-mono text-gray-500">
              {fsData.tierProgress.fsToNextTier.toLocaleString()} FS to go
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700`}
              style={{ width: `${Math.min(100, fsData.tierProgress.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats grid — all numbers monospace */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">This Week</div>
          <div className="font-mono font-bold text-white tabular-nums">
            +{fsData.weekScore.toLocaleString()}
          </div>
          {fsData.weekRank && (
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">#{fsData.weekRank}</div>
          )}
        </div>
        <div className="text-center border-x border-gray-800">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Season</div>
          <div className="font-mono font-bold text-white tabular-nums">{fsData.seasonScore.toLocaleString()}</div>
          {fsData.seasonRank && (
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">#{fsData.seasonRank}</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">All-Time</div>
          <div className="font-mono font-bold text-white tabular-nums">
            {fsData.allTimeRank ? `#${fsData.allTimeRank}` : '—'}
          </div>
        </div>
      </div>

      {/* Tapestry verification badge */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-gray-600 flex items-center gap-1">
          <Sparkle size={9} weight="fill" className="text-gold-400/50" />
          Scores verified on Tapestry Protocol · Solana
        </p>
      </div>

      {/* Footer with links */}
      {showLeaderboardLink && (
        <div className="px-4 pb-4 pt-0 flex gap-2">
          <Link
            to="/compete?tab=rankings&type=fs"
            className="flex-1 btn-secondary btn-sm justify-center"
          >
            <Trophy size={14} />
            Rankings
          </Link>
          <Link
            to="/progress"
            className="flex-1 btn-secondary btn-sm justify-center"
          >
            <Fire size={14} />
            Earn More
          </Link>
        </div>
      )}
    </div>
  );
}
