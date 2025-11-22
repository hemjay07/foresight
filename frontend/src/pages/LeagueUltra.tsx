/**
 * CT Fantasy League Page - Professional Draft Interface
 * Two-column layout with live team preview and advanced filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import {
  Trophy, Users, Lock, CheckCircle, TrendUp, Warning,
  MagnifyingGlass, Sparkle, Crown, Star, Fire,
  CaretDown, X, Medal, ChartBar, Circle
} from '@phosphor-icons/react';
import WelcomeModal from '../components/WelcomeModal';
import { formatFollowerCount } from '../utils/formatFollowers';
import { getRarityInfo } from '../utils/rarities';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  price: number;
  follower_count?: number;
  form_score?: number;
  total_points?: number;
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
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  prize_distribution?: Record<string, number>;
}

interface LeaderboardEntry {
  id: number;
  team_name: string;
  total_score: number;
  rank: number;
  user_id: string;
}

export default function LeagueUltra() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // State
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableInfluencers, setAvailableInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Derived state
  const selectedContest = contests.find(c => c.id === selectedContestId) || contests[0] || null;

  // New filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price' | 'followers' | 'name'>('price');

  // View state
  const [currentView, setCurrentView] = useState<'draft' | 'squad' | 'leaderboard'>('draft');
  const [influencerViewMode, setInfluencerViewMode] = useState<'grid' | 'list'>('grid');
  const [squadViewMode, setSquadViewMode] = useState<'list' | 'formation'>('formation');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Personalization state
  const [teamBadge, setTeamBadge] = useState<string>('fire');
  const [teamColor, setTeamColor] = useState<string>('brand');
  const [showPersonalization, setShowPersonalization] = useState(false);

  // Professional badges - no emojis
  const badges = {
    fire: { icon: Fire, label: 'Fire' },
    diamond: { icon: Sparkle, label: 'Diamond Hands' },
    rocket: { icon: TrendUp, label: 'To The Moon' },
    trophy: { icon: Trophy, label: 'Champion' },
    crown: { icon: Crown, label: 'King' },
    star: { icon: Star, label: 'Star' },
    lightning: { icon: Fire, label: 'Lightning' },
    circle: { icon: Circle, label: 'Circle' },
  };

  // Professional color schemes - single brand color
  const colorSchemes = {
    brand: {
      name: 'Brand Blue',
      gradient: 'from-brand-500 to-brand-600',
      text: 'text-brand-500',
      bg: 'bg-brand-500',
      border: 'border-brand-500'
    },
    green: {
      name: 'Green',
      gradient: 'from-green-500 to-emerald-600',
      text: 'text-green-500',
      bg: 'bg-green-500',
      border: 'border-green-500'
    },
    orange: {
      name: 'Orange',
      gradient: 'from-orange-500 to-red-600',
      text: 'text-orange-500',
      bg: 'bg-orange-500',
      border: 'border-orange-500'
    },
    yellow: {
      name: 'Gold',
      gradient: 'from-yellow-500 to-amber-600',
      text: 'text-yellow-500',
      bg: 'bg-yellow-500',
      border: 'border-yellow-500'
    },
  };

  // Helper: Convert month to quarter (CT style)
  const getQuarterFromDate = (date: string) => {
    const month = new Date(date).getMonth() + 1; // 1-12
    const year = new Date(date).getFullYear();

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

  const TOTAL_BUDGET = 150;
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

  // API calls (keeping existing logic)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    fetchContest();
    fetchInfluencers();
    fetchLeaderboard();
    if (isConnected && token) {
      fetchTeam();
    }
  }, [isConnected, address]);

  // Refetch team when user switches contests
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (isConnected && token && selectedContestId) {
      fetchTeam();
    }
  }, [selectedContestId]);

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
      const response = await axios.get(`${API_URL}/api/league/influencers`);
      setAvailableInfluencers(response.data.influencers || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
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
        setSelectedInfluencers(response.data.team.picks.map((p: any) => p.influencer_id));
        // Set captain from picks
        const captain = response.data.team.picks.find((p: any) => p.is_captain);
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
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching team:', error);
      }
      // Reset state on error
      setTeam(null);
      setTeamName('');
      setSelectedInfluencers([]);
      setCaptainId(null);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleManualSignIn = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting sign-in...', { address, chainId });

      // Step 1: Get nonce
      const nonceResponse = await axios.get(`${API_URL}/api/auth/nonce?address=${address}`);
      console.log('Got nonce:', nonceResponse.data.nonce);

      // Step 2: Create SIWE message
      const siweConfig = {
        domain: window.location.host,
        address,
        statement: 'Sign in to Foresight Fantasy League',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1, // Default to mainnet if undefined
        nonce: nonceResponse.data.nonce,
      };
      console.log('SIWE config:', JSON.stringify(siweConfig, null, 2));

      let message: SiweMessage;
      try {
        message = new SiweMessage(siweConfig);
        console.log('SIWE message created successfully');
      } catch (siweError) {
        console.error('=== SIWE ERROR ===');
        console.error('Failed to create SiweMessage:', siweError);
        console.error('Error type:', typeof siweError);
        console.error('Error instanceof Error:', siweError instanceof Error);
        console.error('Error details:', {
          name: (siweError as any)?.name,
          message: (siweError as any)?.message,
          stack: (siweError as any)?.stack,
          constructor: (siweError as any)?.constructor?.name,
        });
        console.error('Full SIWE error:', JSON.stringify(siweError, Object.getOwnPropertyNames(siweError), 2));

        const errorMsg = siweError instanceof Error ? siweError.message : JSON.stringify(siweError);
        throw new Error(`Failed to create SIWE message: ${errorMsg}`);
      }

      let messageToSign: string;
      try {
        messageToSign = message.prepareMessage();
        console.log('Message prepared successfully');
        console.log('Message to sign:', messageToSign);
      } catch (siweError) {
        console.error('SIWE prepareMessage error:', siweError);
        throw new Error(`Failed to prepare SIWE message: ${siweError instanceof Error ? siweError.message : String(siweError)}`);
      }

      // Step 3: Sign message with wallet
      console.log('Requesting signature from wallet...');
      const signature = await signMessageAsync({ message: messageToSign });
      console.log('Signature received:', signature);

      // Step 4: Verify signature with backend
      console.log('Verifying signature with backend...');
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: messageToSign,
        signature,
      });
      console.log('Verification successful!');

      // Step 5: Store tokens
      localStorage.setItem('authToken', verifyResponse.data.accessToken);
      localStorage.setItem('refreshToken', verifyResponse.data.refreshToken);
      setIsAuthenticated(true);

      // Step 6: Fetch team data
      await fetchTeam();
      alert('Successfully signed in!');
    } catch (error: any) {
      console.error('=== SIGN-IN ERROR ===');
      console.error('Error object:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error response:', error?.response?.data);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Better error messages
      let errorMessage = 'Error signing in';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'You rejected the signature request';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInfluencer = (id: number) => {
    if (selectedInfluencers.includes(id)) {
      setSelectedInfluencers(prev => prev.filter(i => i !== id));
    } else {
      if (selectedInfluencers.length < 5) {
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
    if (selectedInfluencers.length >= 5) return;

    // Smart auto-pick: Fill remaining slots within budget
    const remaining = 5 - selectedInfluencers.length;
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

  const handleCreateTeam = async () => {
    if (!selectedContest) {
      alert('Please select a league');
      return;
    }

    if (!teamName || selectedInfluencers.length !== 5 || budgetUsed > TOTAL_BUDGET) {
      alert('Please enter a team name and select exactly 5 influencers within budget');
      return;
    }

    if (!captainId) {
      alert('Please select a captain (one influencer will get 2x points)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/api/league/team/create`,
        {
          team_name: teamName,
          influencer_ids: selectedInfluencers,
          captain_id: captainId,
          contest_id: selectedContest.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh team and leaderboard
      await fetchTeam();
      await fetchLeaderboard();

      // Switch to My Squad view to show the new team
      setCurrentView('squad');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating team');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (selectedInfluencers.length !== 5 || budgetUsed > TOTAL_BUDGET) {
      alert('Please select exactly 5 influencers within budget');
      return;
    }

    if (!captainId) {
      alert('Please select a captain (one influencer will get 2x points)');
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
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh team and leaderboard
      await fetchTeam();
      await fetchLeaderboard();

      // Switch to My Squad view to show the updated team
      setCurrentView('squad');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating team');
    } finally {
      setLoading(false);
    }
  };

  if (loading && availableInfluencers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-6">
            <Circle size={48} weight="bold" className="text-brand-500" />
          </div>
          <p className="text-xl text-gray-400">Loading Fantasy League...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <WelcomeModal />

      {/* View Tabs */}
      <div className="max-w-[1800px] mx-auto px-6 pt-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setCurrentView('draft')}
            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              currentView === 'draft'
                ? 'bg-brand-600 text-white shadow-soft-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Users size={24} weight="bold" />
            Draft Team
          </button>
          {team && (
            <button
              onClick={() => setCurrentView('squad')}
              className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                currentView === 'squad'
                  ? 'bg-brand-600 text-white shadow-soft-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Star size={24} weight="fill" />
              My Squad
            </button>
          )}
          <button
            onClick={() => setCurrentView('leaderboard')}
            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              currentView === 'leaderboard'
                ? 'bg-brand-600 text-white shadow-soft-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Trophy size={24} weight="bold" />
            Leaderboard
            {leaderboard.length > 0 && (
              <span className="bg-brand-500 text-white px-2 py-0.5 rounded-full text-sm font-bold">
                {leaderboard.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container - Two Column Layout */}
      <div className={`flex gap-6 p-6 max-w-[1800px] mx-auto ${currentView !== 'draft' ? 'hidden' : ''}`}>

        {/* LEFT SIDEBAR - Team Preview (Sticky) */}
        <div className="w-[380px] flex-shrink-0">
          <div className="sticky top-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ scrollbarWidth: 'thin' }}>
            {/* Team Name Card */}
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-5 shadow-soft-lg">
              {!team ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-white">Create Team</h2>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name..."
                    className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-500 transition-all text-white placeholder:text-gray-500"
                    maxLength={50}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold text-white">{team.team_name}</h2>
                    {team.rank && (
                      <div className="text-4xl font-black text-yellow-400">
                        #{team.rank}
                      </div>
                    )}
                  </div>
                  <p className="text-brand-500">{selectedInfluencers.length}/5 influencers</p>
                </>
              )}
            </div>

            {/* Selected Squad */}
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-5 shadow-soft-lg">
              <h3 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
                <Users size={22} weight="bold" className="text-brand-500" />
                Your Squad
              </h3>

              <div className="space-y-2">
                {[...Array(5)].map((_, index) => {
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
                        {isCaptain && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                            <Crown size={10} weight="fill" className="text-gray-900" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs truncate flex items-center gap-1">
                          {influencer.name}
                          {isCaptain && <span className="text-[9px] text-yellow-400 font-bold">(C)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">@{influencer.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400 text-xs">{parseFloat(influencer.price.toString()).toFixed(0)} pts</p>
                        {influencer.total_points !== undefined && (
                          <p className="text-[10px] text-brand-500">{influencer.total_points} pts {isCaptain && '× 2'}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setCaptainId(influencer.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          isCaptain
                            ? 'bg-yellow-500 text-gray-900'
                            : 'bg-gray-700 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400'
                        }`}
                        title="Make Captain (2x points)"
                      >
                        <Crown size={12} weight={isCaptain ? 'fill' : 'regular'} />
                      </button>
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
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-5 shadow-soft-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Budget</span>
                <span className={`text-2xl font-black ${budgetRemaining < 0 ? 'text-red-400' : 'text-brand-500'}`}>
                  {budgetUsed.toFixed(0)}/{TOTAL_BUDGET}
                </span>
              </div>
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    budgetRemaining < 0
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-brand-600'
                  }`}
                  style={{ width: `${Math.min((budgetUsed / TOTAL_BUDGET) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {budgetRemaining >= 0
                  ? `${budgetRemaining.toFixed(0)} pts remaining`
                  : `Over by ${Math.abs(budgetRemaining).toFixed(0)} pts`
                }
              </p>
            </div>

            {/* Deadline Info */}
            {selectedContest && (
              <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-2 border-orange-500/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Warning size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <div className="text-[11px] text-orange-200">
                    <p className="font-bold">Deadline: {new Date(selectedContest.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} 00:00 UTC</p>
                    <p className="text-orange-300/80 mt-0.5">Team locks when gameweek starts</p>
                  </div>
                </div>
              </div>
            )}
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
                  disabled={loading || !teamName || selectedInfluencers.length !== 5 || budgetUsed > TOTAL_BUDGET}
                  className="btn-primary w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-lg"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <TrendUp size={20} weight="bold" />
                    Create Team
                    <span className="badge-warning bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-xs">+50 XP</span>
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
                  disabled={loading || selectedInfluencers.length !== 5 || budgetUsed > TOTAL_BUDGET}
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

        {/* RIGHT MAIN AREA - Influencer Grid */}
        <div className="flex-1">
          {/* League Selector */}
          {contests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {contests.map((contestOption) => (
                <button
                  key={contestOption.id}
                  onClick={() => setSelectedContestId(contestOption.id)}
                  className={`card-hover relative p-4 rounded-lg border-2 transition-all text-left ${
                    selectedContestId === contestOption.id
                      ? contestOption.is_prize_league
                        ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-500/70 shadow-soft'
                        : 'bg-brand-500/10 border-brand-500/70 shadow-soft'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {contestOption.is_prize_league ? (
                          <>
                            <Trophy size={20} weight="fill" className="text-yellow-400" />
                            <span className="font-bold text-yellow-400">Prize League</span>
                          </>
                        ) : (
                          <>
                            <Users size={20} weight="bold" className="text-brand-500" />
                            <span className="font-bold text-brand-500">Free League</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-300">
                        {contestOption.is_prize_league ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-300 font-semibold">${parseFloat(contestOption.entry_fee).toFixed(2)} entry</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-green-400 font-semibold">${parseFloat(contestOption.prize_pool).toFixed(0)} pool</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {contestOption.total_participants}/{contestOption.max_participants} entered
                            </div>
                          </>
                        ) : (
                          <div>
                            No entry fee • {contestOption.total_participants} players
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedContestId === contestOption.id && (
                      <CheckCircle size={24} weight="fill" className={contestOption.is_prize_league ? 'text-yellow-400' : 'text-brand-500'} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contest Info Bar */}
          {selectedContest && (
            <div className="card bg-brand-500/10 border-2 border-brand-500/50 rounded-lg p-4 mb-4 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shadow-soft">
                  <Fire size={24} weight="fill" className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge-primary text-xs px-2 py-0.5 rounded-full font-bold">
                      {getQuarterFromDate(selectedContest.start_date)}
                    </span>
                    <p className="text-lg font-black text-white">
                      GW{getGameweekNumber(selectedContest.start_date)}
                    </p>
                  </div>
                  <p className="text-xs text-brand-300 font-semibold mt-1">
                    {new Date(selectedContest.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(selectedContest.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-300 font-bold">Deadline</p>
                <p className="text-xl font-black text-white">{new Date(selectedContest.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p className="text-[10px] text-brand-400 mt-0.5">00:00 UTC</p>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-6 mb-6 shadow-soft-lg">
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
                  onChange={(e) => setSortBy(e.target.value as any)}
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
                <span className="badge-primary bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full font-bold">{filteredInfluencers.length} influencers</span>
                {' '}shown of {availableInfluencers.length} total
              </p>

              {selectedInfluencers.length < 5 && isAuthenticated && (
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
                if (formScore >= 70) return { text: 'Hot', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/50' };
                if (formScore >= 40) return { text: 'Steady', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/50' };
                return { text: 'Cold', color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/50' };
              };
              const form = getFormInfo();

              return (
                <button
                  key={influencer.id}
                  onClick={() => handleSelectInfluencer(influencer.id)}
                  disabled={!isSelected && selectedInfluencers.length >= 5}
                  className={`card-hover relative p-6 rounded-lg border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? `${rarity.border} bg-gradient-to-br ${rarity.gradient} ${rarity.glow} scale-[1.02]`
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-gray-600 hover:scale-[1.02] hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {/* Top Badges Row */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
                    {/* Form Badge */}
                    <div className={`${form.bg} border-2 px-2 py-1 rounded-full flex items-center gap-1 shadow-soft`}>
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
                    <div className={`w-24 h-24 mx-auto rounded-full border-4 ${isSelected ? 'border-white' : 'border-gray-600'} shadow-soft overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 ${formScore >= 70 ? 'ring-2 ring-orange-500/50 ring-offset-2 ring-offset-gray-900' : ''}`}>
                      {influencer.profile_image_url ? (
                        <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
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
            <div className="text-center py-20">
              <div className="mb-4">
                <MagnifyingGlass size={64} weight="bold" className="text-gray-600 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No influencers found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* My Squad View */}
      {currentView === 'squad' && team && (
        <div className="max-w-[1400px] mx-auto px-6 pb-6">
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-8 shadow-soft-lg">
            {/* Squad Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-gradient-to-br ${colorSchemes[teamColor as keyof typeof colorSchemes].gradient} rounded-lg shadow-soft`}>
                  {(() => {
                    const BadgeIcon = badges[teamBadge as keyof typeof badges].icon;
                    return <BadgeIcon size={32} weight="fill" className="text-white" />;
                  })()}
                </div>
                <div>
                  <h2 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${colorSchemes[teamColor as keyof typeof colorSchemes].gradient}`}>{team.team_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-primary text-xs px-2 py-0.5 rounded-full font-bold">
                      {getQuarterFromDate(selectedContest?.start_date || '')}
                    </span>
                    <p className="text-brand-300 font-bold">5 CT Kings Selected</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setShowPersonalization(!showPersonalization)}
                  className="btn-primary px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center gap-2 shadow-soft"
                >
                  <Sparkle size={20} weight="fill" />
                  Customize Team
                </button>
                <div className="text-right">
                  <p className="text-sm text-brand-300 font-bold mb-1">Contest Rank</p>
                  <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    #{team.rank || '–'}
                  </p>
                </div>
              </div>
            </div>

            {/* Personalization Panel */}
            {showPersonalization && (
              <div className="mb-8 card bg-brand-500/10 border-2 border-brand-500/50 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkle size={24} weight="fill" className="text-brand-400" />
                  Personalize Your Squad
                </h3>

                {/* Badge Selector */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-brand-300 mb-3">Team Badge</p>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(badges).map(([key, badge]) => {
                      const BadgeIcon = badge.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTeamBadge(key)}
                          className={`card-hover p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                            teamBadge === key
                              ? 'bg-brand-600 border-brand-400 shadow-soft'
                              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <BadgeIcon size={32} weight="fill" className="text-white mx-auto mb-2" />
                            <p className="text-xs font-bold text-white">{badge.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <p className="text-sm font-bold text-brand-300 mb-3">Team Colors</p>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(colorSchemes).map(([key, scheme]) => (
                      <button
                        key={key}
                        onClick={() => setTeamColor(key)}
                        className={`card-hover p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          teamColor === key
                            ? `bg-gradient-to-br ${scheme.gradient} border-white shadow-soft`
                            : `bg-gradient-to-br ${scheme.gradient} opacity-60 border-gray-700 hover:opacity-100`
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-sm font-black text-white">{scheme.name}</p>
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                            <div className="w-3 h-3 rounded-full bg-white/60"></div>
                            <div className="w-3 h-3 rounded-full bg-white/30"></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-brand-300">
                    Changes apply instantly to your squad view
                  </p>
                  <button
                    onClick={() => setShowPersonalization(false)}
                    className="btn-primary px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold text-white transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={20} weight="fill" />
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Team Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className={`card bg-gradient-to-br ${colorSchemes[teamColor as keyof typeof colorSchemes].gradient} bg-opacity-20 border-2 ${colorSchemes[teamColor as keyof typeof colorSchemes].border} border-opacity-50 p-6`}>
                <p className={`text-sm ${colorSchemes[teamColor as keyof typeof colorSchemes].text} opacity-80 font-bold mb-2`}>Total Foresight</p>
                <p className={`text-5xl font-black ${colorSchemes[teamColor as keyof typeof colorSchemes].text}`}>{team.total_score}</p>
                <p className={`text-xs ${colorSchemes[teamColor as keyof typeof colorSchemes].text} opacity-80 mt-2`}>Points Scored</p>
              </div>
              <div className="card bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border-2 border-yellow-500/50 p-6">
                <p className="text-sm text-yellow-300 font-bold mb-2">Budget Spent</p>
                <p className="text-5xl font-black text-yellow-400">{budgetUsed.toFixed(0)}<span className="text-2xl">/{TOTAL_BUDGET}</span></p>
                <p className="text-xs text-yellow-300 mt-2">{(TOTAL_BUDGET - budgetUsed).toFixed(0)} pts left</p>
              </div>
              <div className="card bg-brand-500/10 border-2 border-brand-500/50 p-6">
                <p className="text-sm text-brand-300 font-bold mb-2">Top Performer</p>
                <p className="text-3xl font-black text-brand-400">
                  {team.picks.reduce((max: any, p: any) => p.total_points > (max?.total_points || 0) ? p : max, team.picks[0])?.influencer_name?.split(' ')[0] || 'N/A'}
                </p>
                <p className="text-xs text-brand-300 mt-2">{team.picks.reduce((max: any, p: any) => p.total_points > (max?.total_points || 0) ? p : max, team.picks[0])?.total_points || 0} pts</p>
              </div>
              <div className="card bg-gradient-to-br from-orange-600/20 to-red-600/20 border-2 border-orange-500/50 p-6">
                <p className="text-sm text-orange-300 font-bold mb-2">Contest Ends In</p>
                {(() => {
                  if (!selectedContest) return <p className="text-3xl font-bold text-orange-400">N/A</p>;

                  const endDate = new Date(selectedContest.end_date);
                  const now = new Date();
                  const diff = endDate.getTime() - now.getTime();
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                  if (diff <= 0) {
                    return (
                      <>
                        <p className="text-3xl font-bold text-red-400">CLOSED</p>
                        <p className="text-xs text-red-300 mt-2">Contest ended</p>
                      </>
                    );
                  }

                  return (
                    <>
                      <p className="text-3xl font-black text-orange-400">
                        {days}d {hours}h
                      </p>
                      <p className="text-xs text-orange-300 mt-2">
                        {team.is_locked ? 'Team locked' : 'Lock before deadline'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Squad Members */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={24} weight="bold" className="text-brand-500" />
                  Squad Members
                </h3>
                {/* View Toggle */}
                <div className="flex bg-gray-800 rounded-lg border-2 border-gray-700">
                  <button
                    onClick={() => setSquadViewMode('formation')}
                    className={`px-4 py-2 rounded-l-lg font-bold text-sm transition-all ${
                      squadViewMode === 'formation' ? 'bg-brand-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    Formation
                  </button>
                  <button
                    onClick={() => setSquadViewMode('list')}
                    className={`px-4 py-2 rounded-r-lg font-bold text-sm transition-all ${
                      squadViewMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Formation View - 5-a-Side Pitch */}
              {squadViewMode === 'formation' && (
                <div className="relative rounded-xl border-2 border-gray-700 overflow-hidden min-h-[700px]">
                  {/* Pitch Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-gray-900/80 to-gray-900/90"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>

                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/10 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/20 rounded-full"></div>

                  {/* Grid Lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5"></div>
                  </div>

                  {/* Formation: 5-a-Side Layout */}
                  <div className="relative z-10 p-12 h-[700px] flex items-center justify-center">
                    <div className="relative w-full max-w-4xl mx-auto">
                      {/* Position players in a 2-1-2 formation */}
                      <div className="space-y-16">
                        {/* Top Row - 2 Forwards */}
                        <div className="flex justify-center gap-24">
                          {team.picks.slice(0, 2).map((pick: any, index: number) => {
                            const rarity = getRarityInfo(pick.tier || pick.influencer_tier || 'C');
                            const isCaptain = pick.is_captain;

                            return (
                              <div key={pick.id} className="relative group">
                                {/* Captain Badge */}
                                {isCaptain && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                    <div className="badge-warning bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-soft border-2 border-yellow-300">
                                      <Crown size={14} weight="fill" className="text-white" />
                                      <span className="text-xs font-black text-white">CAPTAIN</span>
                                    </div>
                                  </div>
                                )}

                                {/* Player Card */}
                                <div className={`relative`}>
                                  <div className={`card-hover relative bg-gradient-to-br ${rarity.gradient} p-1 rounded-lg shadow-soft-lg transition-all group-hover:scale-110 ${isCaptain ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}`}>
                                    <div className="bg-gray-900 rounded-lg p-4 w-40">
                                      {/* Avatar */}
                                      <div className="relative w-20 h-20 mx-auto mb-2">
                                        <div className={`w-full h-full rounded-full border-4 ${isCaptain ? 'border-yellow-400' : 'border-white/20'} overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 shadow-soft`}>
                                          {pick.profile_image_url ? (
                                            <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                                              <Users size={32} weight="bold" />
                                            </div>
                                          )}
                                        </div>
                                        {/* Tier Badge */}
                                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${rarity.badge} px-2 py-1 rounded-full shadow-soft text-xs font-black text-white`}>
                                          {pick.tier || pick.influencer_tier || 'C'}
                                        </div>
                                      </div>

                                      {/* Name */}
                                      <h4 className="text-center text-sm font-black text-white mb-0.5 line-clamp-1">{pick.influencer_name?.split(' ')[0]}</h4>
                                      <p className="text-center text-[10px] text-gray-400 mb-2 line-clamp-1">@{pick.influencer_handle}</p>

                                      {/* Stats */}
                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-brand-400 font-bold">{pick.total_points || 0}</p>
                                          <p className="text-[9px] text-gray-500">PTS</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-700"></div>
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-yellow-400 font-bold">{parseFloat(pick.price || 15).toFixed(0)}</p>
                                          <p className="text-[9px] text-gray-500">COST</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Captain 2x Multiplier Indicator */}
                                  {isCaptain && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 px-2 py-0.5 rounded-full shadow-soft">
                                      <span className="text-xs font-black text-gray-900">2X</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Middle Row - 1 Midfielder */}
                        <div className="flex justify-center">
                          {team.picks.slice(2, 3).map((pick: any) => {
                            const rarity = getRarityInfo(pick.tier || pick.influencer_tier || 'C');
                            const isCaptain = pick.is_captain;

                            return (
                              <div key={pick.id} className="relative group">
                                {isCaptain && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                    <div className="badge-warning bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-soft border-2 border-yellow-300">
                                      <Crown size={14} weight="fill" className="text-white" />
                                      <span className="text-xs font-black text-white">CAPTAIN</span>
                                    </div>
                                  </div>
                                )}

                                <div className={`relative`}>
                                  <div className={`card-hover relative bg-gradient-to-br ${rarity.gradient} p-1 rounded-lg shadow-soft-lg transition-all group-hover:scale-110 ${isCaptain ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}`}>
                                    <div className="bg-gray-900 rounded-lg p-4 w-40">
                                      <div className="relative w-20 h-20 mx-auto mb-2">
                                        <div className={`w-full h-full rounded-full border-4 ${isCaptain ? 'border-yellow-400' : 'border-white/20'} overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 shadow-soft`}>
                                          {pick.profile_image_url ? (
                                            <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                                              <Users size={32} weight="bold" />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${rarity.badge} px-2 py-1 rounded-full shadow-soft text-xs font-black text-white`}>
                                          {pick.tier || pick.influencer_tier || 'C'}
                                        </div>
                                      </div>

                                      <h4 className="text-center text-sm font-black text-white mb-0.5 line-clamp-1">{pick.influencer_name?.split(' ')[0]}</h4>
                                      <p className="text-center text-[10px] text-gray-400 mb-2 line-clamp-1">@{pick.influencer_handle}</p>

                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-brand-400 font-bold">{pick.total_points || 0}</p>
                                          <p className="text-[9px] text-gray-500">PTS</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-700"></div>
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-yellow-400 font-bold">{parseFloat(pick.price || 15).toFixed(0)}</p>
                                          <p className="text-[9px] text-gray-500">COST</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {isCaptain && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 px-2 py-0.5 rounded-full shadow-soft">
                                      <span className="text-xs font-black text-gray-900">2X</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Row - 2 Defenders */}
                        <div className="flex justify-center gap-24">
                          {team.picks.slice(3, 5).map((pick: any) => {
                            const rarity = getRarityInfo(pick.tier || pick.influencer_tier || 'C');
                            const isCaptain = pick.is_captain;

                            return (
                              <div key={pick.id} className="relative group">
                                {isCaptain && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                    <div className="badge-warning bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-soft border-2 border-yellow-300">
                                      <Crown size={14} weight="fill" className="text-white" />
                                      <span className="text-xs font-black text-white">CAPTAIN</span>
                                    </div>
                                  </div>
                                )}

                                <div className={`relative`}>
                                  <div className={`card-hover relative bg-gradient-to-br ${rarity.gradient} p-1 rounded-lg shadow-soft-lg transition-all group-hover:scale-110 ${isCaptain ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}`}>
                                    <div className="bg-gray-900 rounded-lg p-4 w-40">
                                      <div className="relative w-20 h-20 mx-auto mb-2">
                                        <div className={`w-full h-full rounded-full border-4 ${isCaptain ? 'border-yellow-400' : 'border-white/20'} overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 shadow-soft`}>
                                          {pick.profile_image_url ? (
                                            <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                                              <Users size={32} weight="bold" />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${rarity.badge} px-2 py-1 rounded-full shadow-soft text-xs font-black text-white`}>
                                          {pick.tier || pick.influencer_tier || 'C'}
                                        </div>
                                      </div>

                                      <h4 className="text-center text-sm font-black text-white mb-0.5 line-clamp-1">{pick.influencer_name?.split(' ')[0]}</h4>
                                      <p className="text-center text-[10px] text-gray-400 mb-2 line-clamp-1">@{pick.influencer_handle}</p>

                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-brand-400 font-bold">{pick.total_points || 0}</p>
                                          <p className="text-[9px] text-gray-500">PTS</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-700"></div>
                                        <div className="text-center flex-1">
                                          <p className="text-xs text-yellow-400 font-bold">{parseFloat(pick.price || 15).toFixed(0)}</p>
                                          <p className="text-[9px] text-gray-500">COST</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {isCaptain && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 px-2 py-0.5 rounded-full shadow-soft">
                                      <span className="text-xs font-black text-gray-900">2X</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formation Label */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-full border border-gray-700">
                    <span className="text-xs font-bold text-gray-400">2-1-2 FORMATION</span>
                  </div>
                </div>
              )}

              {/* List View */}
              {squadViewMode === 'list' && (
                <div className="grid grid-cols-1 gap-4">
                {team.picks.map((pick: any, index: number) => {
                  const rarity = getRarityInfo(pick.tier || pick.influencer_tier || 'C');
                  const RarityIcon = rarity.icon;

                  return (
                    <div
                      key={pick.id}
                      className="card-hover bg-gradient-to-r from-gray-800 to-gray-800/50 p-6 border-2 border-gray-700 hover:border-brand-500/50 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        {/* Pick Number */}
                        <div className="text-center">
                          <div className="text-3xl font-black text-gray-600">#{index + 1}</div>
                        </div>

                        {/* Profile Image */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-gray-700 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                            {pick.profile_image_url ? (
                              <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                                <Users size={40} weight="bold" />
                              </div>
                            )}
                          </div>
                          <div className={`absolute -bottom-2 -right-2 ${rarity.badge} px-3 py-1 rounded-full flex items-center gap-1 shadow-soft`}>
                            <RarityIcon size={16} weight="fill" className="text-white" />
                            <span className="text-xs font-bold text-white">{pick.tier || pick.influencer_tier}</span>
                          </div>
                        </div>

                        {/* Influencer Details */}
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-white mb-1">{pick.influencer_name}</h4>
                          <p className="text-gray-400 text-sm mb-2">@{pick.influencer_handle}</p>
                          <div className={`inline-block ${rarity.badge} px-3 py-1 rounded-full`}>
                            <span className="text-xs font-bold text-white">{rarity.label}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Cost</p>
                            <p className="text-2xl font-black text-yellow-400">{parseFloat(pick.price || 15).toFixed(0)} pts</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Score</p>
                            <p className="text-2xl font-black text-brand-400">{pick.total_points || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setCurrentView('draft')}
                className={`btn-primary flex-1 py-4 bg-gradient-to-r ${colorSchemes[teamColor as keyof typeof colorSchemes].gradient} hover:opacity-90 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-soft-lg`}
              >
                <span className="flex items-center gap-2 justify-center">
                  <TrendUp size={24} weight="bold" />
                  Adjust Lineup
                </span>
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="btn-primary flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-soft-lg"
              >
                <span className="flex items-center gap-2 justify-center">
                  <Trophy size={24} weight="bold" />
                  Check Rankings
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard View */}
      {currentView === 'leaderboard' && (
        <div className="max-w-[1400px] mx-auto px-6 pb-6">
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-8 shadow-soft-lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg">
                  <Trophy size={32} weight="bold" className="text-gray-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge-primary text-xs px-2 py-0.5 rounded-full font-bold">
                      {getQuarterFromDate(selectedContest?.start_date || '')}
                    </span>
                    <h2 className="text-3xl font-black text-white">Contest Leaderboard</h2>
                  </div>
                  <p className="text-gray-400 mt-1">Top CT Draft teams this month</p>
                </div>
              </div>
              {team && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Your Team</p>
                  <p className="text-2xl font-black text-brand-400">#{team.rank || '–'}</p>
                </div>
              )}
            </div>

            {/* Leaderboard Content */}
            {leaderboard.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-4">
                  <Trophy size={64} weight="bold" className="text-gray-600 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No teams yet</h3>
                <p className="text-gray-400">Be the first to create a team!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
                      <Trophy size={24} weight="fill" className="text-yellow-400" />
                      Top 3 Champions
                    </h3>
                    <div className="flex items-end justify-center gap-6 mb-8">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center flex-1 max-w-xs">
                        <div className={`card w-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-gray-400 p-6 shadow-soft-lg ${team?.id === leaderboard[1]?.id ? 'ring-4 ring-brand-400' : ''}`} style={{ height: '220px' }}>
                          <div className="flex flex-col items-center h-full justify-between">
                            <div className="text-6xl mb-3">
                              <Medal size={64} weight="fill" className="text-white" />
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-sm text-gray-200 font-bold mb-2">#2</div>
                              <h4 className="font-black text-white text-lg mb-2 line-clamp-1">{leaderboard[1]?.team_name}</h4>
                              {team?.id === leaderboard[1]?.id && (
                                <span className="badge-primary inline-block px-2 py-1 rounded-full text-xs font-bold mb-2">YOU</span>
                              )}
                            </div>
                            <div className="text-center mt-auto">
                              <p className="text-sm text-gray-200 mb-1">Score</p>
                              <p className="text-3xl font-black text-white">{leaderboard[1]?.total_score}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-20 bg-gray-400/20 border-2 border-gray-400/30 border-t-0 rounded-b-lg flex items-center justify-center">
                          <span className="text-gray-400 font-bold">SILVER</span>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="flex flex-col items-center flex-1 max-w-xs">
                        <div className={`card w-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-yellow-400 p-6 shadow-soft-lg ${team?.id === leaderboard[0]?.id ? 'ring-4 ring-brand-400' : ''}`} style={{ height: '280px' }}>
                          <div className="flex flex-col items-center h-full justify-between">
                            <div className="text-7xl mb-3">
                              <Trophy size={72} weight="fill" className="text-gray-900" />
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-sm text-amber-900 font-bold mb-2">#1</div>
                              <h4 className="font-black text-gray-900 text-xl mb-2 line-clamp-1">{leaderboard[0]?.team_name}</h4>
                              {team?.id === leaderboard[0]?.id && (
                                <span className="badge-primary inline-block px-2 py-1 rounded-full text-xs font-bold mb-2">YOU</span>
                              )}
                              <div className="flex items-center justify-center gap-1 mt-2">
                                <Crown size={20} weight="fill" className="text-amber-900" />
                                <span className="text-xs font-black text-amber-900">CHAMPION</span>
                              </div>
                            </div>
                            <div className="text-center mt-auto">
                              <p className="text-sm text-amber-900 mb-1">Score</p>
                              <p className="text-4xl font-black text-gray-900">{leaderboard[0]?.total_score}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-24 bg-yellow-400/20 border-2 border-yellow-400/30 border-t-0 rounded-b-lg flex items-center justify-center">
                          <span className="text-yellow-400 font-bold">GOLD</span>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center flex-1 max-w-xs">
                        <div className={`card w-full bg-gradient-to-br from-orange-600 to-amber-800 border-2 border-orange-600 p-6 shadow-soft-lg ${team?.id === leaderboard[2]?.id ? 'ring-4 ring-brand-400' : ''}`} style={{ height: '180px' }}>
                          <div className="flex flex-col items-center h-full justify-between">
                            <div className="text-5xl mb-3">
                              <Medal size={56} weight="fill" className="text-white" />
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-sm text-orange-200 font-bold mb-2">#3</div>
                              <h4 className="font-black text-white text-base mb-2 line-clamp-1">{leaderboard[2]?.team_name}</h4>
                              {team?.id === leaderboard[2]?.id && (
                                <span className="badge-primary inline-block px-2 py-1 rounded-full text-xs font-bold mb-2">YOU</span>
                              )}
                            </div>
                            <div className="text-center mt-auto">
                              <p className="text-sm text-orange-200 mb-1">Score</p>
                              <p className="text-2xl font-black text-white">{leaderboard[2]?.total_score}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-16 bg-orange-600/20 border-2 border-orange-600/30 border-t-0 rounded-b-lg flex items-center justify-center">
                          <span className="text-orange-400 font-bold">BRONZE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rest of Leaderboard */}
                {leaderboard.length > 3 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
                      <TrendUp size={20} weight="bold" />
                      All Rankings
                    </h3>
                    <div className="space-y-3">
                      {leaderboard.slice(3).map((entry, index) => {
                        const isMyTeam = team?.id === entry.id;
                        const actualRank = index + 4;

                        return (
                          <div
                            key={entry.id}
                            className={`card-hover flex items-center gap-6 p-5 border-2 transition-all ${
                              isMyTeam
                                ? 'bg-brand-500/10 border-brand-400 shadow-soft'
                                : 'bg-gradient-to-r from-gray-800 to-gray-800/50 border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            {/* Rank */}
                            <div className="w-12 text-center">
                              <div className="text-2xl font-black text-gray-400">#{actualRank}</div>
                            </div>

                            {/* Team Name */}
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {entry.team_name}
                                {isMyTeam && (
                                  <span className="badge-primary px-3 py-1 rounded-full text-xs font-bold">
                                    YOU
                                  </span>
                                )}
                              </h3>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                              <p className="text-xs text-gray-400 mb-1">Total Score</p>
                              <p className="text-2xl font-black text-brand-400">{entry.total_score}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show first 3 normally if less than 3 entries */}
                {leaderboard.length < 3 && leaderboard.length > 0 && (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const isMyTeam = team?.id === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={`card-hover flex items-center gap-6 p-6 border-2 transition-all ${
                            isMyTeam
                              ? 'bg-brand-500/10 border-brand-400 shadow-soft'
                              : 'bg-gradient-to-r from-gray-800 to-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="w-16 text-center">
                            <div className="text-3xl font-black text-gray-400">#{entry.rank}</div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {entry.team_name}
                              {isMyTeam && (
                                <span className="badge-primary px-3 py-1 rounded-full text-xs font-bold">YOU</span>
                              )}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400 mb-1">Total Score</p>
                            <p className="text-3xl font-black text-brand-400">{entry.total_score}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Back to Draft Button */}
            {!team && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setCurrentView('draft')}
                  className="btn-primary px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-soft-lg"
                >
                  <span className="flex items-center gap-2">
                    <Users size={24} weight="bold" />
                    Create Your Team
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
