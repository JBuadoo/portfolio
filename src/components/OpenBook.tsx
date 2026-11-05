import { type PointerEvent as RPointerEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Book, Img } from "../data/types";
import { SCENE, themeVars, T } from "../data/scene";
import { layoutBook, collectImages, type PageContent } from "../lib/spreads";
import { animate, EASE_IN_OUT, EASE_OUT, EASE_PAGE } from "../lib/motion";
import { BookPage, makeFeaturedStore, type PageCtx } from "./BookPage";
import { PixelIcon } from "./PixelIcon";
import { LightboxCtx, Lightbox, StaticCtx } from "./ProjectGallery";

export interface StageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface OpenBookHandle {
  close: () => Promise<void>;
  goTo: (spread: number) => void;
}

interface Props {
  book: Book;
  /** spread index (desktop) to open at */
  start: number;
  single: boolean;
  reduced: boolean;
  stage: StageRect;
  /** returns the shelf element the book flies out of / back into */
  origin: () => HTMLElement | null;
  onSpread: (spread: number) => void;
  onEntryLink: (ref: string) => void;
  onClosed: () => void;
  /** called when the returning book is about to touch down on the shelf */
  onLanding?: () => void;
}

type Phase = "fly" | "opening" | "read" | "closing";
const CONTROLS_H = 64;
/** desktop: the controls float over the bottom edge of the stage, so the book only reserves this much */
const CONTROLS_RESERVE = 44;

function useGeometry(stage: StageRect, single: boolean) {
  return useMemo(() => {
    // the book is an illustrated pixel sprite, so it scales by a single factor u (CSS px per art px)
    if (single) {
      const M = SCENE.mbook;
      const u = Math.min((stage.width - 8) / M.W, (stage.height - CONTROLS_H - 8) / M.H);
      return { u, bw: M.W * u, bh: M.H * u, spreadW: M.W * u };
    }
    const B = SCENE.openbook;
    const u = Math.min((stage.width - 16) / B.W, (stage.height - CONTROLS_RESERVE - 8) / B.H);
    return { u, bw: B.S * u, bh: B.H * u, spreadW: B.W * u };
  }, [stage.width, stage.height, single]);
}

type Box = number[];
const px = (b: Box, u: number) => ({ left: b[0] * u, top: b[1] * u, width: b[2] * u, height: b[3] * u });

export const OpenBook = forwardRef<OpenBookHandle, Props>(function OpenBook(
  { book, start, single, reduced, stage, origin, onSpread, onEntryLink, onClosed, onLanding },
  ref,
) {
  const layout = layoutBook(book);
  const { u, bw, bh, spreadW } = useGeometry(stage, single);

  // "cur" is a spread index on desktop and a page index on phones
  const toUnit = useCallback(
    (spread: number) => (single ? Math.max(0, layout.pages.findIndex((p) => p.spread === spread)) : spread),
    [single, layout],
  );
  const [cur, setCur] = useState(() => toUnit(start));
  const [turn, setTurn] = useState<{ dir: 1 | -1; to: number } | null>(null);
  const [phase, setPhase] = useState<Phase>(reduced ? "read" : "fly");
  const featured = useMemo(() => makeFeaturedStore(0), []);
  const [lightbox, setLightbox] = useState<Img | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const closing = useRef<Promise<void> | null>(null);

  const total = single ? layout.pages.length : layout.spreads.length;
  const spreadOf = (u: number) => (single ? layout.pages[u]?.spread ?? 0 : u);

  // report spread changes for the URL
  useEffect(() => {
    onSpread(spreadOf(cur));
    // keep the featured card in sync when landing on an entry
    const s = layout.spreads[spreadOf(cur)];
    if (s?.entryId) featured.set(Math.max(0, book.entries.findIndex((e) => e.id === s.entryId)));
    // preload neighbours so leaves have their images ready
    const near = [cur - 1, cur + 1, cur + 2].filter((u) => u >= 0 && u < total);
    near.forEach((u) => {
      const conts = single ? [layout.pages[u].content] : [layout.spreads[u].left, layout.spreads[u].right];
      conts.flatMap(collectImages).forEach((src) => {
        const im = new Image();
        im.src = src;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  // ------------------------------------------------------------------ flight
  // Maps the closed cover's board onto the shelf sprite. Shelf books are drawn turned slightly
  // (spine side visible on the left), so the flight starts/ends with a matching rotateY.
  const flightFrames = useCallback(
    (el: HTMLElement | null, toShelf: boolean): Keyframe[] | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width) return null;
      const isShelf = el.classList.contains("shelf-book");
      // the flying cover becomes an exact copy of the shelf sprite (side sliver included), so it
      // lands flat-on like the shelf books instead of turned
      const turn = 0;
      // shelf sprite: cover face is the left 48 of 56 px; board of the closed cover sprite, in art px: desktop 163x200 at y+3, phone (W-4)x(H-12) at y+4
      const boardW = single ? SCENE.mbook.W - 4 : 163;
      const boardH = single ? SCENE.mbook.H - 12 : 200;
      const boardDy = single ? -2 : -5; // board centre vs sprite centre
      const faceW = isShelf ? r.width * (48 / 56) : r.width; // land on the cover, not the side sliver
      const cx = r.left + faceW / 2;
      const cy = r.top + r.height / 2;
      const tx = stage.left + stage.width / 2;
      const ty = stage.top + (stage.height - (single ? CONTROLS_H : CONTROLS_RESERVE)) / 2;
      const off = single ? 0 : -bw / 2;
      const sx = faceW / (boardW * u);
      const sy = r.height / (boardH * u);
      const dx = cx - tx;
      const dy = cy - ty - boardDy * u * sy;
      const f = (x: number, y: number, ry: number, rz: number, a: number, b: number, o = 1, offset?: number): Keyframe => ({
        transform: `translate(${x}px, ${y}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${a}, ${b})`,
        opacity: o,
        ...(offset !== undefined ? { offset } : {}),
      });
      const mid = (v: number) => (v + 1) * 0.55;
      if (!toShelf) {
        return [
          f(dx + off, dy, turn, 0, sx, sy, 1, 0),
          f(dx + off, dy - 12, turn * 0.4, 0, sx * 1.06, sy * 1.06, 1, 0.2),
          f(dx * 0.3 + off, dy * 0.3 - 34, -10, -2, mid(sx), mid(sy), 1, 0.66),
          f(off, 0, 0, 0, 1, 1, 1, 1),
        ];
      }
      return [
        f(off, 0, 0, 0, 1, 1, 1, 0),
        f(dx * 0.3 + off, dy * 0.3 - 30, -8, -2, mid(sx), mid(sy), 1, 0.42),
        f(dx + off, dy - 10, turn * 0.7, 0, sx * 1.05, sy * 1.05, 1, 0.84),
        f(dx + off, dy, turn, 0, sx, sy, 0, 1),
      ];
    },
    [stage, single, bw, u],
  );

  // ------------------------------------------------------------------ opening sequence
  useLayoutEffect(() => {
    if (reduced) {
      animate(rootRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      return;
    }
    let cancelled = false;
    const run = async () => {
      busy.current = true;
      const off = single ? 0 : -bw / 2;
      const frames = flightFrames(origin(), false);
      animate(backdropRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out" });
      const shelfLook = coverRef.current?.querySelector<HTMLElement>(".cover__shelf") ?? null;
      if (frames)
        animate(shelfLook, [{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }], { duration: 640, fill: "forwards" });
      if (frames) await animate(bookRef.current, frames, { duration: 640, easing: EASE_OUT });
      else await animate(bookRef.current, [{ transform: `translateX(${off}px) scale(.6)`, opacity: 0 }, { transform: `translateX(${off}px)`, opacity: 1 }], { duration: 420, easing: EASE_OUT });
      if (cancelled) return;
      setPhase("opening");
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (phase !== "opening") return;
    const off = single ? 0 : -bw / 2;
    const dur = 700;
    const coverFrames: Keyframe[] = single
      ? [
          { transform: "rotateY(0deg)", opacity: 1 },
          { transform: "rotateY(-120deg)", opacity: 1, offset: 0.6 },
          { transform: "rotateY(-180deg)", opacity: 0 },
        ]
      : [
          { transform: "rotateY(0deg) translateZ(1px)" },
          { transform: "rotateY(-95deg) translateZ(30px)", offset: 0.5 },
          { transform: "rotateY(-180deg) translateZ(1px)" },
        ];
    Promise.all([
      animate(coverRef.current, coverFrames, { duration: dur, easing: EASE_IN_OUT }),
      animate(bookRef.current, [{ transform: `translateX(${off}px)` }, { transform: "translateX(0px)" }], { duration: dur, easing: EASE_IN_OUT }),
    ]).then(() => {
      setPhase("read");
      busy.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "read") {
      bookRef.current?.style.removeProperty("transform");
      rootRef.current?.querySelector<HTMLElement>(".ob__book")?.focus({ preventScroll: true });
    }
  }, [phase]);

  // ------------------------------------------------------------------ closing
  const close = useCallback((): Promise<void> => {
    if (closing.current) return closing.current;
    const p = (async () => {
      setLightbox(null);
      while (busy.current) await new Promise((r) => setTimeout(r, 50));
      busy.current = true;
      if (reduced) {
        await animate(rootRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
        onClosed();
        return;
      }
      setTurn(null);
      setPhase("closing");
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const off = single ? 0 : -bw / 2;
      const dur = 520;
      const coverFrames: Keyframe[] = single
        ? [
            { transform: "rotateY(-180deg)", opacity: 0 },
            { transform: "rotateY(-120deg)", opacity: 1, offset: 0.4 },
            { transform: "rotateY(0deg)", opacity: 1 },
          ]
        : [
            { transform: "rotateY(-180deg) translateZ(1px)" },
            { transform: "rotateY(-85deg) translateZ(30px)", offset: 0.5 },
            { transform: "rotateY(0deg) translateZ(1px)" },
          ];
      await Promise.all([
        animate(coverRef.current, coverFrames, { duration: dur, easing: EASE_IN_OUT }),
        animate(bookRef.current, [{ transform: "translateX(0px)" }, { transform: `translateX(${off}px)` }], { duration: dur, easing: EASE_IN_OUT }),
      ]);
      const frames = flightFrames(origin(), true);
      const flyDur = 620;
      animate(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: flyDur * 0.9, easing: "ease-in" });
      // reveal the shelf book just before touchdown so the two cross-fade instead of popping
      const land = window.setTimeout(() => onLanding?.(), flyDur * 0.6);
      const shelfLook = coverRef.current?.querySelector<HTMLElement>(".cover__shelf") ?? null;
      if (frames)
        animate(shelfLook, [{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1, offset: 0.62 }, { opacity: 1 }], { duration: flyDur, fill: "forwards" });
      if (frames) await animate(bookRef.current, frames, { duration: flyDur, easing: EASE_IN_OUT });
      else await animate(bookRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 });
      window.clearTimeout(land);
      onLanding?.();
      onClosed();
    })();
    closing.current = p;
    return p;
  }, [reduced, single, bw, flightFrames, origin, onClosed, onLanding]);

  // ------------------------------------------------------------------ page turning
  const goTo = useCallback(
    (to: number) => {
      if (phase !== "read" || busy.current || to === cur || to < 0 || to >= total) return;
      if (reduced) {
        setCur(to);
        return;
      }
      busy.current = true;
      setTurn({ dir: to > cur ? 1 : -1, to });
    },
    [phase, cur, total, reduced],
  );

  useLayoutEffect(() => {
    if (!turn) return;
    const leaf = leafRef.current;
    const dur = 560;
    let frames: Keyframe[];
    if (single) {
      frames =
        turn.dir === 1
          ? [
              { transform: "rotateY(0deg)", opacity: 1 },
              { transform: "rotateY(-110deg)", opacity: 1, offset: 0.65 },
              { transform: "rotateY(-160deg)", opacity: 0 },
            ]
          : [
              { transform: "rotateY(-160deg)", opacity: 0 },
              { transform: "rotateY(-110deg)", opacity: 1, offset: 0.35 },
              { transform: "rotateY(0deg)", opacity: 1 },
            ];
    } else {
      frames =
        turn.dir === 1
          ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-90deg) translateZ(14px)", offset: 0.5 }, { transform: "rotateY(-180deg)" }]
          : [{ transform: "rotateY(0deg)" }, { transform: "rotateY(90deg) translateZ(14px)", offset: 0.5 }, { transform: "rotateY(180deg)" }];
    }
    animate(leaf, frames, { duration: dur, easing: EASE_PAGE }).then(() => {
      setCur(turn.to);
      setTurn(null);
      busy.current = false;
    });
  }, [turn, single]);

  // ------------------------------------------------------------------ input
  useImperativeHandle(ref, () => ({ close, goTo: (spread: number) => goTo(toUnit(spread)) }), [close, goTo, toUnit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (lightbox) {
        if (e.key === "Escape") setLightbox(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(cur + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(cur - 1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "Escape") close();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, cur, close, lightbox]);

  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: RPointerEvent) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: RPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 55 && Math.abs(dy) < 70) goTo(cur + (dx < 0 ? 1 : -1));
  };

  // ------------------------------------------------------------------ rendering helpers
  const goEntry = useCallback(
    (refStr: string) => {
      const [bid, eid] = refStr.split("/");
      if (bid !== book.id) {
        onEntryLink(refStr);
        return;
      }
      const s = layout.entryStart[eid];
      if (s !== undefined) goTo(toUnit(s));
    },
    [book.id, layout, goTo, toUnit, onEntryLink],
  );
  const ctx: PageCtx = useMemo(
    () => ({ book, featured, goEntry, turn: (d: 1 | -1) => goTo(cur + d), canPrev: cur > 0, canNext: cur < total - 1 }),
    [book, featured, goEntry, goTo, cur, total],
  );
  // warm every project logo used by the contents page so hover previews never wait on the network
  useEffect(() => {
    book.entries.forEach((e) => {
      if (!e.logo) return;
      const im = new Image();
      im.src = e.logo;
      im.decode?.().catch(() => undefined);
    });
  }, [book]);

  const pageNo = (n: number, side: "left" | "right") => (single ? n + 1 : n * 2 + (side === "left" ? 1 : 2));
  const contentOf = (n: number, side: "left" | "right"): PageContent =>
    single ? layout.pages[n].content : side === "left" ? layout.spreads[n].left : layout.spreads[n].right;

  const pageBoxes = (side: "left" | "right") => {
    if (single) return { page: SCENE.mbook.page, content: SCENE.mbook.content };
    const g = side === "left" ? SCENE.openbook.left : SCENE.openbook.right;
    return { page: [g.page[0] - (side === "right" ? SCENE.openbook.S : 0), g.page[1], g.page[2], g.page[3]], content: g.content };
  };
  const page = (n: number, side: "left" | "right", key: string, isStatic = false) => {
    const bx = pageBoxes(side);
    return (
      <StaticCtx.Provider value={isStatic} key={key}>
        <BookPage
          content={contentOf(n, side)}
          side={single ? "right" : side}
          pageNo={pageNo(n, side)}
          ctx={ctx}
          single={single}
          style={px(bx.page, u)}
          innerStyle={px(bx.content, u)}
        />
      </StaticCtx.Provider>
    );
  };

  // what the static halves show (while a leaf is turning they show the pages "underneath")
  let leftU = cur;
  let rightU = cur;
  if (turn && !single) {
    if (turn.dir === 1) rightU = turn.to;
    else leftU = turn.to;
  }
  const singleU = turn && single ? (turn.dir === 1 ? turn.to : cur) : cur;

  const showCover = phase === "fly" || phase === "opening" || phase === "closing";
  const hideLeft = !single && showCover;

  const indicator = single
    ? `Page ${cur + 1} of ${total}`
    : `Pages ${cur * 2 + 1}–${cur * 2 + 2} of ${total * 2}`;
  const entryTitle = book.entries.find((e) => e.id === layout.spreads[spreadOf(cur)]?.entryId)?.title;

  return (
    <div
      ref={rootRef}
      className={`ob${single ? " ob--single" : ""} is-${phase}`}
      style={{ ...themeVars(book.id), ["--bw" as string]: `${bw}px`, ["--bh" as string]: `${bh}px`, ["--u" as string]: u }}
      role="dialog"
      aria-label={`${book.title} book`}
    >
      <div ref={backdropRef} className="ob__backdrop" style={stage} onClick={() => phase === "read" && close()} aria-hidden />
      <div className="ob__stage" style={stage}>
        <div className="ob__persp" style={{ height: stage.height - (single ? CONTROLS_H : CONTROLS_RESERVE) }}>
          <div
            ref={bookRef}
            className={`ob__book${turn || phase !== "read" ? " is-3d" : ""}`}
            tabIndex={-1}
            style={{ width: spreadW, height: bh, transformOrigin: single ? "50% 50%" : "75% 50%" }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            aria-roledescription="book"
          >
            <LightboxCtx.Provider value={setLightbox}>
              {!single && (
                <div className="ob__half ob__half--left" style={{ visibility: hideLeft ? "hidden" : undefined }} aria-hidden={hideLeft || !!turn}>
                  <div className="ob__base ob__base--l" />
                  {page(leftU, "left", `l${leftU}`)}
                </div>
              )}
              <div className="ob__half ob__half--right" aria-hidden={showCover || !!turn}>
                <div className={`ob__base ${single ? "ob__base--m" : "ob__base--r"}`} />
                {page(single ? singleU : rightU, "right", `r${single ? singleU : rightU}`)}
              </div>

              {turn && (
                <div
                  ref={leafRef}
                  className={`ob__leaf ${single ? "is-single" : turn.dir === 1 ? "is-fwd" : "is-back"}`}
                  aria-hidden
                >
                  <div className="ob__face ob__face--front">
                    {single
                      ? page(turn.dir === 1 ? cur : turn.to, "right", "lf", true)
                      : turn.dir === 1
                        ? page(cur, "right", "lf", true)
                        : page(cur, "left", "lf", true)}
                    <div className="ob__shade" />
                  </div>
                  {!single && (
                    <div className="ob__face ob__face--back">
                      {turn.dir === 1 ? page(turn.to, "left", "lb", true) : page(turn.to, "right", "lb", true)}
                      <div className="ob__shade" />
                    </div>
                  )}
                </div>
              )}

              {showCover && (
                <div ref={coverRef} className="ob__cover" aria-hidden style={phase === "closing" ? { transform: single ? "rotateY(-180deg)" : "rotateY(-180deg) translateZ(1px)", opacity: single ? 0 : 1 } : undefined}>
                  <div className="ob__face ob__face--front">
                    <BookCover book={book} u={u} single={single} />
                  </div>
                  {!single && (
                    <div className="ob__face ob__face--back">
                      <div className="ob__base ob__base--l" />
                      {page(cur, "left", "cb", true)}
                    </div>
                  )}
                </div>
              )}
            </LightboxCtx.Provider>
          </div>
        </div>

        <div className={`ob__controls${phase === "read" ? "" : " is-hidden"}`} role="toolbar" aria-label="Book navigation">
          <button type="button" className="px-btn px-btn--dark" onClick={() => goTo(cur - 1)} disabled={cur === 0} aria-label="Previous page">
            <PixelIcon name="left" px={2} />
            <span className="ob__ctl-label">Prev</span>
          </button>
          <button type="button" className="px-btn px-btn--dark" onClick={() => goTo(0)} disabled={cur === 0} aria-label="Table of contents">
            <PixelIcon name="list" px={2} />
            <span className="ob__ctl-label">Contents</span>
          </button>
          <div className="ob__indicator" aria-live="polite">
            <strong>{entryTitle ?? book.title}</strong>
            <span>{indicator}</span>
          </div>
          <button type="button" className="px-btn px-btn--dark" onClick={() => goTo(cur + 1)} disabled={cur >= total - 1} aria-label="Next page">
            <span className="ob__ctl-label">Next</span>
            <PixelIcon name="right" px={2} />
          </button>
          <button type="button" className="px-btn px-btn--dark px-btn--close" onClick={() => close()} aria-label="Close book and return to the bookshelf">
            <PixelIcon name="close" px={2} />
            <span className="ob__ctl-label">Close</span>
          </button>
        </div>
      </div>
      {lightbox && <Lightbox img={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
});

/** The closed front cover: illustrated sprite + bold title (matches the shelf book). */
/** Shelf-sprite title size (same formula as PortfolioBook). */
function shelfTitleSize(cover: string) {
  const longest = Math.max(...cover.split("\n").map((l) => l.length));
  return Math.min(7, 340 / (longest * 7));
}

export function BookCover({ book, u, single }: { book: Book; u: number; single?: boolean }) {
  const lines = book.cover.split("\n");
  // the shelf sprite (56x86, cover face = left 48px) stretched over the cover board, so the
  // flying book can cross-fade into exactly what sits on the shelf
  const board = single ? { x: 2, y: 4, w: SCENE.mbook.W - 4, h: SCENE.mbook.H - 12 } : { x: 0, y: 3, w: 163, h: 202 };
  const shelf = SCENE.books.find((b) => b.id === book.id);
  const longest = Math.max(...lines.map((l) => l.length));
  // title box is ~120 art px wide; bold glyphs advance ~0.7em
  const fs = Math.min(20, 1150 / (longest * 7)) * u;
  return (
    <div className={`cover${single ? " cover--m" : ""}`}>
      <div className="cover__title" style={{ fontSize: fs }}>
        {lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="cover__name" style={{ fontSize: Math.max(10, Math.round(u * 3)) }}>
        Joseph K. Buadoo
      </div>
      {shelf && (
        <div
          className="shelf-book cover__shelf"
          aria-hidden
          style={{
            left: board.x * u,
            top: board.y * u,
            width: 56,
            height: 86,
            transform: `scale(${(board.w * u) / 48}, ${(board.h * u) / 86})`,
            ["--s" as string]: 1,
            ["--fs" as string]: shelfTitleSize(book.cover),
          }}
        >
          <span className="shelf-book__body">
            <img src={T(shelf.src)} alt="" draggable={false} className="px" />
            <span className="shelf-book__title">
              {book.cover.split("\n").map((l) => (
                <span key={l}>{l}</span>
              ))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
