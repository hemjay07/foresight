/**
 * First Time Onboarding Component
 * Interactive tutorial for new users
 */

import { useState } from 'react';
import {
  Trophy,
  Users,
  ChartLine,
  ArrowRight,
  Sparkle,
  Fire,
  Crown,
  X
} from '@phosphor-icons/react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  details: string[];
}

interface FirstTimeOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function FirstTimeOnboarding({ onComplete, onSkip }: FirstTimeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to CT Fantasy League',
      description: 'Draft your dream team of crypto influencers and compete for glory',
      icon: Trophy,
      details: [
        'Build a team of 5 crypto Twitter influencers',
        'Compete in weekly contests with real-time scoring',
        'Climb the leaderboard and prove your CT knowledge',
        'Earn XP, unlock achievements, and level up'
      ]
    },
    {
      title: 'Draft Your Team',
      description: 'Strategic selection with a 150-point budget',
      icon: Users,
      details: [
        'Each influencer has a price based on their tier (S/A/B/C)',
        'Select 5 players within your 150-point budget',
        'Choose a captain to earn 2x points',
        'Balance star power with budget constraints'
      ]
    },
    {
      title: 'How Scoring Works',
      description: 'Real-time points based on Twitter performance',
      icon: ChartLine,
      details: [
        'Points = Followers + Tweets + Engagement',
        'Captain earns 2x points for maximum impact',
        'Live updates throughout the contest period',
        'Top performers earn bonus XP and achievements'
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative max-w-3xl w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-brand-500 rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip Button */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all z-10"
          >
            <X size={24} weight="bold" className="text-gray-400" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 pt-16">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-50 rounded-full"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
                <StepIcon size={48} weight="fill" className="text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-black text-center text-white mb-4">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-xl text-center text-gray-300 mb-8">
            {currentStepData.description}
          </p>

          {/* Details */}
          <div className="space-y-4 mb-8">
            {currentStepData.details.map((detail, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-brand-500/50 transition-all"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <p className="text-gray-200 text-lg leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-brand-500 w-8'
                      : index < currentStep
                      ? 'bg-brand-600'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold transition-all"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-lg text-white font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {isLastStep ? (
                  <>
                    <Sparkle size={20} weight="fill" />
                    Let's Go!
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={20} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Additional Info on Last Step */}
          {isLastStep && (
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-2 border-yellow-500/50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Crown size={24} weight="fill" className="text-yellow-400" />
                <h3 className="text-lg font-bold text-yellow-400">Pro Tips</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Fire size={16} weight="fill" className="text-orange-400 mt-1 flex-shrink-0" />
                  <span>Check the "Hot/Stable/Cold" form indicators to find trending influencers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Fire size={16} weight="fill" className="text-orange-400 mt-1 flex-shrink-0" />
                  <span>Your captain earns 2x points - choose wisely!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Fire size={16} weight="fill" className="text-orange-400 mt-1 flex-shrink-0" />
                  <span>Share your team on Twitter to invite friends and build hype</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
