"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { ReelView } from "../reel/reel-view";
import { ShareSheet } from "../reel/share-sheet";
import { ReplayIcon, Wordmark } from "../ui/icons";
import { Toaster } from "../ui/toast";

const ctaHref = (slug: string) => `/?upload=1&ref=share&s=${encodeURIComponent(slug)}`;
const CTA = "Unspool your own doc. First reel free";

function Promo({ slug, compact = false }: { slug: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "border border-line bg-surface p-6"} data-testid="share-promo">
      <p className="font-display text-[26px] leading-[1.08] text-ink lg:text-[30px]">Made with Unspool. Turn any document into reels</p>
      <p className="mt-3 text-[15px] leading-snug text-muted">Class notes, a textbook chapter, a work PDF. Drop it in and get short reels with voiceover, visuals and a quick quiz.</p>
      <Link href={ctaHref(slug)} className="mt-5 flex w-full items-center justify-center bg-thread px-5 py-3.5 text-[15.5px] font-semibold text-paper transition-opacity hover:opacity-90">
        {CTA}
      </Link>
      <p className="mt-2.5 text-center text-[12.5px] text-muted">No card needed. Your files stay private.</p>
    </div>
  );
}

/** Shown in the frame when the reel finishes. */
function OutroCard({ slug, onReplay }: { slug: string; onReplay: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-center bg-paper/95 px-6" onClick={(e) => e.stopPropagation()} data-testid="share-outro">
      <Wordmark size={30} />
      <p className="mt-5 font-display text-[28px] leading-[1.08] text-white">Your document could look like this.</p>
      <p className="mt-2 text-[14.5px] text-white/75">Made with Unspool. Turn any document into reels.</p>
      <Link href={ctaHref(slug)} className="mt-6 flex items-center justify-center bg-thread px-4 py-3.5 text-[15px] font-semibold text-paper hover:opacity-90">
        {CTA}
      </Link>
      <button type="button" onClick={onReplay} className="mt-3 flex items-center justify-center gap-2 border border-white/25 py-3 text-[14px] text-white hover:border-white/50">
        <ReplayIcon size={16} /> Watch again
      </button>
    </div>
  );
}

/** Public, no-login page for one shared reel: the player, a watermark, the outro card and the promo. */
export function PublicReel({ spool, reel, slug }: { spool: SpoolDTO; reel: ReelDTO; slug: string }) {
  const [ended, setEnded] = useState(false);
  const [run, setRun] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const watermark = (
    <Link
      href={ctaHref(slug)}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-3 top-3 z-30 bg-paper/80 px-2 py-1 text-[11.5px] font-semibold text-white/90 hover:text-white"
      data-testid="share-watermark"
    >
      Made with <span className="font-wordmark font-extrabold">unspool</span>
    </Link>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 lg:h-14 lg:px-6">
        <Link href="/" aria-label="Unspool home" className="text-ink">
          <Wordmark size={22} />
        </Link>
        <Link href={ctaHref(slug)} className="border border-line px-3 py-1.5 text-[13px] font-medium text-ink hover:border-muted">
          Try it free
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center lg:flex-row lg:items-center lg:justify-center lg:gap-14 lg:px-8 lg:py-6">
        <div className="relative aspect-[9/16] w-full max-w-[min(100vw,calc((100dvh-48px)*9/16))] shrink-0 overflow-hidden bg-black lg:h-[calc(100dvh-104px)] lg:w-auto lg:max-w-none lg:border lg:border-line">
          <ReelView
            key={run}
            spool={spool}
            reel={reel}
            active={!ended && !shareOpen}
            total={1}
            chrome={{ bottomInset: 0, topInset: 34 }}
            onEnded={() => setEnded(true)}
            onMore={() => setShareOpen(true)}
            onShare={() => setShareOpen(true)}
            overlay={
              <>
                {watermark}
                {ended && (
                  <OutroCard
                    slug={slug}
                    onReplay={() => {
                      setEnded(false);
                      setRun((n) => n + 1);
                    }}
                  />
                )}
              </>
            }
          />
        </div>
        <div className="w-full max-w-[460px] px-4 py-8 lg:px-0 lg:py-0">
          {spool.title && <p className="mb-4 text-[13px] text-muted">From “{spool.title}”</p>}
          <Promo slug={slug} />
        </div>
      </main>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} spool={spool} reel={reel} viewer={null} publicUrl />
      <Toaster />
    </div>
  );
}
