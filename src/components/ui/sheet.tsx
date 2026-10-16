"use client";

import { AnimatePresence, motion } from "motion/react";

/** Bottom sheet that slides up over the feed. Flat surface, 1px top rule, square corners. */
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-ink/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={label}
            aria-modal
            className="safe-bottom relative w-full max-w-[480px] border-x border-t border-line bg-surface px-6 pb-7 pt-3"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90) onClose();
            }}
          >
            <div className="mx-auto mb-5 h-px w-10 bg-muted" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
