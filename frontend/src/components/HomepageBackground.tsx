/**
 * HomepageBackground — Ambient atmosphere layer
 *
 * Adds life to the flat #0A0A0F background:
 * 1. Slow-drifting gold radial gradient (warm spotlight feel)
 * 2. Grain texture overlay for physical depth
 * 3. Edge vignette to frame content
 *
 * All GPU-accelerated, <1% CPU, respects prefers-reduced-motion.
 */

export default function HomepageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Gold ambient glow — single warm light source */}
      <div className="absolute inset-0 animate-ambient-drift">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] sm:w-[800px] sm:h-[800px]"
          style={{
            background: 'radial-gradient(circle, #F59E0B 0%, #D97706 40%, transparent 70%)',
            top: '-10%',
            left: '20%',
          }}
        />
      </div>

      {/* Subtle secondary warm glow — bottom right, even fainter */}
      <div className="absolute inset-0 animate-ambient-drift-reverse">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px] sm:w-[500px] sm:h-[500px]"
          style={{
            background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)',
            bottom: '5%',
            right: '10%',
          }}
        />
      </div>

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: 'url(/grain.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Edge vignette — darker corners to frame content */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
