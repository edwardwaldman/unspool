import type { AudioMap, ReelScript } from "./schema";

export type DocumentStatus = "uploading" | "uploaded" | "extracting" | "planning" | "scripting" | "ready" | "failed";
export type ReelStatus = "pending" | "generating" | "ready" | "failed";

export type DocumentRow = {
  id: string;
  user_id: string | null;
  anon_token: string | null;
  ip_hash: string | null;
  file_name: string;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  page_count: number | null;
  word_count: number | null;
  truncated: boolean;
  title: string | null;
  /** How many reels the planner chose for this document (null until planned). */
  reel_count: number | null;
  doc_type: "study" | "work" | "other" | null;
  sensitive: boolean;
  status: DocumentStatus;
  error: string | null;
  unlocked: boolean;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ReelRow = {
  id: string;
  document_id: string;
  index: number;
  title: string;
  hook: string;
  section: string | null;
  script_json: ReelScript | null;
  audio_paths: AudioMap | null;
  status: ReelStatus;
  error: string | null;
  attempts: number;
  started_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Columns safe to load for listing (excludes the large extracted_text). */
export const DOCUMENT_COLUMNS =
  "id,user_id,anon_token,ip_hash,file_name,file_path,file_type,file_size,page_count,word_count,truncated,title,reel_count,doc_type,sensitive,status,error,unlocked,created_at,updated_at";
