import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AchievementToastContainer from './components/AchievementToastContainer';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorLogger';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LeagueUltra from './pages/LeagueUltra';
import Vote from './pages/Vote';
import Leaderboard from './pages/Leaderboard';
import XPLeaderboard from './pages/XPLeaderboard';
import UserStats from './pages/UserStats';
import Referrals from './pages/Referrals';

// Legal Pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Imprint from './pages/Imprint';

// Demo Pages
import ShareCardDemo from './pages/ShareCardDemo';

const queryClient = new QueryClient();

function AppContent() {
  // Setup global error handlers on mount
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draft" element={<LeagueUltra />} />
          <Route path="/league" element={<LeagueUltra />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard/xp" element={<XPLeaderboard />} />
          <Route path="/stats" element={<UserStats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/referrals" element={<Referrals />} />

          {/* Legal Pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/imprint" element={<Imprint />} />

          {/* Demo Pages */}
          <Route path="/demo/share-cards" element={<ShareCardDemo />} />
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
              accentColor: '#0052FF',
              accentColorForeground: 'white',
              borderRadius: 'large',
            })}
          >
            <RealtimeProvider>
              <NotificationProvider>
                <ToastProvider>
                  <AchievementToastProvider>
                    <AppContent />
                    <AchievementToastContainer />
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
