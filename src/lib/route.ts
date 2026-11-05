import { useEffect, useState } from "react";

/**
 * Tiny hash router (works on GitHub Pages without server rewrites).
 *   #/shelf                 -> bookshelf, nothing open
 *   #/uiux                  -> UI/UX book, contents spread
 *   #/uiux/tap-in           -> first spread of the Tap In entry
 *   #/uiux/tap-in/2         -> second spread of the Tap In entry
 *   (empty hash)            -> first visit: the intro auto-opens the UI/UX book
 */
export interface Route {
  book?: string;
  entry?: string;
  n?: number;
  shelf?: boolean;
  empty?: boolean;
}

export function parseHash(hash = window.location.hash): Route {
  const h = hash.replace(/^#\/?/, "");
  if (!h) return { empty: true };
  const [book, entry, n] = h.split("/").filter(Boolean);
  if (book === "shelf") return { shelf: true };
  return { book, entry, n: n ? Math.max(1, parseInt(n, 10) || 1) : undefined };
}

export function toHash(r: Route): string {
  if (!r.book) return "#/shelf";
  let h = `#/${r.book}`;
  if (r.entry) h += `/${r.entry}`;
  if (r.entry && r.n && r.n > 1) h += `/${r.n}`;
  return h;
}

export function writeRoute(r: Route, push = false) {
  const h = toHash(r);
  if (window.location.hash === h) return;
  if (push) window.history.pushState(null, "", h);
  else window.history.replaceState(null, "", h);
}

/** Subscribes to user navigation (back/forward, manual hash edits). */
export function useHashChange(cb: (r: Route) => void) {
  useEffect(() => {
    const on = () => cb(parseHash());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, [cb]);
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
