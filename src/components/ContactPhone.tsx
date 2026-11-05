import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LINKS } from "../data/books";
import { PixelIcon } from "./PixelIcon";

const clock = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "");

/** Contact card shown as a pixel phone: email, LinkedIn and the resume download. */
export function ContactPhone({ onClose: done }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [time, setTime] = useState(clock);
  const onClose = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    setClosing(true);
    window.setTimeout(done, 240);
  };
  useEffect(() => {
    const t = window.setInterval(() => setTime(clock()), 15000);
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.key === "Escape") onClose();
      }
    };
    window.addEventListener("keydown", on, true);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("keydown", on, true);
    };
  });

  return createPortal(
    <div className={`cphone-view${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Contact" onClick={onClose}>
      <div className="cphone" onClick={(e) => e.stopPropagation()}>
        <span className="cphone__btn cphone__btn--a" aria-hidden />
        <span className="cphone__btn cphone__btn--b" aria-hidden />
        <div className="cphone__screen">
          <div className="cphone__status" aria-hidden>
            <span>{time}</span>
            <span className="cphone__notch" />
            <span className="cphone__bars">▮▮▮ ▰</span>
          </div>
          <div className="cphone__head">
            <img src="assets/ui/logo.png" alt="" className="px cphone__logo" />
            <h2>Contact</h2>
            <p>Let's create something great.</p>
          </div>
          <ul className="cphone__list">
            <li>
              <a className="cphone__row" href={LINKS.email}>
                <span className="cphone__ico"><PixelIcon name="mail" px={2} /></span>
                <span className="cphone__txt"><strong>Email</strong><small>{LINKS.emailText}</small></span>
                <PixelIcon name="right" px={1} />
              </a>
            </li>
            <li>
              <a className="cphone__row" href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="cphone__ico"><PixelIcon name="linkedin" px={2} /></span>
                <span className="cphone__txt"><strong>LinkedIn</strong><small>in/jbuadoo</small></span>
                <PixelIcon name="external" px={1} />
              </a>
            </li>
            <li>
              <a className="cphone__row" href={LINKS.resume} download>
                <span className="cphone__ico"><PixelIcon name="download" px={2} /></span>
                <span className="cphone__txt"><strong>Resume</strong><small>Download PDF</small></span>
                <PixelIcon name="download" px={1} />
              </a>
            </li>
          </ul>
          <span className="cphone__home" aria-hidden />
        </div>
      </div>
      <button type="button" className="px-btn wview__close" onClick={(e) => { e.stopPropagation(); onClose(); }} autoFocus>
        <PixelIcon name="close" px={2} /> Close
      </button>
    </div>,
    document.body,
  );
}
