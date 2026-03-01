import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect, useMemo, useCallback, useState } from 'react';

import { RealtimeProvider } from './contexts/RealtimeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { AchievementToastProvider } from './contexts/AchievementToastContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import AchievementToastContainer from './components/AchievementToastContainer';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorLogger';
import { useMiniApp } from './hooks/useMiniApp';
import { usePrivyAuth } from './hooks/usePrivyAuth';
import { AuthContext, type AuthState } from './hooks/useAuth';

// Pages - Primary Navigation
import Home from './pages/Home';
import Play from './pages/Compete';
import Feed from './pages/Intel';
import Profile from './pages/Profile';

// Pages - Sub-routes
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Referrals from './pages/Referrals';

// Pages - Game Features
import Draft from './pages/Draft';
import ContestDetail from './pages/ContestDetail';

// Design Tools
import CardCompare from './pages/CardCompare';

// Legal Pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Imprint from './pages/Imprint';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

const solanaConnectors = toSolanaWalletConnectors();

const queryClient = new QueryClient();

/**
 * Privy auth bridge — populates AuthContext from Privy state
 */
function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout: privyLogout } = usePrivy();
  const { syncError, retrySync } = usePrivyAuth();

  const { address, email, twitterHandle } = useMemo(() => {
    if (!user) return { address: undefined, email: undefined, twitterHandle: undefined };

    // Extract wallet
    const solanaWallet = user.linkedAccounts?.find(
      (a: any) => a.type === 'wallet' && a.chainType === 'solana'
    );
    let addr: string | undefined;
    if (solanaWallet && 'address' in solanaWallet) {
      addr = (solanaWallet as any).address as string;
    } else {
      const anyWallet = user.linkedAccounts?.find((a: any) => a.type === 'wallet');
      if (anyWallet && 'address' in anyWallet) addr = (anyWallet as any).address as string;
    }

    // Extract email
    const emailAccount = user.linkedAccounts?.find((a: any) => a.type === 'email');
    const em = emailAccount && 'address' in emailAccount
      ? (emailAccount as any).address as string
      : undefined;

    // Extract Twitter
    const twitterAccount = user.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
    const tw = twitterAccount
      ? ((twitterAccount as any).username || (twitterAccount as any).name || undefined)
      : undefined;

    return { address: addr, email: em, twitterHandle: tw };
  }, [user]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('authToken');
    await privyLogout();
  }, [privyLogout]);

  const authState: AuthState = useMemo(() => {
    // Best available display name: @handle > email prefix > truncated wallet > empty
    const displayName = twitterHandle
      ? `@${twitterHandle}`
      : email
        ? email.split('@')[0]
        : address
          ? `${address.slice(0, 4)}...${address.slice(-4)}`
          : '';

    const displayAddress = address
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : twitterHandle
        ? `@${twitterHandle}`
        : email || '';

    return {
      isConnected: ready && authenticated,
      address,
      displayAddress,
      email,
      twitterHandle,
      displayName,
      isBackendAuthed: !!localStorage.getItem('authToken'),
      login,
      logout: handleLogout,
    };
  }, [ready, authenticated, address, email, twitterHandle, login, handleLogout]);

  const isSyncing = ready && authenticated && !localStorage.getItem('authToken');
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Reset dismiss when error changes
  useEffect(() => {
    if (syncError) setErrorDismissed(false);
  }, [syncError]);

  return (
    <AuthContext.Provider value={authState}>
      {/* Syncing indicator — only while actively completing sign-in, no error text */}
      {isSyncing && !syncError && (
        <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border border-gold-500 border-t-transparent rounded-full animate-spin" />
          Completing sign-in…
        </div>
      )}
      {/* Error notification — small, dismissible, non-blocking */}
      {isSyncing && syncError && !errorDismissed && (
        <div className="fixed bottom-24 right-4 z-50 max-w-xs bg-gray-900 border border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Sign-in interrupted</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {syncError === 'rate_limited'
                ? 'Too many attempts — try again in a few minutes'
                : 'Could not reach server — check your connection'}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 shrink-0">
            {syncError !== 'rate_limited' && (
              <button
                onClick={() => { setErrorDismissed(false); retrySync(); }}
                className="text-xs text-gold-400 hover:text-gold-300 font-medium"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setErrorDismissed(true)}
              className="text-gray-600 hover:text-gray-400 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

function AppContent() {
  const { isReady } = useMiniApp();

  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Foresight...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Primary Navigation — 4 items */}
          <Route path="/" element={<Home />} />
          <Route path="/compete" element={<Play />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />

          {/* Sub-routes */}
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/referrals" element={<Referrals />} />

          {/* Game Features */}
          <Route path="/draft/:contestId" element={<Draft />} />
          <Route path="/contest/:id" element={<ContestDetail />} />

          {/* Legacy redirects */}
          <Route path="/play" element={<Navigate to="/compete" replace />} />
          <Route path="/league" element={<Navigate to="/compete" replace />} />
          <Route path="/contests" element={<Navigate to="/compete?tab=contests" replace />} />
          <Route path="/intel" element={<Navigate to="/feed" replace />} />
          <Route path="/quests" element={<Navigate to="/progress" replace />} />
          <Route path="/arena" element={<Navigate to="/compete" replace />} />

          {/* Design Tools */}
          <Route path="/card-compare" element={<CardCompare />} />

          {/* Legal Pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/imprint" element={<Imprint />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#F59E0B',
          walletChainType: 'solana-only',
        },
        loginMethods: ['wallet', 'email', 'twitter'],
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyAuthBridge>
          {children}
        </PrivyAuthBridge>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AppProviders>
          <RealtimeProvider>
            <NotificationProvider>
              <ToastProvider>
                <AchievementToastProvider>
                  <OnboardingProvider>
                    <AppContent />
                    <AchievementToastContainer />
                  </OnboardingProvider>
                </AchievementToastProvider>
              </ToastProvider>
            </NotificationProvider>
          </RealtimeProvider>
        </AppProviders>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
