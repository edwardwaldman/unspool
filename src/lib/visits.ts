import { isOwnerEmail } from "./owner";
import { adminClient } from "./supabase/admin";

// The owner panel's reading of the visit log (see /api/track): what people did, which accounts share
// an address, and where visitors who never signed up stopped.

export type VisitEvent = { t: number; name: string; detail?: string };
type VisitRow = {
  id: string;
  visitor_id: string;
  user_id: string | null;
  email: string | null;
  ip: string | null;
  country: string | null;
  user_agent: string | null;
  referrer: string | null;
  landing: string | null;
  started_at: string;
  last_seen_at: string;
  duration_ms: number;
  events: VisitEvent[];
  signed_up: boolean;
  checkout: boolean;
};

/** A visit shorter than this, on one page with nothing done, "left at once". */
const BOUNCE_MS = 10_000;
const RECENT = 80;
const COLS = "id,visitor_id,user_id,email,ip,country,user_agent,referrer,landing,started_at,last_seen_at,duration_ms,events,signed_up,checkout";
/** Events that are not something the visitor did. */
const PASSIVE = new Set(["open", "page", "idle", "close"]);

/** Saw the offer: the pricing page, a paywall, or an upgrade button. */
const sawPricing = (v: VisitRow) =>
  v.events.some((e) => (e.name === "page" && /^\/(pricing|upgrade)/.test(e.detail ?? "")) || e.name === "checkout_clicked" || e.name === "demo_gate");
const has = (v: VisitRow, name: string) => v.events.some((e) => e.name === name);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

type Stop = "closed_signup" | "ignored_signup" | "uploaded_left" | "sat_still" | "looked_left";
const STOP_LABELS: Record<Stop, string> = {
  closed_signup: "Asked for an account & closed it",
  ignored_signup: "Asked for an account & never answered",
  uploaded_left: "Uploaded, then left",
  sat_still: "Sat on the first screen, touching nothing",
  looked_left: "Looked around and left",
};

function stopOf(v: VisitRow): Stop {
  if (has(v, "signup_shown") && has(v, "signup_closed")) return "closed_signup";
  if (has(v, "signup_shown")) return "ignored_signup";
  if (has(v, "upload_started")) return "uploaded_left";
  const pages = v.events.filter((e) => e.name === "page").length;
  if (pages <= 1 && v.events.every((e) => PASSIVE.has(e.name)) && has(v, "idle")) return "sat_still";
  return "looked_left";
}

/** The last few things a visitor did before leaving, as event names. */
const leadIn = (v: VisitRow) =>
  v.events
    .filter((e) => e.name !== "close" && e.name !== "open")
    .slice(-3)
    .map((e) => (e.name === "page" ? `page ${e.detail ?? ""}`.trim() : e.name))
    .join(" → ") || "open";

/** Where a visit came from: the referrer, or a utm_source / ref on the landing URL. */
const source = (v: VisitRow) => `${v.referrer ?? ""} ${v.landing ?? ""}`.toLowerCase();
const from = (re: RegExp) => (v: VisitRow, mine: boolean) => !mine && re.test(source(v));
/** The owner panel's visit filters; every one but "all" leaves out your own visits. */
export const SEGMENTS = {
  external: (_v: VisitRow, mine: boolean) => !mine,
  tiktok: from(/tiktok/),
  instagram: from(/instagram/),
  youtube: from(/youtube|youtu\.be/),
  google: from(/google\./),
  all: () => true,
} satisfies Record<string, (v: VisitRow, mine: boolean) => boolean>;
export type Segment = keyof typeof SEGMENTS;

export async function visitAnalytics() {
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const { data } = await adminClient()
    .from("visits")
    .select(COLS)
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(2000);
  const visits = (data ?? []) as VisitRow[];

  // Returning: this visitor cookie had an earlier visit.
  const first = new Map<string, string>();
  for (const v of visits) {
    const f = first.get(v.visitor_id);
    if (!f || v.started_at < f) first.set(v.visitor_id, v.started_at);
  }

  // Your own visits: signed in as you, or the same browser / network as a visit that was.
  const ownerVisitors = new Set(visits.filter((v) => isOwnerEmail(v.email)).map((v) => v.visitor_id));
  const ownerIps = new Set(visits.filter((v) => isOwnerEmail(v.email) && v.ip).map((v) => v.ip as string));
  const isMine = (v: VisitRow) => isOwnerEmail(v.email) || ownerVisitors.has(v.visitor_id) || (!!v.ip && ownerIps.has(v.ip));

  // IP ↔ account, from signed-in visits.
  const byIp = new Map<string, { ip: string; country: string | null; emails: Set<string>; lastSeen: string; visits: number }>();
  const ipsByUser = new Map<string, Map<string, string | null>>();
  for (const v of visits) {
    if (!v.ip) continue;
    const row = byIp.get(v.ip) ?? { ip: v.ip, country: v.country, emails: new Set<string>(), lastSeen: v.last_seen_at, visits: 0 };
    row.visits += 1;
    if (v.email) row.emails.add(v.email);
    if (v.last_seen_at > row.lastSeen) row.lastSeen = v.last_seen_at;
    row.country ??= v.country;
    byIp.set(v.ip, row);
    if (v.user_id) {
      const ips = ipsByUser.get(v.user_id) ?? new Map<string, string | null>();
      ips.set(v.ip, v.country);
      ipsByUser.set(v.user_id, ips);
    }
  }
  // Every address, including ones that never signed in ("No account").
  const addresses = [...byIp.values()]
    .map((r) => ({ ip: r.ip, country: r.country, emails: [...r.emails], lastSeen: r.lastSeen, visits: r.visits, shared: r.emails.size > 1 }))
    .sort((a, b) => Number(b.shared) - Number(a.shared) || b.emails.length - a.emails.length || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 300);

  // Before they signed up: visits that ended with nobody signed in.
  const anon = visits.filter((v) => !v.user_id && !v.signed_up);
  const bounced = new Set(anon.filter((v) => v.duration_ms < BOUNCE_MS && v.events.every((e) => PASSIVE.has(e.name))));
  const stayed = anon.filter((v) => !bounced.has(v)).map((v) => v.duration_ms);
  const stops = new Map<Stop, { count: number; leads: Map<string, number> }>();
  for (const v of anon) {
    if (bounced.has(v)) continue;
    const s = stopOf(v);
    const b = stops.get(s) ?? { count: 0, leads: new Map<string, number>() };
    b.count += 1;
    const l = leadIn(v);
    b.leads.set(l, (b.leads.get(l) ?? 0) + 1);
    stops.set(s, b);
  }

  return {
    ipsByUser: Object.fromEntries([...ipsByUser].map(([id, ips]) => [id, [...ips].map(([ip, country]) => ({ ip, country }))])),
    visits: Object.fromEntries(
      (Object.keys(SEGMENTS) as Segment[]).map((key) => {
        const vs = visits.filter((v) => SEGMENTS[key](v, isMine(v)));
        const saw = vs.filter(sawPricing).length;
        const pressed = vs.filter((v) => v.checkout).length;
        return [key, {
      stats: { visits: vs.length, sawPricing: saw, pressedCheckout: pressed, pressedPct: saw ? Math.round((pressed / saw) * 100) : 0 },
      recent: vs.slice(0, RECENT).map((v) => ({
        id: v.id,
        email: v.email,
        owner: isMine(v),
        ip: v.ip,
        country: v.country,
        returning: (first.get(v.visitor_id) ?? v.started_at) < v.started_at,
        checkout: v.checkout,
        signedUp: v.signed_up,
        duration: v.duration_ms,
        at: v.started_at,
        referrer: v.referrer,
        device: v.user_agent,
        events: v.events,
      })),
        }];
      }),
    ) as Record<Segment, { stats: { visits: number; sawPricing: number; pressedCheckout: number; pressedPct: number }; recent: unknown[] }>,
    addresses,
    beforeSignup: {
      visits: anon.length,
      medianStay: median(stayed),
      leftAtOnce: bounced.size,
      list: anon.slice(0, 200).map((v) => ({ id: v.id, ip: v.ip, country: v.country, at: v.started_at, duration: v.duration_ms, events: v.events })),
      longest: Math.max(0, ...anon.map((v) => v.duration_ms)),
      stops: (Object.keys(STOP_LABELS) as Stop[]).map((s) => ({
        key: s,
        label: STOP_LABELS[s],
        count: stops.get(s)?.count ?? 0,
        leads: [...(stops.get(s)?.leads ?? new Map<string, number>())]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([trail, n]) => ({ trail, n })),
      })),
    },
  };
}

/** Escape LIKE wildcards so the search is a plain substring match. */
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * IP ↔ email lookup over the visit log: the emails seen on every IP matching `q`, the IPs seen for every
 * email matching `q`, and the matching visits themselves.
 */
export async function lookupVisits(raw: string) {
  const q = raw.trim().slice(0, 120);
  const db = adminClient();
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const [{ data: byIpHit }, { data: byEmailHit }] = await Promise.all([
    db.from("visits").select("ip").gte("started_at", since).ilike("ip", like(q)).limit(500),
    db.from("visits").select("email").gte("started_at", since).ilike("email", like(q)).limit(500),
  ]);
  const ips = [...new Set((byIpHit ?? []).map((r) => r.ip as string))].slice(0, 50);
  const emails = [...new Set((byEmailHit ?? []).map((r) => r.email as string))].slice(0, 50);
  const [{ data: onIps }, { data: ofEmails }] = await Promise.all([
    ips.length ? db.from("visits").select(COLS).in("ip", ips).order("started_at", { ascending: false }).limit(500) : { data: [] },
    emails.length ? db.from("visits").select(COLS).in("email", emails).order("started_at", { ascending: false }).limit(500) : { data: [] },
  ]);
  const a = (onIps ?? []) as VisitRow[];
  const b = (ofEmails ?? []) as VisitRow[];

  const ipToEmails = ips.map((ip) => {
    const vs = a.filter((v) => v.ip === ip);
    return { ip, country: vs.find((v) => v.country)?.country ?? null, emails: [...new Set(vs.flatMap((v) => (v.email ? [v.email] : [])))] };
  });
  const emailToIps = emails.map((email) => {
    const seen = new Map<string, string | null>();
    for (const v of b) if (v.email === email && v.ip && !seen.has(v.ip)) seen.set(v.ip, v.country);
    return { email, ips: [...seen].map(([ip, country]) => ({ ip, country })) };
  });
  const all = new Map<string, VisitRow>();
  for (const v of [...a, ...b]) all.set(v.id, v);
  const visits = [...all.values()]
    .sort((x, y) => y.started_at.localeCompare(x.started_at))
    .slice(0, 100)
    .map((v) => ({ id: v.id, email: v.email, owner: isOwnerEmail(v.email), ip: v.ip, country: v.country, at: v.started_at, duration: v.duration_ms, events: v.events }));
  return { q, ipToEmails, emailToIps, visits };
}
