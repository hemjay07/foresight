/**
 * Share Team Card Component
 * Generates shareable cards for social media
 */

import { Trophy, TwitterLogo, Copy, X } from '@phosphor-icons/react';
import { getRarityInfo } from '../utils/rarities';
import { useToast } from '../contexts/ToastContext';

interface Pick {
  id: number;
  influencer_name: string;
  influencer_handle: string;
  influencer_tier: string;
  total_points: number;
  profile_image_url?: string;
  is_captain?: boolean;
}

interface ShareTeamCardProps {
  teamName: string;
  totalScore: number;
  rank?: number;
  picks: Pick[];
  onClose: () => void;
}

export default function ShareTeamCard({ teamName, totalScore, rank, picks, onClose }: ShareTeamCardProps) {
  const { showToast } = useToast();
  const shareText = `Just drafted my CT dream team "${teamName}" on @foresight! 🔥\n\n${picks.map(p => `${p.is_captain ? '⭐' : '•'} ${p.influencer_name}`).join('\n')}\n\nScore: ${totalScore} pts${rank ? ` | Rank: #${rank}` : ''}\n\nPlay now:`;

  const shareUrl = window.location.origin;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    showToast('success', 'Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-brand-500 rounded-2xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
        >
          <X size={24} weight="bold" className="text-white" />
        </button>

        {/* Card Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-xl mb-4 shadow-lg">
              <Trophy size={32} weight="fill" className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{teamName}</h2>
            <div className="flex items-center justify-center gap-4 text-lg">
              <span className="text-brand-400 font-bold">{totalScore} pts</span>
              {rank && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="text-yellow-400 font-bold">Rank #{rank}</span>
                </>
              )}
            </div>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {picks.map((pick) => {
              const rarity = getRarityInfo(pick.influencer_tier);
              const RarityIcon = rarity.icon;

              return (
                <div
                  key={pick.id}
                  className={`relative flex items-center gap-4 p-4 rounded-lg border-2 ${
                    pick.is_captain
                      ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-500'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  {pick.is_captain && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                      CAPTAIN
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-full ${rarity.badge} flex items-center justify-center`}>
                    <RarityIcon size={20} weight="fill" className="text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-white">{pick.influencer_name}</div>
                    <div className="text-sm text-gray-400">@{pick.influencer_handle}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-400">{pick.total_points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Share Buttons */}
          <div className="flex gap-3">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <TwitterLogo size={24} weight="fill" />
              Share on Twitter
            </a>

            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all"
            >
              <Copy size={24} weight="bold" />
              Copy
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Share your team and invite friends to play!
          </div>
        </div>
      </div>
    </div>
  );
}
