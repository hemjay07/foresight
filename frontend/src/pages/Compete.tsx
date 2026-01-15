/**
 * Compete - Unified Competition Hub
 * Combines Rankings (Leaderboards) and Contests into one streamlined interface
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
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
} from '@phosphor-icons/react';
import { getNumericLevel } from '../utils/xp';
import FoundingMemberBadge from '../components/FoundingMemberBadge';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type MainTab = 'rankings' | 'contests';
type RankingsSubTab = 'fs' | 'fantasy' | 'xp';
type FsTimeframe = 'all_time' | 'season' | 'weekly' | 'referral';
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
  bronze: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
  silver: { color: 'text-gray-300', bg: 'bg-gray-400/20' },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  platinum: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  diamond: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
} as const;

const CONTEST_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  FREE_LEAGUE: { icon: Gift, color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  WEEKLY_STARTER: { icon: Play, color: 'text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  WEEKLY_STANDARD: { icon: Trophy, color: 'text-purple-400', gradient: 'from-purple-500 to-pink-600' },
  WEEKLY_PRO: { icon: Crown, color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-600' },
  DAILY_FLASH: { icon: Lightning, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-600' },
};

export default function Compete() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Parse URL params
  const initialMainTab = (searchParams.get('tab') as MainTab) || 'rankings';
  const initialRankingsTab = (searchParams.get('type') as RankingsSubTab) || 'fs';

  const [mainTab, setMainTab] = useState<MainTab>(initialMainTab);
  const [rankingsSubTab, setRankingsSubTab] = useState<RankingsSubTab>(initialRankingsTab);
  const [fsTimeframe, setFsTimeframe] = useState<FsTimeframe>('all_time');
  const [contestFilter, setContestFilter] = useState<ContestFilter>('all');
  const [loading, setLoading] = useState(true);

  // Data states
  const [fsLeaders, setFsLeaders] = useState<FsLeaderEntry[]>([]);
  const [fsTotal, setFsTotal] = useState(0);
  const [fantasyLeaders, setFantasyLeaders] = useState<FantasyLeaderTeam[]>([]);
  const [xpLeaders, setXpLeaders] = useState<XPLeaderUser[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; percentile: number } | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [myEntries, setMyEntries] = useState<MyEntry[]>([]);

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

  const fetchRankingsData = async () => {
    try {
      setLoading(true);

      if (rankingsSubTab === 'fs') {
        const response = await axios.get(`${API_URL}/api/v2/fs/leaderboard`, {
          params: { type: fsTimeframe, limit: 50 },
        });
        if (response.data.success) {
          setFsLeaders(response.data.data.entries || []);
          setFsTotal(response.data.data.total || 0);
        }

        // Get user position
        const token = localStorage.getItem('authToken');
        if (token) {
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

  // Filter contests
  const filteredContests = useMemo(() => {
    let filtered = contests.filter(c => c.status === 'open');
    switch (contestFilter) {
      case 'free':
        return filtered.filter(c => c.isFree);
      case 'weekly':
        return filtered.filter(c => c.typeCode?.includes('WEEKLY'));
      case 'daily':
        return filtered.filter(c => c.typeCode === 'DAILY_FLASH');
      default:
        return filtered;
    }
  }, [contests, contestFilter]);

  const enteredContestIds = useMemo(() => new Set(myEntries.map(e => e.contestId)), [myEntries]);

  // Helpers
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">1st</span>;
    if (rank === 2) return <span className="text-xl">2nd</span>;
    if (rank === 3) return <span className="text-xl">3rd</span>;
    return <span>#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 font-bold';
    if (rank === 2) return 'text-gray-300 font-bold';
    if (rank === 3) return 'text-orange-400 font-bold';
    return 'text-gray-400';
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
      showToast('Please connect your wallet first', 'warning');
      return;
    }
    navigate(`/draft?contestId=${contest.id}&type=${contest.typeCode}&teamSize=${contest.teamSize}&hasCaptain=${contest.hasCaptain}&isFree=${contest.isFree}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center">
            <Trophy size={22} weight="fill" className="text-gray-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Compete</h1>
            <p className="text-sm text-gray-400">Rankings, leaderboards & contests</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMainTab('rankings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            mainTab === 'rankings'
              ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Medal size={18} weight={mainTab === 'rankings' ? 'fill' : 'regular'} />
          Rankings
        </button>
        <button
          onClick={() => setMainTab('contests')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            mainTab === 'contests'
              ? 'bg-gold-500 text-gray-950 shadow-lg shadow-gold-500/20'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Trophy size={18} weight={mainTab === 'contests' ? 'fill' : 'regular'} />
          Contests
          {filteredContests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-950/30 text-xs">
              {filteredContests.length}
            </span>
          )}
        </button>
      </div>

      {/* Rankings Tab */}
      {mainTab === 'rankings' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'fs' as RankingsSubTab, label: 'Foresight Score', icon: Sparkle, color: 'gold' },
              { id: 'fantasy' as RankingsSubTab, label: 'Draft Leaders', icon: Trophy, color: 'yellow' },
              { id: 'xp' as RankingsSubTab, label: 'XP Rankings', icon: Crown, color: 'cyan' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = rankingsSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRankingsSubTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* FS Timeframe selector */}
          {rankingsSubTab === 'fs' && (
            <div className="flex gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1 w-fit">
              {[
                { id: 'all_time' as FsTimeframe, label: 'All-Time' },
                { id: 'season' as FsTimeframe, label: 'Season' },
                { id: 'weekly' as FsTimeframe, label: 'Weekly' },
                { id: 'referral' as FsTimeframe, label: 'Referrals' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setFsTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    fsTimeframe === tf.id
                      ? 'bg-gold-500 text-gray-950'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}

          {/* User position banner */}
          {userPosition && rankingsSubTab === 'fs' && (
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <Target size={20} className="text-gold-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Your Position</div>
                  <div className="text-xl font-bold text-white">#{userPosition.rank}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Percentile</div>
                <div className="text-lg font-semibold text-gold-400">Top {100 - userPosition.percentile}%</div>
              </div>
            </div>
          )}

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
                    {fsTimeframe === 'all_time' && 'All-Time'}
                    {fsTimeframe === 'season' && 'Season'}
                    {fsTimeframe === 'weekly' && 'Weekly'}
                    {fsTimeframe === 'referral' && 'Top Referrers'} {fsTimeframe !== 'referral' && 'Leaders'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{fsTotal.toLocaleString()} players</span>
              </div>

              <div className="divide-y divide-gray-800/50">
                {fsLeaders.map((entry, index) => {
                  const rank = entry.rank || index + 1;
                  const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;

                  return (
                    <div key={entry.userId} className="p-4 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 text-center ${getRankStyle(rank)}`}>
                          {getRankDisplay(rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center text-white overflow-hidden">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} weight="fill" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate">
                              {entry.username || 'Anonymous'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-xs font-bold ${tierConfig.bg} ${tierConfig.color} rounded uppercase`}>
                              {entry.tier}
                            </span>
                            <FoundingMemberBadge
                              isFoundingMember={entry.isFoundingMember}
                              foundingMemberNumber={entry.foundingMemberNumber}
                              earlyAdopterTier={entry.earlyAdopterTier}
                              variant="minimal"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${tierConfig.color}`}>
                            {entry.score.toLocaleString()} FS
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {fsLeaders.length === 0 && (
                  <div className="p-12 text-center">
                    <Sparkle size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No rankings yet</p>
                  </div>
                )}
              </div>
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

          {/* Contests Grid */}
          {!loading && (
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
                    {/* Type indicator */}
                    <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                            <Icon size={18} weight="fill" className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{contest.name || contest.typeName}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${config.color}`}>{contest.typeName}</span>
                              {contest.isFree && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                  FREE
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

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg bg-black/20">
                          <div className={`text-sm font-bold ${config.color}`}>
                            {contest.isFree ? 'FREE' : contest.entryFeeFormatted}
                          </div>
                          <div className="text-[10px] text-gray-500">Entry</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-black/20">
                          <div className="text-sm font-bold text-white">{contest.prizePoolFormatted}</div>
                          <div className="text-[10px] text-gray-500">Prize</div>
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
          )}

          {/* Empty state */}
          {!loading && filteredContests.length === 0 && (
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
