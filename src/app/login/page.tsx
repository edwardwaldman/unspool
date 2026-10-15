import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/shell/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  return (
    <div className="reel-bg flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 text-[24px] font-black tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-accent to-hlcyan">
          <span className="h-3.5 w-3.5 rounded-full border-[3px] border-[#0b1020]" />
        </span>
        unspool
      </Link>
      <h1 className="text-[28px] font-black tracking-tight">Sign in</h1>
      <p className="mb-7 mt-1 text-[15px] text-muted">Keep your spools and unlock all 10 reels.</p>
      <LoginForm next={next} error={typeof sp.error === "string" ? sp.error : undefined} />
      <p className="mt-8 max-w-[360px] text-center text-[12px] text-muted">
        By continuing you agree to the <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
