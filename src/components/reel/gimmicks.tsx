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
          style={{ top: top + 8 }}
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
export function ReactionStream({ terms, playing, top, bottom }: { terms: string[]; playing: boolean; top: number; bottom: number }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<{ id: number; e: string; x: number; r: number }[]>([]);
  const id = useRef(0);
  useEffect(() => {
    if (!playing || reduce) return;
    const t = setInterval(() => {
      const n = ++id.current;
      setItems((list) => [...list.slice(-10), { id: n, e: terms.length && n % 3 ? terms[n % terms.length] : REACTIONS[n % REACTIONS.length], x: Math.random() * 8 - 4, r: Math.random() * 16 - 8 }]);
    }, 650);
    return () => clearInterval(t);
  }, [playing, reduce, terms]);
  return (
    <div aria-hidden className="pointer-events-none absolute right-1 z-[15] w-[64px] overflow-hidden" style={{ top, bottom }}>
      <AnimatePresence>
        {items.map((it) => (
          <motion.span
            key={it.id}
            className={`absolute bottom-0 right-1 max-w-[60px] truncate whitespace-nowrap ${it.e.length > 2 ? "bg-thread px-1 py-0.5 font-hook text-[10px] font-extrabold text-[#08110e]" : "text-[24px]"}`}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.4 }}
            animate={{ y: -200, x: it.x, opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 0.9], rotate: it.r }}
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
