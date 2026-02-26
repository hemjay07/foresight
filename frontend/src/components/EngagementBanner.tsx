/**
 * Engagement Banner Component
 * Shows contextual notifications to drive mid-week engagement
 * Examples: "Your team moved up 3 spots!", "New scores updated", "2 days left!"
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { X, TrendUp, Clock, Trophy, Fire, Lightning, Bell } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface BannerMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  icon: React.ReactNode;
  message: string;
  action?: {
    label: string;
    link: string;
  };
  dismissible: boolean;
}

export default function EngagementBanner() {
  const { address } = useAuth();
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkForNotifications();
    // Check every 5 minutes
    const interval = setInterval(checkForNotifications, 300000);
    return () => clearInterval(interval);
  }, [address]);

  // Load dismissed banners from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_banners');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only keep dismissals from last 24 hours
      const recent = parsed.filter((d: { id: string; time: number }) =>
        Date.now() - d.time < 86400000
      );
      setDismissed(new Set(recent.map((d: { id: string }) => d.id)));
    }
  }, []);

  const checkForNotifications = async () => {
    try {
      // Get current contest info
      const contestRes = await axios.get(`${API_URL}/api/league/contest/current`);
      if (!contestRes.data.contest) return;

      const contest = contestRes.data.contest;

      // Only show time-based banners for active contests
      if (contest.status !== 'active') {
        // Check if there's an upcoming contest to promote
        const messages: BannerMessage[] = [];

        if (contest.status === 'upcoming') {
          const startDate = new Date(contest.start_date);
          const now = new Date();
          const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilStart <= 2) {
            messages.push({
              id: `upcoming-${contest.id}`,
              type: 'info',
              icon: <Trophy size={20} weight="fill" />,
              message: daysUntilStart === 0
                ? 'New contest starts today!'
                : `New contest starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}!`,
              action: { label: 'Get Ready', link: '/compete?tab=contests' },
              dismissible: true
            });
          }
        }

        const activeBanner = messages.find(m => !dismissed.has(m.id));
        setBanner(activeBanner || null);
        return;
      }

      const endDate = new Date(contest.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Priority order for banner messages
      const messages: BannerMessage[] = [];

      // 1. Urgent: Last day of contest (only if contest is actually active and days remaining)
      if (daysRemaining >= 0 && daysRemaining <= 1) {
        messages.push({
          id: `urgent-${contest.id}-lastday`,
          type: 'urgent',
          icon: <Clock size={20} weight="fill" />,
          message: daysRemaining === 0
            ? 'Contest ends today! Make your final picks.'
            : 'Only 1 day left in the contest!',
          action: { label: 'Check Scores', link: '/compete?tab=rankings' },
          dismissible: true
        });
      }

      // 2. Mid-week reminder (day 3-4)
      if (daysRemaining === 3 || daysRemaining === 4) {
        messages.push({
          id: `midweek-${contest.id}`,
          type: 'info',
          icon: <Bell size={20} weight="fill" />,
          message: `${daysRemaining} days left to climb the rankings!`,
          action: { label: 'View Leaderboard', link: '/compete?tab=rankings' },
          dismissible: true
        });
      }

      // 3. If user is connected but hasn't created a team
      if (address) {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('No token');

          const teamRes = await axios.get(`${API_URL}/api/league/team/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!teamRes.data.team) {
            messages.push({
              id: `noteam-${contest.id}`,
              type: 'warning',
              icon: <Trophy size={20} weight="fill" />,
              message: 'You haven\'t joined this week\'s contest yet!',
              action: { label: 'Draft Now', link: '/compete?tab=contests' },
              dismissible: true
            });
          }
        } catch (e) {
          // User might not have a team or not authenticated
          messages.push({
            id: `noteam-${contest.id}`,
            type: 'warning',
            icon: <Trophy size={20} weight="fill" />,
            message: 'Join this week\'s contest!',
            action: { label: 'Draft Now', link: '/compete?tab=contests' },
            dismissible: true
          });
        }
      }

      // 4. Scores recently updated
      const lastUpdate = new Date(contestRes.data.contest.updated_at || contest.start_date);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 2) {
        messages.push({
          id: `scores-updated-${now.toDateString()}`,
          type: 'success',
          icon: <TrendUp size={20} weight="fill" />,
          message: 'Scores just updated! Check your ranking.',
          action: { label: 'View Scores', link: '/compete?tab=rankings' },
          dismissible: true
        });
      }

      // 5. New user welcome
      if (address && !localStorage.getItem('returning_user')) {
        messages.push({
          id: 'welcome-new-user',
          type: 'info',
          icon: <Fire size={20} weight="fill" />,
          message: 'Welcome to Foresight! Draft your first team.',
          action: { label: 'Get Started', link: '/compete?tab=contests' },
          dismissible: true
        });
        localStorage.setItem('returning_user', 'true');
      }

      // Filter out dismissed banners and show highest priority
      const activeBanner = messages.find(m => !dismissed.has(m.id));
      setBanner(activeBanner || null);

    } catch (error) {
      // Silent fail - banner is optional
      console.error('Error checking notifications:', error);
    }
  };

  const dismissBanner = () => {
    if (!banner) return;

    const newDismissed = new Set(dismissed);
    newDismissed.add(banner.id);
    setDismissed(newDismissed);

    // Store in localStorage
    const stored = [...newDismissed].map(id => ({ id, time: Date.now() }));
    localStorage.setItem('dismissed_banners', JSON.stringify(stored));

    setBanner(null);
  };

  if (!banner) return null;

  const bgColors = {
    info: 'bg-gradient-to-r from-gold-600/20 via-gold-500/10 to-transparent border-gold-500/30',
    success: 'bg-gradient-to-r from-green-600/20 via-green-500/10 to-transparent border-green-500/30',
    warning: 'bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-transparent border-yellow-500/30',
    urgent: 'bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-red-500/30'
  };

  const iconColors = {
    info: 'text-gold-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    urgent: 'text-red-400'
  };

  return (
    <div className={`border-b ${bgColors[banner.type]}`}>
      <div className="container-app py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={iconColors[banner.type]}>
              {banner.icon}
            </span>
            <span className="text-sm text-white font-medium">
              {banner.message}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {banner.action && (
              <Link
                to={banner.action.link}
                className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${
                  banner.type === 'urgent'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : banner.type === 'warning'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : banner.type === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gold-500 hover:bg-gold-600 text-white'
                }`}
              >
                {banner.action.label}
              </Link>
            )}

            {banner.dismissible && (
              <button
                onClick={dismissBanner}
                className="text-gray-500 hover:text-white transition-colors p-1"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
