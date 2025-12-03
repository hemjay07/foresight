/**
 * CT Spotlight - Weekly Voting Page
 * Vote for the top CT performer of the week
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import confetti from 'canvas-confetti';
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
  const [userStreak, setUserStreak] = useState<number>(0);

  // Rarity mapping
  const getRarityInfo = (tier: string) => {
    const rarities: Record<string, { label: string; gradient: string; badge: string; icon: any }> = {
      S: {
        label: 'Legendary',
        gradient: 'from-yellow-500/20 to-amber-500/20',
        badge: 'bg-yellow-500',
        icon: Crown
      },
      A: {
        label: 'Epic',
        gradient: 'from-brand-500/20 to-brand-600/20',
        badge: 'bg-brand-500',
        icon: Sparkle
      },
      B: {
        label: 'Rare',
        gradient: 'from-green-500/20 to-green-600/20',
        badge: 'bg-green-500',
        icon: Star
      },
      C: {
        label: 'Common',
        gradient: 'from-gray-500/20 to-gray-600/20',
        badge: 'bg-gray-500',
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
      setUserStreak(response.data.voteStreak || 0);
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

      // Build notification message with streak info
      let message = `${response.data.message}! Vote weight: ${response.data.vote_weight}x`;
      if (response.data.xp_earned) {
        message += ` (+${response.data.xp_earned} XP`;
        if (response.data.bonus_xp > 0) {
          message += `, ${response.data.bonus_xp} streak bonus!`;
        } else {
          message += `)`;
        }
        if (response.data.streak > 1) {
          message += ` ${response.data.streak} day streak!`;
        }
      }

      setNotification({
        type: 'success',
        message,
      });

      // Celebrate with confetti!
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5 seconds
      await fetchVoteStatus();
      await fetchUserProfile(); // Refresh streak display
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
    <div className="min-h-screen bg-gray-950">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className={`px-6 py-4 rounded-lg shadow-soft-lg border backdrop-blur-xl flex items-center gap-3 ${
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
          <div className="card p-8 max-w-md w-full shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <Lock size={64} weight="bold" className="mx-auto mb-4 text-brand-400" />
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
                  className="btn-primary w-full py-4"
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
                    className="btn-primary w-full py-4"
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 rounded-xl mb-6 shadow-soft-lg">
            <Fire size={48} weight="bold" className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">CT Spotlight</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Vote for the top CT performer this week. Help boost your team's score!
          </p>

          {/* Week Info & XP Level */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {voteStatus?.contest && (
              <div className="inline-flex items-center gap-3 bg-gray-900/50 px-6 py-3 rounded-lg border border-gray-700">
                <CalendarBlank size={20} weight="bold" className="text-brand-400" />
                <span className="text-gray-300">
                  Week of {formatDateRange(voteStatus.contest.start_date, voteStatus.contest.end_date)}
                </span>
              </div>
            )}

            {/* Vote Streak Badge */}
            {isAuthenticated && userStreak > 0 && (
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 rounded-xl border-2 border-orange-400/50 shadow-lg shadow-orange-500/20">
                <Fire size={24} weight="fill" className={userStreak >= 7 ? 'text-white animate-pulse' : 'text-white'} />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white/80">VOTE STREAK</div>
                  <div className="text-white font-black">{userStreak} {userStreak === 1 ? 'day' : 'days'}</div>
                </div>
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
          <div className="card-highlight p-8 mb-10">
            <div className="flex items-center gap-4">
              <CheckCircle size={56} weight="fill" className="text-brand-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-black text-2xl mb-2 text-white">Current Vote: {voteStatus.vote.influencer_name}</div>
                <div className="text-lg text-gray-300 mb-3">
                  @{voteStatus.vote.influencer_handle} • You can change your vote anytime before Sunday
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-400">
                  <Lightning size={16} weight="fill" />
                  <span>Select a different influencer below to update your vote</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 mb-10 border-amber-500/30">
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
        <div className="card p-8 mb-10 border-yellow-500/30">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
            <Trophy size={28} weight="fill" className="text-yellow-400" />
            CT Spotlight Bonus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400 mb-2">1st</div>
              <div className="font-bold text-yellow-400 text-xl mb-1">+10%</div>
              <div className="text-sm text-gray-300">#1 Most Voted</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-500/30">
              <div className="text-2xl font-bold text-gray-400 mb-2">2nd</div>
              <div className="font-bold text-gray-400 text-xl mb-1">+5%</div>
              <div className="text-sm text-gray-300">#2 Most Voted</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-orange-500/30">
              <div className="text-2xl font-bold text-orange-400 mb-2">3rd</div>
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
            <div className="card p-8">
              <h2 className="text-3xl font-semibold text-white mb-6 flex items-center gap-3">
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
                      className={`relative p-6 rounded-lg border transition-all duration-200 text-left group ${
                        isSelected
                          ? `border-brand-500 bg-gradient-to-br ${rarity.gradient} shadow-soft-lg`
                          : 'border-gray-700 bg-gray-800/80 hover:border-gray-600 hover:shadow-soft'
                      }`}
                    >
                      {/* Rarity Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className={`${rarity.badge} px-2 py-1 rounded-md flex items-center gap-1`}>
                          <RarityIcon size={12} weight="fill" className="text-white" />
                          <span className="text-xs font-medium text-white">{influencer.tier}</span>
                        </div>
                      </div>

                      {/* Profile Picture */}
                      <div className="mb-3">
                        <div className={`w-16 h-16 mx-auto rounded-full border-2 ${isSelected ? 'border-white' : 'border-gray-600'} shadow-soft overflow-hidden bg-gray-700`}>
                          {influencer.profile_image_url ? (
                            <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Fire size={24} weight="bold" />
                            </div>
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
                  className="btn-primary px-10 py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-lg flex items-center gap-3 mx-auto"
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
        <div className="card p-8">
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
              <div className="mb-8 bg-amber-500/10 border border-amber-500/50 rounded-lg p-6">
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
            <div className="space-y-6">
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8 pt-8">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full border-3 border-gray-400 shadow-soft overflow-hidden bg-gray-700">
                        {leaderboard[1].profile_image_url ? (
                          <img src={leaderboard[1].profile_image_url} alt={leaderboard[1].name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Fire size={20} weight="bold" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">2</div>
                    </div>
                    <p className="text-sm font-semibold text-white truncate max-w-[80px]">{leaderboard[1].name}</p>
                    <p className="text-xs text-gray-400">{leaderboard[1].vote_count || 0} votes</p>
                    <div className="h-20 w-24 bg-gray-700 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-xs text-gray-400">+5%</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center -mt-8">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full border-3 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] overflow-hidden bg-gray-700">
                        {leaderboard[0].profile_image_url ? (
                          <img src={leaderboard[0].profile_image_url} alt={leaderboard[0].name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Fire size={24} weight="bold" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">1</div>
                    </div>
                    <p className="text-sm font-bold text-white truncate max-w-[100px]">{leaderboard[0].name}</p>
                    <p className="text-xs text-yellow-400 font-semibold">{leaderboard[0].vote_count || 0} votes</p>
                    <div className="h-28 w-28 bg-yellow-500/20 border border-yellow-500/50 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-400">+10%</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full border-3 border-orange-400 shadow-soft overflow-hidden bg-gray-700">
                        {leaderboard[2].profile_image_url ? (
                          <img src={leaderboard[2].profile_image_url} alt={leaderboard[2].name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Fire size={20} weight="bold" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">3</div>
                    </div>
                    <p className="text-sm font-semibold text-white truncate max-w-[80px]">{leaderboard[2].name}</p>
                    <p className="text-xs text-gray-400">{leaderboard[2].vote_count || 0} votes</p>
                    <div className="h-16 w-24 bg-orange-500/20 border border-orange-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-xs text-orange-400">+3%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining Rankings (4th onwards, or all if less than 3) */}
              {(() => {
                const totalVotes = leaderboard.reduce((sum, inf) => sum + (inf.vote_count || 0), 0);
                const startIndex = leaderboard.length >= 3 ? 3 : 0;

                return leaderboard.slice(startIndex).map((influencer, idx) => {
                  const index = startIndex + idx;
                  const rarity = getRarityInfo(influencer.tier);
                  const votePercentage = totalVotes > 0 ? ((influencer.vote_count || 0) / totalVotes * 100) : 0;

                  return (
                    <div
                      key={influencer.id}
                      className="relative bg-gray-800/80 rounded-lg p-6 border border-gray-700 transition-all"
                    >
                      <div className="flex items-center gap-6 mb-3">
                        {/* Rank */}
                        <div className="text-xl font-bold w-12 h-12 flex items-center justify-center rounded-lg bg-gray-700/20 text-gray-500">
                          #{index + 1}
                        </div>

                        {/* Profile Picture */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full border-2 border-gray-600 shadow-soft overflow-hidden bg-gray-700">
                            {influencer.profile_image_url ? (
                              <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Fire size={20} weight="bold" />
                              </div>
                            )}
                          </div>
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${rarity.badge} flex items-center justify-center text-white text-[10px] font-medium`}>
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
                            <div className="text-3xl font-bold text-brand-400">{influencer.weighted_score || 0}</div>
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
                                : 'bg-brand-500'
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
