/** Pixel loading screen shown while the scene sprites load. */
export function LoadingScreen({ progress, leaving }: { progress: number; leaving: boolean }) {
  const blocks = 16;
  const on = Math.round(progress * blocks);
  return (
    <div className={`loading${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite">
      <img src="/assets/ui/logo.png" alt="" className="px loading__logo" />
      <p className="loading__label">Entering the study…</p>
      <div className="loading__bar" aria-hidden>
        {Array.from({ length: blocks }, (_, i) => (
          <i key={i} className={i < on ? "is-on" : ""} />
        ))}
      </div>
      <span className="sr-only">Loading {Math.round(progress * 100)}%</span>
    </div>
  );
}
