/**
 * Potential Winnings Modal
 * Shows users what they could have won in paid contests after Free League completion
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Trophy, ArrowRight, Sparkle, Crown,
  Lightning, Play, CurrencyEth, Star, Fire, Confetti
} from '@phosphor-icons/react';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface ContestPotential {
  typeCode: string;
  typeName: string;
  entryFee: number;
  estimatedPrize: number;
  color: string;
  gradient: string;
  icon: React.ElementType;
}

interface PotentialWinningsModalProps {
  onClose: () => void;
  userScore: number;
  userRank: number;
  totalPlayers: number;
}

export default function PotentialWinningsModal({
  onClose,
  userScore,
  userRank,
  totalPlayers,
}: PotentialWinningsModalProps) {
  const navigate = useNavigate();
  const { markPotentialWinningsSeen } = useOnboarding();

  // Calculate percentile (lower is better)
  const percentile = totalPlayers > 0 ? Math.round((userRank / totalPlayers) * 100) : 50;

  // Estimate potential winnings based on performance
  const potentialWinnings = useMemo((): ContestPotential[] => {
    // Prize pool estimates per contest type (in ETH)
    // These are conservative estimates based on typical pool sizes
    const contests: ContestPotential[] = [
      {
        typeCode: 'WEEKLY_STARTER',
        typeName: 'Weekly Starter',
        entryFee: 0.002,
        estimatedPrize: 0,
        color: 'text-blue-400',
        gradient: 'from-blue-500 to-indigo-600',
        icon: Play,
      },
      {
        typeCode: 'WEEKLY_STANDARD',
        typeName: 'Weekly Standard',
        entryFee: 0.01,
        estimatedPrize: 0,
        color: 'text-purple-400',
        gradient: 'from-purple-500 to-pink-600',
        icon: Trophy,
      },
      {
        typeCode: 'WEEKLY_PRO',
        typeName: 'Weekly Pro',
        entryFee: 0.05,
        estimatedPrize: 0,
        color: 'text-yellow-400',
        gradient: 'from-yellow-500 to-orange-600',
        icon: Crown,
      },
      {
        typeCode: 'DAILY_FLASH',
        typeName: 'Daily Flash',
        entryFee: 0.001,
        estimatedPrize: 0,
        color: 'text-cyan-400',
        gradient: 'from-cyan-500 to-blue-600',
        icon: Lightning,
      },
    ];

    // Calculate estimated prize based on rank
    // Top 40% typically win prizes in these contests
    const wouldWin = percentile <= 40;

    if (wouldWin) {
      contests.forEach(contest => {
        // Estimate prize pool (assume ~20 players avg)
        const estimatedPool = contest.entryFee * 20 * 0.9; // 10% rake

        // Prize distribution estimate based on rank
        if (percentile <= 5) {
          // Top 5% - first place (~40% of pool)
          contest.estimatedPrize = estimatedPool * 0.4;
        } else if (percentile <= 15) {
          // Top 15% - second/third (~20% of pool)
          contest.estimatedPrize = estimatedPool * 0.2;
        } else if (percentile <= 40) {
          // Top 40% - in the money (~5-10% of pool)
          contest.estimatedPrize = estimatedPool * 0.08;
        }
      });
    }

    return contests;
  }, [percentile]);

  const bestContest = potentialWinnings.reduce((best, c) =>
    c.estimatedPrize > best.estimatedPrize ? c : best
  );

  const handleTryContest = (typeCode: string) => {
    markPotentialWinningsSeen();
    navigate(`/contests?tab=browse&filter=${typeCode.toLowerCase().includes('daily') ? 'daily' : 'weekly'}`);
  };

  const handleClose = () => {
    markPotentialWinningsSeen();
    onClose();
  };

  // Determine performance message
  const getPerformanceMessage = () => {
    if (percentile <= 10) {
      return { emoji: '🏆', text: "Outstanding! You're a natural!", subtext: "Top 10% finish" };
    } else if (percentile <= 25) {
      return { emoji: '🔥', text: "Great performance!", subtext: "Top 25% finish" };
    } else if (percentile <= 40) {
      return { emoji: '⭐', text: "Solid showing!", subtext: "In the money range" };
    } else if (percentile <= 60) {
      return { emoji: '💪', text: "Good effort!", subtext: "Keep improving" };
    } else {
      return { emoji: '🎯', text: "Nice try!", subtext: "Practice makes perfect" };
    }
  };

  const performance = getPerformanceMessage();
  const wouldHaveWon = percentile <= 40;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Celebration effect for winners */}
        {wouldHaveWon && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute -top-2 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -top-3 left-3/4 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
        >
          <X weight="bold" className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Performance Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{performance.emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-1">{performance.text}</h2>
            <p className="text-gray-400">{performance.subtext}</p>
          </div>

          {/* Score Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-gray-800/70 text-center">
              <div className="text-2xl font-bold text-white">{userScore.toFixed(1)}</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/70 text-center">
              <div className="text-2xl font-bold text-brand-400">#{userRank}</div>
              <div className="text-xs text-gray-400">Rank</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/70 text-center">
              <div className="text-2xl font-bold text-gray-300">Top {percentile}%</div>
              <div className="text-xs text-gray-400">Percentile</div>
            </div>
          </div>

          {/* Potential Winnings Section */}
          {wouldHaveWon ? (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkle weight="fill" className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-white">You could have won!</h3>
                </div>

                <div className="space-y-2">
                  {potentialWinnings.filter(c => c.estimatedPrize > 0).map((contest) => {
                    const Icon = contest.icon;
                    return (
                      <div
                        key={contest.typeCode}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${contest.gradient}`}>
                            <Icon weight="fill" className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{contest.typeName}</p>
                            <p className="text-xs text-gray-400">{contest.entryFee} ETH entry</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400 flex items-center gap-1">
                            <CurrencyEth weight="fill" className="w-4 h-4" />
                            ~{contest.estimatedPrize.toFixed(3)}
                          </p>
                          <p className="text-xs text-gray-500">est. prize</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Highlight best option */}
              <div className={`p-4 rounded-xl bg-gradient-to-r ${bestContest.gradient} mb-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Best ROI potential:</p>
                    <p className="text-xl font-bold text-white">{bestContest.typeName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Potential return:</p>
                    <p className="text-xl font-bold text-white">
                      {((bestContest.estimatedPrize / bestContest.entryFee) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mb-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-start gap-3">
                <Fire weight="fill" className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white mb-1">Keep practicing!</p>
                  <p className="text-sm text-gray-400">
                    Top 40% finishers win prizes. Try Free League again to improve your strategy!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
            >
              View Results
            </button>
            {wouldHaveWon ? (
              <button
                onClick={() => handleTryContest(bestContest.typeCode)}
                className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${bestContest.gradient} text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                Try {bestContest.typeName}
                <ArrowRight weight="bold" className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/contests?filter=free')}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
              >
                Play Again Free
                <ArrowRight weight="bold" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
