// The free trial, per document: reel 1 right away, then one more reel every hour, up to all of them.
// Pure and dependency-free so the rule is easy to read and test; subscribers and purchased documents
// skip it entirely (see freeReelLimit in ./access).

export const DRIP_INTERVAL_MS = 60 * 60 * 1000;

const startOf = (startedAt: string | Date) => (typeof startedAt === "string" ? Date.parse(startedAt) : startedAt.getTime());

/** How many of a document's `total` reels a free account may play: 1 + one per full hour since upload. */
export function dripUnlocked(startedAt: string | Date, total: number, now = Date.now()): number {
  const start = startOf(startedAt);
  if (!Number.isFinite(start)) return Math.min(1, total);
  const hours = Math.floor(Math.max(0, now - start) / DRIP_INTERVAL_MS);
  return Math.min(total, 1 + hours);
}

/** When the next free reel opens (ISO), or null once all `total` are free. */
export function nextDripAt(startedAt: string | Date, total: number, now = Date.now()): string | null {
  const unlocked = dripUnlocked(startedAt, total, now);
  if (unlocked >= total) return null;
  const start = startOf(startedAt);
  if (!Number.isFinite(start)) return null;
  return new Date(start + unlocked * DRIP_INTERVAL_MS).toISOString();
}
