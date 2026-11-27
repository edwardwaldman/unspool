// Shown the instant the Studio is opened, while the server loads the account's documents (so a tap never feels
// stuck). Same shape as the phone Studio: header, greeting, timer, the big +, the search bar.
export default function StudioLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-paper" aria-busy="true" aria-label="Loading your Studio">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <div className="shimmer mr-auto h-5 w-28 rounded-full" />
        <div className="shimmer h-9 w-24 rounded-full" />
        <div className="shimmer h-9 w-9 rounded-full" />
      </div>
      <div className="mx-auto w-full max-w-[560px] px-4 pt-5">
        <div className="shimmer h-3.5 w-36 rounded-full" />
        <div className="shimmer mt-2.5 h-7 w-56 rounded-full" />
        <div className="shimmer mt-5 h-[62px] w-full rounded-[16px]" />
        <div className="flex flex-col items-center pb-5 pt-7">
          <div className="shimmer h-[112px] w-[112px] rounded-full" />
          <div className="shimmer mt-4 h-5 w-44 rounded-full" />
        </div>
        <div className="shimmer h-[52px] w-full rounded-full" />
      </div>
    </div>
  );
}
