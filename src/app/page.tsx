import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/landing";
import { AppShell } from "@/components/shell/app-shell";
import { supabaseConfigured } from "@/lib/config";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The home page's own canonical and share URL (kept off the root layout so other pages don't inherit them).
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/", title: "Unspool — Turn any document into study reels", description: "Your textbook, but it's reels. Voiceover, captions and a quiz in every one.", siteName: "Unspool", type: "website", locale: "en_US", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Unspool — One document into reels" }] } };

/** Signed-out visitors get the landing; signed-in accounts always land in their Studio at /studio. */
export default async function Home({ searchParams }: PageProps<"/">) {
  let signedIn = false;
  let ownerOut = false;
  if (supabaseConfigured) {
    // A missing server key or a database hiccup must never take the landing page down.
    try {
      const viewer = await getViewer();
      ownerOut = viewer.isOwner && viewer.ownerView === "out";
      signedIn = Boolean(viewer.userId);
    } catch (err) {
      console.error("home: could not read the viewer", err);
    }
  }
  if (signedIn) {
    // Keep ?upload=1&ref=... from share pages so the Studio can open the picker.
    const sp = await searchParams;
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v);
    redirect(q.size ? `/studio?${q}` : "/studio");
  }
  return (
    <AppShell active="home">
      <Landing studioOnSignIn={!ownerOut} />
    </AppShell>
  );
}

