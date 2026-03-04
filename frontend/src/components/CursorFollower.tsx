/**
 * CursorFollower — Trailing ring that follows the cursor with spring delay
 *
 * A subtle gold ring that magnetically follows the real cursor.
 * Scales up on interactive elements. Hidden on touch devices.
 */

import { useEffect, useRef } from 'react';

const RING_SIZE = 28;
const LERP_SPEED = 0.13;

export default function CursorFollower() {
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const visible = useRef(false);
  const hovering = useRef(false);
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Detect touch device or reduced motion — bail
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ring = ringRef.current;
    if (!ring) return;

    function onMouseMove(e: MouseEvent) {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        ring!.style.opacity = '1';
      }
    }

    function onMouseLeaveWindow() {
      visible.current = false;
      ring!.style.opacity = '0';
    }

    function onMouseEnterWindow() {
      visible.current = true;
      ring!.style.opacity = '1';
    }

    function onInteractiveEnter() {
      hovering.current = true;
      ring!.style.setProperty('--ring-scale', '1.4');
      ring!.style.setProperty('--ring-opacity', '0.5');
    }

    function onInteractiveLeave() {
      hovering.current = false;
      ring!.style.setProperty('--ring-scale', '1');
      ring!.style.setProperty('--ring-opacity', '0.3');
    }

    function attachListeners() {
      const els = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
      els.forEach(el => {
        el.addEventListener('mouseenter', onInteractiveEnter);
        el.addEventListener('mouseleave', onInteractiveLeave);
      });
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    document.addEventListener('mouseenter', onMouseEnterWindow);

    attachListeners();
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    // Animation loop
    function animate() {
      pos.current.x += (target.current.x - pos.current.x) * LERP_SPEED;
      pos.current.y += (target.current.y - pos.current.y) * LERP_SPEED;

      const half = RING_SIZE / 2;
      ring!.style.transform = `translate3d(${pos.current.x - half}px, ${pos.current.y - half}px, 0)`;

      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      document.removeEventListener('mouseenter', onMouseEnterWindow);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed top-0 left-0 z-[100]"
      style={{
        width: RING_SIZE,
        height: RING_SIZE,
        opacity: 0,
        transition: 'opacity 300ms ease',
        willChange: 'transform',
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          border: '1.5px solid rgba(245, 158, 11, var(--ring-opacity, 0.3))',
          transform: 'scale(var(--ring-scale, 1))',
          transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease',
        }}
      />
    </div>
  );
}
