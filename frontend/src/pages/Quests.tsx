/**
 * Quests Page
 * Display and track quest progress, claim rewards
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  Target, Trophy, Fire, Star, Users, Lightning, Gift,
  CheckCircle, Clock, Lock, Sparkle, Sun, CalendarBlank,
  Medal, Crown, TrendUp, Eye, Newspaper, Chat, TwitterLogo,
  Share, UserPlus, Diamond, Flame
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type QuestTab = 'onboarding' | 'daily' | 'weekly' | 'achievement';

interface Quest {
  id: string;
  name: string;
  description: string;
  questType: string;
  category: string;
  target: number;
  targetType: string | null;
  fsReward: number;
  icon: string;
  displayOrder: number;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  isClaimed: boolean;
  claimedAt: string | null;
  fsEarned: number;
}

interface QuestSummary {
  total: number;
  completed: number;
  claimed: number;
}

interface QuestsData {
  onboarding: Quest[];
  daily: Quest[];
  weekly: Quest[];
  achievement: Quest[];
}

// Icon mapping
const QUEST_ICONS: Record<string, React.ElementType> = {
  wallet: Lightning,
  user: Users,
  users: Users,
  trophy: Trophy,
  twitter: TwitterLogo,
  share: Share,
  star: Star,
  sun: Sun,
  chart: TrendUp,
  newspaper: Newspaper,
  target: Target,
  message: Chat,
  'check-circle': CheckCircle,
  medal: Medal,
  fire: Flame,
  crown: Crown,
  eye: Eye,
  diamond: Diamond,
  megaphone: Share,
  trending: TrendUp,
};

export default function Quests() {
  const { isConnected } = useAccount();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<QuestTab>('daily');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [quests, setQuests] = useState<QuestsData | null>(null);
  const [summary, setSummary] = useState<Record<string, QuestSummary>>({});
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchQuests();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setNeedsAuth(false);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/v2/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setQuests(response.data.data.quests);
        setSummary(response.data.data.summary);
      } else {
        // API returned success: false - token might be invalid/expired
        console.error('Quests API returned error:', response.data.error);
        // Clear invalid token and prompt re-auth
        if (response.data.error?.includes('token') || response.data.error?.includes('unauthorized')) {
          localStorage.removeItem('authToken');
          setNeedsAuth(true);
        }
      }
    } catch (error: any) {
      console.error('Error fetching quests:', error);
      // Handle 401 Unauthorized - token expired
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        setNeedsAuth(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (questId: string) => {
    try {
      setClaiming(questId);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/api/v2/quests/${questId}/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const data = response.data.data;
        showToast(
          `+${data.multipliedReward} FS earned from "${data.questName}"!`,
          'success'
        );
        // Refresh quests
        fetchQuests();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to claim reward', 'error');
    } finally {
      setClaiming(null);
    }
  };

  const tabs = [
    { id: 'daily' as QuestTab, label: 'Daily', icon: Sun, color: 'yellow' },
    { id: 'weekly' as QuestTab, label: 'Weekly', icon: CalendarBlank, color: 'cyan' },
    { id: 'onboarding' as QuestTab, label: 'Onboarding', icon: Star, color: 'green' },
    { id: 'achievement' as QuestTab, label: 'Achievements', icon: Trophy, color: 'purple' },
  ];

  const getQuestIcon = (iconName: string) => {
    return QUEST_ICONS[iconName] || Target;
  };

  const getProgressPercent = (quest: Quest) => {
    return Math.min(100, (quest.progress / quest.target) * 100);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Target size={32} className="text-gray-950" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quests</h1>
          <p className="text-gray-400 max-w-md mx-auto">Complete quests to earn Foresight Score and unlock rewards</p>
        </div>

        {/* Preview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
              <Sun size={20} weight="fill" className="text-yellow-400" />
            </div>
            <h3 className="font-medium text-white text-sm">Daily</h3>
            <p className="text-xs text-gray-500">Reset daily</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
              <CalendarBlank size={20} weight="fill" className="text-cyan-400" />
            </div>
            <h3 className="font-medium text-white text-sm">Weekly</h3>
            <p className="text-xs text-gray-500">Bigger rewards</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
              <Star size={20} weight="fill" className="text-green-400" />
            </div>
            <h3 className="font-medium text-white text-sm">Onboarding</h3>
            <p className="text-xs text-gray-500">Get started</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <Trophy size={20} weight="fill" className="text-purple-400" />
            </div>
            <h3 className="font-medium text-white text-sm">Achievements</h3>
            <p className="text-xs text-gray-500">Milestones</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Ready to start earning?</h3>
          <p className="text-gray-400 mb-4">Connect your wallet to view and complete quests</p>
          <div className="text-sm text-gray-500">Use the "Connect Wallet" button above</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading quests...</p>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <Target size={32} className="text-gold-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 mb-4">Sign in with your wallet to view and complete quests</p>
        <p className="text-sm text-gray-500">Click your wallet address in the header and sign the message</p>
      </div>
    );
  }

  const currentQuests = quests?.[activeTab] || [];
  const currentSummary = summary[activeTab];

  return (
    <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-500 to-purple-500 rounded-xl mb-4 shadow-lg">
            <Target size={40} weight="fill" className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Quests</h1>
          <p className="text-gray-400">Complete quests to earn Foresight Score</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const tabSummary = summary[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${
                    isActive
                      ? `bg-${tab.color}-500/20 text-${tab.color}-400 border-2 border-${tab.color}-500/50`
                      : 'bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Icon size={20} weight="fill" />
                  {tab.label}
                  {tabSummary && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gray-700'
                    }`}>
                      {tabSummary.completed}/{tabSummary.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Summary */}
        {currentSummary && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-bold">{currentSummary.completed}</span> / {currentSummary.total} completed
                </div>
                <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full transition-all"
                    style={{ width: `${(currentSummary.completed / currentSummary.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {currentSummary.claimed} rewards claimed
              </div>
            </div>
          </div>
        )}

        {/* Quest List */}
        <div className="space-y-3">
          {currentQuests.map((quest) => {
            const QuestIcon = getQuestIcon(quest.icon);
            const progressPercent = getProgressPercent(quest);
            const canClaim = quest.isCompleted && !quest.isClaimed;

            return (
              <div
                key={quest.id}
                className={`bg-gray-900/50 rounded-xl border transition-all ${
                  quest.isClaimed
                    ? 'border-green-500/30 bg-green-500/5'
                    : quest.isCompleted
                    ? 'border-gold-500/50 bg-gold-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      quest.isClaimed
                        ? 'bg-green-500/20'
                        : quest.isCompleted
                        ? 'bg-gold-500/20'
                        : 'bg-gray-800'
                    }`}>
                      {quest.isClaimed ? (
                        <CheckCircle size={28} weight="fill" className="text-green-400" />
                      ) : (
                        <QuestIcon size={28} weight="fill" className={
                          quest.isCompleted ? 'text-gold-400' : 'text-gray-400'
                        } />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold ${
                          quest.isClaimed ? 'text-green-400' : 'text-white'
                        }`}>
                          {quest.name}
                        </h3>
                        {quest.category && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500 uppercase">
                            {quest.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {quest.description}
                      </p>

                      {/* Progress bar */}
                      {!quest.isClaimed && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                quest.isCompleted ? 'bg-gold-500' : 'bg-gray-600'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {quest.progress} / {quest.target}
                          </span>
                        </div>
                      )}

                      {/* Claimed status */}
                      {quest.isClaimed && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle size={16} weight="fill" />
                          <span>Claimed +{quest.fsEarned} FS</span>
                        </div>
                      )}
                    </div>

                    {/* Reward / Claim */}
                    <div className="shrink-0 text-right">
                      {quest.isClaimed ? (
                        <div className="text-green-400 font-bold">
                          +{quest.fsEarned} FS
                        </div>
                      ) : canClaim ? (
                        <button
                          onClick={() => claimReward(quest.id)}
                          disabled={claiming === quest.id}
                          className="btn-primary btn-sm"
                        >
                          {claiming === quest.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Gift size={16} />
                              Claim
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-gold-400 font-bold">
                            <Sparkle size={16} weight="fill" />
                            {quest.fsReward} FS
                          </div>
                          {!quest.isCompleted && (
                            <span className="text-xs text-gray-500">
                              {Math.round(progressPercent)}% complete
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {currentQuests.length === 0 && (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
              <Target size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No quests available</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Sparkle size={20} weight="fill" className="text-gold-400" />
            How Quests Work
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <Sun size={16} className="text-yellow-400 mt-0.5 shrink-0" />
              <span><strong className="text-white">Daily quests</strong> reset every day at midnight UTC. Complete them for steady FS gains.</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarBlank size={16} className="text-cyan-400 mt-0.5 shrink-0" />
              <span><strong className="text-white">Weekly quests</strong> reset every Monday. Bigger rewards for bigger challenges.</span>
            </li>
            <li className="flex items-start gap-2">
              <Star size={16} className="text-green-400 mt-0.5 shrink-0" />
              <span><strong className="text-white">Onboarding quests</strong> are one-time tasks to get you started.</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy size={16} className="text-purple-400 mt-0.5 shrink-0" />
              <span><strong className="text-white">Achievements</strong> are permanent milestones with the biggest rewards.</span>
            </li>
          </ul>
        </div>
    </div>
  );
}
