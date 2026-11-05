import { useContext, useSyncExternalStore } from "react";
import { PixelIcon } from "./PixelIcon";
import { StaticCtx } from "./ProjectGallery";
import type { PageCtx } from "./BookPage";

/** Interactive contents list. Hover/focus previews an entry on the facing page; click opens it. */
export function TableOfContents({ ctx, single }: { ctx: PageCtx; single?: boolean }) {
  const isStatic = useContext(StaticCtx);
  const { book, goEntry } = ctx;
  const featured = useSyncExternalStore(ctx.featured.subscribe, ctx.featured.get);
  const setFeatured = ctx.featured.set;
  return (
    <nav className={`toc${book.entries.length > 6 ? " toc--compact" : ""}`} aria-label={`${book.title} contents`}>
      <h2 className="toc__title">
        <PixelIcon name="sparkle" px={1} />
        {book.id === "journal" ? "Journal" : "Table of Contents"}
        <PixelIcon name="sparkle" px={1} />
      </h2>
      <p className="toc__intro">{book.intro}</p>
      <ol className="toc__list">
        {book.entries.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              className={`toc__item${i === featured ? " is-active" : ""}`}
              onMouseEnter={() => setFeatured(i)}
              onFocus={() => setFeatured(i)}
              onClick={() => goEntry(`${book.id}/${e.id}`)}
              tabIndex={isStatic ? -1 : 0}
              aria-current={i === featured ? "true" : undefined}
            >
              <span className={`toc__icon${e.logo ? " has-logo" : ""}`}>
                {e.logo ? <img src={e.logo} alt="" /> : <PixelIcon name={e.icon} px={book.entries.length > 6 ? 2 : 2.5} />}
              </span>
              <span className="toc__text">
                <strong>{e.title}</strong>
                <em>{e.subtitle}</em>
              </span>
              {single && <span className="toc__go" aria-hidden><PixelIcon name="right" px={1} /></span>}
            </button>
          </li>
        ))}
      </ol>
      {!single && <p className="toc__hint">Hover to preview · click to open · use ← → to turn pages</p>}
    </nav>
  );
}
