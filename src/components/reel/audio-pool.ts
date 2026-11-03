"use client";

// iPhones only let an <audio> element play with sound after it has been started inside a tap. Every reel used to
// create its own elements, so every new reel stopped on "Tap to play with sound". This pool keeps a set of
// elements for the whole page: the first tap anywhere starts each one (muted) and stops it, which unlocks them
// all, and every reel then borrows from the pool, so the reels after the first one play with sound on their own.

const SIZE = 48;
const SILENT = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////9bP/6XCykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

let pool: HTMLAudioElement[] | null = null;
const free: HTMLAudioElement[] = [];
let unlocked = false;

function ensure() {
  if (pool || typeof window === "undefined") return;
  pool = Array.from({ length: SIZE }, () => {
    const a = new Audio();
    a.preload = "auto";
    return a;
  });
  free.push(...pool);
  // The first tap (or key press) anywhere unlocks the whole pool.
  const onGesture = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("touchend", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("touchend", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}

/** Call inside a tap: starts and stops every pooled element so later play() calls are allowed. */
export function unlockAudio() {
  ensure();
  if (unlocked || !pool) return;
  unlocked = true;
  for (const a of pool) {
    // Already playing (with or without sound): it's allowed to play, leave it alone.
    if (!a.paused) continue;
    const had = a.getAttribute("src");
    a.muted = true;
    if (!had) a.src = SILENT;
    a.play()
      .then(() => {
        // Only stop it if nothing started it for real meanwhile (a reel un-mutes the clip it plays).
        if (!a.muted) return;
        a.pause();
        a.muted = false;
        if (!had) {
          a.removeAttribute("src");
          a.load();
        } else a.currentTime = 0;
      })
      .catch(() => {
        a.muted = false;
      });
  }
}

export const audioUnlocked = () => unlocked;

/** Borrow an element (a fresh one if the pool is used up). */
export function takeAudio(): HTMLAudioElement {
  ensure();
  const a = free.pop() ?? new Audio();
  a.muted = false;
  return a;
}

/** Give an element back: stopped, emptied and with its listeners gone (a clone keeps none). */
export function returnAudio(a: HTMLAudioElement) {
  a.pause();
  a.removeAttribute("src");
  a.load();
  if (pool?.includes(a)) free.push(a);
}
