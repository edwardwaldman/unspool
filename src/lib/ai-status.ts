import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "@/lib/supabase/admin";

// Owner panel: are the AI services that make reels working, and how much is left?
// Live key checks are free (they list models / read the plan, no generation). Anthropic does not expose a remaining
// credit balance through its API (not for standard keys, not for admin keys), so for Claude the panel shows whether
// the key works, why recent uploads failed, and a direct link to the billing page where the balance is shown.

export type AiState = "ok" | "bad_key" | "no_credit" | "error" | "off";
export type AiLink = { label: string; href: string };
export type AiService = {
  id: "anthropic" | "elevenlabs" | "openai";
  name: string;
  role: string;
  state: AiState;
  detail: string;
  /** Only where the provider reports it (ElevenLabs characters). */
  quota?: { used: number; limit: number; unit: string; resetsAt: string | null };
  links: AiLink[];
};
export type AiStatus = {
  services: AiService[];
  /** Uploads that failed in the last 24 hours, and what the most recent failure said (classified, never the raw key). */
  failed24h: number;
  lastFailure: { at: string; reason: "bad_key" | "no_credit" | "other"; message: string } | null;
  checkedAt: string;
};

const LINKS = {
  anthropic: [
    { label: "Add credits / see balance", href: "https://console.anthropic.com/settings/billing" },
    { label: "API keys", href: "https://console.anthropic.com/settings/keys" },
  ],
  elevenlabs: [
    { label: "Plan & characters left", href: "https://elevenlabs.io/app/subscription" },
    { label: "API keys", href: "https://elevenlabs.io/app/settings/api-keys" },
  ],
  openai: [
    { label: "Add credits / see balance", href: "https://platform.openai.com/settings/organization/billing/overview" },
    { label: "API keys", href: "https://platform.openai.com/api-keys" },
  ],
} satisfies Record<AiService["id"], AiLink[]>;

const key = (name: string) => process.env[name]?.trim() || "";
const TIMEOUT = 6000;

/** What a saved upload error means, without echoing anything secret. */
export function classifyFailure(detail: string): "bad_key" | "no_credit" | "other" {
  const d = detail.toLowerCase();
  if (d.includes("credit balance") || d.includes("insufficient_quota") || d.includes("quota_exceeded") || d.includes("billing")) return "no_credit";
  if (d.includes("invalid x-api-key") || d.includes("authentication_error") || d.includes("invalid_api_key") || d.includes(" 401")) return "bad_key";
  return "other";
}

async function checkAnthropic(): Promise<AiService> {
  const base = { id: "anthropic" as const, name: "Claude (Anthropic)", role: "Writes every reel", links: LINKS.anthropic };
  if (!key("ANTHROPIC_API_KEY")) return { ...base, state: "off", detail: "ANTHROPIC_API_KEY is not set, so no reels can be made." };
  const workspace = key("ANTHROPIC_WORKSPACE_ID");
  const client = new Anthropic({ maxRetries: 0, timeout: TIMEOUT, ...(workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {}) });
  try {
    await client.models.list({ limit: 1 });
    return { ...base, state: "ok", detail: "The key works. Anthropic doesn't share the remaining balance through its API: open the billing page to see it and top up." };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ...base, state: "bad_key", detail: "The key is rejected (invalid, revoked or deleted). Make a new key, set it as ANTHROPIC_API_KEY in Vercel and redeploy." };
    if (e instanceof Anthropic.PermissionDeniedError) return { ...base, state: "bad_key", detail: "The key isn't allowed to use the API (workspace or permission problem)." };
    if (e instanceof Anthropic.APIError) return { ...base, state: "error", detail: `Anthropic answered with an error (${e.status ?? "no status"}). Try Refresh in a minute.` };
    return { ...base, state: "error", detail: "Couldn't reach Anthropic from the server. Try Refresh in a minute." };
  }
}

async function checkElevenLabs(): Promise<AiService | null> {
  const k = key("ELEVENLABS_API_KEY");
  if (!k) return null;
  const base = { id: "elevenlabs" as const, name: "ElevenLabs", role: "Voiceover", links: LINKS.elevenlabs };
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": k }, signal: AbortSignal.timeout(TIMEOUT), cache: "no-store" });
    if (res.status === 401) {
      const body = await res.text().catch(() => "");
      // A key without the "user read" permission still makes voices; it just can't read the plan.
      if (body.includes("missing_permissions")) return { ...base, state: "ok", detail: "The key works for voices but can't read the plan (give it User read access to see characters left here)." };
      return { ...base, state: "bad_key", detail: "The key is rejected. Make a new one and set ELEVENLABS_API_KEY in Vercel." };
    }
    if (!res.ok) return { ...base, state: "error", detail: `ElevenLabs answered with an error (${res.status}).` };
    const s = (await res.json()) as { character_count?: number; character_limit?: number; next_character_count_reset_unix?: number; tier?: string };
    const used = s.character_count ?? 0, limit = s.character_limit ?? 0;
    const left = Math.max(0, limit - used);
    const resetsAt = s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString() : null;
    const low = limit > 0 && left / limit < 0.1;
    return { ...base, state: left === 0 && limit > 0 ? "no_credit" : "ok", detail: `${left.toLocaleString("en-US")} of ${limit.toLocaleString("en-US")} characters left${s.tier ? ` on the ${s.tier} plan` : ""}${low && left > 0 ? " (running low)" : ""}.`, quota: { used, limit, unit: "characters", resetsAt } };
  } catch {
    return { ...base, state: "error", detail: "Couldn't reach ElevenLabs from the server." };
  }
}

async function checkOpenAI(): Promise<AiService | null> {
  const k = key("OPENAI_API_KEY");
  if (!k) return null;
  const base = { id: "openai" as const, name: "OpenAI", role: "Voiceover and captions timing", links: LINKS.openai };
  try {
    const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${k}` }, signal: AbortSignal.timeout(TIMEOUT), cache: "no-store" });
    if (res.status === 401) return { ...base, state: "bad_key", detail: "The key is rejected. Make a new one and set OPENAI_API_KEY in Vercel." };
    if (!res.ok) return { ...base, state: "error", detail: `OpenAI answered with an error (${res.status}).` };
    return { ...base, state: "ok", detail: "The key works. OpenAI doesn't share the remaining balance through its API: open the billing page to see it." };
  } catch {
    return { ...base, state: "error", detail: "Couldn't reach OpenAI from the server." };
  }
}

async function recentFailures() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const db = adminClient();
  const { count } = await db.from("documents").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since);
  const { data } = await db.from("documents").select("created_at, error_detail").eq("status", "failed").not("error_detail", "is", null).order("created_at", { ascending: false }).limit(1);
  const last = data?.[0];
  const reason = last ? classifyFailure(String(last.error_detail)) : "other";
  const message = reason === "bad_key" ? "The AI key was rejected (invalid x-api-key)." : reason === "no_credit" ? "The AI account is out of credits." : "Something else went wrong while making reels.";
  return { failed24h: count ?? 0, lastFailure: last ? { at: String(last.created_at), reason, message } : null };
}

export async function aiStatus(): Promise<AiStatus> {
  const [anthropic, eleven, openai, failures] = await Promise.all([checkAnthropic(), checkElevenLabs(), checkOpenAI(), recentFailures()]);
  return { services: [anthropic, eleven, openai].filter((s): s is AiService => s !== null), ...failures, checkedAt: new Date().toISOString() };
}
