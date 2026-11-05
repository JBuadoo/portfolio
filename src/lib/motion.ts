/** Promise wrapper around the Web Animations API. Resolves even if the animation is cancelled. */
export function animate(
  el: Element | null | undefined,
  keyframes: Keyframe[],
  opts: KeyframeAnimationOptions,
): Promise<void> {
  if (!el) return Promise.resolve();
  const a = el.animate(keyframes, { fill: "forwards", ...opts });
  return a.finished.then(
    () => {
      // commit final style and release the animation so later inline styles win
      try {
        a.commitStyles();
      } catch {
        /* element may be detached */
      }
      a.cancel();
    },
    () => undefined,
  );
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const EASE_OUT = "cubic-bezier(.2,.8,.2,1)";
export const EASE_IN_OUT = "cubic-bezier(.65,0,.35,1)";
export const EASE_PAGE = "cubic-bezier(.45,.05,.35,1)";

/** Preloads a list of image URLs; calls onProgress(0..1). Never rejects. */
export function preload(urls: string[], onProgress?: (p: number) => void): Promise<void> {
  let done = 0;
  const total = urls.length || 1;
  return Promise.all(
    urls.map(
      (u) =>
        new Promise<void>((res) => {
          const im = new Image();
          const fin = () => {
            done++;
            onProgress?.(done / total);
            res();
          };
          im.onload = fin;
          im.onerror = fin;
          im.src = u;
        }),
    ),
  ).then(() => undefined);
}
