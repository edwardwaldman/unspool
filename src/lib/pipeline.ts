import { writeReelScript, planSpool } from "./claude";
import { LIMITS } from "./config";
import { fundPlannedDocument, ownerEntitlement, refundReel } from "./credits";
import { PLANS, maxWordsFor } from "./plans";
import type { DocumentRow, ReelRow } from "./db-types";
import { ExtractionError, extractDocument } from "./extract";
import { dispatch } from "./jobs";
import type { AudioMap, Plan } from "./schema";
import { buildSegments } from "./segments";
import { adminClient } from "./supabase/admin";
import { estimateDuration, estimateWordFractions } from "./timing";
import { synthesize } from "./tts";
import { renderReelVideo, videoRenderEnabled, type ReelVideo } from "./video/reel-video";

const STALE_MS = 6 * 60 * 1000;
/** The per-reel job route's maxDuration is 300s; finish (and save) the reel well inside it. */
const REEL_BUDGET_MS = 285_000;

function friendlyError(err: unknown): string {
  if (err instanceof ExtractionError) return err.message;
  const msg = err instanceof Error ? err.message : String(err);
  if (/declined/i.test(msg)) return "We couldn't turn this document into reels.";
  return "Something went wrong while unspooling. Tap retry.";
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------------------------------------------------------------------------
// Stage 1: extract + plan
// ---------------------------------------------------------------------------

export async function processDocument(documentId: string) {
  const db = adminClient();
  const { data: doc } = await db
    .from("documents")
    .update({ status: "extracting", error: null })
    .eq("id", documentId)
    .in("status", ["uploaded", "failed"])
    .select("id,user_id,ip_hash,file_name,file_path,unlocked")
    .maybeSingle<Pick<DocumentRow, "id" | "user_id" | "ip_hash" | "file_name" | "file_path" | "unlocked">>();
  if (!doc) return; // already being processed

  try {
    // The owner's tier sets the page limit, and is frozen onto the document at plan time.
    const ent = await ownerEntitlement(doc);
    const plan_ = PLANS[ent.tier];
    const { data: file, error: dlErr } = await db.storage.from("documents").download(doc.file_path!);
    if (dlErr || !file) throw new ExtractionError("We couldn't read the uploaded file. Try uploading it again.");
    const extracted = await extractDocument(Buffer.from(await file.arrayBuffer()), doc.file_name, {
      maxPages: plan_.maxPages,
      maxWords: maxWordsFor(ent.tier),
    });

    await db
      .from("documents")
      .update({
        status: "planning",
        extracted_text: extracted.text,
        word_count: extracted.wordCount,
        page_count: extracted.pageCount,
        truncated: extracted.truncated,
      })
      .eq("id", documentId);

    const plan = await planSpool(doc.file_name, extracted.text);

    const { data: reels, error: insErr } = await db
      .from("reels")
      .upsert(
        plan.reels.map((r) => ({
          document_id: documentId,
          index: r.index,
          title: r.title,
          hook: r.hook,
          section: r.section,
          status: "pending",
        })),
        { onConflict: "document_id,index" },
      )
      .select("id,index");
    if (insErr || !reels) throw insErr ?? new Error("failed to save plan");

    await db
      .from("documents")
      .update({
        status: "scripting",
        title: plan.title,
        doc_type: plan.doc_type,
        sensitive: plan.sensitive,
        reel_count: plan.reels.length,
        priority: plan_.priority,
        long_reels: plan_.longReels,
        // The trial gets Plus limits, so no watermark either.
        watermark: plan_.watermark && !doc.unlocked,
      })
      .eq("id", documentId);

    // Pay for it: one credit per planned reel on paid tiers (as many as are left), reel 1 on free.
    // Reels past what was paid for stay locked and are never generated until unlocked.
    const funded = doc.unlocked ? plan.reels.length : await fundPlannedDocument(documentId, ent, plan.reels.length);
    if (doc.unlocked) await db.from("documents").update({ credit_reels: funded }).eq("id", documentId);
    if (funded === 0) {
      await db.from("documents").update({ status: "ready" }).eq("id", documentId);
      return;
    }

    // Reel 1 first; it queues the rest once its script is written (so they reuse the warm prompt cache).
    const first = reels.find((r) => r.index === 1);
    if (first) await dispatch({ name: "reel", reelId: first.id });
  } catch (err) {
    console.error("[pipeline] processDocument failed", documentId, err);
    await db.from("documents").update({ status: "failed", error: friendlyError(err) }).eq("id", documentId);
  }
}

// ---------------------------------------------------------------------------
// Stage 2: script + voiceover, one reel per invocation
// ---------------------------------------------------------------------------

/** Queue every reel that isn't done or in flight (used after reel 1, after unlocking, and for retries). */
export async function queueRemainingReels(documentId: string, opts: { includeFirst?: boolean } = {}) {
  const db = adminClient();
  const [{ data: reels }, { data: doc }] = await Promise.all([
    db.from("reels").select("id,index,status,started_at,attempts").eq("document_id", documentId).order("index"),
    db.from("documents").select("credit_reels,unlocked").eq("id", documentId).maybeSingle<Pick<DocumentRow, "credit_reels" | "unlocked">>(),
  ]);
  const funded = doc?.unlocked ? Infinity : doc?.credit_reels ?? 0;
  for (const r of (reels ?? []) as Pick<ReelRow, "id" | "index" | "status" | "started_at" | "attempts">[]) {
    if (r.index === 1 && !opts.includeFirst) continue;
    if (r.index > funded || r.attempts >= LIMITS.maxReelAttempts) continue; // unpaid, or failed for good
    const stale = r.status === "generating" && r.started_at && Date.now() - new Date(r.started_at).getTime() > STALE_MS;
    if (r.status === "pending" || r.status === "failed" || stale) await dispatch({ name: "reel", reelId: r.id });
  }
}

export async function generateReel(reelId: string) {
  const startedAt = Date.now();
  const db = adminClient();
  const { data: reel } = await db.from("reels").select("*").eq("id", reelId).maybeSingle<ReelRow>();
  if (!reel || reel.status === "ready") return;
  const edit = reel.edit_request ? { request: reel.edit_request, previous: reel.script_json } : undefined;
  if (reel.status === "generating" && reel.started_at && Date.now() - new Date(reel.started_at).getTime() < STALE_MS) return;
  // Stop retrying a reel that keeps failing, so stuck-healing can't spend on it forever.
  if (reel.attempts >= LIMITS.maxReelAttempts) {
    if (reel.status !== "failed") await db.from("reels").update({ status: "failed", error: "Something went wrong while unspooling." }).eq("id", reelId);
    await refundReel(reelId);
    return;
  }
  // Only reels that have been paid for (credits or the free drip) are ever generated.
  const { data: gate } = await db
    .from("documents")
    .select("credit_reels,unlocked")
    .eq("id", reel.document_id)
    .maybeSingle<Pick<DocumentRow, "credit_reels" | "unlocked">>();
  if (!gate || (!gate.unlocked && reel.index > (gate.credit_reels ?? 0))) return;

  // Optimistic claim: only one worker wins.
  const { data: claimed } = await db
    .from("reels")
    .update({ status: "generating", started_at: new Date().toISOString(), attempts: reel.attempts + 1, error: null })
    .eq("id", reelId)
    .eq("updated_at", reel.updated_at)
    .select("id")
    .maybeSingle();
  if (!claimed) return;

  try {
    const { data: doc } = await db
      .from("documents")
      .select("id,user_id,file_name,extracted_text,doc_type,sensitive,unlocked,title,long_reels,watermark")
      .eq("id", reel.document_id)
      .single<Pick<DocumentRow, "id" | "user_id" | "file_name" | "extracted_text" | "doc_type" | "sensitive" | "unlocked" | "title" | "long_reels" | "watermark">>();
    if (!doc?.extracted_text) throw new Error("document text missing");

    const { data: siblings } = await db
      .from("reels")
      .select("index,title,hook,section")
      .eq("document_id", reel.document_id)
      .order("index");
    const plan: Plan = {
      title: doc.title ?? doc.file_name,
      doc_type: doc.doc_type ?? "other",
      sensitive: doc.sensitive,
      reels: (siblings ?? []).map((s) => ({ index: s.index, title: s.title, hook: s.hook, section: s.section ?? "" })),
    };

    const script = await writeReelScript({ fileName: doc.file_name, text: doc.extracted_text, plan, index: reel.index, long: doc.long_reels, edit });

    // Then the rest of the reels that are paid for (none on free: the drip generates on demand).
    if (reel.index === 1 && !edit) await queueRemainingReels(reel.document_id);

    const segments = buildSegments(script);
    const clips = new Map<string, Buffer>();
    const entries = await mapLimit(segments, 4, async (seg) => {
      const tts = await synthesize(seg.speech);
      if (!tts) {
        return [seg.key, { duration: estimateDuration(seg.speech), words: estimateWordFractions(seg.speech) }] as const;
      }
      const path = `${reel.document_id}/${reel.index}/${seg.key}-${edit ? `e${Date.now()}` : reel.attempts + 1}.mp3`;
      const { error } = await db.storage
        .from("audio")
        .upload(path, tts.audio, { contentType: "audio/mpeg", upsert: true });
      if (error) throw error;
      clips.set(seg.key, tts.audio);
      return [seg.key, { path, duration: tts.duration, words: tts.words, exact: tts.exact }] as const;
    });
    const audio: AudioMap = Object.fromEntries(entries);

    // Video (images + ffmpeg). Best effort: any failure keeps the animated player for this reel.
    let video: ReelVideo | null = null;
    if (videoRenderEnabled()) {
      try {
        // Free tier: burn in a small watermark (frozen on the document at plan time from the owner's tier).
        const watermark = doc.watermark && !doc.unlocked;
        video = await renderReelVideo({ reel, script, segments, audio, clips, deadline: startedAt + REEL_BUDGET_MS, watermark });
      } catch (err) {
        console.error("[pipeline] video render failed, keeping the animated player", reelId, err);
      }
    }

    const ready = { status: "ready" as const, script_json: script, audio_paths: audio, error: null, ...(edit ? { edit_request: null } : {}) };
    let saved = false;
    if (video) {
      const { error } = await db.from("reels").update({ ...ready, video_path: video.path, video_meta: video.timeline }).eq("id", reelId);
      if (error) console.error("[pipeline] saving the video failed, keeping the animated player", reelId, error);
      else saved = true;
    }
    if (!saved) {
      const { error } = await db.from("reels").update({ ...ready, video_path: null, video_meta: null }).eq("id", reelId);
      // Before the video columns exist (migration not applied yet), save without them.
      if (error) await db.from("reels").update(ready).eq("id", reelId);
    }

    const { count } = await db
      .from("reels")
      .select("id", { count: "exact", head: true })
      .eq("document_id", reel.document_id)
      .neq("status", "ready");
    if (count === 0) await db.from("documents").update({ status: "ready" }).eq("id", reel.document_id);
  } catch (err) {
    console.error("[pipeline] generateReel failed", reelId, err);
    // A failed edit leaves the reel as it was: its old script, audio and video are untouched until success.
    if (edit && reel.script_json) {
      await db.from("reels").update({ status: "ready", edit_request: null, error: null }).eq("id", reelId);
      // The edit's credit comes back.
      const { error: refundErr } = await db.rpc("refund_edit_credit", { p_reel_id: reelId });
      if (refundErr) console.error("[pipeline] refund_edit_credit failed", reelId, refundErr);
      return;
    }
    await db.from("reels").update({ status: "failed", error: friendlyError(err) }).eq("id", reelId);
    // Out of attempts: this reel failed for good, so give its credit back.
    if (reel.attempts + 1 >= LIMITS.maxReelAttempts) await refundReel(reelId);
  }
}

// ---------------------------------------------------------------------------
// Self-healing: called when a client polls a document
// ---------------------------------------------------------------------------

const lastHeal = new Map<string, number>();

/** `playable`: how many reels are paid for (credits or the free drip); only those are healed. */
export async function healIfStuck(doc: DocumentRow, reels: Pick<ReelRow, "id" | "index" | "status" | "started_at">[], playable: number) {
  if (Date.now() - (lastHeal.get(doc.id) ?? 0) < 20_000) return;
  lastHeal.set(doc.id, Date.now());
  const age = Date.now() - new Date(doc.updated_at).getTime();
  if (doc.status === "uploaded" && age > 30_000) {
    await dispatch({ name: "process", documentId: doc.id });
    return;
  }
  if ((doc.status === "extracting" || doc.status === "planning") && age > STALE_MS) {
    await adminClient().from("documents").update({ status: "uploaded" }).eq("id", doc.id).eq("status", doc.status);
    await dispatch({ name: "process", documentId: doc.id });
    return;
  }
  if (doc.status !== "scripting") return;
  const firstReady = reels.find((r) => r.index === 1)?.status === "ready";
  for (const r of reels) {
    if (r.index > playable) continue; // not paid for: never generated
    const stale = r.status === "generating" && r.started_at && Date.now() - new Date(r.started_at).getTime() > STALE_MS;
    const orphaned = r.status === "pending" && age > 60_000 && (r.index === 1 || firstReady);
    if (stale || orphaned) await dispatch({ name: "reel", reelId: r.id });
  }
}
