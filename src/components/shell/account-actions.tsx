"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { openAuth } from "../auth/auth-store";
import { toast } from "../ui/toast";

export function SignInButtons({ next }: { next: string }) {
  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={() => openAuth("signup", { next })} className="btn-primary w-full py-3.5 text-[15px]">
        Create a free account
      </button>
      <button type="button" onClick={() => openAuth("login", { next })} className="btn-secondary w-full py-3.5 text-[15px]">
        Log in
      </button>
    </div>
  );
}

/** Set a new password. Shown open after a password-reset link (?reset=1). */
export function PasswordForm() {
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("reset") === "1");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full py-3.5 text-[15px]">
        Change password
      </button>
    );
  }
  return (
    <form
      className="border border-line p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        const { error } = await createClient().auth.updateUser({ password });
        setBusy(false);
        if (error) return setErr(error.message);
        setPassword("");
        setOpen(false);
        toast("Password updated");
      }}
    >
      <label className="block">
        <span className="label">New password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="field mt-1.5 w-full px-3.5 py-2.5 text-[14px]"
        />
      </label>
      {err && <p className="mt-2 text-[13px] text-coral">{err}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-3 w-full py-3 text-[14.5px]">
        {busy ? "Saving" : "Save password"}
      </button>
    </form>
  );
}

export function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Delete your account, every document, reel and audio file? Any subscription is cancelled. This can't be undone.")) return;
        setBusy(true);
        const res = await fetch("/api/account", { method: "DELETE" });
        if (res.ok) {
          await createClient().auth.signOut().catch(() => undefined);
          window.location.href = "/";
        } else {
          const b = await res.json().catch(() => ({}));
          toast(b.error ?? "Couldn't delete your account.", 4000);
          setBusy(false);
        }
      }}
      className="w-full py-3 text-[13.5px] text-coral hover:underline"
    >
      {busy ? "Deleting" : "Delete account"}
    </button>
  );
}

/** Back from Stripe Checkout on a page without a spool (e.g. a subscription from Pricing): confirm and refresh. */
export function CheckoutReturn() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("checkout_session");
  const done = useRef(false);
  useEffect(() => {
    if (!sessionId || done.current) return;
    done.current = true;
    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((b: { fulfilled?: boolean; kind?: string }) => {
        if (b.fulfilled) toast(b.kind === "subscription" ? "You're unlimited. Every reel is unlocked." : "Unlocked.", 3500);
      })
      .catch(() => undefined)
      .finally(() => {
        router.replace(window.location.pathname, { scroll: false });
        router.refresh();
      });
  }, [sessionId, router]);
  return null;
}
