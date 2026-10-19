"use client";

import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Open the Manage account popup (mounted once in AppShell). */
export function openAccount() {
  open = true;
  emit();
}
export function closeAccount() {
  open = false;
  emit();
}
export function useAccountModal() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open,
    () => false,
  );
}
