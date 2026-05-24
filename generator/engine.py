"""Motor d'avaluació i canonicalització d'expressions de Numerològic."""
import math

CAP = 1_000_000          # |valor| ha de quedar estrictament per sota d'aquest cap
MAX_EXPONENT = 19        # 2**19 < CAP; evita potències absurdes


class InvalidExpr(Exception):
    """L'expressió viola una regla de validesa (divisió inexacta, arrel no exacta, etc.)."""


def combine(op, a, b):
    """Aplica un operador binari a dos valors enters ja vàlids. Retorna l'enter o llança InvalidExpr."""
    if op == 'add':
        v = a + b
    elif op == 'sub':
        v = a - b
    elif op == 'mul':
        v = a * b
    elif op == 'div':
        if b == 0 or a % b != 0:
            raise InvalidExpr
        v = a // b
    elif op == 'pow':
        if b < 0 or b > MAX_EXPONENT or (a == 0 and b == 0):
            raise InvalidExpr
        v = a ** b
    else:
        raise ValueError(f"operador desconegut: {op}")
    if abs(v) >= CAP:
        raise InvalidExpr
    return v


def do_sqrt(v):
    """Arrel quadrada exacta d'un enter no negatiu. Exclou 0 i 1 (no-op / bucle)."""
    if v < 0 or v in (0, 1):
        raise InvalidExpr
    r = math.isqrt(v)
    if r * r != v:
        raise InvalidExpr
    return r


def evaluate(ast):
    """Avalua un AST aplicant totes les regles. Retorna l'enter o llança InvalidExpr."""
    k = ast[0]
    if k == 'num':
        return ast[1]
    if k == 'sqrt':
        return do_sqrt(evaluate(ast[1]))
    a = evaluate(ast[1])
    b = evaluate(ast[2])
    return combine(k, a, b)
