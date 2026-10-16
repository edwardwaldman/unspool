"use client";

import { useEffect, useRef, useState } from "react";
import type { ReelDTO } from "@/lib/spool-types";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";

/** A real reel rendered at phone size and scaled down. Plays silently only while on screen. */
export function MiniReel({ reel = SAMPLE_SPOOL.reels[0], width = 280 }: { reel?: ReelDTO; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const scale = width / 390;
  return (
    <div ref={ref} className="relative overflow-hidden border border-line bg-paper" style={{ width, height: 844 * scale }} aria-hidden>
      <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: 390, height: 844, transform: `scale(${scale})` }}>
        {visible && (
          <ReelView spool={SAMPLE_SPOOL} reel={reel} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
        )}
      </div>
    </div>
  );
}
