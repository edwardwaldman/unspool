import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { LibraryGrid, type LibraryItem } from "@/components/spool/library-grid";
import { isUnlocked } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { listDocuments } from "@/lib/spool";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library", robots: { index: false } };

export default async function LibraryPage() {
  const viewer = supabaseConfigured ? await getViewer() : null;
  const docs = viewer ? await listDocuments(viewer, 100) : [];
  const items: LibraryItem[] = [];
  if (docs.length) {
    const { data: reels } = await adminClient()
      .from("reels")
      .select("document_id,index,status,hook,headline:script_json->>headline,accent:script_json->>accent")
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
        readyCount: mine.filter((r) => r.status === "ready").length,
        createdAt: d.created_at,
        headline: (first?.headline as string | null) ?? null,
        hook: first?.hook ?? null,
        accent: (first?.accent as LibraryItem["accent"]) ?? null,
      });
    }
  }
  const reelCount = items.reduce((n, i) => n + i.readyCount, 0);

  return (
    <AppShell active="library">
      <div className="mx-auto max-w-[720px]">
        <header className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-hlcyan text-[30px] font-black text-[#0b1020]">
            {(viewer?.email ?? "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="mt-3 text-[17px] font-bold">{viewer?.email ?? "Your library"}</div>
          <div className="mt-4 flex gap-10">
            <div>
              <div className="text-[19px] font-black">{items.length}</div>
              <div className="text-[13px] text-muted">Spools</div>
            </div>
            <div>
              <div className="text-[19px] font-black">{reelCount}</div>
              <div className="text-[13px] text-muted">Reels</div>
            </div>
            <div>
              <div className="text-[19px] font-black">{viewer?.subscribed ? "∞" : "Free"}</div>
              <div className="text-[13px] text-muted">Plan</div>
            </div>
          </div>
          {!viewer?.userId && items.length > 0 && (
            <Link href="/login?next=/library" className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-[14px] font-semibold">
              Sign in to keep your spools · they auto-delete after 7 days
            </Link>
          )}
        </header>
        <LibraryGrid initial={items} />
      </div>
    </AppShell>
  );
}
