import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OwnerPanel } from "@/components/owner/owner-panel";
import { AppShell } from "@/components/shell/app-shell";
import { isOwnerEmail } from "@/lib/owner";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner", robots: { index: false } };

/** Owner-only: anyone else gets a 404, as if the page did not exist. */
export default async function OwnerPage() {
  const viewer = await getViewer();
  if (!viewer.userId || !isOwnerEmail(viewer.email)) notFound();
  return (
    <AppShell active="none">
      <OwnerPanel />
    </AppShell>
  );
}
