"use client";

import { useEffect, useState } from "react";
import { isOwnerEmail } from "@/lib/owner";
import { useSessionUser } from "../auth/use-session";
import { toast } from "../ui/toast";

const VIEWS = [
  ["owner", "Owner"],
  ["out", "Signed out"],
  ["free", "Free"],
  ["plus", "Plus"],
  ["pro", "Pro"],
  ["ultra", "Ultra"],
] as const;
const HIDDEN_KEY = "unspool_owner_box_hidden";

/**
 * TEST: OWNER VIEW. A floating box, only for the owner, to see the site signed out or as a real account
 * of any tier. The server decides (an httpOnly cookie, honoured only for the real owner); this box only
 * asks for the owner check when the session email looks like the owner's.
 */
export function OwnerViewBox() {
  const user = useSessionUser();
  const maybeOwner = Boolean(user && isOwnerEmail(user.email));
  const [view, setView] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!maybeOwner) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(sessionStorage.getItem(HIDDEN_KEY) === "1");
    } catch {}
    let live = true;
    void fetch("/api/owner/view", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { view?: string } | null) => live && setView(b?.view ?? null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [maybeOwner]);

  if (!maybeOwner || !view) return null;
  const hide = (h: boolean) => {
    setHidden(h);
    try {
      sessionStorage.setItem(HIDDEN_KEY, h ? "1" : "0");
    } catch {}
  };
  if (hidden) {
    return (
      <button type="button" onClick={() => hide(false)} className="fixed bottom-3 left-3 z-[80] border border-line bg-[#0b0f0d] px-2.5 py-1 font-mono text-[10.5px] text-[#ff9f43]">
        TEST
      </button>
    );
  }

  const pick = async (v: string) => {
    setBusy(true);
    const res = await fetch("/api/owner/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ view: v }) });
    if (!res.ok) {
      setBusy(false);
      return toast("Couldn't switch the view");
    }
    window.location.reload();
  };
  const resetFree = async () => {
    setBusy(true);
    const res = await fetch("/api/owner/reset-free", { method: "POST" });
    const b = (await res.json().catch(() => ({}))) as { removed?: number };
    setBusy(false);
    toast(res.ok ? `Free document reset (${b.removed ?? 0} upload${b.removed === 1 ? "" : "s"} forgotten)` : "Couldn't reset it");
  };

  return (
    <div className="fixed bottom-3 left-3 z-[80] w-[236px] border border-white/10 bg-[#0b0f0d]/95 p-3 text-[#e9efe9] shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] tracking-wider text-[#ff9f43]">TEST: OWNER VIEW</span>
        <button type="button" onClick={() => hide(true)} className="text-[11.5px] text-white/50 hover:text-white">
          Hide
        </button>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            disabled={busy}
            onClick={() => v !== view && void pick(v)}
            className={`border px-1 py-1.5 text-[11.5px] ${v === view ? "border-[#ff9f43] text-[#ff9f43]" : "border-white/15 hover:border-white/50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button type="button" disabled={busy} onClick={() => void resetFree()} className="mt-2.5 text-[11.5px] text-white/60 underline underline-offset-2 hover:text-white">
        Reset the free document
      </button>
    </div>
  );
}
