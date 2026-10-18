"use client";

import { FileText, Heart, MessageCircle, Send, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Step = readonly [title: string, body: string];

const STEP_MS = 3600;
const CHIPS = ["definition", "key number", "deadline", "rule"];
const REELS = [
  { hook: "The one number your boss will ask about.", color: "#d3f05a" },
  { hook: "Miss this deadline and it costs you.", color: "#ff8b6c" },
  { hook: "Three rules hiding on page 14.", color: "#7fd3a6" },
];

/**
 * How it works, as a self-playing loop: a stage acts out the active step while the list beside it
 * highlights where we are. Advances on a timer (not scroll); click a step to jump to it.
 */
export function HowSteps({ steps }: { steps: readonly Step[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, steps.length]);

  return (
    <section
      className="mt-24 grid items-center gap-10 border-t border-line pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto flex h-[300px] w-full max-w-[420px] items-center justify-center overflow-hidden border border-line bg-surface">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {active === 0 ? <DropScene /> : active === 1 ? <ReadScene /> : <SwipeScene />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ol className="flex flex-col">
        {steps.map(([title, body], i) => {
          const on = i === active;
          return (
            <li key={title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`relative w-full border-l-2 py-4 pl-6 text-left transition-colors ${on ? "border-thread" : "border-line hover:border-muted"}`}
              >
                <div className={`font-mono text-[12px] ${on ? "text-thread" : "text-muted"}`}>0{i + 1}</div>
                <h2 className={`mt-1 font-display text-[28px] leading-tight transition-colors ${on ? "text-ink" : "text-ink/45"}`}>{title}</h2>
                <motion.p
                  className="overflow-hidden text-[15px] leading-relaxed text-ink/75"
                  initial={false}
                  animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0, marginTop: on ? 8 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {body}
                </motion.p>
                {on && !paused && (
                  <motion.span
                    key={`bar-${active}`}
                    className="absolute -left-[2px] top-0 w-[2px] bg-ink/60"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 01: a file drops into the upload zone. */
function DropScene() {
  return (
    <div className="relative flex h-[190px] w-[260px] flex-col items-center justify-end border-2 border-dashed border-thread/50 pb-5">
      <motion.div
        className="absolute top-0 flex items-center gap-2 border border-line bg-paper px-3 py-2 font-mono text-[12px] text-ink"
        initial={{ y: -90, rotate: -8, opacity: 0 }}
        animate={{ y: 52, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 13, delay: 0.25 }}
      >
        <FileText size={15} strokeWidth={1.6} /> Q3-report.pdf
      </motion.div>
      <motion.div
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-thread"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <Upload size={14} strokeWidth={2} /> Drop it here
      </motion.div>
    </div>
  );
}

/** 02: a scan line reads the document and pulls out the key ideas. */
function ReadScene() {
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[150px] overflow-hidden border border-line bg-paper p-3">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] text-muted">
          <FileText size={11} strokeWidth={1.6} /> Q3-report.pdf
        </div>
        {Array.from({ length: 9 }, (_, k) => (
          <div key={k} className="mb-[7px] h-[4px] bg-line" style={{ width: `${70 + ((k * 17) % 30)}%` }} />
        ))}
        <motion.div
          className="absolute inset-x-0 h-[18px] bg-thread/25"
          style={{ boxShadow: "0 0 0 1px rgba(211,240,90,.5)" }}
          initial={{ top: 24 }}
          animate={{ top: [24, 120, 24] }}
          transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <div className="flex flex-col gap-2">
        {CHIPS.map((c, i) => (
          <motion.span
            key={c}
            className="border border-thread/60 px-2.5 py-1 font-mono text-[11px] text-thread"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.5, duration: 0.3 }}
          >
            ✓ {c}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/** 03: reels swipe up on a phone. */
function SwipeScene() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % REELS.length), 1100);
    return () => clearInterval(t);
  }, []);
  const r = REELS[i];
  return (
    <div className="relative h-[250px] w-[142px] overflow-hidden rounded-[20px] border border-ink/30 bg-black p-[4px]">
      <div className="relative h-full overflow-hidden rounded-[16px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={i}
            className="absolute inset-0 flex flex-col justify-between p-3"
            style={{ background: `color-mix(in srgb, ${r.color} 18%, #08110e)` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pt-5 text-center font-hook text-[12px] font-extrabold leading-[1.2] text-white">{r.hook}</div>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[8px] font-semibold text-white">unspool</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-white">
                <Heart size={11} strokeWidth={2} />
                <MessageCircle size={11} strokeWidth={2} />
                <Send size={10} strokeWidth={2} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
