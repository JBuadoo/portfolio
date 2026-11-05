import { forwardRef, type CSSProperties } from "react";
import type { Book } from "../data/types";
import { themeVars } from "../data/scene";

interface Props {
  book: Book;
  sprite: string;
  /** CSS px per sprite pixel (1 inside the scaled desktop scene) */
  s?: number;
  style?: CSSProperties;
  hidden?: boolean;
  highlight?: boolean;
  landing?: boolean;
  onOpen: (id: string, el: HTMLElement) => void;
}

/** Fit the cover title inside the 26px-wide title box of the sprite (font em = 10 font-pixels). */
function titleSize(cover: string) {
  const longest = Math.max(...cover.split("\n").map((l) => l.length));
  return Math.min(7, 340 / (longest * 7));
}

export const PortfolioBook = forwardRef<HTMLButtonElement, Props>(function PortfolioBook(
  { book, sprite, s = 1, style, hidden, highlight, landing, onOpen },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      id={`shelf-book-${book.id}`}
      className={`shelf-book${hidden ? " is-out" : ""}${highlight ? " is-highlight" : ""}${landing ? " is-landing" : ""}`}
      style={{ ...themeVars(book.id), ...style, ["--s" as string]: s, ["--fs" as string]: titleSize(book.cover) }}
      aria-label={`Open the ${book.title} book`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : 0}
      onClick={(e) => onOpen(book.id, e.currentTarget)}
    >
      <span className="shelf-book__body">
        <img src={sprite} alt="" draggable={false} className="px" />
        <span className="shelf-book__title">
          {book.cover.split("\n").map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </span>
      <span className="shelf-book__glow" aria-hidden />
    </button>
  );
});
