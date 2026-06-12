"""Existència del tutti: hi ha una expressió que usa tots els dígits (cadascun una
vegada) i val l'objectiu? Cerca per valors assolibles (no per expressions)."""
from generator.engine import combine, do_sqrt, InvalidExpr, FULL


def _reach(mask, digits, n, cache, variant):
    """Conjunt de valors assolibles usant exactament les fulles de `mask` (cada dígit una vegada)."""
    cached = cache.get(mask)
    if cached is not None:
        return cached
    bits = [i for i in range(n) if mask & (1 << i)]
    if len(bits) == 1:
        s = {digits[bits[0]]}
    else:
        s = set()
        sub = mask
        while True:
            sub = (sub - 1) & mask
            if sub == 0:
                break
            comp = mask ^ sub
            left = _reach(sub, digits, n, cache, variant)
            right = _reach(comp, digits, n, cache, variant)
            for a in left:
                for b in right:
                    for op in variant.ops:
                        try:
                            s.add(combine(op, a, b))
                        except InvalidExpr:
                            pass
    # augmentació amb arrel (no afegeix fulles)
    if variant.use_sqrt:
        frontier = list(s)
        while frontier:
            nxt = []
            for v in frontier:
                try:
                    sv = do_sqrt(v)
                except InvalidExpr:
                    continue
                if sv not in s:
                    s.add(sv)
                    nxt.append(sv)
            frontier = nxt
    cache[mask] = s
    return s


def tutti_exists(digits, target, variant=FULL):
    """True si alguna expressió que usa els `len(digits)` dígits (cadascun una vegada) val `target`.

    `variant` (engine.Variant) ha de coincidir amb la del repte: el tutti usa el mateix
    conjunt d'operadors i arrel. (La repetició no aplica: el tutti usa cada dígit un cop.)
    DP de valors assolibles sobre subconjunts de bits: només guarda enters, no
    expressions, de manera que evita l'explosió de memòria del cercador exhaustiu.
    Early-exit: retorna en trobar l'objectiu sense materialitzar el conjunt complet.
    """
    n = len(digits)
    if n == 1:
        return digits[0] == target
    full = (1 << n) - 1
    cache = {}
    sub = full
    while True:
        sub = (sub - 1) & full
        if sub == 0:
            break
        comp = full ^ sub
        left = _reach(sub, digits, n, cache, variant)
        right = _reach(comp, digits, n, cache, variant)
        for a in left:
            for b in right:
                for op in variant.ops:
                    try:
                        v = combine(op, a, b)
                    except InvalidExpr:
                        continue
                    if v == target:
                        return True
                    # arrel(s) damunt del resultat (no afegeix fulles)
                    if variant.use_sqrt:
                        sv = v
                        while True:
                            try:
                                sv = do_sqrt(sv)
                            except InvalidExpr:
                                break
                            if sv == target:
                                return True
    return False
