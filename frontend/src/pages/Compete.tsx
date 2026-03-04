/**
 * Compete - Unified Competition Hub
 * Combines Rankings (Leaderboards) and Contests into one streamlined interface
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient, { hasSession } from '../lib/apiClient';
import {
  Trophy,
  Crown,
  Fire,
  Target,
  Medal,
  Sparkle,
  Users,
  Star,
  Lightning,
  Gift,
  Wallet,
  Clock,
  Play,
  CaretRight,
  ChartLineUp,
  Calendar,
  CheckCircle,
  MagnifyingGlass,
  Archive,
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';
import FoundingMemberBadge from '../components/FoundingMemberBadge';
import TapestryBadge from '../components/TapestryBadge';
import FollowButton from '../components/FollowButton';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

/** Tapestry on-chain reputation tier — separate from player tier badges */
function getReputationTier(rank: number, total: number): { label: string; color: string } {
  if (total === 0) return { label: 'Verified', color: 'text-emerald-400' };
  const pct = rank / total;
  if (pct <= 0.05) return { label: 'Stellar',  color: 'text-gold-400' };
  if (pct <= 0.15) return { label: 'Premium',  color: 'text-gray-200' };
  if (pct <= 0.35) return { label: 'Member',   color: 'text-gray-400' };
  return                   { label: 'Active',   color: 'text-gray-400' };
}

type MainTab = 'rankings' | 'contests';
type RankingsSubTab = 'fs' | 'fantasy' | 'xp';
type FsTimeframe = 'all_time' | 'season' | 'weekly' | 'referral' | 'friends';
type ContestFilter = 'all' | 'free' | 'weekly' | 'daily';

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
  tapestryUserId?: string;
}

interface FantasyLeaderTeam {
  id: number;
  team_name: string;
  user_id: number;
  total_score: number;
  rank: number;
  username?: string;
}

interface XPLeaderUser {
  id: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  xp: number;
  lifetime_xp: number;
  rank: number;
}

interface Contest {
  id: number;
  name: string;
  typeCode: string;
  typeName: string;
  entryFee: number;
  entryFeeFormatted: string;
  prizePool: number;
  prizePoolFormatted: string;
  playerCount: number;
  status: string;
  isFree: boolean;
  lockTime: string;
  endTime?: string;
  teamSize: number;
  hasCaptain: boolean;
  isSignatureLeague?: boolean;
  creatorHandle?: string | null;
  creatorAvatarUrl?: string | null;
  creatorFollowerCount?: number;
}

interface MyEntry {
  contestId: number;
  contestName: string;
  typeCode: string;
  status: string;
  rank: number | null;
  score: number;
}

const TIER_CONFIG = {
  bronze: { color: 'text-amber-500',  bg: 'bg-amber-500/20' },
  silver: { color: 'text-gray-300',   bg: 'bg-gray-500/20' },
  gold:   { color: 'text-gold-400',   bg: 'bg-gold-500/20' },
  platinum: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  diamond:  { color: 'text-gold-400', bg: 'bg-gold-500/30' },
} as const;

const CONTEST_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  FREE_LEAGUE: { icon: Gift, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  WEEKLY_STARTER: { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  WEEKLY_STANDARD: { icon: Trophy, color: 'text-gold-400', bg: 'bg-gold-500/15' },
  WEEKLY_PRO: { icon: Crown, color: 'text-gold-400', bg: 'bg-gold-500/15' },
  DAILY_FLASH: { icon: Lightning, color: 'text-gold-400', bg: 'bg-gold-500/15' },
};

export default function Compete() {
  const { address, isConnected } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Parse URL params
  const initialMainTab = (searchParams.get('tab') as MainTab) || 'contests';
  const initialRankingsTab = (searchParams.get('type') as RankingsSubTab) || 'fs';

  const [mainTab, setMainTab] = useState<MainTab>(initialMainTab);
  const [rankingsSubTab, setRankingsSubTab] = useState<RankingsSubTab>(initialRankingsTab);
  const [fsTimeframe, setFsTimeframe] = useState<FsTimeframe>('all_time');
  const [contestFilter, setContestFilter] = useState<ContestFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [fsLeaders, setFsLeaders] = useState<FsLeaderEntry[]>([]);
  const [fsTotal, setFsTotal] = useState(0);
  const [fsHasMore, setFsHasMore] = useState(false);
  const [fsOffset, setFsOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fantasyLeaders, setFantasyLeaders] = useState<FantasyLeaderTeam[]>([]);
  const [xpLeaders, setXpLeaders] = useState<XPLeaderUser[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; percentile: number } | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [archivedContests, setArchivedContests] = useState<Contest[]>([]);
  const [myEntries, setMyEntries] = useState<MyEntry[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [solPrice, setSolPrice] = useState<number>(145);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [prizeRules, setPrizeRules] = useState<{ rank: number; percentage: number; label: string }[]>([]);
  const [, setTimeTick] = useState(0); // forces re-render for live countdowns

  // Fetch live SOL price
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r => r.json())
      .then(d => { if (d?.solana?.usd) setSolPrice(d.solana.usd); })
      .catch(() => {});
  }, []);

  // Live countdown tick — updates every second when any contest has an active countdown
  useEffect(() => {
    const hasActiveCountdown = contests.some(c => {
      const lockDiff = new Date(c.lockTime).getTime() - Date.now();
      if (lockDiff > 0 && lockDiff < 3600000) return true; // closes in < 1hr
      if (c.endTime) {
        const endDiff = new Date(c.endTime).getTime() - Date.now();
        if (endDiff > 0 && endDiff < 3600000) return true; // results in < 1hr (locked contest)
      }
      return false;
    });
    if (!hasActiveCountdown) return;
    const interval = setInterval(() => setTimeTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [contests]);

  // Update URL when tabs change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', mainTab);
    if (mainTab === 'rankings') {
      params.set('type', rankingsSubTab);
    }
    setSearchParams(params, { replace: true });
  }, [mainTab, rankingsSubTab]);

  // Fetch data when tabs change (also re-fetch when auth resolves after reload)
  useEffect(() => {
    if (mainTab === 'rankings') {
      setFsOffset(0);
      fetchRankingsData(0);
    } else {
      fetchContestsData();
    }
  }, [mainTab, rankingsSubTab, fsTimeframe, isConnected]);

  // Fetch who we follow (for friends tab + follow buttons)
  useEffect(() => {
    if (!hasSession() || !isConnected) return;

    apiClient.get('/api/tapestry/my-following')
      .then((res) => {
        if (res.data?.data?.following) {
          const ids = new Set(res.data.data.following.map((f: any) => f.id));
          setFollowingIds(ids as Set<string>);
        }
      })
      .catch(() => {});
  }, [isConnected]);

  // Fetch batch follow states when FS leaders load (for follow buttons)
  useEffect(() => {
    if (!hasSession() || fsLeaders.length === 0) return;

    const profileIds = fsLeaders
      .filter((e) => e.tapestryUserId)
      .map((e) => e.tapestryUserId!);

    if (profileIds.length === 0) return;

    apiClient.post('/api/tapestry/following-state-batch', { targetProfileIds: profileIds })
      .then((res) => {
        if (res.data?.data?.states) {
          setFollowStates(res.data.data.states);
        }
      })
      .catch(() => {});
  }, [fsLeaders]);

  const FS_PAGE_SIZE = 25;

  const fetchRankingsData = async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      if (rankingsSubTab === 'fs') {
        // Always fetch all-time data; friends filtering done client-side in filteredFsLeaders memo
        const actualTimeframe = fsTimeframe === 'friends' ? 'all_time' : fsTimeframe;
        const response = await apiClient.get('/api/v2/fs/leaderboard', {
          params: { type: actualTimeframe, limit: FS_PAGE_SIZE, offset },
        });
        if (response.data.success) {
          const entries = response.data.data.entries || [];
          setFsLeaders(prev => offset === 0 ? entries : [...prev, ...entries]);
          setFsTotal(response.data.data.total || entries.length);
          setFsHasMore(response.data.data.hasMore ?? false);
        }

        // Get user position (not for friends tab)
        if (hasSession() && fsTimeframe !== 'friends') {
          try {
            const posRes = await apiClient.get('/api/v2/fs/leaderboard/position', {
              params: { type: fsTimeframe },
            });
            if (posRes.data.success) {
              setUserPosition(posRes.data.data);
            }
          } catch {
            setUserPosition(null);
          }
        } else {
          setUserPosition(null);
        }
      } else if (rankingsSubTab === 'fantasy') {
        const response = await apiClient.get('/api/league/leaderboard');
        setFantasyLeaders(response.data.leaderboard || []);
      } else if (rankingsSubTab === 'xp') {
        const response = await apiClient.get('/api/users/xp-leaderboard', {
          params: { limit: 50 },
        });
        setXpLeaders(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreRankings = () => {
    const nextOffset = fsOffset + FS_PAGE_SIZE;
    setFsOffset(nextOffset);
    fetchRankingsData(nextOffset);
  };

  const fetchContestsData = async () => {
    try {
      setLoading(true);
      const [contestsRes, archivedRes, entriesRes] = await Promise.all([
        apiClient.get('/api/v2/contests', { params: { active: 'true' } }),
        apiClient.get('/api/v2/contests', { params: { status: 'finalized' } }),
        isConnected && hasSession()
          ? apiClient.get('/api/v2/me/entries').catch(() => ({ data: { entries: [] } }))
          : Promise.resolve({ data: { entries: [] } }),
      ]);
      setContests(contestsRes.data.contests || []);
      // Most recent finalized first (already ordered by created_at desc from backend)
      setArchivedContests((archivedRes.data.contests || []).slice(0, 10));
      setMyEntries(entriesRes.data.entries || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Split contests
  const signatureContests = useMemo(
    () => contests.filter(c => c.isSignatureLeague && c.status === 'open'),
    [contests]
  );

  const filteredContests = useMemo(() => {
    // Regular contests only (no signature leagues — they have their own section)
    // Include open + locked + scoring so users can still see/view their entry after lock
    let filtered = contests.filter(c => ['open', 'locked', 'scoring'].includes(c.status) && !c.isSignatureLeague);
    switch (contestFilter) {
      case 'free': filtered = filtered.filter(c => c.isFree); break;
      case 'weekly': filtered = filtered.filter(c => c.typeCode?.includes('WEEKLY')); break;
      case 'daily': filtered = filtered.filter(c => c.typeCode === 'DAILY_FLASH'); break;
    }
    // Sort: free first, then by player count desc (most popular on top)
    return filtered.sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return b.playerCount - a.playerCount;
    });
  }, [contests, contestFilter]);

  // "Start here" = the first free contest in the sorted list
  const startHereContestId = useMemo(
    () => filteredContests.find(c => c.isFree)?.id ?? null,
    [filteredContests]
  );

  const enteredContestIds = useMemo(() => new Set(myEntries.map(e => e.contestId)), [myEntries]);

  // All contests for the master list (active + archived combined for browsing)
  const allBrowsableContests = useMemo(() => [...filteredContests, ...signatureContests], [filteredContests, signatureContests]);

  // Auto-select first contest when data loads or filter changes
  useEffect(() => {
    if (mainTab === 'contests' && allBrowsableContests.length > 0 && !allBrowsableContests.find(c => c.id === selectedContestId)) {
      setSelectedContestId(allBrowsableContests[0].id);
    }
  }, [allBrowsableContests, mainTab]);

  const selectedContest = useMemo(
    () => [...allBrowsableContests, ...archivedContests].find(c => c.id === selectedContestId) ?? null,
    [allBrowsableContests, archivedContests, selectedContestId]
  );

  // Fetch prize rules when a contest is selected
  useEffect(() => {
    if (!selectedContestId) { setPrizeRules([]); return; }
    apiClient.get(`/api/v2/contests/${selectedContestId}`)
      .then(res => setPrizeRules(res.data.prizeRules || []))
      .catch(() => setPrizeRules([]));
  }, [selectedContestId]);

  const filteredFsLeaders = useMemo(() => {
    // Step 1: friends filter (reactive to followingIds — avoids race condition on load)
    let result = fsTimeframe === 'friends'
      ? fsLeaders
          .filter(e => e.tapestryUserId && followingIds.has(e.tapestryUserId))
          .map((e, idx) => ({ ...e, rank: idx + 1 }))
      : fsLeaders;
    // Step 2: search filter
    if (searchQuery.trim()) {
      result = result.filter(e => (e.username || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [fsLeaders, searchQuery, fsTimeframe, followingIds]);

  // Podium logic — show top 3 as hero cards when not searching
  const showPodium = rankingsSubTab === 'fs' && !searchQuery && filteredFsLeaders.length >= 3;

  // Helpers
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">1st</span>;
    if (rank === 2) return <span className="text-xl">2nd</span>;
    if (rank === 3) return <span className="text-xl">3rd</span>;
    return <span>#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-gold-400 font-bold';
    if (rank === 2) return 'text-gray-300 font-bold';
    if (rank === 3) return 'text-emerald-400 font-bold';
    return 'text-gray-500';
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getTimeRemaining = (lockTime: string): { label: string; urgent: boolean } => {
    const diff = new Date(lockTime).getTime() - Date.now();
    if (diff <= 0) return { label: 'Locked', urgent: false };
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    if (days > 0)   return { label: `${days}d ${hours}h`, urgent: false };
    if (hours > 0)  return { label: `${hours}h ${mins}m`, urgent: false };
    if (mins >= 5)  return { label: `${mins}m`, urgent: true };
    return { label: `${mins}m ${secs}s`, urgent: true };
  };

  const getResultsCountdown = (endTime: string): { label: string; urgent: boolean } => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { label: 'Scoring now', urgent: false };
    const hours = Math.floor(diff / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    if (hours > 0)  return { label: `${hours}h ${mins}m`, urgent: false };
    if (mins >= 1)  return { label: `${mins}m ${secs}s`, urgent: true };
    return { label: `${secs}s`, urgent: true };
  };

  const formatEndDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEnterContest = (contest: Contest) => {
    if (!isConnected) {
      showToast('Please sign in first', 'error');
      return;
    }
    navigate(`/draft/${contest.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      <SEO
        title="Compete — Contests & Rankings"
        description="Join contests, draft CT influencers, and climb the Foresight leaderboard. Weekly competitions with SOL prizes."
        keywords="crypto CT contest, CT leaderboard, solana competition, solana prizes, crypto twitter rankings"
        path="/compete"
      />
      {/* Row 1: Title + Main Tabs */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-500/15 flex items-center justify-center shrink-0">
            <Trophy size={14} weight="fill" className="text-gold-400 sm:hidden" />
            <Trophy size={16} weight="fill" className="text-gold-400 hidden sm:block" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white">Compete</h1>
        </div>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => setMainTab('rankings')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mainTab === 'rankings'
                ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Medal size={14} weight={mainTab === 'rankings' ? 'fill' : 'regular'} />
            Rankings
          </button>
          <button
            onClick={() => setMainTab('contests')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mainTab === 'contests'
                ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Trophy size={14} weight={mainTab === 'contests' ? 'fill' : 'regular'} />
            Contests
            {(filteredContests.length + signatureContests.length) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-950/30 text-[10px] sm:text-xs">
                {filteredContests.length + signatureContests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Contest Filter Pills — below tabs on mobile, inline on desktop */}
      {mainTab === 'contests' && (
        <div className="flex gap-1 sm:gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
          {[
            { key: 'all' as ContestFilter, label: 'All', icon: Trophy },
            { key: 'free' as ContestFilter, label: 'Free', icon: Gift },
            { key: 'weekly' as ContestFilter, label: 'Weekly', icon: Calendar },
            { key: 'daily' as ContestFilter, label: 'Daily', icon: Lightning },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.key}
                onClick={() => setContestFilter(filter.key)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  contestFilter === filter.key
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-gray-800/50 text-gray-400 border border-transparent hover:bg-gray-800'
                }`}
              >
                <Icon size={12} weight={contestFilter === filter.key ? 'fill' : 'regular'} />
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Rankings Tab */}
      {mainTab === 'rankings' && (
        <div className="space-y-3">
          {/* Row 2: Sub-tab selector + timeframe + search */}
          <div className="space-y-2">
            {/* Sub-tabs + Search on same row */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5">
                {[
                  { id: 'fs' as RankingsSubTab, label: 'FS Score', icon: Sparkle },
                  { id: 'fantasy' as RankingsSubTab, label: 'Draft', icon: Trophy },
                  { id: 'xp' as RankingsSubTab, label: 'XP', icon: Crown },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = rankingsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRankingsSubTab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Icon size={13} weight={isActive ? 'fill' : 'regular'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search — hidden on mobile, shown on desktop */}
              <div className="relative ml-auto hidden sm:block">
                <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-7 pr-6 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-36 focus:w-44 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Timeframe — own row, scrollable on mobile */}
            {rankingsSubTab === 'fs' && (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
                {[
                  { id: 'all_time' as FsTimeframe, label: 'All-Time' },
                  { id: 'friends' as FsTimeframe, label: 'Friends' },
                  { id: 'season' as FsTimeframe, label: 'Season' },
                  { id: 'weekly' as FsTimeframe, label: 'Weekly' },
                  { id: 'referral' as FsTimeframe, label: 'Referrals' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setFsTimeframe(tf.id)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      fsTimeframe === tf.id
                        ? 'bg-gold-500 text-gray-950'
                        : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Loading rankings...</p>
            </div>
          )}

          {/* FS Leaderboard */}
          {!loading && rankingsSubTab === 'fs' && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkle size={16} weight="fill" className="text-gold-400 sm:!w-5 sm:!h-5" />
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {fsTimeframe === 'all_time' && 'All-Time Leaders'}
                    {fsTimeframe === 'season' && 'Season Leaders'}
                    {fsTimeframe === 'weekly' && 'Weekly Leaders'}
                    {fsTimeframe === 'referral' && 'Top Referrers'}
                    {fsTimeframe === 'friends' && 'Friends Leaderboard'}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {fsTimeframe === 'friends'
                      ? `${filteredFsLeaders.length} friend${filteredFsLeaders.length !== 1 ? 's' : ''}`
                      : `${fsTotal.toLocaleString()} players`}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>

              {/* ── Podium — Top 3 Heroes ── */}
              {showPodium && (
                <div className="px-3 sm:px-4 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-800">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
                    {[filteredFsLeaders[1], filteredFsLeaders[0], filteredFsLeaders[2]].map((entry, i) => {
                      const rank = [2, 1, 3][i];
                      const isCenter = i === 1;
                      const tierCfg = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
                      const accent = rank === 1
                        ? { ring: 'ring-gold-400/50', score: 'text-gold-400', border: 'border-gold-500/30' }
                        : rank === 2
                        ? { ring: 'ring-gray-400/40', score: 'text-gray-300', border: 'border-gray-700' }
                        : { ring: 'ring-emerald-400/40', score: 'text-emerald-400', border: 'border-gray-700' };
                      return (
                        <div key={entry.userId} className={`bg-gray-800/50 border ${accent.border} rounded-xl ${isCenter ? 'p-2.5 sm:p-5' : 'p-2 pt-3 sm:p-4 sm:pt-6'} text-center`}>
                          {isCenter ? (
                            <Crown size={16} weight="fill" className="text-gold-400 mx-auto mb-1 sm:mb-2 sm:!w-5 sm:!h-5" />
                          ) : (
                            <Medal size={12} weight="fill" className={`mx-auto mb-1 sm:mb-1.5 sm:!w-3.5 sm:!h-3.5 ${rank === 2 ? 'text-gray-300' : 'text-emerald-400'}`} />
                          )}
                          <div className={`mx-auto ${isCenter ? 'w-10 h-10 sm:w-14 sm:h-14' : 'w-8 h-8 sm:w-11 sm:h-11'} rounded-full bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ${accent.ring} mb-1 sm:mb-2`}>
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={isCenter ? 18 : 14} weight="fill" className="text-gray-500" />
                            )}
                          </div>
                          <div className="text-[11px] sm:text-sm font-semibold text-white truncate">{entry.username || 'Anonymous'}</div>
                          <span className={`inline-block px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold ${tierCfg.bg} ${tierCfg.color} rounded uppercase tracking-wide mt-0.5 sm:mt-1`}>
                            {entry.tier}
                          </span>
                          <div className={`${isCenter ? 'text-base sm:text-2xl' : 'text-sm sm:text-lg'} font-mono font-black tabular-nums ${accent.score} mt-1 sm:mt-2 leading-none`}>
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">FS</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Your Position — Stats Bar */}
              {userPosition && rankingsSubTab === 'fs' && !searchQuery && (
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-800 flex items-center gap-3 sm:gap-4 bg-gold-500/5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gold-500/10 flex items-center justify-center ring-1 ring-gold-500/30 shrink-0">
                    <Users size={12} weight="fill" className="text-gold-400 sm:!w-3.5 sm:!h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Your Position</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm font-bold font-mono tabular-nums text-gold-400">#{userPosition.rank}</span>
                      <span className="text-[11px] text-gray-500">Top {100 - userPosition.percentile}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-800/50">

                {(showPodium ? filteredFsLeaders.slice(3) : filteredFsLeaders).map((entry, index) => {
                  const rank = showPodium ? index + 4 : index + 1;
                  const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
                  const isExpanded = expandedPlayerId === entry.userId;

                  return (
                    <div key={entry.userId}>
                      <div
                        className={`group px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-colors duration-150 ${isExpanded ? 'bg-gray-800/40' : 'hover:bg-gray-800/20'}`}
                        onClick={() => setExpandedPlayerId(isExpanded ? null : entry.userId)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Rank */}
                          <div className="w-6 sm:w-8 text-center shrink-0">
                            <span className={`text-[11px] font-mono ${getRankStyle(rank)}`}>#{rank}</span>
                          </div>

                          {/* Avatar */}
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={14} weight="fill" className="text-gray-500" />
                            )}
                          </div>

                          {/* Identity */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                                {entry.username || 'Anonymous'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold ${tierConfig.bg} ${tierConfig.color} rounded uppercase tracking-wide`}>
                                {entry.tier}
                              </span>
                              {entry.tapestryUserId && (
                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-800 text-neon-500" title="On-chain verified">
                                  <CheckCircle size={9} weight="fill" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right shrink-0">
                            <span className="text-sm font-mono font-bold tabular-nums text-white">
                              {entry.score.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-600 ml-1">FS</span>
                          </div>

                          {/* Expand chevron */}
                          <CaretRight
                            size={14}
                            className={`text-gray-600 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-3 bg-gray-800/20 border-t border-gray-800/50">
                          <div className="pl-[72px] flex items-center gap-3 flex-wrap py-2">
                            <FoundingMemberBadge
                              isFoundingMember={entry.isFoundingMember}
                              foundingMemberNumber={entry.foundingMemberNumber}
                              earlyAdopterTier={entry.earlyAdopterTier}
                              variant="minimal"
                            />
                            {entry.tapestryUserId && (
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <CheckCircle size={11} weight="fill" className="text-neon-500" />
                                On-chain verified
                              </span>
                            )}
                            {entry.tapestryUserId && isConnected && hasSession() && (
                              <FollowButton
                                targetProfileId={entry.tapestryUserId}
                                targetUsername={entry.username}
                                initialFollowing={
                                  followStates[entry.tapestryUserId] !== undefined
                                    ? followStates[entry.tapestryUserId]
                                    : followingIds.has(entry.tapestryUserId)
                                }
                                size="sm"
                                onFollowChange={(following) => {
                                  setFollowStates((prev) => ({ ...prev, [entry.tapestryUserId!]: following }));
                                  if (following) {
                                    setFollowingIds((prev) => new Set([...prev, entry.tapestryUserId!]));
                                  } else {
                                    setFollowingIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(entry.tapestryUserId!);
                                      return next;
                                    });
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredFsLeaders.length === 0 && fsTimeframe === 'friends' && !searchQuery && (
                  <div className="p-12 text-center">
                    <Users size={40} className="mx-auto mb-3 text-gray-600" />
                    <h3 className="text-lg font-semibold text-white mb-2">No friends yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Follow other players to see them here</p>
                    <button
                      onClick={() => setFsTimeframe('all_time')}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Browse All-Time leaderboard to find players →
                    </button>
                  </div>
                )}

                {filteredFsLeaders.length === 0 && fsTimeframe !== 'friends' && !searchQuery && (
                  <div className="p-12 text-center">
                    <Sparkle size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No rankings yet</p>
                  </div>
                )}

                {filteredFsLeaders.length === 0 && searchQuery && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">No players matching "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Load More — only for non-friends, non-search views */}
              {fsHasMore && fsTimeframe !== 'friends' && !searchQuery && (
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-center">
                  <button
                    onClick={loadMoreRankings}
                    disabled={loadingMore}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load more players
                        <span className="text-xs text-gray-600">({fsTotal - fsLeaders.length} remaining)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tapestry verification footer */}
              {fsLeaders.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between gap-4">
                  <p className="text-[10px] text-gray-600 flex items-center gap-1.5">
                    <Sparkle size={10} weight="fill" className="text-gold-400/50" />
                    All scores verified on Solana via Tapestry Protocol
                  </p>
                  <span className="text-[10px] text-gray-600 flex items-center gap-1 shrink-0">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-800 text-neon-500">
                      <CheckCircle size={9} weight="fill" />
                    </span>
                    = profile on-chain
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fantasy Leaderboard */}
          {!loading && rankingsSubTab === 'fantasy' && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Trophy size={20} weight="fill" className="text-gold-400" />
                <span className="font-semibold text-white">This Week's Draft Leaders</span>
              </div>

              <div className="divide-y divide-gray-800/50">
                {fantasyLeaders.map((team) => (
                  <div key={team.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 text-center ${getRankStyle(team.rank)}`}>
                        {getRankDisplay(team.rank)}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                        <Trophy size={18} weight="fill" className="text-gold-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{team.team_name}</div>
                        <div className="text-sm text-gray-500">by {team.username || `User ${team.user_id}`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono tabular-nums text-gold-400">{team.total_score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  </div>
                ))}

                {fantasyLeaders.length === 0 && (
                  <div className="p-12 text-center">
                    <Trophy size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No teams yet this week</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XP Leaderboard */}
          {!loading && rankingsSubTab === 'xp' && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Crown size={20} weight="fill" className="text-gold-400" />
                <span className="font-semibold text-white">XP Rankings</span>
              </div>

              <div className="divide-y divide-gray-800/50">
                {xpLeaders.map((user) => {
                  const level = getNumericLevel(user.lifetime_xp || user.xp);
                  return (
                    <div key={user.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 text-center ${getRankStyle(user.rank)}`}>
                          {getRankDisplay(user.rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} weight="fill" className="text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {user.username || formatAddress(user.wallet_address)}
                          </div>
                          <div className="text-sm text-gray-500">Level {level}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono tabular-nums text-gold-400">{(user.lifetime_xp || user.xp).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">XP</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {xpLeaders.length === 0 && (
                  <div className="p-12 text-center">
                    <Crown size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No rankings yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contests Tab — Split-screen master/detail layout */}
      {mainTab === 'contests' && (
        <div>
          {/* Loading */}
          {loading && (
            <div className="lg:grid lg:grid-cols-[340px_1fr] gap-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-gray-800 animate-pulse" />
                ))}
              </div>
              <div className="hidden lg:block h-80 rounded-xl bg-gray-800 animate-pulse" />
            </div>
          )}

          {/* Empty state */}
          {!loading && allBrowsableContests.length === 0 && archivedContests.length === 0 && (
            <div className="text-center py-16">
              <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-white mb-2">No contests available</h3>
              <p className="text-gray-400 mb-6">Check back soon for new contests!</p>
              {isConnected && (
                <button
                  onClick={async () => {
                    try {
                      const r = await apiClient.post('/api/admin/seed-demo-contest');
                      showToast(r.data.message || 'Done', 'success');
                      setTimeout(() => window.location.reload(), 1200);
                    } catch {
                      showToast('Failed to seed contest', 'error');
                    }
                  }}
                  className="text-xs text-gray-600 hover:text-gray-400 underline"
                >
                  Seed demo contest
                </button>
              )}
            </div>
          )}

          {/* ── Split-screen: Left list + Right detail ──────────────────── */}
          {!loading && (allBrowsableContests.length > 0 || archivedContests.length > 0) && (
            <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-5">

              {/* ═══ LEFT PANEL: Scrollable contest list ═══ */}
              <div className="lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-1 space-y-4 scrollbar-thin">

                {/* Start Here callout (new users, no entries) */}
                {isConnected && myEntries.length === 0 && startHereContestId && (
                  <button
                    onClick={() => {
                      const freeContest = filteredContests.find(c => c.isFree);
                      if (freeContest) {
                        setSelectedContestId(freeContest.id);
                        // On mobile, navigate
                        if (window.innerWidth < 1024) handleEnterContest(freeContest);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/15 transition-colors"
                  >
                    <Gift size={18} weight="fill" className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white">Start with Free League</span>
                      <p className="text-xs text-gray-400">No entry fee · Win real prizes</p>
                    </div>
                    <CaretRight size={14} className="text-emerald-400 shrink-0" />
                  </button>
                )}

                {/* My Active Contests */}
                {myEntries.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">My Contests</span>
                      <span className="text-[10px] text-gray-600">{myEntries.length}</span>
                    </div>
                    <div className="rounded-lg border border-gray-800 overflow-hidden divide-y divide-gray-800/60">
                      {myEntries.map((entry) => {
                        const cfg = CONTEST_CONFIG[entry.typeCode] || CONTEST_CONFIG.WEEKLY_STARTER;
                        const EntryIcon = cfg.icon;
                        const matchingContest = [...allBrowsableContests, ...archivedContests].find(c => c.id === entry.contestId);
                        const isSelected = selectedContestId === entry.contestId;
                        return (
                          <button
                            key={entry.contestId}
                            onClick={() => {
                              if (matchingContest) setSelectedContestId(entry.contestId);
                              else if (window.innerWidth < 1024) navigate(`/contest/${entry.contestId}`);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100 ${
                              isSelected
                                ? 'bg-gray-800 border-l-2 border-l-gold-500'
                                : 'bg-gray-900 hover:bg-gray-800/70 border-l-2 border-l-transparent'
                            }`}
                          >
                            <EntryIcon size={14} weight="fill" className={cfg.color} />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-white truncate block">{entry.contestName}</span>
                            </div>
                            {entry.rank ? (
                              <span className={`text-xs font-bold font-mono tabular-nums ${entry.rank === 1 ? 'text-gold-400' : entry.rank <= 3 ? 'text-gray-300' : 'text-gray-500'}`}>
                                #{entry.rank}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-600">Pending</span>
                            )}
                            {entry.status === 'finalized' && (
                              <span className="text-[10px] font-bold text-gray-500">FINAL</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Contests */}
                {allBrowsableContests.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Available</span>
                      <span className="text-[10px] text-gray-600">{allBrowsableContests.length}</span>
                    </div>
                    <div className="rounded-lg border border-gray-800 overflow-hidden divide-y divide-gray-800/60">
                      {allBrowsableContests.map((contest) => {
                        const config = CONTEST_CONFIG[contest.typeCode] || CONTEST_CONFIG.WEEKLY_STARTER;
                        const Icon = config.icon;
                        const hasEntered = enteredContestIds.has(contest.id);
                        const isSelected = selectedContestId === contest.id;
                        const isLive = contest.status === 'open' && new Date(contest.lockTime) > new Date();

                        return (
                          <button
                            key={contest.id}
                            onClick={() => {
                              setSelectedContestId(contest.id);
                              // On mobile, navigate to contest detail
                              if (window.innerWidth < 1024) navigate(`/contest/${contest.id}`);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-3 text-left transition-colors duration-100 ${
                              isSelected
                                ? 'bg-gray-800 border-l-2 border-l-gold-500'
                                : 'bg-gray-900 hover:bg-gray-800/70 border-l-2 border-l-transparent'
                            }`}
                          >
                            <div className={`p-1.5 rounded ${config.bg} shrink-0`}>
                              <Icon size={14} weight="fill" className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-white truncate">{contest.name || contest.typeName}</span>
                                {isLive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                <span className={`font-mono tabular-nums ${contest.isFree ? 'text-emerald-400' : ''}`}>
                                  {contest.isFree ? 'Free' : contest.entryFeeFormatted}
                                </span>
                                <span className="text-gray-700">·</span>
                                <span className="font-mono tabular-nums">{contest.playerCount} in</span>
                                <span className="text-gray-700">·</span>
                                {(() => {
                                  const isContestLocked = contest.status === 'locked' || new Date(contest.lockTime) <= new Date();
                                  if (isContestLocked && contest.endTime) {
                                    const r = getResultsCountdown(contest.endTime);
                                    return <span className={`font-mono tabular-nums ${r.urgent ? 'text-amber-400' : 'text-gray-400'}`}>results in {r.label}</span>;
                                  }
                                  const t = getTimeRemaining(contest.lockTime);
                                  return <span className={`font-mono tabular-nums ${t.urgent ? 'text-amber-400' : ''}`}>{t.label}</span>;
                                })()}
                              </div>
                            </div>
                            {hasEntered && (
                              <CheckCircle size={14} weight="fill" className="text-emerald-400 shrink-0" />
                            )}
                            {contest.isSignatureLeague && (
                              <Crown size={12} weight="fill" className="text-gold-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Season 1 Teaser */}
                <div className="relative rounded-lg border border-gray-800/60 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3 p-3">
                    <Fire size={15} weight="fill" className="text-gold-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white">Season 1: The Grind</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">Weekly contests with real stakes</p>
                    </div>
                    <span className="text-[10px] font-bold text-gold-400 shrink-0">SOON</span>
                  </div>
                </div>

                {/* Creator Leagues CTA */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800">
                  <Crown size={15} weight="fill" className="text-gold-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white">Creator Leagues</span>
                    <span className="ml-1.5 text-[10px] text-gold-400">SOON</span>
                  </div>
                  <a
                    href="mailto:gm@foresight.gg?subject=Creator%20League%20Early%20Access"
                    className="text-[11px] text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    Get access →
                  </a>
                </div>

                {/* Past Contests — hidden during launch week */}
              </div>

              {/* ═══ RIGHT PANEL: Contest detail (desktop only) ═══ */}
              <div className="hidden lg:block">
                {selectedContest ? (() => {
                  const config = CONTEST_CONFIG[selectedContest.typeCode] || CONTEST_CONFIG.WEEKLY_STARTER;
                  const Icon = config.icon;
                  const hasEntered = enteredContestIds.has(selectedContest.id);
                  const isLive = selectedContest.status === 'open' && new Date(selectedContest.lockTime) > new Date();
                  const isLocked = selectedContest.status === 'locked' || (selectedContest.status === 'open' && new Date(selectedContest.lockTime) <= new Date());
                  const isFinished = ['finalized', 'settled'].includes(selectedContest.status);
                  const myEntry = myEntries.find(e => e.contestId === selectedContest.id);
                  const isSignature = selectedContest.isSignatureLeague;

                  return (
                    <div className="sticky top-4 rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
                      {/* Header */}
                      <div className="p-6 border-b border-gray-800/60">
                        <div className="flex items-start gap-3 mb-4">
                          {isSignature && selectedContest.creatorAvatarUrl ? (
                            <div className="relative shrink-0">
                              <img
                                src={selectedContest.creatorAvatarUrl}
                                alt=""
                                className="w-11 h-11 rounded-full border-2 border-gold-500/40 object-cover"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                                <Crown size={9} weight="fill" className="text-gray-950" />
                              </div>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-xl ${config.bg} shrink-0`}>
                              <Icon size={22} weight="fill" className={config.color} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white leading-tight">{selectedContest.name || selectedContest.typeName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs ${config.color}`}>{selectedContest.typeName}</span>
                              {isLive && (
                                <span className="inline-flex items-center gap-1 text-xs text-gold-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                                  LIVE
                                </span>
                              )}
                              {isLocked && <span className="text-xs text-gray-500 font-bold">LOCKED</span>}
                              {isFinished && <span className="text-xs text-gray-500 font-bold">FINAL</span>}
                              {isSignature && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold-500/15 text-gold-400 border border-gold-500/20">
                                  SIGNATURE
                                </span>
                              )}
                            </div>
                            {isSignature && selectedContest.creatorHandle && (
                              <p className="text-xs text-gray-500 mt-1">
                                by <span className="text-gold-400">@{selectedContest.creatorHandle}</span>
                                {selectedContest.creatorFollowerCount && selectedContest.creatorFollowerCount > 0
                                  ? ` · ${(selectedContest.creatorFollowerCount / 1000000).toFixed(1)}M followers`
                                  : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Your position (if entered) */}
                        {myEntry && (
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/60 mb-4">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Your Rank</span>
                              <div className={`text-xl font-bold font-mono tabular-nums ${
                                myEntry.rank === 1 ? 'text-gold-400' : myEntry.rank && myEntry.rank <= 3 ? 'text-gray-200' : 'text-white'
                              }`}>
                                {myEntry.rank ? `#${myEntry.rank}` : '—'}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score</span>
                              <div className="text-xl font-bold font-mono tabular-nums text-white">
                                {myEntry.score > 0 ? myEntry.score.toFixed(0) : '—'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-gray-800/40">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry Fee</span>
                            <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${selectedContest.isFree ? 'text-emerald-400' : 'text-white'}`}>
                              {selectedContest.isFree ? 'FREE' : selectedContest.entryFeeFormatted}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/40">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Prize Pool</span>
                            <div className="text-base font-bold font-mono tabular-nums text-gold-400 mt-0.5">
                              {selectedContest.prizePoolFormatted}
                            </div>
                            {selectedContest.prizePool > 0 && selectedContest.prizePool < 10 && (
                              <span className="text-[10px] text-gray-600 font-mono">≈ ${(selectedContest.prizePool * solPrice).toFixed(2)}</span>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/40">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Players</span>
                            <div className="text-base font-bold font-mono tabular-nums text-white mt-0.5">{selectedContest.playerCount}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/40">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {isFinished ? 'Ended' : isLocked ? 'Results In' : 'Closes In'}
                            </span>
                            <div className="text-base font-bold font-mono tabular-nums mt-0.5">
                              {isFinished
                                ? <span className="text-white">{selectedContest.endTime ? formatEndDate(selectedContest.endTime) : 'Ended'}</span>
                                : isLocked
                                  ? (() => { const r = getResultsCountdown(selectedContest.endTime || ''); return (
                                      <span className={r.urgent ? 'text-amber-400' : 'text-emerald-400'}>{r.label}</span>
                                    ); })()
                                  : (() => { const t = getTimeRemaining(selectedContest.lockTime); return (
                                      <span className={t.urgent ? 'text-amber-400' : 'text-white'}>{t.label}</span>
                                    ); })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rules */}
                      <div className="px-6 py-4 border-b border-gray-800/60">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How It Works</h4>
                        <ul className="text-xs text-gray-400 space-y-1.5">
                          <li className="flex items-start gap-2">
                            <Users size={12} className="text-gray-600 mt-0.5 shrink-0" />
                            Draft a team of {selectedContest.teamSize} CT influencers
                          </li>
                          {selectedContest.hasCaptain && (
                            <li className="flex items-start gap-2">
                              <Crown size={12} className="text-gold-400 mt-0.5 shrink-0" />
                              Pick a Captain for <span className="text-gold-400 font-medium">2.0x</span> points
                            </li>
                          )}
                          <li className="flex items-start gap-2">
                            <ChartLineUp size={12} className="text-gray-600 mt-0.5 shrink-0" />
                            Earn points from their engagement + growth
                          </li>
                          <li className="flex items-start gap-2">
                            <Trophy size={12} className="text-gold-400 mt-0.5 shrink-0" />
                            Top performers win prizes
                          </li>
                        </ul>
                      </div>

                      {/* Prize Breakdown — single row */}
                      {prizeRules.length > 0 && (() => {
                        const sorted = [...prizeRules].sort((a, b) => (a.rank || 999) - (b.rank || 999));
                        const top3 = sorted.filter(r => r.rank >= 1 && r.rank <= 3);
                        const rest = sorted.filter(r => r.rank > 3 || r.rank === 0);
                        return (
                          <div className="px-6 py-3 border-b border-gray-800/60">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prizes</span>
                              {top3.map((rule) => (
                                <span key={rule.rank} className="flex items-center gap-1 text-xs">
                                  {rule.rank === 1 && <Medal size={11} weight="fill" className="text-gold-400" />}
                                  {rule.rank === 2 && <Medal size={11} weight="fill" className="text-gray-400" />}
                                  {rule.rank === 3 && <Medal size={11} weight="fill" className="text-amber-700" />}
                                  <span className={rule.rank === 1 ? 'text-gold-400 font-medium' : 'text-gray-400'}>
                                    {rule.percentage}%
                                  </span>
                                </span>
                              ))}
                              {rest.length > 0 && (
                                <span className="text-[10px] text-gray-600">+{rest.length} more</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* CTA */}
                      <div className="p-6">
                        {isFinished ? (
                          <button
                            onClick={() => navigate(`/contest/${selectedContest.id}`)}
                            className="w-full py-3 rounded-lg border border-gray-700 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors duration-150"
                          >
                            View Results
                            <CaretRight size={14} />
                          </button>
                        ) : hasEntered ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => navigate(`/contest/${selectedContest.id}`)}
                              className="w-full py-3 rounded-lg border border-gray-700 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors duration-150"
                            >
                              <ChartLineUp size={15} />
                              View My Entry
                              <CaretRight size={14} />
                            </button>
                            {!isLocked && (
                              <button
                                onClick={() => handleEnterContest(selectedContest)}
                                className="w-full py-2.5 rounded-lg text-gray-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:text-white transition-colors duration-150"
                              >
                                Edit Team
                              </button>
                            )}
                          </div>
                        ) : isLocked ? (
                          <button
                            disabled
                            className="w-full py-3 rounded-lg bg-gray-800 text-gray-500 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            Contest Locked
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnterContest(selectedContest)}
                            className="w-full py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-gray-950 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-150"
                          >
                            {selectedContest.isFree ? (
                              <>
                                <Gift size={16} weight="fill" />
                                Enter Free
                              </>
                            ) : (
                              <>
                                <Wallet size={16} weight="fill" />
                                Enter · <span className="font-mono">{selectedContest.entryFeeFormatted}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="sticky top-4 rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
                    <Trophy size={40} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-sm text-gray-500">Select a contest to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
