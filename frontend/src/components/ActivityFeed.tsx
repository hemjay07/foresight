/**
 * Activity Feed Component
 * Shows recent activity: score changes, rank movements, achievements
 * Creates mid-week engagement by showing what's happening
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendUp, TrendDown, Trophy, Fire, Star, Lightning,
  Medal, Confetti, Crown, ArrowUp
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ActivityItem {
  id: string;
  type: 'score_update' | 'rank_change' | 'achievement' | 'viral_tweet' | 'new_team' | 'streak';
  timestamp: string;
  data: {
    team_name?: string;
    influencer_name?: string;
    influencer_handle?: string;
    old_value?: number;
    new_value?: number;
    change?: number;
    achievement_name?: string;
    achievement_icon?: string;
    message?: string;
  };
}

interface ActivityApiResponse {
  id: string;
  action_key: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface AchievementApiResponse {
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  achievement?: { name: string; description: string };
}

interface InfluencerApiResponse {
  id: number;
  display_name: string;
  twitter_handle: string;
  total_points: number;
}

interface TeamApiResponse {
  id: number;
  team_name: string;
  total_score: number;
  wallet_address: string;
  created_at: string;
}

export default function ActivityFeed() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchActivities();
    // Refresh every 60 seconds
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Generate activity from multiple sources
      const generatedActivities: ActivityItem[] = [];

      // Fetch from our activity feed API first
      try {
        const activityRes = await axios.get(`${API_URL}/api/activity/feed?limit=10`);
        if (activityRes.data.success) {
          activityRes.data.data.forEach((activity: ActivityApiResponse) => {
            generatedActivities.push({
              id: activity.id,
              type: activity.type === 'draft_team' ? 'new_team' :
                    activity.type === 'transfer' ? 'score_update' :
                    activity.type === 'claim_quest' ? 'achievement' : 'streak',
              timestamp: activity.createdAt,
              data: {
                team_name: activity.user?.username || 'Someone',
                message: activity.message,
                ...activity.metadata
              }
            });
          });
        }
      } catch (e) {
        // Silent fail - API might not exist yet
      }

      // Fetch recent achievements
      try {
        const achievementsRes = await axios.get(`${API_URL}/api/users/stats/trending`);
        const recentAchievements = achievementsRes.data.recent_achievements || [];

        recentAchievements.slice(0, 3).forEach((ach: AchievementApiResponse, index: number) => {
          generatedActivities.push({
            id: `ach-${ach.user_id}-${index}`,
            type: 'achievement',
            timestamp: ach.unlocked_at,
            data: {
              team_name: ach.username || `User ${ach.user_id.slice(0, 6)}`,
              achievement_name: ach.achievement_name,
              achievement_icon: ach.icon,
              message: `unlocked ${ach.achievement_name}`
            }
          });
        });
      } catch (e) {
        // Silent fail
      }

      // Fetch top influencers for "hot performer" activity
      try {
        const influencersRes = await axios.get(`${API_URL}/api/league/influencers`);
        const influencers = influencersRes.data.influencers || [];
        const topPerformers = influencers
          .filter((i: InfluencerApiResponse) => i.total_points >= 80)
          .slice(0, 2);

        topPerformers.forEach((inf: InfluencerApiResponse, index: number) => {
          generatedActivities.push({
            id: `hot-${inf.id}`,
            type: 'viral_tweet',
            timestamp: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
            data: {
              influencer_name: inf.name,
              influencer_handle: inf.handle,
              new_value: inf.total_points,
              message: `is on fire with ${inf.total_points} points!`
            }
          });
        });
      } catch (e) {
        // Silent fail
      }

      // Fetch leaderboard for rank activity
      try {
        const contestRes = await axios.get(`${API_URL}/api/league/contest/current`);
        if (contestRes.data.contest) {
          const leaderboardRes = await axios.get(`${API_URL}/api/league/leaderboard/${contestRes.data.contest.id}`);
          const teams = leaderboardRes.data.leaderboard || [];

          teams.slice(0, 3).forEach((team: TeamApiResponse, index: number) => {
            if (team.total_score > 0) {
              generatedActivities.push({
                id: `team-${team.id}`,
                type: 'score_update',
                timestamp: new Date(Date.now() - (index + 1) * 1800000).toISOString(),
                data: {
                  team_name: team.team_name,
                  new_value: team.total_score,
                  change: Math.floor(Math.random() * 20) + 5,
                  message: `reached ${team.total_score.toLocaleString()} points`
                }
              });
            }
          });

          // Add "new team" activities
          const recentTeams = teams.slice(-2);
          recentTeams.forEach((team: TeamApiResponse) => {
            generatedActivities.push({
              id: `new-${team.id}`,
              type: 'new_team',
              timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
              data: {
                team_name: team.team_name,
                message: 'joined the contest!'
              }
            });
          });
        }
      } catch (e) {
        // Silent fail
      }

      // Sort by timestamp descending
      generatedActivities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(generatedActivities.slice(0, 10));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching activities:', error);
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

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'score_update':
        return <TrendUp size={20} weight="fill" className="text-green-400" />;
      case 'rank_change':
        return <ArrowUp size={20} weight="fill" className="text-cyan-400" />;
      case 'achievement':
        return <Medal size={20} weight="fill" className="text-orange-400" />;
      case 'viral_tweet':
        return <Fire size={20} weight="fill" className="text-red-400" />;
      case 'new_team':
        return <Star size={20} weight="fill" className="text-yellow-400" />;
      case 'streak':
        return <Lightning size={20} weight="fill" className="text-purple-400" />;
      default:
        return <Trophy size={20} weight="fill" className="text-brand-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'score_update':
        return 'border-l-green-500 bg-green-500/5';
      case 'rank_change':
        return 'border-l-cyan-500 bg-cyan-500/5';
      case 'achievement':
        return 'border-l-orange-500 bg-orange-500/5';
      case 'viral_tweet':
        return 'border-l-red-500 bg-red-500/5';
      case 'new_team':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'streak':
        return 'border-l-purple-500 bg-purple-500/5';
      default:
        return 'border-l-brand-500 bg-brand-500/5';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-800 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-brand-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Confetti size={24} weight="fill" className="text-brand-400" />
            Live Activity
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-xs text-gray-500">
              Updated {getTimeAgo(lastRefresh.toISOString())}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-800/50 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`p-3 border-l-2 ${getActivityColor(activity.type)} transition-colors hover:bg-gray-800/30`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {activity.type === 'achievement' && activity.data.achievement_icon ? (
                  <span className="text-xl">{activity.data.achievement_icon}</span>
                ) : (
                  getActivityIcon(activity.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">
                    {activity.data.team_name || activity.data.influencer_name || 'Someone'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {activity.data.message}
                  </span>
                </div>
                {activity.data.change !== undefined && activity.data.change > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendUp size={12} weight="bold" />
                    +{activity.data.change} points
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 flex-shrink-0">
                {getTimeAgo(activity.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="p-8 text-center">
            <Confetti size={40} weight="duotone" className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No activity yet this week</p>
            <p className="text-gray-600 text-xs mt-1">Create a team to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
