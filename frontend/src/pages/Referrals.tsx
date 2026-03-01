/**
 * Referrals Page
 * Invite friends, earn XP, build your position
 *
 * Smart monetization hints:
 * - Founding member status (early = valuable)
 * - Quality score (determines future rewards)
 * - XP tracking (converts to value later)
 * - "Building equity" messaging
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Trophy,
  Crown,
  ShareNetwork,
  Copy,
  TrendUp,
  Sparkle,
  Fire,
  ChartLine,
  Check
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { API_URL } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

interface ReferralData {
  referralCode: string;
  referralCount: number;
  activeReferralCount: number;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  qualityScore: number;
  totalReferralXP: number;
  recruiterRank: number;
  milestones: Array<{
    type: string;
    achievedAt: string;
  }>;
  recentReferrals: Array<{
    username: string;
    level: number;
    joinedAt: string;
    lastActive: string;
  }>;
}

export default function Referrals() {
  const { address, isConnected } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchReferralData();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please sign in to view referrals');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/referrals/my-code`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching referral data:', err);
      setError(err.response?.data?.error || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;

    const shareUrl = `${window.location.origin}?ref=${data.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Referral link copied!', 'success');

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!data) return;

    const shareUrl = `${window.location.origin}?ref=${data.referralCode}`;
    const text = data.isFoundingMember
      ? `I'm Founding Member #${data.foundingMemberNumber} of @ForesightCT! 👑\n\nJoin the CT Fantasy revolution. Draft influencers, earn points, build your position.\n\n Early supporters will be rewarded 💰`
      : `Just invited ${data.activeReferralCount} players to @ForesightCT! 🎮\n\nCT Fantasy is heating up. Get in early.\n\nJoin me:`;

    const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const getMilestoneInfo = (type: string) => {
    const info: Record<string, { icon: any; label: string; color: string }> = {
      recruiter: { icon: Users, label: 'Recruiter', color: 'text-blue-400' },
      talent_scout: { icon: Sparkle, label: 'Talent Scout', color: 'text-gold-400' },
      ct_influencer: { icon: Fire, label: 'CT Influencer', color: 'text-orange-400' },
      kingmaker: { icon: Crown, label: 'Kingmaker', color: 'text-yellow-400' },
      legend: { icon: Trophy, label: 'Legend', color: 'text-yellow-300' },
    };
    return info[type] || { icon: Users, label: type, color: 'text-gray-400' };
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShareNetwork size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Invite & Earn</h1>
          <p className="text-gray-400 max-w-md mx-auto">Share Foresight with friends and earn rewards together</p>
        </div>

        {/* Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center mx-auto mb-3">
              <Users size={24} weight="fill" className="text-gold-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Invite Friends</h3>
            <p className="text-sm text-gray-500">Share your unique referral link</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <TrendUp size={24} weight="fill" className="text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Earn XP</h3>
            <p className="text-sm text-gray-500">Get bonus XP for active referrals</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Crown size={24} weight="fill" className="text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Build Position</h3>
            <p className="text-sm text-gray-500">Early supporters get rewarded</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Ready to start inviting?</h3>
          <p className="text-gray-400 mb-4">Sign in to get your unique referral link</p>
          <div className="text-sm text-gray-500">Use the "Sign In" button above</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading referrals...</p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <ShareNetwork size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Referrals</h1>
        <p className="text-gray-400 mb-4">{error || 'Unable to load referral data'}</p>
        <button
          onClick={fetchReferralData}
          className="px-4 py-2 bg-gold-600 hover:bg-gold-700 rounded-lg text-white font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}?ref=${data.referralCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <SEO title="Referrals — Invite & Earn" description="Invite friends to Foresight and earn XP rewards. Become a Founding Member and build your position early." path="/referrals" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-3">Invite & Earn</h1>
          <p className="text-xl text-gray-300">
            {data.isFoundingMember
              ? '👑 You\'re a Founding Member. Early supporters will be rewarded.'
              : 'Invite friends, earn XP, build your position'}
          </p>
        </div>

        {/* Founding Member Banner (If applicable) */}
        {data.isFoundingMember && (
          <div className="mb-6 p-6 bg-gradient-to-r from-yellow-900/30 via-amber-900/30 to-yellow-900/30 border-2 border-yellow-500/50 rounded-xl">
            <div className="flex items-center gap-4">
              <Crown size={48} weight="fill" className="text-yellow-400" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-yellow-400 mb-1">
                  Founding Member #{data.foundingMemberNumber}
                </h2>
                <p className="text-gray-300">
                  You're one of the first 1,000 users. This status will be valuable. 💰
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="card bg-gray-800/50 p-6 border border-gold-500/30">
            <div className="flex items-center gap-3 mb-2">
              <Users size={24} className="text-gold-400" />
              <span className="text-gray-400 font-medium">Total Invited</span>
            </div>
            <div className="text-4xl font-black text-white">{data.referralCount}</div>
            <div className="text-sm text-gray-500 mt-1">
              {data.activeReferralCount} active (last 7 days)
            </div>
          </div>

          <div className="card bg-gray-800/50 p-6 border border-gold-500/30">
            <div className="flex items-center gap-3 mb-2">
              <ChartLine size={24} className="text-gold-400" />
              <span className="text-gray-400 font-medium">Quality Score</span>
            </div>
            <div className="text-4xl font-black text-white">{data.qualityScore}%</div>
            <div className="text-sm text-gray-500 mt-1">
              Determines future reward multiplier
            </div>
          </div>

          <div className="card bg-gray-800/50 p-6 border border-green-500/30">
            <div className="flex items-center gap-3 mb-2">
              <TrendUp size={24} className="text-green-400" />
              <span className="text-gray-400 font-medium">Referral XP</span>
            </div>
            <div className="text-4xl font-black text-white">
              {data.totalReferralXP.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Building your position 📈
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="card bg-gradient-to-br from-gold-900/30 to-gold-800/30 border-2 border-gold-500 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ShareNetwork size={28} weight="fill" className="text-gold-400" />
            Your Referral Link
          </h2>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gold-500/30">
            <div className="flex items-center gap-3">
              <code className="flex-1 text-gold-300 font-mono text-lg break-all">
                {shareUrl}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-3 bg-gold-600 hover:bg-gold-700 rounded-lg transition-all"
              >
                {copied ? (
                  <Check size={24} weight="bold" className="text-white" />
                ) : (
                  <Copy size={24} weight="bold" className="text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShareTwitter}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-100 rounded-xl text-gray-950 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ShareNetwork size={24} weight="fill" />
              Share on X
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all"
            >
              <Copy size={24} weight="bold" />
              Copy Link
            </button>
          </div>

          {/* Value Hint */}
          <div className="mt-4 p-4 bg-gold-950/30 rounded-lg border border-gold-500/20">
            <p className="text-sm text-gray-300 text-center">
              💡 <strong>Pro Tip:</strong> High quality score = higher share of future rewards.
              Invite friends who'll actually play.
            </p>
          </div>
        </div>

        {/* Milestones */}
        {data.milestones.length > 0 && (
          <div className="card bg-gray-800/50 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={28} weight="fill" className="text-yellow-400" />
              Milestones Achieved
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.milestones.map((milestone, index) => {
                const info = getMilestoneInfo(milestone.type);
                const Icon = info.icon;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <Icon size={32} weight="fill" className={info.color} />
                    <div>
                      <div className={`font-bold ${info.color}`}>{info.label}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Referrals */}
        {data.recentReferrals.length > 0 && (
          <div className="card bg-gray-800/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Invites</h2>

            <div className="space-y-3">
              {data.recentReferrals.map((referral, index) => {
                const daysSinceActive = Math.floor(
                  (new Date().getTime() - new Date(referral.lastActive).getTime()) / (1000 * 60 * 60 * 24)
                );
                const isActive = daysSinceActive < 7;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <div>
                        <div className="font-bold text-white">{referral.username}</div>
                        <div className="text-sm text-gray-400">Level {referral.level}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-300">
                        {isActive ? 'Active' : `${daysSinceActive}d ago`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 card bg-gray-800/30 p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">How Referrals Work</h3>

          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <strong>Share your link</strong> - Friend signs up with your code
                <div className="text-sm text-gray-400 mt-1">You: +100 XP | Them: +50 XP</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <strong>They draft a team</strong> - Friend creates their first team
                <div className="text-sm text-gray-400 mt-1">You: +50 XP bonus</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <strong>They stay active</strong> - Friend completes Week 1
                <div className="text-sm text-gray-400 mt-1">You: +100 XP | Quality score increases</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
              <div>
                <strong>Build your position</strong> - High quality score = bigger share later
                <div className="text-sm text-gray-400 mt-1">💰 Early supporters with engaged referrals will be rewarded</div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Rank */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            You're ranked <strong className="text-gold-400">#{data.recruiterRank}</strong> among all recruiters
          </p>
        </div>
      </div>
    </div>
  );
}
