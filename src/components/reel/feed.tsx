"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { MAX_REELS } from "@/lib/config";
import { track } from "../analytics/track";
import { ChevronDown, ChevronUp, FilterIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import { useIsDesktop } from "../ui/use-media";
import type { UploadState } from "../upload/upload-store";
import { LoadingReel } from "./loading-reel";
import { LockedReel } from "./locked-reel";
import { MoreSheet } from "./more-sheet";
import { freeAtFor } from "../ui/use-countdown";
import { UnlockSheet } from "./drip-gate";
import { ReelView } from "./reel-view";
import { ShareSheet } from "./share-sheet";

export type FeedItem = { key: string; spool: SpoolDTO | null; reel: ReelDTO | null };

/**
 * What one feed slot shows for its reel: the loading reel while it's being written, the locked teaser,
 * or the playable reel. Shared by the mobile feed and the desktop workbench player.
 */
export function ReelSlot({
  item,
  upload,
  active,
  total,
  bottomInset,
  topInset = 0,
  onRetry,
  onUnlock,
  onMore,
  onEnded,
  onShare,
}: {
  item: FeedItem;
  upload: UploadState | null;
  active: boolean;
  total: number;
  bottomInset: number;
  /** Room for overlays drawn over the top of the frame (the feed's tabs). */
  topInset?: number;
  onRetry: () => void;
  onUnlock: () => void;
  onMore: () => void;
  onEnded: () => void;
  onShare?: () => void;
}) {
  const r = item.reel;
  if (!r || (!r.locked && r.status !== "ready")) {
    return <LoadingReel spool={item.spool} upload={upload} reelIndex={r?.index ?? 1} failed={r?.status === "failed"} onRetry={onRetry} bottomInset={bottomInset} />;
  }
  if (r.locked) {
    const s = item.spool;
    return <LockedReel reel={r} total={total} bottomInset={bottomInset} topInset={topInset} onUnlock={onUnlock} freeAt={s ? freeAtFor(r.index, s.freeReels, s.nextFreeUnlockAt) : null} />;
  }
  return <ReelView spool={item.spool!} reel={r} active={active} total={total} chrome={{ bottomInset, topInset }} onMore={onMore} onEnded={onEnded} onShare={onShare} />;
}

/** The "more" sheet for a spool's reel (mute, speed, delete the document). */
export function SpoolMoreSheet({ spool, reel, viewer, open, onClose, onDeleted }: { spool: SpoolDTO; reel?: ReelDTO | null; viewer?: ViewerDTO | null; open: boolean; onClose: () => void; onDeleted?: (spool: SpoolDTO) => void }) {
  const tier = viewer?.usage?.tier;
  return (
    <MoreSheet
      open={open}
      onClose={onClose}
      canDelete={!spool.demo}
      sensitive={spool.sensitive}
      editReelId={!spool.demo && reel && !reel.locked && reel.status === "ready" ? reel.id : undefined}
      canEdit={tier === "pro" || tier === "ultra"}
      onDelete={async () => {
        const res = await fetch(`/api/documents/${spool.id}`, { method: "DELETE" });
        onClose();
        if (res.ok) {
          toast("Document deleted");
          onDeleted?.(spool);
        } else toast("Couldn't delete. Try again.");
      }}
    />
  );
}

/**
 * Full-screen vertical feed with scroll-snap, like TikTok's For You page: one reel per screen,
 * autoplay on snap, swipe/scroll/arrow keys to move, locked reels open the paywall.
 */
export function Feed({
  items,
  viewer,
  tab,
  docHref,
  initialIndex = 0,
  onIndexChange,
  upload,
  onRetry,
  onDeleted,
}: {
  items: FeedItem[];
  viewer: ViewerDTO | null;
  tab: "doc" | "all";
  docHref?: string;
  initialIndex?: number;
  onIndexChange?: (i: number) => void;
  upload?: UploadState | null;
  onRetry?: (spool: SpoolDTO | null) => void;
  onDeleted?: (spool: SpoolDTO) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [paywallFor, setPaywallFor] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const dismissedPaywall = useRef<Set<string>>(new Set());
  const isDesktop = useIsDesktop();
  // No floating nav sits over the feed any more; just keep the overlays off the home indicator.
  const bottomInset = isDesktop ? 0 : 14;

  const scrollTo = useCallback((i: number, smooth = true) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Jump to the initial reel (e.g. back from checkout) without animation.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || items.length <= initialIndex) return;
    didInit.current = true;
    requestAnimationFrame(() => scrollTo(initialIndex, false));
  }, [initialIndex, items.length, scrollTo]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index && i >= 0 && i < items.length) {
      setIndex(i);
      onIndexChange?.(i);
    }
  };

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollTo(Math.min(items.length - 1, index + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollTo(Math.max(0, index - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, scrollTo]);

  // Swiping onto a locked reel slides up the paywall (once per reel, unless tapped again).
  const active = items[index];
  const viewedId = active?.reel && !active.reel.locked ? active.reel.id : null;
  useEffect(() => {
    if (viewedId) track("reel_viewed", active?.reel?.index);
  }, [viewedId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const r = active?.reel;
    if (r?.locked && !dismissedPaywall.current.has(r.id)) {
      const t = setTimeout(() => setPaywallFor(index), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPaywallFor(null), 0);
    return () => clearTimeout(t);
  }, [active?.reel, index]);

  const total = (s: SpoolDTO | null) => s?.reels.length || s?.totalReels || MAX_REELS;
  const paywallItem = paywallFor !== null ? items[paywallFor] : null;

  return (
    <div className="relative h-full w-full">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain"
      >
        {items.map((it, i) => {
          const near = Math.abs(i - index) <= 1;
          const isActive = i === index;
          const content = !near ? (
            <div className="h-full w-full bg-paper" />
          ) : (
            <ReelSlot
              item={it}
              upload={i === 0 ? upload ?? null : null}
              active={isActive && paywallFor === null && !moreOpen && !shareOpen}
              total={total(it.spool)}
              bottomInset={bottomInset}
              topInset={40}
              onRetry={() => onRetry?.(it.spool)}
              onUnlock={() => {
                dismissedPaywall.current.delete(it.reel!.id);
                setPaywallFor(i);
              }}
              onMore={() => setMoreOpen(true)}
              onShare={() => setShareOpen(true)}
              onEnded={() => {
                if (i + 1 < items.length) setTimeout(() => scrollTo(i + 1), 900);
              }}
            />
          );
          return (
            <section key={it.key} className="h-full w-full snap-start snap-always" aria-label={it.reel?.title ?? "Loading reel"}>
              {content}
            </section>
          );
        })}
      </div>

      {/* Top tabs: This doc | All spools */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center pt-5" style={{ textShadow: "0 1px 0 rgba(0,0,0,.55)" }}>
        <div className="pointer-events-auto flex items-center gap-5 text-[15.5px] font-semibold">
          {docHref ? (
            <Link href={docHref} className={tab === "doc" ? "text-white" : "text-white/60"}>
              This doc
            </Link>
          ) : (
            <span className={tab === "doc" ? "text-white" : "text-white/60"}>This doc</span>
          )}
          <span className="h-3.5 w-px bg-white/30" />
          <Link href="/feed" className={tab === "all" ? "text-white" : "text-white/60"}>
            All spools
          </Link>
        </div>
        <Link href="/library" aria-label="Library" className="pointer-events-auto absolute right-4 top-5 text-white">
          <FilterIcon size={20} />
        </Link>
      </div>

      {/* Desktop up/down buttons, like TikTok web */}
      <div className="absolute -right-[68px] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button
          type="button"
          aria-label="Previous reel"
          disabled={index === 0}
          onClick={() => scrollTo(Math.max(0, index - 1))}
          className="flex h-11 w-11 items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-muted disabled:opacity-30"
        >
          <ChevronUp size={24} />
        </button>
        <button
          type="button"
          aria-label="Next reel"
          disabled={index >= items.length - 1}
          onClick={() => scrollTo(Math.min(items.length - 1, index + 1))}
          className="flex h-11 w-11 items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-muted disabled:opacity-30"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {paywallItem?.spool && paywallItem.reel && (
        <UnlockSheet
          open={paywallFor !== null}
          onClose={() => {
            dismissedPaywall.current.add(paywallItem.reel!.id);
            setPaywallFor(null);
          }}
          spool={paywallItem.spool}
          viewer={viewer}
          reel={paywallItem.reel.index}
        />
      )}
      {active?.spool && active.reel && <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} spool={active.spool} reel={active.reel} viewer={viewer} />}
      {active?.spool && <SpoolMoreSheet spool={active.spool} reel={active.reel} viewer={viewer} open={moreOpen} onClose={() => setMoreOpen(false)} onDeleted={onDeleted} />}
    </div>
  );
}
