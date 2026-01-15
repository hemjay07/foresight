/**
 * Welcome Modal - First-time user onboarding
 * Explains the game concept and guides users to start with Free League
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Trophy, Users, Target, Gift, ArrowRight,
  Star, Lightning, Crown, ChartLineUp, Wallet
} from '@phosphor-icons/react';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface WelcomeModalProps {
  onClose: () => void;
  freeLeagueContestId?: number;
}

export default function WelcomeModal({ onClose, freeLeagueContestId }: WelcomeModalProps) {
  const navigate = useNavigate();
  const { markWelcomeSeen, markVisited } = useOnboarding();
  const [step, setStep] = useState(0);

  const handleStartFreeLeague = () => {
    markWelcomeSeen();
    markVisited();
    if (freeLeagueContestId) {
      navigate(`/draft?contestId=${freeLeagueContestId}&type=FREE_LEAGUE&teamSize=5&hasCaptain=true&isFree=true`);
    } else {
      navigate('/contests?tab=browse&filter=free');
    }
  };

  const handleSkip = () => {
    markWelcomeSeen();
    markVisited();
    onClose();
  };

  const steps = [
    // Step 1: Welcome
    {
      title: "Welcome to CT Fantasy",
      subtitle: "The fantasy league for Crypto Twitter",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Trophy weight="fill" className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-300 text-lg">
              Draft top CT influencers, track their performance, and compete for prizes!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-gray-800/50 text-center">
              <Users weight="fill" className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-sm font-medium text-white">Pick 5</p>
              <p className="text-xs text-gray-400">Influencers</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 text-center">
              <Target weight="fill" className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-sm font-medium text-white">150 pts</p>
              <p className="text-xs text-gray-400">Budget</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 text-center">
              <Trophy weight="fill" className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-sm font-medium text-white">Win</p>
              <p className="text-xs text-gray-400">ETH Prizes</p>
            </div>
          </div>
        </div>
      ),
    },
    // Step 2: How scoring works
    {
      title: "How Scoring Works",
      subtitle: "Your team earns points based on real performance",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <ChartLineUp weight="fill" className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-1">Real-time Performance</p>
                <p className="text-sm text-gray-300">
                  Points based on engagement, follower growth, and community votes
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Crown weight="fill" className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-1">Captain Bonus</p>
                <p className="text-sm text-gray-300">
                  Pick one captain who earns 1.5x points for your team
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Star weight="fill" className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-1">Tier Strategy</p>
                <p className="text-sm text-gray-300">
                  Balance expensive stars with undervalued gems within budget
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Step 3: Contest types preview
    {
      title: "Choose Your Contest",
      subtitle: "Multiple ways to play and win",
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500">
                  <Gift weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Free League</p>
                  <p className="text-xs text-emerald-300">Perfect for beginners</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                FREE
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                  <Trophy weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Weekly Contests</p>
                  <p className="text-xs text-gray-400">Starter, Standard, Pro tiers</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                0.002+ ETH
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Lightning weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Daily Flash</p>
                  <p className="text-xs text-gray-400">24-hour quick contests</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-bold">
                0.001 ETH
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
        >
          <X weight="bold" className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-brand-500' : i < step ? 'bg-brand-500/50' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">{currentStep.title}</h2>
            <p className="text-gray-400">{currentStep.subtitle}</p>
          </div>

          <div className="mb-8">
            {currentStep.content}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={handleStartFreeLeague}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Gift weight="fill" className="w-5 h-5" />
                Start Free League
                <ArrowRight weight="bold" className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors"
              >
                Next
                <ArrowRight weight="bold" className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
