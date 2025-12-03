/**
 * Trending Stats Component
 * Shows weekly highlights: top gainers, streaks, recent achievements
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendUp, Fire, Trophy, Sparkle, Medal } from '@phosphor-icons/react';
import { EmptyStateInline } from './EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TrendingUser {
  id: number;
  username?: string;
  wallet_address: string;
  avatar_url?: string;
  xp_gained?: number;
  vote_count?: number;
  vote_streak?: number;
}

interface RecentAchievement {
  user_id: number;
  username?: string;
  wallet_address: string;
  avatar_url?: string;
  achievement_name: string;
  icon: string;
  rarity: string;
  unlocked_at: string;
}

export default function TrendingStats() {
  const [loading, setLoading] = useState(true);
  const [topGainers, setTopGainers] = useState<TrendingUser[]>([]);
  const [topVoters, setTopVoters] = useState<TrendingUser[]>([]);
  const [topStreaks, setTopStreaks] = useState<TrendingUser[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/stats/trending`);
      setTopGainers(response.data.top_gainers || []);
      setTopVoters(response.data.top_voters || []);
      setTopStreaks(response.data.top_streaks || []);
      setRecentAchievements(response.data.recent_achievements || []);
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getUserDisplay = (user: TrendingUser | RecentAchievement) => {
    if (user.username) return user.username;
    return formatAddress(user.wallet_address);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top XP Gainers This Week */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-cyan-500/10 to-transparent">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendUp size={24} weight="fill" className="text-cyan-400" />
            Top XP Gainers This Week
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {topGainers.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <div className="text-lg font-bold text-cyan-400 w-6">
                #{index + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
                ) : (
                  getUserDisplay(user).slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">
                  {getUserDisplay(user)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatAddress(user.wallet_address)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-cyan-400">
                  +{parseInt(user.xp_gained as any).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
            </div>
          ))}
          {topGainers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <TrendUp size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
              <p>No XP gained this week yet</p>
              <p className="text-xs text-gray-600 mt-1">Be the first to level up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Hot Streaks */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-red-500/10 to-transparent">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Fire size={24} weight="fill" className="text-red-400" />
            Longest Streaks
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {topStreaks.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <div className="text-lg font-bold text-red-400 w-6">
                #{index + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                <Fire size={20} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">
                  {getUserDisplay(user)}
                </div>
                <div className="text-xs text-gray-500">
                  Consistency champion
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-400 flex items-center gap-1">
                  <Fire size={16} weight="fill" />
                  {user.vote_streak}
                </div>
                <div className="text-xs text-gray-500">days</div>
              </div>
            </div>
          ))}
          {topStreaks.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Fire size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
              <p>No active streaks yet</p>
              <p className="text-xs text-gray-600 mt-1">Start voting daily to build a streak!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-orange-500/10 to-transparent">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Medal size={24} weight="fill" className="text-orange-400" />
            Recent Achievements
          </h3>
        </div>
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {recentAchievements.slice(0, 10).map((achievement, index) => (
            <div
              key={`${achievement.user_id}-${achievement.unlocked_at}-${index}`}
              className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">
                    {getUserDisplay(achievement)}
                  </span>
                  <span className="text-xs text-gray-600">unlocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">
                    {achievement.achievement_name}
                  </span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full capitalize
                    ${achievement.rarity === 'legendary' ? 'bg-cyan-500/20 text-cyan-400' :
                      achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                      achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'}
                  `}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {getTimeAgo(achievement.unlocked_at)}
              </div>
            </div>
          ))}
          {recentAchievements.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Medal size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
              <p>No achievements unlocked this week</p>
              <p className="text-xs text-gray-600 mt-1">Complete challenges to earn badges!</p>
            </div>
          )}
        </div>
      </div>

      {/* Most Active Voters */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-transparent">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={24} weight="fill" className="text-purple-400" />
            Most Active Voters
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {topVoters.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <div className="text-lg font-bold text-purple-400 w-6">
                #{index + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Sparkle size={20} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">
                  {getUserDisplay(user)}
                </div>
                <div className="text-xs text-gray-500">
                  Active participant
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-400">
                  {parseInt(user.vote_count as any)}
                </div>
                <div className="text-xs text-gray-500">votes</div>
              </div>
            </div>
          ))}
          {topVoters.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Trophy size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
              <p>No votes cast this week</p>
              <p className="text-xs text-gray-600 mt-1">Be an early voter and earn XP!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
