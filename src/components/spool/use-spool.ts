"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";

function settled(s: SpoolDTO) {
  if (s.status === "failed") return true;
  // Still being processed: right after planning every reel is briefly locked until the free reel (or credits)
  // are granted a few seconds later, so "everything locked" mustn't stop polling yet.
  if (s.status !== "ready" || !s.reels.length) return false;
  return s.reels.every((r) => r.locked || r.status === "ready" || r.status === "failed");
}

/** A reel minus its signed URLs (re-signed on every fetch), so an unchanged reel compares equal across polls. */
const unsigned = (u: string | undefined) => u?.split("?")[0];
function signature(r: ReelDTO) {
  const audio = r.audio ? Object.fromEntries(Object.entries(r.audio).map(([k, a]) => [k, { ...a, url: unsigned((a as { url?: string }).url) }])) : undefined;
  return JSON.stringify({ ...r, audio, videoUrl: unsigned(r.videoUrl) });
}

/**
 * Keep every reel that hasn't changed as the exact object already on screen. Polling re-signs the audio and
 * video URLs each time; handing the player new URLs every 2 s restarted the reel being watched while the rest
 * of the document was still generating.
 */
function keepStable(prev: SpoolDTO | null, next: SpoolDTO): SpoolDTO {
  if (!prev || prev.id !== next.id) return next;
  const old = new Map(prev.reels.map((r) => [r.id, r]));
  let same = prev.reels.length === next.reels.length;
  const reels = next.reels.map((r, i) => {
    const o = old.get(r.id);
    const keep = o && signature(o) === signature(r) ? o : r;
    if (keep !== prev.reels[i]) same = false;
    return keep;
  });
  const rest = (s: SpoolDTO) => JSON.stringify({ ...s, reels: null });
  return same && rest(prev) === rest(next) ? prev : { ...next, reels };
}

/** Fetch a spool and keep polling while its reels are still being generated. */
export function useSpool(id: string, opts: { keepPolling?: boolean } = {}) {
  const [spool, setSpool] = useState<SpoolDTO | null>(null);
  const [viewer, setViewer] = useState<ViewerDTO | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const keep = useRef(opts.keepPolling);
  useEffect(() => {
    keep.current = opts.keepPolling;
  }, [opts.keepPolling]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (ms: number) => {
      if (!cancelled) timer = setTimeout(load, ms);
    };
    async function load() {
      try {
        const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError({ status: res.status, message: body.error ?? "Couldn't load this spool." });
          if (res.status !== 404 && res.status !== 503) schedule(4000);
          return;
        }
        setError(null);
        setSpool((prev) => keepStable(prev, body.spool));
        setViewer(body.viewer);
        if (!settled(body.spool) || keep.current) schedule(settled(body.spool) ? 2000 : 1200);
        // Free drip: refetch when the next free reel can be unlocked, so the countdown flips to "ready".
        else if (body.spool.nextFreeUnlockAt && Date.parse(body.spool.nextFreeUnlockAt) > Date.now()) schedule(Math.min(2 ** 31 - 1, Math.max(1000, Date.parse(body.spool.nextFreeUnlockAt) - Date.now() + 1500)));
      } catch {
        schedule(4000);
      }
    }
    schedule(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  // Unlocks (free drip, credits) ask every open spool to refetch.
  useEffect(() => {
    window.addEventListener("unspool:reload", reload);
    return () => window.removeEventListener("unspool:reload", reload);
  }, [reload]);
  return { spool, viewer, error, reload };
}
