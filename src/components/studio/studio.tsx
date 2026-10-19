"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReelStyle } from "@/lib/reel-style";
import { openAccount } from "../account/account-store";
import { fileLabel, fileTone, reelTint } from "../reel/accent";
import { ChevronDown, PlusIcon, UserIcon, Wordmark } from "../ui/icons";
import { MarkedText } from "../ui/marked-text";
import { Sheet } from "../ui/sheet";
import { useLayout } from "../ui/use-media";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { ProBadge, ReelStylePanel } from "./reel-style-panel";

export type StudioDoc = {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  status: string;
  /** Planned reel count; null while planning. */
  total: number | null;
  readyCount: number;
  headline: string | null;
  hook: string | null;
};

export type StudioProps = { docs: StudioDoc[]; style: ReelStyle; canEdit: boolean };

const TYPES_HINT = "PDF, Word, slides, text or a photo of your notes";

function docStatus(d: StudioDoc): { label: string; tone: string } {
  if (d.status === "failed") return { label: "Failed", tone: "var(--coral)" };
  if (["uploading", "uploaded", "extracting", "planning"].includes(d.status) || !d.total) return { label: "Unspooling", tone: "var(--thread)" };
  if (d.readyCount < d.total) return { label: `${d.readyCount} of ${d.total} ready`, tone: "var(--thread)" };
  return { label: "Ready", tone: "var(--sage)" };
}

const reelsLabel = (d: StudioDoc) => (d.total ? `${d.total} ${d.total === 1 ? "reel" : "reels"}` : d.status === "failed" ? "No reels" : "Planning");

/** The hidden file input + opener (same flow as every other upload button: sign-up and limits live in useUploader). */
function usePicker() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  // /?upload=1 (a share page's call to action) opens the picker straight away.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("upload") !== "1") return;
    url.searchParams.delete("upload");
    window.history.replaceState(window.history.state, "", url);
    input.current?.click();
  }, []);
  const el = (
    <input
      ref={input}
      type="file"
      accept={FILE_ACCEPT}
      className="hidden"
      data-testid="studio-file"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) void upload(f);
      }}
    />
  );
  return { el, open: () => input.current?.click(), pending: Boolean(pending) };
}

/** The big round "+": the one thing to do here. */
function PlusButton({ onClick, pending, size }: { onClick: () => void; pending: boolean; size: "lg" | "md" }) {
  const box = size === "lg" ? "h-[132px] w-[132px]" : "h-[112px] w-[112px] ipad:h-[150px] ipad:w-[150px]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Upload a document"
      data-testid="studio-plus"
      className={`group relative flex ${box} items-center justify-center rounded-full bg-thread text-paper transition-transform hover:scale-[1.04] active:scale-[0.97] disabled:opacity-60`}
    >
      <span aria-hidden className="absolute inset-0 rounded-full border border-thread motion-safe:animate-[studio-ring_2.6s_ease-out_infinite]" />
      <PlusIcon size={size === "lg" ? 58 : 50} strokeWidth={2} />
    </button>
  );
}

/** A mini 9:16 frame: the document's first headline on its file-type tint. */
function DocThumb({ doc, size = "md" }: { doc: StudioDoc; size?: "sm" | "md" }) {
  const tone = fileTone(doc.fileType);
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden border border-white/[0.08] ${size === "sm" ? "h-[56px] w-[32px]" : "h-[78px] w-[44px]"}`}
      style={{ background: reelTint(tone, 22) }}
    >
      <span className={`absolute inset-x-[4px] top-[6px] line-clamp-5 font-hook font-extrabold leading-[1.25] text-white ${size === "sm" ? "text-[5px]" : "text-[6.5px]"}`}>
        {doc.headline ? <MarkedText text={doc.headline} /> : doc.hook ?? doc.name}
      </span>
      <span className="absolute bottom-[3px] left-[3px] font-mono text-[6px] text-white/70">{fileLabel(doc.fileType)}</span>
    </span>
  );
}

function DesktopStudio({ docs, style, canEdit }: StudioProps) {
  const picker = usePicker();
  return (
    <div className="flex h-full w-full min-h-0" data-testid="studio" data-layout="desktop">
      {picker.el}
      {/* Left: the account's documents */}
      <aside className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line xl:w-[320px]">
        <div className="px-5 pb-4 pt-5">
          <div className="text-[12.5px] text-muted">Studio</div>
          <h1 className="mt-2 font-display text-[22px] leading-[1.1] text-ink">Your documents</h1>
          <div className="mt-4 h-px bg-line" />
        </div>
        {docs.length ? (
          <ol className="space-y-0.5 px-2.5 pb-4" aria-label="Your documents">
            {docs.map((d) => {
              const s = docStatus(d);
              return (
                <li key={d.id}>
                  <Link href={`/s/${d.id}`} className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-white/[0.03]">
                    <DocThumb doc={d} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted">
                          {fileLabel(d.fileType)}, {reelsLabel(d)}
                        </span>
                        <span className="shrink-0 text-[12px] font-medium tabular-nums" style={{ color: s.tone }}>
                          {s.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-ink">{d.name}</span>
                      {d.name !== d.fileName && <span className="mt-0.5 block truncate text-[12px] text-muted">{d.fileName}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="px-5 text-[13px] leading-snug text-muted">Nothing here yet. Upload a document and its reels show up in this list.</p>
        )}
        <div className="mt-auto border-t border-line px-5 py-4">
          <Link href="/library" className="flex items-center justify-between text-[13.5px] text-muted transition-colors hover:text-ink">
            Library <span aria-hidden>→</span>
          </Link>
        </div>
      </aside>

      {/* Center: an empty reel frame with the "+" */}
      <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-6 py-6">
        <div
          className="relative flex aspect-[9/16] h-[calc(100dvh-112px)] max-h-[920px] min-h-[520px] shrink-0 flex-col items-center justify-center overflow-hidden border border-line bg-black px-6 text-center"
          data-testid="studio-frame"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "color-mix(in srgb, var(--thread) 5%, transparent)" }} />
          <PlusButton onClick={picker.open} pending={picker.pending} size="lg" />
          <div className="relative mt-7 font-display text-[26px] leading-[1.1] text-ink">{picker.pending ? "Starting upload" : "Upload a document"}</div>
          <p className="relative mt-2 max-w-[260px] text-[13.5px] leading-snug text-muted">{TYPES_HINT}. Or drop a file anywhere here.</p>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[104px] border-t border-line bg-paper/85" />
          <div className="absolute bottom-[34px] left-4 flex items-center gap-2 text-[12.5px] text-muted">
            <span className="flex h-7 w-7 items-center justify-center bg-thread font-wordmark text-[13px] font-bold text-[#08110e]" aria-hidden>
              u
            </span>
            Your next reel
          </div>
        </div>
      </div>

      {/* Right: Reel style (Pro) */}
      <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-line p-5 xl:w-[360px]">
        <ReelStylePanel initial={style} canEdit={canEdit} />
      </aside>
    </div>
  );
}

function MobileStudio({ docs, style, canEdit }: StudioProps) {
  const picker = usePicker();
  const [styleOpen, setStyleOpen] = useState(false);
  // The sheet remounts the panel each time it opens: keep what was saved meanwhile.
  const [saved, setSaved] = useState(style);
  const recent = docs.slice(0, 5);
  return (
    <div className="safe-bottom flex h-full w-full flex-col overflow-y-auto bg-paper" data-testid="studio" data-layout="mobile">
      {picker.el}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 ipad:h-16 ipad:px-6">
        <Link href="/" aria-label="Unspool" className="mr-auto">
          <Wordmark size={22} />
        </Link>
        <Link href="/library" className="px-2.5 py-2 text-[14px] text-muted ipad:text-[16px]">
          Library
        </Link>
        <button type="button" onClick={openAccount} aria-label="Account" className="flex h-9 w-9 items-center justify-center border border-line text-ink ipad:h-11 ipad:w-11">
          <UserIcon size={18} />
        </button>
      </div>

      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <PlusButton onClick={picker.open} pending={picker.pending} size="md" />
        <div className="mt-5 font-display text-[24px] leading-[1.1] text-ink ipad:text-[30px]">{picker.pending ? "Starting upload" : "Upload a document"}</div>
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-snug text-muted ipad:text-[15px]">{TYPES_HINT}</p>
      </div>

      <div className="mx-auto w-full max-w-[560px] shrink-0 px-4 pb-5 ipad:max-w-[680px]">
        <button
          type="button"
          onClick={() => setStyleOpen(true)}
          className="flex w-full items-center gap-3 border border-line bg-surface px-4 py-3 text-left"
          data-testid="style-row"
        >
          <Crown size={17} className="text-thread" aria-hidden />
          <span className="flex-1 text-[14px] font-medium text-ink ipad:text-[16px]">Reel style</span>
          {canEdit ? <span className="text-[12px] text-muted">Edit</span> : <ProBadge />}
          <ChevronDown size={16} className="-rotate-90 text-muted" />
        </button>

        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-ink ipad:text-[15px]">Recent</span>
          <Link href="/library" className="text-[12.5px] text-muted ipad:text-[14px]">
            See all
          </Link>
        </div>
        {recent.length ? (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {recent.map((d) => {
              const s = docStatus(d);
              return (
                <li key={d.id}>
                  <Link href={`/s/${d.id}`} className="flex items-center gap-3 py-2.5">
                    <DocThumb doc={d} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink ipad:text-[16px]">{d.name}</span>
                      <span className="block text-[12px] text-muted ipad:text-[13.5px]">
                        {fileLabel(d.fileType)}, {reelsLabel(d)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-medium tabular-nums" style={{ color: s.tone }}>
                      {s.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 border-y border-line py-4 text-[13px] text-muted">Your documents show up here.</p>
        )}
      </div>

      <Sheet open={styleOpen} onClose={() => setStyleOpen(false)} label="Reel style">
        <div className="max-h-[72dvh] overflow-y-auto">
          <ReelStylePanel initial={saved} canEdit={canEdit} compact onSaved={setSaved} />
        </div>
      </Sheet>
    </div>
  );
}

/** Home for signed-in accounts: upload in the middle, their documents, and the Pro reel style. */
export function Studio(props: StudioProps) {
  const layout = useLayout();
  if (layout === null) return <div className="h-full w-full bg-paper" />;
  return layout === "desktop" ? <DesktopStudio {...props} /> : <MobileStudio {...props} />;
}
