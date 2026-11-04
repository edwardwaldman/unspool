"use client";

import { Feed } from "@/components/reel/feed";
import { SAMPLE_SPOOL } from "@/lib/sample";
import type { ReelScript } from "@/lib/schema";

export function LabPlayer({ script }: { script: ReelScript }) {
  const spool = { ...SAMPLE_SPOOL, id: "lab", demo: false, title: script.title, totalReels: 1, freeReels: 1, reels: [{ id: "lab-1", index: script.index, title: script.title, hook: "", status: "ready" as const, locked: false, script }] };
  return (
    <div style={{ height: "100dvh" }}>
      <Feed items={[{ key: "lab-1", spool, reel: spool.reels[0] }]} viewer={null} tab="doc" />
    </div>
  );
}
