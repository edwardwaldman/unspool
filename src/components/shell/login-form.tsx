"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "../ui/icons";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error ? "That sign-in link didn't work. Try again." : null);
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  return (
    <div className="w-full max-w-[380px]">
      {sent ? (
        <div className="rounded-2xl bg-white/5 p-5 text-[15px] text-soft">
          Check <b className="text-ink">{email}</b> for your sign-in link. Open it on this device.
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
              if (error) {
                setErr(error.message);
                setBusy(false);
              }
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-3.5 text-[16px] font-bold text-[#0b1020] disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-widest text-muted">
            <div className="h-px flex-1 bg-white/10" /> or email <div className="h-px flex-1 bg-white/10" />
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr(null);
              const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } });
              setBusy(false);
              if (error) setErr(error.message);
              else setSent(true);
            }}
            className="space-y-2.5"
          >
            <input
              type="email"
              required
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-[16px] outline-none focus:border-accent"
            />
            <button type="submit" disabled={busy} className="w-full rounded-2xl bg-accent py-3.5 text-[16px] font-bold text-[#0b1020] disabled:opacity-60">
              {busy ? "Sending…" : "Email me a magic link"}
            </button>
          </form>
        </>
      )}
      {err && <p className="mt-3 text-center text-[13px] text-warn">{err}</p>}
    </div>
  );
}
