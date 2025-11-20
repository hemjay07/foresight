/**
 * Home Page
 * Simple landing page focused on daily Foresight drops
 */

import { Link } from 'react-router-dom';
import { SmartHeroBanner } from '../components/home/SmartHeroBanner';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Smart Hero Banner */}
      <SmartHeroBanner />

      {/* Main CTA */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-8 mb-8">
        <div className="text-center">
          <h2 className="heading-2 mb-3 text-gradient-cyan-blue">
            CT Draft
          </h2>
          <p className="body-base mb-6 max-w-2xl mx-auto text-gray-300">
            Pick 5 CT influencers, earn points when they get voted best take of the day, and compete for the top spot!
          </p>
          <Link
            to="/draft"
            className="inline-block py-4 px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            Start Drafting →
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-bold text-cyan-400 mb-1">5 Picks</div>
          <div className="text-sm text-gray-400">Build Your Team</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl mb-2">🗳️</div>
          <div className="text-2xl font-bold text-orange-400 mb-1">Vote Daily</div>
          <div className="text-sm text-gray-400">Best CT Take</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-yellow-400 mb-1">Compete</div>
          <div className="text-sm text-gray-400">Win Prizes</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-center text-gray-300">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold text-cyan-400">
              1
            </div>
            <h4 className="font-semibold mb-2">Connect Wallet</h4>
            <p className="text-sm text-gray-500">
              Sign in with your wallet to track progress
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold text-cyan-400">
              2
            </div>
            <h4 className="font-semibold mb-2">Read Daily Drop</h4>
            <p className="text-sm text-gray-500">
              Get curated CT insights every day
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold text-cyan-400">
              3
            </div>
            <h4 className="font-semibold mb-2">Build Your Streak</h4>
            <p className="text-sm text-gray-500">
              Earn XP, unlock badges, level up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
