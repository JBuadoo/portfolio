import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FOLDER_ENTRIES, getBook } from "../data/books";
import type { Block, Img } from "../data/types";
import { Blocks, makeFeaturedStore, type PageCtx } from "./BookPage";
import { Lightbox, LightboxCtx } from "./ProjectGallery";
import { PixelIcon } from "./PixelIcon";

interface Sheet {
  entry: string;
  section: string;
  icon: string;
  left: Block[];
  right: Block[];
}

/** One paper per spread of each folder entry (Cover Art, Photoshop, Animation). */
function folderSheets(): Sheet[] {
  return FOLDER_ENTRIES.flatMap((e) =>
    e.spreads.map((sp) => ({ entry: e.id, section: e.title, icon: e.icon, left: sp.left, right: sp.right })),
  );
}

type Shuffle = { from: number; dir: 1 | -1; key: number } | null;

/** The manila folder from the shelf: loose papers you shuffle through, one project page per sheet. */
export function CreativeFolder({ onClose: done }: { onClose: () => void }) {
  const sheets = useMemo(folderSheets, []);
  const ctx = useMemo<PageCtx>(
    () => ({ book: getBook("creative")!, featured: makeFeaturedStore(), goEntry: () => undefined }),
    [],
  );
  const [i, setI] = useState(0);
  const [shuffle, setShuffle] = useState<Shuffle>(null);
  const [closing, setClosing] = useState(false);
  const [lightbox, setLightbox] = useState<Img | null>(null);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goTo = (n: number) => {
    if (n < 0 || n >= sheets.length || n === i) return;
    if (!reduced()) setShuffle({ from: i, dir: n > i ? 1 : -1, key: Date.now() });
    setI(n);
  };
  const onClose = () => {
    if (closing) return;
    if (reduced()) return done();
    setClosing(true);
    window.setTimeout(done, 240);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.stopImmediatePropagation();
      e.stopPropagation();
      if (lightbox) {
        if (e.key === "Escape") setLightbox(null);
        return;
      }
      if (e.key === "Escape") onClose();
      else goTo(i + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  });

  const sections = FOLDER_ENTRIES.map((e) => ({
    id: e.id,
    title: e.title,
    icon: e.icon,
    first: sheets.findIndex((s) => s.entry === e.id),
  }));
  const cur = sheets[i];

  const paper = (n: number, cls: string, live = false) => {
    const s = sheets[n];
    const nInSection = sheets.slice(0, n + 1).filter((x) => x.entry === s.entry).length;
    const ofSection = sheets.filter((x) => x.entry === s.entry).length;
    return (
      <article
        key={`${n}-${cls}-${shuffle?.key ?? 0}`}
        className={`cfolder__sheet ${cls}`}
        aria-hidden={!live || undefined}
        aria-live={live ? "polite" : undefined}
        aria-label={live ? `${s.section}, sheet ${nInSection} of ${ofSection}` : undefined}
        onAnimationEnd={cls === "is-out" || cls === "is-in" ? (e) => e.target === e.currentTarget && setShuffle(null) : undefined}
      >
        <header className="cfolder__head">
          <span className="cfolder__section">
            <PixelIcon name={s.icon} px={1} /> {s.section}
          </span>
          <span className="cfolder__page">
            {n + 1} / {sheets.length}
          </span>
        </header>
        <div className="cfolder__cols">
          <div>
            <Blocks blocks={s.left} ctx={ctx} />
          </div>
          {s.right.length > 0 && (
            <div>
              <Blocks blocks={s.right} ctx={ctx} />
            </div>
          )}
        </div>
      </article>
    );
  };

  return createPortal(
    <div
      className={`cfolder-view${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Creative folder: cover art, Photoshop and animation"
      onClick={onClose}
    >
      <LightboxCtx.Provider value={setLightbox}>
        <div className="cfolder" onClick={(e) => e.stopPropagation()}>
          <div className="cfolder__back" aria-hidden />
          <nav className="cfolder__tabs" aria-label="Folder sections">
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`cfolder__tab${cur.entry === sec.id ? " is-active" : ""}`}
                onClick={() => goTo(sec.first)}
                aria-current={cur.entry === sec.id || undefined}
              >
                <PixelIcon name={sec.icon} px={1} />
                <span>{sec.title}</span>
              </button>
            ))}
          </nav>
          <div className="cfolder__stack">
            {sheets.slice(i + 1, i + 3).map((_, k) => (
              <div key={`u${k}`} className={`cfolder__under u${k + 1}`} aria-hidden />
            ))}
            {/* next: the old top sheet lifts out and tucks behind; prev: the sheet is pulled from behind onto the top */}
            {shuffle?.dir === 1 && paper(shuffle.from, "is-out")}
            {shuffle?.dir === -1 && paper(shuffle.from, "is-under")}
            {paper(i, shuffle?.dir === -1 ? "is-in" : shuffle ? "is-settle" : "", true)}
          </div>
          <div className="cfolder__pocket" aria-hidden>
            <span>Creative</span>
          </div>
        </div>
      </LightboxCtx.Provider>
      <div className="rpaper__ctl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="px-btn" onClick={() => goTo(i - 1)} disabled={i === 0} aria-label="Previous paper">
          <PixelIcon name="left" px={2} />
        </button>
        <button type="button" className="px-btn" onClick={onClose} autoFocus>
          <PixelIcon name="close" px={2} /> <span>Close</span>
        </button>
        <button type="button" className="px-btn" onClick={() => goTo(i + 1)} disabled={i === sheets.length - 1} aria-label="Next paper">
          <PixelIcon name="right" px={2} />
        </button>
      </div>
      {lightbox && (
        <div onClick={(e) => e.stopPropagation()}>
          <Lightbox img={lightbox} onClose={() => setLightbox(null)} />
        </div>
      )}
    </div>,
    document.querySelector(".app") ?? document.body,
  );
}
