"use client";

// Visit log for the owner panel: pages and key actions, batched and sent with sendBeacon to /api/track.
// One visit per tab session (sessionStorage); the server sets the long-lived visitor cookie.

export type TrackName =
  | "open"
  | "page"
  | "upload_started"
  | "upload_done"
  | "signup_shown"
  | "signup_closed"
  | "signup_done"
  | "login_shown"
  | "login"
  | "checkout_clicked"
  | "demo_gate"
  | "watch_demo"
  | "reel_viewed"
  | "idle"
  | "close";

type Event = { t: number; name: TrackName; detail?: string };
type Visit = { id: string; start: number; landing: string; referrer: string };

const KEY = "unspool_visit";
const MAX_BATCH = 40;
let visit: Visit | null = null;
const queue: Event[] = [];

/** This tab's visit, started on first use. */
function current(): Visit | null {
  if (typeof window === "undefined") return null;
  if (visit) return visit;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Visit | null;
    if (saved?.id && typeof saved.start === "number") return (visit = saved);
  } catch {
    // Private mode or blocked storage: a visit per page load is fine.
  }
  visit = { id: crypto.randomUUID(), start: Date.now(), landing: location.pathname, referrer: document.referrer.slice(0, 300) };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(visit));
  } catch {}
  queue.push({ t: 0, name: "open" });
  return visit;
}

/** Record one event. Cheap: it's queued and sent in batches. */
export function track(name: TrackName, detail?: string | number) {
  const v = current();
  if (!v) return;
  queue.push({ t: Date.now() - v.start, name, ...(detail !== undefined ? { detail: String(detail).slice(0, 160) } : {}) });
  if (queue.length >= MAX_BATCH || name === "close") flush();
}

/** Send what's queued. sendBeacon survives the page closing; fetch keepalive is the fallback. */
export function flush() {
  const v = current();
  if (!v || !queue.length) return;
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ visit: v.id, landing: v.landing, referrer: v.referrer, duration: Date.now() - v.start, events });
  const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
  if (!sent) void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => undefined);
  if (queue.length) flush();
}
