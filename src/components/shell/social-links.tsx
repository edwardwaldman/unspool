/** Unspool's official social profiles (also the Organization's sameAs in the root layout). */
export const SOCIALS = [
  { name: "X", href: "https://x.com/unspoolcc", path: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.8 2h6.4l4.4 5.9L18.9 2Zm-1.1 18.1h1.7L7.3 3.8H5.5l12.3 16.3Z" },
  { name: "Instagram", href: "https://www.instagram.com/unspoolcc/", path: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1ZM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9Z" },
  { name: "TikTok", href: "https://www.tiktok.com/@unspoolcc", path: "M16.6 0h-4v16.3a3.4 3.4 0 1 1-3.4-3.4c.3 0 .7 0 1 .1V8.9a7.5 7.5 0 1 0 6.4 7.4V8a9.6 9.6 0 0 0 5.6 1.8v-4A5.6 5.6 0 0 1 16.6 0Z" },
] as const;

/** A row of icon links to the social profiles. */
export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {SOCIALS.map((s) => (
        <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer me" aria-label={`Unspool on ${s.name}`} className="text-muted transition-colors hover:text-ink">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
