"use client";

import Link from "next/link";
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProcessDemo } from "./process-demo";
import { useMainScroll } from "./use-main-scroll";
import { useRouter } from "next/navigation";
import { useSessionUser } from "../auth/use-session";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { PlayIcon, UploadIcon } from "../ui/icons";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-scrubbed section: a tall track with a pinned stage. Scrolling through the track plays the
 * product flow frame by frame (and rewinds when you scroll back up).
 */
export function InfoSlide({ toStudio = true }: { toStudio?: boolean } = {}) {
  const track = useRef<HTMLDivElement>(null);
  const scrollY = useMainScroll();
  const [range, setRange] = useState<[number, number]>([0, 1]);

  useEffect(() => {
    const measure = () => {
      const el = track.current;
      const main = document.querySelector("main");
      if (!el || !main) return;
      const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
      setRange([top, top + el.offsetHeight - main.clientHeight]);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const raw = useTransform(scrollY, range, [0, 1], { clamp: true });
  // Smooth the scrub so fast flicks still play out gently.
  const smooth = useSpring(raw, { stiffness: 60, damping: 22, mass: 0.6 });
  // The demo plays over the first 74% of the track; the rest holds the last frame and eases it out.
  const progress = useTransform(smooth, [0, 0.74], [0, 1], { clamp: true });
  // Then the demo slides up and away, handing off to the upload section below.
  // The exit follows the raw scroll position (not the spring) so a fast flick can't leave the demo
  // lagging on screen while the upload section arrives over it.
  // It's fully gone before the upload block below reaches the screen, so the two never overlap.
  const exitOpacity = useTransform(raw, [0.76, 0.83], [1, 0]);
  const exitScale = useTransform(raw, [0.74, 0.84], [1, 0.96]);
  const exitY = useTransform(raw, [0.74, 0.84], ["0dvh", "-70dvh"]);

  return (
    <>
      <section ref={track} className="relative" style={{ height: "650dvh" }}>
        <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-4 pt-16 lg:px-6 lg:pt-0">
          <motion.div style={{ opacity: exitOpacity, scale: exitScale, y: exitY }}>
            <ProcessDemo progress={progress} />
          </motion.div>
        </div>
      </section>
      {/* Rises in as the demo slides away, then holds on screen for a while before scrolling on */}
      <section className="relative -mt-[100dvh]" style={{ height: "190dvh" }}>
        {/* Centred in the space under the top bar, so the "start here" arrow is never hidden behind it */}
        <div className="sticky top-0 flex h-[100dvh] items-center px-6 pt-16 ipad:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease }}
          className="mx-auto w-full max-w-[1280px]"
        >
          <BigUpload big studioIfSignedIn={toStudio} />
        </motion.div>
        </div>
      </section>
    </>
  );
}

/**
 * The big "Upload a document" button with the hand-drawn "start here" arrow and floating tags.
 * Used at the bottom of the landing page, on the demo's sign-up gate and on a new account's empty page.
 * `onClick` replaces the file picker (the demo gate signs people up first).
 */
export function BigUpload({ onClick, demoLink = true, wideTags = true, big = false, studioIfSignedIn = false }: { onClick?: () => void; demoLink?: boolean; /** The two tags that sit far out to the sides (hide them in narrow columns). */ wideTags?: boolean; /** The landing page's closing block: larger button and tags on desktop. */ big?: boolean; /** On the landing: a signed-in visitor is taken to their Studio instead of the file picker. */ studioIfSignedIn?: boolean } = {}) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const user = useSessionUser();
  const router = useRouter();
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
      <div className={`relative mx-auto w-fit py-24 md:px-40 md:py-16 ${big ? "lg:px-56 lg:py-24" : ""}`}>
        <Float mobile className="left-0 top-4 -rotate-6 md:top-2" big={big} delay={0}>.pdf</Float>
        <Float mobile className="right-2 top-10 rotate-3 md:right-4 md:top-0" big={big} delay={0.08}>.docx</Float>
        <Float mobile className="bottom-4 right-2 -rotate-3 md:bottom-0 md:right-6" big={big} delay={0.24}>captions on</Float>
        <Float mobile className="bottom-9 left-3 rotate-2 md:bottom-2 md:left-8" big={big} delay={0.16}>.pptx</Float>
        {wideTags && (
          <>
            <Float big={big} className={`top-1/2 -translate-y-1/2 -rotate-3 ${big ? "-left-24 lg:-left-16" : "-left-24"}`} delay={0.12}>♪ voiceover</Float>
            <Float big={big} className={`top-[46%] rotate-2 border-thread/60 text-thread ${big ? "-right-40 lg:-right-36" : "-right-40"}`} delay={0.2}>✓ quiz in every reel</Float>
          </>
        )}
        {/* hand-drawn "start here" arrow */}
        <div aria-hidden className="pointer-events-none absolute -top-[22px] left-1/2 flex origin-bottom-left -translate-x-[66px] scale-[0.8] items-start gap-1 md:-top-12 md:translate-x-[70px] md:scale-100">
          <span className="-rotate-6 font-hook text-[20px] text-thread">start here</span>
          <svg width="88" height="99" viewBox="0 0 80 90" className="-ml-1 mt-2 overflow-visible">
            <motion.path
              d="M4 10 C 40 0, 70 20, 60 79"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1, 0] }}
              transition={{
                pathLength: { duration: 3.4, times: [0, 0.35, 0.85, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 },
                opacity: { duration: 3.4, times: [0, 0.03, 0.35, 0.85, 1], repeat: Infinity, repeatDelay: 0.4 },
              }}
            />
            <motion.path
              d="M55 68 L 60 80 L 69 71"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 0, 1, 1, 1], opacity: [0, 0, 1, 1, 0] }}
              transition={{
                pathLength: { duration: 3.4, times: [0, 0.35, 0.45, 0.85, 1], ease: "easeOut", repeat: Infinity, repeatDelay: 0.4 },
                opacity: { duration: 3.4, times: [0, 0.36, 0.38, 0.85, 1], repeat: Infinity, repeatDelay: 0.4 },
              }}
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => (onClick ? onClick() : studioIfSignedIn && user ? router.refresh() : input.current?.click())}
          className={`relative z-10 mx-auto flex items-center justify-center gap-3 whitespace-nowrap bg-thread px-8 py-6 text-[20px] md:gap-4 md:px-24 md:py-10 md:text-[36px] ${big ? "lg:gap-5 lg:px-32 lg:py-14 lg:text-[50px]" : ""} font-medium text-paper transition-opacity hover:opacity-90`}
        >
          <UploadIcon size={big ? 40 : 28} /> Upload a document
        </button>
          {demoLink && <Link href="/s/demo" className="group relative z-10 mx-auto mt-6 flex w-fit items-center justify-center gap-3 border border-line bg-paper px-6 py-3 text-[17px] font-medium text-ink transition-colors hover:border-thread md:px-8 md:py-4 md:text-[22px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-thread text-paper transition-transform group-hover:scale-110 md:h-10 md:w-10">
              <PlayIcon size={15} />
            </span>
            Watch a demo
          </Link>}
      </div>
    </>
  );
}

function Float({ children, className, delay, mobile = false, big = false }: { children: React.ReactNode; className: string; delay: number; mobile?: boolean; big?: boolean }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute border border-line bg-paper px-2.5 py-1 font-mono text-[12px] text-muted md:block md:px-4 md:py-2 md:text-[17px] ${big ? "lg:px-5 lg:py-2.5 lg:text-[22px]" : ""} ${mobile ? "block" : "hidden"} ${className}`}
      initial={{ opacity: 0, y: 8, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
      viewport={{ once: true, amount: 0 }}
      transition={{ opacity: { delay, duration: 0.2 }, scale: { delay, type: "spring", stiffness: 500, damping: 22 }, y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.span>
  );
}
