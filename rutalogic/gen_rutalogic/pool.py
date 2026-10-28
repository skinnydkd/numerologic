"""Taulers de Rutalògic i pool diari.

Un tauler s'accepta si té algun objectiu de 10 a 99 (diferent del valor inicial) amb
20–200 rutes i un Brevi (longitud mínima) de 4 a 6 salts, perquè el repte siga jugable. Punts: cada ruta val la
seua longitud; les de longitud mínima (✦) i màxima (★) valen 10; completar les ✦, +10.
"""
import math
import random
from collections import Counter

from gen_rutalogic.hive import CENTER
from gen_rutalogic.routes import routes_to, value_stats

OPS = ("+", "-", "*2", "*3", "/2", "/3")
OP_WEIGHTS = (3, 3, 2, 1, 2, 1)
TARGET_RANGE = (10, 99)
ROUTES_RANGE = (20, 200)
MIN_BREVI = 4
MAX_BREVI = 6
SPECIAL_POINTS = 10
BREVI_BONUS = 10
RANK_PCTS = [("Principiant", 0), ("Aprenent", 10), ("Avançat", 25), ("Expert", 45),
             ("Mestre", 65), ("Geni", 85), ("Llegenda", 100)]


def route_points(length, min_len, max_len):
    return SPECIAL_POINTS if length in (min_len, max_len) else length


def random_board(rnd):
    ops = []
    for _ in range(18):
        k = rnd.choices(OPS, weights=OP_WEIGHTS)[0]
        ops.append(k + str(rnd.randint(1, 9)) if k in "+-" else k)
    ops.insert(CENTER, None)
    return rnd.randint(2, 9), ops


def candidate_targets(stats, start):
    lo, hi = TARGET_RANGE
    rlo, rhi = ROUTES_RANGE
    return sorted(v for v, (n, mn, _) in stats.items()
                  if lo <= v <= hi and v != start and rlo <= n <= rhi and MIN_BREVI <= mn <= MAX_BREVI)


def make_board(rnd, tries=1000):
    for _ in range(tries):
        start, ops = random_board(rnd)
        cands = candidate_targets(value_stats(start, ops), start)
        if not cands:
            continue
        target = rnd.choice(cands)
        routes = routes_to(start, ops, target)
        lengths = [len(r) for r in routes]
        mn, mx = min(lengths), max(lengths)
        total = sum(route_points(n, mn, mx) for n in lengths) + BREVI_BONUS
        return {
            "start": start, "ops": ops, "target": target,
            "byLength": {str(k): v for k, v in sorted(Counter(lengths).items())},
            "brevi": [r for r in routes if len(r) == mn],
            "marato": [r for r in routes if len(r) == mx],
            "total": total,
            "ranks": [[name, math.ceil(pct / 100 * total)] for name, pct in RANK_PCTS],
        }
    raise RuntimeError("no s'ha trobat cap tauler")


def build_pool(count, seed=0, start_date="2026-10-26"):
    rnd = random.Random(seed)
    return {"startDate": start_date, "puzzles": [make_board(rnd) for _ in range(count)]}
