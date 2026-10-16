"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon } from "../ui/icons";
import { useMedia } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { motion } from "motion/react";
import { openAuth } from "../auth/auth-store";
import { SiteFooter } from "../shell/site-footer";
import { DocToReel } from "./doc-to-reel";

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

/** Signed in? null while checking. */
function useSignedIn(): [boolean | null, (v: boolean) => void] {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!supabaseConfigured) {
      const t = setTimeout(() => setSignedIn(false), 0);
      return () => clearTimeout(t);
    }
    let live = true;
    createClient()
      .auth.getUser()
      .then((res: { data: { user: unknown } }) => live && setSignedIn(Boolean(res.data.user)))
      .catch(() => live && setSignedIn(false));
    return () => {
      live = false;
    };
  }, []);
  return [signedIn, setSignedIn];
}

/** Blurred, quietly playing reel acting as a sign-up gate (or the upload button once signed in). */
function UploadReel({ width, height }: { width: number; height: number }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  const [signedIn, setSignedIn] = useSignedIn();
  return (
    <div className="relative shrink-0 overflow-hidden border border-line" style={{ width, height }}>
      <div className="pointer-events-none absolute inset-0 scale-105 opacity-40 blur-[7px]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={SAMPLE_SPOOL.reels[0]} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-paper/65" />
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
      <div className="absolute inset-x-6 bottom-6">
        <div className="label">Free to try</div>
        <h2 className="mt-2 font-display text-[30px] leading-[1.05]">Try it yourself for free.</h2>
        <p className="mt-2 text-[14px] leading-snug text-muted">
          Upload a document and your first reel is on us.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              if (signedIn) input.current?.click();
              else openAuth("signup", { next: "/", onDone: () => setSignedIn(true) });
            }}
            disabled={Boolean(pending)}
            className="btn-primary w-full py-4 text-[15px]"
          >
            {pending ? "Opening your feed" : (<><UploadIcon size={17} /> Upload a document</>)}
          </button>
        </div>
      </div>
    </div>
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
      <Tag className="-bottom-7 left-10 rotate-2" delay={1}>~60s each</Tag>
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
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: "easeInOut" }}
            />
          </svg>
        </span>
      </h1>
    </div>
  );
}

/** First-visit home: one line, the upload reel, and a big document-to-reels animation beside it. */
export function Landing() {
  const xl = useMedia("(min-width: 1280px)");
  const lg = useMedia("(min-width: 1024px)");
  const vh = useViewport("innerHeight", 900);
  const vw = useViewport("innerWidth", 1440);
  // Fit the animation to the screen: as big as width allows, never taller than what's left under the headline.
  const k = lg ? Math.max(0.9, Math.min(xl ? 2.15 : 1.5, (vh - 190) / ANIM_H, (vw - 340 - 64 - 120) / ANIM_W)) : 0.68;

  return (
    <div>
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 pb-24 pt-16 lg:gap-7 lg:pb-8 lg:pt-16">
      <Headline />
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <UploadReel width={lg ? 340 : 300} height={lg ? ANIM_H * k : 360} />
        <div style={{ width: ANIM_W * k, height: ANIM_H * k }}>
          <div className="origin-top-left" style={{ width: ANIM_W, height: ANIM_H, transform: `scale(${k})` }}>
            <DocToReel />
          </div>
        </div>
      </div>
    </div>
      <SiteFooter />
    </div>
  );
}
