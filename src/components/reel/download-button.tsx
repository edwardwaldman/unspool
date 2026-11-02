"use client";

import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Off until the recorder service is deployed (worker/README.md); then flip to true to show the button. */
export const DOWNLOADS_ON = false;

type State = { status: "none" | "rendering" | "ready" | "failed"; url?: string; error?: string };

/** Save the browser a file from a signed URL (the link itself carries the file name). */
function save(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Download this reel as an MP4: an exact recording of it as it plays here (scenes, captions, voice, music),
 * made on request by the recorder. The first time takes a few minutes; after that it's instant.
 */
export function DownloadReelButton({ reelId }: { reelId: string }) {
  const [st, setSt] = useState<State | null>(null);
  const wanted = useRef(false);
  const poll = useRef<number>(0);

  const check = useCallback(async () => {
    const res = await fetch(`/api/reels/${reelId}/download`, { cache: "no-store" }).catch(() => null);
    const b = res ? ((await res.json().catch(() => ({}))) as State & { error?: string }) : null;
    if (!res?.ok || !b) return setSt({ status: "failed", error: b?.error ?? "Couldn't check the download." });
    setSt(b);
    if (b.status === "ready" && b.url && wanted.current) {
      wanted.current = false;
      save(b.url);
    }
  }, [reelId]);

  // Ask once where it stands (it may already be made).
  useEffect(() => {
    let live = true;
    fetch(`/api/reels/${reelId}/download`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<State>) : null))
      .then((b) => live && b && setSt(b))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [reelId]);
  // While it records, look again every few seconds.
  useEffect(() => {
    if (st?.status !== "rendering") return;
    poll.current = window.setInterval(() => void check(), 5000);
    return () => window.clearInterval(poll.current);
  }, [st?.status, check]);

  const start = async () => {
    if (st?.status === "ready" && st.url) return save(st.url);
    wanted.current = true;
    setSt({ status: "rendering" });
    const res = await fetch(`/api/reels/${reelId}/download`, { method: "POST" }).catch(() => null);
    const b = res ? ((await res.json().catch(() => ({}))) as State & { error?: string }) : null;
    if (!res?.ok || !b) return setSt({ status: "failed", error: b?.error ?? "Couldn't start the download." });
    setSt(b);
    if (b.status === "ready" && b.url) {
      wanted.current = false;
      save(b.url);
    }
  };

  const busy = st?.status === "rendering";
  return (
    <div data-testid="download-reel">
      <button type="button" onClick={start} disabled={busy} className="btn-secondary w-full justify-center gap-2 py-2.5 text-[14px] disabled:opacity-80">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={1.9} />}
        {busy ? "Making your video…" : st?.status === "ready" ? "Download video (MP4)" : "Download video"}
      </button>
      {busy && <p className="mt-1.5 text-[12.5px] text-muted">An exact copy of the reel, with sound. Usually 2 to 5 minutes; it downloads on its own when it&apos;s ready. You can keep watching.</p>}
      {st?.status === "failed" && <p className="mt-1.5 text-[12.5px] text-coral">{st.error}</p>}
    </div>
  );
}
