import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  Trophy,
  Newspaper,
  SignIn,
  CaretDown,
  Copy,
  ArrowSquareOut,
  SignOut,
  Check,
} from '@phosphor-icons/react';
import Footer from './Footer';
import EngagementBanner from './EngagementBanner';
import ForesightScoreDisplay from './ForesightScoreDisplay';
import PageTransition from './PageTransition';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  matchPaths?: string[]; // Additional paths that should highlight this nav item
  highlight?: boolean;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isConnected, address, displayAddress, login, logout } = useAuth();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    }
    if (walletMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [walletMenuOpen]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3-item navigation: Compete / Feed / Profile (logo handles Home)
  const navItems: NavItem[] = [
    {
      path: '/compete',
      label: 'Compete',
      icon: Trophy,
      matchPaths: ['/draft', '/contest'],
    },
    {
      path: '/feed',
      label: 'Feed',
      icon: Newspaper,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      matchPaths: ['/settings', '/referrals', '/progress'],
    },
  ];

  // Check if current path matches nav item
  const isNavActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return false;
  };

  return (
    <div className="miniapp-container min-h-screen flex flex-col">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.svg" alt="Foresight" className="h-7 w-auto" />
              <span className="font-display font-bold text-white hidden sm:block">Foresight</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = isNavActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? item.highlight
                          ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-gray-950 shadow-gold'
                          : 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                        : item.highlight
                          ? 'text-gold-400 hover:bg-gold-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side: FS Score + Wallet */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <Link to="/progress" className="hidden lg:block">
                <ForesightScoreDisplay variant="minimal" />
              </Link>
            )}
            {isConnected ? (
              /* Connected state — identical UI for both auth paths */
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono text-xs">{displayAddress}</span>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={`text-gray-500 transition-transform ${walletMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {walletMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl shadow-black/50 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Address header */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Connected</p>
                      <p className="font-mono text-xs text-white">{displayAddress}</p>
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          if (address) handleCopyAddress(address);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        {copied ? (
                          <Check size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                        {copied ? 'Copied!' : 'Copy Address'}
                      </button>

                      <a
                        href={`https://solscan.io/account/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setWalletMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <ArrowSquareOut size={16} />
                        View on Explorer
                      </a>
                    </div>

                    {/* Disconnect */}
                    <div className="border-t border-gray-800 py-1">
                      <button
                        onClick={() => {
                          logout();
                          setWalletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <SignOut size={16} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-gray-950 font-medium text-sm hover:bg-gold-400 transition-colors"
              >
                <SignIn size={16} weight="bold" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Engagement Banner */}
      <EngagementBanner />

      {/* Main Content with smooth page transitions */}
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-950/95 backdrop-blur-xl border-t border-gray-700/50 px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = isNavActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? item.highlight
                      ? 'text-gold-400'
                      : 'text-gold-400'
                    : 'text-gray-500'
                }`}
              >
                <Icon
                  size={22}
                  weight={isActive ? 'fill' : 'regular'}
                  className={isActive && item.highlight ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-gold-400' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-20" />

      {/* Footer - hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
