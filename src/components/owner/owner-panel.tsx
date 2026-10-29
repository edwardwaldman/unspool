"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "../ui/toast";

type Ip = { ip: string; country: string | null };
type Account = { id: string; email: string; provider: string; joined: string; lastIn: string | null; owner: boolean; comp: string | null; subscription: string | null; documents: number; ips: Ip[] };
type TrailEvent = { t: number; name: string; detail?: string };
type Visit = { id: string; email: string | null; owner: boolean; ip: string | null; country: string | null; returning: boolean; checkout: boolean; signedUp: boolean; duration: number; at: string; referrer: string | null; device: string | null; events: TrailEvent[] };
type Address = { ip: string; country: string | null; emails: string[]; lastSeen: string; visits: number; shared: boolean };
type BeforeSignup = {
  visits: number;
  medianStay: number;
  leftAtOnce: number;
  longest: number;
  list: { id: string; ip: string | null; country: string | null; at: string; duration: number; events: TrailEvent[] }[];
  stops: { key: string; label: string; count: number; leads: { trail: string; n: number }[] }[];
};
type DocReel = { id: string; index: number; title: string; status: string; error: string | null; attempts: number; at: string };
type Doc = { id: string; file: string; email: string; status: string; error: string | null; ready: number; total: number | null; at: string; reels: DocReel[] };
type Lookup = {
  q: string;
  ipToEmails: { ip: string; country: string | null; emails: string[] }[];
  emailToIps: { email: string; ips: Ip[] }[];
  visits: { id: string; email: string | null; owner: boolean; ip: string | null; country: string | null; at: string; duration: number; events: TrailEvent[] }[];
};
type Outcomes = {
  groups: { key: string; count: number; accounts: { email: string; tier: string | null; interval: string | null; trialUsed: boolean; comp: string | null }[] }[];
  checkout: { pressed: number; trialing: number; paying: number };
};
type Data = {
  build: string;
  openAccess: boolean;
  stats: { accounts: number; paying: number; comped: number; documents: number; readyReels: number };
  deployment: { name: string; on: boolean; hint: string }[];
  accounts: Account[];
  documents: Doc[];
  visits: Record<Segment, { stats: { visits: number; sawPricing: number; pressedCheckout: number; pressedPct: number }; recent: Visit[] }>;
  addresses: Address[];
  beforeSignup: BeforeSignup;
};

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};
const TIERS = ["free", "plus", "pro", "ultra"] as const;
const card = "border border-line bg-surface p-5";
const scroll = "mt-3 overflow-y-auto border border-line bg-paper/40";

/** 3m 12s / 45s / 1h 4m. */
const stay = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

const EVENT_LABELS: Record<string, string> = {
  open: "Open new",
  page: "Page",
  upload_started: "Upload started",
  upload_done: "Upload done",
  signup_shown: "Signup shown",
  signup_closed: "Signup closed",
  signup_done: "Account created",
  login_shown: "Login shown",
  login: "Logged in",
  checkout_clicked: "Checkout",
  demo_gate: "Demo gate",
  watch_demo: "Watched demo",
  reel_viewed: "Reel",
  idle: "Idle 60s",
  close: "Closed",
};
const eventTone = (name: string) =>
  name.startsWith("upload") ? "text-sage" : name === "checkout_clicked" ? "text-thread" : name === "signup_done" ? "text-sage" : name === "signup_closed" ? "text-coral" : "text-ink/80";

/** IP in monospace with its country code. */
function IpTag({ ip, country }: { ip: string | null; country: string | null }) {
  return (
    <span className="font-mono text-[12.5px]">
      {ip ?? "no IP"}
      {country && <span className="ml-1.5 border border-line px-1 text-[10.5px] text-muted">{country}</span>}
    </span>
  );
}

/** `Open new → Page /pricing → Upload started → …`, repeated events folded together. */
function Trail({ events }: { events: TrailEvent[] }) {
  const folded: { e: TrailEvent; n: number }[] = [];
  for (const e of events) {
    const last = folded[folded.length - 1];
    if (last && last.e.name === e.name && last.e.detail === e.detail) last.n += 1;
    else folded.push({ e, n: 1 });
  }
  return (
    <div className="mt-1.5 text-[12.5px] leading-[1.6]">
      {folded.map(({ e, n }, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted"> → </span>}
          <span className={eventTone(e.name)}>
            {EVENT_LABELS[e.name] ?? e.name}
            {e.detail && <span className="font-mono text-[11.5px]"> {e.detail}</span>}
            {n > 1 && <span className="text-muted"> ×{n}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}

/** POST an owner action; toasts the error and returns null when it fails. */
async function post<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch("/api/owner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const b = await res.json().catch(() => ({}));
  // The Face ID unlock ran out: back to the door.
  if (res.status === 403 && b.code === "locked") {
    window.location.replace("/owner/unlock");
    return null;
  }
  if (!res.ok) {
    toast(b.error ?? "That didn't work");
    return null;
  }
  return b as T;
}

const Badge = ({ children, tone }: { children: React.ReactNode; tone: string }) => (
  <span className={`border px-1.5 font-mono text-[10.5px] ${tone}`}>{children}</span>
);

/**
 * The owner panel: deployment checklist, what visitors did, accounts by address, where people stopped
 * before signing up, accounts (grant plans, delete), and recent documents with their real errors.
 */
export function OwnerPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/owner", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.code === "locked") return window.location.replace("/owner/unlock");
    if (!res.ok) return setErr(body.error ?? "Couldn't load the panel");
    setErr(null);
    setData(body);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const act = async (body: Record<string, string>, done: string) => {
    setBusy(body.userId);
    const b = await post(body);
    setBusy(null);
    if (!b) return;
    toast(done);
    void load();
  };

  if (err) return <p className="p-10 text-coral">{err}</p>;
  if (!data) return <p className="p-10 text-muted">Loading the owner panel…</p>;
  const sharedIps = new Set(data.addresses.filter((r) => r.shared).map((r) => r.ip));
  const shown = data.accounts.filter((a) => a.email.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5 px-5 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[34px] leading-none">Owner</h1>
        <button type="button" onClick={() => void load()} className="btn-secondary px-4 py-2 text-[14px]">
          Refresh
        </button>
      </div>

      <section className={card}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Accounts", data.stats.accounts],
              ["Paying", data.stats.paying],
              ["Comped", data.stats.comped],
              ["Documents", data.stats.documents],
              ["Reels made", data.stats.readyReels],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="border border-line p-3">
              <div className="font-mono text-[22px]">{n}</div>
              <div className="text-[12px] text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-[16px] font-semibold">Deployment status</h2>
        <ul className="mt-3 space-y-2">
          {data.deployment.map((d) => (
            <li key={d.name} className="flex gap-3 text-[14px]">
              <span className={`w-8 shrink-0 font-mono text-[11px] leading-[20px] ${d.on ? "text-sage" : "text-coral"}`}>{d.on ? "ON" : "OFF"}</span>
              <span>
                {d.name}
                {!d.on && <span className="block text-[12.5px] text-muted">{d.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
        <TestEmail />
      </section>

      <OpenAccess on={data.openAccess} onChange={() => void load()} />
      <IpEmailLookup />
      <WhatPeopleDid data={data.visits} build={data.build} />
      <BeforeTheySignedUp data={data.beforeSignup} />
      <AccountsByAddress rows={data.addresses} />
      <section className={card}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-semibold">Accounts ({data.accounts.length})</h2>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by email" className="field mt-3 w-full px-3 py-2.5 text-[15px]" />
        <ul className="mt-3 max-h-[520px] divide-y divide-line overflow-y-auto">
          {shown.map((a, i) => (
            <li key={a.id} className="py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-[13.5px]">
                  <span className="text-muted">#{i + 1} </span>
                  {a.email}
                </span>
                {a.owner && <span className="border border-thread px-1.5 font-mono text-[10.5px] text-thread">OWNER</span>}
              </div>
              <div className="mt-1 text-[12.5px] text-muted">
                {a.provider === "google" ? "Google" : "Email"} · Joined {new Date(a.joined).toLocaleDateString()} · Last in {ago(a.lastIn)} · {a.documents} docs
              </div>
              <div className="mt-1 text-[12.5px] text-muted">Subscription: {a.owner ? "Owner (unlimited)" : a.subscription ?? "None"}</div>
              {a.ips.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  IPs
                  {a.ips.map((ip) => (
                    <span key={ip.ip} className={sharedIps.has(ip.ip) ? "text-coral" : "text-ink/85"}>
                      <IpTag {...ip} />
                    </span>
                  ))}
                </div>
              )}
              {!a.owner && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] text-muted">Plan</span>
                  {TIERS.map((t) => {
                    const on = (a.comp ?? "free") === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => void act({ action: "plan", userId: a.id, tier: t }, t === "free" ? "Back to Free" : `Gave ${t}`)}
                        className={`border px-3 py-1 text-[13px] capitalize ${on ? "border-sage text-sage" : "border-line hover:border-ink"}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={busy === a.id}
                    onClick={() => {
                      if (window.confirm(`Delete ${a.email}, their documents and reels? This can't be undone.`)) void act({ action: "delete", userId: a.id }, "Account deleted");
                    }}
                    className="ml-auto border border-coral px-3 py-1 text-[13px] text-coral"
                  >
                    Delete account
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-[16px] font-semibold">Recent documents</h2>
        <ul className="mt-3 max-h-[560px] divide-y divide-line overflow-y-auto">
          {data.documents.map((d) => (
            <li key={d.id} className="py-3">
              <div className="flex items-center justify-between gap-3 text-[14px]">
                <a href={`/s/${d.id}`} className="truncate font-medium hover:text-thread">
                  {d.file}
                </a>
                <span className={`shrink-0 font-mono text-[11.5px] ${d.status === "failed" ? "text-coral" : d.status === "ready" ? "text-sage" : "text-muted"}`}>
                  {d.status} · {d.ready}/{d.total ?? "?"}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[12px] text-muted">
                {d.email} · {ago(d.at)}
              </div>
              {d.error && <pre className="mt-2 whitespace-pre-wrap break-words border border-coral/40 bg-coral/5 p-2 font-mono text-[11.5px] text-coral">{d.error}</pre>}
              {d.reels.length > 0 && (
                <details className="mt-2" data-testid="owner-doc-reels">
                  <summary className="cursor-pointer font-mono text-[12px] text-thread">Reels ({d.reels.length})</summary>
                  <ol className="mt-1.5 divide-y divide-line border-y border-line">
                    {d.reels.map((r) => (
                      <li key={r.id} className="py-1.5">
                        <div className="flex items-center gap-3 text-[13px]">
                          <span className="w-6 shrink-0 font-mono text-[11.5px] text-muted">{r.index}</span>
                          <a href={`/s/${d.id}?reel=${r.index}`} className="min-w-0 flex-1 truncate hover:text-thread">
                            {r.title}
                          </a>
                          <span className={`shrink-0 font-mono text-[11px] ${r.status === "failed" ? "text-coral" : r.status === "ready" ? "text-sage" : r.status === "generating" ? "text-thread" : "text-muted"}`}>
                            {r.status}
                            {r.attempts > 1 ? ` · ${r.attempts} tries` : ""} · {ago(r.at)}
                          </span>
                        </div>
                        {r.error && r.status !== "ready" && <pre className="ml-9 mt-1 whitespace-pre-wrap break-words font-mono text-[11px] text-coral">{r.error.slice(0, 400)}</pre>}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
          {!data.documents.length && <li className="py-3 text-[14px] text-muted">No documents yet.</li>}
        </ul>
      </section>

      <TrialOutcomes />
      <Broadcast />
      <HowIpsAndEmailsAreUsed />
    </div>
  );
}

type Segment = "external" | "tiktok" | "instagram" | "youtube" | "google" | "all";
const SEGMENT_LABELS: [Segment, string][] = [["external", "Not me"], ["tiktok", "TikTok"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["google", "Google"], ["all", "All"]];

function WhatPeopleDid({ data: bySegment, build }: { data: Data["visits"]; build: string }) {
  const [seg, setSeg] = useState<Segment>("external");
  const data = bySegment[seg] ?? bySegment.all;
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">What people did</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        Last 90 days. {seg === "all" ? "Your own visits included (marked OWNER)." : "Your own visits left out: signed in as you, or the same browser or network as one that was."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter visits">
        {SEGMENT_LABELS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSeg(key)}
            aria-pressed={seg === key}
            className={`border px-3 py-1.5 text-[13px] ${seg === key ? "border-thread text-thread" : "border-line text-muted hover:text-ink"}`}
          >
            {label} <span className="font-mono text-[11.5px] opacity-70">{bySegment[key]?.stats.visits ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Visits", data.stats.visits],
            ["Saw the offer", data.stats.sawPricing],
            ["Pressed checkout", data.stats.pressedCheckout],
            ["% of them pressed", `${data.stats.pressedPct}%`],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="border border-line p-3">
            <div className="font-mono text-[22px]">{n}</div>
            <div className="text-[12px] text-muted">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[11.5px] text-muted">Build {build}</p>
      <ul className={`${scroll} max-h-[560px] divide-y divide-line`}>
        {data.recent.map((v) => (
          <li key={v.id} className="px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {v.email ? <span className="truncate font-mono text-[13px]">{v.email}</span> : null}
              <span className={v.email ? "text-muted" : ""}>
                <IpTag ip={v.ip} country={v.country} />
              </span>
              {v.owner && <Badge tone="border-thread text-thread">OWNER</Badge>}
              {v.returning && <Badge tone="border-line text-muted">RETURNING</Badge>}
              {v.signedUp && <Badge tone="border-sage text-sage">SIGNED UP</Badge>}
              {v.checkout && <Badge tone="border-thread text-thread">CHECKOUT</Badge>}
              <span className="ml-auto font-mono text-[11.5px] text-muted" title={new Date(v.at).toLocaleString()}>
                {stay(v.duration)} · {ago(v.at)}
              </span>
            </div>
            <Trail events={v.events} />
            {v.referrer && <div className="mt-1 truncate font-mono text-[11px] text-muted">from {v.referrer}</div>}
          </li>
        ))}
        {!data.recent.length && <li className="px-3 py-3 text-[14px] text-muted">No visits logged yet.</li>}
      </ul>
    </section>
  );
}

function AccountsByAddress({ rows }: { rows: Address[] }) {
  const shared = rows.filter((r) => r.shared).length;
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">Accounts by address</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        Every IP seen, with the accounts that signed in from it.{" "}
        {shared ? <span className="text-coral">{shared} address{shared === 1 ? "" : "es"} with more than one account: possible free-plan farming.</span> : "No address has more than one account."}
      </p>
      <ul className={`${scroll} max-h-[420px] divide-y divide-line`}>
        {rows.map((r) => (
          <li key={r.ip} className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <IpTag ip={r.ip} country={r.country} />
              {r.shared && <Badge tone="border-coral text-coral">{r.emails.length} ACCOUNTS</Badge>}
              <span className="ml-auto font-mono text-[11.5px] text-muted">
                {r.visits} visit{r.visits === 1 ? "" : "s"} · {ago(r.lastSeen)}
              </span>
            </div>
            <div className={`mt-1 font-mono text-[12px] ${!r.emails.length ? "text-muted" : r.emails.length > 1 ? "text-thread" : "text-ink/85"}`}>
              {r.emails.length ? r.emails.join(", ") : "No account"}
            </div>
          </li>
        ))}
        {!rows.length && <li className="px-3 py-3 text-[14px] text-muted">No visits logged yet.</li>}
      </ul>
    </section>
  );
}

function BeforeTheySignedUp({ data }: { data: BeforeSignup }) {
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">Before they signed up</h2>
      <p className="mt-1 text-[12.5px] text-muted">{data.visits} visits that ended with nobody signed in.</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {(
          [
            ["Median stay (who stayed)", stay(data.medianStay)],
            ["Left at once", data.leftAtOnce],
            ["Longest", stay(data.longest)],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="border border-line p-3">
            <div className="font-mono text-[20px]">{n}</div>
            <div className="text-[12px] text-muted">{label}</div>
          </div>
        ))}
      </div>
      <h3 className="mt-4 text-[13px] font-semibold">Where they stopped</h3>
      <ul className={`${scroll} max-h-[420px] divide-y divide-line`}>
        {data.stops.map((s) => (
          <li key={s.key} className="px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span>{s.label}</span>
              <span className={`font-mono text-[13px] ${!s.count ? "text-muted" : STOP_TONE[s.key] ?? "text-ink"}`}>{s.count}</span>
            </div>
            {s.leads.map((l) => (
              <div key={l.trail} className="mt-0.5 font-mono text-[11.5px] text-muted">
                {l.trail} <span className="text-ink/70">×{l.n}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-[13px] font-semibold">Each visit ({data.list.length})</h3>
      <ul className={`${scroll} max-h-[460px] divide-y divide-line`}>
        {data.list.map((v) => (
          <li key={v.id} className="px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <IpTag ip={v.ip} country={v.country} />
              <span className="ml-auto font-mono text-[11.5px] text-muted">
                {stay(v.duration)} · {new Date(v.at).toLocaleString()}
              </span>
            </div>
            <FoldedTrail events={v.events} />
          </li>
        ))}
        {!data.list.length && <li className="px-3 py-3 text-[14px] text-muted">No signed-out visits yet.</li>}
      </ul>
    </section>
  );
}

const STOP_TONE: Record<string, string> = {
  closed_signup: "text-thread",
  ignored_signup: "text-thread",
  uploaded_left: "text-coral",
  sat_still: "text-coral",
  looked_left: "text-muted",
};

/** "▸ Page /pricing…", opening to the full trail. */
function FoldedTrail({ events }: { events: TrailEvent[] }) {
  const [open, setOpen] = useState(false);
  const first = events.find((e) => e.name !== "open") ?? events[0];
  if (!first) return null;
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-left text-[12.5px] text-muted hover:text-ink">
        {open ? "▾" : "▸"} {EVENT_LABELS[first.name] ?? first.name}
        {first.detail && <span className="font-mono text-[11.5px]"> {first.detail}</span>}
        {!open && events.length > 1 && "…"}
      </button>
      {open && <Trail events={events} />}
    </div>
  );
}

/** Deployment status: send one test email to check Resend works. */
function TestEmail() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const b = await post({ action: "test_email", to: to.trim() });
        setBusy(false);
        if (b) toast(`Test email sent to ${to.trim()}`);
      }}
    >
      <input value={to} onChange={(e) => setTo(e.target.value)} type="email" placeholder="Address to test, e.g. you@gmail.com" className="field min-w-0 flex-1 px-3 py-2 text-[14px]" />
      <button type="submit" disabled={busy || !to.trim()} className="btn-secondary shrink-0 px-4 py-2 text-[14px]">
        {busy ? "Sending…" : "Send test"}
      </button>
    </form>
  );
}

/** Take the walls down: lift the one-free-document limit for everyone. */
function OpenAccess({ on, onChange }: { on: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className={card}>
      <div className="flex items-center gap-2">
        <h2 className="text-[16px] font-semibold">Open access</h2>
        <Badge tone={on ? "border-thread text-thread" : "border-sage text-sage"}>{on ? "OPEN" : "NORMAL"}</Badge>
      </div>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-ink/85">
        Normally every free account gets <b>1 document</b>, ever, and more needs a paid plan (Plus, Pro or Ultra). Open access takes that wall down: anyone signed in
        can unspool more documents and the &quot;used your free document&quot; banner is hidden. Accounts are still required, the daily upload caps and reel credits
        still apply, and nothing about what data is collected changes.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!on && !window.confirm("Lift the 1-free-document limit for everyone? AI costs will rise with use.")) return;
          setBusy(true);
          const b = await post({ action: "open_access", on: !on });
          setBusy(false);
          if (b) {
            toast(on ? "Back to normal limits" : "Open access is on");
            onChange();
          }
        }}
        className={`mt-3 border px-4 py-2 text-[14px] ${on ? "border-sage text-sage" : "border-thread text-thread"}`}
      >
        {on ? "Put the walls back up" : "Take the walls down"}
      </button>
    </section>
  );
}

/** Type an IP or an email (or part of one): who used that address, and where that person came from. */
function IpEmailLookup() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Lookup | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (term: string) => {
    setQ(term);
    setBusy(true);
    const r = await fetch(`/api/owner?lookup=${encodeURIComponent(term.trim())}`, { cache: "no-store" });
    const b = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(b.error ?? "Lookup failed");
    setRes(b);
  };
  const Pick = ({ v, className = "" }: { v: string; className?: string }) => (
    <button type="button" onClick={() => void run(v)} className={`font-mono text-[12.5px] underline-offset-2 hover:text-thread hover:underline ${className}`}>
      {v}
    </button>
  );
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">IP ↔ email lookup</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) void run(q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="An IP or an email, or part of one" className="field min-w-0 flex-1 px-3 py-2 text-[14px]" />
        <button type="submit" disabled={busy || q.trim().length < 2} className="btn-secondary shrink-0 px-4 py-2 text-[14px]">
          {busy ? "Looking…" : "Look up"}
        </button>
      </form>
      {res && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-line p-3">
              <h3 className="label">IP → emails</h3>
              <ul className="mt-2 space-y-1.5">
                {res.ipToEmails.map((r) => (
                  <li key={r.ip}>
                    <Pick v={r.ip} />
                    {r.country && <span className="ml-1.5 border border-line px-1 font-mono text-[10.5px] text-muted">{r.country}</span>}
                    <div className="flex flex-wrap gap-x-3 pl-3">
                      {r.emails.length ? r.emails.map((e) => <Pick key={e} v={e} className={r.emails.length > 1 ? "text-thread" : "text-ink/85"} />) : <span className="text-[12.5px] text-muted">No account</span>}
                    </div>
                  </li>
                ))}
                {!res.ipToEmails.length && <li className="text-[12.5px] text-muted">No IP matches.</li>}
              </ul>
            </div>
            <div className="border border-line p-3">
              <h3 className="label">Email → IPs</h3>
              <ul className="mt-2 space-y-1.5">
                {res.emailToIps.map((r) => (
                  <li key={r.email}>
                    <Pick v={r.email} />
                    <div className="flex flex-wrap gap-x-3 pl-3">
                      {r.ips.map((ip) => (
                        <span key={ip.ip}>
                          <Pick v={ip.ip} className="text-ink/85" />
                          {ip.country && <span className="ml-1 text-[10.5px] text-muted">{ip.country}</span>}
                        </span>
                      ))}
                      {!r.ips.length && <span className="text-[12.5px] text-muted">No IP logged</span>}
                    </div>
                  </li>
                ))}
                {!res.emailToIps.length && <li className="text-[12.5px] text-muted">No email matches.</li>}
              </ul>
            </div>
          </div>
          <ul className={`${scroll} max-h-[420px] divide-y divide-line`}>
            {res.visits.map((v) => (
              <li key={v.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {v.email && <span className="font-mono text-[12.5px]">{v.email}</span>}
                  {v.owner && <Badge tone="border-thread text-thread">OWNER</Badge>}
                  <span className="text-muted">
                    <IpTag ip={v.ip} country={v.country} />
                  </span>
                  <span className="ml-auto font-mono text-[11.5px] text-muted">
                    {stay(v.duration)} · {new Date(v.at).toLocaleString()}
                  </span>
                </div>
                <Trail events={v.events} />
              </li>
            ))}
            {!res.visits.length && <li className="px-3 py-3 text-[14px] text-muted">No visits match &quot;{res.q}&quot;.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}

const OUTCOME_LABELS: Record<string, [string, string]> = {
  trialing: ["On a trial", "text-thread"],
  active: ["Paying", "text-sage"],
  past_due: ["Payment failing", "text-coral"],
  canceled: ["Cancelled", "text-coral"],
  none: ["No subscription", "text-muted"],
};

/** Where trials and checkouts ended up, from the profiles Stripe keeps up to date. */
function TrialOutcomes() {
  const [data, setData] = useState<Outcomes | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className={card}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold">Trial outcomes</h2>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setData(await post<Outcomes>({ action: "outcomes" }));
            setBusy(false);
          }}
          className="btn-secondary px-4 py-1.5 text-[14px]"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </div>
      {data && (
        <>
          <p className="mt-2 text-[13.5px] text-ink/85">
            {data.checkout.pressed} account{data.checkout.pressed === 1 ? "" : "s"} pressed checkout in the last 90 days: <span className="text-sage">{data.checkout.paying} paying</span>,{" "}
            <span className="text-thread">{data.checkout.trialing} on a trial</span>, {data.checkout.pressed - data.checkout.paying - data.checkout.trialing} neither.
          </p>
          <ul className="mt-3 divide-y divide-line border border-line">
            {data.groups.map((g) => {
              const [label, tone] = OUTCOME_LABELS[g.key] ?? [g.key, "text-ink"];
              return (
                <li key={g.key} className="px-3 py-2.5">
                  <div className="flex items-baseline justify-between text-[13.5px]">
                    <span>
                      {label} <span className="font-mono text-[11px] text-muted">{g.key}</span>
                    </span>
                    <span className={`font-mono ${g.count ? tone : "text-muted"}`}>{g.count}</span>
                  </div>
                  {g.key === "none" && g.accounts.length > 0 && <div className="mt-0.5 text-[11.5px] text-muted">Used their trial, no subscription now:</div>}
                  {g.accounts.map((a) => (
                    <div key={a.email} className="mt-0.5 font-mono text-[11.5px] text-ink/80">
                      {a.email} <span className="text-muted">· {a.tier ?? "plus"} · {a.interval === "year" ? "yearly" : "weekly"}{a.comp ? ` · comped ${a.comp}` : ""}</span>
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Email account holders: each message individually addressed, sent through Resend in batches of 100. */
function Broadcast() {
  const [aud, setAud] = useState<{ everyone: number; updates: number; configured: boolean } | null>(null);
  const [who, setWho] = useState<"updates" | "everyone">("updates");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const n = aud ? aud[who] : 0;
  return (
    <section className={card}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold">Broadcast</h2>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setAud(await post({ action: "audience" }));
            setBusy(false);
          }}
          className="btn-secondary px-4 py-1.5 text-[14px]"
        >
          Audience
        </button>
      </div>
      {aud && (
        <div className="mt-3 space-y-3">
          {!aud.configured && <p className="text-[13px] text-coral">RESEND_API_KEY isn&apos;t set: nothing can be sent yet.</p>}
          <div className="flex flex-wrap gap-2 text-[13px]">
            {(
              [
                ["updates", `Product update · opted in (${aud.updates})`],
                ["everyone", `Important notice · every account (${aud.everyone})`],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setWho(k)} className={`border px-3 py-1 ${who === k ? "border-sage text-sage" : "border-line hover:border-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-muted">
            Product news goes only to people who ticked the updates box at sign-up. Use &quot;every account&quot; only for service notices (terms, outages, changes to
            their account), as the privacy policy says.
          </p>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={200} className="field w-full px-3 py-2 text-[14px]" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (plain text; blank lines make paragraphs)" rows={7} className="field w-full px-3 py-2 text-[14px]" />
          <p className="text-[12px] text-muted">Footer added: &quot;You&apos;re getting this because you have an Unspool account.&quot;</p>
          <div className="flex gap-2">
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type SEND" className="field w-32 px-3 py-2 font-mono text-[14px]" />
            <button
              type="button"
              disabled={busy || confirm !== "SEND" || !subject.trim() || !message.trim() || !n}
              onClick={async () => {
                setBusy(true);
                const b = await post<{ sent: number; failed: number }>({ action: "broadcast", audience: who, subject, message, confirm });
                setBusy(false);
                if (!b) return;
                toast(b.failed ? `Sent to ${b.sent}, ${b.failed} failed` : `Sent to ${b.sent} people`);
                setConfirm("");
              }}
              className="flex-1 border border-coral px-4 py-2 text-[14px] text-coral disabled:opacity-40"
            >
              {busy ? "Sending…" : `Send to ${n} ${n === 1 ? "person" : "people"}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Plain-English summary of what the code does with an IP address and an email address. */
function HowIpsAndEmailsAreUsed() {
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">How IPs and emails are used</h2>
      <div className="mt-3 grid gap-4 text-[13.5px] leading-[1.55] text-ink/85 sm:grid-cols-2">
        <div>
          <h3 className="label">An IP address</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>
              <b>Free limits.</b> Each upload and retry is written to a ledger (usage_events) with a salted SHA-256 hash of the IP, never the raw IP. Free accounts are
              capped per account <i>or</i> per IP hash each day, so making new accounts on one connection doesn&apos;t reset the limit.
            </li>
            <li>
              <b>Free reels.</b> A document with no account is paid for under its IP hash (stored on the document), so the free reel allowance can&apos;t be farmed by
              clearing cookies.
            </li>
            <li>
              <b>This visit log.</b> The raw IP and approximate country (from Vercel) are kept with each visit for 90 days, then deleted by the nightly cleanup. It
              is what &quot;Accounts by address&quot; and the IP ↔ email lookup are built from, to spot one person running many free accounts.
            </li>
            <li>The hashed ledger is cleared after 3 days; anonymous documents are deleted after 7 days if never unlocked.</li>
          </ul>
        </div>
        <div>
          <h3 className="label">An email address</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>
              <b>Logging in.</b> It is the account&apos;s identity in Supabase Auth (password, Google, or an email link).
            </li>
            <li>
              <b>Sign-up code.</b> New password accounts get a 6-digit code by email to confirm the address.
            </li>
            <li>
              <b>Receipts.</b> It is given to Stripe when the account first checks out, for receipts and the billing portal.
            </li>
            <li>
              <b>Owner check.</b> The server compares it to the owner list to open this panel and the test view.
            </li>
            <li>
              <b>Linking uploads.</b> On sign-in, documents uploaded in this browser before having an account (matched by the anonymous cookie, not the email)
              are moved into the account.
            </li>
            <li>It is shown here next to visits made while signed in, and can be looked up against the IPs it used.</li>
            <li>
              <b>Broadcasts.</b> From this panel, product updates go only to accounts that opted in at sign-up; service notices can go to every account. Each
              email is sent through Resend to one address at a time, never with other recipients visible.
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-muted">Open access only lifts the 1-free-document limit; it doesn&apos;t change what is collected or how it is used.</p>
    </section>
  );
}
