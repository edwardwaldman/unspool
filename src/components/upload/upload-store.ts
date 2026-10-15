"use client";

import { useSyncExternalStore } from "react";
import { ACCEPTED_EXTENSIONS, MAX_FILE_BYTES, extensionOf } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

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
export async function startUpload(file: File, onCreated: (documentId: string) => void): Promise<{ error?: string; code?: string }> {
  const invalid = validateFile(file);
  if (invalid) return { error: invalid };
  pending = { phase: "creating", fileName: file.name };
  emit();

  let res: Response;
  try {
    res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, size: file.size, type: file.type }),
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

  const supabase = createClient();
  const { error } = await supabase.storage
    .from("documents")
    .uploadToSignedUrl(body.path, body.token, file, { contentType: MIME[extensionOf(file.name)] ?? file.type });
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
