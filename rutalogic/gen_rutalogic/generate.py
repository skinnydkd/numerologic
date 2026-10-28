"""CLI: genera el pool de Rutalògic i l'escriu a rutalogic/data/puzzles.json.

Ús (des de la carpeta rutalogic):  python -m gen_rutalogic.generate --count 364
"""
import argparse
import json
import os

from gen_rutalogic.pool import build_pool


def main():
    p = argparse.ArgumentParser(description="Genera el pool de reptes de Rutalògic.")
    p.add_argument("--count", type=int, default=364)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--start-date", default="2026-10-26")
    p.add_argument("--out", default=os.path.join("data", "puzzles.json"))
    a = p.parse_args()
    pool = build_pool(a.count, seed=a.seed, start_date=a.start_date)
    d = os.path.dirname(a.out)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrits {len(pool['puzzles'])} reptes a {a.out}")


if __name__ == "__main__":
    main()
