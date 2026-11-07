"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "../ui/icons";
import { PROMPT_MAX_CHARS, isPastedDocument } from "@/lib/prompt-text";
import { promptFile, usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { docToReels } from "./doc-to-reels";

// The animation is laid out for a 720px-wide video frame; we show the band where it happens.
const FRAME_W = 720;
const CROP_TOP = 370;
const CROP_H = 400;
// soften the crop so the phones fade out instead of being cut by a hard line
const FADE = "linear-gradient(to bottom, #000 78%, transparent)";
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
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: CROP_H * k, maskImage: FADE, WebkitMaskImage: FADE }} aria-hidden>
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
        aria-label="Snap a photo or upload a document"
        className="group relative flex h-[96px] w-[96px] items-center justify-center rounded-full bg-thread text-paper shadow-[0_0_0_10px_rgba(211,240,90,0.12),0_18px_50px_rgba(211,240,90,0.25)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        {!pending && <span className="absolute inset-0 animate-ping rounded-full bg-thread/30 [animation-duration:2.2s]" aria-hidden />}
        <svg width="48" height="48" viewBox="0 0 64 64" aria-hidden className={pending ? "animate-spin" : ""}>
          {pending ? (
            <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="100 40" />
          ) : (
            <path d="M32 10v44M10 32h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      <div className="mt-3 text-[17px] font-semibold">{pending ? "Opening your reels…" : "Snap a photo"}</div>
      <div className="mt-0.5 text-[13px] text-muted">or upload a PDF, slides or notes</div>
    </div>
  );
}

/** "or type a prompt": a topic instead of a file. Unspool researches it and makes the reels. */
export function PromptBox({ className = "mt-4" }: { className?: string }) {
  const [text, setText] = useState("");
  const upload = useUploader();
  const pending = usePendingUpload();
  const ready = text.trim().length >= 3 && !pending;
  const multi = text.includes("\n") || text.length > 60;
  const pasted = isPastedDocument(text);
  return (
    <form
      className={`w-full ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) void upload(promptFile(text));
      }}
    >
      <div className="mb-2 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        or type a topic or paste notes
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className={`flex items-end gap-2 border border-line bg-surface py-1.5 pl-5 pr-1.5 focus-within:border-thread ${multi ? "rounded-[22px]" : "rounded-full"}`}>
        {/* A textarea, not an input: an input flattens a pasted study guide's line breaks into one run-on line. */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (ready) void upload(promptFile(text));
            }
          }}
          rows={multi ? 4 : 1}
          maxLength={PROMPT_MAX_CHARS}
          enterKeyHint="go"
          aria-label="Type a topic, or paste your notes"
          placeholder="e.g. Photosynthesis, AP Bio"
          className="min-w-0 flex-1 resize-none self-center bg-transparent py-2 text-[16px] leading-snug text-ink outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={!ready}
          aria-label="Make reels from this topic"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-thread text-paper transition-opacity disabled:opacity-35"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-center text-[12.5px] text-muted">{pasted ? "We turn your pasted notes into reels." : "Type a topic and we research it, or paste your notes."}</p>
    </form>
  );
}

/** /go: the landing page for TikTok and ads. Same look and animation as the videos, one job, no exits. */
export function GoHero() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-paper px-4 pb-24 pt-3 text-ink">
      <div className="flex w-full max-w-[460px] flex-col items-center">
        <Wordmark size={24} />
        <h1 className="mt-3 text-center font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em]">
          Snap a photo. Get study <span className="text-thread">reels.</span>
        </h1>
        <p className="mt-2 text-center text-[14.5px] leading-[1.4] text-muted">
          Short reels with a voiceover, captions and a quiz.
        </p>
        {/* Kept small so the + and the topic box fit above in-app browser toolbars (TikTok, Instagram) */}
        <div className="mt-1 w-full max-w-[300px]">
          <AdAnimation />
        </div>
        <PlusUpload />
        <PromptBox />
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
