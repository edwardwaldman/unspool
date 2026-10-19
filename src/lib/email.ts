// Owner-sent email through Resend's REST API (test sends and broadcasts). Account emails (sign-up codes,
// password resets) are sent by Supabase Auth, not from here.

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim());
const from = () => process.env.EMAIL_FROM?.trim() || "Unspool <hello@unspool.cc>";
export const validEmail = (s: string) => s.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/.test(s);

export type Mail = { to: string; subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain text and simple HTML for one message, with the footer every broadcast carries. */
export function compose(subject: string, message: string, footer: string): Omit<Mail, "to"> {
  const paras = message.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  return {
    subject,
    text: `${message.trim()}\n\n--\n${footer}`,
    html: `<div style="font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:560px">${paras}<p style="margin:24px 0 0;font-size:12px;color:#777">${esc(footer)}</p></div>`,
  };
}

async function resend(path: string, body: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
  return res.ok ? null : out.message ?? out.name ?? `Resend said ${res.status}`;
}

const payload = (m: Mail) => ({
  from: from(),
  to: [m.to],
  subject: m.subject,
  text: m.text,
  html: m.html,
  headers: { "List-Unsubscribe": "<mailto:hello@unspool.cc?subject=unsubscribe>" },
});

/** One email. Returns an error message, or null when Resend accepted it. */
export const sendEmail = (m: Mail) => resend("/emails", payload(m));

/** Many emails, each addressed to one person, at most 100 per request. Returns how many were accepted and any errors. */
export async function sendBatch(mails: Mail[]) {
  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const err = await resend("/emails/batch", chunk.map(payload));
    if (err) errors.push(err);
    else sent += chunk.length;
  }
  return { sent, errors };
}
