"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon, Wordmark } from "../ui/icons";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

const FACTS = [
  ["10", "reels per doc"],
  ["30–60s", "each"],
  ["1", "quiz per reel"],
] as const;

/** First-visit screen: one drop zone over a blurred sample reel that's quietly playing. */
export function Landing() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  const [over, setOver] = useState(false);
  const sample = SAMPLE_SPOOL.reels[0];

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 scale-105 opacity-35 blur-[7px]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={sample} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-ink/55" />

      <div className="relative z-10 flex h-full flex-col px-6 pb-[104px] pt-10 lg:pb-8">
        <div className="lg:hidden">
          <Wordmark size={26} />
        </div>

        <div className="mt-auto">
          <div className="label">For notes, chapters, PDFs and contracts</div>
          <h1 className="mt-3 font-display text-[54px] leading-[0.95] tracking-[-0.015em]">
            Drop a doc.
            <br />
            <em className="text-thread">Unspool it.</em>
          </h1>
          <p className="mt-4 max-w-[340px] text-[15.5px] leading-relaxed text-cream/80">
            Unspool turns any document into short reels with voiceover, visuals and a quick quiz, so you actually absorb it.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 border-y border-line">
          {FACTS.map(([n, l], i) => (
            <div key={l} className={`py-3 ${i > 0 ? "border-l border-line pl-3" : ""}`}>
              <div className="font-mono text-[17px] text-cream">{n}</div>
              <div className="label mt-0.5 !text-[10px]">{l}</div>
            </div>
          ))}
        </div>

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
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void upload(f);
          }}
          className={`mt-6 border border-dashed p-5 transition-colors ${over ? "border-thread bg-thread/5" : "border-line bg-ink/60"}`}
        >
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={Boolean(pending)}
            className="btn-primary w-full py-3.5 text-[15px]"
          >
            {pending ? (
              "Opening your feed"
            ) : (
              <>
                <UploadIcon size={17} /> Upload a document
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[13px] text-muted">or drop a PDF, Word, PowerPoint, text file or photo here</p>
        </div>

        <div className="mt-5 flex items-center justify-between text-[13.5px]">
          <Link href="/s/demo" className="text-cream underline decoration-line underline-offset-4 hover:decoration-cream">
            Watch a sample
          </Link>
          <Link href="/about" className="text-muted hover:text-cream">
            How it works
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-muted">No account needed. Reel 1 is free. Files stay private.</p>
      </div>
    </div>
  );
}
