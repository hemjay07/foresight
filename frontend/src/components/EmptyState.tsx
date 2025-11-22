/**
 * Empty State Component
 * Professional empty states for better UX
 */

import { type ReactNode } from 'react';
import { MagnifyingGlass, Users, Trophy, Warning } from '@phosphor-icons/react';

interface EmptyStateProps {
  icon?: 'search' | 'users' | 'trophy' | 'warning';
  title: string;
  description?: string;
  action?: ReactNode;
}

const icons = {
  search: MagnifyingGlass,
  users: Users,
  trophy: Trophy,
  warning: Warning,
};

export function EmptyState({ icon = 'search', title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={32} weight="light" className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
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
