"use client";

import { useSyncExternalStore } from "react";

export function useMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useIsDesktop = () => useMedia("(min-width: 1024px)");

/** "desktop" (>= 1024px) or "mobile", or null before the client has measured (so we never mount the wrong layout first). */
export function useLayout(): "desktop" | "mobile" | null {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    // iPads (flagged by the viewport script in layout.tsx) get the full-screen reel feed, like a phone.
    () => (window.matchMedia("(min-width: 1024px)").matches && !document.documentElement.hasAttribute("data-ipad") ? "desktop" : "mobile"),
    () => null,
  );
}
