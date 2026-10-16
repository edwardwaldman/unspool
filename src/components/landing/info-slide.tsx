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
      <button
        type="button"
        onClick={() => pickFileWithAuth(() => input.current?.click())}
        className="btn-primary w-full py-8 text-[22px] md:py-10 md:text-[28px]"
      >
        <UploadIcon size={28} /> Upload a document
      </button>
    </>
  );
}
