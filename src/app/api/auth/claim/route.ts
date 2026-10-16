import { cookies } from "next/headers";
import { ANON_COOKIE, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** After a password sign-in/sign-up, attach this browser's anonymous spools to the account. */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Not signed in");
  const anon = (await cookies()).get(ANON_COOKIE)?.value;
  if (anon) {
    await adminClient().from("documents").update({ user_id: viewer.userId, anon_token: null }).is("user_id", null).eq("anon_token", anon);
  }
  return json({ ok: true });
}
