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
  // Priority 1: Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Priority 2: If in production and same domain, use relative URL
  if (import.meta.env.PROD) {
    // Use relative URL (assumes API is on same domain)
    return '';
  }

  // Priority 3: Development fallback to localhost
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
