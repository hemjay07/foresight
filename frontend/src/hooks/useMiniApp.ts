/**
 * Farcaster Mini App SDK Hook
 * Handles SDK initialization and provides Mini App context
 */

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

// Check if we're in a Farcaster Mini App environment
function isInFarcasterFrame(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Farcaster frame context indicators
  const isInFrame = window.parent !== window;
  const hasFarcasterParams = window.location.search.includes('fid=') ||
                             window.location.search.includes('fc_');
  const hasFarcasterOrigin = document.referrer.includes('warpcast') ||
                             document.referrer.includes('farcaster');

  return isInFrame || hasFarcasterParams || hasFarcasterOrigin;
}

export function useMiniApp() {
  // Initialize isReady to true if not in Farcaster frame (avoids loading flash)
  const [isReady, setIsReady] = useState(() => !isInFarcasterFrame());
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeMiniApp = async () => {
      // Skip SDK init if not in Farcaster environment
      if (!isInFarcasterFrame()) {
        // Already set to ready in useState initializer
        return;
      }

      try {
        // Initialize the SDK with a timeout
        const initPromise = sdk.init();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SDK init timeout')), 5000)
        );

        await Promise.race([initPromise, timeoutPromise]);

        // Get context (user info, etc)
        const miniAppContext = await sdk.context;
        setContext(miniAppContext);

        // Tell Farcaster we're ready to display (hides splash screen)
        sdk.actions.ready();
        setIsReady(true);

        console.log('Mini App initialized:', miniAppContext);
      } catch (err) {
        console.error('Failed to initialize Mini App:', err);
        setError(err as Error);
        // Still mark as ready even if initialization fails (for web fallback)
        setIsReady(true);
      }
    };

    initializeMiniApp();
  }, []);

  return {
    isReady,
    context,
    error,
    sdk,
    // Useful helpers
    user: context?.user,
    isInMiniApp: !!context,
  };
}
