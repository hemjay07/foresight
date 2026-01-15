/**
 * PageTransition - Professional smooth fade between pages
 *
 * Flow:
 * 1. User navigates -> Start fade out (opacity 1 → 0)
 * 2. After fade out complete -> Swap content
 * 3. Fade in new content (opacity 0 → 1)
 *
 * Total duration: ~250ms (barely noticeable but feels polished)
 */

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

type TransitionPhase = 'visible' | 'fading-out' | 'fading-in';

const FADE_DURATION = 120; // ms for each phase

export default function PageTransition({ children }: Props) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<TransitionPhase>('visible');
  const prevPathRef = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip transition on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayChildren(children);
      return;
    }

    // Only trigger transition if path actually changed
    if (prevPathRef.current !== location.pathname) {
      // Phase 1: Fade out current content
      setPhase('fading-out');

      const fadeOutTimer = setTimeout(() => {
        // Phase 2: Swap content while invisible
        setDisplayChildren(children);
        prevPathRef.current = location.pathname;

        // Phase 3: Fade in new content
        // Use rAF to ensure DOM has updated before fading in
        requestAnimationFrame(() => {
          setPhase('fading-in');

          // Return to visible state after fade in
          setTimeout(() => {
            setPhase('visible');
          }, FADE_DURATION);
        });
      }, FADE_DURATION);

      return () => clearTimeout(fadeOutTimer);
    } else {
      // Same path, just update children directly (no transition)
      setDisplayChildren(children);
    }
  }, [children, location.pathname]);

  return (
    <div
      style={{
        opacity: phase === 'fading-out' ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
      }}
    >
      {displayChildren}
    </div>
  );
}
