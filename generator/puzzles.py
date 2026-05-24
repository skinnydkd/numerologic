"""Construcció d'un repte: selecció d'objectiu (amb tutti garantit), punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt
from generator.tutti import tutti_exists

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


def solution_points(leaves, uses_pow_sqrt):
    """Punts d'una solució: operands + bonus si usa potència o arrel."""
    return leaves + (2 if uses_pow_sqrt else 0)


def build_ranks(total):
    """Llindars de rang en punts a partir del total."""
    return [(name, math.ceil(pct / 100 * total)) for name, pct in RANK_PCTS]


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4, max_tutti_tries=5):
    """Construeix un repte amb tutti garantit per a aquests dígits/central, o None.

    Tria l'objectiu més ric dins la banda que tinga tutti, comprovant fins a
    `max_tutti_tries` candidats per ordre de riquesa. Retorna None si la banda és
    buida o si cap dels candidats provats té tutti.
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

    # ordena per riquesa (més solucions primer; desempat pel valor més baix)
    candidates.sort(key=lambda t: (len(t[1]), -t[0]), reverse=True)

    chosen = None
    for v, items in candidates[:max_tutti_tries]:
        if tutti_exists(digits, v):
            chosen = (v, items)
            break
    if chosen is None:
        return None
    target, items = chosen

    total = sum(
        solution_points(m["leaves"], has_pow_or_sqrt(m["ast"]))
        for _, m in items
    )
    solutions = sorted(c for c, _ in items)

    return {
        "target": target,
        "digits": digits,
        "centralIndex": central_index,
        "maxOperands": max_leaves,
        "solutions": solutions,
        "totalPoints": total,
        "ranks": build_ranks(total),
        "hasTutti": True,
    }
