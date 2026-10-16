"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { ChevronDown, ChevronUp, FilterIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import { useIsDesktop } from "../ui/use-media";
import type { UploadState } from "../upload/upload-store";
import { LoadingReel } from "./loading-reel";
import { LockedReel } from "./locked-reel";
import { MoreSheet } from "./more-sheet";
import { PaywallSheet } from "./paywall-sheet";
import { ReelView } from "./reel-view";

export type FeedItem = { key: string; spool: SpoolDTO | null; reel: ReelDTO | null };

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
  const dismissedPaywall = useRef<Set<string>>(new Set());
  const isDesktop = useIsDesktop();
  const bottomInset = isDesktop ? 0 : 84;

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
  useEffect(() => {
    const r = active?.reel;
    if (r?.locked && !dismissedPaywall.current.has(r.id)) {
      const t = setTimeout(() => setPaywallFor(index), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPaywallFor(null), 0);
    return () => clearTimeout(t);
  }, [active?.reel, index]);

  const total = (s: SpoolDTO | null) => s?.reels.length || 10;
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
          let content: React.ReactNode;
          if (!near) content = <div className="h-full w-full bg-ink" />;
          else if (!it.reel || (!it.reel.locked && it.reel.status !== "ready")) {
            content = (
              <LoadingReel
                spool={it.spool}
                upload={i === 0 ? upload ?? null : null}
                reelIndex={it.reel?.index ?? 1}
                failed={it.reel?.status === "failed"}
                onRetry={() => onRetry?.(it.spool)}
                bottomInset={bottomInset}
              />
            );
          } else if (it.reel.locked) {
            content = (
              <LockedReel
                reel={it.reel}
                bottomInset={bottomInset}
                onUnlock={() => {
                  dismissedPaywall.current.delete(it.reel!.id);
                  setPaywallFor(i);
                }}
              />
            );
          } else {
            content = (
              <ReelView
                spool={it.spool!}
                reel={it.reel}
                active={isActive && paywallFor === null && !moreOpen}
                total={total(it.spool)}
                chrome={{ bottomInset }}
                onMore={() => setMoreOpen(true)}
                onEnded={() => {
                  if (i + 1 < items.length) setTimeout(() => scrollTo(i + 1), 900);
                }}
              />
            );
          }
          return (
            <section key={it.key} className="h-full w-full snap-start snap-always" aria-label={it.reel?.title ?? "Loading reel"}>
              {content}
            </section>
          );
        })}
      </div>

      {/* Top tabs: This doc | All spools */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center pt-4">
        <div className="pointer-events-auto flex items-center gap-5 text-[15.5px] font-semibold">
          {docHref ? (
            <Link href={docHref} className={tab === "doc" ? "text-cream" : "text-muted"}>
              This doc
            </Link>
          ) : (
            <span className={tab === "doc" ? "text-cream" : "text-muted"}>This doc</span>
          )}
          <span className="h-3.5 w-px bg-line" />
          <Link href="/feed" className={tab === "all" ? "text-cream" : "text-muted"}>
            All spools
          </Link>
        </div>
        <Link href="/library" aria-label="Library" className="pointer-events-auto absolute right-4 top-4 text-cream">
          <FilterIcon size={20} />
        </Link>
      </div>

      {/* Desktop up/down buttons, like TikTok web */}
      <div className="absolute -right-[76px] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        <button
          type="button"
          aria-label="Previous reel"
          disabled={index === 0}
          onClick={() => scrollTo(Math.max(0, index - 1))}
          className="flex h-11 w-11 items-center justify-center border border-line text-cream hover:border-muted disabled:opacity-30"
        >
          <ChevronUp size={24} />
        </button>
        <button
          type="button"
          aria-label="Next reel"
          disabled={index >= items.length - 1}
          onClick={() => scrollTo(Math.min(items.length - 1, index + 1))}
          className="flex h-11 w-11 items-center justify-center border border-line text-cream hover:border-muted disabled:opacity-30"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {paywallItem?.spool && paywallItem.reel && (
        <PaywallSheet
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
      {active?.spool && (
        <MoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          canDelete={!active.spool.demo}
          sensitive={active.spool.sensitive}
          onDelete={async () => {
            const s = active.spool!;
            const res = await fetch(`/api/documents/${s.id}`, { method: "DELETE" });
            setMoreOpen(false);
            if (res.ok) {
              toast("Document deleted");
              onDeleted?.(s);
            } else toast("Couldn't delete. Try again.");
          }}
        />
      )}
    </div>
  );
}
