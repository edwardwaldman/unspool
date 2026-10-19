"use client";

import Link from "next/link";
import type { AuthError, AuthTokenResponsePassword, UserResponse } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { openAuth } from "../auth/auth-store";
import { toast } from "../ui/toast";
import { closeAccount, useAccountModal } from "./account-store";
import { PasswordInput } from "./password-input";
import { PASSWORD_HINT, passwordProblem, withTimeout } from "./password-rules";

export type AccountInfo = {
  email: string | null;
  plan: string;
  tier: "free" | "plus" | "pro" | "ultra";
  accountNumber: number | null;
  provider: string;
  hasPassword: boolean;
  hasBilling: boolean;
};

const UNREACHABLE = "Couldn't reach the server, try again.";
const fieldLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted";
const helper = "mt-2.5 text-[13px] leading-relaxed text-muted";
const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

/** The Manage account popup. Mounted once in AppShell; open it with openAccount(). */
export function AccountModal() {
  const open = useAccountModal();
  if (!open) return null;
  return <AccountDialog />;
}

function AccountDialog() {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAccount();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/account")
      .then(async (r) => {
        const b = await r.json().catch(() => ({}));
        if (!live) return;
        if (r.ok) return setInfo(b as AccountInfo);
        if (b.code === "auth") {
          closeAccount();
          return openAuth("login");
        }
        setLoadErr(b.error ?? "Couldn't load your account.");
      })
      .catch(() => live && setLoadErr(UNREACHABLE));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-paper/80" onClick={closeAccount} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="account-title"
        className="relative max-h-[94dvh] w-full max-w-[480px] overflow-y-auto border border-line border-t-2 border-t-thread bg-surface px-5 pb-7 pt-6 sm:px-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="account-title" className="font-display text-[26px] leading-tight">
              Manage account
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">
              {info ? (
                <>
                  Current plan: <span className="text-ink">{info.plan}</span>
                  {info.accountNumber != null && <> · Account #{info.accountNumber.toLocaleString("en-US")}</>}
                </>
              ) : loadErr ? (
                <span className="text-coral">{loadErr}</span>
              ) : (
                "Loading your account"
              )}
            </p>
          </div>
          <button type="button" onClick={closeAccount} className="shrink-0 py-1 text-[14px] text-muted hover:text-ink">
            Cancel
          </button>
        </div>

        {info?.email && <AccountSections info={info} email={info.email} />}
      </div>
    </div>
  );
}

function AccountSections({ info, email }: { info: AccountInfo; email: string }) {
  return (
    <>
      <EmailSection email={email} />
      <hr className="my-7 border-line" />
      <PasswordSection email={email} />
      <SubscriptionLink info={info} />
      <hr className="my-7 border-line" />
      <DangerZone />
    </>
  );
}

function EmailSection({ email }: { email: string }) {
  const [value, setValue] = useState(email);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = value.trim();
    setErr(null);
    setSentTo(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) return setErr("Enter a valid email address.");
    if (next.toLowerCase() === email.toLowerCase()) return setErr("That's already your email.");
    setBusy(true);
    try {
      const { error } = await withTimeout<UserResponse>(createClient().auth.updateUser({ email: next }, { emailRedirectTo: callback("/") }));
      if (error) setErr(error.message);
      else setSentTo(next);
    } catch {
      setErr(UNREACHABLE);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-7" noValidate>
      <label className="block">
        <span className={fieldLabel}>Email</span>
        <input
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setErr(null);
          }}
          autoComplete="email"
          aria-invalid={err ? true : undefined}
          className={`field mt-1.5 w-full px-3.5 py-3 text-[15px] ${err ? "!border-coral" : ""}`}
        />
      </label>
      {err && <p className="mt-2 text-[13px] text-coral">{err}</p>}
      <p className={helper}>
        Signed in as <b className="font-semibold text-ink">{email}</b>. Changing this sends a confirmation link to <em>both</em> addresses, the old one and the
        new one, and the address only switches once you have opened both. Links expire in an hour.
      </p>
      {sentTo && (
        <p className="mt-3 border border-thread/40 px-3.5 py-2.5 text-[13px] leading-relaxed text-thread" role="status">
          Check both inboxes: we sent a link to {email} and to {sentTo}. Open both and your email switches to {sentTo}.
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-secondary mt-4 w-full py-3.5 text-[15px]">
        {busy ? "Sending links" : "Change email"}
      </button>
    </form>
  );
}

function PasswordSection({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentErr, setCurrentErr] = useState<string | null>(null);
  const [nextErr, setNextErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetErr, setResetErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const cErr = current ? null : "Enter your current password.";
    const nErr = passwordProblem(next) ?? (next && next === current ? "Pick a password you haven't used here." : null);
    setCurrentErr(cErr);
    setNextErr(nErr);
    if (cErr || nErr) return;
    setBusy(true);
    try {
      const supabase = createClient();
      // Prove the current password first: a fresh sign-in also satisfies Supabase's secure password change.
      const { error: signInErr } = await withTimeout<AuthTokenResponsePassword>(supabase.auth.signInWithPassword({ email, password: current }));
      if (signInErr) {
        setBusy(false);
        if (signInErr.code === "invalid_credentials" || /invalid login credentials/i.test(signInErr.message)) return setCurrentErr("That isn't your current password.");
        return setErr(signInErr.message);
      }
      const { error } = await withTimeout<UserResponse>(supabase.auth.updateUser({ password: next }));
      setBusy(false);
      if (error) {
        if (error.code === "same_password") return setNextErr("Pick a password you haven't used here.");
        if (error.code === "weak_password") return setNextErr(error.message);
        return setErr(error.message);
      }
      setCurrent("");
      setNext("");
      toast("Password changed");
    } catch {
      setBusy(false);
      setErr(UNREACHABLE);
    }
  };

  const sendReset = async () => {
    setResetErr(null);
    setResetBusy(true);
    try {
      const { error } = await withTimeout<{ error: AuthError | null }>(createClient().auth.resetPasswordForEmail(email, { redirectTo: callback("/reset") }));
      if (error) setResetErr(error.message);
      else setResetSent(true);
    } catch {
      setResetErr(UNREACHABLE);
    }
    setResetBusy(false);
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <input type="email" value={email} autoComplete="username" readOnly hidden />
        <div>
          <PasswordInput
            label="Current password"
            value={current}
            onChange={(v) => {
              setCurrent(v);
              setCurrentErr(null);
            }}
            autoComplete="current-password"
            invalid={Boolean(currentErr)}
          />
          {currentErr && <p className="mt-2 text-[13px] text-coral">{currentErr}</p>}
        </div>
        <div>
          <PasswordInput
            label="New password"
            value={next}
            onChange={(v) => {
              setNext(v);
              setNextErr(null);
            }}
            autoComplete="new-password"
            invalid={Boolean(nextErr)}
          />
          {nextErr && <p className="mt-2 text-[13px] text-coral">{nextErr}</p>}
          <p className={helper}>{PASSWORD_HINT}</p>
        </div>
        {err && <p className="text-[13px] text-coral">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full !border-thread !bg-thread py-3.5 text-[15px] !text-paper">
          {busy ? "Changing password" : "Change password"}
        </button>
      </form>
      <button type="button" onClick={sendReset} disabled={resetBusy || resetSent} className="btn-secondary mt-3 w-full py-3.5 text-[15px]">
        {resetBusy ? "Sending link" : resetSent ? "Link sent" : "I don't have my current password"}
      </button>
      {resetErr && <p className="mt-2 text-[13px] text-coral">{resetErr}</p>}
      <p className={helper} role={resetSent ? "status" : undefined}>
        {resetSent ? (
          <span className="text-thread">
            Sent to {email}. Open the link within an hour to set a new password.
          </span>
        ) : (
          <>
            Sends a one-time link to <b className="font-semibold text-ink">{email}</b>. Open it and you can set a new password without the old one. Useful if
            you sign in with Google and never typed a password here.
          </>
        )}
      </p>
    </div>
  );
}

function SubscriptionLink({ info }: { info: AccountInfo }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!info.hasBilling) {
    return info.tier === "free" ? (
      <div className="mt-6 text-center">
        <Link href="/pricing" onClick={closeAccount} className="text-[14px] text-thread underline underline-offset-4 hover:text-ink">
          Upgrade
        </Link>
      </div>
    ) : null;
  }
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
          const b = res ? await res.json().catch(() => ({})) : {};
          if (res?.ok && b.url) return void (window.location.href = b.url);
          setErr(b.error ?? UNREACHABLE);
          setBusy(false);
        }}
        className="text-[14px] text-thread underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        {busy ? "Opening billing" : "Manage or cancel subscription"}
      </button>
      {err && <p className="mt-2 text-[13px] text-coral">{err}</p>}
    </div>
  );
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const armed = typed.trim().toUpperCase() === "DELETE";

  const remove = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/account", { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      await createClient().auth.signOut().catch(() => undefined);
      // A full load, not a client push: every cached bit of the deleted account goes with it.
      window.location.replace("/");
      return;
    }
    const b = res ? await res.json().catch(() => ({})) : {};
    setErr(b.error ?? "Couldn't delete your account.");
    setBusy(false);
  };

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">Danger zone</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">Permanently delete your account, documents, reels and credits. This cannot be undone.</p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="mt-4 w-full border border-coral py-3.5 text-[15px] font-medium text-coral transition-colors hover:bg-coral/10">
          Delete account
        </button>
      ) : (
        <div className="mt-4 border border-coral/60 p-4">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">Type DELETE to confirm</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="field mt-1.5 w-full px-3.5 py-3 font-mono text-[15px] focus:!border-coral"
            />
          </label>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">Any subscription is cancelled first. Every document, reel and audio file is removed.</p>
          {err && <p className="mt-2 text-[13px] text-coral">{err}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped("");
                setErr(null);
              }}
              className="btn-secondary flex-1 py-3 text-[14.5px]"
            >
              Keep account
            </button>
            <button
              type="button"
              disabled={!armed || busy}
              onClick={remove}
              className="flex-1 border border-coral bg-coral py-3 text-[14.5px] font-semibold text-paper transition-opacity disabled:opacity-40"
            >
              {busy ? "Deleting" : "Delete forever"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
