import "server-only";

// Short alerts to the owner's phone, next to the alert email. Two optional channels, each switched on by env vars
// (nothing is hard-coded, so the phone number stays out of the repository):
//   SMS via Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (your Twilio number, +1...), ALERT_SMS_TO (+1...)
//   Push via ntfy (free, no account): NTFY_TOPIC (a long random name you subscribe to in the ntfy app)

const env = (k: string) => process.env[k]?.trim() || "";

export const textAlertsConfigured = () => Boolean((env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM") && env("ALERT_SMS_TO")) || env("NTFY_TOPIC"));

/** Send `message` to every configured channel. Returns the errors (empty when everything sent). */
export async function sendAlertText(title: string, message: string): Promise<string[]> {
  const errors: string[] = [];
  const sid = env("TWILIO_ACCOUNT_SID"), token = env("TWILIO_AUTH_TOKEN"), from = env("TWILIO_FROM"), to = env("ALERT_SMS_TO");
  if (sid && token && from && to) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: "POST",
        headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, From: from, Body: `${title}\n${message}`.slice(0, 600) }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) errors.push(`Twilio ${res.status}: ${((await res.json().catch(() => ({}))) as { message?: string }).message ?? "send failed"}`);
    } catch {
      errors.push("Twilio unreachable");
    }
  }
  const topic = env("NTFY_TOPIC");
  if (topic) {
    try {
      const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { Title: title.replace(/[^\x20-\x7e]/g, "").trim() || "Unspool alert", Priority: "high", Tags: "warning" },
        body: message,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) errors.push(`ntfy ${res.status}`);
    } catch {
      errors.push("ntfy unreachable");
    }
  }
  return errors;
}
