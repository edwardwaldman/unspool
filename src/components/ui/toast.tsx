"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

type Toast = { id: number; text: string };
let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, ms = 2600) {
  const t = { id: ++seq, text };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, ms);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[80] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="border border-line bg-surface px-4 py-2.5 text-[14px] text-cream"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
