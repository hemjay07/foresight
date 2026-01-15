/**
 * Score Breakdown Modal
 * Shows detailed V2 scoring breakdown with actual metrics
 * Triggered from the Total Foresight card
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X, CaretDown, CaretUp, Star, Lightning,
  TrendUp, Fire, Trophy, ChartBar, Info,
  TwitterLogo, Heart, ArrowsClockwise, ChatCircle, UsersThree
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ScoreDetails {
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  viralTweets: number;
  followerGrowth: number;
  tweetsAnalyzed: number;
  tweetsThisWeek: number;
  growthRatePercent: number;
}

interface PickBreakdown {
  id: number;
  influencer_id: number;
  display_name: string;
  twitter_handle: string;
  avatar_url: string;
  tier: string;
  is_captain: boolean;
  activity_score: string;
  engagement_score: string;
  growth_score: string;
  viral_score: string;
  captain_bonus: string;
  spotlight_bonus: string;
  total_points: number;
  daily_points: number;
  score_details: ScoreDetails | null;
}

interface TeamBreakdown {
  team: {
    id: number;
    name: string;
    totalScore: number;
    rank: number;
    scoreChange: number;
    lastUpdate: string;
  };
  picks: PickBreakdown[];
  totals: {
    activity: number;
    engagement: number;
    growth: number;
    viral: number;
    captainBonus: number;
    spotlightBonus: number;
  };
  formula: {
    activity: { max: number; description: string };
    engagement: { max: number; description: string };
    growth: { max: number; description: string };
    viral: { max: number; description: string };
    captain: { multiplier: number; description: string };
    spotlight: { bonuses: number[]; description: string };
  };
}

interface Props {
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
}

// Progress bar component
function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex-1">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

export default function ScoreBreakdownModal({ teamId, isOpen, onClose }: Props) {
  const [data, setData] = useState<TeamBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPicks, setExpandedPicks] = useState<Set<number>>(new Set());
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      fetchBreakdown();
    }
  }, [isOpen, teamId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/league/team/${teamId}/breakdown`);
      setData(response.data);
      // Auto-expand top performer
      if (response.data.picks.length > 0) {
        const topPick = response.data.picks.reduce((max: PickBreakdown, p: PickBreakdown) =>
          p.total_points > max.total_points ? p : max
        );
        setExpandedPicks(new Set([topPick.id]));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load score breakdown');
    } finally {
      setLoading(false);
    }
  };

  const togglePick = (pickId: number) => {
    setExpandedPicks(prev => {
      const next = new Set(prev);
      if (next.has(pickId)) {
        next.delete(pickId);
      } else {
        next.add(pickId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ChartBar size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Score Breakdown</h2>
              <p className="text-sm text-gray-400">V2 Performance-Based Scoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading breakdown...</p>
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchBreakdown}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Total Score Summary */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 mb-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-300 font-medium">Team Total</span>
                  <span className="text-3xl font-black text-purple-400">{data.team.totalScore} pts</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Activity</p>
                    <p className="text-lg font-bold text-blue-400">{data.totals.activity.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Engage</p>
                    <p className="text-lg font-bold text-green-400">{data.totals.engagement.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Growth</p>
                    <p className="text-lg font-bold text-yellow-400">{data.totals.growth.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Viral</p>
                    <p className="text-lg font-bold text-orange-400">{data.totals.viral.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* Per-Influencer Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Influencer Performance
                </h3>

                {data.picks
                  .sort((a, b) => b.total_points - a.total_points)
                  .map((pick) => {
                    const isExpanded = expandedPicks.has(pick.id);
                    const details = pick.score_details;
                    const activityScore = parseFloat(pick.activity_score) || 0;
                    const engageScore = parseFloat(pick.engagement_score) || 0;
                    const growthScore = parseFloat(pick.growth_score) || 0;
                    const viralScore = parseFloat(pick.viral_score) || 0;
                    const hasNoActivity = pick.total_points === 0;

                    return (
                      <div
                        key={pick.id}
                        className={`bg-gray-800/50 rounded-xl border transition-all ${
                          pick.is_captain
                            ? 'border-yellow-500/50'
                            : 'border-gray-700/50'
                        }`}
                      >
                        {/* Collapsed Header */}
                        <button
                          onClick={() => togglePick(pick.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700/30 transition-colors rounded-xl"
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <img
                              src={pick.avatar_url || `https://unavatar.io/twitter/${pick.twitter_handle}`}
                              alt={pick.display_name}
                              className="w-10 h-10 rounded-full bg-gray-700"
                            />
                            {pick.is_captain && (
                              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                <Star size={10} weight="fill" className="text-gray-900" />
                              </div>
                            )}
                          </div>

                          {/* Name & Handle */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                @{pick.twitter_handle}
                              </span>
                              {pick.is_captain && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                  Captain 1.5x
                                </span>
                              )}
                            </div>
                            {hasNoActivity && (
                              <p className="text-xs text-red-400">No activity detected</p>
                            )}
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <span className={`text-xl font-black ${
                              hasNoActivity ? 'text-gray-500' : 'text-white'
                            }`}>
                              {pick.total_points}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">pts</span>
                          </div>

                          {/* Expand Icon */}
                          {isExpanded ? (
                            <CaretUp size={20} className="text-gray-400" />
                          ) : (
                            <CaretDown size={20} className="text-gray-400" />
                          )}
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-700/50">
                            {/* Score Bars */}
                            <div className="space-y-3 mb-4">
                              {/* Activity */}
                              <div className="flex items-center gap-3">
                                <div className="w-20 flex items-center gap-2">
                                  <Lightning size={14} className="text-blue-400" />
                                  <span className="text-xs text-gray-400">Activity</span>
                                </div>
                                <ScoreBar value={activityScore} max={35} color="bg-blue-500" />
                                <span className="w-16 text-right text-sm font-mono text-blue-400">
                                  {activityScore.toFixed(1)}/35
                                </span>
                              </div>

                              {/* Engagement */}
                              <div className="flex items-center gap-3">
                                <div className="w-20 flex items-center gap-2">
                                  <Trophy size={14} className="text-green-400" />
                                  <span className="text-xs text-gray-400">Engage</span>
                                </div>
                                <ScoreBar value={engageScore} max={60} color="bg-green-500" />
                                <span className="w-16 text-right text-sm font-mono text-green-400">
                                  {engageScore.toFixed(1)}/60
                                </span>
                              </div>

                              {/* Growth */}
                              <div className="flex items-center gap-3">
                                <div className="w-20 flex items-center gap-2">
                                  <TrendUp size={14} className="text-yellow-400" />
                                  <span className="text-xs text-gray-400">Growth</span>
                                </div>
                                <ScoreBar value={growthScore} max={40} color="bg-yellow-500" />
                                <span className="w-16 text-right text-sm font-mono text-yellow-400">
                                  {growthScore.toFixed(1)}/40
                                </span>
                              </div>

                              {/* Viral */}
                              <div className="flex items-center gap-3">
                                <div className="w-20 flex items-center gap-2">
                                  <Fire size={14} className="text-orange-400" />
                                  <span className="text-xs text-gray-400">Viral</span>
                                </div>
                                <ScoreBar value={viralScore} max={25} color="bg-orange-500" />
                                <span className="w-16 text-right text-sm font-mono text-orange-400">
                                  {viralScore.toFixed(1)}/25
                                </span>
                              </div>
                            </div>

                            {/* Raw Metrics */}
                            {details && (
                              <div className="bg-gray-900/50 rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <TwitterLogo size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Tweets:</span>
                                  <span className="text-white font-medium">{details.tweetsThisWeek || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Heart size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Avg Likes:</span>
                                  <span className="text-white font-medium">{formatNumber(details.avgLikes || 0)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ArrowsClockwise size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Avg RTs:</span>
                                  <span className="text-white font-medium">{formatNumber(details.avgRetweets || 0)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ChatCircle size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Avg Replies:</span>
                                  <span className="text-white font-medium">{formatNumber(details.avgReplies || 0)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <UsersThree size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Follower +:</span>
                                  <span className={`font-medium ${
                                    (details.followerGrowth || 0) > 0 ? 'text-green-400' : 'text-gray-400'
                                  }`}>
                                    {details.followerGrowth > 0 ? '+' : ''}{formatNumber(details.followerGrowth || 0)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Fire size={14} className="text-gray-500" />
                                  <span className="text-gray-400">Viral (10K+):</span>
                                  <span className={`font-medium ${
                                    (details.viralTweets || 0) > 0 ? 'text-orange-400' : 'text-gray-400'
                                  }`}>
                                    {details.viralTweets || 0}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!details && hasNoActivity && (
                              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                <p className="text-red-400 text-sm">
                                  No Twitter activity detected for this influencer this week.
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  This could be due to data sync delays or the account being inactive.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* How Scoring Works */}
              <div className="mt-6">
                <button
                  onClick={() => setShowFormula(!showFormula)}
                  className="w-full py-3 px-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl flex items-center justify-center gap-2 text-gray-300 transition-colors"
                >
                  <Info size={18} />
                  {showFormula ? 'Hide' : 'How'} Scoring Works
                  {showFormula ? <CaretUp size={18} /> : <CaretDown size={18} />}
                </button>

                {showFormula && (
                  <div className="mt-3 p-4 bg-gray-800/30 rounded-xl space-y-4 text-sm">
                    <p className="text-center text-gray-400 border-b border-gray-700 pb-3">
                      V2 Performance-Based Scoring - No free points from tier!
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Lightning size={16} className="text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-medium">Activity (0-35)</p>
                          <p className="text-gray-500 text-xs">1.5 pts per tweet this week</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Trophy size={16} className="text-green-400 mt-0.5" />
                        <div>
                          <p className="text-green-400 font-medium">Engagement (0-60)</p>
                          <p className="text-gray-500 text-xs">Quality (likes, RTs, replies) × Volume</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <TrendUp size={16} className="text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-400 font-medium">Growth (0-40)</p>
                          <p className="text-gray-500 text-xs">Absolute followers + Growth rate %</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Fire size={16} className="text-orange-400 mt-0.5" />
                        <div>
                          <p className="text-orange-400 font-medium">Viral (0-25)</p>
                          <p className="text-gray-500 text-xs">Tweets with 10K+ engagement</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-3 flex justify-around text-center">
                      <div>
                        <Star size={18} className="text-yellow-400 mx-auto mb-1" weight="fill" />
                        <p className="text-xs text-gray-400">Captain ×1.5</p>
                      </div>
                      <div>
                        <Fire size={18} className="text-purple-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Spotlight +12/+8/+4</p>
                      </div>
                    </div>

                    {data.team.lastUpdate && (
                      <p className="text-center text-xs text-gray-600 pt-2 border-t border-gray-700">
                        Last scored: {new Date(data.team.lastUpdate).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
