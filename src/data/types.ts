export type IconName = string;

export interface Img {
  src: string;
  alt: string;
  caption?: string;
  /** small preview for grids (falls back to src) */
  thumb?: string;
  /** first-frame image for a video src (.mp4) */
  poster?: string;
}

export interface LinkItem {
  label: string;
  href: string;
  icon?: IconName;
  download?: boolean;
}

export interface Track {
  title: string;
  src: string;
  genre: string;
  bpm: string;
  key: string;
}

/** Content blocks rendered by <BookPage>. Keep each page short enough to fit a spread. */
export type Block =
  | { t: "kicker"; text: string }
  | { t: "title"; text: string; sub?: string; logo?: string; icon?: IconName }
  | { t: "p"; text: string; lead?: boolean }
  | { t: "h"; text: string }
  | { t: "list"; items: string[]; title?: string; icon?: IconName }
  | { t: "meta"; rows: [string, string][] }
  | { t: "tags"; items: string[]; title?: string }
  | { t: "image"; img: Img; tall?: boolean; fit?: "cover" | "contain"; maxH?: number; bare?: boolean }
  | { t: "gallery"; images: Img[]; cols?: 1 | 2 | 3 | 4; phone?: boolean; title?: string; fit?: "cover" | "contain"; bare?: boolean; large?: boolean; square?: boolean; stackMobile?: boolean; fullWidth?: boolean }
  | { t: "placeholder"; label: string; note?: string; ratio?: string }
  | { t: "feature"; icon?: IconName; title: string; text: string; img?: Img; large?: boolean; noFlip?: boolean }
  | { t: "links"; links: LinkItem[] }
  | { t: "quote"; text: string; by?: string }
  | { t: "code"; lang: string; code: string; caption?: string }
  | { t: "audio"; tracks: Track[]; title?: string }
  | { t: "goto"; label: string; entry: string }
  | { t: "divider" }
  | { t: "spacer"; size?: number };

export interface Spread {
  left: Block[];
  right: Block[];
}

export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  /** Optional real logo/visual for the featured card on the contents spread. */
  logo?: string;
  /** Teaser for the featured card on the contents spread. */
  tagline?: string;
  blurb?: string;
  spreads: Spread[];
}

export interface Book {
  id: string;
  title: string;
  /** Short title on the shelf cover (line breaks allowed with \n). */
  cover: string;
  icon: IconName;
  intro: string;
  entries: Entry[];
  onShelf: boolean;
}
