"""Experiment: i si NO es poden repetir els dígits del rusc?
Cada dígit s'usa com a molt un cop dins l'expressió. Manté TOTES les operacions {+,-,×,÷,^,√}.
"""
import time
import tracemalloc
from itertools import combinations

import generator.solver as solver

DIGITS = (1, 2, 3, 4, 5, 6, 7)


def run(k):
    # No-repeat: al nivell superior, tria k dígits DIFERENTS (combinations, no _with_replacement).
    solver.combinations_with_replacement = lambda it, r: combinations(it, r)
    tracemalloc.start()
    t0 = time.perf_counter()
    out = solver.generate(DIGITS, max_leaves=k)
    dt = time.perf_counter() - t0
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    vals = len({d["value"] for d in out.values()})
    return len(out), vals, dt, peak / 1e6


print(f"{'k':>2} {'classes':>12} {'valors':>8} {'temps(s)':>9} {'mem(MB)':>9}  (NO repetició, ops completes)")
for k in (2, 3, 4, 5, 6, 7):
    try:
        c, v, dt, mem = run(k)
        print(f"{k:>2} {c:>12,} {v:>8,} {dt:>9.2f} {mem:>9.1f}")
    except MemoryError:
        print(f"{k:>2} {'MemoryError':>12}")
        break
