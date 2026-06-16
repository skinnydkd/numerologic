"""Demo: enumera tots els tuttis del rusc diari i mostra'n una mostra llegible."""
import sys
import json
import datetime
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from generator.engine import Variant
from research.tutti_enum import tutti_solutions_ast

_PREC = {'add': 1, 'sub': 1, 'mul': 2, 'div': 2, 'pow': 3}
_SYM = {'add': '+', 'sub': '−', 'mul': '×', 'div': '÷', 'pow': '^'}


def infix(ast, parent_prec=0):
    """Renderitza un AST canònic com a expressió infixa llegible (aprox.)."""
    k = ast[0]
    if k == 'num':
        return str(ast[1])
    if k == 'sqrt':
        return '√' + infix(ast[1], 99)
    prec = _PREC[k]
    parts = [infix(c, prec) for c in ast[1:]]
    s = (' ' + _SYM[k] + ' ').join(parts)
    return f'({s})' if prec < parent_prec else s


def daily_variant(rules):
    return Variant(tuple(rules['ops']), 'sqrt' in rules['ops'], rules['allowRepeat'])


if __name__ == "__main__":
    d = json.load(open('data/puzzles.json'))
    start = datetime.date.fromisoformat(d['startDate'])
    idx = (datetime.date(2026, 6, 16) - start).days
    p = d['puzzles'][idx]
    variant = daily_variant(p['rules'])

    print(f"Rusc diari (idx {idx}): dígits {p['digits']}  objectiu {p['target']}  regles {p['rules']}")
    t = time.perf_counter()
    sols = tutti_solutions_ast(p['digits'], p['target'], variant)
    dt = time.perf_counter() - t
    print(f"TOTAL tuttis = {len(sols):,}   (temps {dt:.1f}s)\n")

    # mostra: els 12 «més curts» (menys operadors visibles a la canònica) per llegibilitat
    asts = sorted(sols.values(), key=lambda a: len(infix(a)))
    print("Mostra (12 dels més compactes):")
    for a in asts[:12]:
        print(f"   {infix(a)}  = {p['target']}")
