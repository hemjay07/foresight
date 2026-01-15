import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useEffect } from 'react';

import { config } from './config/wagmi';
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
import { useAutoAuth } from './hooks/useAutoAuth';

// Pages - Primary Navigation
import Home from './pages/Home';
import League from './pages/League';
import Compete from './pages/Compete';
import Intel from './pages/Intel';
import Profile from './pages/Profile';

// Pages - Sub-routes
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Referrals from './pages/Referrals';

// Pages - Game Features
import LeagueUltra from './pages/LeagueUltra';
import Draft from './pages/Draft';
import ContestDetail from './pages/ContestDetail';

// Legal Pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Imprint from './pages/Imprint';


const queryClient = new QueryClient();

function AppContent() {
  // Initialize Farcaster Mini App SDK
  const { isReady, isInMiniApp } = useMiniApp();

  // Auto-authenticate with SIWE when wallet connects
  useAutoAuth();

  // Setup global error handlers on mount
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  // Show loading screen while Mini App initializes
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
          {/* Primary Navigation */}
          <Route path="/" element={<Home />} />
          <Route path="/league" element={<League />} />
          <Route path="/compete" element={<Compete />} />
          <Route path="/intel" element={<Intel />} />
          <Route path="/profile" element={<Profile />} />

          {/* Sub-routes */}
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/referrals" element={<Referrals />} />

          {/* Game Features */}
          <Route path="/draft" element={<Draft />} /> {/* New clean draft interface */}
          <Route path="/draft-legacy" element={<LeagueUltra />} /> {/* Old draft - keep for reference */}
          <Route path="/contest/:id" element={<ContestDetail />} />
          <Route path="/contests" element={<Navigate to="/compete?tab=contests" replace />} />

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

function App() {
  console.log('App component rendering');
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#F59E0B',
              accentColorForeground: '#09090B',
              borderRadius: 'medium',
              overlayBlur: 'small',
            })}
          >
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
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
