/**
 * Shareable Profile Card — Dark theme matching team card aesthetic
 *
 * Design: Dark surface card (#12121A), gold accents, tier-colored avatar ring,
 *         Inter font, corner brackets. Matches generateTeamCard.ts vibe.
 *
 * Canvas: 520×660px @2x retina
 */

import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { Star, Crown, Diamond, Medal, Trophy, Share, XLogo, Copy, Check, X } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

interface ProfileCardData {
  username: string;
  avatarUrl?: string;
  totalScore: number;
  tier: string;
  allTimeRank: number | null;
  seasonRank: number | null;
  weekScore: number;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  earlyAdopterTier: string | null;
  effectiveMultiplier: number;
  contestsEntered: number;
  contestsWon: number;
}

interface Props {
  onClose?: () => void;
  showModal?: boolean;
}

const TIER = {
  bronze:   { color: '#F97316', label: 'BRONZE',   Icon: Medal,   gradient: ['#F97316', '#EA580C'] },
  silver:   { color: '#D1D5DB', label: 'SILVER',   Icon: Star,    gradient: ['#D1D5DB', '#9CA3AF'] },
  gold:     { color: '#FBBF24', label: 'GOLD',     Icon: Trophy,  gradient: ['#FBBF24', '#F59E0B'] },
  platinum: { color: '#22D3EE', label: 'PLATINUM', Icon: Crown,   gradient: ['#22D3EE', '#06B6D4'] },
  diamond:  { color: '#F59E0B', label: 'DIAMOND',  Icon: Diamond, gradient: ['#F59E0B', '#D97706'] },
} as const;

const TIER_RANK_LABEL: Record<string, string> = {
  bronze: 'BRONZE TIER',
  silver: 'SILVER TIER',
  gold: 'GOLD TIER',
  platinum: 'PLATINUM TIER',
  diamond: 'DIAMOND TIER',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadImg(url: string, ms = 3000): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => { img.src = ''; res(null); }, ms);
    img.onload = () => { clearTimeout(t); res(img); };
    img.onerror = () => { clearTimeout(t); res(null); };
    img.src = url;
  });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Canvas generator ──────────────────────────────────────────────────────

async function generateProfileCard(data: ProfileCardData): Promise<Blob | null> {
  const W = 520;
  const H = 660;
  const S = 2;

  const tier = TIER[data.tier as keyof typeof TIER] ?? TIER.bronze;
  const tc = tier.color;
  const [gradA, gradB] = tier.gradient;

  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(S, S);

  // ── Dark background ─────────────────────────────────────────────────
  ctx.fillStyle = '#0A0A0F';
  ctx.fillRect(0, 0, W, H);

  // Card surface
  rr(ctx, 20, 20, W - 40, H - 40, 16);
  ctx.fillStyle = '#12121A';
  ctx.fill();
  ctx.strokeStyle = '#27272A';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Subtle radial glow behind avatar
  const glow = ctx.createRadialGradient(W / 2, 200, 20, W / 2, 200, 200);
  glow.addColorStop(0, `${tc}15`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(20, 20, W - 40, H - 40);

  // Gold accent line at top of card
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(20, 20, W - 40, 3);

  // Corner brackets
  const co = 32, cl = 16;
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(co + cl, co); ctx.lineTo(co, co); ctx.lineTo(co, co + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - co - cl, co); ctx.lineTo(W - co, co); ctx.lineTo(W - co, co + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(co + cl, H - co); ctx.lineTo(co, H - co); ctx.lineTo(co, H - co - cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - co - cl, H - co); ctx.lineTo(W - co, H - co); ctx.lineTo(W - co, H - co - cl); ctx.stroke();
  ctx.globalAlpha = 1;

  // ── FORESIGHT header ────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillText('FORESIGHT', W / 2, 52);

  // Thin gold line under header
  ctx.strokeStyle = 'rgba(245,158,11,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 66); ctx.lineTo(W - 80, 66); ctx.stroke();

  // ── Avatar with tier-colored ring ───────────────────────────────────
  const AX = W / 2;
  const AY = 170;
  const AR = 64;

  // Outer glow ring
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = `${tc}40`;
  const ringGrad = ctx.createLinearGradient(AX - AR - 4, AY - AR - 4, AX + AR + 4, AY + AR + 4);
  ringGrad.addColorStop(0, gradA);
  ringGrad.addColorStop(1, gradB);
  ctx.beginPath(); ctx.arc(AX, AY, AR + 4, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Dark fill inside ring
  ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A24';
  ctx.fill();

  // Avatar image or initial
  ctx.save();
  ctx.beginPath(); ctx.arc(AX, AY, AR - 2, 0, Math.PI * 2); ctx.clip();
  let avatarLoaded = false;
  if (data.avatarUrl) {
    const img = await loadImg(data.avatarUrl);
    if (img) { ctx.drawImage(img, AX - AR + 2, AY - AR + 2, (AR - 2) * 2, (AR - 2) * 2); avatarLoaded = true; }
  }
  if (!avatarLoaded) {
    ctx.fillStyle = '#1A1A24';
    ctx.fillRect(AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.fillStyle = tc;
    ctx.font = 'bold 44px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(data.username.charAt(0).toUpperCase(), AX, AY + 2);
  }
  ctx.restore();

  // Tier badge (small circle to right of avatar)
  const badgeX = AX + AR - 8;
  const badgeY = AY + AR - 12;
  ctx.beginPath(); ctx.arc(badgeX, badgeY, 14, 0, Math.PI * 2);
  ctx.fillStyle = tc; ctx.fill();
  ctx.fillStyle = '#0A0A0F';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tier.label.charAt(0), badgeX, badgeY);

  // ── Username ────────────────────────────────────────────────────────
  const nameY = AY + AR + 32;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FAFAFA';
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText(data.username, W / 2, nameY);

  // Founding member or tier label
  const memberText = data.isFoundingMember && data.foundingMemberNumber
    ? `Founding Member #${data.foundingMemberNumber}`
    : TIER_RANK_LABEL[data.tier] || 'CT FORESIGHT';
  ctx.fillStyle = tc;
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(memberText, W / 2, nameY + 22);
  ctx.letterSpacing = '0px';

  // ── Stats section ───────────────────────────────────────────────────
  const statsY = nameY + 56;

  // SEASON RANK label
  ctx.fillStyle = '#71717A';
  ctx.font = '600 10px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('SEASON RANK', W / 2, statsY);
  ctx.letterSpacing = '0px';

  // Big rank number
  const rankStr = data.seasonRank ? `#${data.seasonRank}` : '—';
  ctx.fillStyle = '#FAFAFA';
  ctx.font = 'bold 72px Inter, system-ui, sans-serif';
  ctx.fillText(rankStr, W / 2, statsY + 66);

  // ── Stat boxes row ──────────────────────────────────────────────────
  const boxY = statsY + 96;
  const boxW = 130;
  const boxH = 52;
  const boxGap = 16;
  const totalBoxW = boxW * 3 + boxGap * 2;
  const boxStartX = (W - totalBoxW) / 2;

  const statItems = [
    { label: 'FS SCORE', value: data.totalScore.toLocaleString() },
    { label: 'MULTIPLIER', value: data.effectiveMultiplier > 1 ? `${data.effectiveMultiplier.toFixed(2)}×` : '1.00×' },
    { label: 'ALL-TIME', value: data.allTimeRank ? `#${data.allTimeRank}` : '—' },
  ];

  statItems.forEach((item, i) => {
    const bx = boxStartX + i * (boxW + boxGap);
    rr(ctx, bx, boxY, boxW, boxH, 8);
    ctx.fillStyle = '#18181B';
    ctx.fill();
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '600 8px Inter, system-ui, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(item.label, bx + boxW / 2, boxY + 18);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = '#FAFAFA';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText(item.value, bx + boxW / 2, boxY + 40);
  });

  // ── Contest stats row ───────────────────────────────────────────────
  const contestY = boxY + boxH + 20;
  if (data.contestsEntered > 0) {
    ctx.fillStyle = '#3F3F46';
    ctx.font = '500 11px Inter, system-ui, sans-serif';
    const contestText = `${data.contestsEntered} contests entered${data.contestsWon > 0 ? ` · ${data.contestsWon} won` : ''}`;
    ctx.fillText(contestText, W / 2, contestY);
  }

  // ── Footer ──────────────────────────────────────────────────────────
  // Separator
  ctx.strokeStyle = '#27272A';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(50, H - 68); ctx.lineTo(W - 50, H - 68); ctx.stroke();

  // Tapestry + URL
  ctx.fillStyle = '#3F3F46';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Tapestry Protocol', 50, H - 46);
  ctx.textAlign = 'right';
  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.fillText('ct-foresight.xyz', W - 50, H - 46);

  ctx.textAlign = 'center';

  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ShareableProfileCard({ onClose, showModal = true }: Props) {
  const { address, isConnected } = useAuth();
  const { showToast } = useToast();
  const [loading,    setLoading]    = useState(true);
  const [data,       setData]       = useState<ProfileCardData | null>(null);
  const [copied,     setCopied]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);

  useEffect(() => { if (isConnected) fetchData(); }, [isConnected]);

  useEffect(() => {
    if (!data) return;
    setGenerating(true);
    generateProfileCard(data)
      .then((b) => { if (b) setCachedBlob(b); })
      .catch(console.error)
      .finally(() => setGenerating(false));
  }, [data]);

  const fetchData = async () => {
    try {
      const [fsRes, statsRes] = await Promise.all([
        apiClient.get(`/api/v2/fs/me`),
        apiClient.get(`/api/users/stats`)
          .catch(() => ({ data: { success: false } })),
      ]);
      if (fsRes.data.success) {
        const fs = fsRes.data.data;
        const st = statsRes.data.success ? statsRes.data.data : {};
        setData({
          username:             fs.username || address?.slice(0, 8) || 'Anonymous',
          avatarUrl:            fs.avatarUrl,
          totalScore:           fs.totalScore || 0,
          tier:                 fs.tier || 'bronze',
          allTimeRank:          fs.allTimeRank,
          seasonRank:           fs.seasonRank,
          weekScore:            fs.weekScore || 0,
          isFoundingMember:     fs.isFoundingMember || false,
          foundingMemberNumber: fs.foundingMemberNumber,
          earlyAdopterTier:     fs.earlyAdopterTier,
          effectiveMultiplier:  fs.effectiveMultiplier || 1,
          contestsEntered:      st.contestsEntered || 0,
          contestsWon:          st.contestsWon || 0,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const buildTweetText = () => {
    if (!data) return '';
    const rankLabel = TIER_RANK_LABEL[data.tier] || data.tier.toUpperCase();
    let t = `${rankLabel} on @ForesightCT\n\n`;
    t += `${data.totalScore.toLocaleString()} FS`;
    if (data.seasonRank) t += ` · Season #${data.seasonRank}`;
    if (data.effectiveMultiplier > 1) t += `\n${data.effectiveMultiplier.toFixed(2)}× multiplier`;
    t += `\n\nBack CT calls. Get paid.\n#CTForesight #CTDraft`;
    return t;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!cachedBlob) { showToast('Still preparing card, try again in a moment', 'info'); return; }
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare) {
      const file = new File([cachedBlob], 'foresight-profile.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: buildTweetText() }); return; }
        catch { /* cancelled */ }
      }
    }
    downloadBlob(cachedBlob, `foresight-${data?.username || 'profile'}.png`);
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(buildTweetText())}`, '_blank');
    showToast('Card saved! Attach the image to your tweet 📎', 'success');
  };

  const handleSave = async () => {
    if (cachedBlob) {
      downloadBlob(cachedBlob, `foresight-${data?.username || 'profile'}.png`);
      showToast('Card saved!', 'success');
      return;
    }
    if (!data) return;
    setGenerating(true);
    const blob = await generateProfileCard(data).catch(() => null);
    setGenerating(false);
    if (blob) { downloadBlob(blob, `foresight-${data.username}.png`); showToast('Saved!', 'success'); }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://ct-foresight.xyz/profile/${address}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (!isConnected) return null;

  const tierCfg = data ? (TIER[data.tier as keyof typeof TIER] ?? TIER.bronze) : TIER.bronze;
  const tc = tierCfg.color;

  // ── DOM preview — dark card matching team card aesthetic ──────────────
  const memberText = data?.isFoundingMember && data.foundingMemberNumber
    ? `Founding Member #${data.foundingMemberNumber}`
    : TIER_RANK_LABEL[data?.tier || 'bronze'] || 'CT FORESIGHT';
  const rankStr = data?.seasonRank ? `#${data.seasonRank}` : '—';
  const statItems = [
    { label: 'FS SCORE', value: (data?.totalScore || 0).toLocaleString() },
    { label: 'MULTIPLIER', value: (data?.effectiveMultiplier ?? 1) > 1 ? `${data!.effectiveMultiplier.toFixed(2)}×` : '1.00×' },
    { label: 'ALL-TIME', value: data?.allTimeRank ? `#${data.allTimeRank}` : '—' },
  ];

  const preview = (
    <div className="w-[300px] rounded-2xl overflow-hidden relative"
      style={{ background: '#12121A', border: '1px solid #27272A' }}>

      {/* Gold accent top */}
      <div style={{ height: 3, background: '#F59E0B' }} />

      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${tc}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Corner brackets */}
      {[
        { top: 12, left: 12, borderWidth: '1.5px 0 0 1.5px' },
        { top: 12, right: 12, borderWidth: '1.5px 1.5px 0 0' },
        { bottom: 12, left: 12, borderWidth: '0 0 1.5px 1.5px' },
        { bottom: 12, right: 12, borderWidth: '0 1.5px 1.5px 0' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: 12, height: 12,
          borderColor: 'rgba(245,158,11,0.5)', borderStyle: 'solid',
          ...s,
        }} />
      ))}

      <div className="relative px-5 pt-4 pb-4 flex flex-col items-center">

        {/* FORESIGHT header */}
        <div style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          FORESIGHT
        </div>
        <div style={{ height: 1, background: 'rgba(245,158,11,0.25)', width: '60%', margin: '6px 0 16px' }} />

        {/* Avatar with tier ring */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, ${tierCfg.gradient[0]}, ${tierCfg.gradient[1]})`,
            padding: 3, boxShadow: `0 0 20px ${tc}30`,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: '#1A1A24', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: tc, fontSize: 32, fontWeight: 700 }}>
                  {(data?.username || 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          {/* Tier badge */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 24, height: 24, borderRadius: '50%',
            background: tc, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#0A0A0F',
            border: '2px solid #12121A',
          }}>
            {tierCfg.label.charAt(0)}
          </div>
        </div>

        {/* Username */}
        <div style={{ color: '#FAFAFA', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          {data?.username || '—'}
        </div>

        {/* Member / tier label */}
        <div style={{ color: tc, fontSize: 9, fontWeight: 600, letterSpacing: '1px', marginTop: 6 }}>
          {memberText}
        </div>

        {/* SEASON RANK */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ color: '#71717A', fontSize: 8, fontWeight: 600, letterSpacing: '2px' }}>SEASON RANK</div>
          <div style={{ color: '#FAFAFA', fontSize: 52, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{rankStr}</div>
        </div>

        {/* Stat boxes */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, width: '100%' }}>
          {statItems.map((item, i) => (
            <div key={i} style={{
              flex: 1, background: '#18181B', border: '1px solid #27272A',
              borderRadius: 8, padding: '8px 4px', textAlign: 'center',
            }}>
              <div style={{ color: '#F59E0B', fontSize: 7, fontWeight: 600, letterSpacing: '1px' }}>{item.label}</div>
              <div style={{ color: '#FAFAFA', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ height: 1, background: '#27272A', width: '100%', margin: '14px 0 8px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ color: '#3F3F46', fontSize: 9, fontWeight: 500 }}>Tapestry Protocol</span>
          <span style={{ color: '#3F3F46', fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}>ct-foresight.xyz</span>
        </div>
      </div>
    </div>
  );

  const content = (
    <div>
      {preview}
      <div className="mt-4 flex gap-2.5">
        <button
          onClick={handleShare}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          style={{ background: generating ? '#1F1F23' : '#FFFFFF', color: '#09090B' }}
        >
          {generating
            ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            : <XLogo size={16} weight="fill" />}
          {generating ? 'Preparing…' : 'Share on X'}
        </button>
        <button
          onClick={handleSave}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
        >
          <Share size={16} />
          Save Image
        </button>
      </div>
      <button
        onClick={handleCopyLink}
        className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700 transition-colors"
      >
        {copied
          ? <><Check size={14} className="text-green-400" /><span className="text-green-400">Copied!</span></>
          : <><Copy size={14} />Copy profile link</>}
      </button>
      <p className="text-center text-[11px] text-gray-600 mt-2 leading-tight">
        On desktop, card saves automatically — attach to your tweet
      </p>
    </div>
  );

  if (loading) return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!showModal) return content;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative">
        {onClose && (
          <button onClick={onClose}
            className="absolute -top-4 -right-4 z-10 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={16} weight="bold" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
}

// ─── Share button ─────────────────────────────────────────────────────────

export function ShareProfileButton({ variant = 'primary', className = '' }: {
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}) {
  const [show, setShow] = useState(false);
  if (variant === 'icon') return (
    <>
      <button onClick={() => setShow(true)}
        className={`p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all ${className}`}>
        <Share size={20} />
      </button>
      {show && <ShareableProfileCard onClose={() => setShow(false)} />}
    </>
  );
  return (
    <>
      <button onClick={() => setShow(true)}
        className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 ${className}`}>
        <Share size={18} />Share Card
      </button>
      {show && <ShareableProfileCard onClose={() => setShow(false)} />}
    </>
  );
}
