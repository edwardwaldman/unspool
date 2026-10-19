import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/reset-password-form";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

/** Landing for password-reset links (via /auth/callback, which signs the recovery session in). */
export default function ResetPage() {
  return (
    <AppShell active="none">
      <div className="mx-auto max-w-[440px] px-5 pt-10 pb-16">
        <div className="label">Account</div>
        <h1 className="mt-2 font-display text-[35px] leading-none">Set a new password</h1>
        <ResetPasswordForm />
      </div>
    </AppShell>
  );
}
