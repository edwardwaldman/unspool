"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "unspool:a2hs-tip";

/** iPhone Safari, not already opened from the Home Screen. */
function eligible() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPod/.test(ua);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  let seen = false;
  try {
    seen = localStorage.getItem(KEY) === "1";
  } catch {
    /* storage blocked: show it, it's dismissable */
  }
  return ios && !standalone && !seen;
}

/**
 * A one-time tip on iPhone: Safari's bars take a fifth of the screen, and Unspool added to the Home Screen opens
 * full screen like an app. Shows after a little watching, once, and never again after it's closed.
 */
export function HomeScreenTip() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!eligible()) return;
    const t = window.setTimeout(() => setShow(true), 25_000);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* fine */
    }
  };
  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-40 flex items-start gap-3 border border-white/15 bg-[#0b0f0d]/95 p-3.5 text-white shadow-[0_12px_40px_rgba(0,0,0,.5)] backdrop-blur" onClick={(e) => e.stopPropagation()} data-testid="a2hs-tip">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">Watch full screen</div>
        <div className="mt-0.5 text-[13px] leading-snug text-white/75">
          Tap <Share size={13} className="inline -translate-y-px" /> Share, then <span className="font-semibold text-white">Add to Home Screen</span>. Unspool opens like an app, no Safari bars.
        </div>
      </div>
      <button type="button" onClick={close} aria-label="Close" className="p-1 text-white/70 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
}
