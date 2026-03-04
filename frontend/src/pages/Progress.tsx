/**
 * Progress - Unified Progress Hub
 * Combines Foresight Score overview with Quest system
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { hasSession } from '../lib/apiClient';
import {
  Target, Trophy, Star, Sparkle, TrendUp, Lightning, Gift,
  CheckCircle, Sun, CalendarBlank, Users, XLogo, Share,
  Chat, Medal, Crown, Eye, Diamond, Flame, CaretRight, Rocket, Lock,
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import FoundingMemberBadge from '../components/FoundingMemberBadge';
import FoundingMembersWall from '../components/FoundingMembersWall';
import TierGuide from '../components/TierGuide';
import SEO from '../components/SEO';


type QuestTab = 'daily' | 'weekly' | 'onboarding' | 'achievement';

interface TierProgress {
  currentTier: string;
  nextTier: string | null;
  currentThreshold: number;
  nextThreshold: number;
  progress: number;
  fsToNextTier: number;
}

interface FsData {
  totalScore: number;
  weekScore: number;
  seasonScore: number;
  tier: string;
  tierProgress: TierProgress;
  allTimeRank: number | null;
  seasonRank: number | null;
  weekRank: number | null;
  effectiveMultiplier: number;
  isFoundingMember: boolean;
  foundingMemberNumber?: number;
  earlyAdopterTier?: string;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  fsReward: number;
  icon: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  fsEarned: number;
}

interface QuestSummary {
  total: number;
  completed: number;
  claimed: number;
}

const TIER_CONFIG = {
  bronze: { color: 'text-orange-400', bg: 'bg-orange-500/20', gradient: 'from-orange-500 to-amber-600' },
  silver: { color: 'text-gray-300', bg: 'bg-gray-400/20', gradient: 'from-gray-400 to-gray-500' },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', gradient: 'from-yellow-500 to-amber-500' },
  platinum: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', gradient: 'from-cyan-400 to-blue-500' },
  diamond: { color: 'text-gold-400', bg: 'bg-gold-500/20', gradient: 'from-gold-500 to-amber-600' },
} as const;

const TIER_ICONS: Record<string, React.ElementType> = {
  bronze: Medal,
  silver: Star,
  gold: Trophy,
  platinum: Crown,
  diamond: Diamond,
};

const QUEST_ICONS: Record<string, React.ElementType> = {
  wallet: Lightning, user: Users, users: Users, trophy: Trophy,
  twitter: XLogo, share: Share, star: Star, sun: Sun,
  chart: TrendUp, target: Target, message: Chat, 'check-circle': CheckCircle,
  medal: Medal, fire: Flame, crown: Crown, eye: Eye, diamond: Diamond,
};

export default function Progress() {
  const { isConnected, login } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fsData, setFsData] = useState<FsData | null>(null);
  const [activeTab, setActiveTab] = useState<QuestTab>('daily');
  const [quests, setQuests] = useState<Record<string, Quest[]>>({});
  const [summary, setSummary] = useState<Record<string, QuestSummary>>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = () => {
    login();
  };

  useEffect(() => {
    if (isConnected) fetchData();
    else setLoading(false);
  }, [isConnected]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setNeedsAuth(false);
      if (!hasSession()) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      const [fsRes, questsRes] = await Promise.all([
        apiClient.get('/api/v2/fs/me').catch((e) => ({ data: { success: false }, status: e.response?.status })),
        apiClient.get('/api/v2/quests').catch((e) => ({ data: { success: false }, status: e.response?.status })),
      ]);

      // Check if APIs failed due to auth issues
      const fsAuthFailed = !fsRes.data.success && ((fsRes as any).status === 401 || fsRes.data.error?.includes('token'));
      const questsAuthFailed = !questsRes.data.success && ((questsRes as any).status === 401 || questsRes.data.error?.includes('token'));

      if (fsAuthFailed || questsAuthFailed) {
        // Auth failure - token is invalid
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      // Only set fsData if we have valid data with required fields
      if (fsRes.data.success && fsRes.data.data && typeof fsRes.data.data.totalScore === 'number') {
        setFsData(fsRes.data.data);
      }
      if (questsRes.data.success && questsRes.data.data) {
        setQuests(questsRes.data.data.quests || {});
        setSummary(questsRes.data.data.summary || {});
      }

      // Trigger daily login quest (idempotent — backend dedupes by day)
      apiClient.post('/api/v2/fs/track-activity', { activityType: 'daily_login', durationSeconds: 1 }).catch(() => {}); // non-blocking, silent fail
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (questId: string) => {
    try {
      setClaiming(questId);
      if (!hasSession()) return;

      const response = await apiClient.post(`/api/v2/quests/${questId}/claim`, {});

      if (response.data.success) {
        showToast(`+${response.data.data.multipliedReward} FS earned!`, 'success');
        fetchData();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to claim', 'error');
    } finally {
      setClaiming(null);
    }
  };

  const claimAllRewards = async () => {
    try {
      setClaimingAll(true);
      if (!hasSession()) return;

      const claimableQuests = Object.values(quests).flat().filter(q => q.isCompleted && !q.isClaimed);
      let totalEarned = 0;

      for (const quest of claimableQuests) {
        const response = await apiClient.post(`/api/v2/quests/${quest.id}/claim`, {});
        if (response.data.success) {
          totalEarned += response.data.data.multipliedReward;
        }
      }

      showToast(`+${totalEarned} FS earned from ${claimableQuests.length} quests!`, 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to claim all', 'error');
    } finally {
      setClaimingAll(false);
    }
  };

  const getQuestIcon = (iconName: string) => QUEST_ICONS[iconName] || Target;
  const tierConfig = fsData ? TIER_CONFIG[fsData.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze : TIER_CONFIG.bronze;
  const CurrentTierIcon = fsData ? (TIER_ICONS[fsData.tier] || Medal) : Medal;

  const getTierProgress = () => {
    if (!fsData || !fsData.tierProgress?.nextTier) return 100;
    return Math.min(100, fsData.tierProgress.progress || 0);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Hero */}
        <div className="text-center py-4 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-gold">
            <Lightning size={24} weight="fill" className="text-gray-950 sm:!w-8 sm:!h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Your Foresight Score</h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">Track your progress, complete quests, and climb the rankings</p>
        </div>

        {/* Preview Cards */}
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { icon: Sparkle, title: 'Foresight Score', desc: 'Earn FS through gameplay and quests' },
            { icon: Target, title: 'Daily Quests', desc: 'Complete challenges for bonus rewards' },
            { icon: Trophy, title: 'Tier Rewards', desc: 'Unlock perks as you level up' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:flex-col sm:text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gold-500/20 flex items-center justify-center shrink-0 sm:mx-auto sm:mb-1">
                  <Icon size={20} weight="fill" className="text-gold-400" />
                </div>
                <div className="sm:space-y-1">
                  <h3 className="font-semibold text-white text-sm sm:text-base">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-xl p-4 sm:p-6 text-center">
          <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Ready to start earning?</h3>
          <p className="text-sm text-gray-400 mb-3 sm:mb-4">Sign in to begin tracking your progress</p>
          <div className="text-xs sm:text-sm text-gray-500">Use the "Sign In" button above</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading progress...</p>
      </div>
    );
  }

  // Connected but needs SIWE authentication
  if (needsAuth && isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Your wallet is connected, but you need to sign in to view your progress and quests.
          </p>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-950 font-semibold transition-all mb-6"
          >
            {signingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lightning size={20} weight="fill" />
                Sign In with Wallet
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            This will prompt your wallet to sign a message. No gas fees required.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'daily' as QuestTab, label: 'Daily', icon: Sun },
    { id: 'weekly' as QuestTab, label: 'Weekly', icon: CalendarBlank },
    { id: 'onboarding' as QuestTab, label: 'Onboarding', icon: Star },
    { id: 'achievement' as QuestTab, label: 'Achievements', icon: Trophy },
  ];

  // Get all claimable quests (shown in prominent section)
  const allClaimableQuests = Object.values(quests).flat().filter(q => q.isCompleted && !q.isClaimed);
  const claimableCount = allClaimableQuests.length;

  // For the tabs, show non-claimable quests (in-progress or claimed), sorted
  const currentQuests = (quests[activeTab] || [])
    .filter(q => q.isClaimed || !q.isCompleted) // Exclude claimable (shown above)
    .sort((a, b) => {
      // Sort: in-progress first, then claimed
      if (a.isClaimed && !b.isClaimed) return 1;
      if (!a.isClaimed && b.isClaimed) return -1;
      return 0;
    });
  const currentSummary = summary[activeTab];
  const hasQuests = Object.values(quests).some(arr => arr && arr.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
      <SEO
        title="Progress — Quests & XP"
        description="Complete quests, earn XP, and level up in Foresight. Track your daily and weekly challenges for bonus rewards."
        keywords="crypto quests, foresight XP, CT competition rewards, crypto gaming progress"
        path="/progress"
      />
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center">
            <Lightning size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Progress</h1>
            <p className="text-xs sm:text-sm text-gray-400">Your Foresight Score & Quests</p>
          </div>
        </div>
      </div>

      {/* FS Hero Card */}
      {fsData && (
        <div className={`bg-gradient-to-br ${tierConfig.gradient} rounded-2xl p-[1px] mb-4 sm:mb-6`}>
          <div className="bg-gray-900 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl ${tierConfig.bg} flex items-center justify-center shrink-0`}>
                  <CurrentTierIcon size={24} weight="fill" className={`${tierConfig.color} sm:!w-8 sm:!h-8`} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1 flex items-center gap-2">
                    Foresight Score
                    <FoundingMemberBadge
                      isFoundingMember={fsData.isFoundingMember}
                      foundingMemberNumber={fsData.foundingMemberNumber}
                      earlyAdopterTier={fsData.earlyAdopterTier}
                      variant="minimal"
                    />
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold tabular-nums text-white leading-none">{(fsData.totalScore ?? 0).toLocaleString()}<span className="text-sm sm:text-base font-sans font-normal text-gray-400 ml-1">FS</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest ${tierConfig.bg} ${tierConfig.color}`}>
                      {fsData.tier || 'bronze'}
                    </span>
                    {(fsData.effectiveMultiplier ?? 1) > 1 && (
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-neon-500">{fsData.effectiveMultiplier.toFixed(2)}x boost</span>
                    )}
                    <TierGuide
                      currentTier={fsData.tier}
                      currentScore={fsData.totalScore}
                      isFoundingMember={fsData.isFoundingMember}
                      effectiveMultiplier={fsData.effectiveMultiplier}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gray-800/50">
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">This Week</div>
                  <div className="text-sm sm:text-lg font-mono font-bold text-neon-500 tabular-nums">+{(fsData.weekScore ?? 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gray-800/50">
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">All-Time</div>
                  <div className="text-sm sm:text-lg font-mono font-bold text-gold-400 tabular-nums">{fsData.allTimeRank ? `#${fsData.allTimeRank}` : '—'}</div>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gray-800/50">
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Season</div>
                  <div className="text-sm sm:text-lg font-mono font-bold text-white tabular-nums">
                    {(fsData.seasonScore ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {fsData.tierProgress?.nextTier && (
              <div className="mt-4 pt-4 sm:mt-6 sm:pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                  <span className="text-gray-400">Progress to {fsData.tierProgress.nextTier}</span>
                  <span className={`font-mono font-bold tabular-nums ${tierConfig.color}`}>{(fsData.tierProgress.fsToNextTier ?? 0).toLocaleString()} FS to go</span>
                </div>
                <div className="h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${tierConfig.gradient} rounded-full`} style={{ width: `${getTierProgress()}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No FS yet - Check if user needs to sign in */}
      {!fsData && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center mb-6">
          <Rocket size={40} className="mx-auto mb-3 text-gold-400" />
          <h3 className="text-xl font-bold text-white mb-2">Start Earning Foresight Score</h3>
          {!hasSession() ? (
            <>
              <p className="text-gray-400 mb-4">Sign in to track your progress and complete quests</p>
              <Link to="/compete?tab=contests" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-gray-950 font-medium">
                <Lightning size={18} weight="fill" /> Sign In & Play <CaretRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-4">Complete quests and play games to build your score</p>
              <Link to="/compete?tab=contests" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-gray-950 font-medium">
                <Trophy size={18} /> Browse Contests <CaretRight size={16} />
              </Link>
            </>
          )}
        </div>
      )}

      {/* Ready to Claim Section */}
      {claimableCount > 0 && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Gift size={18} className="text-neon-500" />
              Ready to Claim
              <span className="px-1.5 py-0.5 rounded-full bg-neon-500/20 text-neon-500 text-[11px] sm:text-xs font-bold font-mono">
                {claimableCount}
              </span>
            </h2>
            {claimableCount > 1 && (
              <button
                onClick={claimAllRewards}
                disabled={claimingAll}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-neon-500/20 hover:bg-neon-500/30 border border-neon-500/40 text-neon-500 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
              >
                {claimingAll ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Sparkle size={14} weight="fill" />
                    Claim All
                  </>
                )}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {Object.values(quests).flat().filter(q => q.isCompleted && !q.isClaimed).map((quest) => {
              const QuestIcon = getQuestIcon(quest.icon);
              return (
                <div
                  key={`claim-${quest.id}`}
                  className="bg-neon-500/5 border border-neon-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neon-500/15 flex items-center justify-center shrink-0">
                    <QuestIcon size={20} weight="fill" className="text-neon-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white">{quest.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{quest.description}</p>
                  </div>
                  <button
                    onClick={() => claimReward(quest.id)}
                    disabled={claiming === quest.id}
                    className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-neon-500/20 hover:bg-neon-500/30 border border-neon-500/40 text-neon-500 text-xs sm:text-sm font-bold font-mono transition-all disabled:opacity-50"
                  >
                    {claiming === quest.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Gift size={16} weight="fill" />
                        <span className="hidden sm:inline">Claim</span> +<span className="tabular-nums">{quest.fsReward}</span> FS
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quest Section - only show when we have quest data */}
      {hasQuests && (
        <>
      {/* Quest Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const tabSummary = summary[tab.id];
          const hasClaimable = (quests[tab.id] || []).some(q => q.isCompleted && !q.isClaimed);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                isActive ? 'bg-gold-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              {tab.label}
              {tabSummary && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-gray-700'}`}>
                  {tabSummary.completed}/{tabSummary.total}
                </span>
              )}
              {hasClaimable && !isActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quest List - shows in-progress and completed (not claimable) */}
      <div className="space-y-2">
        {currentQuests.map((quest) => {
          const QuestIcon = getQuestIcon(quest.icon);
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
          const isInProgress = !quest.isClaimed && !quest.isCompleted;

          return (
            <div
              key={quest.id}
              className={`bg-gray-900/50 rounded-xl border transition-all ${
                quest.isClaimed ? 'border-gray-700 opacity-60' : 'border-gray-800'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  quest.isClaimed ? 'bg-neon-500/15' : 'bg-gray-800'
                }`}>
                  {quest.isClaimed ? (
                    <CheckCircle size={24} weight="fill" className="text-neon-500" />
                  ) : (
                    <QuestIcon size={24} weight="fill" className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${quest.isClaimed ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {quest.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{quest.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {isInProgress && (
                    <div className="text-right">
                      <div className="text-sm font-mono text-gray-400">{quest.progress}/{quest.target}</div>
                      <div className="w-20 h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {quest.isClaimed && (
                    <div className="text-neon-500 font-semibold text-sm font-mono tabular-nums">
                      +{quest.fsEarned} FS
                    </div>
                  )}
                  {isInProgress && (
                    <div className="flex items-center gap-1 text-gold-400 font-medium text-sm bg-gold-500/10 px-2 py-1 rounded-lg">
                      <Sparkle size={14} weight="fill" /> {quest.fsReward}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {currentQuests.length === 0 && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">
              {claimableCount > 0
                ? 'All quests ready to claim are shown above!'
                : 'No quests available in this category'}
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Leaderboard Link */}
      <Link
        to="/compete?tab=rankings&type=fs"
        className="flex items-center justify-between p-4 mt-8 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
            <Medal size={20} className="text-gold-400" />
          </div>
          <div>
            <div className="font-semibold text-white">View FS Leaderboard</div>
            <div className="text-sm text-gray-500">See where you rank</div>
          </div>
        </div>
        <CaretRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
      </Link>

      {/* TODO: Re-enable Founding Members Wall when real data is available */}
      {/* <div className="mt-6">
        <FoundingMembersWall variant="compact" limit={50} showCTA={true} />
      </div> */}
    </div>
  );
}
