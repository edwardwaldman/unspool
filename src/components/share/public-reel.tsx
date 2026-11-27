"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { track } from "../analytics/track";
import { useSessionUser } from "../auth/use-session";
import { LockIcon } from "../ui/icons";
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

const SIGN_UP = "/login?next=%2Fstudio";
const plainText = (t: string) => t.replace(/[*#^~]/g, "");

/** Locked, blurred reels: the ones a free account opens up (Unspool's sample reels). Tapping one asks to sign up. */
function MoreReels({ onOpen, className = "" }: { onOpen: () => void; className?: string }) {
  return (
    <div className={className} data-testid="more-reels">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">More reels</span>
        <button type="button" onClick={onOpen} className="text-[13px] font-medium text-thread">
          Sign up to watch
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SAMPLE_SPOOL.reels.slice(0, 3).map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={onOpen}
            className="relative aspect-[9/16] overflow-hidden rounded-[12px] border border-line text-left"
            style={{ background: ["linear-gradient(160deg,#3b5a2a,#0d140f)", "linear-gradient(160deg,#2a3d5a,#0d0f14)", "linear-gradient(160deg,#4a2a5a,#120d14)"][i % 3] }}
            aria-label="Locked reel: sign up to watch"
          >
            <span className="absolute inset-x-2 top-3 text-[11px] font-bold leading-snug text-white blur-[3px]">{plainText(r.script?.headline ?? r.title)}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
                <LockIcon size={16} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The pull-up card on a shared reel for signed-out viewers: sign up to keep scrolling, or skip. */
function KeepScrolling({ open, onSkip }: { open: boolean; onSkip: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55" onClick={onSkip} data-testid="keep-scrolling">
      <div className="w-full animate-[slide-up_.25s_ease-out] rounded-t-[22px] border-t border-line bg-surface px-6 pb-8 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
        <div className="font-display text-[26px] leading-[1.08] text-ink">Keep scrolling</div>
        <p className="mt-2 text-[15px] leading-snug text-muted">Create a free account to keep watching reels like this, and turn your own notes into reels.</p>
        <Link
          href={SIGN_UP}
          onClick={() => track("keep_scrolling_signup")}
          className="mt-5 flex w-full items-center justify-center bg-thread px-5 py-3.5 text-[16px] font-semibold text-paper"
        >
          Sign up free
        </Link>
        <button type="button" onClick={onSkip} className="mt-3 w-full py-2 text-[14px] text-muted">
          Skip for now
        </button>
      </div>
    </div>
  );
}

/** Public, no-login page for one shared reel: the player, a watermark, the outro card and the promo. */
export function PublicReel({ spool, reel, slug }: { spool: SpoolDTO; reel: ReelDTO; slug: string }) {
  const [ended, setEnded] = useState(false);
  const [run, setRun] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  // Signed out: the keep-scrolling card (reel ends, a swipe or scroll on the reel, a locked reel tapped).
  const user = useSessionUser();
  const signedOut = user === false;
  const [gate, setGate] = useState(false);
  const askToScroll = (why: string) => {
    if (!signedOut || gate) return;
    setGate(true);
    track("keep_scrolling_shown", why);
  };
  const touchY = useRef<number | null>(null);
  useEffect(() => {
    if (ended && signedOut) {
      const id = window.setTimeout(() => askToScroll("reel ended"), 600);
      return () => window.clearTimeout(id);
    }
  }, [ended, signedOut]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div
          className="relative aspect-[9/16] w-full max-w-[min(100vw,calc((100dvh-48px)*9/16))] shrink-0 overflow-hidden bg-black lg:h-[calc(100dvh-104px)] lg:w-auto lg:max-w-none lg:border lg:border-line"
          onTouchStart={(e) => (touchY.current = e.touches[0]?.clientY ?? null)}
          onTouchEnd={(e) => {
            const y0 = touchY.current;
            const y1 = e.changedTouches[0]?.clientY;
            if (y0 !== null && y1 !== undefined && y0 - y1 > 60) askToScroll("swipe");
            touchY.current = null;
          }}
          onWheel={(e) => e.deltaY > 30 && askToScroll("scroll")}
        >
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
          {signedOut && <MoreReels onOpen={() => askToScroll("locked reel")} className="mb-6" />}
          {spool.title && <p className="mb-4 text-[13px] text-muted">From “{spool.title}”</p>}
          <Promo slug={slug} />
        </div>
      </main>
      <KeepScrolling
        open={gate}
        onSkip={() => {
          setGate(false);
          track("keep_scrolling_skip");
        }}
      />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} spool={spool} reel={reel} viewer={null} publicUrl />
      <Toaster />
    </div>
  );
}
