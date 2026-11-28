"use client";

import { useSyncExternalStore } from "react";

let open = false;
let focus: "delete" | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Open the Manage account popup (mounted once in AppShell); "delete" scrolls it to Delete account. */
export function openAccount(section?: "delete" | unknown) {
  // also used directly as an onClick handler, so anything but "delete" means the top
  focus = section === "delete" ? "delete" : null;
  open = true;
  emit();
}
/** Which section the popup was opened for (read once when it opens). */
export const accountFocus = () => focus;
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
