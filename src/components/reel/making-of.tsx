"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { SpoolDTO } from "@/lib/spool-types";
import { reelAccent } from "./accent";

// The loading screen's hero: the user's own document turning into reels, stage by stage, so there's always
// something happening while reel 1 is made. Upload: the file card flies in. Read: a scan bar sweeps the page and
// lines light up. Plan: one mini reel card per planned reel deals out. Write: the reel being written comes
// forward, its real title and hook type themselves on, and a sound wave runs while it's voiced.

const clean = (s: string) => s.replace(/[*#^~]/g, "");

/** Text that types itself on, restarting when the text changes. */
function useTyped(text: string, cps = 38) {
  const [state, setState] = useState({ text, n: 0 });
  if (state.text !== text) setState({ text, n: 0 });
  useEffect(() => {
    const id = window.setInterval(() => setState((s) => (s.n >= s.text.length ? s : { ...s, n: s.n + 1 })), 1000 / cps);
    return () => window.clearInterval(id);
  }, [cps]);
  return text.slice(0, state.text === text ? state.n : 0);
}

function DocCard({ name, ext, scanning, reduce }: { name: string; ext: string; scanning: boolean; reduce: boolean | null }) {
  return (
    <div className="relative h-[170px] w-[130px] overflow-hidden border border-white/15 bg-[#f4f2ea] p-3 shadow-[0_18px_40px_rgba(0,0,0,.45)]">
      <div className="flex items-center gap-1.5">
        <span className="bg-[#e5483b] px-1 py-px font-mono text-[8px] font-bold uppercase text-white">{ext || "doc"}</span>
        <span className="truncate text-[8.5px] font-semibold text-[#1c1f26]">{name}</span>
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={i}
          className="mt-[7px] h-[5px] rounded-full"
          style={{ width: `${[92, 80, 88, 60, 90, 74, 86, 50, 82, 68][i]}%`, background: "#c9ccd4" }}
          animate={scanning && !reduce ? { backgroundColor: ["#c9ccd4", "#d3f05a", "#c9ccd4"] } : undefined}
          transition={scanning ? { duration: 2.4, delay: (i / 10) * 2.4, repeat: Infinity, times: [0, 0.08, 0.3] } : undefined}
        />
      ))}
      {scanning && !reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-[22px]"
          style={{ background: "linear-gradient(transparent, rgba(211,240,90,.55), transparent)" }}
          animate={{ top: ["-12%", "100%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

function MiniReel({ n, state, big = false }: { n: number; state: "ready" | "writing" | "waiting"; big?: boolean }) {
  return (
    <div
      className="relative flex items-end justify-center overflow-hidden"
      style={{
        width: big ? 92 : 34,
        height: big ? 164 : 60,
        borderRadius: big ? 12 : 6,
        background: `linear-gradient(160deg, ${reelAccent(n)}, #0b0f0d 85%)`,
        boxShadow: state === "ready" ? "0 0 0 2px var(--thread), 0 8px 20px rgba(0,0,0,.4)" : "0 8px 20px rgba(0,0,0,.4)",
        opacity: state === "waiting" ? 0.55 : 1,
      }}
    >
      <span className="absolute left-1.5 top-1 font-mono font-bold text-white/90" style={{ fontSize: big ? 11 : 8 }}>
        {n}
      </span>
      {state === "ready" && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-thread" />}
    </div>
  );
}

export function MakingOf({ spool, stage, fileName }: { spool: SpoolDTO | null; stage: number; fileName: string }) {
  const reduce = useReducedMotion();
  const reels = spool?.reels ?? [];
  const writing = reels.find((r) => r.status === "generating") ?? reels.find((r) => r.status !== "ready" && !r.locked);
  const ext = spool?.fileType === "prompt" ? "WEB" : (spool?.fileType || fileName.split(".").pop() || "").slice(0, 4);
  const typedTitle = useTyped(writing ? clean(writing.title) : "", 30);
  const typedHook = useTyped(writing && typedTitle.length >= clean(writing.title).length ? clean(writing.hook) : "", 42);
  const planned = reels.length || (stage >= 2 ? 6 : 0);

  return (
    <div className="relative mt-7 flex h-[210px] items-center justify-center" data-testid="making-of" aria-hidden>
      {/* A soft glow that breathes behind the action */}
      <motion.div className="absolute h-[200px] w-[260px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(211,240,90,.18), transparent)" }} animate={reduce ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      <AnimatePresence mode="wait">
        {stage <= 1 && (
          <motion.div key="doc" initial={reduce ? false : { y: 80, rotate: -8, opacity: 0 }} animate={{ y: 0, rotate: -3, opacity: 1 }} exit={{ scale: 0.8, opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
            <DocCard name={fileName} ext={ext} scanning={stage === 1} reduce={reduce} />
          </motion.div>
        )}
        {stage === 2 && (
          <motion.div key="plan" className="relative flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ scale: 0.72, rotate: -3 }} transition={{ duration: 0.5 }}>
              <DocCard name={fileName} ext={ext} scanning reduce={reduce} />
            </motion.div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: Math.min(9, planned) }, (_, i) => (
                <motion.div key={i} initial={reduce ? false : { x: -90, opacity: 0, rotate: -20, scale: 0.5 }} animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 + i * 0.12 }}>
                  <MiniReel n={i + 1} state="waiting" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {stage >= 3 && (
          <motion.div key="write" className="relative flex w-full items-center justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* The reel being written, front and centre, its own title and hook typing on */}
            <motion.div initial={reduce ? false : { scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: reduce ? 0 : [-2, 2, -2] }} transition={{ scale: { type: "spring", stiffness: 200, damping: 14 }, rotate: { duration: 4, repeat: Infinity } }}>
              <MiniReel n={writing?.index ?? 1} state="writing" big />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-thread">Writing reel {writing?.index ?? 1}</div>
              <div className="mt-1.5 min-h-[40px] font-display text-[17px] leading-[1.15] text-white">
                {typedTitle}
                <span className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] animate-pulse bg-thread" />
              </div>
              <div className="mt-1 line-clamp-3 min-h-[48px] text-[12.5px] leading-snug text-white/70">{typedHook}</div>
              {/* The voice being recorded */}
              <div className="mt-2 flex h-[18px] items-end gap-[3px]">
                {Array.from({ length: 18 }, (_, i) => (
                  <motion.span key={i} className="w-[3px] rounded-full bg-thread" animate={reduce ? { height: 6 } : { height: [4, 6 + ((i * 7) % 12), 4] }} transition={{ duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, delay: i * 0.05 }} />
                ))}
              </div>
              {/* Every planned reel: ready ones light up */}
              <div className="mt-3 flex flex-wrap gap-1">
                {reels.map((r) => (
                  <span key={r.id} className="h-[5px] w-[14px] rounded-full" style={{ background: r.status === "ready" ? "var(--thread)" : r.id === writing?.id ? "color-mix(in srgb, var(--thread) 50%, transparent)" : "rgba(255,255,255,.18)" }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
