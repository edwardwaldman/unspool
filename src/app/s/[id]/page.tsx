import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DemoVideos } from "@/components/spool/demo-videos";
import { SpoolFeed } from "@/components/spool/spool-feed";

export const metadata: Metadata = { title: "Your spool", robots: { index: false } };

export default async function SpoolPage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  return (
    <AppShell active="reels" workbench>
      {id === "demo" ? (
        <DemoVideos />
      ) : (
        <Suspense>
          <SpoolFeed id={id} />
        </Suspense>
      )}
    </AppShell>
  );
}
