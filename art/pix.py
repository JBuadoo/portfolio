"""Tiny pixel-art drawing toolkit on top of Pillow (aliased primitives + ordered dithering)."""
import math
import random

from PIL import Image, ImageDraw

from glyphs import G

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def bayer(x, y):
    return (BAYER[y & 3][x & 3] + 0.5) / 16.0


def col(c):
    if isinstance(c, tuple):
        return c if len(c) == 4 else (*c, 255)
    c = c.lstrip("#")
    if len(c) == 6:
        return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), int(c[6:8], 16))


def mix(a, b, t):
    a, b = col(a), col(b)
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))


def shade(c, f):
    """f>0 lighten toward white-ish warm, f<0 darken toward deep purple."""
    if f >= 0:
        return mix(c, "#fff0d8", f)
    return mix(c, "#0d0714", -f)


class C:
    def __init__(self, w, h, bg=None):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w, h), col(bg) if bg else (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.p = self.im.load()

    # --- primitives -------------------------------------------------------
    def inb(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def px(self, x, y, c):
        if self.inb(x, y):
            c = col(c)
            if c[3] == 255:
                self.p[x, y] = c
            elif c[3] > 0:
                base = self.p[x, y]
                if base[3] == 0:
                    self.p[x, y] = c
                else:
                    t = c[3] / 255
                    self.p[x, y] = tuple(int(base[i] + (c[i] - base[i]) * t) for i in range(3)) + (base[3],)

    def get(self, x, y):
        return self.p[x, y] if self.inb(x, y) else (0, 0, 0, 0)

    def rect(self, x, y, w, h, c):
        if w <= 0 or h <= 0:
            return
        c = col(c)
        if c[3] == 255:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
        else:
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    self.px(xx, yy, c)

    def orect(self, x, y, w, h, c):
        self.rect(x, y, w, 1, c)
        self.rect(x, y + h - 1, w, 1, c)
        self.rect(x, y, 1, h, c)
        self.rect(x + w - 1, y, 1, h, c)

    def line(self, x0, y0, x1, y1, c, width=1):
        self.d.line([x0, y0, x1, y1], fill=col(c), width=width)

    def ell(self, cx, cy, rx, ry, c):
        self.d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col(c))

    def oell(self, cx, cy, rx, ry, c):
        self.d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=col(c))

    def poly(self, pts, c, outline=None):
        self.d.polygon(pts, fill=col(c) if c else None, outline=col(outline) if outline else None)

    def dither(self, x, y, w, h, c, tf):
        """Set pixel to c where tf(x,y) > bayer threshold."""
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                if tf(xx, yy) > bayer(xx, yy):
                    self.px(xx, yy, c)

    def tint(self, x, y, w, h, target, tf, amount=0.5, only_opaque=True):
        """Dithered tint toward target colour, strength by tf."""
        tgt = col(target)
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                base = self.p[xx, yy]
                if only_opaque and base[3] == 0:
                    continue
                if tf(xx, yy) > bayer(xx, yy):
                    self.p[xx, yy] = tuple(int(base[i] + (tgt[i] - base[i]) * amount) for i in range(3)) + (base[3],)

    def vgrad(self, x, y, w, h, stops):
        """Dithered vertical gradient. stops = [(t, colour), ...] t in 0..1."""
        stops = [(t, col(c)) for t, c in stops]
        for yy in range(y, y + h):
            t = (yy - y) / max(1, h - 1)
            for i in range(len(stops) - 1):
                if stops[i][0] <= t <= stops[i + 1][0]:
                    a, b = stops[i], stops[i + 1]
                    break
            local = (t - a[0]) / max(1e-6, b[0] - a[0])
            for xx in range(x, x + w):
                self.px(xx, yy, b[1] if local > bayer(xx, yy) else a[1])

    def noise(self, x, y, w, h, c, density, rng):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if rng.random() < density:
                    self.px(xx, yy, c)

    def text(self, x, y, s, c, scale=1):
        cx = x
        for ch in s:
            gl = G.get(ch, G["?"])
            for r, row in enumerate(gl):
                for i, v in enumerate(row):
                    if v == "#":
                        self.rect(cx + i * scale, y + r * scale, scale, scale, c)
            cx += (len(gl[0]) + 1) * scale

    def outline(self, c, diag=False):
        src = self.im.copy().load()
        c = col(c)
        for yy in range(self.h):
            for xx in range(self.w):
                if src[xx, yy][3] != 0:
                    continue
                nb = [(1, 0), (-1, 0), (0, 1), (0, -1)]
                if diag:
                    nb += [(1, 1), (-1, 1), (1, -1), (-1, -1)]
                for dx, dy in nb:
                    nx, ny = xx + dx, yy + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and src[nx, ny][3] > 200:
                        self.p[xx, yy] = c
                        break

    def blit(self, other, x, y):
        self.im.alpha_composite(other.im, (x, y))

    def matrix(self, rows, x, y, palette, scale=1):
        for r, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch in palette and palette[ch]:
                    self.rect(x + i * scale, y + r * scale, scale, scale, palette[ch])

    def save(self, path):
        self.im.save(path, optimize=True)


def leaf(cv, x, y, ang, length, width, c_main, c_light, c_dark, rng=None):
    """Pointed leaf polygon from (x,y) along angle."""
    dx, dy = math.cos(ang), math.sin(ang)
    nx, ny = -dy, dx
    pts_l, pts_r = [], []
    steps = max(3, int(length))
    for i in range(steps + 1):
        t = i / steps
        w = math.sin(math.pi * t) * width * (1 - 0.3 * t)
        cx, cy = x + dx * length * t, y + dy * length * t
        pts_l.append((cx + nx * w, cy + ny * w))
        pts_r.append((cx - nx * w, cy - ny * w))
    cv.poly(pts_l + pts_r[::-1], c_main)
    # light half
    cv.poly(pts_l, c_light)
    # midrib
    cv.line(round(x), round(y), round(x + dx * length * 0.85), round(y + dy * length * 0.85), c_dark)


def rnd(seed):
    return random.Random(seed)
