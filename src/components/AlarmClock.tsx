import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Twin-bell desk alarm clock. The body is pixel art; the hands show the visitor's real
 * local time (with a ticking second hand). Clicking it rings the alarm for a moment.
 * Geometry is in sprite px (26x28, face centre 13,16).
 */
export function AlarmClock({ src, style, tabIndex = 0 }: { src: string; style?: CSSProperties; tabIndex?: number }) {
  const [now, setNow] = useState(() => new Date());
  const [ringing, setRinging] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ringing) return;
    const t = window.setTimeout(() => setRinging(false), 1600);
    return () => window.clearTimeout(t);
  }, [ringing]);

  const ring = () => {
    if (ringing) {
      setRinging(false);
      return;
    }
    setRinging(true);
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new AC());
      const t0 = ctx.currentTime;
      // classic double-bell trill: short square-wave bursts
      for (let i = 0; i < 12; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = i % 2 ? 1760 : 1568;
        const s = t0 + i * 0.12;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.05, s + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.1);
        o.connect(g).connect(ctx.destination);
        o.start(s);
        o.stop(s + 0.11);
      }
    } catch {
      /* no audio available - the clock still shakes */
    }
  };

  const sec = now.getSeconds();
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  const label = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <button
      type="button"
      className={`alarm${ringing ? " is-ringing" : ""}`}
      style={style}
      onClick={ring}
      tabIndex={tabIndex}
      title={`${label} - click to ring the alarm`}
      aria-label={`Desk alarm clock showing ${label}. Click to ring.`}
    >
      <img src={src} alt="" className="px alarm__body" draggable={false} />
      <span className="alarm__face" aria-hidden>
        <i className="alarm__h" style={{ transform: `rotate(${hr * 30}deg)` }} />
        <i className="alarm__m" style={{ transform: `rotate(${min * 6}deg)` }} />
        <i className="alarm__s" style={{ transform: `rotate(${sec * 6}deg)` }} />
        <b className="alarm__pin" />
      </span>
    </button>
  );
}
