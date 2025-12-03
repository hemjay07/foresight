import { useState, useEffect } from 'react';
import { X, TrendUp, Trophy, Lightning, Users } from '@phosphor-icons/react';

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      // Show modal after a brief delay
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-8 pb-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} weight="bold" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/50">
                  <TrendUp size={40} weight="bold" className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Welcome to Foresight
              </h2>
              <p className="text-gray-300 text-lg">
                The premier CT Fantasy League
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Feature 1 */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users size={20} weight="bold" className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Build Your Squad</h3>
                    <p className="text-sm text-gray-400">
                      Select 5 CT influencers within your 150-point budget
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Lightning size={20} weight="bold" className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Auto-Scoring</h3>
                    <p className="text-sm text-gray-400">
                      Scores update automatically based on Twitter metrics
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Trophy size={20} weight="bold" className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Compete & Win</h3>
                    <p className="text-sm text-gray-400">
                      Climb the leaderboard and prove your CT knowledge
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendUp size={20} weight="bold" className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Set & Forget</h3>
                    <p className="text-sm text-gray-400">
                      No daily management required - just pick your team
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-3 text-cyan-400 text-center">How It Works</h3>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <p className="text-xs text-gray-300">Pick 5 Influencers</p>
                </div>
                <div className="text-gray-500">→</div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <p className="text-xs text-gray-300">Scores Auto-Update</p>
                </div>
                <div className="text-gray-500">→</div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <p className="text-xs text-gray-300">Climb Leaderboard</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleClose}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default WelcomeModal;
