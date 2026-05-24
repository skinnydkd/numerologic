"""Cercador exhaustiu d'expressions per força bruta amb DP sobre multiconjunts."""
from functools import lru_cache
from itertools import combinations, combinations_with_replacement

from generator.engine import combine, do_sqrt, canonical, InvalidExpr

OPS = ('add', 'sub', 'mul', 'div', 'pow')


def _splits(ms):
    """Genera parells (left, right) de submulticonjunts no buits i complementaris de ms (sense repetir parells)."""
    n = len(ms)
    seen = set()
    for r in range(1, n):
        for idx in combinations(range(n), r):
            idxset = set(idx)
            left = tuple(ms[i] for i in idx)
            right = tuple(ms[i] for i in range(n) if i not in idxset)
            key = (left, right)
            if key in seen:
                continue
            seen.add(key)
            yield left, right


def _build(digits, max_leaves):
    """Retorna una funcio results(ms) memoitzada per a aquest conjunt de digits."""

    @lru_cache(maxsize=None)
    def results(ms):
        # ms: tupla ordenada de valors de digit. Retorna dict canonical -> (value, ast).
        out = {}
        if len(ms) == 1:
            ast = ('num', ms[0])
            out[canonical(ast)] = (ms[0], ast)
        else:
            for left, right in _splits(ms):
                L = results(tuple(sorted(left)))
                R = results(tuple(sorted(right)))
                for lv, la in L.values():
                    for rv, ra in R.values():
                        for op in OPS:
                            try:
                                v = combine(op, lv, rv)
                            except InvalidExpr:
                                continue
                            ast = (op, la, ra)
                            c = canonical(ast)
                            if c not in out:
                                out[c] = (v, ast)
        # augmentacio amb arrel (no afegeix fulles): sqrt de cada entrada existent
        for v, ast in list(out.values()):
            try:
                sv = do_sqrt(v)
            except InvalidExpr:
                continue
            sast = ('sqrt', ast)
            sc = canonical(sast)
            if sc not in out:
                out[sc] = (sv, sast)
        return out

    return results


def generate(digits, max_leaves=6):
    """Totes les expressions valides amb 2..max_leaves operands sobre `digits`.

    Retorna dict: canonical -> {"value", "ast", "leaves", "used"} amb used = frozenset de digits diferents.
    """
    digits = list(digits)
    results = _build(tuple(sorted(digits)), max_leaves)
    out = {}
    for k in range(2, max_leaves + 1):
        for ms in combinations_with_replacement(sorted(digits), k):
            for c, (v, ast) in results(tuple(ms)).items():
                if c in out:
                    continue
                out[c] = {
                    "value": v,
                    "ast": ast,
                    "leaves": k,
                    "used": frozenset(ms),
                }
    return out
