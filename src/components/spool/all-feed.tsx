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
      <div className="reel-bg flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="text-[44px]">🧵</div>
        <h1 className="mt-3 text-[24px] font-black">No reels yet</h1>
        <p className="mt-2 max-w-[280px] text-[15px] text-muted">
          {failed ?? "Drop a doc and your reels from every spool show up here, ready for a pre-test scroll."}
        </p>
        <Link href="/" className="mt-6 rounded-full bg-white px-5 py-2.5 font-bold text-[#0b1020]">
          Unspool a doc
        </Link>
      </div>
    );
  }
  if (!data) return <div className="reel-bg h-full w-full" />;

  const current = items[index]?.spool;
  return <Feed items={items} viewer={data.viewer} tab="all" docHref={current ? `/s/${current.id}` : undefined} onIndexChange={setIndex} />;
}
