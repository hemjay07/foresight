/**
 * Global Leaderboard Page
 * Comprehensive rankings across all game modes and achievements
 * Includes Foresight Score leaderboards with All-Time, Season, Weekly, Referral tabs
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, Crown, Fire, Target, Medal, Sparkle, TrendUp, Users, Star, Diamond, Lightning
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';
import FoundingMemberBadge from '../components/FoundingMemberBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type LeaderboardTab = 'fs' | 'xp' | 'fantasy' | 'voting' | 'streaks';
type FsSubTab = 'all_time' | 'season' | 'weekly' | 'referral';

interface XPLeaderUser {
  id: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  xp: number;
  lifetime_xp: number;
  rank: number;
  vote_streak?: number;
}

interface FantasyLeaderTeam {
  id: number;
  team_name: string;
  user_id: number;
  total_score: number;
  rank: number;
  username?: string;
  avatar_url?: string;
}

interface VoteLeader {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  vote_count: number;
  weighted_score: number;
}

interface FsLeaderEntry {
  userId: string;
  username?: string;
  avatarUrl?: string;
  score: number;
  tier: string;
  rank?: number;
  isFoundingMember: boolean;
  foundingMemberNumber?: number;
  earlyAdopterTier?: string;
}

const TIER_CONFIG = {
  bronze: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  silver: { color: 'text-gray-300', bg: 'bg-gray-400/20', border: 'border-gray-400/30' },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  platinum: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  diamond: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
} as const;

export default function Leaderboard() {
  const { address } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as LeaderboardTab) || 'fs';
  const initialFsSubTab = (searchParams.get('fsType') as FsSubTab) || 'all_time';

  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialTab);
  const [fsSubTab, setFsSubTab] = useState<FsSubTab>(initialFsSubTab);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all-time' | 'monthly'>('all-time');

  // Data states
  const [fsLeaders, setFsLeaders] = useState<FsLeaderEntry[]>([]);
  const [fsTotal, setFsTotal] = useState(0);
  const [xpLeaders, setXpLeaders] = useState<XPLeaderUser[]>([]);
  const [fantasyLeaders, setFantasyLeaders] = useState<FantasyLeaderTeam[]>([]);
  const [voteLeaders, setVoteLeaders] = useState<VoteLeader[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<XPLeaderUser[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; total: number; percentile: number } | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, fsSubTab, period]);

  // Update URL when tabs change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (activeTab === 'fs') {
      params.set('fsType', fsSubTab);
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, fsSubTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'fs') {
        // Fetch FS leaderboard
        const response = await axios.get(`${API_URL}/api/v2/fs/leaderboard`, {
          params: { type: fsSubTab, limit: 100 },
        });
        if (response.data.success) {
          setFsLeaders(response.data.data.entries || []);
          setFsTotal(response.data.data.total || 0);
        }

        // Fetch user's position if authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const posResponse = await axios.get(`${API_URL}/api/v2/fs/leaderboard/position`, {
              params: { type: fsSubTab },
              headers: { Authorization: `Bearer ${token}` },
            });
            if (posResponse.data.success) {
              setUserPosition(posResponse.data.data);
            }
          } catch (e) {
            setUserPosition(null);
          }
        }
      } else if (activeTab === 'xp') {
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 100, period },
        });
        setXpLeaders(response.data.users || []);
      } else if (activeTab === 'fantasy') {
        const response = await axios.get(`${API_URL}/api/league/leaderboard`);
        const teams = response.data.leaderboard || [];
        setFantasyLeaders(teams);
      } else if (activeTab === 'voting') {
        const response = await axios.get(`${API_URL}/api/league/vote/leaderboard`);
        setVoteLeaders(response.data.leaderboard || []);
      } else if (activeTab === 'streaks') {
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 100 },
        });
        const sorted = (response.data.users || []).sort((a: XPLeaderUser, b: XPLeaderUser) =>
          (b.vote_streak || 0) - (a.vote_streak || 0)
        );
        setStreakLeaders(sorted);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'fs' as LeaderboardTab, label: 'Foresight Score', icon: Sparkle, color: 'gold' },
    { id: 'xp' as LeaderboardTab, label: 'XP Rankings', icon: Crown, color: 'cyan' },
    { id: 'fantasy' as LeaderboardTab, label: 'Fantasy Draft', icon: Trophy, color: 'yellow' },
    { id: 'voting' as LeaderboardTab, label: 'Vote Leaders', icon: Target, color: 'purple' },
    { id: 'streaks' as LeaderboardTab, label: 'Streak Masters', icon: Fire, color: 'red' },
  ];

  const fsSubTabs = [
    { id: 'all_time' as FsSubTab, label: 'All-Time', icon: Trophy },
    { id: 'season' as FsSubTab, label: 'Season', icon: Star },
    { id: 'weekly' as FsSubTab, label: 'Weekly', icon: Lightning },
    { id: 'referral' as FsSubTab, label: 'Referral', icon: Users },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 font-extrabold text-3xl';
    if (rank === 2) return 'text-gray-300 font-bold text-2xl';
    if (rank === 3) return 'text-orange-400 font-bold text-2xl';
    if (rank <= 10) return 'text-cyan-400 font-bold text-xl';
    return 'text-gray-400 font-semibold text-lg';
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getUserDisplay = (user: { username?: string; wallet_address?: string }) => {
    if (user.username) return user.username;
    if (user.wallet_address) return formatAddress(user.wallet_address);
    return 'Anonymous';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl mb-6 shadow-lg">
            <Trophy size={48} weight="fill" className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Leaderboards
          </h1>
          <p className="text-xl text-gray-400">
            Compete with the best CT players and climb the ranks
          </p>
        </div>

        {/* Main Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    isActive
                      ? tab.id === 'fs'
                        ? 'bg-gold-500/20 text-gold-400 border-2 border-gold-500/50'
                        : `bg-${tab.color}-500/20 text-${tab.color}-400 border-2 border-${tab.color}-500/50`
                      : 'bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Icon size={20} weight="fill" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FS Sub-tabs */}
        {activeTab === 'fs' && (
          <div className="mb-6">
            <div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1 inline-flex">
              {fsSubTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = fsSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFsSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gold-500 text-gray-950'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Period selector for XP */}
        {activeTab === 'xp' && (
          <div className="mb-6 flex justify-end">
            <div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setPeriod('all-time')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === 'all-time'
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === 'monthly'
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        )}

        {/* Foresight Score Leaderboard */}
        {!loading && activeTab === 'fs' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Sparkle size={28} weight="fill" className="text-gold-400" />
                  {fsSubTab === 'all_time' && 'All-Time Leaders'}
                  {fsSubTab === 'season' && 'Season Leaders'}
                  {fsSubTab === 'weekly' && 'Weekly Leaders'}
                  {fsSubTab === 'referral' && 'Top Referrers'}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    <span className="text-gold-400 font-bold">{fsTotal.toLocaleString()}</span> players
                  </div>
                  {userPosition && (
                    <div className="text-sm bg-gold-500/20 border border-gold-500/30 px-3 py-1 rounded-lg">
                      <span className="text-gray-400">Your rank: </span>
                      <span className="text-gold-400 font-bold">#{userPosition.rank}</span>
                      <span className="text-gray-500 ml-1">(Top {100 - userPosition.percentile}%)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {fsLeaders.map((entry, index) => {
                const rank = entry.rank || index + 1;
                const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;

                return (
                  <div
                    key={entry.userId}
                    className="p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-16 text-center">
                        <div className={getRankStyle(rank)}>
                          {getRankDisplay(rank)}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center text-white font-bold overflow-hidden">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={24} weight="fill" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-lg">
                            {entry.username || 'Anonymous'}
                          </span>
                          {/* Tier Badge */}
                          <span className={`px-2 py-0.5 text-xs font-bold ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border} border rounded uppercase`}>
                            {entry.tier}
                          </span>
                          {/* Founding Member / Early Adopter Badge */}
                          <FoundingMemberBadge
                            isFoundingMember={entry.isFoundingMember}
                            foundingMemberNumber={entry.foundingMemberNumber}
                            earlyAdopterTier={entry.earlyAdopterTier}
                            variant="minimal"
                          />
                        </div>
                        {rank <= 3 && (
                          <div className="text-xs text-gray-500">
                            Top performer
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right min-w-[140px]">
                        <div className="text-xs text-gray-500 mb-1">
                          {fsSubTab === 'all_time' && 'Total FS'}
                          {fsSubTab === 'season' && 'Season FS'}
                          {fsSubTab === 'weekly' && 'Week FS'}
                          {fsSubTab === 'referral' && 'Referral FS'}
                        </div>
                        <div className={`text-xl font-bold ${tierConfig.color}`}>
                          {entry.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {fsLeaders.length === 0 && (
                <div className="p-12 text-center">
                  <Sparkle size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No rankings yet</p>
                  <p className="text-gray-500 text-sm mt-1">Be the first to earn Foresight Score!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* XP Leaderboard */}
        {!loading && activeTab === 'xp' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Crown size={28} weight="fill" className="text-cyan-400" />
                  XP Rankings - {period === 'all-time' ? 'All Time' : 'This Month'}
                </h2>
                <div className="text-sm text-gray-500">
                  {xpLeaders.length} players
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {xpLeaders.map((user) => {
                const level = getNumericLevel(user.lifetime_xp || user.xp);
                const userXP = period === 'all-time' ? user.lifetime_xp : user.xp;

                return (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className={getRankStyle(user.rank)}>
                          {getRankDisplay(user.rank)}
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" loading="lazy" />
                        ) : (
                          <Users size={24} weight="fill" />
                        )}
                      </div>

                      <div className="flex-1">
                        <span className="font-bold text-white text-lg">
                          {getUserDisplay(user)}
                        </span>
                        <div className="text-sm text-gray-500">
                          {formatAddress(user.wallet_address)}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Level</div>
                        <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg">
                          <span className="text-cyan-400 font-bold">{level}</span>
                        </div>
                      </div>

                      <div className="text-right min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">Total XP</div>
                        <div className="text-xl font-bold text-cyan-400">
                          {userXP.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {xpLeaders.length === 0 && (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No rankings yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fantasy Leaderboard */}
        {!loading && activeTab === 'fantasy' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Trophy size={28} weight="fill" className="text-yellow-400" />
                Fantasy Draft Leaders
              </h2>
            </div>

            <div className="divide-y divide-gray-800">
              {fantasyLeaders.map((team) => (
                <div
                  key={team.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <div className={getRankStyle(team.rank)}>
                        {getRankDisplay(team.rank)}
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      <Trophy size={24} weight="fill" />
                    </div>

                    <div className="flex-1">
                      <span className="font-bold text-white text-lg">
                        {team.team_name}
                      </span>
                      <div className="text-sm text-gray-500">
                        by {team.username || `User ${team.user_id}`}
                      </div>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="text-xs text-gray-500 mb-1">Total Score</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {team.total_score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {fantasyLeaders.length === 0 && (
                <div className="p-12 text-center">
                  <Trophy size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No teams yet this week</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voting Leaderboard */}
        {!loading && activeTab === 'voting' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Target size={28} weight="fill" className="text-purple-400" />
                Weekly Vote Leaders
              </h2>
            </div>

            <div className="divide-y divide-gray-800">
              {voteLeaders.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">
                        {getRankDisplay(index + 1)}
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {influencer.profile_image_url ? (
                        <img src={influencer.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Sparkle size={24} weight="fill" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-white text-lg mb-1">
                        {influencer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{influencer.handle}
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-lg font-bold ${
                      influencer.tier === 'S' ? 'bg-yellow-500/20 text-yellow-400' :
                      influencer.tier === 'A' ? 'bg-cyan-500/20 text-cyan-400' :
                      influencer.tier === 'B' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {influencer.tier}
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="text-xs text-gray-500 mb-1">Weighted Score</div>
                      <div className="text-xl font-bold text-purple-400">
                        {Math.round(influencer.weighted_score).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {influencer.vote_count} votes
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {voteLeaders.length === 0 && (
                <div className="p-12 text-center">
                  <Target size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No votes cast yet this week</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Streak Leaderboard */}
        {!loading && activeTab === 'streaks' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Fire size={28} weight="fill" className="text-red-400" />
                Longest Vote Streaks
              </h2>
            </div>

            <div className="divide-y divide-gray-800">
              {streakLeaders.filter(user => (user.vote_streak || 0) > 0).map((user, index) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">
                        {getRankDisplay(index + 1)}
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      <Fire size={24} weight="fill" />
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-white text-lg mb-1">
                        {getUserDisplay(user)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatAddress(user.wallet_address)}
                      </div>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="text-xs text-gray-500 mb-1">Current Streak</div>
                      <div className="text-xl font-bold text-red-400 flex items-center justify-end gap-2">
                        <Fire size={24} weight="fill" />
                        {user.vote_streak} days
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {streakLeaders.filter(user => (user.vote_streak || 0) > 0).length === 0 && (
                <div className="p-12 text-center">
                  <Fire size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No active streaks yet</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
