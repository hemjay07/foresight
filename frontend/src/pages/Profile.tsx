/**
 * Profile Page
 * Shows user's Fantasy League stats and teams
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, Crown, Sparkle, Star, Fire, Users, TrendUp,
  CheckCircle, Lock, Lightning, Target, TrendDown, Medal, Gear,
  PencilSimple, Check, X
} from '@phosphor-icons/react';
import AchievementBadge from '../components/AchievementBadge';
import { EmptyState } from '../components/EmptyState';
import { getXPLevel, getLevelBadge, getLevelColors, formatXP } from '../utils/xp';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [userXP, setUserXP] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  // Rarity mapping (same as LeagueUltra)
  const getRarityInfo = (tier: string) => {
    const rarities: Record<string, { label: string; gradient: string; badge: string; icon: any }> = {
      S: {
        label: 'Legendary',
        gradient: 'from-yellow-500/20 to-amber-500/20',
        badge: 'bg-yellow-500',
        icon: Crown
      },
      A: {
        label: 'Epic',
        gradient: 'from-brand-500/20 to-brand-600/20',
        badge: 'bg-brand-500',
        icon: Sparkle
      },
      B: {
        label: 'Rare',
        gradient: 'from-green-500/20 to-green-600/20',
        badge: 'bg-green-500',
        icon: Star
      },
      C: {
        label: 'Common',
        gradient: 'from-gray-500/20 to-gray-600/20',
        badge: 'bg-gray-500',
        icon: Fire
      }
    };
    return rarities[tier] || rarities.C;
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
      fetchAchievements();
    }
  }, [isConnected, address]);

  const fetchAchievements = async () => {
    try {
      setAchievementsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAchievementsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAchievements(response.data.achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !tempUsername.trim()) return;

      await axios.patch(
        `${API_URL}/api/users/profile`,
        { username: tempUsername.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsername(tempUsername.trim());
      setIsEditingUsername(false);
      showToast('success', `Username updated to ${tempUsername.trim()}!`);
    } catch (error: any) {
      console.error('Error updating username:', error);
      showToast('error', error.response?.data?.error || 'Failed to update username');
    }
  };

  const handleStartEditUsername = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleCancelEditUsername = () => {
    setTempUsername('');
    setIsEditingUsername(false);
  };

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
          setUsername(profileResponse.data.username || '');
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
      }

      // Fetch user's team
      try {
        const teamResponse = await axios.get(`${API_URL}/api/league/team/me`, {
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="card p-12 max-w-md w-full text-center">
          <Lock size={64} weight="bold" className="mx-auto mb-6 text-brand-400" />
          <h2 className="text-3xl font-semibold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 text-lg mb-6">
            Connect your wallet to view your profile and Fantasy League stats
          </p>
          <div className="text-sm text-gray-400">
            Click "Connect Wallet" in the top right
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 rounded-xl mb-6 shadow-soft-lg">
              <Users size={48} weight="bold" className="text-white" />
            </div>

            {/* Editable Username */}
            {!isEditingUsername ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-4xl md:text-5xl font-semibold text-white">
                  {username || 'Anonymous Trader'}
                </h1>
                <button
                  onClick={handleStartEditUsername}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-brand-400"
                  title="Edit username"
                >
                  <PencilSimple size={24} weight="bold" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-2">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                  className="text-4xl md:text-5xl font-semibold text-white bg-gray-800 border-2 border-brand-500 rounded-lg px-4 py-2 text-center focus:outline-none focus:border-brand-400"
                  placeholder="Enter username"
                  maxLength={20}
                  autoFocus
                />
                <button
                  onClick={handleSaveUsername}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all text-white"
                  title="Save"
                >
                  <Check size={24} weight="bold" />
                </button>
                <button
                  onClick={handleCancelEditUsername}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-white"
                  title="Cancel"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>
            )}

            <div className="font-mono text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-lg inline-block mb-4">
              {address}
            </div>

            {/* Settings Link */}
            <div className="mt-2">
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-brand-500/50 rounded-lg text-white font-semibold transition-all"
              >
                <Gear size={20} weight="bold" />
                Edit Profile
              </Link>
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
              <div className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-xl border ${colors.border} p-8 shadow-soft-lg`}>
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
                      <div className="px-6 py-3 rounded-lg bg-amber-500 shadow-soft">
                        <div className="text-xs text-white/80 font-semibold mb-1 text-center">VOTE STREAK</div>
                        <div className="text-2xl font-black text-white text-center flex items-center gap-2">
                          <Fire size={24} weight="fill" className={userStreak >= 7 ? 'animate-pulse' : ''} />
                          {userStreak} {userStreak === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    )}

                    {/* Vote Power */}
                    <div className={`px-6 py-3 rounded-lg bg-gradient-to-r ${colors.gradient} shadow-soft`}>
                      <div className="text-xs text-white/80 font-semibold mb-1 text-center">VOTE POWER</div>
                      <div className="text-2xl font-bold text-white text-center">
                        {xpInfo.levelInfo.voteWeight}x
                      </div>
                    </div>

                    {/* Transfers */}
                    <div className={`px-6 py-3 rounded-lg bg-gradient-to-r ${colors.gradient} shadow-soft`}>
                      <div className="text-xs text-white/80 font-semibold mb-1 text-center">TRANSFERS/WEEK</div>
                      <div className="text-2xl font-bold text-white text-center">
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
            <div className="card p-16 text-center">
              <div className="animate-spin mb-4">
                <Fire size={48} weight="bold" className="text-brand-400" />
              </div>
              <p className="text-gray-400 text-lg">Loading team data...</p>
            </div>
          ) : myTeam ? (
            <div className="card p-8">
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
                  <div className="text-4xl font-bold text-brand-400">{myTeam.total_score || 0}</div>
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
                      className={`relative p-5 rounded-lg border bg-gray-800/80 border-gray-700 hover:border-brand-500/50 transition-all shadow-soft`}
                    >
                      {/* Pick Number & Rarity Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-gray-500 font-bold bg-gray-900/50 px-2 py-1 rounded">
                          Pick #{idx + 1}
                        </div>
                        <div className={`${rarity.badge} px-2 py-1 rounded-md flex items-center gap-1`}>
                          <RarityIcon size={10} weight="fill" className="text-white" />
                          <span className="text-xs font-medium text-white">{pick.influencer_tier}</span>
                        </div>
                      </div>

                      {/* Profile Picture */}
                      <div className="mb-3">
                        <div className="w-14 h-14 mx-auto rounded-full border-2 border-gray-600 shadow-soft overflow-hidden bg-gray-700">
                          {pick.profile_image_url ? (
                            <img src={pick.profile_image_url} alt={pick.influencer_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Fire size={20} weight="bold" />
                            </div>
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
                        <div className="text-lg font-bold text-brand-400">{pick.total_points || 0}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Budget Info */}
              <div className="bg-gray-900/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 font-semibold">Budget Used</span>
                  <span className="text-2xl font-bold text-brand-400">
                    {myTeam.total_budget_used || 0}/{myTeam.max_budget || 100}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-brand-500 transition-all"
                    style={{ width: `${((myTeam.total_budget_used || 0) / (myTeam.max_budget || 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Update Team CTA */}
              <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                <Link
                  to="/draft"
                  className="btn-primary inline-block px-8 py-4"
                >
                  Update Team
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-8">
              <EmptyState
                icon="crown"
                title="No Team Yet"
                description="Draft your first Fantasy League team with 5 CT influencers and start climbing the leaderboard!"
                action={
                  <Link
                    to="/draft"
                    className="btn-primary inline-flex items-center gap-3 px-8 py-4 shadow-soft-lg hover:scale-105 transition-transform"
                  >
                    <Crown size={24} weight="bold" />
                    Create Your Team
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">+50 XP</span>
                  </Link>
                }
              />
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
            <div className="card p-16 text-center">
              <div className="animate-spin mb-4">
                <Fire size={48} weight="bold" className="text-brand-400" />
              </div>
              <p className="text-gray-400 text-lg">Loading leagues...</p>
            </div>
          ) : myLeagues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myLeagues.map((league) => (
                <div
                  key={league.id}
                  className="card p-8 border-brand-500/30 hover:shadow-soft-lg transition-all"
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
                        <div className="text-3xl font-bold text-brand-400">#{league.rank}</div>
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
                      <div className="text-2xl font-bold text-brand-400">
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
            <div className="card p-8">
              <EmptyState
                icon="trophy"
                title="No Private Leagues Yet"
                description="Create your own private league and invite friends to compete for glory and prizes!"
                action={
                  <Link
                    to="/draft"
                    className="btn-primary inline-flex items-center gap-3 px-8 py-4 shadow-soft-lg hover:scale-105 transition-transform"
                  >
                    <Trophy size={24} weight="bold" />
                    Create Private League
                  </Link>
                }
              />
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <Medal size={36} weight="fill" className="text-cyan-400" />
            <h2 className="text-4xl font-black text-white">Achievements</h2>
          </div>

          {achievementsLoading ? (
            <div className="card-highlight p-8">
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading achievements...</div>
              </div>
            </div>
          ) : achievements.length > 0 ? (
            <div className="card-highlight p-8">
              {/* Stats */}
              <div className="mb-6 flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Unlocked: </span>
                  <span className="text-white font-semibold">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Progress: </span>
                  <span className="text-cyan-400 font-semibold">
                    {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Achievement Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                {achievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    name={achievement.name}
                    description={achievement.description}
                    rarity={achievement.rarity}
                    unlocked={achievement.unlocked}
                    unlockedAt={achievement.unlocked_at}
                    size="md"
                    showShare={true}
                  />
                ))}
              </div>

              {/* Category breakdown */}
              {(() => {
                const categories = achievements.reduce((acc: any, ach: any) => {
                  if (!acc[ach.category]) {
                    acc[ach.category] = { total: 0, unlocked: 0 };
                  }
                  acc[ach.category].total++;
                  if (ach.unlocked) acc[ach.category].unlocked++;
                  return acc;
                }, {});

                return Object.keys(categories).length > 0 ? (
                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <div className="text-sm text-gray-400 mb-4 font-semibold uppercase tracking-wider">
                      By Category
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(categories).map(([category, stats]: [string, any]) => (
                        <div key={category} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                          <div className="text-gray-400 text-xs capitalize mb-2">{category}</div>
                          <div className="text-white font-bold text-lg">
                            {stats.unlocked} / {stats.total}
                          </div>
                          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full transition-all"
                              style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="card-highlight p-8 text-center">
              <Lock size={48} weight="duotone" className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Start playing to unlock achievements</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 card-highlight p-8">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <Target size={28} weight="fill" className="text-brand-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/draft"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all border border-gray-700 hover:border-brand-500/50"
            >
              <Crown size={32} weight="fill" className="text-brand-400" />
              <div>
                <div className="font-medium text-white mb-1">Manage Team</div>
                <div className="text-sm text-gray-400">Update your picks</div>
              </div>
            </Link>
            <Link
              to="/vote"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all border border-gray-700 hover:border-amber-500/50"
            >
              <Target size={32} weight="fill" className="text-amber-400" />
              <div>
                <div className="font-medium text-white mb-1">Daily Vote</div>
                <div className="text-sm text-gray-400">Vote for best CT take</div>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all border border-gray-700 hover:border-brand-500/50"
            >
              <TrendUp size={32} weight="fill" className="text-brand-400" />
              <div>
                <div className="font-medium text-white mb-1">Leaderboard</div>
                <div className="text-sm text-gray-400">Check rankings</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
