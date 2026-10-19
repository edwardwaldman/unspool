"use client";

import { Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

// A signed-in account with no documents yet: the workbench, empty. A big upload button in the middle;
// the reel list and the reel details stay blank until the first document is unspooled.


export function EmptyWorkbench() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className="flex h-full w-full min-h-0">
      <aside className="hidden w-[320px] shrink-0 flex-col border-r border-line lg:flex">
        <div className="px-5 pb-4 pt-5">
          <div className="text-[12.5px] text-muted">No document yet</div>
          <div className="mt-3 h-5 w-[70%] bg-white/[0.04]" />
          <div className="mt-2 h-3 w-[45%] bg-white/[0.03]" />
          <div className="mt-5 h-px bg-line" />
        </div>
        <div className="border-t border-line px-5 pb-2 pt-4 text-[13px] font-medium text-ink">Reels</div>
        <ol className="space-y-0.5 px-2.5 pb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 p-2">
              <span className="h-[78px] w-[44px] shrink-0 border border-dashed border-line" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-2.5 bg-white/[0.04]" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                <span className="block h-2 w-[40%] bg-white/[0.03]" />
              </span>
            </li>
          ))}
        </ol>
        <p className="px-5 text-[12.5px] leading-snug text-muted">Your reels show up here, one per idea in the document.</p>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-6">
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
        <div className="relative">
          <motion.button
            type="button"
            onClick={() => input.current?.click()}
            disabled={Boolean(pending)}
            aria-label="Upload a document"
            className="relative flex h-48 w-48 flex-col items-center justify-center gap-2 bg-thread text-[#08110e] shadow-[0_0_60px_rgba(211,240,90,.35)] disabled:opacity-60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}>
              <Upload size={62} strokeWidth={2.4} />
            </motion.span>
            <span className="font-hook text-[17px] font-extrabold uppercase tracking-[0.04em]">{pending ? "Opening" : "Upload"}</span>
          </motion.button>
        </div>
        <h1 className="mt-10 text-center font-display text-[30px] leading-tight">Drop in your first document.</h1>
        <p className="mt-2 max-w-[380px] text-center text-[14.5px] text-muted">A PDF, chapter, slides or a photo of your notes. It turns into reels you can scroll.</p>
      </div>

      <aside className="hidden w-[360px] shrink-0 border-l border-line p-5 xl:block">
        <div className="text-[13px] font-medium text-muted">About this reel</div>
        <div className="mt-4 h-6 w-[75%] bg-white/[0.04]" />
        <div className="mt-2 h-3 w-[50%] bg-white/[0.03]" />
        <div className="mt-6 border-l-2 border-line py-1 pl-4">
          <div className="text-[13px] font-semibold text-muted">Key point</div>
          <div className="mt-2 h-3 w-[85%] bg-white/[0.03]" />
        </div>
        <div className="mt-6 border border-dashed border-line p-4 text-[13px] text-muted">Transcript and a quick check appear here for each reel.</div>
      </aside>
    </div>
  );
}
