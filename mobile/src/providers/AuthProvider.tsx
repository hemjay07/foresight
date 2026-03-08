import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setOnAuthFailure } from '../services/api';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatarUrl: string;
  ctMasteryScore: number;
  ctMasteryLevel?: string;
  referralCode: string;
  isFoundingMember: boolean;
  foundingMemberNumber?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register auth failure callback so api interceptor can clear user state
  useEffect(() => {
    setOnAuthFailure(() => setUser(null));
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          const { data } = await api.get('/api/auth/me');
          if (data.success && data.data) {
            setUser(data.data);
          }
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Session genuinely expired - clear tokens
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
        // Network errors / timeouts: keep tokens, user can retry.
        // Don't clear tokens for transient failures.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: User) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch { /* ignore logout errors */ }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch { /* ignore refresh errors - stale data is better than no data */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
