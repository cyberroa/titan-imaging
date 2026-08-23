/** Fixed left/right black vignette — desktop only (too heavy on narrow mobile). */
export function PrototypeSideVignette() {
  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 left-0 top-12 z-40 hidden w-16 bg-gradient-to-r from-black via-black/70 to-transparent md:block lg:w-24 xl:w-28"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 top-12 z-40 hidden w-16 bg-gradient-to-l from-black via-black/70 to-transparent md:block lg:w-24 xl:w-28"
        aria-hidden
      />
    </>
  );
}
