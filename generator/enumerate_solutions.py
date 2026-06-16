"""Enumeració de solucions ancorada a l'objectiu (per a ruscos no-repeat).

Port i generalització de `research/tutti_enum.py`. Donat un rusc i un objectiu,
enumera TOTES les solucions canòniques sense l'explosió del cercador general,
ancorant la cerca a l'objectiu via la DP de valors assolibles
(`generator/tutti.py::_reach`): només materialitza expressions per als parells
(subconjunt, valor) que cauen en un camí cap a l'objectiu.

ABAST (validat): operadors {+,−,×,÷}, SENSE arrel ni potència. La branca d'arrel
(`use_sqrt=True`) és experimental i divergeix entre `solver.py` i `tutti.py` —
fora d'abast. El banc de reptes usa `+−×÷`.

Funcions públiques:
- `solutions_full_ast(digits, target, variant)` — solucions que usen EXACTAMENT
  tots els dígits donats (cadascun un cop) = target. Retorna {canonical: ast}.
- `solutions_by_tier(digits, central, target, variant, max_operands)` — solucions
  que inclouen el central, per tier d'operands.
- `counted_and_brevi(digits, central, target, variant)` — conjunt comptat, Brevi
  (tier mínim) i recomptes per a les pistes.
"""
from itertools import combinations

from generator.engine import combine, do_sqrt, canonical, InvalidExpr, CAP, MAX_EXPONENT, FULL
from generator.tutti import _reach


def solutions_full(digits, target, variant=FULL):
    """Llista ordenada de cadenes canòniques de les solucions que usen tots els dígits."""
    return sorted(solutions_full_ast(digits, target, variant))


def solutions_full_ast(digits, target, variant=FULL):
    """{canonical: ast} de les solucions = target que usen EXACTAMENT tots els dígits (cada un un cop)."""
    digits = list(digits)
    n = len(digits)
    if n == 1:
        ast = ('num', digits[0])
        return {canonical(ast): ast} if digits[0] == target else {}
    full = (1 << n) - 1

    reach_cache = {}

    def reach(mask):
        return _reach(mask, digits, n, reach_cache, variant)

    bin_memo = {}
    aug_memo = {}

    def enum_binary(mask, value):
        key = (mask, value)
        cached = bin_memo.get(key)
        if cached is not None:
            return cached
        out = {}
        bin_memo[key] = out  # marca abans de recursar (subconjunts estrictament menors → sense cicle)
        if value not in reach(mask):
            return out
        bits = [i for i in range(n) if mask & (1 << i)]
        if len(bits) == 1:
            if digits[bits[0]] == value:
                ast = ('num', digits[bits[0]])
                out[canonical(ast)] = ast
            return out
        sub = mask
        while True:
            sub = (sub - 1) & mask
            if sub == 0:
                break
            comp = mask ^ sub
            rsub, rcomp = reach(sub), reach(comp)
            for op in variant.ops:
                for a, b in _operands(op, value, rsub, rcomp):
                    for la in enum(sub, a).values():
                        for ra in enum(comp, b).values():
                            ast = (op, la, ra)
                            out[canonical(ast)] = ast
        return out

    def enum(mask, value):
        key = (mask, value)
        cached = aug_memo.get(key)
        if cached is not None:
            return cached
        out = dict(enum_binary(mask, value))  # j = 0 arrels
        bits_count = bin(mask).count('1')
        # _reach només augmenta amb arrel els nodes de més d'una fulla
        if variant.use_sqrt and bits_count > 1 and value >= 2:
            j = 1
            w = value
            while True:
                w = w * w                      # preimatge amb j arrels: value**(2**j)
                if w >= CAP:
                    break
                for c, ast in enum_binary(mask, w).items():
                    wrapped = ast
                    for _ in range(j):
                        wrapped = ('sqrt', wrapped)
                    out[canonical(wrapped)] = wrapped
                j += 1
        aug_memo[key] = out
        return out

    return enum(full, target)


def _operands(op, value, rsub, rcomp):
    """Parells (a, b) amb a∈rsub, b∈rcomp i combine(op,a,b)==value. Inverteix l'operació
    quan és barat; per a `pow` fa doble bucle acotat."""
    if op == 'add':                      # b = value - a
        for a in rsub:
            b = value - a
            if b in rcomp:
                yield a, b
    elif op == 'sub':                    # a - b = value -> b = a - value
        for a in rsub:
            b = a - value
            if b in rcomp:
                yield a, b
    elif op == 'mul':                    # a * b = value
        for a in rsub:
            if a == 0:
                if value == 0:
                    for b in rcomp:
                        yield a, b
            elif value % a == 0:
                b = value // a
                if b in rcomp:
                    yield a, b
    elif op == 'div':                    # a // b = value (exacte) -> a = value * b
        for b in rcomp:
            if b == 0:
                continue
            a = value * b
            if abs(a) < CAP and a in rsub:
                try:
                    if combine('div', a, b) == value:
                        yield a, b
                except InvalidExpr:
                    pass
    elif op == 'pow':                    # a ** b = value
        for a in rsub:
            for b in rcomp:
                if 0 <= b <= MAX_EXPONENT:
                    try:
                        if combine('pow', a, b) == value:
                            yield a, b
                    except InvalidExpr:
                        pass
    else:
        raise ValueError(f"operador desconegut: {op}")


def solutions_by_tier(digits, central, target, variant, max_operands):
    """{r: {canonical: ast}} de solucions = target que inclouen el central, usant
    exactament r dígits diferents (cada un <=1 cop), per r=2..max_operands.
    Suma sobre subconjunts de mida r que contenen el central."""
    digits = list(digits)
    others = [d for d in digits if d != central]
    tiers = {}
    for r in range(2, max_operands + 1):
        if r - 1 > len(others):
            break
        tier = {}
        for combo in combinations(others, r - 1):
            subset = list(combo) + [central]
            for c, ast in solutions_full_ast(subset, target, variant).items():
                tier[c] = ast
        if tier:
            tiers[r] = tier
    return tiers


def _ops_in(ast, acc):
    k = ast[0]
    if k == 'num':
        return
    acc.add(k)
    for c in ast[1:]:
        if isinstance(c, tuple):
            _ops_in(c, acc)


def counted_and_brevi(digits, central, target, variant, hard_cap=7):
    """Conjunt comptat, Brevi i recomptes, o None si no hi ha cap solució (amb central).

    Enumera tiers ascendents; el primer no buit és el Brevi. El conjunt comptat acumula
    tiers fins a maxOperands = max(4, brevi.operands), acotat a hard_cap i a len(digits)."""
    # tier mínim no buit (Brevi); els tiers buits són barats (la reachability els poda)
    brevi_ops = None
    for r in range(2, min(len(digits), hard_cap) + 1):
        tiers_r = solutions_by_tier(digits, central, target, variant, max_operands=r)
        if tiers_r:
            brevi_ops = min(tiers_r)
            break
    if brevi_ops is None:
        return None
    max_ops = min(max(4, brevi_ops), len(digits), hard_cap)
    tiers = solutions_by_tier(digits, central, target, variant, max_operands=max_ops)
    counted = {}
    by_leaves = {}
    by_op = {op: 0 for op in ('add', 'sub', 'mul', 'div', 'pow', 'sqrt')}
    for r, d in tiers.items():
        by_leaves[r] = len(d)
        for c, ast in d.items():
            counted[c] = ast
            ops = set()
            _ops_in(ast, ops)
            for op in ops:
                by_op[op] += 1
    brevi_count = by_leaves.get(brevi_ops, 0)
    return {
        'counted': counted,
        'brevi': {'operands': brevi_ops, 'count': brevi_count},
        'maxOperands': max_ops,
        'byLeaves': by_leaves,
        'byOp': by_op,
    }
