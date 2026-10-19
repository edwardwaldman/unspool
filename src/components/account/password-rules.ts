export const MIN_PASSWORD = 8;

export const PASSWORD_HINT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol. A passphrase works: add a capital, a digit and a punctuation mark.";

/** What a new password is still missing, as one sentence, or null when it passes. */
export function passwordProblem(p: string): string | null {
  const missing = [
    !/[A-Z]/.test(p) && "an uppercase letter",
    !/[a-z]/.test(p) && "a lowercase letter",
    !/[0-9]/.test(p) && "a number",
    !/[^A-Za-z0-9]/.test(p) && "a symbol",
  ].filter(Boolean) as string[];
  const short = p.length < MIN_PASSWORD;
  if (!short && !missing.length) return null;
  const list = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0];
  if (short && list) return `Use at least ${MIN_PASSWORD} characters and add ${list}.`;
  if (short) return `Use at least ${MIN_PASSWORD} characters.`;
  return `Add ${list}.`;
}

/** Never let a button spin forever: give up on a Supabase call after 15 seconds. */
export function withTimeout<T>(p: PromiseLike<T>, ms = 15_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
