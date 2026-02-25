/**
 * Compete - Unified Competition Hub
 * Combines Rankings (Leaderboards) and Contests into one streamlined interface
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';
import FoundingMemberBadge from '../components/FoundingMemberBadge';
import TapestryBadge from '../components/TapestryBadge';
import FollowButton from '../components/FollowButton';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Tapestry on-chain reputation tier — separate from player tier badges */
function getReputationTier(rank: number, total: number): { label: string; color: string } {
  if (total === 0) return { label: 'Verified', color: 'text-emerald-400' };
  const pct = rank / total;
  if (pct <= 0.05) return { label: 'Stellar',  color: 'text-cyan-300' };
  if (pct <= 0.15) return { label: 'Premium',  color: 'text-cyan-400' };
  if (pct <= 0.35) return { label: 'Member',   color: 'text-cyan-500' };
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

const CONTEST_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  FREE_LEAGUE: { icon: Gift, color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  WEEKLY_STARTER: { icon: Play, color: 'text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  WEEKLY_STANDARD: { icon: Trophy, color: 'text-gold-400', gradient: 'from-gold-500 to-amber-600' },
  WEEKLY_PRO: { icon: Crown, color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-600' },
  DAILY_FLASH: { icon: Lightning, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-600' },
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
  const [fantasyLeaders, setFantasyLeaders] = useState<FantasyLeaderTeam[]>([]);
  const [xpLeaders, setXpLeaders] = useState<XPLeaderUser[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; percentile: number } | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [myEntries, setMyEntries] = useState<MyEntry[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [solPrice, setSolPrice] = useState<number>(145);

  // Fetch live SOL price
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r => r.json())
      .then(d => { if (d?.solana?.usd) setSolPrice(d.solana.usd); })
      .catch(() => {});
  }, []);

  // Update URL when tabs change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', mainTab);
    if (mainTab === 'rankings') {
      params.set('type', rankingsSubTab);
    }
    setSearchParams(params, { replace: true });
  }, [mainTab, rankingsSubTab]);

  // Fetch data when tabs change
  useEffect(() => {
    if (mainTab === 'rankings') {
      fetchRankingsData();
    } else {
      fetchContestsData();
    }
  }, [mainTab, rankingsSubTab, fsTimeframe]);

  // Fetch who we follow (for friends tab + follow buttons)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !isConnected) return;

    axios.get(`${API_URL}/api/tapestry/my-following`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = localStorage.getItem('authToken');
    if (!token || fsLeaders.length === 0) return;

    const profileIds = fsLeaders
      .filter((e) => e.tapestryUserId)
      .map((e) => e.tapestryUserId!);

    if (profileIds.length === 0) return;

    axios.post(
      `${API_URL}/api/tapestry/following-state-batch`,
      { targetProfileIds: profileIds },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => {
        if (res.data?.data?.states) {
          setFollowStates(res.data.data.states);
        }
      })
      .catch(() => {});
  }, [fsLeaders]);

  const fetchRankingsData = async () => {
    try {
      setLoading(true);

      if (rankingsSubTab === 'fs') {
        // For "friends" tab, fetch all-time data then filter client-side
        const actualTimeframe = fsTimeframe === 'friends' ? 'all_time' : fsTimeframe;
        const response = await axios.get(`${API_URL}/api/v2/fs/leaderboard`, {
          params: { type: actualTimeframe, limit: 50 },
        });
        if (response.data.success) {
          let entries = response.data.data.entries || [];
          // If friends filter, filter to only followed users
          if (fsTimeframe === 'friends') {
            entries = entries.filter((e: FsLeaderEntry) =>
              e.tapestryUserId && followingIds.has(e.tapestryUserId)
            );
            // Re-rank
            entries = entries.map((e: FsLeaderEntry, idx: number) => ({ ...e, rank: idx + 1 }));
          }
          setFsLeaders(entries);
          setFsTotal(fsTimeframe === 'friends' ? entries.length : (response.data.data.total || 0));
        }

        // Get user position (not for friends tab)
        const token = localStorage.getItem('authToken');
        if (token && fsTimeframe !== 'friends') {
          try {
            const posRes = await axios.get(`${API_URL}/api/v2/fs/leaderboard/position`, {
              params: { type: fsTimeframe },
              headers: { Authorization: `Bearer ${token}` },
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
        const response = await axios.get(`${API_URL}/api/league/leaderboard`);
        setFantasyLeaders(response.data.leaderboard || []);
      } else if (rankingsSubTab === 'xp') {
        const response = await axios.get(`${API_URL}/api/users/xp-leaderboard`, {
          params: { limit: 50 },
        });
        setXpLeaders(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContestsData = async () => {
    try {
      setLoading(true);
      const [contestsRes, entriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/contests`, { params: { active: 'true' } }),
        isConnected && localStorage.getItem('authToken')
          ? axios.get(`${API_URL}/api/v2/me/entries`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            }).catch(() => ({ data: { entries: [] } }))
          : Promise.resolve({ data: { entries: [] } }),
      ]);
      setContests(contestsRes.data.contests || []);
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
    let filtered = contests.filter(c => c.status === 'open' && !c.isSignatureLeague);
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

  const filteredFsLeaders = useMemo(() =>
    searchQuery.trim()
      ? fsLeaders.filter(e => (e.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : fsLeaders,
    [fsLeaders, searchQuery]
  );

  // Helpers
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">1st</span>;
    if (rank === 2) return <span className="text-xl">2nd</span>;
    if (rank === 3) return <span className="text-xl">3rd</span>;
    return <span>#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-gold-400 font-bold';
    if (rank === 2) return 'text-cyan-400 font-bold';
    if (rank === 3) return 'text-emerald-400 font-bold';
    return 'text-gray-500';
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getTimeRemaining = (lockTime: string) => {
    const diff = new Date(lockTime).getTime() - Date.now();
    if (diff <= 0) return 'Locked';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleEnterContest = (contest: Contest) => {
    if (!isConnected) {
      showToast('Please sign in first', 'error');
      return;
    }
    navigate(`/draft?contestId=${contest.id}&type=${contest.typeCode}&teamSize=${contest.teamSize}&hasCaptain=${contest.hasCaptain}&isFree=${contest.isFree}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Row 1: Title + Main Tabs in one line */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center shrink-0">
            <Trophy size={16} weight="fill" className="text-gray-950" />
          </div>
          <h1 className="text-lg font-bold text-white">Compete</h1>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setMainTab('rankings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mainTab === 'rankings'
                ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Medal size={15} weight={mainTab === 'rankings' ? 'fill' : 'regular'} />
            Rankings
          </button>
          <button
            onClick={() => setMainTab('contests')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mainTab === 'contests'
                ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Trophy size={15} weight={mainTab === 'contests' ? 'fill' : 'regular'} />
            Contests
            {(filteredContests.length + signatureContests.length) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-950/30 text-xs">
                {filteredContests.length + signatureContests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Rankings Tab */}
      {mainTab === 'rankings' && (
        <div className="space-y-3">
          {/* Row 2: Sub-tab selector + timeframe + search — all on one line */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sub-tabs */}
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
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

            {/* Timeframe — only for FS tab */}
            {rankingsSubTab === 'fs' && (
              <div className="flex gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5">
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
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      fsTimeframe === tf.id
                        ? 'bg-gold-500 text-gray-950'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative ml-auto">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-36 focus:w-44 transition-all"
              />
            </div>
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
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle size={20} weight="fill" className="text-gold-400" />
                  <span className="font-semibold text-white">
                    {fsTimeframe === 'all_time' && 'All-Time Leaders'}
                    {fsTimeframe === 'season' && 'Season Leaders'}
                    {fsTimeframe === 'weekly' && 'Weekly Leaders'}
                    {fsTimeframe === 'referral' && 'Top Referrers'}
                    {fsTimeframe === 'friends' && 'Friends Leaderboard'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{fsTotal.toLocaleString()} players</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-800/50">
                {/* Pinned: Your Position — inside list, not above it */}
                {userPosition && rankingsSubTab === 'fs' && !searchQuery && (
                  <div className="px-4 py-3 border-l-4 border-l-gold-400/50 bg-gold-500/5 border-b border-gray-800/50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 text-center shrink-0">
                        <span className="text-xs font-bold text-gold-400">#{userPosition.rank}</span>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center text-white shrink-0 ring-2 ring-gold-400/30">
                        <Users size={16} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gold-400">You</span>
                          <span className="text-[10px] text-gray-500">Top {100 - userPosition.percentile}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-gray-500 uppercase tracking-widest">Your rank</div>
                      </div>
                    </div>
                  </div>
                )}

                {filteredFsLeaders.map((entry, index) => {
                  const rank = index + 1;
                  const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
                  const isTop3 = rank <= 3;
                  const rowBorder = rank === 1
                    ? 'border-l-4 border-l-gold-400 bg-gold-500/5'
                    : rank === 2
                    ? 'border-l-4 border-l-cyan-400 bg-cyan-500/5'
                    : rank === 3
                    ? 'border-l-4 border-l-emerald-400 bg-emerald-500/5'
                    : 'border-l-4 border-l-transparent';

                  return (
                    <div key={entry.userId} className={`px-4 py-3 hover:bg-gray-800/30 transition-colors ${rowBorder}`}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Rank — compact, consistent width */}
                        <div className={`w-8 text-center shrink-0 text-sm ${getRankStyle(rank)}`}>
                          {rank === 1 ? (
                            <Crown size={18} weight="fill" className="mx-auto text-gold-400" />
                          ) : rank === 2 ? (
                            <Medal size={16} weight="fill" className="mx-auto text-cyan-400" />
                          ) : rank === 3 ? (
                            <Medal size={16} weight="fill" className="mx-auto text-emerald-400" />
                          ) : (
                            <span className="text-xs text-gray-500">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar — consistent size across all ranks */}
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center text-white overflow-hidden shrink-0 ring-2 ${rank === 1 ? 'ring-gold-400/50' : rank === 2 ? 'ring-cyan-400/30' : rank === 3 ? 'ring-emerald-400/30' : 'ring-transparent'}`}>
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={16} weight="fill" />
                          )}
                        </div>

                        {/* Identity — username + tier badge + founding + on-chain dot */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                              {entry.username || 'Anonymous'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold ${tierConfig.bg} ${tierConfig.color} rounded uppercase tracking-wide whitespace-nowrap`}>
                              {entry.tier}
                            </span>
                            <span className="hidden sm:inline-flex">
                              <FoundingMemberBadge
                                isFoundingMember={entry.isFoundingMember}
                                foundingMemberNumber={entry.foundingMemberNumber}
                                earlyAdopterTier={entry.earlyAdopterTier}
                                variant="minimal"
                              />
                            </span>
                            {/* On-chain: icon-only dot, tooltip explains */}
                            {entry.tapestryUserId && (() => {
                              const repTier = getReputationTier(rank, fsTotal);
                              return (
                                <span
                                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-800 ${repTier.color}`}
                                  title={`${repTier.label} · Verified on Tapestry Protocol`}
                                >
                                  <CheckCircle size={10} weight="fill" />
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Follow — hidden on mobile to keep rows clean */}
                        {entry.tapestryUserId && isConnected && localStorage.getItem('authToken') && (
                          <div className="hidden sm:block shrink-0">
                            <FollowButton
                              targetProfileId={entry.tapestryUserId}
                              initialFollowing={followStates[entry.tapestryUserId] || false}
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
                          </div>
                        )}

                        {/* Score — primary metric, always dominant */}
                        <div className="text-right shrink-0">
                          <div className={`${isTop3 ? 'text-xl' : 'text-lg'} font-black tracking-tight text-white`}>
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest">FS</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {fsLeaders.length === 0 && fsTimeframe === 'friends' && (
                  <div className="p-12 text-center">
                    <Users size={40} className="mx-auto mb-3 text-gray-600" />
                    <h3 className="text-lg font-semibold text-white mb-2">No friends yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Follow other players to see them here</p>
                    <button
                      onClick={() => setFsTimeframe('all_time')}
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Browse All-Time leaderboard to find players →
                    </button>
                  </div>
                )}

                {fsLeaders.length === 0 && fsTimeframe !== 'friends' && (
                  <div className="p-12 text-center">
                    <Sparkle size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No rankings yet</p>
                  </div>
                )}
              </div>

              {/* Tapestry verification footer */}
              {fsLeaders.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
                  <p className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Sparkle size={10} weight="fill" className="text-gold-400/50" />
                    All scores verified on Solana via Tapestry Protocol
                  </p>
                  {fsTotal > 0 && (
                    <span className="text-[10px] text-gray-600">
                      {fsTotal.toLocaleString()} profiles on-chain
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fantasy Leaderboard */}
          {!loading && rankingsSubTab === 'fantasy' && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Trophy size={20} weight="fill" className="text-yellow-400" />
                <span className="font-semibold text-white">This Week's Draft Leaders</span>
              </div>

              <div className="divide-y divide-gray-800/50">
                {fantasyLeaders.map((team) => (
                  <div key={team.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 text-center ${getRankStyle(team.rank)}`}>
                        {getRankDisplay(team.rank)}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Trophy size={18} weight="fill" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{team.team_name}</div>
                        <div className="text-sm text-gray-500">by {team.username || `User ${team.user_id}`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-400">{team.total_score.toLocaleString()}</div>
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
                <Crown size={20} weight="fill" className="text-cyan-400" />
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} weight="fill" className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {user.username || formatAddress(user.wallet_address)}
                          </div>
                          <div className="text-sm text-gray-500">Level {level}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-cyan-400">{(user.lifetime_xp || user.xp).toLocaleString()}</div>
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

      {/* Contests Tab */}
      {mainTab === 'contests' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    contestFilter === filter.key
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-gray-800/50 text-gray-400 border border-transparent hover:bg-gray-800'
                  }`}
                >
                  <Icon size={14} weight={contestFilter === filter.key ? 'fill' : 'regular'} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* My Entries Section */}
          {myEntries.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={18} weight="fill" className="text-green-400" />
                  <span className="font-semibold text-white">Your Active Entries</span>
                </div>
                <span className="text-sm text-green-400">{myEntries.length} entries</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myEntries.slice(0, 3).map((entry) => (
                  <button
                    key={entry.contestId}
                    onClick={() => navigate(`/contest/${entry.contestId}`)}
                    className="flex-shrink-0 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-left hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-sm font-medium text-white">{entry.contestName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{entry.rank ? `#${entry.rank}` : 'Pending'}</span>
                      <span className="text-gray-600">|</span>
                      <span>{entry.score > 0 ? `${entry.score.toFixed(1)} pts` : '-'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Signature Leagues (pinned at top) ─────────────────────────── */}
          {!loading && signatureContests.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkle size={16} weight="fill" className="text-gold-400" />
                <span className="text-sm font-bold text-gold-400 uppercase tracking-wide">Signature Leagues</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signatureContests.map((contest) => {
                  const hasEntered = enteredContestIds.has(contest.id);
                  const creatorInitials = contest.creatorHandle
                    ? contest.creatorHandle.slice(0, 2).toUpperCase()
                    : 'SL';

                  return (
                    <div
                      key={contest.id}
                      className="relative bg-gold-500/5 border border-gold-500/30 rounded-xl overflow-hidden hover:border-gold-500/50 transition-all group"
                    >
                      {/* Thick gold gradient bar */}
                      <div className="h-1.5 bg-gradient-to-r from-gold-500 to-amber-600" />

                      <div className="p-4">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Creator avatar */}
                            <div className="relative flex-shrink-0">
                              {contest.creatorAvatarUrl ? (
                                <img
                                  src={contest.creatorAvatarUrl}
                                  alt={contest.creatorHandle || ''}
                                  className="w-10 h-10 rounded-full border-2 border-gold-500/50 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-10 h-10 rounded-full border-2 border-gold-500/50 bg-gold-500/20 flex items-center justify-center ${contest.creatorAvatarUrl ? 'hidden' : ''}`}
                              >
                                <span className="text-xs font-bold text-gold-400">{creatorInitials}</span>
                              </div>
                              {/* Crown badge */}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                                <Crown size={9} weight="fill" className="text-gray-950" />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white">{contest.name}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Signature badge */}
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold-500/15 text-gold-400 border border-gold-500/30">
                                  ✦ SIGNATURE
                                </span>
                                {contest.isFree && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    FREE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {hasEntered && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0">
                              ENTERED
                            </span>
                          )}
                        </div>

                        {/* Creator line */}
                        <p className="text-xs text-gray-400 mb-3">
                          Powered by{' '}
                          <span className="text-gold-400 font-medium">@{contest.creatorHandle}</span>
                          {contest.creatorFollowerCount && contest.creatorFollowerCount > 0 ? (
                            <span className="text-gray-500"> · {(contest.creatorFollowerCount / 1000000).toFixed(1)}M followers</span>
                          ) : null}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-emerald-400">
                              {contest.isFree ? 'FREE' : contest.entryFeeFormatted}
                            </div>
                            <div className="text-[10px] text-gray-500">Entry</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-emerald-400">
                              ${(contest.prizePool * solPrice).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">{contest.prizePoolFormatted}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-white">{contest.playerCount}</div>
                            <div className="text-[10px] text-gray-500">Players</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                              <Clock size={12} />
                              {getTimeRemaining(contest.lockTime)}
                            </div>
                            <div className="text-[10px] text-gray-500">Left</div>
                          </div>
                        </div>

                        {/* Action */}
                        {hasEntered ? (
                          <button
                            onClick={() => navigate(`/contest/${contest.id}`)}
                            className="w-full py-2.5 rounded-xl bg-gray-700 text-white font-medium flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors"
                          >
                            <ChartLineUp size={16} />
                            View Entry
                            <CaretRight size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnterContest(contest)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:opacity-90 text-gray-950 font-bold flex items-center justify-center gap-2 transition-opacity"
                          >
                            <Crown size={16} weight="fill" />
                            Join {contest.creatorHandle ? `@${contest.creatorHandle}'s League` : 'Signature League'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Regular Contests ──────────────────────────────────────────── */}
          {!loading && (signatureContests.length > 0 || filteredContests.length > 0) && (
            <div>
              {signatureContests.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={14} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">All Contests</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContests.map((contest) => {
                  const config = CONTEST_CONFIG[contest.typeCode] || CONTEST_CONFIG.WEEKLY_STARTER;
                  const Icon = config.icon;
                  const hasEntered = enteredContestIds.has(contest.id);

                  return (
                    <div
                      key={contest.id}
                      className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all group"
                    >
                      <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                              <Icon size={18} weight="fill" className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{contest.name || contest.typeName}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs ${config.color}`}>{contest.typeName}</span>
                                {contest.isFree && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    FREE
                                  </span>
                                )}
                                {contest.id === startHereContestId && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                                    ⭐ Start here
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {hasEntered && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                              ENTERED
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className={`text-sm font-bold ${config.color}`}>
                              {contest.isFree ? 'FREE' : contest.entryFeeFormatted}
                            </div>
                            <div className="text-[10px] text-gray-500">Entry</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-emerald-400">
                              ${(contest.prizePool * solPrice).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">{contest.prizePoolFormatted}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-white">{contest.playerCount}</div>
                            <div className="text-[10px] text-gray-500">Players</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-black/20">
                            <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                              <Clock size={12} />
                              {getTimeRemaining(contest.lockTime)}
                            </div>
                            <div className="text-[10px] text-gray-500">Left</div>
                          </div>
                        </div>

                        {hasEntered ? (
                          <button
                            onClick={() => navigate(`/contest/${contest.id}`)}
                            className="w-full py-2 rounded-lg bg-gray-700 text-white font-medium flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors"
                          >
                            <ChartLineUp size={16} />
                            View Entry
                            <CaretRight size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnterContest(contest)}
                            className={`w-full py-2 rounded-lg bg-gradient-to-r ${config.gradient} text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                          >
                            {contest.isFree ? (
                              <>
                                <Gift size={16} weight="fill" />
                                Enter Free
                              </>
                            ) : (
                              <>
                                <Wallet size={16} weight="fill" />
                                Enter ({contest.entryFeeFormatted})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state — only show if truly nothing to display */}
          {!loading && filteredContests.length === 0 && signatureContests.length === 0 && (
            <div className="text-center py-16">
              <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-white mb-2">No contests available</h3>
              <p className="text-gray-400">Check back soon for new contests!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
