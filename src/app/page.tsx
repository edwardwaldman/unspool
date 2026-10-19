import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { AppShell } from "@/components/shell/app-shell";
import { Studio, type StudioDoc, type StudioProps } from "@/components/studio/studio";
import { extensionOf, supabaseConfigured } from "@/lib/config";
import { parseReelStyle } from "@/lib/reel-style";
import { listDocuments } from "@/lib/spool";
import { canEditStyle } from "@/lib/studio";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The home page's own canonical and share URL (kept off the root layout so other pages don't inherit them).
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/", title: "Unspool — Turn any document into study reels", description: "Your textbook, but it's reels. Voiceover, captions and a quiz in every one.", siteName: "Unspool", type: "website", locale: "en_US", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Unspool — One document into reels" }] } };

/** Signed-out visitors get the landing; signed-in accounts get the Studio (upload, their documents, reel style). */
export default async function Home() {
  let studio: StudioProps | null = null;
  let ownerOut = false;
  if (supabaseConfigured) {
    // A missing server key or a database hiccup must never take the landing page down.
    try {
      const viewer = await getViewer();
      ownerOut = viewer.isOwner && viewer.ownerView === "out";
      if (viewer.userId) studio = { docs: await studioDocs(viewer), style: parseReelStyle(viewer.profile?.reel_style), canEdit: canEditStyle(viewer) };
    } catch (err) {
      console.error("home: could not load the studio", err);
    }
  }
  if (studio) {
    return (
      <AppShell active="reels" workbench>
        <Studio {...studio} />
      </AppShell>
    );
  }
  return (
    <AppShell active="home">
      <Landing studioOnSignIn={!ownerOut} />
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
