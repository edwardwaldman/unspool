"use client";

import Link from "next/link";
import { useState } from "react";
import { Gauge, Speech, WandSparkles } from "lucide-react";
import { GridIcon, TrashIcon, VolumeIcon } from "../ui/icons";
import { Sheet } from "../ui/sheet";
import { toast } from "../ui/toast";
import { setPrefs, usePrefs } from "./prefs";

export function MoreSheet({
  open,
  onClose,
  onDelete,
  canDelete,
  sensitive,
  editReelId,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  canDelete: boolean;
  sensitive?: boolean;
  /** The reel on screen, when its owner can edit it. */
  editReelId?: string;
}) {
  const prefs = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const row = "flex w-full items-center gap-3 border-b border-line py-3.5 text-left text-[15px] hover:text-thread";
  return (
    <Sheet
      open={open}
      onClose={() => {
        setConfirm(false);
        setEditing(false);
        onClose();
      }}
      label="More options"
    >
      {editing && editReelId ? (
        <EditReel
          reelId={editReelId}
          onCancel={() => setEditing(false)}
          onDone={() => {
            setEditing(false);
            onClose();
          }}
        />
      ) : (
        <>
      {editReelId && (
        <button type="button" className={row} onClick={() => setEditing(true)}>
          <WandSparkles size={19} strokeWidth={1.5} /> <span className="flex-1">Edit this reel</span>
          <span className="font-mono text-[12px] text-muted">Ask for a change</span>
        </button>
      )}
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
        </>
      )}
    </Sheet>
  );
}

const IDEAS = ["Use simpler words", "Add a real-world example", "Make it funnier", "Focus on the key formula", "Make it shorter", "Explain it like I'm 12"];

/** Ask for a change to one reel; it's rewritten from the document and swaps in when ready. */
function EditReel({ reelId, onCancel, onDone }: { reelId: string; onCancel: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (text.trim().length < 3 || busy) return;
    setBusy(true);
    const res = await fetch(`/api/reels/${reelId}/edit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ request: text }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(body.error ?? "Couldn't edit this reel. Try again.");
    toast("Rewriting this reel. It’ll be back in about a minute.");
    window.dispatchEvent(new Event("unspool:reload"));
    onDone();
  };
  return (
    <div>
      <h2 className="text-[17px] font-semibold">Edit this reel</h2>
      <p className="mt-1 text-[13.5px] text-muted">Say what you want different. It&apos;s rewritten from your document, so it stays accurate.</p>
      <textarea
        autoFocus
        value={text}
        maxLength={300}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
        }}
        placeholder="e.g. Use a sports example instead of soup"
        className="mt-4 h-28 w-full resize-none border border-line bg-surface p-3 text-[15px] text-ink outline-none placeholder:text-muted focus:border-thread"
      />
      <div className="mt-1 text-right font-mono text-[11px] text-muted">{text.length}/300</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {IDEAS.map((i) => (
          <button key={i} type="button" onClick={() => setText(i)} className="border border-line px-2.5 py-1 text-[12.5px] text-ink/80 hover:border-thread hover:text-thread">
            {i}
          </button>
        ))}
      </div>
      <div className="mt-5 flex">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-[14px]">
          Back
        </button>
        <button type="button" disabled={busy || text.trim().length < 3} onClick={submit} className="btn-primary -ml-px flex-1 py-2.5 text-[14px] disabled:opacity-50">
          {busy ? "Sending…" : "Rewrite reel"}
        </button>
      </div>
      <p className="mt-3 text-[12px] text-muted">Up to 3 edits per reel. Free accounts get 1 edit a day.</p>
    </div>
  );
}
