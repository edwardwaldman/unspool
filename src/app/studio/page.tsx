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
import { freeReelLimit, isUnlocked } from "@/lib/access";
import { tierOf } from "@/lib/credits";
import { PLANS } from "@/lib/plans";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/viewer";
import { moveQueue, nextFreeReelAt } from "@/lib/queue";

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
  // Free accounts: start a queued upload if its turn has come, then show the countdown to the next free reel.
  const free = tierOf(viewer.profile) === "free";
  const moved = await moveQueue(viewer).catch((err) => (console.error("studio: queue", err), { queued: 0, nextAt: null }));
  const capAt = free ? (moved.nextAt ?? (await nextFreeReelAt(viewer).catch(() => null))) : null;
  const { docs, dripAt } = await studioDocs(viewer).catch((err) => (console.error("studio: could not load documents", err), { docs: [] as StudioDoc[], dripAt: null }));
  // The next free reel: the daily limit resetting, or else a document's next drip (whichever the account waits on).
  const nextAt = free ? (capAt ?? dripAt) : null;
  return (
    <AppShell active="reels" workbench>
      <Suspense>
        <CheckoutReturn />
      </Suspense>
      <Studio docs={docs} isNew={docs.length === 0 && isNew} fresh={isNew} email={viewer.email} plan={PLANS[tierOf(viewer.profile)].name} style={parseReelStyle(viewer.profile?.reel_style)} canEdit={canEditStyle(viewer)} queue={free || moved.queued ? { nextAt, queued: moved.queued } : undefined} />
    </AppShell>
  );
}

async function studioDocs(viewer: Viewer): Promise<{ docs: StudioDoc[]; dripAt: string | null }> {
  const docs = await listDocuments(viewer, 100);
  if (!docs.length) return { docs: [], dripAt: null };
  let dripAt: string | null = null;
  const { data: reels } = await adminClient()
    .from("reels")
    .select("document_id,index,title,status,hook,headline:script_json->>headline")
    .in(
      "document_id",
      docs.map((d) => d.id),
    );
  const out = docs.map((d) => {
    const mine = (reels ?? []).filter((r) => r.document_id === d.id);
    const first = mine.find((r) => r.index === 1);
    const { playable, nextFreeAt } = freeReelLimit(d, viewer, { reelRows: mine.length });
    const unlocked = isUnlocked(d, viewer);
    if (nextFreeAt && Date.parse(nextFreeAt) > Date.now() && (!dripAt || nextFreeAt < dripAt)) dripAt = nextFreeAt;
    return {
      id: d.id,
      name: d.title ?? d.file_name,
      fileName: d.file_name,
      fileType: extensionOf(d.file_name),
      rawType: d.file_type ?? "",
      status: d.status,
      unlocked,
      freeReels: playable,
      createdAt: d.created_at,
      total: d.reel_count || mine.length || null,
      readyCount: mine.filter((r) => r.status === "ready").length,
      headline: (first?.headline as string | null) ?? null,
      hook: first?.hook ?? null,
      reels: mine
        .sort((a, b) => a.index - b.index)
        .map((r) => ({ index: r.index, title: r.title, status: r.status, headline: (r.headline as string | null) ?? r.hook ?? null, locked: !d.unlocked && r.index > playable })),
    };
  });
  return { docs: out, dripAt };
}

/** Made in the last day. */
function isNewAccount(createdAt: string | undefined) {
  return Boolean(createdAt) && Date.now() - Date.parse(createdAt!) < 24 * 3600e3;
}
