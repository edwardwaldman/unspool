"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect } from "react";

/** scrollTop of the app's scrolling <main> element as a MotionValue (the page itself doesn't scroll). */
export function useMainScroll(): MotionValue<number> {
  const y = useMotionValue(0);
  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    const on = () => y.set(el.scrollTop);
    on();
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [y]);
  return y;
}
