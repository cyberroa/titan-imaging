/** Fixed left/right black vignette beneath the header — Better Stack page-edge fade. */
export function PrototypeSideVignette() {
  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 left-0 top-16 z-40 w-10 bg-gradient-to-r from-black via-black/80 to-transparent sm:w-14 md:top-20 md:w-20 lg:w-28"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 top-16 z-40 w-10 bg-gradient-to-l from-black via-black/80 to-transparent sm:w-14 md:top-20 md:w-20 lg:w-28"
        aria-hidden
      />
    </>
  );
}
