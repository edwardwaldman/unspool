"use client";

import { Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "../ui/toast";
import { closeAuth, setAuthMode, useAuthModal } from "./auth-store";

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function PasswordField({ label, value, onChange, placeholder, autoComplete }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative mt-2">
        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="field w-full px-4 py-3 pr-11 text-[15px]"
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
          {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </label>
  );
}

/** Sign up / log in popup: Google, or email + password. */
export function AuthModal() {
  const { open, mode, next, onDone } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  if (!open) return null;
  const signup = mode === "signup";
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? window.location.pathname)}`;
  const switchMode = (m: "signup" | "login") => {
    setErr(null);
    setSent(null);
    setAuthMode(m);
  };

  const google = async () => {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) {
      setErr(error.message);
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (signup) {
      if (password !== confirm) return setErr("Passwords don't match.");
      if (!agree) return setErr("Please confirm you're 16 or older and agree to the Terms.");
    }
    setBusy(true);
    const supabase = createClient();
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: callback(), data: { marketing_opt_in: updates, accepted_terms_at: new Date().toISOString() } },
      });
      setBusy(false);
      if (error) return setErr(error.message);
      if (!data.session) return setSent(email.trim());
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return setErr(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
    }
    // Attach any anonymous uploads from this browser to the account.
    await fetch("/api/auth/claim", { method: "POST" }).catch(() => undefined);
    closeAuth();
    toast(signup ? "Account created" : "Signed in");
    onDone?.();
  };

  const forgot = async () => {
    if (!email.trim()) return setErr("Enter your email first.");
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: callback() });
    if (error) setErr(error.message);
    else toast("Password reset link sent");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-paper/80" onClick={closeAuth} />
      <div role="dialog" aria-modal aria-label={signup ? "Create your account" : "Log in"} className="relative max-h-[94dvh] w-full max-w-[520px] overflow-y-auto border border-line border-t-2 border-t-thread bg-surface px-7 pb-7 pt-10 sm:px-12">
        <button type="button" onClick={closeAuth} aria-label="Close" className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} strokeWidth={1.5} />
        </button>
        <h2 className="text-center font-display text-[32px] leading-tight">{signup ? "Create your account" : "Welcome back"}</h2>
        <p className="mt-2 text-center text-[14.5px] text-muted">
          {signup ? "Already have an account? " : "New to Unspool? "}
          <button type="button" onClick={() => switchMode(signup ? "login" : "signup")} className="text-thread hover:underline">
            {signup ? "Log in" : "Create an account"}
          </button>
        </p>

        {sent ? (
          <div className="mt-8 border border-line p-5 text-center text-[14.5px]">
            Confirm your email: we sent a link to <span className="text-ink">{sent}</span>.
          </div>
        ) : (
          <>
            <button type="button" onClick={google} disabled={busy} className="btn-secondary mt-8 w-full py-3 text-[15px]">
              <GoogleG /> Google
            </button>
            <div className="label my-5 flex items-center gap-3 !text-[10px]">
              <div className="h-px flex-1 bg-line" /> Or continue with <div className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="label">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="field mt-2 w-full px-4 py-3 text-[15px]"
                />
              </label>
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder={signup ? "Create a password" : "Your password"}
                autoComplete={signup ? "new-password" : "current-password"}
              />
              {signup ? (
                <>
                  <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Confirm your password" autoComplete="new-password" />
                  <label className="flex items-start gap-3 text-[13.5px] text-muted">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--thread)]" />
                    <span>
                      I&apos;m 16 or older and I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-ink underline underline-offset-2">Terms of Service</Link> and{" "}
                      <Link href="/privacy" target="_blank" className="text-ink underline underline-offset-2">Privacy Policy</Link>.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-[13.5px] text-muted">
                    <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--thread)]" />
                    <span>Send me occasional product updates and offers. Optional, and you can unsubscribe at any time.</span>
                  </label>
                </>
              ) : (
                <button type="button" onClick={forgot} className="text-[13px] text-muted hover:text-ink">
                  Forgot password?
                </button>
              )}
              {err && <p className="text-[13px] text-coral">{err}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-[15px]">
                {busy ? "One moment" : "Continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
