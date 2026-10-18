import { ACCEPTED_EXTENSIONS, LIMITS, MAX_FILE_BYTES, extensionOf, isAccepted, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { claimUsage } from "@/lib/usage";
import { clientIpHash, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Create a document row and a signed upload URL; the browser uploads straight to Supabase Storage. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const body = (await req.json().catch(() => null)) as { fileName?: string; size?: number; type?: string } | null;
  const fileName = body?.fileName?.trim().slice(0, 200);
  const size = Number(body?.size ?? 0);
  if (!fileName || !isAccepted(fileName)) {
    return error(400, `Unsupported file. Try ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`);
  }
  if (!size || size > MAX_FILE_BYTES) return error(400, "Files must be under 25 MB.");

  const viewer = await getViewer();
  // A free account is required to unspool: it's what the free reel (and any purchase) is tied to.
  if (!viewer.userId) return error(401, "Create a free account to unspool your document.", { code: "auth" });
  const ipHash = await clientIpHash();
  const db = adminClient();

  // Daily upload limits to keep AI costs in check. Claimed atomically in a ledger that deleting a
  // document or account doesn't shrink; free accounts are also capped per IP so new accounts don't reset it.
  const limit = viewer.subscribed ? LIMITS.subscriberUploadsPerDay : LIMITS.freeUploadsPerDay;
  const allowed = await claimUsage({
    kind: "upload",
    scope: viewer.subscribed ? "user" : "user_or_ip",
    limit,
    userId: viewer.userId,
    ipHash,
  });
  if (allowed === null) return error(503, "Uploads are briefly unavailable. Try again in a minute.");
  if (!allowed) {
    return error(
      429,
      viewer.subscribed
        ? "You've hit today's upload limit. Try again tomorrow."
        : `Free accounts can unspool ${limit} documents a day. Upgrade to keep going.`,
      { code: "limit" },
    );
  }

  const ext = extensionOf(fileName);
  const { data: doc, error: insErr } = await db
    .from("documents")
    .insert({
      user_id: viewer.userId,
      anon_token: viewer.userId ? null : viewer.anonToken,
      ip_hash: ipHash,
      file_name: fileName,
      file_type: ext,
      file_size: size,
      status: "uploading",
    })
    .select("id")
    .single();
  if (insErr || !doc) return error(500, "Couldn't start the upload.");

  const path = `${doc.id}/source.${ext}`;
  const { data: signed, error: signErr } = await db.storage.from("documents").createSignedUploadUrl(path);
  if (signErr || !signed) {
    await db.from("documents").delete().eq("id", doc.id);
    return error(500, "Couldn't start the upload.");
  }
  await db.from("documents").update({ file_path: path }).eq("id", doc.id);

  return json({ documentId: doc.id, path, token: signed.token });
}
