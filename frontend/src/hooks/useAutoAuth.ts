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
      lastAddress.current = address;
    }

    // Don't auto-auth if already authenticated or not connected
    if (!isConnected || !address || hasAttemptedAuth.current) {
      return;
    }

    // Check if already authenticated
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      hasAttemptedAuth.current = true;
      return;
    }

    // Auto-authenticate
    handleAuth();
  }, [isConnected, address, chainId]);

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

      // Step 4: Verify and get tokens
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        message: messageToSign,
        signature,
      });

      const { accessToken, refreshToken } = verifyResponse.data;

      // Step 5: Store tokens
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      console.log('✅ Auto-authentication successful!');

      // Reload page to fetch data with new auth
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Auto-authentication failed:', error);
      // Don't throw - just log the error
      // User can still use the app without auth for some features
    }
  };
}
