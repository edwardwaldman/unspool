import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { BillingButton } from "@/components/shell/billing-button";
import { formatPrice, PRICING, supabaseConfigured } from "@/lib/config";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const viewer = supabaseConfigured ? await getViewer() : null;
  return (
    <AppShell active="profile">
      <div className="mx-auto max-w-[480px] px-5 pt-12">
        <h1 className="text-[28px] font-black tracking-tight">Profile</h1>
        {!viewer?.userId ? (
          <div className="mt-6 rounded-3xl bg-white/[0.04] p-6">
            <p className="text-[16px] font-bold">You&apos;re browsing without an account</p>
            <p className="mt-1 text-[14px] text-muted">Sign in to keep your spools across devices and unlock all 10 reels.</p>
            <Link href="/login?next=/profile" className="mt-5 block rounded-2xl bg-white py-3.5 text-center text-[16px] font-extrabold text-[#0b1020]">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-white/[0.04] p-6">
              <div className="text-[13px] uppercase tracking-[0.18em] text-muted">Signed in as</div>
              <div className="mt-1 text-[17px] font-bold">{viewer.email}</div>
              <div className="mt-5 text-[13px] uppercase tracking-[0.18em] text-muted">Plan</div>
              <div className="mt-1 text-[17px] font-bold">
                {viewer.subscribed ? "Unlimited" : "Free"}
                {viewer.subscribed && viewer.profile?.current_period_end && (
                  <span className="ml-2 text-[13px] font-medium text-muted">
                    renews {new Date(viewer.profile.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="mt-5">
                {viewer.subscribed || viewer.profile?.stripe_customer_id ? (
                  <BillingButton mode="portal" />
                ) : null}
                {!viewer.subscribed && (
                  <div className="mt-2.5">
                    <BillingButton mode="subscribe" />
                    <p className="mt-2 text-center text-[12.5px] text-muted">
                      {formatPrice(PRICING.subscriptionCents)}/month · unlimited documents · cancel anytime
                    </p>
                  </div>
                )}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full rounded-2xl bg-white/[0.06] py-3.5 text-[16px] font-bold">
                Sign out
              </button>
            </form>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted">
          <Link href="/about">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </AppShell>
  );
}
