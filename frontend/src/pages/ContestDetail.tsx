/**
 * Contest Detail Page
 * Shows contest info, entries, leaderboard, and user's entry
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  Trophy, Users, Clock, CurrencyEth, Crown, ArrowLeft,
  Timer, ChartLineUp, Medal, Gift, Lock, Play, Lightning,
  CheckCircle, Star, Fire, CaretRight, Wallet
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { getRarityInfo } from '../utils/rarities';
import PotentialWinningsModal from '../components/onboarding/PotentialWinningsModal';
import FormationPreview from '../components/FormationPreview';
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
}

interface Entry {
  id: number;
  rank: number | null;
  walletAddress: string;
  username: string;
  teamIds: number[];
  captainId: number | null;
  score: number;
  prizeAmount: number | null;
  claimed: boolean;
}

interface MyEntry {
  id: number;
  teamIds: number[];
  captainId: number | null;
  score: number;
  rank: number | null;
  prizeAmount: number | null;
  team: {
    id: number;
    name: string;
    handle: string;
    tier: string;
    avatarUrl: string;
    isCaptain: boolean;
  }[];
}

interface Influencer {
  id: number;
  name: string;
  handle: string;
  tier: string;
  profile_image_url: string;
}

// Contest type styling
const contestTypeConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  gradient: string;
  bgGradient: string;
}> = {
  FREE_LEAGUE: {
    icon: Gift,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-600/10',
  },
  WEEKLY_STARTER: {
    icon: Play,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/20 to-indigo-600/10',
  },
  WEEKLY_STANDARD: {
    icon: Trophy,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/20 to-pink-600/10',
  },
  WEEKLY_PRO: {
    icon: Crown,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-600',
    bgGradient: 'from-yellow-500/20 to-orange-600/10',
  },
  DAILY_FLASH: {
    icon: Lightning,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-500/20 to-blue-600/10',
  },
};

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const {
    state: onboardingState,
    showPotentialWinningsModal,
    setShowPotentialWinningsModal,
    markFreeLeagueCompleted
  } = useOnboarding();

  const [contest, setContest] = useState<Contest | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'myteam'>('leaderboard');
  const [teamViewMode, setTeamViewMode] = useState<'formation' | 'grid'>('formation');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchContestData();
    }
  }, [id, address]);

  useEffect(() => {
    if (contest) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      updateTimeRemaining();
      return () => clearInterval(interval);
    }
  }, [contest]);

  // Show potential winnings modal for completed free league if user hasn't seen it
  useEffect(() => {
    if (
      contest?.isFree &&
      (contest.status === 'completed' || contest.status === 'scoring') &&
      myEntry?.score &&
      myEntry.score > 0 &&
      myEntry.rank &&
      !onboardingState.hasSeenPotentialWinnings &&
      !onboardingState.hasCompletedFreeLeague
    ) {
      // Delay showing modal so user sees their results first
      const timeout = setTimeout(() => {
        markFreeLeagueCompleted();
        setShowPotentialWinningsModal(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [contest, myEntry, onboardingState.hasSeenPotentialWinnings, onboardingState.hasCompletedFreeLeague]);

  const fetchContestData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch contest details, entries, and influencers in parallel
      const [contestRes, entriesRes, influencersRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/contests/${id}`),
        axios.get(`${API_URL}/api/v2/contests/${id}/entries`),
        axios.get(`${API_URL}/api/league/influencers`),
      ]);

      setContest(contestRes.data.contest);
      setEntries(entriesRes.data.entries || []);
      setInfluencers(influencersRes.data.influencers || []);

      // Fetch user's entry if connected
      if (token && address) {
        try {
          const myEntryRes = await axios.get(`${API_URL}/api/v2/contests/${id}/my-entry`, { headers });
          if (myEntryRes.data.entered) {
            setMyEntry(myEntryRes.data.entry);
            setActiveTab('myteam');
          }
        } catch (err) {
          // User hasn't entered - that's ok
        }
      }
    } catch (error) {
      console.error('Error fetching contest:', error);
      showToast('Failed to load contest details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (!contest) return;

    const now = new Date().getTime();
    const targetTime = contest.status === 'open'
      ? new Date(contest.lockTime).getTime()
      : new Date(contest.endTime).getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
      setTimeRemaining(contest.status === 'open' ? 'Locked' : 'Ended');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };

  const handleEnterContest = () => {
    if (!contest) return;
    navigate(`/draft?contestId=${contest.id}&type=${contest.typeCode}&teamSize=${contest.teamSize}&hasCaptain=${contest.hasCaptain}&isFree=${contest.isFree}`);
  };

  const config = contest ? (contestTypeConfig[contest.typeCode] || contestTypeConfig.WEEKLY_STARTER) : contestTypeConfig.WEEKLY_STARTER;
  const Icon = config.icon;

  // Get influencer details for my entry - prefer team from API, fallback to influencers lookup
  const myTeamWithDetails = useMemo(() => {
    if (!myEntry) return [];
    // If backend returns team details, use them directly
    if (myEntry.team && myEntry.team.length > 0) {
      return myEntry.team;
    }
    // Fallback: look up from influencers
    if (!influencers.length) return [];
    return myEntry.teamIds.map(id => {
      const inf = influencers.find(i => i.id === id);
      return {
        id,
        name: inf?.name || 'Unknown',
        handle: inf?.handle || '',
        tier: inf?.tier || 'C',
        avatarUrl: inf?.profile_image_url || '',
        isCaptain: id === myEntry.captainId,
      };
    });
  }, [myEntry, influencers]);

  // Format team for FormationPreview component
  const teamForFormation = useMemo(() => {
    return myTeamWithDetails.map((player) => ({
      id: player.id,
      name: player.name,
      twitter_handle: player.handle,
      tier: player.tier,
      profile_image_url: player.avatarUrl,
      total_points: myEntry?.score ? Math.round(myEntry.score / myTeamWithDetails.length) : 0,
    }));
  }, [myTeamWithDetails, myEntry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
            <div className="h-48 bg-gray-800 rounded mb-6"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Trophy size={64} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Contest Not Found</h2>
          <p className="text-gray-400 mb-4">This contest doesn't exist or has been removed.</p>
          <Link to="/contests" className="text-brand-400 hover:text-brand-300">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/contests')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Contests
        </button>

        {/* Contest Header */}
        <div className={`rounded-2xl border border-gray-700 bg-gradient-to-br ${config.bgGradient} p-6 mb-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <Icon weight="fill" className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.color} bg-black/20`}>
                    {contest.typeName || contest.typeCode?.replace('_', ' ')}
                  </span>
                  {contest.isFree && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold text-emerald-400 bg-emerald-500/20">
                      FREE
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    contest.status === 'open' ? 'text-green-400 bg-green-500/20' :
                    contest.status === 'locked' ? 'text-yellow-400 bg-yellow-500/20' :
                    contest.status === 'scoring' ? 'text-blue-400 bg-blue-500/20' :
                    'text-gray-400 bg-gray-500/20'
                  }`}>
                    {contest.status.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white">{contest.name}</h1>
                {contest.description && (
                  <p className="text-gray-400 mt-1">{contest.description}</p>
                )}
              </div>
            </div>

            {/* Timer */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">
                {contest.status === 'open' ? 'Locks in' : 'Ends in'}
              </p>
              <div className={`text-2xl font-bold ${config.color}`}>
                {timeRemaining}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <CurrencyEth size={24} className={`mx-auto mb-2 ${config.color}`} />
              <p className="text-lg font-bold text-white">{contest.prizePoolFormatted}</p>
              <p className="text-xs text-gray-400">Prize Pool</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Users size={24} className={`mx-auto mb-2 ${config.color}`} />
              <p className="text-lg font-bold text-white">{contest.playerCount}</p>
              <p className="text-xs text-gray-400">Entries</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Wallet size={24} className={`mx-auto mb-2 ${config.color}`} />
              <p className="text-lg font-bold text-white">{contest.entryFeeFormatted}</p>
              <p className="text-xs text-gray-400">Entry Fee</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Star size={24} className={`mx-auto mb-2 ${config.color}`} />
              <p className="text-lg font-bold text-white">{contest.teamSize}</p>
              <p className="text-xs text-gray-400">Team Size</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Crown size={24} className={`mx-auto mb-2 ${config.color}`} />
              <p className="text-lg font-bold text-white">{contest.hasCaptain ? 'Yes' : 'No'}</p>
              <p className="text-xs text-gray-400">Captain</p>
            </div>
          </div>
        </div>

        {/* Entry Status / CTA */}
        {myEntry ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} weight="fill" className="text-green-400" />
              <div>
                <p className="font-bold text-white">You're In!</p>
                <p className="text-sm text-green-300">
                  {myEntry.rank ? `Current Rank: #${myEntry.rank}` : 'Scoring in progress...'}
                  {myEntry.score > 0 && ` | Score: ${myEntry.score.toFixed(1)} pts`}
                </p>
              </div>
            </div>
            {contest.status === 'open' && (
              <button
                onClick={handleEnterContest}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-semibold transition-colors"
              >
                Edit Team
              </button>
            )}
          </div>
        ) : contest.status === 'open' ? (
          <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 mb-6 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Play size={24} weight="fill" className="text-white" />
              <div>
                <p className="font-bold text-white">Ready to compete?</p>
                <p className="text-sm text-white/80">Draft your team and enter the contest!</p>
              </div>
            </div>
            <button
              onClick={handleEnterContest}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              {contest.isFree ? 'Enter Free' : `Enter (${contest.entryFeeFormatted})`}
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Lock size={24} className="text-gray-400" />
            <div>
              <p className="font-bold text-white">Contest Locked</p>
              <p className="text-sm text-gray-400">Entry period has ended. Scoring in progress.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'leaderboard'
                ? `bg-gradient-to-r ${config.gradient} text-white`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <ChartLineUp size={20} />
            Leaderboard ({entries.length})
          </button>
          {myEntry && (
            <button
              onClick={() => setActiveTab('myteam')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'myteam'
                  ? `bg-gradient-to-r ${config.gradient} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Star size={20} />
              My Team
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'leaderboard' ? (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
            {entries.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No entries yet</h3>
                <p className="text-gray-400">Be the first to enter this contest!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-900/50 text-xs font-bold text-gray-400 uppercase">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">Player</div>
                  <div className="col-span-3">Team</div>
                  <div className="col-span-2 text-right">Score</div>
                  <div className="col-span-1 text-right">Prize</div>
                </div>

                {/* Entries */}
                {entries.map((entry, index) => {
                  const isMe = address && entry.walletAddress.toLowerCase() === address.toLowerCase();
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${
                        isMe ? 'bg-brand-500/10' : 'hover:bg-gray-700/20'
                      } transition-colors`}
                    >
                      <div className="col-span-1">
                        {entry.rank && entry.rank <= 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1 ? 'bg-yellow-500 text-gray-900' :
                            entry.rank === 2 ? 'bg-gray-300 text-gray-900' :
                            'bg-amber-600 text-white'
                          }`}>
                            {entry.rank}
                          </div>
                        ) : (
                          <span className="text-gray-400">#{entry.rank || index + 1}</span>
                        )}
                      </div>
                      <div className="col-span-5">
                        <p className="font-bold text-white flex items-center gap-2">
                          {entry.username || entry.walletAddress.slice(0, 6) + '...' + entry.walletAddress.slice(-4)}
                          {isMe && <span className="text-xs text-brand-400">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{entry.teamIds?.length || 0} picks</p>
                      </div>
                      <div className="col-span-3">
                        <div className="flex -space-x-2">
                          {entry.teamIds?.slice(0, 5).map((infId, i) => {
                            const inf = influencers.find(x => x.id === infId);
                            const isCaptain = infId === entry.captainId;
                            return (
                              <div
                                key={i}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  isCaptain ? 'border-yellow-500' : 'border-gray-700'
                                } bg-gray-800 flex items-center justify-center text-xs font-bold`}
                                title={inf?.name || 'Unknown'}
                              >
                                {inf?.tier || '?'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-bold text-white">{entry.score?.toFixed(1) || '-'}</span>
                        <span className="text-gray-500 text-sm"> pts</span>
                      </div>
                      <div className="col-span-1 text-right">
                        {entry.prizeAmount && entry.prizeAmount > 0 ? (
                          <span className="text-green-400 font-bold">
                            {entry.prizeAmount.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* My Team Tab */
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Star size={24} weight="fill" className={config.color} />
                Your Team
              </h3>
              {/* View Toggle */}
              <div className="flex bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => setTeamViewMode('formation')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    teamViewMode === 'formation' ? 'bg-gold-500 text-gray-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Formation
                </button>
                <button
                  onClick={() => setTeamViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    teamViewMode === 'grid' ? 'bg-gold-500 text-gray-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {myTeamWithDetails.length > 0 ? (
              <>
                {/* Formation View */}
                {teamViewMode === 'formation' && teamForFormation.length >= 5 && (
                  <FormationPreview
                    variant="team"
                    team={teamForFormation}
                    showStats={true}
                    showEdit={contest?.status === 'open'}
                    onEdit={() => navigate(`/draft?contestId=${id}&type=${contest?.typeCode}&teamSize=${contest?.teamSize}&hasCaptain=${contest?.hasCaptain}&isFree=${contest?.isFree}`)}
                  />
                )}

                {/* Grid View */}
                {teamViewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTeamWithDetails.map((player) => {
                      const rarity = getRarityInfo(player.tier);
                      return (
                        <div
                          key={player.id}
                          className={`relative rounded-xl border-2 p-4 ${
                            player.isCaptain
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-gray-700 bg-gray-900/50'
                          }`}
                        >
                          {player.isCaptain && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown size={16} weight="fill" className="text-gray-900" />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className={`text-lg font-bold ${rarity.text}`}>{player.tier}</span>
                              )}
                            </div>
                            <div>
                                <p className="font-bold text-white">{player.name}</p>
                                <p className="text-sm text-gray-400">@{player.handle}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${rarity.badge}`}>
                                {player.tier}-Tier
                              </span>
                              {player.isCaptain && (
                                <span className="text-xs text-yellow-400 font-bold">1.5x Points</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </>
            ) : (
              <p className="text-gray-400">Loading team details...</p>
            )}

            {myEntry && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{myEntry.score?.toFixed(1) || '-'}</p>
                    <p className="text-sm text-gray-400">Total Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">#{myEntry.rank || '-'}</p>
                    <p className="text-sm text-gray-400">Current Rank</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${myEntry.prizeAmount ? 'text-green-400' : 'text-gray-500'}`}>
                      {myEntry.prizeAmount ? `${myEntry.prizeAmount.toFixed(3)} ETH` : '-'}
                    </p>
                    <p className="text-sm text-gray-400">Prize</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Potential Winnings Modal for Free League completion */}
      {showPotentialWinningsModal && myEntry && entries.length > 0 && (
        <PotentialWinningsModal
          onClose={() => setShowPotentialWinningsModal(false)}
          userScore={myEntry.score || 0}
          userRank={myEntry.rank || entries.length}
          totalPlayers={entries.length}
        />
      )}
    </div>
  );
}
