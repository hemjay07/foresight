/**
 * Privy authentication hook
 * Replaces useAutoAuth (SIWE) with Privy-based auth flow.
 *
 * Flow:
 * 1. Privy handles wallet connection + authentication
 * 2. On successful Privy auth, we get a Privy access token
 * 3. Send token to our backend POST /api/auth/verify { privyToken }
 * 4. Backend verifies with Privy, creates/finds user, issues our JWT
 * 5. Store our JWT in localStorage for subsequent API calls
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { API_URL } from '../config/api';

export function usePrivyAuth() {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const hasAttemptedAuth = useRef(false);
  const lastUserId = useRef<string | undefined>();
  const [syncError, setSyncError] = useState<string | null>(null);

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
        hasAttemptedAuth.current = false; // Allow retry
        return;
      }

      // Check if we already have a valid backend session
      const existingToken = localStorage.getItem('authToken');
      if (existingToken) {
        try {
          const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${existingToken}` },
          });
          if (meResponse.status === 200) {
            // Existing session still valid
            return;
          }
        } catch {
          // Token expired or invalid — continue to re-auth
          localStorage.removeItem('authToken');
        }
      }

      // Send Privy token to our backend for verification
      console.log('[PrivyAuth] Syncing with backend...');
      const response = await axios.post(`${API_URL}/api/auth/verify`, {
        privyToken,
      });

      const token =
        response.data.data?.accessToken ||
        response.data.accessToken ||
        response.data.token;

      if (token) {
        localStorage.setItem('authToken', token);
        console.log('[PrivyAuth] Backend session created');
        // Reload to fetch data with new auth context
        window.location.reload();
      } else {
        console.error('[PrivyAuth] No token in response:', response.data);
        setSyncError('Backend returned no token. Contact support.');
        hasAttemptedAuth.current = false; // Allow retry
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('[PrivyAuth] Backend sync failed:', status, msg);
      if (status === 429) {
        setSyncError('rate_limited');
      } else {
        setSyncError('network_error');
        // Auto-retry once after 4s — recovers from brief backend restart/hiccup
        hasAttemptedAuth.current = false;
        setTimeout(() => {
          if (!localStorage.getItem('authToken')) {
            syncWithBackend();
          }
        }, 4000);
      }
      hasAttemptedAuth.current = false;
    }
  }, [getAccessToken]);

  // Manual retry function
  const retrySync = useCallback(() => {
    hasAttemptedAuth.current = false;
    setSyncError(null);
    syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    if (!ready) return;

    // User disconnected
    if (!authenticated && lastUserId.current) {
      localStorage.removeItem('authToken');
      lastUserId.current = undefined;
      hasAttemptedAuth.current = false;
      setSyncError(null);
      return;
    }

    // New user or user changed
    if (authenticated && user && user.id !== lastUserId.current) {
      hasAttemptedAuth.current = false;
      lastUserId.current = user.id;
      syncWithBackend();
    }

    // User is authenticated but no backend token — retry
    if (authenticated && user && user.id === lastUserId.current && !localStorage.getItem('authToken') && !hasAttemptedAuth.current) {
      syncWithBackend();
    }
  }, [ready, authenticated, user, syncWithBackend]);

  const handleLogout = useCallback(async () => {
    try {
      // Logout from our backend
      const token = localStorage.getItem('authToken');
      if (token) {
        await axios
          .post(
            `${API_URL}/api/auth/logout`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch(() => {});
      }
      localStorage.removeItem('authToken');

      // Logout from Privy
      await logout();
    } catch (error) {
      console.error('[PrivyAuth] Logout failed:', error);
      localStorage.removeItem('authToken');
    }
  }, [logout]);

  return {
    ready,
    authenticated,
    user,
    logout: handleLogout,
    retrySync,
    syncError,
    isBackendAuthed: !!localStorage.getItem('authToken'),
  };
}
