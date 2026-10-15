"use client";

import { useEffect, useRef } from "react";

/**
 * The reel's backdrop: a slow field of glowing dots and faint connecting lines on deep navy,
 * tinted with the reel's accent. `pulse` changes (e.g. per beat) send a soft ripple through it.
 */
export function ParticleField({ accent, active, pulse }: { accent: string; active: boolean; pulse: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef({ value: pulse, at: 0 });

  useEffect(() => {
    if (pulseRef.current.value !== pulse) pulseRef.current = { value: pulse, at: performance.now() };
  }, [pulse]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; hot: boolean };
    let parts: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 4200);
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12 - 0.04,
        r: Math.random() * 1.3 + 0.35,
        a: Math.random() * 0.5 + 0.15,
        hot: Math.random() < 0.12,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const since = (now - pulseRef.current.at) / 1000;
      const ripple = pulseRef.current.at ? since * Math.max(w, h) * 0.9 : -1;
      const cx = w / 2;
      const cy = h * 0.58;

      // Faint connecting lines between near "hot" particles.
      ctx.lineWidth = 0.6;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        if (!a.hot) continue;
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          if (!b.hot) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (1 - Math.sqrt(d2) / 110) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of parts) {
        if (active) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
          if (p.y < -5) p.y = h + 5;
          if (p.y > h + 5) p.y = -5;
        }
        let boost = 0;
        if (ripple >= 0 && since < 1.6) {
          const d = Math.hypot(p.x - cx, p.y - cy);
          const band = Math.abs(d - ripple);
          if (band < 40) boost = (1 - band / 40) * (1 - since / 1.6);
        }
        ctx.globalAlpha = Math.min(1, p.a + boost * 0.8);
        ctx.fillStyle = p.hot || boost > 0.2 ? accent : "#9fb0d8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + boost * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (active) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [accent, active]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
