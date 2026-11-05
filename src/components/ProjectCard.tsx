import { useContext, useSyncExternalStore } from "react";
import { PixelIcon } from "./PixelIcon";
import { StaticCtx } from "./ProjectGallery";
import type { PageCtx } from "./BookPage";

/** The featured project on the contents spread (mirrors the hovered TOC entry). */
export function ProjectCard({ ctx }: { ctx: PageCtx }) {
  const isStatic = useContext(StaticCtx);
  const featured = useSyncExternalStore(ctx.featured.subscribe, ctx.featured.get);
  const entry = ctx.book.entries[featured] ?? ctx.book.entries[0];
  return (
    <article className="pcard" aria-live="polite">
      <div className="pcard__badge">
        <span className="pcard__spark s1" />
        <span className="pcard__spark s2" />
        <span className="pcard__spark s3" />
        <div className="pcard__tile">{entry.logo ? <img src={entry.logo} alt="" /> : <PixelIcon name={entry.icon} px={7} />}</div>
      </div>
      <h2 className="pcard__title">{entry.title}</h2>
      <p className="pcard__sub">
        <PixelIcon name="sparkle" px={1} /> {entry.subtitle} <PixelIcon name="sparkle" px={1} />
      </p>
      <div className="pcard__rule" aria-hidden />
      {entry.tagline && <p className="pcard__tagline">{entry.tagline}</p>}
      {entry.blurb && <p className="pcard__blurb">{entry.blurb}</p>}
      <button type="button" className="px-btn px-btn--link pcard__cta" onClick={() => ctx.goEntry(`${ctx.book.id}/${entry.id}`)} tabIndex={isStatic ? -1 : 0}>
        <span>{ctx.book.id === "journal" ? `View ${entry.title}` : "View Project"}</span>
        <PixelIcon name="right" px={2} />
      </button>
      <p className="pcard__pages">
        {entry.spreads.length * 2} pages
      </p>
    </article>
  );
}
