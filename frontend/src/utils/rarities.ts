/**
 * Shared Rarity/Tier Definitions for CT Fantasy League
 * Consistent tier labels, gradients, and styling across all pages
 */

import { Sparkle, Star, TrendUp, Medal } from '@phosphor-icons/react';

export interface RarityInfo {
  label: string;
  gradient: string;
  badge: string;
  icon: typeof Sparkle;
  glow: string;
  border: string;
  text: string;
}

export const rarities: Record<string, RarityInfo> = {
  S: {
    label: 'Legendary',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    badge: 'bg-amber-500',
    icon: Sparkle,
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
  },
  A: {
    label: 'Epic',
    gradient: 'from-purple-500/20 to-violet-500/10',
    badge: 'bg-purple-500',
    icon: Star,
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.25)]',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
  },
  B: {
    label: 'Rare',
    gradient: 'from-blue-500/20 to-sky-500/10',
    badge: 'bg-blue-500',
    icon: TrendUp,
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
  },
  C: {
    label: 'Common',
    gradient: 'from-gray-600/20 to-gray-700/10',
    badge: 'bg-gray-500',
    icon: Medal,
    glow: '',
    border: 'border-gray-700',
    text: 'text-gray-400',
  },
};

/**
 * Get rarity information for a tier
 * Falls back to Common (C) if tier is invalid
 */
export function getRarityInfo(tier: string): RarityInfo {
  return rarities[tier] || rarities.C;
}
