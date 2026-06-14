"""CLI: genera un pool de reptes i l'escriu a data/puzzles.json."""
import argparse
import json
import os
import random
from itertools import combinations

from generator.puzzles import make_puzzle
from generator.engine import Variant, FULL

DIGITS = list(range(1, 10))  # 1..9


def build_pool(count, band=(40, 120), max_leaves=4, seed=0, start_date="2026-06-01", variant=FULL):
    """Construeix un pool de `count` reptes diferents dins la banda."""
    rng = random.Random(seed)
    digit_sets = list(combinations(DIGITS, 7))
    rng.shuffle(digit_sets)

    puzzles = []
    seen = set()
    for ds in digit_sets:
        digits = list(ds)
        centrals = list(range(7))
        rng.shuffle(centrals)
        for ci in centrals:
            if digits[ci] == 1:
                continue  # el central mai pot ser 1: ×1/÷1 el fan trivial d'incloure
            # el primer repte del pool: positiu i amable (100-999); la resta: |objectiu| <= 9999
            tr = (100, 999) if not puzzles else (-9999, 9999)
            pz = make_puzzle(digits, ci, band=band, max_leaves=max_leaves, target_range=tr, variant=variant)
            if pz is None:
                continue
            key = (pz["target"], tuple(pz["digits"]), pz["centralIndex"])
            if key in seen:
                continue
            seen.add(key)
            puzzles.append(pz)
            if len(puzzles) >= count:
                return {"startDate": start_date, "puzzles": puzzles}
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
        band=tuple(args.band),
        max_leaves=args.max_leaves,
        seed=args.seed,
        start_date=args.start_date,
        variant=variant,
    )
    dirpart = os.path.dirname(args.out)
    if dirpart:
        os.makedirs(dirpart, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrits {len(pool['puzzles'])} reptes a {args.out}")


if __name__ == "__main__":
    main()
