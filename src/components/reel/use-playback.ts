"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSegments, type Segment } from "@/lib/segments";
import type { ReelScript } from "@/lib/schema";
import type { SegmentAudioDTO } from "@/lib/spool-types";
import { estimateDuration, estimateWordFractions } from "@/lib/timing";
import { getPrefs, setPrefs, usePrefs } from "./prefs";

export const QUIZ_WAIT_MS = 7000;

export type QuizState = { selected: number | null; revealed: boolean; waiting: boolean };

export type Playback = {
  segments: Segment[];
  seg: number;
  segment: Segment;
  /** Seconds into the current segment. */
  t: number;
  duration: number;
  /** Word start fractions for the current segment. */
  words: number[];
  /** 0..1 through the whole reel. */
  progress: number;
  /** Seconds in the whole reel (current best estimate) and seconds played so far. */
  total: number;
  elapsed: number;
  playing: boolean;
  ended: boolean;
  quiz: QuizState;
  quizWaitLeft: number;
  toggle: () => void;
  replay: () => void;
  answer: (i: number) => void;
};

type Snapshot = {
  seg: number;
  t: number;
  duration: number;
  progress: number;
  total: number;
  elapsed: number;
  playing: boolean;
  ended: boolean;
  quiz: QuizState;
  quizWaitLeft: number;
};

type Engine = {
  seg: number;
  t: number;
  playing: boolean;
  ended: boolean;
  last: number;
  quiz: QuizState;
  waitingSince: number;
  speaking: boolean;
  speechDone: boolean;
  durations: number[];
};

function freshEngine(durations: number[]): Engine {
  return {
    seg: 0,
    t: 0,
    playing: false,
    ended: false,
    last: 0,
    quiz: { selected: null, revealed: false, waiting: false },
    waitingSince: 0,
    speaking: false,
    speechDone: false,
    durations,
  };
}

function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Drives one reel: plays each segment's voiceover clip in order (or a silent clock / device voice when
 * there's no audio), pauses for the quiz answer, and reports timing for captions and visuals.
 */
export function usePlayback(opts: {
  script: ReelScript;
  audio: Record<string, SegmentAudioDTO> | undefined;
  active: boolean;
  onEnded?: () => void;
  /** Background/preview mode: never plays sound, restarts at the end. */
  silent?: boolean;
}): Playback {
  const { script, active, silent } = opts;
  const audio = silent ? undefined : opts.audio;
  const prefs = usePrefs();
  const segments = useMemo(() => buildSegments(script), [script]);
  const initialDurations = useMemo(
    () => segments.map((s) => audio?.[s.key]?.duration ?? estimateDuration(s.speech)),
    [segments, audio],
  );
  const wordsFor = useCallback(
    (i: number) => {
      const s = segments[i];
      const w = audio?.[s.key]?.words;
      return w && w.length === s.speech.split(/\s+/).filter(Boolean).length ? w : estimateWordFractions(s.speech);
    },
    [segments, audio],
  );

  const engine = useRef<Engine>(freshEngine(initialDurations));
  const audios = useRef<(HTMLAudioElement | null)[]>([]);
  const onEndedRef = useRef(opts.onEnded);
  useEffect(() => {
    onEndedRef.current = opts.onEnded;
  }, [opts.onEnded]);

  // The engine lives in a ref (mutated by the frame loop); each tick publishes an immutable snapshot for render.
  const snapshot = useCallback((): Snapshot => {
    const e = engine.current;
    const total = e.durations.reduce((a, b) => a + b, 0) || 1;
    const before = e.durations.slice(0, e.seg).reduce((a, b) => a + b, 0);
    return {
      seg: e.seg,
      t: e.t,
      duration: e.durations[e.seg] ?? 1,
      progress: e.ended ? 1 : Math.min(1, (before + e.t) / total),
      total,
      elapsed: e.ended ? total : Math.min(total, before + e.t),
      playing: e.playing,
      ended: e.ended,
      quiz: e.quiz,
      quizWaitLeft: e.quiz.waiting ? Math.max(0, 1 - (performance.now() - e.waitingSince) / QUIZ_WAIT_MS) : 1,
    };
  }, []);
  const [snap, setSnap] = useState<Snapshot>(() => ({
    seg: 0,
    t: 0,
    duration: initialDurations[0] ?? 1,
    progress: 0,
    total: initialDurations.reduce((a, b) => a + b, 0) || 1,
    elapsed: 0,
    playing: false,
    ended: false,
    quiz: { selected: null, revealed: false, waiting: false },
    quizWaitLeft: 1,
  }));
  const render = useCallback(() => setSnap(snapshot()), [snapshot]);

  // Preload every clip as soon as the reel is mounted (the feed mounts neighbours too).
  useEffect(() => {
    engine.current = freshEngine([...initialDurations]);
    const els = segments.map((s, i) => {
      const url = audio?.[s.key]?.url;
      if (!url) return null;
      const el = new Audio();
      el.preload = "auto";
      el.src = url;
      el.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(el.duration) && el.duration > 0) engine.current.durations[i] = el.duration;
      });
      return el;
    });
    audios.current = els;
    return () => {
      els.forEach((el) => {
        if (!el) return;
        el.pause();
        el.removeAttribute("src");
        el.load();
      });
    };
  }, [segments, audio, initialDurations]);

  const stopAll = useCallback(() => {
    audios.current.forEach((el) => el && !el.paused && el.pause());
    if (engine.current.speaking && canSpeak()) window.speechSynthesis.cancel();
    engine.current.speaking = false;
  }, []);

  const playClip = useCallback(
    (i: number) => {
      const e = engine.current;
      const el = audios.current[i];
      const p = getPrefs();
      if (el) {
        el.currentTime = 0;
        el.muted = p.muted;
        el.playbackRate = p.speed;
        el.play().catch((err: DOMException) => {
          if (err?.name === "NotAllowedError") {
            // Autoplay with sound blocked: keep playing muted, show the unmute hint.
            setPrefs({ muted: true, autoMuted: true });
            el.muted = true;
            el.play().catch(() => undefined);
          }
        });
        return;
      }
      if (!silent && p.deviceVoice && !p.muted && canSpeak()) {
        const u = new SpeechSynthesisUtterance(segments[i].speech);
        u.rate = 1.08 * p.speed;
        u.onend = () => {
          if (engine.current.seg === i) engine.current.speechDone = true;
        };
        u.onerror = () => {
          if (engine.current.seg === i) engine.current.speechDone = true;
        };
        e.speaking = true;
        e.speechDone = false;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    },
    [segments, silent],
  );

  const startSeg = useCallback(
    (i: number) => {
      stopAll();
      const e = engine.current;
      e.seg = i;
      e.t = 0;
      e.speechDone = false;
      if (e.playing) playClip(i);
      render();
    },
    [playClip, render, stopAll],
  );

  const finishSeg = useCallback(() => {
    const e = engine.current;
    const s = segments[e.seg];
    if (s.kind === "quiz" && !e.quiz.revealed) {
      if (!e.quiz.waiting) {
        e.quiz = { ...e.quiz, waiting: true };
        e.waitingSince = performance.now();
      }
      return;
    }
    if (e.seg + 1 >= segments.length) {
      if (silent) {
        e.quiz = { selected: null, revealed: false, waiting: false };
        startSeg(0);
        return;
      }
      stopAll();
      e.ended = true;
      e.playing = false;
      e.t = e.durations[e.seg];
      render();
      onEndedRef.current?.();
      return;
    }
    startSeg(e.seg + 1);
  }, [render, segments, silent, startSeg, stopAll]);

  const answer = useCallback(
    (choice: number) => {
      const e = engine.current;
      if (e.quiz.revealed) return;
      e.quiz = { selected: choice, revealed: true, waiting: false };
      if (!e.playing) e.playing = true;
      const explain = segments.findIndex((s) => s.kind === "explain");
      startSeg(explain >= 0 ? explain : e.seg + 1);
    },
    [segments, startSeg],
  );

  // Frame loop.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const e = engine.current;
      const dt = e.last ? Math.min(0.1, (now - e.last) / 1000) : 0;
      e.last = now;
      if (!e.playing || e.ended) return;
      if (e.quiz.waiting) {
        if (now - e.waitingSince > QUIZ_WAIT_MS) {
          e.quiz = { selected: null, revealed: true, waiting: false };
          const explain = segments.findIndex((s) => s.kind === "explain");
          startSeg(explain);
        } else render();
        return;
      }
      const el = audios.current[e.seg];
      const dur = e.durations[e.seg];
      let done = false;
      if (el) {
        e.t = el.currentTime;
        done = el.ended || (el.duration > 0 && e.t >= el.duration - 0.02);
      } else {
        e.t = Math.min(e.t + dt * getPrefs().speed, e.speaking ? dur * 0.985 : dur);
        const overtime = e.t >= dur * 0.985 && e.speaking && !e.speechDone;
        done = e.t >= dur * 0.985 && (!e.speaking || e.speechDone);
        if (overtime) {
          // Device voice is slower than the estimate: hold on the last word until it finishes (max 2.5x).
          e.durations[e.seg] = Math.min(dur + dt, initialDurations[e.seg] * 2.5);
          if (e.durations[e.seg] >= initialDurations[e.seg] * 2.5) done = true;
        }
      }
      if (done) finishSeg();
      else render();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, finishSeg, initialDurations, render, segments, startSeg]);

  // Start from the top whenever the reel snaps into view; stop when it leaves.
  useEffect(() => {
    const e = engine.current;
    if (active) {
      Object.assign(e, freshEngine(e.durations), { playing: true });
      playClip(0);
    } else {
      stopAll();
      Object.assign(e, freshEngine(e.durations));
    }
    const raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      stopAll();
    };
  }, [active, playClip, render, stopAll]);

  // Live mute / speed changes.
  useEffect(() => {
    const e = engine.current;
    const el = audios.current[e.seg];
    if (el) {
      el.muted = prefs.muted;
      el.playbackRate = prefs.speed;
    } else if (prefs.muted && e.speaking && canSpeak()) {
      window.speechSynthesis.cancel();
      e.speechDone = true;
    }
  }, [prefs.muted, prefs.speed]);

  const toggle = useCallback(() => {
    const e = engine.current;
    if (e.ended) {
      Object.assign(e, freshEngine(e.durations), { playing: true });
      playClip(0);
      render();
      return;
    }
    e.playing = !e.playing;
    const el = audios.current[e.seg];
    if (e.playing) {
      if (el) el.play().catch(() => undefined);
      else if (e.speaking && canSpeak()) window.speechSynthesis.resume();
    } else {
      if (el) el.pause();
      else if (e.speaking && canSpeak()) window.speechSynthesis.pause();
    }
    render();
  }, [playClip, render]);

  const replay = useCallback(() => {
    stopAll();
    const e = engine.current;
    Object.assign(e, freshEngine(e.durations), { playing: true });
    playClip(0);
    render();
  }, [playClip, render, stopAll]);

  const segment = segments[snap.seg] ?? segments[0];
  return {
    segments,
    seg: snap.seg,
    segment,
    t: snap.t,
    duration: snap.duration,
    words: wordsFor(snap.seg),
    progress: snap.progress,
    total: snap.total,
    elapsed: snap.elapsed,
    playing: snap.playing,
    ended: snap.ended,
    quiz: snap.quiz,
    quizWaitLeft: snap.quizWaitLeft,
    toggle,
    replay,
    answer,
  };
}
