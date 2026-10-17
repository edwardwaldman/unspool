"use client";

import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelMock } from "./reel-mock";

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
      <div className="relative w-[190px] shrink-0 border border-line bg-surface p-4">
        {/* Square sticker slapped on the doc's corner */}
        <motion.div
          className="absolute -left-2 -top-[66px] z-10 lg:-left-12 lg:-top-[60px] flex h-[62px] w-[62px] flex-col justify-center bg-thread px-1.5 font-hook text-[9.5px] font-extrabold uppercase leading-[1.1] text-paper shadow-[3px_3px_0_var(--coral)]"
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: -10 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 14 }}
        >
          Skip the 40-page read
        </motion.div>
        <div className="flex items-center gap-2 text-muted">
          <FileText size={14} strokeWidth={1.5} />
          <span className="truncate font-mono text-[10px]">Q3-report.pdf</span>
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

      <div className="w-[184px] shrink-0 rounded-[22px] border border-ink/30 bg-black p-[5px]">
        <div className="relative overflow-hidden rounded-[17px]" style={{ height: TILE }}>
          <motion.div animate={{ y: -i * TILE }} transition={{ type: "spring", stiffness: 140, damping: 22 }}>
            {REELS.map((r, n) => (
              <ReelMock key={r.id} r={r} width={172} height={TILE} liked={n === i} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
