/**
 * Founding Member / Early Adopter Badge Component
 * Displays badges for special user status with multipliers
 */

import { Star, Lightning, Rocket, Bird } from '@phosphor-icons/react';

interface Props {
  isFoundingMember?: boolean;
  foundingMemberNumber?: number | null;
  earlyAdopterTier?: string | null;
  multiplier?: number;
  multiplierActive?: boolean;
  daysRemaining?: number;
  variant?: 'full' | 'compact' | 'minimal' | 'icon-only';
  className?: string;
}

// Early adopter tier configurations
const EARLY_ADOPTER_CONFIG = {
  founding: {
    label: 'Founding Member',
    shortLabel: 'Founder',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    icon: Star,
    multiplier: 1.5,
    description: '1.5x FS multiplier for 90 days',
  },
  early: {
    label: 'Early Adopter',
    shortLabel: 'Early',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    icon: Rocket,
    multiplier: 1.25,
    description: '1.25x FS multiplier for 60 days',
  },
  bird: {
    label: 'Early Bird',
    shortLabel: 'Bird',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    icon: Bird,
    multiplier: 1.1,
    description: '1.1x FS multiplier for 30 days',
  },
  standard: {
    label: 'Member',
    shortLabel: 'Member',
    color: 'text-gray-400',
    bg: 'bg-gray-700/50',
    border: 'border-gray-600/30',
    icon: Lightning,
    multiplier: 1.0,
    description: 'Standard member',
  },
} as const;

export function getEarlyAdopterConfig(tier: string | null | undefined) {
  if (!tier) return EARLY_ADOPTER_CONFIG.standard;
  return EARLY_ADOPTER_CONFIG[tier as keyof typeof EARLY_ADOPTER_CONFIG] || EARLY_ADOPTER_CONFIG.standard;
}

export default function FoundingMemberBadge({
  isFoundingMember = false,
  foundingMemberNumber,
  earlyAdopterTier,
  multiplier = 1.0,
  multiplierActive = false,
  daysRemaining = 0,
  variant = 'compact',
  className = ''
}: Props) {
  // Determine which badge to show
  const effectiveTier = isFoundingMember ? 'founding' : (earlyAdopterTier || 'standard');
  const config = getEarlyAdopterConfig(effectiveTier);
  const Icon = config.icon;

  // Don't show badge for standard members unless actively boosted
  if (effectiveTier === 'standard' && !multiplierActive) {
    return null;
  }

  // Icon-only variant (for tight spaces like leaderboard rows)
  if (variant === 'icon-only') {
    return (
      <div
        className={`w-5 h-5 rounded flex items-center justify-center ${config.bg} ${className}`}
        title={isFoundingMember ? `Founder #${foundingMemberNumber}` : config.label}
      >
        <Icon size={12} weight="fill" className={config.color} />
      </div>
    );
  }

  // Minimal variant - just icon and short label
  if (variant === 'minimal') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg} ${className}`}
        title={config.description}
      >
        <Icon size={12} weight="fill" className={config.color} />
        <span className={`text-xs font-medium ${config.color}`}>
          {isFoundingMember && foundingMemberNumber ? `#${foundingMemberNumber}` : config.shortLabel}
        </span>
      </div>
    );
  }

  // Compact variant - icon, label, and number
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${config.bg} ${config.border} ${className}`}
        title={config.description}
      >
        <Icon size={14} weight="fill" className={config.color} />
        <span className={`text-xs font-semibold ${config.color}`}>
          {isFoundingMember ? 'Founder' : config.shortLabel}
          {isFoundingMember && foundingMemberNumber && ` #${foundingMemberNumber}`}
        </span>
        {multiplierActive && multiplier > 1 && (
          <span className="text-xs text-green-400 font-bold ml-1">
            {multiplier.toFixed(2)}x
          </span>
        )}
      </div>
    );
  }

  // Full variant - complete badge with description
  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon size={28} weight="fill" className={config.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${config.color}`}>
              {isFoundingMember ? 'Founding Member' : config.label}
            </span>
            {isFoundingMember && foundingMemberNumber && (
              <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                #{foundingMemberNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Multiplier info */}
      {multiplierActive && multiplier > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightning size={16} weight="fill" className="text-green-400" />
              <span className="text-sm text-white font-semibold">
                {multiplier.toFixed(2)}x Multiplier Active
              </span>
            </div>
            {daysRemaining > 0 && (
              <span className="text-xs text-gray-500">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
              style={{
                width: `${Math.max(5, (daysRemaining / (effectiveTier === 'founding' ? 90 : effectiveTier === 'early' ? 60 : 30)) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple inline badge for leaderboard rows
 */
export function FoundingBadgeInline({
  isFoundingMember,
  foundingMemberNumber,
  earlyAdopterTier,
}: Pick<Props, 'isFoundingMember' | 'foundingMemberNumber' | 'earlyAdopterTier'>) {
  if (!isFoundingMember && (!earlyAdopterTier || earlyAdopterTier === 'standard')) {
    return null;
  }

  const effectiveTier = isFoundingMember ? 'founding' : earlyAdopterTier;
  const config = getEarlyAdopterConfig(effectiveTier);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs ${config.color}`}
      title={isFoundingMember ? `Founder #${foundingMemberNumber}` : config.label}
    >
      <Icon size={10} weight="fill" />
    </span>
  );
}

/**
 * Multiplier indicator for any context
 */
export function MultiplierBadge({
  multiplier,
  daysRemaining,
  size = 'md',
}: {
  multiplier: number;
  daysRemaining?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (multiplier <= 1) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 18,
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg bg-green-500/20 border border-green-500/30 ${sizeClasses[size]}`}
      title={daysRemaining ? `${daysRemaining} days remaining` : 'Active multiplier'}
    >
      <Lightning size={iconSizes[size]} weight="fill" className="text-green-400" />
      <span className="font-bold text-green-400">
        {multiplier.toFixed(2)}x
      </span>
    </div>
  );
}
