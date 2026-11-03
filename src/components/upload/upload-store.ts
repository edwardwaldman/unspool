"use client";

import { useSyncExternalStore } from "react";
import { ACCEPTED_EXTENSIONS, MAX_FILE_BYTES, extensionOf } from "@/lib/config";
import { supabaseBrowser } from "../auth/supabase-browser";

// Uploads live in a module-level store so they keep going while we navigate straight into the feed.

export type UploadPhase = "creating" | "uploading" | "starting" | "done" | "error";
export type UploadState = { phase: UploadPhase; fileName: string; error?: string; code?: string };

const uploads = new Map<string, UploadState>();
let pending: UploadState | null = null;
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useUpload(documentId: string | null) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return documentId ? uploads.get(documentId) ?? null : null;
}

export function usePendingUpload() {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return pending;
}

// A file picked while signed out waits here (in memory) until the visitor has an account.
let held: File | null = null;

export function holdFile(file: File | null) {
  if (held === file) return;
  held = file;
  emit();
}

export function useHeldFile() {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return held;
}

export function validateFile(file: File): string | null {
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
    return "That file type isn't supported yet. Try PDF, DOCX, PPTX, TXT, MD or a photo of your notes.";
  }
  if (file.size > MAX_FILE_BYTES) return "That file is over 25 MB. Try a smaller one (or the chapter you need).";
  if (file.size === 0) return "That file is empty.";
  return null;
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Create the document, hand its id to `onCreated` (so the caller can route into the feed immediately),
 * then upload the file and kick off generation.
 */
export async function startUpload(file: File, onCreated: (documentId: string) => void, opts: { testOne?: boolean } = {}): Promise<{ error?: string; code?: string }> {
  const invalid = validateFile(file);
  if (invalid) return { error: invalid };
  pending = { phase: "creating", fileName: file.name };
  emit();

  let res: Response;
  try {
    res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, size: file.size, type: file.type, ...(opts.testOne ? { testOne: true } : {}) }),
    });
  } catch {
    pending = null;
    emit();
    return { error: "You're offline. Check your connection and try again." };
  }
  const body = (await res.json().catch(() => ({}))) as { documentId?: string; path?: string; token?: string; error?: string; code?: string };
  pending = null;
  if (!res.ok || !body.documentId || !body.path || !body.token) {
    emit();
    return { error: body.error ?? "Couldn't start the upload.", code: body.code };
  }

  const id = body.documentId;
  uploads.set(id, { phase: "uploading", fileName: file.name });
  emit();
  onCreated(id);

  // Any throw here (the client chunk failing to load, a dropped connection) must surface as an error the
  // person can retry, never leave the feed sitting on "Uploading your file" forever.
  let error: unknown = null;
  try {
    const supabase = await supabaseBrowser();
    ({ error } = await supabase.storage
      .from("documents")
      .uploadToSignedUrl(body.path, body.token, file, { contentType: MIME[extensionOf(file.name)] ?? file.type }));
  } catch (err) {
    error = err ?? new Error("upload failed");
  }
  if (error) {
    uploads.set(id, { phase: "error", fileName: file.name, error: "Upload failed. Check your connection and try again." });
    emit();
    return { error: "Upload failed." };
  }
  uploads.set(id, { phase: "starting", fileName: file.name });
  emit();
  const start = await fetch(`/api/documents/${id}/start`, { method: "POST" }).catch(() => null);
  if (!start?.ok) {
    uploads.set(id, { phase: "error", fileName: file.name, error: "Couldn't start unspooling. Tap retry." });
    emit();
    return { error: "start failed" };
  }
  uploads.set(id, { phase: "done", fileName: file.name });
  emit();
  return {};
}

// A typed topic travels as a small text "file" named <topic>.prompt, so it can wait through sign-up
// (and Google's redirect) exactly like a picked file. The server researches it instead of reading it.
const PROMPT_EXT = "prompt";

export function promptFile(text: string): File {
  const clean = text.replace(/\s+/g, " ").trim();
  return new File([clean], `${clean.slice(0, 60).replace(/[\\/.]/g, " ").trim() || "Topic"}.${PROMPT_EXT}`, { type: "text/plain" });
}

export const isPromptFile = (file: File) => extensionOf(file.name) === PROMPT_EXT;
export const displayName = (file: File) => (isPromptFile(file) ? file.name.slice(0, -PROMPT_EXT.length - 1) : file.name);

/** Start reels from a typed topic: one request creates the document and starts the research. */
export async function startPrompt(text: string, onCreated: (documentId: string) => void, opts: { testOne?: boolean } = {}): Promise<{ error?: string; code?: string }> {
  const prompt = text.replace(/\s+/g, " ").trim();
  if (prompt.length < 3) return { error: "Type a topic to study." };
  pending = { phase: "creating", fileName: prompt.slice(0, 60) };
  emit();
  let res: Response;
  try {
    res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.slice(0, 500), ...(opts.testOne ? { testOne: true } : {}) }),
    });
  } catch {
    pending = null;
    emit();
    return { error: "You're offline. Check your connection and try again." };
  }
  const body = (await res.json().catch(() => ({}))) as { documentId?: string; error?: string; code?: string };
  pending = null;
  if (!res.ok || !body.documentId) {
    emit();
    return { error: body.error ?? "Couldn't start. Try again.", code: body.code };
  }
  uploads.set(body.documentId, { phase: "done", fileName: prompt.slice(0, 60) });
  emit();
  onCreated(body.documentId);
  return {};
}
