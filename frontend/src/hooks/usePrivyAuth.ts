/**
 * Privy authentication hook
 *
 * Flow:
 * 1. Privy handles wallet connection + authentication
 * 2. On successful Privy auth, we get a Privy access token
 * 3. Send token to our backend POST /api/auth/verify (with credentials)
 * 4. Backend verifies with Privy, creates/finds user, sets httpOnly cookies
 * 5. Cookies are sent automatically on subsequent requests
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import apiClient from '../lib/apiClient';

export function usePrivyAuth() {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const hasAttemptedAuth = useRef(false);
  const lastUserId = useRef<string | undefined>();
  const retryCount = useRef(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isBackendAuthed, setIsBackendAuthed] = useState(false);

  const syncWithBackend = useCallback(async () => {
    if (hasAttemptedAuth.current) return;
    hasAttemptedAuth.current = true;
    setSyncError(null);

    try {
      // Get Privy access token
      const privyToken = await getAccessToken();
      if (!privyToken) {
        console.error('[PrivyAuth] No access token available');
        setSyncError('No Privy access token. Try disconnecting and reconnecting.');
        hasAttemptedAuth.current = false;
        return;
      }

      // Check if we already have a valid backend session (cookie-based)
      try {
        const meResponse = await apiClient.get('/api/auth/me');
        if (meResponse.status === 200) {
          setIsBackendAuthed(true);
          return;
        }
      } catch {
        // Token expired or invalid — continue to re-auth
      }

      // Send Privy token to our backend for verification
      const response = await apiClient.post('/api/auth/verify', { privyToken });

      if (response.data?.success) {
        setIsBackendAuthed(true);
      } else {
        console.error('[PrivyAuth] Unexpected response:', response.data);
        setSyncError('Backend returned unexpected response. Contact support.');
        hasAttemptedAuth.current = false;
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('[PrivyAuth] Backend sync failed:', status, msg);
      if (status === 429) {
        setSyncError('rate_limited');
      } else {
        setSyncError('network_error');
        hasAttemptedAuth.current = false;
        retryCount.current += 1;
        if (retryCount.current <= 3) {
          const delay = Math.min(2000 * Math.pow(2, retryCount.current - 1), 16000);
          setTimeout(() => {
            if (!isBackendAuthed) {
              syncWithBackend();
            }
          }, delay);
        }
      }
      hasAttemptedAuth.current = false;
    }
  }, [getAccessToken, isBackendAuthed]);

  const retrySync = useCallback(() => {
    hasAttemptedAuth.current = false;
    setSyncError(null);
    syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    if (!ready) return;

    // User disconnected
    if (!authenticated && lastUserId.current) {
      setIsBackendAuthed(false);
      lastUserId.current = undefined;
      hasAttemptedAuth.current = false;
      setSyncError(null);
      return;
    }

    // New user or user changed
    if (authenticated && user && user.id !== lastUserId.current) {
      hasAttemptedAuth.current = false;
      retryCount.current = 0;
      lastUserId.current = user.id;
      syncWithBackend();
    }

    // User is authenticated but no backend session — retry
    if (authenticated && user && user.id === lastUserId.current && !isBackendAuthed && !hasAttemptedAuth.current) {
      syncWithBackend();
    }
  }, [ready, authenticated, user, syncWithBackend, isBackendAuthed]);

  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout').catch(() => {});
      setIsBackendAuthed(false);
      await logout();
    } catch (error) {
      console.error('[PrivyAuth] Logout failed:', error);
      setIsBackendAuthed(false);
    }
  }, [logout]);

  return {
    ready,
    authenticated,
    user,
    logout: handleLogout,
    retrySync,
    syncError,
    isBackendAuthed,
  };
}
