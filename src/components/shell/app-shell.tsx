"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isOwnerEmail } from "@/lib/owner";
import { Wordmark } from "../ui/icons";
import { FreeBanner } from "./free-banner";
import { AccountModal } from "../account/account-modal";
import { openAccount } from "../account/account-store";
import { AuthModal } from "../auth/auth-modal";
import { openAuth } from "../auth/auth-store";
import { useSessionUser } from "../auth/use-session";
import { Toaster } from "../ui/toast";
import { FILE_ACCEPT, ResumeStashedUpload, useUploader } from "../upload/use-uploader";

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
 * Mobile: full-bleed content under the same top bar.
 */
export function AppShell({
  active,
  children,
  feed = false,
  workbench = false,
}: {
  active: NavKey;
  children: React.ReactNode;
  feed?: boolean;
  /** One document: full-bleed feed on mobile, a full-width workbench under a fixed top bar on desktop. */
  workbench?: boolean;
}) {
  const picker = useFilePicker();
  const user = useSessionUser();
  const [dragging, setDragging] = useState(false);
  // The top bar stays out of the way until the visitor scrolls (or tries to).
  const [barShown, setBarShownState] = useState(false);
  // Scroll and wheel events fire many times a frame: only touch React state when the answer changes.
  const barShownRef = useRef(false);
  const setBarShown = (v: boolean) => {
    if (barShownRef.current === v) return;
    barShownRef.current = v;
    setBarShownState(v);
  };

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
      {/* On phones the reel screens fill the frame (their tabs sit at the very top) and carry their own upgrade
          prompts, so the banner is desktop-only there. */}
      <div className={`fixed inset-x-0 z-30 ${barShown || workbench ? "top-0 lg:top-16 ipad:lg:top-0" : "top-0"} ${feed || workbench ? "hidden lg:block" : ""}`}>
        <FreeBanner signedIn={Boolean(user)} />
      </div>

      {/* Top bar: slides in once you scroll */}
      <header
        className={`fixed inset-x-0 top-0 z-40 h-16 ipad:h-20 items-center gap-8 border-b border-line bg-paper px-5 transition-transform duration-300 lg:px-10 ${
          feed || workbench ? `hidden lg:flex ${workbench ? "ipad:lg:hidden" : ""}` : "flex"
        } ${barShown || workbench ? "translate-y-0" : "-translate-y-full"}`}
      >
        <Link href="/" className="inline-block origin-left ipad:scale-[1.35]">
          <Wordmark size={24} />
        </Link>
        <nav className="ml-auto hidden items-center gap-7 text-[14px] ipad:text-[17px] md:flex">
          {TOP_LINKS.map(([key, href, label]) => (
            <Link key={href} href={href} className={active === key ? "text-ink" : "text-muted hover:text-ink"}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-6">
          {user ? (
            <>
              {isOwnerEmail(user.email) && (
                <Link href="/owner" className="px-3 py-2 text-[14px] ipad:text-[17px] text-thread hover:text-ink">
                  Owner panel
                </Link>
              )}
              <Link href="/library" className="px-3 py-2 text-[14px] ipad:text-[17px] text-muted hover:text-ink">
                Library
              </Link>
              <button type="button" onClick={openAccount} className="btn-secondary px-4 py-2 text-[14px] ipad:text-[17px]">
                Account
              </button>
            </>
          ) : user === false ? (
            <>
              <button type="button" onClick={() => openAuth("login")} className="px-3 py-2 text-[14px] ipad:text-[17px] text-muted hover:text-ink">
                Log in
              </button>
              <button type="button" onClick={() => openAuth("signup")} className="btn-primary px-4 py-2 text-[14px] ipad:text-[17px]">
                Sign up
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Content */}
      <main
        className={`relative flex min-h-0 min-w-0 flex-1 ${workbench ? "lg:pt-16 ipad:lg:pt-0" : feed ? "items-center justify-center lg:py-5" : "overflow-y-auto"}`}
        onScroll={(e) => setBarShown(e.currentTarget.scrollTop > 12)}
        onWheel={(e) => {
          if (e.deltaY > 4) setBarShown(true);
          else if (e.deltaY < -4 && e.currentTarget.scrollTop <= 12) setBarShown(false);
        }}
      >
        {workbench ? (
          <div className="relative h-full w-full overflow-hidden">{children}</div>
        ) : feed ? (
          <div className="relative h-full w-full overflow-hidden lg:aspect-[9/16] lg:h-full lg:w-auto lg:overflow-visible">
            <div className="h-full w-full lg:border lg:border-line">{children}</div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </main>


      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-paper/85">
          <div className="border border-dashed border-thread px-12 py-12 text-center">
            <div className="label">Release to upload</div>
            <div className="mt-2 font-display text-[32px] leading-none">Drop to unspool it.</div>
          </div>
        </div>
      )}
      <AuthModal />
      <AccountModal />
      <ResumeStashedUpload />
      <Toaster />
    </div>
  );
}

export { useFilePicker };
