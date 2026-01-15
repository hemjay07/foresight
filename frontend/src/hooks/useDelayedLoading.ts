/**
 * useDelayedLoading - Only show loading UI after a delay
 * Prevents flash of loading state for fast operations
 */

import { useState, useEffect, useRef } from 'react';

export function useDelayedLoading(isLoading: boolean, delayMs: number = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start timer - only show loading after delay
      timerRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delayMs);
    } else {
      // Clear timer and hide loading immediately when done
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowLoading(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isLoading, delayMs]);

  return showLoading;
}
