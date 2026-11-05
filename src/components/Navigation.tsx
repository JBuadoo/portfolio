import { PixelIcon } from "./PixelIcon";
import type { Mode } from "../data/scene";

const MODE_ITEMS: { key: Mode; label: string; icon: string }[] = [
  { key: "day", label: "Day", icon: "sun" },
  { key: "sunset", label: "Sunset", icon: "sunset" },
  { key: "night", label: "Night", icon: "moon" },
];

export type NavKey = "home" | "projects" | "about" | "resume" | "contact";

const ITEMS: { key: NavKey; label: string; icon: string; hint: string }[] = [
  { key: "home", label: "Home", icon: "home", hint: "Back to the bookshelf" },
  { key: "projects", label: "Projects", icon: "folder", hint: "Open the UI/UX Design book" },
  { key: "about", label: "About", icon: "user", hint: "Open my journal" },
  { key: "resume", label: "Resume", icon: "book", hint: "My resume and experience" },
  { key: "contact", label: "Contact", icon: "mail", hint: "Contact details" },
];

interface Props {
  active: NavKey;
  onNav: (k: NavKey) => void;
  mobile: boolean;
  /** desktop sidebar slid out of view */
  hidden?: boolean;
  mode: Mode;
  onMode: (m: Mode) => void;
}

/** Desktop: pixel sidebar. Phone: bottom tab bar. */
export function Navigation({ active, onNav, mobile, hidden, mode, onMode }: Props) {
  return (
    <nav className={mobile ? "tabbar" : "sidebar"} aria-label="Main" aria-hidden={hidden || undefined} inert={hidden ? true : undefined}>
      {!mobile && (
        <button type="button" className="sidebar__logo" onClick={() => onNav("home")} aria-label="Joseph Buadoo - home">
          <img src="/assets/ui/logo.png" alt="" className="px" />
        </button>
      )}
      {!mobile && <div className="sidebar__dot" aria-hidden />}
      <ul>
        {ITEMS.map((it) => (
          <li key={it.key}>
            <button
              type="button"
              className={`navbtn${active === it.key ? " is-active" : ""}`}
              onClick={() => onNav(it.key)}
              aria-current={active === it.key ? "page" : undefined}
              title={it.hint}
            >
              <PixelIcon name={it.icon} px={2} />
              <span>{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {mobile ? (
        <button
          type="button"
          className="mode-fab"
          onClick={() => onMode(MODE_ITEMS[(MODE_ITEMS.findIndex((m) => m.key === mode) + 1) % 3].key)}
          aria-label={`Lighting: ${MODE_ITEMS.find((m) => m.key === mode)!.label}. Tap to change.`}
        >
          <PixelIcon name={MODE_ITEMS.find((m) => m.key === mode)!.icon} px={2} />
        </button>
      ) : (
        <div className="modes" role="radiogroup" aria-label="Lighting">
          <span className="modes__label">Lighting</span>
          <div className="modes__row">
            {MODE_ITEMS.map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={mode === m.key}
                className={`modes__btn${mode === m.key ? " is-active" : ""}`}
                onClick={() => onMode(m.key)}
                title={m.label}
              >
                <PixelIcon name={m.icon} px={2} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
