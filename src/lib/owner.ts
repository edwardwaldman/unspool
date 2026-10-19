// The owner account(s): an owner panel and unlimited use for testing. OWNER_EMAILS (comma-separated)
// overrides the default. Server checks are authoritative; the client copy only decides whether to show a link.
export const DEFAULT_OWNER_EMAILS = ["edwardwaldman@proton.me"];

export function ownerEmails(): string[] {
  const env = typeof process !== "undefined" ? process.env.OWNER_EMAILS : undefined;
  const list = env ? env.split(",") : DEFAULT_OWNER_EMAILS;
  return list.map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined) {
  return Boolean(email) && ownerEmails().includes(email!.trim().toLowerCase());
}
