"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { UploadIcon, Wordmark } from "../ui/icons";
import { useMedia } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, pickFileWithAuth, useUploader } from "../upload/use-uploader";
import { motion, useSpring, useTransform } from "motion/react";
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

/** The hero's call to action: opens the file picker (after sign-up if needed). */
function UploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <>
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
      <button
        type="button"
        onClick={() => pickFileWithAuth(() => input.current?.click())}
        disabled={Boolean(pending)}
        className="flex items-center justify-center gap-3 whitespace-nowrap bg-thread px-10 py-4 text-[18px] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60 lg:px-14 lg:py-5 lg:text-[22px]"
      >
        {pending ? "Opening your feed" : (<><UploadIcon size={22} /> Upload a document</>)}
      </button>
      <p className="text-[13px] text-muted">Your first reel is free. No card needed.</p>
    </>
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
  // Eased copy of the scroll position so fades glide instead of snapping.
  const easedY = useSpring(scrollY, { stiffness: 90, damping: 26, mass: 0.6 });
  const headFade = useTransform(easedY, [0, 500], [1, 0]);
  const animScale = useTransform(easedY, [0, 800], [1, 0.9]);
  const animFade = useTransform(easedY, [150, 900], [1, 0.25]);
  const cueFade = useTransform(easedY, [40, 420], [1, 0]);
  const cueY = useTransform(easedY, [0, 420], [0, 24]);
  const k = lg ? Math.max(1, Math.min(2.8, (vh - 420) / ANIM_H, (vw - 120) / ANIM_W)) : Math.max(0.55, Math.min((vw - 48) / ANIM_W, (vh - 420) / ANIM_H));

  return (
    <div>
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-3 pb-10 pt-20 lg:gap-6 lg:px-6 lg:pb-24 lg:pt-16">
      {/* Phones: a plain wordmark until the top bar slides in */}
      <Link href="/" aria-label="unspool" className="absolute left-5 top-5 lg:hidden">
        <Wordmark size={24} />
      </Link>
      {/* Parallax: each layer leaves at its own speed as you scroll */}
      <motion.div style={lg ? { y: headY, opacity: headFade } : undefined}>
        <Headline />
      </motion.div>
      <div className="flex flex-col items-center gap-6 lg:gap-8">
        <motion.div className="order-first" style={lg ? { width: ANIM_W * k, height: ANIM_H * k, scale: animScale, opacity: animFade } : { width: ANIM_W * k, height: ANIM_H * k }}>
          <div className="origin-top-left" style={{ width: ANIM_W, height: ANIM_H, transform: `scale(${k})` }}>
            <DocToReel />
          </div>
        </motion.div>
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-10">
          <div className="flex flex-col items-center gap-3">
            <UploadButton />
          </div>
          <motion.div className="flex items-center gap-5" style={{ opacity: cueFade, y: cueY }}>
          {/* Scroll cue: a spinning "see how it works" badge with a bouncing arrow */}
          <motion.button
            type="button"
            aria-label="See how it works"
            onClick={(e) => e.currentTarget.closest("main")?.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" })}
            className="shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 320, damping: 16 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            <span className="relative flex h-[124px] w-[124px] items-center justify-center lg:h-[140px] lg:w-[140px]">
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}>
                <defs>
                  <path id="cue-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
                </defs>
                <text className="fill-ink font-mono uppercase" style={{ fontSize: 9.6 }}>
                  <textPath href="#cue-ring" textLength="236" lengthAdjust="spacing">see how it works · see how it works ·</textPath>
                </text>
              </motion.svg>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-thread text-paper lg:h-16 lg:w-16">
                <motion.svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" animate={{ y: [-3, 4, -3] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
                  <path d="M12 4v15M5 12l7 7 7-7" />
                </motion.svg>
              </span>
            </span>
          </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
      <InfoSlide />
      <SiteFooter />
    </div>
  );
}
