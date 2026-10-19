"use client";

import { useSyncExternalStore } from "react";
import { supabaseConfigured } from "@/lib/config";
import { supabaseBrowser } from "./supabase-browser";

// One shared view of "who is signed in" for every client component.
// null = still checking; false = signed out; object = signed in.
export type SessionUser = { id: string; email: string | null };
type State = SessionUser | false | null;

let state: State = null;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: State) {
  const same =
    next === state || (next && state && next.id === state.id && next.email === state.email);
  if (same) return;
  state = next;
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!supabaseConfigured) {
    set(false);
    return;
  }
  // The auth library loads on demand, after the page has painted and hydrated.
  supabaseBrowser()
    .then((supabase) => {
      supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string; email?: string } } | null) => {
        set(session?.user ? { id: session.user.id, email: session.user.email ?? null } : false);
      });
      return supabase.auth.getUser();
    })
    .then(({ data }: { data: { user: { id: string; email?: string } | null } }) =>
      set(data.user ? { id: data.user.id, email: data.user.email ?? null } : false),
    )
    .catch(() => set(false));
}

/** Mark the session as signed in right away (e.g. after a password sign-in), before the listener fires. */
export function markSignedIn(user: SessionUser) {
  set(user);
}

export function getSessionUser(): State {
  return state;
}

export function useSessionUser(): State {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => null,
  );
}
