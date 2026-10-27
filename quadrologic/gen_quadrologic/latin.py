"""Quadrats llatins i gàbies de Quadrològic.

Una gàbia és {cells: [[r, c], ...], op, target}. Operacions:
  '='  una sola cel·la (es mostra només el número);
  '+' '*'  qualsevol mida;  '-' '/'  només 2 cel·les (diferència i quocient exacte, sense ordre).
"""
from itertools import product
from math import prod


def latin_square(rnd, n):
    """Quadrat llatí aleatori: el cíclic amb files, columnes i xifres barrejades."""
    rows, cols, syms = list(range(n)), list(range(n)), list(range(1, n + 1))
    rnd.shuffle(rows)
    rnd.shuffle(cols)
    rnd.shuffle(syms)
    return [[syms[(rows[r] + cols[c]) % n] for c in range(n)] for r in range(n)]


def cage_value(op, vals):
    """Resultat d'aplicar l'operació de la gàbia als valors, o None si no és exacte."""
    if op == "=":
        return vals[0]
    if op == "+":
        return sum(vals)
    if op == "*":
        return prod(vals)
    a, b = max(vals), min(vals)
    if op == "-":
        return a - b
    return a // b if a % b == 0 else None


def cage_tuples(cage, n):
    """Totes les assignacions de la gàbia que compleixen l'operació i no repeteixen fila ni columna."""
    cells = cage["cells"]
    out = []
    for vals in product(range(1, n + 1), repeat=len(cells)):
        if cage_value(cage["op"], vals) != cage["target"]:
            continue
        ok = all(
            vals[i] != vals[j]
            for i in range(len(cells)) for j in range(i + 1, len(cells))
            if cells[i][0] == cells[j][0] or cells[i][1] == cells[j][1]
        )
        if ok:
            out.append(vals)
    return out


def make_cages(rnd, sol, max_single=None):
    """Parteix la graella en gàbies de 1–3 cel·les veïnes i n'escull l'operació."""
    n = len(sol)
    max_single = n // 2 if max_single is None else max_single
    while True:
        free = {(r, c) for r in range(n) for c in range(n)}
        order = sorted(free)
        rnd.shuffle(order)
        groups = []
        for start in order:
            if start not in free:
                continue
            size = rnd.choices((1, 2, 3), weights=(1, 5, 4))[0]
            group = [start]
            free.discard(start)
            while len(group) < size:
                nbrs = [(r + dr, c + dc) for r, c in group for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                nbrs = sorted({p for p in nbrs if p in free})
                if not nbrs:
                    break
                p = rnd.choice(nbrs)
                group.append(p)
                free.discard(p)
            groups.append(group)
        if sum(len(g) == 1 for g in groups) <= max_single:
            break
    return [_with_op(rnd, sorted(g), sol) for g in groups]


def _with_op(rnd, cells, sol):
    vals = [sol[r][c] for r, c in cells]
    if len(cells) == 1:
        op = "="
    elif len(cells) == 2:
        a, b = max(vals), min(vals)
        ops = ["-", "-", "+", "*"] + (["/", "/", "/"] if a % b == 0 else [])
        op = rnd.choice(ops)
    else:
        op = rnd.choice(("+", "*"))
    return {"cells": [list(p) for p in cells], "op": op, "target": cage_value(op, vals)}
