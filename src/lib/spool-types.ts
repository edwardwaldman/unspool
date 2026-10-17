import type { DocumentStatus, ReelStatus } from "./db-types";
import type { ReelScript } from "./schema";

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
  /** Reels the viewer may play right now (10 when unlocked; otherwise 1 + one per hour since upload). */
  freeReels: number;
  /** When the next free reel opens (ISO), or null when unlocked or all 10 are already free. */
  nextFreeUnlockAt: string | null;
  pageCount: number | null;
  wordCount: number | null;
  truncated: boolean;
  createdAt: string;
  reels: ReelDTO[];
  demo?: boolean;
};

export type ViewerDTO = {
  signedIn: boolean;
  email: string | null;
  subscribed: boolean;
};
