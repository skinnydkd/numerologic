"""Recorregut exhaustiu de rutes simples des del centre del rusc.

Una ruta és la seqüència de cel·les visitades després del centre (la longitud no compta
el centre). Una ruta es talla quan una divisió no és exacta o el valor surt de |v| < 1000.
"""
from gen_rutalogic.hive import CENTER, NEIGHBORS, apply_op


def value_stats(start, ops):
    """{valor: [rutes, longitud mínima, longitud màxima]} de totes les rutes d'1 salt o més."""
    stats = {}

    def dfs(cell, mask, value, length):
        for nb in NEIGHBORS[cell]:
            if mask >> nb & 1:
                continue
            v = apply_op(value, ops[nb])
            if v is None:
                continue
            s = stats.get(v)
            if s is None:
                stats[v] = [1, length + 1, length + 1]
            else:
                s[0] += 1
                if length + 1 < s[1]:
                    s[1] = length + 1
                if length + 1 > s[2]:
                    s[2] = length + 1
            dfs(nb, mask | 1 << nb, v, length + 1)

    dfs(CENTER, 1 << CENTER, start, 0)
    return stats


def routes_to(start, ops, target):
    """Totes les rutes (llistes de cel·les) que acaben exactament en `target`."""
    out = []

    def dfs(cell, mask, value, path):
        for nb in NEIGHBORS[cell]:
            if mask >> nb & 1:
                continue
            v = apply_op(value, ops[nb])
            if v is None:
                continue
            path.append(nb)
            if v == target:
                out.append(list(path))
            dfs(nb, mask | 1 << nb, v, path)
            path.pop()

    dfs(CENTER, 1 << CENTER, start, [])
    return out


def run(start, ops, route):
    """Valor al final de `route`, o None si no és una ruta vàlida."""
    value, cell, seen = start, CENTER, {CENTER}
    for nb in route:
        if nb in seen or nb not in NEIGHBORS[cell]:
            return None
        value = apply_op(value, ops[nb])
        if value is None:
            return None
        seen.add(nb)
        cell = nb
    return value
