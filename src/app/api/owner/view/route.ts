import { cookies } from "next/headers";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { OWNER_VIEW_COOKIE, OWNER_VIEWS, getViewer, type OwnerView } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The TEST: OWNER VIEW box: look at the site signed out or as a real account of one tier.
// getViewer() honours the cookie only when the real signed-in user is the owner.

export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.isOwner) return error(404, "Not found");
  return json({ view: viewer.ownerView ?? "owner" });
}

/** { view: "owner" | "out" | "free" | "plus" | "pro" | "ultra" } */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.isOwner || !viewer.realUserId) return error(404, "Not found");
  const body = (await req.json().catch(() => ({}))) as { view?: string };
  const view = body.view === "owner" ? null : OWNER_VIEWS.includes(body.view as OwnerView) ? (body.view as OwnerView) : undefined;
  if (view === undefined) return error(400, "Unknown view");

  const jar = await cookies();
  if (view) jar.set(OWNER_VIEW_COOKIE, view, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 864e2 });
  else jar.delete(OWNER_VIEW_COOKIE);
  // Background jobs (planning, funding reels) have no cookie: they read the tier from the profile.
  await adminClient()
    .from("profiles")
    .update({ owner_view: view && view !== "out" ? view : null })
    .eq("id", viewer.realUserId);
  return json({ view: view ?? "owner" });
}
