"use client";

import { BigUpload } from "../landing/info-slide";

// A signed-in account with no documents yet: the workbench, empty. A big upload button in the middle;
// the reel list and the reel details stay blank until the first document is unspooled.

export function EmptyWorkbench() {
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

      <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-4">
        <BigUpload demoLink={false} wideTags={false} />
        <p className="max-w-[380px] text-center text-[14.5px] text-muted">A PDF, chapter, slides or a photo of your notes. It turns into reels you can scroll.</p>
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
