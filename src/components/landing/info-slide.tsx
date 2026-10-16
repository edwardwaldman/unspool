"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProcessDemo } from "./process-demo";
import { useMainScroll } from "./use-main-scroll";

const FACTS = [
  ["10", "reels per document"],
  ["~60s", "per reel"],
  ["1", "quiz in every reel"],
  ["Free", "first reel, every doc"],
] as const;

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
      <section className="px-6 pb-20">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 border-y border-line md:grid-cols-4">
          {FACTS.map(([n, label], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease }}
              className={`py-6 ${i % 2 === 1 ? "border-l border-line pl-6" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-6" : ""}`}
            >
              <div className="font-mono text-[28px] text-ink">{n}</div>
              <div className="label mt-1">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
