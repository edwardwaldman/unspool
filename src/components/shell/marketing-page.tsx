import Link from "next/link";

/** Simple scrolling layout for marketing and legal pages. */
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="reel-bg min-h-[100dvh]">
      <header className="mx-auto flex max-w-[960px] items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-[20px] font-black tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-hlcyan">
            <span className="h-3 w-3 rounded-full border-[3px] border-[#0b1020]" />
          </span>
          unspool
        </Link>
        <nav className="flex items-center gap-5 text-[14px] font-semibold text-soft">
          <Link href="/about" className="hidden sm:inline">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-[#0b1020]">
            Open app
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[960px] px-5 pb-20">{children}</main>
      <footer className="mx-auto flex max-w-[960px] flex-wrap gap-x-5 gap-y-2 border-t border-white/5 px-5 py-8 text-[13px] text-muted">
        <span>© {new Date().getFullYear()} Unspool · unspool.cc</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/pricing">Pricing</Link>
      </footer>
    </div>
  );
}
