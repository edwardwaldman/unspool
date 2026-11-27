import { sendAlertText } from "@/lib/alert-text";
import { emailConfigured, sendEmail, validEmail } from "@/lib/email";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// Enterprise "Request a demo" (the /teams page): emails the request to the owner and sends a phone alert. No account
// needed. A hidden "website" field catches bots, and each address is limited to a few requests an hour.
const TEAM_SIZES = ["1-25", "26-100", "101-500", "500+"] as const;
const recent = new Map<string, number[]>();
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (clip(body.website, 200)) return json({ ok: true }); // honeypot: pretend it worked
  const name = clip(body.name, 120), email = clip(body.email, 254).toLowerCase(), company = clip(body.company, 160);
  const teamSize = TEAM_SIZES.includes(body.teamSize as (typeof TEAM_SIZES)[number]) ? (body.teamSize as string) : "";
  const notes = clip(body.notes, 2000);
  if (!name || !company || !teamSize) return error(400, "Please fill in your name, company and team size.");
  if (!validEmail(email)) return error(400, "Please enter a valid work email.");

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const now = Date.now(), hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return error(429, "Too many requests. Please email hello@unspool.cc instead.");
  recent.set(ip, [...hits, now]);

  if (!emailConfigured()) return error(503, "Requests aren't set up yet. Please email hello@unspool.cc.");
  const to = process.env.DEMO_REQUEST_TO?.trim() || "hello@unspool.cc";
  const text = `New enterprise demo request\n\nName: ${name}\nWork email: ${email}\nCompany: ${company}\nTeam size: ${teamSize}\n\nWhat they'd turn into reels:\n${notes || "(not given)"}\n\nReply to ${email} to book the demo.`;
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const html = `<div style="font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">${esc(text).replace(/\n/g, "<br>")}</div>`;
  const err = await sendEmail({ to, subject: `Demo request: ${company} (${teamSize})`, text, html });
  if (err) {
    console.error("[demo-request] email failed", err);
    return error(502, "Couldn't send your request. Please email hello@unspool.cc.");
  }
  await sendAlertText("Unspool demo request", `${company} (${teamSize}) wants a demo`).catch(() => []);
  return json({ ok: true });
}
