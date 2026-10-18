"use client";

import Link from "next/link";
import type { UsageDTO } from "@/lib/spool-types";

const TIER_NAME = { free: "Free", plus: "Plus", pro: "Pro", ultra: "Ultra" } as const;

/** "Mon 3 Nov" */
export function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
}

function hoursLeft(iso: string | null) {
  if (!iso) return null;
  const h = Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 3600_000));
  return h;
}

/** The credit meter: "32 of 40 credits left · resets Mon 3 Nov", or the free drip's daily count. */
export function UsageMeter({ usage, compact = false, onUpgrade }: { usage: UsageDTO; compact?: boolean; onUpgrade?: () => void }) {
  const free = usage.tier === "free";
  const total = free ? usage.freePerDay : usage.allowance;
  const left = free ? Math.max(0, usage.freePerDay - usage.freeUsedToday) : usage.left;
  const pct = total ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;
  const low = !free && total > 0 && left / total < 0.2;
  const out = left === 0 && usage.topup === 0;
  const trialH = usage.trialing ? hoursLeft(usage.trialEndsAt) : null;

  return (
    <div className={compact ? "" : "border border-line p-4"} data-testid="usage-meter">
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="font-medium text-ink">
          {TIER_NAME[usage.tier]}
          {usage.trialing && " trial"}
        </span>
        {trialH !== null && <span className="tabular-nums text-thread">Trial ends in {trialH}h</span>}
      </div>
      <p className="mt-1.5 text-[13.5px] tabular-nums text-ink" data-testid="usage-line">
        {free ? (
          <>
            {left} of {total} free reels left today · 1 every {usage.freeIntervalMin} min
          </>
        ) : (
          <>
            {left} of {total} credits left · resets {shortDate(usage.resetsAt)}
          </>
        )}
      </p>
      <div className="mt-2 h-[3px] bg-line" role="progressbar" aria-valuenow={left} aria-valuemax={total} aria-label="Credits left">
        <div className={`h-full ${low || out ? "bg-coral" : "bg-thread"}`} style={{ width: `${pct}%` }} />
      </div>
      {usage.topup > 0 && <p className="mt-1.5 text-[12px] tabular-nums text-muted">+ {usage.topup} top-up credits (never expire)</p>}
      {(low || out || free) && (
        <p className="mt-2 text-[12px] leading-snug text-muted" data-testid="usage-nudge">
          {out && !free
            ? "You're out of credits for this week. "
            : low
              ? "Running low. "
              : "Want every reel now? "}
          {onUpgrade ? (
            <button type="button" onClick={onUpgrade} className="text-thread hover:underline">
              {usage.trialEligible ? "Try Plus free for a day" : "See plans"}
            </button>
          ) : (
            <Link href="/pricing" className="text-thread hover:underline">
              {usage.trialEligible ? "Try Plus free for a day" : "See plans"}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
