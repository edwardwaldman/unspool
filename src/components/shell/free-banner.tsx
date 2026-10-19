"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Top-of-site notice once a free account has used its one document. */
export function FreeBanner({ signedIn }: { signedIn: boolean }) {
  const [used, setUsed] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    const check = () =>
      fetch("/api/free-status", { cache: "no-store" })
        .then((r) => r.json())
        .then((b) => live && setUsed(Boolean(b.used)))
        .catch(() => {});
    void check();
    // Re-check after an upload or an unlock.
    window.addEventListener("unspool:reload", check);
    return () => {
      live = false;
      window.removeEventListener("unspool:reload", check);
    };
  }, [signedIn]);
  if (!signedIn || !used) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-thread px-4 py-2 text-center text-[13.5px] font-medium text-paper">
      <span>You&apos;ve used your 1 free document.</span>
      <Link href="/pricing" className="underline underline-offset-2">
        Upgrade to unspool more
      </Link>
    </div>
  );
}
