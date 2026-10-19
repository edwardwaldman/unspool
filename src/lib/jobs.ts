import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { siteUrl } from "./config";

// Long-running generation work runs in its own function invocation per job, so a document's
// reels generate in parallel and no single request hits the platform time limit.

export type Job = { name: "process"; documentId: string } | { name: "reel"; reelId: string };

/**
 * Shared secret for the internal job endpoints: JOB_SECRET, else a key derived from the service role key
 * (so the raw service key never travels in a header). Null when neither is set: the endpoints then
 * refuse every call and dispatch runs jobs inline - never a guessable default.
 */
export function jobSecret(): string | null {
  if (process.env.JOB_SECRET) return process.env.JOB_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return serviceKey ? createHmac("sha256", serviceKey).update("unspool:job-secret").digest("hex") : null;
}

/** Constant-time comparison of a presented secret with the expected one; false if either is missing. */
export function secretMatches(given: string | null | undefined, expected: string | null | undefined) {
  if (!given || !expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** True when the request carries the job secret. */
export function isJobRequest(req: Request) {
  return secretMatches(req.headers.get("x-job-secret"), jobSecret());
}

function jobBaseUrl() {
  if (process.env.JOB_BASE_URL) return process.env.JOB_BASE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return siteUrl();
}

async function runInline(job: Job) {
  const { processDocument, generateReel } = await import("./pipeline");
  if (job.name === "process") await processDocument(job.documentId);
  else await generateReel(job.reelId);
}

/** Kick off a job in a separate invocation. Falls back to running it after this response. */
export async function dispatch(job: Job) {
  const secret = jobSecret();
  if (!secret) {
    after(() => runInline(job));
    return;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-job-secret": secret };
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }
  try {
    const res = await fetch(`${jobBaseUrl()}/api/jobs/${job.name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(job),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status !== 202) throw new Error(`job endpoint returned ${res.status}`);
  } catch (err) {
    console.warn(`[jobs] dispatch of ${job.name} failed, running inline:`, err);
    after(() => runInline(job));
  }
}
