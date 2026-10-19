"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { openAuth } from "../auth/auth-store";
import { getSessionUser, useSessionUser } from "../auth/use-session";
import { toast } from "../ui/toast";
import { RESUME_PARAM, takeStashedFile } from "./file-stash";
import { holdFile, startUpload, validateFile } from "./upload-store";

/**
 * Upload a file and jump straight into its feed. The file always comes first: uploading needs a (free)
 * account, so signed-out visitors keep the file they chose in memory while the sign-up popup opens,
 * and it starts uploading the moment they're in.
 */
export function useUploader() {
  const router = useRouter();
  return useCallback(
    async (file: File) => {
      const invalid = validateFile(file);
      if (invalid) return toast(invalid, 4000);

      const gate = () => {
        holdFile(file);
        openAuth("signup", {
          onDone: () => {
            holdFile(null);
            void run();
          },
        });
      };
      const run = async () => {
        const result = await startUpload(file, (id) => router.push(`/s/${id}`));
        if (result.code === "auth") gate();
        else if (result.error && (result.code === "limit" || result.code === "free_used")) {
          toast(result.error, 4500);
          router.push("/pricing");
        } else if (result.error && result.error !== "Upload failed." && result.error !== "start failed") {
          toast(result.error, 4000);
        }
      };

      if (getSessionUser() === false) gate();
      else await run();
    },
    [router],
  );
}

/**
 * Back from Google sign-in (`/?resume=1`), or any page load while a parked file is waiting: once we know
 * who's here, take the file out of IndexedDB and carry on. Signed in → upload it and open its loading
 * page. Signed out with the resume flag (the sign-in didn't stick) → reopen the sign-up gate with it.
 */
export function ResumeStashedUpload() {
  const user = useSessionUser();
  const upload = useUploader();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || user === null) return;
    const url = new URL(window.location.href);
    const flagged = url.searchParams.has(RESUME_PARAM);
    if (!user && !flagged) return;
    done.current = true;
    if (flagged) {
      url.searchParams.delete(RESUME_PARAM);
      window.history.replaceState(window.history.state, "", url);
    }
    void takeStashedFile().then((file) => {
      if (file) void upload(file);
    });
  }, [user, upload]);
  return null;
}

export const FILE_ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp";
