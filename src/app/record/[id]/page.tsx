import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordReel } from "@/components/record/record-reel";
import { checkRecordToken } from "@/lib/record-token";
import { loadReelForRecording } from "@/lib/reel-download";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recording", robots: { index: false, follow: false } };

/** The download recorder's view of one reel: the reel alone, playing on the recorder's clock (see reel-download.ts). */
export default async function RecordPage({ params, searchParams }: PageProps<"/record/[id]">) {
  const { id } = await params;
  const { token } = await searchParams;
  if (!checkRecordToken(id, typeof token === "string" ? token : undefined)) notFound();
  const found = await loadReelForRecording(id);
  if (!found) notFound();
  return <RecordReel spool={found.spool} reel={found.reel} />;
}
