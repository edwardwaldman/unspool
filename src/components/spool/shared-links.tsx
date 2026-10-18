"use client";

import { useEffect, useState } from "react";
import { toast } from "../ui/toast";

type Share = { slug: string; views: number; createdAt: string };

/** Workbench right panel: the current reel's active share links, their views, and revoke. */
export function SharedLinks({ reelId, onShare }: { reelId: string; onShare: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/reels/${reelId}/share`)
      .then((r) => (r.ok ? r.json() : { shares: [] }))
      .then((b: { shares?: Share[] }) => live && setShares(b.shares ?? []))
      .catch(() => live && setShares([]));
    return () => {
      live = false;
    };
  }, [reelId]);

  const revoke = async (slug: string) => {
    const res = await fetch(`/api/reels/${reelId}/share?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!res.ok) return toast("Couldn't revoke. Try again.");
    setShares((s) => (s ?? []).filter((x) => x.slug !== slug));
    toast("Link revoked");
  };

  return (
    <section className="mt-4 border border-line p-4" data-testid="shared-links">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-ink">Shared links</span>
        <button type="button" onClick={onShare} className="text-[12.5px] text-thread hover:underline">
          Share
        </button>
      </div>
      {shares === null ? (
        <div className="shimmer mt-3 h-3 w-[60%]" />
      ) : shares.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-muted">Not shared yet. A link plays this one reel for anyone.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {shares.map((s) => (
            <li key={s.slug} className="flex items-center gap-3 py-2 text-[13px]">
              <a href={`/r/${s.slug}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink/85 hover:text-thread">
                /r/{s.slug}
              </a>
              <span className="shrink-0 tabular-nums text-muted">
                {s.views} {s.views === 1 ? "view" : "views"}
              </span>
              <button type="button" onClick={() => revoke(s.slug)} className="shrink-0 text-[12.5px] text-coral hover:underline">
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
