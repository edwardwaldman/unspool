import { ProcessDemo } from "./process-demo";



/** Second screen under the hero: the process demo. */
export function InfoSlide() {
  return (
    <section className="flex min-h-[80dvh] flex-col justify-center border-t border-line px-6 py-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="label">How it works</div>
        <div className="mt-8">
          <ProcessDemo />
        </div>
      </div>
    </section>
  );
}
