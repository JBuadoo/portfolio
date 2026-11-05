import { createContext, useContext, useMemo, useState } from "react";
import type { Img } from "../data/types";

export const LightboxCtx = createContext<(img: Img) => void>(() => undefined);
/** true when rendering a page inside a turning leaf: load eagerly, no interactivity */
export const StaticCtx = createContext(false);

const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

export function Picture({ img, fit = "cover", maxH, phone }: { img: Img; fit?: "cover" | "contain"; maxH?: number; phone?: boolean }) {
  const open = useContext(LightboxCtx);
  const isStatic = useContext(StaticCtx);
  return (
    <figure className={`pic${phone ? " pic--phone" : ""}`}>
      <button
        type="button"
        className="pic__btn"
        onClick={() => open(img)}
        tabIndex={isStatic ? -1 : 0}
        aria-label={`Enlarge image: ${img.alt}`}
      >
        {isVideo(img.src) ? (
          <video
            src={img.src}
            poster={img.poster}
            aria-label={img.alt}
            autoPlay={!isStatic}
            muted
            loop
            playsInline
            preload={isStatic ? "none" : "auto"}
            style={{ objectFit: fit, maxHeight: maxH ? `min(${maxH}px, calc(var(--u, 3) * 130px))` : undefined }}
          />
        ) : (
          <img
            src={img.src}
            alt={img.alt}
            loading={isStatic ? "eager" : "lazy"}
            decoding="async"
            style={{ objectFit: fit, maxHeight: maxH ? `min(${maxH}px, calc(var(--u, 3) * 130px))` : undefined }}
          />
        )}
      </button>
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

export function ProjectGallery({ images, cols = 3, phone, title, fit, bare, large, square, stackMobile }: { images: Img[]; cols?: number; phone?: boolean; title?: string; fit?: "cover" | "contain"; bare?: boolean; large?: boolean; square?: boolean; stackMobile?: boolean }) {
  return (
    <div className={`gallery-wrap${bare ? " gallery-wrap--bare" : ""}${large ? " gallery-wrap--large" : ""}`}>
      {title && <h4 className="b-label">{title}</h4>}
      <div className={`gallery${phone ? " gallery--phone" : ""}${bare ? " gallery--bare" : ""}${large ? " gallery--large" : ""}${square ? " gallery--square" : ""}${stackMobile ? " gallery--stack-m" : ""}`} style={{ ["--cols" as string]: cols }}>
        {images.map((im) => (
          <Picture key={im.src} img={im} phone={phone} fit={fit ? fit : phone ? "contain" : "cover"} />
        ))}
      </div>
    </div>
  );
}

/** Jagged outline for a torn piece of paper (clip-path polygon, % units). */
function tornEdge(seed: number) {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const pts: string[] = [];
  const n = 26;
  const j = (a: number) => (rnd() * a).toFixed(2);
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${j(1.6)}%`); // top
  for (let i = 1; i <= n; i++) pts.push(`${(100 - +j(1.2)).toFixed(2)}% ${((i / n) * 100).toFixed(2)}%`); // right
  for (let i = n - 1; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(2)}% ${(100 - +j(1.8)).toFixed(2)}%`); // bottom
  for (let i = n - 1; i > 0; i--) pts.push(`${j(1.2)}% ${((i / n) * 100).toFixed(2)}%`); // left
  return `polygon(${pts.join(",")})`;
}

export function Lightbox({ img, onClose }: { img: Img; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const clip = useMemo(() => tornEdge(img.src.length * 31 + 7), [img.src]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setOrigin({ x, y });
  };

  const handleImgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setOrigin({ x, y });
    }
    setZoomed((z) => !z);
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={img.alt} onClick={onClose}>
      <figure className="lightbox__frame" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox__paper" style={{ clipPath: clip }}>
          <div
            className={`lightbox__viewport${zoomed ? " is-zoomed" : ""}`}
            onClick={isVideo(img.src) ? undefined : handleImgClick}
            onMouseMove={handleMouseMove}
            title={zoomed ? "Click to zoom out" : "Click to zoom in"}
          >
            {isVideo(img.src) ? (
              <video src={img.src} poster={img.poster} aria-label={img.alt} className="lightbox__img" autoPlay muted loop playsInline controls />
            ) : (
            <img
              src={img.src}
              alt={img.alt}
              className={`lightbox__img${zoomed ? " is-zoomed" : ""}`}
              style={{
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            />
            )}
            {!isVideo(img.src) && (
            <span className="lightbox__zoom-badge" aria-hidden>
              {zoomed ? "− Zoom out" : "+ Click to zoom"}
            </span>
            )}
          </div>
          <figcaption>
            <span>{img.caption ?? img.alt}</span>
          </figcaption>
        </div>
        <span className="lightbox__tape lightbox__tape--l" aria-hidden />
        <span className="lightbox__tape lightbox__tape--r" aria-hidden />
        <button type="button" className="px-btn lightbox__close" onClick={onClose} autoFocus>
          Close
        </button>
      </figure>
    </div>
  );
}
