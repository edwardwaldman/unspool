import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { error, json } from "@/lib/http";
import { isOwnerEmail } from "@/lib/owner";
import { listPasskeys, relyingParty, setChallenge, setUnlocked, takeChallenge } from "@/lib/owner-passkey";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET: a Face ID challenge for the owner's passkeys (404 until one is set up). */
export async function GET() {
  const keys = await listPasskeys().catch(() => null);
  if (!keys?.length) return error(404, "Face ID isn't set up yet.");
  const { rpID } = await relyingParty();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: keys.map((k) => ({ id: k.id, transports: k.transports as AuthenticatorTransport[] })),
  });
  if (!(await setChallenge("auth", options.challenge))) return error(503, "Face ID isn't configured on the server.");
  return json(options);
}

/** POST: verify Face ID, then sign in as the owner (no password) and unlock the panel. */
export async function POST(req: Request) {
  const expectedChallenge = await takeChallenge("auth");
  if (!expectedChallenge) return error(400, "That took too long. Try again.");
  const body = (await req.json().catch(() => null)) as { response?: AuthenticationResponseJSON } | null;
  if (!body?.response?.id) return error(400, "Bad request");
  const key = (await listPasskeys().catch(() => [])).find((k) => k.id === body.response!.id);
  if (!key || !isOwnerEmail(key.email)) return error(403, "This Face ID isn't registered for the owner panel.");
  const { rpID, origins } = await relyingParty();
  const result = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge,
    expectedOrigin: origins,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: { id: key.id, publicKey: Buffer.from(key.public_key, "base64url"), counter: Number(key.counter), transports: key.transports as AuthenticatorTransport[] },
  }).catch(() => null);
  if (!result?.verified) return error(403, "Face ID didn't match.");
  const db = adminClient();
  await db.from("owner_passkeys").update({ counter: result.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq("id", key.id);

  // Sign in as the owner: a one-time login link minted and redeemed on the server (nothing is emailed).
  const { data: link, error: linkErr } = await db.auth.admin.generateLink({ type: "magiclink", email: key.email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) return error(500, "Couldn't sign you in.");
  const supabase = await createClient();
  const { data: session, error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (otpErr || !session.user || !isOwnerEmail(session.user.email)) return error(500, "Couldn't sign you in.");
  await setUnlocked(session.user.id);
  return json({ ok: true });
}
