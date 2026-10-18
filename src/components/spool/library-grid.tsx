"use client";

import Link from "next/link";
import { useState } from "react";
import { fileLabel } from "../reel/accent";
import { MarkedText } from "../ui/marked-text";
import { TrashIcon } from "../ui/icons";
import { toast } from "../ui/toast";

export type LibraryItem = {
  id: string;
  name: string;
  fileType: string;
  status: string;
  unlocked: boolean;
  /** Reels free to play right now (the hourly drip). */
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
  if (!it.unlocked && it.freeReels < total) return `${it.freeReels} of ${total} free`;
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
      <div className="grid grid-cols-3 gap-px bg-line sm:grid-cols-4">
        {items.map((it) => {
          const failed = it.status === "failed";
          return (
            <div key={it.id} className="relative bg-paper">
              <Link href={`/s/${it.id}`} className="relative block aspect-[9/16] overflow-hidden bg-paper">
                <div
                  aria-hidden
                  className="absolute left-1/2 top-[64%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-thread opacity-15 blur-2xl"
                />
                <div className="relative line-clamp-6 p-2.5 font-hook text-[12.5px] font-extrabold leading-[1.12] tracking-[-0.01em] text-ink">
                  {it.headline ? <MarkedText text={it.headline} /> : it.hook ?? it.name}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-paper/85 p-2">
                  <div className="mb-1.5 flex gap-px">
                    {Array.from({ length: Math.max(1, it.total ?? 0) }, (_, i) => (
                      <div key={i} className="h-[2px] flex-1" style={{ background: i < it.readyCount ? "var(--thread)" : "var(--border)" }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="border border-line px-1 font-mono text-[8px] text-muted">{fileLabel(it.fileType)}</span>
                    <span className="truncate text-[11px]">{it.name}</span>
                  </div>
                  <div className={`mt-0.5 font-mono text-[10px] ${failed ? "text-coral" : "text-muted"}`}>{statusLabel(it)}</div>
                </div>
              </Link>
              {editing && (
                <button
                  type="button"
                  aria-label={`Delete ${it.name}`}
                  onClick={() => remove(it.id)}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center border border-coral bg-paper text-coral"
                >
                  <TrashIcon size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
