// Shared types matching backend API response shapes

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  twitterHandle?: string;
  avatarUrl: string;
  ctMasteryScore: number;
  ctMasteryLevel?: string;
  referralCode: string;
  isFoundingMember: boolean;
  foundingMemberNumber?: number;
  createdAt?: string;
  lastSeenAt?: string;
}

export interface ForesightScore {
  totalScore: number;
  seasonScore: number;
  weekScore: number;
  tier: string;
  tierProgress: {
    currentTier: string;
    nextTier: string;
    progress: number;
    fsToNextTier: number;
  };
  allTimeRank: number;
  seasonRank: number;
  weekRank: number;
  effectiveMultiplier: number;
  multiplierActive: boolean;
  multiplierDaysRemaining?: number;
}

export interface Contest {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  lockTime?: string;
  isPrizeLeague: boolean;
  prizePool: number;
  prizePoolFormatted?: string;
  playerCount: number;
  entryFee?: number;
  entryFeeFormatted?: string;
  isFree?: boolean;
  description?: string;
  teamSize?: number;
  hasCaptain?: boolean;
  maxPlayers?: number;
}

export interface ContestType {
  id: string;
  displayOrder: number;
  name: string;
  entryFee: number;
  prizePool: number;
  isFree: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalScore: number;
  tier?: string;
  percentile?: number;
  prizeAmount?: number;
  teamName?: string;
}

export interface Influencer {
  id: number;
  handle: string;
  name: string;
  avatar: string;
  tier: 'S' | 'A' | 'B' | 'C';
  price: number;
  totalPoints: number;
  followers: number;
  engagementRate: number;
  isScouted?: boolean;
}

export interface InfluencerDetail extends Influencer {
  trends?: {
    followers: number[];
    engagement: number[];
  };
  recentTweets?: Tweet[];
}

export interface Team {
  id: string;
  name: string;
  creator?: string;
  influencers: Influencer[];
  totalScore: number;
  createdAt: string;
}

export interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  engagementScore: number;
  createdAt: string;
}

export interface RisingStar {
  id: number;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  followers: number;
  growthRate: number;
  avgLikes: number;
  avgRetweets: number;
  viralTweets: number;
  votesFor: number;
  votesAgainst: number;
  userVote?: string;
  voteScore: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  questType: string;
  category: string;
  target: number;
  targetType: string;
  fsReward: number;
  icon: string;
  displayOrder: number;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
  isClaimed: boolean;
  claimedAt?: string;
  fsEarned?: number;
}

export interface QuestSummary {
  daily: { total: number; completed: number };
  weekly: { total: number; completed: number };
  onboarding: { total: number; completed: number };
  unclaimed: number;
}

export interface DailyStatus {
  date: string;
  activities: Record<string, boolean>;
  completedCount: number;
  totalPossible: number;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Activity {
  userId?: string;
  username?: string;
  avatar?: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface UserStats {
  user: User;
  ranking: { rank: number; percentile: number; total_users: number };
  stats: {
    voting: Record<string, any>;
    fantasy: Record<string, any>;
    achievements: Record<string, any>;
  };
}

// Tier color/label helpers
export const TIER_CONFIG = {
  S: { color: '#F59E0B', label: 'S-Tier', bg: 'rgba(245, 158, 11, 0.15)' },
  A: { color: '#06B6D4', label: 'A-Tier', bg: 'rgba(6, 182, 212, 0.15)' },
  B: { color: '#10B981', label: 'B-Tier', bg: 'rgba(16, 185, 129, 0.15)' },
  C: { color: '#71717A', label: 'C-Tier', bg: 'rgba(113, 113, 122, 0.15)' },
} as const;
