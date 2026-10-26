import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OwnerPanel } from "@/components/owner/owner-panel";
import { AppShell } from "@/components/shell/app-shell";
import { ownerNeedsUnlock } from "@/lib/owner-passkey";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner", robots: { index: false } };

/** Owner-only: anyone else gets a 404, as if the page did not exist. */
export default async function OwnerPage() {
  const viewer = await getViewer();
  if (!viewer.isOwner) notFound(); // the real identity, even while testing as another tier
  // Once Face ID is set up, the panel needs a recent Face ID unlock.
  if (await ownerNeedsUnlock(viewer.realUserId)) redirect("/owner/unlock");
  return (
    <AppShell active="none">
      <OwnerPanel />
    </AppShell>
  );
}
