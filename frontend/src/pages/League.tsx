/**
 * League - CT League Hub Page
 * Simple hub with Browse Contests CTA + CT Spotlight voting
 *
 * Note: Draft functionality moved to /draft (LeagueUltra)
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  GameController,
  Target,
  Trophy,
  Users,
  Lock,
  CheckCircle,
  CaretRight,
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface VoteInfo {
  hasVotedThisWeek: boolean;
  votedFor: string | null;
  weeklyWinner: string | null;
  candidates: Array<{
    id: number;
    name: string;
    handle: string;
    votes: number;
    profileImageUrl: string;
  }>;
}

export default function League() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [voteInfo, setVoteInfo] = useState<VoteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoteData();
  }, [isConnected]);

  const fetchVoteData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const voteRes = await axios.get(`${API_URL}/api/league/vote/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => ({ data: null }));

      if (voteRes.data) {
        setVoteInfo(voteRes.data);
      }
    } catch (error) {
      console.error('Error fetching vote data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Not connected state - show value proposition
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-8 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
            <GameController size={32} weight="fill" className="text-gray-950" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">CT League</h1>
          <p className="text-gray-400">Draft your dream team, compete for prizes</p>
        </div>

        {/* Preview Cards - Show what's available */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Draft Preview */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
                <Trophy size={20} className="text-gold-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">CT League</h3>
                <p className="text-xs text-gray-500">Build your dream team</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Pick 5 influencers within budget
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Earn points from their engagement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Compete in free or prized leagues
              </li>
            </ul>
          </div>

          {/* Vote Preview */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Target size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">CT Spotlight</h3>
                <p className="text-xs text-gray-500">Weekly community vote</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Vote for top CT performer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Earn +20 FS for participating
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Results announced Sundays
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">Connect your wallet to start competing</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-gray-400">
            <Lock size={16} />
            Wallet required to track your progress
          </div>
        </div>
      </div>
    );
  }

  // Connected state - show hub with Browse Contests CTA + Voting
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center">
          <GameController size={22} weight="fill" className="text-gray-950" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">CT League</h1>
          <p className="text-sm text-gray-400">Draft, vote, win</p>
        </div>
      </div>

      {/* Browse Contests CTA Card */}
      <button
        onClick={() => navigate('/compete?tab=contests')}
        className="w-full bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-xl p-6 mb-6 text-left hover:border-gold-500/50 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
              <Trophy size={24} className="text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Browse Contests</h3>
              <p className="text-sm text-gray-400">Join free or prized leagues, draft your team</p>
            </div>
          </div>
          <CaretRight size={24} className="text-gold-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* CT Spotlight Voting Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Target size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CT Spotlight</h2>
            <p className="text-sm text-gray-400">Weekly community vote</p>
          </div>
          {!voteInfo?.hasVotedThisWeek && !loading && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400">
              Vote Now
            </span>
          )}
        </div>

        <VoteTab voteInfo={voteInfo} onVoted={fetchVoteData} loading={loading} />
      </div>
    </div>
  );
}

// Vote Tab Component
function VoteTab({
  voteInfo,
  onVoted,
  loading
}: {
  voteInfo: VoteInfo | null;
  onVoted: () => void;
  loading: boolean;
}) {
  const [voting, setVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  const handleVote = async (candidateId: number) => {
    try {
      setVoting(true);
      const token = localStorage.getItem('authToken');

      await axios.post(
        `${API_URL}/api/vote/cast`,
        { candidateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onVoted();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (voteInfo?.hasVotedThisWeek) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} weight="fill" className="text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Vote Cast!</h3>
        <p className="text-gray-400 text-sm mb-2">
          You voted for <span className="text-white font-medium">@{voteInfo.votedFor}</span> this week
        </p>
        <p className="text-xs text-gray-500">
          Results announced every Sunday
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 text-center mb-4">
        Vote for your favorite CT performer. Earn +20 FS for participating.
      </p>

      {/* Candidates Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(voteInfo?.candidates || []).slice(0, 6).map((candidate) => (
          <button
            key={candidate.id}
            onClick={() => setSelectedCandidate(candidate.id)}
            disabled={voting}
            className={`relative text-left p-3 rounded-lg border transition-all ${
              selectedCandidate === candidate.id
                ? 'bg-gold-500/20 border-gold-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                {candidate.profileImageUrl ? (
                  <img src={candidate.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Users size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-white text-sm truncate">{candidate.name}</div>
                <div className="text-xs text-gray-400 truncate">@{candidate.handle}</div>
              </div>
            </div>
            {selectedCandidate === candidate.id && (
              <div className="absolute top-2 right-2">
                <CheckCircle size={16} weight="fill" className="text-gold-400" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Vote Button */}
      {selectedCandidate && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => handleVote(selectedCandidate)}
            disabled={voting}
            className="btn-primary px-6 py-2.5"
          >
            {voting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Voting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Target size={16} />
                Cast Vote (+20 FS)
              </span>
            )}
          </button>
        </div>
      )}

      {/* Empty state if no candidates */}
      {(!voteInfo?.candidates || voteInfo.candidates.length === 0) && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center mx-auto mb-3">
            <Target size={24} className="text-gray-600" />
          </div>
          <h3 className="font-semibold text-white mb-1">Voting Opens Soon</h3>
          <p className="text-sm text-gray-400">
            Next round of CT Spotlight voting will begin shortly
          </p>
        </div>
      )}
    </div>
  );
}
