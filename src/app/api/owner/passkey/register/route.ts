import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { error, json } from "@/lib/http";
import { isUnlocked, listPasskeys, relyingParty, setChallenge, setUnlocked, takeChallenge } from "@/lib/owner-passkey";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Only the verified, signed-in owner; and once a passkey exists, only from an already unlocked session. */
async function owner() {
  const viewer = await getViewer();
  if (!viewer.isOwner || !viewer.realUserId || !viewer.realEmail) return null;
  const keys = await listPasskeys();
  if (keys.length && !(await isUnlocked(viewer.realUserId))) return null;
  return { viewer, keys };
}

/** GET: options to set up Face ID on this device. POST: verify and save it. */
export async function GET() {
  const o = await owner().catch(() => null);
  if (!o) return error(404, "Not found");
  const { rpID } = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: "Unspool owner panel",
    rpID,
    userName: o.viewer.realEmail!,
    userDisplayName: "Unspool owner",
    attestationType: "none",
    excludeCredentials: o.keys.map((k) => ({ id: k.id, transports: k.transports as AuthenticatorTransport[] })),
    authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" },
  });
  if (!(await setChallenge("reg", options.challenge))) return error(503, "Face ID isn't configured on the server.");
  return json(options);
}

export async function POST(req: Request) {
  const o = await owner().catch(() => null);
  if (!o) return error(404, "Not found");
  const expectedChallenge = await takeChallenge("reg");
  if (!expectedChallenge) return error(400, "That took too long. Try again.");
  const body = (await req.json().catch(() => null)) as { response?: RegistrationResponseJSON; device?: string } | null;
  if (!body?.response) return error(400, "Bad request");
  const { rpID, origins } = await relyingParty();
  const result = await verifyRegistrationResponse({ response: body.response, expectedChallenge, expectedOrigin: origins, expectedRPID: rpID, requireUserVerification: true }).catch(() => null);
  if (!result?.verified) return error(400, "Couldn't verify Face ID. Try again.");
  const c = result.registrationInfo.credential;
  const { error: e } = await adminClient()
    .from("owner_passkeys")
    .insert({ id: c.id, email: o.viewer.realEmail!.toLowerCase(), public_key: Buffer.from(c.publicKey).toString("base64url"), counter: c.counter, transports: c.transports ?? [], device: (body.device ?? "").slice(0, 80) || null });
  if (e) return error(500, "Couldn't save it.");
  await setUnlocked(o.viewer.realUserId!);
  return json({ ok: true });
}
