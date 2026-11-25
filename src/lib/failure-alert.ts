import "server-only";
import { classifyFailure } from "./ai-status";
import { siteUrl } from "./config";
import { compose, emailConfigured, sendEmail } from "./email";
import { ownerEmails } from "./owner";
import { adminClient } from "./supabase/admin";

// Email the owner when uploads start failing in a row, so a broken key costs minutes, not days (on Nov 23-25 the
// Anthropic key was rejected for ~35 hours and 18 people's uploads failed before anyone noticed).
// No state to store: it fires when the newest finished upload makes the failure streak exactly 2, and again at 10
// if it's still broken. A success resets the streak. Test-mode (owner) uploads and unreadable files don't count.

const ALERT_AT = new Set([2, 10]);

export async function alertOnFailureStreak(documentId: string) {
  if (!emailConfigured()) return;
  const to = ownerEmails();
  if (!to.length) return;
  const db = adminClient();
  const { data } = await db
    .from("documents")
    .select("id,status,error_detail,test_mode,updated_at")
    .in("status", ["ready", "failed"])
    .order("updated_at", { ascending: false })
    .limit(15);
  const recent = (data ?? []).filter((d) => !d.test_mode);
  if (recent[0]?.id !== documentId) return; // only the newest finished upload decides, so the alert goes once
  let streak = 0;
  while (streak < recent.length && recent[streak].status === "failed") streak++;
  if (!ALERT_AT.has(streak)) return;

  const reason = classifyFailure(String(recent[0].error_detail ?? ""));
  const what =
    reason === "bad_key"
      ? "The AI key is being rejected (invalid x-api-key). Make a new key, set it as ANTHROPIC_API_KEY in Vercel (Production) and redeploy.\n\nAPI keys: https://console.anthropic.com/settings/keys"
      : reason === "no_credit"
        ? "The AI account is out of credits. Add credits, then press Check again in the owner panel.\n\nBilling: https://console.anthropic.com/settings/billing"
        : "Something else is failing while making reels. The owner panel's AI services card shows which service and why.";
  const panel = `${siteUrl()}/owner`;
  const mail = compose(
    `⚠️ Unspool: the last ${streak} uploads failed`,
    `The last ${streak} uploads on Unspool failed in a row, so new users are getting no reels right now.\n\n${what}\n\nOwner panel: ${panel}`,
    "Automatic alert from Unspool. Sent when 2 uploads in a row fail, and again at 10.",
  );
  for (const addr of to) {
    const err = await sendEmail({ to: addr, ...mail });
    if (err) console.error("[failure-alert] send failed", err);
  }
}
