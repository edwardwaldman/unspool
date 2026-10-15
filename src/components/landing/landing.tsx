"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon } from "../ui/icons";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

/** First-visit screen: one big drop zone over a blurred sample reel that's quietly playing. */
export function Landing() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  const [over, setOver] = useState(false);
  const sample = SAMPLE_SPOOL.reels[0];

  return (
    <div className="relative h-full w-full overflow-hidden lg:rounded-[22px]">
      <div className="pointer-events-none absolute inset-0 scale-105 blur-[6px] brightness-[0.55]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={sample} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1020]/70 via-[#0b1020]/30 to-[#0b1020]/85" />

      <div className="relative z-10 flex h-full flex-col px-6 pb-[110px] pt-12 lg:pb-10">
        <div className="flex items-center gap-2.5 text-[22px] font-black tracking-tight lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-hlcyan">
            <span className="h-3 w-3 rounded-full border-[3px] border-[#0b1020]" />
          </span>
          unspool
        </div>

        <div className="mt-auto">
          <h1 className="text-[42px] font-black leading-[0.98] tracking-[-0.03em]">
            Drop a doc.
            <br />
            <span className="text-accent glow-text">Unspool it.</span>
          </h1>
          <p className="mt-3 max-w-[340px] text-[16px] leading-snug text-soft">
            Notes, a textbook chapter, a work PDF, a contract → 10 swipeable reels with voiceover, visuals and a quick quiz.
          </p>
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
        <button
          type="button"
          onClick={() => input.current?.click()}
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
          disabled={Boolean(pending)}
          className={`mt-7 flex w-full flex-col items-center justify-center rounded-[26px] border-2 border-dashed px-6 py-9 text-center backdrop-blur-md transition ${
            over ? "scale-[1.02] border-accent bg-accent/15" : "border-white/30 bg-white/[0.06] hover:border-white/60"
          }`}
        >
          {pending ? (
            <>
              <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
              <span className="mt-3 text-[17px] font-bold">Opening your feed…</span>
            </>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0b1020]">
                <UploadIcon size={28} />
              </span>
              <span className="mt-4 text-[20px] font-black tracking-tight">+ Upload</span>
              <span className="mt-1 text-[14px] text-soft">Drop a PDF, doc, or notes</span>
              <span className="mt-1 text-[12px] text-muted">PDF · DOCX · PPTX · TXT · MD · photos · up to 25 MB</span>
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-4 text-[14px] font-semibold text-soft">
          <Link href="/s/demo" className="underline-offset-4 hover:underline">
            ▶ Watch a sample
          </Link>
          <span className="text-white/25">·</span>
          <Link href="/about" className="underline-offset-4 hover:underline">
            How it works
          </Link>
        </div>
        <p className="mt-3 text-center text-[12px] text-muted">No sign-up needed. Reel 1 is free. Your files stay private.</p>
      </div>
    </div>
  );
}
