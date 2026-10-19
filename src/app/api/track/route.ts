import { cookies, headers } from "next/headers";
import { supabaseConfigured } from "@/lib/config";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The visit log behind the owner panel's "What people did". The browser only sends a visit id and its
// events; who the user is, the IP and the country always come from the server.

const VISITOR_COOKIE = "unspool_vid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAMES = new Set([
  "open", "page", "upload_started", "upload_done", "signup_shown", "signup_closed", "signup_done", "login_shown", "login",
  "checkout_clicked", "demo_gate", "watch_demo", "reel_viewed", "idle", "close",
]);
const MAX_BODY = 16_384;
const MAX_BATCH = 50;
/** Events kept per visit; the rest are dropped (in SQL, so parallel beacons can't overshoot). */
const MAX_EVENTS = 300;
const DAY_MS = 864e5;

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  if (!supabaseConfigured) return noContent();
  const text = await req.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return noContent();
  let body: { visit?: unknown; landing?: unknown; referrer?: unknown; duration?: unknown; events?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return noContent();
  }
  if (typeof body.visit !== "string" || !UUID.test(body.visit) || !Array.isArray(body.events)) return noContent();
  const str = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);
  const events = body.events
    .slice(0, MAX_BATCH)
    .filter((e): e is { t: unknown; name: string; detail?: unknown } => Boolean(e) && typeof e === "object" && NAMES.has((e as { name?: string }).name ?? ""))
    .map((e) => {
      const t = Math.round(Math.min(DAY_MS, Math.max(0, Number(e.t) || 0)));
      const detail = str(e.detail, 160);
      return detail ? { t, name: e.name, detail } : { t, name: e.name };
    });
  if (!events.length) return noContent();

  const viewer = await getViewer();
  // The owner's own browsing would drown everything else; it's logged only while testing a view.
  if (viewer.isOwner && !viewer.ownerView) return noContent();

  const jar = await cookies();
  let visitor = jar.get(VISITOR_COOKIE)?.value;
  if (!visitor || !UUID.test(visitor)) {
    visitor = crypto.randomUUID();
    jar.set(VISITOR_COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 864e2 });
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const { error } = await adminClient().rpc("track_visit", {
    p_id: body.visit,
    p_visitor: visitor,
    p_user_id: viewer.userId,
    p_email: viewer.email,
    p_ip: ip?.slice(0, 64) ?? null,
    p_country: str(h.get("x-vercel-ip-country"), 8),
    p_user_agent: str(h.get("user-agent"), 300),
    p_referrer: str(body.referrer, 300),
    p_landing: str(body.landing, 200),
    p_events: events,
    p_duration_ms: Math.round(Math.min(DAY_MS, Math.max(0, Number(body.duration) || 0))),
    p_max: MAX_EVENTS,
  });
  if (error) console.error("[track] track_visit failed", error);
  return noContent();
}
