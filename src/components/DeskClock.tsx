import { useEffect, useState, type CSSProperties } from "react";

// 7-segment digits on a 4x7 pixel grid: a b c d e f g
const SEG: [number, number, number, number][] = [
  [1, 0, 2, 1], // a
  [3, 1, 1, 2], // b
  [3, 4, 1, 2], // c
  [1, 6, 2, 1], // d
  [0, 4, 1, 2], // e
  [0, 1, 1, 2], // f
  [1, 3, 2, 1], // g
];
const DIGITS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
  " ": "",
};

function Digit({ ch, x }: { ch: string; x: number }) {
  const on = DIGITS[ch] ?? "";
  return (
    <>
      {SEG.map(([sx, sy, w, h], i) => {
        const lit = on.includes("abcdefg"[i]);
        return <rect key={i} x={x + sx} y={1 + sy} width={w} height={h} className={lit ? "dclock__on" : "dclock__off"} />;
      })}
    </>
  );
}

export interface DeskClockInfo {
  src: string;
  w: number;
  h: number;
  z: number;
  lcd: number[];
  transform: string;
}

/** Digital alarm clock on the desk: pixel body (art) + a live 7-segment LCD showing local time. */
export function DeskClock({ src, w, h, lcd, style }: { src: string; w: number; h: number; lcd: number[]; style?: CSSProperties }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // tick on the minute boundary
    let id = 0;
    const tick = () => {
      setNow(new Date());
      id = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    id = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    return () => window.clearTimeout(id);
  }, []);
  const hh = now.getHours() % 12 || 12;
  const mm = now.getMinutes();
  const txt = `${hh < 10 ? " " : ""}${hh}${mm < 10 ? "0" : ""}${mm}`;
  const pm = now.getHours() >= 12;
  const [lx, ly, lw, lh] = lcd;
  const label = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="dclock" style={{ width: w, height: h, ...style }} role="img" aria-label={`Desk clock showing ${label}`}>
      <img src={src} alt="" className="px dclock__body" draggable={false} />
      <svg className="dclock__lcd" style={{ left: lx, top: ly, width: lw, height: lh }} viewBox={`0 0 ${lw} ${lh}`} shapeRendering="crispEdges" aria-hidden>
        <Digit ch={txt[0]} x={1} />
        <Digit ch={txt[1]} x={6} />
        <rect x={11} y={3} width={1} height={1} className="dclock__on dclock__colon" />
        <rect x={11} y={5} width={1} height={1} className="dclock__on dclock__colon" />
        <Digit ch={txt[2]} x={13} />
        <Digit ch={txt[3]} x={18} />
        <rect x={23} y={pm ? 6 : 1} width={1} height={1} className="dclock__on" />
      </svg>
    </div>
  );
}
