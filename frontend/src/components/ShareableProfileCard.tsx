/**
 * Shareable Profile Card — Certificate of Achievement
 *
 * Design: Vintage parchment certificate. Cream background, ornate gold border,
 *         serif typography, wax seal. Cream pops on dark Twitter feeds.
 *
 * Canvas: 520×680px @2x retina
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Star, Crown, Diamond, Medal, Trophy, Share, XLogo, Copy, Check, Lightning } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  bronze:   { color: '#F97316', label: 'BRONZE',   Icon: Medal,   sealText: '●' },
  silver:   { color: '#D1D5DB', label: 'SILVER',   Icon: Star,    sealText: '★' },
  gold:     { color: '#FBBF24', label: 'GOLD',     Icon: Trophy,  sealText: '▲' },
  platinum: { color: '#22D3EE', label: 'PLATINUM', Icon: Crown,   sealText: '◆' },
  diamond:  { color: '#F59E0B', label: 'DIAMOND',  Icon: Diamond, sealText: '◇' },
} as const;

const TIER_RANK_LABEL: Record<string, string> = {
  bronze: 'BRONZE TIER ANALYST',
  silver: 'SILVER TIER ANALYST',
  gold: 'GOLD TIER ANALYST',
  platinum: 'PLATINUM TIER ANALYST',
  diamond: 'DIAMOND TIER ANALYST',
};

// Palette for light (parchment) background
const C = {
  cream:       '#F5F1E8',
  gold:        '#F59E0B',
  dark:        '#1A1A1A',
  amberDark:   '#78350F',  // hero text — name, rank number
  amberMed:    '#92400E',  // primary body text
  amberLight:  '#A16207',  // labels, secondary text
  amberMuted:  '#7C5C2E',  // supporting/footer (was too light — bumped to readable)
  rule:        'rgba(245,158,11,0.45)',
  boxBorder:   'rgba(245,158,11,0.38)',
  sealDash:    'rgba(245,158,11,0.7)',
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
  const tc   = tier.color;

  const canvas = document.createElement('canvas');
  canvas.width  = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(S, S);

  // ── Cream parchment ───────────────────────────────────────────────────
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);

  // Paper texture
  ctx.save();
  ctx.strokeStyle = 'rgba(160,130,80,0.055)';
  ctx.lineWidth = 0.5;
  for (let i = -H; i < W + H; i += 7) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }
  ctx.restore();

  // Warm edge vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.76);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(139,90,43,0.08)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── Outer gold border ─────────────────────────────────────────────────
  ctx.strokeStyle = C.gold;
  ctx.lineWidth   = 5;
  rr(ctx, 16, 16, W - 32, H - 32, 4);
  ctx.stroke();

  // Inner hairline
  ctx.strokeStyle = C.boxBorder;
  ctx.lineWidth   = 1;
  rr(ctx, 25, 25, W - 50, H - 50, 3);
  ctx.stroke();

  // Corner marks
  const co = 26, cl = 14;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth   = 2;
  ctx.beginPath(); ctx.moveTo(co + cl, co); ctx.lineTo(co, co); ctx.lineTo(co, co + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - co - cl, co); ctx.lineTo(W - co, co); ctx.lineTo(W - co, co + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(co + cl, H - co); ctx.lineTo(co, H - co); ctx.lineTo(co, H - co - cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - co - cl, H - co); ctx.lineTo(W - co, H - co); ctx.lineTo(W - co, H - co - cl); ctx.stroke();

  // ── ZONE 1: Header (brand only — small, authority, stays out of the way)
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = C.amberDark;
  ctx.font         = 'bold 8px Inter, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('FORESIGHT', W / 2, 44);
  ctx.letterSpacing = '0px';
  ctx.strokeStyle = C.boxBorder;
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(50, 54); ctx.lineTo(W - 50, 54); ctx.stroke();

  // ── ZONE 2: Identity (avatar + name + founding member) ────────────────
  // Avatar — large, the face is the identity
  const AX = W / 2;
  const AY = 160;
  const AR = 72; // bigger than before

  // Shadow
  ctx.save();
  ctx.shadowBlur    = 12;
  ctx.shadowColor   = 'rgba(0,0,0,0.13)';
  ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.arc(AX, AY, AR + 11, 0, Math.PI * 2);
  ctx.fillStyle = C.cream; ctx.fill();
  ctx.restore();

  // Outer thick gold ring
  ctx.strokeStyle = C.gold;
  ctx.lineWidth   = 4.5;
  ctx.beginPath(); ctx.arc(AX, AY, AR + 8, 0, Math.PI * 2); ctx.stroke();

  // Inner hairline ring
  ctx.strokeStyle = C.boxBorder;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.arc(AX, AY, AR + 2, 0, Math.PI * 2); ctx.stroke();

  // Avatar image or initial
  ctx.save();
  ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.clip();
  let avatarLoaded = false;
  if (data.avatarUrl) {
    const img = await loadImg(data.avatarUrl);
    if (img) { ctx.drawImage(img, AX - AR, AY - AR, AR * 2, AR * 2); avatarLoaded = true; }
  }
  if (!avatarLoaded) {
    ctx.fillStyle = '#EDE8D8';
    ctx.fillRect(AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.fillStyle = C.amberDark;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(data.username.charAt(0).toUpperCase(), AX, AY + 2);
  }
  ctx.restore();

  // Name — clear, large
  const nameY = AY + AR + 28;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.dark;
  ctx.font      = 'bold 32px Georgia, "Times New Roman", serif';
  ctx.fillText(data.username, W / 2, nameY);

  // Founding member / tier badge row
  const badgeY = nameY + 20;
  // Founding member (unique identifier — prominent)
  const memberText = data.isFoundingMember && data.foundingMemberNumber
    ? `Founding Member #${data.foundingMemberNumber}`
    : TIER_RANK_LABEL[data.tier] || 'CT Fantasy Player';
  ctx.fillStyle = C.amberLight;
  ctx.font      = 'italic 10px Georgia, "Times New Roman", serif';
  ctx.fillText(memberText, W / 2, badgeY);

  // ── FULL-WIDTH SEPARATOR ──────────────────────────────────────────────
  const sep1 = badgeY + 28;
  ctx.strokeStyle = C.rule;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(36, sep1); ctx.lineTo(W - 36, sep1); ctx.stroke();

  // ── ZONE 3: The Achievement — rank NUMBER dominates ───────────────────
  const achY = sep1 + 52; // baseline of the big number

  // Label above the number (tiny, all-caps, muted)
  ctx.fillStyle    = C.amberLight;
  ctx.font         = '9px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('SEASON RANK', W / 2, sep1 + 20);
  ctx.letterSpacing = '0px';

  // THE number — this is what they share
  const rankStr = data.seasonRank ? `#${data.seasonRank}` : '\u2014';
  ctx.fillStyle = C.amberDark;
  ctx.font      = 'bold 80px Georgia, "Times New Roman", serif';
  ctx.fillText(rankStr, W / 2, achY);

  // Score + multiplier on one supporting line beneath rank
  const supParts: string[] = [`${data.totalScore.toLocaleString()} FS`];
  if (data.effectiveMultiplier > 1) supParts.push(`${data.effectiveMultiplier.toFixed(2)}\u00D7`);
  if (data.allTimeRank) supParts.push(`All-time #${data.allTimeRank}`);
  ctx.fillStyle = C.amberMuted;
  ctx.font      = '10px Georgia, "Times New Roman", serif';
  ctx.fillText(supParts.join('  \u00B7  '), W / 2, achY + 22);

  // ── SEPARATOR ────────────────────────────────────────────────────────
  const sep2 = achY + 46;
  ctx.strokeStyle = C.rule;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(36, sep2); ctx.lineTo(W - 36, sep2); ctx.stroke();

  // ── ZONE 4: Verification (signature + wax seal) ───────────────────────
  const sigY  = sep2 + 52;
  const sealX = W / 2;
  const sealY = sigY - 2;
  const sealR = 26;

  // Left signature line + label
  ctx.strokeStyle = C.boxBorder;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(48, sigY); ctx.lineTo(190, sigY); ctx.stroke();
  ctx.fillStyle = C.amberMuted;
  ctx.font      = '9px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('Tapestry Protocol', 119, sigY + 13);

  // Right signature line + label
  ctx.strokeStyle = C.boxBorder;
  ctx.beginPath(); ctx.moveTo(330, sigY); ctx.lineTo(472, sigY); ctx.stroke();
  ctx.fillText('ct-foresight.xyz', 401, sigY + 13);

  // Wax seal — dashed outer ring
  ctx.save();
  ctx.strokeStyle = C.sealDash;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.arc(sealX, sealY, sealR + 5, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Wax seal — solid gold ring
  ctx.strokeStyle = C.gold;
  ctx.lineWidth   = 2.5;
  ctx.beginPath(); ctx.arc(sealX, sealY, sealR + 1, 0, Math.PI * 2); ctx.stroke();

  // Wax seal — tier-colored fill
  ctx.beginPath(); ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  ctx.fillStyle = tc; ctx.fill();

  ctx.fillStyle    = '#0A0A0F';
  ctx.font         = 'bold 18px Georgia, serif';
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tier.sealText, sealX, sealY);

  // ── Footer ────────────────────────────────────────────────────────────
  const licenseId = `FST-${String(Math.abs(data.totalScore * 7 + (data.seasonRank || 1) * 13)).slice(0, 7).padStart(7, '0')}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = C.amberMuted;
  ctx.font         = '8px "JetBrains Mono", monospace';
  ctx.fillText(`LICENSE #${licenseId}  ·  SOLANA VERIFIED VIA TAPESTRY`, W / 2, H - 26);

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
      const token = localStorage.getItem('authToken');
      if (!token) { setLoading(false); return; }
      const [fsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/fs/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${token}` } })
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
    let t = `Just got certified as a ${rankLabel} on @ForesightGame \n\n`;
    t += `${data.totalScore.toLocaleString()} FS`;
    if (data.seasonRank) t += ` \u00B7 Season #${data.seasonRank}`;
    if (data.effectiveMultiplier > 1) t += `\n${data.effectiveMultiplier.toFixed(2)}\u00D7 multiplier`;
    t += `\n\nVerified on Solana via Tapestry\n#CTForesight #CTFantasy`;
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
      const file = new File([cachedBlob], 'foresight-certificate.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: buildTweetText() }); return; }
        catch { /* cancelled */ }
      }
    }
    downloadBlob(cachedBlob, `foresight-${data?.username || 'certificate'}.png`);
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(buildTweetText())}`, '_blank');
    showToast('Certificate saved! Attach the image to your tweet \uD83D\uDCCE', 'success');
  };

  const handleSave = async () => {
    if (cachedBlob) {
      downloadBlob(cachedBlob, `foresight-${data?.username || 'certificate'}.png`);
      showToast('Certificate saved!', 'success');
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
  const tc      = tierCfg.color;

  // ── DOM preview — certificate ──────────────────────────────────────────
  const memberText = data?.isFoundingMember && data.foundingMemberNumber
    ? `Founding Member #${data.foundingMemberNumber}`
    : TIER_RANK_LABEL[data?.tier || 'bronze'] || 'CT Fantasy Player';
  const rankStr = data?.seasonRank ? `#${data.seasonRank}` : '—';
  const supParts: string[] = [`${(data?.totalScore || 0).toLocaleString()} FS`];
  if ((data?.effectiveMultiplier ?? 1) > 1) supParts.push(`${data!.effectiveMultiplier.toFixed(2)}×`);
  if (data?.allTimeRank) supParts.push(`All-time #${data.allTimeRank}`);
  const licenseId = `FST-${String(Math.abs((data?.totalScore || 0) * 7 + (data?.seasonRank || 1) * 13)).slice(0, 7).padStart(7, '0')}`;

  const preview = (
    <div
      className="w-[300px] rounded-lg overflow-hidden relative"
      style={{
        background: '#F5F1E8',
        border: '4px solid #F59E0B',
        boxShadow: 'inset 0 0 0 1.5px rgba(245,158,11,0.28)',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(160,130,80,0.04) 4px, rgba(160,130,80,0.04) 5px)',
      }}
    >
      {/* Corner ornaments */}
      {[
        { top: 8, left: 8, borderWidth: '2px 0 0 2px' },
        { top: 8, right: 8, borderWidth: '2px 2px 0 0' },
        { bottom: 8, left: 8, borderWidth: '0 0 2px 2px' },
        { bottom: 8, right: 8, borderWidth: '0 2px 2px 0' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: 12, height: 12,
          borderColor: '#F59E0B', borderStyle: 'solid',
          ...s,
        }} />
      ))}

      <div className="relative px-5 pt-5 pb-4 flex flex-col items-center gap-0">

        {/* ── ZONE 1: Brand header ── */}
        <div style={{ textAlign: 'center', width: '100%', marginBottom: 10 }}>
          <div style={{ color: '#92400E', fontSize: 8, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Inter, sans-serif' }}>
            FORESIGHT
          </div>
          <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', margin: '5px 20px 0' }} />
        </div>

        {/* ── ZONE 2: Identity ── */}
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: `4px solid #F59E0B`,
            boxShadow: '0 0 0 1.5px rgba(245,158,11,0.3), 0 3px 12px rgba(0,0,0,0.12)',
            background: '#EDE8D8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {data?.avatarUrl ? (
              <img src={data.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#92400E', fontSize: 32, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                {(data?.username || 'A').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', textAlign: 'center', lineHeight: 1 }}>
          {data?.username || '—'}
        </div>

        {/* Founding member / tier */}
        <div style={{ color: '#A16207', fontSize: 9, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: 5, textAlign: 'center' }}>
          {memberText}
        </div>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', width: '100%', margin: '12px 0 10px' }} />

        {/* ── ZONE 3: Achievement — rank number dominates ── */}
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ color: '#A16207', fontSize: 8, letterSpacing: '2px', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            SEASON RANK
          </div>
          <div style={{ color: '#78350F', fontSize: 64, fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1 }}>
            {rankStr}
          </div>
          <div style={{ color: '#7C5C2E', fontSize: 9, fontFamily: 'Georgia, serif', marginTop: 6 }}>
            {supParts.join('  ·  ')}
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', width: '100%', margin: '12px 0 10px' }} />

        {/* ── ZONE 4: Verification ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', gap: 8 }}>
          {/* Left sig line */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.4)', marginBottom: 4 }} />
            <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'Georgia, serif' }}>Tapestry Protocol</div>
          </div>

          {/* Wax seal */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `2px solid #F59E0B`,
              outline: `1.5px dashed rgba(245,158,11,0.65)`,
              outlineOffset: 3,
              background: tc,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0A0A0F', fontSize: 17, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}>
              {tierCfg.sealText}
            </div>
          </div>

          {/* Right sig line */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.4)', marginBottom: 4 }} />
            <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'Georgia, serif' }}>ct-foresight.xyz</div>
          </div>
        </div>

        {/* License footer */}
        <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'monospace', marginTop: 8, textAlign: 'center' }}>
          LICENSE #{licenseId} · SOLANA VERIFIED
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
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50"
        >
          <Share size={16} />
          Save Image
        </button>
      </div>
      <button
        onClick={handleCopyLink}
        className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        style={{ border: '1px solid #1C1C1E' }}
      >
        {copied
          ? <><Check size={14} className="text-green-400" /><span className="text-green-400">Copied!</span></>
          : <><Copy size={14} />Copy profile link</>}
      </button>
      <p className="text-center text-[11px] text-zinc-700 mt-2 leading-tight">
        On desktop, certificate saves automatically — attach to your tweet
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
            className="absolute -top-10 right-0 text-xs text-zinc-500 hover:text-white transition-colors">
            Close
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
        className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all ${className}`}>
        <Share size={20} />
      </button>
      {show && <ShareableProfileCard onClose={() => setShow(false)} />}
    </>
  );
  return (
    <>
      <button onClick={() => setShow(true)}
        className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 ${className}`}>
        <Share size={18} />Share Certificate
      </button>
      {show && <ShareableProfileCard onClose={() => setShow(false)} />}
    </>
  );
}
