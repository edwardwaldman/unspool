// The render job: everything ffmpeg needs to turn one reel into an MP4. Plain JSON so the same job can be
// rendered in-function or POSTed to a standalone worker (RENDER_URL). No app imports here: the worker
// bundles this file together with render.ts and captions.ts.

/** Private Supabase Storage bucket for rendered reels (served through signed URLs). */
export const VIDEO_BUCKET = "videos";

/** A file the renderer reads: a local path (in-function) or a URL it downloads first (worker). */
export type MediaSource = { path: string } | { url: string };

export type Motion = "in" | "out" | "left" | "right" | "up";

/** A generated title card, used when there is no image (no image provider, or the provider failed). */
export type Card = {
  /** Gradient colors, "#rrggbb". */
  from: string;
  to: string;
  /** Big centered text burned onto the card (optional). */
  title?: string;
};

/** One visual slot: an image (Ken-Burns zoom/pan) or a card, shown from `start` for `duration` seconds. */
export type RenderSlot = {
  start: number;
  duration: number;
  image?: MediaSource;
  card?: Card;
  motion?: Motion;
};

/** One voiceover clip, placed back to back. Missing source = silence for `duration`. */
export type RenderAudio = {
  start: number;
  duration: number;
  source?: MediaSource;
};

/** Caption text for one voiceover clip, with absolute word start times (seconds in the video). */
export type CaptionWord = { text: string; start: number; color?: string | null };
export type CaptionLine = { start: number; end: number; words: CaptionWord[] };

export type RenderJob = {
  width: number;
  height: number;
  fps: number;
  /** Contiguous, in order, covering the whole video. */
  slots: RenderSlot[];
  /** Contiguous, in order, covering the whole video. */
  audio: RenderAudio[];
  captions: CaptionLine[];
  music?: { source: MediaSource; volume?: number };
  /** Accent for the word being spoken, "#rrggbb". */
  highlight?: string;
  crf?: number;
  preset?: string;
  /** Crossfade between slots, seconds. */
  fade?: number;
};

/** What the player needs to keep its quiz pause / progress in sync with the video's clock. */
export type VideoTimeline = {
  duration: number;
  /** Segment key (b0, b1, …, quiz_q, quiz_a, outro) -> start/duration in the video. */
  segments: { key: string; start: number; duration: number }[];
  /** True when captions are burned into the frames (the player hides its own caption overlay). */
  captions: boolean;
  width: number;
  height: number;
};
