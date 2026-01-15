/**
 * Foresight Score Display Component
 * Shows user's FS data, tier, multiplier, and progress
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  Star, Crown, Lightning, TrendUp, Medal, Diamond,
  Trophy, Fire, ArrowRight, Sparkle, Users
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500/20 to-purple-400/5',
    icon: Diamond
  },
} as const;

export default function ForesightScoreDisplay({
  variant = 'full',
  showLeaderboardLink = true,
  hideEmptyState = false,
  className = ''
}: Props) {
  const { address, isConnected } = useAccount();
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
          <p className="text-gray-400 text-sm mb-4">Connect wallet to track your Foresight Score</p>
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

  // Error state
  if (error) {
    return (
      <div className={`bg-gray-900/50 rounded-xl border border-red-800/50 p-6 ${className}`}>
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  // No data yet (new user)
  if (!fsData) {
    if (hideEmptyState || variant === 'minimal') {
      return null;
    }
    return (
      <div className={`bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-transparent rounded-xl border border-brand-500/30 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <Lightning size={28} className="text-brand-400" weight="fill" />
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
          <span className={`text-sm font-bold ${tierConfig.color}`}>
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
              <div className="text-xs text-gray-400 uppercase tracking-wide">Foresight Score</div>
              <div className={`text-xl font-bold ${tierConfig.color}`}>
                {fsData.totalScore.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs px-2 py-0.5 rounded ${tierConfig.bg} ${tierConfig.color} font-medium uppercase`}>
              {fsData.tier}
            </div>
            {fsData.allTimeRank && (
              <div className="text-xs text-gray-500 mt-1">
                Rank #{fsData.allTimeRank}
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
            <div className={`w-12 h-12 rounded-xl ${tierConfig.bg} border ${tierConfig.border} flex items-center justify-center`}>
              <TierIcon size={28} weight="fill" className={tierConfig.color} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${tierConfig.bg} ${tierConfig.color} font-semibold uppercase`}>
                  {fsData.tier}
                </span>
                {fsData.isFoundingMember && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium flex items-center gap-1">
                    <Star size={10} weight="fill" />
                    Founder #{fsData.foundingMemberNumber}
                  </span>
                )}
              </div>
              <div className={`text-2xl font-bold ${tierConfig.color} mt-0.5`}>
                {fsData.totalScore.toLocaleString()} <span className="text-sm font-normal text-gray-400">FS</span>
              </div>
            </div>
          </div>

          {/* Multiplier display */}
          {fsData.effectiveMultiplier > 1 && (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-0.5">Active Boost</div>
              <div className="flex items-center gap-1 text-green-400 font-bold">
                <Lightning size={16} weight="fill" />
                {fsData.effectiveMultiplier.toFixed(2)}x
              </div>
              {fsData.multiplierDaysRemaining > 0 && (
                <div className="text-xs text-gray-500">{fsData.multiplierDaysRemaining}d left</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress to next tier */}
      {fsData.tierProgress.nextTier && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Progress to {fsData.tierProgress.nextTier}</span>
            <span className="text-gray-500">
              {fsData.tierProgress.fsToNextTier.toLocaleString()} FS needed
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500`}
              style={{ width: `${Math.min(100, fsData.tierProgress.progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{fsData.tierProgress.currentThreshold.toLocaleString()}</span>
            <span>{fsData.tierProgress.nextThreshold.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">This Week</div>
          <div className="font-bold text-white">{fsData.weekScore.toLocaleString()}</div>
          {fsData.weekRank && (
            <div className="text-xs text-gray-500">#{fsData.weekRank}</div>
          )}
        </div>
        <div className="text-center border-x border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Season</div>
          <div className="font-bold text-white">{fsData.seasonScore.toLocaleString()}</div>
          {fsData.seasonRank && (
            <div className="text-xs text-gray-500">#{fsData.seasonRank}</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">All-Time Rank</div>
          <div className="font-bold text-white">
            {fsData.allTimeRank ? `#${fsData.allTimeRank}` : '-'}
          </div>
        </div>
      </div>

      {/* Footer with links */}
      {showLeaderboardLink && (
        <div className="p-4 pt-0 flex gap-2">
          <Link
            to="/leaderboard?tab=fs"
            className="flex-1 btn-secondary btn-sm justify-center"
          >
            <Trophy size={16} />
            Leaderboard
          </Link>
          <Link
            to="/quests"
            className="flex-1 btn-secondary btn-sm justify-center"
          >
            <Fire size={16} />
            Earn More
          </Link>
        </div>
      )}
    </div>
  );
}
