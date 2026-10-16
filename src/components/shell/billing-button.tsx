"use client";

import { useState } from "react";

export function BillingButton({ mode, label }: { mode: "portal" | "subscribe"; label?: string }) {
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
        className={`w-full py-3.5 text-[15px] ${mode === "portal" ? "btn-secondary" : "btn-primary"}`}
      >
        {busy ? "Opening" : label ?? (mode === "portal" ? "Manage subscription" : "Go unlimited")}
      </button>
      {err && <p className="mt-2 text-center text-[13px] text-coral">{err}</p>}
    </div>
  );
}
