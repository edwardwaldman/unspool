"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLaunching } from "./upload-store";

const STEPS = ["Reading it", "Finding the key ideas", "Planning your reels", "Writing your first reel"];

/**
 * The card in the middle of the screen the moment someone starts an unspool: the spool spins and it works through
 * what it's doing, until the real loading screen (the feed) takes over.
 */
export function LaunchCard() {
  const launch = useLaunching();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!launch) return;
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 1100);
    return () => {
      clearInterval(t);
      setStep(0);
    };
  }, [launch]);

  return (
    <AnimatePresence>
      {launch && (
        <motion.div
          key="launch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-6 backdrop-blur-[3px]"
          role="status"
          aria-live="polite"
          data-testid="launch-card"
        >
          <motion.div
            initial={{ scale: 0.85, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="w-full max-w-[340px] border border-line bg-surface px-6 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            {/* a spool unwinding */}
            <div className="relative mx-auto h-16 w-16">
              <motion.span
                className="absolute inset-0 rounded-full border-[5px] border-thread/25 border-t-thread"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              <span className="absolute inset-[22px] rounded-full bg-thread" />
            </div>
            <div className="mt-5 font-display text-[22px] leading-tight text-ink">Unspooling</div>
            <div className="mt-1 truncate text-[14px] text-muted">{launch.title}</div>
            <div className="mt-4 h-5 text-[14.5px] font-semibold text-thread">
              <AnimatePresence mode="wait">
                <motion.span key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="inline-block">
                  {STEPS[step]}…
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
