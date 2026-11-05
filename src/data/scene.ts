import manifest from "./sceneManifest.json";

export interface Layer {
  name: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  cls?: string;
  role?: string;
}

export interface Theme {
  base: string;
  light: string;
  dark: string;
  outline: string;
  accent: string;
  accent2: string;
  icon: string;
}

export const SCENE = manifest as unknown as {
  width: number;
  height: number;
  glass: [number, number, number, number];
  layers: Layer[];
  books: { id: string; src: string; x: number; y: number; w: number; h: number }[];
  openbook: { W: number; H: number; S: number; left: { page: number[]; content: number[] }; right: { page: number[]; content: number[] } };
  mbook: { W: number; H: number; page: number[]; content: number[] };
  themes: Record<string, Theme>;
};

/** Ink colour used for headings/links inside each book. */
export const INK: Record<string, string> = {
  uiux: "#6a3ab0",
  dev: "#2b4bb2",
  music: "#b0501e",
  creative: "#a8283c",
  journal: "#2f6c3c",
};

export function themeVars(id: string): Record<string, string> {
  const t = SCENE.themes[id];
  return {
    "--b-base": t.base,
    "--b-light": t.light,
    "--b-dark": t.dark,
    "--b-outline": t.outline,
    "--b-accent": t.accent,
    "--b-accent2": t.accent2,
    "--ink": INK[id],
    "--ink-base": INK[id],
    "--ob-full": `url(${T(`/assets/ui/openbook-${id}.png`)})`,
    "--ob-l": `url(${T(`/assets/ui/openbook-${id}-l.png`)})`,
    "--ob-r": `url(${T(`/assets/ui/openbook-${id}-r.png`)})`,
    "--ob-cover": `url(/assets/ui/cover-${id}.png)`,
    "--mb-base": `url(${T(`/assets/ui/mbook-${id}.png`)})`,
    "--mb-cover": `url(/assets/ui/mcover-${id}.png)`,
  };
}

/** Lighting mode: "sunset" is the original art; day/night use pre-graded copies (name-day.png / name-night.png). */
export type Mode = "day" | "sunset" | "night";
export const MODES: Mode[] = ["day", "sunset", "night"];
let MODE: Mode = "sunset";
export function setSceneMode(m: Mode) {
  MODE = m;
}
export function getSceneMode() {
  return MODE;
}
/** Image path for the current (or given) mode. */
export function T(src: string, mode: Mode = MODE): string {
  if (mode === "sunset" || !src.endsWith(".png")) return src;
  if (!/assets\/(scene|books)\/|assets\/ui\/(openbook-|mbook-|page-)/.test(src)) return src;
  return src.replace(/\.png$/, `-${mode}.png`);
}
/** Every image a mode needs (preloaded before switching). */
export function modeAssets(mode: Mode): string[] {
  const fx = (SCENE as unknown as { fx: Record<string, string> }).fx;
  const dc = (SCENE as unknown as { deskClock: { src: string } }).deskClock.src;
  return [
    ...SCENE.layers.map((l) => l.src.startsWith("/") ? l.src : `/${l.src}`),
    ...SCENE.books.map((b) => b.src.startsWith("/") ? b.src : `/${b.src}`),
    ...Object.values(fx).map((s) => s.startsWith("/") ? s : `/${s}`),
    dc.startsWith("/") ? dc : `/${dc}`,
    (() => {
      const c = (SCENE as unknown as { camera: { src: string } }).camera.src;
      return c.startsWith("/") ? c : `/${c}`;
    })(),
    "/assets/ui/page-left.png",
    "/assets/ui/page-right.png",
    "/assets/ui/page-single.png",
    ...Object.keys(SCENE.themes).flatMap((id) => [
      `/assets/ui/openbook-${id}-l.png`,
      `/assets/ui/openbook-${id}-r.png`,
      `/assets/ui/mbook-${id}.png`,
    ]),
  ].map((s) => T(s, mode));
}

/** Every image needed before the room can be shown. */
export const SCENE_ASSETS = [
  ...SCENE.layers.map((l) => l.src.startsWith("/") ? l.src : `/${l.src}`),
  ...SCENE.books.map((b) => b.src.startsWith("/") ? b.src : `/${b.src}`),
  "/assets/ui/page-left.png",
  "/assets/ui/page-right.png",
  "/assets/ui/parchment.png",
  "/assets/ui/ui9.png",
  "/assets/ui/ui9-active.png",
  "/assets/ui/logo.png",
  "/assets/ui/openbook-uiux.png",
  "/assets/scene/fx-shafts.png",
  "/assets/scene/fx-bloom.png",
  "/assets/scene/fx-room-blur.png",
  "/assets/ui/cover-uiux.png",
];
