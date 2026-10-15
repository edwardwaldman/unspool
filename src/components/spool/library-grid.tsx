"use client";

import Link from "next/link";
import { useState } from "react";
import { accentFor, fileBadge } from "../reel/accent";
import { MarkedText } from "../ui/marked-text";
import { TrashIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import type { Accent } from "@/lib/schema";

export type LibraryItem = {
  id: string;
  name: string;
  fileType: string;
  status: string;
  unlocked: boolean;
  readyCount: number;
  createdAt: string;
  headline: string | null;
  hook: string | null;
  accent: Accent | null;
};

function statusLabel(it: LibraryItem) {
  if (it.status === "failed") return "Failed";
  if (it.status === "uploading" || it.status === "uploaded" || it.status === "extracting" || it.status === "planning") return "Unspooling…";
  if (!it.unlocked) return "🔒 1 of 10 free";
  return it.readyCount >= 10 ? "10 reels" : `${it.readyCount}/10 ready`;
}

/** TikTok-profile-style grid of spools (one per uploaded document). */
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
      <div className="px-6 py-16 text-center">
        <div className="text-[44px]">🧵</div>
        <p className="mt-3 text-[17px] font-bold">No spools yet</p>
        <p className="mt-1 text-[14px] text-muted">Tap + to drop your first doc.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 font-bold text-[#0b1020]">
          Unspool a doc
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">Spools</div>
        <button type="button" onClick={() => setEditing((e) => !e)} className="text-[14px] font-semibold text-accent">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-[3px] sm:grid-cols-4">
        {items.map((it, i) => {
          const accent = accentFor(it.accent ?? undefined, i + 1);
          const badge = fileBadge(it.fileType);
          return (
            <div key={it.id} className="relative">
              <Link
                href={`/s/${it.id}`}
                className="reel-bg relative block aspect-[9/16] overflow-hidden"
                style={{ "--accent": accent } as React.CSSProperties}
              >
                <div
                  className="absolute left-1/2 top-[62%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-xl"
                  style={{ background: accent }}
                />
                <div className="relative p-2.5 text-[12.5px] font-black leading-[1.12] tracking-tight text-[#e6e9f2] line-clamp-6">
                  {it.headline ? <MarkedText text={it.headline} /> : it.hook ?? it.name}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded px-1 py-[1px] text-[8px] font-black text-[#0b1020]" style={{ background: badge.color }}>
                      {badge.label}
                    </span>
                    <span className="truncate text-[11px] font-bold">{it.name}</span>
                  </div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-soft">{statusLabel(it)}</div>
                </div>
              </Link>
              {editing && (
                <button
                  type="button"
                  aria-label={`Delete ${it.name}`}
                  onClick={() => remove(it.id)}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-warn text-[#0b1020]"
                >
                  <TrashIcon size={17} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
