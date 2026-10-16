"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProcessDemo } from "./process-demo";
import { useMainScroll } from "./use-main-scroll";
import { FILE_ACCEPT, pickFileWithAuth, useUploader } from "../upload/use-uploader";
import { UploadIcon } from "../ui/icons";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-scrubbed section: a tall track with a pinned stage. Scrolling through the track plays the
 * product flow frame by frame (and rewinds when you scroll back up).
 */
export function InfoSlide() {
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
  // The demo plays over the first 85% of the track; the rest holds the last frame and eases it out.
  const progress = useTransform(smooth, [0, 0.85], [0, 1], { clamp: true });
  const exitOpacity = useTransform(smooth, [0.88, 1], [1, 0]);
  const exitScale = useTransform(smooth, [0.88, 1], [1, 0.92]);
  const exitY = useTransform(smooth, [0.88, 1], [0, -60]);

  return (
    <>
      <section ref={track} className="relative border-t border-line" style={{ height: "650dvh" }}>
        <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-6">
          <motion.div style={{ opacity: exitOpacity, scale: exitScale, y: exitY }}>
            <ProcessDemo progress={progress} />
          </motion.div>
        </div>
      </section>
      <section className="px-6 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto w-full max-w-[1100px]"
        >
          <BigUpload />
        </motion.div>
      </section>
    </>
  );
}

function BigUpload() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
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
      <div className="relative mx-auto w-fit py-10 md:px-40 md:py-16">
        <Float className="left-0 top-2 -rotate-6" delay={0}>.pdf</Float>
        <Float className="right-4 top-0 rotate-3" delay={0.4}>.docx</Float>
        <Float className="bottom-4 left-10 rotate-2" delay={0.8}>×10 reels</Float>
        <Float className="bottom-0 right-6 -rotate-3" delay={1.2}>~60s each</Float>
        {/* hand-drawn "start here" arrow */}
        <div aria-hidden className="pointer-events-none absolute -top-9 left-1/2 hidden translate-x-[70px] items-start gap-1 md:flex">
          <span className="-rotate-6 font-hook text-[20px] text-thread">start here</span>
          <svg width="88" height="99" viewBox="0 0 80 90" className="-ml-1 mt-2 overflow-visible">
            <motion.path
              d="M4 10 C 40 0, 70 20, 60 79"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
              transition={{ duration: 3.4, times: [0, 0.35, 0.85, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
            />
            <motion.path
              d="M55 68 L 60 80 L 69 71"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 0, 1, 1, 1], opacity: [0, 1, 1, 1, 0] }}
              transition={{ duration: 3.4, times: [0, 0.35, 0.45, 0.85, 1], ease: "easeOut", repeat: Infinity, repeatDelay: 0.4 }}
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => pickFileWithAuth(() => input.current?.click())}
          className="relative z-10 mx-auto flex items-center justify-center gap-3 whitespace-nowrap bg-thread px-8 py-6 text-[20px] md:gap-4 md:px-24 md:py-10 md:text-[36px] font-medium text-paper transition-opacity hover:opacity-90"
        >
          <UploadIcon size={28} /> Upload a document
        </button>
      </div>
    </>
  );
}

function Float({ children, className, delay }: { children: React.ReactNode; className: string; delay: number }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute hidden border border-line bg-paper px-4 py-2 font-mono text-[17px] text-muted md:block ${className}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: [0, -6, 0] }}
      viewport={{ once: true }}
      transition={{ opacity: { delay, duration: 0.5 }, y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.span>
  );
}
