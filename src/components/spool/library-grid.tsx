"use client";

import Link from "next/link";
import { useState } from "react";
import { fileLabel, reelAccent } from "../reel/accent";
import { MarkedText } from "../ui/marked-text";
import { PlayIcon, TrashIcon } from "../ui/icons";
import { toast } from "../ui/toast";

export type LibraryItem = {
  id: string;
  name: string;
  fileType: string;
  status: string;
  unlocked: boolean;
  /** Reels unlocked (credits or the free drip). */
  freeReels: number;
  /** Planned reel count; null while planning. */
  total: number | null;
  readyCount: number;
  createdAt: string;
  headline: string | null;
  hook: string | null;
};

function statusLabel(it: LibraryItem) {
  if (it.status === "failed") return "Failed";
  if (["uploading", "uploaded", "extracting", "planning"].includes(it.status)) return "Unspooling";
  const total = it.total ?? 0;
  if (!total) return "Planning";
  if (!it.unlocked && it.freeReels < total) return `${it.freeReels} of ${total} unlocked`;
  return it.readyCount >= total ? `${total} reels` : `${it.readyCount}/${total} ready`;
}

/** Profile-style grid of spools (one per uploaded document). */
export function LibraryGrid({ initial }: { initial: LibraryItem[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(false);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this document, its reels and audio? This can't be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((xs) => xs.filter((x) => x.id !== id));
      toast("Deleted");
    } else toast("Couldn't delete. Try again.");
  };

  if (!items.length) {
    return (
      <div className="border-t border-line px-6 py-16 text-center">
        <p className="font-display text-[30px] leading-tight">No spools yet.</p>
        <p className="mt-2 text-[14px] text-muted">Upload a document and it shows up here.</p>
        <Link href="/" className="btn-primary mt-6 px-5 py-2.5 text-[14px]">
          Upload a document
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="label">Spools</span>
        <button type="button" onClick={() => setEditing((e) => !e)} className="text-[13px] text-thread">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {/* Reel-cover cards: two across on phones, more on wider screens. No grid background, so a short list
          never leaves an empty slab beside it. */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, n) => {
          const failed = it.status === "failed";
          const busy = ["uploading", "uploaded", "extracting", "planning", "scripting"].includes(it.status);
          const accent = reelAccent(hash(it.id) % 9 + 1);
          const total = Math.max(1, it.total ?? 0);
          return (
            <div key={it.id} className="relative">
              <Link
                href={`/s/${it.id}`}
                className="group relative block aspect-[9/14] overflow-hidden rounded-[14px] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)] transition-transform active:scale-[0.98]"
                style={{ background: `radial-gradient(120% 70% at 30% 18%, color-mix(in srgb, ${accent} 55%, #0b0f0d) 0%, color-mix(in srgb, ${accent} 18%, #0b0f0d) 55%, #080b0a 100%)` }}
                data-testid="library-card"
              >
                {/* Top: the file type and, while it's being made or if it failed, a status pill */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="rounded-[4px] bg-black/45 px-1.5 py-[2px] font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] text-white/90">{fileLabel(it.fileType)}</span>
                  {(busy || failed) && (
                    <span className={`flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] font-semibold ${failed ? "bg-coral/90 text-[#1a0905]" : "bg-thread text-paper"}`}>
                      {!failed && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" />}
                      {failed ? "Failed" : "Making"}
                    </span>
                  )}
                </div>
                {/* The reel's hook, big, like a cover */}
                <div className="line-clamp-5 px-3 pt-1 font-display text-[16px] leading-[1.12] text-white [text-shadow:0_2px_10px_rgba(0,0,0,.35)] sm:text-[17px]">
                  {it.headline ? <MarkedText text={it.headline} /> : it.hook ?? it.name}
                </div>
                {!busy && !failed && (
                  <span className="absolute left-1/2 top-[58%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 pl-0.5 text-white opacity-90 backdrop-blur-sm transition-transform group-hover:scale-110">
                    <PlayIcon size={16} />
                  </span>
                )}
                {/* Bottom: name, how many reels are ready, and the reel progress */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pb-2.5 pt-8">
                  <div className="truncate text-[12.5px] font-semibold text-white">{it.name}</div>
                  <div className={`mt-0.5 font-mono text-[10.5px] ${failed ? "text-coral" : "text-white/65"}`}>{statusLabel(it)}</div>
                  <div className="mt-1.5 flex gap-[3px]">
                    {Array.from({ length: total }, (_, i) => (
                      <div key={i} className="h-[3px] flex-1 rounded-full" style={{ background: i < it.readyCount ? "var(--thread)" : "rgba(255,255,255,.18)" }} />
                    ))}
                  </div>
                </div>
              </Link>
              {editing && (
                <button
                  type="button"
                  aria-label={`Delete ${it.name}`}
                  onClick={() => remove(it.id)}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-coral bg-paper text-coral"
                >
                  <TrashIcon size={15} />
                </button>
              )}
              <span className="sr-only">{n + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A small stable number from an id (a card's colour stays the same between visits). */
function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
