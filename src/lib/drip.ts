// The free trial, per document: reel 1 right away, then one more reel every hour, up to all 10.
// Pure and dependency-free so the rule is easy to read and test; subscribers and purchased documents
// skip it entirely (see freeReelLimit in ./access).

export const DRIP_REELS = 10;
export const DRIP_INTERVAL_MS = 60 * 60 * 1000;

const startOf = (startedAt: string | Date) => (typeof startedAt === "string" ? Date.parse(startedAt) : startedAt.getTime());

/** How many reels of a document a free account may play: 1 + one per full hour since it was created, max 10. */
export function dripUnlocked(startedAt: string | Date, now = Date.now()): number {
  const start = startOf(startedAt);
  if (!Number.isFinite(start)) return 1;
  const hours = Math.floor(Math.max(0, now - start) / DRIP_INTERVAL_MS);
  return Math.min(DRIP_REELS, 1 + hours);
}

/** When the next free reel opens (ISO), or null once all 10 are free. */
export function nextDripAt(startedAt: string | Date, now = Date.now()): string | null {
  const unlocked = dripUnlocked(startedAt, now);
  if (unlocked >= DRIP_REELS) return null;
  const start = startOf(startedAt);
  if (!Number.isFinite(start)) return null;
  return new Date(start + unlocked * DRIP_INTERVAL_MS).toISOString();
}
