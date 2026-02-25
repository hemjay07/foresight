/**
 * API Configuration
 *
 * Centralizes API URL detection logic.
 * Priority:
 * 1. VITE_API_URL environment variable
 * 2. Relative URL (if same domain)
 * 3. Default localhost
 */

/**
 * Get the API base URL
 * Uses environment variable or falls back to localhost
 */
export const getApiUrl = (): string => {
  // In production, use env var if set, otherwise relative URL (same domain deploy)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || '';
  }

  // In development, use direct localhost — avoids Vite proxy port misconfiguration.
  // Override with VITE_API_URL to point at a remote backend.
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const API_URL = getApiUrl();
