"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { flush, track } from "./track";

const IDLE_MS = 60_000;
const FLUSH_MS = 15_000;

/** Mounted once in the root layout: page views, idle, close, and the periodic flush. */
export function VisitTracker() {
  const path = usePathname();
  useEffect(() => {
    track("page", path);
    if (path === "/s/demo") track("watch_demo");
  }, [path]);

  useEffect(() => {
    let idle: ReturnType<typeof setTimeout> | undefined;
    let wasIdle = false;
    const touched = () => {
      wasIdle = false;
      clearTimeout(idle);
      idle = setTimeout(() => {
        if (wasIdle || document.visibilityState !== "visible") return;
        wasIdle = true;
        track("idle");
      }, IDLE_MS);
    };
    const hidden = () => document.visibilityState === "hidden" && flush();
    const closed = () => track("close");
    const inputs = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    inputs.forEach((e) => window.addEventListener(e, touched, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", closed);
    const timer = setInterval(flush, FLUSH_MS);
    touched();
    return () => {
      clearTimeout(idle);
      clearInterval(timer);
      inputs.forEach((e) => window.removeEventListener(e, touched, { capture: true }));
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", closed);
    };
  }, []);
  return null;
}
