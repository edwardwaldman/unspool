"use client";

import { X, Flame } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReelStyle } from "@/lib/reel-style";
import { fileLabel, fileTone, reelTint } from "../reel/accent";
import { ChevronDown, PlusIcon, Wordmark } from "../ui/icons";
import { MarkedText } from "../ui/marked-text";
import { Sheet } from "../ui/sheet";
import { useLayout } from "../ui/use-media";
import { promptFile, usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { CreditBar, RechargeButton, useCredits } from "./credit-bar";
import { startCheckout } from "../billing/checkout";
import { SeeAllPlans } from "../billing/plan-picker";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { QueueTimer, SkipPopup } from "./queue-timer";
import { toast } from "../ui/toast";
import { AccountMenu } from "./account-menu";
import { useStreak } from "./streak";
import { track } from "../analytics/track";
import { PromptBox } from "../go/go-hero";
import { PICK_EVENT, WelcomeTour } from "./welcome-tour";
import { ReelStylePanel, StyleUpsell } from "./reel-style-panel";

export type StudioDoc = {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  /** The stored file type (prompt, paste, pdf, ...), for the library grid's chip. */
  rawType: string;
  status: string;
  unlocked: boolean;
  /** Reels playable for free (the drip). */
  freeReels: number;
  createdAt: string;
  /** Planned reel count; null while planning. */
  total: number | null;
  readyCount: number;
  headline: string | null;
  hook: string | null;
  /** Every reel of the document, in order (the library, per document). */
  reels: { index: number; title: string; status: string; headline: string | null; locked: boolean }[];
};

export type StudioProps = {
  docs: StudioDoc[];
  style: ReelStyle;
  canEdit: boolean;
  plan: string;
  isNew?: boolean;
  fresh?: boolean;
  email?: string | null;
  /** First name for the greeting (from the sign-in account), if known. */
  name?: string | null;
  /** Free accounts: when the next free reel is allowed, and how many uploads wait in the queue for it. */
  /** ready: a queued upload may be started now (it shows a Ready button; nothing starts on its own). */
  queue?: { nextAt: string | null; queued: number; ready?: boolean };
};

/** The library's numbers, at the top of the document list. */
function LibraryStats({ docs, plan }: { docs: StudioDoc[]; plan: string }) {
  const reels = docs.reduce((n, d) => n + d.readyCount, 0);
  return (
    <div className="grid grid-cols-3 border-y border-line" data-testid="studio-stats" data-tour="studio-stats">
      {[
        [docs.length, docs.length === 1 ? "Doc" : "Docs"],
        [reels, "Reels"],
        [plan, "Plan"],
      ].map(([v, l], i) => (
        <div key={i} className={`px-3 py-2.5 ${i ? "border-l border-line" : ""}`}>
          <div className="font-mono text-[17px] leading-none text-ink">{v}</div>
          <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-muted">{l}</div>
        </div>
      ))}
    </div>
  );
}

/** A document's reels as a row of little 9:16 frames: tap one to watch it. */
function ReelStrip({ doc }: { doc: StudioDoc }) {
  if (!doc.reels.length) return <p className="px-2 pb-3 text-[12.5px] text-muted">Reels show up here as they&apos;re made.</p>;
  const tone = fileTone(doc.fileType);
  return (
    <ol className="flex gap-2 overflow-x-auto px-2 pb-3 [scrollbar-width:thin]" aria-label={`Reels of ${doc.name}`} data-testid="studio-reels">
      {doc.reels.map((r) => {
        const ready = r.status === "ready" && !r.locked;
        return (
          <li key={r.index} className="shrink-0">
            <Link
              href={`/s/${doc.id}?reel=${r.index}`}
              className={`relative block h-[112px] w-[63px] overflow-hidden border transition-transform hover:-translate-y-0.5 ipad:h-[150px] ipad:w-[84px] ${ready ? "border-white/[0.1]" : "border-line opacity-60"}`}
              style={{ background: reelTint(tone, 22) }}
              title={r.title}
            >
              <span className="absolute inset-x-[5px] top-[6px] line-clamp-6 font-hook text-[7px] font-extrabold leading-[1.25] text-white ipad:text-[9px]">
                {r.headline ? <MarkedText text={r.headline} /> : r.title}
              </span>
              <span className="absolute bottom-[4px] left-[5px] font-mono text-[8px] text-white/75">{r.index}</span>
              <span className="absolute bottom-[4px] right-[5px] font-mono text-[8px]" style={{ color: r.status === "failed" ? "var(--coral)" : "rgba(255,255,255,.75)" }}>
                {r.locked ? "locked" : r.status === "ready" ? "" : r.status === "failed" ? "failed" : "…"}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** One document in the Studio list: its row (opens the feed) and a toggle that shows its reels underneath. */
function DocItem({ doc, open, onToggle, size = "md" }: { doc: StudioDoc; open: boolean; onToggle: () => void; size?: "sm" | "md" }) {
  const s = docStatus(doc);
  return (
    <li>
      <div className="flex items-center">
        <Link href={`/s/${doc.id}`} className={`flex min-w-0 flex-1 items-center gap-3 ${size === "sm" ? "py-2.5" : "p-2"} text-left transition-colors hover:bg-white/[0.03]`}>
          <DocThumb doc={doc} size={size} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-ink ipad:text-[16px]">{doc.name}</span>
            <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted ipad:text-[13.5px]">
              {fileLabel(doc.fileType)}, {reelsLabel(doc)}
              <span className="font-medium tabular-nums" style={{ color: s.tone }}>
                {s.label}
              </span>
            </span>
          </span>
        </Link>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? "Hide reels" : "Show reels"} className="flex h-10 w-10 shrink-0 items-center justify-center text-muted hover:text-ink" data-testid="studio-doc-toggle">
          <ChevronDown size={17} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && <ReelStrip doc={doc} />}
    </li>
  );
}

const TYPES_HINT = "PDF, Word, slides, text or a photo of your notes";

function docStatus(d: StudioDoc): { label: string; tone: string } {
  if (d.status === "failed") return { label: "Failed", tone: "var(--coral)" };
  if (d.status === "queued") return { label: "Queued", tone: "var(--muted)" };
  if (["uploading", "uploaded", "extracting", "planning"].includes(d.status) || !d.total) return { label: "Unspooling", tone: "var(--thread)" };
  if (d.readyCount < d.total) return { label: `${d.readyCount} of ${d.total} ready`, tone: "var(--thread)" };
  return { label: "Ready", tone: "var(--sage)" };
}

const reelsLabel = (d: StudioDoc) => (d.total ? `${d.total} ${d.total === 1 ? "reel" : "reels"}` : d.status === "failed" ? "No reels" : d.status === "queued" ? "Waiting for a free reel" : "Planning");

/** The hidden file input + opener (same flow as every other upload button: sign-up and limits live in useUploader). */
function usePicker() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  // /?upload=1 (a share page's call to action) opens the picker straight away.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("upload") !== "1") return;
    url.searchParams.delete("upload");
    window.history.replaceState(window.history.state, "", url);
    input.current?.click();
  }, []);
  // The welcome tour's "Upload a document" opens this picker.
  useEffect(() => {
    const open = () => input.current?.click();
    window.addEventListener(PICK_EVENT, open);
    return () => window.removeEventListener(PICK_EVENT, open);
  }, []);
  const el = (
    <input
      ref={input}
      type="file"
      accept={FILE_ACCEPT}
      className="hidden"
      data-testid="studio-file"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) void upload(f);
      }}
    />
  );
  return { el, open: () => input.current?.click(), pending: Boolean(pending) };
}

/** The big round "+": the one thing to do here. */
function PlusButton({ onClick, pending, size }: { onClick: () => void; pending: boolean; size: "lg" | "md" }) {
  const box = size === "lg" ? "h-[132px] w-[132px]" : "h-[112px] w-[112px] ipad:h-[150px] ipad:w-[150px]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Upload a document"
      data-testid="studio-plus"
      data-tour="studio-plus"
      className={`group relative flex ${box} shrink-0 items-center justify-center rounded-full bg-thread text-paper transition-transform hover:scale-[1.04] active:scale-[0.97] disabled:opacity-60`}
    >
      <span aria-hidden className="absolute inset-0 rounded-full border border-thread motion-safe:animate-[studio-ring_2.6s_ease-out_infinite]" />
      <PlusIcon size={size === "lg" ? 58 : 50} strokeWidth={2} />
    </button>
  );
}

/** "Good afternoon, Sam" (or now and then something else friendly) and today's date, in the visitor's own time. */
function Greeting({ name }: { name?: string | null }) {
  const [line] = useState(() => {
    const h = new Date().getHours();
    const time = h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const others = ["Welcome back", "Ready to study", "Let's unspool something", "Back at it"];
    return Math.random() < 0.7 ? time : others[Math.floor(Math.random() * others.length)];
  });
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const streak = useStreak();
  return (
    <div data-testid="studio-greeting">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
        <span>{date}</span>
        {streak >= 2 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line py-0.5 pl-2 pr-2.5 text-[12px]" title="Days in a row you watched a reel (counted on this device)" data-testid="streak">
            <Flame size={13} strokeWidth={2.2} className="fill-[#ff8b3d] text-[#ff8b3d]" aria-hidden />
            <span className="font-semibold text-ink">{streak}-day streak</span>
          </span>
        )}
      </div>
      <h1 className="mt-0.5 font-display text-[26px] leading-[1.1] text-ink">
        {line}
        {name ? `, ${name}` : ""}
      </h1>
    </div>
  );
}

/** Still being made / waiting in the queue: queued uploads get a big row with their own countdown and a way to
 * remove one added by accident, plus "Unlock the reels now" (the free trial, or Plus once the trial is used). */
function ActiveList({ docs, nextAt, ready }: { docs: StudioDoc[]; nextAt: string | null; /** A queued upload may be started now. */ ready: boolean }) {
  const [items, setItems] = useState(docs);
  const [busy, setBusy] = useState(false);
  const usage = useCredits();
  const left = useCountdown(nextAt);
  const queued = items.some((d) => d.status === "queued");
  const [skipOpen, setSkipOpen] = useState(false);
  const remove = async (id: string) => {
    if (!window.confirm("Remove this from your queue?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setItems((list) => list.filter((d) => d.id !== id));
      toast("Removed from your queue");
    } else toast("Couldn't remove it. Try again.");
  };
  const unlock = async () => {
    setBusy(true);
    const err = await startCheckout(usage?.trialEligible ? { kind: "trial", returnTo: "/studio" as const } : { kind: "subscription", tier: "plus", returnTo: "/studio" as const });
    if (err) {
      toast(err, 4000);
      setBusy(false);
    }
  };
  // Ready: the oldest queued upload, once its turn has come. It is only made when they tap Ready (nothing starts on its own).
  const waiting = items.filter((d) => d.status === "queued").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const next = ready ? waiting[0] : undefined;
  const rest = waiting.filter((d) => d !== next);
  const making = items.filter((d) => d.status !== "queued");
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();
  const make = async (d: StudioDoc) => {
    setStarting(d.id);
    const res = await fetch(`/api/documents/${d.id}/make`, { method: "POST" }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) return router.push(`/s/${d.id}`);
    toast(body.error ?? "Couldn't start it. Try again.", 4000);
    setStarting(null);
    router.refresh();
  };
  const removeBtn = (d: StudioDoc) => (
    <button type="button" onClick={() => remove(d.id)} aria-label={`Remove ${d.name} from the queue`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-[18px] text-muted hover:border-coral hover:text-coral">
      <X size={18} strokeWidth={2} aria-hidden />
    </button>
  );
  const heading = (t: string) => <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{t}</div>;
  if (!items.length) return null;
  return (
    <div className="mx-auto w-full max-w-[560px] shrink-0 px-4 pb-4 ipad:max-w-[680px]" data-testid="studio-active">
      {next && (
        <div className="mb-5" data-testid="ready-to-make">
          {heading("Ready to make")}
          <div className="flex items-center gap-3 rounded-[18px] border border-thread bg-thread/[0.07] px-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[17px] font-semibold leading-snug text-ink">{next.name}</div>
              <div className="mt-1 text-[12.5px] text-muted">Your free reel is ready. Tap to start.</div>
            </div>
            <button
              type="button"
              onClick={() => make(next)}
              disabled={starting !== null}
              className="min-h-[44px] shrink-0 rounded-full bg-thread px-5 text-[15px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              data-testid="make-ready"
            >
              {starting === next.id ? "Starting..." : "Ready"}
            </button>
            {removeBtn(next)}
          </div>
        </div>
      )}
      {(rest.length > 0 || making.length > 0) && heading(rest.length ? "Your queue" : "In progress")}
      <ul className="space-y-2">
        {making.map((d) => {
          const st = docStatus(d);
          return (
            <li key={d.id}>
              <Link href={`/s/${d.id}`} className="flex items-center gap-3 rounded-[16px] border border-line px-4 py-3.5">
                <span className="min-w-0 flex-1 truncate text-[15.5px] text-ink">{d.name}</span>
                <span className="shrink-0 text-[13px] font-medium" style={{ color: st.tone }}>
                  {st.label}
                </span>
              </Link>
            </li>
          );
        })}
        {rest.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-4" data-testid="queued-row">
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[17px] font-semibold leading-snug text-ink">{d.name}</div>
              {left > 0 ? (
                <button type="button" onClick={() => setSkipOpen(true)} className="mt-1.5 flex items-baseline gap-2 text-left" aria-label={`Ready in ${formatCountdown(left)}. Tap to skip the wait`}>
                  <span className="text-[12.5px] text-muted">Ready in</span>
                  <span className="font-mono text-[20px] font-bold tabular-nums text-ink">{formatCountdown(left)}</span>
                </button>
              ) : (
                <div className="mt-1.5 text-[12.5px] text-muted">{next ? "After the one above" : "Waiting for the one being made"}</div>
              )}
            </div>
            {removeBtn(d)}
          </li>
        ))}
      </ul>
      {queued && (
        <button type="button" onClick={unlock} disabled={busy} className="mt-3 min-h-[52px] w-full rounded-full bg-ink text-[16px] font-semibold text-paper hover:opacity-90 disabled:opacity-60" data-testid="unlock-now">
          {busy ? "Loading..." : "Unlock the reels now"}
        </button>
      )}
      {queued && <SeeAllPlans returnTo="/studio" />}
      {skipOpen && <SkipPopup left={left} onClose={() => setSkipOpen(false)} />}
    </div>
  );
}

/** Finished spools as a list: thumbnail, name, how many reels are unlocked. Edit shows a delete button per row. */
function DoneList({ docs }: { docs: StudioDoc[] }) {
  const [items, setItems] = useState(docs);
  const [editing, setEditing] = useState(false);
  const remove = async (id: string) => {
    if (!window.confirm("Delete this document, its reels and audio? This can't be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setItems((list) => list.filter((d) => d.id !== id));
      toast("Deleted");
    } else toast("Couldn't delete. Try again.");
  };
  return (
    <div className="mx-4 mt-3" data-testid="studio-done-list">
      <div className="mb-1 flex justify-end">
        <button type="button" onClick={() => setEditing((v) => !v)} className="text-[13px] font-medium text-thread">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line px-3">
        {items.map((d) => {
          const total = d.total ?? 0;
          const open = d.unlocked ? total : Math.min(total, d.freeReels);
          return (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <Link href={`/s/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <DocThumb doc={d} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{d.name}</span>
                  <span className="mt-0.5 block font-mono text-[12.5px] text-muted">
                    {d.status === "failed" ? "Failed" : total ? `${open} of ${total} unlocked` : `${d.readyCount} ready`}
                  </span>
                </span>
              </Link>
              {editing ? (
                <button type="button" onClick={() => remove(d.id)} className="shrink-0 rounded-full border border-coral/60 px-2.5 py-1 text-[12.5px] font-semibold text-coral">
                  Delete
                </button>
              ) : (
                <span aria-hidden className="shrink-0 text-muted">›</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A mini 9:16 frame: the document's first headline on its file-type tint. */
const STARTERS = ["Photosynthesis, AP Bio", "The causes of World War I", "Supply and demand", "The French Revolution"];

/** A first-time Studio: instead of an empty list, one tap turns a sample topic into reels. */
function StarterTopics() {
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-6 ipad:max-w-[680px]" data-testid="starter-topics">
      <div className="text-[13px] text-muted">Not sure where to start? Tap one:</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {STARTERS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={!!pending}
            onClick={() => {
              track("starter_topic", t);
              void upload(promptFile(t));
            }}
            className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] text-ink transition-colors hover:border-thread disabled:opacity-60"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocThumb({ doc, size = "md" }: { doc: StudioDoc; size?: "sm" | "md" }) {
  const tone = fileTone(doc.fileType);
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden border border-white/[0.08] ${size === "sm" ? "h-[56px] w-[32px]" : "h-[78px] w-[44px]"}`}
      style={{ background: reelTint(tone, 22) }}
    >
      <span className={`absolute inset-x-[4px] top-[6px] line-clamp-5 font-hook font-extrabold leading-[1.25] text-white ${size === "sm" ? "text-[5px]" : "text-[6.5px]"}`}>
        {doc.headline ? <MarkedText text={doc.headline} /> : doc.hook ?? doc.name}
      </span>
      <span className="absolute bottom-[3px] left-[3px] font-mono text-[6px] text-white/70">{fileLabel(doc.fileType)}</span>
    </span>
  );
}

function DesktopStudio({ docs, style, canEdit, plan, queue }: StudioProps) {
  const picker = usePicker();
  const [openId, setOpenId] = useState<string | null>(docs[0]?.id ?? null);
  return (
    <div className="flex h-full w-full min-h-0" data-testid="studio" data-layout="desktop">
      {picker.el}
      {/* Left: the account's documents */}
      <aside className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line xl:w-[320px]">
        <div className="px-5 pb-4 pt-5">
          <div className="text-[12.5px] text-muted">Studio</div>
          <div className="mt-3">
            <CreditBar />
          </div>
          <h1 className="mt-5 font-display text-[22px] leading-[1.1] text-ink">Your library</h1>
          <div className="mt-3">
            <LibraryStats docs={docs} plan={plan} />
          </div>
        </div>
        {docs.length ? (
          <ol className="space-y-0.5 px-2.5 pb-4" aria-label="Your documents">
            {docs.map((d) => (
              <DocItem key={d.id} doc={d} open={openId === d.id} onToggle={() => setOpenId(openId === d.id ? null : d.id)} />
            ))}
          </ol>
        ) : (
          <p className="px-5 text-[13px] leading-snug text-muted">Nothing here yet. Upload a document and its reels show up in this list.</p>
        )}
      </aside>

      {/* Center: an empty reel frame with the "+" */}
      <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-6 py-6">
        <div
          className="relative flex aspect-[9/16] h-[calc(100dvh-112px)] max-h-[920px] min-h-[520px] shrink-0 flex-col items-center justify-center overflow-hidden border border-line bg-black px-6 text-center"
          data-testid="studio-frame"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "color-mix(in srgb, var(--thread) 5%, transparent)" }} />
          <PlusButton onClick={picker.open} pending={picker.pending} size="lg" />
          <div className="relative mt-7 font-display text-[26px] leading-[1.1] text-ink">{picker.pending ? "Starting upload" : "Upload a document"}</div>
          <p className="relative mt-2 max-w-[260px] text-[13.5px] leading-snug text-muted">{TYPES_HINT}. Or drop a file anywhere here.</p>
          <PromptBox divider={false} className="relative mt-5 w-full max-w-[360px] text-left" />
          {queue && (
            <div className="relative mt-3 w-full max-w-[360px] text-left">
              <QueueTimer nextAt={queue.nextAt} queued={queue.queued} />
            </div>
          )}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[104px] border-t border-line bg-paper/85" />
          <div className="absolute bottom-[34px] left-4 flex items-center gap-2 text-[12.5px] text-muted">
            <span className="flex h-7 w-7 items-center justify-center bg-thread font-wordmark text-[13px] font-bold text-[#08110e]" aria-hidden>
              u
            </span>
            Your next reel
          </div>
        </div>
      </div>

      {/* Right: Reel style (Plus) */}
      <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-line p-5 xl:w-[360px]" data-tour="studio-style">
        <ReelStylePanel initial={style} canEdit={canEdit} />
      </aside>
    </div>
  );
}

function MobileStudio({ docs, style, canEdit, email, queue, name }: StudioProps) {
  const picker = usePicker();
  const [styleOpen, setStyleOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  // Without Plus, Reel style opens the pop-up with the changing sample reels instead of the locked panel.
  const openStyle = () => (canEdit ? setStyleOpen(true) : setUpsellOpen(true));
  // Still being made vs done: the first show up front, the second behind the "Your spools" pull-down.
  const active = docs.filter((d) => !["ready", "failed"].includes(d.status));
  const done = docs.filter((d) => ["ready", "failed"].includes(d.status));
  const [doneOpen, setDoneOpen] = useState(true); // open by default; the bar still folds it away
  // The sheet remounts the panel each time it opens: keep what was saved meanwhile.
  const [saved, setSaved] = useState(style);
  return (
    <div className="safe-bottom flex h-full w-full flex-col overflow-y-auto bg-paper" data-testid="studio" data-layout="mobile">
      {picker.el}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 ipad:h-16 ipad:px-6">
        <Link href="/" aria-label="Unspool" className="mr-auto">
          <Wordmark size={22} />
        </Link>
        {/* Recharge and the menu up here; the + is in the middle of the page */}
        <RechargeButton />
        <AccountMenu email={email} name={name} onReelStyle={openStyle} />
      </div>

      <div className="mx-auto w-full max-w-[560px] shrink-0 px-4 pb-5 pt-5 ipad:max-w-[680px]">
        {/* Hello, name and the date */}
        <Greeting name={name} />
        {/* The next free reel, above the + */}
        {queue && (
          <div className="mt-4">
            <QueueTimer nextAt={queue.nextAt} queued={queue.queued} />
          </div>
        )}
        {/* The big + in the middle: upload a file or photo */}
        {/* Room around the + so its pulse ring (up to 1.25x) never reaches the timer or the title */}
        <div className="flex flex-col items-center pb-5 pt-9">
          <PlusButton onClick={picker.open} pending={picker.pending} size="md" />
          <div className="mt-7 font-display text-[20px] leading-tight text-ink">{picker.pending ? "Starting upload" : "Upload a document"}</div>
          <p className="mt-1 text-[13px] text-muted">{TYPES_HINT}</p>
        </div>
        {/* Or type a topic, under the + */}
        <PromptBox divider={false} className="" />
        {/* Pick the reel style before (or while) uploading: a small button, centred */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={openStyle}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink transition-colors hover:border-thread"
            data-testid="style-chip"
            data-tour="studio-style"
          >
            <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" className="shrink-0 text-thread" fill="currentColor">
              <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0Z" />
            </svg>
            Reel style
            {!canEdit && <span className="rounded-[4px] bg-thread px-1.5 py-[1px] text-[10px] font-bold text-paper">PLUS</span>}
          </button>
        </div>
      </div>
      {/* Still being made (queued, planning, writing): up front, under the timer */}
      {active.length > 0 && <ActiveList docs={active} nextAt={queue?.nextAt ?? null} ready={Boolean(queue?.ready)} />}

      {/* Done and watched: behind a pull-down bar, the grid of spools (with Edit to delete) */}
      {done.length > 0 ? (
        <div className="mx-auto w-full max-w-[560px] shrink-0 pb-6 ipad:max-w-[680px]">
          <button
            type="button"
            onClick={() => setDoneOpen((v) => !v)}
            aria-expanded={doneOpen}
            className="mx-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-3 text-left"
            data-testid="studio-done-toggle"
          >
            <span className="text-[15px] font-medium text-ink">
              Your spools <span className="text-muted">({done.length})</span>
            </span>
            <ChevronDown size={18} className={`text-muted transition-transform ${doneOpen ? "rotate-180" : ""}`} />
          </button>
          {doneOpen && <DoneList docs={done} />}
        </div>
      ) : (
        !active.length && <StarterTopics />
      )}

      <StyleUpsell open={upsellOpen} onClose={() => setUpsellOpen(false)} />
      <Sheet open={styleOpen} onClose={() => setStyleOpen(false)} label="Reel style">
        <div className="max-h-[72dvh] overflow-y-auto">
          <ReelStylePanel initial={saved} canEdit={canEdit} compact onSaved={setSaved} />
        </div>
      </Sheet>
    </div>
  );
}

/** Home for signed-in accounts: upload in the middle, their documents, and the reel style (Plus). */
export function Studio(props: StudioProps) {
  const layout = useLayout();
  if (layout === null) return <div className="h-full w-full bg-paper" />;
  return (
    <>
      {layout === "desktop" ? <DesktopStudio {...props} /> : <MobileStudio {...props} />}
      <WelcomeTour isNew={Boolean(props.isNew)} fresh={Boolean(props.fresh)} email={props.email} />
    </>
  );
}
