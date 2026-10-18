// The free drip: reel 1 of each document up front, then the next reel may be unlocked once every
// FREE_REEL_INTERVAL_MIN minutes (the timer runs from the last free unlock), at most FREE_REELS_PER_DAY
// free reels a day per account. Unlocking is server-side and atomic (claim_free_reel in SQL); these pure
// helpers only compute what the client shows.

import { FREE_REEL_INTERVAL_MIN } from "./plans";

export const DRIP_INTERVAL_MS = FREE_REEL_INTERVAL_MIN * 60 * 1000;

/** When the next free reel may be unlocked (ISO), or null when there is nothing left to drip. */
export function nextDripAt(lastFreeUnlockAt: string | null, unlocked: number, total: number): string | null {
  if (!lastFreeUnlockAt || unlocked >= total) return null;
  const last = Date.parse(lastFreeUnlockAt);
  return Number.isFinite(last) ? new Date(last + DRIP_INTERVAL_MS).toISOString() : null;
}
