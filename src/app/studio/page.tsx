import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Studio, type StudioDoc } from "@/components/studio/studio";
import { extensionOf, supabaseConfigured } from "@/lib/config";
import { parseReelStyle } from "@/lib/reel-style";
import { listDocuments } from "@/lib/spool";
import { canEditStyle } from "@/lib/studio";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio", robots: { index: false } };

/** A signed-in account's home: upload, their documents and reel style. Signed out goes to the landing. */
export default async function StudioPage() {
  if (!supabaseConfigured) redirect("/");
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/");
  const docs = await studioDocs(viewer).catch((err) => (console.error("studio: could not load documents", err), [] as StudioDoc[]));
  return (
    <AppShell active="reels" workbench>
      <Studio docs={docs} style={parseReelStyle(viewer.profile?.reel_style)} canEdit={canEditStyle(viewer)} />
    </AppShell>
  );
}

async function studioDocs(viewer: Viewer): Promise<StudioDoc[]> {
  const docs = await listDocuments(viewer, 30);
  if (!docs.length) return [];
  const { data: reels } = await adminClient()
    .from("reels")
    .select("document_id,index,status,hook,headline:script_json->>headline")
    .in(
      "document_id",
      docs.map((d) => d.id),
    );
  return docs.map((d) => {
    const mine = (reels ?? []).filter((r) => r.document_id === d.id);
    const first = mine.find((r) => r.index === 1);
    return {
      id: d.id,
      name: d.title ?? d.file_name,
      fileName: d.file_name,
      fileType: extensionOf(d.file_name),
      status: d.status,
      total: d.reel_count || mine.length || null,
      readyCount: mine.filter((r) => r.status === "ready").length,
      headline: (first?.headline as string | null) ?? null,
      hook: first?.hook ?? null,
    };
  });
}
