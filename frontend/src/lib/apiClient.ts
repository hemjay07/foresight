/**
 * Centralized API client — FINDING-007 + FINDING-021
 *
 * - Sends httpOnly cookies automatically (withCredentials)
 * - Attaches CSRF token from cookie on mutation requests
 * - Auto-refreshes access token on 401 and retries the request
 */

import axios from 'axios';
import { API_URL } from '../config/api';

function getCsrfToken(): string | undefined {
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith('csrf-token='));
  return match?.split('=')[1];
}

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach CSRF token to every mutation request
apiClient.interceptors.request.use((config) => {
  if (config.method && !['get', 'head', 'options'].includes(config.method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

// Auto-refresh on 401
let refreshPromise: Promise<boolean> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only retry once, and don't retry the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retried &&
      !original.url?.includes('/api/auth/refresh')
    ) {
      original._retried = true;

      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/api/auth/refresh')
          .then(() => true)
          .catch(() => false)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Check if user has an active backend session.
 * Uses the non-httpOnly CSRF cookie as a proxy (set on login, cleared on logout).
 */
export function hasSession(): boolean {
  return document.cookie.includes('csrf-token=');
}

export default apiClient;
