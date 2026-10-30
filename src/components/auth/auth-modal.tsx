"use client";

import { ArrowLeft, Check, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { supabaseConfigured } from "@/lib/config";
import type { AuthError, AuthOtpResponse, AuthResponse, AuthTokenResponsePassword, OAuthResponse } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase-browser";
import { track } from "../analytics/track";
import { fileLabel } from "../reel/accent";
import { toast } from "../ui/toast";
import { RESUME_PARAM, RESUME_VALUE, stashFile } from "../upload/file-stash";
import { WELCOME_FLAG } from "../studio/welcome-tour";
import { holdFile, useHeldFile } from "../upload/upload-store";
import { closeAuth, setAuthMode, useAuthModal } from "./auth-store";
import { markSignedIn } from "./use-session";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 30;
const MIN_PASSWORD = 8;
const emptyCode = () => Array<string>(CODE_LENGTH).fill("");
const TIMEOUT_MS = 15_000;
const UNREACHABLE = "Couldn't reach the server, try again.";

/** Never let the popup spin forever: give up on a Supabase call after 15 seconds. */
function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid = false,
  shake = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  /** Red border + ring while the password is the problem. */
  invalid?: boolean;
  /** Bump to replay the shake (once per failed submit). */
  shake?: number;
}) {
  const [show, setShow] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!shake || !box.current) return;
    const a = animate(box.current, { x: [0, -8, 8, -6, 6, -3, 3, 0] }, { duration: 0.4, ease: "easeInOut" });
    return () => a.stop();
  }, [shake]);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div ref={box} className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          className={`field w-full px-3.5 py-2.5 pr-11 text-[14px] ${invalid ? "!border-coral ring-1 ring-coral" : ""}`}
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
          {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </label>
  );
}

/** Six single-digit boxes: auto-advance, backspace to go back, paste or SMS/email autofill the whole code. */
function CodeInput({ value, onChange, onComplete, disabled }: { value: string[]; onChange: (v: string[]) => void; onComplete: (code: string) => void; disabled: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus();

  const fill = (from: number, digits: string) => {
    const next = [...value];
    for (let k = 0; k < digits.length && from + k < CODE_LENGTH; k++) next[from + k] = digits[k];
    onChange(next);
    const filled = next.findIndex((d) => !d);
    focus(filled === -1 ? CODE_LENGTH - 1 : filled);
    if (filled === -1) onComplete(next.join(""));
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
      {value.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          autoFocus={i === 0}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={i === 0 ? CODE_LENGTH : 1}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) {
              const next = [...value];
              next[i] = "";
              onChange(next);
              return;
            }
            // One typed digit, or a whole autofilled code landing in one box.
            fill(i, digits.length > 1 && digits.length < CODE_LENGTH ? digits.slice(-1) : digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              e.preventDefault();
              const next = [...value];
              next[i - 1] = "";
              onChange(next);
              focus(i - 1);
            } else if (e.key === "ArrowLeft") focus(i - 1);
            else if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e) => {
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
            if (!digits) return;
            e.preventDefault();
            fill(digits.length === CODE_LENGTH ? 0 : i, digits);
          }}
          className="field h-14 w-full min-w-0 text-center font-mono text-[22px] text-ink"
        />
      ))}
    </div>
  );
}

type AuthErr = { message: string; code?: string };

function friendly(e: AuthErr) {
  const m = e.message;
  if (e.code === "invalid_credentials" || /invalid login credentials/i.test(m)) return "Wrong email or password.";
  if (e.code === "user_already_exists" || e.code === "email_exists" || /already (registered|exists)/i.test(m))
    return "An account with this email already exists. Log in instead.";
  if (e.code === "email_not_confirmed" || /email not confirmed/i.test(m)) return "Confirm your email first: enter the code we sent you.";
  if (e.code === "otp_expired" || /token has expired|invalid (otp|token)|otp.*(expired|invalid)/i.test(m))
    return "That code is wrong or has expired. Check the latest email, or resend a new one.";
  const wait = /after (\d+) seconds?/i.exec(m);
  if (wait) return `Wait ${wait[1]} seconds before asking for another code.`;
  if (e.code === "over_email_send_rate_limit" || /email rate limit/i.test(m)) return "We've sent too many emails. Wait a few minutes and try again.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a minute and try again.";
  if (e.code === "weak_password" || /password should/i.test(m)) return `Pick a stronger password: at least ${MIN_PASSWORD} characters.`;
  if (e.code === "email_address_invalid" || /unable to validate email|invalid format/i.test(m)) return "That email doesn't look right.";
  if (/signups? not allowed/i.test(m)) return "Sign-ups are paused right now. Try again later.";
  if (/failed to fetch|network|timeout/i.test(m)) return UNREACHABLE;
  return m;
}

/**
 * Sign up / log in popup. Sign-up is email + password, confirmed with a 6-digit code from the email,
 * so a visitor who picked a file never leaves the page. Google stays available (the picked file is
 * parked in IndexedDB across the redirect).
 */
export function AuthModal() {
  const { open, mode, next, onDone } = useAuthModal();
  const file = useHeldFile();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [updates, setUpdates] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [offerLogin, setOfferLogin] = useState(false);
  // Password problems show under the password fields, in red, with a shake that replays on every failed submit.
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [code, setCode] = useState(emptyCode);
  const [codeEmail, setCodeEmail] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);

  // Tick the resend cooldown while it's running.
  useEffect(() => {
    if (step !== "code" || resendAt === 0) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= resendAt) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [step, resendAt]);

  if (!open) return null;
  const signup = mode === "signup";
  const cooldown = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const callback = (to?: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(to ?? next ?? window.location.pathname + window.location.search)}`;

  const passwordFail = (text: string) => {
    setPwErr(text);
    setShake((n) => n + 1);
  };
  const editPassword = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPwErr(null);
  };
  const fail = (e: AuthErr) => {
    if (e.code === "invalid_credentials" || /invalid login credentials/i.test(e.message)) return passwordFail("Wrong email or password");
    if (e.code === "weak_password" || /password should/i.test(e.message)) return passwordFail(`At least ${MIN_PASSWORD} characters`);
    const text = friendly(e);
    setErr(text);
    setOfferLogin(signup && /already exists/.test(text));
  };
  const clearErr = () => {
    setErr(null);
    setPwErr(null);
    setOfferLogin(false);
  };
  const switchMode = (m: "signup" | "login") => {
    clearErr();
    setStep("form");
    setAuthMode(m);
  };
  const toCode = (to: string) => {
    setCodeEmail(to);
    setCode(emptyCode());
    const t = Date.now();
    setNow(t);
    setResendAt(t + RESEND_COOLDOWN_S * 1000);
    setStep("code");
  };
  const dismiss = () => {
    if (signup) track("signup_closed");
    closeAuth();
    holdFile(null);
    setStep("form");
    setCode(emptyCode());
    clearErr();
  };

  /** A session exists: attach this browser's anonymous spools, close, and continue what the visitor was doing. */
  const finish = (user: { id: string; email?: string | null }, created: boolean) => {
    markSignedIn({ id: user.id, email: user.email ?? null });
    track(created ? "signup_done" : "login");
    setPassword("");
    setConfirm("");
    setCode(emptyCode());
    setStep("form");
    clearErr();
    closeAuth();
    toast(created ? (file ? "Account created. Unspooling your file." : "Account created") : "Signed in");
    const claim = fetch("/api/auth/claim", { method: "POST" }).catch(() => undefined);
    if (onDone) onDone();
    else void claim.then(() => window.location.reload());
  };

  const google = async () => {
    clearErr();
    setBusy(true);
    let to: string | undefined;
    if (file) {
      // The redirect drops in-memory state: park the file in IndexedDB and resume it on /?resume=1.
      if (!(await stashFile(file))) {
        setBusy(false);
        return setErr("Couldn't keep your file through Google sign-in. Use email instead.");
      }
      to = `/?${RESUME_PARAM}=${RESUME_VALUE}`;
    }
    try {
      const { error } = await withTimeout<OAuthResponse>((await supabaseBrowser()).auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(to) } }));
      if (error) {
        fail(error);
        setBusy(false);
      }
    } catch {
      setErr(UNREACHABLE);
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErr();
    const addr = email.trim();
    if (signup) {
      if (password.length < MIN_PASSWORD) return passwordFail(`At least ${MIN_PASSWORD} characters`);
      if (password !== confirm) return passwordFail("Passwords don't match");
    }
    setBusy(true);
    try {
      await (signup ? doSignup(addr) : doLogin(addr));
    } catch {
      setBusy(false);
      setErr(UNREACHABLE);
    }
  };

  const doSignup = async (addr: string) => {
    const { data, error } = await withTimeout<AuthResponse>(
      (await supabaseBrowser()).auth.signUp({
        email: addr,
        password,
        options: { emailRedirectTo: callback(), data: { marketing_opt_in: updates, accepted_terms_at: new Date().toISOString() } },
      }),
    );
    setBusy(false);
    if (error) return fail(error);
    // With "Confirm email" on, an already-registered address comes back with no identities and no error.
    if (data.user && data.user.identities?.length === 0) return fail({ message: "already registered" });
    if (data.session && data.user) return finish(data.user, true);
    toCode(addr);
  };

  const doLogin = async (addr: string) => {
    const supabase = await supabaseBrowser();
    const { data, error } = await withTimeout<AuthTokenResponsePassword>(supabase.auth.signInWithPassword({ email: addr, password }));
    if (error && (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message))) {
      // Signed up earlier but never entered the code: send a fresh one and go straight to the code step.
      const { error: resendErr } = await withTimeout<AuthOtpResponse>(supabase.auth.resend({ type: "signup", email: addr }));
      setBusy(false);
      toCode(addr);
      if (resendErr) fail(resendErr);
      else setErr("Confirm your email first: we sent you a new code.");
      return;
    }
    setBusy(false);
    if (error) return fail(error);
    if (data.user) finish(data.user, false);
  };

  const verify = async (token = code.join("")) => {
    if (busy) return;
    clearErr();
    if (!/^\d{6}$/.test(token)) return setErr("Enter all 6 digits.");
    setBusy(true);
    let res;
    try {
      res = await withTimeout<AuthResponse>((await supabaseBrowser()).auth.verifyOtp({ email: codeEmail, token, type: "signup" }));
    } catch {
      setBusy(false);
      return setErr(UNREACHABLE);
    }
    const { data, error } = res;
    setBusy(false);
    if (error) {
      fail(error);
      setCode(emptyCode());
      return;
    }
    // A brand-new account: Studio greets it with the welcome pop-up and tour.
    try {
      window.localStorage.setItem(WELCOME_FLAG, "1");
    } catch {
      // storage blocked: the server-side check still shows the tour on an empty Studio
    }
    if (data.session && data.user) return finish(data.user, true);
    // Confirmed but no session handed back: the password sign-in finishes the job.
    setAuthMode("login");
    setStep("form");
    setEmail(codeEmail);
    setErr("Email confirmed. Log in to continue.");
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    clearErr();
    let error;
    try {
      ({ error } = await withTimeout<AuthOtpResponse>((await supabaseBrowser()).auth.resend({ type: "signup", email: codeEmail, options: { emailRedirectTo: callback() } })));
    } catch {
      return setErr(UNREACHABLE);
    }
    if (error) return fail(error);
    const t = Date.now();
    setNow(t);
    setResendAt(t + RESEND_COOLDOWN_S * 1000);
    setCode(emptyCode());
    toast("New code sent");
  };

  const forgot = async () => {
    if (!email.trim()) return setErr("Enter your email first.");
    let error;
    try {
      ({ error } = await withTimeout<{ error: AuthError | null }>((await supabaseBrowser()).auth.resetPasswordForEmail(email.trim(), { redirectTo: callback("/profile?reset=1") })));
    } catch {
      return setErr(UNREACHABLE);
    }
    if (error) fail(error);
    else toast("Password reset link sent. Check your email.", 4000);
  };

  const heading = step === "code" ? "Check your email" : signup ? (file ? "Create your free account to start" : "Create your account") : file ? "Log in to start" : "Welcome back";
  const errorBlock = err && (
    <p className="text-[13px] text-coral" role="alert">
      {err}
      {offerLogin && (
        <>
          {" "}
          <button type="button" onClick={() => switchMode("login")} className="text-thread underline underline-offset-2">
            Log in
          </button>
        </>
      )}
    </p>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-paper/80" onClick={dismiss} />
      <div role="dialog" aria-modal aria-label={heading} className="relative max-h-[94dvh] w-full max-w-[440px] overflow-y-auto border border-line border-t-2 border-t-thread bg-surface px-6 pb-6 pt-7 sm:px-9">
        <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} strokeWidth={1.5} />
        </button>

        {file && (
          <div className="mb-5 mr-6 flex items-center gap-3 border border-line bg-paper px-3 py-2" data-testid="file-chip">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-thread font-mono text-[9px] text-thread" aria-hidden>
              {fileLabel(file.name.split(".").pop() ?? "")}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
              {file.name} <span className="text-muted">· ready to unspool</span>
            </span>
            <Check size={15} strokeWidth={2} className="hidden shrink-0 text-thread sm:block" aria-hidden />
          </div>
        )}

        <h2 className="text-center font-display text-[26px] leading-tight">{heading}</h2>

        {!supabaseConfigured ? (
          <div className="mt-5 border border-line p-4 text-center text-[14.5px]" role="alert">
            Sign-up is temporarily unavailable. Please try again in a little while.
          </div>
        ) : step === "code" ? (
          <>
            <p className="mt-1.5 text-center text-[14px] text-muted">
              We sent a 6-digit code to <span className="text-ink">{codeEmail}</span>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
              className="mt-6 space-y-4"
            >
              <CodeInput value={code} onChange={setCode} onComplete={(c) => void verify(c)} disabled={busy} />
              {errorBlock}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-[14.5px]">
                {busy ? "Checking" : "Verify"}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button
                type="button"
                onClick={() => {
                  clearErr();
                  setStep("form");
                }}
                className="flex items-center gap-1.5 text-muted hover:text-ink"
              >
                <ArrowLeft size={14} strokeWidth={1.5} /> Use a different email
              </button>
              <button type="button" onClick={resend} disabled={cooldown > 0} className="text-thread hover:underline disabled:text-muted disabled:no-underline">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
            <p className="mt-4 text-center text-[12px] text-muted">Not there in a minute? Check spam or promotions.</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-center text-[13.5px] text-muted">
              {signup ? "Already have an account? " : "New to Unspool? "}
              <button type="button" onClick={() => switchMode(signup ? "login" : "signup")} className="text-thread hover:underline">
                {signup ? "Log in instead" : "Create an account"}
              </button>
            </p>

            {/* The quickest way in, so the biggest button */}
            <button type="button" onClick={google} disabled={busy} className="btn-secondary mt-5 min-h-[56px] w-full gap-3 py-3.5 text-[17px] font-semibold">
              <GoogleG size={22} /> Continue with Google
            </button>
            <div className="label my-3.5 flex items-center gap-3 !text-[10px]">
              <div className="h-px flex-1 bg-line" /> Or with email <div className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="label">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="field mt-1.5 w-full px-3.5 py-2.5 text-[14px]"
                />
              </label>
              <PasswordField
                label="Password"
                value={password}
                onChange={editPassword(setPassword)}
                invalid={Boolean(pwErr)}
                shake={shake}
                placeholder="Enter your password"
                autoComplete={signup ? "new-password" : "current-password"}
              />
              {signup ? (
                <>
                  {/* Asked for only once they've started a password, so the form starts short. */}
                  {(password || confirm) && (
                  <div className="animate-[term-in_.25s_ease-out]">
                  <PasswordField
                    label="Confirm password"
                    value={confirm}
                    onChange={editPassword(setConfirm)}
                    invalid={Boolean(pwErr)}
                    shake={shake}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  </div>
                  )}
                  {pwErr && (
                    <p className="-mt-1 text-[13px] text-coral" role="alert">
                      {pwErr}
                    </p>
                  )}
                  <label className="flex items-start gap-2.5 text-[12.5px] leading-snug text-muted">
                    <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--thread)]" />
                    <span>Send me occasional product updates. Optional.</span>
                  </label>
                </>
              ) : (
                <>
                  {pwErr && (
                    <p className="-mt-1 text-[13px] text-coral" role="alert">
                      {pwErr}
                    </p>
                  )}
                  <button type="button" onClick={forgot} className="text-[13px] text-muted hover:text-ink">
                    Forgot password?
                  </button>
                </>
              )}
              {errorBlock}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-[14.5px]">
                {busy ? "One moment" : signup ? "Create account" : "Log in"}
              </button>
              {signup && (
                <p className="text-center text-[12px] text-muted">
                  By continuing you agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-ink underline underline-offset-2">Terms</Link> and{" "}
                  <Link href="/privacy" target="_blank" className="text-ink underline underline-offset-2">Privacy Policy</Link>.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
