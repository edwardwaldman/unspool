import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutReturn, SignInButtons } from "@/components/shell/account-actions";
import { AppShell } from "@/components/shell/app-shell";
import { LibraryGrid, type LibraryItem } from "@/components/spool/library-grid";
import { freeReelLimit, isUnlocked } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { listDocuments } from "@/lib/spool";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library", robots: { index: false } };

export default async function LibraryPage() {
  const viewer = supabaseConfigured ? await getViewer() : null;
  // A missing server key or a database hiccup shows an empty library rather than an error page.
  const docs = viewer ? await listDocuments(viewer, 100).catch((err) => (console.error("library: could not load documents", err), [])) : [];
  const items: LibraryItem[] = [];
  if (docs.length) {
    const { data: reels } = await adminClient()
      .from("reels")
      .select("document_id,index,status,hook,headline:script_json->>headline")
      .in(
        "document_id",
        docs.map((d) => d.id),
      );
    for (const d of docs) {
      const mine = (reels ?? []).filter((r) => r.document_id === d.id);
      const first = mine.find((r) => r.index === 1);
      items.push({
        id: d.id,
        name: d.title ?? d.file_name,
        fileType: d.file_type ?? "",
        status: d.status,
        unlocked: isUnlocked(d, viewer!),
        freeReels: freeReelLimit(d, viewer!, { reelRows: mine.length }).playable,
        total: d.reel_count || mine.length || null,
        readyCount: mine.filter((r) => r.status === "ready").length,
        createdAt: d.created_at,
        headline: (first?.headline as string | null) ?? null,
        hook: first?.hook ?? null,
      });
    }
  }
  const reelCount = items.reduce((n, i) => n + i.readyCount, 0);

  const stats = [
    ["Spools", String(items.length)],
    ["Reels", String(reelCount)],
    ["Plan", viewer?.subscribed ? "Unlimited" : "Free"],
  ];

  return (
    <AppShell active="library">
      <Suspense>
        <CheckoutReturn />
      </Suspense>
      <div className="mx-auto max-w-[720px]">
        <header className="px-5 pb-6 pt-10">
          <div className="label">{viewer?.email ?? "Not signed in"}</div>
          <h1 className="mt-2 font-display text-[35px] leading-none">Library</h1>
          <div className="mt-6 grid grid-cols-3 border-y border-line">
            {stats.map(([label, value], i) => (
              <div key={label} className={`py-3 ${i > 0 ? "border-l border-line pl-4" : ""}`}>
                <div className="font-mono text-[18px]">{value}</div>
                <div className="label mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {!viewer?.userId && items.length > 0 && (
            <p className="mt-4 text-[13.5px] text-muted">
              Anonymous spools are deleted after 7 days.{" "}
              <Link href="/login?next=/library" className="text-ink underline underline-offset-4">
                Sign in to keep them.
              </Link>
            </p>
          )}
          {!viewer?.userId && items.length === 0 && supabaseConfigured && (
            <div className="mt-6">
              <p className="text-[14px] text-muted">Create a free account to unspool a document. First reel free, then one more every hour.</p>
              <SignInButtons next="/library" />
            </div>
          )}
        </header>
        <LibraryGrid initial={items} />
      </div>
    </AppShell>
  );
}
