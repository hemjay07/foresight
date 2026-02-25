/**
 * Home - Landing Page
 *
 * Same experience for all users (connected or not)
 * - Formation view as hero visual (key differentiator)
 * - Single clear CTA that changes based on connection state
 * - Dashboard functionality moved to Profile page
 */

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowRight,
  Trophy,
  CheckCircle,
  SignIn,
  Play,
  Star,
  Lightning,
} from '@phosphor-icons/react';
import FormationPreview from '../components/FormationPreview';
import ActivityFeedCard from '../components/ActivityFeedCard';
import { useAuth } from '../hooks/useAuth';
import { getXPLevel } from '../utils/xp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============ LANDING PAGE ============

function LandingPage({ isConnected, login, xp, teamsOnChain }: { isConnected: boolean; login: () => void; xp: number; teamsOnChain: number | null }) {
  const xpInfo = xp > 0 ? getXPLevel(xp) : null;
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="pt-6 pb-12 md:pt-10 md:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-sm text-gold-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                </span>
                Live on Solana
              </div>
              <a
                href="https://www.usetapestry.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-xs text-gray-400 hover:border-gray-600 hover:text-gray-200 transition-colors"
              >
                <img src="https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png" alt="Tapestry" className="w-3.5 h-3.5 rounded-sm invert opacity-70" />
                Powered by Tapestry Protocol
              </a>
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
                  Start Playing
                  <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <button
                  onClick={login}
                  className="btn-primary btn-lg group"
                >
                  <SignIn size={20} weight="bold" />
                  Start Playing
                  <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" weight="fill" />
                <span>Free to play</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" weight="fill" />
                <span>Win real prizes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" weight="fill" />
                <span>No deposit required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img src="https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png" alt="Tapestry" className="w-3.5 h-3.5 rounded-sm invert opacity-50 shrink-0" />
                <span className="text-gray-400">Teams on Tapestry</span>
              </div>
            </div>
          </div>

          {/* Right: Formation Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full">
              <FormationPreview variant="hero" showStats={true} />
              {/* Glow effect behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-gold-500/20 via-transparent to-cyan-500/20 blur-3xl -z-10"></div>
            </div>
            {/* Tapestry attribution — below the formation, clean and intentional */}
            <a
              href="https://www.usetapestry.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors group"
            >
              <img
                src="https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png"
                alt="Tapestry"
                className="w-4 h-4 rounded-sm invert opacity-60 group-hover:opacity-90 transition-opacity"
              />
              <span>Teams sealed on-chain · Tapestry Protocol</span>
            </a>
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
                Top teams win prizes. Build your Foresight Score for exclusive rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* XP Progression + Activity Feed — only for logged-in users */}
      {isConnected && (
        <section className="py-16 border-t border-gray-800/50">
          <div className="max-w-lg mx-auto space-y-4">
            {/* XP Progression Card */}
            {xpInfo && (
              <div className="rounded-xl bg-gray-900/60 border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-gold-400" weight="fill" />
                    <span className="text-sm font-semibold text-white">Your Progress</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold-400 uppercase tracking-wide">
                    {xpInfo.levelInfo.label}
                  </span>
                  {xpInfo.nextLevel && (
                    <span className="text-xs text-gray-500">
                      {xpInfo.xpToNext.toLocaleString()} XP to {xpInfo.nextLevel}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpInfo.progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <Lightning size={12} className="text-gold-400" />
                  Draft a team, complete quests, and win contests to earn XP
                </div>
              </div>
            )}

            <ActivityFeedCard />
          </div>
        </section>
      )}

      {/* Powered by Tapestry */}
      <section className="py-16 border-t border-gray-800/50">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Built on Solana's Social Graph
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Every team, score, and social connection is stored on-chain via Tapestry Protocol.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} weight="fill" className="text-gold-400" />
            </div>
            <h3 className="font-semibold text-white mb-1 text-sm">On-chain Teams</h3>
            <p className="text-xs text-gray-500">
              {teamsOnChain != null && teamsOnChain > 0
                ? `${teamsOnChain.toLocaleString()} teams stored as immutable content on Tapestry`
                : 'Draft teams stored as immutable content on Tapestry'}
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} weight="fill" className="text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white mb-1 text-sm">Social Graph</h3>
            <p className="text-xs text-gray-500">Follow players, like teams, and build your reputation</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} weight="fill" className="text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white mb-1 text-sm">Verifiable Scores</h3>
            <p className="text-xs text-gray-500">Contest results verified on Solana via Tapestry Protocol</p>
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
            {isConnected ? 'Draft your dream team' : 'Ready to build your team?'}
          </h2>
          <p className="text-gray-400 mb-8">
            {isConnected
              ? 'Enter the Hackathon Demo League and prove your CT knowledge.'
              : 'Join the competition and show CT who\'s got the best picks.'}
          </p>
          {isConnected ? (
            <Link
              to="/draft?contestId=6&type=FREE_LEAGUE&teamSize=5&hasCaptain=true&isFree=true"
              className="btn-primary btn-lg inline-flex items-center gap-2"
            >
              <Play size={20} weight="fill" />
              Enter Contest
            </Link>
          ) : (
            <button
              onClick={login}
              className="btn-primary btn-lg"
            >
              Sign In to Start
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function Home() {
  const { isConnected, login } = useAuth();
  const [xp, setXp] = useState(0);
  const [teamsOnChain, setTeamsOnChain] = useState<number | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    axios.get(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setXp(r.data.xp || 0))
      .catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    // Fetch total teams stored on-chain from the active free league player count
    axios.get(`${API_URL}/api/v2/contests?status=open&limit=1`)
      .then(r => {
        const contests = r.data?.contests || r.data?.data || [];
        const freeLeague = contests.find((c: any) => c.isFree || c.is_free) || contests[0];
        if (freeLeague?.playerCount ?? freeLeague?.player_count) {
          setTeamsOnChain(freeLeague.playerCount ?? freeLeague.player_count);
        }
      })
      .catch(() => {});
  }, []);

  return <LandingPage isConnected={isConnected} login={login} xp={xp} teamsOnChain={teamsOnChain} />;
}
