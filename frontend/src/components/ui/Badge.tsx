import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 's-tier'
  | 'a-tier'
  | 'b-tier'
  | 'c-tier'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  's-tier': 'bg-gold-500/20 text-gold-400 border-gold-500/30',
  'a-tier': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'b-tier': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'c-tier': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'primary': 'bg-gold-500/10 text-gold-400 border-gold-500/20',
  'success': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'warning': 'bg-gold-500/10 text-gold-400 border-gold-500/20',
  'error': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'neutral': 'bg-gray-800 text-gray-300 border-gray-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-micro',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', size = 'md', icon, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1',
          'font-medium border rounded-sm',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Convenience component for tier badges
export interface TierBadgeProps extends Omit<BadgeProps, 'variant'> {
  tier: 'S' | 'A' | 'B' | 'C';
}

export const TierBadge = forwardRef<HTMLSpanElement, TierBadgeProps>(
  ({ tier, ...props }, ref) => {
    const variantMap: Record<string, BadgeVariant> = {
      'S': 's-tier',
      'A': 'a-tier',
      'B': 'b-tier',
      'C': 'c-tier',
    };

    return (
      <Badge ref={ref} variant={variantMap[tier]} {...props}>
        {tier}-Tier
      </Badge>
    );
  }
);

TierBadge.displayName = 'TierBadge';

// Convenience component for status badges
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'pending' | 'completed' | 'failed';
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const variantMap: Record<string, BadgeVariant> = {
      'active': 'success',
      'pending': 'warning',
      'completed': 'primary',
      'failed': 'error',
    };

    const labelMap: Record<string, string> = {
      'active': 'Active',
      'pending': 'Pending',
      'completed': 'Completed',
      'failed': 'Failed',
    };

    return (
      <Badge ref={ref} variant={variantMap[status]} {...props}>
        {children || labelMap[status]}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export default Badge;
