"""Compta el total REAL de solucions d'un rusc no-repeat: totes les expressions
canòniques que valen l'objectiu usant cada dígit com a molt un cop i incloent el
central. És la mateixa tècnica que el tutti (research/tutti_enum.py) però sumada
sobre TOTS els subconjunts que contenen el central, no només el complet.

Per a regles no-repeat l'espai és FINIT (com a molt 7 operands) → el total existeix
i es pot calcular offline. El joc avui només en mostra la llesca k<=4."""
import sys
import json
import datetime
import time
from itertools import combinations

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from generator.engine import Variant
from research.tutti_enum import tutti_solutions_ast


def count_all(digits, central, target, variant):
    """Total de solucions canòniques (= target, cada dígit <=1 cop, inclou central)."""
    others = [d for d in digits if d != central]
    total = 0
    by_size = {}
    for r in range(len(others) + 1):
        for combo in combinations(others, r):
            subset = list(combo) + [central]      # sempre inclou el central
            sols = tutti_solutions_ast(subset, target, variant)  # usa EXACTAMENT aquests dígits
            n = len(sols)
            total += n
            by_size[len(subset)] = by_size.get(len(subset), 0) + n
    return total, by_size


if __name__ == "__main__":
    d = json.load(open("data/puzzles.json"))
    start = datetime.date.fromisoformat(d["startDate"])
    idx = (datetime.date(2026, 6, 16) - start).days
    p = d["puzzles"][idx]
    variant = Variant(tuple(p["rules"]["ops"]), "sqrt" in p["rules"]["ops"], p["rules"]["allowRepeat"])
    central = p["digits"][p["centralIndex"]]

    print(f"Rusc {p['digits']}  objectiu {p['target']}  central {central}  regles {p['rules']}")
    print(f"El joc avui mostra (k<=4): {len(p['solutions'])} solucions\n")

    t = time.perf_counter()
    total, by_size = count_all(p["digits"], central, p["target"], variant)
    dt = time.perf_counter() - t
    print(f"TOTAL REAL de solucions (k=1..7) = {total:,}   (temps {dt:.1f}s)")
    print("desglossat per nombre d'operands:")
    for k in sorted(by_size):
        print(f"   {k} operands: {by_size[k]:,}")
