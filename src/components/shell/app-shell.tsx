"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { GridIcon, HomeIcon, PlusIcon, ReelsIcon, UserIcon, Wordmark } from "../ui/icons";
import { Toaster } from "../ui/toast";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

const TOP_LINKS: [string, string, string][] = [
  ["about", "/about", "How it works"],
  ["terms", "/terms", "Terms"],
  ["privacy", "/privacy", "Privacy"],
  ["pricing", "/pricing", "Pricing"],
];

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


/**
 * App chrome. Desktop: slim left sidebar + content centered as a tall phone column (TikTok web).
 * Mobile: full-bleed content + a floating pill nav (Home · Reels · + · Library · Profile).
 */
export function AppShell({ active, children, feed = false }: { active: NavKey; children: React.ReactNode; feed?: boolean }) {
  const picker = useFilePicker();
  const [dragging, setDragging] = useState(false);
  // The top bar stays out of the way until the visitor scrolls (or tries to).
  const [barShown, setBarShown] = useState(false);

  const tab = (key: NavKey, href: string, label: string, icon: (on: boolean) => React.ReactNode) => (
    <Link
      href={href}
      aria-label={label}
      className={`flex h-11 flex-1 items-center justify-center border transition ${active === key ? "border-line bg-surface text-ink" : "border-transparent text-muted"}`}
    >
      {icon(active === key)}
    </Link>
  );

  return (
    <div
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-paper"
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

      {/* Log in / Sign up: always in the top right */}
      <div className={`fixed right-5 top-3.5 z-50 items-center gap-2 lg:right-10 ${feed ? "hidden lg:flex" : "flex"}`}>
        <Link href="/login" className="px-3 py-2 text-[14px] text-muted hover:text-ink">
          Log in
        </Link>
        <Link href="/login?mode=signup" className="btn-primary px-4 py-2 text-[14px]">
          Sign up
        </Link>
      </div>

      {/* Top bar: slides in once you scroll */}
      <header
        className={`fixed inset-x-0 top-0 z-40 h-16 items-center gap-8 border-b border-line bg-paper px-5 pr-56 transition-transform duration-300 lg:px-10 lg:pr-64 ${
          feed ? "hidden lg:flex" : "flex"
        } ${barShown ? "translate-y-0" : "-translate-y-full"}`}
      >
        <Link href="/">
          <Wordmark size={24} />
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] md:flex">
          {TOP_LINKS.map(([key, href, label]) => (
            <Link key={href} href={href} className={active === key ? "text-ink" : "text-muted hover:text-ink"}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main
        className={`relative flex min-h-0 min-w-0 flex-1 ${feed ? "items-center justify-center lg:py-5" : "overflow-y-auto"}`}
        onScroll={(e) => setBarShown(e.currentTarget.scrollTop > 12)}
        onWheel={(e) => {
          if (e.deltaY > 4) setBarShown(true);
          else if (e.deltaY < -4 && e.currentTarget.scrollTop <= 12) setBarShown(false);
        }}
      >
        {feed ? (
          <div className="relative h-full w-full overflow-hidden lg:aspect-[9/16] lg:h-full lg:w-auto lg:overflow-visible">
            <div className="h-full w-full lg:border lg:border-line">{children}</div>
          </div>
        ) : null}
        {feed ? null : (
          <div className="w-full pb-28 lg:pb-0">{children}</div>
        )}
      </main>

      {/* Mobile floating pill nav */}
      <nav className="safe-bottom fixed inset-x-3 bottom-3 z-50 lg:hidden">
        <div className="flex items-center gap-1 border border-line bg-paper/90 p-1 backdrop-blur-md">
          {tab("home", "/", "Home", (on) => <HomeIcon size={22} filled={on} />)}
          {tab("reels", "/feed", "Reels", (on) => <ReelsIcon size={22} filled={on} />)}
          <button
            type="button"
            aria-label="Upload a document"
            onClick={picker.open}
            className="flex h-11 flex-1 items-center justify-center"
          >
            <span className="flex h-9 w-12 items-center justify-center bg-ink text-paper">
              <PlusIcon size={21} />
            </span>
          </button>
          {tab("library", "/library", "Library", (on) => <GridIcon size={21} filled={on} />)}
          {tab("profile", "/profile", "Profile", (on) => <UserIcon size={22} filled={on} />)}
        </div>
      </nav>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-paper/85">
          <div className="border border-dashed border-thread px-12 py-12 text-center">
            <div className="label">Release to upload</div>
            <div className="mt-2 font-display text-[32px] leading-none">Drop to unspool it.</div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}

export { useFilePicker };
