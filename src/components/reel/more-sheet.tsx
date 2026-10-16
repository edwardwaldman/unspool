"use client";

import Link from "next/link";
import { useState } from "react";
import { Gauge, Speech } from "lucide-react";
import { GridIcon, TrashIcon, VolumeIcon } from "../ui/icons";
import { Sheet } from "../ui/sheet";
import { setPrefs, usePrefs } from "./prefs";

export function MoreSheet({
  open,
  onClose,
  onDelete,
  canDelete,
  sensitive,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  canDelete: boolean;
  sensitive?: boolean;
}) {
  const prefs = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const row = "flex w-full items-center gap-3 border-b border-line py-3.5 text-left text-[15px] hover:text-thread";
  return (
    <Sheet
      open={open}
      onClose={() => {
        setConfirm(false);
        onClose();
      }}
      label="More options"
    >
      <button type="button" className={row} onClick={() => setPrefs({ muted: !prefs.muted, autoMuted: false })}>
        <VolumeIcon size={19} muted={prefs.muted} /> {prefs.muted ? "Unmute" : "Mute"}
      </button>
      <div className={row}>
        <Gauge size={19} strokeWidth={1.5} />
        <span className="flex-1">Speed</span>
        {([1, 1.25, 1.5] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrefs({ speed: s })}
            className={`-ml-px border px-2.5 py-1 font-mono text-[12px] ${prefs.speed === s ? "border-ink bg-ink text-paper" : "border-line text-muted"}`}
          >
            {s}x
          </button>
        ))}
      </div>
      <button type="button" className={row} onClick={() => setPrefs({ deviceVoice: !prefs.deviceVoice })}>
        <Speech size={19} strokeWidth={1.5} />
        <span className="flex-1">Device voice for silent reels</span>
        <span className={`font-mono text-[12px] ${prefs.deviceVoice ? "text-thread" : "text-muted"}`}>{prefs.deviceVoice ? "On" : "Off"}</span>
      </button>
      <Link href="/library" className={row} onClick={onClose}>
        <GridIcon size={19} /> All my spools
      </Link>
      {canDelete &&
        (confirm ? (
          <div className="mt-4 border border-coral/50 p-4">
            <p className="text-[14px] text-ink/85">Delete the file, its reels and audio? This can&apos;t be undone.</p>
            <div className="mt-3 flex">
              <button type="button" onClick={() => setConfirm(false)} className="btn-secondary flex-1 py-2.5 text-[14px]">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onDelete();
                  setBusy(false);
                }}
                className="-ml-px flex-1 border border-coral py-2.5 text-[14px] text-coral"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${row} text-coral`} onClick={() => setConfirm(true)}>
            <TrashIcon size={19} /> Delete this document
          </button>
        ))}
      {sensitive && <p className="label mt-4">A summary, not legal or financial advice</p>}
      <p className="mt-3 text-[12.5px] text-muted">Your files are private and never used to train AI.</p>
    </Sheet>
  );
}
