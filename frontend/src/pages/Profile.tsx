/**
 * Profile Page
 * Shows user's Fantasy League stats and teams
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [myLeagues, setMyLeagues] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user's team
      const teamResponse = await axios.get(`${API_URL}/api/league/team/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTeam(teamResponse.data.team);

      // Fetch user's leagues
      const leaguesResponse = await axios.get(`${API_URL}/api/private-leagues/my-leagues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyLeagues(leaguesResponse.data.leagues || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to view your profile and Fantasy League stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            Your Profile
          </h1>
          <div className="font-mono text-sm text-gray-500">{address}</div>
        </div>
      </div>

      {/* My Team */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🏆</span>
          My Team
        </h2>
        {loading ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
            Loading...
          </div>
        ) : myTeam ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{myTeam.team_name}</h3>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Score</div>
                <div className="text-2xl font-bold text-cyan-400">{myTeam.total_score || 0}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {myTeam.picks?.map((pick: any, idx: number) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Pick #{idx + 1}</div>
                  <div className="font-bold text-sm mb-1">{pick.influencer_name}</div>
                  <div className="text-xs text-gray-400">@{pick.influencer_handle}</div>
                  <div className="text-xs text-cyan-400 mt-2">{pick.total_points || 0} pts</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Budget Used:</span>
                <span className="text-gray-200">{myTeam.total_budget_used || 0}M / 25M</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">⚽</div>
            <p className="text-gray-400 mb-4">You haven't created a team yet</p>
            <a href="/league" className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-colors">
              Create Team
            </a>
          </div>
        )}
      </div>

      {/* My Private Leagues */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🎖️</span>
          My Private Leagues
        </h2>
        {loading ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
            Loading...
          </div>
        ) : myLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLeagues.map((league) => (
              <div key={league.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">{league.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Prize Pool</div>
                    <div className="text-cyan-400 font-bold">{league.prize_pool} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Members</div>
                    <div className="text-gray-200">{league.current_members}/{league.max_members}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Status</div>
                    <div className={`capitalize font-medium ${
                      league.status === 'open' ? 'text-green-400' :
                      league.status === 'full' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {league.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Your Rank</div>
                    <div className="text-purple-400 font-bold">#{league.rank || '-'}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-500">Code: <span className="font-mono text-gray-400">{league.code}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">🏅</div>
            <p className="text-gray-400 mb-4">You haven't joined any private leagues yet</p>
            <a href="/league" className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors">
              Join a League
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
