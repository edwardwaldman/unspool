"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";

function settled(s: SpoolDTO) {
  if (s.status === "failed") return true;
  if (!s.reels.length) return false;
  return s.reels.every((r) => r.locked || r.status === "ready" || r.status === "failed");
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
        setSpool(body.spool);
        setViewer(body.viewer);
        if (!settled(body.spool) || keep.current) schedule(2000);
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
  return { spool, viewer, error, reload };
}
