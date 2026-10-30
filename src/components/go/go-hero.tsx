"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "../ui/icons";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { docToReels } from "./doc-to-reels";

// The animation is laid out for a 720px-wide video frame; we show the band where it happens.
const FRAME_W = 720;
const CROP_TOP = 370;
const CROP_H = 430;
const LOOP_S = 4.2;

/** The ads' document → reels animation, looping, scaled to the width it's given. */
function AdAnimation() {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.offsetWidth / FRAME_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (t: number) => {
      if (!stage.current) return;
      // The ads name their fonts Unb and Ins; on the site the same fonts live in next/font variables.
      stage.current.innerHTML = docToReels(t, { title: "", reels: ["/go/mito", "/go/dna", "/go/r1"], docTitle: "My notes", badge: "PDF" })
        .replace(/ Unb\b/g, " var(--font-unbounded)")
        .replace(/ Ins\b/g, " var(--font-instrument-sans)");
    };
    if (reduce) return draw(2.4);
    let raf = 0, last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return; // ~30 fps is plenty
      last = now;
      draw(Math.min(2.6, ((now - start) / 1000) % LOOP_S));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: CROP_H * k }} aria-hidden>
      <div ref={stage} className="absolute left-0" style={{ width: FRAME_W, height: 1280, top: -CROP_TOP * k, transform: `scale(${k})`, transformOrigin: "0 0" }} />
    </div>
  );
}

/** One big + button. Phones offer "Take Photo" alongside files in the same picker. Sign-up (if needed) comes after the file. */
function PlusUpload() {
  const file = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className="flex flex-col items-center">
      <input
        ref={file}
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
        onClick={() => file.current?.click()}
        disabled={Boolean(pending)}
        aria-label="Upload a document"
        className="group relative flex h-[132px] w-[132px] items-center justify-center rounded-full bg-thread text-paper shadow-[0_0_0_10px_rgba(211,240,90,0.12),0_18px_50px_rgba(211,240,90,0.25)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        {!pending && <span className="absolute inset-0 animate-ping rounded-full bg-thread/30 [animation-duration:2.2s]" aria-hidden />}
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden className={pending ? "animate-spin" : ""}>
          {pending ? (
            <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="100 40" />
          ) : (
            <path d="M32 10v44M10 32h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      <div className="mt-4 text-[19px] font-semibold">{pending ? "Opening your reels…" : "Upload"}</div>
      <div className="mt-1 text-[14px] text-muted">PDF, slides, notes or a photo of a page</div>
    </div>
  );
}

/** /go: the landing page for TikTok and ads. Same look and animation as the videos, one job, no exits. */
export function GoHero() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-paper px-4 pb-8 pt-5 text-ink">
      <div className="flex w-full max-w-[460px] flex-col items-center">
        <Wordmark size={24} />
        <h1 className="mt-6 text-center font-headline text-[34px] font-bold leading-[1.05] tracking-[-0.02em]">
          Turn any page into <span className="text-thread">reels.</span>
        </h1>
        <p className="mt-3 text-center text-[16px] leading-[1.45] text-muted">
          Tap +, pick a PDF or snap a page. Get short reels with a voiceover, captions and a quiz in every one.
        </p>
        <div className="mt-2 w-full">
          <AdAnimation />
        </div>
        <PlusUpload />
        <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13.5px] text-muted">
          <li>✓ First reel free</li>
          <li>✓ No card needed</li>
          <li>✓ Your files stay private</li>
        </ul>
        <Link href="/s/demo" className="mt-5 text-[14.5px] text-muted underline underline-offset-4 hover:text-ink">
          Watch a sample reel first
        </Link>
      </div>
      <footer className="mt-auto flex gap-4 pt-10 text-[12px] text-muted">
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <span>unspool.cc</span>
      </footer>
    </div>
  );
}
