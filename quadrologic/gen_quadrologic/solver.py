"""Solucionadors de Quadrològic.

count_solutions: retrocés per gàbies (primer les que tenen menys assignacions) que
                 compta solucions i s'atura a `limit`.
logic_solve:     el que faria una persona: candidats, combinacions possibles de cada
                 gàbia, singles nus i singles amagats en files i columnes. No prova mai.
"""
from gen_quadrologic.latin import cage_tuples


def count_solutions(n, cages, limit=2):
    tuples = [(c["cells"], cage_tuples(c, n)) for c in cages]
    tuples.sort(key=lambda t: len(t[1]))
    rows = [set() for _ in range(n)]
    cols = [set() for _ in range(n)]
    found = 0

    def rec(i):
        nonlocal found
        if i == len(tuples):
            found += 1
            return found >= limit
        cells, opts = tuples[i]
        for vals in opts:
            if any(v in rows[r] or v in cols[c] for (r, c), v in zip(cells, vals)):
                continue
            for (r, c), v in zip(cells, vals):
                rows[r].add(v)
                cols[c].add(v)
            stop = rec(i + 1)
            for (r, c), v in zip(cells, vals):
                rows[r].discard(v)
                cols[c].discard(v)
            if stop:
                return True
        return False

    rec(0)
    return found


def logic_solve(n, cages):
    """{grid, order, passes} si es resol només amb lògica; si no, None."""
    cand = {(r, c): set(range(1, n + 1)) for r in range(n) for c in range(n)}
    cage_opts = [(c["cells"], cage_tuples(c, n)) for c in cages]
    order, placed = [], set()
    units = [[(r, c) for c in range(n)] for r in range(n)] + [[(r, c) for r in range(n)] for c in range(n)]
    passes = 0

    def note_singles():
        for p, s in cand.items():
            if len(s) == 1 and p not in placed:
                placed.add(p)
                order.append(list(p))

    while len(placed) < n * n:
        passes += 1
        before = sum(len(s) for s in cand.values())
        # combinacions de gàbia compatibles amb els candidats
        for k, (cells, opts) in enumerate(cage_opts):
            opts = [v for v in opts if all(x in cand[tuple(p)] for p, x in zip(cells, v))]
            cage_opts[k] = (cells, opts)
            for i, p in enumerate(cells):
                cand[tuple(p)] &= {v[i] for v in opts}
        # singles nus: treu el valor de la fila i la columna
        for p, s in cand.items():
            if len(s) == 1:
                v = next(iter(s))
                for q in cand:
                    if q != p and (q[0] == p[0] or q[1] == p[1]):
                        cand[q].discard(v)
        # singles amagats: un valor que només cap en una cel·la de la unitat
        for unit in units:
            for v in range(1, n + 1):
                where = [p for p in unit if v in cand[p]]
                if len(where) == 1:
                    cand[where[0]] = {v}
        if any(not s for s in cand.values()):
            return None
        note_singles()
        if sum(len(s) for s in cand.values()) == before:
            return None
    grid = [[next(iter(cand[(r, c)])) for c in range(n)] for r in range(n)]
    return {"grid": grid, "order": order, "passes": passes}
