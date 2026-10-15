"use client";

import { useState } from "react";

export function BillingButton({ mode }: { mode: "portal" | "subscribe" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          const res = await fetch(mode === "portal" ? "/api/billing/portal" : "/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: mode === "subscribe" ? JSON.stringify({ kind: "subscription" }) : undefined,
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.url) window.location.href = body.url;
          else {
            setErr(body.code === "auth" ? "Sign in first." : body.error ?? "Something went wrong.");
            setBusy(false);
          }
        }}
        className={`w-full rounded-2xl py-3.5 text-[16px] font-extrabold disabled:opacity-60 ${
          mode === "portal" ? "bg-white/10" : "bg-white text-[#0b1020]"
        }`}
      >
        {busy ? "Opening…" : mode === "portal" ? "Manage subscription" : "Go unlimited"}
      </button>
      {err && <p className="mt-2 text-center text-[13px] text-warn">{err}</p>}
    </div>
  );
}
