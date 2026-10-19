"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "../ui/toast";

type Ip = { ip: string; country: string | null };
type Account = { id: string; email: string; provider: string; joined: string; lastIn: string | null; owner: boolean; comp: string | null; subscription: string | null; documents: number; ips: Ip[] };
type TrailEvent = { t: number; name: string; detail?: string };
type Visit = { id: string; email: string | null; ip: string | null; country: string | null; returning: boolean; checkout: boolean; signedUp: boolean; duration: number; at: string; referrer: string | null; device: string | null; events: TrailEvent[] };
type Address = { ip: string; country: string | null; emails: string[]; lastSeen: string; visits: number; shared: boolean };
type BeforeSignup = {
  visits: number;
  medianStay: number;
  leftAtOnce: number;
  longest: number;
  stops: { key: string; label: string; count: number; leads: { trail: string; n: number }[] }[];
};
type Doc = { id: string; file: string; email: string; status: string; error: string | null; ready: number; total: number | null; at: string };
type Data = {
  stats: { accounts: number; paying: number; comped: number; documents: number; readyReels: number };
  deployment: { name: string; on: boolean; hint: string }[];
  accounts: Account[];
  documents: Doc[];
  visits: { stats: { visits: number; sawPricing: number; pressedCheckout: number; pressedPct: number }; recent: Visit[] };
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
    const res = await fetch("/api/owner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast(b.error ?? "That didn't work");
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
      </section>

      <WhatPeopleDid data={data.visits} />
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
            </li>
          ))}
          {!data.documents.length && <li className="py-3 text-[14px] text-muted">No documents yet.</li>}
        </ul>
      </section>

      <HowIpsAndEmailsAreUsed />
    </div>
  );
}

function WhatPeopleDid({ data }: { data: Data["visits"] }) {
  return (
    <section className={card}>
      <h2 className="text-[16px] font-semibold">What people did</h2>
      <p className="mt-1 text-[12.5px] text-muted">Last 90 days. Your own browsing is left out unless you are in a test view.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Visits", data.stats.visits],
            ["Saw upgrade / pricing", data.stats.sawPricing],
            ["Pressed checkout", data.stats.pressedCheckout],
            ["% pressed", `${data.stats.pressedPct}%`],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="border border-line p-3">
            <div className="font-mono text-[22px]">{n}</div>
            <div className="text-[12px] text-muted">{label}</div>
          </div>
        ))}
      </div>
      <ul className={`${scroll} max-h-[560px] divide-y divide-line`}>
        {data.recent.map((v) => (
          <li key={v.id} className="px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {v.email ? <span className="truncate font-mono text-[13px]">{v.email}</span> : null}
              <span className={v.email ? "text-muted" : ""}>
                <IpTag ip={v.ip} country={v.country} />
              </span>
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
        Which accounts signed in from each IP.{" "}
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
            <div className="mt-1 font-mono text-[12px] text-ink/85">{r.emails.join(", ")}</div>
          </li>
        ))}
        {!rows.length && <li className="px-3 py-3 text-[14px] text-muted">No signed-in visits logged yet.</li>}
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
              <span className="font-mono text-[13px]">{s.count}</span>
            </div>
            {s.leads.map((l) => (
              <div key={l.trail} className="mt-0.5 font-mono text-[11.5px] text-muted">
                {l.trail} <span className="text-ink/70">×{l.n}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
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
              is what &quot;Accounts by address&quot; is built from, to spot one person running many free accounts.
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
            <li>It is shown here next to visits made while signed in.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
