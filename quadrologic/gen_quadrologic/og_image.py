"""Genera quadrologic/og-image.png (1200x630) per a les previsualitzacions de compartir.

Logotip QUADRO·L·Ò·GIC (Anton) i una graella 4×4 amb gàbies i algunes xifres.

Ús (des de la carpeta quadrologic):  python -m gen_quadrologic.og_image   (requereix Pillow)
"""
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
TURQ = (88, 180, 196)      # #58b4c4
RED = (236, 90, 82)        # #ec5a52
DARK = (31, 41, 55)
GRAY = (100, 116, 139)
LINE = (226, 232, 240)
WHITE = (255, 255, 255)

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTON = os.path.join(os.path.dirname(GAME), "fonts", "anton.woff2")
ARIALBD = "C:/Windows/Fonts/arialbd.ttf"

SOL = [[4, 1, 3, 2], [2, 3, 1, 4], [1, 2, 4, 3], [3, 4, 2, 1]]
CAGES = [  # (cel·les, etiqueta)
    ([(0, 0), (1, 0)], "2÷"), ([(0, 1), (0, 2)], "3×"), ([(0, 3)], "2"),
    ([(1, 1), (2, 1), (3, 1)], "9+"), ([(1, 2), (2, 2), (2, 3)], "8+"), ([(1, 3)], "4"),
    ([(2, 0), (3, 0)], "4+"), ([(3, 2), (3, 3)], "1−"),
]
SHOWN = {(0, 0), (0, 3), (1, 3), (2, 1), (3, 3)}


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def main():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_word, f_val, f_lab = font(ANTON, 96), font(ARIALBD, 50), font(ARIALBD, 22)
    f_url = font(ARIALBD, 30)

    segs = [("QUADRO", DARK), ("L", TURQ), ("Ò", RED), ("GIC", TURQ)]
    widths = [d.textlength(t, font=f_word) for t, _ in segs]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(segs, widths):
        d.text((x, 20), t, font=f_word, fill=c)
        x += w

    s = 92
    x0, y0 = (W - 4 * s) / 2, 160
    cage_of = {p: k for k, (cells, _) in enumerate(CAGES) for p in cells}
    for r in range(4):
        for c in range(4):
            x, y = x0 + c * s, y0 + r * s
            d.rectangle((x, y, x + s, y + s), outline=LINE, width=1)
            if (r, c) in SHOWN:
                t = str(SOL[r][c])
                d.text((x + s / 2 - d.textlength(t, font=f_val) / 2, y + 22), t, font=f_val, fill=DARK)
    for r in range(4):
        for c in range(4):
            x, y = x0 + c * s, y0 + r * s
            k = cage_of[(r, c)]
            if r == 0 or cage_of[(r - 1, c)] != k:
                d.line((x, y, x + s, y), fill=DARK, width=5)
            if c == 0 or cage_of[(r, c - 1)] != k:
                d.line((x, y, x, y + s), fill=DARK, width=5)
    d.rectangle((x0, y0, x0 + 4 * s, y0 + 4 * s), outline=DARK, width=6)
    for cells, label in CAGES:
        r, c = cells[0]
        d.text((x0 + c * s + 8, y0 + r * s + 6), label, font=f_lab, fill=RED)

    url = "numerologic.cat/quadrologic"
    d.text(((W - d.textlength(url, font=f_url)) / 2, 568), url, font=f_url, fill=TURQ)
    out = os.path.join(GAME, "og-image.png")
    img.save(out, optimize=True)
    print("Escrit", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
