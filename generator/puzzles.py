"""Construcció d'un repte: selecció d'objectiu (amb tutti garantit), punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt, FULL
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


OP_NAMES = ("add", "sub", "mul", "div", "pow", "sqrt")


def _ops_used(ast, acc):
    """Acumula a `acc` els noms d'operacions presents a l'AST."""
    k = ast[0]
    if k == "num":
        return
    acc.add(k)
    for child in ast[1:]:
        if isinstance(child, tuple):
            _ops_used(child, acc)


def compute_hints(items):
    """Estadístiques per a les Pistes (sense desvelar solucions): recompte de solucions
    per nombre d'operands i per operació usada."""
    by_leaves = {}
    by_op = {op: 0 for op in OP_NAMES}
    for _c, m in items:
        by_leaves[m["leaves"]] = by_leaves.get(m["leaves"], 0) + 1
        ops = set()
        _ops_used(m["ast"], ops)
        for op in ops:
            by_op[op] += 1
    return {
        "byLeaves": {str(k): by_leaves[k] for k in sorted(by_leaves)},
        "byOp": by_op,
    }


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4, max_tutti_tries=5,
                target_range=(-9999, 9999), variant=FULL):
    """Construeix un repte amb tutti garantit per a aquests dígits/central, o None.

    Tria l'objectiu més ric dins la banda que tinga tutti, comprovant fins a
    `max_tutti_tries` candidats per ordre de riquesa (límit per equilibrar qualitat
    del repte i cost de generació; la comprovació de tutti és ~6 s cadascuna).
    `target_range` limita el valor de l'objectiu (lo <= valor <= hi).
    `variant` (engine.Variant) fixa les regles (operadors, arrel, repeticio).
    Retorna None si la banda és buida o si cap dels candidats provats té tutti.
    """
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves, variant=variant)

    # agrupa per valor, només solucions que facin servir el central
    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    # `band` és el rang del NOMBRE DE SOLUCIONS acceptable per repte (no del valor objectiu)
    lo, hi = band
    tlo, thi = target_range
    candidates = [
        (v, items) for v, items in by_value.items()
        if lo <= len(items) <= hi and tlo <= v <= thi
    ]
    if not candidates:
        return None

    # ordena per riquesa (més solucions primer); desempat determinista pel valor més baix
    candidates.sort(key=lambda t: (len(t[1]), -t[0]), reverse=True)

    chosen = None
    for v, items in candidates[:max_tutti_tries]:
        if tutti_exists(digits, v, variant=variant):
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
        "hints": compute_hints(items),
    }
