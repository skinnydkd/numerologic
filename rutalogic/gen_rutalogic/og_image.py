"""Genera rutalogic/og-image.png (1200x630) per a les previsualitzacions de compartir.

Logotip RUTA·L·Ò·GIC (Anton) i el rusc 3-4-5-4-3 amb una ruta marcada.

Ús (des de la carpeta rutalogic):  python -m gen_rutalogic.og_image   (requereix Pillow)
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
TURQ = (88, 180, 196)      # #58b4c4
DEEP = (14, 116, 144)      # #0e7490 (ruta)
RED = (236, 90, 82)        # #ec5a52
GOLD = (234, 179, 8)       # #eab308
DARK = (31, 41, 55)
WHITE = (255, 255, 255)

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTON = os.path.join(os.path.dirname(GAME), "fonts", "anton.woff2")
ARIALBD = "C:/Windows/Fonts/arialbd.ttf"

ROWS = (3, 4, 5, 4, 3)
OPS = ["+3", "×2", "−1", "÷2", "+5", "×3", "−4", "+2", "÷3", "5", "+1", "×2", "−2", "+4", "÷2", "×3", "−3", "+6", "+2"]
ROUTE = {10: 1, 14: 2, 13: 3}
LAST = 13


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def hexagon(cx, cy, s):
    return [(cx + s * math.cos(math.radians(-90 + 60 * k)), cy + s * math.sin(math.radians(-90 + 60 * k))) for k in range(6)]


def main():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_word, f_op, f_url = font(ANTON, 96), font(ARIALBD, 30), font(ARIALBD, 30)

    segs = [("RUTA", DARK), ("L", TURQ), ("Ò", RED), ("GIC", TURQ)]
    widths = [d.textlength(t, font=f_word) for t, _ in segs]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(segs, widths):
        d.text((x, 16), t, font=f_word, fill=c)
        x += w

    s = 48
    wx = math.sqrt(3) * s
    cy0 = 210
    i = 0
    for r, n in enumerate(ROWS):
        y = cy0 + r * 1.5 * s * 0.95
        x0 = W / 2 - (n - 1) * wx / 2
        for k in range(n):
            cx = x0 + k * wx
            fill = RED if i == 9 else GOLD if i == LAST else DEEP if i in ROUTE else TURQ
            d.polygon(hexagon(cx, y, s - 3), fill=fill)
            t = OPS[i]
            d.text((cx - d.textlength(t, font=f_op) / 2, y - 18), t, font=f_op, fill=WHITE)
            i += 1

    url = "numerologic.cat/rutalogic"
    d.text(((W - d.textlength(url, font=f_url)) / 2, 578), url, font=f_url, fill=TURQ)
    out = os.path.join(GAME, "og-image.png")
    img.save(out, optimize=True)
    print("Escrit", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
