/**
 * CT Spotlight - Weekly Voting Page
 * Vote for the top CT performer of the week
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import {
  ThumbsUp, TrendUp, CheckCircle, Fire, Warning, Lock,
  Crown, Sparkle, Star, Trophy, Lightning, CalendarBlank
} from '@phosphor-icons/react';
import { getXPLevel, getLevelBadge, getLevelColors } from '../utils/xp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  vote_count?: number;
  weighted_score?: number;
  follower_count?: number;
}

interface Contest {
  id: number;
  contest_key: string;
  start_date: string;
  end_date: string;
}

interface VoteStatus {
  has_voted: boolean;
  vote: {
    influencer_id: number;
    influencer_name: string;
    influencer_handle: string;
    profile_image_url?: string;
    tier?: string;
  } | null;
  contest: Contest | null;
}

export default function Vote() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userXP, setUserXP] = useState<number>(0);

  // Rarity mapping
  const getRarityInfo = (tier: string) => {
    const rarities: Record<string, { label: string; gradient: string; badge: string; icon: any }> = {
      S: {
        label: 'Legendary',
        gradient: 'from-amber-400 via-yellow-500 to-amber-600',
        badge: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        icon: Crown
      },
      A: {
        label: 'Epic',
        gradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
        badge: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
        icon: Sparkle
      },
      B: {
        label: 'Rare',
        gradient: 'from-blue-400 via-cyan-500 to-blue-600',
        badge: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        icon: Star
      },
      C: {
        label: 'Common',
        gradient: 'from-gray-400 via-gray-500 to-gray-600',
        badge: 'bg-gradient-to-r from-gray-400 to-gray-500',
        icon: Fire
      }
    };
    return rarities[tier] || rarities.C;
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    // Fetch public data (no auth required)
    fetchInfluencers();
    fetchLeaderboard();

    // Fetch user-specific data only if authenticated
    if (isConnected && token) {
      fetchVoteStatus();
      fetchUserProfile();
    }
  }, [isConnected, address]);

  const handleManualSignIn = async () => {
    if (!address) {
      setAuthError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      const nonceResponse = await axios.get(`${API_URL}/api/auth/nonce?address=${address}`);
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to CT Spotlight',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1, // Default to mainnet if chainId is undefined
        nonce: nonceResponse.data.nonce,
      });

      const signature = await signMessageAsync({ message: message.prepareMessage() });
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: message.prepareMessage(),
        signature,
      });

      localStorage.setItem('authToken', verifyResponse.data.token);
      setIsAuthenticated(true);

      await fetchInfluencers();
      await fetchVoteStatus();
      await fetchUserProfile();
      await fetchLeaderboard();
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      const errorMsg = error.response?.data?.error
        || error.message
        || 'Failed to sign in. Please try again.';
      setAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfluencers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/influencers`);
      setInfluencers(response.data.influencers || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };

  const fetchVoteStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/league/vote/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVoteStatus(response.data);
      if (response.data.vote) {
        setSelectedInfluencer(response.data.vote.influencer_id);
      }
    } catch (error) {
      console.error('Error fetching vote status:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserXP(response.data.xp || 0);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/vote/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedInfluencer) return;

    // Require authentication to vote
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/league/vote`,
        { influencer_id: selectedInfluencer },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotification({
        type: 'success',
        message: `${response.data.message}! Vote weight: ${response.data.vote_weight}x (+10 XP)`,
      });
      setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5 seconds
      await fetchVoteStatus();
      await fetchLeaderboard();
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Error submitting vote',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Main Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-xl flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-900/90 border-green-500/50 text-green-100'
              : 'bg-red-900/90 border-red-500/50 text-red-100'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle size={24} weight="fill" className="text-green-400 flex-shrink-0" />
            ) : (
              <Warning size={24} weight="fill" className="text-red-400 flex-shrink-0" />
            )}
            <p className="font-semibold">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAuthModal(false)}>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-2 border-cyan-500/30 p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <Lock size={64} weight="bold" className="mx-auto mb-4 text-cyan-400" />
              <h3 className="text-3xl font-black text-white mb-3">Sign In Required</h3>
              <p className="text-gray-300 mb-6">
                {!isConnected
                  ? 'Connect your wallet to vote for this week\'s CT Spotlight'
                  : 'Sign a message to verify your wallet ownership. No gas fees required.'}
              </p>

              {authError && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-red-400 text-sm">{authError}</p>
                </div>
              )}

              {!isConnected ? (
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold transition-all transform hover:scale-105"
                >
                  Close & Connect Wallet
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      await handleManualSignIn();
                      setShowAuthModal(false);
                    }}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? 'Signing In...' : 'Sign In with Ethereum'}
                  </button>
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl">
            <Fire size={56} weight="bold" className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">CT Spotlight</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Vote for the top CT performer this week. Help boost your team's score!
          </p>

          {/* Week Info & XP Level */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {voteStatus?.contest && (
              <div className="inline-flex items-center gap-3 bg-gray-900/50 px-6 py-3 rounded-xl border-2 border-gray-700">
                <CalendarBlank size={20} weight="bold" className="text-cyan-400" />
                <span className="text-gray-300">
                  Week of {formatDateRange(voteStatus.contest.start_date, voteStatus.contest.end_date)}
                </span>
              </div>
            )}

            {/* User XP Level Badge */}
            {isAuthenticated && (() => {
              const xpInfo = getXPLevel(userXP);
              const colors = getLevelColors(xpInfo.level);
              const badge = getLevelBadge(xpInfo.level);

              return (
                <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${colors.bg} px-6 py-3 rounded-xl border-2 ${colors.border}`}>
                  <span className="text-2xl">{badge}</span>
                  <div className="text-left">
                    <div className={`text-xs font-semibold ${colors.text}`}>YOUR LEVEL</div>
                    <div className="text-white font-black">{xpInfo.level}</div>
                  </div>
                  <div className="h-8 w-px bg-gray-600"></div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400 font-semibold">VOTE POWER</div>
                    <div className={`font-black ${colors.text}`}>{xpInfo.levelInfo.voteWeight}x</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Current Vote Status */}
        {voteStatus?.has_voted && voteStatus.vote ? (
          <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-3xl p-8 mb-10 shadow-2xl">
            <div className="flex items-center gap-4">
              <CheckCircle size={56} weight="fill" className="text-cyan-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-black text-2xl mb-2 text-white">Current Vote: {voteStatus.vote.influencer_name}</div>
                <div className="text-lg text-gray-300 mb-3">
                  @{voteStatus.vote.influencer_handle} • You can change your vote anytime before Sunday
                </div>
                <div className="flex items-center gap-2 text-sm text-cyan-400">
                  <Lightning size={16} weight="fill" />
                  <span>Select a different influencer below to update your vote</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-3xl p-8 mb-10 shadow-2xl">
            <div className="flex items-center gap-4">
              <Fire size={56} weight="fill" className="text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-black text-2xl mb-2 text-white">Vote This Week</div>
                <div className="text-lg text-gray-300">Vote now to earn <span className="text-yellow-400 font-bold">+10 XP</span> and potentially boost your team's score!</div>
              </div>
            </div>
          </div>
        )}

        {/* Spotlight Bonus Info */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/30 p-8 mb-10 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
            <Trophy size={28} weight="fill" className="text-yellow-400" />
            CT Spotlight Bonus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 text-center border-2 border-yellow-500/30">
              <div className="text-3xl mb-2">🥇</div>
              <div className="font-bold text-yellow-400 text-xl mb-1">+10%</div>
              <div className="text-sm text-gray-300">#1 Most Voted</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 text-center border-2 border-gray-500/30">
              <div className="text-3xl mb-2">🥈</div>
              <div className="font-bold text-gray-400 text-xl mb-1">+5%</div>
              <div className="text-sm text-gray-300">#2 Most Voted</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 text-center border-2 border-orange-500/30">
              <div className="text-3xl mb-2">🥉</div>
              <div className="font-bold text-orange-400 text-xl mb-1">+3%</div>
              <div className="text-sm text-gray-300">#3 Most Voted</div>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mt-4">
            If your drafted influencer gets top 3 votes, your team gets a score bonus at week's end!
          </p>
        </div>

        {/* Voting Section */}
        {influencers.length > 0 && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-8 shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                <Lightning size={32} weight="fill" className="text-yellow-400" />
                {voteStatus?.has_voted ? 'Change Your Vote' : 'Cast Your Vote'}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {influencers.slice(0, 20).map((influencer) => {
                  const isSelected = selectedInfluencer === influencer.id;
                  const rarity = getRarityInfo(influencer.tier);
                  const RarityIcon = rarity.icon;

                  return (
                    <button
                      key={influencer.id}
                      onClick={() => setSelectedInfluencer(influencer.id)}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                        isSelected
                          ? `border-cyan-400 bg-gradient-to-br ${rarity.gradient} shadow-2xl shadow-cyan-500/30 scale-105`
                          : 'border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-gray-600 hover:scale-105 hover:shadow-xl'
                      }`}
                    >
                      {/* Rarity Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className={`${rarity.badge} px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                          <RarityIcon size={12} weight="fill" className="text-white" />
                          <span className="text-xs font-bold text-white">{influencer.tier}</span>
                        </div>
                      </div>

                      {/* Profile Picture */}
                      <div className="mb-3">
                        <div className={`w-20 h-20 mx-auto rounded-full border-4 ${isSelected ? 'border-white' : 'border-gray-600'} shadow-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800`}>
                          {influencer.profile_image_url ? (
                            <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{influencer.name}</h3>
                        <p className="text-xs text-gray-300">@{influencer.handle}</p>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="mt-3 flex justify-center">
                          <CheckCircle size={24} weight="fill" className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-center">
                <button
                  onClick={handleVote}
                  disabled={loading || !selectedInfluencer}
                  className="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/30 flex items-center gap-3 mx-auto"
                >
                  <Fire size={28} weight="fill" />
                  {!isConnected
                    ? 'Connect Wallet to Vote'
                    : !isAuthenticated
                    ? 'Sign In to Vote'
                    : voteStatus?.has_voted
                    ? 'Update Vote'
                    : 'Submit Vote'}
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm">+10 XP</span>
                </button>
                {!isConnected && (
                  <p className="text-sm text-gray-400 mt-3">
                    Connect your wallet in the top right to vote
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Leaderboard */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Trophy size={32} weight="fill" className="text-yellow-400" />
              This Week's Rankings
            </h2>
            <div className="text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-xl">Updated live</div>
          </div>

          {/* Countdown Timer */}
          {voteStatus?.contest && (() => {
            const endDate = new Date(voteStatus.contest.end_date);
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            return (
              <div className="mb-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightning size={32} weight="fill" className="text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Voting closes in:</p>
                      <div className="flex items-center gap-2 text-3xl font-black">
                        {diff > 0 ? (
                          <>
                            <span className="text-orange-400">{days}d</span>
                            <span className="text-gray-500">:</span>
                            <span className="text-orange-400">{hours}h</span>
                            <span className="text-gray-500">:</span>
                            <span className="text-orange-400">{minutes}m</span>
                          </>
                        ) : (
                          <span className="text-red-400">Closed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Period</p>
                    <p className="text-sm font-bold text-gray-300">{formatDateRange(voteStatus.contest.start_date, voteStatus.contest.end_date)}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <TrendUp size={80} weight="duotone" className="mx-auto mb-6 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No votes yet this week</h3>
              <p className="text-gray-400 text-lg">Be the first to vote!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Calculate total votes for percentages
                const totalVotes = leaderboard.reduce((sum, inf) => sum + (inf.vote_count || 0), 0);

                return leaderboard.map((influencer, index) => {
                  const rarity = getRarityInfo(influencer.tier);
                  const votePercentage = totalVotes > 0 ? ((influencer.vote_count || 0) / totalVotes * 100) : 0;
                  const spotlightBonus = index === 0 ? '+10%' : index === 1 ? '+5%' : index === 2 ? '+3%' : null;

                  return (
                    <div
                      key={influencer.id}
                      className={`relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border-2 transition-all hover:scale-102 ${
                        index === 0
                          ? 'border-yellow-500/50 shadow-xl shadow-yellow-500/20'
                          : index === 1
                          ? 'border-gray-400/50 shadow-lg shadow-gray-400/10'
                          : index === 2
                          ? 'border-orange-400/50 shadow-lg shadow-orange-400/10'
                          : 'border-gray-700'
                      }`}
                    >
                      {/* Spotlight Bonus Badge */}
                      {spotlightBonus && (
                        <div className={`absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-black shadow-lg ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900'
                            : index === 1
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900'
                            : 'bg-gradient-to-r from-orange-400 to-amber-600 text-gray-900'
                        }`}>
                          {spotlightBonus} SPOTLIGHT
                        </div>
                      )}

                      <div className="flex items-center gap-6 mb-3">
                        {/* Rank */}
                        <div
                          className={`text-3xl font-black w-16 h-16 flex items-center justify-center rounded-2xl ${
                            index === 0
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : index === 1
                              ? 'bg-gray-400/20 text-gray-300'
                              : index === 2
                              ? 'bg-orange-400/20 text-orange-400'
                              : 'bg-gray-700/20 text-gray-500'
                          }`}
                        >
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>

                        {/* Profile Picture */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-gray-600 shadow-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                            {influencer.profile_image_url ? (
                              <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                            )}
                          </div>
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${rarity.badge} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                            {influencer.tier}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="font-bold text-xl text-white">{influencer.name}</div>
                          <div className="text-sm text-gray-400">@{influencer.handle}</div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Votes</div>
                            <div className="text-xl font-bold text-white">{influencer.vote_count || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Score</div>
                            <div className="text-3xl font-black text-cyan-400">{influencer.weighted_score || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Vote Percentage Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Vote Share</span>
                          <span className="text-xs font-bold text-gray-300">{votePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                : index === 1
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                : index === 2
                                ? 'bg-gradient-to-r from-orange-400 to-amber-600'
                                : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                            }`}
                            style={{ width: `${votePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
