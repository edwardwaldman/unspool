import type { DocumentStatus, ReelStatus } from "./db-types";
import type { ReelScript } from "./schema";
import type { VideoTimeline } from "./video/types";

// Client-facing shapes returned by /api/documents/[id] and /api/feed.

export type SegmentAudioDTO = { url?: string; duration: number; words: number[] };

export type ReelDTO = {
  id: string;
  index: number;
  title: string;
  hook: string;
  status: ReelStatus;
  locked: boolean;
  error?: string | null;
  script?: ReelScript;
  audio?: Record<string, SegmentAudioDTO>;
  /** A rendered MP4 of this reel, once reels are rendered as video. Like script/audio, only sent for playable reels. */
  videoUrl?: string;
  /** Where each segment sits in the video, so the player can follow the video's clock (sent with videoUrl). */
  video?: VideoTimeline;
};

export type SpoolDTO = {
  id: string;
  fileName: string;
  fileType: string;
  title: string | null;
  docType: "study" | "work" | "other" | null;
  sensitive: boolean;
  status: DocumentStatus;
  error: string | null;
  unlocked: boolean;
  /** How many reels the planner chose for this document; null while it is still being planned. */
  totalReels: number | null;
  /** Reels the viewer may play right now (all when unlocked; otherwise 1 + one per hour since upload). */
  freeReels: number;
  /** Free tier: when the next free reel may be unlocked (ISO, may be in the past = ready now); else null. */
  nextFreeUnlockAt: string | null;
  pageCount: number | null;
  wordCount: number | null;
  truncated: boolean;
  createdAt: string;
  reels: ReelDTO[];
  demo?: boolean;
};

export type UsageDTO = {
  tier: "free" | "plus" | "pro" | "ultra";
  trialing: boolean;
  trialEndsAt: string | null;
  /** Signed in, free, and hasn't used the one 1-day Plus trial. */
  trialEligible: boolean;
  /** Reel credits this billing period (weekly on paid tiers; 0 on free). */
  allowance: number;
  used: number;
  left: number;
  /** Top-up credits (never expire). */
  topup: number;
  resetsAt: string;
  freeUsedToday: number;
  freePerDay: number;
  freeIntervalMin: number;
  /** Server-side prices (env overrides applied), so client sheets never show a stale price. */
  prices: Record<"plus" | "pro" | "ultra", { cents: number; credits: number }>;
  topupCents: number;
  topupCredits: number;
};

export type ViewerDTO = {
  signedIn: boolean;
  email: string | null;
  subscribed: boolean;
  usage?: UsageDTO | null;
};
