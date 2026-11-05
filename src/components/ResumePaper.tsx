import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LINKS, getBook } from "../data/books";
import type { Block } from "../data/types";
import { PixelIcon } from "./PixelIcon";

/** Resume opened from the menu: loose paper sheets you can sift through.
 *  Content comes from the journal's Resume and Skills entries (one source of truth). */
function sheetsFromJournal(): { title: string; blocks: Block[] }[] {
  const j = getBook("journal");
  const r = j?.entries.find((e) => e.id === "resume");
  const s = j?.entries.find((e) => e.id === "skills");
  const keep = (b: Block) => b.t !== "links";
  const out: { title: string; blocks: Block[] }[] = [];
  r?.spreads.forEach((sp) => {
    out.push({ title: "Experience", blocks: sp.left.filter(keep) });
    if (sp.right.length) out.push({ title: "Experience", blocks: sp.right.filter(keep) });
  });
  s?.spreads.forEach((sp) => out.push({ title: "Skills & Certifications", blocks: [...sp.left, ...sp.right].filter(keep) }));
  return out;
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "kicker":
            return /^(skills|experience)$/i.test(b.text) ? null : <h4 key={i} className="rp__sub">{b.text}</h4>;
          case "h":
            return <h3 key={i} className="rp__h">{b.text}</h3>;
          case "meta":
            return (
              <p key={i} className="rp__meta">
                {b.rows.map(([a, c], k) => (
                  <span key={k}><strong>{a}</strong><em>{c}</em></span>
                ))}
              </p>
            );
          case "p":
            return <p key={i} className="rp__p">{b.text}</p>;
          case "tags":
            return (
              <div key={i} className="rp__tags">
                {b.title && <h4>{b.title}</h4>}
                <p>{b.items.join(" · ")}</p>
              </div>
            );
          case "list":
            return (
              <ul key={i} className="rp__list">
                {b.items.map((it, k) => <li key={k}>{it}</li>)}
              </ul>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export function ResumePaper({ onClose: done }: { onClose: () => void }) {
  const sheets = useMemo(sheetsFromJournal, []);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [closing, setClosing] = useState(false);
  const go = (d: 1 | -1) => {
    const n = i + d;
    if (n < 0 || n >= sheets.length) return;
    setDir(d);
    setI(n);
  };
  const onClose = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    setClosing(true);
    window.setTimeout(done, 240);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.key === "Escape") onClose();
        else go(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  });

  const cur = sheets[i];
  return createPortal(
    <div className={`rpaper-view${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Resume" onClick={onClose}>
      <div className="rpaper" onClick={(e) => e.stopPropagation()}>
        {/* the sheets still under the top one */}
        {sheets.slice(i + 1, i + 3).map((_, k) => (
          <div key={`u${k}`} className={`rpaper__under u${k + 1}`} aria-hidden />
        ))}
        <article key={i} className={`rpaper__sheet ${dir > 0 ? "from-right" : "from-left"}`} aria-live="polite">
          <header className="rp__head">
            <div>
              <h2>Joseph K. Buadoo</h2>
              <p>Interactive Designer &amp; Creative Developer · {LINKS.emailText}</p>
            </div>
            <span className="rp__page">{i + 1} / {sheets.length}</span>
          </header>
          <p className="rp__section">{cur.title}</p>
          <div className="rp__body">
            <Blocks blocks={cur.blocks} />
          </div>
        </article>
      </div>
      <div className="rpaper__ctl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="px-btn" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous sheet">
          <PixelIcon name="left" px={2} />
        </button>
        <a className="px-btn" href={LINKS.resume} download>
          <PixelIcon name="download" px={2} /> <span>Download PDF</span>
        </a>
        <button type="button" className="px-btn" onClick={onClose} autoFocus>
          <PixelIcon name="close" px={2} /> <span>Close</span>
        </button>
        <button type="button" className="px-btn" onClick={() => go(1)} disabled={i === sheets.length - 1} aria-label="Next sheet">
          <PixelIcon name="right" px={2} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
