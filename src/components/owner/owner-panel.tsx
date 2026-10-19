"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "../ui/toast";

type Account = { id: string; email: string; provider: string; joined: string; lastIn: string | null; owner: boolean; comp: string | null; subscription: string | null; documents: number };
type Doc = { id: string; file: string; email: string; status: string; error: string | null; ready: number; total: number | null; at: string };
type Data = {
  stats: { accounts: number; paying: number; comped: number; documents: number; readyReels: number };
  deployment: { name: string; on: boolean; hint: string }[];
  accounts: Account[];
  documents: Doc[];
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

/** The owner panel: deployment checklist, accounts (grant plans, delete), and recent documents with their real errors. */
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
    </div>
  );
}
