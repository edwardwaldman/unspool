"use client";

import { Check, Copy, Link2, Mail, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { openAuth } from "../auth/auth-store";
import { ShareIcon } from "../ui/icons";
import { Sheet } from "../ui/sheet";
import { toast } from "../ui/toast";

const plain = (s: string) => s.replace(/[*#^~]/g, "");

export function shareText(hook: string) {
  return `${plain(hook)} · made with Unspool`;
}

/** Quick share targets for a link. */
export function shareTargets(url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: "sms", label: "Messages", href: `sms:?&body=${encodeURIComponent(`${text} ${url}`)}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { id: "email", label: "Email", href: `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n\n${url}`)}` },
  ];
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast("Couldn't copy. Select the link and copy it.");
    return false;
  }
}

/** Copy, native share and quick targets for one link. */
export function ShareActions({ url, text }: { url: string; text: string }) {
  const [canNative, setCanNative] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [copied]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function"));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div>
      <div className="flex">
        <input readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} className="field min-w-0 flex-1 px-3 py-2.5 font-mono text-[12.5px]" data-testid="share-url" />
        <button type="button" onClick={async () => setCopied(await copy(url))} aria-live="polite" className="-ml-px flex shrink-0 items-center gap-2 bg-thread px-4 text-[14px] font-semibold text-paper hover:opacity-90" data-testid="copy-link">
          {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />} {copied ? "Copied link" : "Copy link"}
        </button>
      </div>
      {canNative && (
        <button
          type="button"
          onClick={() => navigator.share({ title: "Unspool", text, url }).catch(() => undefined)}
          className="btn-secondary mt-3 w-full py-2.5 text-[14px]"
        >
          <ShareIcon size={16} /> Share via…
        </button>
      )}
      <div className="mt-3 grid grid-cols-5 border-l border-t border-line">
        {shareTargets(url, text).map((t) => (
          <a
            key={t.id}
            href={t.href}
            target={t.id === "sms" || t.id === "email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 border-b border-r border-line px-1 py-3 text-[11.5px] text-muted transition-colors hover:text-ink"
          >
            <TargetGlyph id={t.id} />
            {t.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function TargetGlyph({ id }: { id: string }) {
  if (id === "email") return <Mail size={18} strokeWidth={1.75} />;
  if (id === "sms") return <MessageSquare size={18} strokeWidth={1.75} />;
  const letter = { x: "X", whatsapp: "W", linkedin: "in" }[id] ?? "";
  return <span className="flex h-[18px] min-w-[18px] items-center justify-center border border-current px-0.5 text-[10px] font-bold leading-none">{letter}</span>;
}

type State = { phase: "idle" | "loading" | "ready" | "error"; url?: string; error?: string; showTitle: boolean };

/**
 * Share the current reel. Only the document's owner can make a link, and only for a reel they can play;
 * the demo hands out the demo share. The link opens /r/<slug> for anyone, without an account.
 */
export function ShareSheet({
  open,
  onClose,
  spool,
  reel,
  viewer,
  publicUrl = false,
}: {
  open: boolean;
  onClose: () => void;
  spool: SpoolDTO;
  reel: ReelDTO;
  viewer: ViewerDTO | null;
  /** On a public share page: pass the page's own link along. */
  publicUrl?: boolean;
}) {
  const [st, setSt] = useState<State>({ phase: "idle", showTitle: true });
  const demo = Boolean(spool.demo) && !publicUrl;
  const passOn = publicUrl;
  const text = shareText(reel.hook);

  const request = useCallback(
    async (showTitle?: boolean) => {
      setSt((s) => ({ ...s, phase: "loading" }));
      try {
        const res = await fetch(`/api/reels/${reel.id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(showTitle === undefined ? {} : { showTitle }),
        });
        const b = (await res.json().catch(() => ({}))) as { share?: { slug: string; showTitle: boolean }; error?: string };
        if (!res.ok || !b.share) return setSt((s) => ({ ...s, phase: "error", error: b.error ?? "Couldn't make a link" }));
        setSt({ phase: "ready", url: `${window.location.origin}/r/${b.share.slug}`, showTitle: b.share.showTitle });
      } catch {
        setSt((s) => ({ ...s, phase: "error", error: "Couldn't make a link" }));
      }
    },
    [reel.id],
  );

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (passOn) setSt({ phase: "ready", url: `${window.location.origin}${window.location.pathname}`, showTitle: true });
      else if (demo) setSt({ phase: "ready", url: `${window.location.origin}/r/demo`, showTitle: true });
      else if (viewer?.signedIn && !reel.locked) void request();
      else setSt({ phase: "idle", showTitle: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open, demo, passOn, viewer?.signedIn, reel.id, reel.locked, request]);

  return (
    <Sheet open={open} onClose={onClose} label="Share this reel">
      <div data-testid="share-sheet">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Link2 size={15} strokeWidth={1.75} /> Share this reel
        </div>
        <p className="mt-2 line-clamp-2 font-display text-[20px] leading-[1.15] text-ink">{plain(reel.hook)}</p>
        <p className="mt-1.5 text-[13px] text-muted">Anyone with the link can watch this one reel. Not the rest of the document, and not the file.</p>
        <div className="mt-4">
          {reel.locked ? (
            <p className="text-[14px] text-muted">Locked reels can&apos;t be shared. Unlock it first.</p>
          ) : !demo && !passOn && !viewer?.signedIn ? (
            <div>
              <p className="text-[14px] text-ink/85">Save this spool to a free account to get a share link.</p>
              <button type="button" onClick={() => openAuth("signup")} className="btn-primary mt-3 w-full py-2.5 text-[14px]">
                Create a free account
              </button>
            </div>
          ) : st.phase === "ready" && st.url ? (
            <ShareActions url={st.url} text={text} />
          ) : st.phase === "error" ? (
            <div>
              <p className="text-[14px] text-coral">{st.error}</p>
              <button type="button" onClick={() => request()} className="btn-secondary mt-3 px-4 py-2 text-[14px]">
                Try again
              </button>
            </div>
          ) : (
            <div className="shimmer h-[42px] w-full" aria-label="Making a link" />
          )}
        </div>
        {demo ? (
          <p className="mt-4 text-[12.5px] text-muted">This is the sample spool. Upload your own document to share your reels.</p>
        ) : (
          !passOn &&
          viewer?.signedIn &&
          !reel.locked && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13.5px] text-ink/85">
              <input
                type="checkbox"
                checked={st.showTitle}
                disabled={st.phase === "loading"}
                onChange={(e) => request(e.target.checked)}
                className="h-4 w-4 accent-[var(--thread)]"
              />
              Show document title
            </label>
          )
        )}
      </div>
    </Sheet>
  );
}
