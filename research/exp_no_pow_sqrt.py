"""Experiment: quantes classes canòniques hi ha SENSE potència ni arrel?
Compara l'explosió combinatòria amb el conjunt complet d'operacions vs només {+,-,×,÷}.
"""
import time
import tracemalloc

from generator.solver import generate
from generator.engine import FULL

VARIANT_B = FULL._replace(ops=("add", "sub", "mul", "div"), use_sqrt=False)  # només +-*/, amb repeticions


def count(digits, k, reduced):
    variant = VARIANT_B if reduced else FULL
    tracemalloc.start()
    t0 = time.perf_counter()
    out = generate(digits, max_leaves=k, variant=variant)
    dt = time.perf_counter() - t0
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    vals = len({d["value"] for d in out.values()})
    return len(out), vals, dt, peak / 1e6


DIGITS = (1, 2, 3, 4, 5, 6, 7)

print(f"{'k':>2} {'mode':>8} {'classes':>12} {'valors':>8} {'temps(s)':>9} {'mem(MB)':>9}")
for k in (2, 3, 4):
    for reduced in (False, True):
        c, v, dt, mem = count(DIGITS, k, reduced)
        mode = "només±×÷" if reduced else "complet"
        print(f"{k:>2} {mode:>8} {c:>12,} {v:>8,} {dt:>9.2f} {mem:>9.1f}")

# Ara el règim sense resoldre: k=5, només amb les 4 operacions bàsiques.
print("\n--- k=5, només {+,-,×,÷} (el cas que avui explota amb operacions complertes) ---")
c, v, dt, mem = count(DIGITS, 5, True)
print(f" 5  només±×÷ {c:>12,} {v:>8,} {dt:>9.2f} {mem:>9.1f}")
