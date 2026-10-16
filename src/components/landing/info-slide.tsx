import { ProcessDemo } from "./process-demo";


const FACTS = [
  ["10", "reels per document"],
  ["~60s", "per reel"],
  ["1", "quiz in every reel"],
  ["Free", "first reel, every doc"],
] as const;

/** Second screen under the hero: the process demo and the numbers. */
export function InfoSlide() {
  return (
    <section className="flex min-h-[80dvh] flex-col justify-center border-t border-line px-6 py-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <div>
          <ProcessDemo />
        </div>
        <div className="mt-14 grid grid-cols-2 border-y border-line md:grid-cols-4">
          {FACTS.map(([n, label], i) => (
            <div key={label} className={`py-6 ${i % 2 === 1 ? "border-l border-line pl-6" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-6" : ""}`}>
              <div className="font-mono text-[28px] text-ink">{n}</div>
              <div className="label mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
