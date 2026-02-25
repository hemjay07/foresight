/**
 * Profile - User Profile Hub
 * Streamlined profile with tabs for Overview, Teams, and Stats
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Trophy, Crown, Sparkle, Star, Fire, TrendUp,
  CheckCircle, Lock, Lightning, Medal, Gear, PencilSimple,
  Check, X, CaretRight, ArrowRight, ChartBar, GameController, Share,
  Copy, UserCircle, Target, Binoculars, Trash, TwitterLogo,
} from '@phosphor-icons/react';
import ForesightScoreDisplay from '../components/ForesightScoreDisplay';
import { ShareProfileButton } from '../components/ShareableProfileCard';
import FormationPreview from '../components/FormationPreview';
import TapestryBadge from '../components/TapestryBadge';
import ShareTeamCard from '../components/ShareTeamCard';
import { getXPLevel, formatXP } from '../utils/xp';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type ProfileTab = 'overview' | 'teams' | 'watchlist' | 'stats' | 'history';

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
  const { address, isConnected } = useAuth();
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

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { setLoading(false); return; }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, teamRes, actionsRes, watchlistRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/me`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/league/team/me`, { headers }).catch(() => ({ data: { team: null } })),
        axios.get(`${API_URL}/api/v2/quests/summary`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/watchlist`, { headers }).catch(() => ({ data: { success: false } })),
      ]);

      if (profileRes.data) {
        setUsername(profileRes.data.username || '');
        setStats({
          xp: profileRes.data.xp || 0,
          voteStreak: profileRes.data.voteStreak || 0,
          totalVotes: profileRes.data.totalVotes || 0,
          contestsEntered: profileRes.data.contestsEntered || 0,
          totalWins: profileRes.data.totalWins || 0,
          bestRank: profileRes.data.bestRank || null,
        });
      }

      if (teamRes.data?.team) {
        setMyTeam(teamRes.data.team);
      }

      // Set today's actions data
      if (actionsRes.data?.data) {
        setActions({
          hasVotedThisWeek: actionsRes.data.data.hasVotedThisWeek || false,
          dailyQuestsCompleted: actionsRes.data.data.dailyCompleted || 0,
          dailyQuestsTotal: actionsRes.data.data.dailyTotal || 3,
          claimableRewards: actionsRes.data.data.claimable || 0,
        });
      }

      // Set watchlist data
      if (watchlistRes.data?.success && watchlistRes.data?.data?.watchlist) {
        setWatchlist(watchlistRes.data.data.watchlist);
      }

      // Fetch Tapestry status + social data (non-blocking)
      axios.get(`${API_URL}/api/auth/tapestry-status`, { headers })
        .then((res) => {
          if (res.data?.data) {
            const tId = res.data.data.tapestryUserId;
            // wallet_address from our DB has correct case; Tapestry API lowercases it
            const wa = res.data.data.walletAddress;
            // Only use as SSE link if it's a real Solana address (base58, not 0x...)
            const isSolana = wa && !wa.startsWith('0x') && wa.length >= 32 && wa.length <= 44;
            setTapestryStatus({
              connected: res.data.data.connected,
              tapestryUserId: tId,
              walletAddress: isSolana ? wa : null,
            });
            // If connected, fetch social counts + content from Tapestry
            if (tId) {
              // Followers from Tapestry, Following from local DB (source of truth)
              axios.get(`${API_URL}/api/tapestry/social-counts/${tId}`, { headers })
                .then((r) => { if (r.data?.data) setSocialCounts(prev => ({ ...prev, followers: r.data.data.followers ?? 0 })); })
                .catch(() => {});
              axios.get(`${API_URL}/api/tapestry/my-following`, { headers })
                .then((r) => { if (r.data?.data?.following) setSocialCounts(prev => ({ ...prev, following: r.data.data.following.length })); })
                .catch(() => {});
              axios.get(`${API_URL}/api/tapestry/content/${tId}`, { headers })
                .then((r) => { if (r.data?.data?.content) setTapestryContent(r.data.data.content); })
                .catch(() => {});
            }
          }
        })
        .catch(() => {}); // Silent fail — Tapestry is optional
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (offset = 0) => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/v2/me/history?limit=20&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem('authToken');
      if (!token || !tempUsername.trim()) return;

      await axios.patch(
        `${API_URL}/api/users/profile`,
        { username: tempUsername.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await axios.delete(`${API_URL}/api/watchlist/${influencerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  // Convert picks to formation preview format
  const teamForFormation = myTeam?.picks?.map((pick) => ({
    id: pick.id,
    name: pick.influencer_name,
    twitter_handle: pick.influencer_handle,
    tier: pick.influencer_tier,
    profile_image_url: pick.profile_image_url,
    total_points: pick.total_points || 0,
  }));

  useEffect(() => {
    if (activeTab === 'history' && !historyLoaded && !historyLoading && isConnected) {
      fetchHistory(0);
    }
  }, [activeTab, isConnected]);

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: UserCircle },
    { id: 'teams', label: 'Teams', icon: Trophy },
    { id: 'history', label: 'History', icon: ChartBar },
    { id: 'watchlist', label: 'Watchlist', icon: Binoculars, count: watchlist.length },
    { id: 'stats', label: 'Stats', icon: Star },
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
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
              <ChartBar size={24} weight="fill" className="text-cyan-400" />
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
      {/* Profile Header */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center shrink-0">
            <Users size={40} weight="fill" className="text-gray-950" />
          </div>

          {/* Info */}
          <div className="flex-1">
            {!isEditingUsername ? (
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {username || 'Anonymous'}
                </h1>
                <button
                  onClick={() => { setTempUsername(username); setIsEditingUsername(true); }}
                  className="p-1.5 hover:bg-gray-800 rounded-lg transition-all text-gray-500 hover:text-gold-400"
                >
                  <PencilSimple size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                  className="text-2xl font-bold text-white bg-gray-800 border border-gold-500 rounded-lg px-3 py-1 focus:outline-none"
                  placeholder="Username"
                  maxLength={20}
                  autoFocus
                />
                <button onClick={handleSaveUsername} className="p-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsEditingUsername(false)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                  <X size={18} />
                </button>
              </div>
            )}

            <button
              onClick={copyAddress}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <span className="font-mono">{address ? formatAddress(address) : ''}</span>
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-yellow-400" />
                <span className="text-gray-400">Level</span>
                <span className="text-white font-medium">{xpInfo.level}</span>
              </div>
              {stats.voteStreak > 0 && (
                <div className="flex items-center gap-1.5">
                  <Fire size={16} className="text-orange-400" />
                  <span className="text-white font-medium">{stats.voteStreak} day streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ShareProfileButton variant="secondary" />
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-all"
            >
              <Gear size={18} />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-gold-500 text-gray-950'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-gray-950/20 text-gray-950' : 'bg-gray-700 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Today's Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightning size={20} weight="fill" className="text-gold-400" />
              Today's Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Enter Contest Action */}
              <Link
                to="/compete?tab=contests"
                className="group relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02] bg-gold-500/10 border-gold-500/30 hover:border-gold-500/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold-500/20">
                    <Trophy size={20} className="text-gold-400" weight="fill" />
                  </div>
                  <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded-full">
                    Free
                  </span>
                </div>
                <h4 className="font-semibold text-white mb-1">Enter Contest</h4>
                <p className="text-xs text-gray-500">Draft your team & compete</p>
              </Link>

              {/* Quests Action */}
              <Link
                to="/progress"
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                  actions.dailyQuestsCompleted >= actions.dailyQuestsTotal
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    actions.dailyQuestsCompleted >= actions.dailyQuestsTotal ? 'bg-gray-700' : 'bg-green-500/20'
                  }`}>
                    {actions.dailyQuestsCompleted >= actions.dailyQuestsTotal ? (
                      <CheckCircle size={20} weight="fill" className="text-green-400" />
                    ) : (
                      <Fire size={20} className="text-green-400" />
                    )}
                  </div>
                  {actions.claimableRewards > 0 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">
                      Claim {actions.claimableRewards} FS
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-white mb-1">Daily Quests</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(actions.dailyQuestsCompleted / actions.dailyQuestsTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {actions.dailyQuestsCompleted}/{actions.dailyQuestsTotal}
                  </span>
                </div>
              </Link>

              {/* Check Standings */}
              <Link
                to="/compete"
                className="group relative overflow-hidden rounded-xl bg-gray-800/30 border border-gray-700 p-4 transition-all hover:scale-[1.02] hover:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Trophy size={20} className="text-gold-400" />
                  </div>
                </div>
                <h4 className="font-semibold text-white mb-1">Check Standings</h4>
                <p className="text-xs text-gray-500">View leaderboards</p>
              </Link>
            </div>
          </div>

          {/* Foresight Score */}
          <ForesightScoreDisplay variant="full" />

          {/* XP Card */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Crown size={24} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Experience Level</div>
                  <div className="text-2xl font-bold text-white">{xpInfo.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{formatXP(stats.xp)}</div>
                <div className="text-sm text-gray-500">Total XP</div>
              </div>
            </div>

            {xpInfo.nextLevel && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress to {xpInfo.nextLevel}</span>
                  <span className="text-cyan-400">{xpInfo.xpToNext} XP to go</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${xpInfo.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/compete?tab=contests"
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gold-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
                  <GameController size={20} className="text-gold-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Browse Contests</div>
                  <div className="text-sm text-gray-500">Join leagues & compete</div>
                </div>
              </div>
              <CaretRight size={20} className="text-gray-600 group-hover:text-gold-400" />
            </Link>

            <Link
              to="/progress"
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gold-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
                  <Fire size={20} className="text-gold-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Quests</div>
                  <div className="text-sm text-gray-500">Complete daily tasks</div>
                </div>
              </div>
              <CaretRight size={20} className="text-gray-600 group-hover:text-gold-400" />
            </Link>

            <Link
              to="/referrals"
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gold-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
                  <Share size={20} className="text-gold-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Referrals</div>
                  <div className="text-sm text-gray-500">Invite friends, earn FS</div>
                </div>
              </div>
              <CaretRight size={20} className="text-gray-600 group-hover:text-gold-400" />
            </Link>
          </div>

          {/* Tapestry On-Chain Identity */}
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-900/80 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img src="/tapestry-icon.png" alt="Tapestry" className="w-6 h-6 invert opacity-80" />
                <div>
                  <h3 className="font-semibold text-white text-sm">Tapestry Protocol</h3>
                  <p className="text-xs text-gray-500">Your on-chain identity &amp; history on Solana</p>
                </div>
              </div>
              {tapestryStatus.connected ? (
                <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live on Solana
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1">Not connected</span>
              )}
            </div>

            {tapestryStatus.connected ? (
              <div className="p-5 space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{socialCounts.followers}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Followers</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{socialCounts.following}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Following</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gold-400">
                      {tapestryContent.filter(i => i.properties?.type === 'draft_team').length}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Teams on-chain</div>
                  </div>
                </div>

                {/* On-chain record count */}
                <div className="bg-gray-800/20 rounded-lg p-4 text-sm text-gray-400 leading-relaxed">
                  {tapestryContent.filter(i => i.properties?.type === 'draft_team').length > 0 ? (
                    <>
                      Your{' '}
                      <span className="text-white font-medium">
                        {tapestryContent.filter(i => i.properties?.type === 'draft_team').length} draft {tapestryContent.filter(i => i.properties?.type === 'draft_team').length === 1 ? 'team' : 'teams'}
                      </span>{' '}
                      are permanently recorded on Solana via Tapestry Protocol — immutable and verifiable by anyone.
                    </>
                  ) : (
                    'Submit a team to permanently record your picks on Solana via Tapestry Protocol.'
                  )}
                </div>

                {/* Identity footer */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-800/60">
                  <div>
                    <div className="text-xs text-gray-600 mb-0.5">Your Tapestry identity</div>
                    <span className="font-mono text-xs text-gray-400 select-all">
                      {tapestryStatus.tapestryUserId?.slice(0, 10)}...{tapestryStatus.tapestryUserId?.slice(-8)}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors font-medium"
                  >
                    View contest history
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <p className="text-sm text-gray-500">
                  Sign in to link your on-chain identity. Your draft teams and contest scores will be published to Solana via Tapestry — permanently verifiable by anyone.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {myTeam && teamForFormation && teamForFormation.length >= 5 ? (
            <>
              {/* Team Header */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{myTeam.team_name}</h3>
                    <div className="text-sm text-gray-400">Current weekly team</div>
                  </div>
                  <div className="text-right">
                    {myTeam.rank && (
                      <div className="text-3xl font-bold text-yellow-400">#{myTeam.rank}</div>
                    )}
                    <div className="text-2xl font-bold text-gold-400">{myTeam.total_score || 0} pts</div>
                  </div>
                </div>

                {/* Budget */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Budget Used</span>
                    <span className="text-white font-medium">{myTeam.total_budget_used}/{myTeam.max_budget}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-500 rounded-full"
                      style={{ width: `${(myTeam.total_budget_used / myTeam.max_budget) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Share team */}
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
                variant="compact"
              />

              {/* Formation View */}
              <FormationPreview
                variant="team"
                team={teamForFormation}
                showStats={true}
                showEdit={true}
                onEdit={() => navigate('/compete?tab=contests')}
              />
            </>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Team Yet</h3>
              <p className="text-gray-400 mb-6">Draft your first team of 5 CT influencers</p>
              <Link
                to="/compete?tab=contests"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 rounded-lg text-gray-950 font-medium transition-colors"
              >
                <Crown size={20} />
                Browse Contests
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          {watchlist.length > 0 ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Binoculars size={20} weight="fill" className="text-cyan-400" />
                    Scouted Influencers
                  </h3>
                  <p className="text-sm text-gray-400">Your watchlist for draft research</p>
                </div>
                <Link
                  to="/feed"
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 shrink-0">
                        {item.influencer.avatar ? (
                          <img
                            src={item.influencer.avatar}
                            alt={item.influencer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users size={20} className="text-gray-500" />
                          </div>
                        )}
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
                          <span className="text-gold-400 font-medium">${item.influencer.price}</span>
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
                          href={`https://twitter.com/${item.influencer.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <TwitterLogo size={16} weight="fill" />
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
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        Draft
                        <CaretRight size={12} />
                      </Link>
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
              >
                <Binoculars size={20} />
                Browse Intel
              </Link>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Career Stats Summary */}
          {careerStats && careerStats.totalContests > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{careerStats.totalContests}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Contests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold-400">{careerStats.wins}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{careerStats.bestScore}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Best Score</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-sm">
                <span className="text-gray-500">Avg score: <span className="text-white font-medium">{careerStats.avgScore} pts</span></span>
                {careerStats.bestRank && (
                  <span className="text-gray-500">Best rank: <span className="text-yellow-400 font-medium">#{careerStats.bestRank}</span></span>
                )}
                {careerStats.topThree > 0 && (
                  <span className="text-gray-500">Top 3: <span className="text-emerald-400 font-medium">{careerStats.topThree}x</span></span>
                )}
              </div>
            </div>
          )}

          {historyLoading && history.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading your history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <Trophy size={40} className="mx-auto mb-3 text-gray-600" />
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
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                              <img src="/tapestry-icon.png" alt="" className="w-3 h-3 invert opacity-70" />
                              Tapestry
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {entry.endDate && (
                            <span>{new Date(entry.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          )}
                          {entry.totalPlayers && <span>{entry.totalPlayers} players</span>}
                          {!hasResult && <span className="text-cyan-400 capitalize">{entry.status}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-3">
                        <div className="text-right">
                          {entry.rank && (
                            <div className={`text-base font-bold ${entry.rank === 1 ? 'text-gold-400' : entry.rank <= 3 ? 'text-yellow-400' : 'text-white'}`}>
                              #{entry.rank}
                            </div>
                          )}
                          <div className="text-sm text-gray-400">{entry.score} pts</div>
                        </div>
                        <CaretRight
                          size={16}
                          className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Expanded picks */}
                    {isExpanded && (
                      <div className="border-t border-gray-800 p-4 space-y-3">
                        {/* Picks list */}
                        {entry.picks.length > 0 ? (
                          <div className="space-y-1.5">
                            {entry.picks.map((pick) => (
                              <div key={pick.id} className="flex items-center gap-3 py-1">
                                <div className="relative shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
                                    {pick.avatarUrl ? (
                                      <img src={pick.avatarUrl} alt={pick.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <UserCircle size={20} />
                                      </div>
                                    )}
                                  </div>
                                  {pick.isCaptain && (
                                    <Crown size={10} weight="fill" className="absolute -top-1 -right-1 text-gold-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm text-white font-medium truncate">{pick.name}</span>
                                    {pick.isCaptain && (
                                      <span className="text-xs text-gold-400 font-bold shrink-0">©</span>
                                    )}
                                    <span className={`text-xs px-1 py-0.5 rounded border font-medium shrink-0 ${getTierBadgeClasses(pick.tier)}`}>
                                      {pick.tier}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">@{pick.handle}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className={`text-sm font-bold ${pick.isCaptain ? 'text-gold-400' : 'text-white'}`}>
                                    {pick.effectivePoints} pts
                                  </div>
                                  {pick.isCaptain && (
                                    <div className="text-xs text-gray-600">{pick.points} × 1.5</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2">Pick details not available</p>
                        )}

                        {/* Score breakdown — always show */}
                        <div className="pt-2 border-t border-gray-800">
                          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Score Breakdown</div>
                          {!hasResult ? (
                            <p className="text-xs text-gray-600 italic">Scores update every 6 hours · Final when contest ends</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                <div className="text-sm font-bold text-white">{Math.round(entry.scoreBreakdown.activity)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Activity</div>
                              </div>
                              <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                <div className="text-sm font-bold text-cyan-400">{Math.round(entry.scoreBreakdown.engagement)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Engage</div>
                              </div>
                              <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                <div className="text-sm font-bold text-emerald-400">{Math.round(entry.scoreBreakdown.growth)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Growth</div>
                              </div>
                              <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                                <div className="text-sm font-bold text-gold-400">{Math.round(entry.scoreBreakdown.viral)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Viral</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prize */}
                        {entry.prizeWon > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-sm">
                            <span className="text-gray-500">Prize won</span>
                            <span className="text-emerald-400 font-medium">{entry.prizeWon} SOL {entry.claimed ? '· Claimed' : '· Unclaimed'}</span>
                          </div>
                        )}

                        {/* Tapestry proof footer */}
                        {entry.tapestryVerified && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                            <img src="/tapestry-icon.png" alt="Tapestry" className="w-3.5 h-3.5 invert opacity-50" />
                            <span className="text-xs text-gray-600">Team picks permanently recorded on Solana via Tapestry Protocol</span>
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
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{formatXP(stats.xp)}</div>
              <div className="text-sm text-gray-500">Total XP</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{xpInfo.level}</div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-400 flex items-center justify-center gap-1">
                <Fire size={24} weight="fill" />
                {stats.voteStreak}
              </div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats.contestsEntered}</div>
              <div className="text-sm text-gray-500">Contests Entered</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.totalWins}</div>
              <div className="text-sm text-gray-500">Wins</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {stats.bestRank ? `#${stats.bestRank}` : '-'}
              </div>
              <div className="text-sm text-gray-500">Best Rank</div>
            </div>
          </div>

          {/* Level Perks */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkle size={18} className="text-gold-400" />
              Level {xpInfo.level} Perks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {xpInfo.levelInfo.perks.map((perk, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} weight="fill" className="text-green-400 shrink-0" />
                  <span className="text-gray-300">{perk}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Vote Power:</span>
                <span className="ml-2 text-white font-medium">{xpInfo.levelInfo.voteWeight}x</span>
              </div>
              <div>
                <span className="text-gray-500">Weekly Transfers:</span>
                <span className="ml-2 text-white font-medium">
                  {xpInfo.levelInfo.maxTransfers === 999 ? 'Unlimited' : xpInfo.levelInfo.maxTransfers}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard Link */}
          <Link
            to="/compete?tab=rankings&type=xp"
            className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Medal size={20} className="text-cyan-400" />
              </div>
              <div>
                <div className="font-medium text-white">View XP Leaderboard</div>
                <div className="text-sm text-gray-500">See how you rank</div>
              </div>
            </div>
            <CaretRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
          </Link>
        </div>
      )}
    </div>
  );
}
