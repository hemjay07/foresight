/**
 * XP System Utilities (Frontend)
 * Handles XP calculations, level progression, and perks display
 */

export interface XPLevel {
  level: string;
  minXP: number;
  maxXP: number;
  voteWeight: number;
  maxTransfers: number;
  perks: string[];
}

export const XP_LEVELS: Record<string, XPLevel> = {
  NOVICE: {
    level: 'NOVICE',
    minXP: 0,
    maxXP: 99,
    voteWeight: 1.0,
    maxTransfers: 1,
    perks: ['Basic voting', '1 transfer/week'],
  },
  APPRENTICE: {
    level: 'APPRENTICE',
    minXP: 100,
    maxXP: 249,
    voteWeight: 1.1,
    maxTransfers: 2,
    perks: ['1.1x vote weight', '2 transfers/week', 'Profile badges'],
  },
  SKILLED: {
    level: 'SKILLED',
    minXP: 250,
    maxXP: 499,
    voteWeight: 1.2,
    maxTransfers: 3,
    perks: ['1.2x vote weight', '3 transfers/week', 'Captain change', 'Custom colors'],
  },
  EXPERT: {
    level: 'EXPERT',
    minXP: 500,
    maxXP: 999,
    voteWeight: 1.3,
    maxTransfers: 4,
    perks: ['1.3x vote weight', '4 transfers/week', 'Early lock bonus', 'Vote change'],
  },
  MASTER: {
    level: 'MASTER',
    minXP: 1000,
    maxXP: 2499,
    voteWeight: 1.5,
    maxTransfers: 5,
    perks: ['1.5x vote weight', '5 transfers/week', 'Private leagues', 'Profile flair'],
  },
  LEGENDARY: {
    level: 'LEGENDARY',
    minXP: 2500,
    maxXP: Infinity,
    voteWeight: 2.0,
    maxTransfers: 999,
    perks: ['2x vote weight', 'Unlimited transfers', 'All perks', 'Whale badge'],
  },
};

export function getXPLevel(xp: number): {
  level: string;
  levelInfo: XPLevel;
  progress: number;
  nextLevel: string | null;
  xpToNext: number;
} {
  let currentLevel: XPLevel | null = null;
  let levelName = 'NOVICE';

  for (const [name, level] of Object.entries(XP_LEVELS)) {
    if (xp >= level.minXP && xp <= level.maxXP) {
      currentLevel = level;
      levelName = name;
      break;
    }
  }

  if (!currentLevel) {
    currentLevel = XP_LEVELS.LEGENDARY;
    levelName = 'LEGENDARY';
  }

  const progress =
    currentLevel.level === 'LEGENDARY'
      ? 100
      : ((xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP + 1)) * 100;

  const levels = Object.keys(XP_LEVELS);
  const currentIndex = levels.indexOf(levelName);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  const xpToNext = nextLevel ? XP_LEVELS[nextLevel].minXP - xp : 0;

  return {
    level: levelName,
    levelInfo: currentLevel,
    progress: Math.min(100, Math.max(0, progress)),
    nextLevel,
    xpToNext: Math.max(0, xpToNext),
  };
}

export function getLevelBadge(level: string): string {
  const badges: Record<string, string> = {
    NOVICE: '🔰',
    APPRENTICE: '⚔️',
    SKILLED: '🛡️',
    EXPERT: '👑',
    MASTER: '💎',
    LEGENDARY: '🏆',
  };
  return badges[level] || '🔰';
}

export function getLevelColors(level: string): {
  gradient: string;
  text: string;
  border: string;
  bg: string;
} {
  const colors: Record<string, { gradient: string; text: string; border: string; bg: string }> = {
    NOVICE: {
      gradient: 'from-gray-400 to-gray-600',
      text: 'text-gray-400',
      border: 'border-gray-400',
      bg: 'bg-gray-500/20',
    },
    APPRENTICE: {
      gradient: 'from-blue-400 to-blue-600',
      text: 'text-blue-400',
      border: 'border-blue-400',
      bg: 'bg-blue-500/20',
    },
    SKILLED: {
      gradient: 'from-purple-400 to-purple-600',
      text: 'text-purple-400',
      border: 'border-purple-400',
      bg: 'bg-purple-500/20',
    },
    EXPERT: {
      gradient: 'from-pink-400 to-pink-600',
      text: 'text-pink-400',
      border: 'border-pink-400',
      bg: 'bg-pink-500/20',
    },
    MASTER: {
      gradient: 'from-cyan-400 to-blue-500',
      text: 'text-cyan-400',
      border: 'border-cyan-400',
      bg: 'bg-cyan-500/20',
    },
    LEGENDARY: {
      gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
      text: 'text-yellow-400',
      border: 'border-yellow-400',
      bg: 'bg-yellow-500/20',
    },
  };
  return colors[level] || colors.NOVICE;
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

/**
 * Get numeric level from XP (simplified)
 * Returns a number from 1-6 based on XP thresholds
 */
export function getNumericLevel(xp: number): number {
  if (xp >= 2500) return 6; // LEGENDARY
  if (xp >= 1000) return 5; // MASTER
  if (xp >= 500) return 4; // EXPERT
  if (xp >= 250) return 3; // SKILLED
  if (xp >= 100) return 2; // APPRENTICE
  return 1; // NOVICE
}
