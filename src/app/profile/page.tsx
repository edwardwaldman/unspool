import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Suspense } from "react";
import { CheckoutReturn, DeleteAccountButton, PasswordForm, SignInButtons } from "@/components/shell/account-actions";
import { BillingButton } from "@/components/shell/billing-button";
import { formatPrice, PRICING, supabaseConfigured } from "@/lib/config";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile", robots: { index: false } };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-4">
      <span className="label">{label}</span>
      <span className="text-right text-[15px]">{children}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const viewer = supabaseConfigured ? await getViewer() : null;
  return (
    <AppShell active="profile">
      <Suspense>
        <CheckoutReturn />
      </Suspense>
      <div className="mx-auto max-w-[520px] px-5 pt-10">
        <div className="label">Account</div>
        <h1 className="mt-2 font-display text-[35px] leading-none">Profile</h1>
        {!viewer?.userId ? (
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[16px]">You&apos;re not signed in.</p>
            <p className="mt-1 text-[14px] text-muted">Create a free account to unspool a document. Your first reel is free.</p>
            <SignInButtons next="/profile" />
          </div>
        ) : (
          <div className="mt-8 border-t border-line">
            <Row label="Email">{viewer.email}</Row>
            <Row label="Plan">
              {viewer.subscribed ? "Unlimited" : "Free"}
              {viewer.subscribed && viewer.profile?.current_period_end && (
                <span className="ml-2 font-mono text-[12px] text-muted">
                  {viewer.profile.subscription_status === "past_due" ? "payment due" : "renews"}{" "}
                  {new Date(viewer.profile.current_period_end).toLocaleDateString("en-US")}
                </span>
              )}
            </Row>
            <Row label="Free reels">Reel 1 of every document</Row>
            <div className="mt-6 space-y-3">
              {!viewer.subscribed && (
                <div>
                  <BillingButton mode="subscribe" label={`Go unlimited · ${formatPrice(PRICING.subscriptionCents)}/mo`} />
                  <p className="mt-2 text-center text-[12.5px] text-muted">Unlimited documents. Cancel anytime.</p>
                </div>
              )}
              {(viewer.subscribed || viewer.profile?.stripe_customer_id) && (
                <BillingButton mode="portal" label={viewer.subscribed ? "Manage subscription" : "Billing and receipts"} />
              )}
              <Link href="/library" className="btn-secondary w-full py-3.5 text-[15px]">
                Your library
              </Link>
              <Suspense>
                <PasswordForm />
              </Suspense>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-secondary w-full py-3.5 text-[15px]">
                  Sign out
                </button>
              </form>
              <DeleteAccountButton />
            </div>
          </div>
        )}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted">
          <Link href="/about" className="hover:text-ink">How it works</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
        </div>
      </div>
    </AppShell>
  );
}
