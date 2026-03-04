/**
 * CursorFollower — "Flux Tracer" custom cursor
 *
 * Directional gold chevron that rotates toward movement + particle trail.
 * On interactive hover: orbital ring + satellites appear.
 * Inverts to dark on gold-background elements for contrast.
 * Hidden on touch devices / reduced motion.
 */

import { useEffect, useRef, useCallback } from 'react';

// --- Tuning ---
const CHEVRON_LERP = 0.2;
const RING_LERP = 0.09;
const PARTICLE_DECAY = 0.025;
const BURST_DECAY = 0.035;
const MAX_PARTICLES = 60;

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  burst?: boolean;
  dark?: boolean;
}

/** Check if an element has a gold/bright background where gold cursor would vanish */
function isGoldSurface(el: Element): boolean {
  const bg = getComputedStyle(el).backgroundColor;
  if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return false;
  // Parse rgb values
  const m = bg.match(/(\d+)/g);
  if (!m) return false;
  const [r, g, b] = m.map(Number);
  // Gold-ish: high red, moderate green, low blue, and bright enough
  return r > 180 && g > 120 && b < 80;
}

export default function CursorFollower() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const sat1Ref = useRef<HTMLDivElement>(null);
  const sat2Ref = useRef<HTMLDivElement>(null);

  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const prev = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const frameCount = useRef(0);
  const hovering = useRef(false);
  const onGold = useRef(false);
  const orbitAngle = useRef(0);
  const animRef = useRef(0);
  const visible = useRef(false);

  const spawnParticle = useCallback((x: number, y: number) => {
    if (particles.current.length >= MAX_PARTICLES) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;top:0;left:0;pointer-events:none;z-index:99;
      width:3px;height:3px;border-radius:50%;background:#F59E0B;
      opacity:0.7;will-change:transform;
    `;
    document.body.appendChild(el);
    particles.current.push({
      el, x, y, life: 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const chevron = chevronRef.current!;
    const ring = ringRef.current!;
    const sat1 = sat1Ref.current!;
    const sat2 = sat2Ref.current!;

    // Hide native cursor — but exclude iframes and third-party modals (Privy, etc.)
    const cursorStyle = document.createElement('style');
    cursorStyle.textContent = `
      html, body, body *:not(iframe):not([id*="privy"]):not([class*="privy"]):not([data-privy]) {
        cursor: none !important;
      }
      iframe, [id*="privy"], [class*="privy"], [data-privy], [id*="privy"] * {
        cursor: auto !important;
      }
    `;
    document.head.appendChild(cursorStyle);

    function show() {
      if (!visible.current) {
        visible.current = true;
        chevron.style.opacity = '1';
      }
    }
    function hide() {
      visible.current = false;
      chevron.style.opacity = '0';
      ring.style.opacity = '0';
      sat1.style.opacity = '0';
      sat2.style.opacity = '0';
    }

    function onMouseMove(e: MouseEvent) {
      target.current = { x: e.clientX, y: e.clientY };
      show();
    }

    function onInteractiveEnter(e: Event) {
      hovering.current = true;
      const el = e.currentTarget as Element;
      const gold = isGoldSurface(el);
      onGold.current = gold;

      chevron.style.borderLeftColor = gold ? '#0A0A0F' : '#FBBF24';
      chevron.style.filter = gold
        ? 'drop-shadow(0 0 8px rgba(0,0,0,0.6))'
        : 'drop-shadow(0 0 10px rgba(245,158,11,1))';

      ring.style.width = '40px';
      ring.style.height = '40px';
      ring.style.borderColor = gold ? 'rgba(10,10,15,0.7)' : 'rgba(245,158,11,0.5)';
      ring.style.opacity = '1';

      const satColor = gold ? 'rgba(10,10,15,0.5)' : 'rgba(245,158,11,0.6)';
      sat1.style.borderColor = satColor;
      sat1.style.width = '8px';
      sat1.style.height = '8px';
      sat1.style.opacity = '1';
      sat2.style.borderColor = gold ? 'rgba(10,10,15,0.4)' : 'rgba(245,158,11,0.45)';
      sat2.style.width = '10px';
      sat2.style.height = '10px';
      sat2.style.opacity = '1';
    }

    function onInteractiveLeave() {
      hovering.current = false;
      onGold.current = false;

      chevron.style.borderLeftColor = '#F59E0B';
      chevron.style.filter = 'drop-shadow(0 0 6px rgba(245,158,11,0.7))';

      ring.style.width = '0';
      ring.style.height = '0';
      ring.style.borderColor = 'rgba(245,158,11,0)';
      ring.style.opacity = '0';

      sat1.style.borderColor = 'rgba(245,158,11,0)';
      sat1.style.opacity = '0';
      sat2.style.borderColor = 'rgba(245,158,11,0)';
      sat2.style.opacity = '0';
    }

    function onMouseDown(e: MouseEvent) {
      const cx = e.clientX;
      const cy = e.clientY;
      const burstColor = onGold.current ? '#1A1A24' : '#FBBF24';
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 / 14) * i;
        const speed = 1.5 + Math.random() * 1.5;
        const el = document.createElement('div');
        el.style.cssText = `
          position:fixed;top:0;left:0;pointer-events:none;z-index:99;
          width:3px;height:3px;border-radius:50%;background:${burstColor};
          opacity:0.9;will-change:transform;
        `;
        document.body.appendChild(el);
        particles.current.push({
          el, x: cx, y: cy, life: 1,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          burst: true,
          dark: onGold.current,
        });
      }
      // Ring pulse
      if (hovering.current) {
        ring.style.transition = 'none';
        ring.style.width = '52px';
        ring.style.height = '52px';
        setTimeout(() => {
          ring.style.transition = 'width 250ms cubic-bezier(0.16,1,0.3,1), height 250ms cubic-bezier(0.16,1,0.3,1), border-color 200ms ease, opacity 200ms ease';
          ring.style.width = '40px';
          ring.style.height = '40px';
        }, 50);
      }
    }

    const bound = new WeakSet<Element>();
    function attachListeners() {
      const els = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
      els.forEach(el => {
        if (bound.has(el)) return;
        bound.add(el);
        el.addEventListener('mouseenter', onInteractiveEnter);
        el.addEventListener('mouseleave', onInteractiveLeave);
      });
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    document.addEventListener('mousedown', onMouseDown);

    attachListeners();
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    // Animation loop
    function animate() {
      const p = pos.current;
      const t = target.current;
      const rp = ringPos.current;

      p.x += (t.x - p.x) * CHEVRON_LERP;
      p.y += (t.y - p.y) * CHEVRON_LERP;
      rp.x += (t.x - rp.x) * RING_LERP;
      rp.y += (t.y - rp.y) * RING_LERP;

      chevron.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;

      // Rotate chevron toward movement
      const dx = t.x - prev.current.x;
      const dy = t.y - prev.current.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        chevron.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
      }
      prev.current = { x: t.x, y: t.y };

      // Ring position
      ring.style.transform = `translate3d(${rp.x}px, ${rp.y}px, 0) translate(-50%, -50%)`;

      // Orbital satellites
      orbitAngle.current += hovering.current ? 0.04 : 0.015;
      const oR = hovering.current ? 22 : 0;
      const a = orbitAngle.current;
      sat1.style.transform = `translate3d(${rp.x + Math.cos(a) * oR}px, ${rp.y + Math.sin(a) * oR}px, 0) translate(-50%, -50%)`;
      sat2.style.transform = `translate3d(${rp.x + Math.cos(a + Math.PI) * oR}px, ${rp.y + Math.sin(a + Math.PI) * oR}px, 0) translate(-50%, -50%)`;

      // Spawn trail particles
      frameCount.current++;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const rate = hovering.current ? 2 : 3;
      if (frameCount.current % rate === 0 && speed > 0.8 && visible.current) {
        spawnParticle(p.x, p.y);
      }

      // Update particles
      particles.current = particles.current.filter(pt => {
        pt.life -= pt.burst ? BURST_DECAY : PARTICLE_DECAY;
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.burst) { pt.vx *= 0.96; pt.vy *= 0.96; }
        if (pt.life <= 0) { pt.el.remove(); return false; }

        pt.el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`;
        pt.el.style.opacity = String(pt.life * (pt.burst ? 0.9 : 0.7));
        const size = (pt.burst ? 3.5 : 3) * pt.life;
        pt.el.style.width = size + 'px';
        pt.el.style.height = size + 'px';

        if (!pt.dark) {
          const r = Math.round(251 - (251 - 146) * (1 - pt.life));
          const g = Math.round(191 - (191 - 64) * (1 - pt.life));
          const b = Math.round(36 - (36 - 14) * (1 - pt.life));
          pt.el.style.background = `rgb(${r},${g},${b})`;
        }
        return true;
      });

      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      document.removeEventListener('mousedown', onMouseDown);
      observer.disconnect();
      cursorStyle.remove();
      // Clean up particles
      particles.current.forEach(p => p.el.remove());
      particles.current = [];
    };
  }, [spawnParticle]);

  return (
    <>
      {/* Chevron (directional arrow) */}
      <div
        ref={chevronRef}
        className="pointer-events-none fixed top-0 left-0 z-[100]"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid #F59E0B',
          borderTop: '4.5px solid transparent',
          borderBottom: '4.5px solid transparent',
          filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.7))',
          opacity: 0,
          willChange: 'transform',
          transition: 'opacity 200ms ease, border-left-color 200ms ease, filter 200ms ease',
        }}
      />

      {/* Orbital ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[99]"
        style={{
          width: 0,
          height: 0,
          borderRadius: '50%',
          border: '1.5px solid rgba(245,158,11,0)',
          opacity: 0,
          willChange: 'transform',
          transition: 'width 250ms cubic-bezier(0.16,1,0.3,1), height 250ms cubic-bezier(0.16,1,0.3,1), border-color 200ms ease, opacity 200ms ease',
        }}
      />

      {/* Satellite 1 */}
      <div
        ref={sat1Ref}
        className="pointer-events-none fixed top-0 left-0 z-[99]"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          border: '1.5px solid rgba(245,158,11,0)',
          opacity: 0,
          willChange: 'transform',
          transition: 'border-color 200ms ease, width 200ms ease, height 200ms ease, opacity 200ms ease',
        }}
      />

      {/* Satellite 2 */}
      <div
        ref={sat2Ref}
        className="pointer-events-none fixed top-0 left-0 z-[99]"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          border: '1.5px solid rgba(245,158,11,0)',
          opacity: 0,
          willChange: 'transform',
          transition: 'border-color 200ms ease, width 200ms ease, height 200ms ease, opacity 200ms ease',
        }}
      />
    </>
  );
}
