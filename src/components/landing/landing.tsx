"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PlayIcon, UploadIcon, Wordmark } from "../ui/icons";
import { useMedia } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { motion, useSpring, useTransform } from "motion/react";
import { SiteFooter } from "../shell/site-footer";
import { DocToReel } from "./doc-to-reel";
import { InfoSlide } from "./info-slide";
import { useMainScroll } from "./use-main-scroll";

// Natural size of the DocToReel animation before scaling.
const ANIM_W = 478;
const ANIM_H = 336;

// Same formula as the phone branch of `k` in Landing, run inline as soon as the hero is parsed: the server
// can't know the screen, and the guess it renders with (1440x900) would otherwise show a giant animation
// on phones until JavaScript hydrates. Desktop/iPad (>= 900px) are measured after hydration as before.
const HERO_FIT = `(function(){var w=innerWidth,h=innerHeight;if(w>=900)return;var a=document.getElementById("hero-anim"),b=document.getElementById("hero-anim-inner");if(!a||!b)return;
var k=Math.max(0.55,Math.min((w-48)/${ANIM_W},(h-420)/${ANIM_H}));a.style.width=${ANIM_W}*k+"px";a.style.height=${ANIM_H}*k+"px";b.style.transform="scale("+k+")";})();`;

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

/** Live height of an element (0 until measured), so the hero can size its animation to whatever space is left. */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

/** The hero's call to action: opens the file picker right away; sign-up (if needed) comes after the file. */
function UploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  // /?upload=1 (the share page's call to action) opens the picker right away. Browsers allow it while
  // the click that navigated here still counts as a user gesture; otherwise the button stays focused.
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("upload") !== "1") return;
    url.searchParams.delete("upload");
    window.history.replaceState(window.history.state, "", url);
    button.current?.focus();
    input.current?.click();
  }, []);
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
        ref={button}
        type="button"
        onClick={() => input.current?.click()}
        disabled={Boolean(pending)}
        className="flex items-center justify-center gap-3 whitespace-nowrap bg-thread px-10 py-4 text-[18px] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60 min-[900px]:px-20 min-[900px]:py-7 min-[900px]:text-[28px]"
      >
        {pending ? "Opening your feed" : (<><UploadIcon size={26} /> Upload a document</>)}
      </button>
      <Link href="/s/demo" className="-mt-1 flex items-center justify-center gap-2 text-[15px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink min-[900px]:text-[17px]">
        <PlayIcon size={14} /> Watch a demo
      </Link>
    </>
  );
}

function Tag({ children, className, delay = 0 }: { children: React.ReactNode; className: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute hidden whitespace-nowrap border border-line bg-paper px-2 py-1 font-mono text-[11px] text-muted md:block ipad:px-3.5 ipad:py-1.5 ipad:text-[17px] ${className}`}
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
    <div className="px-4 md:px-24">
      {/* The tag hangs off the headline text itself, so it never drifts over the logo on mid-size screens. */}
      <div className="relative mx-auto w-fit">
      <h1 className="text-center font-headline text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[50px]">
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
    </div>
  );
}

/** First-visit home: one line, the upload reel, and a big document-to-reels animation beside it. */
export function Landing() {
  // The side-by-side hero starts at 900px so landscape iPads (about 1000px wide) get it too.
  const lg = useMedia("(min-width: 900px)");
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
  const [headRef, headH] = useHeight<HTMLDivElement>();
  const [rowRef, rowH] = useHeight<HTMLDivElement>();
  // Desktop and iPad: the animation takes exactly the height the headline and buttons leave, with four equal gaps
  // (top bar, headline, animation, buttons, pull-up tab) of at least HERO_GAP, and stays clear of the side tags.
  // That way the hero fills the screen at any size without ever needing to scroll or zoom.
  const HERO_GAP = 28;
  const free = vh - 64 - 36 - (headH || 70) - (rowH || 150) - HERO_GAP * 4;
  const k = lg ? Math.max(0.6, Math.min(2.8, free / ANIM_H, (vw - 480) / ANIM_W)) : Math.max(0.55, Math.min((vw - 48) / ANIM_W, (vh - 420) / ANIM_H));

  return (
    <div>
    <div className="sticky top-0 z-0 flex h-[100dvh] flex-col items-center justify-[safe_center] gap-6 overflow-hidden px-3 pb-10 pt-20 min-[900px]:justify-evenly min-[900px]:gap-0 min-[900px]:px-6 min-[900px]:pb-9 min-[900px]:pt-16">
      {/* Wordmark under the top bar: the bar slides down over it on scroll */}
      <Link href="/" aria-label="unspool" className="absolute left-5 top-5 origin-top-left min-[900px]:left-10 min-[900px]:top-[22px] ipad:scale-[1.5]">
        <Wordmark size={24} />
      </Link>
      {/* Parallax: each layer leaves at its own speed as you scroll */}
      <motion.div ref={headRef} className="relative" style={lg ? { y: headY, opacity: headFade } : undefined}>
        <Headline />
      </motion.div>
      <div className="flex flex-col items-center gap-6 min-[900px]:contents">
        <motion.div id="hero-anim" suppressHydrationWarning className="relative" style={lg ? { width: ANIM_W * k, height: ANIM_H * k, scale: animScale, opacity: animFade } : { width: ANIM_W * k, height: ANIM_H * k }}>
          {/* Floating gimmicks around the animation (desktop) */}
          <Tag className="-left-36 top-[30%] -rotate-3 ipad:left-auto ipad:right-[calc(100%+56px)]" delay={0.9}>.docx</Tag>
          <Tag className="-left-44 top-[64%] rotate-2 ipad:left-auto ipad:right-[calc(100%+24px)]" delay={1.3}>♪ voiceover</Tag>
          <Tag className="-right-52 top-[16%] rotate-3 border-thread/60 text-thread ipad:right-auto ipad:left-[calc(100%+24px)]" delay={1.1}>✓ quiz in every reel</Tag>
          <Tag className="-right-40 top-[70%] -rotate-2 ipad:right-auto ipad:left-[calc(100%+48px)]" delay={1.5}>captions on</Tag>
          <div id="hero-anim-inner" suppressHydrationWarning className="origin-top-left" style={{ width: ANIM_W, height: ANIM_H, transform: `scale(${k})` }}>
            <DocToReel />
          </div>
        </motion.div>
        {/* Phones: size the animation for the real screen before hydration, so it doesn't paint huge and jump. */}
        <script dangerouslySetInnerHTML={{ __html: HERO_FIT }} />
        <div ref={rowRef} className="flex flex-col items-center gap-2 min-[900px]:flex-row min-[900px]:gap-10 ipad:min-[900px]:grid ipad:min-[900px]:w-full ipad:min-[900px]:grid-cols-[1fr_auto_1fr]">
          {/* iPad: an empty first column balances the badge so the upload button sits dead centre */}
          <div aria-hidden className="hidden ipad:min-[900px]:block" />
          <div className="flex flex-col items-center gap-3">
            <UploadButton />
          </div>
          <motion.div className="flex items-center gap-5 ipad:justify-self-start" style={{ opacity: cueFade, y: cueY }}>
          {/* Scroll cue: a spinning "see how it works" badge with a bouncing arrow */}
          <motion.button
            type="button"
            aria-label="See how it works"
            onClick={(e) => e.currentTarget.closest("main")?.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" })}
            className="shrink-0 min-[900px]:-my-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 320, damping: 16 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            <span className="relative flex h-[124px] w-[124px] items-center justify-center min-[900px]:h-[144px] min-[900px]:w-[144px]">
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}>
                <defs>
                  <path id="cue-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
                </defs>
                <text className="fill-ink font-mono uppercase" style={{ fontSize: 9.6 }}>
                  <textPath href="#cue-ring" textLength="236" lengthAdjust="spacing">see how it works · see how it works ·</textPath>
                </text>
              </motion.svg>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-thread text-paper min-[900px]:h-20 min-[900px]:w-20">
                <motion.svg width="26" height="26" viewBox="0 0 24 24" className="min-[900px]:h-8 min-[900px]:w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" animate={{ y: [-3, 4, -3] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
                  <path d="M12 4v15M5 12l7 7 7-7" />
                </motion.svg>
              </span>
            </span>
          </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
      {/* Everything below slides up over the pinned hero like a card */}
      <div className="relative z-10 rounded-t-[32px] border-t border-line bg-paper shadow-[0_-24px_60px_rgba(0,0,0,0.45)]">
        {/* Slim tab riding on the card's top edge, bottom-left of the hero */}
        <button
          type="button"
          onClick={(e) => e.currentTarget.closest("main")?.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" })}
          className="absolute -top-9 left-5 z-20 flex h-9 items-center gap-1.5 rounded-t-[10px] bg-ink px-4 text-[13px] font-medium text-paper min-[900px]:left-10"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Pull up
        </button>
        <InfoSlide />
        <SiteFooter />
      </div>
    </div>
  );
}
