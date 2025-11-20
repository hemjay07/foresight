import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAccount } from 'wagmi';
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
  const { onlineUsers, isConnected } = useRealtime();
  const { address } = useAccount();

  const navItems: Array<{ path: string; label: string; icon: any; highlight?: boolean }> = [
    { path: '/', label: 'Home', icon: House },
    { path: '/draft', label: 'CT Draft', icon: Trophy, highlight: true },
    { path: '/vote', label: 'Vote', icon: Target },
    { path: '/profile', label: 'Profile', icon: Users },
  ];

  return (
    <div className="miniapp-container min-h-screen py-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-base-blue to-purple-500 bg-clip-text text-transparent">
              CT LEAGUE
            </div>
          </Link>

          {/* Live Presence Indicator */}
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400 font-medium">
                {onlineUsers.toLocaleString()} online
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">

          {/* Profile Icon */}
          {address && (
            <Link
              to="/profile"
              className={`p-2.5 rounded-lg transition-all ${
                location.pathname === '/profile'
                  ? 'bg-base-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="View Profile"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          )}

          <ConnectButton
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
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
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : item.highlight
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <Icon
                size={18}
                weight={isActive ? 'fill' : 'regular'}
                className="transition-all"
              />
              <span>{item.label}</span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white/50 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Built for Base • Powered by Foresight</p>
      </footer>
    </div>
  );
}
