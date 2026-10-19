"use client";

import { openAccount } from "./account-store";

/** Opens the Manage account popup (email, password, deletion). */
export function ManageAccountButton({ className = "btn-secondary w-full py-3.5 text-[15px]" }: { className?: string }) {
  return (
    <button type="button" onClick={openAccount} className={className}>
      Manage account
    </button>
  );
}
