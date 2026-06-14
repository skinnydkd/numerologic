"""Genera og-image.png (1200x630) per a les previsualitzacions de compartir (WhatsApp/socials).

Reprodueix la marca: logotip "NUMEROLÒGIC" (NUMEROL negre · Ò vermella · GIC turquesa,
font Anton) i la flor d'hexàgons 2-3-2 (perifèriques turquesa + central coral).

Ús: python scripts/og_image.py   (requereix Pillow; usa fonts/anton.ttf si hi és, si no Arial Black)
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
TURQ = (88, 180, 196)      # #58b4c4
CORAL = (236, 90, 82)      # #ec5a52
RED = (232, 54, 42)        # #e8362a (Ò del logo)
DARK = (22, 42, 58)        # navy del text
GRAY = (100, 116, 139)
WHITE = (255, 255, 255)
BG = (255, 255, 255)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTON = os.path.join(ROOT, "fonts", "anton.ttf")
ARIALBD = "C:/Windows/Fonts/arialbd.ttf"
ARIBLK = "C:/Windows/Fonts/ariblk.ttf"


def heavy(size):
    """Font pesada per al logotip/dígits: Anton si està, si no Arial Black."""
    try:
        return ImageFont.truetype(ANTON, size)
    except OSError:
        return ImageFont.truetype(ARIBLK, size)


def hexagon(cx, cy, s):
    """Vèrtexs d'un hexàgon de punta amunt (pointy-top) de radi s centrat a (cx, cy)."""
    return [
        (cx + s * math.cos(math.radians(-90 + 60 * k)),
         cy + s * math.sin(math.radians(-90 + 60 * k)))
        for k in range(6)
    ]


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    f_word = heavy(96)
    f_sub = ImageFont.truetype(ARIALBD, 34)
    f_digit = heavy(58)
    f_url = ImageFont.truetype(ARIALBD, 32)

    # Logotip: NUMEROL · Ò · GIC, centrat
    segs = [("NUMEROL", DARK), ("Ò", RED), ("GIC", TURQ)]
    widths = [d.textlength(t, font=f_word) for t, _ in segs]
    x = (W - sum(widths)) / 2
    y = 54
    for (t, c), w in zip(segs, widths):
        d.text((x, y), t, font=f_word, fill=c)
        x += w

    # Subtítol
    sub = "El Paraulògic matemàtic"
    d.text(((W - d.textlength(sub, font=f_sub)) / 2, 176), sub, font=f_sub, fill=GRAY)

    # Flor d'hexàgons 2-3-2
    s = 68
    gap = 6
    wx = math.sqrt(3) * s
    cx, cy = W / 2, 410
    cells = [
        (cx - wx / 2, cy - 1.5 * s, "3", False),
        (cx + wx / 2, cy - 1.5 * s, "4", False),
        (cx - wx, cy, "5", False),
        (cx, cy, "6", True),
        (cx + wx, cy, "7", False),
        (cx - wx / 2, cy + 1.5 * s, "8", False),
        (cx + wx / 2, cy + 1.5 * s, "2", False),
    ]
    for hx, hy, label, center in cells:
        d.polygon(hexagon(hx, hy, s - gap), fill=(CORAL if center else TURQ))
        tb = d.textbbox((0, 0), label, font=f_digit)
        d.text((hx - (tb[2] - tb[0]) / 2 - tb[0], hy - (tb[3] - tb[1]) / 2 - tb[1]),
               label, font=f_digit, fill=WHITE)

    # URL
    url = "numerologic.cat"
    d.text(((W - d.textlength(url, font=f_url)) / 2, 585), url, font=f_url, fill=TURQ)

    out = os.path.join(ROOT, "og-image.png")
    img.save(out, optimize=True)
    print("Escrit", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
