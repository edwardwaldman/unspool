"use client";

import { useSyncExternalStore } from "react";

// One shared one-second clock for every countdown on the page.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const subs = new Set<() => void>();

function subscribe(cb: () => void) {
  subs.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      subs.forEach((f) => f());
    }, 1000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const snapshot = () => now || (now = Date.now());

/** Milliseconds left until `until` (ISO), ticking every second; 0 once it passes or when there is none. */
export function useCountdown(until: string | null | undefined): number {
  const t = useSyncExternalStore(subscribe, snapshot, () => 0);
  if (!until || !t) return 0;
  return Math.max(0, Date.parse(until) - t);
}

/** 47:12, or 1:02:03 past an hour. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${String(m).padStart(2, "0")}:${s}`;
}

/** When locked reel `index` turns free, given the next drip time and how many are free now. */
export function freeAtFor(index: number, freeReels: number, nextFreeUnlockAt: string | null): string | null {
  if (!nextFreeUnlockAt || index <= freeReels) return null;
  return new Date(Date.parse(nextFreeUnlockAt) + (index - freeReels - 1) * 3600_000).toISOString();
}
