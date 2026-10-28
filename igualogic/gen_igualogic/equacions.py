"""Regles d'Igualògic: validesa d'una igualtat, enumeració i retroacció (colors).

Paritat amb js/equacions.js i js/feedback.js. Caràcters interns: dígits 0-9, + - * / =
(a la interfície es mostren com + − × ÷ =).

Una igualtat és vàlida si:
  - té exactament un '=' i, a la dreta, només un nombre (sense zeros a l'esquerra);
  - a l'esquerra hi ha nombre (op nombre)+, amb almenys un operador;
  - cap nombre té zeros a l'esquerra ('05' ✗, '0' ✓); no hi ha menys unari;
  - es calcula amb prioritat (× ÷ abans que + −, d'esquerra a dreta) i cada divisió és exacta;
  - el resultat de l'esquerra és igual al nombre de la dreta.
"""
from collections import Counter

OPS = "+-*/"
DIGITS = "0123456789"
ALPHABET = DIGITS + OPS + "="


def _tokens(lhs):
    """Parteix l'esquerra en [nombre, op, nombre, ...]. Retorna None si la forma no és vàlida."""
    toks = []
    cur = ""
    for ch in lhs:
        if ch in DIGITS:
            cur += ch
        elif ch in OPS:
            if not cur:
                return None
            toks.append(cur)
            toks.append(ch)
            cur = ""
        else:
            return None
    if not cur:
        return None
    toks.append(cur)
    for t in toks[0::2]:
        if len(t) > 1 and t[0] == "0":
            return None
    return toks


def eval_lhs(lhs):
    """Valor enter de l'esquerra amb prioritat d'operacions, o None si no és vàlida."""
    toks = _tokens(lhs)
    if toks is None or len(toks) < 3:
        return None
    # primer × i ÷ (esquerra a dreta), després + i −
    terms = [int(toks[0])]
    addops = []
    i = 1
    while i < len(toks):
        op, n = toks[i], int(toks[i + 1])
        if op == "*":
            terms[-1] = terms[-1] * n
        elif op == "/":
            if n == 0 or terms[-1] % n != 0:
                return None
            terms[-1] = terms[-1] // n
        else:
            addops.append(op)
            terms.append(n)
        i += 2
    v = terms[0]
    for op, t in zip(addops, terms[1:]):
        v = v + t if op == "+" else v - t
    return v


def is_valid(eq):
    """True si `eq` és una igualtat certa segons les regles del joc."""
    if eq.count("=") != 1:
        return False
    lhs, rhs = eq.split("=")
    if not rhs or any(c not in DIGITS for c in rhs):
        return False
    if len(rhs) > 1 and rhs[0] == "0":
        return False
    v = eval_lhs(lhs)
    return v is not None and v == int(rhs)


def feedback(guess, answer):
    """Colors per posició: 'g' lloc correcte, 'y' hi és en un altre lloc, 'x' no hi és.

    Regla del Wordle per a repetits: primer els encerts exactes, després els 'y' fins
    a esgotar les aparicions que queden a la resposta.
    """
    res = ["x"] * len(guess)
    rest = Counter()
    for i, (g, a) in enumerate(zip(guess, answer)):
        if g == a:
            res[i] = "g"
        else:
            rest[a] += 1
    for i, g in enumerate(guess):
        if res[i] != "g" and rest[g] > 0:
            res[i] = "y"
            rest[g] -= 1
    return "".join(res)


def _numbers(maxlen):
    """Nombres sense zeros a l'esquerra amb com a molt `maxlen` xifres."""
    out = []
    for n in range(10 ** maxlen):
        out.append(str(n))
    return out


def enumerate_equations(length):
    """Totes les igualtats vàlides de `length` caràcters (ordenades).

    Recorre l'esquerra com a seqüències nombre-op-nombre de la llargària que deixa
    lloc a un resultat de r xifres, i comprova que el resultat tinga exactament r xifres.
    """
    found = set()
    for r in range(1, length - 3):        # xifres del resultat
        lhs_len = length - 1 - r
        if lhs_len < 3:
            continue
        for lhs in _lhs_strings(lhs_len):
            v = eval_lhs(lhs)
            if v is None or v < 0:
                continue
            s = str(v)
            if len(s) == r:
                found.add(lhs + "=" + s)
    return sorted(found)


def _lhs_strings(n):
    """Cadenes nombre(op nombre)+ de llargària exacta n, sense zeros a l'esquerra."""
    nums = {k: [str(x) for x in range(10 ** (k - 1) if k > 1 else 0, 10 ** k)] for k in range(1, n + 1)}

    def rec(remaining, first):
        # genera continuacions: [op nombre]* que ocupen exactament `remaining` caràcters
        if remaining == 0:
            yield ""
            return
        for k in range(1, remaining):            # 1 op + k xifres
            for op in OPS:
                for num in nums[k]:
                    for tail in rec(remaining - 1 - k, False):
                        yield op + num + tail

    for k in range(1, n - 1):                     # primer nombre de k xifres, cal almenys un op
        for num in nums[k]:
            for tail in rec(n - k, True):
                if tail:
                    yield num + tail
