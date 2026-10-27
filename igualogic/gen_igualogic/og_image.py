"""Genera igualogic/og-image.png (1200x630) per a les previsualitzacions de compartir.

Logotip IGUA·L·Ò·GIC (Anton) i dues files de caselles: un intent amb colors i la igualtat resolta.

Ús (des de la carpeta igualogic):  python -m gen_igualogic.og_image   (requereix Pillow)
"""
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
TURQ = (88, 180, 196)      # #58b4c4
RED = (236, 90, 82)        # #ec5a52
GOLD = (234, 179, 8)       # #eab308
GRAYT = (148, 163, 184)    # #94a3b8
DARK = (31, 41, 55)
GRAY = (100, 116, 139)
WHITE = (255, 255, 255)

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTON = os.path.join(os.path.dirname(GAME), "fonts", "anton.woff2")
ARIALBD = "C:/Windows/Fonts/arialbd.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def tiles(d, y, text, colors, f):
    s, gap = 92, 12
    x = (W - (len(text) * s + (len(text) - 1) * gap)) / 2
    for ch, c in zip(text, colors):
        fill = {"g": TURQ, "y": GOLD, "x": GRAYT}[c]
        d.rounded_rectangle((x, y, x + s, y + s), radius=14, fill=fill)
        tb = d.textbbox((0, 0), ch, font=f)
        d.text((x + s / 2 - (tb[2] + tb[0]) / 2, y + s / 2 - (tb[3] + tb[1]) / 2), ch, font=f, fill=WHITE)
        x += s + gap


def main():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_word, f_tile = font(ANTON, 110), font(ARIALBD, 52)
    f_sub, f_url = font(ARIALBD, 34), font(ARIALBD, 32)

    segs = [("IGUA", DARK), ("L", TURQ), ("Ò", RED), ("GIC", TURQ)]
    widths = [d.textlength(t, font=f_word) for t, _ in segs]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(segs, widths):
        d.text((x, 36), t, font=f_word, fill=c)
        x += w

    sub = "Endevina la igualtat amagada"
    d.text(((W - d.textlength(sub, font=f_sub)) / 2, 192), sub, font=f_sub, fill=GRAY)

    tiles(d, 270, "3+2×7=17", "gxxyyggg", f_tile)
    tiles(d, 382, "3×7−4=17", "gggggggg", f_tile)

    url = "numerologic.cat/igualogic"
    d.text(((W - d.textlength(url, font=f_url)) / 2, 545), url, font=f_url, fill=TURQ)

    out = os.path.join(GAME, "og-image.png")
    img.save(out, optimize=True)
    print("Escrit", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
