import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import {
  House,
  Users,
  Trophy,
  GameController,
  TrendUp,
  Lightning,
  Newspaper,
} from '@phosphor-icons/react';
import Footer from './Footer';
import EngagementBanner from './EngagementBanner';
import ForesightScoreDisplay from './ForesightScoreDisplay';
import PageTransition from './PageTransition';
import { useOnboarding } from '../contexts/OnboardingContext';

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
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { shouldRedirectToFreeLeague, setShowWelcomeModal, markVisited } = useOnboarding();

  // Streamlined navigation: Home / League / Compete / Intel / Profile
  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Home',
      icon: House,
    },
    {
      path: '/league',
      label: 'League',
      icon: GameController,
      matchPaths: ['/draft'],
    },
    {
      path: '/compete',
      label: 'Compete',
      icon: Trophy,
      matchPaths: ['/leaderboard', '/contests', '/contest'],
    },
    {
      path: '/intel',
      label: 'Intel',
      icon: Newspaper,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: Users,
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

  // Handle League button click for first-time users
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.path === '/league' && shouldRedirectToFreeLeague()) {
      e.preventDefault();
      setShowWelcomeModal(true);
      markVisited();
      navigate('/league?onboarding=true');
    }
  };

  return (
    <div className="miniapp-container min-h-screen flex flex-col">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3 -mx-4 sm:-mx-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-gold">
                <Lightning size={18} weight="fill" className="text-gray-950" />
              </div>
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
                    onClick={(e) => handleNavClick(e, item)}
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
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
            />
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
                onClick={(e) => handleNavClick(e, item)}
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
