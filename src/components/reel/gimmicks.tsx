"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Attention-grabbing extras layered over a playing reel: a white flash
// and "+XP" pop on every new beat, a running streak counter, and a live stream of floating reactions.

const REACTIONS = ["🔥", "🤯", "💡", "🧠"];

/** A quick white flash + "+10 XP" stamp + streak chip each time the reel moves to a new beat. */
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
      <motion.div
        key={`streak-${seg}`}
        aria-hidden
        className="pointer-events-none absolute right-3 z-30 flex items-center gap-1 border border-white/30 bg-black/50 px-2 py-1 font-hook text-[13px] font-extrabold text-white"
        style={{ top: top + 18 }}
        initial={{ scale: 1.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
      >
        🔥 {seg}x streak
      </motion.div>
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
