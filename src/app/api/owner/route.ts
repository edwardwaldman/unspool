import { supabaseConfigured } from "@/lib/config";
import { compose, emailConfigured, sendBatch, sendEmail, validEmail } from "@/lib/email";
import { error, json, notConfigured } from "@/lib/http";
import { isOwnerEmail } from "@/lib/owner";
import { deleteDocument } from "@/lib/spool";
import { appSettings, setOpenAccess } from "@/lib/settings";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";
import { lookupVisits, visitAnalytics } from "@/lib/visits";

export const dynamic = "force-dynamic";

// Owner panel data and actions. Every call re-checks that the signed-in user is the owner
// (the real identity: the owner may be viewing the site as another tier).

async function owner() {
  const viewer = await getViewer();
  return viewer.isOwner && viewer.realUserId ? viewer : null;
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
    { name: "Email (Resend)", on: emailConfigured(), hint: "Set RESEND_API_KEY (and EMAIL_FROM on a verified domain) for test emails and broadcasts" },
  ];
}

/** Every account with an email (auth.users, all pages). */
async function accountEmails() {
  const db = adminClient();
  const out: { email: string; updates: boolean }[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    for (const u of users) if (u.email && validEmail(u.email)) out.push({ email: u.email, updates: u.user_metadata?.marketing_opt_in === true });
    if (users.length < 1000) break;
  }
  return out;
}

const ACCOUNT_FOOTER = "You're getting this because you have an Unspool account. To stop these emails, reply with \"unsubscribe\" or write to hello@unspool.cc.";

/** The panel's data, or with ?lookup=<ip or email, or part of one> the IP ↔ email lookup. */
export async function GET(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  if (!(await owner())) return error(404, "Not found");
  const db = adminClient();
  const lookup = new URL(req.url).searchParams.get("lookup");
  if (lookup !== null) {
    if (lookup.trim().length < 2) return error(400, "Type at least 2 characters of an IP or email");
    return json(await lookupVisits(lookup));
  }

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

  const analytics = await visitAnalytics();
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
        ips: analytics.ipsByUser[u.id] ?? [],
      };
    })
    .sort((a, b) => Number(b.owner) - Number(a.owner) || b.joined.localeCompare(a.joined));

  return json({
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    openAccess: (await appSettings()).openAccess,
    stats: {
      accounts: accounts.length,
      paying: accounts.filter((a) => a.subscription).length,
      comped: accounts.filter((a) => a.comp).length,
      documents: docOwners?.length ?? 0,
      readyReels: readyReels ?? 0,
    },
    deployment: deployment(),
    accounts,
    visits: analytics.visits,
    addresses: analytics.addresses,
    beforeSignup: analytics.beforeSignup,
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

type Body = { action?: string; userId?: string; tier?: string; on?: boolean; to?: string; subject?: string; message?: string; audience?: string; confirm?: string };

/**
 * { action: "plan", userId, tier } · { action: "delete", userId } · { action: "open_access", on } ·
 * { action: "test_email", to } · { action: "outcomes" } · { action: "audience" } ·
 * { action: "broadcast", subject, message, audience: "updates"|"everyone", confirm: "SEND" }.
 */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const me = await owner();
  if (!me) return error(404, "Not found");
  const body = (await req.json().catch(() => ({}))) as Body;
  const db = adminClient();

  if (body.action === "open_access") {
    if (typeof body.on !== "boolean") return error(400, "Say on or off");
    if (!(await setOpenAccess(body.on))) return error(500, "Couldn't save the setting");
    return json({ ok: true, openAccess: body.on });
  }

  if (body.action === "test_email") {
    const to = body.to?.trim() ?? "";
    if (!validEmail(to)) return error(400, "That doesn't look like an email address");
    if (!emailConfigured()) return error(503, "RESEND_API_KEY isn't set, so no email can be sent");
    const err = await sendEmail({ to, ...compose("Unspool test email", "This is a test email from the Unspool owner panel. If you can read it, sending works.", "Sent from the Unspool owner panel.") });
    if (err) return error(502, `Resend refused it: ${err}`);
    return json({ ok: true });
  }

  if (body.action === "outcomes") {
    const { data: profiles } = await db.from("profiles").select("id,email,plan,tier,billing_interval,subscription_status,trial_used,comp_tier,updated_at");
    const rows = (profiles ?? []).filter((p) => !isOwnerEmail(p.email));
    const KEYS = ["trialing", "active", "past_due", "canceled", "none"] as const;
    const bucket = (s: string | null) => ((KEYS as readonly string[]).includes(s ?? "") ? (s as (typeof KEYS)[number]) : "none");
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const { data: pressedRows } = await db.from("visits").select("user_id").eq("checkout", true).not("user_id", "is", null).gte("started_at", since).limit(5000);
    const pressed = new Set((pressedRows ?? []).map((r) => r.user_id as string));
    const statusOf = new Map(rows.map((p) => [p.id, bucket(p.subscription_status)]));
    const pressedList = [...pressed].filter((id) => statusOf.has(id));
    return json({
      groups: KEYS.map((k) => {
        const list = rows.filter((p) => bucket(p.subscription_status) === k);
        return {
          key: k,
          count: list.length,
          accounts: (k === "none" ? list.filter((p) => p.trial_used) : list)
            .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
            .slice(0, 12)
            .map((p) => ({ email: p.email ?? "(no email)", tier: p.tier, interval: p.billing_interval, trialUsed: Boolean(p.trial_used), comp: p.comp_tier })),
        };
      }),
      checkout: {
        pressed: pressedList.length,
        trialing: pressedList.filter((id) => statusOf.get(id) === "trialing").length,
        paying: pressedList.filter((id) => ["active", "past_due"].includes(statusOf.get(id) ?? "")).length,
      },
    });
  }

  if (body.action === "audience") {
    const list = await accountEmails();
    return json({ everyone: list.length, updates: list.filter((a) => a.updates).length, configured: emailConfigured() });
  }

  if (body.action === "broadcast") {
    if (body.confirm !== "SEND") return error(400, "Type SEND to confirm");
    if (!emailConfigured()) return error(503, "RESEND_API_KEY isn't set, so no email can be sent");
    const subject = body.subject?.trim().slice(0, 200) ?? "";
    const message = body.message?.trim().slice(0, 20_000) ?? "";
    if (!subject || !message) return error(400, "Write a subject and a message");
    if (body.audience !== "updates" && body.audience !== "everyone") return error(400, "Pick an audience");
    const list = (await accountEmails()).filter((a) => body.audience === "everyone" || a.updates);
    const to = [...new Set(list.map((a) => a.email.toLowerCase()))];
    if (!to.length) return error(400, "Nobody to send to");
    const mail = compose(subject, message, ACCOUNT_FOOTER);
    const { sent, errors } = await sendBatch(to.map((t) => ({ to: t, ...mail })));
    if (!sent) return error(502, `Nothing was sent: ${errors[0] ?? "unknown error"}`);
    return json({ ok: true, sent, failed: to.length - sent, errors: errors.slice(0, 3) });
  }

  if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) return error(400, "Pick an account");

  if (body.action === "plan") {
    const tier = body.tier ?? "";
    if (!["free", "plus", "pro", "ultra"].includes(tier)) return error(400, "Unknown plan");
    const { error: upErr } = await db.from("profiles").update({ comp_tier: tier === "free" ? null : tier }).eq("id", body.userId);
    if (upErr) return error(500, "Couldn't change the plan");
    return json({ ok: true });
  }

  if (body.action === "delete") {
    if (body.userId === me.realUserId) return error(400, "The owner account can't be deleted from here");
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
    // Unlink rather than delete: the hashed-IP rows must keep counting toward the 24h per-IP upload cap, or
    // delete-and-re-sign-up would hand out unlimited free documents. The nightly cleanup drops them after 3 days.
    await db.from("usage_events").update({ user_id: null, document_id: null }).eq("user_id", body.userId);
    const { error: delErr } = await db.auth.admin.deleteUser(body.userId);
    if (delErr) return error(500, "Couldn't delete the account");
    return json({ ok: true });
  }

  return error(400, "Unknown action");
}
