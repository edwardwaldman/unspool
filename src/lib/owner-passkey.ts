import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { adminClient } from "./supabase/admin";

// Face ID (a WebAuthn passkey) for the owner panel. The owner registers a passkey while signed in; after that the
// panel and its data need a fresh passkey unlock (12 h), and /owner/unlock signs the owner in with Face ID alone.

const CHALLENGE_COOKIE = "unspool_pk_chal";
export const UNLOCK_COOKIE = "unspool_owner_unlock";
const CHALLENGE_TTL_S = 5 * 60;
export const UNLOCK_TTL_S = 12 * 60 * 60;

/** Server-only signing key; null (fail closed: nothing verifies) when no secret is configured. */
function key(): string | null {
  const base = process.env.OWNER_UNLOCK_SECRET || process.env.JOB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return base ? createHmac("sha256", base).update("unspool:owner-passkey").digest("hex") : null;
}

function sign(payload: object): string | null {
  const k = key();
  if (!k) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", k).update(body).digest("base64url")}`;
}

function open<T extends { exp: number }>(token: string | undefined): T | null {
  const k = key();
  if (!k || !token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = createHmac("sha256", k).update(body).digest();
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const v = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return v.exp > Date.now() / 1000 ? v : null;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({ httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge });

/** The relying party: unspool.cc (so a passkey works on www and the bare domain), else the host itself (previews). */
export async function relyingParty() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost").split(",")[0].trim();
  const hostname = host.split(":")[0];
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() ?? (hostname === "localhost" ? "http" : "https");
  const rpID = hostname === "unspool.cc" || hostname.endsWith(".unspool.cc") ? "unspool.cc" : hostname;
  const origins = Array.from(new Set([`${proto}://${host}`, ...(rpID === "unspool.cc" ? ["https://unspool.cc", "https://www.unspool.cc"] : [])]));
  return { rpID, origins };
}

export async function setChallenge(kind: "reg" | "auth", challenge: string) {
  const token = sign({ kind, c: challenge, exp: Math.floor(Date.now() / 1000) + CHALLENGE_TTL_S });
  if (!token) return false;
  (await cookies()).set(CHALLENGE_COOKIE, token, cookieOpts(CHALLENGE_TTL_S));
  return true;
}

/** The pending challenge of this kind, consumed (one use). */
export async function takeChallenge(kind: "reg" | "auth"): Promise<string | null> {
  const jar = await cookies();
  const v = open<{ kind: string; c: string; exp: number }>(jar.get(CHALLENGE_COOKIE)?.value);
  jar.delete(CHALLENGE_COOKIE);
  return v && v.kind === kind ? v.c : null;
}

export async function setUnlocked(userId: string) {
  const token = sign({ uid: userId, exp: Math.floor(Date.now() / 1000) + UNLOCK_TTL_S });
  if (token) (await cookies()).set(UNLOCK_COOKIE, token, cookieOpts(UNLOCK_TTL_S));
}

/** The owner unlocked the panel with Face ID recently, on this browser, as this user. */
export async function isUnlocked(userId: string | null) {
  if (!userId) return false;
  const v = open<{ uid: string; exp: number }>((await cookies()).get(UNLOCK_COOKIE)?.value);
  return Boolean(v && v.uid === userId);
}

export type OwnerPasskey = { id: string; email: string; public_key: string; counter: number; transports: string[]; device: string | null };

export async function listPasskeys(): Promise<OwnerPasskey[]> {
  const { data, error } = await adminClient().from("owner_passkeys").select("id,email,public_key,counter,transports,device").order("created_at");
  if (error) throw error;
  return (data ?? []) as OwnerPasskey[];
}

/**
 * Whether the panel must be unlocked with Face ID for this owner: once any passkey exists. Before the first one
 * is set up the panel works as before (signed-in owner), so setting it up can't lock the owner out.
 */
export async function ownerNeedsUnlock(userId: string | null) {
  const keys = await listPasskeys().catch(() => null);
  // A failed read fails closed once passkeys might exist: treat as locked.
  if (keys === null) return !(await isUnlocked(userId));
  return keys.length > 0 && !(await isUnlocked(userId));
}
