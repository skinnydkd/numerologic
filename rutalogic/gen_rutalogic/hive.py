"""Rusc de Rutalògic: 19 cel·les hexagonals en files 3-4-5-4-3 i les seues operacions.

Cel·les en ordre de lectura (fila a fila, d'esquerra a dreta); el centre és l'índex 9.
Coordenades axials (q, r) amb |q|, |r|, |q + r| ≤ 2. Operacions: "+n", "-n", "*2", "*3", "/2", "/3".
"""
CELLS = [(q, r) for r in range(-2, 3) for q in range(-2, 3) if abs(q + r) <= 2]
CENTER = CELLS.index((0, 0))
_DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1))
NEIGHBORS = [
    [CELLS.index((q + dq, r + dr)) for dq, dr in _DIRS if (q + dq, r + dr) in CELLS]
    for q, r in CELLS
]
LIMIT = 1000  # |valor| < LIMIT


def apply_op(value, op):
    """Valor després de passar per una cel·la, o None si la divisió no és exacta o se'n va de límit."""
    n = int(op[1:])
    kind = op[0]
    if kind == "+":
        v = value + n
    elif kind == "-":
        v = value - n
    elif kind == "*":
        v = value * n
    elif value % n:
        return None
    else:
        v = value // n
    return v if abs(v) < LIMIT else None
