"""CLI: genera el pool de reptes d'Igualògic i l'escriu a igualogic/data/puzzles.json.

Ús (des de la carpeta igualogic):  python -m gen_igualogic.generate --count 364
"""
import argparse
import json
import os

from gen_igualogic.pool import build_pool


def main():
    p = argparse.ArgumentParser(description="Genera el pool de reptes d'Igualògic.")
    p.add_argument("--count", type=int, default=364)
    p.add_argument("--length", type=int, default=8)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--start-date", default="2026-10-26")
    p.add_argument("--out", default=os.path.join("data", "puzzles.json"))
    a = p.parse_args()
    pool = build_pool(a.count, length=a.length, seed=a.seed, start_date=a.start_date)
    d = os.path.dirname(a.out)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrits {len(pool['puzzles'])} reptes a {a.out}")


if __name__ == "__main__":
    main()
