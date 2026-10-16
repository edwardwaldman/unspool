"use client";

import { useSyncExternalStore } from "react";

export type AuthMode = "signup" | "login";
type State = { open: boolean; mode: AuthMode; next: string | null; onDone: (() => void) | null };

let state: State = { open: false, mode: "signup", next: null, onDone: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Open the auth popup. `onDone` runs after an in-place sign-in (password); OAuth/email links redirect to `next`. */
export function openAuth(mode: AuthMode, opts: { next?: string; onDone?: () => void } = {}) {
  state = { open: true, mode, next: opts.next ?? null, onDone: opts.onDone ?? null };
  emit();
}
export function setAuthMode(mode: AuthMode) {
  state = { ...state, mode };
  emit();
}
export function closeAuth() {
  state = { ...state, open: false };
  emit();
}
export function useAuthModal() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
