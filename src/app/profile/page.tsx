import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Suspense } from "react";
import { CheckoutReturn, DeleteAccountButton, PasswordForm, SignInButtons } from "@/components/shell/account-actions";
import { BillingButton } from "@/components/shell/billing-button";
import { UsageMeter } from "@/components/billing/usage-meter";
import { supabaseConfigured } from "@/lib/config";
import { entitlementFor, tierOf, usageFor } from "@/lib/credits";
import { approxMonthly, formatCents, nextTier, PLANS, TOPUP } from "@/lib/plans";
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
  const tier = tierOf(viewer?.profile ?? null);
  const usage = viewer?.userId ? await usageFor(entitlementFor(viewer.profile), viewer.profile).catch(() => null) : null;
  const up = nextTier(tier);
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
            <p className="mt-1 text-[14px] text-muted">Create a free account to unspool a document. Your first reel is free, then 1 every 30 minutes.</p>
            <SignInButtons next="/profile" />
          </div>
        ) : (
          <div className="mt-8 border-t border-line">
            <Row label="Email">{viewer.email}</Row>
            <Row label="Plan">
              {PLANS[tier].name}
              {usage?.trialing && " trial"}
              {viewer.subscribed && viewer.profile?.current_period_end && (
                <span className="ml-2 font-mono text-[12px] text-muted">
                  {viewer.profile.subscription_status === "past_due" ? "payment due" : usage?.trialing ? "trial ends" : "renews"}{" "}
                  {new Date(viewer.profile.current_period_end).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              )}
            </Row>
            {usage && (
              <div className="mt-5">
                <UsageMeter usage={usage} />
              </div>
            )}
            <div className="mt-6 space-y-3">
              {usage?.trialEligible && (
                <div>
                  <BillingButton mode="trial" label="Start 1-day free trial of Plus" />
                  <p className="mt-2 text-center text-[12.5px] text-muted">Card required. Then {formatCents(PLANS.plus.priceCents)}/week unless you cancel.</p>
                </div>
              )}
              {up && (
                <div>
                  <BillingButton mode="subscribe" tier={up} label={`${tier === "free" ? "Get" : "Upgrade to"} ${PLANS[up].name} · ${formatCents(PLANS[up].priceCents)}/week`} />
                  <p className="mt-2 text-center text-[12.5px] text-muted">
                    {PLANS[up].credits.toLocaleString("en-US")} reels a week · {approxMonthly(PLANS[up].priceCents)}
                  </p>
                </div>
              )}
              <BillingButton mode="topup" label={`Top up ${TOPUP.credits} reels · ${formatCents(TOPUP.priceCents)}`} />
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
