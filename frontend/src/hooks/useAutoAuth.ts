/**
 * Auto-authentication hook
 * Automatically triggers SIWE authentication when wallet connects
 */

import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useAutoAuth() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const hasAttemptedAuth = useRef(false);
  const lastAddress = useRef<string | undefined>();

  useEffect(() => {
    // Reset flag when address changes or disconnects
    if (!isConnected || address !== lastAddress.current) {
      hasAttemptedAuth.current = false;

      // Clear auth token when wallet disconnects
      if (!isConnected && lastAddress.current) {
        console.log('🔓 Wallet disconnected, clearing auth token');
        localStorage.removeItem('authToken');
      }

      lastAddress.current = address;
    }

    // Don't auto-auth if already authenticated or not connected
    if (!isConnected || !address || hasAttemptedAuth.current) {
      return;
    }

    // Check if already authenticated with a VALID token
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      // Validate the token before trusting it
      validateToken(existingToken).then((isValid) => {
        if (isValid) {
          hasAttemptedAuth.current = true;
        } else {
          // Token is invalid/expired - clear it and re-authenticate
          console.log('🔄 Token expired, re-authenticating...');
          localStorage.removeItem('authToken');
          handleAuth();
        }
      });
      return;
    }

    // No token - auto-authenticate
    handleAuth();
  }, [isConnected, address, chainId]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  };

  const handleAuth = async () => {
    if (!address || !chainId || hasAttemptedAuth.current) return;

    hasAttemptedAuth.current = true;

    try {
      console.log('🔐 Auto-authenticating with SIWE...');

      // Step 1: Get nonce from backend
      const nonceResponse = await axios.get(`${API_URL}/api/auth/nonce`);
      const nonce = nonceResponse.data.nonce;

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to CT Fantasy League',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });

      const messageToSign = message.prepareMessage();

      // Step 3: Sign message
      const signature = await signMessageAsync({ message: messageToSign });

      // Step 4: Verify and get token
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: messageToSign,
        signature,
      });

      // Backend might return 'token' or 'accessToken'
      const token = verifyResponse.data.accessToken || verifyResponse.data.token;

      // Step 5: Store token
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('✅ Auto-authentication successful!');

        // Reload page to fetch data with new auth
        window.location.reload();
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('❌ Auto-authentication failed:', error);
      // Don't throw - just log the error
      // User can still use the app without auth for some features
    }
  };
}
