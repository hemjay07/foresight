import { useState, useEffect } from 'react';
import { Medal, TrendUp } from '@phosphor-icons/react';
import axios from 'axios';
import AchievementBadge from './AchievementBadge';
import { EmptyState } from './EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

interface RecentAchievementsProps {
  limit?: number;
  showUsernames?: boolean;
}

const RecentAchievements = ({ limit = 6, showUsernames = false }: RecentAchievementsProps) => {
  const [achievements, setAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAchievements();
  }, []);

  const fetchRecentAchievements = async () => {
    try {
      setLoading(true);
      // Fetch community-wide recent achievements from trending endpoint
      const response = await axios.get(`${API_URL}/api/users/stats/trending`);

      // Get recent achievements from the response
      const recentAchievements = response.data.recent_achievements || [];
      setAchievements(recentAchievements.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recent achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <TrendUp size={24} weight="fill" className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
        </div>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Medal size={24} weight="fill" className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
        </div>
        <EmptyState
          icon="star"
          title="No Achievements Yet"
          description="Be the first to unlock an achievement and inspire the community!"
          iconSize={48}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendUp size={24} weight="fill" className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          {achievements.length} unlocked
        </div>
      </div>

      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <div
            key={`${achievement.user_id}-${achievement.achievement_name}-${achievement.unlocked_at}-${index}`}
            className="flex items-center gap-4 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            {/* Achievement Badge */}
            <div className="flex-shrink-0">
              <AchievementBadge
                icon={achievement.icon}
                name={achievement.achievement_name}
                description=""
                rarity={achievement.rarity as any}
                unlocked={true}
                unlockedAt={achievement.unlocked_at}
                size="sm"
              />
            </div>

            {/* Achievement Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm truncate">
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
              {showUsernames && (
                <div className="text-xs text-gray-400 mt-1">
                  by {achievement.username || `${achievement.wallet_address.slice(0, 6)}...${achievement.wallet_address.slice(-4)}`}
                </div>
              )}
            </div>

            {/* Time ago */}
            <div className="flex-shrink-0 text-xs text-gray-600">
              {getTimeAgo(achievement.unlocked_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAchievements;
