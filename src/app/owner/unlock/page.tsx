import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerUnlock } from "@/components/owner/owner-unlock";
import { isUnlocked, listPasskeys } from "@/lib/owner-passkey";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner", robots: { index: false, follow: false } };

/** The owner panel's Face ID door: unlock (and sign in) with a passkey, or set one up on this device. */
export default async function OwnerUnlockPage() {
  const viewer = await getViewer();
  const keys = await listPasskeys().catch(() => []);
  const unlocked = viewer.isOwner && (await isUnlocked(viewer.realUserId));
  if (viewer.isOwner && keys.length && unlocked) redirect("/owner");
  return <OwnerUnlock hasPasskey={keys.length > 0} signedInOwner={viewer.isOwner} canAddDevice={viewer.isOwner && (!keys.length || unlocked)} />;
}
