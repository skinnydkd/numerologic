"""Generació de graelles per nivell i del pool diari de Simbològic (3 graelles per dia).

  facil   3×3, 3 símbols, valors 1..20, es resol només amb línies d'un desconegut (a);
  mitja   4×4, 4 símbols, valors 1..20, cal almenys una combinació de línies (b/c);
  dificil 4×4, 4 símbols, valors −9..20 sense 0 i amb algun negatiu, 1–2 files de
          producte (|producte| ≤ 2000) i almenys una combinació de línies.
Els passos del solucionador defineixen el nivell; tota graella que no es resol es rebutja.
"""
import random

from gen_simbologic.grid import lines_of, linear_rank, totals
from gen_simbologic.solver import solve

LEVELS = ("facil", "mitja", "dificil")
SPEC = {
    "facil": dict(size=3, n=3, lo=1, hi=20),
    "mitja": dict(size=4, n=4, lo=1, hi=20),
    "dificil": dict(size=4, n=4, lo=-9, hi=20),
}
MAX_PRODUCT = 2000


def _values(rnd, level, n):
    s = SPEC[level]
    choices = [v for v in range(s["lo"], s["hi"] + 1) if v != 0]
    while True:
        vals = rnd.sample(choices, n)
        if level != "dificil" or any(v < 0 for v in vals):
            return vals


def _cells(rnd, size, n):
    while True:
        cells = [[rnd.randrange(n) for _ in range(size)] for _ in range(size)]
        if len({s for r in cells for s in r}) == n:
            return cells


def _accept(level, cells, row_ops, values, res):
    if res is None:
        return False
    combo = any(k in "bc" for k in res["steps"])
    if level == "facil":
        return not combo
    if level == "mitja":
        return combo and linear_rank(lines_of(cells, row_ops, *totals(cells, values, row_ops)), len(values)) == len(values)
    return combo and "*" in row_ops


def make_grid(rnd, level, tries=200000):
    s = SPEC[level]
    for _ in range(tries):
        values = _values(rnd, level, s["n"])
        cells = _cells(rnd, s["size"], s["n"])
        row_ops = ["+"] * s["size"]
        if level == "dificil":
            for i in rnd.sample(range(s["size"]), rnd.choice((1, 2))):
                row_ops[i] = "*"
        rt, ct = totals(cells, values, row_ops)
        if any(op == "*" and abs(t) > MAX_PRODUCT for op, t in zip(row_ops, rt)):
            continue
        res = solve(lines_of(cells, row_ops, rt, ct), s["n"])
        if _accept(level, cells, row_ops, values, res):
            return {
                "level": level, "size": s["size"], "cells": cells, "rowOps": row_ops,
                "rowTotals": rt, "colTotals": ct, "values": values, "order": res["order"],
            }
    raise RuntimeError(f"no s'ha trobat cap graella {level}")


def build_pool(count, seed=0, start_date="2026-10-26"):
    """`count` dies (múltiple de 7), cadascun amb una graella de cada nivell."""
    rnd = random.Random(seed)
    return {"startDate": start_date, "puzzles": [{"grids": [make_grid(rnd, lv) for lv in LEVELS]} for _ in range(count)]}
