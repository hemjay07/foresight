/**
 * Unified auth hook
 *
 * Provides a single auth interface via React context.
 * Auth is handled by Privy (Solana wallets).
 */

import { createContext, useContext } from 'react';

export interface AuthState {
  isConnected: boolean;
  address: string | undefined;
  displayAddress: string;
  email?: string;
  twitterHandle?: string;
  displayName: string;
  isBackendAuthed: boolean;
  login: () => void;
  logout: () => void;
}

const defaultState: AuthState = {
  isConnected: false,
  address: undefined,
  displayAddress: '',
  displayName: '',
  isBackendAuthed: false,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthState>(defaultState);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
