"""Generates every layered pixel-art asset for the study scene, the books and the book UI.

Run:  python3 art/generate.py
Outputs to public/assets/{scene,books,ui} and writes src/data/sceneManifest.json
Scene native resolution is 480x270 (scaled up with image-rendering: pixelated).
Composition follows the reference concept: tall sunset window on the left, warm sun shafts,
a long thick shelf with five large books seen slightly from the left, wall decor above.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from pix import C, col, mix, shade, bayer, leaf, rnd  # noqa: E402
from glyphs import text_width  # noqa: E402
import icons  # noqa: E402

ROOT = os.path.join(HERE, "..")
OUT_SCENE = os.path.join(ROOT, "public", "assets", "scene")
OUT_BOOKS = os.path.join(ROOT, "public", "assets", "books")
OUT_UI = os.path.join(ROOT, "public", "assets", "ui")
for d in (OUT_SCENE, OUT_BOOKS, OUT_UI):
    os.makedirs(d, exist_ok=True)

W, H = 480, 270
OVER = 60                      # wall/floor overscan on every side
# The window sits on an angled LEFT wall (in perspective, like the reference).
CORNER = 166                   # x where the left wall meets the back wall
WIN_OUT = [(36, -14), (150, 20), (150, 194), (36, 230)]    # frame outer quad TL, TR, BR, BL (near edge on the left)
WIN_GLASS = [(46, -2), (144, 28), (144, 187), (46, 219)]   # glass quad
FLAT = (100, 240)              # the sky is painted flat at this size, then warped into the glass quad
GLASS = (46, -2, 98, 221)      # bounding box of the glass quad (x, y, w, h)
SUN = (58, 150)                # sun centre in the flat sky
SUN_SCENE = (92, 150)          # where the sun lands in the scene (for the wall glow)
SHELF_Y = 182                  # top surface the books stand on (raised)
VP = (433, 104)                # vanishing point of the left wall's horizontal lines (window edges meet here)


def vp_line(y_at_corner):
    """y(x) of a horizontal line on the left wall that meets the corner at y_at_corner."""
    return lambda x: VP[1] + (y_at_corner - VP[1]) * (x - VP[0]) / (CORNER - VP[0])
BOOK_W, BOOK_H = 56, 86
manifest = {"width": W, "height": H, "layers": [], "books": [], "glass": GLASS}


def add(name, cv, x, y, z, cls=None, role=None):
    cv.save(os.path.join(OUT_SCENE, f"{name}.png"))
    manifest["layers"].append({"name": name, "src": f"assets/scene/{name}.png", "x": x, "y": y,
                               "w": cv.w, "h": cv.h, "z": z, **({"cls": cls} if cls else {}),
                               **({"role": role} if role else {})})


def homography(src, dst):
    """3x3 matrix mapping src quad -> dst quad (4 point pairs)."""
    import numpy as np
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    h = np.linalg.solve(np.array(A, float), np.array(b, float))
    return np.append(h, 1).reshape(3, 3)


def hpt(Hm, u, v):
    x, y, w = Hm @ [u, v, 1]
    return (x / w, y / w)


UNIT = [(0, 0), (1, 0), (1, 1), (0, 1)]


# ---------------------------------------------------------------------------
# WALL + FLOOR  (warm, sunlit near the window, cool purple elsewhere)
# ---------------------------------------------------------------------------
def make_wall():
    r = rnd(11)
    O = OVER
    cw, ch = W + 2 * O, H + 2 * O
    cv = C(cw, ch)
    base_y = 250 + O
    planks = ["#3a2a66", "#35265e", "#3f2e6c", "#382962", "#322458"]
    for i, x0 in enumerate(range(0, cw, 13)):
        base = planks[(i * 7 + 3) % len(planks)]
        cv.rect(x0, 0, 13, base_y + 2, base)
        cv.rect(x0, 0, 1, base_y + 2, "#1e1438")
        cv.rect(x0 + 1, 0, 1, base_y + 2, shade(base, 0.12))
        for _ in range(14):
            gx, gy = x0 + r.randint(3, 11), r.randint(4, base_y - 6)
            cv.rect(gx, gy, 1, r.randint(3, 18), shade(base, -0.16))
        for _ in range(4):
            gx, gy = x0 + r.randint(3, 11), r.randint(4, base_y - 6)
            cv.rect(gx, gy, 1, r.randint(2, 8), shade(base, 0.08))
        for jy in (r.randint(10, 120), r.randint(150, base_y - 20)):
            cv.rect(x0 + 1, jy, 12, 1, "#21163e")
            cv.rect(x0 + 1, jy + 1, 12, 1, shade(base, 0.1))
    cv.rect(CORNER + O, 22 + O, cw, 3, "#1c1230")
    cv.rect(CORNER + O, 22 + O, cw, 1, "#4a3a72")
    cv.rect(0, base_y, cw, 8, "#22163a")
    cv.rect(0, base_y, cw, 1, "#4a3876")
    cv.rect(0, base_y + 7, cw, 1, "#130b22")
    fl = ["#3a2236", "#40283c", "#352032"]
    for row, y0 in enumerate(range(base_y + 8, ch, 6)):
        off = (row * 37) % 60
        for x0 in range(-off, cw, 60):
            cv.rect(x0, y0, 60, 6, fl[((x0 + off) // 60 + row) % 3])
            cv.rect(x0, y0, 1, 6, "#22121e")
        cv.rect(0, y0, cw, 1, "#25141f")

    # sunlight: big warm wash centred on the lower window, strongest to its left & right edges
    sx, sy = SUN_SCENE[0] + O, SUN_SCENE[1] + O
    draw_left_wall(cv, r)

    def glow(x, y, rad, k, sq=1.0):
        d = math.hypot((x - sx) * sq, (y - sy))
        return max(0.0, 1 - d / rad) ** 1.3 * k

    def smooth(x0, y0, w, h, target, f, amt):
        tgt = col(target)
        for yy in range(max(0, y0), min(ch, y0 + h)):
            for xx in range(max(0, x0), min(cw, x0 + w)):
                k = f(xx, yy) * amt
                if k <= 0.01:
                    continue
                # quantise to 4 steps + dither between them for a pixel-art falloff
                q = math.floor(k * 4 + bayer(xx, yy)) / 4
                if q <= 0:
                    continue
                b = cv.p[xx, yy]
                cv.p[xx, yy] = tuple(int(b[i] + (tgt[i] - b[i]) * q) for i in range(3)) + (255,)

    smooth(0, 0, 460, ch, "#8a4a70", lambda x, y: glow(x, y, 280, 1.0, 0.75), 0.55)
    smooth(0, 0, 380, ch, "#c86e5e", lambda x, y: glow(x, y, 180, 1.0, 0.85), 0.6)
    smooth(0, 0, 320, ch, "#f09a68", lambda x, y: glow(x, y, 105, 1.0), 0.6)
    # cool falloff to the right and top
    cv.tint(0, 0, cw, ch, "#160c2a", lambda x, y: max(0, (x - 380 - O) / 160) * 0.8, 0.4)
    cv.tint(0, 0, cw, 60 + O, "#160c2a", lambda x, y: max(0, (40 + O - y) / (40 + O)) * 0.8, 0.35)
    cv.tint(0, ch - 70, cw, 70, "#160c2a", lambda x, y: max(0, (y - (ch - 70)) / 70) * 0.8, 0.35)
    return cv


def draw_left_wall(cv, r):
    """Angled left wall: boards foreshorten toward the corner, every horizontal line runs to VP."""
    O = OVER
    ceil, base = vp_line(-60), vp_line(250)
    xl, xr = -O, CORNER
    quad = [(xl, ceil(xl)), (xr, ceil(xr)), (xr, base(xr)), (xl, base(xl))]
    Hm = homography(UNIT, quad)
    planks = ["#33255c", "#2f2256", "#382a62", "#31245a", "#2c1f52"]   # a touch darker than the back wall
    n = 16
    for i in range(n):
        x0 = hpt(Hm, i / n, 0.5)[0]
        x1 = hpt(Hm, (i + 1) / n, 0.5)[0]
        c_ = planks[(i * 5 + 1) % len(planks)]
        xa, xb = int(round(x0)), int(round(x1))
        for x in range(xa, xb):
            cv.rect(x + O, 0, 1, int(base(x)) + O, c_)
        cv.rect(xa + O, 0, 1, int(base(xa)) + O, "#1c1234")
        cv.rect(xa + 1 + O, 0, 1, int(base(xa)) + O, shade(c_, 0.1))
        for _ in range(int(16 * (x1 - x0) / 13) + 2):
            gx = r.randint(xa + 2, max(xa + 2, xb - 2))
            gy = r.randint(0, 330)
            cv.rect(gx + O, gy, 1, r.randint(3, 14), shade(c_, -0.16))
        for v in (r.uniform(0.1, 0.45), r.uniform(0.55, 0.9)):
            p0, p1 = hpt(Hm, i / n, v), hpt(Hm, (i + 1) / n, v)
            cv.line(round(p0[0]) + O + 1, round(p0[1]) + O, round(p1[0]) + O, round(p1[1]) + O, "#1f1438")
    # a picture rail and the baseboard, both running into the vanishing point and meeting the back wall's
    for y_c, col_a, col_b in ((22, "#4a3a72", "#1c1230"), (250, "#4a3876", "#22163a")):
        ln = vp_line(y_c)
        for x in range(xl, xr):
            y = int(round(ln(x)))
            if y_c == 250:
                cv.rect(x + O, y + O, 1, 9, col_b)
            else:
                cv.rect(x + O, y + O, 1, 3, col_b)
            cv.px(x + O, y + O, col_a)
    # corner where the two walls meet
    cv.rect(CORNER + O, 0, 1, 250 + O + 8, "#120a22")
    cv.rect(CORNER + O + 1, 0, 1, 250 + O + 8, "#4e3e80")
    cv.tint(0, 0, CORNER + O, cv.h, "#120820", lambda x, y: 0.5, 0.18)

# ---------------------------------------------------------------------------
# SKY, CLOUDS, SKYLINE  (bright lavender-peach sunset like the reference)
# ---------------------------------------------------------------------------
def make_sky(mode=""):
    gw, gh = FLAT
    cv = C(gw, gh)
    r = rnd(5)
    sx, sy = SUN
    if mode == "day":
        cv.vgrad(0, 0, gw, gh, [(0.0, "#4f9ee6"), (0.3, "#6cb4ee"), (0.6, "#9bd0f4"), (0.85, "#c8e6f8"), (1.0, "#e4f2fa")])
        sx, sy = 38, 84                                     # sun high in the sky
        for rad, c, k in ((40, "#cfe8fb", 0.5), (24, "#e8f6ff", 0.7)):
            cv.dither(sx - rad, sy - rad, rad * 2 + 1, rad * 2 + 1, c,
                      lambda x, y, rad=rad, k=k: max(0, 1 - math.hypot(x - sx, y - sy) / rad) * k * 2)
        cv.ell(sx, sy, 8, 8, "#fffbe6")
        cv.ell(sx - 1, sy - 1, 6, 6, "#ffffff")
        return cv
    if mode == "night":
        cv.vgrad(0, 0, gw, gh, [(0.0, "#070a22"), (0.3, "#0e1434"), (0.6, "#1a1e4a"), (0.85, "#2e2a62"), (1.0, "#43356e")])
        for _ in range(70):
            x, y = r.randint(1, gw - 2), r.randint(1, int(gh * 0.6))
            cv.px(x, y, "#ffffff" if r.random() < 0.3 else "#aab4e8")
        for _ in range(6):                                   # a few twinkly crosses
            x, y = r.randint(4, gw - 5), r.randint(4, int(gh * 0.45))
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                cv.px(x + dx, y + dy, "#dfe6ff")
        mx, my = 56, 92                                      # moon (visible in the phone window too)
        cv.dither(mx - 26, my - 26, 53, 53, "#3a4a8a", lambda x, y: max(0, 1 - math.hypot(x - mx, y - my) / 26) * 1.4)
        cv.ell(mx, my, 10, 10, "#eef0f8")
        cv.ell(mx + 3, my - 2, 8, 9, "#d8dcec")
        cv.ell(mx - 3, my + 2, 2, 2, "#c4c8dc")
        cv.ell(mx + 2, my + 5, 1, 1, "#c4c8dc")
        cv.ell(mx - 4, my - 4, 1, 1, "#ffffff")
        return cv
    cv.vgrad(0, 0, gw, gh, [
        (0.00, "#5a4aa0"), (0.18, "#7660b8"), (0.36, "#9a7ccc"), (0.52, "#c294d0"),
        (0.64, "#e2a6c6"), (0.74, "#f4b4b0"), (0.84, "#ffc8a4"), (0.93, "#ffdcaa"), (1.0, "#ffe8b8")])
    for _ in range(10):
        cv.px(r.randint(1, gw - 2), r.randint(1, 50), "#efe6ff")
    for rad, c, k in ((52, "#ffd6a8", 0.5), (34, "#ffe4b4", 0.7), (20, "#fff0c8", 0.95)):
        cv.dither(sx - rad, sy - rad, rad * 2 + 1, rad * 2 + 1, c,
                  lambda x, y, rad=rad, k=k: max(0, 1 - math.hypot(x - sx, y - sy) / rad) * k * 2)
    cv.ell(sx, sy, 11, 11, "#fff6dc")
    cv.ell(sx - 1, sy - 1, 8, 8, "#fffdf2")
    return cv


CLOUD_COLS = {"": ("#c48ac4", "#f0a8bc", "#ffd2b4"), "day": ("#c8d8ea", "#eef4fa", "#ffffff"),
              "night": ("#1c2046", "#262a58", "#323668")}


def make_clouds(mode=""):
    tw, th = FLAT[0] * 2, 90
    cv = C(tw, th)
    c0, c1, c2 = CLOUD_COLS[mode]
    for cx, cy, size in ((24, 26, 30), (100, 50, 40), (160, 16, 22), (60, 70, 24), (140, 78, 18)):
        for shift in (-tw, 0, tw):
            rr = rnd(cx * 13 + cy)
            puffs = [(cx + shift + rr.randint(-size // 2, size // 2), cy + rr.randint(-3, 3),
                      rr.randint(size // 5, size // 3), rr.randint(3, 6)) for _ in range(6)]
            for px_, py_, rx, ry in puffs:
                cv.ell(px_, py_, rx, ry, c0)
            for px_, py_, rx, ry in puffs:
                cv.ell(px_, py_ + 1, rx - 1, ry - 1, c1)
            for px_, py_, rx, ry in puffs:
                cv.ell(px_ + 1, py_ + 2, max(1, rx - 3), max(1, ry - 3), c2)
    return cv


def make_skyline(seed, height, base_cols, lit, win_density, haze=False):
    gw = FLAT[0]
    cv = C(gw, height)
    r = rnd(seed)
    x = -2
    while x < gw:
        bw = r.randint(9, 18)
        bh = r.randint(int(height * 0.35), height - 4)
        if abs(x + bw / 2 - SUN[0]) < (14 if not haze else 10):
            bh = int(bh * (0.4 if not haze else 0.5))
        top = height - bh
        body = base_cols[r.randint(0, len(base_cols) - 1)]
        cv.rect(x, top, bw, bh, body)
        edge = shade(body, 0.25 if haze else 0.2)
        if x + bw / 2 > SUN[0]:
            cv.rect(x, top, 1, bh, edge)
        else:
            cv.rect(x + bw - 1, top, 1, bh, edge)
        cv.rect(x, top, bw, 1, shade(body, 0.15))
        t = r.random()
        if t < 0.3:
            cv.rect(x + bw // 2, top - 8, 1, 8, body)
            cv.px(x + bw // 2, top - 9, "#ff7a7a" if not haze else edge)
        elif t < 0.5:
            cv.poly([(x, top), (x + bw // 2, top - 7), (x + bw - 1, top)], body)
        elif t < 0.65:
            cv.rect(x + 2, top - 4, bw - 4, 4, body)
        # windows use their own random stream so the buildings are identical at every time of day
        for wy in range(top + 3, height - 2, 3):
            for wx in range(x + 2, x + bw - 2, 3):
                rw = rnd(seed * 7919 + wx * 131 + wy)
                if rw.random() < win_density:
                    cv.px(wx, wy, lit[rw.randint(0, len(lit) - 1)])
        x += bw + r.randint(-1, 2)
    if haze:
        cv.tint(0, 0, gw, height, haze if isinstance(haze, str) else "#e0a0c4", lambda x, y: 0.5, 0.25)
    return cv


# ---------------------------------------------------------------------------
# WINDOW FRAME
# ---------------------------------------------------------------------------
SKYLINES = {
    "": ((["#a88ccc", "#b49ad4", "#9a80c4"], ["#f0c0d0", "#f8d4d0"], 0.16, True),
         (["#5c4894", "#52408a", "#6a54a2", "#4a3a80"], ["#ffd27a", "#ffb066", "#ffe9a8", "#ff9a5a"], 0.3)),
    "day": ((["#9cb4d0", "#a8bed8", "#90a8c6"], ["#d8e8f4", "#c6dcee"], 0.12, "#d8ecf8"),
            (["#5a6a8c", "#4e5e80", "#66789a", "#485676"], ["#a8d0f0", "#c8e2f6", "#8ab8e0"], 0.22)),
    "night": ((["#24244e", "#2a2a58", "#202048"], ["#6a6aa8", "#8a7ac0"], 0.1, "#1a1a40"),
              (["#14122e", "#181638", "#1c1a40", "#100e26"], ["#ffd27a", "#ffb066", "#ffe9a8", "#ff9a5a", "#ffd27a"], 0.42)),
}


def make_sky_warped(mode=""):
    """Paint the sky flat (sky + skylines), then warp it into the angled glass quad."""
    from PIL import Image
    fw, fh = FLAT
    flat = make_sky(mode)
    (fc, fl, fd, fh_), (nc, nl, nd) = SKYLINES[mode]
    far = make_skyline(41, 104, fc, fl, fd, haze=fh_)
    near = make_skyline(17, 136, nc, nl, nd)
    flat.blit(far, 0, fh - 104)
    flat.blit(near, 0, fh - 136)
    gx, gy, gw, gh = GLASS
    dst = [(x - gx, y - gy) for x, y in WIN_GLASS]
    src = [(0, 0), (fw, 0), (fw, fh), (0, fh)]
    Hinv = homography(dst, src)            # output pixel -> source pixel
    coeffs = (Hinv / Hinv[2, 2]).flatten()[:8]
    warped = flat.im.transform((gw, gh), Image.PERSPECTIVE, tuple(coeffs), Image.NEAREST)
    cv = C(gw, gh)
    cv.im = warped
    cv.d = None
    cv.p = cv.im.load()
    # transparent outside the quad
    mask = Image.new("L", (gw, gh), 0)
    from PIL import ImageDraw as _D
    _D.Draw(mask).polygon(dst, fill=255)
    cv.im.putalpha(mask)
    cv.p = cv.im.load()
    return cv


def make_window():
    """Window frame on the angled left wall: perspective quad, mullions, slanted sill."""
    xs = [p[0] for p in WIN_OUT]
    ys = [p[1] for p in WIN_OUT]
    ox, oy = min(xs) - 6, min(ys)
    sw, sh = max(xs) - ox + 12, max(ys) - oy + 16
    cv = C(sw, sh)
    L = lambda pts: [(x - ox, y - oy) for x, y in pts]  # noqa: E731
    base, light, dark, outl = "#4a2c3c", "#704658", "#2a1620", "#140810"
    cv.poly(L(WIN_OUT), base, outl)
    o_ = L(WIN_OUT)
    cv.line(o_[0][0] + 1, o_[0][1] + 1, o_[1][0] - 1, o_[1][1] + 1, light)
    cv.line(o_[0][0] + 1, o_[0][1] + 1, o_[3][0] + 1, o_[3][1] - 1, light)
    r = rnd(3)
    for _ in range(140):
        x, y = r.randint(0, sw - 1), r.randint(0, sh - 1)
        if cv.get(x, y)[3] == 255:
            cv.px(x, y, dark)
    # inner reveal: near (left) jamb catches warm light, far side darker
    g = L(WIN_GLASS)
    cv.poly([g[0], g[1], (g[1][0] + 2, g[1][1] - 3), (g[0][0] - 3, g[0][1] - 4)], dark)
    cv.poly([g[3], g[0], (g[0][0] - 3, g[0][1]), (g[3][0] - 3, g[3][1])], "#a0606a")
    # cut the glass
    from PIL import Image, ImageDraw as _D
    mask = Image.new("L", (sw, sh), 0)
    _D.Draw(mask).polygon(g, fill=255)
    mp = mask.load()
    for y in range(sh):
        for x in range(sw):
            if mp[x, y]:
                cv.p[x, y] = (0, 0, 0, 0)
    Hg = homography(UNIT, g)
    # mullions (perspective-correct thirds via the homography)
    for (u0, v0, u1, v1, w_) in ((0.5, 0, 0.5, 1, 4), (0, 0.36, 1, 0.36, 4), (0, 0.69, 1, 0.69, 4)):
        p0, p1 = hpt(Hg, u0, v0), hpt(Hg, u1, v1)
        cv.line(round(p0[0]), round(p0[1]), round(p1[0]), round(p1[1]), base, width=w_)
        cv.line(round(p0[0]) - 1, round(p0[1]), round(p1[0]) - 1, round(p1[1]), light)
    # glass reflections
    for (u, v) in ((0.12, 0.08), (0.62, 0.42), (0.15, 0.74)):
        for i in range(16):
            q = hpt(Hg, u + i * 0.012, v + 0.07 - i * 0.0045)
            cv.px(round(q[0]), round(q[1]), "#ffffff30")
    cv.tint(0, 0, sw, sh, "#ffb07a", lambda x, y: max(0, 1 - math.hypot(x + ox - SUN_SCENE[0], y + oy - SUN_SCENE[1]) / 120), 0.4)
    # slanted sill
    bl, br = L([WIN_OUT[3]])[0], L([WIN_OUT[2]])[0]
    top = [(bl[0] - 5, bl[1] - 2), (br[0] + 3, br[1] - 2), (br[0] + 6, br[1] + 3), (bl[0] - 7, bl[1] + 6)]
    front = [top[3], top[2], (top[2][0], top[2][1] + 6), (top[3][0], top[3][1] + 7)]
    cv.poly(front, "#4c2c3c", outl)
    cv.poly(top, "#8a5466", outl)
    cv.line(top[0][0] + 1, top[0][1] + 1, top[1][0] - 1, top[1][1] + 1, "#e09a86")
    return cv, ox, oy


# ---------------------------------------------------------------------------
# DECOR
# ---------------------------------------------------------------------------
LEAF = ("#2f6a3a", "#5c9c46", "#1b3f26")
LEAF2 = ("#3a7c40", "#86b84e", "#214a2a")
LEAF_SUN = ("#4a8a3a", "#a8d060", "#2a5a2a")


def make_hanging_plant():
    ROPE = 74
    cv = C(54, 120 + ROPE)
    cv.rect(26, 0, 2, ROPE, "#8a6a4e")           # long rope from the ceiling
    cv.rect(26, 0, 1, ROPE, "#b89470")
    for y in range(4, ROPE, 9):
        cv.px(27, y, "#6a4e38")
    o = ROPE - 16
    cv.line(27, o + 16, 14, o + 28, "#a88866")
    cv.line(27, o + 16, 40, o + 28, "#a88866")
    cv.rect(13, o + 28, 28, 12, "#b8704a")
    cv.rect(13, o + 28, 28, 2, "#e09a62")
    cv.rect(13, o + 28, 4, 12, "#d88a58")
    cv.rect(35, o + 30, 6, 10, "#94563a")
    cv.rect(15, o + 40, 24, 2, "#8a4e36")
    r = rnd(8)
    for vx, length, drift in ((14, 60, -1), (20, 88, 0), (28, 46, 1), (34, 78, 1), (40, 34, 1), (24, 70, -1)):
        x, y = vx, o + 36
        for i in range(length):
            y += 1
            if i % 4 == 0:
                x = max(3, min(50, x + r.choice((drift, 0, drift, -drift if drift else 1))))
            cv.px(x, y, "#1f4a2a")
            if i % 6 == 2:
                side = 1 if (i // 6) % 2 else -1
                leaf(cv, x, y, math.pi / 2 + side * 1.0, r.randint(6, 9), 3.6,
                     *(LEAF_SUN if x < 20 else (LEAF if r.random() < .5 else LEAF2)))
    for a in range(-7, 8):
        leaf(cv, 27, o + 32, -math.pi / 2 + a * 0.24, 9 + r.randint(0, 6), 3.4, *(LEAF if a % 2 else LEAF2))
    cv.outline("#120a12")
    return cv

def frame(w, h, inner):
    cv = C(w, h)
    cv.rect(0, 0, w, h, "#3e2c50")
    cv.orect(0, 0, w, h, "#120a1c")
    cv.rect(1, 1, w - 2, 1, "#5e4878")
    cv.rect(1, 1, 1, h - 2, "#5e4878")
    cv.rect(3, 3, w - 6, h - 6, inner)
    cv.orect(3, 3, w - 6, h - 6, "#170e22")
    return cv


def make_poster(pw=60, ph=88):
    cv = frame(pw, ph, "#251a3a")
    top = (ph - 45) // 2 - 4
    for i, word in enumerate(("CREATE", "DESIGN", "BUILD")):
        tw = text_width(word)
        cv.text((pw - tw) // 2, top + 1 + i * 16, word, "#5e5078")
        cv.text((pw - tw) // 2, top + i * 16, word, "#8e80aa")
    cv.rect(14, ph - 14, pw - 28, 1, "#4a3c66")
    return cv


PHOTO_SRC = os.path.join(HERE, "photo.jpg")
PHOTO_FRAME = (170, 8, 44, 64)    # x, y, w, h of the frame next to the poster


def make_frame_photo(src=None, rect=None, out="photo.png", focus=0.5):
    """Wooden frame + a photo, pixelated at 2x the scene resolution to stay in style."""
    from PIL import Image, ImageEnhance
    src = src or PHOTO_SRC
    fx, fy, fw, fh = rect or PHOTO_FRAME
    cv = frame(fw, fh, "#2a1e40")
    iw, ih = fw - 8, fh - 8        # inner opening
    ph = Image.open(src).convert("RGB")
    W0, H0 = ph.size
    target = iw / ih
    if W0 / H0 > target:            # too wide: cut the sides
        nw = int(H0 * target)
        ph = ph.crop(((W0 - nw) // 2, 0, (W0 - nw) // 2 + nw, H0))
    else:                           # too tall: trim top/bottom evenly
        nh = int(W0 / target)
        top_ = int((H0 - nh) * focus)
        ph = ph.crop((0, top_, W0, top_ + nh))
    ph = ph.resize((iw * 2, ih * 2), Image.LANCZOS)
    ph = ImageEnhance.Contrast(ph).enhance(1.12)
    ph = ImageEnhance.Color(ph).enhance(1.1)
    warm = Image.new("RGB", ph.size, (255, 170, 120))
    ph = Image.blend(ph, warm, 0.08)
    ph = ph.quantize(colors=40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    ph.save(os.path.join(OUT_SCENE, out), optimize=True)
    # mat + glass sheen on the frame sprite itself
    cv.rect(3, 3, fw - 6, fh - 6, "#e8dcd0")
    return cv


def make_frame_figure():
    cv = frame(30, 46, "#2a1e40")
    pal = {"#": "#6e5e96", "o": "#9c8cc4", "+": "#4a3c70"}
    fig = ["..###..", ".#ooo#.", ".#o+o#.", "..###..", ".#####.", "#+###+#", "#+###+#", ".#####.", ".#.#.#.", ".#...#."]
    cv.matrix(fig, 8, 10, pal, 2)
    return cv


def make_frame_art():
    cv = frame(36, 46, "#271c3a")
    for rr, c in ((12, "#4a3c6e"), (9, "#6a58a0"), (6, "#8a7ab8"), (3, "#b4a6d8")):
        cv.ell(18, 23, rr, rr, c)
    return cv


def make_frame_portrait():
    cv = frame(32, 44, "#3a2c4c")
    cv.vgrad(3, 3, 26, 38, [(0, "#4a3a5e"), (1, "#6a5070")])
    cv.ell(16, 18, 6, 7, "#22182e")
    cv.poly([(5, 40), (8, 29), (24, 29), (27, 40)], "#22182e")
    return cv


def make_frame_far():
    cv = frame(30, 44, "#2a2440")
    for a in range(-3, 4):
        leaf(cv, 15, 36, -math.pi / 2 + a * 0.35, 14, 2.6, "#4a4a6a", "#6a6a8a", "#30304a")
    return cv


def make_vinyl(size=50):
    c = size // 2
    R = c - 1
    cv = C(size, size)
    cv.ell(c, c, R, R, "#0f0c14")
    for f in (0.88, 0.75, 0.62, 0.5):
        cv.oell(c, c, round(R * f), round(R * f), "#221c2c")
    cv.ell(c, c, round(R * 0.34), round(R * 0.34), "#b0503a")     # label
    cv.ell(c, c, round(R * 0.26), round(R * 0.26), "#d8794a")
    cv.ell(c, c, 1, 1, "#0f0c14")
    for i in range(12):
        a = -2.6 + i * 0.08
        cv.px(c + round(math.cos(a) * R * 0.88), c + round(math.sin(a) * R * 0.88), "#4a4060")
        cv.px(c + round(math.cos(a) * R * 0.7), c + round(math.sin(a) * R * 0.7), "#3a3250")
    cv.outline("#07050a")
    return cv


def make_clock():
    cv = C(46, 46)
    cv.ell(23, 23, 22, 22, "#3a2230")
    cv.ell(23, 23, 21, 21, "#6e4434")
    cv.ell(23, 23, 18, 18, "#2a1620")
    cv.ell(23, 23, 17, 17, "#efe2d6")
    cv.ell(23, 23, 14, 14, "#f6ece2")
    for k in range(12):
        a = k * math.pi / 6
        x, y = 23 + math.cos(a) * 14.5, 23 + math.sin(a) * 14.5
        cv.rect(round(x), round(y), 2 if k % 3 == 0 else 1, 2 if k % 3 == 0 else 1, "#4a3446")
    cv.rect(21, 4, 4, 2, "#a0705a")                   # hanging tab
    cv.tint(0, 0, 46, 46, "#ffb080", lambda x, y: max(0, 1 - x / 46) * 0.6, 0.18)
    cv.outline("#0c0612")
    return cv


CLOCK_FACE = (28, 14)       # flat face sprite (w, h); warped onto the desk in perspective


def desk_clock_geometry(x_near=106, y_near=242, len_x=32, thick=11, size=1.4):
    """The clock stands on the desk turned to face into the room, so its face runs along the
    wall toward the vanishing point. Returns the face quad and the near end / top faces."""
    fw, fh = CLOCK_FACE
    def to_vp(x, y, x2):  # follow the line through (x, y) toward VP, evaluated at x2
        return y + (VP[1] - y) * (x2 - x) / (VP[0] - x)
    x_far = x_near + len_x
    k = (VP[0] - x_far) / (VP[0] - x_near)
    bl = (x_near, y_near)
    br = (x_far, to_vp(x_near, y_near, x_far))
    tl = (x_near, y_near - fh * size)
    tr = (x_far, br[1] - fh * size * k)
    face = [tl, tr, br, bl]
    # near end (faces the viewer: plain rectangle) and the top, both extending toward the wall
    end = [(x_near - thick, tl[1]), tl, bl, (x_near - thick, y_near)]
    top = [(x_near - thick, tl[1]), tl, tr, (x_far - thick * k, to_vp(x_near - thick, tl[1], x_far - thick * k))]
    foot = [(x_near - thick, y_near), bl, br, (x_far - thick * k, to_vp(x_near - thick, y_near, x_far - thick * k))]
    return face, end, top, foot


def make_desk_clock_face():
    """Flat front of the digital clock (the LCD digits are live DOM on top)."""
    fw, fh = CLOCK_FACE
    cv = C(fw, fh)
    cv.rect(0, 0, fw, fh, "#2a2634")
    cv.rect(0, 0, fw, 1, "#5e5874")
    cv.rect(0, fh - 1, fw, 1, "#16121e")
    cv.rect(fw - 1, 0, 1, fh, "#1c1826")
    cv.rect(2, 3, 24, 9, "#120a0c")
    cv.rect(2, 3, 24, 1, "#060304")
    return cv


def make_desk_clock_body():
    """Static parts in scene space: contact shadow, top face and the near end panel."""
    face, end, top, foot = desk_clock_geometry()
    pts = face + end + top + foot
    ox, oy = int(min(p[0] for p in pts)) - 2, int(min(p[1] for p in pts)) - 2
    w = int(max(p[0] for p in pts)) - ox + 6
    h = int(max(p[1] for p in pts)) - oy + 4
    cv = C(w, h)
    L_ = lambda q: [(x - ox, y - oy) for x, y in q]  # noqa: E731
    # soft shadow cast toward the right (light comes from the window on the left)
    sh = [(x + 3, y + 1) for x, y in foot]
    cv.poly(L_(sh), "#140810aa")
    cv.poly(L_(foot), "#0e0810cc")
    cv.poly(L_(top), "#4a4458", "#0c0a10")
    t = L_(top)
    cv.line(round(t[1][0]), round(t[1][1]), round(t[2][0]), round(t[2][1]), "#8a84a0")   # lit top edge
    cv.poly(L_(end), "#1e1a28", "#0c0a10")
    e = L_(end)
    cv.line(round(e[0][0]), round(e[0][1]) + 1, round(e[1][0]) - 1, round(e[1][1]) + 1, "#3a3448")
    return cv, ox, oy


def css_matrix3d(src_wh, quad, origin):
    """CSS matrix3d that maps a w*h box (origin 0 0) onto quad, relative to `origin`."""
    w, h = src_wh
    q = [(x - origin[0], y - origin[1]) for x, y in quad]
    Hm = homography([(0, 0), (w, 0), (w, h), (0, h)], q)
    a, b_, c = Hm[0]
    d, e, f = Hm[1]
    g, hh, i = Hm[2]
    vals = [a, d, 0, g, b_, e, 0, hh, 0, 0, 1, 0, c, f, 0, i]
    return "matrix3d(" + ",".join(f"{v:.6f}" for v in vals) + ")"


def make_couch():
    """Black leather sofa in the foreground, seen from behind and a little above: the back
    cushions peek over the backrest, the backrest shows its rounded top and rear panel, and the
    two rolled arms sit lower at each end (300x72; the bottom runs off-screen)."""
    W_, H_ = 300, 72
    cv = C(W_, H_)
    ink = "#050308"
    L = ["#0a080d", "#141119", "#1e1a26", "#2a2433", "#3a3245", "#4c435c", "#6a5f7c", "#a094b6"]
    AW = 36                                   # arm width
    # 1) back cushions on the far side, peeking over the backrest
    for x0, x1 in ((AW + 6, 150), (150, W_ - AW - 6)):
        w = x1 - x0
        cx = (x0 + x1) // 2
        cv.ell(cx, 10, w // 2, 9, ink)
        cv.ell(cx, 10, w // 2 - 1, 8, L[3])
        cv.ell(cx - 3, 9, w // 2 - 6, 6, L[4])
        cv.ell(cx - 10, 7, w // 3, 3, L[5])
        cv.rect(cx - w // 3, 3, w // 4, 1, L[6])
    cv.rect(150, 2, 1, 10, ink)
    # 2) backrest: rounded top surface seen from above, then the rear panel
    bx0, bx1 = AW - 6, W_ - AW + 6
    cv.rect(bx0 + 4, 10, bx1 - bx0 - 8, 8, L[4])          # top surface
    cv.ell(bx0 + 5, 14, 5, 4, L[4])
    cv.ell(bx1 - 6, 14, 5, 4, L[4])
    cv.rect(bx0 + 6, 11, bx1 - bx0 - 12, 2, L[5])          # sheen along the top
    cv.rect(bx0 + 12, 11, 110, 1, L[7])
    cv.rect(bx0 + 140, 11, 30, 1, L[6])
    cv.rect(bx0 + 190, 11, 12, 1, L[6])
    cv.rect(bx0 + 2, 17, bx1 - bx0 - 4, 1, ink)            # edge where top meets rear panel
    cv.rect(bx0 + 2, 18, bx1 - bx0 - 4, 1, L[3])           # piping
    cv.rect(bx0 + 2, 19, bx1 - bx0 - 4, H_ - 19, L[2])     # rear panel
    cv.rect(bx0 + 2, 34, bx1 - bx0 - 4, H_ - 34, L[1])
    for xx in range(bx0 + 30, bx1 - 20, 60):                 # upholstery seams
        cv.rect(xx, 20, 1, H_ - 20, L[0])
        cv.rect(xx + 1, 20, 1, H_ - 20, L[3])
    for xx in range(bx0 + 6, bx1 - 6, 4):                    # stitching under the piping
        cv.px(xx, 21, L[4])
    # 3) rolled arms, lower than the backrest, their tops running away from us
    for x0, lit in ((0, True), (W_ - AW, False)):
        cx = x0 + AW // 2
        cv.rect(x0, 26, AW, H_ - 26, L[2])                   # arm rear face
        cv.rect(x0, 40, AW, H_ - 40, L[1])
        cv.ell(cx, 22, AW // 2, 10, ink)                      # rolled top, seen from above
        cv.ell(cx, 22, AW // 2 - 1, 9, L[3])
        cv.ell(cx - 1, 21, AW // 2 - 4, 7, L[4])
        cv.ell(cx - 3, 18, AW // 3, 3, L[5] if lit else L[4])
        cv.rect(cx - 8, 15, 8, 1, L[7] if lit else L[6])
        cv.rect(x0 + 2, 28, AW - 4, 1, ink)
        cv.rect(x0 + 2, 29, AW - 4, 1, L[3])
        edge = x0 + AW - 1 if x0 == 0 else x0
        cv.rect(edge, 24, 1, H_ - 24, ink)                    # arm meets backrest
    # sunset rim light on the window side
    cv.rect(4, 17, 16, 1, "#c48a7c")
    cv.rect(0, 22, 1, 14, "#7a4e54")
    cv.rect(bx0 + 4, 10, 18, 1, "#b08080")
    cv.outline(ink)
    return cv


def make_ghana_sticker(angle=-13, w=22, h=15):
    """Ghana flag sticker: white die-cut border, one corner peeling, slapped on at an angle."""
    from PIL import Image
    cv = C(w + 4, h + 4)
    cv.rect(0, 0, w + 4, h + 4, "#f4f0ea")          # white sticker border
    x0, y0 = 2, 2
    b = h // 3
    cv.rect(x0, y0, w, b, "#ce1126")
    cv.rect(x0, y0 + b, w, h - 2 * b, "#fcd116")
    cv.rect(x0, y0 + h - b, w, b, "#006b3f")
    cx, cy = x0 + w / 2 - 0.5, y0 + h / 2 - 0.5
    star = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r_ = (h * 0.24) if i % 2 == 0 else (h * 0.1)
        star.append((cx + r_ * math.cos(a), cy + r_ * math.sin(a)))
    cv.poly(star, "#111111")
    # peeling top-right corner: fold shows the sticker's grey backing
    W_, H_ = w + 4, h + 4
    for i in range(4):
        for j in range(4 - i):
            cv.p[W_ - 1 - j, i] = (0, 0, 0, 0)
    cv.poly([(W_ - 5, 0), (W_ - 1, 4), (W_ - 5, 4)], "#c8c2ba")
    cv.px(1, 1, "#ffffff")
    cv.px(2, 1, "#ffffff")
    im = cv.im.rotate(angle, resample=Image.NEAREST, expand=True)
    out = C(im.width + 2, im.height + 2)
    # soft shadow under the sticker
    sh = Image.new("RGBA", im.size, (20, 8, 20, 0))
    sh.putalpha(im.split()[3].point(lambda a: 70 if a else 0))
    out.im.alpha_composite(sh, (2, 2))
    out.im.alpha_composite(im, (0, 0))
    out.p = out.im.load()
    return out


def make_desk_sticker():
    """Easter egg: a little Ghana sticker slapped on the desk front, under the clock.
    Drawn flat pixel by pixel, then each column is shifted to follow the front face's
    perspective (it rises toward the vanishing point), so it stays pixel-crisp."""
    bn, bf, ff, fn, k = desk_geometry()
    slope = (fn[1] - ff[1]) / (ff[0] - fn[0]) + 0.08     # face rise per px, plus a slight slapped-on tilt
    fw, fh = 13, 9                                      # flag
    W, H = fw + 2, fh + 2                               # with the white die-cut border
    flat = [[None] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            flat[y][x] = "#efe9e1"
    for y in range(fh):
        col = "#ce1126" if y < 3 else ("#fcd116" if y < 6 else "#006b3f")
        for x in range(fw):
            flat[y + 1][x + 1] = col
    cx, cy = 1 + fw // 2, 1 + fh // 2                   # black star
    for dx, dy in [(0, 0), (-1, 0), (1, 0), (0, -1), (-1, 1), (1, 1)]:
        flat[cy + dy][cx + dx] = "#141414"
    flat[0][W - 1] = None                               # peeling corner
    flat[0][W - 2] = "#bdb6ad"
    flat[1][W - 1] = "#bdb6ad"
    flat[0][0] = None
    flat[H - 1][0] = None
    flat[H - 1][W - 1] = None
    lift = int(math.ceil((W - 1) * slope))
    out = C(W + 1, H + lift + 2)
    for x in range(W):
        sh = round((W - 1 - x) * slope)
        for y in range(H):
            c = flat[y][x]
            if c:
                out.px(x, y + sh, c)
        # contact shadow one px below/right
        last = max((y for y in range(H) if flat[y][x]), default=None)
        if last is not None:
            out.px(x + 1, last + sh + 1, "#12080e80")
    out.px(W, round(0) + H, "#12080e80")
    t = 0.78
    cxp = fn[0] + (ff[0] - fn[0]) * t
    top_y = fn[1] + (ff[1] - fn[1]) * t
    face_h = DESK_H * (1 + (k - 1) * t)
    cyp = top_y + face_h * 0.48
    return out, int(round(cxp - W / 2)), int(round(cyp - (H + lift) / 2))


def make_ghana_flag():
    """Small Ghana flag hanging on two strings (28x26); sways in CSS from its top edge."""
    cv = C(28, 26)
    cv.rect(4, 0, 1, 6, "#3a2a2a")          # strings from the shelf
    cv.rect(23, 0, 1, 6, "#3a2a2a")
    x0, y0, w, h = 2, 6, 24, 18
    cv.rect(x0, y0, w, 6, "#ce1126")
    cv.rect(x0, y0 + 6, w, 6, "#fcd116")
    cv.rect(x0, y0 + 12, w, 6, "#006b3f")
    # black five-point star
    cx, cy = x0 + w // 2, y0 + 9
    star = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r_ = 4.2 if i % 2 == 0 else 1.8
        star.append((cx + r_ * math.cos(a), cy + r_ * math.sin(a)))
    cv.poly(star, "#111111")
    # cloth folds: light/dark vertical bands
    for x in (x0 + 7, x0 + 17):
        for y in range(y0, y0 + h):
            p_ = cv.p[x, y]
            cv.p[x, y] = tuple(int(c * 0.82) for c in p_[:3]) + (255,)
    for y in range(y0, y0 + h):
        p_ = cv.p[x0 + 12, y]
        cv.p[x0 + 12, y] = tuple(min(255, int(c * 1.1) + 8) for c in p_[:3]) + (255,)
    cv.rect(x0, y0, w, 1, "#6a1a20")         # hem along the top
    cv.outline("#1a0a10")
    return cv


def make_wall_shelf():
    """Floating shelf with the camera and a small plant (sized up)."""
    W_, H_ = 76, 52
    cv = C(W_, H_)
    # the camera is its own (clickable) layer: assets/scene/camera.png, drawn at (23, 8) on this shelf
    d = Scaled(cv, 1.14)
    d.rect(3, 26, 10, 11, "#2a2034")       # small pot
    d.rect(3, 26, 10, 1, "#4a3a58")
    leaf(cv, 10, 30, -1.9, 10, 3, *LEAF)
    leaf(cv, 10, 30, -1.3, 10, 3, *LEAF2)
    leaf(cv, 10, 30, -2.4, 8, 2, *LEAF)
    py = 40
    cv.rect(0, py, W_, 5, "#6e4430")
    cv.rect(0, py, W_, 1, "#a06a48")
    cv.rect(0, py + 4, W_, 1, "#3a2016")
    cv.rect(10, py + 5, 4, 7, "#3e2418")
    cv.rect(W_ - 14, py + 5, 4, 7, "#3e2418")
    return cv


SHELF_W = 364                  # long enough for the books, the creative folder and the plant pot


def make_shelf():
    sw = SHELF_W
    cv = C(sw, 40)
    r = rnd(4)
    cv.rect(2, 16, sw - 4, 5, "#0d071466")
    cv.rect(0, 0, sw, 4, "#b07444")       # top surface depth
    cv.rect(0, 0, sw, 1, "#e0a468")
    cv.rect(0, 4, sw, 11, "#8e5634")      # thick face
    for _ in range(220):                  # grain of the original 340px plank (same seed, same look)
        x, y = r.randint(1, 337), r.randint(5, 13)
        cv.rect(x, y, r.randint(2, 9), 1, "#6e4028" if r.random() < 0.7 else "#a8683e")
    r2 = rnd(41)
    for _ in range(14):                   # grain on the extension
        x, y = r2.randint(336, sw - 3), r2.randint(5, 13)
        cv.rect(x, y, r2.randint(2, 7), 1, "#6e4028" if r2.random() < 0.7 else "#a8683e")
    cv.rect(0, 4, sw, 1, "#c08050")
    cv.rect(0, 14, sw, 1, "#4a2818")
    cv.orect(0, 0, sw, 15, "#24120c")
    for bx in (26, sw - 58):
        cv.rect(bx, 15, 10, 4, "#5e3622")
        cv.poly([(bx + 1, 19), (bx + 9, 19), (bx + 9, 36)], "#5e3622")
        cv.line(bx + 1, 19, bx + 9, 36, "#80502e")
        cv.rect(bx + 8, 19, 2, 18, "#4a2818")
        cv.rect(bx, 15, 10, 1, "#24120c")
    cv.tint(0, 0, 200, 15, "#ffb070", lambda x, y: max(0, 1 - x / 200) * 0.9, 0.3)
    return cv


def make_shelf_plant():
    cv = C(58, 96)
    cv.poly([(12, 70), (46, 70), (42, 95), (16, 95)], "#a4a8c0")
    cv.rect(10, 66, 38, 6, "#c8ccdc")
    cv.rect(10, 66, 38, 1, "#eceff8")
    cv.poly([(36, 72), (46, 72), (42, 95), (34, 95)], "#727694")
    for y in (78, 86):
        cv.rect(14, y, 28, 1, "#8a8ea8")
    r = rnd(19)
    for a, ln in ((-2.75, 24), (-2.4, 30), (-2.05, 36), (-1.75, 40), (-1.45, 38), (-1.15, 34),
                  (-0.85, 30), (-0.5, 24), (-3.0, 18), (-0.25, 18)):
        leaf(cv, 29, 66, a + r.uniform(-0.05, 0.05), ln, 9, *(LEAF if r.random() < 0.5 else LEAF2))
    cv.outline("#0e0a10")
    return cv


FOLDER_LEAN = -9                # degrees; negative = top tips to the right, onto the plant pot


def make_folder(lean=FOLDER_LEAN):
    """Manila folder stuffed with papers, leaning against the shelf plant (creative work)."""
    w, h = 24, 44
    up = C(w, h)
    # back panel + tab (left)
    up.rect(0, 7, w, h - 7, "#b88a48")
    up.rect(1, 2, 10, 6, "#b88a48")
    up.rect(1, 2, 10, 1, "#dcae66")
    up.rect(10, 7, w - 10, 1, "#dcae66")
    # papers sticking out between the panels: two sheets + a coloured print
    up.rect(2, 4, 13, 18, "#e9e2d2")
    up.rect(2, 4, 13, 1, "#fffaf0")
    for yy in (7, 9, 11):
        up.rect(4, yy, 8, 1, "#a8a0b4")
    up.rect(13, 0, 9, 20, "#f7f2e6")
    up.rect(13, 0, 9, 1, "#ffffff")
    for yy in (3, 5, 7):
        up.rect(15, yy, 5, 1, "#a8a0b4")
    up.rect(5, 9, 10, 10, "#5a6ad8")
    up.rect(5, 9, 10, 1, "#8a9af6")
    up.rect(7, 11, 5, 5, "#ff7a8a")
    up.rect(9, 13, 4, 4, "#ffcf5a")
    # front panel (lower, lit top edge, shaded right side) + label
    up.rect(0, 17, w, h - 17, "#e0b466")
    up.rect(0, 17, w, 1, "#f8da94")
    up.rect(0, 18, w, 1, "#c8964e")
    up.rect(w - 4, 19, 4, h - 19, "#c8964e")
    up.rect(4, 25, 13, 8, "#fbf5e6")
    up.rect(5, 27, 10, 1, "#b0a490")
    up.rect(5, 29, 7, 1, "#b0a490")
    up.rect(0, h - 2, w, 2, "#a87c40")
    up.tint(0, 0, w, h, "#ffb070", lambda x, y: max(0, 1 - x / w) * 0.6, 0.25)   # warm window light from the left
    rot = up.im.rotate(lean, resample=Image.NEAREST, expand=True)
    bb = rot.getbbox()
    rot = rot.crop(bb)
    cv = C(rot.width + 2, rot.height + 2)
    cv.im.alpha_composite(rot, (1, 1))
    cv.p = cv.im.load()
    cv.outline("#0e0a10")
    return cv


DESK_BACK = vp_line(204)        # desk top meets the left wall along this line
DESK_X = (14, 120)               # along the wall, near -> far
DESK_D = 52                      # depth at the near end (screen px, perpendicular to the wall = horizontal)
DESK_H = 34                      # front face height at the near end


def desk_geometry():
    xn, xf = DESK_X
    k = (VP[0] - xf) / (VP[0] - xn)                     # foreshortening at the far end
    bn, bf = (xn, DESK_BACK(xn)), (xf, DESK_BACK(xf))
    fn, ff = (xn + DESK_D, bn[1]), (xf + DESK_D * k, bf[1])
    return bn, bf, ff, fn, k


def make_desk():
    bn, bf, ff, fn, k = desk_geometry()
    xs = [bn[0], bf[0], ff[0], fn[0]]
    ys = [bn[1], bf[1], ff[1], fn[1] + DESK_H + 4]
    ox, oy = int(min(xs)) - 2, int(min(ys)) - 2
    cv = C(int(max(xs) - ox) + 4, int(max(ys) - oy) + 4)
    L = lambda pts: [(x - ox, y - oy) for x, y in pts]  # noqa: E731
    top = L([bn, bf, ff, fn])
    fn2 = (fn[0], fn[1] + DESK_H)
    ff2 = (ff[0], ff[1] + DESK_H * k)
    side = L([ff, (ff[0], ff[1] + DESK_H * k), ff2])
    front = L([fn, ff, ff2, fn2])
    cv.poly(front, "#36202e", "#1a0c14")
    cv.poly(top, "#8a5a3c", "#2a1610")
    cv.line(top[3][0], top[3][1], top[2][0], top[2][1], "#d09a6a")           # lit front edge
    cv.line(top[3][0], top[3][1] + 1, top[2][0], top[2][1] + 1, "#5a3424")
    # drawer on the front face, following the perspective
    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    f = L([fn, ff, ff2, fn2])
    d0, d1 = lerp(f[0], f[1], 0.12), lerp(f[0], f[1], 0.62)
    d3, d2 = lerp(f[3], f[2], 0.12), lerp(f[3], f[2], 0.62)
    dr = [lerp(d0, d3, 0.2), lerp(d1, d2, 0.2), lerp(d1, d2, 0.62), lerp(d0, d3, 0.62)]
    cv.poly(dr, None, "#1c0f17")
    knob = lerp(lerp(dr[0], dr[1], 0.5), lerp(dr[3], dr[2], 0.5), 0.5)
    cv.rect(round(knob[0]) - 3, round(knob[1]), 6, 2, "#b08a6a")
    cv.tint(0, 0, cv.w, cv.h, "#ffb080", lambda x, y: max(0, 1 - abs(x + ox - 90) / 110) * 0.8, 0.22)
    manifest["desk"] = {"top": [list(p) for p in (bn, bf, ff, fn)]}
    return cv, ox, oy

class Scaled:
    """Draw hand-placed pixel art at a larger size on the same pixel grid."""
    def __init__(self, cv, k):
        self.cv, self.k = cv, k

    def _r(self, v):
        return int(round(v * self.k))

    def rect(self, x, y, w, h, c):
        x0, y0 = self._r(x), self._r(y)
        self.cv.rect(x0, y0, max(1, self._r(x + w) - x0), max(1, self._r(y + h) - y0), c)

    def px(self, x, y, c):
        self.rect(x, y, 1, 1, c)

    def ell(self, cx, cy, rx, ry, c):
        self.cv.ell(self._r(cx), self._r(cy), self._r(rx), self._r(ry), c)

    def oell(self, cx, cy, rx, ry, c):
        self.cv.oell(self._r(cx), self._r(cy), self._r(rx), self._r(ry), c)


def make_camera(k=1.0):
    cv = C(int(round(42 * k)), int(round(28 * k)))
    d = Scaled(cv, k)
    d.rect(5, 2, 12, 5, "#2a2630")
    d.rect(6, 2, 10, 1, "#58526a")
    d.rect(1, 6, 40, 21, "#1c1922")
    d.rect(1, 6, 40, 5, "#9a9aae")
    d.rect(1, 6, 40, 1, "#d8d8e8")
    d.rect(1, 11, 40, 1, "#4a4858")
    for yy in range(13, 26, 2):
        d.rect(4, yy, 7, 1, "#26222e")
    d.ell(23, 17, 9, 9, "#0c0a10")
    d.oell(23, 17, 9, 9, "#5a566a")
    d.oell(23, 17, 7, 7, "#3a3648")
    d.ell(23, 17, 4, 4, "#1a1830")
    d.ell(23, 17, 2, 2, "#3a3a7a")
    d.px(21, 15, "#d8d8ff")
    d.px(22, 15, "#9a9aff")
    d.rect(34, 2, 5, 4, "#2a2630")
    d.rect(36, 13, 2, 2, "#ff7a4a")
    cv.tint(0, 0, cv.w, cv.h, "#ffb080", lambda x, y: 1 if x < 10 * k else 0, 0.25)
    cv.outline("#06050a")
    return cv


def make_pencil_cup():
    cv = C(18, 28)
    for x, y, c in ((4, 2, "#ffcf5a"), (7, 0, "#6ac0ff"), (10, 3, "#ff7a8a"), (13, 6, "#9ae07a")):
        cv.rect(x, y + 2, 2, 14, c)
        cv.rect(x, y, 2, 2, "#f2d2a8")
    cv.rect(2, 12, 14, 16, "#4a3a72")
    cv.rect(2, 12, 14, 1, "#7a68a8")
    cv.rect(2, 12, 2, 16, "#6e5aa0")
    cv.rect(12, 13, 4, 15, "#33285a")
    cv.outline("#0c0814")
    return cv


def make_journal():
    cv = C(44, 16)
    cv.rect(0, 5, 44, 10, "#3a2a5c")
    cv.rect(1, 6, 42, 3, "#efdcb8")
    cv.rect(1, 7, 42, 1, "#cdb48e")
    cv.rect(0, 0, 44, 6, "#5e3e96")
    cv.rect(0, 0, 44, 1, "#9a76d4")
    cv.rect(33, 0, 3, 15, "#c89a4a")
    cv.rect(33, 0, 1, 15, "#f0c878")
    cv.rect(8, 2, 16, 1, "#c0a6ec")
    cv.rect(0, 14, 44, 1, "#22163a")
    cv.tint(0, 0, 44, 16, "#ffb080", lambda x, y: 1 if x < 16 else 0, 0.25)
    cv.outline("#0c0814")
    return cv


def make_figurine():
    cv = C(18, 22)
    pal = {"#": "#1e1628", "+": "#3a2a4a", "e": "#ffd86a"}
    fig = [
        ".#........#.",
        ".##......##.",
        ".##########.",
        "############",
        "##e##++##e##",
        "############",
        ".##########.",
        "..########..",
        ".##########.",
        "############",
        "##.######.##",
        "##.######.##",
        "...##..##...",
        "...##..##...",
    ]
    cv.matrix(fig, 3, 2, pal)
    cv.rect(2, 16, 14, 1, "#00000000")
    cv.tint(0, 0, 18, 22, "#ff9a6a", lambda x, y: 1 if x >= 12 else 0, 0.45)
    cv.outline("#0a0610")
    return cv


def make_chair():
    """Chair back seen from behind, parallel to the left wall (its edges run to the vanishing point)."""
    xl, xr = 40, 104
    top, bot = vp_line(206), vp_line(268)          # same family of lines as the desk
    pts = [(xl, top(xl)), (xr, top(xr)), (xr, bot(xr)), (xl, bot(xl))]
    ox, oy = xl - 3, int(min(p[1] for p in pts)) - 3
    cv = C(xr - xl + 8, int(max(p[1] for p in pts) - oy) + 4)
    L = lambda ps: [(x - ox, y - oy) for x, y in ps]  # noqa: E731
    q = L(pts)
    cv.poly(q, "#1e1228", "#0c0612")
    cv.line(q[0][0], q[0][1], q[1][0], q[1][1], "#5a4070")
    cv.line(q[0][0], q[0][1] + 1, q[1][0], q[1][1] + 1, "#3a2850")
    Hc = homography(UNIT, q)
    inner = [hpt(Hc, 0.1, 0.18), hpt(Hc, 0.9, 0.18), hpt(Hc, 0.9, 1.0), hpt(Hc, 0.1, 1.0)]
    cv.poly(inner, "#2a1a3c", "#130b1a")
    for u in (0.25, 0.4, 0.55, 0.7):
        a, b = hpt(Hc, u, 0.22), hpt(Hc, u, 1.0)
        cv.line(round(a[0]), round(a[1]), round(b[0]), round(b[1]), "#1e1228")
    cv.tint(0, 0, cv.w, cv.h, "#ff9a70", lambda x, y: 1 if y < 6 else 0, 0.3)
    return cv, ox, oy

def make_floor_plant():
    cv = C(80, 124)
    cv.poly([(18, 96), (62, 96), (57, 124), (23, 124)], "#3a2846")
    cv.rect(15, 92, 50, 6, "#53396a")
    cv.rect(15, 92, 50, 1, "#7a5a96")
    r = rnd(33)
    for i in range(18):
        a = -math.pi / 2 + r.uniform(-1.4, 1.3)
        leaf(cv, 40 + r.randint(-4, 4), 94, a, r.randint(28, 46), r.uniform(10, 13),
             *(LEAF_SUN if a > -1.2 else (LEAF if i % 2 else LEAF2)))
    cv.outline("#0b0810")
    return cv


# ---------------------------------------------------------------------------
# BOOKS
# ---------------------------------------------------------------------------
THEMES = {
    "uiux": {"base": "#7442c0", "light": "#9c6ce2", "dark": "#4a2488", "outline": "#1c0a3a",
             "accent": "#efe0ff", "accent2": "#c09cf4", "icon": "cursor"},
    "dev": {"base": "#2f56c4", "light": "#5a82ee", "dark": "#1c3488", "outline": "#0a1238",
            "accent": "#dce8ff", "accent2": "#90b4fa", "icon": "code"},
    "music": {"base": "#cc6626", "light": "#f29044", "dark": "#8c3a14", "outline": "#381206",
           "accent": "#ffe6c0", "accent2": "#fab474", "icon": "note"},
    "creative": {"base": "#b6303e", "light": "#e0566a", "dark": "#721628", "outline": "#2c040c",
                 "accent": "#ffd6cc", "accent2": "#f6968e", "icon": "palette"},
    "journal": {"base": "#327640", "light": "#52a05a", "dark": "#1e4a28", "outline": "#081e0e",
                "accent": "#dcf6c6", "accent2": "#92d28a", "icon": "book"},

}
PAINT = {"r": "#ff5a6a", "y": "#ffd23a", "g": "#5ad06a", "b": "#4a9aff", "p": "#c07aff"}


def draw_icon(cv, name, cx, cy, t, scale=1):
    rows = icons.PARSED[name]
    w, h = len(rows[0]) * scale, len(rows) * scale
    pal = {"#": t["accent"], "+": shade(t["dark"], -0.1), "o": shade(t["base"], -0.12), **PAINT}
    x0, y0 = cx - w // 2, cy - h // 2
    cv.matrix(rows, x0 + scale, y0 + scale, {k: t["outline"] for k in pal}, scale)
    cv.matrix(rows, x0, y0, pal, scale)


def flourish(cv, x, y, sx, sy, c, c2, s=1):
    """Small L-shaped corner ornament pointing into the panel from (x,y)."""
    for i in range(5):
        cv.rect(x + sx * i * s, y, s, s, c)
        cv.rect(x, y + sy * i * s, s, s, c)
    cv.rect(x + sx * 2 * s, y + sy * 2 * s, s, s, c2)
    cv.rect(x + sx * 1 * s, y + sy * 1 * s, s, s, c2)


def draw_cover(cv, x0, y0, w, h, t, s=1, spine=0):
    """Ornate cover face: bevel, inner gradient, double border, corner flourishes."""
    r = rnd(w * 7 + h)
    cv.rect(x0, y0, w, h, t["base"])
    cv.noise(x0 + 2, y0 + 2, w - 4, h - 4, shade(t["base"], -0.07), 0.12, r)
    # soft central glow + sunlight from the left
    cx, cy = x0 + w * 0.42, y0 + h * 0.42
    cv.tint(x0, y0, w, h, t["light"], lambda x, y: max(0, 1 - math.hypot((x - cx) / (w * 0.55), (y - cy) / (h * 0.6))) * 1.2, 0.55)
    cv.tint(x0, y0, w, h, "#ffd0a0", lambda x, y: max(0, 1 - (x - x0) / (w * 0.35)) * 0.8, 0.16)
    cv.tint(x0, y0, w, h, t["dark"], lambda x, y: max(0, (y - y0 - h * 0.7) / (h * 0.3)) * 0.9, 0.35)
    # bevel
    cv.rect(x0, y0, w, s, shade(t["light"], 0.25))
    cv.rect(x0, y0, s, h, shade(t["light"], 0.2))
    cv.rect(x0, y0 + h - 2 * s, w, 2 * s, t["dark"])
    cv.rect(x0 + w - s, y0, s, h, t["dark"])
    cv.orect(x0, y0, w, h, t["outline"])
    if s > 1:
        cv.orect(x0 + 1, y0 + 1, w - 2, h - 2, t["outline"])
    # double border
    m1, m2 = 4 * s, 6 * s
    for k in range(s):
        cv.orect(x0 + m1 + k, y0 + m1 + k, w - 2 * (m1 + k), h - 2 * (m1 + k), t["accent2"])
    cv.orect(x0 + m2, y0 + m2, w - 2 * m2, h - 2 * m2, mix(t["accent2"], t["base"], 0.55))
    # corner flourishes just inside the inner border
    i = m2 + 2 * s
    for (fx, fy, sx, sy) in ((x0 + i, y0 + i, 1, 1), (x0 + w - i - s, y0 + i, -1, 1),
                             (x0 + i, y0 + h - i - s, 1, -1), (x0 + w - i - s, y0 + h - i - s, -1, -1)):
        flourish(cv, fx, fy, sx, sy, t["accent"], t["accent2"], s)
    # tiny diamonds on the outer border midpoints
    for (dx, dy) in ((x0 + w // 2, y0 + m1), (x0 + w // 2, y0 + h - m1 - 1)):
        for (a, b) in ((0, 0), (-s, 0), (s, 0), (0, -s), (0, s)):
            cv.rect(dx + a, dy + b, s, s, t["accent"])


def make_book(key):
    """Shelf book standing cover-out (like the reference): ornate front cover + a sliver of
    book thickness on the right (back-cover edge and page block), slightly foreshortened."""
    t = THEMES[key]
    bw, bh = BOOK_W, BOOK_H
    cv = C(bw, bh)
    CW = bw - 8                       # cover face width; the rest is the visible side
    # side: back cover edge + page block, receding slightly toward the top/bottom
    cv.poly([(CW - 1, 0), (bw - 1, 3), (bw - 1, bh - 3), (CW - 1, bh - 1)], t["dark"])
    cv.poly([(CW, 2), (bw - 3, 4), (bw - 3, bh - 4), (CW, bh - 3)], "#e8d6c4")
    for y in range(6, bh - 6, 2):
        cv.line(CW, y, bw - 3, y + (1 if y < bh / 2 else 0), "#c7ab96")
    cv.line(bw - 2, 3, bw - 2, bh - 3, shade(t["dark"], -0.2))
    cv.tint(CW, 0, bw - CW, bh, "#2a1030", lambda x, y: 0.7, 0.28)   # side in shade (sun is on the left)
    cv.line(CW - 1, 0, bw - 1, 3, t["outline"])
    cv.line(CW - 1, bh - 1, bw - 1, bh - 3, t["outline"])
    cv.line(bw - 1, 3, bw - 1, bh - 3, t["outline"])
    draw_cover(cv, 0, 0, CW, bh, t)
    # hinge groove near the spine edge, like a real hardcover
    cv.rect(3, 2, 1, bh - 4, shade(t["dark"], -0.15))
    cv.rect(4, 2, 1, bh - 4, shade(t["light"], 0.15))
    cx = CW // 2 + 1
    cv.rect(cx - 9, 44, 18, 1, t["accent2"])
    for (a, b) in ((0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
        cv.px(cx + a, 44 + b, t["accent"])
    draw_icon(cv, t["icon"], cx, 62, t)
    cv.save(os.path.join(OUT_BOOKS, f"book-{key}.png"))


# ---------------------------------------------------------------------------
# OPEN BOOK (illustrated chassis + curved parchment pages)
# ---------------------------------------------------------------------------
PAPER = ["#f5eae8", "#eddfe0", "#fbf3f1"]      # soft pink-lavender paper, like the reference
PAPER_EDGE = "#b49ca8"
STACK = ["#e6d6da", "#d9c6cd", "#cbb4be"]
STACK_EDGE = "#a28a98"
PAPER_HI, PAPER_SPINE, PAPER_OUTER = "#fffaf8", "#c4aab4", "#dcc8cf"
SFX = ""   # file suffix for the light/dark variants ("", "-day", "-night")

PAPERS = {
    "": dict(PAPER=["#f5eae8", "#eddfe0", "#fbf3f1"], PAPER_EDGE="#b49ca8", STACK=["#e6d6da", "#d9c6cd", "#cbb4be"],
             STACK_EDGE="#a28a98", PAPER_HI="#fffaf8", PAPER_SPINE="#c4aab4", PAPER_OUTER="#dcc8cf"),
    "-day": dict(PAPER=["#fcfbf8", "#f3f1ec", "#ffffff"], PAPER_EDGE="#bcb5aa", STACK=["#eeebe4", "#e3dfd6", "#d6d1c6"],
                 STACK_EDGE="#aaa396", PAPER_HI="#ffffff", PAPER_SPINE="#d2ccc0", PAPER_OUTER="#e9e5dc"),
    "-night": dict(PAPER=["#211e28", "#1c1a22", "#27242e"], PAPER_EDGE="#4a4458", STACK=["#2c2934", "#26232d", "#201e27"],
                   STACK_EDGE="#3e3a48", PAPER_HI="#36313f", PAPER_SPINE="#0d0b11", PAPER_OUTER="#17151c"),
}


def use_paper(sfx):
    global SFX
    SFX = sfx
    globals().update(PAPERS[sfx])
BOOK = {"W": 330, "H": 216, "S": 165}
MOB = {"W": 180, "H": 300}


def page_shape(width, height, side, curve=10, bcurve=4, corner=6):
    """Page outline: dips toward the spine (pages bulge up from the binding), rounded outer corners."""
    def d(x):
        return (width - 1 - x) / (width - 1) if side == "left" else x / (width - 1)  # 0 spine .. 1 outer

    def round_off(x):
        dist = (x if side == "left" else width - 1 - x)       # distance from the outer edge
        if dist >= corner:
            return 0
        k = corner - dist
        return corner - math.sqrt(max(0, corner * corner - k * k))

    def top(x):
        return curve * (1 - d(x)) ** 1.8 + round_off(x)

    def bottom(x):
        return height - 1 - bcurve * (1 - (1 - d(x)) ** 1.8) - round_off(x)

    return top, bottom


def make_page(width, height, side, accent="#9a7cc4", curve=10, bcurve=4, spine_shade=True, name=None, ornaments=True, single=False):
    cv = C(width, height)
    top, bottom = page_shape(width, height, side, curve, bcurve)
    r = rnd(width + height + (1 if side == "left" else 2))
    for x in range(width):
        t0, b0 = int(round(top(x))), int(round(bottom(x)))
        for y in range(t0, b0 + 1):
            v = r.random()
            cv.p[x, y] = col(PAPER[1] if v < 0.18 else PAPER[2] if v < 0.24 else PAPER[0])
        cv.p[x, t0] = col(PAPER_EDGE)
        cv.p[x, b0] = col(PAPER_EDGE)
        if t0 + 1 < b0:
            cv.p[x, t0 + 1] = col(PAPER_HI)
    outer = 0 if side == "left" else width - 1
    for y in range(int(top(outer)), int(bottom(outer)) + 1):
        cv.p[outer, y] = col(PAPER_EDGE)
    if spine_shade:
        sp = width - 1 if side == "left" else 0
        for x in range(width):
            dist = abs(x - sp)
            # a narrow crease: a few px of shadow in the gutter, staying inside the page margin
            k = max(0, 1 - dist / 12) ** 1.6
            if k <= 0:
                continue
            for y in range(int(top(x)) + 1, int(bottom(x))):
                if k * 1.1 > bayer(x, y):
                    cv.p[x, y] = col(mix(cv.p[x, y], PAPER_SPINE, 0.5 * k + 0.08))
        # soft shade along the outer edge as the page curves away
        for x in range(width):
            dist = abs(x - outer)
            k = max(0, 1 - dist / 8)
            for y in range(int(top(x)) + 1, int(bottom(x))):
                if k * 0.7 > bayer(x, y):
                    cv.p[x, y] = col(mix(cv.p[x, y], PAPER_OUTER, 0.5))
    if ornaments:
        # corner flourishes (L-brackets with a curl and a diamond), inside the margins
        a1, a2 = accent, mix(accent, PAPER[0], 0.45)
        m = 7
        ytop = int(curve * 0.35) + m
        ybot = height - int(bcurve) - m - 1
        xo = m if side == "left" else width - m - 1          # outer side
        xi = width - m - 6 if side == "left" else m + 5     # spine side
        # the outer bottom corner is where the folded corner sits, so it has no flourish
        # (single phone pages have folds in both bottom corners)
        corners = [(xo, ytop, 1 if side == "left" else -1, 1), (xi, ytop + 4, -1 if side == "left" else 1, 1)]
        if not single:
            corners.append((xi, ybot - 2, -1 if side == "left" else 1, -1))
        for (cx, cy, sx, sy) in corners:
            for i in range(9):
                cv.px(cx + sx * i, cy, a2 if i > 5 else a1)
                cv.px(cx, cy + sy * i, a2 if i > 5 else a1)
            for (ddx, ddy) in ((3, 3), (2, 3), (3, 2), (4, 3), (3, 4)):
                cv.px(cx + sx * ddx, cy + sy * ddy, a1)
            cv.px(cx + sx * 6, cy + sy * 2, a2)
            cv.px(cx + sx * 2, cy + sy * 6, a2)
    if name:
        cv.save(os.path.join(OUT_UI, name))
    return cv


def corner_piece(cv, cx, cy, sx, sy, t, n=18):
    """Ornate metal corner: L-bracket with a filled curl, outlined."""
    fill, edge, hi = mix(t["accent"], "#c8c0e0", 0.35), t["outline"], "#ffffff"
    pts = [(cx, cy), (cx + sx * n, cy), (cx + sx * n, cy + sy * 4), (cx + sx * 6, cy + sy * 6),
           (cx + sx * 4, cy + sy * n), (cx, cy + sy * n)]
    cv.poly(pts, fill, edge)
    cv.poly([(cx + sx * 2, cy + sy * 2), (cx + sx * 9, cy + sy * 2), (cx + sx * 2, cy + sy * 9)], mix(fill, t["dark"], 0.35))
    for (ddx, ddy) in ((5, 5), (4, 5), (5, 4)):
        cv.px(cx + sx * ddx, cy + sy * ddy, fill)
    cv.px(cx + sx * 3, cy + sy * 3, hi)
    cv.px(cx + sx * (n - 3), cy + sy * 2, hi)
    cv.px(cx + sx * 2, cy + sy * (n - 3), hi)


def warp_top_to_spine(cv, S, dip, band=44):
    """Shift each column's top band down by up to `dip` px near the spine x=S (smooth falloff)."""
    src = cv.im.copy()
    sp = src.load()
    W_, H_ = cv.w, cv.h
    for x in range(W_):
        t = 1 - min(1.0, abs(x - S) / (S - 4))     # 1 at the spine, 0 at the outer edges
        d = dip * t ** 1.8
        if d < 0.5:
            continue
        for y in range(band):
            ys = y - d * (1 - y / band)               # sample from above; band bottom unchanged
            yi = int(round(ys))
            cv.p[x, y] = sp[x, yi] if 0 <= yi < H_ else (0, 0, 0, 0)


def make_open_book(key):
    t = THEMES[key]
    Wb, Hb, S = BOOK["W"], BOOK["H"], BOOK["S"]
    cv = C(Wb, Hb)
    r = rnd(len(key) * 5)
    # cover boards (with thickness at the bottom)
    cv.rect(3, 9, Wb - 6, 196, t["dark"])
    cv.rect(2, 4, Wb - 4, 196, t["base"])
    cv.noise(2, 4, Wb - 4, 196, shade(t["base"], -0.08), 0.16, r)
    cv.noise(2, 4, Wb - 4, 196, shade(t["base"], 0.06), 0.06, r)
    cv.rect(2, 4, Wb - 4, 1, t["light"])
    cv.rect(2, 4, 1, 196, t["light"])
    cv.rect(2, 198, Wb - 4, 2, t["dark"])
    cv.rect(3, 200, Wb - 6, 4, shade(t["dark"], -0.25))   # board edge
    cv.orect(2, 4, Wb - 4, 200, t["outline"])
    for (x, y) in ((2, 4), (Wb - 3, 4), (2, 203), (Wb - 3, 203)):
        cv.p[x, y] = (0, 0, 0, 0)
    # stitching
    for i in range(10, Wb - 10, 4):
        cv.rect(i, 7, 2, 1, t["accent2"])
        cv.rect(i, 197, 2, 1, t["accent2"])
    for i in range(10, 195, 4):
        cv.rect(5, i, 1, 2, t["accent2"])
        cv.rect(Wb - 6, i, 1, 2, t["accent2"])
    # raised lighter rim, rounded corners
    cv.orect(3, 5, Wb - 6, 198, mix(t["light"], t["accent2"], 0.4))
    for (x, y) in ((2, 4), (3, 4), (2, 5), (Wb - 3, 4), (Wb - 4, 4), (Wb - 3, 5),
                   (2, 203), (3, 203), (2, 202), (Wb - 3, 203), (Wb - 4, 203), (Wb - 3, 202)):
        cv.p[x, y] = (0, 0, 0, 0)
    # ornate metal corners
    for (cx, cy, sx, sy) in ((3, 5, 1, 1), (Wb - 4, 5, -1, 1), (3, 202, 1, -1), (Wb - 4, 202, -1, -1)):
        corner_piece(cv, cx, cy, sx, sy, t)
    # spine band (visible at top and bottom between the pages)
    cv.rect(S - 5, 4, 10, 200, t["dark"])
    cv.rect(S - 1, 4, 2, 200, shade(t["dark"], -0.3))
    # page stacks under each page
    for side in ("left", "right"):
        pw = S - 12
        for k in (5, 4, 3, 2, 1):
            stack = make_page(pw, 184, side, spine_shade=False, ornaments=False)
            for x in range(pw):
                for y in range(184):
                    p = stack.p[x, y]
                    if p[3]:
                        stack.p[x, y] = col(STACK[(k - 1) % 3]) if p[:3] != col(PAPER_EDGE)[:3] else col(STACK_EDGE)
            ox = 12 - k if side == "left" else S + k
            cv.blit(stack, ox, 10 + int(k * 1.3))
    cv.rect(S - 2, 14, 4, 182, "#6a4a5e")
    cv.rect(S - 1, 14, 2, 182, "#3e2838")
    # ribbon hanging from the spine
    rx = S - 4
    cv.rect(rx, 186, 9, 26, t["light"])
    cv.rect(rx, 186, 2, 26, shade(t["light"], 0.25))
    cv.rect(rx + 7, 186, 2, 26, t["dark"])
    for y in range(206, 212):
        d = y - 205
        for x in range(rx, rx + 9):
            if abs(x - (rx + 4)) < d * 0.8:
                cv.p[x, y] = (0, 0, 0, 0)
    cv.orect(rx - 1, 186, 11, 1, t["outline"])
    for y in range(186, 212):
        for x in (rx - 1, rx + 9):
            cv.px(x, y, t["outline"])
    # the board's top edge dips toward the spine like the pages do (rows below ~40 stay put)
    warp_top_to_spine(cv, S, 7)
    cv.save(os.path.join(OUT_UI, f"openbook-{key}{SFX}.png"))
    # halves for the cover animation
    cv.im.crop((0, 0, S, Hb)).save(os.path.join(OUT_UI, f"openbook-{key}-l{SFX}.png"))
    cv.im.crop((S, 0, Wb, Hb)).save(os.path.join(OUT_UI, f"openbook-{key}-r{SFX}.png"))

    # closed front cover (sits over the right half)
    cc = C(S, Hb)
    cc.rect(1, 9, S - 3, 196, t["dark"])
    draw_cover(cc, 0, 3, S - 2, 200, t, s=2)
    cc.rect(0, 3, 10, 200, t["dark"])                 # hinge
    cc.rect(10, 3, 1, 200, t["light"])
    cc.rect(11, 3, 1, 200, t["outline"])
    for (cx, cy, sx, sy) in ((S - 4, 4, -1, 1), (S - 4, 201, -1, -1)):
        corner_piece(cc, cx, cy, sx, sy, t)
    ccx = 12 + (S - 14) // 2
    cc.rect(ccx - 28, 100, 56, 2, t["accent2"])
    for (a, b) in ((0, 0), (-2, 0), (2, 0), (0, -2), (0, 2)):
        cc.rect(ccx + a - 1, 100 + b, 2, 2, t["accent"])
    draw_icon(cc, t["icon"], ccx, 138, t, scale=3)
    cc.save(os.path.join(OUT_UI, f"cover-{key}.png"))

    # phone: single page book + matching cover
    Wm, Hm = MOB["W"], MOB["H"]
    m = C(Wm, Hm)
    m.rect(3, 8, Wm - 6, Hm - 14, t["dark"])
    m.rect(2, 4, Wm - 4, Hm - 12, t["base"])
    m.noise(2, 4, Wm - 4, Hm - 12, shade(t["base"], -0.08), 0.16, r)
    m.rect(2, 4, Wm - 4, 1, t["light"])
    m.rect(3, Hm - 8, Wm - 6, 4, shade(t["dark"], -0.25))
    m.orect(2, 4, Wm - 4, Hm - 8, t["outline"])
    for i in range(10, Wm - 10, 4):
        m.rect(i, 7, 2, 1, t["accent2"])
        m.rect(i, Hm - 11, 2, 1, t["accent2"])
    for (cx, cy, sx, sy) in ((3, 5, 1, 1), (Wm - 4, 5, -1, 1), (3, Hm - 6, 1, -1), (Wm - 4, Hm - 6, -1, -1)):
        corner_piece(m, cx, cy, sx, sy, t, n=15)
    m.rect(2, 4, 8, Hm - 8, t["dark"])
    for k in (3, 2, 1):
        m.rect(10 + k, 9 + k, Wm - 22, Hm - 26, STACK[(k - 1) % 3])
        m.orect(10 + k, 9 + k, Wm - 22, Hm - 26, STACK_EDGE)
    m.save(os.path.join(OUT_UI, f"mbook-{key}{SFX}.png"))
    mc = C(Wm, Hm)
    mc.rect(3, 8, Wm - 6, Hm - 14, t["dark"])
    draw_cover(mc, 2, 4, Wm - 4, Hm - 12, t, s=2)
    mc.rect(2, 4, 10, Hm - 12, t["dark"])
    mc.rect(12, 4, 1, Hm - 12, t["light"])
    mc.rect(13, 4, 1, Hm - 12, t["outline"])
    mcx = 13 + (Wm - 15) // 2
    mc.rect(mcx - 26, 128, 52, 2, t["accent2"])
    draw_icon(mc, t["icon"], mcx, 180, t, scale=3)
    mc.save(os.path.join(OUT_UI, f"mcover-{key}.png"))


def make_ui9():
    for name, fill, border, hi in (("ui9", "#1c1230", "#5e4a8e", "#7e68b4"),
                                   ("ui9-active", "#33215e", "#b89ae8", "#e0d0ff"),
                                   ("ui9-paper", "#f7ece2", "#5a3a72", "#ffffff")):
        cv = C(24, 24)
        cv.rect(2, 1, 20, 22, fill)
        cv.rect(1, 2, 22, 20, fill)
        cv.rect(3, 0, 18, 1, border)
        cv.rect(3, 23, 18, 1, border)
        cv.rect(0, 3, 1, 18, border)
        cv.rect(23, 3, 1, 18, border)
        for (x, y) in ((1, 1), (2, 1), (1, 2), (22, 1), (21, 1), (22, 2), (1, 22), (2, 22), (1, 21), (22, 22), (21, 22), (22, 21)):
            cv.px(x, y, border)
        cv.rect(3, 1, 18, 1, hi)
        cv.save(os.path.join(OUT_UI, f"{name}.png"))


def make_logo():
    cv = C(34, 22)
    cv.text(3, 3, "JB", "#3a2466", 2)
    cv.text(2, 2, "JB", "#5a3a96", 2)
    cv.text(0, 0, "JB", "#ffffff", 2)
    for x in range(34):
        for y in range(11, 22):
            if cv.get(x, y)[:3] == (255, 255, 255):
                cv.p[x, y] = col("#d6c6fa")
    cv.outline("#0c0618")
    # trim the empty right/bottom margin so the mark centres in whatever holds it;
    # 1px of air on the left/top balances the 3D shadow falling to the bottom-right
    bb = cv.im.getbbox()
    from PIL import Image as _I
    trimmed = cv.im.crop(bb)
    out = _I.new("RGBA", (trimmed.width + 1, trimmed.height + 1), (0, 0, 0, 0))
    out.alpha_composite(trimmed, (1, 1))
    out.save(os.path.join(OUT_UI, "logo.png"))
    fv = C(32, 32, "#1c1230")
    fv.text(4, 8, "JB", "#f2ecff", 2)
    fv.save(os.path.join(ROOT, "public", "favicon.png"))


def make_parchment():
    cv = C(64, 64, PAPER[0])
    r = rnd(77)
    cv.noise(0, 0, 64, 64, PAPER[1], 0.22, r)
    cv.noise(0, 0, 64, 64, PAPER[2], 0.08, r)
    cv.save(os.path.join(OUT_UI, "parchment.png"))



# ---------------------------------------------------------------------------
# POST FX: pre-rendered bloom, soft sun shafts and a blurred room for behind the open book
# ---------------------------------------------------------------------------
from PIL import Image, ImageDraw, ImageFilter, ImageChops  # noqa: E402

SUN_DIR = (1.0, 0.24)   # low sunset light: travels right into the room, dipping slightly


def shaft_panes():
    """The six window panes (between the mullions) as quads in scene px."""
    Hg = homography(UNIT, WIN_GLASS)
    us, vs = ((0.02, 0.48), (0.52, 0.98)), ((0.02, 0.34), (0.38, 0.67), (0.71, 0.98))
    out = []
    for vi, (v0, v1) in enumerate(vs):
        for ui, (u0, u1) in enumerate(us):
            q = [hpt(Hg, u0, v0), hpt(Hg, u1, v0), hpt(Hg, u1, v1), hpt(Hg, u0, v1)]
            k = (0.38, 0.52, 0.42)[vi] * (0.8 if ui == 0 else 1.0)
            out.append((q, k))
    return out


def grade_im(im, mode, strength=1.0):
    """Recolour a sunset sprite for daylight or night (keeps alpha)."""
    import numpy as np
    a = np.asarray(im.convert("RGBA")).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3:]
    lum = (rgb @ np.array([0.3, 0.59, 0.11], np.float32))[..., None]
    if mode == "night":
        tgt = np.concatenate([lum * 0.40 + 0.015, lum * 0.46 + 0.025, lum * 0.80 + 0.07], -1)
        out = (rgb * 0.30 + tgt * 0.70) * 0.80
    else:  # day: brighter, a touch cooler and less pink
        out = rgb * 0.72 + lum * 0.28                  # calm the purple/pink sunset cast
        out = 1 - (1 - out) ** 1.6                     # lift the shadows: bright daylight
        out = out * np.array([1.0, 1.0, 1.02], np.float32) + 0.03
    out = rgb * (1 - strength) + np.clip(out, 0, 1) * strength
    res = np.concatenate([np.clip(out, 0, 1), al], -1)
    return Image.fromarray((res * 255).round().astype(np.uint8), "RGBA")


def vpath(src, mode):
    return src[:-4] + f"-{mode}.png"


# ---------------------------------------------------------------------------
# PHONE ROOM: a flat, front-facing window and a few small props for the tall layout
# ---------------------------------------------------------------------------
MW, MH = 72, 104          # phone window sprite


def make_mobile_window(mode=""):
    sfx = f"-{mode}" if mode else ""
    fw, fh = FLAT
    sky = make_sky(mode)
    (fc, fl, fd, fh_), (nc, nl, nd) = SKYLINES[mode]
    cl = make_clouds(mode)
    gw, gh = MW - 12, MH - 16
    oy = {"": 96, "day": 46, "night": 72}[mode]       # keep the sun / moon in view
    flat = C(gw, gh)
    flat.im.paste(sky.im.crop((22, oy, 22 + gw, oy + gh)), (0, 0))
    flat.p = flat.im.load()
    far = make_skyline(41, 104, fc, fl, fd, haze=fh_)
    near = make_skyline(17, 136, nc, nl, nd)
    flat.blit(far, -22, gh - 104 + 18)
    flat.blit(near, -22, gh - 136 + 30)
    cv = C(MW, MH)
    view = flat.im
    cv.im.paste(view, (6, 6))
    cv.p = cv.im.load()
    cl_im = cl.im.crop((10, 0, 10 + gw, 40))
    cv.im.alpha_composite(cl_im, (6, 14))
    cv.p = cv.im.load()
    base, light, dark, outl = "#4a2c3c", "#704658", "#2a1620", "#140810"
    # frame
    cv.rect(0, 0, MW, 6, base)
    cv.rect(0, 0, 6, MH - 6, base)
    cv.rect(MW - 6, 0, 6, MH - 6, base)
    cv.rect(0, MH - 12, MW, 6, base)
    cv.rect(1, 1, MW - 2, 1, light)
    cv.rect(1, 1, 1, MH - 13, light)
    cv.orect(5, 5, gw + 2, gh + 2, dark)
    # mullions
    cx = 6 + gw // 2
    cv.rect(cx - 1, 6, 3, gh, base)
    cv.rect(cx - 1, 6, 1, gh, light)
    cy = 6 + int(gh * 0.42)
    cv.rect(6, cy - 1, gw, 3, base)
    cv.rect(6, cy - 1, gw, 1, light)
    # sill
    cv.rect(0, MH - 7, MW, 7, light)
    cv.rect(0, MH - 7, MW, 1, "#a07080")
    cv.rect(0, MH - 2, MW, 2, dark)
    # glass sheen
    for i in range(10):
        cv.px(10 + i, 12 + i, "#ffffff40")
    cv.orect(0, 0, MW, MH, outl)
    cv.save(os.path.join(OUT_SCENE, f"m-window{sfx}.png"))


def make_mobile_props():
    # a row of four dark spine books
    sp = C(44, 58)
    cols = [("#2c2a4a", "#46426e"), ("#24304a", "#3a4c6e"), ("#30243e", "#4c3a5e"), ("#262a40", "#3c4260")]
    for i, (c0, c1) in enumerate(cols):
        x = i * 11
        h = 58 - (i % 2) * 4
        y = 58 - h
        sp.rect(x, y, 10, h, c0)
        sp.rect(x + 1, y, 2, h, c1)
        sp.rect(x, y + 8, 10, 1, "#8a7aa8")
        sp.rect(x, y + h - 10, 10, 1, "#8a7aa8")
        sp.rect(x + 4, y + 16, 2, 16, c1)
        sp.orect(x, y, 10, h, "#0c0814")
    sp.save(os.path.join(OUT_SCENE, "m-spines.png"))
    # small leafy pot plant
    pl = C(40, 56)
    pl.poly([(9, 34), (31, 34), (28, 55), (12, 55)], "#a4a8c0")
    pl.rect(7, 31, 26, 4, "#c8ccdc")
    pl.rect(7, 31, 26, 1, "#eceff8")
    pl.poly([(24, 35), (31, 35), (28, 55), (23, 55)], "#727694")
    r = rnd(23)
    for a, ln in ((-2.8, 16), (-2.4, 20), (-2.0, 22), (-1.6, 24), (-1.25, 22), (-0.9, 20), (-0.5, 16), (-3.05, 12), (-0.2, 12)):
        leaf(pl, 20, 32, a + r.uniform(-0.06, 0.06), ln, 6, *(LEAF if r.random() < 0.5 else LEAF2))
    pl.outline("#0e0a10")
    pl.save(os.path.join(OUT_SCENE, "m-pot.png"))
    make_camera(1.0).save(os.path.join(OUT_SCENE, "m-camera.png"))
    for n in ("m-spines", "m-pot", "m-camera"):
        manifest.setdefault("mobile", {})[n] = f"assets/scene/{n}.png"
    manifest.setdefault("mobile", {})["window"] = "assets/scene/m-window.png"


def make_mode_variants():
    """Day/night copies of every room layer, the shelf books, the window view and the clock."""
    gx, gy, gw, gh = GLASS
    for mode in ("day", "night"):
        for L in manifest["layers"]:
            path = os.path.join(ROOT, "public", L["src"])
            if L["name"] == "sky":
                make_sky_warped(mode).im.save(os.path.join(ROOT, "public", vpath(L["src"], mode)))
            elif L["name"] == "clouds":
                make_clouds(mode).im.save(os.path.join(ROOT, "public", vpath(L["src"], mode)))
            else:
                k = 0.75 if L.get("role") == "photo" else 1.0
                grade_im(Image.open(path), mode, k).save(os.path.join(ROOT, "public", vpath(L["src"], mode)))
        for b in manifest["books"]:
            grade_im(Image.open(os.path.join(ROOT, "public", b["src"])), mode, 0.55 if mode == "night" else 0.6).save(
                os.path.join(ROOT, "public", vpath(b["src"], mode)))
        for key in ("camera", "folder"):
            cs = manifest[key]["src"]
            grade_im(Image.open(os.path.join(ROOT, "public", cs)), mode).save(os.path.join(ROOT, "public", vpath(cs, mode)))
        dc = manifest["deskClock"]["src"]
        grade_im(Image.open(os.path.join(ROOT, "public", dc)), mode, 0.8).save(os.path.join(ROOT, "public", vpath(dc, mode)))
        make_mobile_window(mode)
        for f in ("m-spines.png", "m-pot.png", "m-camera.png"):
            grade_im(Image.open(os.path.join(OUT_SCENE, f)), mode).save(os.path.join(OUT_SCENE, f[:-4] + f"-{mode}.png"))
        for f in ("wall-tile.png",):
            grade_im(Image.open(os.path.join(OUT_SCENE, f)), mode).save(os.path.join(OUT_SCENE, f[:-4] + f"-{mode}.png"))


def compose(books=True, full=False, mode=""):
    O = OVER
    vp_ = (lambda src: vpath(src, mode)) if mode else (lambda src: src)
    im = Image.new("RGBA", (W + 2 * O, H + 2 * O))
    g = manifest["glass"]
    extra = [{**manifest["folder"], "name": "folder", "z": 8.5}] if "folder" in manifest else []   # in front of the pot
    for L in sorted(manifest["layers"] + extra, key=lambda l: l["z"]):
        s_ = Image.open(os.path.join(ROOT, "public", vp_(L["src"])))
        if L["name"] == "clouds":
            s_ = s_.crop((0, 0, g[2], s_.height))
        if (s_.width, s_.height) != (L["w"], L["h"]):
            s_ = s_.resize((L["w"], L["h"]), Image.NEAREST)
        tmp = Image.new("RGBA", im.size)
        tmp.alpha_composite(s_, (L["x"] + O, L["y"] + O))
        if L.get("role") == "sky":
            mask = Image.new("L", im.size, 0)
            ImageDraw.Draw(mask).polygon([(x + O, y + O) for x, y in WIN_GLASS], fill=255)
            im = Image.composite(Image.alpha_composite(im, tmp), im, mask)
        else:
            im = Image.alpha_composite(im, tmp)
    for key in ("camera",):
        if key in manifest:
            c_ = manifest[key]
            im.alpha_composite(Image.open(os.path.join(ROOT, "public", vp_(c_["src"]))), (c_["x"] + O, c_["y"] + O))
    if books:
        for b in manifest["books"]:
            im.alpha_composite(Image.open(os.path.join(ROOT, "public", vp_(b["src"]))), (b["x"] + O, b["y"] + O))
    return im if full else im.crop((O, O, O + W, O + H))


FX_MODE = {  # bloom colours, shaft colour + strength, blur tint
    "": ((255, 196, 140), (255, 170, 130), (255, 212, 158), 1.0, (24, 12, 40), 0.35),
    "day": ((255, 250, 236), (240, 246, 255), (255, 250, 232), 0.85, (40, 44, 64), 0.22),
    "night": ((255, 214, 150), (150, 160, 255), (168, 186, 255), 0.6, (4, 6, 18), 0.38),
}


def make_fx(mode=""):
    sfx = f"-{mode}" if mode else ""
    gcol, wcol, scol, sk, bcol, bk = FX_MODE[mode]
    scene = compose(True, mode=mode).convert("RGB")
    # 1) bloom: keep only the bright, warm parts of the image, blur them wide, tint warm
    lum = scene.convert("L")
    bright = lum.point(lambda v: max(0, v - 150) * 2.4)
    glow = Image.new("RGBA", (W, H), gcol + (0,))
    glow.putalpha(bright.filter(ImageFilter.GaussianBlur(7)).point(lambda v: min(150, v)))
    wide = Image.new("RGBA", (W, H), wcol + (0,))
    wide.putalpha(bright.filter(ImageFilter.GaussianBlur(22)).point(lambda v: min(90, int(v * 0.9))))
    bloom = Image.alpha_composite(wide, glow)
    bloom.save(os.path.join(OUT_SCENE, f"fx-bloom{sfx}.png"), optimize=True)
    # 2) sun shafts: each window pane swept along the light direction (parallel beams with
    #    gaps where the mullions are), starting at the glass and fading as they cross the room
    import numpy as np
    dx, dy = SUN_DIR
    n = math.hypot(dx, dy)
    dx, dy = dx / n, dy / n
    LEN = 330
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    edge_x = WIN_GLASS[1][0]
    # distance travelled from the glass plane (approx. by x), smooth fade in + long fade out
    t = np.clip((xx - (edge_x - 6)) / LEN, 0, 1)
    fade = np.clip((xx - (edge_x - 10)) / 22, 0, 1) * (1 - t) ** 1.6
    acc = np.zeros((H, W), np.float32)
    for q, k in shaft_panes():
        lay = Image.new("L", (W, H), 0)
        moved = [(x + dx * LEN, y + dy * LEN) for x, y in q]
        pts = q + moved
        # convex hull of pane + its swept copy
        hull = sorted(set((round(x, 2), round(y, 2)) for x, y in pts))
        def cross(o, a_, b_):
            return (a_[0] - o[0]) * (b_[1] - o[1]) - (a_[1] - o[1]) * (b_[0] - o[0])
        lo, up = [], []
        for p_ in hull:
            while len(lo) >= 2 and cross(lo[-2], lo[-1], p_) <= 0:
                lo.pop()
            lo.append(p_)
        for p_ in reversed(hull):
            while len(up) >= 2 and cross(up[-2], up[-1], p_) <= 0:
                up.pop()
            up.append(p_)
        ImageDraw.Draw(lay).polygon(lo[:-1] + up[:-1], fill=255)
        lay = lay.filter(ImageFilter.GaussianBlur(2.5))
        acc = np.maximum(acc, np.asarray(lay, np.float32) / 255 * k)
    # no beams painted over the window itself
    gm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(gm).polygon(WIN_OUT, fill=255)
    gm = np.asarray(gm.filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    alpha = acc * fade * (1 - gm) * sk
    a_img = Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    sh = Image.new("RGBA", (W, H), scol + (0,))
    sh.putalpha(a_img)
    sh.save(os.path.join(OUT_SCENE, f"fx-shafts{sfx}.png"), optimize=True)
    # 3) blurred, dimmed room (shown behind the open book instead of a live backdrop-filter)
    # one even blur over the whole room including the overscan, so it reaches every edge
    room = compose(False, full=True, mode=mode).convert("RGB").filter(ImageFilter.GaussianBlur(2.2))
    room = Image.blend(room, Image.new("RGB", room.size, bcol), bk)
    room.save(os.path.join(OUT_SCENE, f"fx-room-blur{sfx}.png"), optimize=True)
    manifest["fx"] = {"bloom": "assets/scene/fx-bloom.png", "shafts": "assets/scene/fx-shafts.png",
                      "blur": "assets/scene/fx-room-blur.png"}


# ---------------------------------------------------------------------------
def main():
    wall = make_wall()
    add("wall", wall, -OVER, -OVER, 0)
    gx, gy, gw, gh = GLASS
    add("sky", make_sky_warped(), gx, gy, 1, role="sky")
    add("clouds", make_clouds(), gx, gy + 6, 2, cls="clouds", role="sky")
    manifest["glassQuad"] = [[x - gx, y - gy] for x, y in WIN_GLASS]
    manifest["cloudSkew"] = math.degrees(math.atan2(WIN_GLASS[1][1] - WIN_GLASS[0][1], WIN_GLASS[1][0] - WIN_GLASS[0][0]))
    win, wx, wy = make_window()
    add("window", win, wx, wy, 5)
    add("hanging-plant", make_hanging_plant(), 122, -80, 7, cls="sway")
    # wall gallery: sized up and spaced along the back wall (x 166-480)
    fx_, fy_, fw_, fh_ = PHOTO_FRAME
    add("frame-photo", make_frame_photo(), fx_, fy_, 5)
    manifest["layers"].append({"name": "photo", "src": "assets/scene/photo.png", "x": fx_ + 4, "y": fy_ + 4,
                               "w": fw_ - 8, "h": fh_ - 8, "z": 5, "role": "photo"})
    add("poster", make_poster(56, 84), 222, 0, 5)
    add("wall-shelf", make_wall_shelf(), 288, 14, 5)
    cam = make_camera(1.14)
    cam.save(os.path.join(OUT_SCENE, "camera.png"))
    manifest["camera"] = {"src": "assets/scene/camera.png", "x": 288 + 23, "y": 14 + 8, "w": cam.w, "h": cam.h}
    DR = (372, 8, 44, 64)                                   # drum photo, right of the floating shelf
    add("frame-drums", make_frame_photo(os.path.join(HERE, "photo-drums.jpg"), DR, "photo-drums.png", focus=0.35),
        DR[0], DR[1], 5)
    manifest["layers"].append({"name": "photo-drums", "src": "assets/scene/photo-drums.png", "x": DR[0] + 4,
                               "y": DR[1] + 4, "w": DR[2] - 8, "h": DR[3] - 8, "z": 5, "role": "photo"})
    add("vinyl", make_vinyl(56), 424, 12, 5)                  # record, bigger, at the right end
    AW = (486, 8, 42, 58)                                   # "Best Drummer" photo, right of the record
    add("frame-award", make_frame_photo(os.path.join(HERE, "photo-award.png"), AW, "photo-award.png", focus=0.3),
        AW[0], AW[1], 5)
    manifest["layers"].append({"name": "photo-award", "src": "assets/scene/photo-award.png", "x": AW[0] + 4,
                               "y": AW[1] + 4, "w": AW[2] - 8, "h": AW[3] - 8, "z": 5, "role": "photo"})
    add("shelf", make_shelf(), 148, SHELF_Y - 2, 6)
    add("shelf-plant", make_shelf_plant(), 460, SHELF_Y - 94, 8)
    # creative folder: leans right against the plant pot, just past the last book (clickable, like the camera)
    fold = make_folder()
    fold.save(os.path.join(OUT_SCENE, "folder.png"))
    manifest["folder"] = {"src": "assets/scene/folder.png", "x": 448, "y": SHELF_Y + 1 - fold.h, "w": fold.w, "h": fold.h, "z": 9}
    desk, dx, dy = make_desk()
    add("desk", desk, dx, dy, 10)
    gs, gx, gy = make_desk_sticker()
    add("ghana-sticker", gs, gx, gy, 11)                                     # easter egg on the desk front
    bn, bf, ff, fn, k = desk_geometry()
    add("pencil-cup", make_pencil_cup(), 74, int(DESK_BACK(88)) - 18, 11)
    # digital clock standing on the desk top (its base row lands inside the desk surface)
    body, bx_, by_ = make_desk_clock_body()
    add("desk-clock-body", body, bx_, by_, 12)
    face_cv = make_desk_clock_face()
    face_cv.save(os.path.join(OUT_SCENE, "desk-clock.png"))
    face_q = desk_clock_geometry()[0]
    manifest["deskClock"] = {"src": "assets/scene/desk-clock.png", "w": CLOCK_FACE[0], "h": CLOCK_FACE[1],
                             "z": 12, "lcd": [2, 3, 24, 9], "transform": css_matrix3d(CLOCK_FACE, face_q, (0, 0))}
    chair, cx_, cy_ = make_chair()
    add("chair", chair, cx_, cy_, 13)
    add("floor-plant", make_floor_plant(), -24, 170, 14)

    order = ["uiux", "dev", "music", "creative", "journal"]
    for i, k in enumerate(order):
        make_book(k)
        manifest["books"].append({"id": k, "src": f"assets/books/book-{k}.png", "x": 162 + i * 57,
                                  "y": SHELF_Y - BOOK_H + 1, "w": BOOK_W, "h": BOOK_H})
    for k in THEMES:
        make_open_book(k)
    S = BOOK["S"]
    for sfx in ("", "-day", "-night"):
        use_paper(sfx)
        if sfx:
            for k in THEMES:
                make_open_book(k)          # page stacks change colour with the paper
        make_page(S - 12, 184, "left", name=f"page-left{sfx}.png")
        make_page(S - 12, 184, "right", name=f"page-right{sfx}.png")
        make_page(MOB["W"] - 22, MOB["H"] - 26, "right", curve=3, bcurve=2, name=f"page-single{sfx}.png", single=True)
    use_paper("")
    manifest["openbook"] = {
        "W": BOOK["W"], "H": BOOK["H"], "S": S,
        "left": {"page": [12, 10, S - 12, 184], "content": [13, 17, S - 12 - 24, 154]},
        "right": {"page": [S, 10, S - 12, 184], "content": [14, 17, S - 12 - 26, 154]},
    }
    manifest["mbook"] = {
        "W": MOB["W"], "H": MOB["H"],
        "page": [11, 9, MOB["W"] - 22, MOB["H"] - 26], "content": [10, 10, MOB["W"] - 22 - 20, MOB["H"] - 26 - 26],
    }
    make_parchment()
    make_ui9()
    make_logo()
    tile = C(52, 104)
    tile.im = wall.im.crop((330 + OVER, 60 + OVER, 382 + OVER, 164 + OVER))
    tile.save(os.path.join(OUT_SCENE, "wall-tile.png"))
    manifest["themes"] = THEMES
    with open(os.path.join(ROOT, "src", "data", "sceneManifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    make_mobile_window()
    make_mobile_props()
    make_mode_variants()
    for mode in ("", "day", "night"):
        make_fx(mode)
    with open(os.path.join(ROOT, "src", "data", "sceneManifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    icons.export(os.path.join(ROOT, "src", "data", "pixelIcons.json"))
    print("assets ok:", len(manifest["layers"]), "layers")


if __name__ == "__main__":
    main()
