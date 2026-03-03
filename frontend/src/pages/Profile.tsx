/**
 * Profile - User Profile Hub
 * 3-tab layout: Overview · Contests · Watchlist
 * Gold + dark design system
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient, { hasSession } from '../lib/apiClient';
import {
  Users, Trophy, Crown, Sparkle, Star, Fire, TrendUp,
  CheckCircle, Medal, Gear, PencilSimple,
  Check, X, CaretRight, ChartBar,
  Copy, UserCircle, Target, Binoculars, Trash, XLogo,
  Sun, Newspaper, Eye, Chat, Diamond, Flame,
} from '@phosphor-icons/react';
import ForesightScoreDisplay from '../components/ForesightScoreDisplay';
import { ShareProfileButton } from '../components/ShareableProfileCard';
import FormationPreview from '../components/FormationPreview';
import TapestryBadge from '../components/TapestryBadge';
import ShareTeamCard from '../components/ShareTeamCard';
import { getXPLevel, formatXP } from '../utils/xp';
import { getAvatarUrl } from '../utils/avatar';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

const QUEST_ICONS: Record<string, React.ElementType> = {
  wallet: Fire, user: Users, users: Users, trophy: Trophy,
  twitter: XLogo, share: Star, star: Star, sun: Sun,
  chart: TrendUp, target: Target, message: Chat, 'check-circle': CheckCircle,
  medal: Medal, fire: Flame, crown: Crown, eye: Eye, diamond: Diamond,
  newspaper: Newspaper, sparkle: Sparkle,
};

type ProfileTab = 'overview' | 'contests' | 'watchlist';

interface HistoryPick {
  id: number;
  name: string;
  handle: string;
  tier: string;
  avatarUrl: string | null;
  price: number;
  isCaptain: boolean;
  points: number;
  effectivePoints: number;
}

interface HistoryEntry {
  contestId: number;
  contestName: string;
  contestType: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  score: number;
  rank: number | null;
  totalPlayers: number | null;
  prizeWon: number;
  claimed: boolean;
  scoreBreakdown: { activity: number; engagement: number; growth: number; viral: number };
  picks: HistoryPick[];
  tapestryVerified: boolean;
  onChainId: string;
  enteredAt: string;
}

interface CareerStats {
  totalContests: number;
  wins: number;
  topThree: number;
  avgScore: number;
  bestScore: number;
  bestRank: number | null;
}

interface QuestItem {
  id: string;
  name: string;
  description: string;
  questType: string;
  category: string;
  target: number;
  fsReward: number;
  icon: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface Pick {
  id: number;
  influencer_name: string;
  influencer_handle: string;
  influencer_tier: string;
  total_points: number;
  profile_image_url?: string;
}

interface Team {
  id: number;
  team_name: string;
  total_score: number;
  rank?: number;
  picks: Pick[];
  total_budget_used: number;
  max_budget: number;
}

interface UserStats {
  xp: number;
  voteStreak: number;
  totalVotes: number;
  contestsEntered: number;
  totalWins: number;
  bestRank: number | null;
}

interface TodayActions {
  hasVotedThisWeek: boolean;
  dailyQuestsCompleted: number;
  dailyQuestsTotal: number;
  claimableRewards: number;
}

interface WatchlistItem {
  id: string;
  notes: string | null;
  scoutedAt: string;
  influencer: {
    id: number;
    handle: string;
    name: string;
    avatar: string;
    tier: string;
    price: number;
    totalPoints: number;
    followers: number;
    engagementRate: number;
  };
}

export default function Profile() {
  const { address, isConnected, isBackendAuthed } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as ProfileTab) || 'overview';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<UserStats>({ xp: 0, voteStreak: 0, totalVotes: 0, contestsEntered: 0, totalWins: 0, bestRank: null });
  const [username, setUsername] = useState<string>('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [actions, setActions] = useState<TodayActions>({
    hasVotedThisWeek: false,
    dailyQuestsCompleted: 0,
    dailyQuestsTotal: 3,
    claimableRewards: 0,
  });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [tapestryStatus, setTapestryStatus] = useState<{ connected: boolean; tapestryUserId: string | null; walletAddress: string | null }>({ connected: false, tapestryUserId: null, walletAddress: null });
  const [socialCounts, setSocialCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [tapestryContent, setTapestryContent] = useState<Array<{ id: string; properties: Record<string, string>; likeCount: number; commentCount: number }>>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [quests, setQuests] = useState<QuestItem[]>([]);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab]);

  useEffect(() => {
    if (isConnected && isBackendAuthed) {
      fetchUserData();
    } else if (!isConnected) {
      setLoading(false);
    }
  }, [isConnected, isBackendAuthed, address]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      if (!hasSession()) { setLoading(false); return; }

      const [profileRes, teamRes, actionsRes, watchlistRes, questsRes] = await Promise.all([
        apiClient.get('/api/users/me').catch(() => ({ data: null })),
        apiClient.get('/api/v2/me/latest-entry').catch(() => ({ data: { entry: null } })),
        apiClient.get('/api/v2/quests/summary').catch(() => ({ data: { success: false } })),
        apiClient.get('/api/watchlist').catch(() => ({ data: { success: false } })),
        apiClient.get('/api/v2/quests').catch(() => ({ data: { success: false } })),
      ]);

      if (profileRes.data?.data) {
        setUsername(profileRes.data.data.username || '');
        setStats({
          xp: profileRes.data.data.xp || 0,
          voteStreak: profileRes.data.data.voteStreak || 0,
          totalVotes: profileRes.data.data.totalVotes || 0,
          contestsEntered: profileRes.data.data.contestsEntered || 0,
          totalWins: profileRes.data.data.totalWins || 0,
          bestRank: profileRes.data.data.bestRank || null,
        });
      }

      if (teamRes.data?.entry) {
        setMyTeam(teamRes.data.entry);
      }

      if (actionsRes.data?.data) {
        setActions({
          hasVotedThisWeek: actionsRes.data.data.hasVotedThisWeek || false,
          dailyQuestsCompleted: actionsRes.data.data.dailyCompleted || 0,
          dailyQuestsTotal: actionsRes.data.data.dailyTotal || 3,
          claimableRewards: actionsRes.data.data.claimable || 0,
        });
      }

      if (watchlistRes.data?.success && watchlistRes.data?.data?.watchlist) {
        setWatchlist(watchlistRes.data.data.watchlist);
      }

      if (questsRes.data?.success && questsRes.data?.data?.quests) {
        const g = questsRes.data.data.quests;
        setQuests([
          ...(g.onboarding || []),
          ...(g.daily || []),
          ...(g.weekly || []),
          ...(g.achievement || []),
        ]);
      }

      // Fetch Tapestry status + social data (non-blocking)
      apiClient.get('/api/auth/tapestry-status')
        .then((res) => {
          if (res.data?.data) {
            const tId = res.data.data.tapestryUserId;
            const wa = res.data.data.walletAddress;
            const isSolana = wa && !wa.startsWith('0x') && wa.length >= 32 && wa.length <= 44;
            setTapestryStatus({
              connected: res.data.data.connected,
              tapestryUserId: tId,
              walletAddress: isSolana ? wa : null,
            });
            if (tId) {
              apiClient.get(`/api/tapestry/social-counts/${tId}`)
                .then((r) => { if (r.data?.data) setSocialCounts(prev => ({ ...prev, followers: r.data.data.followers ?? 0 })); })
                .catch(() => {});
              apiClient.get('/api/tapestry/my-following')
                .then((r) => { if (r.data?.data?.following) setSocialCounts(prev => ({ ...prev, following: r.data.data.following.length })); })
                .catch(() => {});
              apiClient.get(`/api/tapestry/content/${tId}`)
                .then((r) => { if (r.data?.data?.content) setTapestryContent(r.data.data.content); })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (offset = 0) => {
    try {
      setHistoryLoading(true);
      if (!hasSession()) return;
      const res = await apiClient.get(`/api/v2/me/history?limit=20&offset=${offset}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (offset === 0) {
          setHistory(d.history);
        } else {
          setHistory(prev => [...prev, ...d.history]);
        }
        setCareerStats(d.careerStats);
        setHistoryTotal(d.total);
        setHistoryLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    try {
      if (!hasSession() || !tempUsername.trim()) return;

      await apiClient.patch(
        '/api/users/profile',
        { username: tempUsername.trim() }
      );

      setUsername(tempUsername.trim());
      setIsEditingUsername(false);
      showToast(`Username updated!`, 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update username', 'error');
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const removeFromWatchlist = async (influencerId: number, influencerName: string) => {
    try {
      setRemovingId(influencerId);
      if (!hasSession()) return;

      await apiClient.delete(`/api/watchlist/${influencerId}`);

      setWatchlist((prev) => prev.filter((item) => item.influencer.id !== influencerId));
      showToast(`Removed @${influencerName} from watchlist`, 'success');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      showToast('Failed to remove from watchlist', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const getTierBadgeClasses = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'S': return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      case 'A': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'B': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTierBorderColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'S': return 'border-l-gold-500';
      case 'A': return 'border-l-cyan-500';
      case 'B': return 'border-l-emerald-500';
      default: return 'border-l-gray-600';
    }
  };

  // Convert picks to formation preview format
  const teamForFormation = myTeam?.picks?.map((pick) => ({
    id: pick.id,
    name: pick.influencer_name,
    twitter_handle: pick.influencer_handle,
    tier: pick.influencer_tier,
    profile_image_url: pick.profile_image_url,
    total_points: pick.total_points || 0,
  }));

  // Fetch history when contests tab is opened
  useEffect(() => {
    if (activeTab === 'contests' && !historyLoaded && !historyLoading && isConnected) {
      fetchHistory(0);
    }
  }, [activeTab, isConnected]);

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: UserCircle },
    { id: 'contests', label: 'Contests', icon: Trophy },
    { id: 'watchlist', label: 'Watchlist', icon: Binoculars, count: watchlist.length },
  ];

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Users size={32} className="text-gray-950" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
          <p className="text-gray-400 max-w-md mx-auto">Track your stats, manage your teams, and view your progress</p>
        </div>

        {/* Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy size={24} weight="fill" className="text-gold-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Your Teams</h3>
            <p className="text-sm text-gray-500">View and edit your drafted teams</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-gray-700/60 flex items-center justify-center mx-auto mb-3">
              <ChartBar size={24} weight="fill" className="text-gray-300" />
            </div>
            <h3 className="font-semibold text-white mb-1">Stats & XP</h3>
            <p className="text-sm text-gray-500">Track your performance over time</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center mx-auto mb-3">
              <Target size={24} weight="fill" className="text-gold-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Daily Quests</h3>
            <p className="text-sm text-gray-500">Complete tasks to earn rewards</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Ready to get started?</h3>
          <p className="text-gray-400 mb-4">Sign in to access your profile</p>
          <div className="text-sm text-gray-500">Use the "Sign In" button above</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  const xpInfo = getXPLevel(stats.xp);

  return (
    <div className="max-w-4xl mx-auto">
      <SEO
        title="Profile — Your Stats"
        description="View your Foresight stats, contest history, team formations, and achievements. Track your Foresight Score and climb the rankings."
        keywords="CT influence profile, crypto competition stats, foresight score, CT achievements"
        path="/profile"
      />
      {/* ── Profile Header (compact, no card wrapper) ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        {/* Avatar with gold ring */}
        <div className="w-14 h-14 rounded-full border-2 border-gold-500/40 bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center shrink-0">
          <Users size={28} weight="fill" className="text-gray-950" />
        </div>

        {/* Name + wallet + level */}
        <div className="flex-1 min-w-0">
          {!isEditingUsername ? (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white truncate">
                {username || 'Anonymous'}
              </h1>
              <button
                onClick={() => { setTempUsername(username); setIsEditingUsername(true); }}
                className="p-1 hover:bg-gray-800 rounded-lg transition-all text-gray-500 hover:text-gold-400"
              >
                <PencilSimple size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                className="text-lg font-bold text-white bg-gray-800 border border-gold-500 rounded-lg px-3 py-1 focus:outline-none"
                placeholder="Username"
                maxLength={20}
                autoFocus
              />
              <button onClick={handleSaveUsername} className="p-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white">
                <Check size={16} />
              </button>
              <button onClick={() => setIsEditingUsername(false)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                <X size={16} />
              </button>
            </div>
          )}

          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-0.5"
          >
            <span className="font-mono">{address ? formatAddress(address) : ''}</span>
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>

          {/* Level + streak pills */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded text-[10px] uppercase tracking-wider text-gold-400 font-semibold">
              <Star size={10} weight="fill" />
              {xpInfo.level}
            </span>
            {stats.voteStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] uppercase tracking-wider text-orange-400 font-semibold">
                <Fire size={10} weight="fill" />
                {stats.voteStreak} streak
              </span>
            )}
          </div>
        </div>

        {/* Actions — right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ShareProfileButton variant="secondary" />
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg text-gray-300 text-sm font-medium transition-colors"
          >
            <Gear size={16} />
            Settings
          </Link>
        </div>
      </div>

      {/* ── Tab Bar (matches Compete page style) ── */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-gold-500/20 text-gold-400' : 'bg-gray-700 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          OVERVIEW TAB
          FS Score → Career Stats → Level/Perks → Quests → Tapestry
          ══════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* A. Foresight Score */}
          <ForesightScoreDisplay variant="full" />

          {/* B. Career Stats — 2×3 grid */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Career Stats</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Crown size={16} className="text-gold-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-white">{formatXP(stats.xp)}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Total XP</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Trophy size={16} className="text-emerald-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-emerald-400">{stats.totalWins}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Wins</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Fire size={16} className="text-orange-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-orange-400">{stats.voteStreak}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Day Streak</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Target size={16} className="text-gold-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-white">{stats.contestsEntered}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Contests</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Medal size={16} className="text-gold-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-gold-400">
                  {stats.bestRank ? `#${stats.bestRank}` : '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Best Rank</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors">
                <Star size={16} className="text-gold-400 mx-auto mb-2" />
                <div className="font-mono text-xl text-white">{xpInfo.level}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Level</div>
              </div>
            </div>
          </div>

          {/* C. Level Perks (compact) */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-500/15 rounded-lg flex items-center justify-center shrink-0">
                <Sparkle size={20} className="text-gold-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Level {xpInfo.level}</div>
                <div className="text-xs text-gray-500">Perks & Benefits</div>
              </div>
            </div>

            {/* XP progress */}
            {xpInfo.nextLevel && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Progress to {xpInfo.nextLevel}</span>
                  <span className="text-gray-500 font-mono tabular-nums">{xpInfo.xpToNext} XP to go</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpInfo.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Perk rows */}
            <div className="space-y-2">
              {xpInfo.levelInfo.perks.map((perk, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-gray-300">{perk}</span>
                </div>
              ))}
            </div>

            {/* Vote power + transfer limits inline */}
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-6 text-xs">
              <div>
                <span className="text-gray-500">Vote Power:</span>
                <span className="ml-1.5 text-white font-medium">{xpInfo.levelInfo.voteWeight}x</span>
              </div>
              <div>
                <span className="text-gray-500">Weekly Transfers:</span>
                <span className="ml-1.5 text-white font-medium">
                  {xpInfo.levelInfo.maxTransfers === 999 ? 'Unlimited' : xpInfo.levelInfo.maxTransfers}
                </span>
              </div>
            </div>
          </div>

          {/* D. Daily Quests */}
          {quests.filter(q => q.questType === 'daily').length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
                  <Fire size={14} weight="fill" className="text-gold-400" />
                  Daily Quests
                </div>
                <span className="text-xs text-gray-500">
                  {quests.filter(q => q.questType === 'daily' && q.isCompleted).length}/
                  {quests.filter(q => q.questType === 'daily').length} done
                </span>
              </div>
              <div className="space-y-3">
                {quests.filter(q => q.questType === 'daily').map(quest => {
                  const QIcon = QUEST_ICONS[quest.icon] || Target;
                  return (
                  <div key={quest.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      quest.isCompleted ? 'bg-emerald-500/20' : 'bg-gray-800'
                    }`}>
                      {quest.isCompleted
                        ? <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                        : <QIcon size={16} weight="fill" className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium truncate ${quest.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {quest.name}
                        </span>
                        <span className="text-xs text-gold-400 shrink-0 font-mono tabular-nums">+{quest.fsReward} FS</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${quest.isCompleted ? 'bg-emerald-500' : 'bg-gold-500'}`}
                            style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 shrink-0">{quest.progress}/{quest.target}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* E. Tapestry Protocol (compact) */}
          {tapestryStatus.connected ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <img src="/tapestry-icon.png" alt="Tapestry" className="w-5 h-5 invert opacity-70" />
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-medium">Tapestry Connected</span>
              </div>
              <div className="flex items-center gap-4 ml-auto text-xs text-gray-400">
                <span><span className="text-white font-medium font-mono tabular-nums">{socialCounts.followers}</span> followers</span>
                <span><span className="text-white font-medium font-mono tabular-nums">{socialCounts.following}</span> following</span>
                <span><span className="text-gold-400 font-medium font-mono tabular-nums">{tapestryContent.filter(i => i.properties?.type === 'draft_team').length}</span> on-chain</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5">
              <img src="/tapestry-icon.png" alt="Tapestry" className="w-4 h-4 invert opacity-30" />
              <span className="text-xs text-gray-600">
                Tapestry not connected — <Link to="/settings" className="text-gray-500 hover:text-gold-400 transition-colors underline underline-offset-2">connect in settings</Link>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CONTESTS TAB
          Current Team → Contest History
          ══════════════════════════════════════════════ */}
      {activeTab === 'contests' && (
        <div className="space-y-6">

          {/* A. Current Team */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Current Team</div>
            {myTeam && teamForFormation && teamForFormation.length >= 5 ? (
              <div className="space-y-4">
                {/* Team Header */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{myTeam.team_name}</h3>
                      <div className="text-xs text-gray-500">Current weekly team</div>
                    </div>
                    <div className="text-right">
                      {myTeam.rank && (
                        <div className="text-2xl font-bold font-mono tabular-nums text-gold-400">#{myTeam.rank}</div>
                      )}
                      <div className="text-lg font-bold font-mono tabular-nums text-gold-400">{myTeam.total_score || 0} pts</div>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Budget Used</span>
                      <span className="text-white font-medium font-mono tabular-nums">{myTeam.total_budget_used}/{myTeam.max_budget}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-500 rounded-full"
                        style={{ width: `${(myTeam.total_budget_used / myTeam.max_budget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Formation */}
                <FormationPreview
                  variant="team"
                  team={teamForFormation}
                  showStats={true}
                  showEdit={true}
                  onEdit={() => navigate('/compete?tab=contests')}
                />

                {/* Share / Copy */}
                <ShareTeamCard
                  teamName={myTeam.team_name}
                  picks={myTeam.picks.map((p) => ({
                    id: p.id,
                    name: p.influencer_name,
                    handle: p.influencer_handle,
                    tier: p.influencer_tier,
                    total_points: p.total_points,
                  }))}
                  totalScore={myTeam.total_score}
                  rank={myTeam.rank}
                  username={username}
                  variant="compact"
                />
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                <Trophy size={40} className="mx-auto mb-3 text-gray-600" />
                <h3 className="text-lg font-bold text-white mb-2">No Team Yet</h3>
                <p className="text-gray-400 text-sm mb-5">Draft your first team of 5 CT influencers</p>
                <Link
                  to="/compete?tab=contests"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 rounded-lg text-gray-950 font-medium transition-colors text-sm"
                >
                  <Crown size={18} />
                  Browse Contests
                </Link>
              </div>
            )}
          </div>

          {/* B. Contest History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Contest History
                {historyTotal > 0 && <span className="ml-2 text-gray-600">({historyTotal})</span>}
              </div>
            </div>

            {/* Career summary line */}
            {careerStats && careerStats.totalContests > 0 && (
              <div className="text-sm text-gray-400 mb-3 flex items-center gap-2 flex-wrap">
                <span className="font-mono tabular-nums text-white">{careerStats.totalContests}</span> contest{careerStats.totalContests !== 1 ? 's' : ''}
                <span className="text-gray-600">&middot;</span>
                <span className="font-mono tabular-nums text-emerald-400">{careerStats.wins}</span> win{careerStats.wins !== 1 ? 's' : ''}
                <span className="text-gray-600">&middot;</span>
                Avg <span className="font-mono tabular-nums text-white">{careerStats.avgScore}</span> pts
                {careerStats.bestRank && (
                  <>
                    <span className="text-gray-600">&middot;</span>
                    Best <span className="font-mono tabular-nums text-gold-400">#{careerStats.bestRank}</span>
                  </>
                )}
                {careerStats.topThree > 0 && (
                  <>
                    <span className="text-gray-600">&middot;</span>
                    Top 3: <span className="font-mono tabular-nums text-gold-400">{careerStats.topThree}x</span>
                  </>
                )}
              </div>
            )}

            {historyLoading && history.length === 0 ? (
              <div className="text-center py-10">
                <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                <Trophy size={36} className="mx-auto mb-3 text-gray-600" />
                <h3 className="font-semibold text-white mb-1">No contests yet</h3>
                <p className="text-gray-500 text-sm mb-4">Enter a contest to start building your career history</p>
                <Link
                  to="/compete?tab=contests"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 rounded-lg text-gray-950 font-medium transition-colors text-sm"
                >
                  <Crown size={16} />
                  Browse Contests
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => {
                  const isExpanded = expandedEntry === entry.contestId;
                  const hasResult = entry.status === 'finalized' || entry.status === 'completed';
                  return (
                    <div key={`${entry.contestId}-${entry.enteredAt}`} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                      {/* Row header */}
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.contestId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm truncate">{entry.contestName}</span>
                            {entry.tapestryVerified && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                                <img src="/tapestry-icon.png" alt="" className="w-3 h-3 invert opacity-70" />
                                On-chain
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {entry.endDate && (
                              <span>{new Date(entry.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                            {entry.totalPlayers && <span>{entry.totalPlayers} players</span>}
                            {!hasResult && <span className="text-gray-400 capitalize">{entry.status}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-3">
                          <div className="text-right">
                            {entry.rank && (
                              <div className={`text-base font-bold font-mono tabular-nums ${entry.rank === 1 ? 'text-gold-400' : entry.rank === 2 ? 'text-gray-300' : entry.rank <= 3 ? 'text-emerald-400' : 'text-white'}`}>
                                #{entry.rank}
                              </div>
                            )}
                            <div className="text-sm font-mono tabular-nums text-gray-400">{entry.score} pts</div>
                          </div>
                          <CaretRight
                            size={16}
                            className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-800 p-4 space-y-3">
                          {/* Picks list */}
                          {entry.picks.length > 0 ? (
                            <div className="space-y-1.5">
                              {entry.picks.map((pick) => (
                                <div key={pick.id} className="flex items-center gap-3 py-1">
                                  <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
                                      <img
                                        src={getAvatarUrl(pick.handle, pick.avatarUrl)}
                                        alt={pick.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    {pick.isCaptain && (
                                      <Crown size={10} weight="fill" className="absolute -top-1 -right-1 text-gold-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm text-white font-medium truncate">{pick.name}</span>
                                      {pick.isCaptain && (
                                        <span className="text-xs text-gold-400 font-bold shrink-0">&copy;</span>
                                      )}
                                      <span className={`text-xs px-1 py-0.5 rounded border font-medium shrink-0 ${getTierBadgeClasses(pick.tier)}`}>
                                        {pick.tier}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">@{pick.handle}</span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className={`text-sm font-bold font-mono tabular-nums ${pick.isCaptain ? 'text-gold-400' : 'text-white'}`}>
                                      {pick.effectivePoints} pts
                                    </div>
                                    {pick.isCaptain && (
                                      <div className="text-xs font-mono text-gray-600">{pick.points} &times; 1.5</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center py-2">Pick details not available</p>
                          )}

                          {/* Score breakdown */}
                          <div className="pt-2 border-t border-gray-800">
                            <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Score Breakdown</div>
                            {!hasResult ? (
                              <p className="text-xs text-gray-600 italic">Scores update every 6 hours &middot; Final when contest ends</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                  <div className="text-sm font-bold font-mono tabular-nums text-white">{Math.round(entry.scoreBreakdown.activity)}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Activity</div>
                                </div>
                                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                  <div className="text-sm font-bold font-mono tabular-nums text-gray-200">{Math.round(entry.scoreBreakdown.engagement)}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Engage</div>
                                </div>
                                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                  <div className="text-sm font-bold font-mono tabular-nums text-emerald-400">{Math.round(entry.scoreBreakdown.growth)}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Growth</div>
                                </div>
                                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                  <div className="text-sm font-bold font-mono tabular-nums text-gold-400">{Math.round(entry.scoreBreakdown.viral)}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Viral</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Prize */}
                          {entry.prizeWon > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-sm">
                              <span className="text-gray-500">Prize won</span>
                              <span className="text-gold-400 font-mono tabular-nums font-medium">{entry.prizeWon} SOL <span className="text-gray-500 font-sans font-normal">{entry.claimed ? '&middot; Claimed' : '&middot; Unclaimed'}</span></span>
                            </div>
                          )}

                          {/* Tapestry proof footer */}
                          {entry.tapestryVerified && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                              <img src="/tapestry-icon.png" alt="Tapestry" className="w-3.5 h-3.5 invert opacity-50" />
                              <span className="text-xs text-gold-500/60">Team picks permanently recorded on Solana via Tapestry Protocol</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Load more */}
                {history.length < historyTotal && (
                  <button
                    onClick={() => fetchHistory(history.length)}
                    disabled={historyLoading}
                    className="w-full py-3 text-sm text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {historyLoading ? 'Loading...' : `Load more (${historyTotal - history.length} remaining)`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          WATCHLIST TAB
          Tier-colored left borders, 2-col grid
          ══════════════════════════════════════════════ */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          {watchlist.length > 0 ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  Scouted Influencers
                </div>
                <Link
                  to="/feed"
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Scout More
                  <CaretRight size={14} />
                </Link>
              </div>

              {/* Watchlist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden relative border-l-4 ${getTierBorderColor(item.influencer.tier)} hover:border-gray-700 transition-colors`}
                  >
                    <div className="p-4 pl-5">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 shrink-0">
                          <img
                            src={getAvatarUrl(item.influencer.handle, item.influencer.avatar)}
                            alt={item.influencer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white truncate">
                              {item.influencer.name || item.influencer.handle}
                            </span>
                            <span className={`px-1.5 py-0.5 text-xs rounded border ${getTierBadgeClasses(item.influencer.tier)}`}>
                              {item.influencer.tier}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">@{item.influencer.handle}</div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-gold-400 font-medium">{item.influencer.price} pts</span>
                            <span className="text-gray-500">{item.influencer.totalPoints} pts</span>
                            {item.influencer.followers > 0 && (
                              <span className="text-gray-500">
                                {item.influencer.followers >= 1000000
                                  ? `${(item.influencer.followers / 1000000).toFixed(1)}M`
                                  : item.influencer.followers >= 1000
                                  ? `${(item.influencer.followers / 1000).toFixed(0)}K`
                                  : item.influencer.followers} followers
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`https://x.com/${item.influencer.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <XLogo size={16} weight="fill" />
                          </a>
                          <button
                            onClick={() => removeFromWatchlist(item.influencer.id, item.influencer.handle)}
                            disabled={removingId === item.influencer.id}
                            className="p-2 bg-gray-800 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Scouted date */}
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Scouted {new Date(item.scoutedAt).toLocaleDateString()}
                        </span>
                        <Link
                          to="/compete?tab=contests"
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          Draft
                          <CaretRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <Binoculars size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Scouted Influencers</h3>
              <p className="text-gray-400 mb-6">
                Browse Intel to scout influencers for your team
              </p>
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200 font-medium transition-colors"
              >
                <Binoculars size={20} />
                Browse Intel
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
