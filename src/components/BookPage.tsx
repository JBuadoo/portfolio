import type React from "react";
import { memo, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Block, Book } from "../data/types";
import { PixelIcon } from "./PixelIcon";
import { Picture, ProjectGallery, StaticCtx } from "./ProjectGallery";
import { AudioSnippets } from "./AudioSnippets";
import type { PageContent } from "../lib/spreads";
import { TableOfContents } from "./TableOfContents";
import { ProjectCard } from "./ProjectCard";

/** Tiny external store so hovering the contents only re-renders the list + featured card. */
export interface FeaturedStore {
  get: () => number;
  set: (i: number) => void;
  subscribe: (cb: () => void) => () => void;
}
export function makeFeaturedStore(init = 0): FeaturedStore {
  let v = init;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (i) => {
      if (i === v) return;
      v = i;
      subs.forEach((f) => f());
    },
    subscribe: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

export interface PageCtx {
  book: Book;
  featured: FeaturedStore;
  /** turn one page/spread (used by the folded corners) */
  turn?: (dir: 1 | -1) => void;
  canPrev?: boolean;
  canNext?: boolean;
  goEntry: (ref: string) => void;
}

interface Props {
  content: PageContent;
  side: "left" | "right";
  pageNo: number;
  ctx: PageCtx;
  single?: boolean;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}

/** One parchment page: border, texture, scrollable content and a page number. */
export const BookPage = memo(function BookPage({ content, side, pageNo, ctx, single, style, innerStyle }: Props) {
  const isStatic = useContext(StaticCtx);
  const innerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = innerRef.current;
    if (!el || isStatic) return;
    const check = () => {
      const m = el.scrollHeight - el.clientHeight - el.scrollTop > 6;
      setMore(m);
      el.classList.toggle("is-end", !m);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const t = window.setTimeout(check, 400); // images may change the height
    return () => {
      el.removeEventListener("scroll", check);
      window.clearTimeout(t);
    };
  }, [isStatic, content]);
  const fold = (dir: 1 | -1, where: "left" | "right") =>
    ctx.turn && (dir === 1 ? ctx.canNext : ctx.canPrev) ? (
      <button
        type="button"
        className={`page__fold page__fold--${where}`}
        onClick={() => ctx.turn!(dir)}
        tabIndex={isStatic ? -1 : 0}
        aria-label={dir === 1 ? "Next page (folded corner)" : "Previous page (folded corner)"}
      />
    ) : null;
  const soloImage = content.kind === "blocks" && content.blocks.length === 1 && content.blocks[0].t === "image";
  const spaced = content.kind === "blocks" && content.blocks.some((b) => b.t === "spacer");
  return (
    <div className={`page page--${side}${single ? " page--single" : ""}`} style={style}>
      <div className={`page__inner${soloImage ? " page__inner--solo-image" : ""}${spaced ? " page__inner--spaced" : ""}`} style={innerStyle} ref={innerRef}>
        {content.kind === "toc" && <TableOfContents ctx={ctx} single={single} />}
        {content.kind === "featured" && <ProjectCard ctx={ctx} />}
        {content.kind === "blocks" && <Blocks blocks={content.blocks} ctx={ctx} />}
      </div>
      <div className="page__no" aria-hidden>
        <span>{pageNo}</span>
      </div>
      {more && (
        <span className="page__more" aria-hidden>
          Scroll for more ▾
        </span>
      )}
      {single ? (
        <>
          {fold(-1, "left")}
          {fold(1, "right")}
        </>
      ) : side === "left" ? (
        fold(-1, "left")
      ) : (
        fold(1, "right")
      )}
    </div>
  );
});

function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: PageCtx }) {
  const isStatic = useContext(StaticCtx);
  const ti = isStatic ? -1 : 0;
  let featureN = 0; // alternate image side for consecutive features
  return (
    <>
      {blocks.map((b, k) => {
        switch (b.t) {
          case "kicker":
            return (
              <div key={k} className="b-kicker">
                <PixelIcon name="sparkle" px={1} /> {b.text}
              </div>
            );
          case "title":
            return (
              <header key={k} className="b-title">
                {(b.logo || b.icon) && (
                  <span className="b-title__badge">
                    {b.logo ? <img src={b.logo} alt="" /> : <PixelIcon name={b.icon!} px={4} />}
                  </span>
                )}
                <span>
                  <h2>{b.text}</h2>
                  {b.sub && <p>{b.sub}</p>}
                </span>
              </header>
            );
          case "h":
            return (
              <h3 key={k} className="b-h">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={k} className={b.lead ? "b-p b-p--lead" : "b-p"}>
                {b.text}
              </p>
            );
          case "list":
            return (
              <div key={k} className="b-list">
                {b.title && <h4 className="b-label">{b.title}</h4>}
                <ul>
                  {b.items.map((it) => (
                    <li key={it}>
                      <PixelIcon name={b.icon ?? "star"} px={1} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "meta":
            return (
              <dl key={k} className="b-meta">
                {b.rows.map(([a, v]) => (
                  <div key={a}>
                    <dt>{a}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            );
          case "tags":
            return (
              <div key={k} className="b-tags">
                {b.title && <h4 className="b-label">{b.title}</h4>}
                <ul>
                  {b.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            );
          case "image":
            return (
              <div key={k} className={`b-image${b.bare ? " b-image--bare" : ""}${blocks.length === 1 ? " b-image--solo" : ""}`}>
                <Picture img={b.img} fit={b.fit} maxH={b.maxH} />
              </div>
            );
          case "gallery":
            return <ProjectGallery key={k} images={b.images} cols={b.cols} phone={b.phone} title={b.title} fit={b.fit} bare={b.bare} large={b.large} square={b.square} stackMobile={b.stackMobile} fullWidth={b.fullWidth} />;
          case "placeholder":
            return (
              <div key={k} className={`b-placeholder${b.ratio === "3 / 4" ? " b-placeholder--tall" : ""}`} style={{ aspectRatio: b.ratio ?? "16 / 9" }}>
                <PixelIcon name="camera" px={2} />
                <strong>{b.label}</strong>
                {b.note && <span>{b.note}</span>}
              </div>
            );
          case "feature":
            return (
              <div key={k} className={`b-feature${b.large ? " b-feature--lg" : ""}${b.large || b.noFlip ? " b-feature--sol" : ""}${b.img ? "" : " b-feature--noimg"}${b.img && !b.large && !b.noFlip && featureN++ % 2 ? " is-flip" : ""}`}>
                {b.img && <Picture img={b.img} fit="contain" />}
                <div>
                  <h4 style={{ ["--tl" as string]: Math.max(8, ...b.title.split(" ").map((w) => w.length + 1)) } as React.CSSProperties}>
                    {b.icon && <PixelIcon name={b.icon} px={1} />} {b.title}
                  </h4>
                  <p>{b.text}</p>
                </div>
              </div>
            );
          case "links":
            return (
              <div key={k} className="b-links">
                {b.links.map((l) => (
                  <a
                    key={l.href}
                    className="px-btn px-btn--link"
                    href={l.href}
                    tabIndex={ti}
                    {...(l.download ? { download: "" } : l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {l.icon && <PixelIcon name={l.icon} px={2} />}
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
            );
          case "goto":
            return (
              <button key={k} type="button" className="px-btn px-btn--link" onClick={() => ctx.goEntry(b.entry)} tabIndex={ti}>
                <span>{b.label}</span>
                <PixelIcon name="right" px={2} />
              </button>
            );
          case "quote":
            return (
              <blockquote key={k} className="b-quote">
                <p>“{b.text}”</p>
                {b.by && <cite>{b.by}</cite>}
              </blockquote>
            );
          case "code":
            return (
              <figure key={k} className="b-code">
                <div className="b-code__bar">
                  <i />
                  <i />
                  <i />
                  <span>{b.caption ?? b.lang}</span>
                </div>
                <pre>
                  <code>{b.code}</code>
                </pre>
              </figure>
            );
          case "audio":
            return <AudioSnippets key={k} tracks={b.tracks} title={b.title} />;
          case "divider":
            return <hr key={k} className="b-divider" />;
          case "spacer":
            return <div key={k} className="b-spacer" style={b.size ? { height: b.size } : undefined} />;
          default:
            return null;
        }
      })}
    </>
  );
}
