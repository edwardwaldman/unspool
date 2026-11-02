import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, short-lived links to /record/<reelId>: the only way the download recorder (or anyone) can open a reel's
// record page, which plays any reel without an account. Signed with RENDER_SECRET, which the recorder also holds.

const secret = () => process.env.RENDER_SECRET ?? "";
const sign = (reelId: string, exp: number) => createHmac("sha256", secret()).update(`record:${reelId}:${exp}`).digest("base64url");

/** A token for `reelId`, valid for `ttlSec` seconds, or null when recording isn't configured. */
export function recordToken(reelId: string, ttlSec = 60 * 60): string | null {
  if (!secret()) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  return `${exp}.${sign(reelId, exp)}`;
}

export function checkRecordToken(reelId: string, token: string | undefined): boolean {
  if (!secret() || !token) return false;
  const [e, sig] = token.split(".");
  const exp = Number(e);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || !sig) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(reelId, exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
