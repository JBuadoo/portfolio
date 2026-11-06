import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Img } from "../data/types";
import { PHOTOGRAPHY } from "../data/photography";
import { PixelIcon } from "./PixelIcon";

export type WallView = { kind: "photo"; img: Img } | { kind: "gallery" } | null;

/** A photo in the chunky frame. The frame stays hidden until the photo has loaded, so it never
 *  pops open around an empty (0x0) image and then grows outward. */
function FramedPhoto({ img }: { img: Img }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setReady(true);
  }, []);
  return (
    <figure className={`wframe${ready ? "" : " is-loading"}`} onClick={(e) => e.stopPropagation()}>
      <div className="wframe__wood">
        <div className="wframe__mat">
          <img ref={ref} src={img.src} alt={img.alt} draggable={false} onLoad={() => setReady(true)} onError={() => setReady(true)} />
          <span className="noshield" aria-hidden />
        </div>
      </div>
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

const prefetched = new Set<string>();
function prefetch(src: string) {
  if (prefetched.has(src)) return;
  prefetched.add(src);
  const im = new Image();
  im.src = src;
}

/** Close-up of a wall photo in its frame, or the photography gallery opened from the camera. */
export function WallViewer({ view, onClose: done }: { view: WallView; onClose: () => void }) {
  const [zi, setZi] = useState<number | null>(null);
  const zoom: Img | null = zi === null ? null : PHOTOGRAPHY[zi];
  const setZoom = (v: null) => setZi(v);
  const step = (d: number) => setZi((i) => (i === null ? i : (i + d + PHOTOGRAPHY.length) % PHOTOGRAPHY.length));
  const [closing, setClosing] = useState(false);
  const onClose = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      done();
    }, 220);
  };
  useEffect(() => {
    if (!view) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoom) setZoom(null);
        else onClose();
      } else if (zoom && e.key === "ArrowRight") step(1);
      else if (zoom && e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });
  useEffect(() => setZoom(null), [view]);
  // warm the photos either side of the open one, so stepping through never waits
  useEffect(() => {
    if (zi === null) return;
    const n = PHOTOGRAPHY.length;
    [1, -1].forEach((d) => prefetch(PHOTOGRAPHY[(zi + d + n) % n].src));
  }, [zi]);
  if (!view) return null;

  const framed = (img: Img) => <FramedPhoto key={img.src} img={img} />;

  return createPortal(
    <div className={`wview${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={view.kind === "gallery" ? "Photography" : view.img.alt} onClick={zoom ? () => setZoom(null) : onClose} onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      {zoom ? (
        <div className="wzoom" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="px-btn wzoom__nav" onClick={() => step(-1)} aria-label="Previous photo">
            <PixelIcon name="left" px={2} />
          </button>
          {framed(zoom)}
          <button type="button" className="px-btn wzoom__nav" onClick={() => step(1)} aria-label="Next photo">
            <PixelIcon name="right" px={2} />
          </button>
          <span className="wzoom__count">{String((zi ?? 0) + 1).padStart(3, "0")} / {String(PHOTOGRAPHY.length).padStart(3, "0")}</span>
        </div>
      ) : view.kind === "photo" ? (
        framed(view.img)
      ) : (
        <section className="cam" onClick={(e) => e.stopPropagation()} aria-label="Photography gallery">
          <div className="cam__top">
            <span className="cam__dial" aria-hidden />
            <span className="cam__brand">JB · PHOTOGRAPHY</span>
            <span className="cam__shutter" aria-hidden />
          </div>
          <p className="cam__intro">A selection of my work as a photographer.</p>
          <div className="cam__screen">
            <div className="cam__hud" aria-hidden>
              <span>ISO 400</span>
              <span>f/2.8</span>
              <span>1/125</span>
              <span className="cam__bat">▮▮▮▯</span>
            </div>
            <i className="cam__corner tl" />
            <i className="cam__corner tr" />
            <i className="cam__corner bl" />
            <i className="cam__corner br" />
            {PHOTOGRAPHY.length ? (
              <div className="cam__grid">
                {PHOTOGRAPHY.map((p, i) => (
                  <button key={p.src} type="button" className="cam__shot" onClick={() => setZi(i)} onPointerEnter={() => prefetch(p.src)} onFocus={() => prefetch(p.src)} aria-label={`View ${p.alt}`}>
                    <img src={p.thumb ?? p.src} alt={p.alt} loading="lazy" decoding="async" draggable={false} />
                    <span>{String(i + 1).padStart(3, "0")}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="cam__empty">
                <span className="cam__focus" aria-hidden />
                <strong>NO IMAGES ON CARD</strong>
                <span>Photography coming soon</span>
              </div>
            )}
            <div className="cam__foot" aria-hidden>
              <span>GALLERY</span>
              <span>{String(PHOTOGRAPHY.length).padStart(3, "0")} SHOTS</span>
            </div>
          </div>
        </section>
      )}
      <button type="button" className="px-btn wview__close" onClick={(e) => { e.stopPropagation(); if (zoom) setZoom(null); else onClose(); }} autoFocus>
        <PixelIcon name={zoom ? "left" : "close"} px={2} /> {zoom ? "Back" : "Close"}
      </button>
    </div>,
    document.body,
  );
}
