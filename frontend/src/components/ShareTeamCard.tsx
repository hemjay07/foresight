/**
 * ShareTeamCard — Shareable formation card with Twitter/native sharing
 *
 * Display: React formation visual (on-screen)
 * Share: Canvas-drawn PNG (bypasses CORS entirely)
 *
 * Flow:
 * - Mobile: Web Share API → native share sheet (attach image directly)
 * - Desktop: Download PNG → open Twitter composer → user attaches image
 */

import { useState, useEffect } from 'react';
import { XLogo, Export, DownloadSimple, Crown } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { generateTeamCardImage } from '../utils/generateTeamCard';

interface TeamPick {
  id: number;
  name: string;
  handle?: string;
  twitter_handle?: string;
  tier: string;
  profile_image_url?: string;
  total_points?: number;
  isCaptain?: boolean;
}

interface ShareTeamCardProps {
  picks: TeamPick[];
  captainId?: number | null;
  contestName?: string;
  totalScore?: number;
  rank?: number;
  username?: string;
  userAvatar?: string;
  variant?: 'celebration' | 'compact' | 'share-only';
  className?: string;
}

const TIER_STYLES: Record<string, { gradient: string; border: string; badge: string; hex: string }> = {
  S: { gradient: 'from-gold-400 to-amber-600', border: 'border-gold-400', badge: 'bg-gold-500 text-gray-950', hex: '#F59E0B' },
  A: { gradient: 'from-cyan-500 to-blue-600', border: 'border-cyan-400', badge: 'bg-cyan-500 text-white', hex: '#06B6D4' },
  B: { gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-400', badge: 'bg-emerald-500 text-white', hex: '#10B981' },
  C: { gradient: 'from-gray-500 to-gray-700', border: 'border-gray-400', badge: 'bg-gray-500 text-white', hex: '#71717A' },
};

export default function ShareTeamCard({
  picks,
  captainId,
  contestName,
  totalScore,
  rank,
  username,
  userAvatar,
  variant = 'celebration',
  className = '',
}: ShareTeamCardProps) {
  const { showToast } = useToast();
  const [generating, setGenerating] = useState(true);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);

  // Pre-generate the image as soon as the component mounts — no wait on click
  useEffect(() => {
    generateTeamCardImage({
      picks: picks.map((p) => ({
        name: p.name,
        handle: p.handle || p.twitter_handle || '',
        tier: p.tier,
        isCaptain: !!(p.isCaptain || p.id === captainId),
        imageUrl: p.profile_image_url,
      })),
      contestName,
      totalScore,
      rank,
      username,
      userAvatar,
    })
      .then((blob) => { setCachedBlob(blob); setGenerating(false); })
      .catch(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPostText = () => {
    const captain = picks.find((p) => p.isCaptain || p.id === captainId);
    const others = picks.filter((p) => !(p.isCaptain || p.id === captainId));

    let tweet = `\u{1F3C6} Just locked in my CT Fantasy squad on @ForesightCT!\n\n`;
    if (captain) {
      const h = captain.handle || captain.twitter_handle || captain.name;
      tweet += `\u{1F451} Captain: @${h}\n`;
    }
    others.forEach((p) => {
      const h = p.handle || p.twitter_handle || p.name;
      tweet += `\u{26A1} @${h}\n`;
    });
    tweet += `\nDraft your team and beat me \u{1F440}\u{1F447}\n`;
    tweet += `#Foresight #CTFantasy #Solana`;
    return tweet;
  };

  const handleShare = async () => {
    const blob = cachedBlob;
    if (!blob) {
      showToast('Still generating image, try again in a moment', 'info');
      return;
    }

    const tweetText = encodeURIComponent(buildPostText());
    const twitterUrl = `https://x.com/intent/post?text=${tweetText}`;

    // Mobile: use Web Share API to share the image file natively
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare) {
      const file = new File([blob], 'foresight-team.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: buildPostText() });
          return;
        } catch { /* cancelled */ }
      }
    }

    // Desktop: copy image to clipboard + open Twitter composer
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Image copied! Paste into your tweet with Ctrl+V / Cmd+V', 'success');
    } catch {
      downloadBlob(blob);
      showToast('Image saved — attach it to your tweet', 'success');
    }
    window.open(twitterUrl, '_blank');
  };

  const handleDownload = async () => {
    if (cachedBlob) {
      downloadBlob(cachedBlob);
      showToast('Team card saved!', 'success');
      return;
    }
    setGenerating(true);
    try {
      const blob = await generateTeamCardImage({
        picks: picks.map((p) => ({
          name: p.name,
          handle: p.handle || p.twitter_handle || '',
          tier: p.tier,
          isCaptain: !!(p.isCaptain || p.id === captainId),
        })),
        contestName,
        totalScore,
        rank,
        username,
        userAvatar,
      });
      downloadBlob(blob);
      showToast('Team card saved!', 'success');
    } catch {
      showToast('Failed to generate image', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(buildPostText());
    showToast('Copied to clipboard!', 'success');
  };

  // Sort picks: captain first, then by tier
  const sortedPicks = [...picks].sort((a, b) => {
    const aIsCpt = a.isCaptain || a.id === captainId;
    const bIsCpt = b.isCaptain || b.id === captainId;
    if (aIsCpt && !bIsCpt) return -1;
    if (!aIsCpt && bIsCpt) return 1;
    const tierOrder = ['S', 'A', 'B', 'C'];
    return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
  });

  const topRow = sortedPicks.slice(0, 2);
  const midRow = sortedPicks.slice(2, 3);
  const botRow = sortedPicks.slice(3, 5);

  // ─── The formation card (display only — Canvas handles the image) ──
  const formationCard = (
    <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/5' }}>
      {/* Pitch background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-gray-900/90 to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]" />

      {/* Pitch lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/[0.06] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 left-6 right-6 h-px bg-white/[0.04]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-12 border-b border-l border-r border-white/[0.05] rounded-b-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-12 border-t border-l border-r border-white/[0.05] rounded-t-full" />
      </div>

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-white/[0.08] rounded-tl" />
      <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-white/[0.08] rounded-tr" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-white/[0.08] rounded-bl" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-white/[0.08] rounded-br" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-4 py-5">
        {/* Header */}
        <div className="text-center mb-auto">
          <div className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-gold-400 to-amber-300 bg-clip-text text-transparent">
            FORESIGHT
          </div>
          {contestName && (
            <div className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">
              {contestName}
            </div>
          )}
        </div>

        {/* Formation */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-2">
          <div className="flex justify-center gap-8">
            {topRow.map((pick) => (
              <PlayerNode key={pick.id} pick={pick} captainId={captainId} />
            ))}
          </div>
          <div className="flex justify-center">
            {midRow.map((pick) => (
              <PlayerNode key={pick.id} pick={pick} captainId={captainId} />
            ))}
          </div>
          <div className="flex justify-center gap-8">
            {botRow.map((pick) => (
              <PlayerNode key={pick.id} pick={pick} captainId={captainId} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          {/* User identity */}
          {username ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-gold-500/40 shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gold-500/20 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-gold-400">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400">@{username}</span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 font-medium">ct-foresight.xyz</div>
          )}
          {(totalScore !== undefined || rank) && (
            <div className="flex items-center gap-3 text-[10px]">
              {totalScore !== undefined && <span className="text-gold-400 font-bold">{totalScore} pts</span>}
              {rank && <span className="text-white font-bold">#{rank}</span>}
            </div>
          )}
          <div className="text-[10px] text-gray-500">Tapestry</div>
        </div>
      </div>
    </div>
  );

  // ─── Share-only: formation + share buttons ────────────────────────────
  if (variant === 'share-only') {
    return (
      <div className={className}>
        {formationCard}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleShare}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-white hover:bg-gray-100 text-gray-950 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <XLogo size={22} weight="fill" />
            )}
            {generating ? 'Preparing...' : 'Share on X'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors border border-gray-800 disabled:opacity-60"
            >
              <DownloadSimple size={16} />
              Save Image
            </button>
            <button
              onClick={handleCopyText}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors border border-gray-800"
            >
              <Export size={16} />
              Copy Text
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Compact: inline share buttons ────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleShare}
          disabled={generating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all disabled:opacity-60"
        >
          <XLogo size={14} weight="fill" />
          Share
        </button>
        <button
          onClick={handleCopyText}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:text-white transition-all"
        >
          <Export size={14} />
          Copy
        </button>
      </div>
    );
  }

  // ─── Celebration: full card + share buttons ───────────────────────────
  return (
    <div className={className}>
      {formationCard}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleShare}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-950 font-medium transition-colors disabled:opacity-60"
        >
          {generating ? (
            <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <XLogo size={18} weight="fill" />
          )}
          Share on X
        </button>
        <button
          onClick={handleCopyText}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors border border-gray-700"
        >
          <Export size={18} />
          Copy Team Details
        </button>
      </div>
    </div>
  );
}

// ─── Player Node (display only — React component for on-screen) ──────────
function PlayerNode({ pick, captainId }: { pick: TeamPick; captainId?: number | null }) {
  const [imgError, setImgError] = useState(false);
  const isCaptain = pick.isCaptain || pick.id === captainId;
  const tier = TIER_STYLES[pick.tier] || TIER_STYLES.C;
  const handle = pick.handle || pick.twitter_handle || '';
  // Use unavatar.io for reliable live Twitter profile photos — DB avatar_url can be stale
  const avatarSrc = handle ? `https://unavatar.io/twitter/${handle}` : pick.profile_image_url;
  const showImg = !!avatarSrc && !imgError;

  return (
    <div className="relative flex flex-col items-center w-20">
      {isCaptain && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gold-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
            <Crown size={10} weight="fill" className="text-gray-950" />
            <span className="text-[8px] font-extrabold text-gray-950">CPT</span>
          </div>
        </div>
      )}

      <div className={`p-0.5 rounded-full bg-gradient-to-br ${tier.gradient} shadow-lg`}>
        <div className="w-12 h-12 rounded-full bg-gray-900 overflow-hidden border border-gray-800">
          {showImg ? (
            <img
              src={avatarSrc}
              alt={pick.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: tier.hex }}>
              {pick.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className={`absolute top-7 -right-0.5 ${tier.badge} px-1 py-px rounded text-[8px] font-extrabold z-10`}>
        {pick.tier}
      </div>

      <div className="mt-1.5 text-center">
        <div className="text-[10px] font-semibold text-white truncate max-w-[76px]">
          {pick.name.split(' ')[0]}
        </div>
        <div className="text-[8px] text-gray-400 truncate max-w-[76px]">
          @{handle.length > 10 ? handle.slice(0, 10) : handle}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'foresight-team.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
