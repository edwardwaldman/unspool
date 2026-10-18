"use client";

import type { ReelDTO } from "@/lib/spool-types";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { LockIcon } from "../ui/icons";
import { reelVars } from "./accent";

/**
 * A locked reel: its title and hook over a blurred, frozen frame in the reel's own tint. It never has
 * a script or audio (the server withholds both), so there is nothing to play. Tapping or swiping onto
 * it opens the unlock gate; while the free drip runs it also says when it turns free on its own.
 */
export function LockedReel({
  reel,
  total,
  onUnlock,
  bottomInset,
  topInset = 0,
  freeAt = null,
}: {
  reel: ReelDTO;
  total: number;
  onUnlock: () => void;
  bottomInset: number;
  topInset?: number;
  freeAt?: string | null;
}) {
  const left = useCountdown(freeAt);
  return (
    <div className="relative h-full w-full cursor-pointer overflow-hidden text-white" style={reelVars(reel.index)} onClick={onUnlock} data-testid="locked-reel">
      {/* Frozen, blurred frame */}
      <div className="pointer-events-none absolute inset-0 scale-110 select-none blur-[18px]" aria-hidden>
        <div className="absolute inset-x-0 top-[12%] px-8 text-center font-hook text-[30px] font-extrabold leading-tight text-white/60">{reel.hook}</div>
        <div className="absolute left-1/2 top-[50%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-thread opacity-30" />
        <div className="absolute inset-x-10 bottom-[22%] h-10 rounded-full bg-white/25" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75" aria-hidden />

      {/* Empty progress, so it still reads as a clip */}
      <div className="absolute inset-x-3 top-2 z-10 flex gap-[3px]" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-[2.5px] flex-1 rounded-full bg-white/20" />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center" style={{ paddingTop: topInset, paddingBottom: bottomInset + 40 }}>
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/20 bg-black/35 backdrop-blur-[10px]">
          <LockIcon size={28} strokeWidth={2} />
        </div>
        <div className="mt-5 rounded-full bg-black/30 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-[6px]">
          Part {reel.index} of {total} · Locked
        </div>
        <h2 className="mt-4 font-hook text-[30px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]" style={{ textShadow: "0 2px 18px rgba(0,0,0,.35)" }}>
          {reel.title}
        </h2>
        <p className="mt-3 max-w-[320px] text-[16px] leading-snug text-white/80">{reel.hook}</p>
        {left > 0 && (
          <div className="mt-6 rounded-full border px-3.5 py-1.5 font-mono text-[13px] font-semibold text-thread" style={{ borderColor: "color-mix(in srgb, var(--thread) 60%, transparent)" }}>
            Free in {formatCountdown(left)}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlock();
          }}
          className="mt-6 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#08110e] hover:opacity-90"
        >
          <LockIcon size={15} strokeWidth={2.25} /> {left > 0 ? "Unlock now" : "Unlock this reel"}
        </button>
      </div>
    </div>
  );
}
