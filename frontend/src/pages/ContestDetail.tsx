/**
 * Contest Detail Page
 * Shows contest info, entries, leaderboard, and user's entry
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, Users, Clock, Coins, Crown, ArrowLeft,
  Timer, ChartLineUp, Medal, Gift, Lock, Play, Lightning,
  CheckCircle, Star, Fire, CaretRight, Wallet, ArrowSquareOut,
  XLogo, X, CalendarBlank, Sparkle, Hourglass
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../hooks/useAuth';
import { getRarityInfo } from '../utils/rarities';
import PotentialWinningsModal from '../components/onboarding/PotentialWinningsModal';
import FormationPreview from '../components/FormationPreview';
import ScoreBreakdown from '../components/ScoreBreakdown';
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
  claimed: boolean;
  canClaim: boolean;
  scoreBreakdown?: string | { activity?: number; engagement?: number; growth?: number; viral?: number } | null;
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
    color: 'text-gold-400',
    gradient: 'from-gold-500 to-amber-600',
    bgGradient: 'from-gold-500/20 to-amber-600/10',
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
  const { address, isConnected } = useAuth();
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
  const [claiming, setClaiming] = useState(false);
  const [msRemaining, setMsRemaining] = useState<number>(Infinity);
  const [claimModalState, setClaimModalState] = useState<null | 'confirm' | 'processing' | 'success'>(null);
  const [claimTxSignature, setClaimTxSignature] = useState<string | null>(null);
  const [claimExplorerUrl, setClaimExplorerUrl] = useState<string | null>(null);
  const [solPrice, setSolPrice] = useState<number>(145); // SOL/USD fallback
  const [justFinalized, setJustFinalized] = useState(false); // "Results are in!" reveal banner
  const prevStatusRef = React.useRef<string | null>(null);

  // Fetch live SOL price
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r => r.json())
      .then(d => { if (d?.solana?.usd) setSolPrice(d.solana.usd); })
      .catch(() => {}); // keep fallback on failure
  }, []);

  useEffect(() => {
    if (id) {
      fetchContestData();
    }
  }, [id, address]);

  // Adaptive polling: 5s when scoring (imminent results), 10s when locked, 30s otherwise
  useEffect(() => {
    if (!id || loading) return;

    const getInterval = () => {
      if (!contest) return 30000;
      if (contest.status === 'scoring') return 5000;
      if (contest.status === 'locked') return 10000;
      return 30000;
    };

    const poll = async () => {
      try {
        const [entriesRes, contestRes] = await Promise.all([
          axios.get(`${API_URL}/api/v2/contests/${id}/entries`),
          axios.get(`${API_URL}/api/v2/contests/${id}`),
        ]);
        const newContest = contestRes.data.contest;
        // Detect fresh finalization → trigger "Results are in!" banner
        if (
          newContest?.status === 'finalized' &&
          prevStatusRef.current &&
          prevStatusRef.current !== 'finalized'
        ) {
          setJustFinalized(true);
          setTimeout(() => setJustFinalized(false), 8000);
        }
        prevStatusRef.current = newContest?.status ?? null;
        setEntries(entriesRes.data.entries || []);
        setContest(newContest);
      } catch {
        // Silently fail on refresh — don't disrupt the user
      }
    };

    const interval = setInterval(poll, getInterval());
    return () => clearInterval(interval);
  }, [id, loading, contest?.status]);

  useEffect(() => {
    if (contest) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      updateTimeRemaining();
      return () => clearInterval(interval);
    }
  }, [contest]);

  // Auto-switch to "My Team" tab when user has won a claimable prize
  useEffect(() => {
    if (
      contest?.status === 'finalized' &&
      myEntry?.prizeAmount &&
      parseFloat(String(myEntry.prizeAmount)) > 0 &&
      myEntry?.canClaim &&
      !myEntry?.claimed
    ) {
      setActiveTab('myteam');
    }
  }, [contest?.status, myEntry?.prizeAmount, myEntry?.canClaim, myEntry?.claimed]);

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

    // Finalized/cancelled contests never show a countdown
    if (contest.status === 'finalized' || contest.status === 'cancelled') {
      setTimeRemaining('');
      setMsRemaining(0);
      return;
    }

    const now = new Date().getTime();
    const targetTime = contest.status === 'open'
      ? new Date(contest.lockTime).getTime()
      : new Date(contest.endTime).getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
      setTimeRemaining(contest.status === 'open' ? 'Locked' : 'Ended');
      setMsRemaining(0);
      return;
    }
    setMsRemaining(diff);

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

  // Step 1: User clicks "Claim Prize" → open confirm modal
  const handleClaimPrize = () => {
    if (!myEntry || !contest || claiming) return;
    setClaimModalState('confirm');
  };

  // Step 2: User clicks "Yes, Claim" in modal → do the real transfer
  const handleConfirmClaim = async () => {
    if (!myEntry || !contest) return;
    setClaimModalState('processing');
    setClaiming(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `${API_URL}/api/v2/contests/${id}/claim-prize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyEntry(prev => prev ? { ...prev, claimed: true, canClaim: false } : prev);
      setClaimTxSignature(res.data.txSignature || null);
      setClaimExplorerUrl(res.data.explorerUrl || null);
      setClaimModalState('success');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to claim prize';
      showToast(msg, 'error');
      setClaimModalState(null);
    } finally {
      setClaiming(false);
    }
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
      total_points: myEntry?.score ? Math.round(parseFloat(String(myEntry.score)) / myTeamWithDetails.length) : 0,
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
          <Link to="/compete?tab=contests" className="text-gold-400 hover:text-gold-300">
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
          onClick={() => navigate('/compete?tab=contests')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Contests
        </button>

        {/* Contest Header */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 mb-6">
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

            {/* Timer / Status */}
            <div className="text-right">
              {contest.status === 'finalized' ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Results</p>
                  <div className="text-lg font-bold text-emerald-400">Final ✓</div>
                </>
              ) : contest.status === 'cancelled' ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="text-lg font-bold text-gray-500">Cancelled</div>
                </>
              ) : contest.status === 'scoring' ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-sm font-bold text-blue-400">Calculating...</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-1">
                    {contest.status === 'open' ? 'Locks in' : 'Ends in'}
                  </p>
                  <div className={`text-2xl font-mono font-bold tabular-nums ${config.color}`}>
                    {timeRemaining}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* "Results are in!" reveal banner — shown for 8s after fresh finalization */}
          {justFinalized && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 animate-pulse">
              <Sparkle size={18} className="text-emerald-400 shrink-0" weight="fill" />
              <div className="flex-1 min-w-0">
                <span className="text-emerald-400 font-bold text-sm">Results are in! </span>
                <span className="text-gray-300 text-sm">Final scores have been calculated. Check the leaderboard!</span>
              </div>
            </div>
          )}

          {/* "Calculating Results..." banner — shown during scoring status */}
          {contest.status === 'scoring' && !justFinalized && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Hourglass size={18} className="text-blue-400 shrink-0 animate-spin" weight="fill" />
              <div className="flex-1 min-w-0">
                <span className="text-blue-400 font-semibold text-sm">Calculating results... </span>
                <span className="text-gray-400 text-sm">Scores are being tallied. Page updates every 5 seconds.</span>
              </div>
            </div>
          )}

          {/* Countdown urgency banner — shown when < 24h remaining and still open/locked */}
          {(contest.status === 'open' || contest.status === 'locked') && msRemaining > 0 && msRemaining < 24 * 60 * 60 * 1000 && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Timer size={18} className="text-amber-400 shrink-0" weight="fill" />
              <div className="flex-1 min-w-0">
                <span className="text-amber-400 font-semibold text-sm">Final stretch! </span>
                <span className="text-gray-300 text-sm">
                  {contest.status === 'open' ? 'Contest locks in ' : 'Scoring ends in '}
                  <span className="font-mono font-bold text-amber-400">{timeRemaining}</span>
                  {myEntry?.rank && <span> · You're <span className="font-mono font-bold text-amber-400">#{myEntry.rank}</span></span>}
                </span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <Coins size={20} className={`mx-auto mb-1.5 ${config.color}`} />
              <p className="text-base font-mono font-bold text-gold-400 tabular-nums">
                {contest.prizePoolFormatted}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Prize Pool</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <Users size={20} className={`mx-auto mb-1.5 ${config.color}`} />
              <p className="text-base font-mono font-bold text-white tabular-nums">{contest.playerCount}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Entries</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <Wallet size={20} className={`mx-auto mb-1.5 ${config.color}`} />
              <p className={`text-base font-mono font-bold tabular-nums ${contest.isFree ? 'text-emerald-400' : 'text-white'}`}>
                {contest.isFree ? 'FREE' : contest.entryFeeFormatted}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Entry</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <Star size={20} className={`mx-auto mb-1.5 ${config.color}`} />
              <p className="text-base font-mono font-bold text-white tabular-nums">{contest.teamSize}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Team Size</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <Crown size={20} className={`mx-auto mb-1.5 ${config.color}`} />
              <p className="text-base font-bold text-white">{contest.hasCaptain ? 'Yes' : 'No'}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Captain</p>
            </div>
          </div>
        </div>

        {/* Entry Status / CTA */}
        {myEntry ? (
          <div className={`${
            contest.status === 'finalized'
              ? 'bg-gold-500/10 border border-gold-500/30'
              : 'bg-green-500/10 border border-green-500/30'
          } rounded-xl p-4 mb-6 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {contest.status === 'finalized'
                ? <Trophy size={24} weight="fill" className="text-gold-400" />
                : <CheckCircle size={24} weight="fill" className="text-green-400" />
              }
              <div>
                <p className="font-bold text-white">
                  {contest.status === 'finalized' ? 'Contest Ended' : "You're In!"}
                </p>
                <p className={`text-sm ${contest.status === 'finalized' ? 'text-gold-300' : 'text-green-300'}`}>
                  {contest.status === 'finalized'
                    ? `Final Rank: #${myEntry.rank || '-'} | Score: ${myEntry.score ? parseFloat(String(myEntry.score)).toFixed(1) : '-'} pts`
                    : (myEntry.rank ? `Current Rank: #${myEntry.rank}` : 'Scoring in progress...') +
                      (myEntry.score && parseFloat(String(myEntry.score)) > 0 ? ` | Score: ${parseFloat(String(myEntry.score)).toFixed(1)} pts` : '')
                  }
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                <Play size={18} weight="fill" className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Ready to compete?</p>
                <p className="text-sm text-gray-400">Draft your team and enter the contest!</p>
              </div>
            </div>
            <button
              onClick={handleEnterContest}
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-gray-950 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm"
            >
              {contest.isFree ? 'Enter Free' : `Enter (${contest.entryFeeFormatted})`}
              <CaretRight size={16} weight="bold" />
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm ${
              activeTab === 'leaderboard'
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
            }`}
          >
            <ChartLineUp size={18} />
            Leaderboard ({entries.length})
          </button>
          {myEntry && (
            <button
              onClick={() => setActiveTab('myteam')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === 'myteam'
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <Star size={18} />
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
                  const isWinner = entry.prizeAmount && parseFloat(String(entry.prizeAmount)) > 0;
                  const isFinalized = contest?.status === 'finalized';
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${
                        isMe
                          ? 'bg-gold-500/10'
                          : isFinalized && isWinner
                          ? 'bg-emerald-500/5'
                          : 'hover:bg-gray-700/20'
                      }`}
                    >
                      <div className="col-span-1">
                        {entry.rank === 1 ? (
                          <span className="font-mono font-bold text-gold-400">#1</span>
                        ) : entry.rank === 2 ? (
                          <span className="font-mono font-bold text-cyan-400">#2</span>
                        ) : entry.rank === 3 ? (
                          <span className="font-mono font-bold text-emerald-400">#3</span>
                        ) : (
                          <span className="font-mono text-sm text-gray-500">#{entry.rank || index + 1}</span>
                        )}
                      </div>
                      <div className="col-span-5">
                        <p className="font-bold text-white flex items-center gap-2">
                          {entry.username || entry.walletAddress.slice(0, 6) + '...' + entry.walletAddress.slice(-4)}
                          {isMe && <span className="text-xs text-gold-400">(You)</span>}
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
                        <span className="font-mono font-bold text-white tabular-nums">{entry.score ? parseFloat(String(entry.score)).toFixed(1) : '—'}</span>
                        <span className="text-gray-600 text-xs ml-0.5">pts</span>
                      </div>
                      <div className="col-span-1 text-right">
                        {entry.prizeAmount && parseFloat(String(entry.prizeAmount)) > 0 ? (
                          <div>
                            <span className="text-neon-500 font-mono font-bold text-sm tabular-nums">
                              {parseFloat(String(entry.prizeAmount)).toFixed(3)}
                            </span>
                            {isMe && isFinalized && !myEntry?.claimed && (
                              <div className="text-[10px] text-neon-500/70 mt-0.5">↑ Claim</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Tapestry verification footer */}
            <div className="px-4 py-2 border-t border-gray-700/50">
              <p className="text-[10px] text-gray-600 text-center">
                All entries and scores are stored on Tapestry Protocol — verifiable on Solana
              </p>
            </div>
          </div>
        ) : (
          /* My Team Tab */
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            {/* ── Hero Win Banner — visible FIRST, no scrolling required ── */}
            {contest?.status === 'finalized' && myEntry?.prizeAmount && parseFloat(String(myEntry.prizeAmount)) > 0 && (
              <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30 text-center">
                <div className="text-4xl mb-2">
                  {myEntry.rank === 1 ? '🥇' : myEntry.rank === 2 ? '🥈' : myEntry.rank === 3 ? '🥉' : '🏆'}
                </div>
                <p className="text-lg font-bold text-emerald-400 mb-1">
                  {myEntry.rank === 1 ? 'You placed #1! You Won!' :
                   myEntry.rank === 2 ? 'You placed #2! You Won!' :
                   myEntry.rank === 3 ? 'You placed #3! You Won!' :
                   `You placed #${myEntry.rank}! Prize Earned!`}
                </p>
                <p className="text-3xl font-bold text-white mb-1">
                  ${(parseFloat(String(myEntry.prizeAmount)) * solPrice).toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 font-mono mb-4">
                  {parseFloat(String(myEntry.prizeAmount)).toFixed(3)} SOL
                </p>
                {myEntry.canClaim && !myEntry.claimed && (
                  <button
                    onClick={handleClaimPrize}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 animate-pulse hover:animate-none"
                  >
                    <Coins size={24} weight="fill" />
                    Claim Prize
                  </button>
                )}
                {myEntry.claimed && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle size={20} weight="fill" />
                      Prize Claimed!
                    </div>
                    {claimExplorerUrl && (
                      <a href={claimExplorerUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gold-400 transition-colors">
                        <ArrowSquareOut size={12} />
                        View on Solana Explorer
                      </a>
                    )}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-emerald-500/20 text-sm text-gray-400">
                  <span>Final Score: {myEntry.score ? parseFloat(String(myEntry.score)).toFixed(1) : '-'} pts</span>
                  <span className="mx-2">·</span>
                  <span>Rank #{myEntry.rank} / {entries.length}</span>
                </div>
              </div>
            )}

            {/* No-prize finalized state */}
            {contest?.status === 'finalized' && myEntry && (!myEntry.prizeAmount || parseFloat(String(myEntry.prizeAmount)) === 0) && (
              <div className="mb-6 p-4 rounded-xl bg-gray-800/80 border border-gray-700 flex items-start gap-4">
                <div className="text-3xl">🎖️</div>
                <div className="flex-1">
                  <p className="font-bold text-white mb-1">Contest Ended</p>
                  <p className="text-sm text-gray-300 mb-3">
                    You placed <strong>#{myEntry.rank}</strong> with {myEntry.score ? parseFloat(String(myEntry.score)).toFixed(1) : '-'} pts.
                    Better luck next week!
                  </p>
                  <button
                    onClick={() => navigate('/compete?tab=contests')}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-gray-950 font-semibold rounded-lg transition-colors text-sm"
                  >
                    Browse Next Contests
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                <Star size={24} weight="fill" className={config.color} />
                Your Team
                {/* Status badge */}
                {contest?.status === 'finalized' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    Final ✓
                  </span>
                ) : contest?.status === 'scoring' || contest?.status === 'locked' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                    </span>
                    Scoring Live
                  </span>
                ) : contest?.status === 'open' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                    Entry Open
                  </span>
                ) : null}
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
                                <span className="text-xs text-yellow-400 font-bold">2.0× Points</span>
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
                    <p className="text-2xl font-bold text-white">{myEntry.score ? parseFloat(String(myEntry.score)).toFixed(1) : '-'}</p>
                    <p className="text-sm text-gray-400">Total Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">#{myEntry.rank || '-'}</p>
                    <p className="text-sm text-gray-400">Current Rank</p>
                  </div>
                  <div>
                    {myEntry.prizeAmount && parseFloat(String(myEntry.prizeAmount)) > 0 ? (
                      <>
                        <p className="text-xl font-bold text-emerald-400">
                          ${(parseFloat(String(myEntry.prizeAmount)) * solPrice).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {parseFloat(String(myEntry.prizeAmount)).toFixed(3)} SOL
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-gray-500">-</p>
                    )}
                    <p className="text-sm text-gray-400">Prize</p>
                  </div>
                </div>

                {/* Score breakdown — only show when score has been calculated */}
                {myEntry.score > 0 && myEntry.scoreBreakdown && (() => {
                  const bd = typeof myEntry.scoreBreakdown === 'string'
                    ? (() => { try { return JSON.parse(myEntry.scoreBreakdown as string); } catch { return {}; } })()
                    : myEntry.scoreBreakdown;
                  const captainPlayer = myEntry.team?.find(p => p.isCaptain);
                  const baseScore = bd && (bd.activity ?? 0) + (bd.engagement ?? 0) + (bd.growth ?? 0) + (bd.viral ?? 0);
                  const captainBonus = baseScore && myEntry.score > 0
                    ? Math.max(0, myEntry.score - baseScore)
                    : undefined;
                  return (
                    <ScoreBreakdown
                      breakdown={bd ?? {}}
                      captainBonus={captainBonus}
                      total={Math.round(myEntry.score)}
                      className="mt-4"
                    />
                  );
                })()}
              </div>
            )}
          {/* Next Week banner — show for finalized recurring leagues */}
          {contest?.status === 'finalized' &&
            (contest.typeCode === 'FREE_LEAGUE' || contest.typeCode?.includes('WEEKLY')) && (
            <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
              <CalendarBlank size={18} className="text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Next week's league begins soon</p>
                <p className="text-xs text-gray-400">Check the contests page for the next round.</p>
              </div>
              <button
                onClick={() => navigate('/compete?tab=contests')}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-colors"
              >
                View
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Potential Winnings Modal for Free League completion */}
      {showPotentialWinningsModal && myEntry && entries.length > 0 && (
        <PotentialWinningsModal
          onClose={() => setShowPotentialWinningsModal(false)}
          userScore={parseFloat(String(myEntry.score)) || 0}
          userRank={myEntry.rank || entries.length}
          totalPlayers={entries.length}
        />
      )}

      {/* ── 4-State Claim Modal ─────────────────────────────────────── */}
      {claimModalState && myEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">

            {/* State 2: Confirm */}
            {claimModalState === 'confirm' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Claim Your Prize</h3>
                  <button onClick={() => setClaimModalState(null)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-3xl font-bold text-white mb-1">
                    ${(parseFloat(String(myEntry.prizeAmount)) * solPrice).toFixed(2)}
                  </p>
                  <p className="text-gray-400 font-mono text-sm mb-4">
                    {parseFloat(String(myEntry.prizeAmount)).toFixed(4)} SOL
                  </p>
                  <p className="text-gray-300 text-sm mb-1">
                    Will be sent directly to your wallet
                  </p>
                  <p className="text-gray-500 text-xs font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </p>
                  <p className="text-emerald-400 text-xs mt-2">✓ No fees · We cover it</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setClaimModalState(null)}
                    className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={handleConfirmClaim}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors"
                  >
                    Yes, Claim Prize
                  </button>
                </div>
              </div>
            )}

            {/* State 3: Processing */}
            {claimModalState === 'processing' && (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-lg font-bold text-white mb-2">Sending Your Prize</h3>
                <p className="text-gray-400 text-sm mb-1 font-mono">
                  {parseFloat(String(myEntry.prizeAmount)).toFixed(4)} SOL
                </p>
                <p className="text-gray-500 text-xs font-mono mb-6">
                  → {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </p>
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-emerald-400 text-sm">Processing on Solana · usually &lt; 5s</p>
              </div>
            )}

            {/* State 4: Success */}
            {claimModalState === 'success' && (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-white mb-1">Prize Claimed!</h3>
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  ${(parseFloat(String(myEntry.prizeAmount)) * solPrice).toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm mb-4">is now in your wallet</p>

                {claimTxSignature && (
                  <div className="bg-gray-800 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-gray-500 mb-1">Transaction</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-300">
                        {claimTxSignature.startsWith('SIMULATED') ? 'Simulated (devnet)' : `${claimTxSignature.slice(0, 12)}...`}
                      </span>
                      {claimExplorerUrl && !claimTxSignature.startsWith('SIMULATED') && (
                        <a href={claimExplorerUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs transition-colors">
                          <ArrowSquareOut size={12} />
                          View
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle size={12} className="text-emerald-400" weight="fill" />
                      <span className="text-xs text-emerald-400">Confirmed on Solana</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const prizeUsd = (parseFloat(String(myEntry.prizeAmount)) * solPrice).toFixed(2);
                      const prizeSol = parseFloat(String(myEntry.prizeAmount)).toFixed(3);
                      const tweet = `Just won $${prizeUsd} (${prizeSol} SOL) on @ForesightGame! 🏆\n\nFantasy sports for Crypto Twitter — pick your CT influencer team and compete for real SOL.\n\nFree to play 👇`;
                      window.open(`https://x.com/intent/post?text=${encodeURIComponent(tweet)}`, '_blank');
                    }}
                    className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-950 font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <XLogo size={18} weight="fill" />
                    Share Win
                  </button>
                  <button
                    onClick={() => { setClaimModalState(null); navigate('/compete'); }}
                    className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold transition-colors"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
