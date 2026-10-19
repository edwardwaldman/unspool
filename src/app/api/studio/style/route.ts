import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { isReelStyle, parseReelStyle } from "@/lib/reel-style";
import { canEditStyle } from "@/lib/studio";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** The account's reel style and whether this viewer may change it (Pro and Ultra). */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first");
  return json({ style: parseReelStyle(viewer.profile?.reel_style), canEdit: canEditStyle(viewer) });
}

export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first");
  if (!canEditStyle(viewer)) return error(403, "Reel style is a Pro feature", { code: "pro_required" });
  const raw = ((await req.json().catch(() => null)) as { style?: unknown } | null)?.style;
  if (!isReelStyle(raw)) return error(400, "Invalid style");
  const style = parseReelStyle(raw);
  const { error: dbErr } = await adminClient().from("profiles").update({ reel_style: style }).eq("id", viewer.userId);
  if (dbErr) {
    console.error("studio/style: save failed", dbErr);
    return error(500, "Couldn't save your style. Try again.");
  }
  return json({ style, canEdit: true });
}
