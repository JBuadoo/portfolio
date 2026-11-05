import { useCallback, useEffect, useRef, useState } from "react";
import { BOOKS, getBook } from "./data/books";
import { SCENE_ASSETS, T, modeAssets, setSceneMode, type Mode } from "./data/scene";
import { layoutBook } from "./lib/spreads";
import { parseHash, useHashChange, useMediaQuery, useReducedMotion, writeRoute, type Route } from "./lib/route";
import { preload, wait } from "./lib/motion";
import { LoadingScreen } from "./components/LoadingScreen";
import { Navigation, type NavKey } from "./components/Navigation";
import { StudyEnvironment } from "./components/StudyEnvironment";
import { MobileExperience } from "./components/MobileExperience";
import { OpenBook, type OpenBookHandle, type StageRect } from "./components/OpenBook";
import { PixelIcon } from "./components/PixelIcon";
import { ContactPhone } from "./components/ContactPhone";
import { ResumePaper } from "./components/ResumePaper";

interface OpenState {
  id: string;
  start: number;
  key: number;
}

function spreadFor(bookId: string, entry?: string, n?: number) {
  const book = getBook(bookId);
  if (!book) return 0;
  const l = layoutBook(book);
  if (!entry || l.entryStart[entry] === undefined) return 0;
  const e = book.entries.find((x) => x.id === entry)!;
  return l.entryStart[entry] + Math.min((n ?? 1) - 1, e.spreads.length - 1);
}

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

export default function App() {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 760px)");
  const vp = useViewport();
  const navFull = mobile ? 0 : vp.w >= 1100 ? 200 : 76;
  // the sidebar can be slid away; the room and open book then use the whole width
  const [navHidden, setNavHidden] = useState(() => {
    try {
      return localStorage.getItem("jb-nav-hidden") === "1";
    } catch {
      return false;
    }
  });
  const toggleNav = () =>
    setNavHidden((h) => {
      try {
        localStorage.setItem("jb-nav-hidden", h ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !h;
    });
  const navW = navHidden ? 0 : navFull;

  // lighting: day / sunset (default) / night - swaps pre-graded art and the page palette
  const [mode, setModeState] = useState<Mode>(() => {
    try {
      const m = localStorage.getItem("jb-mode");
      return m === "day" || m === "night" ? m : "sunset";
    } catch {
      return "sunset";
    }
  });
  setSceneMode(mode); // read by T() while this render runs
  const changeMode = useCallback((m: Mode) => {
    preload(modeAssets(m)).then(() => {
      // cross-fade: freeze a copy of the current room on top, swap the art underneath, fade the copy out
      const el = document.querySelector<HTMLElement>(".app__main > .study, .app__main > .mroom");
      if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const ghost = el.cloneNode(true) as HTMLElement;
        ghost.classList.add("mode-ghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.querySelectorAll("button, a").forEach((b) => b.setAttribute("tabindex", "-1"));
        el.parentElement!.appendChild(ghost);
        const done = () => ghost.remove();
        ghost.addEventListener("animationend", done);
        window.setTimeout(done, 900);
        // an open book fades its pages the same way
        const stage = document.querySelector<HTMLElement>(".ob .ob__stage");
        if (stage) {
          const g = stage.cloneNode(true) as HTMLElement;
          g.classList.add("mode-ghost", "mode-ghost--book");
          g.setAttribute("aria-hidden", "true");
          g.querySelectorAll("button, a").forEach((b) => b.setAttribute("tabindex", "-1"));
          stage.parentElement!.appendChild(g);
          const d2 = () => g.remove();
          g.addEventListener("animationend", d2);
          window.setTimeout(d2, 900);
        }
      }
      setModeState(m);
      try {
        localStorage.setItem("jb-mode", m);
      } catch {
        /* storage unavailable */
      }
    });
  }, []);
  const tabH = mobile ? 64 : 0;
  const stage: StageRect = { left: navW, top: 0, width: vp.w - navW, height: vp.h - tabH };

  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [intro, setIntro] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenState | null>(null);
  const [, setCurEntry] = useState<string | undefined>();
  const [landing, setLanding] = useState(false);
  const bookRef = useRef<OpenBookHandle>(null);
  const pending = useRef<{ id: string; start: number } | null>(null);
  const keySeq = useRef(0);
  const autoTimers = useRef<number[]>([]);
  const lastShelfBook = useRef<string | null>(null);

  // ------------------------------------------------------------ loading
  useEffect(() => {
    const min = wait(reduced ? 100 : 450);
    Promise.all([preload(SCENE_ASSETS, setProgress), min, document.fonts?.ready]).then(() => {
      setLoaded(true);
      window.setTimeout(() => setLoaderGone(true), reduced ? 50 : 450);
      // warm the cache (and decode) every book's art while idle, so first opens never stutter
      const ids = BOOKS.map((b) => b.id);
      const art = window.matchMedia("(max-width: 760px)").matches
        ? ids.flatMap((id) => [`assets/ui/mbook-${id}.png`, `assets/ui/mcover-${id}.png`]).concat("assets/ui/page-single.png")
        : ids.flatMap((id) => [`assets/ui/openbook-${id}-l.png`, `assets/ui/openbook-${id}-r.png`, `assets/ui/cover-${id}.png`]);
      const idle = (cb: () => void) =>
        "requestIdleCallback" in (window as any) ? (window as any).requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 300);
      idle(() =>
        art.forEach((src) => {
          const im = new Image();
          im.src = src;
          im.decode?.().catch(() => undefined);
        }),
      );
    });
  }, [reduced]);

  const cancelAuto = () => {
    autoTimers.current.forEach(clearTimeout);
    autoTimers.current = [];
    setHighlight(null);
  };

  // ------------------------------------------------------------ open / close
  const openBook = useCallback(
    (id: string, start = 0, push = true) => {
      const book = getBook(id);
      if (!book) return;
      cancelAuto();
      if (open) {
        if (open.id === id) {
          bookRef.current?.goTo(start);
          return;
        }
        pending.current = { id, start };
        bookRef.current?.close();
        return;
      }
      lastShelfBook.current = id;
      setLanding(false);
      const s = layoutBook(book).spreads[start];
      setCurEntry(s?.entryId);
      writeRoute({ book: id, entry: s?.entryId, n: s?.n }, push);
      setOpen({ id, start, key: ++keySeq.current });
    },
    [open],
  );

  const closeBook = useCallback(() => {
    cancelAuto();
    pending.current = null;
    if (open) bookRef.current?.close();
  }, [open]);

  const onClosed = useCallback(() => {
    const closedId = open?.id;
    setOpen(null);
    window.setTimeout(() => setLanding(false), 260);
    setCurEntry(undefined);
    const next = pending.current;
    pending.current = null;
    if (next) {
      // let the shelf book reappear for a frame before the next flight
      window.setTimeout(() => {
        lastShelfBook.current = next.id;
        setLanding(false);
        const b = getBook(next.id)!;
        const s = layoutBook(b).spreads[next.start];
        setCurEntry(s?.entryId);
        writeRoute({ book: next.id, entry: s?.entryId, n: s?.n }, true);
        setOpen({ id: next.id, start: next.start, key: ++keySeq.current });
      }, 40);
    } else {
      writeRoute({}, true);
      // restore focus to the book that was closed once the shelf is interactive again
      let tries = 0;
      const refocus = () => {
        const el = document.getElementById(`shelf-book-${closedId}`);
        el?.focus({ preventScroll: true });
        if (document.activeElement !== el && tries++ < 20) requestAnimationFrame(refocus);
      };
      requestAnimationFrame(refocus);
    }
  }, [open]);

  const onSpread = useCallback(
    (spread: number) => {
      if (!open) return;
      const book = getBook(open.id)!;
      const s = layoutBook(book).spreads[spread];
      setCurEntry(s?.entryId);
      writeRoute({ book: open.id, entry: s?.entryId, n: s?.n });
    },
    [open],
  );

  const [overlay, setOverlay] = useState<null | "resume" | "contact">(null);

  const onEntryLink = useCallback((ref: string) => {
    if (ref === "journal/contact") return setOverlay("contact");
    if (ref === "journal/resume-paper") return setOverlay("resume");
    const [bid, eid] = ref.split("/");
    openBook(bid, spreadFor(bid, eid));
  }, [openBook]);

  // ------------------------------------------------------------ intro: auto-open UI/UX
  useEffect(() => {
    if (!loaded) return;
    const route = parseHash();
    const t = (ms: number, f: () => void) => autoTimers.current.push(window.setTimeout(f, reduced ? 0 : ms));
    setIntro(true);
    t(1100, () => setIntro(false));
    if (route.book && getBook(route.book)) {
      const sp = spreadFor(route.book, route.entry, route.n);
      const id = route.book;
      t(450, () => openBook(id, sp, false));
    } else if (route.empty) {
      t(650, () => setHighlight("uiux"));
      t(1250, () => {
        setHighlight(null);
        openBook("uiux", 0, false);
      });
    }
    return () => autoTimers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ------------------------------------------------------------ back / forward
  useHashChange(
    useCallback(
      (r: Route) => {
        if (r.book && getBook(r.book)) openBook(r.book, spreadFor(r.book, r.entry, r.n), false);
        else if (open) {
          pending.current = null;
          bookRef.current?.close();
        }
      },
      [open, openBook],
    ),
  );

  // ------------------------------------------------------------ navigation
  const onNav = (k: NavKey) => {
    if (k === "resume" || k === "contact") return setOverlay(k);
    setOverlay(null);
    if (k === "home") return closeBook();
    if (k === "projects") return openBook("uiux", 0);
    if (k === "about") return openBook("journal", 0); // journal opens at its contents
  };
  const active: NavKey = overlay
    ? overlay
    : !open
      ? "home"
      : open.id === "journal"
        ? "about"
        : "projects";

  const onShelfOpen = (id: string) => openBook(id, 0);
  const openBookObj = open ? getBook(open.id)! : null;

  return (
    <div
      className={`app${mobile ? " is-mobile" : ""}${open ? " has-book" : ""}${navHidden && !mobile ? " nav-hidden" : ""}`}
      data-mode={mode}
      style={{
        ["--nav-w" as string]: `${navW}px`,
        ["--nav-full" as string]: `${navFull}px`,
        ["--img-page-l" as string]: `url(${T("assets/ui/page-left.png")})`,
        ["--img-page-r" as string]: `url(${T("assets/ui/page-right.png")})`,
        ["--img-page-s" as string]: `url(${T("assets/ui/page-single.png")})`,
      }}
    >
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById(`shelf-book-${BOOKS[0].id}`)?.focus(); }}>
        Skip to the bookshelf
      </a>
      <Navigation active={active} onNav={onNav} mobile={mobile} hidden={navHidden && !mobile} mode={mode} onMode={changeMode} />
      {!mobile && (
        <button
          type="button"
          className="nav-toggle"
          onClick={toggleNav}
          aria-expanded={!navHidden}
          aria-label={navHidden ? "Show the menu" : "Hide the menu"}
          title={navHidden ? "Show the menu" : "Hide the menu"}
        >
          <PixelIcon name={navHidden ? "right" : "left"} px={2} />
        </button>
      )}
      <main id="main" className="app__main" aria-hidden={!!open || undefined} inert={open ? true : undefined}>
        <h1 className="sr-only">Joseph K. Buadoo - Interactive Designer &amp; Creative Developer</h1>
        {loaded &&
          (mobile ? (
            <MobileExperience key={mode} outBook={open && !landing ? open.id : null}
              landingBook={landing ? (open?.id ?? lastShelfBook.current) : null} highlight={highlight} intro={intro} onOpen={onShelfOpen} />
          ) : (
            <StudyEnvironment
              key={mode}
              navW={navW}
              outBook={open && !landing ? open.id : null}
              landingBook={landing ? (open?.id ?? lastShelfBook.current) : null}
              highlight={highlight}
              intro={intro}
              dimmed={!!open && !landing}
              reduced={reduced}
              onOpen={onShelfOpen}
            />
          ))}
      </main>
      {open && openBookObj && (
        <OpenBook
          key={open.key}
          ref={bookRef}
          book={openBookObj}
          start={open.start}
          single={mobile}
          reduced={reduced}
          stage={stage}
          origin={() => document.getElementById(`shelf-book-${open.id}`)}
          onSpread={onSpread}
          onEntryLink={onEntryLink}
          onClosed={onClosed}
          onLanding={() => setLanding(true)}
        />
      )}
      {overlay === "contact" && <ContactPhone onClose={() => setOverlay(null)} />}
      {overlay === "resume" && <ResumePaper onClose={() => setOverlay(null)} />}
      {!loaderGone && <LoadingScreen progress={progress} leaving={loaded} />}
    </div>
  );
}
