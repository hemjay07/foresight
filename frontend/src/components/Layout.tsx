import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  House,
  Users,
  Target,
  Trophy,
} from '@phosphor-icons/react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems: Array<{ path: string; label: string; icon: any; highlight?: boolean }> = [
    { path: '/', label: 'Home', icon: House },
    { path: '/draft', label: 'CT Draft', icon: Trophy, highlight: true },
    { path: '/vote', label: 'CT Spotlight', icon: Target },
    { path: '/profile', label: 'Profile', icon: Users },
  ];

  return (
    <div className="miniapp-container min-h-screen py-6">
      {/* Header with Navigation */}
      <header className="flex items-center justify-between mb-8">
        {/* Navigation */}
        <nav className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-brand-600 text-white shadow-soft-lg'
                    : item.highlight
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                <Icon
                  size={18}
                  weight={isActive ? 'fill' : 'regular'}
                  className="transition-all"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: Wallet */}
        <div className="flex items-center gap-3">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Built for Base • Powered by Foresight</p>
      </footer>
    </div>
  );
}
