import Link from "next/link";

export default function NotFound() {
  return (
    <div className="reel-bg flex min-h-[100dvh] flex-col items-center justify-center px-8 text-center">
      <div className="text-[44px]">🧵</div>
      <h1 className="mt-3 text-[26px] font-black">Nothing to unspool here</h1>
      <p className="mt-2 text-[15px] text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 rounded-full bg-white px-5 py-2.5 font-bold text-[#0b1020]">
        Go home
      </Link>
    </div>
  );
}
