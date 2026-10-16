"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import type { SpoolDTO } from "@/lib/spool-types";
import { Feed, type FeedItem } from "../reel/feed";
import { startCheckout } from "../reel/paywall-sheet";
import { toast } from "../ui/toast";
import { useUpload } from "../upload/upload-store";
import { useSpool } from "./use-spool";

function itemsFor(spool: SpoolDTO | null): FeedItem[] {
  if (!spool || spool.reels.length === 0) return [{ key: "loading", spool, reel: null }];
  return spool.reels.map((r) => ({ key: r.id, spool, reel: r }));
}

export function DemoFeed() {
  const params = useSearchParams();
  const items = useMemo(() => itemsFor(SAMPLE_SPOOL), []);
  const initial = Math.max(1, Math.min(10, Number(params.get("reel") ?? 1))) - 1;
  return <Feed items={items} viewer={null} tab="doc" docHref="/s/demo" initialIndex={initial} />;
}

/** The full-screen feed for one document: loading reel → reel 1 → paywall → reels 2–10. */
export function SpoolFeed({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const upload = useUpload(id);
  const uploading = upload?.phase === "uploading" || upload?.phase === "starting";
  const { spool, viewer, error, reload } = useSpool(id, { keepPolling: uploading });
  const initialReel = Math.max(1, Math.min(10, Number(params.get("reel") ?? 1))) - 1;

  // Back from sign-in with an intended purchase → straight to Stripe Checkout.
  const checkoutIntent = params.get("checkout");
  const startedCheckout = useRef(false);
  useEffect(() => {
    if (!checkoutIntent || !viewer?.signedIn || !spool || startedCheckout.current) return;
    startedCheckout.current = true;
    if (spool.unlocked) return;
    const kind = checkoutIntent === "sub" ? "subscription" : "document";
    startCheckout(kind, id, initialReel + 1).then((err) => err && toast(err, 4000));
  }, [checkoutIntent, viewer?.signedIn, spool, id, initialReel]);

  // Back from Stripe → confirm payment, refresh, and keep playing from the same reel.
  const sessionId = params.get("checkout_session");
  const verified = useRef(false);
  useEffect(() => {
    if (!sessionId || verified.current) return;
    verified.current = true;
    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((b: { fulfilled?: boolean }) => {
        if (b.fulfilled) toast("Unlocked. All 10 reels are yours.", 3500);
        reload();
        router.replace(`/s/${id}?reel=${initialReel + 1}`, { scroll: false });
      })
      .catch(() => reload());
  }, [sessionId, id, initialReel, reload, router]);

  const items = useMemo(() => itemsFor(spool), [spool]);

  if (error?.status === 404) {
    return (
      <div className="flex h-full flex-col justify-center bg-ink px-8">
        <div className="label">Not found</div>
        <h1 className="mt-3 font-display text-[38px] leading-[1.02]">This spool isn&apos;t here.</h1>
        <p className="mt-2 text-[15px] text-muted">It was deleted, or it belongs to another account.</p>
        <Link href="/" className="btn-primary mt-6 self-start px-5 py-2.5 text-[14px]">
          Upload a document
        </Link>
      </div>
    );
  }
  if (error?.status === 503) {
    return (
      <div className="flex h-full flex-col justify-center bg-ink px-8">
        <div className="label">Setup</div>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05]">Not configured yet.</h1>
        <p className="mt-2 text-[15px] text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <Feed
      items={items}
      viewer={viewer}
      tab="doc"
      docHref={`/s/${id}`}
      initialIndex={initialReel}
      upload={upload}
      onIndexChange={(i) => {
        const url = new URL(window.location.href);
        url.searchParams.set("reel", String(i + 1));
        window.history.replaceState(window.history.state, "", url);
      }}
      onRetry={async () => {
        await fetch(`/api/documents/${id}/retry`, { method: "POST" });
        reload();
      }}
      onDeleted={() => router.push("/library")}
    />
  );
}
