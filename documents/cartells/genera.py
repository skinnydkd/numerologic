"""Genera els cartells A4 (PDF + PNG de previsualització) amb el QR de cada lloc.

Ús: python documents/cartells/genera.py
Cada lloc té el seu camí curt (vercel.json) per comptar-ne les visites a Web Analytics.
"""
import pathlib
import subprocess

import qrcode
import qrcode.image.svg

DIR = pathlib.Path(__file__).resolve().parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LLOCS = {"institut": "i", "facultat": "f"}  # lloc -> camí a numerologic.cat


def make_qr(path: str) -> None:
    """Escriu qr-<camí>.svg amb l'URL curta (QR petit = fàcil d'escanejar de lluny)."""
    img = qrcode.make(f"https://numerologic.cat/{path}", image_factory=qrcode.image.svg.SvgPathImage,
                      error_correction=qrcode.constants.ERROR_CORRECT_Q, border=2)
    img.save(str(DIR / f"qr-{path}.svg"))


def render(lloc: str) -> None:
    url = (DIR / "cartell.html").as_uri() + f"?lloc={lloc}"
    common = [CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files"]
    subprocess.run(common + ["--no-pdf-header-footer", f"--print-to-pdf={DIR / f'cartell-{lloc}.pdf'}", url], check=True)
    subprocess.run(common + ["--window-size=794,1123", "--hide-scrollbars",
                             f"--screenshot={DIR / f'cartell-{lloc}.png'}", url], check=True)


if __name__ == "__main__":
    for lloc, path in LLOCS.items():
        make_qr(path)
        render(lloc)
        print(f"{lloc}: cartell-{lloc}.pdf (QR: numerologic.cat/{path})")
