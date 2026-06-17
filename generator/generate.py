"""CLI: genera un pool de reptes i l'escriu a data/puzzles.json."""
import argparse
import json
import os
import random

from generator.puzzles import make_puzzle
from generator.engine import Variant, FULL

DIGITS = list(range(1, 10))  # 1..9

# Espectre de dificultat: (etiqueta, nombre de dígits actius, target_range, banda de solucions k≤4).
# n_digits<7 → hexàgons grisos (menys dígits = més encadenament i tutti més rar).
PROFILES = [
    ("facil",   7, (10, 99),   (40, 120)),
    ("mitja",   6, (60, 299),  (8, 40)),
    ("dificil", 5, (150, 999), (4, 12)),
]


def build_pool(count, max_leaves=4, seed=0, start_date="2026-06-01", variant=FULL):
    """Construeix `count` reptes dosificant l'espectre de dificultat (ciclant perfils)."""
    rng = random.Random(seed)
    puzzles = []
    seen = set()
    attempts = 0
    while len(puzzles) < count and attempts < count * 400:
        attempts += 1
        difficulty, n_digits, tr, band = PROFILES[len(puzzles) % len(PROFILES)]
        ds = sorted(rng.sample(DIGITS, n_digits))
        centrals = [i for i in range(n_digits) if ds[i] != 1]  # el central mai pot ser 1 (×1/÷1 trivial)
        if not centrals:
            continue
        rng.shuffle(centrals)
        for ci in centrals:
            pz = make_puzzle(ds, ci, band=band, max_leaves=max_leaves,
                             target_range=tr, variant=variant, difficulty=difficulty)
            if pz is None:
                continue
            key = (pz["target"], tuple(pz["digits"]), pz["centralIndex"])
            if key in seen:
                continue
            seen.add(key)
            puzzles.append(pz)
            break
    return {"startDate": start_date, "puzzles": puzzles}


def main():
    parser = argparse.ArgumentParser(description="Genera el pool de reptes de Numerològic.")
    parser.add_argument("--count", type=int, default=60)
    parser.add_argument("--band", type=int, nargs=2, default=[40, 120], metavar=("LO", "HI"),
                        help="rang del NOMBRE DE SOLUCIONS per repte (no el valor objectiu)")
    parser.add_argument("--max-leaves", type=int, default=4)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--start-date", default="2026-06-01")
    parser.add_argument("--out", default=os.path.join("data", "puzzles.json"))
    parser.add_argument("--no-repeat", action="store_true",
                        help="cada dígit del rusc s'usa com a molt un cop per expressió")
    parser.add_argument("--no-pow-sqrt", action="store_true",
                        help="només +-*/ (sense potència ni arrel)")
    args = parser.parse_args()

    ops = ("add", "sub", "mul", "div") if args.no_pow_sqrt else ("add", "sub", "mul", "div", "pow")
    variant = Variant(ops=ops, use_sqrt=not args.no_pow_sqrt, allow_repeat=not args.no_repeat)

    pool = build_pool(
        count=args.count,
        max_leaves=args.max_leaves,
        seed=args.seed,
        start_date=args.start_date,
        variant=variant,
    )  # nota: la banda i el rang d'objectiu venen ara del perfil de dificultat (PROFILES)
    dirpart = os.path.dirname(args.out)
    if dirpart:
        os.makedirs(dirpart, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrits {len(pool['puzzles'])} reptes a {args.out}")


if __name__ == "__main__":
    main()
