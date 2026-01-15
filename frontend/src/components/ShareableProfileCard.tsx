/**
 * Shareable Profile Card Component
 * Generates a beautiful card that users can share on social media
 * Includes FS stats, tier, rank, and key achievements
 */

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import html2canvas from 'html2canvas';
import {
  Sparkle, Trophy, Star, Crown, Diamond, Medal, Fire,
  Share, Download, TwitterLogo, Copy, Check, Lightning, TrendUp
} from '@phosphor-icons/react';
import FoundingMemberBadge from './FoundingMemberBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProfileCardData {
  username: string;
  avatarUrl?: string;
  totalScore: number;
  tier: string;
  allTimeRank: number | null;
  seasonRank: number | null;
  weekScore: number;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  earlyAdopterTier: string | null;
  effectiveMultiplier: number;
  contestsEntered: number;
  contestsWon: number;
  topPlacements: number;
  winRate: number;
}

interface Props {
  onClose?: () => void;
  showModal?: boolean;
}

const TIER_CONFIG = {
  bronze: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    gradient: 'from-orange-600 to-amber-500',
    icon: Medal,
  },
  silver: {
    color: 'text-gray-300',
    bg: 'bg-gray-400/20',
    border: 'border-gray-400/30',
    gradient: 'from-gray-400 to-gray-300',
    icon: Medal,
  },
  gold: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-500 to-amber-400',
    icon: Star,
  },
  platinum: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500 to-blue-400',
    icon: Crown,
  },
  diamond: {
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500 to-pink-400',
    icon: Diamond,
  },
} as const;

export default function ShareableProfileCard({ onClose, showModal = true }: Props) {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileCardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      fetchProfileData();
    }
  }, [isConnected]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch FS data and user stats
      const [fsResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/v2/fs/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { success: false } })),
      ]);

      if (fsResponse.data.success) {
        const fs = fsResponse.data.data;
        const stats = statsResponse.data.success ? statsResponse.data.data : {};

        setData({
          username: fs.username || 'Anonymous',
          avatarUrl: fs.avatarUrl,
          totalScore: fs.totalScore || 0,
          tier: fs.tier || 'bronze',
          allTimeRank: fs.allTimeRank,
          seasonRank: fs.seasonRank,
          weekScore: fs.weekScore || 0,
          isFoundingMember: fs.isFoundingMember || false,
          foundingMemberNumber: fs.foundingMemberNumber,
          earlyAdopterTier: fs.earlyAdopterTier,
          effectiveMultiplier: fs.effectiveMultiplier || 1,
          contestsEntered: stats.contestsEntered || 0,
          contestsWon: stats.contestsWon || 0,
          topPlacements: stats.topPlacements || 0,
          winRate: stats.winRate || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `foresight-profile-${data?.username || 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareTwitter = () => {
    if (!data) return;

    const text = `Check out my Foresight Score!\n\n${data.totalScore.toLocaleString()} FS | ${data.tier.toUpperCase()} Tier${data.allTimeRank ? ` | Rank #${data.allTimeRank}` : ''}\n\nJoin me on @ForesightGG and climb the leaderboard!`;
    const url = 'https://foresight.gg';

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://foresight.gg/profile/${address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isConnected) return null;

  const tierConfig = data ? TIER_CONFIG[data.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze : TIER_CONFIG.bronze;
  const TierIcon = tierConfig.icon;

  const cardContent = (
    <div className="relative">
      {/* The Card */}
      <div
        ref={cardRef}
        className="w-[400px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#0a0a0f' }}
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${tierConfig.gradient} p-6 pb-16 relative`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`text-3xl font-bold text-white`}>
                  {(data?.username || 'A')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">
                  {data?.username || 'Anonymous'}
                </h2>
                {data?.isFoundingMember && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-300 font-medium flex items-center gap-1">
                    <Star size={10} weight="fill" />
                    #{data.foundingMemberNumber}
                  </span>
                )}
              </div>
              <div className="text-sm text-white/70 mt-0.5">
                Foresight Player
              </div>
            </div>
          </div>
        </div>

        {/* Main Score */}
        <div className="px-6 -mt-10 relative z-10">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkle size={20} weight="fill" className="text-brand-400" />
                <span className="text-sm text-gray-400 uppercase tracking-wider">Foresight Score</span>
              </div>
              <div className={`text-5xl font-black ${tierConfig.color}`}>
                {data?.totalScore.toLocaleString() || '0'}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-lg ${tierConfig.bg} ${tierConfig.color} font-bold uppercase text-sm flex items-center gap-1`}>
                  <TierIcon size={14} weight="fill" />
                  {data?.tier}
                </span>
                {data?.effectiveMultiplier && data.effectiveMultiplier > 1 && (
                  <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold text-sm flex items-center gap-1">
                    <Lightning size={14} weight="fill" />
                    {data.effectiveMultiplier.toFixed(2)}x
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">All-Time Rank</div>
            <div className="text-lg font-bold text-white">
              {data?.allTimeRank ? `#${data.allTimeRank}` : '-'}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Season Rank</div>
            <div className="text-lg font-bold text-white">
              {data?.seasonRank ? `#${data.seasonRank}` : '-'}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">This Week</div>
            <div className="text-lg font-bold text-brand-400">
              +{data?.weekScore.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Contest Stats */}
        {(data?.contestsEntered ?? 0) > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-gray-800/30 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Trophy size={14} weight="fill" className="text-yellow-500" />
                  <span>{data?.contestsWon || 0} Wins</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendUp size={14} weight="fill" className="text-green-500" />
                  <span>{data?.topPlacements || 0} Top 10</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Fire size={14} weight="fill" className="text-orange-500" />
                  <span>{data?.contestsEntered || 0} Played</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer branding */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center">
                <Sparkle size={14} weight="fill" className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">Foresight</span>
            </div>
            <div className="text-xs text-gray-500">
              foresight.gg
            </div>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          {downloading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Download size={18} />
              Save Image
            </>
          )}
        </button>
        <button
          onClick={handleShareTwitter}
          className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <TwitterLogo size={18} weight="fill" />
          Share on X
        </button>
      </div>

      <button
        onClick={handleCopyLink}
        className="w-full mt-3 btn-secondary flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <Check size={18} className="text-green-400" />
            <span className="text-green-400">Link Copied!</span>
          </>
        ) : (
          <>
            <Copy size={18} />
            Copy Profile Link
          </>
        )}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-8">
          <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!showModal) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
        {cardContent}
      </div>
    </div>
  );
}

/**
 * Share button that opens the profile card modal
 */
export function ShareProfileButton({
  variant = 'primary',
  className = '',
}: {
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all ${className}`}
          title="Share Profile"
        >
          <Share size={20} />
        </button>
        {showModal && <ShareableProfileCard onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 ${className}`}
      >
        <Share size={18} />
        Share Profile
      </button>
      {showModal && <ShareableProfileCard onClose={() => setShowModal(false)} />}
    </>
  );
}
