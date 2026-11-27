"use client";

import { useState } from "react";

const SIZES = ["1-25", "26-100", "101-500", "500+"];
const field = "w-full border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-thread";

/** The Enterprise "Request a demo" form: a short form, then a thank-you. Sends to /api/demo-request. */
export function DemoRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);
  if (state === "sent")
    return (
      <div className="border border-thread p-8" role="status">
        <div className="font-headline text-[24px] font-bold leading-tight">Thanks, we&apos;ve got it.</div>
        <p className="mt-2 text-[15px] text-muted">We&apos;ll email you to set up a time for the demo.</p>
      </div>
    );
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setState("sending");
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        const res = await fetch("/api/demo-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
        const out = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
        if (res?.ok) setState("sent");
        else { setErr(out?.error ?? "Couldn't send your request. Please email hello@unspool.cc."); setState("idle"); }
      }}
    >
      <label className="sr-only" htmlFor="dr-name">Name</label>
      <input id="dr-name" name="name" required maxLength={120} autoComplete="name" placeholder="Your name" className={field} />
      <label className="sr-only" htmlFor="dr-email">Work email</label>
      <input id="dr-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Work email" className={field} />
      <label className="sr-only" htmlFor="dr-company">Company</label>
      <input id="dr-company" name="company" required maxLength={160} autoComplete="organization" placeholder="Company" className={field} />
      <label className="sr-only" htmlFor="dr-size">Team size</label>
      <select id="dr-size" name="teamSize" required defaultValue="" className={`${field} appearance-none`}>
        <option value="" disabled>Team size</option>
        {SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
      </select>
      <label className="sr-only" htmlFor="dr-notes">What would you turn into reels?</label>
      <textarea id="dr-notes" name="notes" rows={3} maxLength={2000} placeholder="What would you turn into reels? (optional)" className={`${field} resize-none sm:col-span-2`} />
      {/* bots fill this in; people never see it */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={state === "sending"} className="inline-flex min-h-[50px] items-center bg-thread px-7 text-[16px] font-semibold text-paper hover:opacity-90 disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Request a demo"}
        </button>
        {err && <p role="alert" className="text-[14px] text-coral">{err}</p>}
      </div>
    </form>
  );
}
