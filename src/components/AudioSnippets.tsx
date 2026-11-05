import { useContext, useEffect, useRef, useState } from "react";
import type { Track } from "../data/types";
import { PixelIcon } from "./PixelIcon";
import { StaticCtx } from "./ProjectGallery";

const fmt = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** A small pixel cassette-deck player for the Joë Collection snippets. */
export function AudioSnippets({ tracks, title }: { tracks: Track[]; title?: string }) {
  const isStatic = useContext(StaticCtx);
  const audio = useRef<HTMLAudioElement>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState({ cur: 0, dur: 0 });
  const track = tracks[i];

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const tick = () => setT({ cur: a.currentTime, dur: a.duration });
    const end = () => setI((n) => (n + 1) % tracks.length);
    a.addEventListener("timeupdate", tick);
    a.addEventListener("loadedmetadata", tick);
    a.addEventListener("ended", end);
    return () => {
      a.removeEventListener("timeupdate", tick);
      a.removeEventListener("loadedmetadata", tick);
      a.removeEventListener("ended", end);
      a.pause();
    };
  }, [tracks.length]);

  useEffect(() => {
    const a = audio.current;
    if (!a || isStatic) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, i, isStatic]);

  const pick = (n: number) => {
    setI((n + tracks.length) % tracks.length);
    setPlaying(true);
  };

  return (
    <div className="deck">
      {!isStatic && <audio ref={audio} src={track.src} preload="none" />}
      {title && <div className="deck__label">{title}</div>}
      <div className="deck__screen">
        <div className={`deck__eq${playing ? " is-on" : ""}`} aria-hidden>
          {Array.from({ length: 9 }, (_, k) => (
            <i key={k} style={{ animationDelay: `${-k * 0.13}s` }} />
          ))}
        </div>
        <div className="deck__now">
          <strong>{track.title}</strong>
          <span>
            {track.genre} · {track.bpm} · {track.key}
          </span>
        </div>
      </div>
      <div className="deck__bar" aria-hidden>
        <i style={{ width: `${t.dur ? (t.cur / t.dur) * 100 : 0}%` }} />
      </div>
      <div className="deck__time" aria-live="off">
        {fmt(t.cur)} / {fmt(t.dur)}
      </div>
      <div className="deck__controls">
        <button type="button" className="px-btn px-btn--icon" onClick={() => pick(i - 1)} aria-label="Previous track" tabIndex={isStatic ? -1 : 0}>
          <PixelIcon name="prev" px={2} />
        </button>
        <button
          type="button"
          className="px-btn px-btn--icon px-btn--main"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : `Play ${track.title}`}
          tabIndex={isStatic ? -1 : 0}
        >
          <PixelIcon name={playing ? "pause" : "play"} px={2} />
        </button>
        <button type="button" className="px-btn px-btn--icon" onClick={() => pick(i + 1)} aria-label="Next track" tabIndex={isStatic ? -1 : 0}>
          <PixelIcon name="next" px={2} />
        </button>
      </div>
      <ol className="deck__list">
        {tracks.map((tr, n) => (
          <li key={tr.src}>
            <button type="button" className={n === i ? "is-active" : ""} onClick={() => pick(n)} tabIndex={isStatic ? -1 : 0}>
              <span>{String(n + 1).padStart(2, "0")}</span> {tr.title}
              <em>{tr.genre}</em>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
