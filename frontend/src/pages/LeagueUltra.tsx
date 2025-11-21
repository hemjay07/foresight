/**
 * CT Fantasy League Page - Ultra Premium Edition
 * Two-column layout with live team preview and advanced filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import {
  Trophy, Users, Lock, CheckCircle, TrendUp, Warning,
  MagnifyingGlass, Sparkle, Crown, Star, Fire,
  CaretDown, X
} from '@phosphor-icons/react';
import WelcomeModal from '../components/WelcomeModal';
import { formatFollowerCount } from '../utils/formatFollowers';

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
}

export default function LeagueUltra() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // State
  const [contest, setContest] = useState<Contest | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableInfluencers, setAvailableInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // New filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price' | 'followers' | 'name'>('price');

  // Rarity mapping
  const getRarityInfo = (tier: string) => {
    const rarities: Record<string, { label: string; gradient: string; badge: string; icon: any }> = {
      S: {
        label: 'Legendary',
        gradient: 'from-amber-400 via-yellow-500 to-amber-600',
        badge: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        icon: Crown
      },
      A: {
        label: 'Epic',
        gradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
        badge: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
        icon: Sparkle
      },
      B: {
        label: 'Rare',
        gradient: 'from-blue-400 via-cyan-500 to-blue-600',
        badge: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        icon: Star
      },
      C: {
        label: 'Common',
        gradient: 'from-gray-400 via-gray-500 to-gray-600',
        badge: 'bg-gradient-to-r from-gray-400 to-gray-500',
        icon: Fire
      }
    };
    return rarities[tier] || rarities.C;
  };

  // Computed values
  const budgetUsed = useMemo(() => {
    return availableInfluencers
      .filter(inf => selectedInfluencers.includes(inf.id))
      .reduce((sum, inf) => sum + parseFloat(inf.price.toString()), 0);
  }, [selectedInfluencers, availableInfluencers]);

  const budgetRemaining = 100 - budgetUsed;

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
    if (isConnected && token) {
      fetchTeam();
    }
  }, [isConnected, address]);

  const fetchContest = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/league/contest/current`);
      setContest(response.data.contest);
    } catch (error) {
      console.error('Error fetching contest:', error);
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
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/league/team/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.team) {
        setTeam(response.data.team);
        setTeamName(response.data.team.team_name);
        setSelectedInfluencers(response.data.team.picks.map((p: Pick) => p.id));
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching team:', error);
      }
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
      console.log('SIWE config:', siweConfig);

      const message = new SiweMessage(siweConfig);
      console.log('SIWE message created');

      let messageToSign: string;
      try {
        messageToSign = message.prepareMessage();
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
      console.error('Error signing in:', error);

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

  const handleCreateTeam = async () => {
    if (!teamName || selectedInfluencers.length !== 5 || budgetUsed > 100) {
      alert('Please enter a team name and select exactly 5 influencers within budget');
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
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchTeam();
      alert('Team created successfully! +50 XP');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating team');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (selectedInfluencers.length !== 5 || budgetUsed > 100) {
      alert('Please select exactly 5 influencers within budget');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/api/league/team/update`,
        { influencer_ids: selectedInfluencers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchTeam();
      alert('Team updated successfully!');
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
          <div className="animate-spin text-6xl mb-6">⚡</div>
          <p className="text-xl text-gray-400">Loading Fantasy League...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <WelcomeModal />

      {/* Main Container - Two Column Layout */}
      <div className="flex gap-6 p-6 max-w-[1800px] mx-auto">

        {/* LEFT SIDEBAR - Team Preview (Sticky) */}
        <div className="w-[380px] flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            {/* Team Name Card */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-6 shadow-2xl">
              {!team ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-white">Create Team</h2>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name..."
                    className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 transition-all text-white placeholder:text-gray-500"
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
                  <p className="text-cyan-400">{selectedInfluencers.length}/5 influencers</p>
                </>
              )}
            </div>

            {/* Selected Squad */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-6 shadow-2xl">
              <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                <Users size={24} weight="bold" className="text-cyan-400" />
                Your Squad
              </h3>

              <div className="space-y-3">
                {[...Array(5)].map((_, index) => {
                  const influencer = selectedInfluencerObjects[index];

                  if (!influencer) {
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Empty slot</p>
                        </div>
                      </div>
                    );
                  }

                  const rarity = getRarityInfo(influencer.tier);

                  return (
                    <div key={influencer.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-xl border-2 border-gray-700 hover:border-cyan-500/50 transition-all group">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                          {influencer.profile_image_url ? (
                            <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${rarity.badge} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                          {influencer.tier}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{influencer.name}</p>
                        <p className="text-xs text-gray-400">@{influencer.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400 text-sm">{parseFloat(influencer.price.toString()).toFixed(0)} pts</p>
                        {influencer.total_points !== undefined && (
                          <p className="text-xs text-cyan-400">{influencer.total_points} pts</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSelectInfluencer(influencer.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} weight="bold" className="text-red-400 hover:text-red-300" />
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
                    <span className="text-3xl font-black text-cyan-400">{team.total_score}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Budget Tracker */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Budget</span>
                <span className={`text-2xl font-black ${budgetRemaining < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {budgetUsed.toFixed(0)}/100
                </span>
              </div>
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    budgetRemaining < 0
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min((budgetUsed / 100) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {budgetRemaining >= 0
                  ? `${budgetRemaining.toFixed(0)} pts remaining`
                  : `Over by ${Math.abs(budgetRemaining).toFixed(0)} pts`
                }
              </p>
            </div>

            {/* Action Button */}
            <div>
              {!isAuthenticated ? (
                <button
                  onClick={handleManualSignIn}
                  disabled={!isConnected || loading}
                  className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-cyan-500/30"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <Lock size={24} weight="bold" />
                    {!isConnected ? 'Connect Wallet' : 'Sign In'}
                  </span>
                </button>
              ) : !team ? (
                <button
                  onClick={handleCreateTeam}
                  disabled={loading || !teamName || selectedInfluencers.length !== 5 || budgetUsed > 100}
                  className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-green-500/30"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <TrendUp size={24} weight="bold" />
                    Create Team
                    <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-sm">+50 XP</span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleUpdateTeam}
                  disabled={loading || selectedInfluencers.length !== 5 || budgetUsed > 100}
                  className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-cyan-500/30"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <TrendUp size={24} weight="bold" />
                    Update Team
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT MAIN AREA - Influencer Grid */}
        <div className="flex-1">
          {/* Search and Filters */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-6 mb-6 shadow-2xl">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search influencers by name or handle..."
                className="w-full pl-12 pr-4 py-4 bg-gray-900/80 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 transition-all text-white placeholder:text-gray-500 text-lg"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-400 font-semibold">Filter:</span>
              {['All', 'S', 'A', 'B', 'C'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    selectedTier === tier
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tier === 'All' ? 'All Tiers' : `${tier}-Tier`}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-400 font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-gray-800 border-2 border-gray-700 rounded-xl text-white font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="followers">Followers (High to Low)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Showing <span className="text-cyan-400 font-bold">{filteredInfluencers.length}</span> of <span className="text-white font-bold">{availableInfluencers.length}</span> influencers
              </p>
            </div>
          </div>

          {/* Influencer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInfluencers.map((influencer) => {
              const isSelected = selectedInfluencers.includes(influencer.id);
              const rarity = getRarityInfo(influencer.tier);
              const RarityIcon = rarity.icon;

              return (
                <button
                  key={influencer.id}
                  onClick={() => handleSelectInfluencer(influencer.id)}
                  disabled={!isSelected && selectedInfluencers.length >= 5}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? `border-cyan-400 bg-gradient-to-br ${rarity.gradient} shadow-2xl shadow-cyan-500/30 scale-105`
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-gray-600 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {/* Rarity Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`${rarity.badge} px-3 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                      <RarityIcon size={14} weight="fill" className="text-white" />
                      <span className="text-xs font-bold text-white">{rarity.label}</span>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="mb-4">
                    <div className={`w-24 h-24 mx-auto rounded-full border-4 ${isSelected ? 'border-white' : 'border-gray-600'} shadow-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800`}>
                      {influencer.profile_image_url ? (
                        <img src={influencer.profile_image_url} alt={influencer.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
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
                      <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400 mb-1">Score</p>
                        <p className="font-bold text-white text-sm">{influencer.total_points}</p>
                      </div>
                    )}

                    {/* Cost */}
                    <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400 mb-1">Cost</p>
                      <p className="font-bold text-yellow-400 text-sm">{parseFloat(influencer.price.toString()).toFixed(0)} pts</p>
                    </div>

                    {/* Followers */}
                    {influencer.follower_count && (
                      <div className="bg-gray-900/60 backdrop-blur rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400 mb-1">Followers</p>
                        <p className="font-bold text-cyan-400 text-sm">
                          {formatFollowerCount(influencer.follower_count)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Draft Button */}
                  <div className={`py-3 rounded-xl text-center font-bold transition-all ${
                    isSelected
                      ? 'bg-white/20 backdrop-blur text-white'
                      : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 group-hover:from-cyan-500/30 group-hover:to-blue-500/30'
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
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">No influencers found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
