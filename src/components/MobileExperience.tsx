import { useEffect, useState, type CSSProperties } from "react";
import { SCENE, T } from "../data/scene";
import { SHELF_BOOKS } from "../data/books";
import { PortfolioBook } from "./PortfolioBook";
import { PixelIcon } from "./PixelIcon";
import { DeskClock, type DeskClockInfo } from "./DeskClock";
import { WallViewer, type WallView } from "./WallViewer";
import { WALL_PHOTOS } from "../data/photography";

interface Props {
  outBook: string | null;
  landingBook?: string | null;
  highlight: string | null;
  intro: boolean;
  onOpen: (id: string, el: HTMLElement) => void;
}

const byName = (n: string) => SCENE.layers.find((l) => l.name === n)!;
const FX = (SCENE as unknown as { fx: { shafts: string; bloom: string } }).fx;

/** The phone room is laid out on a 220-px-wide pixel artboard, scaled to the screen width. */
const ART_W = 220;
const FIT_H = 298; // artboard height that must be visible without scrolling (down to the hint)
const BOOK = 0.76; // shelf book scale on the artboard (56x86 sprite -> ~45x69)

/**
 * The left wall is the real desktop art: the angled wall, window (with the live sky), desk,
 * clock, chair and plants, shown through a slice that ends at the room's corner.
 * F = desktop scene px -> artboard px, (X0, Y0) = desktop point drawn at the artboard origin.
 */
const F = 1.08;
const X0 = 92;
const Y0 = -22;
const CORNER = 166; // desktop x of the wall corner
const CX = (CORNER - X0) * F; // corner on the artboard (~78)
const LEFT_LAYERS = ["window", "hanging-plant", "desk", "ghana-sticker", "pencil-cup", "desk-clock-body", "chair", "floor-plant"];

export function MobileExperience({ outBook, landingBook, highlight, intro, onOpen }: Props) {
  const size = () => ({ w: Math.min(window.innerWidth, 560), h: window.innerHeight - 64 });
  const [vp, setVp] = useState(size);
  useEffect(() => {
    const on = () => setVp(size());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  // CSS px per artboard px: fill the width, but keep both shelves + the hint on the first screen
  const u = Math.min(vp.w / ART_W, vp.h / FIT_H);
  const [wallView, setWallView] = useState<WallView>(null);

  const at = (x: number, y: number, w: number, h: number, z = 1): CSSProperties => ({
    position: "absolute",
    left: x * u,
    top: y * u,
    width: w * u,
    height: h * u,
    zIndex: z,
  });
  const sprite = (src: string, x: number, y: number, w: number, h: number, z = 1, cls = "") => (
    <img src={T(src)} alt="" aria-hidden className={`px ${cls}`} style={at(x, y, w, h, z)} draggable={false} />
  );

  // ---- left wall slice (desktop scene coordinates inside) ----
  const wall = byName("wall");
  const [gx, gy, gw, gh] = SCENE.glass;
  const sky = SCENE.layers.filter((l) => l.role === "sky");
  const quad = (SCENE as unknown as { glassQuad: [number, number][] }).glassQuad;
  const skew = (SCENE as unknown as { cloudSkew: number }).cloudSkew;
  const dclock = (SCENE as unknown as { deskClock: DeskClockInfo }).deskClock;
  const left = SCENE.layers.filter((l) => LEFT_LAYERS.includes(l.name));

  // ---- back wall decor ----
  const k = 0.72;
  const photo = (frame: string, pic: string, x: number, y: number) => {
    const f = byName(frame);
    const p = byName(pic);
    return (
      <button
        key={frame}
        type="button"
        className="wall-hit"
        style={at(x, y, f.w * k, f.h * k, 6)}
        onClick={() => setWallView({ kind: "photo", img: WALL_PHOTOS[frame] })}
        aria-label={`View photo: ${WALL_PHOTOS[frame].alt}`}
      >
        <img src={T(f.src)} alt="" className="px" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <img
          src={T(p.src)}
          alt=""
          className="px"
          style={{ position: "absolute", left: `${(4 / f.w) * 100}%`, top: `${(4 / f.h) * 100}%`, width: `${((f.w - 8) / f.w) * 100}%`, height: `${((f.h - 8) / f.h) * 100}%` }}
        />
      </button>
    );
  };
  const poster = byName("poster");
  const M = (SCENE as unknown as { mobile: Record<string, string> }).mobile;

  const bw = 56 * BOOK;
  const bh = 86 * BOOK;
  const rows: { y: number; xs: number[] }[] = [
    { y: 168, xs: [CX + 3, CX + 49, CX + 95] },
    { y: 262, xs: [CX + 3, CX + 49] },
  ];

  return (
    <div
      className={`mroom${intro ? " is-intro" : ""}`}
      style={{ ["--u" as string]: u }}
    >
      <div className="mroom__board" style={{ height: "100%" }}>
        {/* the angled left wall with the window, desk and clock */}
        <div className="mroom__left" aria-hidden>
          <div className="mroom__slice" style={{ transform: `scale(${F * u}) translate(${-X0}px, ${-Y0}px)` }}>
            <div className="mroom__floor" style={{ position: "absolute", left: -60, top: 300, width: CORNER + 60, height: 300 }} />
            <img
              src={T(wall.src)}
              alt=""
              className="px"
              style={{ position: "absolute", left: wall.x, top: wall.y, width: wall.w, height: wall.h }}
            />
            <div
              className="scene__glass"
              style={{ left: gx, top: gy, width: gw, height: gh, clipPath: `polygon(${quad.map(([qx, qy]) => `${qx}px ${qy}px`).join(",")})` }}
            >
              {sky.map((l) =>
                l.cls === "clouds" ? (
                  <div key={l.name} className="clouds-skew" style={{ top: l.y - gy, transform: `skewY(${skew}deg)` }}>
                    <div className="clouds px" style={{ top: 0, height: l.h, backgroundImage: `url(${T(l.src)})`, ["--tile" as string]: `${l.w}px` }} />
                  </div>
                ) : (
                  <img key={l.name} src={T(l.src)} alt="" className="px" style={{ left: l.x - gx, top: l.y - gy, width: l.w, height: l.h }} />
                ),
              )}
            </div>
            {left.map((l) => (
              <img
                key={l.name}
                src={T(l.src)}
                alt=""
                className={`px${l.cls ? ` ${l.cls}` : ""}`}
                style={{ position: "absolute", left: l.x, top: l.y, width: l.w, height: l.h, zIndex: l.z }}
              />
            ))}
            <DeskClock
              src={T(dclock.src)}
              w={dclock.w}
              h={dclock.h}
              lcd={dclock.lcd}
              style={{ left: 0, top: 0, zIndex: dclock.z, transform: dclock.transform, transformOrigin: "0 0" }}
            />
          </div>
        </div>

        {/* the same pre-rendered sun shafts + bloom as the desktop room, through the window */}
        <div className="mroom__fx" aria-hidden style={{ transform: `scale(${F * u}) translate(${-X0}px, ${-Y0}px)` }}>
          <img className="fx fx--shafts" src={T(FX.shafts)} alt="" />
          <img className="fx fx--bloom" src={T(FX.bloom)} alt="" />
        </div>

        {/* wall art on the back wall */}
        {photo("frame-photo", "photo", CX + 8, 16)}
        {sprite(poster.src, CX + 49, 8, poster.w * k, poster.h * k, 2)}
        {photo("frame-drums", "photo-drums", CX + 98, 16)}

        {/* shelves */}
        {rows.map((row, r) => (
          <div key={r} role="group" aria-label={r === 0 ? "Bookshelf, top" : "Bookshelf, bottom"}>
            <div className="mplank" style={at(CX + 2, row.y, ART_W - CX - 2, 6, 4)} aria-hidden>
              <i className="mplank__br" style={{ left: 10 * u, width: 9 * u, height: 12 * u }} />
              <i className="mplank__br" style={{ right: 10 * u, width: 9 * u, height: 12 * u }} />
            </div>
            {SHELF_BOOKS.slice(r * 3, r * 3 + row.xs.length).map((book, i) => {
              const pos = SCENE.books.find((b) => b.id === book.id)!;
              return (
                <PortfolioBook
                  key={book.id}
                  book={book}
                  sprite={T(pos.src)}
                  s={u * BOOK}
                  hidden={outBook === book.id}
                  landing={landingBook === book.id}
                  highlight={highlight === book.id}
                  onOpen={onOpen}
                  style={{ ...at(row.xs[i], row.y - bh + 1, bw, bh, 5), ["--i" as string]: r * 3 + i }}
                />
              );
            })}
          </div>
        ))}
        <button
          type="button"
          className="cam-btn"
          style={{ ...at(CX + 97, 262 - 27, 40, 27, 6), ["--s" as string]: u * 0.9 }}
          onClick={() => setWallView({ kind: "gallery" })}
          aria-label="Open my photography gallery"
        >
          <span className="cam-btn__body">
            <img src={T(M["m-camera"])} alt="" className="px" draggable={false} />
          </span>
        </button>

        {/* same hint as the desktop room: pill with arrows, just below the shelf */}
        <div className="mhint" style={{ left: (CX + (ART_W - CX) / 2) * u, top: 280 * u, transform: `scale(${u * 0.92})` }} aria-hidden={!!outBook}>
          <div className={`shelf-hint${outBook ? " is-hidden" : ""}`}>
            <span className="shelf-hint__arrow" />
            <span className="shelf-hint__pill">
              <PixelIcon name="mouse" px={0.5} />
              Tap a book to explore my work…
            </span>
            <span className="shelf-hint__arrow is-flip" />
          </div>
        </div>
      </div>
      <WallViewer view={wallView} onClose={() => setWallView(null)} />
    </div>
  );
}
