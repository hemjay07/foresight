/**
 * RisingStarsTab
 * Discover and vote on rising CT influencers
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Rocket,
  ThumbsUp,
  ThumbsDown,
  TrendUp,
  TwitterLogo,
  Users,
  Lightning,
  Fire,
  Warning,
  ArrowClockwise,
  Crown,
} from '@phosphor-icons/react';
import { useToast } from '../../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RisingStar {
  id: string;
  handle: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  followers: number;
  growthRate: number;
  avgLikes: number;
  avgRetweets: number;
  viralTweets: number;
  votesFor: number;
  votesAgainst: number;
  voteScore: number;
  userVote: 'for' | 'against' | null;
  status: string;
  discoveredAt: string;
}

export default function RisingStarsTab() {
  const { showToast } = useToast();

  const [stars, setStars] = useState<RisingStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Fetch rising stars
  const fetchStars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const res = await axios.get(`${API_URL}/api/intel/rising-stars`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        // Sort by vote score descending
        const sorted = res.data.data.stars.sort(
          (a: RisingStar, b: RisingStar) => b.voteScore - a.voteScore
        );
        setStars(sorted);
        setError(null);
      }
    } catch (err) {
      console.error('[RisingStars] Error fetching:', err);
      setError('Failed to load rising stars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStars();
  }, []);

  // Vote handler
  const handleVote = async (starId: string, vote: 'for' | 'against') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('Please sign in to vote', 'error');
      return;
    }

    setVotingId(starId);

    try {
      const res = await axios.post(
        `${API_URL}/api/intel/rising-stars/${starId}/vote`,
        { vote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Update local state
        setStars(prev => prev.map(star => {
          if (star.id !== starId) return star;

          const oldVote = star.userVote;
          let newVotesFor = star.votesFor;
          let newVotesAgainst = star.votesAgainst;

          // Remove old vote
          if (oldVote === 'for') newVotesFor--;
          if (oldVote === 'against') newVotesAgainst--;

          // Add new vote (if different from old)
          if (vote === 'for' && oldVote !== 'for') newVotesFor++;
          if (vote === 'against' && oldVote !== 'against') newVotesAgainst++;

          return {
            ...star,
            userVote: oldVote === vote ? null : vote, // Toggle if same vote
            votesFor: newVotesFor,
            votesAgainst: newVotesAgainst,
            voteScore: newVotesFor - newVotesAgainst,
          };
        }));

        showToast(res.data.data.action === 'voted' ? 'Vote recorded!' : 'Vote updated!', 'success');

        // Secondary: Write to Tapestry if voting 'for' (non-blocking)
        if (vote === 'for') {
          try {
            const contentId = `foresight-rising-star-${starId}`;
            await axios.post(
              `${API_URL}/api/tapestry/like/${contentId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (tapestryErr) {
            console.log('[RisingStars] Tapestry like write failed (non-blocking):', tapestryErr);
          }
        }
      }
    } catch (err) {
      showToast('Failed to vote', 'error');
    } finally {
      setVotingId(null);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-400">Discovering rising stars...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <Warning size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchStars}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
        >
          <ArrowClockwise size={16} />
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (stars.length === 0) {
    return (
      <div className="py-12 text-center">
        <Rocket size={48} className="mx-auto mb-3 text-gray-600" />
        <h3 className="text-lg font-semibold text-white mb-2">No Rising Stars Yet</h3>
        <p className="text-gray-400 text-sm">
          We're constantly discovering new CT talent.
          <br />
          Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={20} className="text-cyan-400" />
          <span className="text-sm text-gray-400">
            {stars.length} rising stars discovered
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Vote to help us add the best CT talent to the game
        </div>
      </div>

      {/* Stars List */}
      <div className="space-y-3">
        {stars.map((star, index) => (
          <div
            key={star.id}
            className={`p-4 rounded-xl border transition-all ${
              index === 0
                ? 'bg-gold-500/5 border-gold-500/30'
                : 'bg-gray-900/50 border-gray-800'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                index === 0
                  ? 'bg-gold-500/20 text-gold-400'
                  : index === 1
                  ? 'bg-gray-400/20 text-gray-400'
                  : index === 2
                  ? 'bg-amber-700/20 text-amber-600'
                  : 'bg-gray-800 text-gray-500'
              }`}>
                {index === 0 ? <Crown size={16} weight="fill" /> : `#${index + 1}`}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {star.avatar ? (
                  <img src={star.avatar} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <TwitterLogo size={20} weight="fill" className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">
                    {star.name || `@${star.handle}`}
                  </h3>
                  <a
                    href={`https://twitter.com/${star.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-[#1DA1F2]"
                  >
                    @{star.handle}
                  </a>
                </div>

                {star.bio && (
                  <p className="text-sm text-gray-400 line-clamp-1 mb-2">{star.bio}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users size={12} />
                    {formatNumber(star.followers)} followers
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendUp size={12} />
                    {star.growthRate.toFixed(1)}% growth
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Lightning size={12} />
                    {star.avgLikes.toFixed(0)} avg likes
                  </div>
                  {star.viralTweets > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Fire size={12} />
                      {star.viralTweets} viral
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-gray-600 mt-1">
                  Discovered {formatDate(star.discoveredAt)}
                </div>
              </div>

              {/* Voting */}
              <div className="flex flex-col items-center gap-2">
                {/* Vote Score */}
                <div className={`text-lg font-bold ${
                  star.voteScore > 0 ? 'text-emerald-400' : star.voteScore < 0 ? 'text-rose-400' : 'text-gray-500'
                }`}>
                  {star.voteScore > 0 ? '+' : ''}{star.voteScore}
                </div>

                {/* Vote Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote(star.id, 'for')}
                    disabled={votingId === star.id}
                    className={`p-2 rounded-lg transition-colors ${
                      star.userVote === 'for'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-gray-800 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <ThumbsUp size={16} weight={star.userVote === 'for' ? 'fill' : 'regular'} />
                  </button>
                  <button
                    onClick={() => handleVote(star.id, 'against')}
                    disabled={votingId === star.id}
                    className={`p-2 rounded-lg transition-colors ${
                      star.userVote === 'against'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-gray-800 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <ThumbsDown size={16} weight={star.userVote === 'against' ? 'fill' : 'regular'} />
                  </button>
                </div>

                {/* Vote counts */}
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <span className="text-emerald-500/70">{star.votesFor}</span>
                  <span>/</span>
                  <span className="text-rose-500/70">{star.votesAgainst}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Rocket size={14} className="text-cyan-400" />
          How Rising Stars Works
        </h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>Vote for influencers you think should be added to the game</li>
          <li>Top voted stars get reviewed and added as draftable players</li>
          <li>Discover tomorrow's top performers before everyone else</li>
        </ul>
      </div>
    </div>
  );
}
