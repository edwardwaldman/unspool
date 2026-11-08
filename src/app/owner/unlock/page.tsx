import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerUnlock } from "@/components/owner/owner-unlock";
import { listPasskeys } from "@/lib/owner-passkey";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
// Its own home-screen app: "Add to Home Screen" here opens the Face ID door, not the Unspool homepage.
export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false },
  manifest: "/owner.webmanifest",
  appleWebApp: { capable: true, title: "Unspool Owner", statusBarStyle: "black" },
};

/** The owner panel's Face ID door: unlock (and sign in) with a passkey, or set one up on this device. */
export default async function OwnerUnlockPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const viewer = await getViewer();
  const keys = await listPasskeys().catch(() => []);
  // Already signed in as the owner: no Face ID needed, straight into the panel (unless setting Face ID up: ?add=1).
  if (viewer.isOwner && keys.length && !(await searchParams).add) redirect("/owner");
  return <OwnerUnlock hasPasskey={keys.length > 0} signedInOwner={viewer.isOwner} canAddDevice={viewer.isOwner} />;
}
