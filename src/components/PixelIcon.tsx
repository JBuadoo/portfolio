import { memo, type ReactElement } from "react";
import ICONS from "../data/pixelIcons.json";

const PAINT: Record<string, string> = { r: "#ff5a6a", y: "#ffd23a", g: "#5ad06a", b: "#4a9aff", p: "#c07aff" };
const data = ICONS as Record<string, string[]>;

interface Props {
  name: string;
  /** size of one icon pixel in CSS px */
  px?: number;
  className?: string;
  title?: string;
}

/**
 * Renders a hand-drawn pixel icon as crisp SVG rects.
 * '#' = currentColor, '+' = currentColor @55%, 'o' = var(--pi-fill) (inner fill), r/y/g/b/p = paint.
 */
export const PixelIcon = memo(function PixelIcon({ name, px = 2, className, title }: Props) {
  const rows = data[name] ?? data.sparkle;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end] === ch) end++;
      const fill = ch === "#" ? "currentColor" : ch === "+" ? "currentColor" : ch === "o" ? "var(--pi-fill, transparent)" : PAINT[ch];
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} opacity={ch === "+" ? 0.55 : undefined} />,
      );
      x = end;
    }
  });
  return (
    <svg
      className={`pixel-icon ${className ?? ""}`}
      width={w * px}
      height={h * px}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
});
