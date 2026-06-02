"""Experiment: quantes classes canòniques hi ha SENSE potència ni arrel?
Compara l'explosió combinatòria amb el conjunt complet d'operacions vs només {+,-,×,÷}.
"""
import time
import tracemalloc

import generator.solver as solver
from generator.engine import InvalidExpr


def _no_sqrt(v):
    raise InvalidExpr


def count(digits, k, reduced):
    # Reinicia l'estat global del solver per a cada execució.
    if reduced:
        solver.OPS = ('add', 'sub', 'mul', 'div')
        solver.do_sqrt = _no_sqrt
    else:
        solver.OPS = ('add', 'sub', 'mul', 'div', 'pow')
        import generator.engine as engine
        solver.do_sqrt = engine.do_sqrt
    tracemalloc.start()
    t0 = time.perf_counter()
    out = solver.generate(digits, max_leaves=k)
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
