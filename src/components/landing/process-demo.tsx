"use client";

import { Check, FileText, Heart, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { useMedia } from "../ui/use-media";

// Stage is drawn at 900×520 and scaled to fit.
const W = 900;
const H = 520;

type Phase = "plus" | "click-plus" | "pick" | "click-file" | "loading" | "reels";
const SCRIPT: [Phase, number][] = [
  ["plus", 1300],
  ["click-plus", 500],
  ["pick", 1300],
  ["click-file", 600],
  ["loading", 2600],
  ["reels", 4600],
];

const FILES = ["unit-3-notes.pdf", "apartment-lease.pdf", "onboarding-guide.docx"];
const REELS = SAMPLE_SPOOL.reels;
const STAGES = ["Read", "Plan", "Write"];

const CURSOR: Record<Phase, { x: number; y: number }> = {
  plus: { x: 445, y: 205 },
  "click-plus": { x: 445, y: 205 },
  pick: { x: 400, y: 236 },
  "click-file": { x: 400, y: 236 },
  loading: { x: 700, y: 430 },
  reels: { x: 470, y: 300 },
};

function Cursor({ phase }: { phase: Phase }) {
  const p = CURSOR[phase];
  const pressing = phase === "click-plus" || phase === "click-file";
  const swiping = phase === "reels";
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-30"
      animate={
        swiping
          ? { x: [p.x, p.x, p.x, p.x], y: [p.y + 80, p.y - 60, p.y + 80, p.y - 60], scale: 1 }
          : { x: p.x, y: p.y, scale: pressing ? 0.85 : 1 }
      }
      transition={swiping ? { duration: 3.6, times: [0, 0.3, 0.55, 0.85], ease: "easeInOut" } : { type: "spring", stiffness: 90, damping: 16 }}
    >
      <svg width="26" height="30" viewBox="0 0 18 20">
        <path d="M1 1 L1 15 L5 11.5 L8 18 L10.5 17 L7.6 10.6 L13 10.6 Z" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {pressing && (
        <motion.span
          className="absolute -left-4 -top-4 h-9 w-9 rounded-full border-2 border-thread"
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  );
}

function Loading() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(10, x + 1)), 220);
    return () => clearInterval(t);
  }, []);
  const stage = n < 3 ? 0 : n < 6 ? 1 : 2;
  return (
    <motion.div key="loading" className="absolute inset-0 flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-3 text-muted">
        <FileText size={18} strokeWidth={1.5} />
        <span className="font-mono text-[13px]">unit-3-notes.pdf</span>
      </div>
      <div className="mt-5 font-display text-[40px] leading-none">Unspooling your doc</div>
      <div className="mt-8 flex gap-8">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-[14px]" style={{ color: i < stage ? "var(--ink)" : i === stage ? "var(--thread)" : "var(--muted)" }}>
            {i < stage ? <Check size={14} strokeWidth={2} /> : <span className="font-mono text-[11px]">0{i + 1}</span>}
            {s}
          </div>
        ))}
      </div>
      <div className="mt-8 grid w-[460px] grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div key={i} className="h-2" animate={{ backgroundColor: i < n ? "var(--thread)" : "var(--border)" }} transition={{ duration: 0.2 }} />
        ))}
      </div>
      <div className="mt-3 font-mono text-[12px] text-muted">{n}/10 reels</div>
    </motion.div>
  );
}

function Reels() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const ts = [1100, 2000, 3100].map((ms, k) => setTimeout(() => setI(k + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);
  const TILE = 420;
  return (
    <motion.div key="reels" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div className="relative w-[250px] border border-ink/60 bg-paper p-[7px]">
        <div className="relative overflow-hidden border border-line" style={{ height: TILE }}>
          <motion.div animate={{ y: -i * TILE }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
            {REELS.slice(0, 5).map((r) => (
              <div key={r.id} className="flex flex-col justify-between p-4" style={{ height: TILE }}>
                <div>
                  <div className="font-mono text-[10px] text-muted">{r.index}/10</div>
                  <div className="mt-2 font-hook text-[18px] font-extrabold leading-[1.12]">{r.hook}</div>
                </div>
                <div className="grid grid-cols-8 gap-[7px] self-center">
                  {Array.from({ length: 40 }, (_, k) => (
                    <span key={k} className="h-[5px] w-[5px] rounded-full" style={{ background: (k * 7 + r.index) % 5 === 0 ? "var(--thread)" : "var(--border)" }} />
                  ))}
                </div>
                <div>
                  <div className="font-hook text-[13px] font-bold uppercase text-thread">{r.title}</div>
                  <div className="mt-2 h-[2px] bg-line">
                    <motion.div key={`p-${r.id}-${i}`} className="h-full bg-thread" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "linear" }} />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
          <AnimatePresence>
            <motion.div
              key={`heart-${i}`}
              className="absolute bottom-16 right-4 text-thread"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Heart size={22} fill="currentColor" strokeWidth={0} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="absolute right-16 top-1/2 -translate-y-1/2 text-right">
        <div className="font-mono text-[44px] leading-none text-thread">{i + 1}<span className="text-muted">/10</span></div>
        <div className="label mt-2">Swipe to the next reel</div>
      </div>
    </motion.div>
  );
}

/** A full loop of the product: click +, pick a file, watch it unspool, scroll the reels. */
export function ProcessDemo() {
  const [step, setStep] = useState(0);
  const phase = SCRIPT[step][0];
  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s + 1) % SCRIPT.length), SCRIPT[step][1]);
    return () => clearTimeout(t);
  }, [step]);

  const lg = useMedia("(min-width: 1024px)");
  const md = useMedia("(min-width: 640px)");
  const k = lg ? 1.2 : md ? 0.7 : 0.38;
  const showPick = phase === "pick" || phase === "click-file";
  const showPlus = phase === "plus" || phase === "click-plus" || showPick;

  return (
    <div className="mx-auto" style={{ width: W * k, height: H * k }} aria-hidden>
      <div className="relative origin-top-left overflow-hidden border border-line bg-surface" style={{ width: W, height: H, transform: `scale(${k})` }}>
        {/* window chrome */}
        <div className="flex h-10 items-center gap-2 border-b border-line px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-4 font-mono text-[11px] text-muted">unspool.cc</span>
        </div>
        <div className="relative" style={{ height: H - 40 }}>
          <AnimatePresence mode="wait">
            {showPlus && (
              <motion.div key="plus" className="absolute inset-0 flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className="flex h-24 w-24 items-center justify-center bg-ink text-paper"
                  animate={{ scale: phase === "click-plus" ? 0.9 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Plus size={44} strokeWidth={1.75} />
                </motion.div>
                <div className="label mt-5">Upload a document</div>
              </motion.div>
            )}
            {phase === "loading" && <Loading />}
            {phase === "reels" && <Reels />}
          </AnimatePresence>

          {/* file picker */}
          <AnimatePresence>
            {showPick && (
              <motion.div
                className="absolute left-1/2 top-1/2 z-20 w-[380px] -translate-x-1/2 -translate-y-1/2 border border-line bg-paper"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div className="border-b border-line px-4 py-2.5 label">Choose a file</div>
                {FILES.map((f, i) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 border-b border-line px-4 py-3 text-[14px] last:border-b-0"
                    style={{ background: i === 0 && phase === "click-file" ? "color-mix(in srgb, var(--thread) 18%, transparent)" : undefined, color: i === 0 ? "var(--ink)" : "var(--muted)" }}
                  >
                    <FileText size={16} strokeWidth={1.5} />
                    {f}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Cursor phase={phase} />
        </div>
      </div>
    </div>
  );
}
