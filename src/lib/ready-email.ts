import "server-only";
import { siteUrl } from "./config";
import { compose, emailConfigured, sendEmail } from "./email";
import { adminClient } from "./supabase/admin";

// "Your reels are ready" email, sent once per document when its first reel finishes.
// Why: people upload, wait for the first reel, close the tab and never come back (several early accounts made
// 9-15 reels and watched none). Signed-in documents only (anonymous uploads have no address); never test mode.

export async function notifyFirstReelReady(documentId: string) {
  if (!emailConfigured()) return;
  const db = adminClient();
  const { data: doc } = await db.from("documents").select("id,user_id,title,test_mode").eq("id", documentId).maybeSingle<{ id: string; user_id: string | null; title: string | null; test_mode: boolean | null }>();
  if (!doc?.user_id || doc.test_mode) return;
  const { data: u } = await db.auth.admin.getUserById(doc.user_id);
  const to = u?.user?.email;
  if (!to) return;
  const url = `${siteUrl()}/s/${doc.id}`;
  const name = doc.title?.trim() ? `“${doc.title.trim()}”` : "your upload";
  const mail = compose(
    "Your reels are ready 🎬",
    `Your first reel of ${name} is ready to watch.\n\nOpen it here: ${url}\n\nWatch it, then try the quiz at the end to see what stuck.`,
    "You're getting this because you made reels on Unspool. Reply \"stop\" and we won't email you again.",
  );
  const err = await sendEmail({ to, ...mail });
  if (err) console.error("[ready-email] send failed", documentId, err);
}
