import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DemoVideos } from "@/components/spool/demo-videos";
import { SpoolFeed } from "@/components/spool/spool-feed";

export async function generateMetadata({ params }: PageProps<"/s/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id !== "demo") return { title: "Your spool", robots: { index: false } };
  // The public demo is the one spool search engines should see.
  const description = "Watch three sample study reels Unspool made from real documents: a hook, voiceover, captions and a quiz in every one.";
  return {
    title: "Watch a demo",
    description,
    alternates: { canonical: "/s/demo" },
    openGraph: {
      url: "/s/demo",
      title: "Unspool demo — documents turned into reels",
      description,
      type: "video.other",
      videos: [{ url: "/demo/reel-1.mp4", type: "video/mp4", width: 720, height: 1280 }],
      images: [{ url: "/demo/reel-1.jpg", width: 720, height: 1280, alt: "An Unspool sample reel" }],
    },
  };
}

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
