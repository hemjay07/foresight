/**
 * User Stats Page
 * Comprehensive analytics dashboard for logged-in users
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ChartBar, Trophy, Fire, Target, Medal, Crown, TrendUp, Lock, ArrowRight
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UserStats {
  user: {
    id: number;
    username?: string;
    wallet_address: string;
    avatar_url?: string;
    xp: number;
    lifetime_xp: number;
    vote_streak: number;
    ct_mastery_score: number;
    ct_mastery_level: number;
  };
  ranking: {
    rank: number;
    percentile: number;
    total_users: number;
  };
  stats: {
    voting: {
      total_votes: number;
      current_streak: number;
    };
    fantasy: {
      total_teams: number;
      best_score: number;
      avg_score: number;
    };
    achievements: {
      total_unlocked: number;
      xp_earned: number;
    };
  };
  xp_history: Array<{
    date: string;
    xp_earned: number;
    source: string;
  }>;
  xp_by_source: Array<{
    source: string;
    total_xp: number;
    count: number;
  }>;
}

export default function UserStats() {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    if (isConnected) {
      fetchUserStats();
    }
  }, [isConnected]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 max-w-md w-full text-center">
          <Lock size={64} weight="bold" className="mx-auto mb-6 text-cyan-400" />
          <h2 className="text-3xl font-semibold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 text-lg mb-6">
            Connect your wallet to view your comprehensive stats and analytics
          </p>
          <div className="text-sm text-gray-500">
            Click "Connect Wallet" in the top right
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 max-w-md w-full text-center">
          <ChartBar size={64} className="mx-auto mb-6 text-gray-600" />
          <h2 className="text-2xl font-semibold text-white mb-4">No Stats Yet</h2>
          <p className="text-gray-400 mb-6">
            Start participating to see your stats here
          </p>
          <Link to="/vote" className="btn btn-brand">
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  const level = getNumericLevel(stats.user.lifetime_xp);
  const xpForNextLevel = (level + 1) * 100; // Simplified calculation
  const progressToNextLevel = ((stats.user.lifetime_xp % 100) / 100) * 100;

  // Aggregate XP history by date
  const historyByDate = stats.xp_history.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = 0;
    }
    acc[entry.date] += parseInt(entry.xp_earned as any);
    return acc;
  }, {} as Record<string, number>);

  const historyDates = Object.keys(historyByDate).sort();
  const maxXP = Math.max(...Object.values(historyByDate), 1);

  // Calculate total XP by source
  const totalXPFromSources = stats.xp_by_source.reduce((sum, source) =>
    sum + parseInt(source.total_xp as any), 0);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mb-6 shadow-lg">
              <ChartBar size={48} weight="bold" className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Analytics
            </h1>
            <p className="text-xl text-gray-400">
              Comprehensive performance insights and statistics
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Rank */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <Crown size={24} className="text-yellow-400" weight="fill" />
              <div className="text-sm text-gray-500">Global Rank</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              #{stats.ranking.rank.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              Top {stats.ranking.percentile}% of {stats.ranking.total_users.toLocaleString()} players
            </div>
          </div>

          {/* Level & XP */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <Trophy size={24} className="text-cyan-400" weight="fill" />
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              Level {level}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{stats.user.lifetime_xp.toLocaleString()} XP</span>
                <span>{xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${progressToNextLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <Fire size={24} className="text-red-400" weight="fill" />
              <div className="text-sm text-gray-500">Current Streak</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Fire size={32} weight="fill" className="text-red-400" />
              {stats.stats.voting.current_streak}
            </div>
            <div className="text-sm text-gray-400">
              {stats.stats.voting.total_votes} total votes cast
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <Medal size={24} className="text-orange-400" weight="fill" />
              <div className="text-sm text-gray-500">Achievements</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.stats.achievements.total_unlocked}
            </div>
            <div className="text-sm text-gray-400">
              +{stats.stats.achievements.xp_earned} XP earned
            </div>
          </div>
        </div>

        {/* XP History Chart */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendUp size={28} weight="fill" className="text-cyan-400" />
              XP History (Last 30 Days)
            </h2>
          </div>

          {historyDates.length > 0 ? (
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                <span>{maxXP}</span>
                <span>{Math.round(maxXP * 0.75)}</span>
                <span>{Math.round(maxXP * 0.5)}</span>
                <span>{Math.round(maxXP * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart */}
              <div className="ml-12 h-full flex items-end gap-1">
                {historyDates.map((date, index) => {
                  const xp = historyByDate[date];
                  const height = (xp / maxXP) * 100;
                  const dateObj = new Date(date);
                  const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                            <div className="font-bold text-cyan-400">+{xp} XP</div>
                            <div className="text-gray-500">{displayDate}</div>
                          </div>
                        </div>
                      </div>
                      {index % 3 === 0 && (
                        <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                          {displayDate}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No XP activity in the last 30 days
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* XP Sources Breakdown */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">XP by Source</h3>
            <div className="space-y-3">
              {stats.xp_by_source.map((source) => {
                const percentage = totalXPFromSources > 0 ?
                  (parseInt(source.total_xp as any) / totalXPFromSources) * 100 : 0;

                return (
                  <div key={source.source}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400 capitalize">{source.source}</span>
                      <span className="font-bold text-cyan-400">
                        {parseInt(source.total_xp as any).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {source.count} activities ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}

              {stats.xp_by_source.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No XP earned yet
                </div>
              )}
            </div>
          </div>

          {/* Fantasy Stats */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Fantasy Draft Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Teams Created</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.stats.fantasy.total_teams}
                  </div>
                </div>
                <Trophy size={32} className="text-yellow-400" weight="fill" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Best Score</div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.stats.fantasy.best_score.toLocaleString()}
                  </div>
                </div>
                <Target size={32} className="text-green-400" weight="fill" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Average Score</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.stats.fantasy.avg_score.toFixed(0)}
                  </div>
                </div>
                <ChartBar size={32} className="text-blue-400" weight="fill" />
              </div>

              {stats.stats.fantasy.total_teams === 0 && (
                <div className="text-center py-6">
                  <Trophy size={48} className="mx-auto mb-3 text-gray-600" weight="duotone" />
                  <p className="text-gray-400 mb-4">No fantasy teams yet</p>
                  <Link
                    to="/draft"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Your First Team
                    <ArrowRight size={16} weight="bold" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/leaderboard"
            className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl hover:border-cyan-500/50 transition-all group"
          >
            <Trophy size={32} className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform" weight="fill" />
            <h4 className="font-bold text-white mb-1">View Leaderboards</h4>
            <p className="text-sm text-gray-400">See how you rank globally</p>
          </Link>

          <Link
            to="/profile"
            className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30 rounded-xl hover:border-orange-500/50 transition-all group"
          >
            <Medal size={32} className="text-orange-400 mb-3 group-hover:scale-110 transition-transform" weight="fill" />
            <h4 className="font-bold text-white mb-1">View Achievements</h4>
            <p className="text-sm text-gray-400">Check your unlocked badges</p>
          </Link>

          <Link
            to="/vote"
            className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all group"
          >
            <Target size={32} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" weight="fill" />
            <h4 className="font-bold text-white mb-1">Cast Your Vote</h4>
            <p className="text-sm text-gray-400">Keep your streak going</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
