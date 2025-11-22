import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import LeagueUltra from './pages/LeagueUltra';
import Vote from './pages/Vote';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draft" element={<LeagueUltra />} />
          <Route path="/league" element={<LeagueUltra />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/profile" element={<Profile />} />
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
                  <AppContent />
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
