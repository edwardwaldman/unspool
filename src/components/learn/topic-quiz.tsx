"use client";

import { useState } from "react";

type Q = [string, string[], number, string];

/** The three-question check at the end of a topic page: tap an answer, see right or wrong and why. */
export function TopicQuiz({ quiz }: { quiz: Q[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => quiz.map(() => null));
  const done = picked.every((p) => p !== null);
  const score = picked.filter((p, i) => p === quiz[i][2]).length;
  return (
    <div className="space-y-6">
      {quiz.map(([q, options, answer, why], i) => {
        const p = picked[i];
        return (
          <fieldset key={q} className="border border-line p-5">
            <legend className="px-1 font-mono text-[12px] text-muted">Question {i + 1}</legend>
            <p className="text-[17px] font-semibold">{q}</p>
            <div className="mt-3 grid gap-2">
              {options.map((o, j) => {
                const state = p === null ? "" : j === answer ? "border-sage text-sage" : j === p ? "border-coral text-coral" : "opacity-60";
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={p !== null}
                    onClick={() => setPicked((cur) => cur.map((c, k) => (k === i ? j : c)))}
                    className={`border border-line px-4 py-3 text-left text-[15px] transition-colors hover:border-ink disabled:cursor-default ${state}`}
                  >
                    <span className="mr-2 font-mono text-[13px] text-muted">{String.fromCharCode(65 + j)}.</span>
                    {o}
                    {p !== null && j === answer && " ✓"}
                  </button>
                );
              })}
            </div>
            {p !== null && (
              <p className="mt-3 text-[14px] text-muted" role="status">
                <span className={p === answer ? "text-sage" : "text-coral"}>{p === answer ? "Correct. " : "Not quite. "}</span>
                {why}
              </p>
            )}
          </fieldset>
        );
      })}
      {done && (
        <p className="font-mono text-[14px]" role="status">
          You got {score} of {quiz.length}.
        </p>
      )}
    </div>
  );
}
