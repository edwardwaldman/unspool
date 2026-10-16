import Link from "next/link";
import { Wordmark } from "../ui/icons";

/** Scrolling layout for marketing and legal pages. */
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="mx-auto flex max-w-[1040px] items-center justify-between border-b border-line px-5 py-5">
        <Link href="/">
          <Wordmark size={26} />
        </Link>
        <nav className="flex items-center gap-6 text-[14px] text-muted">
          <Link href="/about" className="hidden hover:text-ink sm:inline">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/" className="btn-primary px-4 py-2 text-[14px]">
            Open app
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[1040px] px-5 pb-24">{children}</main>
      <footer className="mx-auto flex max-w-[1040px] flex-wrap gap-x-6 gap-y-2 border-t border-line px-5 py-8 text-[13px] text-muted">
        <span>© {new Date().getFullYear()} Unspool</span>
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <Link href="/pricing" className="hover:text-ink">Pricing</Link>
      </footer>
    </div>
  );
}
