"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { openAuth } from "../auth/auth-store";
import { getSessionUser } from "../auth/use-session";
import { toast } from "../ui/toast";
import { startUpload, validateFile } from "./upload-store";

/**
 * Upload a file and jump straight into its feed. Uploading needs a (free) account: signed-out visitors
 * get the sign-up popup first, and the file they already chose continues uploading once they're in.
 */
export function useUploader() {
  const router = useRouter();
  const run = useCallback(
    async (file: File) => {
      const result = await startUpload(file, (id) => router.push(`/s/${id}`));
      if (result.code === "auth") {
        openAuth("signup", { onDone: () => void run(file) });
      } else if (result.error && result.code === "limit") {
        toast(result.error, 4500);
        router.push("/pricing");
      } else if (result.error && result.error !== "Upload failed." && result.error !== "start failed") {
        toast(result.error, 4000);
      }
    },
    [router],
  );
  return useCallback(
    async (file: File) => {
      const invalid = validateFile(file);
      if (invalid) return toast(invalid, 4000);
      if (getSessionUser() === false) {
        openAuth("signup", { onDone: () => void run(file) });
        return;
      }
      await run(file);
    },
    [run],
  );
}

/** Open a file picker, asking the visitor to sign up first if needed (the picker opens right after). */
export function pickFileWithAuth(open: () => void) {
  if (getSessionUser() === false) openAuth("signup", { onDone: open });
  else open();
}

export const FILE_ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp";
