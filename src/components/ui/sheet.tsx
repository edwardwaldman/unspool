"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

/**
 * Bottom sheet that slides up over the feed. Flat surface, 1px top rule, square corners.
 * `locked`: a hard gate. No tap-outside, swipe-down or keyboard escape; the feed behind can't be scrolled.
 */
export function Sheet({ open, onClose, children, label, locked = false, above }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string; locked?: boolean; /** Drawn in the space above the sheet. */ above?: React.ReactNode }) {
  useEffect(() => {
    if (!open || !locked) return;
    // Swallow the feed's keyboard navigation (arrows, space, Escape) so the gate can't be skipped.
    const block = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Escape", "j", "k"].includes(e.key) && !(e.target instanceof HTMLInputElement)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, [open, locked]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className={`absolute inset-0 ${locked ? "bg-paper/85 backdrop-blur-[2px]" : "bg-paper/70"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={locked ? undefined : onClose}
            onWheel={locked ? (e) => e.preventDefault() : undefined}
          />
          {above}
          <motion.div
            role="dialog"
            aria-label={label}
            aria-modal
            className="safe-bottom relative w-full max-w-[480px] border-x border-t border-line bg-surface px-6 pb-7 pt-3"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 320 }}
            drag={locked ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (!locked && info.offset.y > 90) onClose();
            }}
          >
            {locked ? <div className="mb-5" /> : <div className="mx-auto mb-5 h-px w-10 bg-muted" />}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
