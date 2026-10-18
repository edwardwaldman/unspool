import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { PublicReel } from "@/components/share/public-reel";
import { countShareView } from "@/lib/shares";
import { getShare, plainHook } from "./data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/r/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const share = await getShare(slug);
  if (!share) return { title: "Reel not found", robots: { index: false } };
  const title = `${plainHook(share.hook)} — made with Unspool`;
  const description = "Watch this reel, then turn any document into reels. Your first reel is free.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/r/${share.slug}` },
    openGraph: { title, description, type: "video.other", siteName: "Unspool", url: `/r/${share.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const share = await getShare(slug);
  if (!share) notFound();
  after(() => countShareView(share.slug));
  return <PublicReel spool={share.spool} reel={share.reel} slug={share.slug} />;
}
