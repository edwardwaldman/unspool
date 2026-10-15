"use client";

import type { ReelDTO } from "@/lib/spool-types";
import { LockIcon } from "../ui/icons";
import { accentFor } from "./accent";

/** A locked reel: its title and hook over a blurred, frozen frame. Swiping onto it opens the paywall. */
export function LockedReel({ reel, onUnlock, bottomInset }: { reel: ReelDTO; onUnlock: () => void; bottomInset: number }) {
  const accent = accentFor(undefined, reel.index);
  return (
    <div className="reel-bg relative h-full w-full overflow-hidden" onClick={onUnlock}>
      {/* Frozen frame */}
      <div className="absolute inset-0 scale-110 blur-[14px] opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-[70px] px-6 text-[28px] font-black leading-tight text-white/80">{reel.hook}</div>
        <div
          className="absolute left-1/2 top-[48%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 65%)`, opacity: 0.5 }}
        />
        <div className="absolute inset-x-0 top-[40%] grid grid-cols-12 gap-3 px-8 opacity-60">
          {Array.from({ length: 96 }, (_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i % 7 === 0 ? accent : "#9fb0d8" }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-[#0b1020]/35" />
      <div className="relative z-10 flex h-full flex-col justify-center px-7" style={{ paddingBottom: bottomInset + 160 }}>
        <div className="mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.25em]" style={{ color: accent }}>
          <LockIcon size={16} /> Reel {reel.index} of 10
        </div>
        <h2 className="text-[34px] font-black uppercase leading-[1.02] tracking-tight" style={{ textShadow: `0 0 30px color-mix(in srgb, ${accent} 50%, transparent)` }}>
          {reel.title}
        </h2>
        <p className="mt-4 text-[19px] font-semibold leading-snug text-soft">{reel.hook}</p>
      </div>
    </div>
  );
}
