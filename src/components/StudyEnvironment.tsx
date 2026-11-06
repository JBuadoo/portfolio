import { useEffect, useState } from "react";
import { SCENE, T } from "../data/scene";
import { WindowLighting } from "./WindowLighting";
import { Bookshelf } from "./Bookshelf";
import { PixelIcon } from "./PixelIcon";
import { DeskClock, type DeskClockInfo } from "./DeskClock";
import { WallViewer, type WallView } from "./WallViewer";
import { WALL_PHOTOS } from "../data/photography";
import { CreativeFolder } from "./CreativeFolder";

interface Props {
  navW: number;
  outBook: string | null;
  landingBook?: string | null;
  highlight: string | null;
  intro: boolean;
  dimmed: boolean;
  reduced: boolean;
  onOpen: (id: string, el: HTMLElement) => void;
}

// The window glass is an angled quad (the window sits on the left wall, in perspective).
const CAM = (SCENE as unknown as { camera: { src: string; x: number; y: number; w: number; h: number } }).camera;
const FOLDER = (SCENE as unknown as { folder: { src: string; x: number; y: number; w: number; h: number; z: number } }).folder;
const QUAD = (SCENE as unknown as { glassQuad: [number, number][] }).glassQuad;
const SKEW = (SCENE as unknown as { cloudSkew: number }).cloudSkew;

// The part of the 480x270 scene that must always stay visible.
const FOCUS = { x: 46, y: 0, w: 434, h: 234 };

function useSceneTransform(navW: number) {
  const calc = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cover = Math.max(vw / SCENE.width, vh / SCENE.height);
    const fit = Math.min((vw - navW) / FOCUS.w, vh / FOCUS.h);
    const s = Math.min(cover, fit);
    const O = 60; // the wall/floor art extends 60 scene px beyond every edge
    let x = navW + (vw - navW - FOCUS.w * s) / 2 - FOCUS.x * s;
    x = Math.min(Math.max(x, vw - (SCENE.width + O) * s), O * s);
    let y = (vh - FOCUS.h * s) / 2 - FOCUS.y * s;
    y = Math.min(Math.max(y, vh - (SCENE.height + O) * s), O * s);
    return { s, x, y };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    setT(calc()); // nav width changed (sidebar shown/hidden)
    const on = () => setT(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navW]);
  return t;
}

/** The layered pixel-art study: wall, window + sky, decor, light, dust and the bookshelf. */
export function StudyEnvironment({ navW, outBook, landingBook, highlight, intro, dimmed, reduced, onOpen }: Props) {
  const { s, x, y } = useSceneTransform(navW);
  const [gx, gy, gw, gh] = SCENE.glass;
  const sky = SCENE.layers.filter((l) => l.role === "sky");
  const room = SCENE.layers.filter((l) => l.role !== "sky" && true);
  const dclock = (SCENE as unknown as { deskClock: DeskClockInfo }).deskClock;
  const floorTop = y + 244 * s;
  const [wallView, setWallView] = useState<WallView>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const hit = (name: string) => SCENE.layers.find((l) => l.name === name)!;

  return (
    <div className={`study${dimmed ? " is-dimmed" : ""}${intro ? " is-intro" : ""}`}>
      <div className="study__fill-floor" style={{ top: floorTop }} aria-hidden />
      <div className="study__grade" aria-hidden />
      <div
        className="scene"
        style={{ transform: `translate(${x}px, ${y}px) scale(${s})` }}
        aria-label="A cozy pixel-art study at sunset"
      >
        <div
          className="scene__glass"
          style={{ left: gx, top: gy, width: gw, height: gh, clipPath: `polygon(${QUAD.map(([qx, qy]) => `${qx}px ${qy}px`).join(",")})` }}
          aria-hidden
        >
          {sky.map((l) =>
            l.cls === "clouds" ? (
              <div key={l.name} className="clouds-skew" style={{ top: l.y - gy, transform: `skewY(${SKEW}deg)` }}>
                <div className="clouds px" style={{ top: 0, height: l.h, backgroundImage: `url(${T(l.src)})`, ["--tile" as string]: `${l.w}px` }} />
              </div>
            ) : (
              <img key={l.name} src={T(l.src)} alt="" className="px" style={{ left: l.x - gx, top: l.y - gy, width: l.w, height: l.h }} />
            ),
          )}
          <div className="sun-shimmer" />
        </div>
        {room.map((l) => (
          <img
            key={l.name}
            src={T(l.src)}
            alt=""
            aria-hidden
            className={`px layer layer--${l.name}${l.cls ? ` ${l.cls}` : ""}`}
            style={{ left: l.x, top: l.y, width: l.w, height: l.h, zIndex: l.z }}
          />
        ))}
        <WindowLighting paused={dimmed} reduced={reduced} />
        <img className="fx fx--room-blur" src={T((SCENE as unknown as { fx: { blur: string } }).fx.blur)} alt="" aria-hidden />
        <Bookshelf outBook={outBook} landingBook={landingBook} highlight={highlight} intro={intro} onOpen={onOpen} />
        <DeskClock src={T(dclock.src)} w={dclock.w} h={dclock.h} lcd={dclock.lcd} style={{ left: 0, top: 0, zIndex: dclock.z, transform: dclock.transform, transformOrigin: "0 0" }} />
        {(["frame-photo", "frame-drums", "frame-award"] as const).map((n) => {
          const l = hit(n);
          return (
            <button
              key={n}
              type="button"
              className="wall-hit"
              style={{ left: l.x, top: l.y, width: l.w, height: l.h }}
              onClick={() => setWallView({ kind: "photo", img: WALL_PHOTOS[n] })}
              tabIndex={dimmed ? -1 : 0}
              aria-label={`View photo: ${WALL_PHOTOS[n].alt}`}
            />
          );
        })}
<button
          type="button"
          className="cam-btn"
          style={{ left: CAM.x, top: CAM.y, width: CAM.w, height: CAM.h }}
          onClick={() => setWallView({ kind: "gallery" })}
          tabIndex={dimmed ? -1 : 0}
          aria-label="Open my photography gallery"
          title="Photography"
        >
          <span className="cam-btn__body">
            <img src={T(CAM.src)} alt="" className="px" draggable={false} />
          </span>
        </button>
        <button
          type="button"
          className="cam-btn folder-btn"
          style={{ left: FOLDER.x, top: FOLDER.y, width: FOLDER.w, height: FOLDER.h, zIndex: FOLDER.z }}
          onClick={() => setFolderOpen(true)}
          tabIndex={dimmed ? -1 : 0}
          aria-label="Open my creative folder: cover art, Photoshop and animation"
          title="Creative folder"
        >
          <span className="cam-btn__body">
            <img src={T(FOLDER.src)} alt="" className="px" draggable={false} />
          </span>
        </button>
        <div className={`shelf-hint${outBook ? " is-hidden" : ""}`} aria-hidden={!!outBook}>
          <span className="shelf-hint__arrow" />
          <span className="shelf-hint__pill">
            <PixelIcon name="mouse" px={0.5} />
            Click a book to explore my work…
          </span>
          <span className="shelf-hint__arrow is-flip" />
        </div>
      </div>
      <WallViewer view={wallView} onClose={() => setWallView(null)} />
      {folderOpen && <CreativeFolder onClose={() => setFolderOpen(false)} />}
    </div>
  );
}
