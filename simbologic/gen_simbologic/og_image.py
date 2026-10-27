"""Genera simbologic/og-image.png (1200x630) per a les previsualitzacions de compartir.

Logotip SIMBO·L·Ò·GIC (Anton) i una graella 3×3 de símbols amb els totals.

Ús (des de la carpeta simbologic):  python -m gen_simbologic.og_image   (requereix Pillow)
"""
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
TURQ = (88, 180, 196)      # #58b4c4
RED = (236, 90, 82)        # #ec5a52
DARKS = (31, 41, 55)       # #1f2937
GRAY = (100, 116, 139)
CELL = (248, 250, 252)
WHITE = (255, 255, 255)

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTON = os.path.join(os.path.dirname(GAME), "fonts", "anton.woff2")
ARIALBD = "C:/Windows/Fonts/arialbd.ttf"

CELLS = [[0, 0, 0], [0, 1, 1], [1, 2, 2]]
VALUES = [4, 7, 9]


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def symbol(d, s, cx, cy, r):
    if s == 0:
        pts = [(cx, cy - r), (cx + .87 * r, cy - r / 2), (cx + .87 * r, cy + r / 2), (cx, cy + r), (cx - .87 * r, cy + r / 2), (cx - .87 * r, cy - r / 2)]
        d.polygon(pts, fill=TURQ)
    elif s == 1:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=RED)
    else:
        d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=DARKS)


def main():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_word, f_tot = font(ANTON, 100), font(ARIALBD, 40)
    f_sub, f_url = font(ARIALBD, 32), font(ARIALBD, 30)

    segs = [("SIMBO", DARKS), ("L", TURQ), ("Ò", RED), ("GIC", TURQ)]
    widths = [d.textlength(t, font=f_word) for t, _ in segs]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(segs, widths):
        d.text((x, 24), t, font=f_word, fill=c)
        x += w
    sub = "Troba quant val cada símbol"
    d.text(((W - d.textlength(sub, font=f_sub)) / 2, 164), sub, font=f_sub, fill=GRAY)

    s, gap = 88, 10
    x0, y0 = (W - (4 * s + 3 * gap)) / 2, 214
    for i, row in enumerate(CELLS):
        for j, sym in enumerate(row):
            x, y = x0 + j * (s + gap), y0 + i * (s + gap)
            d.rounded_rectangle((x, y, x + s, y + s), radius=16, fill=CELL)
            symbol(d, sym, x + s / 2, y + s / 2, 31)
        t = str(sum(VALUES[k] for k in row))
        d.text((x0 + 3 * (s + gap) + s / 2 - d.textlength(t, font=f_tot) / 2, y0 + i * (s + gap) + 22), t, font=f_tot, fill=DARKS)
    for j in range(3):
        t = str(sum(VALUES[r[j]] for r in CELLS))
        d.text((x0 + j * (s + gap) + s / 2 - d.textlength(t, font=f_tot) / 2, y0 + 3 * (s + gap) - 2), t, font=f_tot, fill=DARKS)

    url = "numerologic.cat/simbologic"
    d.text(((W - d.textlength(url, font=f_url)) / 2, 578), url, font=f_url, fill=TURQ)

    out = os.path.join(GAME, "og-image.png")
    img.save(out, optimize=True)
    print("Escrit", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
