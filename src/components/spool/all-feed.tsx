"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { Feed, type FeedItem } from "../reel/feed";

/** "All spools": one continuous feed of every playable reel across the user's documents. */
export function AllFeed() {
  const [data, setData] = useState<{ spools: SpoolDTO[]; viewer: ViewerDTO } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error ?? "Couldn't load your spools.");
        setData(b);
      })
      .catch((e: Error) => setFailed(e.message));
  }, []);

  const items: FeedItem[] = useMemo(
    () =>
      (data?.spools ?? []).flatMap((s) =>
        s.reels.filter((r) => !r.locked && r.status === "ready").map((r) => ({ key: r.id, spool: s, reel: r })),
      ),
    [data],
  );

  if (failed || (data && items.length === 0)) {
    return (
      <div className="flex h-full flex-col justify-center bg-ink px-8">
        <div className="label">All spools</div>
        <h1 className="mt-3 font-display text-[38px] leading-[1.02]">No reels yet.</h1>
        <p className="mt-2 max-w-[300px] text-[15px] text-muted">
          {failed ?? "Reels from every document you upload collect here, for one long review before a test."}
        </p>
        <Link href="/" className="btn-primary mt-6 self-start px-5 py-2.5 text-[14px]">
          Upload a document
        </Link>
      </div>
    );
  }
  if (!data) return <div className="h-full w-full bg-ink" />;

  const current = items[index]?.spool;
  return <Feed items={items} viewer={data.viewer} tab="all" docHref={current ? `/s/${current.id}` : undefined} onIndexChange={setIndex} />;
}
