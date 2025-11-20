import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import League from './pages/League';
import Vote from './pages/Vote';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draft" element={<League />} />
          <Route path="/league" element={<League />} />
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
              <AppContent />
            </NotificationProvider>
          </RealtimeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
