/**
 * Global Leaderboard Page
 * Comprehensive rankings across all game modes and achievements
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  Trophy, Crown, Fire, Target, Medal, Sparkle, TrendUp, Users
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type LeaderboardTab = 'xp' | 'fantasy' | 'voting' | 'achievements' | 'streaks';

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

interface AchievementLeader {
  id: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  achievement_count: number;
  total_xp_from_achievements: number;
  rank: number;
}

export default function Leaderboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('xp');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all-time' | 'monthly'>('all-time');

  // Data states
  const [xpLeaders, setXpLeaders] = useState<XPLeaderUser[]>([]);
  const [fantasyLeaders, setFantasyLeaders] = useState<FantasyLeaderTeam[]>([]);
  const [voteLeaders, setVoteLeaders] = useState<VoteLeader[]>([]);
  const [achievementLeaders, setAchievementLeaders] = useState<AchievementLeader[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<XPLeaderUser[]>([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, period]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'xp') {
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 100, period },
        });
        setXpLeaders(response.data.users || []);
      } else if (activeTab === 'fantasy') {
        const response = await axios.get(`${API_URL}/api/league/leaderboard`);
        const teams = response.data.leaderboard || [];

        // Fetch user details for each team
        const teamsWithUsers = await Promise.all(
          teams.map(async (team: any) => {
            try {
              const userResponse = await axios.get(`${API_URL}/api/users/${team.user_id}`);
              return {
                ...team,
                username: userResponse.data.username,
                avatar_url: userResponse.data.avatarUrl,
              };
            } catch (error) {
              return team;
            }
          })
        );

        setFantasyLeaders(teamsWithUsers);
      } else if (activeTab === 'voting') {
        const response = await axios.get(`${API_URL}/api/league/vote/leaderboard`);
        setVoteLeaders(response.data.leaderboard || []);
      } else if (activeTab === 'achievements') {
        // TODO: Create dedicated endpoint, for now use XP leaderboard
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 100 },
        });
        setAchievementLeaders(response.data.users || []);
      } else if (activeTab === 'streaks') {
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 100 },
        });
        // Sort by vote_streak
        const sorted = (response.data.users || []).sort((a: any, b: any) =>
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
    { id: 'xp' as LeaderboardTab, label: 'XP Rankings', icon: Crown, color: 'cyan' },
    { id: 'fantasy' as LeaderboardTab, label: 'Fantasy Draft', icon: Trophy, color: 'yellow' },
    { id: 'voting' as LeaderboardTab, label: 'Vote Leaders', icon: Target, color: 'purple' },
    { id: 'achievements' as LeaderboardTab, label: 'Achievement Hunters', icon: Medal, color: 'orange' },
    { id: 'streaks' as LeaderboardTab, label: 'Streak Masters', icon: Fire, color: 'red' },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Get tier badge based on rank
  const getTierBadge = (rank: number) => {
    if (rank <= 10) return {
      icon: '🥇',
      text: 'Elite',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'
    };
    if (rank <= 100) return {
      icon: '🥈',
      text: 'Pro',
      color: 'text-gray-300',
      bg: 'bg-gray-500/20',
      border: 'border-gray-400/50',
      glow: 'shadow-[0_0_15px_rgba(156,163,175,0.2)]'
    };
    if (rank <= 1000) return {
      icon: '🥉',
      text: 'Rising',
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      glow: ''
    };
    return null;
  };

  // Get rank color and styling
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

  const getUserDisplay = (user: any) => {
    if (user.username) return user.username;
    return formatAddress(user.wallet_address);
  };

  const isCurrentUser = (userId: number | string) => {
    // Compare wallet addresses if available
    return false; // TODO: Implement user ID comparison
  };

  // Calculate average score
  const calculateAverage = (leaders: any[], scoreKey: string) => {
    if (leaders.length === 0) return 0;
    const sum = leaders.reduce((acc, item) => acc + (item[scoreKey] || 0), 0);
    return sum / leaders.length;
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

        {/* Tabs */}
        <div className="mb-8 overflow-x-auto">
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
                      ? `bg-${tab.color}-500/20 text-${tab.color}-400 border-2 border-${tab.color}-500/50`
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
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
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
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Average: <span className="text-cyan-400 font-bold">{calculateAverage(xpLeaders, period === 'all-time' ? 'lifetime_xp' : 'xp').toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> XP
                  </div>
                  <div className="text-sm text-gray-500">
                    {xpLeaders.length} players
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {xpLeaders.map((user) => {
                const level = getNumericLevel(user.lifetime_xp || user.xp);
                const tierBadge = getTierBadge(user.rank);
                const userXP = period === 'all-time' ? user.lifetime_xp : user.xp;
                const avgXP = calculateAverage(xpLeaders, period === 'all-time' ? 'lifetime_xp' : 'xp');
                const isAboveAverage = userXP > avgXP;

                return (
                  <div
                    key={user.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors relative ${
                      isCurrentUser(user.id) ? 'bg-cyan-500/10' : ''
                    } ${tierBadge ? tierBadge.glow : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-16 text-center">
                        <div className={getRankStyle(user.rank)}>
                          {getRankDisplay(user.rank)}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" loading="lazy" />
                        ) : (
                          <Users size={24} weight="fill" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-lg">
                            {getUserDisplay(user)}
                          </span>
                          {isCurrentUser(user.id) && (
                            <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
                              You
                            </span>
                          )}
                          {tierBadge && (
                            <span className={`px-2 py-0.5 text-xs font-bold ${tierBadge.bg} ${tierBadge.color} border ${tierBadge.border} rounded flex items-center gap-1`}>
                              <span>{tierBadge.icon}</span>
                              {tierBadge.text}
                            </span>
                          )}
                          {isAboveAverage && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded flex items-center gap-1">
                              <TrendUp size={12} weight="bold" />
                              Above Avg
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatAddress(user.wallet_address)}
                        </div>
                      </div>

                      {/* Level Badge */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Level</div>
                        <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg">
                          <span className="text-cyan-400 font-bold">{level}</span>
                        </div>
                      </div>

                      {/* XP */}
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Trophy size={28} weight="fill" className="text-yellow-400" />
                  Fantasy Draft Leaders
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Average: <span className="text-yellow-400 font-bold">{calculateAverage(fantasyLeaders, 'total_score').toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> pts
                  </div>
                  <div className="text-sm text-gray-500">
                    Current Week
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {fantasyLeaders.map((team) => {
                const tierBadge = getTierBadge(team.rank);
                const avgScore = calculateAverage(fantasyLeaders, 'total_score');
                const isAboveAverage = team.total_score > avgScore;

                return (
                  <div
                    key={team.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors ${tierBadge ? tierBadge.glow : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-16 text-center">
                        <div className={getRankStyle(team.rank)}>
                          {getRankDisplay(team.rank)}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {team.avatar_url ? (
                          <img src={team.avatar_url} alt="" className="w-full h-full rounded-full" loading="lazy" />
                        ) : (
                          <Trophy size={24} weight="fill" />
                        )}
                      </div>

                      {/* Team Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-lg">
                            {team.team_name}
                          </span>
                          {tierBadge && (
                            <span className={`px-2 py-0.5 text-xs font-bold ${tierBadge.bg} ${tierBadge.color} border ${tierBadge.border} rounded flex items-center gap-1`}>
                              <span>{tierBadge.icon}</span>
                              {tierBadge.text}
                            </span>
                          )}
                          {isAboveAverage && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded flex items-center gap-1">
                              <TrendUp size={12} weight="bold" />
                              Above Avg
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {team.username || `User ${team.user_id}`}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">Total Score</div>
                        <div className="text-xl font-bold text-yellow-400">
                          {team.total_score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Target size={28} weight="fill" className="text-purple-400" />
                  Weekly Vote Leaders
                </h2>
                <div className="text-sm text-gray-500">
                  Most Voted Influencers
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {voteLeaders.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">
                        {getRankDisplay(index + 1)}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {influencer.profile_image_url ? (
                        <img src={influencer.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Sparkle size={24} weight="fill" />
                      )}
                    </div>

                    {/* Influencer Info */}
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg mb-1">
                        {influencer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{influencer.handle}
                      </div>
                    </div>

                    {/* Tier */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Tier</div>
                      <div className={`px-3 py-1 rounded-lg font-bold ${
                        influencer.tier === 'S' ? 'bg-yellow-500/20 text-yellow-400' :
                        influencer.tier === 'A' ? 'bg-cyan-500/20 text-cyan-400' :
                        influencer.tier === 'B' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {influencer.tier}
                      </div>
                    </div>

                    {/* Votes */}
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Fire size={28} weight="fill" className="text-red-400" />
                  Longest Vote Streaks
                </h2>
                <div className="text-sm text-gray-500">
                  Consistency Champions
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {streakLeaders.filter(user => (user.vote_streak || 0) > 0).map((user, index) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">
                        {getRankDisplay(index + 1)}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        <Fire size={24} weight="fill" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg mb-1">
                        {getUserDisplay(user)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatAddress(user.wallet_address)}
                      </div>
                    </div>

                    {/* Streak */}
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

        {/* Achievement Leaders - Coming Soon */}
        {!loading && activeTab === 'achievements' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
            <Medal size={64} weight="duotone" className="mx-auto mb-4 text-orange-400 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400">
              Achievement leaderboard will show players with the most achievements unlocked
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
