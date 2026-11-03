import { ACCEPTED_EXTENSIONS, LIMITS, MAX_FILE_BYTES, extensionOf, isAccepted, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { appSettings } from "@/lib/settings";
import { adminClient } from "@/lib/supabase/admin";
import { entitlementFor, topupBalance } from "@/lib/credits";
import { claimUsage, freeDocumentUsed } from "@/lib/usage";
import { clientIpHash, getViewer } from "@/lib/viewer";
import { dispatch } from "@/lib/jobs";
import { PROMPT_FILE } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** Create a document row and a signed upload URL; the browser uploads straight to Supabase Storage. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const body = (await req.json().catch(() => null)) as { fileName?: string; size?: number; type?: string; testOne?: boolean; prompt?: string } | null;
  // A typed prompt ("photosynthesis for AP Bio") instead of a file: the reels come from web research.
  const prompt = typeof body?.prompt === "string" ? body.prompt.replace(/\s+/g, " ").trim() : null;
  if (prompt !== null && (prompt.length < 3 || prompt.length > 4000)) {
    return error(400, prompt.length < 3 ? "Type a topic to study." : "That's too long. Paste up to about 600 words.");
  }
  const fileName = prompt !== null ? prompt.slice(0, 80) : body?.fileName?.trim().slice(0, 200);
  const size = prompt !== null ? Buffer.byteLength(prompt) : Number(body?.size ?? 0);
  if (prompt === null) {
    if (!fileName || !isAccepted(fileName)) {
      return error(400, `Unsupported file. Try ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`);
    }
    if (!size || size > MAX_FILE_BYTES) return error(400, "Files must be under 25 MB.");
  }
  if (!fileName) return error(400, "Type a topic to study.");

  const viewer = await getViewer();
  // A free account is required to unspool: it's what the free reel (and any purchase) is tied to.
  if (!viewer.userId) return error(401, "Create a free account to unspool your document.", { code: "auth" });
  const ipHash = await clientIpHash();
  const db = adminClient();

  // Free accounts get one document, ever (counted from the upload ledger, so deleting it doesn't give it back),
  // unless the owner has switched on open access.
  const owner = viewer.ownerUnlimited;
  const settings = await appSettings();
  let oneFree = !owner && !viewer.subscribed && !settings.openAccess;
  // A network the owner uses is trusted for testing: fresh accounts on it are limited per account only.
  const ownerNetwork = settings.ownerNetworks.includes(ipHash);
  // Bought credits are what they bought: a free account with top-up credits left can keep unspooling.
  let paidByTopup = false;
  if (oneFree && (await freeDocumentUsed(viewer.userId))) {
    if ((await topupBalance(entitlementFor(viewer.profile).subject)) === 0) {
      return error(402, "Free accounts get 1 document. Upgrade or buy a top-up to unspool more.", { code: "free_used" });
    }
    oneFree = false;
    paidByTopup = true;
  }

  // Daily upload limits to keep AI costs in check. Claimed atomically in a ledger that deleting a
  // document or account doesn't shrink; free accounts are also capped per IP so new accounts don't reset it.
  const limit = owner ? 1_000_000 : viewer.subscribed ? LIMITS.subscriberUploadsPerDay : LIMITS.freeUploadsPerDay;
  const allowed = await claimUsage({
    kind: "upload",
    // first_user_or_ip re-checks "never uploaded" under the same lock, so parallel requests can't each get a free document.
    scope: viewer.subscribed || paidByTopup || ownerNetwork ? "user" : oneFree ? "first_user_or_ip" : "user_or_ip",
    limit,
    userId: viewer.userId,
    ipHash,
  });
  if (allowed === null) return error(503, "Uploads are briefly unavailable. Try again in a minute.");
  if (!allowed) {
    return error(
      429,
      viewer.subscribed || paidByTopup || ownerNetwork
        ? "You've hit today's upload limit. Try again tomorrow."
        : "Too many free documents from this network today. Upgrade, or try again tomorrow.",
      { code: "limit" },
    );
  }

  const ext = prompt !== null ? "txt" : extensionOf(fileName);
  const { data: doc, error: insErr } = await db
    .from("documents")
    .insert({
      user_id: viewer.userId,
      anon_token: viewer.userId ? null : viewer.anonToken,
      ip_hash: ipHash,
      file_name: fileName,
      file_type: prompt !== null ? "prompt" : ext,
      file_size: size,
      status: prompt !== null ? "uploaded" : "uploading",
      // Owner test mode: make reel 1 only, then one at a time on request (owner panel).
      ...(body?.testOne === true && viewer.isOwner ? { test_mode: true } : {}),
    })
    .select("id")
    .single();
  if (insErr || !doc) return error(500, "Couldn't start the upload.");

  if (prompt !== null) {
    // Nothing to upload: store the prompt where the pipeline reads it, and start straight away.
    const path = `${doc.id}/${PROMPT_FILE}`;
    const { error: upErr } = await db.storage.from("documents").upload(path, new Blob([prompt], { type: "text/plain" }), { contentType: "text/plain" });
    if (upErr) {
      await db.from("documents").delete().eq("id", doc.id);
      return error(500, "Couldn't start. Try again.");
    }
    await db.from("documents").update({ file_path: path }).eq("id", doc.id);
    await dispatch({ name: "process", documentId: doc.id });
    return json({ documentId: doc.id, started: true });
  }

  const path = `${doc.id}/source.${ext}`;
  const { data: signed, error: signErr } = await db.storage.from("documents").createSignedUploadUrl(path);
  if (signErr || !signed) {
    await db.from("documents").delete().eq("id", doc.id);
    return error(500, "Couldn't start the upload.");
  }
  await db.from("documents").update({ file_path: path }).eq("id", doc.id);

  return json({ documentId: doc.id, path, token: signed.token });
}
