/**
 * CT Fantasy League Page
 * Team management, picks, and contest leaderboard
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { Trophy, Users, Lock, CheckCircle, TrendUp, Warning } from '@phosphor-icons/react';

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

export default function League() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [contest, setContest] = useState<Contest | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableInfluencers, setAvailableInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [teamName, setTeamName] = useState('');
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'team' | 'leaderboard' | 'private'>('team');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Private leagues state
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [entryFee, setEntryFee] = useState('0');
  const [maxMembers, setMaxMembers] = useState('10');
  const [prizeDistribution, setPrizeDistribution] = useState('winner_takes_all');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    // Check if authenticated
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    // Always fetch public data
    fetchContest();
    fetchInfluencers();
    fetchLeaderboard();

    // Only fetch user-specific data if authenticated
    if (isConnected && token) {
      fetchTeam();
      if (view === 'private') {
        fetchMyLeagues();
      }
    }
  }, [isConnected, address, view]);

  const handleManualSignIn = async () => {
    if (!address || !chainId) return;

    try {
      setLoading(true);
      setAuthError(null);
      console.log('🔐 Manual sign-in with SIWE...');

      // Step 1: Get nonce from backend
      const nonceResponse = await axios.get(`${API_URL}/api/auth/nonce`);
      const nonce = nonceResponse.data.nonce;

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to CT Draft',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });

      const messageToSign = message.prepareMessage();

      // Step 3: Sign message
      const signature = await signMessageAsync({ message: messageToSign });

      // Step 4: Verify and get tokens
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: messageToSign,
        signature,
      });

      const { accessToken, refreshToken } = verifyResponse.data;

      // Step 5: Store tokens
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      console.log('✅ Sign-in successful!');
      setIsAuthenticated(true);

      // Reload page to fetch data with new auth
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Sign-in failed:', error);
      setAuthError(error.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  const fetchContest = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/league/contest/current`, {
        headers,
      });

      setContest(response.data.contest);
    } catch (error) {
      console.error('Error fetching contest:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/league/team/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.team) {
        setTeam(response.data.team);
        setSelectedInfluencers(response.data.team.picks.map((p: Pick) => p.id));
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchInfluencers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/league/influencers`, {
        headers,
      });

      setAvailableInfluencers(response.data.influencers);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/league/leaderboard`, {
        headers,
      });

      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleSelectInfluencer = (id: number) => {
    if (team?.is_locked) return;

    if (selectedInfluencers.includes(id)) {
      setSelectedInfluencers(selectedInfluencers.filter((i) => i !== id));
    } else if (selectedInfluencers.length < 5) {
      // Check budget constraint
      const selectedInfluencersData = availableInfluencers.filter((inf) =>
        [...selectedInfluencers, id].includes(inf.id)
      );
      const totalCost = selectedInfluencersData.reduce((sum, inf) => sum + inf.price, 0);

      if (totalCost > 100) {
        alert(`Budget exceeded! Total cost: ${totalCost.toFixed(0)} pts (Max: 100 pts)`);
        return;
      }

      setSelectedInfluencers([...selectedInfluencers, id]);
    }
  };

  // Private league functions
  const fetchMyLeagues = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/private-leagues/my-leagues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyLeagues(response.data.leagues || []);
    } catch (error) {
      console.error('Error fetching my leagues:', error);
    }
  };

  const handleCreatePrivateLeague = async () => {
    if (!leagueName.trim()) {
      alert('Please enter a league name');
      return;
    }

    const fee = parseFloat(entryFee);
    if (fee < 0 || fee > 1) {
      alert('Entry fee must be between 0 and 1 ETH');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/private-leagues/create`,
        {
          name: leagueName,
          entry_fee: fee,
          max_members: parseInt(maxMembers),
          prize_distribution: prizeDistribution,
          duration: 'monthly',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`League created! Code: ${response.data.league.code}\n\nShare this code with friends to invite them!`);
      setShowCreateLeague(false);
      setLeagueName('');
      setEntryFee('0');
      setMaxMembers('10');
      setPrizeDistribution('winner_takes_all');
      await fetchMyLeagues();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating league');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivateLeague = async () => {
    if (!joinCode.trim()) {
      alert('Please enter a league code');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.post(
        `${API_URL}/api/private-leagues/join`,
        {
          code: joinCode.toUpperCase(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Successfully joined league!');
      setShowJoinLeague(false);
      setJoinCode('');
      await fetchMyLeagues();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error joining league');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current budget usage
  const selectedInfluencersData = availableInfluencers.filter((inf) =>
    selectedInfluencers.includes(inf.id)
  );
  const budgetUsed = selectedInfluencersData.reduce((sum, inf) => sum + (Number(inf.price) || 0), 0);
  const budgetRemaining = 100 - budgetUsed;

  const handleCreateTeam = async () => {
    if (!teamName || selectedInfluencers.length !== 5) {
      alert('Please enter a team name and select exactly 5 influencers within 100 point budget');
      return;
    }

    if (budgetUsed > 100) {
      alert(`Budget exceeded! Total cost: ${budgetUsed.toFixed(0)} pts (Max: 100 pts)`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/league/team/create`,
        {
          team_name: teamName,
          influencer_ids: selectedInfluencers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTeam(response.data.team);
      alert('Team created successfully! +50 XP');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating team');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (selectedInfluencers.length !== 5) {
      alert('Please select exactly 5 influencers within 100 point budget');
      return;
    }

    if (budgetUsed > 100) {
      alert(`Budget exceeded! Total cost: ${budgetUsed.toFixed(0)} pts (Max: 100 pts)`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.put(
        `${API_URL}/api/league/team/update`,
        {
          influencer_ids: selectedInfluencers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTeam(response.data.team);
      alert('Team updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating team');
    } finally {
      setLoading(false);
    }
  };

  const handleLockTeam = async () => {
    if (!confirm('Are you sure? You cannot change your picks after locking.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.post(
        `${API_URL}/api/league/team/lock`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchTeam();
      alert('Team locked successfully! +25 XP');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error locking team');
    } finally {
      setLoading(false);
    }
  };

  // Show loading only on initial load
  if (loading && availableInfluencers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⚡</div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-1 mb-3">CT Fantasy League</h1>
        <p className="body-base text-gray-400 mb-6">
          Pick 5 CT influencers within a 100 point budget. Earn points automatically based on follower count + tier pricing!
        </p>

        {/* Contest Info */}
        {contest && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm text-cyan-400 mb-1">Current Contest</div>
                <div className="font-bold text-lg">{contest.contest_key.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Participants</div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <Users size={20} />
                  {contest.total_participants}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className={`font-bold text-lg ${contest.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                  {contest.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setView('team')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'team'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            My Team
          </button>
          <button
            onClick={() => setView('leaderboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'leaderboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setView('private')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'private'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Private Leagues
          </button>
        </div>
      </div>

      {/* Team View */}
      {view === 'team' && (
        <div>
          {team ? (
            <div>
              {/* Team Header */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="heading-2 mb-2">{team.team_name}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                      <span>Rank: #{team.rank || '---'}</span>
                      <span>Score: {team.total_score} pts</span>
                      <span className="text-cyan-400">
                        Budget: {team.total_budget_used?.toFixed(0) || '0'} pts / 100 pts
                      </span>
                      {team.is_locked && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Lock size={16} weight="fill" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {!team.is_locked && (
                    <button
                      onClick={handleLockTeam}
                      disabled={loading}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <Lock size={20} weight="fill" />
                      Lock Team (+25 XP)
                    </button>
                  )}
                </div>
              </div>

              {/* Team Picks */}
              <div className="mb-8">
                <h3 className="heading-3 mb-4">Your Picks</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {team.picks.map((pick) => (
                    <div
                      key={pick.id}
                      className="bg-gray-800/50 rounded-xl p-4 border-2 border-cyan-500/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">{pick.tier}</div>
                        <div className="text-sm font-bold text-yellow-400">{pick.price} pts</div>
                      </div>
                      <h4 className="font-bold text-center mb-1 text-sm">{pick.name}</h4>
                      <p className="text-xs text-gray-400 text-center mb-3">@{pick.handle}</p>
                      <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-cyan-400">{pick.total_points}</div>
                        <div className="text-xs text-gray-400">Pts</div>
                      </div>
                    </div>
                  ))}
                </div>

                {!team.is_locked && (
                  <p className="text-sm text-gray-400 text-center mt-4">
                    You can still update your picks before locking your team
                  </p>
                )}
              </div>

              {/* Update Picks (if not locked) */}
              {!team.is_locked && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="heading-3">Change Your Picks</h3>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                      <div className="text-sm text-gray-400">Budget</div>
                      <div className={`font-bold ${budgetRemaining < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {budgetUsed.toFixed(0)} pts / 100 pts
                      </div>
                      <div className="text-xs text-gray-500">
                        Remaining: {budgetRemaining.toFixed(0)} pts
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {availableInfluencers.map((influencer) => {
                      const isSelected = selectedInfluencers.includes(influencer.id);
                      return (
                        <button
                          key={influencer.id}
                          onClick={() => handleSelectInfluencer(influencer.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/20'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl">{influencer.tier}</div>
                            <div className="text-xs font-bold text-yellow-400">{influencer.price} pts</div>
                          </div>
                          <div className="text-xs font-semibold text-center mb-1">{influencer.name}</div>
                          <div className="text-xs text-gray-400 text-center truncate">@{influencer.handle}</div>
                          {isSelected && (
                            <div className="mt-2 flex justify-center">
                              <CheckCircle size={16} weight="fill" className="text-cyan-400" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleUpdateTeam}
                      disabled={loading || selectedInfluencers.length !== 5 || budgetUsed > 100}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Picks ({selectedInfluencers.length}/5) - {budgetUsed.toFixed(0)} pts
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Create Team */}
              <div className="bg-gray-800/50 rounded-xl p-8 mb-6 border border-gray-700">
                <h2 className="heading-2 mb-6 text-center">Create Your Team</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    maxLength={50}
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold">Select 5 Influencers</label>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                      <div className="text-xs text-gray-400">Budget</div>
                      <div className={`font-bold text-sm ${budgetRemaining < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {budgetUsed.toFixed(0)} pts / 100 pts
                      </div>
                      <div className="text-xs text-gray-500">
                        Remaining: {budgetRemaining.toFixed(0)} pts
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {availableInfluencers.map((influencer) => {
                      const isSelected = selectedInfluencers.includes(influencer.id);
                      return (
                        <button
                          key={influencer.id}
                          onClick={() => handleSelectInfluencer(influencer.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/20'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl">{influencer.tier}</div>
                            <div className="text-xs font-bold text-yellow-400">{influencer.price} pts</div>
                          </div>
                          <div className="text-xs font-semibold text-center mb-1">{influencer.name}</div>
                          <div className="text-xs text-gray-400 text-center truncate">@{influencer.handle}</div>
                          {isSelected && (
                            <div className="mt-2 flex justify-center">
                              <CheckCircle size={16} weight="fill" className="text-cyan-400" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleCreateTeam}
                    disabled={loading || !teamName || selectedInfluencers.length !== 5 || budgetUsed > 100}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Team ({selectedInfluencers.length}/5) - {budgetUsed.toFixed(0)} pts +50 XP
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-center">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-3">1️⃣</div>
                    <h4 className="font-semibold mb-2">Pick Your Team</h4>
                    <p className="text-sm text-gray-400">Select 5 CT influencers within 100 point budget</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">2️⃣</div>
                    <h4 className="font-semibold mb-2">Auto Scoring</h4>
                    <p className="text-sm text-gray-400">Scores update automatically based on follower metrics every 5 minutes</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">3️⃣</div>
                    <h4 className="font-semibold mb-2">Climb the Ranks</h4>
                    <p className="text-sm text-gray-400">Set and forget - compete for the top spot with zero daily effort</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div>
          <h2 className="heading-2 mb-6">Contest Leaderboard</h2>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
              <Trophy size={64} weight="duotone" className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No teams yet. Be the first to join!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((teamEntry, index) => (
                <div
                  key={teamEntry.id}
                  className={`bg-gray-800/50 rounded-xl p-6 border-2 transition-all ${
                    team && teamEntry.id === team.id
                      ? 'border-cyan-500'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{teamEntry.team_name}</div>
                        {team && teamEntry.id === team.id && (
                          <div className="text-sm text-cyan-400">Your Team</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-400">{teamEntry.total_score}</div>
                      <div className="text-sm text-gray-400">Points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Private Leagues View */}
      {view === 'private' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-2">Private Leagues</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateLeague(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
              >
                + Create League
              </button>
              <button
                onClick={() => setShowJoinLeague(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all"
              >
                Join League
              </button>
            </div>
          </div>

          {/* Create League Modal */}
          {showCreateLeague && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Create Private League</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">League Name</label>
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      placeholder="My Awesome League"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Entry Fee (ETH)</label>
                    <input
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">0 = Free league, Max 1 ETH</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Max Members</label>
                    <input
                      type="number"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(e.target.value)}
                      min="2"
                      max="100"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Prize Distribution</label>
                    <select
                      value={prizeDistribution}
                      onChange={(e) => setPrizeDistribution(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    >
                      <option value="winner_takes_all">Winner Takes All (85%)</option>
                      <option value="top_3">Top 3 (50% / 30% / 20%)</option>
                      <option value="top_5">Top 5 (40% / 25% / 20% / 10% / 5%)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">15% platform fee on all prizes</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateLeague(false)}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePrivateLeague}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Join League Modal */}
          {showJoinLeague && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Join Private League</h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">League Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 uppercase"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter the 8-character code shared by league creator</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowJoinLeague(false)}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinPrivateLeague}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Leagues */}
          {myLeagues.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
              <Trophy size={64} weight="duotone" className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">You haven't joined any private leagues yet</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCreateLeague(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
                >
                  Create League
                </button>
                <button
                  onClick={() => setShowJoinLeague(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all"
                >
                  Join League
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {myLeagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{league.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                        <span className="font-mono bg-gray-900 px-2 py-1 rounded">
                          Code: {league.code}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          league.status === 'open' ? 'bg-green-500/20 text-green-400' :
                          league.status === 'full' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {league.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {league.entry_fee > 0 && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">
                          {parseFloat(league.prize_pool).toFixed(4)} ETH
                        </div>
                        <div className="text-xs text-gray-400">Prize Pool</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Entry Fee</div>
                      <div className="font-semibold">
                        {league.entry_fee > 0 ? `${league.entry_fee} ETH` : 'Free'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Members</div>
                      <div className="font-semibold">
                        {league.current_members} / {league.max_members}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Your Rank</div>
                      <div className="font-semibold text-cyan-400">
                        #{league.rank || '---'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Your Score</div>
                      <div className="font-semibold text-cyan-400">
                        {league.total_score || 0} pts
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Prize: {league.prize_distribution === 'winner_takes_all' ? 'Winner Takes All' :
                           league.prize_distribution === 'top_3' ? 'Top 3 Split' :
                           'Top 5 Split'} • Duration: Monthly
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
