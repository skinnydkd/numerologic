"""Graelles de Simbològic: totals de files i columnes, línies com a equacions i rang.

Una graella és una matriu `cells` d'índexs de símbol. Cada fila té una operació
('+' suma, '*' producte); les columnes sempre sumen.
"""
from collections import Counter
from fractions import Fraction
from math import prod


def _line_total(syms, values, op):
    vals = [values[s] for s in syms]
    return prod(vals) if op == "*" else sum(vals)


def totals(cells, values, row_ops):
    """Totals de cada fila (amb la seua operació) i de cada columna (suma)."""
    rows = [_line_total(r, values, op) for r, op in zip(cells, row_ops)]
    cols = [_line_total([r[j] for r in cells], values, "+") for j in range(len(cells[0]))] if cells else []
    return rows, cols


def lines_of(cells, row_ops, row_totals, col_totals):
    """Línies com a equacions: (recompte de símbols, op, total)."""
    out = [(Counter(r), op, t) for r, op, t in zip(cells, row_ops, row_totals)]
    for j, t in enumerate(col_totals):
        out.append((Counter(r[j] for r in cells), "+", t))
    return out


def linear_rank(lines, n_symbols):
    """Rang (exacte, amb Fraction) de la matriu de recomptes de les línies de suma."""
    m = [[Fraction(c.get(s, 0)) for s in range(n_symbols)] for c, op, _ in lines if op == "+"]
    rank, col = 0, 0
    while rank < len(m) and col < n_symbols:
        piv = next((i for i in range(rank, len(m)) if m[i][col] != 0), None)
        if piv is None:
            col += 1
            continue
        m[rank], m[piv] = m[piv], m[rank]
        for i in range(len(m)):
            if i != rank and m[i][col] != 0:
                f = m[i][col] / m[rank][col]
                m[i] = [a - f * b for a, b in zip(m[i], m[rank])]
        rank += 1
        col += 1
    return rank
