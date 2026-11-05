import type { Block, Book } from "../data/types";

/** A page is either a list of blocks or one of the special contents pages. */
export type PageContent = { kind: "blocks"; blocks: Block[] } | { kind: "toc" } | { kind: "featured" };

export interface SpreadRef {
  left: PageContent;
  right: PageContent;
  entryId?: string;
  /** 1-based index of this spread within its entry */
  n?: number;
}

export interface BookLayout {
  spreads: SpreadRef[];
  entryStart: Record<string, number>;
  /** single-page sequence for the mobile book */
  pages: { content: PageContent; spread: number; side: "left" | "right" }[];
}

const cache = new Map<string, BookLayout>();

export function layoutBook(book: Book): BookLayout {
  const hit = cache.get(book.id);
  if (hit) return hit;
  const spreads: SpreadRef[] = [{ left: { kind: "toc" }, right: { kind: "featured" } }];
  const entryStart: Record<string, number> = {};
  for (const e of book.entries) {
    entryStart[e.id] = spreads.length;
    e.spreads.forEach((s, i) =>
      spreads.push({
        left: { kind: "blocks", blocks: s.left },
        right: { kind: "blocks", blocks: s.right },
        entryId: e.id,
        n: i + 1,
      }),
    );
  }
  const pages: BookLayout["pages"] = [];
  spreads.forEach((s, i) => {
    pages.push({ content: s.left, spread: i, side: "left" });
    // on phones the TOC doubles as the featured card, so skip the featured page
    if (s.right.kind !== "featured") pages.push({ content: s.right, spread: i, side: "right" });
  });
  const layout = { spreads, entryStart, pages };
  cache.set(book.id, layout);
  return layout;
}

export function collectImages(p: PageContent): string[] {
  if (p.kind !== "blocks") return [];
  const out: string[] = [];
  for (const b of p.blocks) {
    if (b.t === "image") out.push(b.img.src);
    if (b.t === "gallery") b.images.forEach((i) => out.push(i.src));
    if (b.t === "feature" && b.img) out.push(b.img.src);
  }
  return out;
}
