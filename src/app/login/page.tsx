import type { Metadata } from "next";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { LoginForm } from "@/components/shell/login-form";
import { Toaster } from "@/components/ui/toast";
import { Wordmark } from "@/components/ui/icons";
import { safeNextPath } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : null);
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-[380px]">
        <Link href="/">
          <Wordmark size={26} />
        </Link>
        <h1 className="mt-12 font-display text-[35px] leading-none">Sign in.</h1>
        <p className="mb-8 mt-3 text-[15px] text-muted">Keep your spools and unlock all their reels.</p>
        <LoginForm next={next} error={typeof sp.error === "string" ? sp.error : undefined} />
        <p className="mt-8 text-[12px] text-muted">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </div>
      <AuthModal />
      <Toaster />
    </div>
  );
}
