/**
 * TierGuide - Explains the Foresight Score tier system
 * Shows all tiers, their thresholds, multipliers, and user's current position
 */

import { useState } from 'react';
import {
  Medal, Star, Crown, Diamond, Trophy, Info, X, CaretRight, Fire
} from '@phosphor-icons/react';

interface TierGuideProps {
  currentTier?: string;
  currentScore?: number;
  isFoundingMember?: boolean;
  effectiveMultiplier?: number;
}

const TIERS = [
  {
    id: 'diamond',
    name: 'Diamond',
    threshold: 50000,
    multiplier: 1.2,
    icon: Diamond,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    threshold: 20000,
    multiplier: 1.15,
    icon: Crown,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    gradient: 'from-cyan-400 to-blue-500'
  },
  {
    id: 'gold',
    name: 'Gold',
    threshold: 5000,
    multiplier: 1.1,
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/40',
    gradient: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'silver',
    name: 'Silver',
    threshold: 1000,
    multiplier: 1.05,
    icon: Star,
    color: 'text-gray-300',
    bgColor: 'bg-gray-400/20',
    borderColor: 'border-gray-400/40',
    gradient: 'from-gray-400 to-gray-500'
  },
  {
    id: 'bronze',
    name: 'Bronze',
    threshold: 0,
    multiplier: 1.0,
    icon: Medal,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    gradient: 'from-orange-500 to-amber-600'
  },
];

const EARLY_ADOPTER_TIERS = [
  { name: 'Founding Member', range: '#1-1000', multiplier: 1.5, duration: '90 days' },
  { name: 'Early Adopter', range: '#1001-5000', multiplier: 1.25, duration: '60 days' },
  { name: 'Early Bird', range: '#5001-10000', multiplier: 1.1, duration: '30 days' },
];

export default function TierGuide({
  currentTier = 'bronze',
  currentScore = 0,
  isFoundingMember = false,
  effectiveMultiplier = 1
}: TierGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentTierIndex = TIERS.findIndex(t => t.id === currentTier);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white text-sm transition-all"
      >
        <Info size={16} />
        View Tiers
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-purple-500 flex items-center justify-center">
                  <Trophy size={22} weight="fill" className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Foresight Tiers</h2>
                  <p className="text-sm text-gray-500">Earn FS to unlock multipliers</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Current Status */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Your Status</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold capitalize ${TIERS[currentTierIndex]?.color || 'text-orange-400'}`}>
                      {currentTier}
                    </span>
                    <span className="text-gray-500">|</span>
                    <span className="text-white font-mono">{currentScore.toLocaleString()} FS</span>
                  </div>
                  {effectiveMultiplier > 1 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold">
                      <Fire size={14} weight="fill" />
                      {effectiveMultiplier.toFixed(2)}x
                    </span>
                  )}
                </div>
              </div>

              {/* Tier List */}
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  All Tiers
                </h3>
                {TIERS.map((tier, index) => {
                  const Icon = tier.icon;
                  const isCurrent = tier.id === currentTier;
                  const isUnlocked = index >= currentTierIndex;

                  return (
                    <div
                      key={tier.id}
                      className={`relative flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? `${tier.bgColor} ${tier.borderColor} ring-2 ring-offset-2 ring-offset-gray-900 ring-${tier.id === 'diamond' ? 'purple' : tier.id === 'platinum' ? 'cyan' : tier.id === 'gold' ? 'yellow' : tier.id === 'silver' ? 'gray' : 'orange'}-500/50`
                          : isUnlocked
                          ? `${tier.bgColor} ${tier.borderColor}`
                          : 'bg-gray-800/30 border-gray-700/50 opacity-60'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg ${tier.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon size={22} weight="fill" className={tier.color} />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${tier.color}`}>{tier.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tier.threshold > 0 ? `${tier.threshold.toLocaleString()} FS required` : 'Starting tier'}
                        </div>
                      </div>

                      {/* Multiplier */}
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-bold ${tier.multiplier > 1 ? 'text-green-400' : 'text-gray-400'}`}>
                          {tier.multiplier}x
                        </div>
                        <div className="text-xs text-gray-500">multiplier</div>
                      </div>

                      {/* Current indicator */}
                      {isCurrent && (
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                          <CaretRight size={16} weight="bold" className={tier.color} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Early Adopter Bonus Section */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Fire size={14} weight="fill" className="text-orange-400" />
                  Early Adopter Bonuses
                </h3>
                <div className="space-y-2">
                  {EARLY_ADOPTER_TIERS.map((tier) => (
                    <div
                      key={tier.name}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        isFoundingMember && tier.name === 'Founding Member'
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-gray-800/30 border-gray-700/50'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white text-sm">{tier.name}</div>
                        <div className="text-xs text-gray-500">{tier.range} • {tier.duration}</div>
                      </div>
                      <div className="text-green-400 font-bold">{tier.multiplier}x</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Early adopter multipliers stack with tier multipliers!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
