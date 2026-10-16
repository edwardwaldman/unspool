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
      <div className="relative mx-auto w-fit py-16 md:px-40">
        <Float className="left-0 top-2 -rotate-6" delay={0}>.pdf</Float>
        <Float className="right-4 top-0 rotate-3" delay={0.4}>.docx</Float>
        <Float className="bottom-4 left-10 rotate-2" delay={0.8}>×10 reels</Float>
        <Float className="bottom-0 right-0 -rotate-3 border-thread text-thread" delay={1.2}>reel 1 free</Float>
        {/* hand-drawn "start here" arrow */}
        <div aria-hidden className="pointer-events-none absolute -top-6 left-1/2 hidden translate-x-[90px] items-end gap-1 md:flex">
          <span className="mb-6 -rotate-6 font-hook text-[15px] text-thread">start here</span>
          <svg width="56" height="48" viewBox="0 0 56 48" className="overflow-visible">
            <motion.path
              d="M50 4 C 44 22, 30 34, 10 40 M10 40 L 20 32 M10 40 L 21 45"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeInOut" }}
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => pickFileWithAuth(() => input.current?.click())}
          className="relative z-10 mx-auto flex items-center justify-center gap-4 bg-thread px-16 py-8 text-[28px] md:px-24 md:py-10 md:text-[36px] font-medium text-paper transition-opacity hover:opacity-90"
        >
          <UploadIcon size={36} /> Upload a document
        </button>
      </div>
    </>
  );
}

function Float({ children, className, delay }: { children: React.ReactNode; className: string; delay: number }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute hidden border border-line bg-paper px-2.5 py-1 font-mono text-[12px] text-muted md:block ${className}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: [0, -6, 0] }}
      viewport={{ once: true }}
      transition={{ opacity: { delay, duration: 0.5 }, y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.span>
  );
}
