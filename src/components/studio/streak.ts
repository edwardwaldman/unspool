"use client";

import { useSyncExternalStore } from "react";

// A study streak kept on this device only (localStorage): a day counts once any reel is watched.
// Labelled "on this device" wherever it is shown, since it doesn't follow the account.
const KEY = "unspool_streak";
type Streak = { last: string; days: number };

const today = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const yesterday = () => today(new Date(Date.now() - 86_400_000));

function read(): Streak | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Streak | null;
    return s && typeof s.days === "number" && typeof s.last === "string" ? s : null;
  } catch {
    return null;
  }
}

/** Call when a reel is watched. */
export function markStudied() {
  const s = read();
  if (s?.last === today()) return;
  const days = s?.last === yesterday() ? s.days + 1 : 1;
  try {
    localStorage.setItem(KEY, JSON.stringify({ last: today(), days }));
  } catch {
    /* private mode: no streak */
  }
}

/** Days in a row, or 0 when the streak is broken or never started. 0 on the server. */
export function useStreak() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const s = read();
      return s && (s.last === today() || s.last === yesterday()) ? s.days : 0;
    },
    () => 0,
  );
}
