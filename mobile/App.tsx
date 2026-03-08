// Polyfills must be first
import './src/polyfills';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider } from './src/utils/ConnectionProvider';
import { ClusterProvider } from './src/components/cluster/cluster-data-access';
import { AuthProvider } from './src/providers/AuthProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        <ClusterProvider>
          <ConnectionProvider config={{ commitment: 'processed' }}>
            <AuthProvider>
              <ErrorBoundary>
                <StatusBar style="light" />
                <RootNavigator />
              </ErrorBoundary>
            </AuthProvider>
          </ConnectionProvider>
        </ClusterProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
