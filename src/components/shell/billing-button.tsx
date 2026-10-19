"use client";

import { useState } from "react";
import type { Billing, Tier } from "@/lib/plans";
import { track } from "../analytics/track";
import { openAuth } from "../auth/auth-store";

type Mode = "portal" | "subscribe" | "trial" | "topup";

export function BillingButton({ mode, label, tier = "plus", billing = "week", secondary = false }: { mode: Mode; label?: string; tier?: Exclude<Tier, "free">; billing?: Billing; secondary?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const body =
    mode === "subscribe" ? { kind: "subscription", tier, billing } : mode === "trial" ? { kind: "trial" } : mode === "topup" ? { kind: "topup" } : null;
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async function go() {
          setBusy(true);
          setErr(null);
          if (mode !== "portal") track("checkout_clicked", mode === "subscribe" ? `${tier} ${billing}` : mode);
          const res = await fetch(mode === "portal" ? "/api/billing/portal" : "/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
          });
          const b = await res.json().catch(() => ({}));
          if (res.ok && b.url) window.location.href = b.url;
          else if (b.code === "auth") {
            setBusy(false);
            openAuth(mode === "portal" ? "login" : "signup", { onDone: () => void go() });
          } else {
            setErr(b.error ?? "Something went wrong.");
            setBusy(false);
          }
        }}
        className={`w-full py-3.5 text-[15px] ${secondary || mode === "portal" || mode === "topup" ? "btn-secondary" : "btn-primary"}`}
      >
        {busy ? "Opening" : label ?? (mode === "portal" ? "Manage subscription" : "Upgrade")}
      </button>
      {err && <p className="mt-2 text-center text-[13px] text-coral">{err}</p>}
    </div>
  );
}
