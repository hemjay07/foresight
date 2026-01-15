/**
 * Contests Hub - V2 Multi-tier Contest System
 * Clean UX: Browse contests, see your entries, enter new contests
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, Users, Clock, Lightning, Gift, Wallet,
  ArrowRight, Star, Crown, Calendar,
  Timer, ChartLineUp, Lock, Play, CaretRight
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import WelcomeModal from '../components/onboarding/WelcomeModal';
import { API_URL } from '../config/api';

interface Contest {
  id: number;
  contractContestId: number | null;
  name: string;
  description: string;
  typeCode: string;
  typeName: string;
  entryFee: number;
  entryFeeFormatted: string;
  teamSize: number;
  hasCaptain: boolean;
  rakePercent: number;
  minPlayers: number;
  maxPlayers: number;
  lockTime: string;
  endTime: string;
  prizePool: number;
  prizePoolFormatted: string;
  playerCount: number;
  status: string;
  isFree: boolean;
  spotsRemaining: number | null;
  isOpen: boolean;
}

interface MyEntry {
  contestId: number;
  contestName: string;
  typeCode: string;
  status: string;
  rank: number | null;
  score: number;
  prizeAmount: number | null;
  lockTime: string;
  endTime: string;
}

// Contest type configurations with visual styling
const contestTypeConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  gradient: string;
  bgGradient: string;
  borderColor: string;
}> = {
  FREE_LEAGUE: {
    icon: Gift,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-600/10',
    borderColor: 'border-emerald-500/30',
  },
  WEEKLY_STARTER: {
    icon: Play,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/20 to-indigo-600/10',
    borderColor: 'border-blue-500/30',
  },
  WEEKLY_STANDARD: {
    icon: Trophy,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/20 to-pink-600/10',
    borderColor: 'border-purple-500/30',
  },
  WEEKLY_PRO: {
    icon: Crown,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-600',
    bgGradient: 'from-yellow-500/20 to-orange-600/10',
    borderColor: 'border-yellow-500/30',
  },
  DAILY_FLASH: {
    icon: Lightning,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-500/20 to-blue-600/10',
    borderColor: 'border-cyan-500/30',
  },
};

export default function ContestsHub() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { showWelcomeModal, setShowWelcomeModal, state: onboardingState } = useOnboarding();

  const tabFromUrl = searchParams.get('tab') as 'browse' | 'my-entries' | null;
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const initialTab = tabFromUrl === 'my-entries' ? 'my-entries' : 'browse';

  const [contests, setContests] = useState<Contest[]>([]);
  const [myEntries, setMyEntries] = useState<MyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-entries'>(initialTab);
  const [filterType, setFilterType] = useState<'all' | 'free' | 'weekly' | 'daily'>('all');

  // Auto-show welcome modal if onboarding and not yet seen
  useEffect(() => {
    if (isOnboarding && !onboardingState.hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, [isOnboarding, onboardingState.hasSeenWelcome, setShowWelcomeModal]);

  useEffect(() => {
    fetchContests();
    if (isConnected && address) {
      fetchMyEntries();
    }
  }, [isConnected, address]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/v2/contests`, {
        params: { active: 'true' }
      });
      setContests(res.data.contests);
    } catch (err) {
      console.error('Failed to fetch contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEntries = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/v2/me/entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyEntries(res.data.entries || []);
    } catch (err) {
      // Endpoint may not exist yet - that's ok
      console.error('Failed to fetch entries:', err);
    }
  };

  // Filter contests
  const filteredContests = useMemo(() => {
    let filtered = contests.filter(c => c.status === 'open');
    switch (filterType) {
      case 'free':
        return filtered.filter(c => c.isFree);
      case 'weekly':
        return filtered.filter(c => c.typeCode?.includes('WEEKLY'));
      case 'daily':
        return filtered.filter(c => c.typeCode === 'DAILY_FLASH');
      default:
        return filtered;
    }
  }, [contests, filterType]);

  // Get entered contest IDs
  const enteredContestIds = useMemo(() =>
    new Set(myEntries.map(e => e.contestId)),
    [myEntries]
  );

  // Find first available free league contest for onboarding
  const freeLeagueContest = useMemo(() =>
    contests.find(c => c.isFree && c.status === 'open'),
    [contests]
  );

  // Calculate time remaining
  const getTimeRemaining = (lockTime: string) => {
    const now = new Date().getTime();
    const lock = new Date(lockTime).getTime();
    const diff = lock - now;

    if (diff <= 0) return 'Locked';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Navigate to contest detail
  const handleViewContest = (contestId: number) => {
    navigate(`/contest/${contestId}`);
  };

  // Enter contest handler
  const handleEnterContest = (contest: Contest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      showToast('Please connect your wallet first', 'warning');
      return;
    }
    navigate(`/draft?contestId=${contest.id}&type=${contest.typeCode}&teamSize=${contest.teamSize}&hasCaptain=${contest.hasCaptain}&isFree=${contest.isFree}`);
  };

  // Render contest card
  const renderContestCard = (contest: Contest) => {
    const config = contestTypeConfig[contest.typeCode] || contestTypeConfig.WEEKLY_STARTER;
    const Icon = config.icon;
    const hasEntered = enteredContestIds.has(contest.id);
    const isFull = contest.maxPlayers > 0 && contest.playerCount >= contest.maxPlayers;

    return (
      <div
        key={contest.id}
        onClick={() => handleViewContest(contest.id)}
        className={`relative rounded-xl border ${config.borderColor} bg-gray-800/50 backdrop-blur-sm overflow-hidden cursor-pointer hover:bg-gray-800/70 transition-all group`}
      >
        {/* Type indicator bar */}
        <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <Icon weight="fill" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{contest.name || contest.typeName}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${config.color}`}>
                    {contest.typeName}
                  </span>
                  {contest.isFree && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      FREE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            {hasEntered && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
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
              <div className="text-sm font-bold text-white">{getTimeRemaining(contest.lockTime)}</div>
              <div className="text-[10px] text-gray-500">Left</div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between">
            {hasEntered ? (
              <button
                className="flex-1 py-2.5 rounded-lg bg-gray-700 text-white font-semibold flex items-center justify-center gap-2 group-hover:bg-gray-600 transition-colors"
              >
                <ChartLineUp weight="bold" className="w-4 h-4" />
                View My Entry
                <CaretRight weight="bold" className="w-4 h-4" />
              </button>
            ) : isFull ? (
              <div className="flex-1 py-2.5 rounded-lg bg-gray-700/50 text-gray-400 font-semibold text-center">
                Contest Full
              </div>
            ) : (
              <button
                onClick={(e) => handleEnterContest(contest, e)}
                className={`flex-1 py-2.5 rounded-lg bg-gradient-to-r ${config.gradient} text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                {contest.isFree ? (
                  <>
                    <Gift weight="fill" className="w-4 h-4" />
                    Enter Free
                  </>
                ) : (
                  <>
                    <Wallet weight="fill" className="w-4 h-4" />
                    Enter ({contest.entryFeeFormatted})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render my entry card
  const renderMyEntryCard = (entry: MyEntry) => {
    const config = contestTypeConfig[entry.typeCode] || contestTypeConfig.WEEKLY_STARTER;
    const Icon = config.icon;
    const isActive = entry.status === 'open' || entry.status === 'locked' || entry.status === 'scoring';

    return (
      <div
        key={entry.contestId}
        onClick={() => handleViewContest(entry.contestId)}
        className={`relative rounded-xl border ${config.borderColor} bg-gray-800/50 backdrop-blur-sm overflow-hidden cursor-pointer hover:bg-gray-800/70 transition-all`}
      >
        <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <Icon weight="fill" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white">{entry.contestName || 'Contest'}</h4>
                <span className={`text-xs ${config.color}`}>{(entry.typeCode || 'WEEKLY').replace('_', ' ')}</span>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              entry.status === 'open' ? 'bg-green-500/20 text-green-400' :
              entry.status === 'locked' || entry.status === 'scoring' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {(entry.status || 'open').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-black/20">
              <div className="text-lg font-bold text-white">
                {entry.rank ? `#${entry.rank}` : '-'}
              </div>
              <div className="text-[10px] text-gray-500">Rank</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/20">
              <div className="text-lg font-bold text-white">
                {entry.score > 0 ? entry.score.toFixed(1) : '-'}
              </div>
              <div className="text-[10px] text-gray-500">Score</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/20">
              <div className={`text-lg font-bold ${entry.prizeAmount ? 'text-green-400' : 'text-gray-500'}`}>
                {entry.prizeAmount ? `${entry.prizeAmount.toFixed(3)}` : '-'}
              </div>
              <div className="text-[10px] text-gray-500">Prize</div>
            </div>
          </div>

          <button className="w-full mt-3 py-2 rounded-lg bg-gray-700 text-white font-semibold flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors">
            View Details
            <CaretRight weight="bold" className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Contests</h1>
          <p className="text-gray-400">Pick winning CT influencers. Compete for ETH prizes.</p>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Trophy weight={activeTab === 'browse' ? 'fill' : 'regular'} className="w-5 h-5" />
            Browse Contests
          </button>
          <button
            onClick={() => setActiveTab('my-entries')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'my-entries'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Star weight={activeTab === 'my-entries' ? 'fill' : 'regular'} className="w-5 h-5" />
            My Entries
            {myEntries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {myEntries.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'browse' ? (
          <>
            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All', icon: Trophy },
                { key: 'free', label: 'Free', icon: Gift },
                { key: 'weekly', label: 'Weekly', icon: Calendar },
                { key: 'daily', label: 'Daily Flash', icon: Lightning },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filterType === filter.key
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-gray-800/50 text-gray-400 border border-transparent hover:bg-gray-800'
                  }`}
                >
                  <filter.icon weight={filterType === filter.key ? 'fill' : 'regular'} className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Contests Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-52 rounded-xl bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredContests.length === 0 ? (
              <div className="text-center py-16">
                <Trophy weight="fill" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No contests available</h3>
                <p className="text-gray-400">Check back soon for new contests!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContests.map(contest => renderContestCard(contest))}
              </div>
            )}
          </>
        ) : (
          /* My Entries Tab */
          <>
            {!isConnected ? (
              <div className="text-center py-16">
                <Wallet weight="fill" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p className="text-gray-400">Connect your wallet to see your contest entries</p>
              </div>
            ) : myEntries.length === 0 ? (
              <div className="text-center py-16">
                <Star weight="fill" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No entries yet</h3>
                <p className="text-gray-400 mb-4">You haven't entered any contests yet</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
                >
                  Browse Contests
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myEntries.map(entry => renderMyEntryCard(entry))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Welcome Modal for first-time users */}
      {showWelcomeModal && (
        <WelcomeModal
          onClose={() => setShowWelcomeModal(false)}
          freeLeagueContestId={freeLeagueContest?.id}
        />
      )}
    </div>
  );
}
