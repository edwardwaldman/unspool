"use client";

import { useRef } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon } from "../ui/icons";
import { useMedia } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { DocToReel } from "./doc-to-reel";

// Natural size of the DocToReel animation before scaling.
const ANIM_W = 478;
const ANIM_H = 336;

/** Blurred, quietly playing reel with the upload button on top. */
function UploadReel({ width, height }: { width: number; height: number }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className="relative shrink-0 overflow-hidden border border-line" style={{ width, height }}>
      <div className="pointer-events-none absolute inset-0 scale-105 opacity-40 blur-[7px]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={SAMPLE_SPOOL.reels[0]} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-paper/50" />
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
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={Boolean(pending)}
          className="btn-primary w-full py-4 text-[15px]"
        >
          {pending ? "Opening your feed" : (<><UploadIcon size={17} /> Upload a document</>)}
        </button>
      </div>
    </div>
  );
}

/** First-visit home: one line, a big document-to-reels animation, and the upload reel beside it. */
export function Landing() {
  const xl = useMedia("(min-width: 1280px)");
  const lg = useMedia("(min-width: 1024px)");
  const k = xl ? 1.7 : lg ? 1.25 : 0.68;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 py-20 lg:gap-10 lg:py-24">
      <h1 className="text-center font-display text-[34px] leading-tight md:text-[52px]">
        One document <span className="text-thread">into reels</span>
      </h1>
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <div style={{ width: ANIM_W * k, height: ANIM_H * k }}>
          <div className="origin-top-left" style={{ width: ANIM_W, height: ANIM_H, transform: `scale(${k})` }}>
            <DocToReel />
          </div>
        </div>
        <UploadReel width={lg ? 340 : 300} height={lg ? ANIM_H * k : 360} />
      </div>
    </div>
  );
}
