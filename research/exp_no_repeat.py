"""Experiment: i si NO es poden repetir els dígits del rusc?
Cada dígit s'usa com a molt un cop dins l'expressió. Manté TOTES les operacions {+,-,×,÷,^,√}.
"""
import time
import tracemalloc

from generator.solver import generate
from generator.engine import FULL

DIGITS = (1, 2, 3, 4, 5, 6, 7)
VARIANT_A = FULL._replace(allow_repeat=False)  # ops completes, sense repetir dígits


def run(k):
    tracemalloc.start()
    t0 = time.perf_counter()
    out = generate(DIGITS, max_leaves=k, variant=VARIANT_A)
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
