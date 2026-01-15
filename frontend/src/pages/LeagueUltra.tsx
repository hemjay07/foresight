/**
 * CT Fantasy League Page - Professional Draft Interface
 * Two-column layout with live team preview and advanced filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import {
  Trophy, Users, Lock, CheckCircle, TrendUp, Warning,
  MagnifyingGlass, Sparkle, Crown, Star, Fire, TrendDown,
  X, Medal, Circle, CurrencyEth, Wallet
} from '@phosphor-icons/react';
import WelcomeModal from '../components/WelcomeModal';
import SkeletonCard from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import ShareTeamCard from '../components/ShareTeamCard';
import FirstTimeOnboarding from '../components/FirstTimeOnboarding';
import ScoreBreakdownModal from '../components/ScoreBreakdownModal';
import { Info } from '@phosphor-icons/react';
import { formatFollowerCount } from '../utils/formatFollowers';
import { getRarityInfo } from '../utils/rarities';
import { useToast } from '../contexts/ToastContext';
import { getContractAddresses } from '../contracts/addresses';
import CTDraftPrizedV2ABI from '../contracts/abis/CTDraftPrizedV2.json';
import { API_URL } from '../config/api';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: string | number;
  follower_count?: number;
  daily_tweets?: number;
  engagement_rate?: string | number;
  form_score?: number;
  total_points?: string | number;
}

interface Pick extends Influencer {
  pick_order: number;
  total_points: number;
  is_captain?: boolean;
}

interface Team {
  id: number;
  team_name: string;
  total_score: number;
  rank?: number;
  is_locked: boolean;
  picks: Pick[];
  total_budget_used?: number;
  max_budget?: number;
}

interface Contest {
  id: number;
  contest_key: string;
  start_date: string;
  end_date: string;
  status: string;
  total_participants: number;
  is_prize_league: boolean;
  entry_fee: string;
  prize_pool: number;
  max_participants: number;
  prize_distribution?: Record<string, number>;
}

export default function LeagueUltra() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Parameters from ContestsHub
  const contestIdFromUrl = searchParams.get('contestId');
  const contestTypeFromUrl = searchParams.get('type');
  const teamSizeFromUrl = parseInt(searchParams.get('teamSize') || '5');
  const hasCaptainFromUrl = searchParams.get('hasCaptain') !== 'false';
  const isFreeFromUrl = searchParams.get('isFree') === 'true';

  // Contest configuration (dynamic based on URL params)
  const teamSize = teamSizeFromUrl || 5;
  const hasCaptain = hasCaptainFromUrl;
  const isFreeEntry = isFreeFromUrl;

  // State
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(contestIdFromUrl ? parseInt(contestIdFromUrl) : null);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableInfluencers, setAvailableInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Derived state
  const selectedContest = (contests || []).find(c => c.id === selectedContestId) || (contests && contests[0]) || null;

  // New filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price' | 'followers' | 'name'>('price');

  // View state - simplified since squad/leaderboard views removed (use /contest/:id instead)
  const [influencerViewMode, setInfluencerViewMode] = useState<'grid' | 'list'>('grid');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Paid contest entry state
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [contestEntryFee, setContestEntryFee] = useState<string>('0');
  const [contractContestId, setContractContestId] = useState<number | null>(null);
  const [entryStep, setEntryStep] = useState<'draft' | 'confirm' | 'pending' | 'success'>('draft');

  // Contract interaction hooks
  const contractAddresses = getContractAddresses(chainId || 84532);
  const { data: txHash, writeContract, isPending: isWritePending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Helper: Convert month to quarter (CT style)
  const getQuarterFromDate = (date: string) => {
    if (!date) return 'Current';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Current';

    const month = parsed.getMonth() + 1; // 1-12
    const year = parsed.getFullYear();

    if (month >= 1 && month <= 3) return `Q1 ${year}`;
    if (month >= 4 && month <= 6) return `Q2 ${year}`;
    if (month >= 7 && month <= 9) return `Q3 ${year}`;
    return `Q4 ${year}`;
  };

  // Helper: Calculate gameweek number (week of year)
  const getGameweekNumber = (date: string) => {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + yearStart.getDay() + 1) / 7);
    return weekNumber;
  };

  // Computed values
  const budgetUsed = useMemo(() => {
    return availableInfluencers
      .filter(inf => selectedInfluencers.includes(inf.id))
      .reduce((sum, inf) => sum + parseFloat(inf.price.toString()), 0);
  }, [selectedInfluencers, availableInfluencers]);

  // Budget scales with team size: 30 points per pick slot
  const TOTAL_BUDGET = teamSize * 30;
  const budgetRemaining = TOTAL_BUDGET - budgetUsed;

  // Filtered and sorted influencers
  const filteredInfluencers = useMemo(() => {
    let filtered = [...availableInfluencers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inf =>
        inf.name.toLowerCase().includes(query) ||
        inf.handle.toLowerCase().includes(query)
      );
    }

    // Tier filter
    if (selectedTier !== 'All') {
      filtered = filtered.filter(inf => inf.tier === selectedTier);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price') return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
      if (sortBy === 'followers') return (b.follower_count || 0) - (a.follower_count || 0);
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [availableInfluencers, searchQuery, selectedTier, sortBy]);

  // Selected influencer objects
  const selectedInfluencerObjects = useMemo(() => {
    return availableInfluencers.filter(inf => selectedInfluencers.includes(inf.id));
  }, [selectedInfluencers, availableInfluencers]);

  // If no contest ID provided, auto-select the first available contest (usually Free League)
  // This allows Arena to embed LeagueUltra without requiring pre-selection
  useEffect(() => {
    if (!contestIdFromUrl && contests.length > 0 && !selectedContestId) {
      // Auto-select first contest (typically Free League)
      setSelectedContestId(contests[0].id);
    }
  }, [contestIdFromUrl, contests, selectedContestId]);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay for better UX
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  // API calls (keeping existing logic)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    fetchContest();
    fetchInfluencers();
    if (isConnected && token) {
      fetchTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // Refetch team when user switches contests
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (isConnected && token && selectedContestId) {
      fetchTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContestId]);

  // Fetch V2 contest details for entry fee
  useEffect(() => {
    if (contestIdFromUrl && !isFreeEntry) {
      fetchV2ContestDetails();
    }
  }, [contestIdFromUrl, isFreeEntry]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      verifyPaidEntry(txHash);
    }
  }, [isConfirmed, txHash]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      showToast('Transaction failed: ' + (writeError.message || 'Unknown error'), 'error');
      setEntryStep('confirm');
    }
  }, [writeError]);

  const fetchV2ContestDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v2/contests/${contestIdFromUrl}`);
      const contest = response.data.contest;
      setContestEntryFee(contest.entryFee?.toString() || '0');
      setContractContestId(contest.contractContestId);
    } catch (error) {
      console.error('Error fetching V2 contest details:', error);
    }
  };

  const verifyPaidEntry = async (hash: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/api/v2/contests/${contestIdFromUrl}/verify-entry`,
        { txHash: hash },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntryStep('success');
      showToast('Entry successful! Your team is in the contest.', 'success');
      setTimeout(() => navigate('/contest/' + contestIdFromUrl), 2000);
    } catch (error) {
      console.error('Error verifying entry:', error);
      showToast('Entry recorded on-chain but verification failed. Please contact support.', 'error');
    }
  };

  const fetchContest = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/contests/active`);
      setContests(response.data.contests);
      // Auto-select first contest (free league comes first)
      if (response.data.contests.length > 0 && !selectedContestId) {
        setSelectedContestId(response.data.contests[0].id);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const fetchInfluencers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/influencers`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const influencers = response.data.influencers || [];
      setAvailableInfluencers(influencers);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      setAvailableInfluencers([]);
    }
  };

  const fetchTeam = async () => {
    if (!selectedContest) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/api/league/team/me?contest_id=${selectedContest.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.team) {
        setTeam(response.data.team);
        setTeamName(response.data.team.team_name);
        // Map influencer_id from picks (not p.id which is the pick ID)
        setSelectedInfluencers(response.data.team.picks.map((p: Pick) => p.influencer_id));
        // Set captain from picks
        const captain = response.data.team.picks.find((p: Pick) => p.is_captain);
        if (captain) {
          setCaptainId(captain.influencer_id);
        }
      } else {
        // No team for this contest, reset state
        setTeam(null);
        setTeamName('');
        setSelectedInfluencers([]);
        setCaptainId(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        console.error('Error fetching team:', error);
      }
      // Reset state on error
      setTeam(null);
      setTeamName('');
      setSelectedInfluencers([]);
      setCaptainId(null);
    }
  };

  const handleManualSignIn = async () => {
    if (!address) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get nonce
      const nonceResponse = await axios.get(`${API_URL}/api/auth/nonce?address=${address}`);

      // Step 2: Create SIWE message
      const siweConfig = {
        domain: window.location.host,
        address,
        statement: 'Sign in to Foresight Fantasy League',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1,
        nonce: nonceResponse.data.nonce,
      };

      let message: SiweMessage;
      try {
        message = new SiweMessage(siweConfig);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Failed to create SIWE message: ${errorMsg}`);
      }

      let messageToSign: string;
      try {
        messageToSign = message.prepareMessage();
      } catch (siweError) {
        throw new Error(`Failed to prepare SIWE message: ${siweError instanceof Error ? siweError.message : String(siweError)}`);
      }

      // Step 3: Sign message with wallet
      const signature = await signMessageAsync({ message: messageToSign });

      // Step 4: Verify signature with backend
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: messageToSign,
        signature,
      });

      // Step 5: Store tokens
      localStorage.setItem('authToken', verifyResponse.data.accessToken);
      localStorage.setItem('refreshToken', verifyResponse.data.refreshToken);
      setIsAuthenticated(true);

      // Step 6: Fetch team data
      await fetchTeam();
      showToast('success', 'Successfully signed in!');
    } catch (error) {
      // Better error messages
      let errorMessage = 'Error signing in';
      const errorCode = (error as {code?: string | number}).code;
      if (errorCode === 'ACTION_REJECTED' || errorCode === 4001) {
        errorMessage = 'You rejected the signature request';
      } else if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInfluencer = (id: number) => {
    if (selectedInfluencers.includes(id)) {
      setSelectedInfluencers(prev => prev.filter(i => i !== id));
    } else {
      if (selectedInfluencers.length < teamSize) {
        setSelectedInfluencers(prev => [...prev, id]);
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTier('All');
    setSortBy('price');
  };

  const handleAutoPick = () => {
    if (selectedInfluencers.length >= teamSize) return;

    // Smart auto-pick: Fill remaining slots within budget
    const remaining = teamSize - selectedInfluencers.length;
    const budgetLeft = TOTAL_BUDGET - budgetUsed;

    // Get available influencers not already selected
    const available = availableInfluencers
      .filter(inf => !selectedInfluencers.includes(inf.id))
      .sort((a, b) => parseFloat(b.total_points?.toString() || '0') - parseFloat(a.total_points?.toString() || '0'));

    // Find cheapest player price (C-tier = 12 pts)
    const minPrice = Math.min(...availableInfluencers.map(inf => parseFloat(inf.price.toString())));

    // Greedily pick best performers within budget, ensuring we can fill all slots
    const picks: number[] = [];
    let usedBudget = 0;

    for (const inf of available) {
      if (picks.length >= remaining) break;

      const price = parseFloat(inf.price.toString());
      const slotsRemaining = remaining - picks.length - 1; // Slots after picking this one
      const minBudgetForRemaining = slotsRemaining * minPrice;

      // Only pick if we have enough budget for this player AND all remaining slots
      if (usedBudget + price + minBudgetForRemaining <= budgetLeft) {
        picks.push(inf.id);
        usedBudget += price;
      }
    }

    // If we couldn't fill all slots with best performers, fill with cheapest available
    if (picks.length < remaining) {
      const cheapest = available
        .filter(inf => !picks.includes(inf.id))
        .sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()));

      for (const inf of cheapest) {
        if (picks.length >= remaining) break;
        const price = parseFloat(inf.price.toString());
        if (usedBudget + price <= budgetLeft) {
          picks.push(inf.id);
          usedBudget += price;
        }
      }
    }

    setSelectedInfluencers(prev => [...prev, ...picks]);
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    showToast('success', 'Welcome to CT Fantasy League! Start building your team 🚀');
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleCreateTeam = async () => {
    if (!selectedContest && !contestIdFromUrl) {
      showToast('Please select a league', 'error');
      return;
    }

    if (!teamName || selectedInfluencers.length !== teamSize || budgetUsed > TOTAL_BUDGET) {
      showToast(`Please enter a team name and select exactly ${teamSize} influencers within budget`, 'error');
      return;
    }

    if (hasCaptain && !captainId) {
      showToast('Please select a captain (one influencer will get 1.5x points)', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Different flow for free league vs paid contests
      if (isFreeEntry && contestIdFromUrl) {
        // Free league entry - use V2 API
        console.log('📤 Submitting free league entry:', {
          contestId: contestIdFromUrl,
          teamIds: selectedInfluencers,
          captainId: hasCaptain ? captainId : null,
        });
        await axios.post(
          `${API_URL}/api/v2/contests/${contestIdFromUrl}/enter-free`,
          {
            teamIds: selectedInfluencers,
            captainId: hasCaptain ? captainId : null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        showToast(`Free League entry successful! Team "${teamName}" is in!`, 'success');
        // Redirect to contest detail page to see the entry
        setTimeout(() => navigate('/contest/' + contestIdFromUrl), 2000);
      } else if (contestIdFromUrl && contractContestId) {
        // V2 Paid contest with on-chain contract - show payment confirmation
        setLoading(false);
        setEntryStep('confirm');
        setShowPaymentConfirm(true);
        return;
      } else if (contestIdFromUrl && !isFreeEntry) {
        // V2 Paid contest without on-chain contract (test mode)
        console.log('📤 Submitting test entry:', {
          contestId: contestIdFromUrl,
          team_name: teamName,
          influencer_ids: selectedInfluencers,
          captain_id: hasCaptain ? captainId : null,
        });
        await axios.post(
          `${API_URL}/api/v2/contests/${contestIdFromUrl}/enter-test`,
          {
            team_name: teamName,
            influencer_ids: selectedInfluencers,
            captain_id: hasCaptain ? captainId : null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        showToast(`Entry successful! Team "${teamName}" is in the contest!`, 'success');
        setTimeout(() => navigate('/contest/' + contestIdFromUrl), 2000);
      } else {
        // Regular paid contest flow (old system - fallback)
        const contestId = contestIdFromUrl ? parseInt(contestIdFromUrl) : selectedContest?.id;
        await axios.post(
          `${API_URL}/api/league/team/create`,
          {
            team_name: teamName,
            influencer_ids: selectedInfluencers,
            captain_id: hasCaptain ? captainId : null,
            contest_id: contestId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh team
        await fetchTeam();

        // Redirect to contest detail page
        showToast(`Team "${teamName}" created successfully!`, 'success');
        if (contestId) {
          setTimeout(() => navigate(`/contest/${contestId}`), 2000);
        }
      }
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error ? error.response.data.error : 'Error creating team'
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle paid contest entry via smart contract
  const handleConfirmPaidEntry = async () => {
    if (!contractContestId || !contestEntryFee) {
      showToast('Contest not properly configured for payment', 'error');
      return;
    }

    try {
      setEntryStep('pending');
      resetWrite();

      // Convert selected influencer IDs to BigInt array
      const teamIds = selectedInfluencers.map(id => BigInt(id));
      const captain = hasCaptain && captainId ? BigInt(captainId) : BigInt(0);

      writeContract({
        address: contractAddresses.ctDraftPrizedV2,
        abi: CTDraftPrizedV2ABI,
        functionName: 'enterContest',
        args: [BigInt(contractContestId), teamIds, captain],
        value: parseEther(contestEntryFee),
      });
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      showToast('Failed to initiate payment: ' + (error.message || 'Unknown error'), 'error');
      setEntryStep('confirm');
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentConfirm(false);
    setEntryStep('draft');
    resetWrite();
  };

  const handleUpdateTeam = async () => {
    if (selectedInfluencers.length !== teamSize || budgetUsed > TOTAL_BUDGET) {
      showToast('error', `Please select exactly ${teamSize} influencers within budget`);
      return;
    }

    if (hasCaptain && !captainId) {
      showToast('error', 'Please select a captain (one influencer will get 1.5x points)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/api/league/team/update`,
        {
          influencer_ids: selectedInfluencers,
          captain_id: captainId,
          contest_id: selectedContestId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh team
      await fetchTeam();

      // Redirect to contest detail page
      showToast('success', 'Team updated successfully!');
      const contestId = contestIdFromUrl || selectedContestId;
      if (contestId) {
        setTimeout(() => navigate(`/contest/${contestId}`), 2000);
      }
    } catch (error) {
      const errorMsg = axios.isAxiosError(error) && error.response?.data?.error
      ? error.response.data.error
      : 'Error updating team';
      showToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!availableInfluencers || availableInfluencers.length === 0)) {
    return (
      <div className="min-h-screen bg-dark-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-10 bg-dark-border rounded w-64 animate-pulse mb-4"></div>
            <div className="h-6 bg-dark-border rounded w-96 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <WelcomeModal />

      {/* Contest Selector - when no contest pre-selected (e.g., from Arena) */}
      {!contestIdFromUrl && contests.length > 0 && (
        <div className="max-w-[1800px] mx-auto px-6 pt-4">
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Contest:</span>
              <select
                value={selectedContestId || ''}
                onChange={(e) => {
                  const newId = parseInt(e.target.value);
                  setSelectedContestId(newId);
                  setSelectedInfluencers([]);
                  setCaptainId(null);
                }}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-gold-500"
              >
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.is_prize_league ? `${c.contest_key} (${c.entry_fee} ETH)` : `${c.contest_key} (Free)`}
                  </option>
                ))}
              </select>
            </div>
            {selectedContest && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">{selectedContest.total_participants} playing</span>
                <span className={`px-2 py-0.5 rounded font-medium ${
                  selectedContest.is_prize_league
                    ? 'bg-gold-500/20 text-gold-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedContest.is_prize_league ? `Prize: ${selectedContest.prize_pool} ETH` : 'Free'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contest Header Banner - when coming from ContestsHub */}
      {contestIdFromUrl && (
        <div className={`${isFreeEntry ? 'bg-gradient-to-r from-emerald-900/50 to-teal-900/50' : 'bg-gradient-to-r from-brand-900/50 to-blue-900/50'} border-b ${isFreeEntry ? 'border-emerald-500/30' : 'border-brand-500/30'}`}>
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/contests')}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                >
                  <X size={20} className="text-gray-400" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isFreeEntry ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}>
                      {contestTypeFromUrl?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400 text-sm">Contest #{contestIdFromUrl}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {isFreeEntry ? 'Free League Entry' : 'Draft Your Team'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Team Size</p>
                  <p className="text-xl font-bold text-white">{teamSize}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Captain</p>
                  <p className="text-xl font-bold text-white">{hasCaptain ? 'Yes' : 'No'}</p>
                </div>
                {isFreeEntry && (
                  <div className={`px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30`}>
                    <p className="text-emerald-400 font-bold">FREE ENTRY</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Header - No tabs, draft is the only view */}

      {/* Main Container - Two Column Layout (Sidebar on RIGHT) */}
      <div className="flex flex-row-reverse gap-4 px-6 pb-6 max-w-[1800px] mx-auto">

        {/* RIGHT SIDEBAR - Team Preview (Sticky) */}
        <div className="w-[320px] flex-shrink-0">
          <div className="sticky top-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ scrollbarWidth: 'thin' }}>
            {/* Team Name Card */}
            <div className="bg-gray-800/80 rounded-lg p-3">
              {!team ? (
                <>
                  <label className="text-xs text-gray-400 mb-1 block">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-gold-500 text-white text-sm placeholder:text-gray-500"
                    maxLength={50}
                  />
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{team.team_name}</h2>
                    <p className="text-xs text-gray-400">{selectedInfluencers.length}/{teamSize} players</p>
                  </div>
                  {team.rank && (
                    <div className="text-2xl font-black text-gold-400">#{team.rank}</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Squad */}
            <div className="bg-gray-800/80 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2 text-white flex items-center gap-2">
                <Users size={16} weight="bold" className="text-gold-500" />
                Your Squad
              </h3>

              <div className="space-y-2">
                {[...Array(teamSize)].map((_, index) => {
                  const influencer = selectedInfluencerObjects[index];

                  if (!influencer) {
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Empty slot</p>
                        </div>
                      </div>
                    );
                  }

                  const rarity = getRarityInfo(influencer.tier);

                  const isCaptain = captainId === influencer.id;

                  return (
                    <div key={influencer.id} className={`flex items-center gap-2 p-2 bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-lg border-2 transition-all group ${
                      isCaptain ? 'border-yellow-500 bg-gradient-to-r from-yellow-900/20 to-amber-900/20' : 'border-gray-700 hover:border-brand-500/50'
                    }`}>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
                          {influencer.profile_image_url ? (
                            <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${rarity.badge} flex items-center justify-center text-white text-[10px] font-bold shadow-lg`}>
                          {influencer.tier}
                        </div>
                        {hasCaptain && isCaptain && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                            <Crown size={10} weight="fill" className="text-gray-900" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs truncate flex items-center gap-1">
                          {influencer.name}
                          {hasCaptain && isCaptain && <span className="text-[9px] text-yellow-400 font-bold">(C)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">@{influencer.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400 text-xs">{parseFloat(influencer.price.toString()).toFixed(0)} pts</p>
                        {influencer.total_points !== undefined && (
                          <p className="text-[10px] text-brand-500">{influencer.total_points} pts {hasCaptain && isCaptain && '× 1.5'}</p>
                        )}
                      </div>
                      {hasCaptain && (
                        <button
                          onClick={() => setCaptainId(influencer.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            isCaptain
                              ? 'bg-yellow-500 text-gray-900'
                              : 'bg-gray-700 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400'
                          }`}
                          title="Make Captain (1.5x points)"
                        >
                          <Crown size={12} weight={isCaptain ? 'fill' : 'regular'} />
                        </button>
                      )}
                      <button
                        onClick={() => handleSelectInfluencer(influencer.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} weight="bold" className="text-red-400 hover:text-red-300" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Total Score */}
              {team && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Score</span>
                    <span className="text-3xl font-black text-brand-500">{team.total_score}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Budget Tracker */}
            <div className="bg-gray-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Budget</span>
                <span className={`text-lg font-bold ${budgetRemaining < 0 ? 'text-red-400' : 'text-gold-400'}`}>
                  {budgetUsed.toFixed(0)}/{TOTAL_BUDGET}
                </span>
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    budgetRemaining < 0 ? 'bg-red-500' : 'bg-gold-500'
                  }`}
                  style={{ width: `${Math.min((budgetUsed / TOTAL_BUDGET) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {budgetRemaining >= 0 ? `${budgetRemaining.toFixed(0)} remaining` : `Over by ${Math.abs(budgetRemaining).toFixed(0)}`}
              </p>
            </div>
            </div>

            {/* Action Button - Always Visible */}
            <div className="flex-shrink-0">
              {!isAuthenticated ? (
                <button
                  onClick={handleManualSignIn}
                  disabled={!isConnected || loading}
                  className="btn-primary w-full py-3 rounded-lg font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-lg"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <Lock size={20} weight="bold" />
                    {!isConnected ? 'Connect Wallet' : 'Sign In'}
                  </span>
                </button>
              ) : !team ? (
                <button
                  onClick={handleCreateTeam}
                  disabled={loading || !teamName || selectedInfluencers.length !== teamSize || budgetUsed > TOTAL_BUDGET || (hasCaptain && !captainId)}
                  className={`btn-primary w-full py-3 ${
                    isFreeEntry
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  } rounded-lg font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-lg`}
                >
                  <span className="flex items-center gap-2 justify-center">
                    {isFreeEntry ? (
                      <>
                        <TrendUp size={20} weight="bold" />
                        Enter Free League
                        <span className="badge-warning bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-xs">+50 XP</span>
                      </>
                    ) : contestIdFromUrl && parseFloat(contestEntryFee) > 0 ? (
                      <>
                        <CurrencyEth size={20} weight="bold" />
                        Enter ({parseFloat(contestEntryFee).toFixed(3)} ETH)
                      </>
                    ) : (
                      <>
                        <TrendUp size={20} weight="bold" />
                        Create Team
                        <span className="badge-warning bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-xs">+50 XP</span>
                      </>
                    )}
                  </span>
                </button>
              ) : team.is_locked ? (
                <div className="w-full py-3 bg-gray-700 rounded-lg text-center">
                  <span className="flex items-center gap-2 justify-center text-gray-400">
                    <Lock size={20} weight="bold" />
                    <span className="font-bold">Team Locked</span>
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Unlocks after gameweek</p>
                </div>
              ) : (
                <button
                  onClick={handleUpdateTeam}
                  disabled={loading || selectedInfluencers.length !== teamSize || budgetUsed > TOTAL_BUDGET || (hasCaptain && !captainId)}
                  className="btn-primary w-full py-3 rounded-lg font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-lg"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <TrendUp size={20} weight="bold" />
                    Update Team
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LEFT MAIN AREA - Influencer Grid */}
        <div className="flex-1">
          {/* Search and Filters */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CT kings by name or @handle..."
                className="w-full pl-12 pr-4 py-4 bg-gray-900/80 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-500 transition-all text-white placeholder:text-gray-500 text-lg"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="text-sm text-gray-400 font-semibold">Filter:</span>
              {['All', 'S', 'A', 'B', 'C'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`btn px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    selectedTier === tier
                      ? 'btn-primary shadow-soft'
                      : 'btn-ghost'
                  }`}
                >
                  {tier === 'All' ? 'All Tiers' : `${tier}-Tier`}
                </button>
              ))}

              <button
                onClick={handleResetFilters}
                className="btn-ghost px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
              >
                <span>↻</span> Reset
              </button>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-400 font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'followers' | 'name')}
                  className="px-4 py-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-white font-semibold focus:outline-none focus:border-brand-500"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="followers">Followers (High to Low)</option>
                  <option value="name">Name (A-Z)</option>
                </select>

                {/* View Toggle */}
                <div className="flex bg-gray-800 rounded-lg border-2 border-gray-700">
                  <button
                    onClick={() => setInfluencerViewMode('grid')}
                    className={`px-3 py-2 rounded-l-lg font-bold text-sm transition-all ${
                      influencerViewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setInfluencerViewMode('list')}
                    className={`px-3 py-2 rounded-r-lg font-bold text-sm transition-all ${
                      influencerViewMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count & Auto-Pick */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                <span className="badge-primary bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full font-bold">{(filteredInfluencers || []).length} influencers</span>
                {' '}shown of {(availableInfluencers || []).length} total
              </p>

              {selectedInfluencers.length < teamSize && isAuthenticated && (
                <button
                  onClick={handleAutoPick}
                  className="btn-primary px-4 py-2 rounded-lg font-bold text-sm transition-all text-white flex items-center gap-2 shadow-soft"
                >
                  <Sparkle size={16} weight="fill" />
                  Auto-Fill
                </button>
              )}
            </div>
          </div>

          {/* Influencer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInfluencers.map((influencer) => {
              const isSelected = selectedInfluencers.includes(influencer.id);
              const rarity = getRarityInfo(influencer.tier);
              const RarityIcon = rarity.icon;

              // Form indicator based on form_score (0-100 scale, with 50 being average)
              const formScore = influencer.form_score || 50;
              const getFormInfo = () => {
                if (formScore > 80) return {
                  text: 'Hot',
                  icon: Fire,
                  color: 'text-red-400',
                  bg: 'bg-red-500/20 border-red-500/50',
                  glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                };
                if (formScore >= 50) return {
                  text: 'Stable',
                  icon: Star,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/20 border-blue-500/50',
                  glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                };
                return {
                  text: 'Cold',
                  icon: TrendDown,
                  color: 'text-gray-400',
                  bg: 'bg-gray-500/20 border-gray-500/50',
                  glow: ''
                };
              };
              const form = getFormInfo();
              const FormIcon = form.icon;

              return (
                <button
                  key={influencer.id}
                  onClick={() => handleSelectInfluencer(influencer.id)}
                  disabled={!isSelected && selectedInfluencers.length >= teamSize}
                  className={`card-hover relative p-6 rounded-lg border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? `${rarity.border} bg-gradient-to-br ${rarity.gradient} ${rarity.glow} scale-[1.02]`
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-gray-600 hover:scale-[1.02] hover:shadow-soft disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {/* Top Badges Row */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
                    {/* Form Badge */}
                    <div className={`${form.bg} ${form.glow} border-2 px-2 py-1 rounded-full flex items-center gap-1`}>
                      <FormIcon size={14} weight="fill" className={form.color} />
                      <span className={`text-xs font-bold ${form.color}`}>{form.text}</span>
                    </div>

                    {/* Rarity Badge */}
                    <div className={`${rarity.badge} px-3 py-1 rounded-full flex items-center gap-1 shadow-soft`}>
                      <RarityIcon size={14} weight="fill" className="text-white" />
                      <span className="text-xs font-bold text-white">{rarity.label}</span>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="mb-4 mt-6">
                    <div className={`w-24 h-24 mx-auto rounded-full border-4 ${isSelected ? 'border-white' : 'border-gray-600'} shadow-soft overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 ${formScore > 80 ? 'ring-2 ring-red-500/50 ring-offset-2 ring-offset-gray-900' : ''}`}>
                      {influencer.profile_image_url ? (
                        <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                          <Users size={48} weight="bold" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Handle */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{influencer.name}</h3>
                    <p className="text-sm text-gray-300">@{influencer.handle}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Weekly Score */}
                    {influencer.total_points !== undefined && (
                      <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center border border-gray-700/50">
                        <p className="text-xs text-gray-400 mb-1">Score</p>
                        <p className="font-bold text-white text-sm">{influencer.total_points}</p>
                      </div>
                    )}

                    {/* Cost */}
                    <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Cost</p>
                      <p className="font-bold text-yellow-400 text-sm">{parseFloat(influencer.price.toString()).toFixed(0)} pts</p>
                    </div>

                    {/* Form Score */}
                    <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Form</p>
                      <p className={`font-bold text-sm ${form.color}`}>{formScore}</p>
                    </div>
                  </div>

                  {/* Followers Badge */}
                  {influencer.follower_count && (
                    <div className="mb-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-brand-500/10 border border-brand-500/30 rounded-full px-3 py-1">
                        <Users size={14} weight="bold" className="text-brand-500" />
                        <span className="text-xs font-bold text-brand-500">
                          {formatFollowerCount(influencer.follower_count)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Draft Button */}
                  <div className={`py-3 rounded-lg text-center font-bold transition-all ${
                    isSelected
                      ? 'bg-white/20 backdrop-blur text-white'
                      : 'bg-brand-500/20 text-brand-400 group-hover:bg-brand-500/30'
                  }`}>
                    {isSelected ? (
                      <span className="flex items-center gap-2 justify-center">
                        <CheckCircle size={18} weight="fill" />
                        Selected
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <Crown size={18} weight="bold" />
                        Draft ({parseFloat(influencer.price.toString()).toFixed(0)} pts)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredInfluencers.length === 0 && (
            <EmptyState
              icon="search"
              title="No Influencers Found"
              description="Try adjusting your search query or filter settings to find the perfect CT kings for your team."
              action={
                <button
                  onClick={handleResetFilters}
                  className="btn-primary px-8 py-4 flex items-center gap-3 font-bold text-base shadow-soft-lg hover:scale-105 transition-transform"
                >
                  <span className="text-xl">↻</span>
                  Clear All Filters
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* My Squad View - REMOVED: Use /contest/:id for squad viewing */}

      {/* Leaderboard View - REMOVED: Use /contest/:id for leaderboard */}

      {/* Share Team Modal */}
      {showShareModal && team && team.picks && (
        <ShareTeamCard
          teamName={team.team_name}
          totalScore={team.total_score}
          rank={team.rank}
          picks={team.picks.map(pick => ({
            id: pick.id,
            influencer_name: pick.name,
            influencer_handle: pick.handle,
            influencer_tier: pick.tier,
            total_points: pick.total_points,
            profile_image_url: pick.profile_image_url,
            is_captain: pick.is_captain
          }))}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* First Time Onboarding */}
      {showOnboarding && (
        <FirstTimeOnboarding
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Score Breakdown Modal */}
      {team && (
        <ScoreBreakdownModal
          teamId={team.id}
          isOpen={showScoreBreakdown}
          onClose={() => setShowScoreBreakdown(false)}
        />
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancelPayment} />

          {/* Modal */}
          <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
              <h2 className="text-xl font-bold text-white">Confirm Entry</h2>
              <button onClick={handleCancelPayment} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {entryStep === 'confirm' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CurrencyEth size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Pay Entry Fee</h3>
                    <p className="text-gray-400">
                      Enter <span className="text-white font-bold">{contestTypeFromUrl?.replace('_', ' ')}</span>
                    </p>
                  </div>

                  {/* Team Summary */}
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Your Team</span>
                      <span className="text-white font-bold">{teamName}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Players</span>
                      <span className="text-white">{selectedInfluencers.length} selected</span>
                    </div>
                    {hasCaptain && captainId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Captain</span>
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Crown size={14} weight="fill" />
                          {availableInfluencers.find(i => i.id === captainId)?.name || 'Selected'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Entry Fee */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Entry Fee</span>
                      <span className="text-2xl font-bold text-purple-400">
                        {parseFloat(contestEntryFee).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 text-left text-sm text-gray-400 mb-6 bg-gray-800/30 rounded-lg p-3">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Your entry fee goes into the prize pool. Top performers will win ETH prizes when the contest ends.
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmPaidEntry}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet size={20} weight="fill" />
                    Pay & Enter Contest
                  </button>
                </>
              )}

              {entryStep === 'pending' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isWritePending ? 'Confirm in Wallet' : isConfirming ? 'Processing...' : 'Submitting...'}
                  </h3>
                  <p className="text-gray-400">
                    {isWritePending
                      ? 'Please confirm the transaction in your wallet'
                      : isConfirming
                      ? 'Waiting for blockchain confirmation...'
                      : 'Preparing transaction...'}
                  </p>
                </div>
              )}

              {entryStep === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">You're In!</h3>
                  <p className="text-gray-400 mb-4">
                    Successfully entered the contest with team "{teamName}"
                  </p>
                  <p className="text-sm text-green-400">
                    Good luck! Redirecting to contests...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
