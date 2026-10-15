"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "../ui/toast";
import { startUpload } from "./upload-store";

/** Upload a file and jump straight into its feed. */
export function useUploader() {
  const router = useRouter();
  return useCallback(
    async (file: File) => {
      const result = await startUpload(file, (id) => router.push(`/s/${id}`));
      if (result.error && result.code === "limit") {
        toast(result.error, 4500);
        router.push("/pricing");
      } else if (result.error && result.error !== "Upload failed." && result.error !== "start failed") {
        toast(result.error, 4000);
      }
    },
    [router],
  );
}

export const FILE_ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp";
