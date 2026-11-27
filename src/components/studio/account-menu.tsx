"use client";

import Link from "next/link";
import { useState } from "react";
import { openAccount } from "../account/account-store";
import { supabaseBrowser } from "../auth/supabase-browser";
import { getPrefs, setPrefs, usePrefs } from "../reel/prefs";
import { AnimatePresence, motion } from "motion/react";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

/**
 * The phone Studio's menu button (☰, where the account initial used to be): account settings and playback
 * preferences in a sheet, with Log out at the bottom.
 */
export function AccountMenu({ email, onReelStyle }: { email?: string | null; /** Opens the Reel style sheet. */ onReelStyle?: () => void }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const prefs = usePrefs();
  const close = () => setOpen(false);
  const row = "flex w-full items-center justify-between px-5 py-3.5 text-left text-[15px] text-ink transition-colors hover:bg-surface";
  const toggle = (on: boolean) => (
    <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-thread" : "bg-line"}`} aria-hidden>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </span>
  );
  const logOut = async () => {
    setLeaving(true);
    await (await supabaseBrowser()).auth.signOut().catch(() => undefined);
    // A full load, so nothing from the account stays on screen.
    window.location.replace("/");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center text-ink transition-transform active:scale-95 ipad:h-11 ipad:w-11"
        data-testid="account-menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {/* Slides in from the right */}
      <AnimatePresence>
        {open && (
          <motion.div key="menu" className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <button type="button" aria-label="Close menu" onClick={close} className="absolute inset-0 bg-black/55" />
            <motion.aside
              role="dialog"
              aria-label="Menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              className="safe-bottom absolute inset-y-0 right-0 flex w-[86%] max-w-[360px] flex-col border-l border-line bg-paper shadow-[-20px_0_50px_rgba(0,0,0,0.45)]"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
                <span className="truncate text-[13px] text-muted">{email ?? "Menu"}</span>
                <button type="button" onClick={close} aria-label="Close menu" className="-mr-1 p-1 text-[22px] leading-none text-muted">
                  ×
                </button>
              </div>
        <div className="flex-1 overflow-y-auto pb-2">
          <div>
            <button type="button" className={row} onClick={() => (close(), openAccount())}>
              <span>
                <span className="block">Manage account</span>
                <span className="block text-[12.5px] text-muted">Password, email, invite friends</span>
              </span>
              <span aria-hidden className="text-muted">›</span>
            </button>
            <Link href="/pricing" className={row} onClick={close}>
              Plan & billing <span aria-hidden className="text-muted">›</span>
            </Link>
            {onReelStyle && (
              <button type="button" className={row} onClick={() => (close(), onReelStyle())}>
                Reel style <span aria-hidden className="text-muted">›</span>
              </button>
            )}
          </div>

          <div className="mt-2 border-t border-line">
            <div className="px-5 pb-1 pt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Preferences</div>
            <button type="button" className={row} onClick={() => setPrefs({ muted: !getPrefs().muted, autoMuted: false })} aria-pressed={!prefs.muted}>
              Sound {toggle(!prefs.muted)}
            </button>
            <button type="button" className={row} onClick={() => setPrefs({ music: !getPrefs().music })} aria-pressed={prefs.music}>
              Background music {toggle(prefs.music)}
            </button>
            <button
              type="button"
              className={row}
              onClick={() => setPrefs({ speed: SPEEDS[(SPEEDS.indexOf(getPrefs().speed) + 1) % SPEEDS.length] })}
            >
              Playback speed <span className="font-mono text-[14px] text-thread">{prefs.speed}x</span>
            </button>
            <button type="button" className={row} onClick={() => setPrefs({ deviceVoice: !getPrefs().deviceVoice })} aria-pressed={prefs.deviceVoice}>
              Read aloud when a reel has no voiceover {toggle(prefs.deviceVoice)}
            </button>
          </div>

          <div className="mt-2 border-t border-line">
            <a href="mailto:hello@unspool.cc" className={row}>
              Help <span className="text-[13px] text-muted">hello@unspool.cc</span>
            </a>
            <Link href="/terms" className={row} onClick={close}>
              Terms <span aria-hidden className="text-muted">›</span>
            </Link>
            <Link href="/privacy" className={row} onClick={close}>
              Privacy <span aria-hidden className="text-muted">›</span>
            </Link>
          </div>

          <div className="mt-2 border-t border-line px-5 pt-4">
            <button
              type="button"
              onClick={logOut}
              disabled={leaving}
              className="min-h-[48px] w-full border border-line text-[15px] font-semibold text-coral transition-colors hover:border-coral disabled:opacity-60"
              data-testid="log-out"
            >
              {leaving ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
