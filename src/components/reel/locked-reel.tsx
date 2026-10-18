"use client";

import type { ReelDTO } from "@/lib/spool-types";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { LockIcon } from "../ui/icons";
import { reelVars } from "./accent";
import { sentenceCase } from "./text";

/**
 * A locked reel: its title and hook on a flat frame in the reel's own tint. It never has
 * a script or audio (the server withholds both), so there is nothing to play. Tapping or swiping onto
 * it opens the unlock gate; on the free plan it also counts down to when it can be unlocked for free.
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
      {/* Flat frame in the reel's tint */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "color-mix(in srgb, var(--thread) 10%, #08110e)" }} aria-hidden />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center" style={{ paddingTop: topInset, paddingBottom: bottomInset + 40 }}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-white/70">
          <LockIcon size={13} strokeWidth={2.25} /> Part {reel.index} of {total}, locked
        </div>
        <span aria-hidden className="mt-4 block h-px w-10 bg-thread" />
        <h2 className="mt-4 font-hook text-[32px] font-extrabold leading-[1.04] tracking-[-0.025em]">
          {sentenceCase(reel.title)}
        </h2>
        <p className="mt-3 max-w-[320px] text-[16px] leading-snug text-white/80">{reel.hook}</p>
        {left > 0 && (
          <div className="mt-6 text-[14px] font-semibold tabular-nums text-thread">
            Free in {formatCountdown(left)}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlock();
          }}
          className="mt-6 flex items-center gap-2 bg-thread px-5 py-3 text-[14.5px] font-semibold text-[#08110e] hover:opacity-90"
        >
          <LockIcon size={15} strokeWidth={2.25} /> {left > 0 ? "Unlock now" : "Unlock this reel"}
        </button>
      </div>
    </div>
  );
}
