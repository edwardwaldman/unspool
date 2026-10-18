import { cookies } from "next/headers";
import { ANON_COOKIE, REF_COOKIE, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { SHARE_SLUG } from "@/lib/shares";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** After a password sign-in/sign-up, attach this browser's anonymous spools to the account. */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Not signed in");
  const jar = await cookies();
  const anon = jar.get(ANON_COOKIE)?.value;
  if (anon) {
    await adminClient().from("documents").update({ user_id: viewer.userId, anon_token: null }).is("user_id", null).eq("anon_token", anon);
  }
  // Came in through someone's share link: record it once (first touch), for attribution later.
  const ref = jar.get(REF_COOKIE)?.value;
  if (ref && SHARE_SLUG.test(ref)) {
    await adminClient().from("profiles").update({ referred_by_share: ref }).eq("id", viewer.userId).is("referred_by_share", null);
  }
  return json({ ok: true });
}
