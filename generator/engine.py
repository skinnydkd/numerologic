"""Motor d'avaluació i canonicalització d'expressions de Numerològic."""
import math
from collections import namedtuple

CAP = 1_000_000          # |valor| ha de quedar estrictament per sota d'aquest cap
MAX_EXPONENT = 19        # 2**19 < CAP; evita potències absurdes

# Regles de generació configurables (les passa tot el pipeline).
#   ops:          operadors binaris permesos (subconjunt de add/sub/mul/div/pow)
#   use_sqrt:     si s'augmenta amb arrel quadrada (operador unari, no afegeix fulles)
#   allow_repeat: si un dígit del rusc es pot usar més d'un cop dins d'una expressió
Variant = namedtuple("Variant", ["ops", "use_sqrt", "allow_repeat"])
FULL = Variant(("add", "sub", "mul", "div", "pow"), True, True)        # regles actuals del joc
BASIC_NOREPEAT = Variant(("add", "sub", "mul", "div"), False, False)   # variant: només +-*/, sense repetir


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


def reduce1(ast):
    """Absorbeix ×1 i ÷1 del dígit-fulla 1 (identitats; preserva el valor).
    És la clau de dedup i de tutti: el 1 trivial no compta com a operand."""
    k = ast[0]
    if k == 'num':
        return ast
    if k == 'sqrt':
        return ('sqrt', reduce1(ast[1]))
    a = reduce1(ast[1])
    b = reduce1(ast[2])
    if k == 'mul':
        if a == ('num', 1):
            return b
        if b == ('num', 1):
            return a
    elif k == 'div':
        if b == ('num', 1):
            return a
    # ponytail: només ×1/÷1 del dígit-fulla; ^1 fora d'abast (el banc no usa pow)
    return (k, a, b)


def _flatten(ast, k):
    """Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques."""
    parts = []
    for child in (ast[1], ast[2]):
        if child[0] == k:
            parts.extend(_flatten(child, k))
        else:
            parts.append(_canonical(child))
    return parts


def _add_terms(ast, flip, out):
    """Aplana la capa additiva (+ i −) en termes amb signe: el − és +(−); el signe
    distribueix sobre la suma (−(a+b) ≡ −a−b). Cada termе negatiu es marca amb (~ ...)."""
    k = ast[0]
    if k == 'add':
        _add_terms(ast[1], flip, out)
        _add_terms(ast[2], flip, out)
    elif k == 'sub':
        _add_terms(ast[1], flip, out)
        _add_terms(ast[2], not flip, out)
    else:
        key = _canonical(ast)
        out.append("(~ " + key + ")" if flip else key)


def _canonical(ast):
    """Forma canònica d'un AST ja reduït (sense absorbir; ús intern)."""
    k = ast[0]
    if k == 'num':
        return str(ast[1])
    if k == 'sqrt':
        return "r(" + _canonical(ast[1]) + ")"
    if k == 'mul':
        return "(* " + " ".join(sorted(_flatten(ast, 'mul'))) + ")"
    if k in ('add', 'sub'):
        terms = []
        _add_terms(ast, False, terms)
        return "(+ " + " ".join(sorted(terms)) + ")"
    sym = {'div': '/', 'pow': '^'}[k]
    return "(" + sym + " " + _canonical(ast[1]) + " " + _canonical(ast[2]) + ")"


def canonical(ast):
    """Cadena canònica determinista (clau de deduplicació), amb ×1/÷1 absorbits."""
    return _canonical(reduce1(ast))


def has_pow_or_sqrt(ast):
    """True si l'AST conté alguna potència o arrel (per al bonus de punts)."""
    k = ast[0]
    if k == 'num':
        return False
    if k in ('pow', 'sqrt'):
        return True
    return any(has_pow_or_sqrt(c) for c in ast[1:])
