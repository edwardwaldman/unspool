// Free reels reset at 12:00 AM Eastern (America/New_York); see the free_day_start() SQL function.

/** The next 12:00 AM Eastern (ISO), whatever the device's time zone. */
export function nextEasternMidnight(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0) % 24;
  const since = n("hour") * 3600 + Number(parts.find((p) => p.type === "minute")?.value ?? 0) * 60 + Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return new Date(Math.floor(now / 1000) * 1000 + (86400 - since) * 1000).toISOString();
}
