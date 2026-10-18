"use client";

import { useEffect, useRef, useState } from "react";
import type { Stat } from "@/lib/schema";

function format(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function CountUp({ to, run }: { to: number; run: boolean }) {
  const decimals = Number.isInteger(to) ? 0 : Math.min(2, String(to).split(".")[1]?.length ?? 1);
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!run) {
      raf.current = requestAnimationFrame(() => setValue(0));
      return () => cancelAnimationFrame(raf.current);
    }
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [run, to]);
  return <>{format(value, decimals)}</>;
}

/** Live numbers as flat boxes at the top of the frame; each counts up when the voiceover reaches it. */
export function StatLine({ stats, beat }: { stats: Stat[]; beat: number }) {
  if (!stats.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s, i) => {
        const on = beat >= s.at_beat;
        return (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap border px-3 py-1.5 text-[12.5px] transition-colors duration-300"
            style={{
              borderColor: on ? "var(--thread)" : "rgba(255,255,255,.16)",
              background: "rgba(8,17,14,.78)",
            }}
          >
            <span className="font-medium text-white/75">{s.label}</span>
            <span className="font-bold tabular-nums" style={{ color: on ? "var(--thread)" : "rgba(255,255,255,.5)" }}>
              {s.prefix}
              <CountUp to={s.value} run={on} />
              {s.suffix}
            </span>
          </span>
        );
      })}
    </div>
  );
}
