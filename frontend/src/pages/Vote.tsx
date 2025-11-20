/**
 * Daily Voting Page
 * Vote for best CT take of the day
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { ThumbsUp, TrendUp, CheckCircle, Fire, Warning } from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Influencer {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  tier: string;
  vote_count?: number;
  weighted_score?: number;
}

interface VoteStatus {
  has_voted: boolean;
  vote: {
    influencer_name: string;
    influencer_handle: string;
  } | null;
}

export default function Vote() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if authenticated
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    if (isConnected && token) {
      fetchInfluencers();
      fetchVoteStatus();
      fetchLeaderboard();
    }
  }, [isConnected, address]);

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

  const fetchInfluencers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/league/influencers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInfluencers(response.data.influencers);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };

  const fetchVoteStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/league/vote/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVoteStatus(response.data);
    } catch (error) {
      console.error('Error fetching vote status:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/league/vote/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedInfluencer) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${API_URL}/api/league/vote`,
        { influencer_id: selectedInfluencer },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Vote submitted! Vote weight: ${response.data.vote_weight}x (+10 XP)`);
      await fetchVoteStatus();
      await fetchLeaderboard();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error submitting vote');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ThumbsUp size={64} weight="duotone" className="mx-auto mb-4 text-cyan-400" />
        <h2 className="heading-2 mb-3">Daily CT Vote</h2>
        <p className="text-gray-400">Connect your wallet to vote</p>
      </div>
    );
  }

  if (isConnected && !isAuthenticated) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <Warning size={64} weight="duotone" className="mx-auto mb-4 text-yellow-400" />
        <h2 className="heading-2 mb-3">Sign In Required</h2>
        <p className="text-gray-400 mb-6">
          You need to sign a message with your wallet to access voting. This proves you own the wallet address.
        </p>
        {authError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{authError}</p>
          </div>
        )}
        <button
          onClick={handleManualSignIn}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In with Ethereum'}
        </button>
        <p className="text-xs text-gray-500 mt-4">
          No gas fees required. This is a free signature to verify wallet ownership.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-1 mb-3">Vote for Best CT Take</h1>
        <p className="body-base text-gray-400 mb-6">
          Vote daily for the CT influencer with the best take. Your vote helps scores in the Fantasy League!
        </p>

        {/* Vote Status Banner */}
        {voteStatus?.has_voted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle size={32} weight="fill" className="text-green-400" />
              <div>
                <div className="font-bold text-green-400 text-lg mb-1">Vote Submitted!</div>
                <div className="text-sm text-gray-300">
                  You voted for <span className="font-semibold">{voteStatus.vote?.influencer_name}</span> (@
                  {voteStatus.vote?.influencer_handle})
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <Fire size={32} weight="fill" className="text-cyan-400" />
              <div>
                <div className="font-bold text-lg mb-1">Daily Vote Available</div>
                <div className="text-sm text-gray-300">Vote now to earn 10 XP and support your favorite influencer!</div>
              </div>
            </div>
          </div>
        )}

        {/* Your Vote Weight */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Your Vote Power</div>
          <div className="text-2xl font-bold text-cyan-400">
            {voteStatus?.has_voted ? 'Used for Today' : 'Ready to Vote'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Higher levels = more vote weight
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {!voteStatus?.has_voted && (
        <div className="mb-8">
          <h2 className="heading-2 mb-6">Select Influencer</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {influencers.map((influencer) => {
              const isSelected = selectedInfluencer === influencer.id;
              return (
                <button
                  key={influencer.id}
                  onClick={() => setSelectedInfluencer(influencer.id)}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/20 scale-105'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:scale-105'
                  }`}
                >
                  <div className="text-3xl mb-3 text-center">{influencer.tier}</div>
                  <div className="text-sm font-semibold text-center mb-1">{influencer.name}</div>
                  <div className="text-xs text-gray-400 text-center">@{influencer.handle}</div>
                  {isSelected && (
                    <div className="mt-3 flex justify-center">
                      <CheckCircle size={24} weight="fill" className="text-cyan-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleVote}
              disabled={loading || !selectedInfluencer}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              <ThumbsUp size={24} weight="fill" />
              Submit Vote (+10 XP)
            </button>
          </div>
        </div>
      )}

      {/* Today's Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-2">Today's Rankings</h2>
          <div className="text-sm text-gray-400">Updated live</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl">
            <TrendUp size={64} weight="duotone" className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No votes yet today. Be the first to vote!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((influencer, index) => (
              <div
                key={influencer.id}
                className={`bg-gray-800/50 rounded-xl p-5 border-2 transition-all ${
                  index === 0
                    ? 'border-yellow-500/50'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full ${
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : index === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : index === 2
                          ? 'bg-orange-400/20 text-orange-400'
                          : 'bg-gray-700/20 text-gray-500'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{influencer.name}</div>
                      <div className="text-sm text-gray-400">@{influencer.handle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Votes</div>
                        <div className="text-lg font-bold">{influencer.vote_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Score</div>
                        <div className="text-2xl font-bold text-cyan-400">{influencer.weighted_score || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">How Voting Works</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <div className="text-cyan-400 mt-1">•</div>
            <div>
              <strong>One vote per day:</strong> Choose the influencer with the best CT take
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-cyan-400 mt-1">•</div>
            <div>
              <strong>Weighted voting:</strong> Higher level users have more vote weight
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-cyan-400 mt-1">•</div>
            <div>
              <strong>Earn XP & help teams:</strong> Get 10 XP per vote, and your vote gives points to Fantasy teams
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-cyan-400 mt-1">•</div>
            <div>
              <strong>Rankings update live:</strong> Watch the leaderboard change as votes come in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
