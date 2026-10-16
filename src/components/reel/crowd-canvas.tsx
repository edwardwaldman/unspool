"use client";

import { useEffect, useRef } from "react";
import { threadHex } from "./accent";

/**
 * A stadium-like field of tiny dots seen from above (the whole group), with a glowing wave sweeping
 * around it and a highlighted subset lighting up (the sample / who it applies to).
 */
export function CrowdCanvas({ ratio, progress }: { ratio: number; progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const accent = threadHex();
    const base = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#6d7284";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    type Dot = { x: number; y: number; angle: number; picked: boolean; jitter: number };
    let dots: Dot[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cx = w / 2;
      const cy = h / 2;
      const rx = w * 0.46;
      const ry = h * 0.44;
      const rings = 15;
      for (let r = 0; r < rings; r++) {
        const t = 0.45 + (r / rings) * 0.55; // inner field is empty, like the pitch
        const count = Math.round(70 + r * 9);
        for (let k = 0; k < count; k++) {
          const angle = (k / count) * Math.PI * 2 + r * 0.13;
          dots.push({
            x: cx + Math.cos(angle) * rx * t,
            y: cy + Math.sin(angle) * ry * t,
            angle,
            picked: false,
            jitter: Math.random(),
          });
        }
      }
      // Deterministic-ish sample spread around the bowl.
      const target = Math.round(dots.length * ratio);
      const order = dots.map((_, i) => i).sort((a, b) => dots[a].jitter - dots[b].jitter);
      for (let i = 0; i < target; i++) dots[order[i]].picked = true;
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const time = (now - start) / 1000;
      const p = progressRef.current;
      ctx.clearRect(0, 0, w, h);
      const waveAngle = (time * 1.1) % (Math.PI * 2);
      const reveal = Math.min(1, Math.max(0, (p - 0.25) / 0.45));
      for (const d of dots) {
        let diff = Math.abs(((d.angle - waveAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        diff = Math.PI - diff;
        const wave = Math.max(0, 1 - diff / 0.55);
        const lit = d.picked && d.jitter / Math.max(ratio, 0.001) <= reveal * 1.0001;
        const size = 1.2 + wave * 0.9 + (lit ? 0.7 : 0);
        ctx.globalAlpha = lit ? 0.9 : 0.16 + wave * 0.4;
        ctx.fillStyle = lit || wave > 0.5 ? accent : base;
        if (lit) {
          ctx.shadowColor = accent;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ratio]);

  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}
