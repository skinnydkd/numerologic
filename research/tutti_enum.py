"""Enumeració de tuttis: TOTES les solucions canòniques que usen els 7 dígits
del rusc (cadascun un cop) i valen l'objectiu.

Estén la DP de valors assolibles de `generator/tutti.py` de «existeix?» a
«enumera-les totes», mantenint-la lleugera en memòria. La idea clau (la que el
brute-force de `generator/solver.py` NO té): només es materialitzen expressions
per als parells (subconjunt, valor) que cauen en un camí cap a l'objectiu —no per
a tots els valors—, de manera que s'evita l'explosió de classes canòniques.

Dues fases:
  1. Oracle de reachability: per a cada subconjunt de fulles, el conjunt de
     valors assolibles (només enters). És exactament `generator.tutti._reach`.
  2. Enumeració descendent guiada: des de (rusc complet, objectiu), per a cada
     partició i operador, s'inverteix l'operació per trobar els operands
     necessaris (que han de ser assolibles), es recursa i es combinen els
     representants. Es dedupa per forma canònica a cada node.

ABAST (validat): regles del rusc diari → operadors {+,−,×,÷}, SENSE arrel.
Per a aquestes regles coincideix exactament amb el brute-force (`solver`) en tots
els valors (vegeu `research/check_tutti_enum.py`).

ARREL (use_sqrt=True): EXPERIMENTAL i NO validat. Aquesta branca segueix la
semàntica de tancament d'arrel de `generator/tutti.py::_reach` (encadena √√…),
que DIVERGEIX de la de `generator/solver.py` (una sola √ per nivell). Cap rusc
del banc actual usa arrel, així que queda fora d'abast fins a reconciliar les
dues semàntiques al motor.
"""
from generator.engine import combine, do_sqrt, canonical, InvalidExpr, CAP, MAX_EXPONENT, FULL
from generator.tutti import _reach


def tutti_solutions(digits, target, variant=FULL):
    """Llista ordenada de les cadenes canòniques de tots els tuttis (cada dígit un cop = target).

    `variant` (engine.Variant) ha de coincidir amb la del repte (mateixos operadors i arrel).
    """
    return sorted(tutti_solutions_ast(digits, target, variant))


def tutti_solutions_ast(digits, target, variant=FULL):
    """Com `tutti_solutions` però retorna dict {canonical: ast} (per validar l'avaluació)."""
    digits = list(digits)
    n = len(digits)
    if n == 1:
        ast = ('num', digits[0])
        return {canonical(ast): ast} if digits[0] == target else {}
    full = (1 << n) - 1

    reach_cache = {}

    def reach(mask):
        return _reach(mask, digits, n, reach_cache, variant)

    bin_memo = {}   # (mask, value) -> {canonical: ast}  (només node binari/fulla, SENSE arrel al cim)
    aug_memo = {}   # (mask, value) -> {canonical: ast}  (assolible, amb cadena d'arrels al cim si cal)

    def enum_binary(mask, value):
        """Reps on `value` ve d'un node binari (o fulla), no d'una arrel al cim."""
        key = (mask, value)
        cached = bin_memo.get(key)
        if cached is not None:
            return cached
        out = {}
        bin_memo[key] = out  # marca abans de recursar (els subconjunts són estrictament menors, no hi ha cicle)
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
        """Reps assolibles de `value`: node binari + augmentació amb cadena d'arrels (com _reach)."""
        key = (mask, value)
        cached = aug_memo.get(key)
        if cached is not None:
            return cached
        out = dict(enum_binary(mask, value))  # j = 0 arrels
        bits_count = bin(mask).count('1')
        # _reach NOMÉS augmenta amb arrel els nodes de més d'una fulla
        if variant.use_sqrt and bits_count > 1 and value >= 2:
            j = 1
            w = value
            while True:
                w = w * w                      # preimatge de `value` amb j arrels: value**(2**j)
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
    quan és barat (O(|rsub|) o O(|rcomp|)); per a `pow` fa doble bucle acotat."""
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
