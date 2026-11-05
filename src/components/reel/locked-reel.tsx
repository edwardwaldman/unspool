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
  gateOpen = false,
}: {
  reel: ReelDTO;
  total: number;
  onUnlock: () => void;
  bottomInset: number;
  topInset?: number;
  /** The unlock pop-up is open over this reel: its own button would sit right under the pop-up's, a second lime CTA. */
  gateOpen?: boolean;
  freeAt?: string | null;
}) {
  const left = useCountdown(freeAt);
  return (
    <div className="relative h-full w-full cursor-pointer overflow-hidden text-white" style={reelVars(reel.index)} onClick={onUnlock} data-testid="locked-reel">
      {/* A blurred "cover" of the reel in its own colour: soft shapes and lines behind frosted glass */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 60% at 50% 35%, color-mix(in srgb, var(--thread) 38%, #0b0f0d) 0%, color-mix(in srgb, var(--thread) 12%, #08110e) 55%, #050807 100%)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-60 blur-[18px]" aria-hidden>
        <div className="absolute left-[12%] top-[18%] h-[22%] w-[60%] rounded-[24px]" style={{ background: "color-mix(in srgb, var(--thread) 55%, transparent)" }} />
        <div className="absolute left-[25%] top-[46%] h-[6%] w-[55%] rounded-full bg-white/40" />
        <div className="absolute left-[18%] top-[56%] h-[6%] w-[40%] rounded-full bg-white/30" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center" style={{ paddingTop: topInset, paddingBottom: bottomInset + 40 }}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur" aria-hidden>
          <LockIcon size={22} strokeWidth={2} />
        </span>
        <div className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
          Part {reel.index} of {total}
        </div>
        <h2 className="mt-2 font-hook text-[34px] font-extrabold leading-[1.04] tracking-[-0.025em] [text-shadow:0_3px_16px_rgba(0,0,0,.4)]">
          {sentenceCase(reel.title)}
        </h2>
        <p className="mt-3 max-w-[320px] text-[17px] leading-snug text-white/85">{reel.hook.replace(/[*#^~]/g, "")}</p>
        {left > 0 && (
          <div className="mt-6 rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-[14px] font-semibold tabular-nums text-white backdrop-blur">
            Free in {formatCountdown(left)}
          </div>
        )}
        {/* Always the brand lime (the reel's own accent made this purple on some reels) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlock();
          }}
          aria-hidden={gateOpen}
          tabIndex={gateOpen ? -1 : undefined}
          className={`${gateOpen ? "invisible " : ""}mt-5 flex min-h-[52px] w-full max-w-[300px] items-center justify-center gap-2 px-5 text-[16px] font-semibold text-[#08110e] shadow-[0_10px_30px_rgba(0,0,0,.35)] hover:opacity-90`}
          style={{ background: "#d3f05a" }}
        >
          Unlock all reels
        </button>
      </div>
    </div>
  );
}
