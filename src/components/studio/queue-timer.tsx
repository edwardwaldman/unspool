"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { formatCountdown, useCountdown } from "../ui/use-countdown";

/**
 * Free accounts: the countdown to their next free reel, and how many uploads are waiting in the queue for it.
 * When it reaches zero the page reloads, which starts the next queued upload (src/lib/queue.ts).
 */
export function QueueTimer({ nextAt, queued }: { nextAt: string | null; queued: number }) {
  const router = useRouter();
  const left = useCountdown(nextAt);
  const fired = useRef(false);
  useEffect(() => {
    if (!nextAt || left > 0 || fired.current) return;
    if (Date.parse(nextAt) > Date.now()) return; // the shared clock hasn't ticked yet
    fired.current = true;
    router.refresh();
  }, [left, nextAt, router]);

  if (left > 0) {
    return (
      <div className="flex items-center justify-between rounded-[16px] border border-line px-4 py-3" data-testid="queue-timer">
        <div>
          <div className="text-[12.5px] font-semibold text-muted">Next free reel in</div>
          {queued > 0 && (
            <div className="mt-0.5 text-[13px] text-muted">
              {queued} {queued === 1 ? "upload" : "uploads"} queued, starts then
            </div>
          )}
        </div>
        <div className="font-mono text-[26px] font-bold tabular-nums leading-none text-ink" aria-live="off">
          {formatCountdown(left)}
        </div>
      </div>
    );
  }
  if (queued > 0) {
    return (
      <div className="rounded-[16px] border border-line px-4 py-3 text-[13.5px] text-muted" data-testid="queue-timer">
        <span className="font-semibold text-thread">Up next:</span> your queued {queued === 1 ? "upload starts" : "uploads start"} as soon as
        the one being made finishes.
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-[16px] border border-line px-4 py-3" data-testid="queue-timer">
      <div className="text-[12.5px] font-semibold text-muted">Next free reel</div>
      <div className="font-mono text-[15px] font-bold text-ink">Ready now</div>
    </div>
  );
}
