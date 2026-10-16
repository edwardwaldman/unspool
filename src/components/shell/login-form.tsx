"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { openAuth } from "../auth/auth-store";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error ? "That sign-in link didn't work. Try again." : null);
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  return (
    <div className="w-full max-w-[380px]">
      {sent ? (
        <div className="border border-line p-5 text-[15px] text-ink/85">
          Sign-in link sent to <span className="text-ink">{email}</span>. Open it on this device.
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
            className="btn-primary w-full py-3.5 text-[15px]"
          >
            Continue with Google
          </button>
          <div className="label my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" /> or email <div className="h-px flex-1 bg-line" />
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
          >
            <input
              type="email"
              required
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field w-full px-4 py-3.5 text-[16px]"
            />
            <button type="submit" disabled={busy} className="btn-secondary -mt-px w-full py-3.5 text-[15px]">
              {busy ? "Sending" : "Email me a sign-in link"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => openAuth("login", { next, onDone: () => (window.location.href = next) })}
            className="mt-4 w-full text-center text-[13.5px] text-thread hover:underline"
          >
            Use email and password
          </button>
        </>
      )}
      {err && <p className="mt-3 text-center text-[13px] text-coral">{err}</p>}
    </div>
  );
}
