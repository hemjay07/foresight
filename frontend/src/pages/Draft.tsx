/**
 * Draft Page - Clean formation-based team builder
 * Key features:
 * - Prominent captain slot with 2.0x bonus
 * - Clear budget visualization
 * - Tier-grouped influencer selection
 * - Responsive layout
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy, ArrowLeft, ArrowRight, Lock, CheckCircle, Warning,
  Timer, Coins, Users, Info, Wallet, X, LinkSimple
} from '@phosphor-icons/react';
import apiClient, { hasSession } from '../lib/apiClient';
import FormationTeam from '../components/draft/FormationTeam';
import InfluencerGrid from '../components/draft/InfluencerGrid';
import TapestryBadge from '../components/TapestryBadge';
import DraftReceipt from '../components/DraftReceipt';
import ScoutingPanel from '../components/ScoutingPanel';
import ShareTeamCard from '../components/ShareTeamCard';
import { useToast } from '../contexts/ToastContext';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAuth } from '../hooks/useAuth';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
  follower_count?: number;
  avg_likes?: number;
  avg_retweets?: number;
  engagement_rate?: number;
  total_points?: number;
  archetype?: string;
}

interface InfluencerApiResponse {
  id: number;
  name?: string;
  display_name?: string;
  handle?: string;
  twitter_handle?: string;
  profile_image_url?: string;
  avatar_url?: string;
  tier: string;
  price: string | number;
  follower_count?: number;
  avg_likes?: number;
  avg_retweets?: number;
  engagement_rate?: string | number;
  total_points?: string | number;
  archetype?: string;
}

interface Contest {
  id: number;
  name: string;
  entryFee: number;
  entryFeeFormatted: string;
  teamSize: number;
  hasCaptain: boolean;
  lockTime: string;
  endTime: string;
  prizePool: number;
  prizePoolFormatted: string;
  playerCount: number;
  isFree: boolean;
  status: string;
}

interface ExistingTeam {
  id: number;
  picks: Array<{ influencer_id: number }>;
  captain_id?: number;
}

const MAX_BUDGET = 150;

export default function Draft() {
  const { address, isConnected, login } = useAuth();
  const { showToast } = useToast();
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();

  // State
  const [contest, setContest] = useState<Contest | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<Influencer[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Only show loading spinner after 200ms delay (prevents flash)
  const showLoadingSpinner = useDelayedLoading(loading, 200);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingTeam, setExistingTeam] = useState<ExistingTeam | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tapestryPublished, setTapestryPublished] = useState(false);
  const [submittedEntryId, setSubmittedEntryId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFreeConfirmModal, setShowFreeConfirmModal] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(145);
  const [transferStatus, setTransferStatus] = useState<{ remaining: number; allowed: number; level: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; avatarUrl?: string } | null>(null);

  // Computed
  const usedBudget = useMemo(
    () => selectedPicks.reduce((sum, p) => sum + p.price, 0),
    [selectedPicks]
  );
  const remainingBudget = MAX_BUDGET - usedBudget;
  const teamSize = contest?.teamSize || 5;
  const isTeamComplete = selectedPicks.length === teamSize;
  const hasCaptain = captainId !== null;
  const canSubmit = isTeamComplete && hasCaptain && remainingBudget >= 0;

  // Live countdown tick when < 1 hour to lock
  const [draftTick, setDraftTick] = useState(0);
  useEffect(() => {
    if (!contest?.lockTime) return;
    const diff = new Date(contest.lockTime).getTime() - Date.now();
    if (diff <= 0 || diff > 3600000) return;
    const interval = setInterval(() => setDraftTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.lockTime]);

  // Time until lock — shows seconds when < 5 min remaining
  const timeUntilLock = useMemo(() => {
    if (!contest?.lockTime) return null;
    const diff = new Date(contest.lockTime).getTime() - Date.now();
    if (diff <= 0) return 'LOCKED';
    const hours = Math.floor(diff / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins >= 5) return `${mins}m`;
    return `${mins}m ${secs}s`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.lockTime, draftTick]);

  // Fetch user info for the share card footer
  useEffect(() => {
    if (!hasSession()) return;
    apiClient.get('/api/v2/fs/me')
      .then(r => {
        if (r.data?.success && r.data?.data) {
          setUserInfo({ username: r.data.data.username || '', avatarUrl: r.data.data.avatarUrl });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live SOL price for paid contest display
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r => r.json())
      .then(d => { if (d?.solana?.usd) setSolPrice(d.solana.usd); })
      .catch(() => {});
  }, []);

  // Load data
  useEffect(() => {
    if (!contestId) {
      navigate('/compete?tab=contests');
      return;
    }

    const hasAuth = hasSession();
    setIsAuthenticated(hasAuth);

    Promise.all([
      fetchContest(),
      fetchInfluencers(),
      hasAuth ? fetchExistingTeam() : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [contestId]);

  const fetchContest = async () => {
    try {
      const res = await apiClient.get(`/api/v2/contests/${contestId}`);
      setContest(res.data.contest);
    } catch (err) {
      console.error('Failed to fetch contest:', err);
      showToast('Failed to load contest', 'error');
    }
  };

  const fetchInfluencers = async () => {
    try {
      const res = await apiClient.get('/api/league/influencers');
      // Transform data
      const data = res.data.influencers.map((i: InfluencerApiResponse): Influencer => ({
        id: i.id,
        name: i.name || i.display_name || '',
        handle: i.handle || i.twitter_handle || '',
        profile_image_url: i.profile_image_url || i.avatar_url,
        tier: i.tier,
        price: typeof i.price === 'string' ? parseFloat(i.price) : i.price,
        follower_count: i.follower_count,
        avg_likes: i.avg_likes || 0,
        avg_retweets: i.avg_retweets || 0,
        engagement_rate: typeof i.engagement_rate === 'string' ? parseFloat(i.engagement_rate || '0') : (i.engagement_rate || 0),
        total_points: typeof i.total_points === 'string' ? parseInt(i.total_points || '0') : (i.total_points || 0),
        archetype: i.archetype,
      }));
      setInfluencers(data);
    } catch (err) {
      console.error('Failed to fetch influencers:', err);
    }
  };

  const fetchExistingTeam = async () => {
    try {
      const res = await apiClient.get(`/api/v2/contests/${contestId}/my-entry`);
      if (res.data.entry) {
        setExistingTeam(res.data.entry);
        const captain = res.data.entry.captainId || res.data.entry.captain_id;
        setCaptainId(captain);
        // Fetch transfer status now that we know user has an existing entry
        apiClient.get(`/api/v2/contests/${contestId}/transfer-status`)
          .then(r => {
            if (r.data.success) {
              setTransferStatus({
                remaining: r.data.data.transfersRemaining,
                allowed: r.data.data.transfersAllowed,
                level: r.data.data.level,
              });
            }
          }).catch(() => {});
      }
    } catch (err) {
      // No existing team - that's fine
    }
  };

  // Load existing team picks once influencers are available
  useEffect(() => {
    if (existingTeam && influencers.length > 0) {
      const teamIds = existingTeam.teamIds || existingTeam.team_ids || [];
      const picks = teamIds
        .map((id: number) => influencers.find((i) => i.id === id))
        .filter(Boolean);
      setSelectedPicks(picks);
      const captain = existingTeam.captainId || existingTeam.captain_id;
      if (captain) {
        setCaptainId(captain);
      }
    }
  }, [existingTeam, influencers]);

  // Handle selection
  const handleSelect = (influencer: Influencer) => {
    const isSelected = selectedPicks.some((p) => p.id === influencer.id);

    if (isSelected) {
      // Remove
      setSelectedPicks((prev) => prev.filter((p) => p.id !== influencer.id));
      if (captainId === influencer.id) {
        setCaptainId(null);
      }
    } else {
      // Add
      if (selectedPicks.length >= teamSize) {
        showToast(`Maximum ${teamSize} players allowed`, 'error');
        return;
      }
      if (influencer.price > remainingBudget) {
        showToast('Not enough budget', 'error');
        return;
      }

      setSelectedPicks([...selectedPicks, influencer]);
    }
  };

  const handleRemove = (id: number) => {
    setSelectedPicks((prev) => prev.filter((p) => p.id !== id));
    if (captainId === id) {
      setCaptainId(null);
    }
  };

  const handleSetCaptain = (id: number) => {
    setCaptainId(id);
    showToast('Captain selected! They earn 2.0× points', 'success');
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedPicks([]);
    setCaptainId(null);
    showToast('Team cleared', 'info');
  };

  // Auto-fill team with random picks within budget
  const handleAutoFill = () => {
    // Shuffle available influencers so every autofill produces a different team
    const available = influencers
      .filter((i) => !selectedPicks.some((p) => p.id === i.id))
      .map((i) => ({ ...i }));

    // Fisher-Yates shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    let currentBudget = remainingBudget;
    let currentPicks = [...selectedPicks];

    // Pick random players that fit the remaining budget
    for (const inf of available) {
      if (currentPicks.length >= teamSize) break;

      const remainingSlots = teamSize - currentPicks.length - 1;
      const minCostForRemaining = remainingSlots * 15; // C-tier minimum

      if (inf.price <= currentBudget - minCostForRemaining) {
        currentPicks.push(inf);
        currentBudget -= inf.price;
      }
    }

    if (currentPicks.length > selectedPicks.length) {
      setSelectedPicks(currentPicks);

      // Auto-select captain if team is complete and no captain
      if (currentPicks.length === teamSize && !captainId) {
        // Pick the highest-tier player as captain
        const bestPick = currentPicks.reduce((best, p) => {
          const tierRank: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
          return (tierRank[p.tier] || 0) > (tierRank[best.tier] || 0) ? p : best;
        });
        setCaptainId(bestPick.id);
        showToast(`Auto-filled ${currentPicks.length - selectedPicks.length} players. ${bestPick.handle} set as captain.`, 'success');
      } else {
        showToast(`Auto-filled ${currentPicks.length - selectedPicks.length} players`, 'success');
      }
    } else {
      showToast('No valid picks available within budget', 'error');
    }
  };

  // Authentication — Privy handles auth automatically via usePrivyAuth
  const authenticate = async () => {
    if (hasSession()) {
      setIsAuthenticated(true);
      return true;
    }
    // No session — prompt login
    showToast('Please sign in first', 'error');
    login();
    return false;
  };

  // Submit team — forks on free vs paid
  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Paid contests show a payment confirmation modal first
    if (contest && !contest.isFree) {
      setShowPaymentModal(true);
      return;
    }

    // Free contests: show lock warning on first-time entry only
    if (contest?.isFree && !existingTeam) {
      setShowFreeConfirmModal(true);
      return;
    }

    await doSubmit();
  };

  // Actual submission (called directly for free, or after payment confirmation for paid)
  const doSubmit = async () => {
    setSubmitting(true);
    setShowPaymentModal(false);

    try {
      if (!hasSession()) {
        const success = await authenticate();
        if (!success) { setSubmitting(false); return; }
      }

      const teamIds = selectedPicks.map((p) => p.id);
      const isPaid = contest && !contest.isFree;

      let res;
      if (isPaid) {
        // Paid: use enter-test endpoint (devnet — simulates payment for hackathon)
        res = await apiClient.post(
          `/api/v2/contests/${contestId}/enter-test`,
          { team_name: 'My Team', influencer_ids: teamIds, captain_id: captainId }
        );
      } else {
        const isUpdate = !!existingTeam;
        const endpoint = isUpdate
          ? `/api/v2/contests/${contestId}/update-free-team`
          : `/api/v2/contests/${contestId}/enter-free`;
        res = isUpdate
          ? await apiClient.put(endpoint, { teamIds, captainId })
          : await apiClient.post(endpoint, { teamIds, captainId });
      }

      if (res.data.success) {
        setTapestryPublished(res.data.tapestry?.published || false);
        setSubmittedEntryId(res.data.entry?.id ?? null);
        setShowSuccess(true);
        showToast(existingTeam ? 'Team updated!' : 'Team entered!', 'success');
        // Update transfer status from response
        if (res.data.transfersRemaining !== undefined) {
          setTransferStatus(prev => prev ? { ...prev, remaining: res.data.transfersRemaining } : null);
        }
      }
    } catch (err) {
      console.error('Submit failed:', err);
      let errorMessage = 'Failed to submit team';
      if (err instanceof Error && (err as any).response?.data?.error) {
        errorMessage = (err as any).response.data.error;
      }
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading spinner only after delay (prevents flash for fast loads)
  if (showLoadingSpinner) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center opacity-0 animate-fade-in">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Still loading but within delay window - show nothing (prevents flash)
  if (loading) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-gray-400">Contest not found</p>
          <Link to="/compete?tab=contests" className="text-gray-400 hover:text-white underline mt-2 block">
            Back to contests
          </Link>
        </div>
      </div>
    );
  }

  // Success celebration overlay — formation card is the hero
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="max-w-sm mx-auto px-4 w-full">
          {/* Header */}
          <div className="text-center mb-4">
            {tapestryPublished ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                  <LinkSimple size={22} className="text-gold-400" />
                  Team Locked on Solana
                </h2>
                <p className="text-gray-400 text-sm">Your picks are immutable on-chain</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                  <Trophy size={24} weight="fill" className="text-gold-400" />
                  You're in!
                </h2>
                <p className="text-gray-400 text-sm">Share your lineup on Twitter</p>
              </>
            )}
          </div>

          {/* Draft Receipt — proof of on-chain submission (above share) */}
          {tapestryPublished && (
            <DraftReceipt
              entryId={submittedEntryId ?? undefined}
              captainHandle={selectedPicks.find(p => p.id === captainId)?.handle ?? null}
              teamSize={selectedPicks.length}
              className="mb-3"
            />
          )}

          {/* Formation card + share buttons */}
          <ShareTeamCard
            picks={selectedPicks.map((p) => ({
              id: p.id,
              name: p.name,
              handle: p.handle,
              tier: p.tier,
              profile_image_url: p.profile_image_url,
              total_points: p.total_points,
              isCaptain: p.id === captainId,
            }))}
            captainId={captainId}
            contestName={contest.name}
            username={userInfo?.username}
            userAvatar={userInfo?.avatarUrl}
            variant="share-only"
            className="mb-3"
          />

          {/* Secondary: View Contest */}
          <button
            onClick={() => navigate(`/contest/${contestId}`)}
            className="w-full py-2.5 rounded-lg text-gray-400 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            View Contest & Leaderboard
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/compete?tab=contests"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-base md:text-xl font-bold text-white">{contest.name}</h1>
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Coins size={14} />
                  <span className="font-mono">{contest.isFree ? 'Free' : contest.entryFeeFormatted}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={14} />
                  <span className="font-mono text-gold-400">{contest.prizePoolFormatted}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  <span className="font-mono">{contest.playerCount}</span> players
                </span>
              </div>
              <p className="sm:hidden text-xs text-gray-400">
                {contest.isFree ? 'Free' : contest.entryFeeFormatted} · {contest.prizePoolFormatted} prize
              </p>
            </div>
          </div>

          {/* Timer */}
          {timeUntilLock && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeUntilLock === 'LOCKED'
                ? 'bg-red-500/20 text-red-400'
                : timeUntilLock.includes('s')
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                  : 'bg-gold-500/20 text-gold-400'
            }`}>
              <Timer size={18} weight="fill" />
              <span className="font-medium font-mono tabular-nums">
                {timeUntilLock === 'LOCKED' ? 'Contest Locked' : `Locks in ${timeUntilLock}`}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - Mobile: Team first, Desktop: Side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr,400px] gap-6">

          {/* Mobile: Team Formation First (shows at top on mobile) */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Team</h2>
              <span className={`text-sm font-mono font-bold tabular-nums ${remainingBudget < 0 ? 'text-rose-400' : remainingBudget <= 20 ? 'text-gold-400' : 'text-gray-300'}`}>
                {remainingBudget} pts left
              </span>
            </div>
            <FormationTeam
              picks={selectedPicks}
              captainId={captainId}
              budget={usedBudget}
              maxBudget={MAX_BUDGET}
              onRemove={handleRemove}
              onSetCaptain={handleSetCaptain}
              onAutoFill={handleAutoFill}
              onClearAll={handleClearAll}
              teamSize={teamSize}
              showTapestryBadge={isAuthenticated}
            />

            {/* Mobile Transfer Status */}
            {existingTeam && transferStatus && timeUntilLock !== 'LOCKED' && (
              <div className={`mt-4 px-3 py-2 rounded-lg flex items-center justify-between text-xs ${
                transferStatus.remaining > 0
                  ? 'bg-gray-800/50 border border-gray-700/50'
                  : 'bg-rose-500/5 border border-rose-500/20'
              }`}>
                <span className="text-gray-400">Transfers this week</span>
                <span className={`font-medium ${transferStatus.remaining > 0 ? 'text-gray-200' : 'text-rose-400'}`}>
                  {transferStatus.remaining > 0
                    ? `${transferStatus.remaining} remaining`
                    : 'Limit reached · earn XP for more'}
                </span>
              </div>
            )}

            {/* Mobile Submit Button */}
            <div className="mt-4">
              {isConnected && canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={20} weight="fill" />
                      {existingTeam ? 'Update Team' : 'Submit Team'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Left: Influencer Selection */}
          <div>
            {/* Scouting Panel — shows what followed players have drafted */}
            {contestId && isAuthenticated && (
              <ScoutingPanel contestId={contestId} className="mb-4" />
            )}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Select Your Team</h2>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <Info size={16} />
                <span>Budget: <span className="text-white font-mono font-bold">{MAX_BUDGET} pts</span></span>
              </div>
            </div>
            <InfluencerGrid
              influencers={influencers}
              selectedIds={selectedPicks.map((p) => p.id)}
              captainId={captainId}
              remainingBudget={remainingBudget}
              onSelect={handleSelect}
              onSetCaptain={handleSetCaptain}
              maxSelections={teamSize}
            />
          </div>

          {/* Right: Team Formation (Desktop only - hidden on mobile) */}
          <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-lg font-semibold text-white mb-4">Your Team</h2>

            <FormationTeam
              picks={selectedPicks}
              captainId={captainId}
              budget={usedBudget}
              maxBudget={MAX_BUDGET}
              onRemove={handleRemove}
              onSetCaptain={handleSetCaptain}
              onAutoFill={handleAutoFill}
              onClearAll={handleClearAll}
              teamSize={teamSize}
              showTapestryBadge={isAuthenticated}
            />

            {/* Transfer status — shown when user has an existing entry */}
            {existingTeam && transferStatus && timeUntilLock !== 'LOCKED' && (
              <div className={`mt-4 px-3 py-2 rounded-lg flex items-center justify-between text-xs ${
                transferStatus.remaining > 0
                  ? 'bg-gray-800/50 border border-gray-700/50'
                  : 'bg-rose-500/5 border border-rose-500/20'
              }`}>
                <span className="text-gray-400">
                  Transfers this week
                </span>
                <span className={`font-medium ${transferStatus.remaining > 0 ? 'text-gray-200' : 'text-rose-400'}`}>
                  {transferStatus.remaining > 0
                    ? `${transferStatus.remaining} remaining`
                    : 'Limit reached · earn XP for more'}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-3">
              {!isConnected ? (
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm mb-2">Sign in to submit your team</p>
                </div>
              ) : timeUntilLock === 'LOCKED' ? (
                <button disabled className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Contest Locked
                </button>
              ) : !canSubmit ? (
                <button disabled className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed">
                  {!isTeamComplete
                    ? `Select ${teamSize - selectedPicks.length} more player${teamSize - selectedPicks.length > 1 ? 's' : ''}`
                    : !hasCaptain
                    ? 'Select a captain'
                    : 'Over budget'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={20} weight="fill" />
                      {existingTeam ? 'Update Team' : 'Submit Team'}
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Free Entry Confirmation Modal ────────────────────────────── */}
      {showFreeConfirmModal && contest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Lock In Your Team?</h3>
              <button
                onClick={() => setShowFreeConfirmModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Contest name */}
              <p className="text-sm text-gray-400 text-center mb-4">{contest.name}</p>

              {/* Lock time */}
              <div className="rounded-xl bg-gray-800/80 p-4 mb-4 flex items-center gap-3">
                <Lock size={20} className="text-gold-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Contest locks</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(contest.lockTime).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'short', day: 'numeric',
                    })}{' · '}
                    {new Date(contest.lockTime).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                    })}
                  </p>
                </div>
              </div>

              {/* Transfer warning */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-5 flex items-start gap-2.5">
                <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  You can update your picks before the contest locks.{' '}
                  <span className="font-semibold text-amber-300">
                    New players get 1 update
                  </span>{' '}
                  — earn XP to unlock more changes per week.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFreeConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => { setShowFreeConfirmModal(false); doSubmit(); }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} weight="fill" />
                      Enter Contest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Confirmation Modal ─────────────────────────────────── */}
      {showPaymentModal && contest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Confirm Entry</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="flex items-center justify-center mb-3">
                  <Trophy size={40} weight="fill" className="text-gold-400" />
                </div>
                <p className="font-bold text-white text-lg mb-0.5">{contest.name}</p>
                <p className="text-sm text-gray-400">Entry fee</p>
              </div>

              {/* Fee display */}
              <div className="rounded-xl bg-gray-800/80 p-4 mb-4 text-center">
                <p className="text-3xl font-bold text-white mb-0.5">
                  {contest.entryFeeFormatted}
                </p>
                <p className="text-sm text-gray-400">
                  ≈ ${(contest.entryFee * solPrice).toFixed(2)} USD
                </p>
              </div>

              {/* Wallet */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <Wallet size={16} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-400 font-mono truncate">
                  {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : 'No wallet connected'}
                </p>
              </div>

              {/* Prize pool context */}
              <p className="text-xs text-gray-500 text-center mb-5">
                Prize pool: <span className="text-emerald-400 font-medium">{contest.prizePoolFormatted}</span>
                {' '}· {contest.playerCount} players entered
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={doSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Coins size={18} weight="fill" />
                      Pay & Enter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
