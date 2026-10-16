import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-paper px-8 sm:items-center sm:text-center">
      <div className="label">404</div>
      <h1 className="mt-3 font-display text-[35px] leading-none">Nothing to unspool here.</h1>
      <p className="mt-3 text-[15px] text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-7 self-start px-5 py-2.5 text-[14px] sm:self-center">
        Go home
      </Link>
    </div>
  );
}
