import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutReturn } from "@/components/shell/account-actions";
import { AppShell } from "@/components/shell/app-shell";
import { Studio, type StudioDoc } from "@/components/studio/studio";
import { extensionOf, supabaseConfigured } from "@/lib/config";
import { parseReelStyle } from "@/lib/reel-style";
import { listDocuments } from "@/lib/spool";
import { canEditStyle } from "@/lib/studio";
import { freeReelLimit } from "@/lib/access";
import { tierOf } from "@/lib/credits";
import { PLANS } from "@/lib/plans";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio", robots: { index: false } };

/** A signed-in account's home: upload, their documents and reel style. Signed out goes to the landing. */
export default async function StudioPage() {
  if (!supabaseConfigured) redirect("/");
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/");
  // A brand-new account (made in the last day, nothing uploaded yet) gets the welcome pop-up and Studio tour.
  const { data: auth } = await adminClient().auth.admin.getUserById(viewer.realUserId ?? viewer.userId).catch(() => ({ data: { user: null } }));
  const isNew = isNewAccount(auth.user?.created_at);
  const docs = await studioDocs(viewer).catch((err) => (console.error("studio: could not load documents", err), [] as StudioDoc[]));
  return (
    <AppShell active="reels" workbench>
      <Suspense>
        <CheckoutReturn />
      </Suspense>
      <Studio docs={docs} isNew={docs.length === 0 && isNew} email={viewer.email} plan={PLANS[tierOf(viewer.profile)].name} style={parseReelStyle(viewer.profile?.reel_style)} canEdit={canEditStyle(viewer)} />
    </AppShell>
  );
}

async function studioDocs(viewer: Viewer): Promise<StudioDoc[]> {
  const docs = await listDocuments(viewer, 100);
  if (!docs.length) return [];
  const { data: reels } = await adminClient()
    .from("reels")
    .select("document_id,index,title,status,hook,headline:script_json->>headline")
    .in(
      "document_id",
      docs.map((d) => d.id),
    );
  return docs.map((d) => {
    const mine = (reels ?? []).filter((r) => r.document_id === d.id);
    const first = mine.find((r) => r.index === 1);
    const { playable } = freeReelLimit(d, viewer, { reelRows: mine.length });
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
      reels: mine
        .sort((a, b) => a.index - b.index)
        .map((r) => ({ index: r.index, title: r.title, status: r.status, headline: (r.headline as string | null) ?? r.hook ?? null, locked: !d.unlocked && r.index > playable })),
    };
  });
}

/** Made in the last day. */
function isNewAccount(createdAt: string | undefined) {
  return Boolean(createdAt) && Date.now() - Date.parse(createdAt!) < 24 * 3600e3;
}
