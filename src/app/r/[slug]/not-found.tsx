import Link from "next/link";
import { Wordmark } from "@/components/ui/icons";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <header className="flex h-14 items-center border-b border-line px-4">
        <Link href="/" aria-label="Unspool home" className="text-ink">
          <Wordmark size={22} />
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center px-6 sm:items-center sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">This reel isn&apos;t shared any more.</h1>
        <p className="mt-3 max-w-[420px] text-[15px] text-muted">The link was turned off, or it never existed. You can still make your own: drop in any document and get reels.</p>
        <Link href="/?upload=1&ref=share" className="mt-7 self-start bg-thread px-6 py-3 text-[15px] font-semibold text-paper hover:opacity-90 sm:self-center">
          Unspool your own doc. First reel free
        </Link>
      </main>
    </div>
  );
}
