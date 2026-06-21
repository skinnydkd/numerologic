"""Construcció d'un repte: selecció d'objectiu (amb tutti garantit), punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt, FULL, reduce1
from generator.tutti import tutti_exists, meaningful_tutti_exists
from generator.enumerate_solutions import counted_and_brevi

# (nom, percentatge sobre el total de punts)
RANK_PCTS = [
    ("Principiant", 0),
    ("Aprenent", 10),
    ("Avançat", 25),
    ("Expert", 45),
    ("Mestre", 65),
    ("Geni", 85),
    ("Llegenda", 100),
]

# Punts de joc (han de coincidir amb js/game.js): cada solució Brevi i cada tutti valen 10;
# completar tot el Brevi suma un bonus. El denominador dels rangs (totalPoints) usa aquesta
# mateixa escala perquè els rangs mesurin el progrés REAL del jugador.
BREVI_POINTS = 10
TUTTI_POINTS = 10
BREVI_COMPLETE_BONUS = 10


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


def _leaves_of(ast):
    """Llista de fulles (valors de dígit) d'un AST."""
    if ast[0] == "num":
        return [ast[1]]
    out = []
    for c in ast[1:]:
        if isinstance(c, tuple):
            out += _leaves_of(c)
    return out


def _uses_all_digits(ast, digits):
    """True si l'expressió, un cop reduïda (×1/÷1 absorbits), fa servir tots els dígits."""
    return set(_leaves_of(reduce1(ast))) == set(digits)


def game_total_points(counted, brevi_ops, digits):
    """Punts màxims del repte a l'escala REAL del joc (js/game.js::pointsFor): cada
    solució Brevi o tutti val 10; la resta, els seus operands (+2 amb ^/√). Inclou el
    bonus de Brevi complet, que sempre s'assoleix en trobar-ho tot. És el denominador
    dels rangs, de manera que 'Llegenda' (100%) significa progrés real, no punts base."""
    total = BREVI_COMPLETE_BONUS
    for ast in counted.values():
        leaves = len(_leaves_of(ast))
        if _uses_all_digits(ast, digits):
            total += TUTTI_POINTS
        elif leaves == brevi_ops:
            total += BREVI_POINTS
        else:
            total += solution_points(leaves, has_pow_or_sqrt(ast))
    return total


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4, max_tutti_tries=5,
                target_range=(-9999, 9999), variant=FULL, difficulty="mitja"):
    """Construeix un repte amb tutti garantit per a aquests dígits/central, o None.

    Tria l'objectiu més ric dins la banda que tinga tutti (comprovant fins a
    `max_tutti_tries` candidats per ordre de riquesa). Per a l'objectiu escollit,
    enumera el conjunt comptat i el Brevi amb `counted_and_brevi` (no es queda
    capat a `max_leaves`: `maxOperands` és per repte = max(4, brevi.operands)).
    `band` filtra pel NOMBRE de solucions (recompte k≤max_leaves, ràpid); `target_range`
    pel valor de l'objectiu; `variant` fixa les regles; `difficulty` és l'etiqueta.
    Abast de `counted_and_brevi`: `+−×÷` (no-repeat). Retorna None si res quadra.
    """
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves, variant=variant)

    # agrupa per valor, només solucions que facin servir el central (recompte ràpid per la banda)
    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    lo, hi = band
    tlo, thi = target_range
    candidates = [
        (v, len(items)) for v, items in by_value.items()
        if lo <= len(items) <= hi and tlo <= v <= thi
    ]
    if not candidates:
        return None
    # ordena per riquesa (més solucions primer); desempat determinista pel valor més baix
    candidates.sort(key=lambda t: (t[1], -t[0]), reverse=True)

    for v, _n in candidates[:max_tutti_tries]:
        if not meaningful_tutti_exists(digits, v, variant=variant):
            continue
        res = counted_and_brevi(digits, central, v, variant)
        if res is None:
            continue
        counted = res["counted"]
        solutions = sorted(counted.keys())
        total = game_total_points(counted, res["brevi"]["operands"], digits)
        return {
            "target": v,
            "digits": digits,
            "centralIndex": central_index,
            "maxOperands": res["maxOperands"],
            "difficulty": difficulty,
            "solutions": solutions,
            "totalPoints": total,
            "ranks": build_ranks(total),
            "hasTutti": True,
            "brevi": res["brevi"],
            "hints": {
                "byLeaves": {str(k): res["byLeaves"][k] for k in sorted(res["byLeaves"])},
                "byOp": res["byOp"],
            },
            "rules": {
                "allowRepeat": variant.allow_repeat,
                "ops": list(variant.ops) + (["sqrt"] if variant.use_sqrt else []),
            },
        }
    return None
