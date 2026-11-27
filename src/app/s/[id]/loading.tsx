// Shown the instant a reel is opened, while its page loads: the dark reel frame with a spinning spool, so tapping a
// spool answers at once instead of waiting on a blank screen.
export default function ReelLoading() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black" aria-busy="true" aria-label="Loading reels">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-spin rounded-full border-[5px] border-thread/25 border-t-thread" />
        <span className="absolute inset-[19px] rounded-full bg-thread" />
      </div>
    </div>
  );
}
