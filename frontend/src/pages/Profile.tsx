/**
 * Profile Page - Ultra Premium Edition
 * Shows user's Fantasy League stats and teams with premium design
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, Crown, Sparkle, Star, Fire, Users, TrendUp,
  CheckCircle, Lock, Lightning, Target, TrendDown
} from '@phosphor-icons/react';
import { getXPLevel, getLevelBadge, getLevelColors, formatXP } from '../utils/xp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Pick {
  id: number;
  influencer_name: string;
  influencer_handle: string;
  influencer_tier: string;
  total_points: number;
  profile_image_url?: string;
}

interface Team {
  id: number;
  team_name: string;
  total_score: number;
  rank?: number;
  picks: Pick[];
  total_budget_used: number;
  max_budget: number;
}

interface League {
  id: number;
  name: string;
  code: string;
  prize_pool: number;
  max_members: number;
  current_members: number;
  status: string;
  rank?: number;
}

export default function Profile() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [userXP, setUserXP] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);

  // Rarity mapping (same as LeagueUltra)
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

      // Fetch user profile (XP, username, streak, etc.)
      try {
        const profileResponse = await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileResponse.data) {
          setUserXP(profileResponse.data.xp || 0);
          setUserStreak(profileResponse.data.voteStreak || 0);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
      }

      // Fetch user's team
      try {
        const teamResponse = await axios.get(`${API_URL}/api/league/team`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamResponse.data.team) {
          setMyTeam(teamResponse.data.team);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error fetching team:', error);
        }
      }

      // Fetch user's leagues
      try {
        const leaguesResponse = await axios.get(`${API_URL}/api/private-leagues/my-leagues`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyLeagues(leaguesResponse.data.leagues || []);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Not Connected State
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-12 max-w-md w-full text-center shadow-2xl">
          <Lock size={80} weight="bold" className="mx-auto mb-6 text-cyan-400" />
          <h2 className="text-4xl font-black text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 text-lg mb-6">
            Connect your wallet to view your profile and Fantasy League stats
          </p>
          <div className="text-sm text-gray-400">
            👆 Click "Connect Wallet" in the top right
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl mb-6 shadow-2xl">
              <Users size={56} weight="bold" className="text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
              Your Profile
            </h1>
            <div className="font-mono text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-xl inline-block">
              {address}
            </div>
          </div>
        </div>

        {/* XP Level Card */}
        {(() => {
          const xpInfo = getXPLevel(userXP);
          const colors = getLevelColors(xpInfo.level);
          const badge = getLevelBadge(xpInfo.level);

          return (
            <div className="mb-10">
              <div className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-3xl border-2 ${colors.border} p-8 shadow-2xl`}>
                {/* Background Glow Effect */}
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${colors.gradient} opacity-10 blur-3xl`}></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`text-6xl animate-pulse`}>{badge}</div>
                      <div>
                        <div className="text-sm text-gray-400 font-semibold mb-1">YOUR LEVEL</div>
                        <div className={`text-4xl font-black ${colors.text}`}>
                          {xpInfo.level}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 font-semibold mb-1">TOTAL XP</div>
                      <div className="text-4xl font-black text-white">
                        {formatXP(userXP)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 font-semibold">
                        Level Progress
                      </span>
                      {xpInfo.nextLevel && (
                        <span className="text-sm text-gray-400">
                          {xpInfo.xpToNext} XP to {xpInfo.nextLevel}
                        </span>
                      )}
                    </div>
                    <div className="relative h-4 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700">
                      <div
                        className={`absolute left-0 top-0 h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 rounded-full`}
                        style={{ width: `${xpInfo.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right mt-1">
                      <span className={`text-xs font-bold ${colors.text}`}>
                        {xpInfo.progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Perks Grid */}
                  <div>
                    <div className="text-sm text-gray-400 font-semibold mb-3">LEVEL PERKS</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {xpInfo.levelInfo.perks.map((perk, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300"
                        >
                          <CheckCircle size={14} weight="fill" className={`inline mr-2 ${colors.text}`} />
                          {perk}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                    {/* Vote Streak */}
                    {userStreak > 0 && (
                      <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
                        <div className="text-xs text-white/80 font-semibold mb-1 text-center">VOTE STREAK</div>
                        <div className="text-2xl font-black text-white text-center flex items-center gap-2">
                          <Fire size={24} weight="fill" className={userStreak >= 7 ? 'animate-pulse' : ''} />
                          {userStreak} {userStreak === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    )}

                    {/* Vote Power */}
                    <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${colors.gradient} shadow-lg`}>
                      <div className="text-xs text-white/80 font-semibold mb-1 text-center">VOTE POWER</div>
                      <div className="text-2xl font-black text-white text-center">
                        {xpInfo.levelInfo.voteWeight}x
                      </div>
                    </div>

                    {/* Transfers */}
                    <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${colors.gradient} shadow-lg`}>
                      <div className="text-xs text-white/80 font-semibold mb-1 text-center">TRANSFERS/WEEK</div>
                      <div className="text-2xl font-black text-white text-center">
                        {xpInfo.levelInfo.maxTransfers === 999 ? '∞' : xpInfo.levelInfo.maxTransfers}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* My Team Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Trophy size={36} weight="fill" className="text-yellow-400" />
            <h2 className="text-4xl font-black text-white">My Team</h2>
          </div>

          {loading ? (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-16 text-center shadow-2xl">
              <div className="animate-spin text-6xl mb-4">⚡</div>
              <p className="text-gray-400 text-lg">Loading team data...</p>
            </div>
          ) : myTeam ? (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-8 shadow-2xl">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-700">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">{myTeam.team_name}</h3>
                  <p className="text-gray-400">Your Fantasy League squad</p>
                </div>
                <div className="text-right">
                  {myTeam.rank && (
                    <div className="text-5xl font-black text-yellow-400 mb-1">
                      #{myTeam.rank}
                    </div>
                  )}
                  <div className="text-sm text-gray-400">Total Score</div>
                  <div className="text-4xl font-black text-cyan-400">{myTeam.total_score || 0}</div>
                </div>
              </div>

              {/* Team Picks */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {myTeam.picks?.map((pick, idx) => {
                  const rarity = getRarityInfo(pick.influencer_tier || 'C');
                  const RarityIcon = rarity.icon;

                  return (
                    <div
                      key={idx}
                      className={`relative p-5 rounded-2xl border-2 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all hover:scale-105 shadow-xl`}
                    >
                      {/* Pick Number & Rarity Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-gray-500 font-bold bg-gray-900/50 px-2 py-1 rounded">
                          Pick #{idx + 1}
                        </div>
                        <div className={`${rarity.badge} px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                          <RarityIcon size={10} weight="fill" className="text-white" />
                          <span className="text-xs font-bold text-white">{pick.influencer_tier}</span>
                        </div>
                      </div>

                      {/* Profile Picture */}
                      <div className="mb-3">
                        <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-600 shadow-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                          {pick.profile_image_url ? (
                            <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center mb-3">
                        <div className="font-bold text-white text-sm mb-1 line-clamp-1">
                          {pick.influencer_name}
                        </div>
                        <div className="text-xs text-gray-400">@{pick.influencer_handle}</div>
                      </div>

                      {/* Score */}
                      <div className="bg-gray-900/60 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Points</div>
                        <div className="text-lg font-bold text-cyan-400">{pick.total_points || 0}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Budget Info */}
              <div className="bg-gray-900/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 font-semibold">Budget Used</span>
                  <span className="text-2xl font-black text-cyan-400">
                    {myTeam.total_budget_used || 0}/{myTeam.max_budget || 100}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${((myTeam.total_budget_used || 0) / (myTeam.max_budget || 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Update Team CTA */}
              <div className="mt-6 pt-6 border-t-2 border-gray-700 text-center">
                <Link
                  to="/draft"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/30"
                >
                  Update Team →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-16 text-center shadow-2xl">
              <div className="text-7xl mb-6">⚡</div>
              <h3 className="text-3xl font-black text-white mb-4">No Team Yet</h3>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                Create your first Fantasy League team and start competing!
              </p>
              <Link
                to="/draft"
                className="inline-block px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl shadow-green-500/30 flex items-center gap-3 mx-auto w-fit"
              >
                <Crown size={28} weight="bold" />
                Create Team
                <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm">+50 XP</span>
              </Link>
            </div>
          )}
        </div>

        {/* My Private Leagues */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Lightning size={36} weight="fill" className="text-purple-400" />
            <h2 className="text-4xl font-black text-white">My Private Leagues</h2>
          </div>

          {loading ? (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-16 text-center shadow-2xl">
              <div className="animate-spin text-6xl mb-4">⚡</div>
              <p className="text-gray-400 text-lg">Loading leagues...</p>
            </div>
          ) : myLeagues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myLeagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 p-8 shadow-2xl hover:scale-105 transition-all"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">{league.name}</h3>
                      <div className="text-sm text-gray-400 font-mono bg-gray-900/50 px-3 py-1 rounded-lg inline-block">
                        Code: {league.code}
                      </div>
                    </div>
                    {league.rank && (
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">Your Rank</div>
                        <div className="text-3xl font-black text-purple-400">#{league.rank}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-400 mb-2">Prize Pool</div>
                      <div className="text-2xl font-bold text-yellow-400">{league.prize_pool} ETH</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-400 mb-2">Members</div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {league.current_members}/{league.max_members}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div
                      className={`px-6 py-2 rounded-xl font-bold text-sm ${
                        league.status === 'open'
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
                          : league.status === 'full'
                          ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/30'
                      }`}
                    >
                      {league.status === 'open' && <CheckCircle size={16} weight="fill" className="inline mr-2" />}
                      {league.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 p-16 text-center shadow-2xl">
              <div className="text-7xl mb-6">🏅</div>
              <h3 className="text-3xl font-black text-white mb-4">No Private Leagues</h3>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                Join or create a private league to compete with friends!
              </p>
              <Link
                to="/draft"
                className="inline-block px-10 py-5 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/30"
              >
                Explore Leagues →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Target size={28} weight="fill" className="text-cyan-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/draft"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-2xl hover:bg-gray-900/70 transition-all border-2 border-gray-700 hover:border-cyan-500/50"
            >
              <Crown size={32} weight="fill" className="text-cyan-400" />
              <div>
                <div className="font-bold text-white mb-1">Manage Team</div>
                <div className="text-sm text-gray-400">Update your picks</div>
              </div>
            </Link>
            <Link
              to="/vote"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-2xl hover:bg-gray-900/70 transition-all border-2 border-gray-700 hover:border-orange-500/50"
            >
              <Target size={32} weight="fill" className="text-orange-400" />
              <div>
                <div className="font-bold text-white mb-1">Daily Vote</div>
                <div className="text-sm text-gray-400">Vote for best CT take</div>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-2xl hover:bg-gray-900/70 transition-all border-2 border-gray-700 hover:border-purple-500/50"
            >
              <TrendUp size={32} weight="fill" className="text-purple-400" />
              <div>
                <div className="font-bold text-white mb-1">Leaderboard</div>
                <div className="text-sm text-gray-400">Check rankings</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
