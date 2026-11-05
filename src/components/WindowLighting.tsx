import { useEffect, useRef } from "react";

import { SCENE, T } from "../data/scene";

const FX = (SCENE as unknown as { fx: { bloom: string; shafts: string } }).fx;

/**
 * Sunset light + "cozy shader" look, all pre-rendered (no live filters or blend modes):
 *  - soft, blurred sun shafts that breathe slowly (opacity only -> compositor)
 *  - a bloom layer built from the bright parts of the scene
 *  - pixel dust motes on a 480x270 canvas
 */
export function WindowLighting({ paused, reduced }: { paused: boolean; reduced: boolean }) {
  return (
    <>
      <div className="light-wash" aria-hidden />
      <img className="fx fx--shafts" src={T(FX.shafts)} alt="" aria-hidden />
      <img className="fx fx--bloom" src={T(FX.bloom)} alt="" aria-hidden />
      <Dust paused={paused || reduced} reduced={reduced} />
    </>
  );
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
  big: boolean;
}

function inBeam(x: number, y: number) {
  // the low sunset beams: they leave the window glass (x~144, y 28-187) and travel right, dipping slightly
  const d = x - 144;
  if (d < 0 || d > 300) return 0;
  const top = 28 + d * 0.24;
  const bot = 187 + d * 0.24;
  if (y < top || y > bot) return 0;
  const edge = Math.min(y - top, bot - y) / 20;
  return Math.min(1, edge) * Math.min(1, d / 20) * (1 - d / 300);
}

function Dust({ paused, reduced }: { paused: boolean; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const motes = useRef<Mote[]>([]);

  useEffect(() => {
    const r = Math.random;
    motes.current = Array.from({ length: 30 }, () => ({
      x: 150 + r() * 220,
      y: r() * 230,
      vx: 0.03 + r() * 0.07,
      vy: -0.02 + r() * 0.05,
      ph: r() * Math.PI * 2,
      big: r() < 0.18,
    }));
  }, []);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let raf = 0;
    let last = 0;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, 480, 270);
      for (const m of motes.current) {
        if (!paused) {
          m.x += m.vx;
          m.y += m.vy + Math.sin(time / 1600 + m.ph) * 0.03;
          if (m.x > 430 || m.y > 260 || m.y < -10) {
            m.x = 146 + Math.random() * 40;
            m.y = 30 + Math.random() * 160;
          }
        }
        const beam = inBeam(m.x, m.y);
        if (beam <= 0) continue;
        const tw = 0.55 + 0.45 * Math.sin(time / 700 + m.ph * 3);
        ctx.fillStyle = `rgba(255, 228, 182, ${(0.3 + beam * 0.7) * tw})`;
        const s = m.big ? 2 : 1;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), s, s);
      }
    };
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 50) return; // ~20fps is plenty for slow dust
      last = t;
      if (document.hidden) return;
      draw(t);
    };
    if (paused) draw(performance.now());
    else raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return <canvas ref={ref} className={`dust px${reduced ? " is-static" : ""}`} width={480} height={270} aria-hidden />;
}
