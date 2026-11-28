"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "../ui/icons";
import { SiteFooter } from "../shell/site-footer";
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
function AdAnimation({ docTitle = "My notes", reels = ["/go/mito", "/go/dna", "/go/r1"] }: { docTitle?: string; reels?: string[] }) {
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
      stage.current.innerHTML = docToReels(t, { title: "", reels, docTitle, badge: "PDF" })
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
  }, [docTitle, reels]);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: CROP_H * k, maskImage: FADE, WebkitMaskImage: FADE }} aria-hidden>
      <div ref={stage} className="absolute left-0" style={{ width: FRAME_W, height: 1280, top: -CROP_TOP * k, transform: `scale(${k})`, transformOrigin: "0 0" }} />
    </div>
  );
}

/** One big + button. Phones offer "Take Photo" alongside files in the same picker. Sign-up (if needed) comes after the file. */
function PlusUpload({ label = "Snap a photo", sub = "or upload a PDF, slides or notes", className = "" }: { label?: string; sub?: string; className?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className={`flex flex-col items-center ${className}`}>
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
        aria-label={`${label}: ${sub}`}
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
      <div className="mt-3 text-center">
        <div className="text-[17px] font-semibold lg:text-[19px]">{label}</div>
        <div className="mt-0.5 text-[13px] text-muted lg:text-[14px]">{sub}</div>
      </div>
    </div>
  );
}

/** Example topics the empty prompt box types out, one after another. */
const EXAMPLE_TOPICS = [
  "Photosynthesis, AP Bio",
  "The causes of World War I",
  "How the stock market works",
  "Supply and demand",
  "The French Revolution",
  "Mitosis vs meiosis",
  "Newton's three laws",
  "The Krebs cycle",
  "Derivatives in calculus",
  "The Great Gatsby, chapter 1",
  "How vaccines work",
  "The Cold War",
];

/** Types each topic out, holds it, deletes it, then types the next. Static first topic when motion is reduced. */
function useTypewriter(words: string[], on: boolean) {
  const [shown, setShown] = useState(words[0]);
  useEffect(() => {
    if (!on || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0, n = words[0].length, deleting = true, timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; i = (i + 1) % words.length; n = 0; }
      } else {
        n++;
      }
      setShown(words[i].slice(0, Math.max(0, n)));
      let wait = deleting ? 28 : 55 + Math.random() * 45;
      if (!deleting && n >= words[i].length) { deleting = true; wait = 1700; }
      if (deleting && n === 0) wait = 350;
      timer = setTimeout(step, wait);
    };
    timer = setTimeout(step, 1700); // the first topic is on screen from the start, then it begins
    return () => clearTimeout(timer);
  }, [on, words]);
  return shown;
}

/** "or type a prompt": a topic instead of a file. Unspool researches it and makes the reels. */
export function PromptBox({ className = "mt-4", topics = EXAMPLE_TOPICS, divider = true }: { className?: string; topics?: string[]; /** The "or type a topic" rule above the box. */ divider?: boolean }) {
  const [text, setText] = useState("");
  const upload = useUploader();
  const pending = usePendingUpload();
  const ready = text.trim().length >= 3 && !pending;
  const multi = text.includes("\n") || text.length > 60;
  const pasted = isPastedDocument(text);
  const [focused, setFocused] = useState(false);
  const example = useTypewriter(topics, !text && !focused);
  const camera = useRef<HTMLInputElement>(null);
  return (
    <form
      className={`w-full ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) void upload(promptFile(text));
      }}
    >
      {divider && (
        <div className="mb-2 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          or type a topic or paste notes
          <span className="h-px flex-1 bg-line" />
        </div>
      )}
      <div className={`flex items-end gap-2 border border-line bg-surface py-1.5 pl-5 pr-1.5 focus-within:border-thread ${multi ? "rounded-[22px]" : "rounded-full"}`}>
        <div className="relative flex min-w-0 flex-1 self-center">
        {/* While empty and not focused, an example topic types itself out behind the box (the real placeholder stays for screen readers). */}
        {!text && !focused && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-[16px] leading-snug text-muted/70">
            e.g. {example}
            <span className="typing-caret ml-px inline-block h-[1.1em] w-[2px] translate-y-[1px] bg-thread" />
          </span>
        )}
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? `e.g. ${topics[0]}` : ""}
          className="min-w-0 flex-1 resize-none self-center bg-transparent py-2 text-[16px] leading-snug text-ink outline-none placeholder:text-muted/70"
        />
        </div>
        {/* Snap a page: opens the camera on phones (a photo picker elsewhere), then makes reels from the photo */}
        {!text && (
          <button
            type="button"
            onClick={() => camera.current?.click()}
            disabled={!!pending}
            aria-label="Snap a photo of a page"
            title="Snap a photo of a page"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-thread disabled:opacity-35"
            data-testid="snap-photo"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
        )}
        <input
          ref={camera}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
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
      <p className="mt-2 text-center text-[12.5px] text-muted">{pasted ? "We turn your pasted notes into TikToks." : "Type a topic, paste your notes, or snap a photo of a page."}</p>
    </form>
  );
}

/** What changes between ad landing pages: the students' /go and the corporate-training /teams. */
export type GoCopy = {
  headline: ReactNode;
  subline: string;
  docTitle: string;
  topics?: string[];
  ticks: string[];
  /** the three cards in the animation: left, right, centre (jpgs in public/, no extension) */
  reels?: string[];
  /** the + button's label and the line under it */
  plus?: { label: string; sub: string };
  /** replaces the plain wordmark at the top (e.g. "unspool teams") */
  brand?: ReactNode;
  /** a call to action for the top bar and under the hero, e.g. /teams' "Request a demo" */
  cta?: { label: string; href: string };
  /** sales-led hero (/teams): one big call to action and a "see how it works" cue instead of the upload and topic box,
   *  with the rest of the page sliding up over the pinned hero like the main site */
  demoHero?: boolean;
};

const scrollDown = () => window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });

/** The main site's scroll cue: a spinning "see how it works" ring around a bouncing arrow. */
function SeeHowItWorks() {
  return (
    <motion.button type="button" aria-label="See how it works" onClick={scrollDown} className="shrink-0"
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 320, damping: 16 }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
      <span className="relative flex h-[124px] w-[124px] items-center justify-center lg:h-[144px] lg:w-[144px]">
        <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}>
          <defs><path id="go-cue-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs>
          <text className="fill-ink font-mono uppercase" style={{ fontSize: 9.6 }}>
            <textPath href="#go-cue-ring" textLength="236" lengthAdjust="spacing">see how it works ✦ see how it works ✦</textPath>
          </text>
        </motion.svg>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-thread text-paper lg:h-20 lg:w-20">
          <motion.svg width="26" height="26" viewBox="0 0 24 24" className="lg:h-8 lg:w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" animate={{ y: [-3, 4, -3] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
            <path d="M12 4v15M5 12l7 7 7-7" />
          </motion.svg>
        </span>
      </span>
    </motion.button>
  );
}

const STUDENT_COPY: GoCopy = {
  headline: <>Snap a photo. Get study <span className="text-thread">TikToks.</span></>,
  subline: "Short TikToks with a voiceover, captions and a quiz.",
  docTitle: "My notes",
  ticks: ["First reel free", "No card needed", "Your files stay private"],
};

/**
 * Exactly the main site's top bar: hidden only at the very top of the page; it slides down as soon as you scroll (or
 * wheel down while still at the top) and stays down until you're back at the top.
 */
function usePullDownBar() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 12);
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 4) setShown(true);
      else if (e.deltaY < -4 && window.scrollY <= 12) setShown(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", onWheel); };
  }, []);
  return shown;
}

/**
 * /go (and /teams): the landing page for TikTok and ads. Same look and animation as the videos, one job, no exits.
 * Phones get one narrow column (it has to fit above in-app browser toolbars). Desktops get the main site's spacing: the
 * logo top-left in an 80px header bar, then a centred headline, the animation large, and the upload controls under it.
 * `children` renders below the hero (the /teams page adds sections for desktop readers).
 */
export function GoHero({ copy = STUDENT_COPY, children }: { copy?: GoCopy; children?: ReactNode }) {
  const brand = copy.brand ?? <Wordmark size={24} />;
  const barShown = usePullDownBar();
  const ctaButton = (extra = "") =>
    copy.cta && (
      <Link href={copy.cta.href} className={`inline-flex shrink-0 items-center whitespace-nowrap bg-ink px-4 py-2.5 text-[14px] sm:px-5 sm:text-[15px] font-semibold text-paper transition-opacity hover:opacity-90 ${extra}`}>
        {copy.cta.label}
      </Link>
    );
  return (
    <div className={copy.demoHero ? "bg-paper text-ink" : "flex min-h-[100dvh] flex-col items-center bg-paper px-4 pb-24 pt-3 text-ink lg:px-0 lg:pb-16 lg:pt-0"}>
      {/* the pull-down bar: comes down when you scroll back up, like the main site's */}
      <div
        className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-line bg-paper px-5 transition-transform duration-300 lg:h-20 lg:px-10 ${barShown ? "translate-y-0" : "-translate-y-full"}`}
        aria-hidden={!barShown}
      >
        <Link href="/" aria-label="unspool home" tabIndex={barShown ? 0 : -1} className="inline-block origin-left transition-opacity hover:opacity-80 lg:scale-[1.3]">{brand}</Link>
        {ctaButton("ml-auto")}
      </div>
      <div className={copy.demoHero ? "relative z-0 flex flex-col items-center px-4 pb-16 pt-3 lg:sticky lg:top-0 lg:min-h-[100dvh] lg:px-0 lg:pt-0" : "contents"}>
      <header className="hidden h-20 w-full items-center self-stretch px-10 lg:flex">
        <Link href="/" aria-label="unspool home" className="inline-block origin-left scale-[1.3] transition-opacity hover:opacity-80">{brand}</Link>
        {ctaButton("ml-auto")}
      </header>
      <div className="flex w-full max-w-[460px] flex-col items-center lg:mt-8 lg:max-w-[880px] lg:px-10">
        <Link href="/" aria-label="unspool home" className="lg:hidden">{brand}</Link>
        <h1 className="mt-3 text-center font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em] lg:mt-0 lg:text-[62px] lg:leading-[1.02]">
          {copy.headline}
        </h1>
        <p className="mt-2 text-center text-[14.5px] leading-[1.4] text-muted lg:mt-5 lg:max-w-[620px] lg:text-[19px] lg:leading-[1.45]">
          {copy.subline}
        </p>
        {/* Phones: kept small so the + and the topic box fit above in-app browser toolbars (TikTok, Instagram) */}
        <div className="mt-1 w-full max-w-[300px] lg:mt-8 lg:max-w-[560px]">
          <AdAnimation docTitle={copy.docTitle} reels={copy.reels} />
        </div>
        {copy.demoHero && copy.cta ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 lg:mt-8">
            <Link href={copy.cta.href} className="flex items-center justify-center whitespace-nowrap bg-thread px-12 py-5 text-[19px] font-semibold text-paper transition-opacity hover:opacity-90 lg:px-20 lg:py-7 lg:text-[22px]">
              {copy.cta.label}
            </Link>
            <div className="hidden sm:block"><SeeHowItWorks /></div>
          </div>
        ) : (
          <>
            <PlusUpload label={copy.plus?.label} sub={copy.plus?.sub} />
            <PromptBox topics={copy.topics} className="mt-4 lg:mt-8 lg:max-w-[520px]" />
            <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13.5px] text-muted lg:text-[14.5px]">
              {copy.ticks.map((t) => <li key={t}>✓ {t}</li>)}
            </ul>
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14.5px]">
          <Link href="/s/demo" className="text-muted underline underline-offset-4 hover:text-ink">
            Watch a sample reel first
          </Link>
          {copy.cta && !copy.demoHero && (
            <Link href={copy.cta.href} className="font-semibold text-thread underline underline-offset-4 hover:opacity-80">
              {copy.cta.label}
            </Link>
          )}
        </div>
      </div>
      </div>
      <div className={copy.demoHero ? "relative z-10 flex flex-col items-center rounded-t-[32px] border-t border-line bg-paper px-4 shadow-[0_-24px_60px_rgba(0,0,0,0.45)]" : "contents"}>
        {copy.demoHero && (
          // the main site's slim tab riding on the card's top edge
          <button type="button" onClick={scrollDown} className="absolute -top-9 left-5 z-20 flex h-9 items-center gap-1.5 rounded-t-[10px] bg-ink px-4 text-[13px] font-medium text-paper lg:left-10">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            Pull up
          </button>
        )}
        {children}
        {copy.demoHero ? (
          <div className="mt-20 w-full">
            <SiteFooter />
          </div>
        ) : (
          <footer className="mt-auto flex gap-4 pt-10 text-[12px] text-muted">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <span>unspool.cc</span>
          </footer>
        )}
      </div>
    </div>
  );
}
