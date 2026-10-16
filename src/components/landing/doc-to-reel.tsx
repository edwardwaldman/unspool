"use client";

import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";

const REELS = SAMPLE_SPOOL.reels;
const TILE = 320; // phone screen height per reel
const STEP_MS = 1900;

/**
 * A document's sections light up one at a time, a dot carries each across,
 * and the phone scrolls to the reel it became.
 */
export function DocToReel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % REELS.length), STEP_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-6" aria-hidden>
      <div className="w-[190px] shrink-0 border border-line bg-surface p-4">
        <div className="flex items-center gap-2 text-muted">
          <FileText size={14} strokeWidth={1.5} />
          <span className="truncate font-mono text-[10px]">unit-3-notes.pdf</span>
        </div>
        <div className="mt-4 space-y-[8px]">
          {REELS.map((r, n) => (
            <div key={r.id} className="space-y-[3px]">
              <motion.div
                className="h-[4px]"
                animate={{ backgroundColor: n === i ? "var(--thread)" : "var(--border)", width: n === i ? "72%" : "55%" }}
                transition={{ duration: 0.35 }}
              />
              <div className="h-[3px] w-[92%] bg-line" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-px w-14 shrink-0 bg-line">
        <motion.div
          key={i}
          className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-thread"
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      </div>

      <div className="w-[184px] shrink-0 border border-ink/60 bg-paper p-[6px]">
        <div className="relative overflow-hidden border border-line" style={{ height: TILE }}>
          <motion.div animate={{ y: -i * TILE }} transition={{ type: "spring", stiffness: 140, damping: 22 }}>
            {REELS.map((r) => (
              <div key={r.id} className="flex flex-col justify-between p-3" style={{ height: TILE }}>
                <div>
                  <div className="font-mono text-[9px] text-muted">{r.index}/10</div>
                  <div className="mt-2 font-hook text-[14px] font-extrabold leading-[1.12]">{r.hook}</div>
                </div>
                <div className="grid grid-cols-8 gap-[6px] self-center">
                  {Array.from({ length: 32 }, (_, k) => (
                    <span key={k} className="h-[4px] w-[4px] rounded-full" style={{ background: (k * 7 + r.index) % 5 === 0 ? "var(--thread)" : "var(--border)" }} />
                  ))}
                </div>
                <div>
                  <div className="font-hook text-[11px] font-bold uppercase text-thread">{r.title}</div>
                  <div className="mt-2 h-[2px] bg-line">
                    <div className="h-full w-1/3 bg-thread" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
