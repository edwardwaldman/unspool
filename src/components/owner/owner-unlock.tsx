"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "../ui/icons";

/** A Face ID mark: the corner brackets with a simple face. */
function FaceIdMark() {
  return (
    <svg viewBox="0 0 64 64" width={76} height={76} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 20V12a6 6 0 0 1 6-6h8M44 6h8a6 6 0 0 1 6 6v8M58 44v8a6 6 0 0 1-6 6h-8M20 58h-8a6 6 0 0 1-6-6v-8" />
      <path d="M22 24v5M42 24v5M32 24v12h-3M24 43c4.5 4 11.5 4 16 0" />
    </svg>
  );
}

const deviceName = () => {
  const ua = navigator.userAgent;
  return /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Mac/.test(ua) ? "Mac" : /Android/.test(ua) ? "Android" : "This device";
};

export function OwnerUnlock({ hasPasskey, signedInOwner, canAddDevice }: { hasPasskey: boolean; signedInOwner: boolean; canAddDevice: boolean }) {
  const [busy, setBusy] = useState<null | "unlock" | "setup">(null);
  const [msg, setMsg] = useState<string | null>(null);

  const unlock = async () => {
    setBusy("unlock");
    setMsg(null);
    try {
      const res = await fetch("/api/owner/passkey/login", { cache: "no-store" });
      const options = await res.json();
      if (!res.ok) throw new Error(options.error ?? "Face ID isn't set up yet.");
      const response = await startAuthentication({ optionsJSON: options });
      const done = await fetch("/api/owner/passkey/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ response }) });
      const b = await done.json().catch(() => ({}));
      if (!done.ok) throw new Error(b.error ?? "Couldn't unlock.");
      window.location.replace("/owner");
    } catch (e) {
      setMsg((e as Error).name === "NotAllowedError" ? "Face ID was cancelled." : (e as Error).message);
      setBusy(null);
    }
  };

  const setup = async () => {
    setBusy("setup");
    setMsg(null);
    try {
      const res = await fetch("/api/owner/passkey/register", { cache: "no-store" });
      const options = await res.json();
      if (!res.ok) throw new Error(options.error ?? "Sign in as the owner first.");
      const response = await startRegistration({ optionsJSON: options });
      const done = await fetch("/api/owner/passkey/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ response, device: deviceName() }) });
      const b = await done.json().catch(() => ({}));
      if (!done.ok) throw new Error(b.error ?? "Couldn't set up Face ID.");
      window.location.replace("/owner");
    } catch (e) {
      setMsg((e as Error).name === "NotAllowedError" ? "Face ID was cancelled." : (e as Error).name === "InvalidStateError" ? "Face ID is already set up on this device." : (e as Error).message);
      setBusy(null);
    }
  };

  return (
    <main className="safe-bottom flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      <Link href="/" aria-label="Unspool" className="absolute left-6 top-6">
        <Wordmark size={22} />
      </Link>
      <div className="text-thread">
        <FaceIdMark />
      </div>
      <div className="label mt-6">Owner panel</div>
      <h1 className="mt-2 font-display text-[34px] leading-[1.05]">{hasPasskey ? "Unlock with Face ID" : "Set up Face ID"}</h1>
      <p className="mt-2 max-w-[320px] text-[14.5px] leading-snug text-muted">
        {hasPasskey
          ? "Face ID signs you in and opens the owner panel for 12 hours."
          : signedInOwner
            ? "Use Face ID on this device to open the owner panel from now on."
            : "Sign in as the owner on this device first, then come back to set up Face ID."}
      </p>

      <div className="mt-7 flex w-full max-w-[320px] flex-col gap-3">
        {hasPasskey && (
          <button type="button" onClick={unlock} disabled={busy !== null} className="btn-primary w-full py-4 text-[16px]" data-testid="faceid-unlock">
            {busy === "unlock" ? "Waiting for Face ID…" : "Unlock with Face ID"}
          </button>
        )}
        {canAddDevice && (
          <button type="button" onClick={setup} disabled={busy !== null} className={`${hasPasskey ? "btn-secondary" : "btn-primary"} w-full py-4 text-[16px]`} data-testid="faceid-setup">
            {busy === "setup" ? "Waiting for Face ID…" : hasPasskey ? "Add this device" : "Set up Face ID on this device"}
          </button>
        )}
        {!hasPasskey && !signedInOwner && (
          <Link href="/login?next=/owner/unlock" className="btn-primary w-full py-4 text-[16px]">
            Sign in
          </Link>
        )}
      </div>
      {msg && <p className="mt-4 max-w-[320px] text-[13.5px] text-coral" role="alert">{msg}</p>}
    </main>
  );
}
