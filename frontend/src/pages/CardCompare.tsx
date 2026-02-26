/**
 * Card Design Comparison — pick your profile share card style
 * Route: /card-compare
 */

const DEMO = {
  username: 'Hemjay',
  subtitle: 'Founding Member #18',
  score: '1,151',
  rank: '#2',
  tier: 'SILVER',
  tierColor: '#D1D5DB',
  mult: '1.58×',
  allTime: 'All-time #8',
  week: '+1,151 this week',
};

// ─── Card 1: The Field (current) ───────────────────────────────────────────

function CardField() {
  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        width: 240,
        background: 'linear-gradient(to bottom, rgba(6,78,59,0.28) 0%, rgba(17,24,39,0.32) 30%, #09090B 58%)',
        border: '1px solid #1C1C1E',
      }}
    >
      {/* Pitch SVG — subtle center circle */}
      <svg className="absolute" style={{ top: 0, right: 0, width: 170, height: 160, pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 170 160">
        <circle cx="110" cy="76" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="110" cy="76" r="2.5" fill="rgba(255,255,255,0.06)" />
      </svg>
      {/* Diagonal trajectory */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <line x1="18" y1="300" x2="230" y2="30" stroke="rgba(245,158,11,0.09)" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      {/* Gold bar */}
      <div style={{ height: 3, background: 'linear-gradient(to right, #F59E0B, #FBBF24, #F59E0B)' }} />

      <div className="relative px-4 pt-2.5 pb-4">
        {/* Brand */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>⚡ FORESIGHT</span>
          <span style={{ color: '#3F3F46', fontSize: 8 }}>ct-foresight.xyz</span>
        </div>

        {/* Split: name left, avatar right */}
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1 pt-0.5">
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{DEMO.username}</div>
            <div style={{ color: '#71717A', fontSize: 9, marginTop: 2, marginBottom: 8 }}>{DEMO.subtitle}</div>
            {/* Tier badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              background: 'rgba(209,213,219,0.08)',
              border: '1px solid rgba(209,213,219,0.3)',
              color: '#D1D5DB', fontSize: 9, fontWeight: 700,
            }}>
              ★ {DEMO.tier}
            </span>
          </div>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              boxShadow: `0 0 16px ${DEMO.tierColor}44, 0 0 32px ${DEMO.tierColor}22`,
            }} />
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              border: `2.5px solid ${DEMO.tierColor}EE`,
              background: `radial-gradient(circle, ${DEMO.tierColor}40, ${DEMO.tierColor}15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: DEMO.tierColor, fontSize: 28, fontWeight: 700,
            }}>H</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1C1C1E', marginBottom: 12 }} />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center' }}>
          <div style={{ paddingRight: 12, borderRight: '1px solid #1C1C1E' }}>
            <div style={{ color: '#F59E0B', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{DEMO.score}</div>
            <div style={{ color: '#3F3F46', fontSize: 7, letterSpacing: 2, marginTop: 4 }}>SCORE</div>
          </div>
          <div style={{ paddingLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{DEMO.rank}</div>
            <div style={{ color: '#3F3F46', fontSize: 7, letterSpacing: 2, marginTop: 4 }}>SEASON</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#27272A', fontSize: 8, marginTop: 6 }}>{DEMO.allTime} · {DEMO.week}</div>

        {/* Footer */}
        <div style={{ color: '#27272A', fontSize: 8, marginTop: 12 }}>Tapestry · Solana verified</div>
      </div>
    </div>
  );
}

// ─── Card 2: The Badge ──────────────────────────────────────────────────────

function CardBadge() {
  return (
    <div
      style={{
        width: 240,
        background: '#0A1628',
        border: '2px solid #F59E0B',
        borderRadius: '10px 10px 18px 18px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Inner bevel border */}
      <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(245,158,11,0.2)', borderRadius: '7px 7px 14px 14px', pointerEvents: 'none' }} />

      {/* Gold top bar */}
      <div style={{ height: 3, background: 'linear-gradient(to right, #F59E0B, #FBBF24, #F59E0B)' }} />

      {/* Agency header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(245,158,11,0.15)', textAlign: 'center' }}>
        <div style={{ color: '#F59E0B', fontSize: 8, fontWeight: 700, letterSpacing: 3, fontFamily: 'monospace' }}>
          FORESIGHT INTELLIGENCE DIVISION
        </div>
        <div style={{ color: '#3A3A5A', fontSize: 7, fontFamily: 'monospace', marginTop: 2, letterSpacing: 1 }}>
          CRYPTO TWITTER ANALYST CREDENTIAL
        </div>
      </div>

      {/* Photo + data grid */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 12px 8px' }}>
        {/* Square photo (Polaroid style) */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 68, height: 74,
            border: '1px solid rgba(245,158,11,0.5)',
            background: '#0F1F38',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 2,
          }}>
            <div style={{ height: 56, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `radial-gradient(circle, ${DEMO.tierColor}40, ${DEMO.tierColor}15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: DEMO.tierColor, fontSize: 20, fontWeight: 700,
              }}>H</div>
            </div>
            {/* Polaroid strip */}
            <div style={{ background: '#F5F5F0', width: '100%', padding: '2px 4px', textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 6, fontFamily: 'monospace' }}>FST-0042117</div>
            </div>
          </div>
        </div>

        {/* Monospace data fields */}
        <div style={{ flex: 1 }}>
          {[
            ['NAME', DEMO.username.toUpperCase()],
            ['TIER', `★ ${DEMO.tier}`],
            ['SCORE', DEMO.score],
            ['SEASON', DEMO.rank],
            ['MULT', DEMO.mult],
            ['STATUS', 'VERIFIED'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <span style={{ color: '#3A3A5A', fontFamily: 'monospace', fontSize: 8, width: 44, flexShrink: 0 }}>
                {label}:
              </span>
              <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: 8, fontWeight: label === 'SEASON' || label === 'SCORE' ? 700 : 400 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hologram strip */}
      <div style={{
        height: 14,
        background: 'linear-gradient(to right, rgba(255,0,127,0.12), rgba(0,127,255,0.12), rgba(0,255,127,0.10), rgba(255,200,0,0.12), rgba(255,0,127,0.10))',
        borderTop: '1px solid rgba(245,158,11,0.15)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        margin: '0 12px',
      }} />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px 10px' }}>
        <span style={{ color: '#1E2A3A', fontFamily: 'monospace', fontSize: 7 }}>TAPESTRY · SOLANA VERIFIED</span>
        <span style={{ color: 'rgba(245,158,11,0.4)', fontSize: 8 }}>⚡</span>
      </div>
    </div>
  );
}

// ─── Card 3: The Certificate ────────────────────────────────────────────────

function CardCertificate() {
  return (
    <div
      style={{
        width: 240,
        background: '#F5F1E8',
        borderRadius: 10,
        border: '5px solid #F59E0B',
        boxShadow: 'inset 0 0 0 2px rgba(245,158,11,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Paper texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 4px)',
      }} />

      {/* Corner ornaments */}
      {[
        { top: 8, left: 8, borderWidth: '2px 0 0 2px' },
        { top: 8, right: 8, borderWidth: '2px 2px 0 0' },
        { bottom: 8, left: 8, borderWidth: '0 0 2px 2px' },
        { bottom: 8, right: 8, borderWidth: '0 2px 2px 0' },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', width: 14, height: 14,
          borderColor: 'rgba(245,158,11,0.5)',
          borderStyle: 'solid',
          ...pos,
        }} />
      ))}

      <div style={{ padding: '14px 14px 12px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Zone 1: Brand header — minimal */}
        <div style={{ textAlign: 'center', width: '100%', marginBottom: 10 }}>
          <div style={{ color: '#92400E', fontSize: 8, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Inter, sans-serif' }}>
            FORESIGHT
          </div>
          <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', margin: '5px 16px 0' }} />
        </div>

        {/* Zone 2: Avatar */}
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          border: '3.5px solid #F59E0B',
          boxShadow: '0 0 0 1px rgba(245,158,11,0.3), 0 3px 10px rgba(0,0,0,0.1)',
          background: 'radial-gradient(circle, rgba(209,213,219,0.3), rgba(209,213,219,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#92400E', fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif',
          marginBottom: 8,
        }}>H</div>

        {/* Name */}
        <div style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', textAlign: 'center', lineHeight: 1 }}>
          {DEMO.username}
        </div>

        {/* Founding member italic */}
        <div style={{ color: '#A16207', fontSize: 8, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: 4, textAlign: 'center' }}>
          {DEMO.subtitle}
        </div>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', width: '100%', margin: '10px 0 8px' }} />

        {/* Zone 3: THE number — dominates */}
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ color: '#A16207', fontSize: 7, letterSpacing: '2px', fontFamily: 'Georgia, serif', marginBottom: 3 }}>
            SEASON RANK
          </div>
          <div style={{ color: '#92400E', fontSize: 56, fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1 }}>
            {DEMO.rank}
          </div>
          <div style={{ color: '#7C5C2E', fontSize: 8, fontFamily: 'Georgia, serif', marginTop: 4 }}>
            {DEMO.score} FS  ·  {DEMO.mult}  ·  {DEMO.allTime}
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.45)', width: '100%', margin: '10px 0 8px' }} />

        {/* Zone 4: Signature + wax seal */}
        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', gap: 6 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.4)', marginBottom: 3 }} />
            <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'Georgia, serif' }}>Tapestry Protocol</div>
          </div>

          {/* Wax seal */}
          <div style={{
            flexShrink: 0,
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid #F59E0B',
            outline: '1.5px dashed rgba(245,158,11,0.55)',
            outlineOffset: 3,
            background: DEMO.tierColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0A0A0F', fontSize: 16, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>★</div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '0.5px', background: 'rgba(245,158,11,0.4)', marginBottom: 3 }} />
            <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'Georgia, serif' }}>ct-foresight.xyz</div>
          </div>
        </div>

        {/* License */}
        <div style={{ color: '#7C5C2E', fontSize: 7, fontFamily: 'monospace', marginTop: 7, textAlign: 'center' }}>
          LICENSE #FST-0042117 · SOLANA VERIFIED
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CardCompare() {
  const cards = [
    {
      id: 'field',
      label: 'The Field',
      description: 'Off-center composition, pitch texture, diagonal trajectory line. Sports card DNA.',
      component: <CardField />,
      tag: 'Current',
    },
    {
      id: 'badge',
      label: 'The Badge',
      description: 'FBI/Agency credential. Monospace data grid, Polaroid photo, hologram strip. CT spy humor.',
      component: <CardBadge />,
      tag: 'Radical',
    },
    {
      id: 'certificate',
      label: 'The Certificate',
      description: 'Vintage parchment diploma. Cream background pops on dark Twitter feeds. Most human touch.',
      component: <CardCertificate />,
      tag: 'Radical',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-zinc-600 tracking-widest uppercase mb-1">Profile Card Design</div>
          <h1 className="text-2xl font-bold text-white">Pick your style</h1>
          <p className="text-zinc-500 text-sm mt-1">3 directions — pick 1, we'll make it the real card</p>
        </div>

        {/* Cards grid — horizontal scroll on mobile, 3 col on desktop */}
        <div
          className="flex gap-6 overflow-x-auto pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Card render */}
              {card.component}

              {/* Label */}
              <div className="mt-4" style={{ width: 240 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">{card.label}</span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                    style={card.tag === 'Current'
                      ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }
                      : { background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}
                  >
                    {card.tag}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-10 p-4 rounded-xl" style={{ background: '#0F0F14', border: '1px solid #1C1C1E' }}>
          <p className="text-zinc-400 text-sm">
            Look at all 3 and tell me which one you want. I'll implement it as the real share card with full canvas PNG generation, real avatar, and correct data.
          </p>
        </div>
      </div>
    </div>
  );
}
