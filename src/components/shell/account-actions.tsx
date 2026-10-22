"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { openAuth } from "../auth/auth-store";
import { toast } from "../ui/toast";

export function SignInButtons({ next }: { next: string }) {
  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={() => openAuth("signup", { next })} className="btn-primary w-full py-3.5 text-[15px]">
        Create a free account
      </button>
      <button type="button" onClick={() => openAuth("login", { next })} className="btn-secondary w-full py-3.5 text-[15px]">
        Log in
      </button>
    </div>
  );
}

/** Back from Stripe Checkout on a page without a spool (e.g. a subscription from Pricing): confirm and refresh. */
export function CheckoutReturn() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("checkout_session");
  const done = useRef(false);
  useEffect(() => {
    if (!sessionId || done.current) return;
    done.current = true;
    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((b: { fulfilled?: boolean; kind?: string }) => {
        if (b.fulfilled) toast(b.kind === "subscription" ? "Your plan is active." : b.kind === "topup" ? "Top-up added. Credits never expire." : "Done.", 3500);
      })
      .catch(() => undefined)
      .finally(() => {
        window.dispatchEvent(new Event("unspool:reload"));
        router.replace(window.location.pathname, { scroll: false });
        router.refresh();
      });
  }, [sessionId, router]);
  return null;
}
