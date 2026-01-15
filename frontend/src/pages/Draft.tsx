/**
 * Draft Page - Clean formation-based team builder
 * Key features:
 * - Prominent captain slot with 1.5x bonus
 * - Clear budget visualization
 * - Tier-grouped influencer selection
 * - Responsive layout
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import {
  Trophy, ArrowLeft, Lock, CheckCircle, Warning,
  Timer, CurrencyEth, Users, Info
} from '@phosphor-icons/react';
import FormationTeam from '../components/draft/FormationTeam';
import InfluencerGrid from '../components/draft/InfluencerGrid';
import { useToast } from '../contexts/ToastContext';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

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
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
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
        // Load existing picks
        const teamIds = res.data.entry.teamIds || res.data.entry.team_ids || [];
        const captain = res.data.entry.captainId || res.data.entry.captain_id;
        setCaptainId(captain);
        // Will match with influencers after they load
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
    showToast('Captain selected! They earn 1.5× points', 'success');
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

  // Authentication
  const authenticate = async () => {
    if (!address) return false;

    try {
      // Get nonce
      const nonceRes = await axios.get(`${API_URL}/api/auth/nonce`);
      const nonce = nonceRes.data.nonce;

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Foresight',
        uri: window.location.origin,
        version: '1',
        chainId: 84532,
        nonce,
      });

      const signature = await signMessageAsync({ message: message.prepareMessage() });

      // Verify
      const verifyRes = await axios.post(`${API_URL}/api/auth/verify`, {
        message: message.prepareMessage(),
        signature,
      });

      localStorage.setItem('authToken', verifyRes.data.token);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Auth failed:', err);
      showToast('Authentication failed', 'error');
      return false;
    }
  };

  // Submit team
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      // Ensure authenticated
      let token = localStorage.getItem('authToken');
      if (!token) {
        const success = await authenticate();
        if (!success) {
          setSubmitting(false);
          return;
        }
        token = localStorage.getItem('authToken');
      }

      const teamIds = selectedPicks.map((p) => p.id);

      // Use PUT for updates, POST for new entries
      const isUpdate = !!existingTeam;
      const endpoint = isUpdate
        ? `${API_URL}/api/v2/contests/${contestId}/update-free-team`
        : `${API_URL}/api/v2/contests/${contestId}/enter-free`;

      const res = isUpdate
        ? await axios.put(endpoint, { teamIds, captainId }, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(endpoint, { teamIds, captainId }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        showToast(isUpdate ? 'Team updated!' : 'Team submitted!', 'success');
        navigate(`/contest/${contestId}`);
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
              <h1 className="text-xl font-bold text-white">{contest.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <CurrencyEth size={14} />
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
                ${remainingBudget} left
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Select Your Team</h2>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <Info size={16} />
                <span>Budget: <span className="text-white font-medium">${MAX_BUDGET}</span></span>
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

            {/* Submit Button */}
            <div className="mt-4">
              {!isConnected ? (
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm mb-2">Connect wallet to submit team</p>
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
                <li>• Captain earns <span className="text-gold-400 font-medium">1.5× points</span></li>
                <li>• Scores update weekly on Sundays</li>
                <li>• Top performers win prizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
