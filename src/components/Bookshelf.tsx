import { SCENE, T } from "../data/scene";
import { SHELF_BOOKS } from "../data/books";
import { PortfolioBook } from "./PortfolioBook";

interface Props {
  outBook: string | null;
  landingBook?: string | null;
  highlight: string | null;
  intro: boolean;
  onOpen: (id: string, el: HTMLElement) => void;
}

/** The five discipline books standing on the shelf (positioned in scene pixels). */
export function Bookshelf({ outBook, landingBook, highlight, intro, onOpen }: Props) {
  return (
    <div className={`bookshelf${intro ? " is-intro" : ""}`} role="group" aria-label="Bookshelf - choose a discipline">
      {SHELF_BOOKS.map((book, i) => {
        const pos = SCENE.books.find((b) => b.id === book.id)!;
        return (
          <PortfolioBook
            key={book.id}
            book={book}
            sprite={T(pos.src)}
            hidden={outBook === book.id}
            landing={landingBook === book.id}
            highlight={highlight === book.id}
            onOpen={onOpen}
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.w,
              height: pos.h,
              ["--i" as string]: i,
              zIndex: 7,
            }}
          />
        );
      })}
    </div>
  );
}
