"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Attention-grabbing extras layered over a playing reel: a white flash
// and "+XP" pop on every new beat, and a live stream of floating reactions.

const REACTIONS = ["🔥", "🤯", "💡", "🧠"];

/** A quick white flash + "+10 XP" stamp each time the reel moves to a new beat. */
export function BeatPop({ seg, top }: { seg: number; top: number }) {
  const reduce = useReducedMotion();
  if (reduce || seg === 0) return null;
  return (
    <>
      <AnimatePresence>
        <motion.div
          key={`flash-${seg}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[25] bg-white"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        />
      </AnimatePresence>
      <AnimatePresence>
        <motion.div
          key={`xp-${seg}`}
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 bg-thread px-3 py-1 font-hook text-[18px] font-extrabold text-[#08110e]"
          style={{ top: top + 120 }}
          initial={{ scale: 0.3, rotate: -14, opacity: 0, y: 0 }}
          animate={{ scale: [0.3, 1.25, 1], rotate: [-14, 6, -3], opacity: [0, 1, 1, 0], y: [0, 0, -40] }}
          transition={{ duration: 1.3, times: [0, 0.25, 1] }}
        >
          +10 XP
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/** The reel's own key terms (plus the odd emoji) floating up the right side, like a live stream. */
export function ReactionStream({ terms, playing, bottom }: { terms: string[]; playing: boolean; bottom: number }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<{ id: number; e: string; x: number; r: number }[]>([]);
  const id = useRef(0);
  useEffect(() => {
    if (!playing || reduce) return;
    const t = setInterval(() => {
      const n = ++id.current;
      setItems((list) => [...list.slice(-10), { id: n, e: terms.length && n % 3 ? terms[n % terms.length] : REACTIONS[n % REACTIONS.length], x: Math.random() * 30 - 15, r: Math.random() * 40 - 20 }]);
    }, 650);
    return () => clearInterval(t);
  }, [playing, reduce, terms]);
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 z-[15] w-[50px]" style={{ bottom, height: 260 }}>
      <AnimatePresence>
        {items.map((it) => (
          <motion.span
            key={it.id}
            className={`absolute bottom-0 right-0 whitespace-nowrap ${it.e.length > 2 ? "bg-thread px-1.5 py-0.5 font-hook text-[13px] font-extrabold text-[#08110e]" : "text-[24px]"}`}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.4 }}
            animate={{ y: -240, x: it.x, opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 0.9], rotate: it.r }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.6, ease: "easeOut" }}
            onAnimationComplete={() => setItems((l) => l.filter((x) => x.id !== it.id))}
          >
            {it.e}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Double-tap anywhere: a big heart bursts where you tapped. */
export function useDoubleTapHeart() {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const last = useRef(0);
  const onTap = (e: React.MouseEvent<HTMLElement>) => {
    const now = Date.now();
    const double = now - last.current < 300;
    last.current = now;
    if (!double) return false;
    const box = e.currentTarget.getBoundingClientRect();
    setHearts((h) => [...h, { id: now, x: e.clientX - box.left, y: e.clientY - box.top }]);
    return true;
  };
  const layer = (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            className="absolute text-[90px] leading-none"
            style={{ left: h.x - 45, top: h.y - 45 }}
            initial={{ scale: 0, rotate: -20, opacity: 1 }}
            animate={{ scale: [0, 1.3, 1], rotate: [-20, 10, 0], opacity: [1, 1, 0], y: [0, 0, -80] }}
            transition={{ duration: 1, times: [0, 0.3, 1] }}
            onAnimationComplete={() => setHearts((l) => l.filter((x) => x.id !== h.id))}
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
  return { onTap, layer };
}

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, "0");

/**
 * Camera-viewfinder HUD, like a slow-mo macro shot: corner brackets, a REC timecode, a "watching" timer,
 * and a frames-to-payoff countdown that ticks down to 000 (in the accent) on the reel's last beat.
 */
export function ViewfinderHud({ playing, progress, top, bottom }: { playing: boolean; progress: number; top: number; bottom: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - t * 1000;
    const id = setInterval(() => setT((performance.now() - start) / 1000), 1000 / 30);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  const left = Math.max(0, Math.round((1 - progress) * 240));
  const corner = "absolute h-5 w-5 border-white/70";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-3 z-[12] font-mono text-white" style={{ top: top + 8, bottom: bottom + 8 }}>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
      <div className="absolute left-6 top-1 flex items-center gap-1.5 text-[9px] tracking-[0.12em] text-white/80">
        <motion.span className="h-1.5 w-1.5 rounded-full bg-[#ff4d3d]" animate={{ opacity: playing ? [1, 0.2, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }} />
        REC {pad(t / 3600)}:{pad((t / 60) % 60)}:{pad(t % 60)}:{pad((t * 30) % 30)}
      </div>
      <div className="absolute right-6 top-1 flex items-center gap-1 border border-white/25 bg-black/40 px-1.5 py-[1px] text-[9px] text-white/85">
        <span className="h-1.5 w-1.5 rounded-full bg-thread" /> watching {t.toFixed(1)}s
      </div>
      <div className="absolute right-6 top-6 text-right">
        <div className="text-[8px] tracking-[0.18em] text-white/60">FRAMES TO PAYOFF</div>
        <div className="text-[22px] font-bold leading-none tabular-nums" style={{ color: left < 20 ? "var(--thread)" : "#fff" }}>
          {pad(left, 3)}
        </div>
      </div>
    </div>
  );
}

/** A documentary callout pinned onto the graphic: an uppercase tag with a leader line down to a dot. */
export function Callout({ term, beat, top, bottom }: { term: string | undefined; beat: number; top: number; bottom: number }) {
  if (!term) return null;
  const left = [18, 46, 28, 54][beat % 4];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[14]" style={{ top, bottom }}>
      <AnimatePresence mode="wait">
        <motion.div key={`${beat}-${term}`} className="absolute flex flex-col items-start" style={{ left: `${left}%`, top: "12%" }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <motion.span
            className="whitespace-nowrap rounded-[3px] bg-black/75 px-2 py-[3px] font-hook text-[11px] font-extrabold uppercase tracking-[0.06em] text-white"
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.15 }}
          >
            {term}
          </motion.span>
          <motion.span className="ml-3 w-px origin-top bg-[#ff4d3d]" initial={{ height: 0 }} animate={{ height: 46 }} transition={{ delay: 0.3, duration: 0.25 }} />
          <motion.span className="-mt-[3px] ml-[9px] h-[7px] w-[7px] rounded-full bg-[#ff4d3d]" initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ delay: 0.55, duration: 0.3 }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Context chip in the top-left, like a documentary location card: "AP STATS · PART 3". */
export function ContextChip({ text, top }: { text: string; top: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute left-6 z-[13] flex items-center gap-1.5 bg-black/70 px-2 py-[3px] font-hook text-[10px] font-extrabold uppercase tracking-[0.08em] text-white" style={{ top: top + 30 }}>
      <span className="h-3 w-[2px] bg-thread" /> {text}
    </div>
  );
}
