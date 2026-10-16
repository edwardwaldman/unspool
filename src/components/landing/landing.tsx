"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { formatPrice, PRICING } from "@/lib/config";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon, Wordmark } from "../ui/icons";
import { useMedia } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, pickFileWithAuth, useUploader } from "../upload/use-uploader";
import { motion, useTransform } from "motion/react";
import { SiteFooter } from "../shell/site-footer";
import { DocToReel } from "./doc-to-reel";
import { InfoSlide } from "./info-slide";
import { useMainScroll } from "./use-main-scroll";

// Natural size of the DocToReel animation before scaling.
const ANIM_W = 478;
const ANIM_H = 336;

function useViewport(dim: "innerHeight" | "innerWidth", fallback: number) {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window[dim],
    () => fallback,
  );
}

/** Blurred, quietly playing reel acting as a sign-up gate (or the upload button once signed in). */
function UploadReel({ width, height }: { width: number; height: number }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className="relative shrink-0 overflow-hidden border border-line" style={{ width, height }}>
      <div className="pointer-events-none absolute inset-0 scale-105 opacity-40 blur-[7px]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={SAMPLE_SPOOL.reels[0]} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-paper/65" />
      <input
        ref={input}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <div className="absolute inset-x-6 bottom-6">
        <div className="flex items-center gap-2 font-mono text-[12px]">
          <span className="text-muted line-through decoration-coral decoration-2">{formatPrice(PRICING.documentCents)}</span>
          <span className="border border-thread px-1.5 py-0.5 text-thread">$0 to start</span>
        </div>
        <h2 className="mt-3 font-display text-[32px] leading-[1.05]">
          Your first reel is{" "}
          <span className="relative inline-block text-thread">
            free
            <svg className="pointer-events-none absolute -left-4 -top-1 h-[calc(100%+10px)] w-[calc(100%+32px)] overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden>
              <motion.path
                d="M50 4 C 77 4, 97 13, 97 25 C 97 37, 77 46, 50 46 C 23 46, 3 37, 3 25 C 3 13, 23 4, 56 5"
                fill="none"
                stroke="var(--thread)"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
                transition={{ duration: 5, delay: 0.8, times: [0, 0.22, 0.85, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
              />
            </svg>
          </span>
          <span className="ml-5">.</span>
        </h2>
        <p className="mt-3 text-[14px] leading-snug text-muted">
          Drop in any doc and watch it turn into reels. No card, no catch.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              pickFileWithAuth(() => input.current?.click());
            }}
            disabled={Boolean(pending)}
            className="btn-primary w-full py-4 text-[15px]"
          >
            {pending ? "Opening your feed" : (<><UploadIcon size={17} /> Upload a document</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, className, delay = 0 }: { children: React.ReactNode; className: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute hidden border border-line bg-paper px-2 py-1 font-mono text-[11px] text-muted md:block ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: [0, -5, 0] }}
      transition={{ opacity: { delay, duration: 0.5 }, y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.span>
  );
}

/** The one line of copy, with a self-drawing underline and a few floating tags. */
function Headline() {
  return (
    <div className="relative px-4 md:px-24">
      <Tag className="-left-2 -top-6 -rotate-6" delay={0.4}>.pdf</Tag>
      <Tag className="-right-4 -top-4 rotate-3" delay={0.7}>×10 reels</Tag>
      <Tag className="-left-20 top-[58%] rotate-2" delay={1}>~60s each</Tag>
      <h1 className="text-center font-display text-[34px] leading-tight md:text-[52px]">
        One document{" "}
        <span className="relative inline-block text-thread">
          into reels
          <svg className="absolute -bottom-3 left-0 h-3 w-full overflow-visible" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
            <motion.path
              d="M2 8 C 30 2, 50 12, 80 6 S 130 2, 160 7 S 190 9, 198 4"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              // Draw in, hold, wipe away to the right, rest — then again.
              // Hidden while the path is zero-length, otherwise the round caps leave two dots behind.
              initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 0, 0], pathOffset: [0, 0, 0, 1, 1], opacity: [0, 1, 1, 0, 0] }}
              transition={{
                duration: 6.5,
                delay: 0.3,
                times: [0, 0.18, 0.72, 0.9, 1],
                ease: "easeInOut",
                repeat: Infinity,
                opacity: { duration: 6.5, delay: 0.3, times: [0, 0.02, 0.86, 0.89, 1], repeat: Infinity },
              }}
            />
          </svg>
        </span>
      </h1>
    </div>
  );
}

/** First-visit home: one line, the upload reel, and a big document-to-reels animation beside it. */
export function Landing() {
  const lg = useMedia("(min-width: 1024px)");
  const vh = useViewport("innerHeight", 900);
  const vw = useViewport("innerWidth", 1440);
  // Fit the animation to the screen: as big as width allows, never taller than what's left under the headline.
  const scrollY = useMainScroll();
  const headY = useTransform(scrollY, [0, 700], [0, -220]);
  const headFade = useTransform(scrollY, [0, 450], [1, 0]);
  const animScale = useTransform(scrollY, [0, 700], [1, 0.88]);
  const animFade = useTransform(scrollY, [250, 750], [1, 0.2]);
  const cueFade = useTransform(scrollY, [0, 60], [1, 0]);
  const k = lg ? Math.max(1.2, Math.min(2.6, (vh - 200) / ANIM_H, (vw - 160) / ANIM_W)) : Math.min(1.2, (vw - 32) / ANIM_W);

  return (
    <div>
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 pb-24 pt-24 lg:gap-7 lg:pb-8 lg:pt-16">
      {/* Phones: a plain wordmark until the top bar slides in */}
      <Link href="/" aria-label="unspool" className="absolute left-5 top-5 lg:hidden">
        <Wordmark size={24} />
      </Link>
      {/* Parallax: each layer leaves at its own speed as you scroll */}
      <motion.div style={lg ? { y: headY, opacity: headFade } : undefined}>
        <Headline />
      </motion.div>
      <div className="flex flex-col items-center gap-12 lg:gap-20">
        <motion.div>
          <UploadReel width={lg ? 380 : 300} height={lg ? 420 : 360} />
        </motion.div>
        <motion.div className="order-first" style={lg ? { width: ANIM_W * k, height: ANIM_H * k, scale: animScale, opacity: animFade } : { width: ANIM_W * k, height: ANIM_H * k }}>
          <div className="origin-top-left" style={{ width: ANIM_W, height: ANIM_H, transform: `scale(${k})` }}>
            <DocToReel />
          </div>
        </motion.div>
      </div>
      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted lg:flex"
        style={{ opacity: cueFade }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
        >
        <span className="relative h-9 w-5 rounded-full border border-muted/60">
          <motion.span
            className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 rounded-full bg-thread"
            animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll</span>
      </motion.div>
      </motion.div>
    </div>
      <InfoSlide />
      <SiteFooter />
    </div>
  );
}
