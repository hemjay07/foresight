/**
 * API Client for CT league Backend
 * Handles authentication with SIWE and REST API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// AUTH STATE MANAGEMENT
// ============================================

let authToken: string | null = localStorage.getItem('authToken');

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

export function getAuthToken(): string | null {
  return authToken || localStorage.getItem('authToken');
}

// ============================================
// HTTP CLIENT
// ============================================

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | unknown[];
  requiresAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = false,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requiresAuth && authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    // Handle 401 - unauthorized
    if (response.status === 401 && requiresAuth) {
      clearAuthToken();
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error');
  }
}

// ============================================
// AUTHENTICATION
// ============================================

export interface AuthResponse {
  accessToken: string;
  token?: string; // Backend sometimes returns 'token' instead of 'accessToken'
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    avatar?: string;
  };
}

export async function getNonce(): Promise<{ nonce: string }> {
  return request('/api/auth/nonce');
}

export async function verify(
  message: string,
  signature: string
): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/verify', {
    method: 'POST',
    body: { message, signature },
  });

  // Backend might return 'token' or 'accessToken'
  const token = response.accessToken || response.token;
  if (token) {
    setAuthToken(token);
  }
  return response;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  } finally {
    clearAuthToken();
  }
}

export async function getCurrentUser() {
  return request('/api/auth/me', { requiresAuth: true });
}

// ============================================
// USERS
// ============================================

export async function getUserProfile(walletAddress: string) {
  return request(`/api/users/${walletAddress}`);
}

export async function updateProfile(data: {
  username?: string;
  avatar?: string;
  bio?: string;
}) {
  return request('/api/users/profile', {
    method: 'PATCH',
    body: data,
    requiresAuth: true,
  });
}

export async function getUserLeaderboard() {
  return request('/api/users/leaderboard');
}

// ============================================
// CT DRAFT
// ============================================

export async function getInfluencers() {
  return request('/api/draft/influencers');
}

export async function getUserTeam(walletAddress: string) {
  return request(`/api/draft/team/${walletAddress}`);
}

export async function getDraftLeaderboard(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/draft/leaderboard?${query}`);
}

export async function submitTeam(data: {
  teamName: string;
  influencerIds: number[];
  walletAddress: string;
  leagueType?: 'free' | 'prize';
}) {
  return request('/api/draft/team', {
    method: 'POST',
    body: data,
  });
}

// ============================================
// CT WHISPERER
// ============================================

export async function getRandomQuestion() {
  return request('/api/whisperer/question', { requiresAuth: true });
}

export async function submitAnswer(data: {
  questionId: string;
  guessedTweet: string;
  timeSpent: number;
}) {
  return request('/api/whisperer/answer', {
    method: 'POST',
    body: data,
    requiresAuth: true,
  });
}

export async function getWhispererStats(walletAddress: string) {
  return request(`/api/whisperer/user/${walletAddress}/stats`);
}

export async function getWhispererLeaderboard(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/whisperer/leaderboard?${query}`);
}

// ============================================
// TIMECASTER ARENA
// ============================================

export async function getArenaDuels(params?: {
  status?: 'OPEN' | 'ACTIVE' | 'RESOLVED';
  type?: 'PRICE' | 'PROTOCOL' | 'NARRATIVE';
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/arena/duels?${query}`);
}

export async function getArenaDuel(id: string) {
  return request(`/api/arena/duels/${id}`);
}

export async function getArenaUserStats(walletAddress: string) {
  return request(`/api/arena/user/${walletAddress}/stats`);
}

export async function getArenaLeaderboard(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/arena/leaderboard?${query}`);
}

// ============================================
// DAILY GAUNTLET
// ============================================

export async function getTodaysGauntlet() {
  return request('/api/gauntlet/today');
}

export async function getGauntletByDate(date: string) {
  return request(`/api/gauntlet/days/${date}`);
}

export async function getUserGauntletEntry(
  walletAddress: string,
  date: string
) {
  return request(`/api/gauntlet/user/${walletAddress}/entry/${date}`);
}

export async function getUserGauntletStats(walletAddress: string) {
  return request(`/api/gauntlet/user/${walletAddress}/stats`);
}

export async function getGauntletLeaderboard(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/gauntlet/leaderboard?${query}`);
}

export async function getGauntletHistory(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request(`/api/gauntlet/history?${query}`);
}
