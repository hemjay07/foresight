/**
 * OnboardingFlow — Compact pill → smooth expand on hover
 *
 * Default: slim pill auto-cycling step titles.
 * On hover (desktop) or tap (mobile): smoothly expands to show
 * full step detail + stats + Next/Back navigation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Crown,
  Target,
  ChartLineUp,
  Trophy,
} from '@phosphor-icons/react';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface OnboardingFlowProps {
  onComplete: () => void;
  contestId?: number;
}

const STEPS = [
  {
    icon: Target,
    title: 'Build Your Team',
    text: 'Draft 5 CT influencers within a 150-point budget. Balance stars with sleepers.',
    stats: [
      { value: '62', label: 'Influencers' },
      { value: '4', label: 'Tiers' },
      { value: '150', label: 'Budget' },
    ],
  },
  {
    icon: Crown,
    title: 'Pick a Captain',
    text: 'Your captain earns 2× points. The right pick can carry your entire team.',
    stats: [
      { value: '2×', label: 'Multiplier' },
      { value: '5', label: 'Team size' },
      { value: '1', label: 'Captain' },
    ],
  },
  {
    icon: ChartLineUp,
    title: 'Real Scores, No Luck',
    text: 'Points from real Twitter activity — engagement, growth, viral tweets. Zero RNG.',
    stats: [
      { value: '160', label: 'Max pts' },
      { value: '4', label: 'Categories' },
      { value: '0', label: 'Luck' },
    ],
  },
  {
    icon: Trophy,
    title: 'Win Real Prizes',
    text: 'Top 3 teams split $100. Free entry — draft smart, get paid.',
    stats: [
      { value: '$50', label: '1st' },
      { value: '$30', label: '2nd' },
      { value: '$20', label: '3rd' },
    ],
  },
];

const PILL_CYCLE_MS = 4000;

export default function OnboardingFlow({ onComplete, contestId }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { markWelcomeSeen, markVisited } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const cardRef = useRef<HTMLDivElement>(null);

  const isLastStep = currentStep === STEPS.length - 1;

  // Slide in after delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auto-cycle when collapsed
  useEffect(() => {
    if (!visible || exiting || isOpen) return;
    timerRef.current = setTimeout(() => {
      setCurrentStep(s => (s + 1) % STEPS.length);
    }, PILL_CYCLE_MS);
    return () => clearTimeout(timerRef.current);
  }, [visible, exiting, isOpen, currentStep]);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: TouchEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('touchstart', handleOutside);
    return () => document.removeEventListener('touchstart', handleOutside);
  }, [isOpen]);

  const dismiss = useCallback(() => {
    setExiting(true);
    markWelcomeSeen();
    markVisited();
    setTimeout(onComplete, 400);
  }, [markWelcomeSeen, markVisited, onComplete]);

  const handleCTA = useCallback(() => {
    markWelcomeSeen();
    markVisited();
    setExiting(true);
    setTimeout(() => {
      if (contestId) {
        navigate(`/draft/${contestId}`);
      } else {
        navigate('/compete?tab=contests');
      }
    }, 300);
  }, [contestId, navigate, markWelcomeSeen, markVisited]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (!isOpen) return;
      if (e.key === 'ArrowRight' && !isLastStep) setCurrentStep(s => s + 1);
      if (e.key === 'ArrowLeft' && currentStep > 0) setCurrentStep(s => s - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dismiss, isOpen, isLastStep, currentStep]);

  // Mobile tap to toggle
  const handleTap = useCallback(() => {
    if (window.matchMedia('(hover: hover)').matches) return;
    setIsOpen(prev => !prev);
  }, []);

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div
      ref={cardRef}
      className={`fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[440px] z-50 ${
        !visible || exiting
          ? 'opacity-0 translate-y-8 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
      style={{ transition: 'opacity 500ms ease-out, transform 500ms ease-out' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={handleTap}
    >
      <div
        className={`relative bg-[#13131B] rounded-2xl overflow-hidden ${
          isOpen
            ? 'border border-gold-500/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            : 'border border-gray-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
        }`}
        style={{ transition: 'border-color 300ms ease, box-shadow 300ms ease' }}
      >
        {/* Progress bar */}
        <div className="h-[2px] bg-gray-800/80">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full"
            style={{
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              transition: isOpen ? 'width 400ms ease-out' : `width ${PILL_CYCLE_MS}ms linear`,
            }}
          />
        </div>

        {/* Compact row — always visible */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className={`rounded-lg flex items-center justify-center shrink-0 ${
              isOpen
                ? 'w-9 h-9 bg-gold-500/10 border border-gold-500/20'
                : 'w-8 h-8 bg-gray-800/80 border border-gray-700/50'
            }`}
            style={{ transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <Icon
              size={isOpen ? 17 : 15}
              weight={isOpen ? 'fill' : 'bold'}
              className={isOpen ? 'text-gold-400' : 'text-gray-400'}
              style={{ transition: 'color 300ms ease' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              key={currentStep}
              className="text-[13px] text-gray-200 font-medium leading-snug animate-fade-in truncate"
            >
              {step.title}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Step dots — visible when collapsed */}
            <div
              className="flex items-center gap-1"
              style={{
                opacity: isOpen ? 0 : 1,
                width: isOpen ? 0 : 'auto',
                overflow: 'hidden',
                transition: 'opacity 200ms ease, width 300ms ease',
              }}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-3 h-1.5 bg-gold-500'
                      : i < currentStep
                        ? 'w-1.5 h-1.5 bg-gold-500/40'
                        : 'w-1.5 h-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Step counter — visible when open */}
            <span
              className="text-[10px] font-mono text-gray-600 whitespace-nowrap"
              style={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0,
                overflow: 'hidden',
                transition: 'opacity 200ms ease 100ms, width 300ms ease',
              }}
            >
              {currentStep + 1}/{STEPS.length}
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="p-1.5 rounded-md text-gray-600 hover:text-gray-400 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable section — smooth height transition */}
        <div
          className="overflow-hidden"
          style={{
            maxHeight: isOpen ? '180px' : '0px',
            opacity: isOpen ? 1 : 0,
            transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease',
          }}
        >
          <div className="px-4 pb-3">
            {/* Description */}
            <p
              key={`desc-${currentStep}`}
              className="text-[11px] sm:text-xs text-gray-400 leading-relaxed mb-3 animate-fade-in"
            >
              {step.text}
            </p>

            {/* Stats row */}
            <div
              key={`stats-${currentStep}`}
              className="flex gap-px rounded-lg overflow-hidden mb-3 animate-fade-in"
            >
              {step.stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-800/40 py-2 text-center first:rounded-l-lg last:rounded-r-lg"
                >
                  <p className="text-sm font-mono font-bold text-gold-400 leading-none">{stat.value}</p>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {currentStep > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentStep(s => s - 1); }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} weight="bold" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(); }}
                  className="flex items-center justify-center h-9 px-3 rounded-lg text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Skip
                </button>
              )}

              {isLastStep ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCTA(); }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-gray-950 text-xs font-bold transition-colors duration-150"
                >
                  Draft Your Team — Free
                  <ArrowRight size={13} weight="bold" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentStep(s => s + 1); }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-white text-xs font-medium transition-colors"
                >
                  Next
                  <ArrowRight size={13} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
