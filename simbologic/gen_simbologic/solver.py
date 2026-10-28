"""Solucionador «humà» de Simbològic: deduccions pas a pas, totes sòlides.

Regles, per ordre de preferència:
  a  una línia amb un sol símbol desconegut (suma: resta i divisió exactes;
     producte: només si el desconegut hi surt un cop, perquè x·x = 9 no diu el signe);
  b  dues línies de suma que, restades, deixen un sol desconegut;
  c  una línia menys k vegades una altra (k = ±2) que deixa un sol desconegut.
Com que cada pas és una conseqüència necessària de les equacions, si es resolen tots
els símbols la solució és única.
"""
from itertools import permutations
from math import prod

KS = ((1, "b"), (-1, "b"), (2, "c"), (-2, "c"))


def _residual(line, known):
    """Coeficients dels desconeguts i terme independent d'una línia de suma."""
    counts, _, total = line
    coef = {s: c for s, c in counts.items() if s not in known}
    rhs = total - sum(c * known[s] for s, c in counts.items() if s in known)
    return coef, rhs


def _step_a(lines, known):
    for counts, op, total in lines:
        unk = [s for s in counts if s not in known]
        if len(unk) != 1:
            continue
        u, c = unk[0], counts[unk[0]]
        if op == "+":
            coef, rhs = _residual((counts, op, total), known)
            if rhs % c == 0:
                return u, rhs // c
        elif c == 1:
            kp = prod(known[s] ** n for s, n in counts.items() if s != u)
            if kp != 0 and total % kp == 0:
                return u, total // kp
    return None


def _step_bc(lines, known):
    sums = [_residual(l, known) for l in lines if l[1] == "+"]
    for (c1, r1), (c2, r2) in permutations(sums, 2):
        for k, kind in KS:
            coef = {s: c1.get(s, 0) - k * c2.get(s, 0) for s in set(c1) | set(c2)}
            nz = [s for s, v in coef.items() if v != 0]
            rhs = r1 - k * r2
            if len(nz) == 1 and rhs % coef[nz[0]] == 0:
                return nz[0], rhs // coef[nz[0]], kind
    return None


def solve(lines, n_symbols):
    """{values, order, steps} si es resol del tot amb les regles; si no, None."""
    known, order, steps = {}, [], []
    while len(known) < n_symbols:
        a = _step_a(lines, known)
        if a:
            u, v, kind = *a, "a"
        else:
            bc = _step_bc(lines, known)
            if not bc:
                return None
            u, v, kind = bc
        known[u] = v
        order.append(u)
        steps.append(kind)
    return {"values": known, "order": order, "steps": steps}
