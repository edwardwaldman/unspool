import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { isOwnerEmail } from "@/lib/owner";
import { deleteDocument } from "@/lib/spool";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Owner panel data and actions. Every call re-checks that the signed-in user is the owner.

async function owner() {
  const viewer = await getViewer();
  return viewer.userId && isOwnerEmail(viewer.email) ? viewer : null;
}

const has = (name: string) => Boolean(process.env[name]?.trim());

/** Which pieces of the deployment are switched on (env vars present, never their values). */
function deployment() {
  return [
    { name: "Database (Supabase server key)", on: has("SUPABASE_SERVICE_ROLE_KEY"), hint: "Set SUPABASE_SERVICE_ROLE_KEY" },
    { name: "Reel scripts (Claude)", on: has("ANTHROPIC_API_KEY"), hint: "Set ANTHROPIC_API_KEY (made inside a workspace, or add ANTHROPIC_WORKSPACE_ID)" },
    { name: "Voiceover", on: has("OPENAI_API_KEY") || has("ELEVENLABS_API_KEY"), hint: "Set OPENAI_API_KEY" },
    { name: "Real MP4 videos (images)", on: has("FAL_KEY") || has("REPLICATE_API_TOKEN"), hint: "Optional: set FAL_KEY. Without it reels use the animated player" },
    { name: "Payments (Stripe)", on: has("STRIPE_SECRET_KEY"), hint: "Set STRIPE_SECRET_KEY" },
    { name: "Stripe webhook", on: has("STRIPE_WEBHOOK_SECRET"), hint: "Set STRIPE_WEBHOOK_SECRET" },
    { name: "Background jobs", on: has("JOB_SECRET"), hint: "Set JOB_SECRET" },
    { name: "Nightly cleanup", on: has("CRON_SECRET"), hint: "Set CRON_SECRET" },
    { name: "Abuse limits salt", on: has("IP_HASH_SALT"), hint: "Set IP_HASH_SALT" },
  ];
}

export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  if (!(await owner())) return error(404, "Not found");
  const db = adminClient();

  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 500 });
  const users = list?.users ?? [];
  const { data: profiles } = await db.from("profiles").select("id,plan,tier,comp_tier,subscription_status,billing_interval");
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const { data: docs } = await db
    .from("documents")
    .select("id,user_id,file_name,status,error_detail,reel_count,created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const { data: docOwners } = await db.from("documents").select("user_id");
  const perUser = new Map<string, number>();
  for (const d of docOwners ?? []) if (d.user_id) perUser.set(d.user_id, (perUser.get(d.user_id) ?? 0) + 1);
  const { data: reelRows } = await db.from("reels").select("document_id,status").in("document_id", (docs ?? []).map((d) => d.id));
  const { count: readyReels } = await db.from("reels").select("id", { count: "exact", head: true }).eq("status", "ready");

  const emailOf = new Map(users.map((u) => [u.id, u.email ?? null]));
  const accounts = users
    .map((u) => {
      const p = byId.get(u.id);
      const paying = p?.plan === "sub" && ["active", "trialing", "past_due"].includes(p?.subscription_status ?? "");
      return {
        id: u.id,
        email: u.email ?? "(no email)",
        provider: (u.app_metadata?.provider as string | undefined) ?? "email",
        joined: u.created_at,
        lastIn: u.last_sign_in_at ?? null,
        owner: isOwnerEmail(u.email),
        comp: (p?.comp_tier as string | null) ?? null,
        subscription: paying ? `${p?.tier ?? "plus"} · ${p?.billing_interval === "year" ? "yearly" : "weekly"} · ${p?.subscription_status}` : null,
        documents: perUser.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => Number(b.owner) - Number(a.owner) || b.joined.localeCompare(a.joined));

  return json({
    stats: {
      accounts: accounts.length,
      paying: accounts.filter((a) => a.subscription).length,
      comped: accounts.filter((a) => a.comp).length,
      documents: docOwners?.length ?? 0,
      readyReels: readyReels ?? 0,
    },
    deployment: deployment(),
    accounts,
    documents: (docs ?? []).map((d) => {
      const mine = (reelRows ?? []).filter((r) => r.document_id === d.id);
      return {
        id: d.id,
        file: d.file_name,
        email: d.user_id ? emailOf.get(d.user_id) ?? "(deleted)" : "(signed out)",
        status: d.status,
        error: d.error_detail,
        ready: mine.filter((r) => r.status === "ready").length,
        total: d.reel_count ?? mine.length,
        at: d.created_at,
      };
    }),
  });
}

/** { action: "plan", userId, tier: "free"|"plus"|"pro"|"ultra" } or { action: "delete", userId }. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const me = await owner();
  if (!me) return error(404, "Not found");
  const body = (await req.json().catch(() => ({}))) as { action?: string; userId?: string; tier?: string };
  if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) return error(400, "Pick an account");
  const db = adminClient();

  if (body.action === "plan") {
    const tier = body.tier ?? "";
    if (!["free", "plus", "pro", "ultra"].includes(tier)) return error(400, "Unknown plan");
    const { error: upErr } = await db.from("profiles").update({ comp_tier: tier === "free" ? null : tier }).eq("id", body.userId);
    if (upErr) return error(500, "Couldn't change the plan");
    return json({ ok: true });
  }

  if (body.action === "delete") {
    if (body.userId === me.userId) return error(400, "The owner account can't be deleted from here");
    const { data: profile } = await db.from("profiles").select("stripe_subscription_id,subscription_status").eq("id", body.userId).maybeSingle();
    if (profile?.stripe_subscription_id && stripeConfigured() && profile.subscription_status !== "canceled") {
      try {
        await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
      } catch (err) {
        if ((err as { code?: string }).code !== "resource_missing") return error(502, "Couldn't cancel their subscription, so the account wasn't deleted");
      }
    }
    const { data: docs } = await db.from("documents").select("id,file_path").eq("user_id", body.userId);
    for (const doc of docs ?? []) await deleteDocument(doc);
    const { error: delErr } = await db.auth.admin.deleteUser(body.userId);
    if (delErr) return error(500, "Couldn't delete the account");
    return json({ ok: true });
  }

  return error(400, "Unknown action");
}
