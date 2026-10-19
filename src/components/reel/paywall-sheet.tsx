"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { openAuth } from "../auth/auth-store";
import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { Sheet } from "../ui/sheet";

/** Signed out (or the demo): sign in (Google / magic link / password) and come back to the same reel. */
export function PaywallSheet({
  open,
  onClose,
  spool,
  viewer,
  reel,
}: {
  open: boolean;
  onClose: () => void;
  spool: SpoolDTO;
  viewer: ViewerDTO | null;
  reel: number;
}) {
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const wanted = !viewer?.signedIn;
  const signedIn = Boolean(viewer?.signedIn);

  const nextPath = () => `/s/${spool.id}?reel=${reel}`;
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`;

  const google = async () => {
    if (!wanted) return;
    setBusy("google");
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) {
      setErr(error.message);
      setBusy(null);
    }
  };

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wanted || !email.trim()) return;
    setBusy("email");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback() },
    });
    setBusy(null);
    if (error) setErr(error.message);
    else setSent(true);
  };

  const startUpload = () => openAuth("signup", { next: "/library", onDone: () => (window.location.href = "/library") });
  return (
    <Sheet open={open} onClose={onClose} label="Sign in" locked={spool.demo} above={spool.demo ? <BigUpload onClick={startUpload} /> : undefined}>
      {spool.demo ? (
        <div className="pb-1">
          <div className="label">That&apos;s the sample</div>
          <h2 className="mt-2 font-display text-[34px] leading-[1.05]">Now make reels from your own notes.</h2>
          <p className="mt-2 text-[15px] text-muted">Drop a PDF, chapter or slides and get reels like these.</p>
          {/* No close, no second option: uploading needs an account, so this opens sign-up, then the file picker. */}
          <button
            type="button"
            onClick={startUpload}
            className="btn-primary mt-6 w-full py-3.5 text-[15px]"
          >
            Upload a document
          </button>
        </div>
      ) : wanted && !signedIn ? (
        <div className="pb-1">
          <div className="label">Free account</div>
          <h2 className="mt-2 font-display text-[34px] leading-[1.05]">Sign in to keep going.</h2>
          <p className="mt-2 text-[14px] text-muted">You&apos;ll come back to reel {reel}.</p>
          {sent ? (
            <div className="mt-6 border border-line p-4 text-[14.5px] text-ink/85">
              Sign-in link sent to <span className="text-ink">{email}</span>. Open it on this device.
            </div>
          ) : (
            <>
              <button type="button" onClick={google} disabled={busy !== null} className="btn-primary mt-6 w-full py-3.5 text-[15px]">
                Continue with Google
              </button>
              <div className="label my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" /> or <div className="h-px flex-1 bg-line" />
              </div>
              <form onSubmit={magic} className="flex">
                <input
                  type="email"
                  required
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field min-w-0 flex-1 px-4 py-3 text-[16px]"
                />
                <button type="submit" disabled={busy !== null} className="btn-secondary -ml-px px-4 text-[14px]">
                  {busy === "email" ? "Sending" : "Email link"}
                </button>
              </form>
            </>
          )}
          {!sent && (
            <button
              type="button"
              onClick={() => {
                openAuth("login", { next: nextPath(), onDone: () => window.location.reload() });
              }}
              className="mt-4 w-full text-center text-[13.5px] text-thread hover:underline"
            >
              Use email and password instead
            </button>
          )}
          <button type="button" onClick={onClose} className="mt-5 w-full text-center text-[13.5px] text-muted">
            Not now
          </button>
        </div>
      ) : (
        <div className="pb-1 text-[15px] text-muted">Loading your plan.</div>
      )}
      {err && <p className="mt-3 text-center text-[13px] text-coral">{err}</p>}
    </Sheet>
  );
}


/** The demo gate's centerpiece: a big upload button with a bouncing arrow. */
function BigUpload({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute inset-x-0 top-0 z-[1] flex items-center justify-center" style={{ bottom: 320 }}>
      <div className="relative">
        <motion.button
          type="button"
          onClick={onClick}
          aria-label="Upload a document"
          className="relative flex h-44 w-44 flex-col items-center justify-center gap-2 bg-thread text-[#08110e] shadow-[0_0_60px_rgba(211,240,90,.35)]"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.92 }}
        >
          <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}>
            <Upload size={58} strokeWidth={2.4} />
          </motion.span>
          <span className="font-hook text-[17px] font-extrabold uppercase tracking-[0.04em]">Upload</span>
        </motion.button>
      </div>
    </div>
  );
}
