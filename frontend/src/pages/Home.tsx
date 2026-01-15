/**
 * Home - Landing Page
 *
 * Same experience for all users (connected or not)
 * - Formation view as hero visual (key differentiator)
 * - Single clear CTA that changes based on connection state
 * - Dashboard functionality moved to Profile page
 */

import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  ArrowRight,
  Trophy,
  CheckCircle,
} from '@phosphor-icons/react';
import FormationPreview from '../components/FormationPreview';

// ============ LANDING PAGE ============

function LandingPage({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-sm text-gold-400 font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
              Live on Base
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Fantasy league for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500">
                Crypto Twitter
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0">
              Draft 5 CT influencers. Earn points from their engagement. Climb the leaderboard.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isConnected ? (
                <Link
                  to="/compete?tab=contests"
                  className="btn-primary btn-lg group"
                >
                  Browse Contests
                  <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="btn-primary btn-lg group"
                    >
                      Start Playing
                      <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" weight="fill" />
                <span>Free to play</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" weight="fill" />
                <span>Win real ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" weight="fill" />
                <span>No deposit required</span>
              </div>
            </div>
          </div>

          {/* Right: Formation Preview */}
          <div className="relative">
            <FormationPreview variant="hero" showStats={true} />
            {/* Glow effect behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-gold-500/20 via-transparent to-cyan-500/20 blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-gray-800/50">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500/20 to-transparent rounded-xl blur opacity-0 group-hover:opacity-100 transition"></div>
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Draft your team</h3>
              <p className="text-gray-400 text-sm">
                Pick 5 CT influencers within your 150-point budget. Mix S-tier legends with rising stars.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-xl blur opacity-0 group-hover:opacity-100 transition"></div>
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Earn points</h3>
              <p className="text-gray-400 text-sm">
                Your team scores based on their Twitter engagement — likes, retweets, followers.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-transparent rounded-xl blur opacity-0 group-hover:opacity-100 transition"></div>
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Win prizes</h3>
              <p className="text-gray-400 text-sm">
                Top teams win ETH. Build your Foresight Score for exclusive rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-gray-800/50">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
            <Trophy size={28} className="text-gold-400" weight="fill" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to build your team?
          </h2>
          <p className="text-gray-400 mb-8">
            Join the competition and show CT who's got the best picks.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="btn-primary btn-lg"
              >
                Connect Wallet to Start
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </section>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function Home() {
  const { isConnected } = useAccount();

  // Always show landing page - same experience for everyone
  // CTAs change based on connection state
  return <LandingPage isConnected={isConnected} />;
}
