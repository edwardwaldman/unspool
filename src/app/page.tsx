import { Suspense } from "react";
import { Landing } from "@/components/landing/landing";
import { AppShell } from "@/components/shell/app-shell";
import { SpoolFeed } from "@/components/spool/spool-feed";
import { supabaseConfigured } from "@/lib/config";
import { listDocuments } from "@/lib/spool";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** First-time visitors get the landing; returning users land straight in their latest spool. */
export default async function Home() {
  let latest: string | null = null;
  if (supabaseConfigured) {
    // A missing server key or a database hiccup must never take the landing page down.
    try {
      const viewer = await getViewer();
      const docs = await listDocuments(viewer, 5);
      latest = docs.find((d) => d.status !== "failed" && d.status !== "uploading")?.id ?? null;
    } catch (err) {
      console.error("home: could not load documents", err);
    }
  }
  if (latest) {
    return (
      <AppShell active="reels" workbench>
        <Suspense>
          <SpoolFeed id={latest} />
        </Suspense>
      </AppShell>
    );
  }
  return (
    <AppShell active="home">
      <Landing />
    </AppShell>
  );
}
