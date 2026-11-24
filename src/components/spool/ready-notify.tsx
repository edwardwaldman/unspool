"use client";

import { useEffect, useRef, useState } from "react";

// Browser notification when the first reel is ready, so people who switch tabs while it's being made come back.
// The browser only shows its permission prompt after a tap, so we offer a small "Notify me" button while the reel
// is being made instead of asking on page load. Works while this tab stays open (also in the background); not on
// iPhone/iPad Safari unless the site is added to the home screen, where the button simply doesn't show.

type Perm = NotificationPermission | "unsupported";
const supported = () => typeof window !== "undefined" && "Notification" in window;
const DISMISS_KEY = "unspool:notify-dismissed";

export function ReadyNotify({ docId, title, ready, waiting }: { docId: string; title: string; ready: number; waiting: boolean }) {
  const [perm, setPerm] = useState<Perm>("unsupported");
  const [dismissed, setDismissed] = useState(true);
  const prevReady = useRef(ready);
  const sent = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only state after mount
    setPerm(supported() ? Notification.permission : "unsupported");
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // The first reel just finished: notify if allowed and the page isn't in front of them.
  useEffect(() => {
    const was = prevReady.current;
    prevReady.current = ready;
    if (sent.current || was > 0 || ready < 1 || !supported() || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible" && document.hasFocus()) return;
    sent.current = true;
    try {
      const n = new Notification("Your first reel is ready 🎬", { body: title, icon: "/apple-touch-icon-180.png", tag: `ready-${docId}` });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // Some browsers (Android Chrome) only allow notifications from a service worker; nothing to do then.
    }
  }, [ready, docId, title]);

  if (!waiting || perm === "unsupported" || perm === "denied") return null;
  if (perm === "granted")
    return <p className="mt-2 text-[12px] text-muted" data-testid="notify-on">🔔 We&apos;ll notify you when your first reel is ready. You can switch tabs.</p>;
  if (dismissed) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 border border-line px-3 py-2 text-[12.5px]" data-testid="notify-offer">
      <span className="text-muted">Get a notification when your first reel is ready?</span>
      <span className="flex shrink-0 gap-3">
        <button
          type="button"
          className="font-medium text-thread underline underline-offset-4"
          onClick={async () => {
            try {
              setPerm(await Notification.requestPermission());
            } catch {
              setPerm("denied");
            }
          }}
        >
          Notify me
        </button>
        <button
          type="button"
          className="text-muted hover:text-ink"
          aria-label="No thanks"
          onClick={() => {
            setDismissed(true);
            try {
              window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {}
          }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}
