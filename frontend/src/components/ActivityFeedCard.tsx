/**
 * ActivityFeedCard — Shows recent social activity on the Home page
 *
 * Competition-focused: drafts, scores, follows — NOT chat.
 * 6 items max, auto-refreshes every 30s.
 * Makes the app feel alive with FOMO triggers.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { hasSession } from '../lib/apiClient';
import {
  Lightning,
  Trophy,
  UserPlus,
  Star,
  ArrowRight,
  Users,
} from '@phosphor-icons/react';

interface ActivityItem {
  type: string;
  timestamp: string;
  actor: { id: string; username: string };
  target?: { id: string; username?: string };
}

export default function ActivityFeedCard() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get(`/api/tapestry/activity`);
      if (res.data?.data?.activity) {
        setActivity(res.data.data.activity.slice(0, 6));
      }
    } catch {
      // Silent fail — activity feed is optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={14} weight="fill" className="text-gray-400" />;
      case 'content_create':
        return <Trophy size={14} weight="fill" className="text-gold-400" />;
      case 'like':
        return <Star size={14} weight="fill" className="text-yellow-400" />;
      default:
        return <Lightning size={14} weight="fill" className="text-gray-400" />;
    }
  };

  const getActivityText = (item: ActivityItem) => {
    const actor = item.actor.username || 'Someone';
    switch (item.type) {
      case 'follow':
        return (
          <>
            <span className="text-white font-medium">{actor}</span>
            {' followed '}
            <span className="text-white font-medium">{item.target?.username || 'a player'}</span>
          </>
        );
      case 'content_create':
        return (
          <>
            <span className="text-white font-medium">{actor}</span>
            {' drafted a new team'}
          </>
        );
      case 'like':
        return (
          <>
            <span className="text-white font-medium">{actor}</span>
            {' liked a team'}
          </>
        );
      default:
        return (
          <>
            <span className="text-white font-medium">{actor}</span>
            {' was active'}
          </>
        );
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Don't render if no session (not logged in)
  if (!hasSession()) return null;

  // Show placeholder with 0 items
  if (!loading && activity.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightning size={18} weight="fill" className="text-gold-400" />
            <h3 className="font-semibold text-white text-sm">Activity</h3>
          </div>
        </div>
        <div className="text-center py-4">
          <Users size={28} className="mx-auto mb-2 text-gray-600" />
          <p className="text-xs text-gray-500">No recent activity yet</p>
          <Link
            to="/compete"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-2"
          >
            Browse Contests <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightning size={18} weight="fill" className="text-gold-400" />
          <h3 className="font-semibold text-white text-sm">Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightning size={18} weight="fill" className="text-gold-400" />
          <h3 className="font-semibold text-white text-sm">Activity</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {activity.map((item, idx) => (
          <div
            key={`${item.type}-${item.actor.id}-${idx}`}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
              {getActivityIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">
                {getActivityText(item)}
              </p>
            </div>
            <span className="text-[10px] text-gray-600 shrink-0">
              {item.timestamp ? getTimeAgo(item.timestamp) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
