"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { GridIcon, HomeIcon, PlusIcon, ReelsIcon, UploadIcon, UserIcon, Wordmark } from "../ui/icons";
import { Toaster } from "../ui/toast";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

export type NavKey = "home" | "reels" | "library" | "profile" | "none";

function useFilePicker() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const el = (
    <input
      ref={input}
      type="file"
      accept={FILE_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) void upload(f);
      }}
    />
  );
  return { open: () => input.current?.click(), el, upload };
}

function Logo() {
  return (
    <Link href="/" className="px-3">
      <Wordmark size={28} />
    </Link>
  );
}

/**
 * App chrome. Desktop: slim left sidebar + content centered as a tall phone column (TikTok web).
 * Mobile: full-bleed content + a floating pill nav (Home · Reels · + · Library · Profile).
 */
export function AppShell({ active, children, feed = false }: { active: NavKey; children: React.ReactNode; feed?: boolean }) {
  const picker = useFilePicker();
  const [dragging, setDragging] = useState(false);

  const side = (key: NavKey, href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={`flex items-center gap-3.5 border-l px-3 py-2.5 text-[15px] transition ${
        active === key ? "border-thread text-cream" : "border-transparent text-muted hover:text-cream"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  const tab = (key: NavKey, href: string, label: string, icon: (on: boolean) => React.ReactNode) => (
    <Link
      href={href}
      aria-label={label}
      className={`flex h-11 flex-1 items-center justify-center border transition ${active === key ? "border-line bg-surface text-cream" : "border-transparent text-muted"}`}
    >
      {icon(active === key)}
    </Link>
  );

  return (
    <div
      className="flex h-[100dvh] w-full overflow-hidden bg-ink"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void picker.upload(f);
      }}
    >
      {picker.el}

      {/* Desktop sidebar */}
      <aside className="hidden w-[232px] shrink-0 flex-col gap-1 border-r border-line px-3 py-7 lg:flex">
        <Logo />
        <nav className="mt-10 flex flex-col gap-0.5">
          {side("home", "/", "Home", <HomeIcon size={20} filled={active === "home"} />)}
          {side("reels", "/feed", "Reels", <ReelsIcon size={20} filled={active === "reels"} />)}
          <button
            type="button"
            onClick={picker.open}
            className="flex items-center gap-3.5 border-l border-transparent px-3 py-2.5 text-left text-[15px] text-muted hover:text-cream"
          >
            <UploadIcon size={20} /> Upload
          </button>
          {side("library", "/library", "Library", <GridIcon size={20} filled={active === "library"} />)}
          {side("profile", "/profile", "Profile", <UserIcon size={20} filled={active === "profile"} />)}
        </nav>
        <div className="mt-auto space-y-2 px-3 text-[12.5px] text-muted">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div>© {new Date().getFullYear()} Unspool</div>
        </div>
      </aside>

      {/* Content */}
      <main className={`relative flex min-w-0 flex-1 ${feed ? "items-center justify-center lg:py-4" : "overflow-y-auto"}`}>
        {feed ? (
          <div className="relative h-full w-full overflow-hidden lg:aspect-[9/16] lg:h-full lg:w-auto lg:max-w-[calc(100vw-360px)] lg:overflow-visible">
            <div className="h-full w-full lg:border lg:border-line">{children}</div>
          </div>
        ) : (
          <div className="w-full pb-28 lg:pb-10">{children}</div>
        )}
      </main>

      {/* Mobile floating pill nav */}
      <nav className="safe-bottom fixed inset-x-3 bottom-3 z-50 lg:hidden">
        <div className="flex items-center gap-1 border border-line bg-ink/90 p-1 backdrop-blur-md">
          {tab("home", "/", "Home", (on) => <HomeIcon size={22} filled={on} />)}
          {tab("reels", "/feed", "Reels", (on) => <ReelsIcon size={22} filled={on} />)}
          <button
            type="button"
            aria-label="Upload a document"
            onClick={picker.open}
            className="flex h-11 flex-1 items-center justify-center"
          >
            <span className="flex h-9 w-12 items-center justify-center bg-cream text-ink">
              <PlusIcon size={21} />
            </span>
          </button>
          {tab("library", "/library", "Library", (on) => <GridIcon size={21} filled={on} />)}
          {tab("profile", "/profile", "Profile", (on) => <UserIcon size={22} filled={on} />)}
        </div>
      </nav>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-ink/85">
          <div className="border border-dashed border-thread px-12 py-12 text-center">
            <div className="label">Release to upload</div>
            <div className="mt-2 font-display text-[40px] leading-none">Drop to unspool it.</div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}

export { useFilePicker };
