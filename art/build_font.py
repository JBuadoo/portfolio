"""Builds public/fonts/jbpixel.woff + .ttf from glyphs.py (1 pixel = 100 units, em = 1000)."""
import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

sys.path.insert(0, os.path.dirname(__file__))
from glyphs import G  # noqa: E402

PX = 100
ASC = 8  # pixels above baseline (7 cap + 1 headroom)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")


def glyph_name(ch):
    return "space" if ch == " " else f"uni{ord(ch):04X}"


def draw(rows):
    pen = TTGlyphPen(None)
    for r, row in enumerate(rows):
        # baseline is below row 6
        y_top = (7 - r) * PX
        y_bot = y_top - PX
        c = 0
        while c < len(row):
            if row[c] == "#":
                start = c
                while c < len(row) and row[c] == "#":
                    c += 1
                x0, x1 = start * PX, c * PX
                # clockwise contour (TrueType outer)
                pen.moveTo((x0, y_bot))
                pen.lineTo((x0, y_top))
                pen.lineTo((x1, y_top))
                pen.lineTo((x1, y_bot))
                pen.closePath()
            else:
                c += 1
    return pen.glyph()


def bold(rows):
    """Classic pixel bold: smear every ink pixel one to the right."""
    out = []
    for r in rows:
        r2 = r + "."
        # smear right, but never close a 1-pixel counter (keeps m, w, # readable)
        res = list(r2)
        for i in range(len(r2) - 1):
            if r2[i] == "#" and r2[i + 1] == "." and not (i + 2 < len(r2) and r2[i + 2] == "#"):
                res[i + 1] = "#"
        out.append("".join(res))
    return out


def build(glyphs, style, fname):
    order = [".notdef"] + [glyph_name(c) for c in glyphs]
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(c): glyph_name(c) for c in glyphs})
    gl = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (600, 0)}
    for ch, rows in glyphs.items():
        n = glyph_name(ch)
        gl[n] = draw(rows)
        metrics[n] = ((len(rows[0]) + 1) * PX, 0)
    fb.setupGlyf(gl)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC * PX, descent=-2 * PX)
    fb.setupNameTable({"familyName": "JB Pixel", "styleName": style})
    fb.setupOS2(sTypoAscender=ASC * PX, sTypoDescender=-2 * PX, sTypoLineGap=0, usWinAscent=ASC * PX,
                usWinDescent=2 * PX, sxHeight=500, sCapHeight=700, usWeightClass=700 if style == "Bold" else 400)
    fb.setupPost()
    ttf = os.path.join(OUT, fname + ".ttf")
    fb.save(ttf)
    from fontTools.ttLib import TTFont
    f = TTFont(ttf)
    f.flavor = "woff"
    f.save(os.path.join(OUT, fname + ".woff"))


def main():
    os.makedirs(OUT, exist_ok=True)
    build({c: (bold(r) if c != " " else r) for c, r in G.items()}, "Bold", "jbpixel-bold")
    order = [".notdef"] + [glyph_name(c) for c in G]
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(c): glyph_name(c) for c in G})
    glyphs = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (600, 0)}
    for ch, rows in G.items():
        n = glyph_name(ch)
        glyphs[n] = draw(rows)
        w = len(rows[0])
        metrics[n] = ((w + 1) * PX, 0)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC * PX, descent=-2 * PX)
    fb.setupNameTable({"familyName": "JB Pixel", "styleName": "Regular"})
    fb.setupOS2(sTypoAscender=ASC * PX, sTypoDescender=-2 * PX, sTypoLineGap=0,
                usWinAscent=ASC * PX, usWinDescent=2 * PX, sxHeight=500, sCapHeight=700)
    fb.setupPost()
    ttf = os.path.join(OUT, "jbpixel.ttf")
    fb.save(ttf)
    from fontTools.ttLib import TTFont
    f = TTFont(ttf)
    f.flavor = "woff"
    f.save(os.path.join(OUT, "jbpixel.woff"))
    print("font ok", len(G), "glyphs")


if __name__ == "__main__":
    main()
