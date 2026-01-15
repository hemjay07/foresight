/**
 * Live Scoring Dashboard Component
 * Shows real-time influencer performance and team rankings
 * Solves the "Wednesday problem" - gives users a reason to check mid-week
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  TrendUp, TrendDown, Trophy, Fire, Clock, Lightning,
  ArrowUp, ArrowDown, Minus, ChartLineUp, Star
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TopInfluencer {
  id: number;
  display_name: string;
  twitter_handle: string;
  avatar_url?: string;
  tier: string;
  total_points: number;
  form_score: number;
  follower_count: number;
}

interface TeamRanking {
  id: number;
  team_name: string;
  user_id: string;
  total_score: number;
  rank: number;
  score_change?: number;
  rank_change?: number;
  is_current_user?: boolean;
}

interface ContestInfo {
  id: number;
  contest_key: string;
  start_date: string;
  end_date: string;
  status: string;
  total_participants: number;
}

export default function LiveScoringDashboard() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [topInfluencers, setTopInfluencers] = useState<TopInfluencer[]>([]);
  const [topTeams, setTopTeams] = useState<TeamRanking[]>([]);
  const [userTeam, setUserTeam] = useState<TeamRanking | null>(null);
  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch top performing influencers
      const influencersRes = await axios.get(`${API_URL}/api/league/influencers`);
      const influencers = influencersRes.data.influencers || [];
      // Sort by total_points descending
      const sorted = [...influencers].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setTopInfluencers(sorted.slice(0, 5));

      // Fetch current contest and leaderboard
      const contestRes = await axios.get(`${API_URL}/api/league/contest/current`);
      if (contestRes.data.contest) {
        setContest(contestRes.data.contest);

        // Calculate days remaining
        const endDate = new Date(contestRes.data.contest.end_date);
        const now = new Date();
        const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, diff));

        // Fetch leaderboard
        const leaderboardRes = await axios.get(`${API_URL}/api/league/leaderboard/${contestRes.data.contest.id}`);
        const teams = leaderboardRes.data.leaderboard || [];

        // Mark current user's team
        const teamsWithUserFlag = teams.map((team: any) => ({
          ...team,
          is_current_user: address && team.wallet_address?.toLowerCase() === address.toLowerCase()
        }));

        setTopTeams(teamsWithUserFlag.slice(0, 10));

        // Find current user's team
        const currentUserTeam = teamsWithUserFlag.find((t: any) => t.is_current_user);
        setUserTeam(currentUserTeam || null);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'A': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      case 'B': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'C': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Minus size={14} className="text-gray-500" />;
    if (change > 0) return <ArrowUp size={14} className="text-green-400" />;
    return <ArrowDown size={14} className="text-red-400" />;
  };

  const getFormLabel = (score: number) => {
    if (score >= 90) return { label: 'ON FIRE', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (score >= 75) return { label: 'HOT', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (score >= 60) return { label: 'GOOD', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 40) return { label: 'OK', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    return { label: 'COLD', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contest Status Banner */}
      {contest && (
        <div className="bg-gradient-to-r from-brand-600/20 via-brand-500/10 to-transparent rounded-xl border border-brand-500/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Trophy size={24} className="text-brand-400" weight="fill" />
              </div>
              <div>
                <div className="font-semibold text-white">{contest.contest_key.replace(/_/g, ' ').toUpperCase()}</div>
                <div className="text-sm text-gray-400">{contest.total_participants || 0} teams competing</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                  <Clock size={18} weight="fill" />
                  {daysRemaining}d
                </div>
                <div className="text-xs text-gray-500">remaining</div>
              </div>
              {lastUpdate && (
                <div className="text-center">
                  <div className="text-sm text-gray-400">Last update</div>
                  <div className="text-xs text-gray-500">
                    {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Your Team Status */}
      {userTeam && (
        <div className="bg-gradient-to-r from-cyan-600/20 via-cyan-500/10 to-transparent rounded-xl border border-cyan-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Star size={28} className="text-cyan-400" weight="fill" />
              </div>
              <div>
                <div className="text-sm text-cyan-400 font-medium">Your Team</div>
                <div className="font-bold text-white text-lg">{userTeam.team_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  #{userTeam.rank}
                  {getRankChangeIcon(userTeam.rank_change)}
                </div>
                <div className="text-xs text-gray-500">current rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {userTeam.total_score?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500">total points</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Influencers */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightning size={24} weight="fill" className="text-yellow-400" />
                Top Performers This Week
              </h3>
              <Link to="/draft" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View All
                <TrendUp size={14} />
              </Link>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {topInfluencers.map((influencer, index) => {
              const form = getFormLabel(influencer.form_score || 50);
              return (
                <div
                  key={influencer.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
                >
                  <div className="text-lg font-bold text-yellow-400 w-6">
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center overflow-hidden">
                    {influencer.avatar_url ? (
                      <img src={influencer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {influencer.display_name?.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-white text-sm truncate">
                        {influencer.display_name}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getTierColor(influencer.tier)}`}>
                        {influencer.tier}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      @{influencer.twitter_handle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-400 flex items-center gap-1">
                      {influencer.total_points || 0}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${form.bg} ${form.color}`}>
                        {form.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              );
            })}
            {topInfluencers.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Lightning size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
                <p>No influencer data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ChartLineUp size={24} weight="fill" className="text-purple-400" />
                Live Leaderboard
              </h3>
              <Link to="/leaderboard" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Full Rankings
                <TrendUp size={14} />
              </Link>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {topTeams.map((team, index) => (
              <div
                key={team.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  team.is_current_user
                    ? 'bg-cyan-500/20 border border-cyan-500/30'
                    : 'bg-gray-800/40 hover:bg-gray-800/60'
                }`}
              >
                <div className={`text-lg font-bold w-6 ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-orange-400' :
                  'text-gray-500'
                }`}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm truncate ${
                      team.is_current_user ? 'text-cyan-300' : 'text-white'
                    }`}>
                      {team.team_name}
                    </span>
                    {team.is_current_user && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                        YOU
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.score_change !== undefined && team.score_change !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${
                      team.score_change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {team.score_change > 0 ? '+' : ''}{team.score_change}
                    </span>
                  )}
                  <div className="font-bold text-purple-400 min-w-[60px] text-right">
                    {team.total_score?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            ))}
            {topTeams.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Trophy size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
                <p>No teams yet this week</p>
                <Link to="/draft" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-block">
                  Be the first to create a team!
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {!userTeam && address && (
        <div className="bg-gradient-to-r from-brand-600/20 via-brand-500/10 to-transparent rounded-xl border border-brand-500/30 p-6 text-center">
          <Fire size={40} weight="fill" className="mx-auto mb-3 text-brand-400" />
          <h3 className="text-xl font-bold text-white mb-2">Ready to compete?</h3>
          <p className="text-gray-400 mb-4">Draft your team and join this week's contest!</p>
          <Link to="/draft" className="btn-primary">
            Draft Your Team
            <Trophy size={18} weight="fill" />
          </Link>
        </div>
      )}
    </div>
  );
}
