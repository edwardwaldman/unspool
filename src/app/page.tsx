import { Suspense } from "react";
import { Landing } from "@/components/landing/landing";
import { AppShell } from "@/components/shell/app-shell";
import { SpoolFeed } from "@/components/spool/spool-feed";
import { supabaseConfigured } from "@/lib/config";
import { listDocuments } from "@/lib/spool";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** First-time visitors get the drop zone; returning users land straight in their latest spool. */
export default async function Home() {
  let latest: string | null = null;
  if (supabaseConfigured) {
    const viewer = await getViewer();
    const docs = await listDocuments(viewer, 5);
    latest = docs.find((d) => d.status !== "failed" && d.status !== "uploading")?.id ?? null;
  }
  if (latest) {
    return (
      <AppShell active="reels" feed>
        <Suspense>
          <SpoolFeed id={latest} />
        </Suspense>
      </AppShell>
    );
  }
  return (
    <AppShell active="home" feed>
      <Landing />
    </AppShell>
  );
}
