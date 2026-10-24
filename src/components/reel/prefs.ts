"use client";

import { useSyncExternalStore } from "react";

// Player preferences shared by every reel (like TikTok's global mute), persisted per device.

export type Prefs = {
  muted: boolean;
  /** True when the browser blocked autoplay with sound and we muted to keep playing. */
  autoMuted: boolean;
  speed: 1 | 1.25 | 1.5 | 2;
  /** Held down on the right side of a reel: plays at 2x until let go (never persisted). */
  boost: boolean;
  /** The soft background music under reels. */
  music: boolean;
  /** Read reels that have no generated voiceover with the device's built-in voice. */
  deviceVoice: boolean;
};

const KEY = "unspool:prefs";
const DEFAULTS: Prefs = { muted: false, autoMuted: false, speed: 1, boost: false, music: true, deviceVoice: true };

let state: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw), autoMuted: false, boost: false };
  } catch {
    // storage unavailable: keep defaults
  }
}

/** The playback rate right now: 2x while held, else the chosen speed. */
export const rateOf = (p: Prefs) => (p.boost ? 2 : p.speed);

export function getPrefs(): Prefs {
  load();
  return state;
}

export function setPrefs(patch: Partial<Prefs>) {
  load();
  state = { ...state, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, autoMuted: undefined }));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getPrefs,
    () => DEFAULTS,
  );
}

// Saved ("hearted") reels, per device.
const SAVED_KEY = "unspool:saved";
export function loadSaved(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
export function toggleSaved(id: string): boolean {
  const s = loadSaved();
  const on = !s.has(id);
  if (on) s.add(id);
  else s.delete(id);
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([...s]));
  } catch {
    // ignore
  }
  return on;
}
