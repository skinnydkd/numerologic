# Numerològic — Pla 1: Motor i generador (Python) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el motor matemàtic (avaluador, forma canònica, cercador exhaustiu de solucions) i el generador que produeix `data/puzzles.json` amb reptes dins la banda de solucions tipus Paraulògic.

**Architecture:** Paquet Python `generator/` amb mòduls petits i focalitzats. El motor avalua i canonicalitza expressions segons les regles de la spec. El cercador enumera per programació dinàmica sobre multiconjunts de dígits (reutilització fins a 6 operands), deduplica per forma canònica i agrupa per valor. El generador filtra reptes per banda de solucions i escriu el pool a JSON. La cadena canònica és el **contracte** que el client JS replicarà idènticament.

**Tech Stack:** Python 3.11+, pytest. Sense dependències externes (només biblioteca estàndard: `math`, `itertools`, `functools`, `json`, `random`, `argparse`).

---

## File Structure

```
numerologic/
  generator/
    __init__.py            # paquet buit
    engine.py              # InvalidExpr, CAP, combine, do_sqrt, evaluate, canonical, has_pow_or_sqrt
    solver.py              # results (DP memoitzat), generate -> dict canonical->meta
    puzzles.py             # make_puzzle: punts, numerogram, totals, llindars de rang
    generate.py            # CLI: genera el pool i escriu data/puzzles.json
    tests/
      __init__.py
      test_engine.py
      test_canonical.py
      test_solver.py
      test_puzzles.py
  data/                    # (sortida) puzzles.json
  docs/superpowers/specs/
    canonical-format.md    # contracte de la cadena canònica (per al client JS)
  requirements-dev.txt     # pytest
```

Totes les ordres s'executen des de l'arrel del projecte `numerologic/`. Els tests s'executen amb `python -m pytest generator/tests -v` (l'arrel queda al `sys.path`, de manera que `from generator.engine import ...` funciona).

---

## Task 0: Bootstrap del paquet Python i pytest

**Files:**
- Create: `generator/__init__.py`
- Create: `generator/tests/__init__.py`
- Create: `requirements-dev.txt`
- Create: `generator/tests/test_smoke.py`

- [ ] **Step 1: Crear el paquet i les dependències de test**

`generator/__init__.py` (buit):

```python
```

`generator/tests/__init__.py` (buit):

```python
```

`requirements-dev.txt`:

```
pytest>=8.0
```

- [ ] **Step 2: Escriure un test de fum**

`generator/tests/test_smoke.py`:

```python
def test_smoke():
    assert 1 + 1 == 2
```

- [ ] **Step 3: Instal·lar i executar**

Run: `python -m pip install -r requirements-dev.txt && python -m pytest generator/tests -v`
Expected: PASS (1 passed)

- [ ] **Step 4: Commit**

```bash
git add generator requirements-dev.txt
git commit -m "chore: bootstrap del paquet generator i pytest"
```

---

## Task 1: Avaluador d'expressions (`evaluate`, `combine`, `do_sqrt`)

L'AST és binari i representat amb tuples hashables:
`('num', d)`, `('add', a, b)`, `('sub', a, b)`, `('mul', a, b)`, `('div', a, b)`, `('pow', a, b)`, `('sqrt', a)`.

**Files:**
- Create: `generator/engine.py`
- Test: `generator/tests/test_engine.py`

- [ ] **Step 1: Escriure els tests que fallen**

`generator/tests/test_engine.py`:

```python
import pytest
from generator.engine import evaluate, InvalidExpr, CAP


def test_num():
    assert evaluate(('num', 5)) == 5


def test_basic_ops():
    assert evaluate(('add', ('num', 3), ('num', 4))) == 7
    assert evaluate(('sub', ('num', 3), ('num', 4))) == -1   # intermedis negatius permesos
    assert evaluate(('mul', ('num', 3), ('num', 4))) == 12


def test_division_must_be_exact():
    assert evaluate(('div', ('num', 8), ('num', 4))) == 2
    with pytest.raises(InvalidExpr):
        evaluate(('div', ('num', 7), ('num', 2)))
    with pytest.raises(InvalidExpr):
        evaluate(('div', ('num', 4), ('num', 0)))


def test_power_rules():
    assert evaluate(('pow', ('num', 2), ('num', 3))) == 8
    with pytest.raises(InvalidExpr):                       # exponent negatiu
        evaluate(('pow', ('num', 2), ('sub', ('num', 1), ('num', 3))))
    with pytest.raises(InvalidExpr):                       # 0^0
        evaluate(('pow', ('num', 0), ('num', 0)))
    with pytest.raises(InvalidExpr):                       # exponent massa gran
        evaluate(('pow', ('num', 2), ('num', 99)))


def test_sqrt_rules():
    assert evaluate(('sqrt', ('num', 9))) == 3
    with pytest.raises(InvalidExpr):                       # no és quadrat perfecte
        evaluate(('sqrt', ('num', 8)))
    with pytest.raises(InvalidExpr):                       # negatiu
        evaluate(('sqrt', ('sub', ('num', 1), ('num', 5))))
    with pytest.raises(InvalidExpr):                       # no-op / bucle
        evaluate(('sqrt', ('num', 1)))


def test_cap():
    with pytest.raises(InvalidExpr):
        evaluate(('pow', ('num', 9), ('num', 7)))          # 4_782_969 >= CAP
    assert CAP == 1_000_000
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_engine.py -v`
Expected: FAIL (ModuleNotFoundError: generator.engine)

- [ ] **Step 3: Implementar el motor**

`generator/engine.py`:

```python
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
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_engine.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generator/engine.py generator/tests/test_engine.py
git commit -m "feat: avaluador d'expressions amb regles de validesa"
```

---

## Task 2: Forma canònica (`canonical`, `has_pow_or_sqrt`)

Contracte de la cadena canònica (s'implementarà idènticament en JS):
- `('num', d)` → `"d"` (ex: `"3"`)
- `('sqrt', x)` → `"r(" + canonical(x) + ")"`
- `('sub', a, b)` → `"(- " + canonical(a) + " " + canonical(b) + ")"`
- `('div', a, b)` → `"(/ " + canonical(a) + " " + canonical(b) + ")"`
- `('pow', a, b)` → `"(^ " + canonical(a) + " " + canonical(b) + ")"`
- `('add', ...)` → aplana fills `add` imbricats, **ordena** les seves cadenes canòniques (ordre per punt de codi Unicode, l'ordre per defecte de Python `sorted` i de `Array.prototype.sort` per a ASCII), i retorna `"(+ " + " ".join(parts) + ")"`
- `('mul', ...)` → igual amb `"(* "`.

**Files:**
- Modify: `generator/engine.py` (afegir `canonical` i `has_pow_or_sqrt`)
- Test: `generator/tests/test_canonical.py`

- [ ] **Step 1: Escriure els tests que fallen**

`generator/tests/test_canonical.py`:

```python
from generator.engine import canonical, has_pow_or_sqrt


def test_num():
    assert canonical(('num', 3)) == "3"


def test_commutative_sort_and_flatten():
    a = ('mul', ('mul', ('num', 3), ('num', 4)), ('num', 2))
    b = ('mul', ('num', 2), ('mul', ('num', 4), ('num', 3)))
    assert canonical(a) == canonical(b) == "(* 2 3 4)"


def test_add_flatten():
    a = ('add', ('add', ('num', 1), ('num', 2)), ('num', 3))
    assert canonical(a) == "(+ 1 2 3)"


def test_non_commutative_keeps_order():
    assert canonical(('sub', ('num', 5), ('num', 3))) == "(- 5 3)"
    assert canonical(('sub', ('num', 3), ('num', 5))) == "(- 3 5)"
    assert canonical(('div', ('num', 8), ('num', 4))) == "(/ 8 4)"
    assert canonical(('pow', ('num', 2), ('num', 3))) == "(^ 2 3)"


def test_sqrt():
    assert canonical(('sqrt', ('num', 9))) == "r(9)"


def test_different_numbers_are_different():
    # 3*8 vs 4*6 -> formes canòniques diferents
    assert canonical(('mul', ('num', 3), ('num', 8))) != \
           canonical(('mul', ('num', 4), ('num', 6)))


def test_has_pow_or_sqrt():
    assert has_pow_or_sqrt(('pow', ('num', 2), ('num', 3))) is True
    assert has_pow_or_sqrt(('sqrt', ('num', 9))) is True
    assert has_pow_or_sqrt(('add', ('num', 1), ('mul', ('num', 2), ('num', 3)))) is False
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_canonical.py -v`
Expected: FAIL (ImportError: cannot import name 'canonical')

- [ ] **Step 3: Implementar la canonicalització**

Afegir al final de `generator/engine.py`:

```python
def _flatten(ast, k):
    """Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques."""
    parts = []
    for child in (ast[1], ast[2]):
        if child[0] == k:
            parts.extend(_flatten(child, k))
        else:
            parts.append(canonical(child))
    return parts


def canonical(ast):
    """Retorna la cadena canònica determinista d'un AST (clau de deduplicació)."""
    k = ast[0]
    if k == 'num':
        return str(ast[1])
    if k == 'sqrt':
        return "r(" + canonical(ast[1]) + ")"
    if k == 'add':
        return "(+ " + " ".join(sorted(_flatten(ast, 'add'))) + ")"
    if k == 'mul':
        return "(* " + " ".join(sorted(_flatten(ast, 'mul'))) + ")"
    sym = {'sub': '-', 'div': '/', 'pow': '^'}[k]
    return "(" + sym + " " + canonical(ast[1]) + " " + canonical(ast[2]) + ")"


def has_pow_or_sqrt(ast):
    """True si l'AST conté alguna potència o arrel (per al bonus de punts)."""
    k = ast[0]
    if k == 'num':
        return False
    if k in ('pow', 'sqrt'):
        return True
    return any(has_pow_or_sqrt(c) for c in ast[1:])
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_canonical.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generator/engine.py generator/tests/test_canonical.py
git commit -m "feat: forma canonica d'expressions (dedup commutatiu)"
```

---

## Task 3: Cercador de solucions (`generate`)

Enumera totes les expressions vàlides amb 1..`max_leaves` operands (reutilització lliure fins al límit) sobre els 7 dígits, deduplica per forma canònica i agrupa per valor.

`results(ms)` retorna, per a un multiconjunt de dígits `ms` (tupla ordenada), un dict `canonical -> (value, ast)` d'expressions que consumeixen **exactament** aquestes fulles. `generate(digits, max_leaves)` uneix els resultats de tots els multiconjunts de mida 2..`max_leaves` en `canonical -> {"value","leaves","used"}` (`used` = frozenset de dígits diferents emprats).

**Files:**
- Create: `generator/solver.py`
- Test: `generator/tests/test_solver.py`

- [ ] **Step 1: Escriure els tests que fallen**

`generator/tests/test_solver.py`:

```python
from generator.solver import generate
from generator.engine import evaluate


def test_simple_pair():
    # Amb dígits {3,4}: 3+4=7, 3*4=12, 4-3=1, 3-4=-1, 4^3=64, 3^4=81, etc.
    sols = generate([3, 4], max_leaves=2)
    values = {m["value"] for m in sols.values()}
    assert 7 in values     # 3+4
    assert 12 in values    # 3*4
    assert 1 in values     # 4-3
    # tota entrada s'avalua al seu valor i fa servir 1..2 dígits diferents de {3,4}
    for c, m in sols.items():
        assert m["used"].issubset({3, 4})
        assert 1 <= m["leaves"] <= 2


def test_commutative_dedup():
    sols = generate([3, 4], max_leaves=2)
    # nomes una entrada per a 3+4 (no apareix 4+3 per separat)
    plus = [m for m in sols.values() if m["value"] == 7 and m["leaves"] == 2]
    assert len(plus) == 1


def test_used_set_tracks_distinct_digits():
    sols = generate([2, 5], max_leaves=4)
    # ha d'existir alguna solucio que faci servir tant el 2 com el 5
    assert any(m["used"] == {2, 5} for m in sols.values())


def test_values_match_evaluate():
    sols = generate([2, 3, 5], max_leaves=3)
    for c, m in sols.items():
        assert m["value"] == evaluate(m["ast"])
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_solver.py -v`
Expected: FAIL (ModuleNotFoundError: generator.solver)

- [ ] **Step 3: Implementar el cercador**

`generator/solver.py`:

```python
"""Cercador exhaustiu d'expressions per força bruta amb DP sobre multiconjunts."""
from functools import lru_cache
from itertools import combinations, combinations_with_replacement

from generator.engine import combine, do_sqrt, canonical, InvalidExpr

OPS = ('add', 'sub', 'mul', 'div', 'pow')


def _splits(ms):
    """Genera parells (left, right) de submulticonjunts no buits i complementaris de ms (sense repetir parells)."""
    n = len(ms)
    seen = set()
    for r in range(1, n):
        for idx in combinations(range(n), r):
            idxset = set(idx)
            left = tuple(ms[i] for i in idx)
            right = tuple(ms[i] for i in range(n) if i not in idxset)
            key = (left, right)
            if key in seen:
                continue
            seen.add(key)
            yield left, right


def _build(digits, max_leaves):
    """Retorna una funcio results(ms) memoitzada per a aquest conjunt de digits."""

    @lru_cache(maxsize=None)
    def results(ms):
        # ms: tupla ordenada de valors de digit. Retorna dict canonical -> (value, ast).
        out = {}
        if len(ms) == 1:
            ast = ('num', ms[0])
            out[canonical(ast)] = (ms[0], ast)
        else:
            for left, right in _splits(ms):
                L = results(tuple(sorted(left)))
                R = results(tuple(sorted(right)))
                for lv, la in L.values():
                    for rv, ra in R.values():
                        for op in OPS:
                            try:
                                v = combine(op, lv, rv)
                            except InvalidExpr:
                                continue
                            ast = (op, la, ra)
                            c = canonical(ast)
                            if c not in out:
                                out[c] = (v, ast)
        # augmentacio amb arrel (no afegeix fulles): sqrt de cada entrada existent
        for v, ast in list(out.values()):
            try:
                sv = do_sqrt(v)
            except InvalidExpr:
                continue
            sast = ('sqrt', ast)
            sc = canonical(sast)
            if sc not in out:
                out[sc] = (sv, sast)
        return out

    return results


def generate(digits, max_leaves=6):
    """Totes les expressions valides amb 2..max_leaves operands sobre `digits`.

    Retorna dict: canonical -> {"value", "ast", "leaves", "used"} amb used = frozenset de digits diferents.
    """
    digits = list(digits)
    results = _build(tuple(sorted(digits)), max_leaves)
    out = {}
    for k in range(2, max_leaves + 1):
        for ms in combinations_with_replacement(sorted(digits), k):
            for c, (v, ast) in results(tuple(ms)).items():
                if c in out:
                    continue
                out[c] = {
                    "value": v,
                    "ast": ast,
                    "leaves": k,
                    "used": frozenset(ms),
                }
    return out
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_solver.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generator/solver.py generator/tests/test_solver.py
git commit -m "feat: cercador exhaustiu de solucions amb dedup canonic"
```

---

## Task 4: Construcció d'un repte (`make_puzzle`)

Donat un conjunt de 7 dígits i un índex central, troba l'objectiu amb un nombre de solucions dins la banda, calcula punts per solució (incloent el bonus Numerogram), punts totals i llindars de rang.

Fórmula de punts: `leaves + (2 si l'expressió usa ^ o √) + (10 si és Numerogram)`. Numerogram = la solució usa **tots 7** els dígits diferents.

Rangs (percentatges sobre el total): Principiant 0, Bé 10, Molt bé 25, Expert 45, Mestre 65, Geni 85, Totes 100. Llindar en punts = `ceil(pct/100 * total)`.

**Files:**
- Create: `generator/puzzles.py`
- Test: `generator/tests/test_puzzles.py`

- [ ] **Step 1: Escriure els tests que fallen**

`generator/tests/test_puzzles.py`:

```python
import math
from generator.puzzles import solution_points, build_ranks, make_puzzle, RANK_PCTS


def test_solution_points_basic():
    # 2 fulles, sense pow/sqrt, no numerogram -> 2 punts
    assert solution_points(leaves=2, uses_pow_sqrt=False, is_numerogram=False) == 2


def test_solution_points_bonus():
    assert solution_points(leaves=3, uses_pow_sqrt=True, is_numerogram=False) == 5
    assert solution_points(leaves=4, uses_pow_sqrt=False, is_numerogram=True) == 14


def test_build_ranks_thresholds():
    ranks = build_ranks(total=100)
    names = [r[0] for r in ranks]
    assert names[0] == "Principiant" and names[-1] == "Totes"
    assert ranks[0][1] == 0
    assert ranks[-1][1] == 100
    # llindar 'Bé' al 10%
    be = dict(ranks)["Bé"]
    assert be == math.ceil(0.10 * 100)


def test_make_puzzle_in_band():
    # conjunt petit i banda relaxada per garantir trobar objectiu
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4)
    assert pz is not None
    assert 5 <= len(pz["solutions"]) <= 9999
    assert pz["digits"] == [1, 2, 3, 4, 5, 6, 7]
    assert pz["centralIndex"] == 2
    assert pz["totalPoints"] > 0
    # totes les solucions usen el digit central (valor a la posicio central)
    # (es comprova indirectament: el generador nomes inclou les que l'usen)
    assert isinstance(pz["solutions"][0], str)


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_puzzles.py -v`
Expected: FAIL (ModuleNotFoundError: generator.puzzles)

- [ ] **Step 3: Implementar la construcció de reptes**

`generator/puzzles.py`:

```python
"""Construcció d'un repte: selecció d'objectiu, punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt

# (nom, percentatge sobre el total de punts)
RANK_PCTS = [
    ("Principiant", 0),
    ("Bé", 10),
    ("Molt bé", 25),
    ("Expert", 45),
    ("Mestre", 65),
    ("Geni", 85),
    ("Totes", 100),
]


def solution_points(leaves, uses_pow_sqrt, is_numerogram):
    """Punts d'una solució: operands + bonus pow/sqrt + bonus numerogram."""
    return leaves + (2 if uses_pow_sqrt else 0) + (10 if is_numerogram else 0)


def build_ranks(total):
    """Llindars de rang en punts a partir del total."""
    return [(name, math.ceil(pct / 100 * total)) for name, pct in RANK_PCTS]


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=6):
    """Construeix un repte per a aquests dígits/central si algun objectiu cau dins la banda.

    Retorna un dict serialitzable o None si cap objectiu té un comptador dins la banda.
    """
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves)

    # agrupa per valor, només solucions que facin servir el central
    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    lo, hi = band
    candidates = [(v, items) for v, items in by_value.items() if lo <= len(items) <= hi]
    if not candidates:
        return None

    # tria l'objectiu amb més solucions dins la banda (repte més ric); desempat pel valor
    target, items = max(candidates, key=lambda t: (len(t[1]), -t[0]))

    full = frozenset(digits)
    solutions = []
    total = 0
    for c, m in items:
        is_ng = m["used"] == full
        pts = solution_points(m["leaves"], has_pow_or_sqrt(m["ast"]), is_ng)
        total += pts
        solutions.append(c)

    solutions.sort()
    return {
        "target": target,
        "digits": digits,
        "centralIndex": central_index,
        "maxOperands": max_leaves,
        "solutions": solutions,
        "totalPoints": total,
        "ranks": build_ranks(total),
    }
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_puzzles.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generator/puzzles.py generator/tests/test_puzzles.py
git commit -m "feat: construccio de reptes amb punts, numerogram i rangs"
```

---

## Task 5: CLI del generador del pool (`generate.py`)

Recorre conjunts de 7 dígits (de 9) i índexs centrals, construeix reptes dins la banda, en recull `count`, els ordena i els escriu a `data/puzzles.json` amb una data d'inici per assignar el repte diari.

**Files:**
- Create: `generator/generate.py`
- Test: `generator/tests/test_generate_cli.py`

- [ ] **Step 1: Escriure el test que falla**

`generator/tests/test_generate_cli.py`:

```python
import json
from generator.generate import build_pool


def test_build_pool_small():
    pool = build_pool(count=3, band=(20, 200), max_leaves=5, seed=42)
    assert len(pool["puzzles"]) == 3
    assert "startDate" in pool
    for pz in pool["puzzles"]:
        assert 20 <= len(pz["solutions"]) <= 200
        assert len(pz["digits"]) == 7
        assert len(set(pz["digits"])) == 7
        assert 0 <= pz["centralIndex"] < 7
    # reptes diferents (objectiu o dígits)
    keys = {(pz["target"], tuple(pz["digits"]), pz["centralIndex"]) for pz in pool["puzzles"]}
    assert len(keys) == 3
```

- [ ] **Step 2: Executar per verificar que falla**

Run: `python -m pytest generator/tests/test_generate_cli.py -v`
Expected: FAIL (ModuleNotFoundError: generator.generate)

- [ ] **Step 3: Implementar el generador del pool i la CLI**

`generator/generate.py`:

```python
"""CLI: genera un pool de reptes i l'escriu a data/puzzles.json."""
import argparse
import json
import os
import random
from itertools import combinations

from generator.puzzles import make_puzzle

DIGITS = list(range(1, 10))  # 1..9


def build_pool(count, band=(40, 120), max_leaves=6, seed=0, start_date="2026-06-01"):
    """Construeix un pool de `count` reptes diferents dins la banda."""
    rng = random.Random(seed)
    digit_sets = list(combinations(DIGITS, 7))
    rng.shuffle(digit_sets)

    puzzles = []
    seen = set()
    for ds in digit_sets:
        digits = list(ds)
        centrals = list(range(7))
        rng.shuffle(centrals)
        for ci in centrals:
            pz = make_puzzle(digits, ci, band=band, max_leaves=max_leaves)
            if pz is None:
                continue
            key = (pz["target"], tuple(pz["digits"]), pz["centralIndex"])
            if key in seen:
                continue
            seen.add(key)
            puzzles.append(pz)
            if len(puzzles) >= count:
                return {"startDate": start_date, "puzzles": puzzles}
    return {"startDate": start_date, "puzzles": puzzles}


def main():
    parser = argparse.ArgumentParser(description="Genera el pool de reptes de Numerològic.")
    parser.add_argument("--count", type=int, default=60)
    parser.add_argument("--band", type=int, nargs=2, default=[40, 120], metavar=("LO", "HI"))
    parser.add_argument("--max-leaves", type=int, default=6)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--start-date", default="2026-06-01")
    parser.add_argument("--out", default=os.path.join("data", "puzzles.json"))
    args = parser.parse_args()

    pool = build_pool(
        count=args.count,
        band=tuple(args.band),
        max_leaves=args.max_leaves,
        seed=args.seed,
        start_date=args.start_date,
    )
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Escrits {len(pool['puzzles'])} reptes a {args.out}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Executar per verificar que passa**

Run: `python -m pytest generator/tests/test_generate_cli.py -v`
Expected: PASS

- [ ] **Step 5: Generar el pool real i comprovar-lo**

Run: `python -m generator.generate --count 60 --seed 1`
Expected: imprimeix "Escrits 60 reptes a data/puzzles.json" i crea el fitxer.

Run de verificació: `python -c "import json;d=json.load(open('data/puzzles.json',encoding='utf-8'));print(len(d['puzzles']),'reptes; exemple solucions:',len(d['puzzles'][0]['solutions']))"`
Expected: `60 reptes; exemple solucions: <N entre 40 i 120>`

- [ ] **Step 6: Commit**

```bash
git add generator/generate.py generator/tests/test_generate_cli.py data/puzzles.json
git commit -m "feat: CLI del generador i pool inicial de reptes"
```

---

## Task 6: Document del contracte de la forma canònica

Escriure el contracte que el client JS haurà de replicar exactament (paritat amb `generator/engine.py::canonical`).

**Files:**
- Create: `docs/superpowers/specs/canonical-format.md`

- [ ] **Step 1: Escriure el document**

`docs/superpowers/specs/canonical-format.md`:

```markdown
# Contracte de la forma canònica

Tant el generador Python (`generator/engine.py::canonical`) com el client JS
(`js/canonical.js`) han de produir **exactament** aquesta cadena per a cada AST.
La cadena és la clau de deduplicació de solucions; qualsevol divergència trenca
el recompte de solucions del joc.

## Nodes de l'AST
- `num(d)` → `"d"`  (ex: `3` → `"3"`)
- `sqrt(x)` → `"r(" + C(x) + ")"`
- `sub(a,b)` → `"(- " + C(a) + " " + C(b) + ")"`
- `div(a,b)` → `"(/ " + C(a) + " " + C(b) + ")"`
- `pow(a,b)` → `"(^ " + C(a) + " " + C(b) + ")"`
- `add(...)` → aplana fills `add` imbricats; ordena les seves cadenes canòniques;
  `"(+ " + parts.join(" ") + ")"`
- `mul(...)` → igual amb `"(* "`.

`C(x)` = cadena canònica del subarbre `x`.

## Ordenació
Ordre lexicogràfic per **punt de codi Unicode**. Per a les cadenes ASCII que
produïm, coincideix amb `sorted()` per defecte de Python i amb
`Array.prototype.sort()` per defecte de JS. No usar comparadors de localització.

## Exemples (casos de paritat)
| AST | Cadena canònica |
|---|---|
| `mul(mul(3,4),2)` | `(* 2 3 4)` |
| `add(add(1,2),3)` | `(+ 1 2 3)` |
| `sub(5,3)` | `(- 5 3)` |
| `div(8,4)` | `(/ 8 4)` |
| `pow(2,3)` | `(^ 2 3)` |
| `sqrt(9)` | `r(9)` |
| `mul(3,8)` ≠ `mul(4,6)` | `(* 3 8)` ≠ `(* 4 6)` |

El Pla 2 (client) inclourà tests de paritat que comparen aquestes mateixes
entrades contra la sortida del generador.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/canonical-format.md
git commit -m "docs: contracte de la forma canonica per al client"
```

---

## Self-Review (completat en escriure el pla)

- **Cobertura de la spec:**
  - §3 regles de validació → Task 1 (combine/do_sqrt/evaluate). ✓
  - §4 canonicalització → Task 2 + Task 6 (contracte). ✓
  - §5 punts/rangs/Numerogram → Task 4. ✓
  - §8.1 generador (enumeració, banda, pool JSON) → Tasks 3 i 5. ✓
  - Modes/client/PWA (§6, §8.2-8.4, §7) → **Pla 2** (fora d'abast d'aquest pla, com s'indica). ✓
- **Placeholders:** cap; tot pas amb codi té el codi complet.
- **Consistència de tipus:** `generate()` retorna entrades amb claus `value/ast/leaves/used`, usades igual a `make_puzzle`. `solution_points(leaves, uses_pow_sqrt, is_numerogram)` mateixa signatura a test i implementació. `make_puzzle` retorna claus (`target/digits/centralIndex/maxOperands/solutions/totalPoints/ranks`) consumides per `build_pool`. ✓
