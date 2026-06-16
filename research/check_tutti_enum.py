"""Validació de research/tutti_enum.py.

1. Brute-force (solver.results sobre el multiconjunt complet) vs tutti_solutions,
   per a TOTS els valors objectiu alhora, en ruscos petits (n=4,5). És la prova forta:
   el brute-force enumera la veritat de terra (mateixes regles), agrupada per valor.
2. Acord d'existència amb generator.tutti.tutti_exists.
3. Auto-consistència sobre el rusc diari (n=7): cada tutti avalua a l'objectiu i usa
   els 7 dígits exactament un cop.
"""
import time
from collections import defaultdict

from generator.engine import Variant, evaluate, FULL
from generator.solver import _build
from generator.tutti import tutti_exists
from research.tutti_enum import tutti_solutions, tutti_solutions_ast

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)   # rusc diari
WITH_SQRT = Variant(('add', 'sub', 'mul', 'div'), True, False)  # exercita la branca d'arrel


def _leaves(ast):
    if ast[0] == 'num':
        return [ast[1]]
    out = []
    for c in ast[1:]:
        if isinstance(c, tuple):
            out += _leaves(c)
    return out


def brute_by_value(digits, variant):
    full = _build(variant)(tuple(sorted(digits)))
    by_val = defaultdict(set)
    for c, (v, _a) in full.items():
        by_val[v].add(c)
    return by_val


def test_against_bruteforce(digits, variant, label):
    by_val = brute_by_value(digits, variant)
    checked = mism = 0
    for v, expected in by_val.items():
        got = set(tutti_solutions(digits, v, variant))
        checked += 1
        if got != expected:
            mism += 1
            if mism <= 3:
                print(f"  MISMATCH {label} digits={digits} val={v}: "
                      f"only_brute={len(expected-got)} only_enum={len(got-expected)}")
    print(f"[brute] {label} n={len(digits)} digits={digits}: {checked} valors, {mism} discrepàncies")
    return mism == 0


def test_existence(digits, variant, label, lo=-50, hi=200):
    bad = 0
    for v in range(lo, hi + 1):
        ex = tutti_exists(digits, v, variant)
        en = bool(tutti_solutions_ast(digits, v, variant))
        if ex != en:
            bad += 1
            if bad <= 5:
                print(f"  EXIST MISMATCH {label} val={v}: tutti_exists={ex} enum_nonempty={en}")
    print(f"[exist] {label} digits={digits}: rang [{lo},{hi}], {bad} discrepàncies")
    return bad == 0


def test_selfconsistency(digits, target, variant, label):
    sols = tutti_solutions_ast(digits, target, variant)
    want = sorted(digits)
    bad = 0
    for c, ast in sols.items():
        if evaluate(ast) != target or sorted(_leaves(ast)) != want:
            bad += 1
            if bad <= 5:
                print(f"  SELF BAD {label}: {c} -> val={evaluate(ast)} leaves={sorted(_leaves(ast))}")
    print(f"[self ] {label} digits={digits} target={target}: {len(sols)} tuttis, {bad} invàlids")
    return bad == 0


if __name__ == "__main__":
    # ABAST validat: regles del rusc diari (BASIC, +-*/ sense arrel). El criteri
    # d'èxit (ok) només cobreix BASIC. WITH_SQRT és informatiu (semàntica d'arrel
    # divergent entre solver.py i tutti.py — fora d'abast, cap rusc usa arrel).
    ok = True
    print("=== 1. Brute-force vs enum (tots els valors) — BASIC és el criteri ===")
    ok &= test_against_bruteforce((1, 3, 4, 6), BASIC, "BASIC")
    ok &= test_against_bruteforce((2, 3, 4, 6, 9), BASIC, "BASIC")
    test_against_bruteforce((1, 3, 4, 6), WITH_SQRT, "WITH_SQRT(info)")

    print("\n=== 2. Acord d'existència amb tutti_exists — BASIC ===")
    ok &= test_existence((1, 3, 4, 6, 9), BASIC, "BASIC")
    test_existence((1, 3, 4, 6, 9), WITH_SQRT, "WITH_SQRT(info)")

    print("\n=== 3. Rusc diari (n=7) — auto-consistència ===")
    t = time.perf_counter()
    ok &= test_selfconsistency((1, 3, 4, 5, 6, 7, 9), 20, BASIC, "rusc-diari")
    print(f"      temps n=7: {time.perf_counter()-t:.2f}s")

    print("\nRESULTAT (abast BASIC):", "OK ✔" if ok else "FALLA")
