/**
 * Empty State Component
 * Professional empty states for better UX
 */

import { type ReactNode } from 'react';
import {
  MagnifyingGlass, Users, Trophy, Warning, Fire, Crown,
  Target, Lightning, Star, Lock, Sparkle
} from '@phosphor-icons/react';

interface EmptyStateProps {
  icon?: 'search' | 'users' | 'trophy' | 'warning' | 'fire' | 'crown' | 'target' | 'lightning' | 'star' | 'lock' | 'sparkle';
  title: string;
  description?: string;
  action?: ReactNode;
  iconSize?: number;
  iconColor?: string;
  animate?: boolean;
}

const icons = {
  search: MagnifyingGlass,
  users: Users,
  trophy: Trophy,
  warning: Warning,
  fire: Fire,
  crown: Crown,
  target: Target,
  lightning: Lightning,
  star: Star,
  lock: Lock,
  sparkle: Sparkle,
};

const defaultColors = {
  search: 'text-gray-500',
  users: 'text-brand-400',
  trophy: 'text-yellow-400',
  warning: 'text-amber-400',
  fire: 'text-orange-400',
  crown: 'text-brand-500',
  target: 'text-cyan-400',
  lightning: 'text-purple-400',
  star: 'text-yellow-400',
  lock: 'text-gray-500',
  sparkle: 'text-brand-400',
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  iconSize = 64,
  iconColor,
  animate = true,
}: EmptyStateProps) {
  const Icon = icons[icon];
  const color = iconColor || defaultColors[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated Icon Container */}
      <div className={`mb-6 ${animate ? 'animate-bounce-slow' : ''}`}>
        <div className="relative">
          {/* Glow effect */}
          <div className={`absolute inset-0 ${color} opacity-20 blur-2xl rounded-full`}></div>
          {/* Icon */}
          <Icon
            size={iconSize}
            weight="duotone"
            className={`${color} relative transition-all hover:scale-110`}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export function EmptyStateInline({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
      {message}
    </div>
  );
}
