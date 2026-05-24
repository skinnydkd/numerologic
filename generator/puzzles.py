"""Construcció d'un repte: selecció d'objectiu, punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt

# (nom, percentatge sobre el total de punts)
RANK_PCTS = [
    ("Principiant", 0),
    ("Bé", 10),
    ("Molt bé", 25),
    ("Expert", 45),
    ("Mestre", 65),
    ("Geni", 85),
    ("Totes", 100),
]


def solution_points(leaves, uses_pow_sqrt, is_numerogram):
    """Punts d'una solució: operands + bonus pow/sqrt + bonus numerogram."""
    return leaves + (2 if uses_pow_sqrt else 0) + (10 if is_numerogram else 0)


def build_ranks(total):
    """Llindars de rang en punts a partir del total."""
    return [(name, math.ceil(pct / 100 * total)) for name, pct in RANK_PCTS]


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=6):
    """Construeix un repte per a aquests dígits/central si algun objectiu cau dins la banda.

    Retorna un dict serialitzable o None si cap objectiu té un comptador dins la banda.
    """
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves)

    # agrupa per valor, només solucions que facin servir el central
    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    lo, hi = band
    candidates = [(v, items) for v, items in by_value.items() if lo <= len(items) <= hi]
    if not candidates:
        return None

    # tria l'objectiu amb més solucions dins la banda (repte més ric); desempat pel valor
    target, items = max(candidates, key=lambda t: (len(t[1]), -t[0]))

    full = frozenset(digits)
    solutions = []
    total = 0
    for c, m in items:
        is_ng = m["used"] == full
        pts = solution_points(m["leaves"], has_pow_or_sqrt(m["ast"]), is_ng)
        total += pts
        solutions.append(c)

    solutions.sort()
    return {
        "target": target,
        "digits": digits,
        "centralIndex": central_index,
        "maxOperands": max_leaves,
        "solutions": solutions,
        "totalPoints": total,
        "ranks": build_ranks(total),
    }
