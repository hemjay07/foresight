/**
 * Onboarding Context
 * Manages user education state, first-visit detection, and tutorial progress
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'foresight_onboarding';

interface OnboardingState {
  hasVisited: boolean;
  hasCompletedFreeLeague: boolean;
  hasSeenWelcome: boolean;
  hasSeenPotentialWinnings: boolean;
  firstVisitDate: string | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  isFirstVisit: boolean;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  showPotentialWinningsModal: boolean;
  setShowPotentialWinningsModal: (show: boolean) => void;
  markVisited: () => void;
  markWelcomeSeen: () => void;
  markFreeLeagueCompleted: () => void;
  markPotentialWinningsSeen: () => void;
  shouldRedirectToFreeLeague: () => boolean;
  resetOnboarding: () => void;
}

const defaultState: OnboardingState = {
  hasVisited: false,
  hasCompletedFreeLeague: false,
  hasSeenWelcome: false,
  hasSeenPotentialWinnings: false,
  firstVisitDate: null,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPotentialWinningsModal, setShowPotentialWinningsModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
      setInitialized(true);
    } catch (e) {
      console.error('Failed to load onboarding state:', e);
      setInitialized(true);
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback((newState: OnboardingState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to persist onboarding state:', e);
    }
  }, []);

  const isFirstVisit = initialized && !state.hasVisited;

  const markVisited = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        hasVisited: true,
        firstVisitDate: prev.firstVisitDate || new Date().toISOString(),
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  const markWelcomeSeen = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasSeenWelcome: true };
      persistState(newState);
      return newState;
    });
    setShowWelcomeModal(false);
  }, [persistState]);

  const markFreeLeagueCompleted = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasCompletedFreeLeague: true };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  const markPotentialWinningsSeen = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasSeenPotentialWinnings: true };
      persistState(newState);
      return newState;
    });
    setShowPotentialWinningsModal(false);
  }, [persistState]);

  // Check if we should redirect new users to Free League
  const shouldRedirectToFreeLeague = useCallback(() => {
    return initialized && !state.hasVisited && !state.hasCompletedFreeLeague;
  }, [initialized, state.hasVisited, state.hasCompletedFreeLeague]);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        isFirstVisit,
        showWelcomeModal,
        setShowWelcomeModal,
        showPotentialWinningsModal,
        setShowPotentialWinningsModal,
        markVisited,
        markWelcomeSeen,
        markFreeLeagueCompleted,
        markPotentialWinningsSeen,
        shouldRedirectToFreeLeague,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
