"use client";

import type { ReelDTO } from "@/lib/spool-types";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { LockIcon } from "../ui/icons";

/**
 * A locked reel: its title and hook over a blurred, frozen frame. Swiping onto it opens the unlock
 * gate. While the free drip is running, it also says when this reel turns free on its own.
 */
export function LockedReel({
  reel,
  total,
  onUnlock,
  bottomInset,
  freeAt = null,
}: {
  reel: ReelDTO;
  total: number;
  onUnlock: () => void;
  bottomInset: number;
  freeAt?: string | null;
}) {
  const left = useCountdown(freeAt);
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper" onClick={onUnlock} data-testid="locked-reel">
      {/* Frozen frame */}
      <div className="pointer-events-none absolute inset-0 scale-110 select-none opacity-60 blur-[14px]" aria-hidden>
        <div className="absolute inset-x-0 top-[70px] px-6 font-hook text-[28px] font-extrabold leading-tight text-ink/70">{reel.hook}</div>
        <div className="absolute left-1/2 top-[52%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-thread opacity-25" />
        <div className="absolute inset-x-0 top-[42%] grid grid-cols-12 gap-3 px-8">
          {Array.from({ length: 96 }, (_, i) => (
            <div key={i} className="h-1 w-1 rounded-full" style={{ background: i % 7 === 0 ? "var(--thread)" : "var(--muted)" }} />
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/10 via-paper/40 to-paper/90" aria-hidden />
      <div className="relative z-10 flex h-full flex-col justify-center px-7" style={{ paddingBottom: bottomInset + 160 }}>
        <div className="label flex items-center gap-2">
          <LockIcon size={13} /> Reel {reel.index} of {total}
        </div>
        <h2 className="mt-4 font-hook text-[34px] font-extrabold uppercase leading-[1] tracking-[-0.02em]">{reel.title}</h2>
        <p className="mt-4 text-[18px] leading-snug text-ink/80">{reel.hook}</p>
        {left > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <span className="border border-thread px-2.5 py-1 font-mono text-[13px] text-thread">Free in {formatCountdown(left)}</span>
            <span className="text-[13.5px] text-muted underline underline-offset-2">or unlock now</span>
          </div>
        )}
      </div>
    </div>
  );
}
