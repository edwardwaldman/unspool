"use client";

import Link from "next/link";
import type { UserResponse } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabaseConfigured } from "@/lib/config";
import { supabaseBrowser } from "../auth/supabase-browser";
import { openAuth } from "../auth/auth-store";
import { toast } from "../ui/toast";
import { PasswordInput } from "./password-input";
import { PASSWORD_HINT, passwordProblem, withTimeout } from "./password-rules";

/** New password for the signed-in recovery session; no old password needed. */
export function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null | undefined>(supabaseConfigured ? undefined : null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabaseBrowser()
      .then((sb) => sb.auth.getUser() as Promise<UserResponse>)
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  if (email === undefined) return <p className="mt-8 text-[14px] text-muted">Checking your link</p>;
  if (email === null) {
    return (
      <div className="mt-8 border-t border-line pt-6">
        <p className="text-[15px]">This reset link has expired or was already used.</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">Log in and choose &ldquo;Forgot password&rdquo; to get a new one. Links expire in an hour.</p>
        <button type="button" onClick={() => openAuth("login", { next: "/reset" })} className="btn-primary mt-6 w-full py-3.5 text-[15px]">
          Log in
        </button>
      </div>
    );
  }
  if (done) {
    return (
      <div className="mt-8 border-t border-line pt-6">
        <p className="text-[15px]">Your password is changed.</p>
        <p className="mt-1 text-[13.5px] text-muted">You&apos;re signed in as {email}.</p>
        <Link href="/library" className="btn-primary mt-6 w-full py-3.5 text-[15px]">
          Go to your library
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const p = passwordProblem(password);
    const c = !p && confirm !== password ? "The two passwords don't match." : null;
    setPwErr(p);
    setConfirmErr(c);
    if (p || c) return;
    setBusy(true);
    try {
      const { error } = await withTimeout<UserResponse>((await supabaseBrowser()).auth.updateUser({ password }));
      setBusy(false);
      if (error) {
        if (error.code === "same_password") return setPwErr("Pick a password you haven't used here.");
        return setErr(error.message);
      }
      setDone(true);
      toast("Password changed");
    } catch {
      setBusy(false);
      setErr("Couldn't reach the server, try again.");
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 border-t border-line pt-6" noValidate>
      <p className="text-[13.5px] leading-relaxed text-muted">
        For <b className="font-semibold text-ink">{email}</b>. You don&apos;t need your old password.
      </p>
      <input type="email" value={email} autoComplete="username" readOnly hidden />
      <div>
        <PasswordInput
          label="New password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setPwErr(null);
          }}
          autoComplete="new-password"
          invalid={Boolean(pwErr)}
        />
        {pwErr && <p className="mt-2 text-[13px] text-coral">{pwErr}</p>}
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{PASSWORD_HINT}</p>
      </div>
      <div>
        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setConfirmErr(null);
          }}
          autoComplete="new-password"
          invalid={Boolean(confirmErr)}
        />
        {confirmErr && <p className="mt-2 text-[13px] text-coral">{confirmErr}</p>}
      </div>
      {err && <p className="text-[13px] text-coral">{err}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full !border-thread !bg-thread py-3.5 text-[15px] !text-paper">
        {busy ? "Saving" : "Set new password"}
      </button>
    </form>
  );
}
