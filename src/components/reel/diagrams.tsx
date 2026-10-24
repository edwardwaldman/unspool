"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import { compileExpr } from "@/lib/expr";
import type { GraphVisual, Mood, Visual } from "@/lib/schema";

// Full-frame "explainer" visuals (as in hand-made study reels): plotted graphs on a dark grid panel,
// a big equation header, and a big emoji prop. Drawn flat over the whole stage, never in the 3D scene.

export const YELLOW = "#ffd84d";
const PINK = "#ff4f9a";
const RED = "#ff3b4e";
const ORANGE = "#ff9b2f";
const CURVE: Record<string, string> = { cyan: "#25d8ff", pink: "#ff5fb0", yellow: YELLOW, green: "#4dff9a" };

/** Per-beat background: hot pink for hooks, deep navy with teal/magenta glows by default, red-orange for warnings, green for wins. */
export const MOOD_BG: Record<Mood, string> = {
  hot: "radial-gradient(90% 60% at 50% 38%, #ff4f9a 0%, #e83d82 40%, #b8285f 100%)",
  calm: "radial-gradient(60% 40% at 22% 30%, rgba(18,110,130,.55) 0%, transparent 70%), radial-gradient(60% 40% at 80% 72%, rgba(150,30,90,.38) 0%, transparent 70%), linear-gradient(#05070d, #070a14)",
  warn: "radial-gradient(90% 60% at 50% 38%, #ff6a3d 0%, #d63a2a 45%, #7a1612 100%)",
  win: "radial-gradient(90% 60% at 50% 38%, #3fdc8a 0%, #1f9e62 45%, #0b4a2f 100%)",
};

const bold = "font-hook font-extrabold tracking-[-0.01em]";

// ------------------------------------------------------------------ graph

function niceStep(span: number, target = 6) {
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function ticks(lo: number, hi: number) {
  const step = niceStep(hi - lo);
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6));
  return out;
}
const fmt = (v: number) => (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01) ? v.toExponential(0) : String(+v.toFixed(2)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

const W = 360, H = 250, PAD = { l: 26, r: 14, t: 14, b: 22 };

/** Sample a curve densely into SVG path data, breaking at NaN, off-panel blowups, jumps and asymptotes. */
function curvePath(pieces: { f: (x: number) => number; from: number; to: number }[], xr: number[], yr: number[], breaks: number[]) {
  const sx = (x: number) => PAD.l + ((x - xr[0]) / (xr[1] - xr[0])) * (W - PAD.l - PAD.r);
  const sy = (y: number) => PAD.t + (1 - (y - yr[0]) / (yr[1] - yr[0])) * (H - PAD.t - PAD.b);
  const span = yr[1] - yr[0];
  let d = "";
  for (const pc of pieces) {
    const a = Math.max(xr[0], pc.from), b = Math.min(xr[1], pc.to);
    if (!(a < b)) continue;
    const n = 900;
    let pen = false, prev = NaN, prevX = NaN;
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      const y = pc.f(x);
      const crossed = breaks.some((bx) => (prevX - bx) * (x - bx) <= 0 && prevX !== bx && x !== bx);
      if (!Number.isFinite(y) || Math.abs(y - yr[0]) > span * 6 || Math.abs(y - yr[1]) > span * 6 || crossed || (pen && Math.abs(y - prev) > span * 0.9)) {
        pen = false;
        if (Number.isFinite(y) && !crossed && Math.abs(y - yr[0]) <= span * 6 && Math.abs(y - yr[1]) <= span * 6) {
          d += `M${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
          pen = true;
        }
      } else {
        d += `${pen ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
        pen = true;
      }
      prev = y;
      prevX = x;
    }
  }
  return d;
}

export function GraphPanel({ v, progress }: { v: GraphVisual; progress: number }) {
  const reduce = useReducedMotion();
  const clip = `plot${useId().replace(/[^a-z0-9]/gi, "")}`;
  const p = reduce ? 1 : progress;
  const compiled = useMemo(
    () =>
      v.curves.map((c) => ({
        color: CURVE[c.color] ?? CURVE.cyan,
        pieces: (c.pieces.length ? c.pieces : [{ expr: c.expr, from: -1e6, to: 1e6 }])
          .map((pc) => ({ f: compileExpr(pc.expr), from: Math.min(pc.from, pc.to), to: Math.max(pc.from, pc.to) }))
          .filter((pc): pc is { f: (x: number) => number; from: number; to: number } => Boolean(pc.f)),
      })),
    [v.curves],
  );
  // Zoom eases in over 55%–80% of the beat.
  const z = v.zoom.show ? smooth(clamp01((p - 0.55) / 0.25)) : 0;
  const xr = [lerp(v.x_range[0], v.zoom.x_range[0], z), lerp(v.x_range[1], v.zoom.x_range[1], z)];
  const yr = [lerp(v.y_range[0], v.zoom.y_range[0], z), lerp(v.y_range[1], v.zoom.y_range[1], z)];
  const sx = (x: number) => PAD.l + ((x - xr[0]) / (xr[1] - xr[0])) * (W - PAD.l - PAD.r);
  const sy = (y: number) => PAD.t + (1 - (y - yr[0]) / (yr[1] - yr[0])) * (H - PAD.t - PAD.b);
  const breaks = v.asymptotes.filter((a) => a.axis === "x").map((a) => a.at);
  const paths = compiled.map((c) => ({ color: c.color, d: curvePath(c.pieces, xr, yr, breaks) }));
  const draw = smooth(clamp01(p / 0.4));
  const pop = p >= 0.4;
  const ax = Math.min(Math.max(sx(0), PAD.l), W - PAD.r), ay = Math.min(Math.max(sy(0), PAD.t), H - PAD.b);
  const xt = ticks(xr[0], xr[1]), yt = ticks(yr[0], yr[1]);
  const inside = (x: number, y: number) => x >= xr[0] && x <= xr[1] && y >= yr[0] && y <= yr[1];
  const hl = v.highlight;

  return (
    <div className="flex w-full flex-col items-stretch px-1" data-testid="graph">
      {v.title && <div className={`mb-1.5 pl-1 text-[15px] ${bold}`} style={{ color: YELLOW }}>{v.title}</div>}
      <div className="relative w-full overflow-hidden rounded-[6px] border border-white/10" style={{ background: "linear-gradient(#1c1a3c, #17162f)", boxShadow: "0 18px 40px rgba(0,0,0,.45)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={v.title || "graph"}>
          <defs>
            <clipPath id={clip}><rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} /></clipPath>
          </defs>
          {/* grid */}
          {xt.map((t) => <line key={`gx${t}`} x1={sx(t)} x2={sx(t)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,.07)" strokeWidth={1} />)}
          {yt.map((t) => <line key={`gy${t}`} y1={sy(t)} y2={sy(t)} x1={PAD.l} x2={W - PAD.r} stroke="rgba(255,255,255,.07)" strokeWidth={1} />)}
          {/* axes */}
          <line x1={PAD.l} x2={W - PAD.r} y1={ay} y2={ay} stroke="rgba(255,255,255,.55)" strokeWidth={1.2} />
          <line x1={ax} x2={ax} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,.55)" strokeWidth={1.2} />
          {xt.filter((t) => t !== 0).map((t) => <text key={`tx${t}`} x={sx(t)} y={Math.min(ay + 11, H - 4)} fontSize={7.5} fill="rgba(255,255,255,.6)" textAnchor="middle">{fmt(t)}</text>)}
          {yt.filter((t) => t !== 0).map((t) => <text key={`ty${t}`} x={ax - 4} y={sy(t) + 2.5} fontSize={7.5} fill="rgba(255,255,255,.6)" textAnchor="end">{fmt(t)}</text>)}
          <g clipPath={`url(#${clip})`}>
            {/* bounds (dashed orange) */}
            {v.bounds.map((b, i) => (
              <g key={`b${i}`}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(b.y)} y2={sy(b.y)} stroke={ORANGE} strokeWidth={1.4} strokeDasharray="5 4" opacity={draw > 0.2 ? 1 : 0} style={{ transition: "opacity .4s" }} />
                {b.label && <text x={W - PAD.r - 3} y={sy(b.y) - 4} fontSize={9} fontWeight={700} fill={ORANGE} textAnchor="end">{b.label}</text>}
              </g>
            ))}
            {/* asymptotes */}
            {v.asymptotes.map((a, i) =>
              a.axis === "x" ? (
                <g key={`a${i}`}>
                  <line x1={sx(a.at)} x2={sx(a.at)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,.35)" strokeWidth={1} strokeDasharray="3 4" />
                  {a.label && <text x={sx(a.at) + 4} y={PAD.t + 10} fontSize={8.5} fontWeight={700} fill={RED}>{a.label}</text>}
                </g>
              ) : (
                <g key={`a${i}`}>
                  <line y1={sy(a.at)} y2={sy(a.at)} x1={PAD.l} x2={W - PAD.r} stroke="rgba(255,255,255,.35)" strokeWidth={1} strokeDasharray="3 4" />
                  {a.label && <text x={PAD.l + 4} y={sy(a.at) - 4} fontSize={8.5} fontWeight={700} fill={RED}>{a.label}</text>}
                </g>
              ),
            )}
            {/* curves, drawing in */}
            {paths.map((c, i) => (
              <path key={`c${i}`} d={c.d} pathLength={1} fill="none" stroke={c.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={draw > 0.01 ? 1 : 0} style={{ filter: `drop-shadow(0 0 3px ${c.color})` }} />
            ))}
            {/* points */}
            {v.points.filter((pt) => inside(pt.x, pt.y)).map((pt, i) => (
              <g key={`p${i}`} opacity={draw >= 0.95 ? 1 : 0} style={{ transition: "opacity .3s" }}>
                <circle cx={sx(pt.x)} cy={sy(pt.y)} r={3.4} fill={pt.open ? "#1b1a3a" : CURVE[v.curves[0]?.color ?? "cyan"] ?? CURVE.cyan} stroke={CURVE[v.curves[0]?.color ?? "cyan"] ?? CURVE.cyan} strokeWidth={1.6} />
                {pt.label && <text x={sx(pt.x) + 6} y={sy(pt.y) - 5} fontSize={8.5} fontWeight={700} fill="#fff">{pt.label}</text>}
              </g>
            ))}
            {/* highlight: a red circle popping on the key point */}
            {hl.show && inside(hl.x, hl.y) && (
              <motion.circle
                cx={sx(hl.x)}
                cy={sy(hl.y)}
                fill="none"
                stroke={RED}
                strokeWidth={2.2}
                initial={false}
                animate={pop ? { r: 15, opacity: 1 } : { r: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 14 }}
              />
            )}
          </g>
        </svg>
      </div>
      {hl.show && hl.label && (
        <motion.div initial={false} animate={pop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.9 }} className={`mt-3 text-center text-[17px] ${bold}`} style={{ color: RED, textShadow: "0 2px 6px rgba(0,0,0,.6)" }}>
          {hl.label}
        </motion.div>
      )}
      {v.zoom.show && v.zoom.label && (
        <motion.div initial={false} animate={{ opacity: z > 0.05 ? 1 : 0 }} className={`mt-2 text-center text-[14px] ${bold}`} style={{ color: YELLOW }}>
          {v.zoom.label}
        </motion.div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ equation header

export function EquationHeader({ v, progress }: { v: Extract<Visual, { type: "equation" }>; progress: number }) {
  const show = (at: number) => ({ initial: false as const, animate: progress >= at ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }, transition: { duration: 0.35 } });
  return (
    <div className="flex w-full flex-col items-center px-4 text-center" data-testid="equation">
      {v.label && <motion.div {...show(0)} className={`text-[13px] uppercase tracking-[0.06em] ${bold}`} style={{ color: PINK }}>{v.label}</motion.div>}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className={`mt-3 leading-[1.1] ${bold}`}
        style={{ color: "#2fd6ff", fontSize: v.expr.length > 14 ? "min(34px, 8.5cqw)" : "min(44px, 11cqw)", textShadow: "0 0 18px rgba(47,214,255,.35)" }}
      >
        {v.expr}
      </motion.div>
      {v.note && <motion.div {...show(0.3)} className={`mt-6 max-w-[88%] text-[14px] uppercase leading-tight ${bold} text-white`}>{v.note}</motion.div>}
      {v.ask && <motion.div {...show(0.55)} className={`mt-6 text-[18px] ${bold}`} style={{ color: YELLOW }}>{v.ask}</motion.div>}
    </div>
  );
}

// ------------------------------------------------------------------ emoji prop

const MOTION = {
  vibrate: { x: [0, -5, 5, -5, 5, 0], rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.35, repeat: Infinity, repeatDelay: 0.25 } },
  bounce: { y: [0, -26, 0], transition: { duration: 0.8, repeat: Infinity, ease: "easeOut" as const } },
  spin: { rotate: [0, 360], transition: { duration: 2.4, repeat: Infinity, ease: "linear" as const } },
  pulse: { scale: [1, 1.12, 1], transition: { duration: 1, repeat: Infinity } },
};

export function EmojiProp({ v, progress }: { v: Extract<Visual, { type: "emoji" }>; progress: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex w-full flex-col items-center px-4 text-center" data-testid="emoji">
      {v.title && <div className={`leading-none text-white ${bold}`} style={{ fontSize: "min(40px, 10cqw)", textShadow: "0 3px 10px rgba(0,0,0,.25)" }}>{v.title}</div>}
      <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="relative mt-8">
        <motion.div animate={reduce ? undefined : MOTION[v.motion] ?? MOTION.pulse} className="leading-none" style={{ fontSize: "min(110px, 26cqw)", filter: "drop-shadow(0 10px 18px rgba(0,0,0,.35))" }}>
          {v.emoji}
        </motion.div>
        {v.motion === "vibrate" && !reduce && (
          <>
            <span aria-hidden className="absolute -left-6 top-1/2 -translate-y-1/2 text-[40px] font-bold text-white/70">(</span>
            <span aria-hidden className="absolute -right-6 top-1/2 -translate-y-1/2 text-[40px] font-bold text-white/70">)</span>
          </>
        )}
      </motion.div>
      {v.caption && (
        <motion.div initial={false} animate={progress >= 0.35 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} className={`mt-8 text-[20px] ${bold}`} style={{ color: YELLOW }}>
          {v.caption}
        </motion.div>
      )}
    </div>
  );
}

export function DiagramStage({ visual, progress }: { visual: Visual; progress: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden [container-type:inline-size]">
      {visual.type === "graph" ? <GraphPanel v={visual} progress={progress} /> : visual.type === "equation" ? <EquationHeader v={visual} progress={progress} /> : visual.type === "emoji" ? <EmojiProp v={visual} progress={progress} /> : null}
    </div>
  );
}
