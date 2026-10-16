"use client";

import Link from "next/link";
import { useRef } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { ReelView } from "../reel/reel-view";
import { UploadIcon, Wordmark } from "../ui/icons";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

/** First-visit screen: headline + one upload button over a blurred sample reel. Drops anywhere work too. */
export function Landing() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();

  return (
    <div className="relative h-full w-full overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 scale-105 opacity-35 blur-[7px]" aria-hidden>
        <ReelView spool={SAMPLE_SPOOL} reel={SAMPLE_SPOOL.reels[0]} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
      </div>
      <div className="absolute inset-0 bg-paper/60" />

      <div className="relative z-10 flex h-full flex-col px-6 pb-[110px] pt-10 lg:pb-10">
        <div className="lg:hidden">
          <Wordmark size={24} />
        </div>

        <h1 className="mt-auto font-display text-[46px] leading-[0.98]">
          Drop a doc.
          <br />
          <span className="text-thread">Unspool it.</span>
        </h1>

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
          disabled={Boolean(pending)}
          className="btn-primary mt-8 w-full py-4 text-[15px]"
        >
          {pending ? (
            "Opening your feed"
          ) : (
            <>
              <UploadIcon size={17} /> Upload a document
            </>
          )}
        </button>
        <Link href="/s/demo" className="mt-4 self-center text-[14px] text-muted hover:text-ink">
          Watch a sample
        </Link>
      </div>
    </div>
  );
}
