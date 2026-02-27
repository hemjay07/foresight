/**
 * Draft Page - Clean formation-based team builder
 * Key features:
 * - Prominent captain slot with 2.0x bonus
 * - Clear budget visualization
 * - Tier-grouped influencer selection
 * - Responsive layout
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, ArrowLeft, ArrowRight, Lock, CheckCircle, Warning,
  Timer, Coins, Users, Info, Wallet, X
} from '@phosphor-icons/react';
import FormationTeam from '../components/draft/FormationTeam';
import InfluencerGrid from '../components/draft/InfluencerGrid';
import TapestryBadge from '../components/TapestryBadge';
import DraftReceipt from '../components/DraftReceipt';
import ScoutingPanel from '../components/ScoutingPanel';
import ShareTeamCard from '../components/ShareTeamCard';
import { useToast } from '../contexts/ToastContext';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
  follower_count?: number;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contestId = searchParams.get('contestId');

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

  // Time until lock
  const timeUntilLock = useMemo(() => {
    if (!contest?.lockTime) return null;
    const lockDate = new Date(contest.lockTime);
    const now = new Date();
    const diff = lockDate.getTime() - now.getTime();
    if (diff <= 0) return 'LOCKED';

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  }, [contest?.lockTime]);

  // Fetch user info for the share card footer
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    fetch(`${API_URL}/api/v2/fs/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.success && d?.data) {
          setUserInfo({ username: d.data.username || '', avatarUrl: d.data.avatarUrl });
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

    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    Promise.all([
      fetchContest(),
      fetchInfluencers(),
      token ? fetchExistingTeam(token) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [contestId]);

  const fetchContest = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v2/contests/${contestId}`);
      setContest(res.data.contest);
    } catch (err) {
      console.error('Failed to fetch contest:', err);
      showToast('Failed to load contest', 'error');
    }
  };

  const fetchInfluencers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/league/influencers`);
      // Transform data
      const data = res.data.influencers.map((i: InfluencerApiResponse): Influencer => ({
        id: i.id,
        name: i.name || i.display_name || '',
        handle: i.handle || i.twitter_handle || '',
        profile_image_url: i.profile_image_url || i.avatar_url,
        tier: i.tier,
        price: typeof i.price === 'string' ? parseFloat(i.price) : i.price,
        follower_count: i.follower_count,
        engagement_rate: typeof i.engagement_rate === 'string' ? parseFloat(i.engagement_rate || '0') : (i.engagement_rate || 0),
        total_points: typeof i.total_points === 'string' ? parseInt(i.total_points || '0') : (i.total_points || 0),
        archetype: i.archetype,
      }));
      setInfluencers(data);
    } catch (err) {
      console.error('Failed to fetch influencers:', err);
    }
  };

  const fetchExistingTeam = async (token: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/v2/contests/${contestId}/my-entry`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.entry) {
        setExistingTeam(res.data.entry);
        const captain = res.data.entry.captainId || res.data.entry.captain_id;
        setCaptainId(captain);
        // Fetch transfer status now that we know user has an existing entry
        axios.get(`${API_URL}/api/v2/contests/${contestId}/transfer-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => {
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

  // Auto-fill team with optimal picks within budget
  const handleAutoFill = () => {
    // Strategy: Pick best value players (highest points per dollar) within budget
    // Prioritize diversity across tiers for a balanced team

    const available = influencers
      .filter((i) => !selectedPicks.some((p) => p.id === i.id))
      .map((i) => ({
        ...i,
        valueScore: (i.total_points || 0) / i.price, // Points per dollar
      }))
      .sort((a, b) => b.valueScore - a.valueScore);

    let currentBudget = remainingBudget;
    let currentPicks = [...selectedPicks];
    const slotsNeeded = teamSize - currentPicks.length;

    // Greedy algorithm: pick best value that fits budget
    for (const inf of available) {
      if (currentPicks.length >= teamSize) break;

      // Check if we can afford this pick and still fill remaining slots
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
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      return true;
    }
    // No token — prompt login
    showToast('Please sign in first', 'error');
    login();
    return false;
  };

  // Submit team — forks on free vs paid
  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Paid contests show a confirmation modal first
    if (contest && !contest.isFree) {
      setShowPaymentModal(true);
      return;
    }

    await doSubmit();
  };

  // Actual submission (called directly for free, or after payment confirmation for paid)
  const doSubmit = async () => {
    setSubmitting(true);
    setShowPaymentModal(false);

    try {
      let token = localStorage.getItem('authToken');
      if (!token) {
        const success = await authenticate();
        if (!success) { setSubmitting(false); return; }
        token = localStorage.getItem('authToken');
      }

      const teamIds = selectedPicks.map((p) => p.id);
      const isPaid = contest && !contest.isFree;

      let res;
      if (isPaid) {
        // Paid: use enter-test endpoint (devnet — simulates payment for hackathon)
        res = await axios.post(
          `${API_URL}/api/v2/contests/${contestId}/enter-test`,
          { team_name: 'My Team', influencer_ids: teamIds, captain_id: captainId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const isUpdate = !!existingTeam;
        const endpoint = isUpdate
          ? `${API_URL}/api/v2/contests/${contestId}/update-free-team`
          : `${API_URL}/api/v2/contests/${contestId}/enter-free`;
        res = isUpdate
          ? await axios.put(endpoint, { teamIds, captainId }, { headers: { Authorization: `Bearer ${token}` } })
          : await axios.post(endpoint, { teamIds, captainId }, { headers: { Authorization: `Bearer ${token}` } });
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
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Failed to submit team';
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
          <Link to="/compete?tab=contests" className="text-cyan-400 hover:underline mt-2 block">
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
            <h2 className="text-2xl font-bold text-white mb-1">You're in! 🏆</h2>
            <p className="text-gray-400 text-sm">
              Share your lineup on Twitter
            </p>
          </div>

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

          {tapestryPublished && (
            <DraftReceipt
              entryId={submittedEntryId ?? undefined}
              captainHandle={selectedPicks.find(p => p.id === captainId)?.handle ?? null}
              teamSize={selectedPicks.length}
              className="mb-3"
            />
          )}

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
                  {contest.isFree ? 'Free Entry' : contest.entryFeeFormatted}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={14} />
                  {contest.prizePoolFormatted} Prize
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {contest.playerCount} entered
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
              timeUntilLock === 'LOCKED' ? 'bg-red-500/20 text-red-400' : 'bg-gold-500/20 text-gold-400'
            }`}>
              <Timer size={18} weight="fill" />
              <span className="font-medium">
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
              <span className={`text-sm font-medium ${remainingBudget < 0 ? 'text-red-400' : 'text-gray-400'}`}>
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
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2"
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
                <span>Budget: <span className="text-white font-medium">{MAX_BUDGET} pts</span></span>
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
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
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

            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">How Scoring Works</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Points earned from influencer engagement</li>
                <li>• Captain earns <span className="text-gold-400 font-medium">2.0× points</span></li>
                <li>• Scores update weekly on Sundays</li>
                <li>• Top performers win prizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
                <div className="text-4xl mb-3">🏆</div>
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:opacity-90 text-gray-950 font-bold transition-all flex items-center justify-center gap-2"
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
