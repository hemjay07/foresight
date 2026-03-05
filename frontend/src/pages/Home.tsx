/**
 * Home — Landing Page
 * Show the product, don't explain it.
 */

import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import apiClient, { hasSession } from '../lib/apiClient';
import {
  ArrowRight,
  SignIn,
  Star,
  Lightning,
  Crown,
  Timer,
  Trophy,
  Users,
  ChartLineUp,
  Target,
} from '@phosphor-icons/react';
import FormationPreview from '../components/FormationPreview';
import ActivityFeedCard from '../components/ActivityFeedCard';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import HomepageBackground from '../components/HomepageBackground';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../contexts/OnboardingContext';
import { getXPLevel } from '../utils/xp';


// ─── Countdown ───────────────────────────────────────────────────────────────

function useContestCountdown(lockTime: string | null) {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (!lockTime) return;
    function calc() {
      const target = new Date(lockTime!);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCountdown('Locked'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setCountdown(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    }
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [lockTime]);
  return countdown;
}

// ─── Contest Panel ────────────────────────────────────────────────────────────

function ContestPanel({
  isConnected, login, countdown, prizeFormatted, teamsOnChain,
}: {
  isConnected: boolean; login: () => void; countdown: string;
  prizeFormatted: string | null; teamsOnChain: number | null;
}) {
  return (
    <div className="mt-5 rounded-2xl overflow-hidden border border-gray-800">
      <div className="grid grid-cols-3 divide-x divide-gray-800 bg-gray-900">
        {[
          { label: 'Prize Pool', value: prizeFormatted ?? '—', icon: null },
          { label: 'Entry', value: 'Free', icon: null },
          { label: 'Closes', value: countdown || '—', icon: <Timer size={9} /> },
        ].map((col, i) => (
          <div key={col.label} className="px-4 py-3.5 opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              {col.icon}{col.label}
            </p>
            <p className="text-sm font-mono font-bold text-white tabular-nums">{col.value}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 bg-gray-950 px-4 py-3.5">
        {isConnected ? (
          <Link to="/compete?tab=contests"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-gray-950 font-bold text-sm transition-colors duration-150">
            Enter Contest <ArrowRight size={16} weight="bold" />
          </Link>
        ) : (
          <button onClick={login}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-gray-950 font-bold text-sm transition-colors duration-150">
            <SignIn size={16} weight="bold" /> Sign In to Play
          </button>
        )}
        {teamsOnChain != null && teamsOnChain > 0 && (
          <p className="text-center text-[10px] font-mono text-gray-600 mt-2 tabular-nums">
            {teamsOnChain.toLocaleString()} teams competing this week
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Leaderboard Preview ──────────────────────────────────────────────────────

const LEADERBOARD_DATA = [
  { rank: 1, handle: 'saylor', name: 'Saylor', score: 847, team: ['S', 'A', 'A', 'B', 'C'] },
  { rank: 2, handle: 'blknoiz06', name: 'Ansem', score: 721, team: ['S', 'A', 'B', 'B', 'C'] },
  { rank: 3, handle: 'zachxbt', name: 'ZachXBT', score: 698, team: ['A', 'A', 'A', 'B', 'C'] },
  { rank: 4, handle: 'Pentosh1', name: 'Pentoshi', score: 654, team: ['S', 'A', 'B', 'C', 'C'] },
  { rank: 5, handle: 'CryptoKaleo', name: 'Kaleo', score: 612, team: ['A', 'A', 'B', 'B', 'C'] },
];

function LeaderboardPreview({ visible }: { visible: boolean }) {
  const tierColor = (t: string) =>
    t === 'S' ? 'text-gold-400' : t === 'A' ? 'text-gray-300' : t === 'B' ? 'text-gray-500' : 'text-gray-600';

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-[opacity,transform] duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-gold-400" weight="fill" />
          <span className="text-xs font-semibold text-white">This Week</span>
        </div>
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Live Rankings</span>
      </div>

      <div className="divide-y divide-gray-800/60">
        {LEADERBOARD_DATA.map((row, i) => (
          <div
            key={row.rank}
            className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800/30 transition-all duration-200 border-l-2 border-transparent hover:border-gold-500/40"
            style={{ transitionDelay: visible ? `${i * 40}ms` : '0ms' }}
          >
            <span className={`text-xs font-mono font-bold w-5 tabular-nums ${
              row.rank === 1 ? 'text-gold-400' : row.rank <= 3 ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {row.rank}
            </span>
            <img
              src={`https://unavatar.io/twitter/${row.handle}`}
              alt={row.name}
              className="w-7 h-7 rounded-full bg-gray-800 object-cover shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-white block truncate">{row.name}</span>
              <div className="flex gap-0.5 mt-0.5">
                {row.team.map((t, j) => (
                  <span key={j} className={`text-[8px] font-mono font-bold ${tierColor(t)}`}>{t}</span>
                ))}
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white tabular-nums">{row.score}</span>
          </div>
        ))}

        {/* Your spot */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-gold-500/5 animate-breathe-gold">
          <span className="text-xs font-mono w-5 text-gold-400 tabular-nums">?</span>
          <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-dashed border-gold-500/30 flex items-center justify-center shrink-0">
            <Users size={12} className="text-gold-400/60" />
          </div>
          <span className="text-xs text-gold-400 flex-1">Your team here</span>
          <span className="text-xs font-mono text-gold-500/50 tabular-nums">—</span>
        </div>
      </div>
    </div>
  );
}

// ─── Scoring Explainer ────────────────────────────────────────────────────────

const SCORING_FEATURES = [
  { label: 'Multi-factor scoring', desc: 'We track real engagement, not vanity metrics' },
  { label: 'Anti-gaming', desc: 'Proprietary algorithm resists bots & fake engagement' },
  { label: 'Daily updates', desc: 'Scores refresh every 6 hours during contests' },
];

function ScoringExplainer({ visible, animate }: { visible: boolean; animate: boolean }) {
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-[opacity,transform] duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: visible ? '80ms' : '0ms' }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ChartLineUp size={14} className="text-gray-400" weight="bold" />
          <span className="text-xs font-semibold text-white">How Scoring Works</span>
        </div>
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Daily</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {SCORING_FEATURES.map((feat, i) => (
          <div key={feat.label} className={`flex items-start gap-3 ${animate ? 'opacity-0 animate-[fadeInUp_0.3s_ease-out_forwards]' : ''}`} style={animate ? { animationDelay: `${200 + i * 80}ms` } : undefined}>
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-white">{feat.label}</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Captain bonus */}
      <div className="px-5 py-3.5 border-t border-gray-800 bg-gray-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={12} className="text-gold-400" weight="fill" />
            <span className="text-[10px] text-gray-400">Captain earns <strong className="text-white">2×</strong> points</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Pick wisely</span>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({
  isConnected, login, xp, teamsOnChain, countdown, prizeFormatted,
}: {
  isConnected: boolean; login: () => void; xp: number;
  teamsOnChain: number | null; countdown: string; prizeFormatted: string | null;
}) {
  const xpInfo = xp > 0 ? getXPLevel(xp) : null;
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [showcaseVisible, setShowcaseVisible] = useState(false);

  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShowcaseVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto">
      <HomepageBackground />
      <SEO path="/" />

      {/* ═══════════════════════ MOBILE HERO ════════════════════════════ */}
      <section className="lg:hidden pt-4 pb-4 px-3">
        <div className="flex items-center gap-2 mb-3 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.1s_forwards]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[11px] text-gold-400 font-medium">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-500" />
            </span>
            Live · Solana Devnet
          </div>
          <a href="https://www.usetapestry.dev" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/80 border border-gray-700 text-[10px] text-gray-400">
            <img src="https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png" alt="" className="w-3 h-3 rounded-sm invert opacity-70" />
            Tapestry
          </a>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 leading-tight tracking-tight opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
          Draft your favourite influencer.{' '}
          <span className="animate-gold-shimmer">Get paid.</span>
        </h1>
        <p className="text-[13px] text-gray-400 mb-0 leading-relaxed opacity-0 animate-[fadeInUp_0.5s_ease-out_0.35s_forwards]">
          Pick 5 CT influencers. Score their weekly engagement. Compete for SOL.
        </p>

        <div className="opacity-0 animate-[fadeInUp_0.5s_ease-out_0.5s_forwards]">
          <ContestPanel isConnected={isConnected} login={login} countdown={countdown}
            prizeFormatted={prizeFormatted} teamsOnChain={teamsOnChain} />
        </div>

        {/* Compact formation teaser */}
        <div className="mt-4 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.65s_forwards]">
          <FormationPreview variant="compact" showStats={false} />
        </div>
      </section>

      {/* ═══════════════════════ DESKTOP HERO ═══════════════════════════ */}
      <section className="hidden lg:block pt-12 pb-8">
        <div className="grid lg:grid-cols-[1.1fr_1.2fr] gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 mb-8 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.1s_forwards]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-sm text-gold-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
                </span>
                Live · Solana Devnet
              </div>
              <a href="https://www.usetapestry.dev" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-xs text-gray-400 hover:border-gray-600 hover:text-gray-200 transition-colors duration-150">
                <img src="https://cdn.prod.website-files.com/67814d9fc76ba46748750247/6793b4f682781f7c980f8921_Favicon31_black.png" alt="Tapestry" className="w-3.5 h-3.5 rounded-sm invert opacity-70" />
                Tapestry Protocol
              </a>
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-5 opacity-0 animate-[fadeInUp_0.7s_ease-out_0.2s_forwards]">
              Draft your favourite influencer.<br />{' '}
              <span className="animate-gold-shimmer">Get paid.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-sm mb-0 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.45s_forwards]">
              Pick 5 CT influencers. Score their weekly engagement. Compete for SOL prizes.
            </p>

            <div className="opacity-0 animate-[fadeInUp_0.5s_ease-out_0.6s_forwards]">
              <ContestPanel isConnected={isConnected} login={login} countdown={countdown}
                prizeFormatted={prizeFormatted} teamsOnChain={teamsOnChain} />
            </div>

            <p className="text-[10px] font-mono text-gray-700 mt-4 opacity-0 animate-[fadeIn_0.5s_ease-out_0.8s_forwards]">
              Solana Devnet · Moving to mainnet post-launch · Teams on-chain via Tapestry
            </p>
          </div>

          <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
            <FormationPreview variant="hero" showStats={true} />
          </div>
        </div>
      </section>

      {/* ═══════════════════ GAME LOOP STRIP ════════════════════════════ */}
      <div className="border-t border-gray-800/50 py-4 opacity-0 animate-[fadeIn_0.5s_ease-out_0.9s_forwards]">
        <div className="flex items-center justify-center gap-3 md:gap-6 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Target size={12} className="text-gold-400" weight="bold" />
            <span className="hidden sm:inline">Draft 5 picks</span>
            <span className="sm:hidden">Draft</span>
          </span>
          <span className="text-gray-700 animate-arrow-pulse">→</span>
          <span className="flex items-center gap-1.5">
            <ChartLineUp size={12} className="text-gray-400" weight="bold" />
            <span className="hidden sm:inline">Score daily</span>
            <span className="sm:hidden">Score</span>
          </span>
          <span className="text-gray-700 animate-arrow-pulse" style={{ animationDelay: '1s' }}>→</span>
          <span className="flex items-center gap-1.5">
            <Trophy size={12} className="text-gold-400" weight="fill" />
            <span className="hidden sm:inline">Win SOL weekly</span>
            <span className="sm:hidden">Win</span>
          </span>
          <span className="text-gray-800 hidden md:inline">·</span>
          <span className="text-gray-700 hidden md:inline">Resets Sunday 23:59 UTC</span>
        </div>
      </div>

      {/* ═══════════════════ PRODUCT SHOWCASE ═══════════════════════════ */}
      <section className="py-8" ref={showcaseRef}>
        {/* Mobile: vertical stack */}
        <div className="md:hidden space-y-4 px-1">
          <LeaderboardPreview visible={showcaseVisible} />
          <ScoringExplainer visible={showcaseVisible} animate={showcaseVisible} />
        </div>

        {/* Desktop: asymmetric 2-col — leaderboard is the star */}
        <div className="hidden md:grid md:grid-cols-[1.3fr_1fr] gap-4 items-start">
          <LeaderboardPreview visible={showcaseVisible} />
          <ScoringExplainer visible={showcaseVisible} animate={showcaseVisible} />
        </div>
      </section>

      {/* ═══════════════════ XP + ACTIVITY (connected) ══════════════════ */}
      {isConnected && (
        <section className="py-8 border-t border-gray-800/50">
          <div className="grid md:grid-cols-2 gap-4">
            {xpInfo && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-gold-400" weight="fill" />
                    <span className="text-sm font-semibold text-white">Your Progress</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 tabular-nums">{xp.toLocaleString()} XP</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold-400 uppercase tracking-wide">{xpInfo.levelInfo.level}</span>
                  {xpInfo.nextLevel && (
                    <span className="text-xs font-mono text-gray-500 tabular-nums">
                      {xpInfo.xpToNext.toLocaleString()} XP to {xpInfo.nextLevel}
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpInfo.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Lightning size={12} className="text-gold-400" />
                  Draft a team, complete quests, and win contests to earn XP
                </div>
              </div>
            )}
            <ActivityFeedCard />
          </div>
        </section>
      )}

    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isConnected, login } = useAuth();
  const { isFirstVisit } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingExpanded, setOnboardingExpanded] = useState(false);
  const [xp, setXp] = useState(0);
  const [teamsOnChain, setTeamsOnChain] = useState<number | null>(null);
  const [prizeFormatted, setPrizeFormatted] = useState<string | null>(null);
  const [lockTime, setLockTime] = useState<string | null>(null);
  const [contestId, setContestId] = useState<number | null>(null);
  const countdown = useContestCountdown(lockTime);

  // Show onboarding on first visit
  useEffect(() => {
    if (isFirstVisit) setShowOnboarding(true);
  }, [isFirstVisit]);

  useEffect(() => {
    if (!isConnected) return;
    if (!hasSession()) return;
    apiClient.get('/api/users/me')
      .then(r => setXp(r.data.xp || 0)).catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    apiClient.get('/api/v2/contests?status=open&limit=1')
      .then(r => {
        const contests = r.data?.contests || r.data?.data || [];
        const free = contests.find((c: any) => c.isFree || c.is_free) || contests[0];
        if (free?.id) setContestId(free.id);
        const count = free?.playerCount ?? free?.player_count;
        if (count) setTeamsOnChain(count);
        const prize = free?.prizePoolFormatted ?? free?.prize_pool_formatted;
        if (prize) setPrizeFormatted(prize);
        const lock = free?.lockTime ?? free?.lock_time;
        if (lock) setLockTime(lock);
      }).catch(() => {});
  }, []);

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => setShowOnboarding(false)}
          contestId={contestId ?? undefined}
          onExpandChange={setOnboardingExpanded}
        />
      )}
      <div
        style={{
          filter: onboardingExpanded ? 'blur(3px)' : 'blur(0px)',
          transition: 'filter 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <LandingPage isConnected={isConnected} login={login} xp={xp}
          teamsOnChain={teamsOnChain} countdown={countdown} prizeFormatted={prizeFormatted} />
      </div>
    </>
  );
}
