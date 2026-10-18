"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

// Small extras layered over a playing reel: a white flash on every new beat, and double-tap hearts.

/** A quick white flash each time the reel moves to a new beat. */
export function BeatPop({ seg }: { seg: number }) {
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
    </>
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

