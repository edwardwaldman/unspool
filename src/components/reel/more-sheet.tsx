"use client";

import Link from "next/link";
import { useState } from "react";
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
  const row = "flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-[16px] font-semibold hover:bg-white/5";
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
        <VolumeIcon size={22} muted={prefs.muted} /> {prefs.muted ? "Unmute" : "Mute"}
      </button>
      <div className={row}>
        <span className="w-[22px] text-center font-mono text-[13px]">x</span>
        <span className="flex-1">Speed</span>
        {([1, 1.25, 1.5] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrefs({ speed: s })}
            className={`rounded-full px-3 py-1 text-[13px] font-bold ${prefs.speed === s ? "bg-white text-[#0b1020]" : "bg-white/10"}`}
          >
            {s}x
          </button>
        ))}
      </div>
      <button type="button" className={row} onClick={() => setPrefs({ deviceVoice: !prefs.deviceVoice })}>
        <span className="w-[22px] text-center">🗣️</span>
        <span className="flex-1">Device voice for silent reels</span>
        <span className={`h-6 w-11 rounded-full p-0.5 transition ${prefs.deviceVoice ? "bg-accent" : "bg-white/15"}`}>
          <span className={`block h-5 w-5 rounded-full bg-white transition ${prefs.deviceVoice ? "translate-x-5" : ""}`} />
        </span>
      </button>
      <Link href="/library" className={row} onClick={onClose}>
        <GridIcon size={22} /> All my spools
      </Link>
      {canDelete &&
        (confirm ? (
          <div className="mt-2 rounded-2xl border border-warn/40 bg-warn/10 p-4">
            <p className="text-[14px] text-soft">Delete this document, its reels and audio? This can&apos;t be undone.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="flex-1 rounded-xl bg-white/10 py-2.5 font-bold">
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
                className="flex-1 rounded-xl bg-warn py-2.5 font-bold text-[#0b1020]"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${row} text-warn`} onClick={() => setConfirm(true)}>
            <TrashIcon size={22} /> Delete this document
          </button>
        ))}
      {sensitive && <p className="mt-3 px-3 text-[12px] text-muted">Unspool summarizes; it isn&apos;t legal or financial advice.</p>}
      <p className="mt-2 px-3 text-[12px] text-muted">Your files are private to you and never used to train AI.</p>
    </Sheet>
  );
}
